/* =========================================================
   ÚLTIMAS HORAS
========================================================= */

export function horasAtras(
    quantidade
) {

    const data =
        new Date();

    data.setHours(
        data.getHours() - quantidade
    );

    return data.toISOString();
}


/* =========================================================
   INÍCIO DO DIA ATUAL
========================================================= */

export function inicioDoDiaAtual() {

    const data =
        new Date();

    data.setHours(
        0,
        0,
        0,
        0
    );

    return data.toISOString();
}


/* =========================================================
   AGORA
========================================================= */

export function agora() {

    return new Date()
        .toISOString();
}


/* =========================================================
   DATETIME-LOCAL → ISO
========================================================= */

export function converterDataLocalParaISO(
    valor
) {

    if (!valor) {
        return null;
    }


    const data =
        new Date(valor);


    if (
        Number.isNaN(
            data.getTime()
        )
    ) {

        return null;
    }


    return data.toISOString();
}


/* =========================================================
   VALIDAR PERÍODO
========================================================= */

export function validarPeriodo(
    inicio,
    fim
) {

    if (
        !inicio ||
        !fim
    ) {

        return {
            valido: false,
            mensagem:
                "Informe a data inicial e a data final."
        };
    }


    const dataInicio =
        new Date(inicio);


    const dataFim =
        new Date(fim);


    if (
        Number.isNaN(
            dataInicio.getTime()
        ) ||
        Number.isNaN(
            dataFim.getTime()
        )
    ) {

        return {
            valido: false,
            mensagem:
                "Período inválido."
        };
    }


    if (
        dataInicio >=
        dataFim
    ) {

        return {
            valido: false,
            mensagem:
                "A data inicial deve ser anterior à data final."
        };
    }


    return {
        valido: true,
        mensagem: ""
    };
}