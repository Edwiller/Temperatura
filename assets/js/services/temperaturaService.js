import {
    supabase
} from "../config/supabase.js";


/* =========================================================
   BUSCAR TEMPERATURAS DA CAIXA
========================================================= */

export async function buscarTemperaturasDaCaixa(
    caixaId
) {

    if (
        !Number.isInteger(caixaId) ||
        caixaId <= 0
    ) {

        throw new Error(
            "ID da caixa inválido."
        );

    }


    const {
        data,
        error
    } = await supabase
        .from("temperaturas")
        .select(`
            id,
            valor,
            data,
            caixa_id,
            sensor_id
        `)
        .eq(
            "caixa_id",
            caixaId
        )
        .order(
            "data",
            {
                ascending: true
            }
        );


    if (error) {

        console.error(
            "[TEMPERATURA SERVICE] Erro:",
            error
        );


        throw new Error(
            "Não foi possível carregar as temperaturas."
        );

    }


    return data;
}


/* =========================================================
   BUSCAR ÚLTIMA TEMPERATURA
========================================================= */

export async function buscarUltimaTemperatura(
    caixaId
) {

    if (
        !Number.isInteger(caixaId) ||
        caixaId <= 0
    ) {

        throw new Error(
            "ID da caixa inválido."
        );

    }


    const {
        data,
        error
    } = await supabase
        .from("temperaturas")
        .select(`
            id,
            valor,
            data,
            caixa_id,
            sensor_id
        `)
        .eq(
            "caixa_id",
            caixaId
        )
        .order(
            "data",
            {
                ascending: false
            }
        )
        .limit(1)
        .maybeSingle();


    if (error) {

        console.error(
            "[TEMPERATURA SERVICE] Erro:",
            error
        );


        throw new Error(
            "Não foi possível carregar a última temperatura."
        );

    }


    return data;
}

/* =========================================================
   BUSCAR TEMPERATURAS POR PERÍODO
========================================================= */

export async function buscarTemperaturasPorPeriodo(
    caixaId,
    inicio,
    fim
) {

    if (
        !Number.isInteger(caixaId) ||
        caixaId <= 0
    ) {

        throw new Error(
            "ID da caixa inválido."
        );
    }


    if (
        !inicio ||
        !fim
    ) {

        throw new Error(
            "Período não informado."
        );
    }


    const {
        data,
        error
    } = await supabase
        .from("temperaturas")
        .select(`
            id,
            valor,
            data,
            caixa_id,
            sensor_id
        `)
        .eq(
            "caixa_id",
            caixaId
        )
        .gte(
            "data",
            inicio
        )
        .lte(
            "data",
            fim
        )
        .order(
            "data",
            {
                ascending: true
            }
        );


    if (error) {

        console.error(
            "[TEMPERATURA SERVICE] Erro ao buscar período:",
            error
        );

        throw new Error(
            "Não foi possível carregar as temperaturas do período."
        );
    }


    return data;
}