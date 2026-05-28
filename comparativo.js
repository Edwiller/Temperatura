import { supabase } from "./supabase.js"

const TIMEZONE = "America/Rio_Branco"
let graficoComparativo = null

export async function carregarComparativo() {
    const valor = document.getElementById("intervalo").value

    if (!valor.includes(" até ")) {
        alert("Selecione um intervalo")
        return
    }

    const partes = valor.split(" até ")
    const inicio = partes[0].split("/").reverse().join("-")
    const fim = partes[1].split("/").reverse().join("-")

    if (!inicio || !fim) { alert("Selecione o período"); return }

    // ✅ strings no formato do banco, sem Z
    const inicioStr = inicio + " 00:00:00"
    const fimStr = fim + " 23:59:59"

    const { data, error } = await supabase
        .from("temperaturas")
        .select("*")
        .gte("data", inicioStr)
        .lte("data", fimStr)
        .order("data")

    if (error) { console.error("Erro Supabase:", error); return }
    if (!data || !data.length) { alert("Sem dados nesse período"); return }

    const valores = data.map(d => Number(d.valor))
    const maior = Math.max(...valores)
    const menor = Math.min(...valores)
    const media = (valores.reduce((a, b) => a + b, 0) / valores.length).toFixed(2)

    document.getElementById("maiorTemp").innerHTML = `${maior.toFixed(2)}°C`
    document.getElementById("menorTemp").innerHTML = `${menor.toFixed(2)}°C`
    document.getElementById("mediaTemp").innerHTML = `${media}°C`

    const ctx = document.getElementById("graficoComparativo")
    if (graficoComparativo) graficoComparativo.destroy()

    const isDark = document.documentElement.classList.contains("dark")
    const corTexto = isDark ? "#fff" : "#333"
    const corGrid = isDark ? "rgba(255,255,255,.06)" : "rgba(0,0,0,.06)"

    graficoComparativo = new Chart(ctx, {
        type: "line",
        data: {
            // ✅ sem offset, dado já é Acre
            labels: data.map(d =>
                new Date(d.data.replace(" ", "T"))
                    .toLocaleDateString("pt-BR", { timeZone: TIMEZONE })
            ),
            datasets: [{
                label: "Temperatura",
                data: valores,
                borderColor: "#3b6ef5",
                backgroundColor: "rgba(59,110,245,.2)",
                fill: true,
                tension: 0.4,
                borderWidth: 2.5,
                pointRadius: 2,
                pointHoverRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { labels: { color: corTexto } } },
            scales: {
                x: { ticks: { color: corTexto, maxTicksLimit: 10 }, grid: { display: false } },
                y: { ticks: { color: corTexto }, grid: { color: corGrid } }
            }
        }
    })
}