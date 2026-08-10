import {
    listarSensoresDisponiveis
} from "../services/sensorService.js";


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



/* =========================================================
   ESTADOS DOS SENSORES
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
            "[CADASTRO] Erro:",
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

function numeroDoCampo(id) {

    const valor =
        document
            .getElementById(id)
            .value;


    /*
     * Campo realmente vazio vira NaN.
     *
     * Isso evita Number("") virar 0.
     */
    if (
        valor.trim() === ""
    ) {

        return NaN;

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
            numeroDoCampo(
                "volume"
            ),

        comprimento_cm:
            numeroDoCampo(
                "comprimento"
            ),

        largura_cm:
            numeroDoCampo(
                "largura"
            ),

        altura_cm:
            numeroDoCampo(
                "altura"
            ),

        quantidade_hemocomponentes:
            numeroDoCampo(
                "hemocomponentes"
            ),

        peso_gelo_kg:
            numeroDoCampo(
                "gelo"
            ),

        temperatura_min:
            numeroDoCampo(
                "temperaturaMin"
            ),

        temperatura_max:
            numeroDoCampo(
                "temperaturaMax"
            )

    };

}



/* =========================================================
   SUBMIT
========================================================= */

function validarFormulario(
    evento
) {

    evento.preventDefault();


    esconderMensagem();


    const caixa =
        obterDadosCaixa();


    const sensorId =
        Number(
            sensorSelect.value
        );


    console.group(
        "VALIDAÇÃO DO CADASTRO"
    );


    console.log(
        "Caixa:",
        caixa
    );


    console.log(
        "Sensor ID:",
        sensorId
    );


    const resultado =
        validarCaixa(
            caixa,
            sensorId
        );


    console.log(
        "Resultado:",
        resultado
    );


    console.groupEnd();


    if (
        !resultado.valido
    ) {

        mostrarMensagem(
            resultado.mensagem,
            "erro"
        );

        return;

    }


    /*
     * IMPORTANTE:
     * Ainda não fazemos INSERT.
     */

    mostrarMensagem(
        "Formulário válido! Cadastro no banco ainda não habilitado.",
        "sucesso"
    );


    console.log(
        "✅ FORMULÁRIO VÁLIDO"
    );

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
    validarFormulario
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