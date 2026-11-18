import { CHAVE_SESSAO_PORTAL, supabase } from "./supabase.js?v=implantacao-1";
import { configurarTemaPortal } from "../components/temaPortal.js";

const raiz = new URL("../../../", import.meta.url);
const paginas = new Set(["", "index.html", "caixas.html", "cadastro.html", "dashboard.html", "administrador.html"]);

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
        if (!supabase) throw new Error("Configuração do portal indisponível.");
        if (!sessionStorage.getItem(CHAVE_SESSAO_PORTAL)) {
            abrirLogin();
            return false;
        }

        const { data: perfil, error } = await supabase.rpc("portal_perfil_sessao");
        if (error) throw error;
        if (!["admin", "operador"].includes(perfil)) {
            sessionStorage.removeItem(CHAVE_SESSAO_PORTAL);
            abrirLogin();
            return false;
        }

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
            sessionStorage.removeItem(CHAVE_SESSAO_PORTAL);
            cabecalho.hidden = true;
            conteudo.hidden = true;
            abrirLogin();
        }

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
            return false;
        }

        status.hidden = true;
        conteudo.hidden = false;
        return true;
    } catch {
        status.textContent = "Não foi possível verificar seu acesso. Recarregue a página para tentar novamente.";
        return false;
    }
}
