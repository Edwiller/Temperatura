import { supabase } from "./supabase.js"
import { carregarComparativo } from "./comparativo.js"

// ── Injeção da Configuração do Tailwind ───────────
window.tailwind.config = {
    darkMode: 'class',
    theme: {
        extend: {
            fontFamily: {
                sans: ['Sora', 'sans-serif'],
                mono: ['DM Mono', 'monospace'],
            },
            colors: {
                accent: '#3b6ef5',
                'accent-dark': '#2a54c7',
            }
        }
    }
}

const ctx = document.getElementById("graficoTemperatura")
const TIMEZONE = "America/Rio_Branco"

let grafico = null
let ultimoRegistro = null
let dataSelecionada = null   // null = hoje
let cacheDadosImpressao = [] // Armazena dados completos do dia atual selecionado

// ── Funções de Controle do Menu Mobile ────────────
function abrirMenu() {
    document.getElementById('sidebar').classList.remove('-translate-x-full')
    document.getElementById('overlay').classList.remove('hidden')
}

function fecharMenu() {
    document.getElementById('sidebar').classList.add('-translate-x-full')
    document.getElementById('overlay').classList.add('hidden')
}

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
    return dataSelecionada ?? new Date().toLocaleDateString("en-CA", { timeZone: TIMEZONE })
}

function inicioDia(dia) { return dia + " 00:00:00" }
function fimDia(dia) { return dia + " 23:59:59" }

// ── Busca registros no Supabase ───────────────────
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

// ── Preencher Tabela de Dados abaixo do Gráfico ───
function preencherTabelaImpressao(data) {
    const corpoTabela = document.getElementById("corpoTabelaImpressao")
    if (!corpoTabela) return

    corpoTabela.innerHTML = "" // Limpa registros antigos

    if (!data || data.length === 0) {
        corpoTabela.innerHTML = `<tr><td colspan="2" class="text-center p-3 text-slate-400">Nenhum dado encontrado para este período.</td></tr>`
        return
    }

    // Estruturação inteligente: se houver mais de 60 registros, amostra de 15 em 15 minutos para manter o relatório limpo
    const intervaloAmostra = data.length > 60 ? Math.ceil(data.length / 48) : 1;

    data.forEach((item, index) => {
        if (index % intervaloAmostra !== 0 && index !== data.length - 1) return;

        const dataObjeto = new Date(item.data.replace(" ", "T"))
        const horarioFormatado = dataObjeto.toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit"
        })

        const tr = document.createElement("tr")
        tr.className = "border-b border-slate-100 hover:bg-slate-50"
        tr.innerHTML = `
            <td class="p-3 font-medium text-slate-700">${horarioFormatado}</td>
            <td class="p-3 text-slate-900 font-semibold">${Number(item.valor).toFixed(2)} °C</td>
        `
        corpoTabela.appendChild(tr)
    })
}

// ── Carregar dados e renderizar gráfico ───────────
async function carregarDados() {
    const dia = getDia()
    const ehHoje = dia === new Date().toLocaleDateString("en-CA", { timeZone: TIMEZONE })

    const [ano, mes, d] = dia.split("-")
    document.getElementById("tituloHoje").textContent = `Temperatura ${d}/${mes}/${ano}`

    const data = await buscarTodosDia(dia)
    if (!data || data.length === 0) return

    // Salva no cache global para o gerador de relatórios utilizar
    cacheDadosImpressao = data

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

// ── Atribuição dos Event listeners dos botões ─────
document.getElementById("menuBtn").addEventListener("click", abrirMenu)
document.getElementById("overlay").addEventListener("click", fecharMenu)

// Dispara a montagem dinâmica dos dados consolidados e define o nome do PDF antes de abrir o print nativo
document.getElementById("btnPrint").addEventListener("click", () => {
    // 1. Preenche a tabela com os dados do dia selecionado (pode ser hoje ou um dia anterior)
    preencherTabelaImpressao(cacheDadosImpressao)
    
    // 2. Descobre qual data está ativa para formatar o nome do arquivo
    const diaAtivo = getDia() // Retorna no formato YYYY-MM-DD
    const [ano, mes, dia] = diaAtivo.split("-")
    const dataFormatada = `${dia}/${mes}/${ano}`
    
    // 3. Salva o título original do site para restaurar depois
    const tituloOriginal = document.title
    
    // 4. Altera o título temporariamente (o navegador usa isso como nome padrão do PDF)
    document.title = `Histórico Temperaturas - ${dataFormatada}`
    
    // 5. Abre a janela de impressão do sistema
    window.print()
    
    // 6. Restaura o título original na aba do navegador assim que a janela fecha
    document.title = tituloOriginal
})

// Navegação entre páginas
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'))
        btn.classList.add('active')
        const page = btn.dataset.page
        document.querySelectorAll('.page').forEach(p => {
            p.classList.add('hidden')
            p.classList.remove('active')
        })
        const alvo = document.getElementById(page)
        alvo.classList.remove('hidden')
        alvo.classList.add('active')
        fecharMenu()
    })
})

// Tema dark/light
const html = document.documentElement
const temaBtn = document.getElementById('temaBtn')
const temaIcon = document.getElementById('temaIcon')
const temaLabel = document.getElementById('temaLabel')

if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    html.classList.add('dark')
    temaIcon.textContent = '☀️'
    temaLabel.textContent = 'Tema Claro'
}

temaBtn.addEventListener('click', () => {
    const isDark = html.classList.toggle('dark')
    temaIcon.textContent = isDark ? '☀️' : '🌙'
    temaLabel.textContent = isDark ? 'Tema Claro' : 'Tema Escuro'
    ultimoRegistro = null
    carregarDados()
})

// ── Inicialização dos componentes Flatpickr ───────
flatpickr("#filtroData", {
    locale: "pt",
    dateFormat: "d/m/Y",
    maxDate: "today",
    onChange(selectedDates) {
        if (!selectedDates.length) return
        const d = selectedDates[0]
        dataSelecionada = d.toLocaleDateString("en-CA")
        ultimoRegistro = null
        carregarDados()
    }
})

flatpickr("#intervalo", { mode: "range", locale: "pt", dateFormat: "d/m/Y" })

// ── Execução Inicial ──────────────────────────────
iniciarRelogio()
carregarDados()
setInterval(carregarDados, 15000)

document.getElementById("btnComparar").onclick = carregarComparativo