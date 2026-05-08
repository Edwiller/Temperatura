import { supabase } from "./supabase.js"

let graficoComparativo = null

export async function carregarComparativo(){

const valor =
document.getElementById("intervalo").value

if(!valor.includes(" até ")){

alert("Selecione um intervalo")
return

}

const partes =
valor.split(" até ")

const inicio =
partes[0]
.split("/")
.reverse()
.join("-")

const fim =
partes[1]
.split("/")
.reverse()
.join("-")

if(!inicio || !fim){
alert("Selecione o período")
return
}

const { data, error } = await supabase
.from("temperaturas")
.select("*")
.gte("data", inicio)
.lte("data", fim + "T23:59:59")
.order("data")

if(error){
console.log(error)
return
}

if(!data.length){
alert("Sem dados nesse período")
return
}

const valores = data.map(d => d.valor)

const maior = Math.max(...valores)
const menor = Math.min(...valores)

const media = (
valores.reduce((a,b)=>a+b,0)
/
valores.length
).toFixed(2)

document.getElementById("maiorTemp").innerHTML =
`${maior.toFixed(2)}°C`

document.getElementById("menorTemp").innerHTML =
`${menor.toFixed(2)}°C`

document.getElementById("mediaTemp").innerHTML =
`${media}°C`

const ctx =
document.getElementById("graficoComparativo")

if(graficoComparativo){
graficoComparativo.destroy()
}

graficoComparativo = new Chart(ctx,{
type:"line",
data:{
labels:data.map(d=>
new Date(d.data).toLocaleDateString("pt-BR")
),
datasets:[{
label:"Temperatura",
data:valores,
borderColor:"#2563eb",
backgroundColor:"rgba(37,99,235,.2)",
fill:true,
tension:.4
}]
},
options:{
responsive:true
}
})

}