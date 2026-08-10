const elementosObrigatorios = [

    "formCaixa",

    "codigo",
    "nome",

    "volume",
    "comprimento",
    "largura",
    "altura",

    "hemocomponentes",
    "gelo",

    "temperaturaMin",
    "temperaturaMax",

    "sensor",

    "sensorCarregando",
    "sensorContainer",
    "semSensores",

    "mensagem",

    "btnLimpar",
    "btnSalvar",
    "btnSalvarTexto",
    "btnSalvarSpinner"

];


let passou = true;


console.group(
    "TESTE: estrutura do index.html"
);


elementosObrigatorios.forEach(
    id => {

        const elemento =
            document.getElementById(id);


        if (elemento) {

            console.log(
                `✅ ${id}`
            );

        } else {

            console.error(
                `❌ Elemento não encontrado: ${id}`
            );

            passou = false;

        }

    }
);


if (passou) {

    console.log(
        "✅ TESTE PASSOU: todos os elementos existem."
    );

} else {

    console.error(
        "❌ TESTE FALHOU: existem elementos faltando."
    );

}


console.groupEnd();