import { obterSupabase } from "../config/supabase.js?v=desempenho-1";
import { destinoAposLogin, registrarSessao } from "../config/acesso.js?v=desempenho-1";

const form = document.getElementById("formLogin");
const botao = form.querySelector("button");
const mensagem = document.getElementById("mensagemLogin");
const avisoCadastro = document.getElementById("avisoCadastro");

avisoCadastro.hidden = new URLSearchParams(location.search).get("cadastro") !== "enviado";

form.addEventListener("submit", async evento => {
    evento.preventDefault();
    botao.disabled = true;
    botao.textContent = "Entrando...";
    mensagem.textContent = "";
    avisoCadastro.hidden = true;

    try {
        const supabase = await obterSupabase();
        const { data: token, error } = await supabase.rpc("portal_entrar", {
            p_usuario: form.elements.usuario.value.trim(),
            p_senha: form.elements.senha.value
        });
        if (error) throw error;
        if (typeof token !== "string" || !/^[0-9a-f]{64}$/.test(token)) {
            mensagem.textContent = "Confira seu usuário e senha. Se a conta for nova, aguarde a liberação.";
            return;
        }

        registrarSessao(token);
        form.reset();
        location.replace(destinoAposLogin());
    } catch {
        mensagem.textContent = "Não foi possível conectar. Tente novamente.";
    } finally {
        botao.disabled = false;
        botao.textContent = "Entrar";
    }
});

botao.disabled = false;
void obterSupabase().catch(() => {});
