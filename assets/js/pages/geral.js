import { protegerPagina } from "../config/acesso.js?v=sessao-1";
import { listarCaixas } from "../services/caixaService.js?v=sessao-1";
import { buscarTemperaturasGerais } from "../services/temperaturaService.js?v=sessao-1";
import { coresGrafico, eventoTemaPortal } from "../components/temaPortal.js?v=grafico-1";
import {
    dataDasLeituras, diaDasLeiturasNaUrl, fusoDasLeituras, inicioDoDiaNoAcre,
    limitesDoGraficoDiario, opcoesGraficoLeituras, serieDeLeituras
} from "../components/graficoLeituras.js?v=dia-completo-1";

const horario = new Intl.DateTimeFormat("pt-BR", { timeZone: fusoDasLeituras, timeStyle: "medium" });
const rotuloDia = new Intl.DateTimeFormat("pt-BR", { timeZone: fusoDasLeituras, dateStyle: "short" });
const numero = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });

const form = document.getElementById("formPeriodo");
const inicio = document.getElementById("periodoInicio");
const fim = document.getElementById("periodoFim");
const imprimir = document.getElementById("imprimir");
const periodoExibido = document.getElementById("periodoExibido");
const mensagem = document.getElementById("geralMensagem");
const graficoContainer = document.getElementById("geralGrafico");
const ultimaCaixa = document.getElementById("geralAtualCaixa");
const metricas = ["geralAtual", "geralMinima", "geralMaxima", "geralMedia"].map(id => document.getElementById(id));
let totalConsultas = 0;
let carregando = false;
let consultaAtual;
let grafico;
let caixasPorId = new Map();

function nomeCaixa(id) {
    if (id == null) return "Sem caixa vinculada";
    return caixasPorId.get(id) || `Caixa ${id}`;
}

function mostrarMetricas(leituras) {
    const ultima = leituras.at(-1);
    let minima = Infinity;
    let maxima = -Infinity;
    let soma = 0;

    for (const leitura of leituras) {
        minima = Math.min(minima, leitura.valor);
        maxima = Math.max(maxima, leitura.valor);
        soma += leitura.valor;
    }

    const valores = [ultima?.valor, minima, maxima, soma / leituras.length];
    metricas.forEach((elemento, indice) => {
        elemento.textContent = leituras.length ? `${numero.format(valores[indice])} °C` : "—";
    });
    ultimaCaixa.textContent = ultima ? nomeCaixa(ultima.caixa_id) : "";
}

function mostrarGrafico(leituras, dia) {
    const porCaixa = new Map();
    for (const leitura of leituras) {
        const grupo = leitura.caixa_id ?? `sem-caixa-${leitura.sensor_id ?? ""}`;
        if (!porCaixa.has(grupo)) {
            const nome = leitura.caixa_id == null && leitura.sensor_id != null
                ? `Sensor ${leitura.sensor_id} · sem caixa`
                : nomeCaixa(leitura.caixa_id);
            porCaixa.set(grupo, { nome, pontos: [] });
        }
        porCaixa.get(grupo).pontos.push([leitura.instante, leitura.valor]);
    }

    graficoContainer.hidden = false;
    grafico ??= window.echarts.init(graficoContainer);
    grafico.resize();
    grafico.setOption({
        ...opcoesGraficoLeituras(Boolean(dia), dia ? limitesDoGraficoDiario(dia, leituras[0].instante) : undefined),
        series: Array.from(porCaixa.values(), ({ nome, pontos }) => serieDeLeituras(nome, pontos))
    }, { replaceMerge: ["legend", "series"] });
    grafico.setOption(coresGrafico());
}

function limparPainel(texto) {
    mostrarMetricas([]);
    grafico?.clear();
    graficoContainer.hidden = true;
    imprimir.disabled = true;
    periodoExibido.hidden = true;
    mensagem.textContent = texto;
}

async function carregarPeriodo(periodo, atualizar = false) {
    const consulta = ++totalConsultas;
    carregando = true;
    if (!atualizar) limparPainel("Carregando leituras...");

    try {
        const primeiroDia = inicioDoDiaNoAcre(periodo.inicio);
        const ultimoDia = inicioDoDiaNoAcre(periodo.fim);
        const registros = await buscarTemperaturasGerais(
            new Date(primeiroDia).toISOString(),
            new Date(ultimoDia + 86400000).toISOString()
        );
        if (consulta !== totalConsultas) return;

        const leituras = registros.flatMap(leitura => {
            const valor = Number(leitura.valor);
            const instante = Date.parse(leitura.data);
            return leitura.valor != null && Number.isFinite(valor) && Number.isFinite(instante)
                ? [{ ...leitura, valor, instante }]
                : [];
        });
        mostrarMetricas(leituras);
        const umDia = periodo.inicio === periodo.fim;
        const rotuloPeriodo = umDia
            ? rotuloDia.format(primeiroDia)
            : `${rotuloDia.format(primeiroDia)} a ${rotuloDia.format(ultimoDia)}`;
        const total = `${numero.format(leituras.length)} ${leituras.length === 1 ? "leitura" : "leituras"}`;
        periodoExibido.textContent = `${rotuloPeriodo} · ${total}`;
        periodoExibido.hidden = false;

        if (leituras.length === 0) {
            grafico?.clear();
            graficoContainer.hidden = true;
            imprimir.disabled = true;
            mensagem.textContent = "Nenhuma leitura registrada no período consultado.";
            return;
        }

        if (!window.echarts) {
            mensagem.textContent = "Não foi possível carregar a biblioteca do gráfico. Recarregue a página.";
            return;
        }

        mostrarGrafico(leituras, umDia ? periodo.inicio : null);
        imprimir.disabled = false;
        mensagem.textContent = "";
    } catch (erro) {
        if (consulta === totalConsultas) limparPainel(erro.message);
    } finally {
        if (consulta === totalConsultas) carregando = false;
    }
}

function configurarPeriodo() {
    const diaInicial = diaDasLeiturasNaUrl() ?? dataDasLeituras.format(new Date());
    inicio.value = diaInicial;
    fim.value = diaInicial;
    const campoFim = document.getElementById("campoFim");
    const rotuloInicio = document.getElementById("rotuloInicio");
    const modos = document.querySelectorAll("[data-modo]");

    modos.forEach(modo => modo.addEventListener("click", () => {
        const intervalo = modo.dataset.modo === "intervalo";
        campoFim.hidden = !intervalo;
        fim.disabled = !intervalo;
        fim.required = intervalo;
        rotuloInicio.textContent = intervalo ? "De" : "Data";
        modos.forEach(botao => botao.setAttribute("aria-pressed", String(botao === modo)));
    }));

    form.addEventListener("submit", evento => {
        evento.preventDefault();
        const ultimoDia = fim.disabled ? inicio.value : fim.value;
        if (ultimoDia < inicio.value) {
            fim.setCustomValidity("A data final deve ser igual ou posterior à data inicial.");
            fim.reportValidity();
            return;
        }
        consultaAtual = { inicio: inicio.value, fim: ultimoDia };
        carregarPeriodo(consultaAtual);
    });
    form.addEventListener("input", () => fim.setCustomValidity(""));
    imprimir.addEventListener("click", () => window.print());
    window.addEventListener("beforeprint", () => {
        if (!graficoContainer.hidden) grafico?.setOption(coresGrafico(false));
    });
    window.addEventListener("afterprint", () => {
        if (!graficoContainer.hidden) grafico?.setOption(coresGrafico());
    });
    new ResizeObserver(() => {
        if (!graficoContainer.hidden) grafico?.resize();
    }).observe(graficoContainer);

    consultaAtual = { inicio: diaInicial, fim: diaInicial };
}

if (await protegerPagina("geral")) {
    window.addEventListener(eventoTemaPortal, () => {
        if (!graficoContainer.hidden) grafico?.setOption(coresGrafico());
    });
    configurarPeriodo();
    const relogio = document.getElementById("relogioAcre");
    const atualizarRelogio = () => { relogio.textContent = horario.format(new Date()); };
    atualizarRelogio();
    setInterval(atualizarRelogio, 1000);

    try {
        const caixas = await listarCaixas();
        caixasPorId = new Map(caixas.map(caixa => [caixa.id, caixa.codigo]));
    } catch (erro) {
        console.warn("Os códigos das caixas serão substituídos por seus IDs.", erro);
    }

    if (!carregando) carregarPeriodo(consultaAtual);
    setInterval(() => {
        const hoje = dataDasLeituras.format(new Date());
        if (!carregando && !document.hidden && consultaAtual.fim === hoje) carregarPeriodo(consultaAtual, true);
    }, 15000);
}
