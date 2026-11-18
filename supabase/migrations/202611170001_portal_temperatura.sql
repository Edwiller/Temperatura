begin;

create table if not exists public.portal_usuarios (
    usuario_id uuid primary key references auth.users(id) on delete cascade,
    nome text not null check (btrim(nome) <> ''),
    ativo boolean not null default true,
    criado_em timestamptz not null default now()
);

alter table public.portal_usuarios enable row level security;
revoke all privileges on table public.portal_usuarios from public, anon, authenticated;
grant select on table public.portal_usuarios to authenticated;

drop policy if exists portal_consultar_proprio_credenciamento on public.portal_usuarios;
create policy portal_consultar_proprio_credenciamento on public.portal_usuarios
    for select to authenticated
    using (
        usuario_id = (select auth.uid())
        and ativo
        and coalesce((select auth.jwt()) -> 'is_anonymous', 'false'::jsonb) = 'false'::jsonb
    );

create schema if not exists temperatura_privado;
revoke all on schema temperatura_privado from public, anon, authenticated;
grant usage on schema temperatura_privado to authenticated;

create or replace function temperatura_privado.usuario_credenciado()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
    select coalesce(auth.jwt() -> 'is_anonymous', 'false'::jsonb) = 'false'::jsonb
       and exists (
           select 1 from public.portal_usuarios
           where usuario_id = auth.uid() and ativo
       );
$$;

revoke all on function temperatura_privado.usuario_credenciado() from public, anon;
grant execute on function temperatura_privado.usuario_credenciado() to authenticated;

alter table public.caixas enable row level security;
alter table public.sensores enable row level security;
alter table public.temperaturas enable row level security;

revoke all privileges on table public.caixas, public.sensores, public.temperaturas
    from public, anon, authenticated;
grant select on table public.caixas to authenticated;
grant select (id, codigo, nome, ativo, caixa_id) on public.sensores to authenticated;
grant select (id, valor, data, caixa_id, sensor_id) on public.temperaturas to authenticated;

-- O papel service_role continua atendendo à ingestão do ESP pelo backend.
do $$
declare
    tabela text;
begin
    foreach tabela in array array['caixas', 'sensores', 'temperaturas'] loop
        execute format('drop policy if exists portal_exige_acesso on public.%I', tabela);
        execute format('drop policy if exists portal_leitura on public.%I', tabela);
        execute format(
            'create policy portal_exige_acesso on public.%I as restrictive to public
             using ((select temperatura_privado.usuario_credenciado()))
             with check ((select temperatura_privado.usuario_credenciado()))',
            tabela
        );
        execute format(
            'create policy portal_leitura on public.%I for select to authenticated using (true)',
            tabela
        );
    end loop;
end;
$$;

create or replace function public.cadastrar_caixa_com_sensor(
    dados_caixa jsonb,
    sensor_existente bigint,
    codigo_novo_sensor text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
    caixa public.caixas%rowtype;
    caixa_criada public.caixas%rowtype;
    dispositivo public.sensores%rowtype;
    novo_codigo text := nullif(btrim(codigo_novo_sensor), '');
begin
    if not temperatura_privado.usuario_credenciado() then
        raise insufficient_privilege using message = 'Seu usuário ainda não tem acesso ao portal.';
    end if;

    caixa := jsonb_populate_record(null::public.caixas, dados_caixa);
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

    if (sensor_existente is null) = (novo_codigo is null) then
        raise exception 'Selecione um sensor disponível ou informe o código de um novo ESP.';
    end if;

    perform pg_advisory_xact_lock(hashtext('temperatura-caixas'), hashtext(caixa.codigo));
    if exists (select 1 from public.caixas where codigo = caixa.codigo) then
        raise unique_violation using message = 'Código da caixa já cadastrado.';
    end if;

    if sensor_existente is not null then
        select * into dispositivo from public.sensores
        where id = sensor_existente and ativo is true and caixa_id is null
        for update;
        if not found then
            raise exception 'O sensor escolhido não está mais disponível. Recarregue a página.';
        end if;
    else
        if novo_codigo !~ '^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$' then
            raise exception 'Informe um código de ESP válido.';
        end if;
        perform pg_advisory_xact_lock(hashtext('temperatura-sensores'), hashtext(novo_codigo));
        if exists (select 1 from public.sensores where codigo = novo_codigo) then
            raise unique_violation using message = 'Código do ESP já cadastrado.';
        end if;
    end if;

    insert into public.caixas (
        codigo, nome, volume_litros, comprimento_cm, largura_cm, altura_cm,
        quantidade_hemocomponentes, peso_gelo_kg, temperatura_min, temperatura_max
    ) values (
        caixa.codigo, caixa.nome, caixa.volume_litros, caixa.comprimento_cm, caixa.largura_cm,
        caixa.altura_cm, caixa.quantidade_hemocomponentes, caixa.peso_gelo_kg,
        caixa.temperatura_min, caixa.temperatura_max
    ) returning * into caixa_criada;

    if sensor_existente is not null then
        update public.sensores set caixa_id = caixa_criada.id where id = dispositivo.id;
    else
        insert into public.sensores (codigo, nome, ativo, caixa_id)
        values (novo_codigo, novo_codigo, true, caixa_criada.id);
    end if;

    return jsonb_build_object('id', caixa_criada.id, 'codigo', caixa_criada.codigo);
end;
$$;

revoke all on function public.cadastrar_caixa_com_sensor(jsonb, bigint, text) from public, anon;
grant execute on function public.cadastrar_caixa_com_sensor(jsonb, bigint, text) to authenticated;

commit;
