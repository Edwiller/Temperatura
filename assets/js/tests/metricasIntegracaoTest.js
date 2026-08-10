import {
    buscarTemperaturasDaCaixa
} from "../services/temperaturaService.js";


import {
    buscarCaixaPorId
} from "../services/caixaService.js";


import {
    calcularMetricasTemperatura
} from "../utils/metricas.js";


async function testarMetricasIntegracao(
    caixaId
) {

    console.group(
        "TESTE: métricas + Supabase"
    );


    try {

        /* =============================================
           CAIXA
        ============================================= */

        const caixa =
            await buscarCaixaPorId(
                caixaId
            );


        console.log(
            "📦 Caixa:",
            caixa
        );


        /* =============================================
           TEMPERATURAS
        ============================================= */

        const temperaturas =
            await buscarTemperaturasDaCaixa(
                caixaId
            );


        console.log(
            `🌡️ ${temperaturas.length} temperaturas encontradas.`
        );


        /* =============================================
           MÉTRICAS
        ============================================= */

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


        /* =============================================
           TESTES
        ============================================= */

        if (
            metricas.total !==
            temperaturas.length
        ) {

            console.error(
                "❌ Total das métricas não corresponde aos registros."
            );

            return;

        }


        console.log(
            "✅ Total corresponde."
        );


        if (
            metricas.minima >
            metricas.maxima
        ) {

            console.error(
                "❌ Mínima maior que máxima."
            );

            return;

        }


        console.log(
            "✅ Mínima e máxima válidas."
        );


        if (
            metricas.percentualSeguro < 0 ||
            metricas.percentualSeguro > 100
        ) {

            console.error(
                "❌ Percentual seguro inválido."
            );

            return;

        }


        console.log(
            "✅ Percentual seguro válido."
        );


        console.log(
            "🎉 TESTE PASSOU: métricas calculadas com dados reais do DEV."
        );


    } catch (erro) {

        console.error(
            "❌ TESTE FALHOU:",
            erro
        );


    } finally {

        console.groupEnd();

    }

}


window.testarMetricasIntegracao =
    testarMetricasIntegracao;


console.log(
    "[TESTE] metricasIntegracaoTest.js pronto."
);