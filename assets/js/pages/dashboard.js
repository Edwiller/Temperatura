import {
    buscarCaixaPorId
} from "../services/caixaService.js";


import {
    buscarSensorPorCaixa
} from "../services/sensorService.js";


import {
    buscarTemperaturasDaCaixa
} from "../services/temperaturaService.js";


import {
    calcularMetricasTemperatura
} from "../utils/metricas.js";


import {
    mostrarCards
} from "../components/cards.js";

import {
    mostrarGraficoTemperatura
} from "../components/graficoTemperatura.js";

/* =========================================================
   ELEMENTOS
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
   ESTADOS DA PÁGINA
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
   PEGAR ID DA URL
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
   PREENCHER CAIXA
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
   PREENCHER SENSOR
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


    sensorNome.textContent =
        sensor.nome ??
        sensor.codigo;


    sensorCodigo.textContent =
        sensor.codigo;

}



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

        /* =====================================================
           1. BUSCAR CAIXA
        ===================================================== */

        const caixa =
            await buscarCaixaPorId(
                caixaId
            );


        console.log(
            "✅ Caixa:",
            caixa
        );


        /* =====================================================
           2. BUSCAR SENSOR
        ===================================================== */

        const sensor =
            await buscarSensorPorCaixa(
                caixaId
            );


        console.log(
            "✅ Sensor:",
            sensor
        );


        /* =====================================================
           3. BUSCAR TEMPERATURAS
        ===================================================== */

        const temperaturas =
            await buscarTemperaturasDaCaixa(
                caixaId
            );


        console.log(
            `🌡️ ${temperaturas.length} temperaturas carregadas.`
        );


        console.log(
            "🌡️ Temperaturas:",
            temperaturas
        );


        /* =====================================================
           4. CALCULAR MÉTRICAS
        ===================================================== */

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


        /* =====================================================
           5. MOSTRAR DADOS DA CAIXA
        ===================================================== */

        mostrarDadosCaixa(
            caixa
        );


        /* =====================================================
           6. MOSTRAR SENSOR
        ===================================================== */

        mostrarDadosSensor(
            sensor
        );


        /* =====================================================
           7. MOSTRAR CARDS DE TEMPERATURA
        ===================================================== */

        mostrarCards(
            metricas
        );


        mostrarGraficoTemperatura(
            temperaturas,
            caixa.temperatura_min,
            caixa.temperatura_max
        );

        /* =====================================================
           8. GUARDAR IDs PARA TESTES E MÓDULOS FUTUROS
        ===================================================== */

        dashboardConteudo.dataset.caixaId =
            caixa.id;


        if (sensor) {

            dashboardConteudo.dataset.sensorId =
                sensor.id;

        }


        /* =====================================================
           9. MOSTRAR DASHBOARD
        ===================================================== */

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


iniciarDashboard();