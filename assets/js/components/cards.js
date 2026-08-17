/* =========================================================
   FORMATAÇÃO
========================================================= */

function formatarTemperatura(valor) {

    if (
        valor === null ||
        valor === undefined ||
        !Number.isFinite(Number(valor))
    ) {
        return "--";
    }

    return Number(valor)
        .toLocaleString(
            "pt-BR",
            {
                minimumFractionDigits: 1,
                maximumFractionDigits: 2
            }
        );
}


function formatarPercentual(valor) {

    if (
        valor === null ||
        valor === undefined ||
        !Number.isFinite(Number(valor))
    ) {
        return "--";
    }

    return Number(valor)
        .toLocaleString(
            "pt-BR",
            {
                minimumFractionDigits: 0,
                maximumFractionDigits: 1
            }
        );
}


/* =========================================================
   AUXILIAR
========================================================= */

function definirTexto(id, texto) {

    const elemento =
        document.getElementById(id);

    if (!elemento) {

        console.warn(
            `[CARDS] Elemento #${id} não encontrado.`
        );

        return;
    }

    elemento.textContent = texto;
}


/* =========================================================
   MOSTRAR MÉTRICAS
========================================================= */

export function mostrarCards(metricas) {

    if (!metricas) {

        throw new Error(
            "Métricas não informadas."
        );
    }


    definirTexto(
        "metricaAtual",
        `${formatarTemperatura(metricas.atual)} °C`
    );


    definirTexto(
        "metricaMinima",
        `${formatarTemperatura(metricas.minima)} °C`
    );


    definirTexto(
        "metricaMaxima",
        `${formatarTemperatura(metricas.maxima)} °C`
    );


    definirTexto(
        "metricaMedia",
        `${formatarTemperatura(metricas.media)} °C`
    );


    definirTexto(
        "metricaTotal",
        metricas.total
    );


    definirTexto(
        "metricaDentroFaixa",
        metricas.dentroFaixa
    );


    definirTexto(
        "metricaForaFaixa",
        metricas.foraFaixa
    );


    definirTexto(
        "metricaPercentualSeguro",
        `${formatarPercentual(
            metricas.percentualSeguro
        )}%`
    );


    atualizarStatusTemperatura(
        metricas
    );
}


/* =========================================================
   STATUS
========================================================= */

function atualizarStatusTemperatura(
    metricas
) {

    const status =
        document.getElementById(
            "statusTemperatura"
        );


    if (!status) {
        return;
    }


    status.className =
        "status-temperatura";


    if (
        metricas.total === 0 ||
        metricas.atual === null
    ) {

        status.textContent =
            "Sem dados";

        status.classList.add(
            "status-sem-dados"
        );

        return;
    }


    if (
        metricas.foraFaixa === 0
    ) {

        status.textContent =
            "Temperatura dentro da faixa";

        status.classList.add(
            "status-seguro"
        );

        return;
    }


    status.textContent =
        "Foram detectadas temperaturas fora da faixa";

    status.classList.add(
        "status-alerta"
    );
}