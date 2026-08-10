import {
    supabase
} from "../config/supabase.js";


/* =========================================================
   CADASTRAR CAIXA
========================================================= */

export async function cadastrarCaixa(
    caixa
) {

    const {
        data,
        error
    } = await supabase
        .from("caixas")
        .insert({
            codigo:
                caixa.codigo,

            nome:
                caixa.nome,

            volume_litros:
                caixa.volume_litros,

            comprimento_cm:
                caixa.comprimento_cm,

            largura_cm:
                caixa.largura_cm,

            altura_cm:
                caixa.altura_cm,

            quantidade_hemocomponentes:
                caixa.quantidade_hemocomponentes,

            peso_gelo_kg:
                caixa.peso_gelo_kg,

            temperatura_min:
                caixa.temperatura_min,

            temperatura_max:
                caixa.temperatura_max
        })
        .select(`
            id,
            codigo,
            nome,
            volume_litros,
            comprimento_cm,
            largura_cm,
            altura_cm,
            quantidade_hemocomponentes,
            peso_gelo_kg,
            temperatura_min,
            temperatura_max,
            criado_em
        `)
        .single();


    if (error) {

        console.error(
            "[CAIXA SERVICE] Erro ao cadastrar:",
            error
        );

        throw new Error(
            "Não foi possível cadastrar a caixa."
        );

    }


    return data;
}


/* =========================================================
   BUSCAR PELO ID
========================================================= */

export async function buscarCaixaPorId(
    caixaId
) {

    const {
        data,
        error
    } = await supabase
        .from("caixas")
        .select("*")
        .eq(
            "id",
            caixaId
        )
        .single();


    if (error) {

        console.error(
            "[CAIXA SERVICE] Erro ao buscar por ID:",
            error
        );

        throw new Error(
            "Não foi possível encontrar a caixa."
        );

    }


    return data;
}


/* =========================================================
   BUSCAR PELO CÓDIGO
========================================================= */

export async function buscarCaixaPorCodigo(
    codigo
) {

    const {
        data,
        error
    } = await supabase
        .from("caixas")
        .select("*")
        .eq(
            "codigo",
            codigo
        )
        .single();


    if (error) {

        console.error(
            "[CAIXA SERVICE] Erro ao buscar por código:",
            error
        );

        throw new Error(
            "Não foi possível encontrar a caixa."
        );

    }


    return data;
}