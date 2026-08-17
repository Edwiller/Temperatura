    let grafico = null;


    /* =========================================================
    FORMATAR DATA/HORA
    ========================================================= */

    function formatarHorario(data) {

        const objetoData =
            new Date(data);


        if (
            Number.isNaN(
                objetoData.getTime()
            )
        ) {

            return "--:--";

        }


        return objetoData
            .toLocaleTimeString(
                "pt-BR",
                {
                    hour: "2-digit",
                    minute: "2-digit"
                }
            );
    }


    /* =========================================================
    FORMATAR DATA COMPLETA
    ========================================================= */

    function formatarDataCompleta(data) {

        const objetoData =
            new Date(data);


        if (
            Number.isNaN(
                objetoData.getTime()
            )
        ) {

            return "Data inválida";

        }


        return objetoData
            .toLocaleString(
                "pt-BR"
            );
    }


    /* =========================================================
    DESTRUIR GRÁFICO
    ========================================================= */

    function destruirGrafico() {

        if (grafico) {

            grafico.dispose();

            grafico = null;

        }

    }


    /* =========================================================
    SEM DADOS
    ========================================================= */

    function mostrarSemDados(
        container
    ) {

        destruirGrafico();


        container.innerHTML = `
            <div class="grafico-sem-dados">
                Nenhuma temperatura registrada
                para esta caixa.
            </div>
        `;


        container.dataset.renderizado =
            "false";


        container.dataset.quantidadePontos =
            "0";
    }


    /* =========================================================
    MOSTRAR GRÁFICO
    ========================================================= */

    export function mostrarGraficoTemperatura(
        registros,
        temperaturaMin,
        temperaturaMax
    ) {

        const container =
            document.getElementById(
                "graficoTemperatura"
            );


        if (!container) {

            throw new Error(
                "Container do gráfico não encontrado."
            );

        }


        if (
            !Array.isArray(registros) ||
            registros.length === 0
        ) {

            mostrarSemDados(
                container
            );

            return;

        }


        if (
            typeof window.echarts ===
            "undefined"
        ) {

            throw new Error(
                "ECharts não foi carregado."
            );

        }


        /* =====================================================
        PREPARAR DADOS
        ===================================================== */

        const registrosValidos =
            registros
                .filter(
                    registro =>
                        Number.isFinite(
                            Number(
                                registro.valor
                            )
                        )
                )
                .sort(
                    (
                        registroA,
                        registroB
                    ) =>
                        new Date(
                            registroA.data
                        ) -
                        new Date(
                            registroB.data
                        )
                );


        if (
            registrosValidos.length === 0
        ) {

            mostrarSemDados(
                container
            );

            return;

        }


        const horarios =
            registrosValidos.map(
                registro =>
                    formatarHorario(
                        registro.data
                    )
            );


        const valores =
            registrosValidos.map(
                registro =>
                    Number(
                        registro.valor
                    )
            );


        const datasCompletas =
            registrosValidos.map(
                registro =>
                    formatarDataCompleta(
                        registro.data
                    )
            );


        const minimo =
            Number(
                temperaturaMin
            );


        const maximo =
            Number(
                temperaturaMax
            );


        /* =====================================================
        LIMPAR CONTAINER
        ===================================================== */

        container.innerHTML = "";


        destruirGrafico();


        /* =====================================================
        CRIAR INSTÂNCIA
        ===================================================== */

        grafico =
            window.echarts.init(
                container
            );


        /* =====================================================
        CONFIGURAÇÃO
        ===================================================== */

        const configuracao = {

            tooltip: {

                trigger: "axis",

                formatter:
                    function (parametros) {

                        const indice =
                            parametros[0]
                                .dataIndex;


                        const temperatura =
                            valores[
                                indice
                            ];


                        const data =
                            datasCompletas[
                                indice
                            ];


                        return `
                            <strong>
                                ${data}
                            </strong>

                            <br>

                            Temperatura:
                            <strong>
                                ${temperatura.toLocaleString(
                                    "pt-BR",
                                    {
                                        minimumFractionDigits: 1,
                                        maximumFractionDigits: 2
                                    }
                                )} °C
                            </strong>
                        `;

                    }

            },


            legend: {

                data: [
                    "Temperatura",
                    "Limite mínimo",
                    "Limite máximo"
                ],

                bottom: 0

            },


            grid: {

                left: 50,

                right: 30,

                top: 30,

                bottom: 70,

                containLabel: true

            },


            xAxis: {

                type: "category",

                boundaryGap: false,

                data: horarios,

                axisLabel: {

                    hideOverlap: true

                }

            },


            yAxis: {

                type: "value",

                name: "°C",

                scale: true

            },


            series: [

                /* =========================================
                TEMPERATURA
                ========================================= */

                {

                    name:
                        "Temperatura",

                    type:
                        "line",

                    data:
                        valores,

                    smooth:
                        true,

                    symbol:
                        "circle",

                    symbolSize:
                        7,

                    connectNulls:
                        false

                },


                /* =========================================
                LIMITE MÍNIMO
                ========================================= */

                {

                    name:
                        "Limite mínimo",

                    type:
                        "line",

                    data:
                        valores.map(
                            () =>
                                minimo
                        ),

                    symbol:
                        "none",

                    lineStyle: {

                        type:
                            "dashed",

                        width:
                            1

                    }

                },


                /* =========================================
                LIMITE MÁXIMO
                ========================================= */

                {

                    name:
                        "Limite máximo",

                    type:
                        "line",

                    data:
                        valores.map(
                            () =>
                                maximo
                        ),

                    symbol:
                        "none",

                    lineStyle: {

                        type:
                            "dashed",

                        width:
                            1

                    }

                }

            ]

        };


        /* =====================================================
        RENDERIZAR
        ===================================================== */

        grafico.setOption(
            configuracao
        );


        /* =====================================================
        INFORMAÇÕES PARA TESTES
        ===================================================== */

        container.dataset.renderizado =
            "true";


        container.dataset.quantidadePontos =
            registrosValidos.length;


        console.log(
            `[GRÁFICO] ${registrosValidos.length} pontos renderizados.`
        );

    }


    /* =========================================================
    RESPONSIVIDADE
    ========================================================= */

    window.addEventListener(
        "resize",
        () => {

            if (grafico) {

                grafico.resize();

            }

        }
    );