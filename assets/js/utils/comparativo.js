/* =========================================================
   DIFERENÇA
========================================================= */

function calcularDiferenca(
    valorA,
    valorB
) {

    if (
        valorA === null ||
        valorB === null ||
        valorA === undefined ||
        valorB === undefined
    ) {

        return null;

    }


    return (
        Number(valorB) -
        Number(valorA)
    );
}


/* =========================================================
   COMPARAR MÉTRICAS
========================================================= */

export function compararMetricas(
    metricasA,
    metricasB
) {

    if (
        !metricasA ||
        !metricasB
    ) {

        throw new Error(
            "As métricas dos dois períodos são obrigatórias."
        );

    }


    return {

        minima: {

            periodoA:
                metricasA.minima,

            periodoB:
                metricasB.minima,

            diferenca:
                calcularDiferenca(
                    metricasA.minima,
                    metricasB.minima
                )

        },


        media: {

            periodoA:
                metricasA.media,

            periodoB:
                metricasB.media,

            diferenca:
                calcularDiferenca(
                    metricasA.media,
                    metricasB.media
                )

        },


        maxima: {

            periodoA:
                metricasA.maxima,

            periodoB:
                metricasB.maxima,

            diferenca:
                calcularDiferenca(
                    metricasA.maxima,
                    metricasB.maxima
                )

        },


        registros: {

            periodoA:
                metricasA.total,

            periodoB:
                metricasB.total

        },


        percentualSeguro: {

            periodoA:
                metricasA.percentualSeguro,

            periodoB:
                metricasB.percentualSeguro,

            diferenca:
                calcularDiferenca(
                    metricasA.percentualSeguro,
                    metricasB.percentualSeguro
                )

        }

    };

}