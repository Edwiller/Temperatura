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
    throw new Error("A configuração do portal está indisponível.");
}

let configuracao;

export function obterConfiguracaoSupabase() {
    configuracao ??= carregarConfiguracao().catch(erro => {
        configuracao = undefined;
        throw erro;
    });
    return configuracao;
}

function carregarBiblioteca() {
    if (globalThis.supabase?.createClient) return Promise.resolve(globalThis.supabase);

    return new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = new URL("../vendor/supabase-2.119.1.js", import.meta.url);
        function falhar() {
            script.remove();
            reject(new Error("Não foi possível carregar a conexão com o portal. Recarregue a página."));
        }
        script.addEventListener("load", () => {
            if (globalThis.supabase?.createClient) resolve(globalThis.supabase);
            else falhar();
        }, { once: true });
        script.addEventListener("error", falhar, { once: true });
        document.head.append(script);
    });
}

async function criarCliente() {
    const [config, { createClient }] = await Promise.all([
        obterConfiguracaoSupabase(),
        carregarBiblioteca()
    ]);

    return createClient(config.url, config.chave, {
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
}

let cliente;

export function obterSupabase() {
    cliente ??= criarCliente().catch(erro => {
        cliente = undefined;
        throw erro;
    });
    return cliente;
}
