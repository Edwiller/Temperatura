export function filtrarDadosGrafico(data) {

    if (!data || data.length === 0) {
        return []
    }

    const resultado = []

    let ultimoValor = null

    let ultimoHorario = null

    data.forEach(item => {

        const dataAtual =
            new Date(item.data)

        const valorAtual =
            Number(item.valor)

        // PRIMEIRO ITEM
        if (ultimoValor === null) {

            resultado.push(item)

            ultimoValor = valorAtual

            ultimoHorario = dataAtual

            return
        }

        // DIFERENÇA EM MINUTOS
        const diferencaMinutos =
            (dataAtual - ultimoHorario) / 1000 / 60

        // SE MUDOU VALOR → ADICIONA
        if (valorAtual !== ultimoValor) {

            resultado.push(item)

            ultimoValor = valorAtual

            ultimoHorario = dataAtual

            return
        }

        // SE PASSOU 3 MIN → ADICIONA
        if (diferencaMinutos >= 3) {

            resultado.push(item)

            ultimoHorario = dataAtual
        }
    })

    return resultado
}