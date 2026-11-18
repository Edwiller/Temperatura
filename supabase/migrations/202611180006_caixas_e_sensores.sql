begin;

alter table public.caixas add column if not exists excluida_em timestamptz;
alter table public.sensores alter column caixa_id drop not null;
alter table public.temperaturas alter column caixa_id drop not null;

-- Se houver duplicidades antigas, a migração deve parar sem escolher qual sensor desvincular.
create unique index if not exists portal_um_sensor_por_caixa_idx
    on public.sensores (caixa_id) where caixa_id is not null;

create or replace function public.editar_caixa(p_caixa bigint, dados_caixa jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare
    caixa public.caixas%rowtype := jsonb_populate_record(null::public.caixas, dados_caixa);
begin
    if not temperatura_privado.usuario_credenciado() then
        raise insufficient_privilege using message = 'Seu usuário ainda não tem acesso ao portal.';
    end if;

    caixa.codigo := nullif(btrim(caixa.codigo), '');
    caixa.nome := nullif(btrim(caixa.nome), '');
    if caixa.codigo is null or caixa.nome is null
       or caixa.volume_litros is null or caixa.volume_litros <= 0
       or caixa.quantidade_hemocomponentes is null or caixa.quantidade_hemocomponentes < 0
       or caixa.peso_gelo_kg is null or caixa.peso_gelo_kg < 0
       or caixa.temperatura_min is null or caixa.temperatura_max is null
       or caixa.temperatura_min >= caixa.temperatura_max
       or caixa.comprimento_cm < 0 or caixa.largura_cm < 0 or caixa.altura_cm < 0 then
        raise exception 'Confira os dados e os limites de temperatura da caixa.';
    end if;

    perform pg_advisory_xact_lock(hashtext('temperatura-caixas'), hashtext(caixa.codigo));
    if exists (select 1 from public.caixas where codigo = caixa.codigo and id <> p_caixa) then
        raise unique_violation using message = 'Código da caixa já cadastrado.';
    end if;

    update public.caixas set codigo = caixa.codigo, nome = caixa.nome,
        volume_litros = caixa.volume_litros, comprimento_cm = caixa.comprimento_cm,
        largura_cm = caixa.largura_cm, altura_cm = caixa.altura_cm,
        quantidade_hemocomponentes = caixa.quantidade_hemocomponentes,
        peso_gelo_kg = caixa.peso_gelo_kg, temperatura_min = caixa.temperatura_min,
        temperatura_max = caixa.temperatura_max
    where id = p_caixa and excluida_em is null;
    if not found then raise exception 'Caixa indisponível.'; end if;
end;
$$;

create or replace function public.excluir_caixa(p_caixa bigint)
returns void language plpgsql security definer set search_path = '' as $$
begin
    if not temperatura_privado.usuario_credenciado() then
        raise insufficient_privilege using message = 'Seu usuário ainda não tem acesso ao portal.';
    end if;

    update public.caixas set excluida_em = now() where id = p_caixa and excluida_em is null;
    if found then
        update public.sensores set caixa_id = null where caixa_id = p_caixa;
    end if;
end;
$$;

create or replace function public.alterar_vinculo_sensor(p_sensor bigint, p_caixa bigint, p_caixa_anterior bigint)
returns void language plpgsql security definer set search_path = '' as $$
begin
    if not temperatura_privado.usuario_credenciado() then
        raise insufficient_privilege using message = 'Seu usuário ainda não tem acesso ao portal.';
    end if;

    if p_caixa is not null then
        perform 1 from public.caixas where id = p_caixa and excluida_em is null for no key update;
        if not found then raise exception 'A caixa escolhida está indisponível.'; end if;
        if exists (select 1 from public.sensores where caixa_id = p_caixa) then
            raise exception 'A caixa escolhida já tem um sensor.';
        end if;
    end if;

    update public.sensores set caixa_id = p_caixa
    where id = p_sensor and caixa_id is not distinct from p_caixa_anterior
      and (p_caixa is null or (p_caixa_anterior is null and ativo is true));
    if not found then raise exception 'O vínculo do sensor mudou. Atualize a lista.'; end if;
end;
$$;

-- Trava o sensor até gravar a leitura, para o vínculo usado ser o vigente no momento do envio.
create or replace function public.registrar_leitura_sensor(p_codigo text, p_valor numeric)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
    sensor public.sensores%rowtype;
    leitura public.temperaturas%rowtype;
begin
    if p_valor is null or not (p_valor between -100 and 150) then
        raise exception 'Temperatura fora do intervalo aceito pela API.';
    end if;

    select * into sensor from public.sensores where codigo = p_codigo for update;
    if not found then return jsonb_build_object('status', 'desconhecido'); end if;
    if sensor.ativo is distinct from true then return jsonb_build_object('status', 'inativo'); end if;

    insert into public.temperaturas (valor, caixa_id, sensor_id)
    values (p_valor, sensor.caixa_id, sensor.id) returning * into leitura;

    return jsonb_build_object('status', 'gravado',
        'temperatura', jsonb_build_object('id', leitura.id, 'valor', leitura.valor, 'data', leitura.data),
        'sensor', jsonb_build_object('id', sensor.id, 'codigo', sensor.codigo),
        'caixa', case when sensor.caixa_id is not null then jsonb_build_object('id', sensor.caixa_id) end);
end;
$$;

revoke all on function public.editar_caixa(bigint, jsonb), public.excluir_caixa(bigint),
    public.alterar_vinculo_sensor(bigint, bigint, bigint) from public;
grant execute on function public.editar_caixa(bigint, jsonb), public.excluir_caixa(bigint),
    public.alterar_vinculo_sensor(bigint, bigint, bigint) to anon, authenticated;

revoke all on function public.registrar_leitura_sensor(text, numeric) from public, anon, authenticated;
grant execute on function public.registrar_leitura_sensor(text, numeric) to service_role;

commit;
