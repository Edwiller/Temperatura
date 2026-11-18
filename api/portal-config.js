const desenvolvimento = "https://shmqizeqhqvxnllqztdf.supabase.co";
const producao = "https://mrahvdxihpbzikdcmafo.supabase.co";
const chavesPublicas = new Map([
    [desenvolvimento, "sb_publishable_NYYJ90k-cZcD7FJaZH9l9g_934T0-kw"],
    [producao, "sb_publishable_CZ7Ku_eOdxMEXfhHq4JVHA_SKqerTuU"]
]);

export default function handler(req, res) {
    res.setHeader("Cache-Control", "no-store");
    if (req.method !== "GET") {
        res.setHeader("Allow", "GET");
        return res.status(405).json({ erro: "Método não permitido." });
    }

    const ambiente = process.env.VERCEL_ENV;
    const esperado = ambiente === "production" ? producao
        : ["preview", "development"].includes(ambiente) ? desenvolvimento : null;
    const url = process.env.SUPABASE_URL?.trim().replace(/\/$/, "") || esperado;
    const chave = process.env.SUPABASE_PUBLISHABLE_KEY?.trim() || chavesPublicas.get(url);
    if (!chavesPublicas.has(url) || (esperado && url !== esperado)
        || !chave || !/^sb_publishable_[a-zA-Z0-9_-]+$/.test(chave)) {
        return res.status(503).json({ erro: "Configuração do Supabase indisponível para este ambiente." });
    }

    res.setHeader("Cache-Control", "private, max-age=300");
    return res.status(200).json({ url, chave });
}
