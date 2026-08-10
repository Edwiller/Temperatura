function esperar(
    tempo
) {

    return new Promise(
        resolve =>
            setTimeout(
                resolve,
                tempo
            )
    );

}


async function testarDashboard() {

    console.group(
        "TESTE: dashboard"
    );


    const limite =
        30;


    for (
        let tentativa = 0;
        tentativa < limite;
        tentativa++
    ) {

        const conteudo =
            document.getElementById(
                "dashboardConteudo"
            );


        if (
            !conteudo.classList.contains(
                "oculto"
            )
        ) {

            const caixaId =
                conteudo.dataset.caixaId;


            const sensorId =
                conteudo.dataset.sensorId;


            if (!caixaId) {

                console.error(
                    "❌ Dashboard sem caixaId."
                );

                console.groupEnd();

                return;

            }


            console.log(
                `✅ Caixa ID: ${caixaId}`
            );


            if (!sensorId) {

                console.error(
                    "❌ Dashboard sem sensorId."
                );

                console.groupEnd();

                return;

            }


            console.log(
                `✅ Sensor ID: ${sensorId}`
            );


            const codigo =
                document
                    .getElementById(
                        "caixaCodigo"
                    )
                    .textContent
                    .trim();


            if (
                codigo === "" ||
                codigo === "-"
            ) {

                console.error(
                    "❌ Código da caixa não foi preenchido."
                );

                console.groupEnd();

                return;

            }


            console.log(
                `✅ Caixa: ${codigo}`
            );


            const sensor =
                document
                    .getElementById(
                        "sensorCodigo"
                    )
                    .textContent
                    .trim();


            if (
                sensor === "" ||
                sensor === "-"
            ) {

                console.error(
                    "❌ Sensor não foi preenchido."
                );

                console.groupEnd();

                return;

            }


            console.log(
                `✅ Sensor: ${sensor}`
            );


            console.log(
                "🎉 TESTE PASSOU: dashboard carregado corretamente."
            );


            console.groupEnd();

            return;

        }


        await esperar(
            100
        );

    }


    console.error(
        "❌ TESTE FALHOU: dashboard não carregou a tempo."
    );


    console.groupEnd();

}


testarDashboard();