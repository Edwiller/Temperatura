import {
    obterSupabase
} from "../config/supabase.js?v=fluxo-sessao-1";

async function lerEmPaginas(criarConsulta, mensagemDeErro) {
    const leituras = [];
    const tamanhoPagina = 500;
    let ultima;

    for (;;) {
        const consulta = criarConsulta().order("data").order("id").limit(tamanhoPagina);
        if (ultima) {
            consulta.gte("data", ultima.data)
                .or(`data.gt.${ultima.data},and(data.eq.${ultima.data},id.gt.${ultima.id})`);
        }
        const { data, error } = await consulta;

        if (error) throw new Error(mensagemDeErro);
        leituras.push(...data);
        if (data.length < tamanhoPagina) return leituras;
        ultima = data.at(-1);
    }
}

export async function buscarTemperaturasGerais(inicio, fim) {
    const supabase = await obterSupabase();
    const consulta = () => supabase.from("temperaturas")
        .select("id,valor,data,caixa_id,caixa_id_historico,sensor_id")
        .gte("data", inicio)
        .lt("data", fim);

    return lerEmPaginas(consulta, "Não foi possível consultar as temperaturas.");
}

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


    const supabase = await obterSupabase();
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


    const supabase = await obterSupabase();
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


    const supabase = await obterSupabase();
    const consulta = () => supabase.from("temperaturas")
        .select("id,valor,data,caixa_id,sensor_id")
        .eq("caixa_id", caixaId)
        .gte("data", inicio)
        .lte("data", fim);

    return lerEmPaginas(consulta, "Não foi possível carregar as temperaturas do período.");
}
