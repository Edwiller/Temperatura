import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export const CHAVE_SESSAO_PORTAL = "temperatura.portal.sessao";

const configuracaoLocal = {
    url: "https://shmqizeqhqvxnllqztdf.supabase.co",
    chave: "sb_publishable_NYYJ90k-cZcD7FJaZH9l9g_934T0-kw"
};

async function carregarConfiguracao() {
    try {
        const resposta = await fetch(new URL("../../../api/portal-config", import.meta.url));
        if (resposta.ok) return await resposta.json();
        if (resposta.status === 404 && ["localhost", "127.0.0.1", "[::1]"].includes(location.hostname)) {
            return configuracaoLocal;
        }
    } catch {
        // A interface exibe o erro de configuração quando a API está indisponível.
    }
    return null;
}

const config = await carregarConfiguracao();
export const supabase = config && createClient(config.url, config.chave, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
    },
    global: {
        fetch: (input, init) => {
            const token = sessionStorage.getItem(CHAVE_SESSAO_PORTAL);
            const url = input instanceof Request ? input.url : String(input);
            if (!token || !url.startsWith(`${config.url}/rest/v1/`)) return fetch(input, init);

            const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined));
            headers.set("x-portal-session", token);
            return fetch(input, { ...init, headers });
        }
    }
});
