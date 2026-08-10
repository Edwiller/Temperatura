/* =========================================================
   MÉTRICAS DE TEMPERATURA
========================================================= */


/**
 * Calcula as principais métricas
 * de uma lista de temperaturas.
 *
 * @param {Array} registros
 * @param {number} temperaturaMin
 * @param {number} temperaturaMax
 *
 * @returns {Object}
 */
export function calcularMetricasTemperatura(
    registros,
    temperaturaMin,
    temperaturaMax
) {

    /* =====================================================
       VALIDAR REGISTROS
    ===================================================== */

    if (
        !Array.isArray(registros)
    ) {

        throw new Error(
            "Os registros de temperatura devem ser uma lista."
        );

    }


    if (
        registros.length === 0
    ) {

        return {
            atual: null,

            minima: null,

            maxima: null,

            media: null,

            total: 0,

            dentroFaixa: 0,

            foraFaixa: 0,

            percentualSeguro: 0
        };

    }


    /* =====================================================
       VALIDAR FAIXA
    ===================================================== */

    temperaturaMin =
        Number(temperaturaMin);


    temperaturaMax =
        Number(temperaturaMax);


    if (
        !Number.isFinite(
            temperaturaMin
        ) ||
        !Number.isFinite(
            temperaturaMax
        )
    ) {

        throw new Error(
            "A faixa de temperatura é inválida."
        );

    }


    if (
        temperaturaMin >=
        temperaturaMax
    ) {

        throw new Error(
            "A temperatura mínima deve ser menor que a máxima."
        );

    }


    /* =====================================================
       FILTRAR VALORES VÁLIDOS
    ===================================================== */

    const registrosValidos =
        registros.filter(
            registro => {

                const valor =
                    Number(
                        registro.valor
                    );


                return Number.isFinite(
                    valor
                );

            }
        );


    if (
        registrosValidos.length === 0
    ) {

        return {
            atual: null,

            minima: null,

            maxima: null,

            media: null,

            total: 0,

            dentroFaixa: 0,

            foraFaixa: 0,

            percentualSeguro: 0
        };

    }


    /* =====================================================
       VALORES
    ===================================================== */

    const valores =
        registrosValidos.map(
            registro =>
                Number(
                    registro.valor
                )
        );


    /* =====================================================
       MÍNIMA
    ===================================================== */

    const minima =
        Math.min(
            ...valores
        );


    /* =====================================================
       MÁXIMA
    ===================================================== */

    const maxima =
        Math.max(
            ...valores
        );


    /* =====================================================
       MÉDIA
    ===================================================== */

    const soma =
        valores.reduce(
            (
                acumulador,
                valor
            ) =>
                acumulador + valor,
            0
        );


    const media =
        soma /
        valores.length;


    /* =====================================================
       DENTRO DA FAIXA
    ===================================================== */

    const dentroFaixa =
        valores.filter(
            valor =>
                valor >=
                temperaturaMin
                &&
                valor <=
                temperaturaMax
        ).length;


    /* =====================================================
       FORA DA FAIXA
    ===================================================== */

    const foraFaixa =
        valores.length -
        dentroFaixa;


    /* =====================================================
       PERCENTUAL SEGURO
    ===================================================== */

    const percentualSeguro =
        (
            dentroFaixa /
            valores.length
        ) * 100;


    /* =====================================================
       TEMPERATURA ATUAL

       Pegamos o registro de data mais recente.
    ===================================================== */

    const registrosOrdenados =
        [...registrosValidos]
            .sort(
                (
                    registroA,
                    registroB
                ) => {

                    return (
                        new Date(
                            registroA.data
                        ) -
                        new Date(
                            registroB.data
                        )
                    );

                }
            );


    const ultimoRegistro =
        registrosOrdenados[
        registrosOrdenados.length - 1
        ];


    const atual =
        Number(
            ultimoRegistro.valor
        );


    /* =====================================================
       RESULTADO
    ===================================================== */

    return {

        atual,

        minima,

        maxima,

        media,

        total:
            valores.length,

        dentroFaixa,

        foraFaixa,

        percentualSeguro

    };

}