import { obterConfiguracaoSupabase } from "./supabase.js?v=fluxo-sessao-1";

const prefixoRevogacao = "temperatura.portal.saida.";
let revogando;

async function chamarRpc(nome, parametros, keepalive = false) {
    const { url, chave } = await obterConfiguracaoSupabase();
    const resposta = await fetch(`${url}/rest/v1/rpc/${nome}`, {
        method: "POST",
        headers: { apikey: chave, "Content-Type": "application/json" },
        body: JSON.stringify(parametros),
        keepalive
    });

    if (!resposta.ok) {
        const detalhes = await resposta.json().catch(() => ({}));
        const erro = new Error("Não foi possível comunicar com o portal.");
        erro.code = detalhes?.code;
        throw erro;
    }

    const conteudo = await resposta.text();
    return conteudo ? JSON.parse(conteudo) : null;
}

export async function entrarNoPortal(usuario, senha) {
    const credenciais = { p_usuario: usuario, p_senha: senha };
    try {
        return await chamarRpc("portal_entrar_com_perfil", credenciais);
    } catch (erro) {
        if (erro.code !== "PGRST202") throw erro;
        const token = await chamarRpc("portal_entrar", credenciais);
        return token ? { token } : null;
    }
}

function lerRevogacoes() {
    return Array.from({ length: localStorage.length }, (_, indice) => localStorage.key(indice))
        .filter(chave => chave?.startsWith(prefixoRevogacao))
        .map(chave => chave.slice(prefixoRevogacao.length))
        .filter(hash => /^[0-9a-f]{64}$/.test(hash));
}

export async function prepararRevogacao(token) {
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
    const hash = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
    localStorage.setItem(prefixoRevogacao + hash, "1");
}

export function revogarSessoesPendentes() {
    let pendentes;
    try {
        pendentes = lerRevogacoes();
    } catch {
        return;
    }
    if (!pendentes.length) return;

    revogando ??= Promise.allSettled(pendentes.map(async hash => {
        await chamarRpc("portal_revogar_sessao", { p_hash: hash }, true);
        localStorage.removeItem(prefixoRevogacao + hash);
    })).finally(() => {
        revogando = undefined;
    });
    return revogando;
}
