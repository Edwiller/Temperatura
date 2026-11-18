begin;

alter table public.portal_usuarios
    add column if not exists perfil text not null default 'operador'
        check (perfil in ('admin', 'operador')),
    add column if not exists aprovado_em timestamptz,
    add column if not exists aprovado_por uuid references public.portal_usuarios(usuario_id)
        on delete set null;

create or replace function temperatura_privado.invalidar_sessao()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
    if new.ativo is distinct from old.ativo or new.senha_hash is distinct from old.senha_hash
       or new.perfil is distinct from old.perfil then
        new.sessao_hash := null;
        new.sessao_expira_em := null;
        new.tentativas_login := 0;
        new.bloqueado_ate := null;
    end if;
    return new;
end;
$$;

drop trigger if exists portal_invalidar_sessao on public.portal_usuarios;
create trigger portal_invalidar_sessao
    before update of ativo, senha_hash, perfil on public.portal_usuarios
    for each row execute function temperatura_privado.invalidar_sessao();

create or replace function public.portal_perfil_sessao()
returns text
language sql stable security definer
set search_path = ''
as $$
    select perfil from public.portal_usuarios
    where usuario_id = temperatura_privado.id_credenciado();
$$;

create or replace function temperatura_privado.exigir_administrador()
returns uuid
language plpgsql stable security definer
set search_path = ''
as $$
declare
    autor uuid := temperatura_privado.id_credenciado();
begin
    if not exists (select 1 from public.portal_usuarios where usuario_id = autor and perfil = 'admin') then
        raise insufficient_privilege using message = 'Acesso restrito a administradores.';
    end if;
    return autor;
end;
$$;

create or replace function public.portal_listar_cadastros_pendentes(p_limite integer default 30, p_inicio integer default 0)
returns table (usuario_id uuid, nome text, usuario text, criado_em timestamptz)
language plpgsql stable security definer
set search_path = ''
as $$
begin
    perform temperatura_privado.exigir_administrador();
    return query
        select p.usuario_id, p.nome, p.usuario, p.criado_em
        from public.portal_usuarios p
        where not p.ativo and p.perfil = 'operador' and p.senha_hash is not null
          and p.aprovado_em is null
        order by p.criado_em, p.usuario_id
        limit greatest(1, least(coalesce(p_limite, 30), 100))
        offset greatest(0, coalesce(p_inicio, 0));
end;
$$;

create or replace function public.portal_aprovar_cadastro(p_usuario_id uuid)
returns boolean
language plpgsql security definer
set search_path = ''
as $$
declare
    autor uuid := temperatura_privado.exigir_administrador();
begin
    update public.portal_usuarios
    set ativo = true, aprovado_em = statement_timestamp(), aprovado_por = autor
    where usuario_id = p_usuario_id and not ativo and perfil = 'operador'
      and senha_hash is not null and aprovado_em is null;
    return found;
end;
$$;

revoke all on function temperatura_privado.exigir_administrador() from public, anon, authenticated;
revoke all on function public.portal_perfil_sessao(), public.portal_listar_cadastros_pendentes(integer, integer),
    public.portal_aprovar_cadastro(uuid) from public;
grant execute on function public.portal_perfil_sessao(), public.portal_listar_cadastros_pendentes(integer, integer),
    public.portal_aprovar_cadastro(uuid) to anon, authenticated;

commit;
