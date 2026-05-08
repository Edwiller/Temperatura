export function filtrarDadosGrafico(dados) {

    if (!dados || dados.length === 0) {
        return []
    }

    let resultado = []

    let ultimoValor = null
    let ultimoTempo = 0

    dados.forEach(item => {

        const valor = Number(item.valor).toFixed(2)

        const tempoAtual =
            new Date(item.data).getTime()

        // PRIMEIRO REGISTRO
        if (ultimoValor === null) {

            resultado.push(item)

            ultimoValor = valor
            ultimoTempo = tempoAtual

            return
        }

        const diferencaTempo =
            tempoAtual - ultimoTempo

        // 3 MINUTOS
        const tresMinutos =
            3 * 60 * 1000

        // SÓ ADICIONA SE:
        // passou 3 minutos
        // E o valor mudou

        if (
            diferencaTempo >= tresMinutos &&
            valor !== ultimoValor
        ) {

            resultado.push(item)

            ultimoValor = valor
            ultimoTempo = tempoAtual
        }

    })

    return resultado
}