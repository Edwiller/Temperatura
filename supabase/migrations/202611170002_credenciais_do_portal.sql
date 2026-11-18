begin;

create extension if not exists pgcrypto with schema extensions;

alter table public.portal_usuarios
    add column if not exists usuario text,
    add column if not exists senha_hash text,
    add column if not exists sessao_hash bytea,
    add column if not exists sessao_expira_em timestamptz,
    add column if not exists tentativas_login smallint not null default 0,
    add column if not exists bloqueado_ate timestamptz,
    alter column usuario_id set default gen_random_uuid(),
    alter column ativo set default false;

-- Preserva os nomes, os vínculos e os hashes bcrypt válidos da versão anterior.
update public.portal_usuarios p
set usuario = coalesce(
        regexp_replace(nullif(lower(u.email), ''), '@temperatura\.invalid$', ''),
        p.usuario_id::text
    ),
    senha_hash = case when u.encrypted_password ~ '^\$2[aby]\$[0-9]{2}\$[./A-Za-z0-9]{53}$'
        then u.encrypted_password end,
    ativo = p.ativo and coalesce(u.encrypted_password ~ '^\$2[aby]\$[0-9]{2}\$[./A-Za-z0-9]{53}$', false)
from auth.users u
where p.usuario_id = u.id and p.usuario is null;

update public.portal_usuarios
set usuario = usuario_id::text, ativo = false
where usuario is null;

alter table public.portal_usuarios
    alter column usuario set not null,
    drop constraint if exists portal_usuarios_usuario_id_fkey;

create unique index if not exists portal_usuarios_usuario_idx on public.portal_usuarios (usuario);
create unique index if not exists portal_usuarios_sessao_idx
    on public.portal_usuarios (sessao_hash) where sessao_hash is not null;
create index if not exists portal_usuarios_pendentes_idx
    on public.portal_usuarios (criado_em) where not ativo;

-- O navegador acessa apenas as funções públicas, sem acesso direto à tabela de credenciais.
drop policy if exists portal_consultar_proprio_credenciamento on public.portal_usuarios;
revoke all on public.portal_usuarios from public, anon, authenticated;

create or replace function temperatura_privado.hash_da_sessao()
returns bytea
language sql stable
set search_path = ''
as $$
    select case when token ~ '^[0-9a-f]{64}$' then extensions.digest(token, 'sha256') end
    from (select nullif(current_setting('request.headers', true), '')::jsonb ->> 'x-portal-session' as token) h;
$$;

create or replace function temperatura_privado.id_credenciado()
returns uuid
language sql stable security definer
set search_path = ''
as $$
    select usuario_id from public.portal_usuarios
    where sessao_hash = temperatura_privado.hash_da_sessao()
      and ativo and sessao_expira_em > statement_timestamp();
$$;

create or replace function temperatura_privado.usuario_credenciado()
returns boolean
language sql stable security definer
set search_path = ''
as $$
    select temperatura_privado.id_credenciado() is not null;
$$;

create or replace function temperatura_privado.invalidar_sessao()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
    if new.ativo is distinct from old.ativo or new.senha_hash is distinct from old.senha_hash then
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
    before update of ativo, senha_hash on public.portal_usuarios
    for each row execute function temperatura_privado.invalidar_sessao();

revoke all on function temperatura_privado.hash_da_sessao(),
    temperatura_privado.id_credenciado(), temperatura_privado.invalidar_sessao()
    from public, anon, authenticated;

create or replace function public.portal_cadastrar_usuario(p_usuario text, p_nome text, p_senha text)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
    login text := lower(btrim(p_usuario));
    nome_exibicao text := btrim(p_nome);
begin
    if login is null or login !~ '^[a-z0-9][a-z0-9_.-]{2,49}$'
       or coalesce(char_length(nome_exibicao), 0) not between 1 and 100
       or coalesce(char_length(p_senha), 0) < 8 or octet_length(p_senha) > 72 then
        raise invalid_parameter_value using message = 'Confira o nome, o usuário e a senha.';
    end if;

    perform pg_advisory_xact_lock(hashtext('temperatura-portal-cadastro'));
    if exists (select 1 from public.portal_usuarios where usuario = login) then
        return;
    end if;

    if (select count(*) from public.portal_usuarios
        where not ativo and criado_em > statement_timestamp() - interval '1 hour') >= 30 then
        raise sqlstate 'PT429' using message = 'Muitas solicitações de cadastro. Tente novamente mais tarde.';
    end if;

    insert into public.portal_usuarios (usuario, nome, senha_hash, ativo)
    values (login, nome_exibicao, extensions.crypt(p_senha, extensions.gen_salt('bf', 10)), false);
end;
$$;

create or replace function public.portal_entrar(p_usuario text, p_senha text)
returns text
language plpgsql security definer
set search_path = ''
as $$
declare
    conta public.portal_usuarios%rowtype;
    token text;
    falhas integer;
    agora timestamptz := statement_timestamp();
begin
    if coalesce(octet_length(p_usuario), 0) not between 1 and 254
       or coalesce(octet_length(p_senha), 0) not between 1 and 72 then
        return null;
    end if;

    select * into conta from public.portal_usuarios
    where usuario = lower(btrim(p_usuario)) and ativo and senha_hash is not null
    for update;
    if not found or conta.bloqueado_ate > agora then
        return null;
    end if;

    if extensions.crypt(p_senha, conta.senha_hash) is distinct from conta.senha_hash then
        falhas := case when conta.bloqueado_ate is not null then 1 else conta.tentativas_login + 1 end;
        update public.portal_usuarios
        set tentativas_login = falhas,
            bloqueado_ate = case when falhas >= 5 then agora + interval '15 minutes' end
        where usuario_id = conta.usuario_id;
        return null;
    end if;

    token := encode(extensions.gen_random_bytes(32), 'hex');
    update public.portal_usuarios
    set sessao_hash = extensions.digest(token, 'sha256'),
        sessao_expira_em = agora + interval '8 hours',
        tentativas_login = 0,
        bloqueado_ate = null
    where usuario_id = conta.usuario_id;
    return token;
end;
$$;

create or replace function public.portal_sessao()
returns boolean
language sql stable security definer
set search_path = ''
as $$
    select temperatura_privado.usuario_credenciado();
$$;

create or replace function public.portal_sair()
returns void
language sql security definer
set search_path = ''
as $$
    update public.portal_usuarios
    set sessao_hash = null, sessao_expira_em = null
    where sessao_hash = temperatura_privado.hash_da_sessao();
$$;

revoke all on function public.portal_cadastrar_usuario(text, text, text), public.portal_entrar(text, text),
    public.portal_sessao(), public.portal_sair() from public;
grant execute on function public.portal_cadastrar_usuario(text, text, text), public.portal_entrar(text, text),
    public.portal_sessao(), public.portal_sair() to anon, authenticated;

grant usage on schema temperatura_privado to anon;
grant execute on function temperatura_privado.usuario_credenciado() to anon;

-- Os dados do portal só ficam visíveis a quem apresenta uma sessão ativa.
grant select on public.caixas to anon;
grant select (id, codigo, nome, ativo, caixa_id) on public.sensores to anon;
grant select (id, valor, data, caixa_id, sensor_id) on public.temperaturas to anon;

do $$
declare
    tabela text;
begin
    foreach tabela in array array['caixas', 'sensores', 'temperaturas'] loop
        execute format('alter policy portal_leitura on public.%I to anon, authenticated', tabela);
    end loop;
end;
$$;

grant execute on function public.cadastrar_caixa_com_sensor(jsonb, bigint, text) to anon;

commit;
