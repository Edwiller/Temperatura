import {

    buscarTemperaturasDaCaixa,
    buscarUltimaTemperatura

} from "../services/temperaturaService.js";


async function testarTemperaturaService(
    caixaId
) {

    console.group(
        "TESTE: temperaturaService.js"
    );


    try {

        /* =============================================
           VALIDAR ID
        ============================================= */

        if (
            !Number.isInteger(caixaId) ||
            caixaId <= 0
        ) {

            console.error(
                "❌ Informe um caixaId válido."
            );

            return;

        }


        /* =============================================
           BUSCAR TODAS
        ============================================= */

        console.log(
            `🔎 Buscando temperaturas da caixa ${caixaId}...`
        );


        const temperaturas =
            await buscarTemperaturasDaCaixa(
                caixaId
            );


        console.log(
            "Resposta:",
            temperaturas
        );


        if (
            !Array.isArray(
                temperaturas
            )
        ) {

            console.error(
                "❌ A resposta não é um array."
            );

            return;

        }


        if (
            temperaturas.length === 0
        ) {

            console.error(
                "❌ Nenhuma temperatura encontrada."
            );

            return;

        }


        console.log(
            `✅ ${temperaturas.length} temperatura(s) encontrada(s).`
        );


        /* =============================================
           GARANTIR QUE TODAS SÃO DA MESMA CAIXA
        ============================================= */

        const todasDaCaixa =
            temperaturas.every(
                temperatura =>
                    Number(
                        temperatura.caixa_id
                    ) === caixaId
            );


        if (
            !todasDaCaixa
        ) {

            console.error(
                "❌ TESTE FALHOU:"
            );

            console.error(
                "Foram retornadas temperaturas de outra caixa."
            );

            return;

        }


        console.log(
            "✅ Todas as temperaturas pertencem à caixa correta."
        );


        /* =============================================
           ORDEM DAS DATAS
        ============================================= */

        let ordenado = true;


        for (
            let i = 1;
            i < temperaturas.length;
            i++
        ) {

            const anterior =
                new Date(
                    temperaturas[i - 1].data
                );


            const atual =
                new Date(
                    temperaturas[i].data
                );


            if (
                atual < anterior
            ) {

                ordenado = false;

                break;

            }

        }


        if (
            !ordenado
        ) {

            console.error(
                "❌ Temperaturas não estão ordenadas por data."
            );

            return;

        }


        console.log(
            "✅ Temperaturas ordenadas por data."
        );


        /* =============================================
           ÚLTIMA TEMPERATURA
        ============================================= */

        const ultima =
            await buscarUltimaTemperatura(
                caixaId
            );


        console.log(
            "Última temperatura:",
            ultima
        );


        if (!ultima) {

            console.error(
                "❌ Última temperatura não encontrada."
            );

            return;

        }


        const ultimaDaLista =
            temperaturas[
                temperaturas.length - 1
            ];


        if (
            ultima.id !==
            ultimaDaLista.id
        ) {

            console.error(
                "❌ TESTE FALHOU:"
            );

            console.error(
                "buscarUltimaTemperatura() retornou registro diferente."
            );

            return;

        }


        console.log(
            `✅ Última temperatura: ${ultima.valor} °C`
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



window.testarTemperaturaService =
    testarTemperaturaService;


console.log(
    "[TESTE] temperaturaServiceTest.js pronto."
);


console.log(
    "Execute testarTemperaturaService(ID_DA_CAIXA)."
);