export const fusoDasLeituras = "America/Rio_Branco";

const opcoesData = { timeZone: fusoDasLeituras };
const hora = new Intl.DateTimeFormat("pt-BR", { ...opcoesData, hour: "2-digit", minute: "2-digit" });
const diaHora = new Intl.DateTimeFormat("pt-BR", {
    ...opcoesData, day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit"
});
const dataCompleta = new Intl.DateTimeFormat("pt-BR", {
    ...opcoesData, dateStyle: "short", timeStyle: "medium"
});
export const dataDasLeituras = new Intl.DateTimeFormat("sv-SE", opcoesData);
const numero = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });

export function inicioDoDiaNoAcre(dia) {
    return Date.parse(`${dia}T00:00:00-05:00`);
}

export function diaDasLeiturasNaUrl() {
    const dia = new URLSearchParams(location.search).get("data");
    if (!dia || !/^\d{4}-\d{2}-\d{2}$/.test(dia)) return null;

    const inicio = inicioDoDiaNoAcre(dia);
    return Number.isFinite(inicio) && dataDasLeituras.format(inicio) === dia ? dia : null;
}

export function limitesDoGraficoDiario(dia, primeiraLeitura) {
    const inicio = inicioDoDiaNoAcre(dia);
    return {
        min: Math.min(inicio + 60000, primeiraLeitura),
        max: inicio + 86400000 - 1
    };
}

export function opcoesGraficoLeituras(umDia, limites) {
    return {
        aria: { enabled: true },
        grid: { top: 56, right: 16, bottom: 62, left: 20, outerBoundsMode: "same" },
        legend: { type: "scroll", top: 8, itemGap: 18 },
        tooltip: {
            trigger: "axis",
            renderMode: "richText",
            confine: true,
            padding: [10, 12],
            formatter: pontos => pontos.length
                ? [
                    dataCompleta.format(pontos[0].axisValue),
                    ...pontos.map(ponto => `${ponto.marker}${ponto.seriesName}   ${numero.format(ponto.value[1])} °C`)
                ].join("\n")
                : ""
        },
        xAxis: {
            type: "time",
            min: limites?.min ?? null,
            max: limites?.max ?? null,
            minInterval: 60000,
            axisLabel: {
                hideOverlap: true,
                showMinLabel: true,
                showMaxLabel: true,
                formatter: valor => (umDia ? hora : diaHora).format(valor)
            },
            axisPointer: { lineStyle: { type: "dashed" } }
        },
        yAxis: { type: "value", name: "°C", scale: true, splitNumber: 5 },
        dataZoom: [
            { type: "inside", filterMode: "none", zoomOnMouseWheel: "ctrl", moveOnMouseWheel: false },
            { type: "slider", filterMode: "none", height: 20, bottom: 10, brushSelect: false,
                labelFormatter: valor => (umDia ? hora : diaHora).format(valor) }
        ]
    };
}

export function serieDeLeituras(nome, pontos) {
    return {
        name: nome,
        type: "line",
        data: pontos,
        smooth: 0.28,
        smoothMonotone: "x",
        lineStyle: { width: 2.5 },
        symbol: "circle",
        symbolSize: 6,
        showSymbol: pontos.length < 35,
        areaStyle: { opacity: 0.15, origin: "start" },
        sampling: "lttb"
    };
}
