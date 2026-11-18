begin;

create or replace function public.portal_entrar_com_perfil(p_usuario text, p_senha text)
returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
    token text := public.portal_entrar(p_usuario, p_senha);
    resultado jsonb;
begin
    if token is null then
        return null;
    end if;

    select jsonb_build_object('token', token, 'perfil', perfil) into resultado
    from public.portal_usuarios
    where ativo and sessao_hash = extensions.digest(token, 'sha256');
    return resultado;
end;
$$;

-- O hash pode encerrar a sessão exata, mas só o token original autentica consultas.
create or replace function public.portal_revogar_sessao(p_hash text)
returns void
language sql security definer
set search_path = ''
as $$
    update public.portal_usuarios
    set sessao_hash = null, sessao_expira_em = null
    where sessao_hash = case when p_hash ~ '^[0-9a-f]{64}$' then decode(p_hash, 'hex') end;
$$;

revoke all on function public.portal_entrar_com_perfil(text, text), public.portal_revogar_sessao(text) from public;
grant execute on function public.portal_entrar_com_perfil(text, text), public.portal_revogar_sessao(text) to anon, authenticated;

commit;
