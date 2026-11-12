# Intervalo 0.9.0 — Publicação manual e rollback

**GitHub:** https://github.com/gaveblue/gaveblue/tree/main/intervalo
**URL desejada:** https://gaveblue.com.br/intervalo/
**Supabase:** fynaaiazebydorzllwip (não GB+).
**Publicação:** commits na branch main, **sem GitHub Actions**.

## Alterações em produção de código
- /intervalo/index.html: login, troca obrigatória de senha, nova recuperação e fluxo Master.
- /intervalo/platform.js: painel de usuário, redefinição de senha e vínculo Master.
- /intervalo/account.js: atalho para troca de senha.
- /intervalo/waiter.js: cancelamento de comanda aberta.
- /intervalo/kitchen.js: atualização automática de 15 s enquanto visível.
- /404.html: redirecionamento condicionado a /intervalo/* para rotas novas.
- Supabase: platform-control v3, account-password v1, activate-master v3, restaurant-core v3 e verificações de flag de troca em funções privadas.
- Migração `intervalo_cancel_open_orders_0_9_0` (reversão de esquema deve considerar dados e auditoria).

## Rollback em incidente
1. Desabilite módulos no Super Admin se houver problema em operação.
2. Reverter somente os arquivos /intervalo/ modificados para a versão anterior no GitHub (e a regra /intervalo em 404.html, se necessário).
3. Para cada Edge Function com problema, redeploy da fonte do commit anterior, mantendo a exigência JWT nas funções privadas.
4. Não remover logs nem contas Auth; não alterar ou revelar senha anterior (não existe recuperação em texto claro).
5. Não aplicar DROP de tabelas de pedidos, usuários ou auditoria em rollback automático.

## Pendências
- Confirmar HTML carregando no domínio, inclusive URL profunda.
- Configurar URL Redirect e SMTP no Supabase Authentication; checar limites e evento de recovery.
- Testar modal de reset e o primeiro login Master com conta real e senha enviada fora do chat.
- Verificar ativação após senha alterada, CPF e papel Master no segundo navegador.
- Corrigir aviso de leaked password protection desabilitada e rever MFA para Super Admin.
- Testar cancelamento e polling da cozinha no Android e no navegador desktop.

**Não homologado integralmente** até concluir os testes end-to-end.
