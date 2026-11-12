# Primeiro Super Admin da Gaveblue

O Intervalo passou a ter um mecanismo de bootstrap **único** do Super Admin.

O e-mail autorizado está cadastrado apenas no **schema privado** do Supabase, não no repositório público. Não há senhas ou tokens hardcoded.

## Como concluir o primeiro acesso
1. No Supabase do Intervalo, em Authentication → URL Configuration, configure a Site URL `https://gaveblue.com.br/intervalo/` e permita os redirecionamentos exatos `/intervalo/login`, `/intervalo/ativar` e `/intervalo/redefinir`.
2. Verifique o envio de mensagens Auth: no plano Free, o SMTP padrão só entrega e-mails a membros da organização Supabase. Para outros destinatários é necessário configurar SMTP próprio. Não presumir envio bem-sucedido.
3. No navegador, acesse `https://gaveblue.com.br/intervalo/configurar-admin`. Use o e-mail previamente autorizado pelo titular e crie uma senha com 12 ou mais caracteres.
4. Abra o e-mail de confirmação, confirme a titularidade e faça login em `https://gaveblue.com.br/intervalo/login`.
5. O banco promove automaticamente apenas o usuário com o e-mail autorizado **após a confirmação**, e direciona para `/intervalo/admin`.
6. Verifique logs, políticas RLS e criação de restaurantes/convites Master antes de declarar homologação.

## Segurança
- Bootstrap de uso único no schema `intervalo_private`.
- Trigger de Auth exige e-mail confirmado; não usa `user_metadata` ou slug como autorização.
- Não compartilhar senha por chat, issues ou email.
- Após uso, nenhum outro e-mail pode ser promovido automaticamente por este processo.
- Revogar/corrigir o primeiro acesso exige alteração administrativa explícita no banco.
