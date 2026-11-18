import { obterSupabase } from "../config/supabase.js?v=fluxo-sessao-1";

const form = document.getElementById("formUsuario");
const botao = form.querySelector("button");
const mensagem = document.getElementById("mensagemCadastro");

form.addEventListener("submit", async evento => {
    evento.preventDefault();
    const usuario = form.elements.usuario.value.trim().toLowerCase();
    const nome = form.elements.nome.value.trim();
    const senha = form.elements.senha.value;

    if (!/^[a-z0-9][a-z0-9_.-]{2,49}$/.test(usuario) || !nome) {
        mensagem.textContent = "Preencha seu nome e escolha um usuário válido.";
        return;
    }
    if (senha !== form.elements.confirmarSenha.value) {
        mensagem.textContent = "As senhas precisam ser iguais.";
        return;
    }
    if (Array.from(senha).length < 8 || new TextEncoder().encode(senha).length > 72) {
        mensagem.textContent = "Use pelo menos 8 caracteres e reduza a senha se ela exceder 72 bytes.";
        return;
    }

    botao.disabled = true;
    botao.textContent = "Enviando...";
    mensagem.textContent = "";
    try {
        const supabase = await obterSupabase();
        const { error } = await supabase.rpc("portal_cadastrar_usuario", {
            p_usuario: usuario,
            p_nome: nome,
            p_senha: senha
        });
        if (error) {
            mensagem.textContent = error.code === "PT429"
                ? "Muitas solicitações de cadastro. Tente novamente mais tarde."
                : "Não foi possível enviar sua solicitação. Tente novamente.";
            return;
        }
        form.reset();
        location.replace("./login.html?cadastro=enviado");
    } catch {
        mensagem.textContent = "Não foi possível conectar. Tente novamente.";
    } finally {
        botao.disabled = false;
        botao.textContent = "Enviar solicitação";
    }
});

botao.disabled = false;
void obterSupabase().catch(() => {});
