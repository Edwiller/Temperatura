import {
    obterSupabase
} from "../config/supabase.js?v=fluxo-sessao-1";

async function buscarPaginas(consulta) {
    const registros = [];
    const tamanhoPagina = 500;

    for (let inicio = 0; ; inicio += tamanhoPagina) {
        const { data, error } = await consulta.range(inicio, inicio + tamanhoPagina - 1);
        if (error) throw new Error("Não foi possível carregar as caixas.");
        registros.push(...data);
        if (data.length < tamanhoPagina) return registros;
    }
}

export async function listarCaixas({ incluirSensores = false, incluirExcluidas = false } = {}) {
    const supabase = await obterSupabase();
    const consultaCaixas = supabase.from("caixas")
        .select("id,codigo,nome,temperatura_min,temperatura_max")
        .order("codigo").order("id");
    if (!incluirExcluidas) consultaCaixas.is("excluida_em", null);
    if (!incluirSensores) return buscarPaginas(consultaCaixas);

    const consultaSensores = supabase.from("sensores")
        .select("id,codigo,nome,ativo,caixa_id")
        .not("caixa_id", "is", null)
        .order("id");
    const [caixas, sensores] = await Promise.all([buscarPaginas(consultaCaixas), buscarPaginas(consultaSensores)]);
    const caixasPorId = new Map(caixas.map(caixa => [caixa.id, { ...caixa, sensores: [] }]));
    for (const sensor of sensores) {
        caixasPorId.get(sensor.caixa_id)?.sensores.push(sensor);
    }
    return [...caixasPorId.values()];
}

async function alterarCaixa(funcao, parametros) {
    const supabase = await obterSupabase();
    const { error } = await supabase.rpc(funcao, parametros);
    if (error?.code === "23505") throw new Error("O código da caixa já está cadastrado.");
    if (error?.code === "P0001" || error?.code === "42501") throw new Error(error.message);
    if (error) throw new Error("Não foi possível salvar a alteração da caixa.");
}

export function editarCaixa(id, caixa) {
    return alterarCaixa("editar_caixa", { p_caixa: id, dados_caixa: caixa });
}

export function excluirCaixa(id) {
    return alterarCaixa("excluir_caixa", { p_caixa: id });
}

export async function cadastrarCaixaComSensor(caixa, sensorId, codigoNovoSensor) {
    const supabase = await obterSupabase();
    const { data, error } = await supabase.rpc("cadastrar_caixa_com_sensor", {
        dados_caixa: caixa,
        sensor_existente: sensorId || null,
        codigo_novo_sensor: codigoNovoSensor || null
    });

    if (error?.code === "23505") {
        throw new Error("O código da caixa ou do ESP já está cadastrado.");
    }
    if (error?.code === "P0001") {
        throw new Error(error.message);
    }
    if (error?.code === "42501") {
        throw new Error("Seu usuário ainda não tem acesso ao cadastro.");
    }
    if (error) throw new Error("Não foi possível cadastrar a caixa e associar o ESP.");
    return data;
}

/* =========================================================
   CADASTRAR CAIXA
========================================================= */

export async function cadastrarCaixa(
    caixa
) {

    const supabase = await obterSupabase();
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

    const supabase = await obterSupabase();
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

    const supabase = await obterSupabase();
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
