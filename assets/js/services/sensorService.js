import {
    supabase
} from "../config/supabase.js";


/* =========================================================
   LISTAR SENSORES DISPONÍVEIS
========================================================= */

export async function listarSensoresDisponiveis() {

    const {
        data,
        error
    } = await supabase
        .from("sensores")
        .select(`
            id,
            codigo,
            nome,
            ativo,
            caixa_id
        `)
        .eq(
            "ativo",
            true
        )
        .is(
            "caixa_id",
            null
        )
        .order(
            "codigo",
            {
                ascending: true
            }
        );


    if (error) {

        console.error(
            "[SENSOR SERVICE] Erro ao buscar sensores:",
            error
        );

        throw new Error(
            "Não foi possível buscar os sensores."
        );
    }


    return data;
}



/* =========================================================
   BUSCAR SENSOR PELO CÓDIGO
========================================================= */

export async function buscarSensorPorCodigo(
    codigo
) {

    const {
        data,
        error
    } = await supabase
        .from("sensores")
        .select(`
            id,
            codigo,
            nome,
            ativo,
            caixa_id
        `)
        .eq(
            "codigo",
            codigo
        )
        .single();


    if (error) {

        console.error(
            "[SENSOR SERVICE] Erro ao buscar sensor:",
            error
        );

        throw new Error(
            "Não foi possível encontrar o sensor."
        );
    }


    return data;
}



/* =========================================================
   ASSOCIAR SENSOR A UMA CAIXA
========================================================= */

export async function associarSensorCaixa(
    sensorId,
    caixaId
) {

    const {
        data,
        error
    } = await supabase
        .from("sensores")
        .update({
            caixa_id: caixaId
        })
        .eq(
            "id",
            sensorId
        )
        .select(`
            id,
            codigo,
            nome,
            ativo,
            caixa_id
        `)
        .single();


    if (error) {

        console.error(
            "[SENSOR SERVICE] Erro ao associar sensor:",
            error
        );

        throw new Error(
            "Não foi possível associar o sensor à caixa."
        );
    }


    return data;
}



/* =========================================================
   LIBERAR SENSOR
========================================================= */

export async function liberarSensor(
    sensorId
) {

    const {
        data,
        error
    } = await supabase
        .from("sensores")
        .update({
            caixa_id: null
        })
        .eq(
            "id",
            sensorId
        )
        .select(`
            id,
            codigo,
            nome,
            ativo,
            caixa_id
        `)
        .single();


    if (error) {

        console.error(
            "[SENSOR SERVICE] Erro ao liberar sensor:",
            error
        );

        throw new Error(
            "Não foi possível liberar o sensor."
        );
    }


    return data;
}

/* =========================================================
   BUSCAR SENSOR PELA CAIXA
========================================================= */

export async function buscarSensorPorCaixa(
    caixaId
) {

    const {
        data,
        error
    } = await supabase
        .from("sensores")
        .select(`
            id,
            codigo,
            nome,
            ativo,
            caixa_id
        `)
        .eq(
            "caixa_id",
            caixaId
        )
        .maybeSingle();


    if (error) {

        console.error(
            "[SENSOR SERVICE] Erro ao buscar sensor da caixa:",
            error
        );

        throw new Error(
            "Não foi possível carregar o sensor da caixa."
        );

    }


    return data;
}