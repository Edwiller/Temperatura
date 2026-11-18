import { obterConfiguracaoSupabase } from "../config/supabase.js?v=fluxo-sessao-1";
import { destinoAposLogin, registrarSessao } from "../config/acesso.js?v=gestao-1";
import { entrarNoPortal, revogarSessoesPendentes } from "../config/sessaoApi.js";

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
        const sessao = await entrarNoPortal(form.elements.usuario.value.trim(), form.elements.senha.value);
        const token = sessao?.token;
        if (typeof token !== "string" || !/^[0-9a-f]{64}$/.test(token)) {
            mensagem.textContent = "Confira seu usuário e senha. Se a conta for nova, aguarde a liberação.";
            return;
        }

        registrarSessao(token, sessao.perfil);
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
void obterConfiguracaoSupabase().catch(() => {});
void revogarSessoesPendentes();
window.setTimeout(revogarSessoesPendentes, 5000);
window.addEventListener("online", revogarSessoesPendentes);
