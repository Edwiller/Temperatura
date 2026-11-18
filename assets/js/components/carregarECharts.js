let carregamento;

export function carregarECharts() {
    if (window.echarts) return Promise.resolve();

    carregamento ??= new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/npm/echarts@6.0.0/dist/echarts.min.js";
        function falhar() {
            script.remove();
            reject(new Error("Não foi possível carregar o gráfico."));
        }
        script.addEventListener("load", () => window.echarts ? resolve() : falhar(), { once: true });
        script.addEventListener("error", falhar, { once: true });
        document.head.append(script);
    }).catch(erro => {
        carregamento = undefined;
        throw erro;
    });

    return carregamento;
}
