/* =========================================================
   TESTE DE INTEGRAÇÃO
   sensorService → cadastro.js → select
========================================================= */


function esperar(
    milissegundos
) {

    return new Promise(
        resolve =>
            setTimeout(
                resolve,
                milissegundos
            )
    );

}



async function aguardarCarregamentoSensor() {

    const limiteTentativas = 30;


    for (
        let tentativa = 0;
        tentativa < limiteTentativas;
        tentativa++
    ) {

        const select =
            document.getElementById("sensor");


        const esp001 =
            Array
                .from(select.options)
                .find(
                    option =>
                        option.textContent.includes(
                            "ESP-001"
                        )
                );


        if (esp001) {

            return esp001;

        }


        await esperar(100);

    }


    return null;
}



async function testarSelectSensor() {

    console.group(
        "TESTE: integração do select de sensores"
    );


    const esp001 =
        await aguardarCarregamentoSensor();


    if (!esp001) {

        console.error(
            "❌ TESTE FALHOU: ESP-001 não apareceu no select."
        );

        console.groupEnd();

        return;

    }


    console.log(
        "✅ ESP-001 apareceu no select."
    );


    if (!esp001.value) {

        console.error(
            "❌ TESTE FALHOU: opção do sensor não possui ID."
        );

        console.groupEnd();

        return;

    }


    console.log(
        `✅ ID do sensor: ${esp001.value}`
    );


    const carregando =
        document.getElementById(
            "sensorCarregando"
        );


    if (
        !carregando.classList.contains(
            "oculto"
        )
    ) {

        console.error(
            "❌ TESTE FALHOU: indicador de carregamento continua visível."
        );

        console.groupEnd();

        return;

    }


    console.log(
        "✅ Indicador de carregamento foi escondido."
    );


    const container =
        document.getElementById(
            "sensorContainer"
        );


    if (
        container.classList.contains(
            "oculto"
        )
    ) {

        console.error(
            "❌ TESTE FALHOU: select continua oculto."
        );

        console.groupEnd();

        return;

    }


    console.log(
        "✅ Select está visível."
    );


    console.log(
        "✅ TESTE PASSOU: sensor carregado corretamente na interface."
    );


    console.groupEnd();

}


testarSelectSensor();