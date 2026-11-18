import { protegerPagina } from "../config/acesso.js?v=gestao-1";
import { listarCaixas, listarCaixasHistoricas } from "../services/caixaService.js?v=exclusao-1";
import { listarNomesSensores } from "../services/sensorService.js?v=gestao-1";
import { buscarTemperaturasGerais } from "../services/temperaturaService.js?v=exclusao-1";
import { coresGrafico, eventoTemaPortal } from "../components/temaPortal.js?v=grafico-1";
import { carregarECharts } from "../components/carregarECharts.js";
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
let sensoresPorId = new Map();
let nomesProntos;
let cacheLeituras;

function nomeDaOrigem(leitura) {
    const caixaId = leitura.caixa_id ?? leitura.caixa_id_historico;
    if (caixaId != null) return caixasPorId.get(caixaId) || `Caixa ${caixaId}`;
    if (leitura.sensor_id != null) return sensoresPorId.get(leitura.sensor_id) || `Sensor ${leitura.sensor_id}`;
    return "Sem identificação";
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
    ultimaCaixa.textContent = ultima ? nomeDaOrigem(ultima) : "";
}

function mostrarGrafico(leituras, dia) {
    const porCaixa = new Map();
    for (const leitura of leituras) {
        const grupo = leitura.caixa_id ?? leitura.caixa_id_historico ?? `sem-caixa-${leitura.sensor_id ?? ""}`;
        if (!porCaixa.has(grupo)) {
            porCaixa.set(grupo, { nome: nomeDaOrigem(leitura), pontos: [] });
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
        const agora = Date.now();
        // Reconsulta uma pequena sobreposição para capturar inserções que chegaram fora de ordem.
        const anterior = atualizar && cacheLeituras?.periodo === periodo && agora - cacheLeituras.completoEm < 300000
            ? cacheLeituras : null;
        const ultimoInstante = anterior?.leituras.at(-1)?.instante;
        const desde = ultimoInstante == null ? primeiroDia : Math.max(primeiroDia, Math.min(agora, ultimoInstante) - 120000);
        const [registros] = await Promise.all([
            buscarTemperaturasGerais(
                new Date(desde).toISOString(),
                new Date(ultimoDia + 86400000).toISOString()
            ),
            nomesProntos
        ]);
        if (consulta !== totalConsultas) return;

        const novas = registros.flatMap(leitura => {
            const valor = Number(leitura.valor);
            const instante = Date.parse(leitura.data);
            return leitura.valor != null && Number.isFinite(valor) && Number.isFinite(instante)
                ? [{ ...leitura, valor, instante }]
                : [];
        });
        let leituras = novas;
        if (anterior) {
            const corte = anterior.leituras.findIndex(leitura => leitura.instante >= desde);
            const prefixo = corte === -1 ? anterior.leituras : anterior.leituras.slice(0, corte);
            if (!imprimir.disabled && prefixo.length + novas.length === anterior.leituras.length && novas.every((leitura, indice) => {
                const antiga = anterior.leituras[prefixo.length + indice];
                return antiga.id === leitura.id && antiga.data === leitura.data && antiga.valor === leitura.valor
                    && antiga.caixa_id === leitura.caixa_id && antiga.caixa_id_historico === leitura.caixa_id_historico
                    && antiga.sensor_id === leitura.sensor_id;
            })) return;
            leituras = prefixo.concat(novas);
        }
        cacheLeituras = { periodo, leituras, completoEm: anterior?.completoEm ?? agora };
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

        try {
            await carregarECharts();
        } catch (erro) {
            if (consulta === totalConsultas) mensagem.textContent = erro.message;
            return;
        }
        if (consulta !== totalConsultas) return;

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

    nomesProntos = Promise.allSettled([listarCaixas({ incluirExcluidas: true }), listarCaixasHistoricas(), listarNomesSensores()])
        .then(([caixas, historicas, sensores]) => {
            caixasPorId = new Map([
                ...(caixas.value ?? []).map(caixa => [caixa.id, caixa.codigo]),
                ...(historicas.value ?? []).map(caixa => [caixa.id, `${caixa.codigo} (excluída #${caixa.id})`])
            ]);
            sensoresPorId = new Map((sensores.value ?? []).map(sensor => [sensor.id, sensor.nome || sensor.codigo]));
        });
    void carregarPeriodo(consultaAtual);
    setInterval(() => {
        const hoje = dataDasLeituras.format(new Date());
        if (!carregando && !document.hidden && consultaAtual.fim === hoje) carregarPeriodo(consultaAtual, true);
    }, 15000);
}
