/* =========================================================
   IMPORTS
========================================================= */

import {
    buscarCaixaPorId
} from "../services/caixaService.js";


import {
    buscarSensorPorCaixa
} from "../services/sensorService.js";


import {
    buscarTemperaturasPorPeriodo
} from "../services/temperaturaService.js";


import {
    horasAtras,
    inicioDoDiaAtual,
    agora,
    converterDataLocalParaISO,
    validarPeriodo
} from "../utils/datas.js";


import {
    calcularMetricasTemperatura
} from "../utils/metricas.js";


import {
    mostrarCards
} from "../components/cards.js";


import {
    mostrarGraficoTemperatura
} from "../components/graficoTemperatura.js";


import {
    compararMetricas
} from "../utils/comparativo.js";


import {
    mostrarGraficoComparativo,
    limparGraficoComparativo
} from "../components/graficoComparativo.js";


/* =========================================================
   ELEMENTOS PRINCIPAIS
========================================================= */

const dashboardCarregando =
    document.getElementById(
        "dashboardCarregando"
    );


const dashboardErro =
    document.getElementById(
        "dashboardErro"
    );


const dashboardErroMensagem =
    document.getElementById(
        "dashboardErroMensagem"
    );


const dashboardConteudo =
    document.getElementById(
        "dashboardConteudo"
    );


/* =========================================================
   ELEMENTOS DO FILTRO
========================================================= */

const filtroPeriodo =
    document.getElementById(
        "filtroPeriodo"
    );


const periodoPersonalizado =
    document.getElementById(
        "periodoPersonalizado"
    );


const dataInicio =
    document.getElementById(
        "dataInicio"
    );


const dataFim =
    document.getElementById(
        "dataFim"
    );


const btnAplicarPeriodo =
    document.getElementById(
        "btnAplicarPeriodo"
    );


const filtroMensagem =
    document.getElementById(
        "filtroMensagem"
    );


/* =========================================================
   ELEMENTOS DO COMPARATIVO
========================================================= */

const comparativoInicioA =
    document.getElementById(
        "comparativoInicioA"
    );


const comparativoFimA =
    document.getElementById(
        "comparativoFimA"
    );


const comparativoInicioB =
    document.getElementById(
        "comparativoInicioB"
    );


const comparativoFimB =
    document.getElementById(
        "comparativoFimB"
    );


const btnComparar =
    document.getElementById(
        "btnComparar"
    );


const comparativoMensagem =
    document.getElementById(
        "comparativoMensagem"
    );


const comparativoResultado =
    document.getElementById(
        "comparativoResultado"
    );


/* =========================================================
   ESTADO
========================================================= */

let caixaAtual =
    null;


/* =========================================================
   ESTADOS VISUAIS
========================================================= */

function mostrarCarregamento() {

    dashboardCarregando
        .classList
        .remove("oculto");


    dashboardErro
        .classList
        .add("oculto");


    dashboardConteudo
        .classList
        .add("oculto");

}


function mostrarErro(
    mensagem
) {

    dashboardCarregando
        .classList
        .add("oculto");


    dashboardConteudo
        .classList
        .add("oculto");


    dashboardErro
        .classList
        .remove("oculto");


    dashboardErroMensagem.textContent =
        mensagem;

}


function mostrarConteudo() {

    dashboardCarregando
        .classList
        .add("oculto");


    dashboardErro
        .classList
        .add("oculto");


    dashboardConteudo
        .classList
        .remove("oculto");

}


/* =========================================================
   MENSAGEM DO FILTRO
========================================================= */

function esconderMensagemFiltro() {

    filtroMensagem.textContent =
        "";


    filtroMensagem
        .classList
        .add("oculto");

}


function mostrarMensagemFiltro(
    mensagem
) {

    filtroMensagem.textContent =
        mensagem;


    filtroMensagem
        .classList
        .remove("oculto");

}


/* =========================================================
   MENSAGEM DO COMPARATIVO
========================================================= */

function esconderMensagemComparativo() {

    comparativoMensagem.textContent =
        "";


    comparativoMensagem
        .classList
        .add("oculto");

}


function mostrarMensagemComparativo(
    mensagem
) {

    comparativoMensagem.textContent =
        mensagem;


    comparativoMensagem
        .classList
        .remove("oculto");

}


/* =========================================================
   ID DA CAIXA NA URL
========================================================= */

function obterCaixaIdDaUrl() {

    const parametros =
        new URLSearchParams(
            window.location.search
        );


    const valor =
        parametros.get(
            "caixa"
        );


    if (!valor) {

        return null;

    }


    const caixaId =
        Number(valor);


    if (
        !Number.isInteger(caixaId) ||
        caixaId <= 0
    ) {

        return null;

    }


    return caixaId;

}


/* =========================================================
   FORMATAÇÃO
========================================================= */

function formatarNumero(
    valor,
    casas = 2
) {

    if (
        valor === null ||
        valor === undefined
    ) {

        return "Não informado";

    }


    return Number(valor)
        .toLocaleString(
            "pt-BR",
            {
                maximumFractionDigits:
                    casas
            }
        );

}


/* =========================================================
   MOSTRAR DADOS DA CAIXA
========================================================= */

function mostrarDadosCaixa(
    caixa
) {

    document.getElementById(
        "caixaNome"
    ).textContent =
        caixa.nome;


    document.getElementById(
        "caixaCodigo"
    ).textContent =
        caixa.codigo;


    document.getElementById(
        "caixaId"
    ).textContent =
        caixa.id;


    document.getElementById(
        "caixaVolume"
    ).textContent =
        formatarNumero(
            caixa.volume_litros
        );


    document.getElementById(
        "caixaHemocomponentes"
    ).textContent =
        caixa.quantidade_hemocomponentes;


    document.getElementById(
        "caixaGelo"
    ).textContent =
        formatarNumero(
            caixa.peso_gelo_kg
        );


    document.getElementById(
        "caixaComprimento"
    ).textContent =
        `${formatarNumero(
            caixa.comprimento_cm
        )} cm`;


    document.getElementById(
        "caixaLargura"
    ).textContent =
        `${formatarNumero(
            caixa.largura_cm
        )} cm`;


    document.getElementById(
        "caixaAltura"
    ).textContent =
        `${formatarNumero(
            caixa.altura_cm
        )} cm`;


    document.getElementById(
        "temperaturaMin"
    ).textContent =
        `${formatarNumero(
            caixa.temperatura_min
        )} °C`;


    document.getElementById(
        "temperaturaMax"
    ).textContent =
        `${formatarNumero(
            caixa.temperatura_max
        )} °C`;

}


/* =========================================================
   MOSTRAR SENSOR
========================================================= */

function mostrarDadosSensor(
    sensor
) {

    const sensorNome =
        document.getElementById(
            "sensorNome"
        );


    const sensorCodigo =
        document.getElementById(
            "sensorCodigo"
        );


    const sensorStatus =
        document.getElementById(
            "sensorStatus"
        );


    if (!sensor) {

        sensorNome.textContent =
            "Nenhum sensor";


        sensorCodigo.textContent =
            "-";


        sensorStatus.classList.add(
            "sensor-sem-associacao"
        );


        return;

    }


    sensorStatus.classList.remove(
        "sensor-sem-associacao"
    );


    sensorNome.textContent =
        sensor.nome ??
        sensor.codigo;


    sensorCodigo.textContent =
        sensor.codigo;

}


/* =========================================================
   ATUALIZAR MONITORAMENTO
========================================================= */

async function atualizarMonitoramento(
    inicio,
    fim,
    periodo
) {

    if (!caixaAtual) {

        console.warn(
            "[DASHBOARD] Nenhuma caixa carregada."
        );

        return;

    }


    console.group(
        "ATUALIZAR MONITORAMENTO"
    );


    try {

        console.log(
            "📅 Início:",
            inicio
        );


        console.log(
            "📅 Fim:",
            fim
        );


        const temperaturas =
            await buscarTemperaturasPorPeriodo(
                caixaAtual.id,
                inicio,
                fim
            );


        console.log(
            `🌡️ ${temperaturas.length} temperatura(s) encontrada(s).`
        );


        const metricas =
            calcularMetricasTemperatura(
                temperaturas,
                Number(
                    caixaAtual.temperatura_min
                ),
                Number(
                    caixaAtual.temperatura_max
                )
            );


        console.log(
            "📊 Métricas:",
            metricas
        );


        mostrarCards(
            metricas
        );


        mostrarGraficoTemperatura(
            temperaturas,
            caixaAtual.temperatura_min,
            caixaAtual.temperatura_max
        );


        if (periodo) {

            dashboardConteudo.dataset.periodo =
                periodo;

        }


        console.log(
            "✅ Cards e gráfico atualizados."
        );


    } catch (erro) {

        console.error(
            "❌ Erro ao atualizar monitoramento:",
            erro
        );


        mostrarMensagemFiltro(
            "Não foi possível atualizar o período."
        );


    } finally {

        console.groupEnd();

    }

}


/* =========================================================
   FILTRO PRINCIPAL
========================================================= */

filtroPeriodo.addEventListener(
    "change",
    async () => {

        esconderMensagemFiltro();


        const periodo =
            filtroPeriodo.value;


        console.log(
            `[FILTRO] Período selecionado: ${periodo}`
        );


        /* =============================================
           PERSONALIZADO
        ============================================= */

        if (
            periodo ===
            "personalizado"
        ) {

            periodoPersonalizado
                .classList
                .remove("oculto");


            return;

        }


        periodoPersonalizado
            .classList
            .add("oculto");


        /* =============================================
           ÚLTIMAS 24 HORAS
        ============================================= */

        if (
            periodo ===
            "24h"
        ) {

            await atualizarMonitoramento(
                horasAtras(24),
                agora(),
                "24h"
            );


            return;

        }


        /* =============================================
           HOJE
        ============================================= */

        if (
            periodo ===
            "hoje"
        ) {

            await atualizarMonitoramento(
                inicioDoDiaAtual(),
                agora(),
                "hoje"
            );

        }

    }
);


/* =========================================================
   PERÍODO PERSONALIZADO
========================================================= */

btnAplicarPeriodo.addEventListener(
    "click",
    async () => {

        esconderMensagemFiltro();


        const inicio =
            converterDataLocalParaISO(
                dataInicio.value
            );


        const fim =
            converterDataLocalParaISO(
                dataFim.value
            );


        const validacao =
            validarPeriodo(
                inicio,
                fim
            );


        if (
            !validacao.valido
        ) {

            mostrarMensagemFiltro(
                validacao.mensagem
            );


            return;

        }


        const textoOriginal =
            btnAplicarPeriodo.textContent;


        btnAplicarPeriodo.disabled =
            true;


        btnAplicarPeriodo.textContent =
            "Aplicando...";


        try {

            await atualizarMonitoramento(
                inicio,
                fim,
                "personalizado"
            );


        } finally {

            btnAplicarPeriodo.disabled =
                false;


            btnAplicarPeriodo.textContent =
                textoOriginal;

        }

    }
);


/* =========================================================
   FORMATAÇÃO DO COMPARATIVO
========================================================= */

function formatarTemperaturaComparativo(
    valor
) {

    if (
        valor === null ||
        valor === undefined
    ) {

        return "-- °C";

    }


    return `${Number(valor)
        .toLocaleString(
            "pt-BR",
            {
                minimumFractionDigits: 1,
                maximumFractionDigits: 2
            }
        )} °C`;

}


/* =========================================================
   FORMATAR DIFERENÇA
========================================================= */

function formatarDiferenca(
    valor
) {

    if (
        valor === null ||
        valor === undefined
    ) {

        return "Sem comparação";

    }


    const numero =
        Number(valor);


    const sinal =
        numero > 0
            ? "+"
            : "";


    return `${sinal}${numero
        .toLocaleString(
            "pt-BR",
            {
                minimumFractionDigits: 1,
                maximumFractionDigits: 2
            }
        )} °C`;

}


/* =========================================================
   MOSTRAR RESULTADO COMPARATIVO
========================================================= */

function mostrarResultadoComparativo(
    comparativo
) {

    /* MÍNIMA */

    document.getElementById(
        "comparativoMinimaA"
    ).textContent =
        formatarTemperaturaComparativo(
            comparativo.minima.periodoA
        );


    document.getElementById(
        "comparativoMinimaB"
    ).textContent =
        formatarTemperaturaComparativo(
            comparativo.minima.periodoB
        );


    document.getElementById(
        "comparativoMinimaDiferenca"
    ).textContent =
        `Diferença: ${formatarDiferenca(
            comparativo.minima.diferenca
        )
        }`;


    /* MÉDIA */

    document.getElementById(
        "comparativoMediaA"
    ).textContent =
        formatarTemperaturaComparativo(
            comparativo.media.periodoA
        );


    document.getElementById(
        "comparativoMediaB"
    ).textContent =
        formatarTemperaturaComparativo(
            comparativo.media.periodoB
        );


    document.getElementById(
        "comparativoMediaDiferenca"
    ).textContent =
        `Diferença: ${formatarDiferenca(
            comparativo.media.diferenca
        )
        }`;


    /* MÁXIMA */

    document.getElementById(
        "comparativoMaximaA"
    ).textContent =
        formatarTemperaturaComparativo(
            comparativo.maxima.periodoA
        );


    document.getElementById(
        "comparativoMaximaB"
    ).textContent =
        formatarTemperaturaComparativo(
            comparativo.maxima.periodoB
        );


    document.getElementById(
        "comparativoMaximaDiferenca"
    ).textContent =
        `Diferença: ${formatarDiferenca(
            comparativo.maxima.diferenca
        )
        }`;


    comparativoResultado
        .classList
        .remove("oculto");

}


/* =========================================================
   COMPARAR PERÍODOS
========================================================= */

btnComparar.addEventListener(
    "click",
    async () => {

        esconderMensagemComparativo();


        comparativoResultado
            .classList
            .add("oculto");


        limparGraficoComparativo();


        /* =============================================
           CONVERTER DATAS DO PERÍODO A
        ============================================= */

        const inicioA =
            converterDataLocalParaISO(
                comparativoInicioA.value
            );


        const fimA =
            converterDataLocalParaISO(
                comparativoFimA.value
            );


        /* =============================================
           CONVERTER DATAS DO PERÍODO B
        ============================================= */

        const inicioB =
            converterDataLocalParaISO(
                comparativoInicioB.value
            );


        const fimB =
            converterDataLocalParaISO(
                comparativoFimB.value
            );


        /* =============================================
           VALIDAR A
        ============================================= */

        const validacaoA =
            validarPeriodo(
                inicioA,
                fimA
            );


        if (
            !validacaoA.valido
        ) {

            mostrarMensagemComparativo(
                `Período A: ${validacaoA.mensagem}`
            );


            return;

        }


        /* =============================================
           VALIDAR B
        ============================================= */

        const validacaoB =
            validarPeriodo(
                inicioB,
                fimB
            );


        if (
            !validacaoB.valido
        ) {

            mostrarMensagemComparativo(
                `Período B: ${validacaoB.mensagem}`
            );


            return;

        }


        const textoOriginal =
            btnComparar.textContent;


        btnComparar.disabled =
            true;


        btnComparar.textContent =
            "Comparando...";


        console.group(
            "COMPARATIVO"
        );


        try {

            /* =========================================
               BUSCAR OS DOIS PERÍODOS
            ========================================= */

            const [
                temperaturasA,
                temperaturasB
            ] =
                await Promise.all([

                    buscarTemperaturasPorPeriodo(
                        caixaAtual.id,
                        inicioA,
                        fimA
                    ),

                    buscarTemperaturasPorPeriodo(
                        caixaAtual.id,
                        inicioB,
                        fimB
                    )

                ]);


            console.log(
                `📘 Período A: ${temperaturasA.length} registro(s).`
            );


            console.log(
                `📗 Período B: ${temperaturasB.length} registro(s).`
            );


            /* =========================================
               VALIDAR DADOS
            ========================================= */

            if (
                temperaturasA.length === 0 ||
                temperaturasB.length === 0
            ) {

                mostrarMensagemComparativo(
                    "Os dois períodos precisam possuir pelo menos uma temperatura registrada."
                );


                return;

            }


            /* =========================================
               MÉTRICAS A
            ========================================= */

            const metricasA =
                calcularMetricasTemperatura(
                    temperaturasA,
                    Number(
                        caixaAtual.temperatura_min
                    ),
                    Number(
                        caixaAtual.temperatura_max
                    )
                );


            /* =========================================
               MÉTRICAS B
            ========================================= */

            const metricasB =
                calcularMetricasTemperatura(
                    temperaturasB,
                    Number(
                        caixaAtual.temperatura_min
                    ),
                    Number(
                        caixaAtual.temperatura_max
                    )
                );


            /* =========================================
               COMPARAÇÃO
            ========================================= */

            const comparativo =
                compararMetricas(
                    metricasA,
                    metricasB
                );


            console.log(
                "📊 Comparativo:",
                comparativo
            );


            /* =========================================
               RESULTADOS
            ========================================= */

            mostrarResultadoComparativo(
                comparativo
            );


            mostrarGraficoComparativo(
                comparativo
            );


            console.log(
                "🎉 Comparativo concluído."
            );


        } catch (erro) {

            console.error(
                "❌ Erro no comparativo:",
                erro
            );


            mostrarMensagemComparativo(
                "Não foi possível realizar o comparativo."
            );


        } finally {

            btnComparar.disabled =
                false;


            btnComparar.textContent =
                textoOriginal;


            console.groupEnd();

        }

    }
);


/* =========================================================
   INICIALIZAR DASHBOARD
========================================================= */

async function iniciarDashboard() {

    mostrarCarregamento();


    const caixaId =
        obterCaixaIdDaUrl();


    if (!caixaId) {

        mostrarErro(
            "O ID da caixa não foi informado ou é inválido."
        );


        return;

    }


    console.group(
        "DASHBOARD"
    );


    console.log(
        `🔎 Carregando caixa ${caixaId}...`
    );


    try {

        /* =================================================
           1. BUSCAR CAIXA
        ================================================= */

        const caixa =
            await buscarCaixaPorId(
                caixaId
            );


        caixaAtual =
            caixa;


        console.log(
            "✅ Caixa:",
            caixa
        );


        /* =================================================
           2. BUSCAR SENSOR
        ================================================= */

        const sensor =
            await buscarSensorPorCaixa(
                caixaId
            );


        console.log(
            "✅ Sensor:",
            sensor
        );


        /* =================================================
           3. ÚLTIMAS 24 HORAS
        ================================================= */

        const inicio =
            horasAtras(24);


        const fim =
            agora();


        const temperaturas =
            await buscarTemperaturasPorPeriodo(
                caixaId,
                inicio,
                fim
            );


        console.log(
            `🌡️ ${temperaturas.length} temperaturas carregadas nas últimas 24 horas.`
        );


        /* =================================================
           4. MÉTRICAS
        ================================================= */

        const metricas =
            calcularMetricasTemperatura(
                temperaturas,
                Number(
                    caixa.temperatura_min
                ),
                Number(
                    caixa.temperatura_max
                )
            );


        console.log(
            "📊 Métricas:",
            metricas
        );


        /* =================================================
           5. DADOS DA CAIXA
        ================================================= */

        mostrarDadosCaixa(
            caixa
        );


        /* =================================================
           6. SENSOR
        ================================================= */

        mostrarDadosSensor(
            sensor
        );


        /* =================================================
           7. CARDS
        ================================================= */

        mostrarCards(
            metricas
        );


        /* =================================================
           8. GRÁFICO
        ================================================= */

        mostrarGraficoTemperatura(
            temperaturas,
            caixa.temperatura_min,
            caixa.temperatura_max
        );


        /* =================================================
           9. INFORMAÇÕES PARA TESTES
        ================================================= */

        dashboardConteudo.dataset.caixaId =
            caixa.id;


        dashboardConteudo.dataset.periodo =
            "24h";


        if (sensor) {

            dashboardConteudo.dataset.sensorId =
                sensor.id;

        }


        /* =================================================
           10. EXIBIR
        ================================================= */

        mostrarConteudo();


        console.log(
            "🎉 Dashboard carregado."
        );


    } catch (erro) {

        console.error(
            "❌ Erro:",
            erro
        );


        mostrarErro(
            erro.message
        );


    } finally {

        console.groupEnd();

    }

}


/* =========================================================
   EXECUTAR
========================================================= */

iniciarDashboard();