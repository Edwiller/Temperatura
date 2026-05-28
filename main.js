import { supabase } from "./supabase.js"
import { carregarComparativo } from "./comparativo.js"
import { filtrarDadosGrafico } from "./chart.js"

const ctx = document.getElementById("graficoTemperatura")
const TIMEZONE = "America/Rio_Branco"

let grafico = null
let ultimoRegistro = null

// ── Relógio ──────────────────────────────────────
function iniciarRelogio() {
    const el = document.getElementById("relogioNTP")
    if (!el) return
    setInterval(() => {
        el.textContent = new Date().toLocaleTimeString("pt-BR", {
            timeZone: TIMEZONE,
            hour: "2-digit", minute: "2-digit", second: "2-digit",
            hour12: false
        })
        document.getElementById("statusNTP").textContent = "Sincronizado ✓"
    }, 1000)
}

// ── Utilitários de data ───────────────────────────
function inicioDiaAcre() {
    return new Date().toLocaleDateString("en-CA", { timeZone: TIMEZONE }) + " 00:00:00"
}
function fimDiaAcre() {
    return new Date().toLocaleDateString("en-CA", { timeZone: TIMEZONE }) + " 23:59:59"
}

// ── Carregar dados ────────────────────────────────
async function carregarDados() {
    const hoje = new Date()
    document.getElementById("tituloHoje").textContent =
        "Temperatura " + hoje.toLocaleDateString("pt-BR", { timeZone: TIMEZONE })

    const { data, error } = await supabase
        .from("temperaturas")
        .select("*")
        .gte("data", inicioDiaAcre())
        .lte("data", fimDiaAcre())
        .order("data", { ascending: true })

    if (error) { console.error("Supabase erro:", error); return }
    if (!data || data.length === 0) return

    const ultimoAtual = data[data.length - 1].id
    if (ultimoRegistro === ultimoAtual) return
    ultimoRegistro = ultimoAtual

    const filtrado = filtrarDadosGrafico(data)
    const valores = filtrado.map(i => Number(i.valor))

    document.getElementById("tempAtual").textContent = `${valores[valores.length - 1]?.toFixed(2)}°C`
    document.getElementById("tempMax").textContent = `${Math.max(...valores).toFixed(2)}°C`
    document.getElementById("tempMin").textContent = `${Math.min(...valores).toFixed(2)}°C`

    const dadosGrafico = filtrado.map(item => ({
        x: new Date(item.data.replace(" ", "T")),  // sem offset, já é Acre
        y: Number(item.valor)
    }))

    if (grafico) grafico.destroy()

    // ✅ dark mode agora está em <html>, não em <body>
    const isDark = document.documentElement.classList.contains("dark")
    const corTexto = isDark ? "#e2e8f0" : "#334155"
    const corGrid = isDark ? "rgba(255,255,255,.05)" : "rgba(0,0,0,.06)"

    const dataAcre = new Date().toLocaleDateString("en-CA", { timeZone: TIMEZONE })

    grafico = new Chart(ctx, {
        type: "line",
        data: {
            datasets: [{
                label: "Temperatura",
                data: dadosGrafico,
                borderColor: "#3b6ef5",
                backgroundColor: "rgba(59,110,245,0.15)",
                fill: true,
                tension: 0.4,
                cubicInterpolationMode: "monotone",
                borderWidth: 2.5,
                pointRadius: 3,
                pointHoverRadius: 6,
                pointBackgroundColor: "#3b6ef5",
                pointBorderColor: "#ffffff",
                pointBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { intersect: false, mode: "index" },
            plugins: {
                legend: { labels: { color: corTexto, font: { size: 13, weight: "600" } } }
            },
            scales: {
                x: {
                    type: "time",
                    min: dataAcre + "T00:00:00",
                    max: dataAcre + "T23:59:59",
                    time: { unit: "hour", displayFormats: { hour: "HH:mm" } },
                    ticks: { color: corTexto, maxRotation: 0, maxTicksLimit: 12 },
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

// ── Flatpickr ─────────────────────────────────────
flatpickr("#intervalo", { mode: "range", locale: "pt", dateFormat: "d/m/Y" })

// ── Init ──────────────────────────────────────────
iniciarRelogio()
carregarDados()
setInterval(carregarDados, 15000)

// ── Comparativo ───────────────────────────────────
document.getElementById("btnComparar").onclick = carregarComparativo