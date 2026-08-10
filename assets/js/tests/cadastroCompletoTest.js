import {
    buscarCaixaPorCodigo
} from "../services/caixaService.js";


import {
    buscarSensorPorCodigo
} from "../services/sensorService.js";



async function verificarCadastroCompleto(
    codigoCaixa,
    codigoSensor
) {

    console.group(
        "TESTE: cadastro completo"
    );


    try {

        console.log(
            `🔎 Buscando caixa ${codigoCaixa}...`
        );


        const caixa =
            await buscarCaixaPorCodigo(
                codigoCaixa
            );


        console.log(
            "Caixa encontrada:",
            caixa
        );


        if (
            !caixa ||
            !caixa.id
        ) {

            console.error(
                "❌ Caixa não encontrada."
            );

            return;

        }


        console.log(
            `✅ Caixa encontrada. ID: ${caixa.id}`
        );


        console.log(
            `🔎 Buscando sensor ${codigoSensor}...`
        );


        const sensor =
            await buscarSensorPorCodigo(
                codigoSensor
            );


        console.log(
            "Sensor encontrado:",
            sensor
        );


        if (
            !sensor
        ) {

            console.error(
                "❌ Sensor não encontrado."
            );

            return;

        }


        if (
            sensor.caixa_id !==
            caixa.id
        ) {

            console.error(
                "❌ TESTE FALHOU:"
            );


            console.error(
                `Sensor aponta para caixa ${sensor.caixa_id}, mas deveria apontar para ${caixa.id}.`
            );

            return;

        }


        console.log(
            "✅ Sensor aponta para a caixa correta."
        );


        console.log(
            "🎉 TESTE PASSOU: cadastro e associação estão corretos."
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


window.verificarCadastroCompleto =
    verificarCadastroCompleto;


console.log(
    "[TESTE] cadastroCompletoTest.js pronto."
);


console.log(
    'Execute verificarCadastroCompleto("CX-001", "ESP-001").'
);