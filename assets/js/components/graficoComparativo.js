let graficoComparativo = null;


/* =========================================================
   LIMPAR
========================================================= */

export function limparGraficoComparativo() {

    if (graficoComparativo) {

        graficoComparativo.dispose();

        graficoComparativo = null;

    }


    const container =
        document.getElementById(
            "graficoComparativo"
        );


    if (container) {

        container.innerHTML = "";

        container.dataset.renderizado =
            "false";

    }

}


/* =========================================================
   MOSTRAR GRÁFICO
========================================================= */

export function mostrarGraficoComparativo(
    comparativo
) {

    const container =
        document.getElementById(
            "graficoComparativo"
        );


    if (!container) {

        throw new Error(
            "Container do gráfico comparativo não encontrado."
        );

    }


    if (
        typeof window.echarts ===
        "undefined"
    ) {

        throw new Error(
            "ECharts não foi carregado."
        );

    }


    limparGraficoComparativo();


    graficoComparativo =
        window.echarts.init(
            container
        );


    const configuracao = {

        tooltip: {

            trigger:
                "axis",

            axisPointer: {

                type:
                    "shadow"

            }

        },


        legend: {

            data: [
                "Período A",
                "Período B"
            ]

        },


        grid: {

            left: 40,

            right: 30,

            top: 60,

            bottom: 40,

            containLabel:
                true

        },


        xAxis: {

            type:
                "category",

            data: [
                "Mínima",
                "Média",
                "Máxima"
            ]

        },


        yAxis: {

            type:
                "value",

            name:
                "°C",

            scale:
                true

        },


        series: [

            {

                name:
                    "Período A",

                type:
                    "bar",

                data: [

                    comparativo
                        .minima
                        .periodoA,

                    comparativo
                        .media
                        .periodoA,

                    comparativo
                        .maxima
                        .periodoA

                ]

            },


            {

                name:
                    "Período B",

                type:
                    "bar",

                data: [

                    comparativo
                        .minima
                        .periodoB,

                    comparativo
                        .media
                        .periodoB,

                    comparativo
                        .maxima
                        .periodoB

                ]

            }

        ]

    };


    graficoComparativo.setOption(
        configuracao
    );


    container.dataset.renderizado =
        "true";


    console.log(
        "[COMPARATIVO] Gráfico renderizado."
    );

}


/* =========================================================
   RESPONSIVIDADE
========================================================= */

window.addEventListener(
    "resize",
    () => {

        if (
            graficoComparativo
        ) {

            graficoComparativo.resize();

        }

    }
);