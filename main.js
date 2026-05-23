import { supabase } from "./supabase.js"
import { carregarComparativo } from "./comparativo.js"
import { filtrarDadosGrafico } from "./chart.js"

const ctx = document.getElementById("graficoTemperatura")
const TIMEZONE = "America/Rio_Branco"

let grafico = null
let ultimoRegistro = null

// =========================
// RELÓGIO
// =========================

function iniciarRelogio() {
    const el = document.getElementById("relogioNTP")
    if (!el) return

    setInterval(() => {
        el.textContent = new Date().toLocaleTimeString("pt-BR", {
            timeZone: TIMEZONE,
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false
        })
    }, 1000)
}

// =========================
// CARREGAR DADOS
// =========================

async function carregarDados() {

    const hoje = new Date()
    const dataAcre = hoje.toLocaleDateString("en-CA", { timeZone: TIMEZONE })

    // banco salva em horário de Brasília (UTC-3)
    // intervalo do dia no Acre (UTC-5)
    const inicioHoje = new Date(dataAcre + "T00:00:00-05:00")
    const fimHoje = new Date(dataAcre + "T23:59:59-05:00")

    document.getElementById("tituloHoje").innerHTML =
        `Temperatura ${hoje.toLocaleDateString("pt-BR", { timeZone: TIMEZONE })}`

    const { data, error } = await supabase
        .from("temperaturas")
        .select("*")
        .gte("data", inicioHoje.toISOString())
        .lte("data", fimHoje.toISOString())
        .order("data", { ascending: true })

    if (error) {
        console.error("Erro Supabase:", error)
        return
    }

    if (!data || data.length === 0) return

    const ultimoAtual = data[data.length - 1].id

    // só re-renderiza se chegou dado novo
    if (ultimoRegistro === ultimoAtual) return
    ultimoRegistro = ultimoAtual

    const filtrado = filtrarDadosGrafico(data)
    const valores = filtrado.map(i => Number(i.valor))

    // =========================
    // CARDS
    // =========================

    document.getElementById("tempAtual").innerHTML =
        `${valores[valores.length - 1]?.toFixed(2)}°C`

    document.getElementById("tempMax").innerHTML =
        `${Math.max(...valores).toFixed(2)}°C`

    document.getElementById("tempMin").innerHTML =
        `${Math.min(...valores).toFixed(2)}°C`

    // =========================
    // LABELS
    // banco salva sem timezone (Brasília UTC-3)
    // replace(" ","T") + "-03:00" → converte para UTC → exibe no Acre
    // =========================

    const labels = filtrado.map(item =>
        new Date(item.data.replace(" ", "T") + "-03:00")
            .toLocaleTimeString("pt-BR", {
                timeZone: TIMEZONE,
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit"
            })
    )

    const valoresGrafico = filtrado.map(item => Number(item.valor))

    if (grafico) grafico.destroy()

    const isDark = document.body.classList.contains("dark")
    const corTexto = isDark ? "#fff" : "#000"
    const corGrid = isDark ? "rgba(255,255,255,.06)" : "rgba(0,0,0,.06)"

    grafico = new Chart(ctx, {
        type: "line",
        data: {
            labels,
            datasets: [{
                label: "Temperatura",
                data: valoresGrafico,
                borderColor: "#4f7cff",
                backgroundColor: "rgba(79,124,255,0.25)",
                fill: true,
                tension: 0.4,
                cubicInterpolationMode: "monotone",
                borderWidth: 3,
                pointRadius: 4,
                pointHoverRadius: 7,
                pointBackgroundColor: "#4f7cff",
                pointBorderColor: "#ffffff",
                pointBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { intersect: false, mode: "index" },
            plugins: {
                legend: {
                    labels: {
                        color: corTexto,
                        font: { size: 16, weight: "bold" }
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: corTexto,
                        maxRotation: 0,
                        autoSkip: true,
                        maxTicksLimit: 12
                    },
                    grid: { display: false }
                },
                y: {
                    ticks: { color: corTexto },
                    grid: { color: corGrid }
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
// INICIALIZAÇÃO
// =========================

iniciarRelogio()
carregarDados()
setInterval(carregarDados, 3000)

// =========================
// MENU
// =========================

document.getElementById("menuBtn").onclick = () => {
    document.getElementById("sidebar").classList.toggle("open")
}

// =========================
// TEMA
// =========================

document.getElementById("temaBtn").onclick = () => {
    document.body.classList.toggle("dark")
    ultimoRegistro = null  // força re-render com as cores novas
    carregarDados()
}

// =========================
// NAVEGAÇÃO
// =========================

document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.onclick = () => {
        document.querySelectorAll(".nav-btn")
            .forEach(b => b.classList.remove("active"))
        btn.classList.add("active")

        const page = btn.dataset.page
        document.querySelectorAll(".page")
            .forEach(p => p.classList.remove("active"))
        document.getElementById(page).classList.add("active")
    }
})

// =========================
// COMPARATIVO
// =========================

document.getElementById("btnComparar").onclick = carregarComparativo