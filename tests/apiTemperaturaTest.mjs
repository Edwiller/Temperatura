/* =========================================================
   TESTES DA API DE TEMPERATURA
========================================================= */

const API_URL =
    process.env.API_TEMPERATURA_URL ??
    "http://localhost:3000/api/temperatura";


const TOKEN =
    process.env.TEMPERATURA_INGEST_TOKEN;


const SUPABASE_URL =
    process.env.SUPABASE_URL;


const SUPABASE_SECRET_KEY =
    process.env.SUPABASE_SECRET_KEY;


/*
 * Segurança adicional:
 *
 * Os testes de 409 criam sensores temporários.
 * Só permitimos isso quando explicitamente
 * autorizado no ambiente local.
 */

const PERMITIR_MUTACAO =
    process.env.ALLOW_INTEGRATION_DB_MUTATION ===
    "true";


let testesPassaram =
    0;


let testesFalharam =
    0;


let testesIgnorados =
    0;


/* =========================================================
   ASSERT
========================================================= */

function verificar(
    condicao,
    mensagem
) {

    if (!condicao) {

        throw new Error(
            mensagem
        );

    }

}


/* =========================================================
   EXECUTAR TESTE
========================================================= */

async function executarTeste(
    nome,
    teste
) {

    console.group(
        nome
    );


    try {

        await teste();


        console.log(
            "✅ PASSOU"
        );


        testesPassaram++;


    } catch (erro) {

        console.error(
            "❌ FALHOU:",
            erro.message
        );


        testesFalharam++;


    } finally {

        console.groupEnd();

    }

}


/* =========================================================
   IGNORAR TESTE
========================================================= */

function ignorarTeste(
    nome,
    motivo
) {

    console.group(
        nome
    );


    console.warn(
        `⚠️ IGNORADO: ${motivo}`
    );


    testesIgnorados++;


    console.groupEnd();

}


/* =========================================================
   CHAMAR API
========================================================= */

async function chamarApi({

    method =
    "POST",

    body =
    undefined,

    rawBody =
    undefined,

    token =
    TOKEN,

    enviarToken =
    true,

    contentType =
    "application/json"

} = {}) {

    try {

        const headers =
            {};


        if (contentType) {

            headers[
                "Content-Type"
            ] =
                contentType;

        }


        if (
            enviarToken &&
            token
        ) {

            headers.Authorization =
                `Bearer ${token}`;

        }


        const opcoes = {

            method,

            headers

        };


        /*
         * GET e HEAD não devem possuir body.
         */

        if (
            method !== "GET" &&
            method !== "HEAD"
        ) {

            if (
                rawBody !==
                undefined
            ) {

                opcoes.body =
                    rawBody;

            } else if (
                body !==
                undefined
            ) {

                opcoes.body =
                    JSON.stringify(
                        body
                    );

            }

        }


        const resposta =
            await fetch(
                API_URL,
                opcoes
            );


        const texto =
            await resposta.text();


        let dados =
            null;


        if (texto) {

            try {

                dados =
                    JSON.parse(
                        texto
                    );

            } catch (erro) {

                /*
                 * Alguns erros gerados pela própria
                 * plataforma podem não retornar o
                 * mesmo JSON da nossa API.
                 */

                console.warn(
                    "Resposta não era JSON:",
                    texto
                );

            }

        }


        return {

            status:
                resposta.status,

            dados,

            texto

        };


    } catch (erro) {

        console.error(
            "Erro ao chamar a API:",
            erro
        );


        throw erro;

    }

}


/* =========================================================
   SUPABASE - REQUISIÇÃO AUXILIAR
========================================================= */

async function chamarSupabase(
    caminho,
    {

        method =
        "GET",

        body =
        undefined

    } = {}
) {

    try {

        const resposta =
            await fetch(
                `${SUPABASE_URL}/rest/v1/${caminho}`,
                {

                    method,

                    headers: {

                        apikey:
                            SUPABASE_SECRET_KEY,

                        "Content-Type":
                            "application/json",

                        Prefer:
                            "return=representation"

                    },

                    body:
                        body !==
                            undefined
                            ? JSON.stringify(
                                body
                            )
                            : undefined

                }
            );


        const texto =
            await resposta.text();


        if (
            !resposta.ok
        ) {

            throw new Error(
                `Supabase retornou ${resposta.status}: ${texto}`
            );

        }


        if (!texto) {

            return null;

        }


        try {

            return JSON.parse(
                texto
            );


        } catch (erro) {

            return texto;

        }


    } catch (erro) {

        console.error(
            "Erro auxiliar Supabase:",
            erro
        );


        throw erro;

    }

}


/* =========================================================
   CRIAR SENSOR TEMPORÁRIO
========================================================= */

async function criarSensorTemporario(
    codigo,
    ativo
) {

    try {

        const dados =
            await chamarSupabase(
                "sensores",
                {

                    method:
                        "POST",

                    body: {

                        codigo,

                        nome:
                            "Sensor temporário de teste",

                        ativo,

                        caixa_id:
                            null

                    }

                }
            );


        if (
            !Array.isArray(
                dados
            ) ||
            dados.length === 0
        ) {

            throw new Error(
                "Sensor temporário não foi criado."
            );

        }


        return dados[0];


    } catch (erro) {

        console.error(
            "Erro ao criar sensor temporário:",
            erro
        );


        throw erro;

    }

}


/* =========================================================
   APAGAR SENSOR TEMPORÁRIO
========================================================= */

async function apagarSensorTemporario(
    codigo
) {

    try {

        const caminho =
            `sensores?codigo=eq.${encodeURIComponent(
                codigo
            )}`;


        await chamarSupabase(
            caminho,
            {
                method:
                    "DELETE"
            }
        );


        console.log(
            `🧹 Sensor ${codigo} removido.`
        );


    } catch (erro) {

        console.error(
            `❌ Não foi possível remover ${codigo}:`,
            erro
        );


        throw erro;

    }

}


/* =========================================================
   TESTE 1
   POST VÁLIDO → 201
========================================================= */

async function testarPostValido() {

    const resposta =
        await chamarApi({

            body: {

                sensor:
                    "ESP-001",

                valor:
                    5.9

            }

        });


    verificar(
        resposta.status === 201,
        `Esperado 201, recebido ${resposta.status}.`
    );


    verificar(
        resposta.dados?.sucesso ===
        true,
        "A API não indicou sucesso."
    );


    verificar(
        resposta.dados?.sensor?.codigo ===
        "ESP-001",
        "Sensor retornado incorreto."
    );


    verificar(
        Number(
            resposta.dados
                ?.temperatura
                ?.valor
        ) === 5.9,
        "Temperatura retornada incorreta."
    );

}


/* =========================================================
   TESTE 2
   GET → 405
========================================================= */

async function testarGet() {

    const resposta =
        await chamarApi({

            method:
                "GET",

            enviarToken:
                false,

            contentType:
                null

        });


    verificar(
        resposta.status === 405,
        `Esperado 405, recebido ${resposta.status}.`
    );

}


/* =========================================================
   TESTE 3
   SEM TOKEN → 401
========================================================= */

async function testarSemToken() {

    const resposta =
        await chamarApi({

            enviarToken:
                false,

            body: {

                sensor:
                    "ESP-001",

                valor:
                    5.9

            }

        });


    verificar(
        resposta.status === 401,
        `Esperado 401, recebido ${resposta.status}.`
    );

}


/* =========================================================
   TESTE 4
   TOKEN ERRADO → 401
========================================================= */

async function testarTokenErrado() {

    const resposta =
        await chamarApi({

            token:
                "TOKEN-DE-PROPOSITO-INCORRETO",

            body: {

                sensor:
                    "ESP-001",

                valor:
                    5.9

            }

        });


    verificar(
        resposta.status === 401,
        `Esperado 401, recebido ${resposta.status}.`
    );

}


/* =========================================================
   TESTE 5
   CONTENT-TYPE ERRADO → 415
========================================================= */

async function testarContentType() {

    const resposta =
        await chamarApi({

            contentType:
                "text/plain",

            rawBody:
                JSON.stringify({

                    sensor:
                        "ESP-001",

                    valor:
                        5.9

                })

        });


    verificar(
        resposta.status === 415,
        `Esperado 415, recebido ${resposta.status}.`
    );

}


/* =========================================================
   TESTE 6
   SENSOR AUSENTE → 400
========================================================= */

async function testarSensorAusente() {

    const resposta =
        await chamarApi({

            body: {

                valor:
                    5.9

            }

        });


    verificar(
        resposta.status === 400,
        `Esperado 400, recebido ${resposta.status}.`
    );

}


/* =========================================================
   TESTE 7
   SENSOR VAZIO → 400
========================================================= */

async function testarSensorVazio() {

    const resposta =
        await chamarApi({

            body: {

                sensor:
                    "   ",

                valor:
                    5.9

            }

        });


    verificar(
        resposta.status === 400,
        `Esperado 400, recebido ${resposta.status}.`
    );

}


/* =========================================================
   TESTE 8
   TEMPERATURA INVÁLIDA → 400
========================================================= */

async function testarTemperaturaInvalida() {

    const resposta =
        await chamarApi({

            body: {

                sensor:
                    "ESP-001",

                valor:
                    "abc"

            }

        });


    verificar(
        resposta.status === 400,
        `Esperado 400, recebido ${resposta.status}.`
    );

}


/* =========================================================
   TESTE 9
   TEMPERATURA AUSENTE → 400
========================================================= */

async function testarTemperaturaAusente() {

    const resposta =
        await chamarApi({

            body: {

                sensor:
                    "ESP-001"

            }

        });


    verificar(
        resposta.status === 400,
        `Esperado 400, recebido ${resposta.status}.`
    );

}


/* =========================================================
   TESTE 10
   TEMPERATURA ABSURDA → 400
========================================================= */

async function testarTemperaturaAbsurda() {

    const resposta =
        await chamarApi({

            body: {

                sensor:
                    "ESP-001",

                valor:
                    999

            }

        });


    verificar(
        resposta.status === 400,
        `Esperado 400, recebido ${resposta.status}.`
    );

}


/* =========================================================
   TESTE 11
   SENSOR INEXISTENTE → 404
========================================================= */

async function testarSensorInexistente() {

    const resposta =
        await chamarApi({

            body: {

                sensor:
                    "ESP-QUE-NAO-EXISTE",

                valor:
                    5.9

            }

        });


    verificar(
        resposta.status === 404,
        `Esperado 404, recebido ${resposta.status}.`
    );

}


/* =========================================================
   TESTE 12
   JSON INVÁLIDO → 400
========================================================= */

async function testarJsonInvalido() {

    const resposta =
        await chamarApi({

            rawBody:
                `{
                    "sensor": "ESP-001",
                    "valor":
                }`

        });


    verificar(
        resposta.status === 400,
        `Esperado 400, recebido ${resposta.status}.`
    );

}


/* =========================================================
   TESTE 13
   SENSOR INATIVO → 409
========================================================= */

async function testarSensorInativo() {

    const codigo =
        `TEST-INATIVO-${Date.now()}`;


    let criado =
        false;


    try {

        await criarSensorTemporario(
            codigo,
            false
        );


        criado =
            true;


        const resposta =
            await chamarApi({

                body: {

                    sensor:
                        codigo,

                    valor:
                        5.9

                }

            });


        verificar(
            resposta.status === 409,
            `Esperado 409, recebido ${resposta.status}.`
        );


        verificar(
            resposta.dados?.erro ===
            "O sensor está inativo.",
            "Mensagem de sensor inativo não foi retornada."
        );


    } catch (erro) {

        throw erro;


    } finally {

        if (criado) {

            try {

                await apagarSensorTemporario(
                    codigo
                );


            } catch (erro) {

                console.error(
                    "Erro durante limpeza:",
                    erro
                );

            }

        }

    }

}


/* =========================================================
   TESTE 14
   SENSOR SEM CAIXA → 409
========================================================= */

async function testarSensorSemCaixa() {

    const codigo =
        `TEST-SEM-CAIXA-${Date.now()}`;


    let criado =
        false;


    try {

        await criarSensorTemporario(
            codigo,
            true
        );


        criado =
            true;


        const resposta =
            await chamarApi({

                body: {

                    sensor:
                        codigo,

                    valor:
                        5.9

                }

            });


        verificar(
            resposta.status === 409,
            `Esperado 409, recebido ${resposta.status}.`
        );


        verificar(
            resposta.dados?.erro ===
            "O sensor não está associado a nenhuma caixa.",
            "Mensagem de sensor sem caixa não foi retornada."
        );


    } catch (erro) {

        throw erro;


    } finally {

        if (criado) {

            try {

                await apagarSensorTemporario(
                    codigo
                );


            } catch (erro) {

                console.error(
                    "Erro durante limpeza:",
                    erro
                );

            }

        }

    }

}


/* =========================================================
   EXECUTAR
========================================================= */

async function executarTestes() {

    console.log(
        ""
    );


    console.log(
        "=========================================="
    );


    console.log(
        " TESTES DA API DE TEMPERATURA"
    );


    console.log(
        "=========================================="
    );


    try {

        /* =================================================
           VALIDAR CONFIGURAÇÃO
        ================================================= */

        if (!TOKEN) {

            throw new Error(
                "TEMPERATURA_INGEST_TOKEN não encontrada."
            );

        }


        if (!SUPABASE_URL) {

            throw new Error(
                "SUPABASE_URL não encontrada."
            );

        }


        if (!SUPABASE_SECRET_KEY) {

            throw new Error(
                "SUPABASE_SECRET_KEY não encontrada."
            );

        }


        /* =================================================
           TESTES NORMAIS
        ================================================= */

        await executarTeste(
            "TESTE 1 - POST válido → 201",
            testarPostValido
        );


        await executarTeste(
            "TESTE 2 - GET → 405",
            testarGet
        );


        await executarTeste(
            "TESTE 3 - Sem token → 401",
            testarSemToken
        );


        await executarTeste(
            "TESTE 4 - Token incorreto → 401",
            testarTokenErrado
        );


        await executarTeste(
            "TESTE 5 - Content-Type incorreto → 415",
            testarContentType
        );


        await executarTeste(
            "TESTE 6 - Sensor ausente → 400",
            testarSensorAusente
        );


        await executarTeste(
            "TESTE 7 - Sensor vazio → 400",
            testarSensorVazio
        );


        await executarTeste(
            "TESTE 8 - Temperatura inválida → 400",
            testarTemperaturaInvalida
        );


        await executarTeste(
            "TESTE 9 - Temperatura ausente → 400",
            testarTemperaturaAusente
        );


        await executarTeste(
            "TESTE 10 - Temperatura absurda → 400",
            testarTemperaturaAbsurda
        );


        await executarTeste(
            "TESTE 11 - Sensor inexistente → 404",
            testarSensorInexistente
        );


        await executarTeste(
            "TESTE 12 - JSON inválido → 400",
            testarJsonInvalido
        );


        /* =================================================
           TESTES QUE ALTERAM TEMPORARIAMENTE O DEV
        ================================================= */

        if (PERMITIR_MUTACAO) {

            await executarTeste(
                "TESTE 13 - Sensor inativo → 409",
                testarSensorInativo
            );


            await executarTeste(
                "TESTE 14 - Sensor sem caixa → 409",
                testarSensorSemCaixa
            );


        } else {

            ignorarTeste(
                "TESTE 13 - Sensor inativo → 409",
                "ALLOW_INTEGRATION_DB_MUTATION não está true."
            );


            ignorarTeste(
                "TESTE 14 - Sensor sem caixa → 409",
                "ALLOW_INTEGRATION_DB_MUTATION não está true."
            );

        }


    } catch (erro) {

        console.error(
            "❌ Erro geral:",
            erro
        );


        testesFalharam++;


    } finally {

        /* =================================================
           RESUMO
        ================================================= */

        console.log(
            ""
        );


        console.log(
            "=========================================="
        );


        console.log(
            " RESULTADO"
        );


        console.log(
            "=========================================="
        );


        console.log(
            `✅ Passaram: ${testesPassaram}`
        );


        console.log(
            `❌ Falharam: ${testesFalharam}`
        );


        console.log(
            `⚠️ Ignorados: ${testesIgnorados}`
        );


        console.log(
            "=========================================="
        );


        /*
         * Faz o terminal retornar erro
         * caso algum teste tenha falhado.
         *
         * Isso será útil futuramente
         * para CI/GitHub Actions.
         */

        if (
            testesFalharam >
            0
        ) {

            process.exitCode =
                1;

        }

    }

}


executarTestes();