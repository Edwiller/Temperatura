import { protegerPagina } from "../config/acesso.js?v=gestao-1";
import { excluirCaixa, listarCaixas } from "../services/caixaService.js?v=gestao-1";
import { alterarVinculoSensor } from "../services/sensorService.js?v=gestao-1";

const filtro = document.getElementById("buscarCaixa");
const estado = document.getElementById("estadoCaixas");
const mensagem = document.getElementById("acaoCaixas");
const lista = document.getElementById("listaCaixas");
const numero = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });
let caixas = [];
let processando = false;

function avisar(texto) {
    mensagem.textContent = texto;
    mensagem.hidden = false;
}

async function executarAcao(item, acao, confirmacao, sucesso) {
    if (processando || !window.confirm(confirmacao)) return;
    processando = true;
    const botoes = item.querySelectorAll("button");
    botoes.forEach(botao => { botao.disabled = true; });
    try {
        await acao();
        avisar(sucesso);
        exibirCaixas(caixas);
    } catch (erro) {
        avisar(erro.message);
    } finally {
        processando = false;
        botoes.forEach(botao => { botao.disabled = false; });
    }
}

function criarCartao(caixa) {
    const item = document.createElement("li");
    item.innerHTML = `
        <div class="portal-cartao-topo">
            <p class="portal-codigo"></p>
            <div class="portal-acoes-caixa">
                <a class="portal-icone" data-editar>✎</a>
                <button type="button" class="portal-icone portal-icone-excluir" data-excluir>🗑</button>
            </div>
        </div>
        <h2></h2>
        <dl>
            <div><dt>Dispositivo</dt><dd data-sensor></dd></div>
            <div><dt>Faixa configurada</dt><dd data-faixa></dd></div>
        </dl>
        <div class="portal-acoes-caixa">
            <a class="portal-botao portal-botao-secundario" data-painel>Abrir dashboard</a>
            <button type="button" class="portal-botao portal-botao-secundario" data-desvincular hidden>Desvincular sensor</button>
        </div>`;
    item.querySelector(".portal-codigo").textContent = caixa.codigo;
    item.querySelector("h2").textContent = caixa.nome;
    item.querySelector("[data-sensor]").textContent = caixa.sensores
        .map(sensor => sensor.ativo ? sensor.codigo : `${sensor.codigo} (inativo)`).join(", ") || "Sem ESP associado";
    item.querySelector("[data-faixa]").textContent = caixa.temperatura_min == null || caixa.temperatura_max == null
        ? "Não informada"
        : `${numero.format(caixa.temperatura_min)} a ${numero.format(caixa.temperatura_max)} °C`;
    const link = item.querySelector("[data-painel]");
    link.href = `./dashboard.html?caixa=${encodeURIComponent(caixa.id)}`;
    link.setAttribute("aria-label", `Abrir dashboard de ${caixa.nome}`);
    const editar = item.querySelector("[data-editar]");
    editar.href = `./cadastro.html?editar=${encodeURIComponent(caixa.id)}`;
    editar.title = "Editar caixa";
    editar.setAttribute("aria-label", `Editar ${caixa.nome}`);
    const excluir = item.querySelector("[data-excluir]");
    excluir.title = "Excluir caixa";
    excluir.setAttribute("aria-label", `Excluir ${caixa.nome}`);
    excluir.addEventListener("click", () => executarAcao(item, async () => {
        await excluirCaixa(caixa.id);
        caixas = caixas.filter(outra => outra !== caixa);
    }, `Excluir a caixa ${caixa.nome}? O histórico será preservado e o sensor será liberado.`, "Caixa excluída."));

    const sensor = caixa.sensores[0];
    if (sensor) {
        const desvincular = item.querySelector("[data-desvincular]");
        desvincular.hidden = false;
        desvincular.addEventListener("click", () => executarAcao(item, async () => {
            await alterarVinculoSensor(sensor.id, null, caixa.id);
            caixa.sensores = [];
        }, `Desvincular ${sensor.codigo} de ${caixa.nome}?`, "Sensor desvinculado."));
    }
    return item;
}

function exibirCaixas(caixas) {
    const termo = filtro.value.trim().toLocaleLowerCase("pt-BR");
    const resultados = caixas.filter(caixa => {
        const termos = [caixa.codigo, caixa.nome, ...caixa.sensores.map(sensor => sensor.codigo)];
        return termos.some(valor => valor?.toLocaleLowerCase("pt-BR").includes(termo));
    });

    lista.replaceChildren(...resultados.map(criarCartao));
    document.getElementById("controlesCaixas").hidden = caixas.length === 0;
    estado.hidden = resultados.length > 0;
    estado.textContent = caixas.length ? "Nenhuma caixa corresponde à busca." : "Ainda não há caixas cadastradas.";
}

if (await protegerPagina("caixas")) {
    try {
        caixas = await listarCaixas({ incluirSensores: true });
        exibirCaixas(caixas);
        if (new URLSearchParams(location.search).has("atualizada")) {
            avisar("Caixa atualizada.");
            history.replaceState(null, "", location.pathname);
        }
        filtro.addEventListener("input", () => exibirCaixas(caixas));
    } catch (erro) {
        estado.textContent = erro.message;
    }
}
