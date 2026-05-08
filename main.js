import { supabase } from "./supabase.js"
import { carregarComparativo } from "./comparativo.js"
import { filtrarDadosGrafico } from "./chart.js"

const ctx =
document.getElementById("graficoTemperatura")

let grafico = null

// guarda último registro carregado
let ultimoRegistro = null

async function carregarDados() {

    const hoje = new Date()

    const inicioHoje =
        new Date(
            hoje.getFullYear(),
            hoje.getMonth(),
            hoje.getDate(),
            0,0,0
        ).toISOString()

    const fimHoje =
        new Date(
            hoje.getFullYear(),
            hoje.getMonth(),
            hoje.getDate(),
            23,59,59
        ).toISOString()

    document.getElementById("tituloHoje")
    .innerHTML =
    `Temperatura ${hoje.toLocaleDateString("pt-BR")}`

    // BUSCA APENAS DADOS DE HOJE
    const { data, error } = await supabase
    .from("temperaturas")
    .select("*")
    .gte("data", inicioHoje)
    .lte("data", fimHoje)
    .order("data", { ascending: true })

    if (error) {
        console.log(error)
        return
    }

    if (!data || data.length === 0) {
        return
    }

    // PEGA O ÚLTIMO REGISTRO
    const ultimoAtual =
        data[data.length - 1].id

    // NÃO ATUALIZA SE NÃO HOUVER NOVOS DADOS
    if (ultimoRegistro === ultimoAtual) {
        return
    }

    ultimoRegistro = ultimoAtual

    // FILTRA DADOS
    const filtrado =
        filtrarDadosGrafico(data).slice(-100)

    const valores =
        filtrado.map(i => i.valor)

    // CARDS
    document.getElementById("tempAtual")
    .innerHTML =
    `${valores[valores.length - 1]?.toFixed(2)}°C`

    document.getElementById("tempMax")
    .innerHTML =
    `${Math.max(...valores).toFixed(2)}°C`

    document.getElementById("tempMin")
    .innerHTML =
    `${Math.min(...valores).toFixed(2)}°C`

    // DESTRÓI GRÁFICO ANTIGO
    if (grafico) {
        grafico.destroy()
    }

    // CRIA NOVO
    grafico = new Chart(ctx, {

        type: "line",

        data: {

            labels: filtrado.map(i =>
                new Date(i.data)
                .toLocaleTimeString("pt-BR")
            ),

            datasets: [{
                label: "Temperatura",

                data: valores,

                borderColor: "#2563eb",

                backgroundColor:
                "rgba(37,99,235,.15)",

                fill: true,

                tension: 0.4,

                pointRadius: 4,

                pointHoverRadius: 6
            }]
        },

        options: {

            responsive: true,

            plugins: {
                legend: {
                    labels: {
                        color:
                        document.body.classList.contains("dark")
                        ? "#fff"
                        : "#000"
                    }
                }
            },

            scales: {

                x: {
                    ticks: {
                        color:
                        document.body.classList.contains("dark")
                        ? "#fff"
                        : "#000"
                    },

                    grid: {
                        display: false
                    }
                },

                y: {
                    ticks: {
                        color:
                        document.body.classList.contains("dark")
                        ? "#fff"
                        : "#000"
                    },

                    grid: {
                        color:
                        document.body.classList.contains("dark")
                        ? "rgba(255,255,255,.08)"
                        : "rgba(0,0,0,.08)"
                    }
                }
            }
        }
    })
}

flatpickr("#intervalo", {

mode:"range",

locale:"pt",

dateFormat:"d/m/Y"

})

// PRIMEIRA CARGA
carregarDados()

// ATUALIZA A CADA 5 SEGUNDOS
setInterval(carregarDados, 5000)

/* MENU */

const menuBtn =
document.getElementById("menuBtn")

const sidebar =
document.getElementById("sidebar")

menuBtn.onclick = () => {
    sidebar.classList.toggle("open")
}

/* TEMA */

document.getElementById("temaBtn")
.onclick = () => {

    document.body.classList.toggle("dark")

    carregarDados()
}

/* NAVEGAÇÃO */

document.querySelectorAll(".nav-btn")
.forEach(btn => {

    btn.onclick = () => {

        document.querySelectorAll(".nav-btn")
        .forEach(b =>
            b.classList.remove("active")
        )

        btn.classList.add("active")

        const page =
            btn.dataset.page

        document.querySelectorAll(".page")
        .forEach(p =>
            p.classList.remove("active")
        )

        document.getElementById(page)
        .classList.add("active")
    }
})

/* COMPARATIVO */

document.getElementById("btnComparar")
.onclick = carregarComparativo