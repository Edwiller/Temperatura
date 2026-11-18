import { protegerPagina } from "../config/acesso.js?v=gestao-1";
import { listarSensoresDisponiveis } from "../services/sensorService.js?v=gestao-1";
import { buscarCaixaPorId, cadastrarCaixaComSensor, editarCaixa } from "../services/caixaService.js?v=gestao-1";

import {
    validarCaixa
} from "../utils/validacoes.js?v=gestao-1";


/* =========================================================
   ELEMENTOS
========================================================= */

const form =
    document.getElementById("formCaixa");
const idEdicao = new URLSearchParams(location.search).get("editar");


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


const camposNovoSensor = document.getElementById("camposNovoSensor");
const codigoNovoSensor = document.getElementById("codigoNovoSensor");
const abrirCaixa = document.getElementById("abrirCaixa");

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

function atualizarCamposSensor() {
    const novoSensor = sensorSelect.value === "novo";
    camposNovoSensor.classList.toggle("oculto", !novoSensor);
    codigoNovoSensor.disabled = !novoSensor;
    codigoNovoSensor.required = novoSensor;
}

sensorSelect.addEventListener("change", atualizarCamposSensor);

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
            idEdicao ? "Salvando..." : "Cadastrando...";


        btnSalvarSpinner
            .classList
            .remove("oculto");

    } else {

        btnSalvarTexto.textContent =
            idEdicao ? "Salvar alterações" : "Cadastrar caixa";


        btnSalvarSpinner
            .classList
            .add("oculto");

    }

}



/* =========================================================
   SENSORES
========================================================= */

async function carregarSensores() {
    try {
        const sensores = await listarSensoresDisponiveis();
        sensores.forEach(sensor => {
            sensorSelect.add(new Option(`${sensor.codigo} - ${sensor.nome ?? "Sem nome"}`, sensor.id));
        });
        sensorSelect.add(new Option("Cadastrar um novo ESP", "novo"));
        if (sensores.length === 0) sensorSelect.value = "novo";

        sensorContainer.classList.remove("oculto");
        atualizarCamposSensor();
        btnSalvar.disabled = false;
    } catch (erro) {
        console.error("[CADASTRO] Erro ao carregar sensores:", erro);
        mostrarMensagem("Não foi possível carregar os sensores. Recarregue a página para tentar novamente.", "erro");
    } finally {
        sensorCarregando.classList.add("oculto");
    }
}

async function carregarEdicao() {
    document.title = "Editar caixa | Monitoramento Térmico";
    document.querySelector(".pagina-cabecalho .etiqueta").textContent = "Caixas";
    document.querySelector(".pagina-cabecalho h1").textContent = "Editar caixa";
    document.querySelector(".pagina-cabecalho p").textContent = "Atualize as informações e os limites da caixa.";
    const secaoSensor = sensorSelect.closest("section");
    secaoSensor.hidden = true;
    sensorSelect.disabled = true;
    codigoNovoSensor.disabled = true;
    document.getElementById("btnLimpar").hidden = true;
    btnSalvarTexto.textContent = "Salvar alterações";

    try {
        if (!/^[1-9]\d*$/.test(idEdicao)) throw new Error("Caixa inválida.");
        const caixa = await buscarCaixaPorId(idEdicao);
        if (caixa.excluida_em) throw new Error("Esta caixa foi excluída.");
        const campos = { codigo: "codigo", nome: "nome", volume: "volume_litros", comprimento: "comprimento_cm",
            largura: "largura_cm", altura: "altura_cm", hemocomponentes: "quantidade_hemocomponentes",
            gelo: "peso_gelo_kg", temperaturaMin: "temperatura_min", temperaturaMax: "temperatura_max" };
        for (const [id, chave] of Object.entries(campos)) document.getElementById(id).value = caixa[chave] ?? "";
        btnSalvar.disabled = false;
    } catch (erro) {
        mostrarMensagem(erro.message, "erro");
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

async function cadastrar(evento) {
    evento.preventDefault();
    esconderMensagem();

    const caixa = obterDadosCaixa();
    const novoSensor = sensorSelect.value === "novo";
    const sensorId = novoSensor ? null : Number(sensorSelect.value);
    const codigo = novoSensor ? codigoNovoSensor.value.trim() : "";
    const validacao = validarCaixa(caixa, sensorId, codigo, { exigirSensor: !idEdicao });
    if (!validacao.valido) {
        mostrarMensagem(validacao.mensagem, "erro");
        return;
    }

    definirProcessando(true);
    try {
        if (idEdicao) {
            await editarCaixa(idEdicao, caixa);
            location.assign("./caixas.html?atualizada=1");
            return;
        }
        const caixaCriada = await cadastrarCaixaComSensor(caixa, sensorId, codigo);
        form.dataset.caixaId = caixaCriada.id;
        abrirCaixa.href = `./dashboard.html?caixa=${caixaCriada.id}`;
        abrirCaixa.hidden = false;
        mostrarMensagem(`Caixa ${caixaCriada.codigo} cadastrada com o ESP associado.`, "sucesso");
        bloquearFormulario();
        abrirCaixa.focus();
    } catch (erro) {
        mostrarMensagem(erro.message, "erro");
    } finally {
        if (!form.dataset.caixaId) definirProcessando(false);
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



if (await protegerPagina("caixas")) {
    if (idEdicao !== null) await carregarEdicao();
    else await carregarSensores();
}
