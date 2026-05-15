import { supabase } from "./supabase.js"
import { carregarComparativo } from "./comparativo.js"
import { filtrarDadosGrafico } from "./chart.js"

const ctx =
    document.getElementById("graficoTemperatura")

let grafico = null

let ultimoRegistro = null

async function carregarDados() {

    const hoje = new Date()

    // INÍCIO DO DIA
    const inicioHoje = new Date()

    inicioHoje.setHours(0, 0, 0, 0)

    // FIM DO DIA
    const fimHoje = new Date()

    fimHoje.setHours(23, 59, 59, 999)

    document.getElementById("tituloHoje")
        .innerHTML =
        `Temperatura ${hoje.toLocaleDateString("pt-BR")}`

    // BUSCA DADOS DO DIA
    const { data, error } = await supabase
        .from("temperaturas")
        .select("*")
        .gte("data", inicioHoje.toISOString())
        .lte("data", fimHoje.toISOString())
        .order("data", { ascending: true })

    if (error) {

        console.log(error)

        return
    }

    if (!data || data.length === 0) {

        return
    }

    // ÚLTIMO REGISTRO
    const ultimoAtual =
        data[data.length - 1].id

    // EVITA RECARREGAR SEM DADOS NOVOS
    if (ultimoRegistro === ultimoAtual) {

        return
    }

    ultimoRegistro = ultimoAtual

    // FILTRO PERSONALIZADO
    const filtrado =
        filtrarDadosGrafico(data)

    const valores =
        filtrado.map(i => i.valor)

    // =========================
    // CARDS
    // =========================

    document.getElementById("tempAtual")
        .innerHTML =
        `${valores[valores.length - 1]?.toFixed(2)}°C`

    document.getElementById("tempMax")
        .innerHTML =
        `${Math.max(...valores).toFixed(2)}°C`

    document.getElementById("tempMin")
        .innerHTML =
        `${Math.min(...valores).toFixed(2)}°C`

    // =========================
    // HORÁRIOS EM PT-BR
    // =========================

    const labels = filtrado.map(item => {

        const dataBR =
            new Date(item.data)

        return dataBR.toLocaleTimeString("pt-BR", {

            hour: "2-digit",

            minute: "2-digit",

            second: "2-digit"
        })
    })

    // =========================
    // VALORES
    // =========================

    const valoresGrafico =
        filtrado.map(item => item.valor)

    // =========================
    // DESTROI ANTIGO
    // =========================

    if (grafico) {

        grafico.destroy()
    }

    // =========================
    // NOVO GRÁFICO
    // =========================

    grafico = new Chart(ctx, {

        type: "line",

        data: {

            labels: labels,

            datasets: [{

                label: "Temperatura",

                data: valoresGrafico,

                borderColor: "#4f7cff",

                backgroundColor:
                    "rgba(79,124,255,0.25)",

                fill: true,

                tension: 0.4,

                cubicInterpolationMode:
                    "monotone",

                borderWidth: 3,

                pointRadius: 4,

                pointHoverRadius: 7,

                pointBackgroundColor:
                    "#4f7cff",

                pointBorderColor:
                    "#ffffff",

                pointBorderWidth: 2
            }]
        },

        options: {

            responsive: true,

            maintainAspectRatio: false,

            interaction: {

                intersect: false,

                mode: "index"
            },

            plugins: {

                legend: {

                    labels: {

                        color:
                            document.body
                                .classList
                                .contains("dark")
                                ? "#fff"
                                : "#000",

                        font: {

                            size: 16,

                            weight: "bold"
                        }
                    }
                }
            },

            scales: {

                x: {

                    ticks: {

                        color:
                            document.body
                                .classList
                                .contains("dark")
                                ? "#fff"
                                : "#000",

                        maxRotation: 0,

                        autoSkip: true,

                        maxTicksLimit: 12
                    },

                    grid: {

                        display: false
                    }
                },

                y: {

                    ticks: {

                        color:
                            document.body
                                .classList
                                .contains("dark")
                                ? "#fff"
                                : "#000"
                    },

                    grid: {

                        color:
                            document.body
                                .classList
                                .contains("dark")
                                ? "rgba(255,255,255,.06)"
                                : "rgba(0,0,0,.06)"
                    }
                }
            }
        }
    })
}

// =========================
// FLATPICKR
// =========================

flatpickr("#intervalo", {

    mode: "range",

    locale: "pt",

    dateFormat: "d/m/Y"
})

// =========================
// PRIMEIRA CARGA
// =========================

carregarDados()

// =========================
// ATUALIZAÇÃO AUTOMÁTICA
// =========================

setInterval(async () => {

    await carregarDados()

}, 3000)

// =========================
// MENU
// =========================

const menuBtn =
    document.getElementById("menuBtn")

const sidebar =
    document.getElementById("sidebar")

menuBtn.onclick = () => {

    sidebar.classList.toggle("open")
}

// =========================
// TEMA
// =========================

document.getElementById("temaBtn")
    .onclick = () => {

        document.body
            .classList
            .toggle("dark")

        carregarDados()
    }

// =========================
// NAVEGAÇÃO
// =========================

document.querySelectorAll(".nav-btn")
    .forEach(btn => {

        btn.onclick = () => {

            document
                .querySelectorAll(".nav-btn")
                .forEach(b =>
                    b.classList.remove("active")
                )

            btn.classList.add("active")

            const page =
                btn.dataset.page

            document
                .querySelectorAll(".page")
                .forEach(p =>
                    p.classList.remove("active")
                )

            document
                .getElementById(page)
                .classList.add("active")
        }
    })

// =========================
// COMPARATIVO
// =========================

document.getElementById("btnComparar")
    .onclick = carregarComparativo