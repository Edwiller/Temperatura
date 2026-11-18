const chaveTema = "temperatura.portal.tema";
export const eventoTemaPortal = "tema-do-portal";

export function configurarTemaPortal(botao) {
    let preferencia = null;
    try {
        preferencia = localStorage.getItem(chaveTema);
    } catch {
        // O tema continua disponível nesta página mesmo sem armazenamento local.
    }

    function aplicar(escuro) {
        document.body.classList.toggle("portal-tema-escuro", escuro);
        botao.textContent = escuro ? "Tema claro" : "Tema escuro";
        window.dispatchEvent(new Event(eventoTemaPortal));
    }

    aplicar(preferencia === null
        ? window.matchMedia("(prefers-color-scheme: dark)").matches
        : preferencia === "escuro");

    botao.addEventListener("click", () => {
        const escuro = !document.body.classList.contains("portal-tema-escuro");
        aplicar(escuro);
        try {
            localStorage.setItem(chaveTema, escuro ? "escuro" : "claro");
        } catch {
            // A escolha já foi aplicada na página atual.
        }
    });
}

export function coresGrafico(escuro = document.body.classList.contains("portal-tema-escuro")) {
    const cor = escuro ? "#d3e3e8" : "#334155";
    return {
        textStyle: { color: cor },
        color: escuro
            ? ["#52b7cb", "#c197ed", "#f2a179", "#73c9a6", "#86aaf3", "#e592ac"]
            : ["#17647a", "#8b46bf", "#cd6842", "#1f875e", "#3b70c5", "#a34762"],
        legend: { textStyle: { color: cor }, pageTextStyle: { color: cor } },
        tooltip: {
            backgroundColor: escuro ? "#1b303a" : "#fff",
            borderColor: escuro ? "#39515b" : "#dce6e9",
            textStyle: { color: cor }
        },
        xAxis: { axisLabel: { color: cor } },
        yAxis: {
            axisLabel: { color: cor },
            splitLine: { lineStyle: { color: escuro ? "#324952" : "#e4ecef" } }
        }
    };
}
