begin;

set local lock_timeout = '5s';

do $$
declare
    tipo_data regtype;
    total_antes bigint;
    primeira_antes timestamp;
    ultima_antes timestamp;
begin
    select atttypid::regtype into strict tipo_data
    from pg_catalog.pg_attribute
    where attrelid = 'public.temperaturas'::regclass and attname = 'data' and not attisdropped;

    if tipo_data = 'timestamp without time zone'::regtype then
        -- O painel antigo armazenava e exibia os horários locais do Acre.
        lock table public.temperaturas in access exclusive mode;
        select count(*), min(data), max(data) into total_antes, primeira_antes, ultima_antes
        from public.temperaturas;

        alter table public.temperaturas alter column data type timestamptz
            using data at time zone 'America/Rio_Branco';

        if not exists (
            select 1 from public.temperaturas
            having count(*) = total_antes
               and min(data at time zone 'America/Rio_Branco') is not distinct from primeira_antes
               and max(data at time zone 'America/Rio_Branco') is not distinct from ultima_antes
        ) then
            raise exception 'A conversão alterou a contagem ou o intervalo horário do histórico.';
        end if;
    elsif tipo_data <> 'timestamp with time zone'::regtype then
        raise exception 'Tipo de data inesperado em public.temperaturas: %.', tipo_data;
    end if;
end;
$$;

alter table public.temperaturas alter column data set default now();

do $$
declare
    regra record;
begin
    for regra in select * from (values
        ('caixas_volume_positivo', 'volume_litros > 0'),
        ('caixas_hemocomponentes_nao_negativos', 'quantidade_hemocomponentes >= 0'),
        ('caixas_gelox_nao_negativo', 'peso_gelo_kg >= 0'),
        ('caixas_faixa_valida', 'temperatura_min < temperatura_max')
    ) as regras(nome, expressao)
    loop
        if not exists (
            select 1 from pg_catalog.pg_constraint
            where conrelid = 'public.caixas'::regclass and conname = regra.nome
        ) then
            execute format('alter table public.caixas add constraint %I check (%s)', regra.nome, regra.expressao);
        end if;
    end loop;
end;
$$;

create index if not exists portal_temperaturas_data_id_idx on public.temperaturas (data, id);
create index if not exists portal_temperaturas_caixa_data_id_idx on public.temperaturas (caixa_id, data, id);

commit;
