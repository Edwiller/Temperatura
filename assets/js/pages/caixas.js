import { protegerPagina } from "../config/acesso.js?v=sessao-1";
import { listarCaixas } from "../services/caixaService.js?v=sessao-1";

const filtro = document.getElementById("buscarCaixa");
const estado = document.getElementById("estadoCaixas");
const lista = document.getElementById("listaCaixas");
const numero = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });

function criarCartao(caixa) {
    const item = document.createElement("li");
    item.innerHTML = `
        <p class="portal-codigo"></p>
        <h2></h2>
        <dl>
            <div><dt>Dispositivo</dt><dd data-sensor></dd></div>
            <div><dt>Faixa configurada</dt><dd data-faixa></dd></div>
        </dl>
        <a class="portal-botao portal-botao-secundario">Abrir dashboard</a>`;
    item.querySelector(".portal-codigo").textContent = caixa.codigo;
    item.querySelector("h2").textContent = caixa.nome;
    item.querySelector("[data-sensor]").textContent = caixa.sensores
        .map(sensor => sensor.ativo ? sensor.codigo : `${sensor.codigo} (inativo)`).join(", ") || "Sem ESP associado";
    item.querySelector("[data-faixa]").textContent = caixa.temperatura_min == null || caixa.temperatura_max == null
        ? "Não informada"
        : `${numero.format(caixa.temperatura_min)} a ${numero.format(caixa.temperatura_max)} °C`;
    const link = item.querySelector("a");
    link.href = `./dashboard.html?caixa=${encodeURIComponent(caixa.id)}`;
    link.setAttribute("aria-label", `Abrir dashboard de ${caixa.nome}`);
    return item;
}

function exibirCaixas(caixas) {
    const termo = filtro.value.trim().toLocaleLowerCase("pt-BR");
    const resultados = caixas.filter(caixa => {
        const termos = [caixa.codigo, caixa.nome, ...caixa.sensores.map(sensor => sensor.codigo)];
        return termos.some(valor => valor?.toLocaleLowerCase("pt-BR").includes(termo));
    });

    lista.replaceChildren(...resultados.map(criarCartao));
    estado.hidden = resultados.length > 0;
    estado.textContent = caixas.length ? "Nenhuma caixa corresponde à busca." : "Ainda não há caixas cadastradas.";
}

if (await protegerPagina("caixas")) {
    try {
        const caixas = await listarCaixas({ incluirSensores: true });
        document.getElementById("controlesCaixas").hidden = caixas.length === 0;
        exibirCaixas(caixas);
        filtro.addEventListener("input", () => exibirCaixas(caixas));
    } catch (erro) {
        estado.textContent = erro.message;
    }
}
