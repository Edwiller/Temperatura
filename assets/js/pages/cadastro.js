import {
    listarSensoresDisponiveis,
    associarSensorCaixa
} from "../services/sensorService.js";


import {
    cadastrarCaixa
} from "../services/caixaService.js";


import {
    validarCaixa
} from "../utils/validacoes.js";


/* =========================================================
   ELEMENTOS
========================================================= */

const form =
    document.getElementById("formCaixa");


const sensorSelect =
    document.getElementById("sensor");


const sensorCarregando =
    document.getElementById(
        "sensorCarregando"
    );


const sensorContainer =
    document.getElementById(
        "sensorContainer"
    );


const semSensores =
    document.getElementById(
        "semSensores"
    );


const mensagem =
    document.getElementById(
        "mensagem"
    );


const btnSalvar =
    document.getElementById(
        "btnSalvar"
    );


const btnSalvarTexto =
    document.getElementById(
        "btnSalvarTexto"
    );


const btnSalvarSpinner =
    document.getElementById(
        "btnSalvarSpinner"
    );



/* =========================================================
   ESTADOS VISUAIS DO SENSOR
========================================================= */

function mostrarCarregamento() {

    sensorCarregando
        .classList
        .remove("oculto");


    sensorContainer
        .classList
        .add("oculto");


    semSensores
        .classList
        .add("oculto");

}


function mostrarSelect() {

    sensorCarregando
        .classList
        .add("oculto");


    sensorContainer
        .classList
        .remove("oculto");


    semSensores
        .classList
        .add("oculto");

}


function mostrarSemSensores() {

    sensorCarregando
        .classList
        .add("oculto");


    sensorContainer
        .classList
        .add("oculto");


    semSensores
        .classList
        .remove("oculto");

}



/* =========================================================
   MENSAGENS
========================================================= */

function mostrarMensagem(
    texto,
    tipo
) {

    mensagem.textContent =
        texto;


    mensagem.className =
        `mensagem ${tipo}`;

}


function esconderMensagem() {

    mensagem.textContent = "";

    mensagem.className =
        "mensagem oculto";

}



/* =========================================================
   ESTADO DO BOTÃO
========================================================= */

function definirProcessando(
    processando
) {

    btnSalvar.disabled =
        processando;


    if (processando) {

        btnSalvarTexto.textContent =
            "Cadastrando...";


        btnSalvarSpinner
            .classList
            .remove("oculto");

    } else {

        btnSalvarTexto.textContent =
            "Cadastrar caixa";


        btnSalvarSpinner
            .classList
            .add("oculto");

    }

}



/* =========================================================
   SENSORES
========================================================= */

function preencherSelectSensores(
    sensores
) {

    sensorSelect.innerHTML = `
        <option value="">
            Selecione um sensor
        </option>
    `;


    sensores.forEach(
        sensor => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                sensor.id;


            option.textContent =
                `${sensor.codigo} - ${
                    sensor.nome ??
                    "Sem nome"
                }`;


            sensorSelect.appendChild(
                option
            );

        }
    );

}



async function carregarSensores() {

    mostrarCarregamento();


    try {

        const sensores =
            await listarSensoresDisponiveis();


        console.log(
            `[CADASTRO] ${sensores.length} sensor(es) disponível(is).`
        );


        if (
            sensores.length === 0
        ) {

            mostrarSemSensores();

            btnSalvar.disabled = true;

            return;

        }


        preencherSelectSensores(
            sensores
        );


        mostrarSelect();


        btnSalvar.disabled = false;


        console.log(
            "[CADASTRO] Sensores carregados."
        );


    } catch (erro) {

        console.error(
            "[CADASTRO] Erro ao carregar sensores:",
            erro
        );


        mostrarSemSensores();


        btnSalvar.disabled = true;


        mostrarMensagem(
            "Não foi possível carregar os sensores.",
            "erro"
        );

    }

}



/* =========================================================
   CONVERSÃO DOS CAMPOS
========================================================= */

function numeroObrigatorio(
    id
) {

    const valor =
        document
            .getElementById(id)
            .value;


    if (
        valor.trim() === ""
    ) {

        return NaN;

    }


    return Number(valor);

}



function numeroOpcional(
    id
) {

    const valor =
        document
            .getElementById(id)
            .value;


    if (
        valor.trim() === ""
    ) {

        return null;

    }


    return Number(valor);

}



/* =========================================================
   MONTAR OBJETO CAIXA
========================================================= */

function obterDadosCaixa() {

    return {

        codigo:
            document
                .getElementById("codigo")
                .value
                .trim(),

        nome:
            document
                .getElementById("nome")
                .value
                .trim(),

        volume_litros:
            numeroObrigatorio(
                "volume"
            ),

        comprimento_cm:
            numeroOpcional(
                "comprimento"
            ),

        largura_cm:
            numeroOpcional(
                "largura"
            ),

        altura_cm:
            numeroOpcional(
                "altura"
            ),

        quantidade_hemocomponentes:
            numeroObrigatorio(
                "hemocomponentes"
            ),

        peso_gelo_kg:
            numeroObrigatorio(
                "gelo"
            ),

        temperatura_min:
            numeroObrigatorio(
                "temperaturaMin"
            ),

        temperatura_max:
            numeroObrigatorio(
                "temperaturaMax"
            )

    };

}



/* =========================================================
   BLOQUEAR FORMULÁRIO APÓS SUCESSO
========================================================= */

function bloquearFormulario() {

    const elementos =
        form.querySelectorAll(
            "input, select, button"
        );


    elementos.forEach(
        elemento => {

            elemento.disabled = true;

        }
    );

}



/* =========================================================
   CADASTRAR
========================================================= */

async function cadastrar(
    evento
) {

    evento.preventDefault();


    esconderMensagem();


    /* -----------------------------------------------------
       1. Montar dados
    ----------------------------------------------------- */

    const caixa =
        obterDadosCaixa();


    const sensorId =
        Number(
            sensorSelect.value
        );


    /* -----------------------------------------------------
       2. Validar
    ----------------------------------------------------- */

    const validacao =
        validarCaixa(
            caixa,
            sensorId
        );


    if (
        !validacao.valido
    ) {

        mostrarMensagem(
            validacao.mensagem,
            "erro"
        );

        return;

    }


    definirProcessando(
        true
    );


    let caixaCriada = null;


    try {

        console.group(
            "CADASTRO COMPLETO"
        );


        console.log(
            "📦 Criando caixa..."
        );


        /* -------------------------------------------------
           3. Criar caixa
        ------------------------------------------------- */

        caixaCriada =
            await cadastrarCaixa(
                caixa
            );


        console.log(
            "✅ Caixa criada:",
            caixaCriada
        );


        /* -------------------------------------------------
           4. Associar sensor
        ------------------------------------------------- */

        console.log(
            `🔗 Associando sensor ${sensorId} à caixa ${caixaCriada.id}...`
        );


        const sensorAssociado =
            await associarSensorCaixa(
                sensorId,
                caixaCriada.id
            );


        console.log(
            "✅ Sensor associado:",
            sensorAssociado
        );


        /* -------------------------------------------------
           5. Guardar ID no HTML para debug/testes
        ------------------------------------------------- */

        form.dataset.caixaId =
            caixaCriada.id;


        /* -------------------------------------------------
           6. Mostrar sucesso
        ------------------------------------------------- */

        mostrarMensagem(
            `Caixa ${caixaCriada.codigo} cadastrada com sucesso.`,
            "sucesso"
        );


        console.log(
            "🎉 CADASTRO COMPLETO REALIZADO."
        );


        console.log(
            `Caixa ID: ${caixaCriada.id}`
        );


        console.log(
            `Sensor ID: ${sensorId}`
        );


        bloquearFormulario();


    } catch (erro) {

        console.error(
            "❌ Erro durante o cadastro:",
            erro
        );


        /*
         * Neste momento ainda NÃO temos
         * rollback automático.
         *
         * Se a caixa tiver sido criada e
         * a associação do sensor falhar,
         * avisamos explicitamente.
         */

        if (
            caixaCriada
        ) {

            mostrarMensagem(
                "A caixa foi criada, mas ocorreu um erro ao associar o sensor. Não tente cadastrar novamente antes de verificar o Supabase.",
                "erro"
            );

        } else {

            mostrarMensagem(
                erro.message,
                "erro"
            );

        }


    } finally {

        console.groupEnd();


        /*
         * Se houve sucesso, bloquearFormulario()
         * já deixou tudo desabilitado.
         */
        if (
            !form.dataset.caixaId
        ) {

            definirProcessando(
                false
            );

        }

    }

}



/* =========================================================
   RESET
========================================================= */

form.addEventListener(
    "reset",
    () => {

        esconderMensagem();

    }
);



/* =========================================================
   SUBMIT
========================================================= */

form.addEventListener(
    "submit",
    cadastrar
);



/* =========================================================
   INICIALIZAÇÃO
========================================================= */

async function iniciarPagina() {

    console.log(
        "[CADASTRO] Inicializando..."
    );


    esconderMensagem();


    await carregarSensores();


    console.log(
        "[CADASTRO] Página pronta."
    );

}


iniciarPagina();