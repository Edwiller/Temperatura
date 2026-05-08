export default async function handler(req, res) {

    try {

        // SUPABASE
        const SUPABASE_URL =
            "https://mrahvdxihpbzikdcmafo.supabase.co"

        const SUPABASE_KEY =
            "sb_publishable_CZ7Ku_eOdxMEXfhHq4JVHA_SKqerTuU"

        // CALLMEBOT
        const PHONE =
            "556899611414"

        const APIKEY =
            "3389211"

        // BUSCA ÚLTIMA TEMPERATURA
        const resposta = await fetch(
            `${SUPABASE_URL}/rest/v1/temperaturas?select=*&order=data.desc&limit=1`,
            {
                headers: {
                    apikey: SUPABASE_KEY,
                    Authorization:
                        `Bearer ${SUPABASE_KEY}`
                }
            }
        )

        const dados = await resposta.json()

        if (!dados || dados.length === 0) {

            return res.status(200).json({
                erro: "Sem dados"
            })
        }

        const temperatura =
            dados[0].valor

        // LIMITE
        if (temperatura > 0) {

            const mensagem =
                `🚨 ALERTA! Temperatura muito alta: ${temperatura}°C`

            // ENVIA WHATSAPP
            await fetch(
                `https://api.callmebot.com/whatsapp.php?phone=${PHONE}&text=${encodeURIComponent(mensagem)}&apikey=${APIKEY}`
            )

            return res.status(200).json({
                enviado: true,
                temperatura
            })
        }

        return res.status(200).json({
            enviado: false,
            temperatura
        })

    } catch (erro) {

        return res.status(500).json({
            erro: erro.message
        })
    }
}