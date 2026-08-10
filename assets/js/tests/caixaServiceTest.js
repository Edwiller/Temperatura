import {
    cadastrarCaixa
} from "../services/caixaService.js";


/**
 * TESTE MANUAL
 *
 * Este teste só executa quando chamarmos:
 *
 * testarCaixaService()
 *
 * no console.
 */
async function testarCaixaService() {

    console.group(
        "TESTE: caixaService.js"
    );


    /*
     * Código único para evitar conflito
     * caso o teste seja executado mais
     * de uma vez.
     */
    const codigoTeste =
        `TESTE-SERVICE-${Date.now()}`;


    const caixaTeste = {

        codigo:
            codigoTeste,

        nome:
            "Caixa criada pelo teste",

        volume_litros:
            30,

        comprimento_cm:
            40,

        largura_cm:
            30,

        altura_cm:
            25,

        quantidade_hemocomponentes:
            5,

        peso_gelo_kg:
            3,

        temperatura_min:
            2,

        temperatura_max:
            8

    };


    console.log(
        "📦 Dados enviados:",
        caixaTeste
    );


    try {

        console.log(
            "🔄 Tentando cadastrar caixa..."
        );


        const caixaCriada =
            await cadastrarCaixa(
                caixaTeste
            );


        console.log(
            "📥 Resposta do Supabase:",
            caixaCriada
        );


        if (
            !caixaCriada
        ) {

            console.error(
                "❌ TESTE FALHOU: nenhuma caixa foi retornada."
            );

            return;

        }


        if (
            !caixaCriada.id
        ) {

            console.error(
                "❌ TESTE FALHOU: caixa criada sem ID."
            );

            return;

        }


        if (
            caixaCriada.codigo !==
            codigoTeste
        ) {

            console.error(
                "❌ TESTE FALHOU: código retornado é diferente."
            );

            return;

        }


        console.log(
            `✅ ID criado: ${caixaCriada.id}`
        );


        console.log(
            `✅ Código: ${caixaCriada.codigo}`
        );


        console.log(
            "✅ TESTE PASSOU: caixa cadastrada no Supabase DEV."
        );


        console.warn(
            "⚠️ Apague esta caixa de teste no SQL Editor após conferir."
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


/*
 * Disponibiliza a função no console,
 * mas NÃO executa automaticamente.
 */
window.testarCaixaService =
    testarCaixaService;


console.log(
    "[TESTE] caixaServiceTest.js pronto."
);


console.log(
    "Execute testarCaixaService() para iniciar o teste."
);