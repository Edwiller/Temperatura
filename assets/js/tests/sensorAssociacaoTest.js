import {

    buscarSensorPorCodigo,
    associarSensorCaixa,
    liberarSensor

} from "../services/sensorService.js";



async function testarAssociacaoSensor(
    caixaId
) {

    console.group(
        "TESTE: associação sensor → caixa"
    );


    try {

        /* =============================================
           VALIDAR ID DA CAIXA
        ============================================= */

        if (
            !Number.isInteger(caixaId) ||
            caixaId <= 0
        ) {

            console.error(
                "❌ Informe um ID de caixa válido."
            );

            console.groupEnd();

            return;
        }



        /* =============================================
           1 - BUSCAR SENSOR
        ============================================= */

        console.log(
            "🔎 Buscando ESP-001..."
        );


        const sensor =
            await buscarSensorPorCodigo(
                "ESP-001"
            );


        console.log(
            "Sensor encontrado:",
            sensor
        );


        if (!sensor) {

            console.error(
                "❌ ESP-001 não encontrado."
            );

            return;
        }


        if (
            sensor.caixa_id !== null
        ) {

            console.error(
                "❌ TESTE CANCELADO:"
            );

            console.error(
                `ESP-001 já está associado à caixa ${sensor.caixa_id}.`
            );

            return;
        }


        console.log(
            "✅ ESP-001 está disponível."
        );



        /* =============================================
           2 - ASSOCIAR
        ============================================= */

        console.log(
            `🔄 Associando ESP-001 à caixa ${caixaId}...`
        );


        const sensorAssociado =
            await associarSensorCaixa(
                sensor.id,
                caixaId
            );


        console.log(
            "Resultado:",
            sensorAssociado
        );


        if (
            sensorAssociado.caixa_id !==
            caixaId
        ) {

            console.error(
                "❌ TESTE FALHOU:"
            );

            console.error(
                "O caixa_id retornado é diferente do esperado."
            );

            return;
        }


        console.log(
            `✅ ESP-001 associado à caixa ${caixaId}.`
        );



        /* =============================================
           3 - CONSULTAR NOVAMENTE
        ============================================= */

        const sensorConfirmacao =
            await buscarSensorPorCodigo(
                "ESP-001"
            );


        if (
            sensorConfirmacao.caixa_id !==
            caixaId
        ) {

            console.error(
                "❌ TESTE FALHOU:"
            );

            console.error(
                "Consulta posterior não confirmou a associação."
            );

            return;
        }


        console.log(
            "✅ Associação confirmada por nova consulta."
        );



        /* =============================================
           4 - LIBERAR SENSOR
        ============================================= */

        console.log(
            "🔄 Liberando ESP-001 novamente..."
        );


        const sensorLiberado =
            await liberarSensor(
                sensor.id
            );


        console.log(
            "Resultado:",
            sensorLiberado
        );


        if (
            sensorLiberado.caixa_id !==
            null
        ) {

            console.error(
                "❌ TESTE FALHOU:"
            );

            console.error(
                "Sensor continua associado."
            );

            return;
        }


        console.log(
            "✅ ESP-001 liberado."
        );



        /* =============================================
           5 - CONFIRMAÇÃO FINAL
        ============================================= */

        const sensorFinal =
            await buscarSensorPorCodigo(
                "ESP-001"
            );


        if (
            sensorFinal.caixa_id !== null
        ) {

            console.error(
                "❌ TESTE FALHOU:"
            );

            console.error(
                "Banco ainda possui caixa_id."
            );

            return;
        }


        console.log(
            "✅ Banco confirmou caixa_id = NULL."
        );


        console.log(
            "🎉 TESTE PASSOU COMPLETAMENTE."
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



/* =========================================================
   DISPONIBILIZAR TESTE NO CONSOLE
========================================================= */

window.testarAssociacaoSensor =
    testarAssociacaoSensor;


console.log(
    "[TESTE] sensorAssociacaoTest.js pronto."
);


console.log(
    "Execute testarAssociacaoSensor(ID_DA_CAIXA)."
);