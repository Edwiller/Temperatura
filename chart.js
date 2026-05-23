export function filtrarDadosGrafico(data) {

    if (!data || data.length === 0) return []

    const resultado = []
    let ultimoValor = null
    let ultimoHorario = null

    data.forEach(item => {

        // banco salva sem timezone (Brasília UTC-3)
        const dataAtual = new Date(item.data.replace(" ", "T") + "-03:00")
        const valorAtual = Number(item.valor)

        if (ultimoValor === null) {
            resultado.push(item)
            ultimoValor = valorAtual
            ultimoHorario = dataAtual
            return
        }

        const diferencaMinutos = (dataAtual - ultimoHorario) / 1000 / 60

        if (valorAtual !== ultimoValor) {
            resultado.push(item)
            ultimoValor = valorAtual
            ultimoHorario = dataAtual
            return
        }

        if (diferencaMinutos >= 3) {
            resultado.push(item)
            ultimoHorario = dataAtual
        }
    })

    return resultado
}