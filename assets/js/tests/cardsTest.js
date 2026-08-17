function testarValor(
    id
) {

    const elemento =
        document.getElementById(id);


    if (!elemento) {

        console.error(
            `❌ #${id} não existe.`
        );

        return false;
    }


    const valor =
        elemento
            .textContent
            .trim();


    if (
        valor === "" ||
        valor === "--"
    ) {

        console.error(
            `❌ #${id} não foi preenchido.`
        );

        return false;
    }


    console.log(
        `✅ ${id}: ${valor}`
    );


    return true;
}


async function testarCards() {

    console.group(
        "TESTE: cards"
    );


    /*
     * Esperar dashboard carregar.
     */

    for (
        let tentativa = 0;
        tentativa < 30;
        tentativa++
    ) {

        const conteudo =
            document.getElementById(
                "dashboardConteudo"
            );


        if (
            conteudo &&
            !conteudo.classList.contains(
                "oculto"
            )
        ) {

            break;
        }


        await new Promise(
            resolve =>
                setTimeout(
                    resolve,
                    100
                )
        );
    }


    const ids = [

        "metricaAtual",
        "metricaMinima",
        "metricaMaxima",
        "metricaMedia",
        "metricaTotal",
        "metricaDentroFaixa",
        "metricaForaFaixa",
        "metricaPercentualSeguro"

    ];


    const resultados =
        ids.map(
            testarValor
        );


    if (
        resultados.every(
            resultado =>
                resultado
        )
    ) {

        console.log(
            "🎉 TESTE PASSOU: cards preenchidos."
        );

    } else {

        console.error(
            "❌ TESTE DOS CARDS FALHOU."
        );

    }


    console.groupEnd();
}


testarCards();