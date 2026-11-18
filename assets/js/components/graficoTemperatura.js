import { coresGrafico, eventoTemaPortal } from "./temaPortal.js?v=grafico-1";
import { dataDasLeituras, limitesDoGraficoDiario, opcoesGraficoLeituras, serieDeLeituras } from "./graficoLeituras.js?v=dia-completo-1";

let grafico = null;

function mostrarSemDados(container, texto = "Nenhuma temperatura registrada para esta caixa.") {
    grafico?.dispose();
    grafico = null;

    const mensagem = document.createElement("div");
    mensagem.className = "grafico-sem-dados";
    mensagem.textContent = texto;
    container.replaceChildren(mensagem);
    container.dataset.renderizado = "false";
    container.dataset.quantidadePontos = "0";
}

export function mostrarErroDoGraficoTemperatura(texto) {
    const container = document.getElementById("graficoTemperatura");
    if (container) mostrarSemDados(container, texto);
}

export function capturarGraficoParaImpressao() {
    if (!grafico) return null;
    const opcoes = grafico.getOption();
    const impressao = window.echarts.init(document.createElement("div"), null, { width: 900, height: 345 });
    try {
        impressao.setOption({
            ...opcoes,
            backgroundColor: "#fff",
            animation: false,
            dataZoom: opcoes.dataZoom?.map(zoom => ({ ...zoom, start: 0, end: 100, show: false }))
        });
        impressao.setOption(coresGrafico(false));
        return impressao.getDataURL({ type: "png", pixelRatio: 2, backgroundColor: "#fff" });
    } finally {
        impressao.dispose();
    }
}

function serieLimite(nome, pontos, limite, cor) {
    return {
        name: nome,
        type: "line",
        data: pontos.map(([horario]) => [horario, limite]),
        showSymbol: false,
        lineStyle: { color: cor, type: "dashed", width: 1.5 },
        itemStyle: { color: cor }
    };
}

export function mostrarGraficoTemperatura(registros, temperaturaMin, temperaturaMax, dia) {
    const container = document.getElementById("graficoTemperatura");
    if (!container) throw new Error("Container do gráfico não encontrado.");

    const pontos = (Array.isArray(registros) ? registros : [])
        .filter(registro => registro.valor != null)
        .map(registro => [Date.parse(registro.data), Number(registro.valor)])
        .filter(([horario, valor]) => Number.isFinite(horario) && Number.isFinite(valor))
        .sort(([anterior], [posterior]) => anterior - posterior);

    if (!pontos.length) {
        mostrarSemDados(container);
        return;
    }
    if (!window.echarts) throw new Error("ECharts não foi carregado.");

    const medicao = serieDeLeituras("Temperatura", pontos);
    medicao.sampling = "none";
    const series = [medicao];
    const minimo = Number(temperaturaMin);
    const maximo = Number(temperaturaMax);
    if (temperaturaMin != null && temperaturaMax != null
        && Number.isFinite(minimo) && Number.isFinite(maximo) && minimo < maximo) {
        medicao.markArea = {
            silent: true,
            itemStyle: { color: "rgba(68, 158, 117, 0.10)" },
            data: [[{ yAxis: minimo }, { yAxis: maximo }]]
        };
        series.push(
            serieLimite("Limite mínimo", pontos, minimo, "#348668"),
            serieLimite("Limite máximo", pontos, maximo, "#cd705c")
        );
    }

    if (!grafico) {
        container.replaceChildren();
        grafico = window.echarts.init(container);
    }

    const umDia = dataDasLeituras.format(pontos[0][0]) === dataDasLeituras.format(pontos.at(-1)[0]);
    const limites = dia ? limitesDoGraficoDiario(dia, pontos[0][0]) : undefined;
    const opcoes = opcoesGraficoLeituras(umDia, limites);
    // O cursor acompanha o mouse e o tooltip identifica a leitura registrada mais próxima.
    opcoes.xAxis.axisPointer.snap = false;
    grafico.setOption({ ...opcoes, series }, { notMerge: true });
    grafico.setOption(coresGrafico());
    container.dataset.renderizado = "true";
    container.dataset.quantidadePontos = String(pontos.length);
}

window.addEventListener(eventoTemaPortal, () => grafico?.setOption(coresGrafico()));
window.addEventListener("resize", () => grafico?.resize());
