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

    if (!inicio || !fim) {
        alert("Selecione o período")
        return
    }

    // intervalo no fuso do Acre (UTC-5)
    const inicioISO = new Date(inicio + "T00:00:00-05:00").toISOString()
    const fimISO = new Date(fim + "T23:59:59-05:00").toISOString()

    const { data, error } = await supabase
        .from("temperaturas")
        .select("*")
        .gte("data", inicioISO)
        .lte("data", fimISO)
        .order("data")

    if (error) {
        console.error("Erro Supabase:", error)
        return
    }

    if (!data || !data.length) {
        alert("Sem dados nesse período")
        return
    }

    const valores = data.map(d => Number(d.valor))
    const maior = Math.max(...valores)
    const menor = Math.min(...valores)
    const media = (valores.reduce((a, b) => a + b, 0) / valores.length).toFixed(2)

    document.getElementById("maiorTemp").innerHTML = `${maior.toFixed(2)}°C`
    document.getElementById("menorTemp").innerHTML = `${menor.toFixed(2)}°C`
    document.getElementById("mediaTemp").innerHTML = `${media}°C`

    const ctx = document.getElementById("graficoComparativo")
    if (graficoComparativo) graficoComparativo.destroy()

    graficoComparativo = new Chart(ctx, {
        type: "line",
        data: {
            labels: data.map(d =>
                new Date(d.data.replace(" ", "T") + "-03:00")
                    .toLocaleDateString("pt-BR", { timeZone: TIMEZONE })
            ),
            datasets: [{
                label: "Temperatura",
                data: valores,
                borderColor: "#2563eb",
                backgroundColor: "rgba(37,99,235,.2)",
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    })
}