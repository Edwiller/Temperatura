import {
    compararMetricas
} from "../utils/comparativo.js";


console.group(
    "TESTE: comparativo.js"
);


function aproximadamente(
    valor,
    esperado
) {

    return (
        Math.abs(
            valor - esperado
        ) < 0.0001
    );

}


function testar(
    descricao,
    condicao
) {

    if (condicao) {

        console.log(
            `✅ ${descricao}`
        );

    } else {

        console.error(
            `❌ ${descricao}`
        );

    }

}


/* =========================================================
   PERÍODO A
========================================================= */

const metricasA = {

    minima: 4.8,
    media: 5.4,
    maxima: 6.0,

    total: 10,

    percentualSeguro: 90

};


/* =========================================================
   PERÍODO B
========================================================= */

const metricasB = {

    minima: 5.1,
    media: 6.1,
    maxima: 7.2,

    total: 12,

    percentualSeguro: 75

};


/* =========================================================
   COMPARAÇÃO
========================================================= */

const resultado =
    compararMetricas(
        metricasA,
        metricasB
    );


console.log(
    "Resultado:",
    resultado
);


testar(
    "Mínima A = 4.8",
    aproximadamente(
        resultado.minima.periodoA,
        4.8
    )
);


testar(
    "Mínima B = 5.1",
    aproximadamente(
        resultado.minima.periodoB,
        5.1
    )
);


testar(
    "Diferença mínima = +0.3",
    aproximadamente(
        resultado.minima.diferenca,
        0.3
    )
);


testar(
    "Diferença média = +0.7",
    aproximadamente(
        resultado.media.diferenca,
        0.7
    )
);


testar(
    "Diferença máxima = +1.2",
    aproximadamente(
        resultado.maxima.diferenca,
        1.2
    )
);


testar(
    "Registros A = 10",
    resultado.registros.periodoA === 10
);


testar(
    "Registros B = 12",
    resultado.registros.periodoB === 12
);


testar(
    "Segurança caiu 15 pontos percentuais",
    aproximadamente(
        resultado
            .percentualSeguro
            .diferenca,
        -15
    )
);


console.log(
    "🏁 Teste de comparativo concluído."
);


console.groupEnd();