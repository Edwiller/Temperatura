import { protegerPagina } from "../config/acesso.js?v=desempenho-1";
import { obterSupabase } from "../config/supabase.js?v=desempenho-1";

const lista = document.getElementById("listaPendencias");
const estado = document.getElementById("estadoPendencias");
const atualizar = document.getElementById("atualizarPendencias");
const mais = document.getElementById("maisPendencias");
const tamanhoPagina = 30;
const dataHora = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short", timeStyle: "short", timeZone: "America/Rio_Branco"
});
let carregando = false;

function criarLinha(solicitacao) {
    const linha = document.createElement("li");
    linha.innerHTML = `<div><strong></strong><p></p></div><button type="button" class="portal-botao">Aprovar</button>`;
    linha.querySelector("strong").textContent = solicitacao.nome;
    linha.querySelector("p").textContent = `${solicitacao.usuario} · ${dataHora.format(new Date(solicitacao.criado_em))}`;
    const botao = linha.querySelector("button");
    botao.setAttribute("aria-label", `Aprovar ${solicitacao.usuario}`);

    botao.addEventListener("click", async () => {
        botao.disabled = true;
        estado.textContent = "";
        try {
            const supabase = await obterSupabase();
            const { data: aprovado, error } = await supabase.rpc("portal_aprovar_cadastro", {
                p_usuario_id: solicitacao.usuario_id
            });
            if (error) throw error;
            linha.remove();
            estado.textContent = aprovado
                ? `Acesso de ${solicitacao.usuario} aprovado.`
                : "A solicitação já foi atualizada por outro administrador.";
            if (!lista.children.length && !mais.hidden) await carregarPendencias();
            atualizar.focus();
        } catch {
            estado.textContent = "Não foi possível aprovar este cadastro. Atualize a lista e tente novamente.";
            botao.disabled = false;
        }
    });

    return linha;
}

async function carregarPendencias(acrescentar = false) {
    if (carregando) return;
    carregando = true;
    atualizar.disabled = true;
    mais.disabled = true;
    try {
        const supabase = await obterSupabase();
        const { data, error } = await supabase.rpc("portal_listar_cadastros_pendentes", {
            p_limite: tamanhoPagina + 1,
            p_inicio: acrescentar ? lista.children.length : 0
        });
        if (error) throw error;
        const linhas = data.slice(0, tamanhoPagina).map(criarLinha);
        if (acrescentar) lista.append(...linhas);
        else lista.replaceChildren(...linhas);
        mais.hidden = data.length <= tamanhoPagina;
        estado.textContent = lista.children.length ? "" : "Nenhum cadastro pendente.";
    } catch {
        estado.textContent = "Não foi possível carregar os cadastros pendentes.";
    } finally {
        carregando = false;
        atualizar.disabled = false;
        mais.disabled = false;
    }
}

if (await protegerPagina("admin")) {
    atualizar.addEventListener("click", () => carregarPendencias());
    mais.addEventListener("click", () => carregarPendencias(true));
    await carregarPendencias();
}
