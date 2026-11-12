# Intervalo 0.9.1 — Criação de restaurante sem depender de e-mail

## Ação rápida
1. Entre em https://gaveblue.com.br/intervalo/admin.
2. Em **Novo restaurante**, digite o nome. O campo Identificador (slug) será preenchido automaticamente; pode editar.
3. O e-mail do Master **não é obrigatório**. Deixe vazio se quiser estruturar a empresa antes de convidar alguém.
4. Clique em **Criar restaurante**. Os dados básicos devem aparecer na lista e o sistema não tenta enviar e-mail.
5. Para usar sua própria conta administrativa na Gestão, clique **Vincular minha conta como Master**. Essa ação exige sua senha de Super Admin e fica registrada.
6. Para um Master externo, defina o e-mail no card do restaurante e depois clique **Preparar link de acesso (sem enviar e-mail)**. Confirme sua senha de Super Admin. O link será mostrado uma única vez, para entrega privada ao titular.
7. Se a criação funcionar mas o Master não receber e-mail, isso não invalida o restaurante; ajuste SMTP no Supabase posteriormente.

## O que foi corrigido
- Falha observada: servidor retornava 409 porque o Supabase Auth Invite retornava 429 (limite de mensagens).
- Agora o cadastro SQL é independente do convite e transacional.
- Se a listagem administrativa falhar, o formulário Novo restaurante continua disponível.
- URLs internas foram restauradas em fallback do GitHub Pages para evitar cair na tela inicial no refresh.

## Observações
- O link de convite é um token de autenticação; não envie por canal público nem salve em planilhas.
- Não há confirmação de que e-mails de recuperação funcionem sem SMTP customizado.
- O navegador e a entrega HTTP real ainda exigem validação. Os commits na main não são prova de propagação.
