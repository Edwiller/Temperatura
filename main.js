import { supabase } from "./supabase.js"
import { carregarComparativo } from "./comparativo.js"
import { filtrarDadosGrafico } from "./chart.js"

const ctx = document.getElementById("graficoTemperatura")

let grafico = null
let ultimoRegistro = null

// =========================
// NTP — HORÁRIO DO ACRE
// =========================

const TIMEZONE = "America/Rio_Branco"
let ntpOffset = 0

async function syncNTP() {
    try {
        const t0 = Date.now()
        const res = await fetch(
            "https://worldtimeapi.org/api/timezone/America/Rio_Branco"
        )
        const data = await res.json()
        const latency = Math.round((Date.now() - t0) / 2)
        ntpOffset = data.unixtime * 1000 - Date.now() + latency
        atualizarStatusNTP("sync")
    } catch (e) {
        console.warn("Falha ao sincronizar NTP, usando relógio local.", e)
        atualizarStatusNTP("error")
    }
}

function getNTPDate() {
    return new Date(Date.now() + ntpOffset)
}

// =========================
// RELÓGIO NO FRONT-END
// =========================

function iniciarRelogio() {
    const el = document.getElementById("relogioNTP")
    if (!el) return

    setInterval(() => {
        el.textContent = getNTPDate().toLocaleTimeString("pt-BR", {
            timeZone: TIMEZONE,
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false
        })
    }, 1000)
}

function atualizarStatusNTP(estado) {
    const el = document.getElementById("statusNTP")
    if (!el) return
    el.textContent = estado === "sync" ? "🟢 NTP sincronizado" : "🔴 Relógio local"
}

// =========================
// CARREGAMENTO DE DADOS
// =========================

async function carregarDados() {

    const hoje = getNTPDate()

    const dataAcre = hoje.toLocaleDateString("en-CA", {
        timeZone: TIMEZONE
    })

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
        console.log(error)
        return
    }

    if (!data || data.length === 0) return

    const ultimoAtual = data[data.length - 1].id

    if (ultimoRegistro === ultimoAtual) return

    ultimoRegistro = ultimoAtual

    const filtrado = filtrarDadosGrafico(data)
    const valores = filtrado.map(i => i.valor)

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
    // LABELS — HORÁRIO NO FUSO DO ACRE
    // + "Z" força interpretação como UTC
    // =========================

    const labels = filtrado.map(item =>
        new Date(item.data + "-03:00").toLocaleTimeString("pt-BR", {
            timeZone: TIMEZONE,
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        })
    )

    const valoresGrafico = filtrado.map(item => item.valor)

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
            interaction: {
                intersect: false,
                mode: "index"
            },
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

await syncNTP()
iniciarRelogio()
setInterval(syncNTP, 5 * 60 * 1000)

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