# Intervalo 0.9.0 — Guia para restaurar acesso de funcionários

## Recuperação administrativa (sem depender de e-mail)
1. Entre na conta **Super Admin** em https://gaveblue.com.br/intervalo/admin.
2. No card do restaurante, encontre **Usuários do restaurante**.
3. Para um Master/funcionário com e-mail confirmado, clique **Redefinir senha**.
4. Confirme **sua própria senha de Super Admin** em janela protegida. Sem isso, a operação será negada.
5. O sistema gerará uma senha aleatória que aparece **uma vez**. Copie e entregue ao usuário por canal seguro. Não registre a senha no GitHub ou em mensagens públicas.
6. O usuário entra em https://gaveblue.com.br/intervalo/login e é redirecionado para **Troca de senha obrigatória**. Confirma a senha temporária e define uma nova senha forte (mínimo de 12 caracteres). Faz login novamente.
7. Se for Master pendente, em **Meus restaurantes** confirme a senha para ativar o vínculo. É possível também clicar **Renovar acesso Master** no Super Admin caso o convite tenha vencido.

## Acesso do próprio Super Admin ao restaurante
- No painel Super Admin, use **Vincular minha conta como Master** dentro do estabelecimento desejado.
- Confirme sua própria senha de administrador e volte para **Meus restaurantes**.
- Abra **Gestão** do restaurante; o vínculo de Master é criado com auditoria e não remove o Master convidado anteriormente.
- Não confundir este vínculo de teste com impersonação silenciosa: a conta administrativa passa a ser realmente membro Master da empresa.

## Recuperação por e-mail
- Tela: https://gaveblue.com.br/intervalo/recuperar-senha.
- Para que o link chegue, no [painel Supabase do Intervalo](https://supabase.com/dashboard/project/fynaaiazebydorzllwip/auth/url-configuration) configure Site URL como `https://gaveblue.com.br/intervalo/` e allowlist de Redirect URL contendo `https://gaveblue.com.br/intervalo/redefinir` e `https://gaveblue.com.br/intervalo/ativar`.
- Confira em Authentication → SMTP Settings que o remetente, as credenciais SMTP e os limites de envio estejam configurados para entrega ao destinatário desejado. O SMTP padrão do plano Free pode restringir destinatários e volume.
- Os detalhes exatos da falha de entrega não foram verificados aqui, pois os controles de SMTP/Redirect não são expostos pela integração atual; não afirmar que o e-mail já está funcionando.
- A alternativa é a senha provisória gerada pela conta Super Admin.

## Recomendações
- Um CPF vinculado permite **identificar a conta** no login, mas a senha continua necessária.
- A senha antiga nunca é mostrada nem recuperada, apenas substituída.
- Não envie senhas, CPFs completos, tokens ou códigos de confirmação em prints de suporte.
- Ative a proteção contra senhas vazadas do Supabase Auth e adote MFA para contas administrativas antes de operação comercial.
