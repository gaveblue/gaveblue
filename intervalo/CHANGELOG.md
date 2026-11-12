# Intervalo — CHANGELOG

## 0.2.0 — 2026-11-12 · Onboarding, equipes e permissões

**Estado:** implementação e migrações aplicadas; QA estrutural/parcial aprovado. **Ainda NÃO homologada integralmente** (falta teste funcional autenticado e verificação pública do domínio).

### Implementações
- Formulário de cadastro e atualização de dados do restaurante (telefone, endereço, CEP, cidade, UF e fuso horário).
- Conclusão do onboarding com validação mínima de telefone, cidade e UF.
- Cadastro de funcionários por convite, reconhecimento de conta já existente e vínculo ao restaurante sem duplicar o Auth.
- Papéis e equipe: Master, gerente, garçom, cozinha e caixa. Convites pendentes, ativação, revisão de função e revogação.
- Overrides individuais de acesso por módulo com validação do papel e do módulo de Gestão no backend.
- Seletor de restaurantes agora exibe somente módulos habilitados e permitidos, com troca por recarregamento integral de contexto.
- Super Admin pode vincular Master já existente a outro restaurante sem criar novo usuário Auth.
- Migrações SQL versionadas e Edge Functions autenticadas: \`restaurant-team\` v3 e \`admin-provision\` v2.
- Auditoria específica de ativação de funcionário e de alterações administrativas; a operação usa credenciais de servidor, não do cliente.
- Publicação manual: arquivos de navegação e gestão adicionados em \`/intervalo\`. Nada editado no GB+.

### Evidências da sessão
- Supabase Intervalo: 2 usuários Auth, 1 Super Admin ativo, 1 restaurante (Intervalo 27) e 1 Master pendente, em 12/11/2026.
- RLS ativa nas sete tabelas públicas pertinentes (incluindo duas novas). Gravações diretas por \`anon\` e \`authenticated\` negadas.
- Simulação de usuário externo sem vínculo: 0 linhas acessíveis; membro pendente não consegue ler \`restaurant_settings\` ou \`restaurant_modules\`.
- JavaScript inline e \`management.js\`: sintaxe aprovada.
- Supabase Security Advisor: 1 aviso de proteção de senhas vazadas desabilitada (pendência, sem alteração de configuração).
- Endereço público: arquivos enviados ao GitHub, mas acesso HTTP/browser não comprovado pelo ambiente de verificação.

### Limites para avançar
- Master do Intervalo 27 ainda deve ativar seu vínculo por login com senha.
- Testar fluxo completo com dois restaurantes e usuários reais antes de homologação final.
- Testar envio de convites reais e recebimento de e-mail antes de usar comercialmente.
- Compilação do frontend React/TypeScript original ainda não validada; a prévia de 0.2.0 é HTML/JS modular.
- Não publicar dados reais de terceiros nem conceder permissões no lugar de usuários.

---


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
