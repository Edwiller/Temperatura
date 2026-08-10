import {
    listarSensoresDisponiveis
} from "../services/sensorService.js";


async function testarSensorService() {

    console.group(
        "TESTE: sensorService.js"
    );


    try {

        console.log(
            "🔄 Buscando sensores no Supabase DEV..."
        );


        const sensores =
            await listarSensoresDisponiveis();


        console.log(
            "Resposta recebida:",
            sensores
        );


        if (!Array.isArray(sensores)) {

            console.error(
                "❌ TESTE FALHOU: " +
                "a resposta não é uma lista."
            );

            return;
        }


        console.log(
            `📦 ${sensores.length} sensor(es) disponível(is).`
        );


        if (sensores.length === 0) {

            console.warn(
                "⚠️ A conexão funcionou, " +
                "mas nenhum sensor disponível foi encontrado."
            );

            console.warn(
                "Verifique se ESP-001 possui " +
                "ativo = true e caixa_id = NULL."
            );

            return;
        }


        sensores.forEach(
            sensor => {

                console.log(
                    `✅ ${sensor.codigo}`,
                    sensor
                );

            }
        );


        const esp001 =
            sensores.find(
                sensor =>
                    sensor.codigo === "ESP-001"
            );


        if (!esp001) {

            console.warn(
                "⚠️ Consulta funcionou, " +
                "mas ESP-001 não foi encontrado."
            );

            return;
        }


        console.log(
            "✅ TESTE PASSOU:"
        );


        console.log(
            "ESP-001 foi encontrado no Temperatura-DEV."
        );


    } catch (erro) {

        console.error(
            "❌ TESTE FALHOU:"
        );


        console.error(
            erro
        );


    } finally {

        console.groupEnd();

    }

}


testarSensorService();