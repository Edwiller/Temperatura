/* =========================================================
   VALIDAÇÕES DA CAIXA
========================================================= */


/**
 * Verifica se um texto está vazio.
 */
export function textoVazio(valor) {

    return (
        valor === null ||
        valor === undefined ||
        String(valor).trim() === ""
    );

}


/**
 * Verifica se um número é válido.
 */
export function numeroValido(valor) {

    return (
        typeof valor === "number" &&
        Number.isFinite(valor)
    );

}


/**
 * Valida todos os dados necessários
 * para o cadastro de uma caixa.
 *
 * Retorna:
 *
 * {
 *    valido: true/false,
 *    mensagem: "..."
 * }
 */
export function validarCaixa(
    caixa,
    sensorId
) {

    if (textoVazio(caixa.codigo)) {

        return {
            valido: false,
            mensagem:
                "Informe o código da caixa."
        };

    }


    if (textoVazio(caixa.nome)) {

        return {
            valido: false,
            mensagem:
                "Informe o nome da caixa."
        };

    }


    if (
        !numeroValido(caixa.volume_litros) ||
        caixa.volume_litros <= 0
    ) {

        return {
            valido: false,
            mensagem:
                "O volume deve ser maior que zero."
        };

    }


    if (
        !numeroValido(
            caixa.quantidade_hemocomponentes
        ) ||
        caixa.quantidade_hemocomponentes < 0
    ) {

        return {
            valido: false,
            mensagem:
                "A quantidade de hemocomponentes não pode ser negativa."
        };

    }


    if (
        !Number.isInteger(
            caixa.quantidade_hemocomponentes
        )
    ) {

        return {
            valido: false,
            mensagem:
                "A quantidade de hemocomponentes deve ser um número inteiro."
        };

    }


    if (
        !numeroValido(caixa.peso_gelo_kg) ||
        caixa.peso_gelo_kg < 0
    ) {

        return {
            valido: false,
            mensagem:
                "O peso do gelo não pode ser negativo."
        };

    }


    if (
        !numeroValido(caixa.temperatura_min)
    ) {

        return {
            valido: false,
            mensagem:
                "Informe a temperatura mínima."
        };

    }


    if (
        !numeroValido(caixa.temperatura_max)
    ) {

        return {
            valido: false,
            mensagem:
                "Informe a temperatura máxima."
        };

    }


    if (
        caixa.temperatura_min >=
        caixa.temperatura_max
    ) {

        return {
            valido: false,
            mensagem:
                "A temperatura mínima deve ser menor que a temperatura máxima."
        };

    }


    if (
        !sensorId ||
        !Number.isInteger(sensorId) ||
        sensorId <= 0
    ) {

        return {
            valido: false,
            mensagem:
                "Selecione um sensor."
        };

    }


    return {
        valido: true,
        mensagem:
            "Dados válidos."
    };

}