import { protegerPagina } from "../config/acesso.js?v=gestao-1";
import { listarCaixas } from "../services/caixaService.js?v=gestao-1";
import { alterarVinculoSensor, listarSensoresDisponiveis } from "../services/sensorService.js?v=gestao-1";

const estado = document.getElementById("estadoSensores");
const lista = document.getElementById("listaSensores");
const dialogo = document.getElementById("vincularSensor");
const campo = document.getElementById("caixaVinculo");
const confirmar = document.getElementById("confirmarVinculo");
const cancelar = document.getElementById("cancelarVinculo");
const erroVinculo = document.getElementById("erroVinculo");
let sensores = [];
let caixasLivres = [];
let sensorAtual;

function exibirSensores(mensagem) {
    estado.textContent = mensagem ?? (sensores.length ? "" : "Nenhum sensor disponível.");
    estado.hidden = !estado.textContent;
    lista.replaceChildren(...sensores.map(sensor => {
        const item = document.createElement("li");
        const codigo = document.createElement("p");
        const titulo = document.createElement("h2");
        const botao = document.createElement("button");
        codigo.className = "portal-codigo";
        codigo.textContent = sensor.codigo;
        titulo.textContent = sensor.nome || sensor.codigo;
        botao.type = "button";
        botao.className = "portal-botao portal-botao-secundario";
        botao.textContent = "Vincular a uma caixa";
        botao.disabled = caixasLivres.length === 0;
        if (botao.disabled) botao.title = "Todas as caixas já têm um sensor.";
        botao.addEventListener("click", () => {
            sensorAtual = sensor;
            document.getElementById("tituloVinculo").textContent = `Vincular ${sensor.nome || sensor.codigo}`;
            campo.replaceChildren(new Option("Selecione uma caixa", ""), ...caixasLivres.map(
                caixa => new Option(`${caixa.nome} (${caixa.codigo})`, caixa.id)
            ));
            erroVinculo.hidden = true;
            dialogo.showModal();
        });
        item.append(codigo, titulo, botao);
        return item;
    }));
}

cancelar.addEventListener("click", () => dialogo.close());
dialogo.addEventListener("cancel", evento => {
    if (confirmar.disabled) evento.preventDefault();
});
document.getElementById("formVinculo").addEventListener("submit", async evento => {
    evento.preventDefault();
    if (confirmar.disabled) return;
    const caixaId = campo.value;
    confirmar.disabled = cancelar.disabled = campo.disabled = true;
    try {
        await alterarVinculoSensor(sensorAtual.id, caixaId);
        sensores = sensores.filter(sensor => sensor !== sensorAtual);
        caixasLivres = caixasLivres.filter(caixa => String(caixa.id) !== caixaId);
        dialogo.close();
        exibirSensores("Sensor vinculado à caixa.");
    } catch (erro) {
        erroVinculo.textContent = erro.message;
        erroVinculo.hidden = false;
    } finally {
        confirmar.disabled = cancelar.disabled = campo.disabled = false;
    }
});

if (await protegerPagina("sensores")) {
    try {
        const [disponiveis, caixas] = await Promise.all([listarSensoresDisponiveis(), listarCaixas({ incluirSensores: true })]);
        sensores = disponiveis;
        caixasLivres = caixas.filter(caixa => caixa.sensores.length === 0);
        exibirSensores();
    } catch (erro) {
        estado.textContent = erro.message;
    }
}
