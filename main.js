import { supabase } from "./supabase.js"
import { carregarComparativo } from "./comparativo.js"

const ctx = document.getElementById("graficoTemperatura")
const TIMEZONE = "America/Rio_Branco"

let grafico = null
let ultimoRegistro = null
let dataSelecionada = null   // null = hoje

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
function getDia() {
    // Se há data selecionada usa ela, senão pega hoje no Acre
    return dataSelecionada
        ?? new Date().toLocaleDateString("en-CA", { timeZone: TIMEZONE })
}

function inicioDia(dia) { return dia + " 00:00:00" }
function fimDia(dia) { return dia + " 23:59:59" }

// ── Busca TODOS os registros do dia (pagina automaticamente) ──
async function buscarTodosDia(dia) {
    const PAGE = 1000
    let todos = []
    let from = 0

    while (true) {
        const { data, error } = await supabase
            .from("temperaturas")
            .select("*")
            .gte("data", inicioDia(dia))
            .lte("data", fimDia(dia))
            .order("data", { ascending: true })
            .range(from, from + PAGE - 1)

        if (error) { console.error("Supabase erro:", error); break }
        if (!data || data.length === 0) break

        todos = todos.concat(data)
        if (data.length < PAGE) break
        from += PAGE
    }

    return todos
}

// ── Carregar dados ────────────────────────────────
async function carregarDados() {
    const dia = getDia()

    // Só bloqueia re-render pelo ultimoRegistro quando estiver no dia de hoje
    const ehHoje = dia === new Date().toLocaleDateString("en-CA", { timeZone: TIMEZONE })

    // Título com a data exibida
    const [ano, mes, d] = dia.split("-")
    document.getElementById("tituloHoje").textContent =
        `Temperatura ${d}/${mes}/${ano}`

    const data = await buscarTodosDia(dia)
    if (!data || data.length === 0) return

    // Cache só para o dia de hoje (evita re-renders desnecessários)
    if (ehHoje) {
        const ultimoAtual = data[data.length - 1].id
        if (ultimoRegistro === ultimoAtual) return
        ultimoRegistro = ultimoAtual
    }

    const valores = data.map(i => Number(i.valor))

    document.getElementById("tempAtual").textContent = `${valores[valores.length - 1]?.toFixed(2)}°C`
    document.getElementById("tempMax").textContent = `${Math.max(...valores).toFixed(2)}°C`
    document.getElementById("tempMin").textContent = `${Math.min(...valores).toFixed(2)}°C`

    const dadosGrafico = data.map(item => ({
        x: new Date(item.data.replace(" ", "T")),
        y: Number(item.valor)
    }))

    if (grafico) grafico.destroy()

    const isDark = document.documentElement.classList.contains("dark")
    const corTexto = isDark ? "#e2e8f0" : "#334155"
    const corGrid = isDark ? "rgba(255,255,255,.05)" : "rgba(0,0,0,.06)"
    const muitosDados = dadosGrafico.length > 500

    grafico = new Chart(ctx, {
        type: "line",
        data: {
            datasets: [{
                label: "Temperatura",
                data: dadosGrafico,
                borderColor: "#3b6ef5",
                backgroundColor: "rgba(59,110,245,0.12)",
                fill: true,
                tension: 0.3,
                borderWidth: muitosDados ? 1.5 : 2.5,
                pointRadius: muitosDados ? 0 : 3,
                pointHoverRadius: muitosDados ? 4 : 6,
                pointBackgroundColor: "#3b6ef5",
                pointBorderColor: "#ffffff",
                pointBorderWidth: 1.5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: muitosDados ? 0 : 400 },
            interaction: { intersect: false, mode: "index" },
            plugins: {
                legend: { labels: { color: corTexto, font: { size: 13, weight: "600" } } }
            },
            scales: {
                x: {
                    type: "time",
                    min: dia + "T00:00:00",
                    max: dia + "T23:59:59",
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

// ── Flatpickr — filtro de dia ─────────────────────
flatpickr("#filtroData", {
    locale: "pt",
    dateFormat: "d/m/Y",
    maxDate: "today",          // não permite data futura
    onChange(selectedDates) {
        if (!selectedDates.length) return
        const d = selectedDates[0]
        // converte para "YYYY-MM-DD"
        dataSelecionada = d.toLocaleDateString("en-CA")
        ultimoRegistro = null   // força re-render
        carregarDados()
    }
})

// Flatpickr — comparativo (range)
flatpickr("#intervalo", { mode: "range", locale: "pt", dateFormat: "d/m/Y" })

// ── Init ──────────────────────────────────────────
iniciarRelogio()
carregarDados()
setInterval(carregarDados, 15000)   // só atualiza se for hoje

// ── Comparativo ───────────────────────────────────
document.getElementById("btnComparar").onclick = carregarComparativo