# Temperatura

Portal do Hemoacre para monitoramento térmico de caixas de transporte.

## Portal de desenvolvimento

Na branch `temporario`, execute `python -m http.server 8000 --bind 127.0.0.1` e
abra [o portal local](http://127.0.0.1:8000). O menu dá acesso à visão geral, à
lista de caixas e ao cadastro. O painel individual mantém o endereço
`dashboard.html?caixa=ID`.

### Ativação no Supabase

1. Confirme que o projeto aberto é **Temperatura-DEV** e que a referência é
   `shmqizeqhqvxnllqztdf`. Execute no SQL Editor a
   [migração do portal](supabase/migrations/202611170001_portal_temperatura.sql)
   se ainda não foi instalada e depois a
   [migração de credenciais](supabase/migrations/202611170002_credenciais_do_portal.sql)
   e a [migração de administração](supabase/migrations/202611170003_administracao.sql).
   A [migração do fluxo de sessão](supabase/migrations/202611170005_fluxo_da_sessao.sql)
   habilita o login em uma chamada e a revogação ao sair em segundo plano.
   Aplique também a [migração de caixas e sensores](supabase/migrations/202611180006_caixas_e_sensores.sql)
   antes de executar a nova interface ou a API de ingestão.
2. Abra **Solicitar acesso** na tela de login ou acesse
   [o cadastro de usuários](http://127.0.0.1:8000/cadastro-usuario.html).
   Crie a conta com nome, usuário e senha. A solicitação fica pendente.
3. Para liberar o primeiro administrador, localize a conta autorizada em
   **Table Editor → portal_usuarios** e defina `ativo = true` e
   `perfil = admin`. Entre novamente no portal para receber o perfil.
   Para as próximas contas, entre em **Administração → Cadastros pendentes**
   e clique em **Aprovar**. A aprovação habilita a conta como operadora e
   registra quem aprovou e quando. Desmarcar `ativo` no banco suspende
   a conta e invalida a sessão atual.
4. Entre com o usuário e a senha. Confira que uma janela sem sessão
   redireciona para o login.

O banco gera o hash bcrypt, limita tentativas de login e protege os dados com
políticas que exigem uma sessão ativa. Cada conta tem uma sessão de até oito
horas. Um novo login invalida a sessão anterior da mesma conta. A tabela de
credenciais fica protegida. O portal obtém somente o nome, usuário e data
da solicitação, por meio das funções de administração autorizadas.

O acesso à interface e às tabelas é compartilhado entre as contas autorizadas.
O ESP usa o endpoint existente `/api/temperatura`, com o código do sensor
associado. O backend de desenvolvimento deve apontar para o mesmo Supabase DEV
e usar a chave de servidor e o token de ingestão já previstos pela API.
Quando o sensor ativo estiver sem vínculo, a leitura aparece na visão geral
com o nome do sensor. A exclusão de uma caixa remove a caixa da lista e
libera o sensor, preservando os registros históricos.

## Produção

A Vercel publica a branch `main` em produção. A função `/api/portal-config`
envia ao navegador apenas a URL e a chave publicável do ambiente. Produção usa
o projeto **Temperatura** (`mrahvdxihpbzikdcmafo`). Preview e o servidor local
usam o **Temperatura-DEV**. Uma `SUPABASE_URL` incompatível com o ambiente
faz a função recusar a configuração.

Em uma instalação nova, aplique as migrações 001 a 006 em uma única
transação no projeto **Temperatura**. Execute na ordem dos arquivos e
mantenha um único `BEGIN` e `COMMIT` ao redor do lote. A migração 004
interpreta as datas antigas como horários do Acre e confere a contagem e os
extremos do histórico. As leituras antigas continuam disponíveis na visão
geral, com seus vínculos originais.

Cadastre e autorize separadamente a primeira conta de produção. Use o fluxo
de **Administração** dali em diante. Os dados demonstrativos ficam no DEV.

Para receber dados do ESP em produção, configure `SUPABASE_URL`,
`SUPABASE_SECRET_KEY` e `TEMPERATURA_INGEST_TOKEN` nessa configuração da
Vercel. Para habilitar o endpoint de alerta, configure também
`CALLMEBOT_PHONE`, `CALLMEBOT_API_KEY` e `TEMPERATURA_ALERTA_TOKEN`
(ou `CRON_SECRET` para o agendamento da Vercel). O disparador deve enviar o
token de alerta em `Authorization: Bearer ...`.
