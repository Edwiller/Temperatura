import {
    obterSupabase
} from "../config/supabase.js?v=fluxo-sessao-1";

export async function listarNomesSensores() {
    const supabase = await obterSupabase();
    const { data, error } = await supabase.from("sensores").select("id,codigo,nome");
    if (error) throw new Error("Não foi possível carregar os nomes dos sensores.");
    return data;
}

export async function alterarVinculoSensor(sensorId, caixaId, caixaAnterior = null) {
    const supabase = await obterSupabase();
    const { error } = await supabase.rpc("alterar_vinculo_sensor", {
        p_sensor: sensorId, p_caixa: caixaId, p_caixa_anterior: caixaAnterior
    });
    if (error?.code === "P0001" || error?.code === "42501") throw new Error(error.message);
    if (error?.code === "23505") throw new Error("A caixa escolhida já tem um sensor.");
    if (error) throw new Error("Não foi possível alterar o vínculo do sensor.");
}


/* =========================================================
   LISTAR SENSORES DISPONÍVEIS
========================================================= */

export async function listarSensoresDisponiveis() {

    const supabase = await obterSupabase();
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

    const supabase = await obterSupabase();
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

    const supabase = await obterSupabase();
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

    const supabase = await obterSupabase();
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

    const supabase = await obterSupabase();
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
