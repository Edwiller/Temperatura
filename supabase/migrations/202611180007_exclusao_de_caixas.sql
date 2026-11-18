begin;

create table public.caixas_historico (
    id bigint primary key,
    codigo text not null,
    nome text not null
);

alter table public.caixas_historico enable row level security;
revoke all on table public.caixas_historico from public, anon, authenticated;
grant select on table public.caixas_historico to anon, authenticated;
create policy portal_leitura_historico on public.caixas_historico for select to anon, authenticated
    using ((select temperatura_privado.usuario_credenciado()));

alter table public.temperaturas add column caixa_id_historico bigint;
alter table public.temperaturas add constraint temperaturas_caixa_historico_fk
    foreign key (caixa_id_historico) references public.caixas_historico(id) not valid;
grant select (caixa_id_historico) on public.temperaturas to anon, authenticated;

create function temperatura_privado.remover_caixa(p_caixa bigint)
returns void language plpgsql set search_path = '' as $$
declare
    caixa public.caixas%rowtype;
begin
    select * into caixa from public.caixas where id = p_caixa for no key update;
    if not found then return; end if;

    -- A ingestão usa a mesma trava do sensor e termina antes de migrarmos as leituras.
    update public.sensores set caixa_id = null where caixa_id = p_caixa;

    if exists (select 1 from public.temperaturas where caixa_id = p_caixa) then
        insert into public.caixas_historico (id, codigo, nome) values (caixa.id, caixa.codigo, caixa.nome);
        update public.temperaturas set caixa_id_historico = p_caixa, caixa_id = null where caixa_id = p_caixa;
    end if;

    delete from public.caixas where id = p_caixa;
end;
$$;

revoke all on function temperatura_privado.remover_caixa(bigint) from public, anon, authenticated;

create or replace function public.excluir_caixa(p_caixa bigint)
returns void language plpgsql security definer set search_path = '' as $$
begin
    if not temperatura_privado.usuario_credenciado() then
        raise insufficient_privilege using message = 'Seu usuário ainda não tem acesso ao portal.';
    end if;
    perform temperatura_privado.remover_caixa(p_caixa);
end;
$$;

commit;
