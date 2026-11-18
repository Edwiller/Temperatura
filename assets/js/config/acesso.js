import { CHAVE_SESSAO_PORTAL, obterSupabase } from "./supabase.js?v=desempenho-1";
import { configurarTemaPortal } from "../components/temaPortal.js";

const raiz = new URL("../../../", import.meta.url);
const paginas = new Set(["", "index.html", "caixas.html", "cadastro.html", "dashboard.html", "administrador.html"]);
const chavePerfil = "temperatura.portal.perfil";
const intervaloDaSessao = 2 * 60 * 1000;

export function registrarSessao(token) {
    sessionStorage.removeItem(chavePerfil);
    sessionStorage.setItem(CHAVE_SESSAO_PORTAL, token);
}

function limparSessao() {
    sessionStorage.removeItem(chavePerfil);
    sessionStorage.removeItem(CHAVE_SESSAO_PORTAL);
}

function lerPerfilDaSessao(token) {
    try {
        const cache = JSON.parse(sessionStorage.getItem(chavePerfil));
        return cache?.token === token && ["admin", "operador"].includes(cache?.perfil)
            && Number.isFinite(cache?.validadoEm) ? cache : null;
    } catch {
        return null;
    }
}

async function consultarPerfilDaSessao(token) {
    const supabase = await obterSupabase();
    const { data: perfil, error } = await supabase.rpc("portal_perfil_sessao");
    if (error) throw error;
    if (sessionStorage.getItem(CHAVE_SESSAO_PORTAL) !== token
        || !["admin", "operador"].includes(perfil)) return null;

    const sessao = { token, perfil, validadoEm: Date.now() };
    sessionStorage.setItem(chavePerfil, JSON.stringify(sessao));
    return sessao;
}

export function destinoAposLogin() {
    const voltar = new URLSearchParams(location.search).get("voltar");
    if (!voltar?.startsWith("/") || voltar.startsWith("//")) return "./index.html";

    const destino = new URL(voltar, location.origin);
    return destino.origin === location.origin
        && destino.pathname.startsWith(raiz.pathname)
        && paginas.has(destino.pathname.slice(raiz.pathname.length))
        ? destino.href
        : "./index.html";
}

function abrirLogin() {
    const login = new URL("./login.html", location.href);
    login.searchParams.set("voltar", location.pathname + location.search);
    location.replace(login);
}

export async function protegerPagina(secao) {
    const conteudo = document.querySelector("[data-portal-content]");
    const cabecalho = document.querySelector("[data-portal-header]");
    const status = document.querySelector("[data-portal-status]");

    try {
        const token = sessionStorage.getItem(CHAVE_SESSAO_PORTAL);
        if (!token) {
            abrirLogin();
            return false;
        }

        let sessao = lerPerfilDaSessao(token) ?? await consultarPerfilDaSessao(token);
        if (!sessao) {
            limparSessao();
            abrirLogin();
            return false;
        }
        const { perfil } = sessao;

        cabecalho.className = "portal-topo";
        cabecalho.innerHTML = `
            <div class="portal-barra">
                <a class="portal-marca" href="./index.html">
                    <span class="portal-simbolo" aria-hidden="true">T</span>
                    <span><strong>Monitoramento Térmico</strong><small>Hemoacre</small></span>
                </a>
                <nav class="portal-links" aria-label="Navegação principal">
                    <a href="./index.html" data-secao="geral">Visão geral</a>
                    <a href="./caixas.html" data-secao="caixas">Caixas</a>
                    ${perfil === "admin" ? '<a href="./administrador.html" data-secao="admin">Administração</a>' : ""}
                </nav>
                <div class="portal-acoes">
                    <button type="button" class="portal-tema" data-portal-theme>Tema escuro</button>
                    <button type="button" class="portal-sair">Sair</button>
                </div>
            </div>`;
        cabecalho.querySelector(`[data-secao="${secao}"]`)?.setAttribute("aria-current", "page");
        configurarTemaPortal(cabecalho.querySelector("[data-portal-theme]"));

        function encerrarInterface() {
            limparSessao();
            cabecalho.hidden = true;
            conteudo.hidden = true;
            abrirLogin();
        }

        let revalidando = false;
        async function revalidarEmSegundoPlano() {
            if (document.hidden || revalidando || Date.now() - sessao.validadoEm < intervaloDaSessao
                || sessionStorage.getItem(CHAVE_SESSAO_PORTAL) !== token) return;

            revalidando = true;
            try {
                const atualizada = await consultarPerfilDaSessao(token);
                // Uma saída ou um novo login pode ocorrer enquanto a consulta está em andamento.
                if (sessionStorage.getItem(CHAVE_SESSAO_PORTAL) !== token) return;
                if (!atualizada) encerrarInterface();
                else if (atualizada.perfil !== perfil) location.reload();
                else sessao = atualizada;
            } catch {
                // Uma falha de rede não encerra uma sessão válida. A próxima checagem tenta novamente.
            } finally {
                revalidando = false;
            }
        }

        window.setInterval(revalidarEmSegundoPlano, 30000);
        document.addEventListener("visibilitychange", revalidarEmSegundoPlano);
        void revalidarEmSegundoPlano();

        window.addEventListener("pagehide", () => {
            cabecalho.hidden = true;
            conteudo.hidden = true;
        });
        window.addEventListener("pageshow", evento => {
            if (evento.persisted) location.reload();
        });

        const sair = cabecalho.querySelector(".portal-sair");
        sair.addEventListener("click", async () => {
            sair.disabled = true;
            status.hidden = true;
            try {
                const supabase = await obterSupabase();
                const { error: erroSaida } = await supabase.rpc("portal_sair");
                if (erroSaida) throw erroSaida;
                encerrarInterface();
            } catch {
                status.textContent = "Não foi possível sair. Tente novamente.";
                status.hidden = false;
                sair.disabled = false;
            }
        });

        cabecalho.hidden = false;
        if (secao === "admin" && perfil !== "admin") {
            status.textContent = "Acesso restrito a administradores.";
            status.hidden = false;
            return false;
        }

        status.hidden = true;
        conteudo.hidden = false;
        return true;
    } catch {
        status.textContent = "Não foi possível abrir o portal. Recarregue a página para tentar novamente.";
        status.hidden = false;
        return false;
    }
}
