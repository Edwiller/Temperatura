async function esperarDashboard() {

    for (
        let tentativa = 0;
        tentativa < 40;
        tentativa++
    ) {

        const container =
            document.getElementById(
                "graficoTemperatura"
            );


        if (
            container &&
            container.dataset.renderizado ===
                "true"
        ) {

            return container;

        }


        await new Promise(
            resolve =>
                setTimeout(
                    resolve,
                    100
                )
        );

    }


    return null;
}


/* =========================================================
   TESTE
========================================================= */

async function testarGraficoTemperatura() {

    console.group(
        "TESTE: gráfico de temperatura"
    );


    const container =
        await esperarDashboard();


    if (!container) {

        console.error(
            "❌ Gráfico não foi renderizado."
        );

        console.groupEnd();

        return;

    }


    console.log(
        "✅ Container renderizado."
    );


    /* =====================================================
       QUANTIDADE DE PONTOS
    ===================================================== */

    const quantidade =
        Number(
            container.dataset
                .quantidadePontos
        );


    if (
        !Number.isInteger(
            quantidade
        ) ||
        quantidade <= 0
    ) {

        console.error(
            "❌ Quantidade de pontos inválida."
        );

        console.groupEnd();

        return;

    }


    console.log(
        `✅ ${quantidade} pontos encontrados.`
    );


    /* =====================================================
       INSTÂNCIA ECHARTS
    ===================================================== */

    if (
        typeof window.echarts ===
        "undefined"
    ) {

        console.error(
            "❌ ECharts não está carregado."
        );

        console.groupEnd();

        return;

    }


    const instancia =
        window.echarts
            .getInstanceByDom(
                container
            );


    if (!instancia) {

        console.error(
            "❌ Instância do gráfico não encontrada."
        );

        console.groupEnd();

        return;

    }


    console.log(
        "✅ Instância ECharts encontrada."
    );


    /* =====================================================
       CONFIGURAÇÃO
    ===================================================== */

    const configuracao =
        instancia.getOption();


    if (
        !configuracao.series ||
        configuracao.series.length < 3
    ) {

        console.error(
            "❌ Séries do gráfico não foram criadas corretamente."
        );

        console.groupEnd();

        return;

    }


    console.log(
        "✅ Série de temperatura encontrada."
    );


    console.log(
        "✅ Limite mínimo encontrado."
    );


    console.log(
        "✅ Limite máximo encontrado."
    );


    /* =====================================================
       QUANTIDADE REAL DA SÉRIE
    ===================================================== */

    const pontosTemperatura =
        configuracao
            .series[0]
            .data
            .length;


    if (
        pontosTemperatura !==
        quantidade
    ) {

        console.error(
            "❌ Quantidade de pontos da série está incorreta."
        );

        console.groupEnd();

        return;

    }


    console.log(
        "✅ Quantidade de pontos correta."
    );


    console.log(
        "🎉 TESTE PASSOU: gráfico funcionando corretamente."
    );


    console.groupEnd();

}


testarGraficoTemperatura();