import { timingSafeEqual } from "node:crypto";

function tokenValido(authorization, token) {
    if (typeof authorization !== "string" || !authorization.startsWith("Bearer ")) return false;
    const recebido = Buffer.from(authorization.slice(7));
    const esperado = Buffer.from(token);
    return recebido.length === esperado.length && timingSafeEqual(recebido, esperado);
}

export default async function handler(req, res) {
    res.setHeader("Cache-Control", "no-store");
    if (req.method !== "GET" && req.method !== "POST") {
        res.setHeader("Allow", "GET, POST");
        return res.status(405).json({ erro: "Método não permitido." });
    }

    const token = process.env.TEMPERATURA_ALERTA_TOKEN || process.env.CRON_SECRET;
    const { SUPABASE_URL, SUPABASE_SECRET_KEY, CALLMEBOT_PHONE, CALLMEBOT_API_KEY } = process.env;
    if (!token || !SUPABASE_URL || !SUPABASE_SECRET_KEY || !CALLMEBOT_PHONE || !CALLMEBOT_API_KEY) {
        return res.status(503).json({ erro: "Alertas ainda não configurados." });
    }
    if (!tokenValido(req.headers?.authorization, token)) {
        return res.status(401).json({ erro: "Não autorizado." });
    }

    try {
        const consulta = new URL("/rest/v1/temperaturas", SUPABASE_URL);
        consulta.search = new URLSearchParams({ select: "valor", order: "data.desc", limit: "1" });
        const resposta = await fetch(consulta, { headers: { apikey: SUPABASE_SECRET_KEY } });
        if (!resposta.ok) return res.status(502).json({ erro: "Não foi possível consultar a temperatura." });

        const [leitura] = await resposta.json();
        if (!leitura) return res.status(200).json({ erro: "Sem dados" });

        const temperatura = leitura.valor;
        if (temperatura > 0) {
            const destino = new URL("https://api.callmebot.com/whatsapp.php");
            destino.search = new URLSearchParams({
                phone: CALLMEBOT_PHONE,
                apikey: CALLMEBOT_API_KEY,
                text: `🚨 ALERTA! Temperatura muito alta: ${temperatura}°C`
            });
            const envio = await fetch(destino);
            if (!envio.ok) return res.status(502).json({ erro: "Não foi possível enviar o alerta." });
            return res.status(200).json({ enviado: true, temperatura });
        }

        return res.status(200).json({ enviado: false, temperatura });
    } catch {
        return res.status(502).json({ erro: "Não foi possível processar o alerta." });
    }
}
