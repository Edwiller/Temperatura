-- Execute somente no Temperatura-DEV. A carga não usa caixas nem sensores operacionais.
begin;

do $$
declare
    letra text;
    codigo_caixa text;
    nome_caixa text;
    codigo_sensor text;
    nome_sensor text;
    caixa public.caixas%rowtype;
    sensor public.sensores%rowtype;
    dia date := (statement_timestamp() at time zone 'America/Rio_Branco')::date - 1;
    inicio_dia timestamptz := dia::timestamp at time zone 'America/Rio_Branco';
begin
    perform pg_advisory_xact_lock(hashtext('temperatura-dev-leituras-demonstracao'));

    foreach letra in array array['A', 'B'] loop
        codigo_caixa := 'CX-DEMO-' || letra;
        nome_caixa := 'Caixa demonstrativa ' || letra || ' (simulação)';
        codigo_sensor := 'ESP-DEMO-' || letra;
        nome_sensor := 'Sensor simulado ' || letra;

        select * into caixa from public.caixas c where c.codigo = codigo_caixa;
        if not found then
            insert into public.caixas (
                codigo, nome, volume_litros, comprimento_cm, largura_cm, altura_cm,
                quantidade_hemocomponentes, peso_gelo_kg, temperatura_min, temperatura_max
            ) values (codigo_caixa, nome_caixa, 30, 40, 30, 25, 0, 2.25, 2, 8)
            returning * into caixa;
        elsif caixa.nome is distinct from nome_caixa then
            raise exception 'O código % já pertence a outra caixa.', codigo_caixa;
        end if;

        select * into sensor from public.sensores s where s.codigo = codigo_sensor;
        if not found then
            insert into public.sensores (codigo, nome, ativo, caixa_id)
            values (codigo_sensor, nome_sensor, false, caixa.id)
            returning * into sensor;
        elsif sensor.nome is distinct from nome_sensor
            or sensor.caixa_id is distinct from caixa.id or sensor.ativo is distinct from false then
            raise exception 'O código % já pertence a outro sensor.', codigo_sensor;
        end if;

        insert into public.temperaturas (caixa_id, sensor_id, data, valor)
        select caixa.id, sensor.id, ponto.instante,
            round((case letra
                when 'A' then 5.2 + 0.65 * sin(i / 8.0) + 0.28 * cos(i / 3.9)
                    + 3.0 * exp(-power((i - 73) / 6.5, 2))
                    - 3.4 * exp(-power((i - 28) / 5.5, 2))
                else 5.8 + 0.55 * sin(i / 11.0 + 0.9) + 0.24 * cos(i / 4.5)
                    + 2.8 * exp(-power((i - 38) / 7.0, 2))
                    - 2.3 * exp(-power((i - 95) / 8.0, 2))
            end)::numeric, 2)
        from generate_series(1, 1439) as minutos(minuto)
        cross join lateral (
            select inicio_dia + minuto * interval '1 minute' as instante,
                   (minuto - 1) * 119.0 / 1438 as i
        ) ponto
        where not exists (
            select 1 from public.temperaturas t
            where t.caixa_id = caixa.id and t.sensor_id = sensor.id and t.data = ponto.instante
        );
    end loop;
end;
$$;

commit;

select c.id as caixa_id, c.codigo,
       (min(t.data) at time zone 'America/Rio_Branco')::date as dia,
       to_char(min(t.data) at time zone 'America/Rio_Branco', 'HH24:MI') as primeira,
       to_char(max(t.data) at time zone 'America/Rio_Branco', 'HH24:MI') as ultima,
       count(distinct date_trunc('minute', t.data)) as minutos_cobertos,
       count(*) as leituras
from public.temperaturas t
join public.caixas c on c.id = t.caixa_id
join public.sensores s on s.id = t.sensor_id and s.caixa_id = c.id
where (c.codigo, s.codigo) in (('CX-DEMO-A', 'ESP-DEMO-A'), ('CX-DEMO-B', 'ESP-DEMO-B'))
  and (t.data at time zone 'America/Rio_Branco')::date =
      (statement_timestamp() at time zone 'America/Rio_Branco')::date - 1
group by c.id, c.codigo
order by c.codigo;
