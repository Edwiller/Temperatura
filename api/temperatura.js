/* =========================================================
   API DE RECEBIMENTO DE TEMPERATURA
========================================================= */


/* =========================================================
   ERRO DE COMUNICAÇÃO COM O SUPABASE
========================================================= */

class ErroSupabase extends Error {

    constructor(
        tipo,
        mensagem,
        statusOriginal = null,
        detalhe = null
    ) {

        super(mensagem);

        this.name =
            "ErroSupabase";

        this.tipo =
            tipo;

        this.statusOriginal =
            statusOriginal;

        this.detalhe =
            detalhe;

    }

}


/* =========================================================
   RESPOSTA PADRÃO
========================================================= */

function responder(
    res,
    status,
    dados
) {

    return res
        .status(status)
        .json(dados);

}


/* =========================================================
   CHAMAR SUPABASE
========================================================= */

async function chamarSupabase(
    url,
    opcoes
) {

    try {

        const resposta =
            await fetch(
                url,
                opcoes
            );


        if (!resposta.ok) {

            let detalhe =
                "";


            try {

                detalhe =
                    await resposta.text();

            } catch (erro) {

                console.error(
                    "[API TEMPERATURA] Não foi possível ler o erro do Supabase:",
                    erro
                );

            }


            throw new ErroSupabase(
                "resposta",
                "O Supabase retornou um erro.",
                resposta.status,
                detalhe
            );

        }


        return resposta;


    } catch (erro) {

        /*
         * Se já for nosso erro controlado,
         * apenas repassamos.
         */

        if (
            erro instanceof
            ErroSupabase
        ) {

            throw erro;

        }


        /*
         * Aqui normalmente entram:
         *
         * - problema de rede;
         * - DNS;
         * - Supabase indisponível;
         * - falha no fetch.
         */

        throw new ErroSupabase(
            "indisponivel",
            "Não foi possível conectar ao Supabase.",
            null,
            erro.message
        );

    }

}


/* =========================================================
   LER BODY
========================================================= */

function obterBody(
    req
) {

    try {

        if (
            req.body === null ||
            req.body === undefined
        ) {

            return null;

        }


        /*
         * Dependendo do runtime,
         * o JSON já pode chegar como objeto.
         */

        if (
            typeof req.body ===
            "object"
        ) {

            if (
                Array.isArray(
                    req.body
                )
            ) {

                return null;

            }


            return req.body;

        }


        /*
         * Caso chegue como string,
         * tentamos converter.
         */

        if (
            typeof req.body ===
            "string"
        ) {

            return JSON.parse(
                req.body
            );

        }


        return null;


    } catch (erro) {

        console.error(
            "[API TEMPERATURA] JSON inválido:",
            erro.message
        );


        throw new Error(
            "JSON_INVALIDO"
        );

    }

}


/* =========================================================
   HANDLER
========================================================= */

export default async function handler(
    req,
    res
) {

    try {

        /* =================================================
           1. MÉTODO HTTP
        ================================================= */

        if (
            req.method !==
            "POST"
        ) {

            res.setHeader(
                "Allow",
                "POST"
            );


            return responder(
                res,
                405,
                {
                    sucesso: false,
                    erro:
                        "Método não permitido."
                }
            );

        }


        /* =================================================
           2. VARIÁVEIS DE AMBIENTE
        ================================================= */

        const supabaseUrl =
            process.env.SUPABASE_URL;


        const supabaseSecretKey =
            process.env.SUPABASE_SECRET_KEY;


        const ingestToken =
            process.env.TEMPERATURA_INGEST_TOKEN;


        if (
            !supabaseUrl ||
            !supabaseSecretKey ||
            !ingestToken
        ) {

            console.error(
                "[API TEMPERATURA] Configuração incompleta."
            );


            return responder(
                res,
                500,
                {
                    sucesso: false,
                    erro:
                        "Configuração interna da API incompleta."
                }
            );

        }


        /* =================================================
           3. AUTENTICAÇÃO
        ================================================= */

        const authorization =
            req.headers.authorization;


        const tokenRecebido =
            authorization &&
                authorization.startsWith(
                    "Bearer "
                )
                ? authorization
                    .substring(7)
                    .trim()
                : null;


        if (
            !tokenRecebido ||
            tokenRecebido !== ingestToken
        ) {

            return responder(
                res,
                401,
                {
                    sucesso: false,
                    erro:
                        "Dispositivo não autorizado."
                }
            );

        }


        /* =================================================
           4. CONTENT-TYPE
        ================================================= */

        const contentType =
            req.headers[
            "content-type"
            ] ?? "";


        if (
            !contentType
                .toLowerCase()
                .includes(
                    "application/json"
                )
        ) {

            return responder(
                res,
                415,
                {
                    sucesso: false,
                    erro:
                        "O corpo da requisição deve ser enviado como application/json."
                }
            );

        }


        /* =================================================
           5. BODY
        ================================================= */

        let body;


        try {

            body =
                obterBody(
                    req
                );


        } catch (erro) {

            if (
                erro.message ===
                "JSON_INVALIDO"
            ) {

                return responder(
                    res,
                    400,
                    {
                        sucesso: false,
                        erro:
                            "JSON inválido."
                    }
                );

            }


            throw erro;

        }


        if (
            !body ||
            typeof body !==
            "object"
        ) {

            return responder(
                res,
                400,
                {
                    sucesso: false,
                    erro:
                        "Corpo da requisição inválido."
                }
            );

        }


        /* =================================================
           6. SENSOR
        ================================================= */

        const sensorCodigo =
            typeof body.sensor ===
                "string"
                ? body.sensor.trim()
                : "";


        if (
            sensorCodigo === ""
        ) {

            return responder(
                res,
                400,
                {
                    sucesso: false,
                    erro:
                        "O código do sensor é obrigatório."
                }
            );

        }


        if (
            sensorCodigo.length >
            100
        ) {

            return responder(
                res,
                400,
                {
                    sucesso: false,
                    erro:
                        "Código do sensor inválido."
                }
            );

        }


        /* =================================================
           7. TEMPERATURA
        ================================================= */

        const valorBruto =
            body.valor;


        if (
            valorBruto ===
            undefined ||
            valorBruto ===
            null ||
            valorBruto ===
            "" ||
            typeof valorBruto ===
            "boolean" ||
            typeof valorBruto ===
            "object"
        ) {

            return responder(
                res,
                400,
                {
                    sucesso: false,
                    erro:
                        "A temperatura é obrigatória e deve ser numérica."
                }
            );

        }


        const valor =
            Number(
                valorBruto
            );


        if (
            !Number.isFinite(
                valor
            )
        ) {

            return responder(
                res,
                400,
                {
                    sucesso: false,
                    erro:
                        "A temperatura informada é inválida."
                }
            );

        }


        /*
         * Isto NÃO é a faixa permitida
         * pela caixa.
         *
         * É somente uma proteção contra
         * valores absurdos recebidos pela API.
         */

        if (
            valor < -100 ||
            valor > 150
        ) {

            return responder(
                res,
                400,
                {
                    sucesso: false,
                    erro:
                        "Temperatura fora do intervalo aceito pela API."
                }
            );

        }


        const resposta = await chamarSupabase(`${supabaseUrl}/rest/v1/rpc/registrar_leitura_sensor`, {
            method: "POST",
            headers: { apikey: supabaseSecretKey, "Content-Type": "application/json" },
            body: JSON.stringify({ p_codigo: sensorCodigo, p_valor: valor })
        });
        let registro;
        try {
            registro = await resposta.json();
        } catch (erro) {
            console.error("[API TEMPERATURA] Resposta inválida do Supabase:", erro);
            return responder(res, 502, { sucesso: false, erro: "Resposta inválida recebida do banco de dados." });
        }
        if (registro?.status === "desconhecido") {
            return responder(res, 404, { sucesso: false, erro: `Sensor ${sensorCodigo} não encontrado.` });
        }
        if (registro?.status === "inativo") {
            return responder(res, 409, { sucesso: false, erro: "O sensor está inativo." });
        }
        if (registro?.status !== "gravado") {
            return responder(res, 502, { sucesso: false, erro: "O banco não retornou a temperatura criada." });
        }

        return responder(res, 201, {
            sucesso: true,
            mensagem: "Temperatura registrada com sucesso.",
            temperatura: registro.temperatura,
            sensor: registro.sensor,
            caixa: registro.caixa
        });

    } catch (erro) {

        /* =================================================
           ERRO DO SUPABASE
        ================================================= */

        if (
            erro instanceof
            ErroSupabase
        ) {

            console.error(
                "[API TEMPERATURA] Erro Supabase:",
                {
                    tipo:
                        erro.tipo,

                    statusOriginal:
                        erro.statusOriginal,

                    detalhe:
                        erro.detalhe
                }
            );


            /*
             * Supabase respondeu, mas respondeu
             * com erro.
             */

            if (
                erro.tipo ===
                "resposta"
            ) {

                return responder(
                    res,
                    502,
                    {
                        sucesso: false,
                        erro:
                            "Erro na comunicação com o banco de dados."
                    }
                );

            }


            /*
             * Não foi possível nem obter
             * resposta do Supabase.
             */

            if (
                erro.tipo ===
                "indisponivel"
            ) {

                return responder(
                    res,
                    503,
                    {
                        sucesso: false,
                        erro:
                            "Serviço de banco de dados temporariamente indisponível."
                    }
                );

            }

        }


        /* =================================================
           ERRO INTERNO NÃO PREVISTO
        ================================================= */

        console.error(
            "[API TEMPERATURA] Erro interno:",
            erro
        );


        return responder(
            res,
            500,
            {
                sucesso: false,
                erro:
                    "Erro interno da API."
            }
        );

    }

}
