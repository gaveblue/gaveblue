# Intervalo — CHANGELOG

## 0.1.1 — 2026-11-12 · Bootstrap do Super Admin

### Implementado
- E-mail do primeiro Super Admin vinculado **somente em configuração privada do banco**, não no JavaScript público.
- Bootstrap único com verificação de e-mail pelo Supabase Auth, sem armazenamento de senha em texto claro nem promoção baseada em `user_metadata`.
- Função/trigger no banco: após confirmação do endereço exato, registra `platform_admins` e auditoria; bloqueia reutilização do bootstrap.
- Nova rota `/intervalo/configurar-admin` para registrar acesso inicial por senha e confirmar e-mail.
- Login detecta Super Admin ativo e o direciona para `/intervalo/admin`.
- Roteamento profundo correspondente incluído no fallback 404, mantendo site institucional e GB+.
- Identificação visual atualizada para 0.1.1.

### Ambiente
- Supabase Intervalo: `fynaaiazebydorzllwip`, projeto separado do GB+.
- Registro do primeiro Super Admin: **pendente de confirmação de e-mail pelo titular**.
- Versão publicada como arquivos estáticos via GitHub, aguardando confirmação externa de propagação.

### Pendências para homologação
- Configurar Auth Site URL e allowlist de redirecionamentos no projeto Supabase.
- Confirmar capacidade de entrega de e-mail (SMTP padrão somente para membros da organização no plano Free; SMTP próprio para outros e-mails).
- Registro da conta, confirmação de e-mail, login e autorização real no painel Super Admin.
- Build React/TypeScript e testes de navegação física no domínio.
- Testes de segregação entre dois restaurantes com usuários reais.

**Estado:** QA parcial, não homologado integralmente.
