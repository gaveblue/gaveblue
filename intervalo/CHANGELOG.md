# Intervalo — CHANGELOG

## 0.7.0 — 2026-11-12 · Estrutura operacional multiempresa (prévia técnica)

**Situação:** esquema e APIs implantados, interfaces publicadas por commits na `main`; testes SQL e sintaxe aprovados. **Não homologada integralmente:** faltam browser/E2E, equipe ativa, hardware e validação no domínio.

### 0.3.0 — Cardápio
- Categorias, produtos, preço, disponibilidade e adicionais com restrição de tenant por FKs compostas.
- Administração de catálogo no painel `/intervalo/{slug}/catalogo`.
- `/intervalo/{slug}/cardapio` consulta apenas informações marcadas como publicadas, com módulo habilitado e restaurante ativo.
- Pedido público direto **não habilitado**, evitando pedidos não verificados.

### 0.4.0 — Mesas e comandas
- Cadastro de mesas e salões, uma comanda ativa por mesa (índice único parcial).
- Garçom abre comanda, adiciona itens com snapshot de preços, envia à cozinha e marca servido.
- Transições e preços calculados no servidor em funções transacionais exclusivas do `service_role`.

### 0.5.0 — Cozinha e impressão
- Fila de cozinha por restaurante com estágios recebido/preparando/pronto, atualização manual.
- Tabelas de impressoras e jobs, mas fila e agente de impressão **não estão ativados**.
- Protótipo **offline** do agente Windows em `print-agent/`; hardware B&G BG-06 não testado. Realtime automático pendente.

### 0.6.0 — Estoque e caixa
- Insumos, fichas técnicas e movimentos estruturados; cadastro de saldo inicial.
- **Baixa automática de estoque ainda não implementada**.
- Caixa manual com sessão de abertura, recebimentos parciais, quitação da comanda e fechamento com conferência.
- Registro de Pix/cartão é **somente declaratório**; não há transação com bancos, adquirentes nem emissão de documento fiscal.

### 0.7.0 — Plataforma, planos e relatórios
- Super Admin habilita módulos e suspende/reativa restaurantes por função protegida.
- Estrutura para planos e assinaturas sem precificação ou provedor de cobrança operacional.
- Relatórios gerenciais preliminares, limitados a recortes recentes; não fiscais.
- Piloto `intervalo27`: cinco módulos centrais habilitados **somente para testes**, sem cobrança.
- Frontend dividido em módulos JS independentes; rotas profundas suportadas pelo fallback condicional do GitHub Pages.

### Segurança, QA e riscos remanescentes
- 26/26 tabelas públicas com RLS; nenhum `SELECT` anônimo ou `INSERT/UPDATE` autenticado diretamente concedido às tabelas.
- Funções de comanda e caixa sem privilégio EXECUTE de `anon` ou `authenticated`; somente `service_role`.
- Teste SQL rollback: abertura de comanda, item, envio, preparação, pronto, servido, pagamento parcial e quitação, abertura e fechamento de caixa.
- Teste SQL rollback: vínculos estrangeiros entre restaurantes rejeitados.
- 10 módulos JS e frontend principal passaram por verificação sintática estática; não houve build React nem E2E.
- Cardápio do piloto não publicado, sem produtos/mesas/pagamentos criados artificialmente.
- Supabase Advisor alerta para proteção de senhas vazadas desabilitada.
- Endereço real ainda não verificado por HTTP neste ambiente (erro DNS); commit GitHub não é prova de propagação no domínio.
- Master do restaurante piloto continua pendente de ativação; nenhum fluxo real foi exercitado como Master/garçom/caixa.

### Artefatos
- `QA-0.7.0.md`: matriz técnica e limites de homologação.
- `ROTEIRO-TESTES-PILOTO.md`: passos para o titular testar os módulos.
- `DEPLOY-ROLLBACK-0.7.0.md`: estratégia de publicação manual e reversão sem remover dados.

---


## 0.2.1 — 2026-11-12 · Login alternativo por CPF

**Estado:** implementação aplicada; testes estruturais aprovados; homologação funcional pendente de CPF vinculado e login real.

### Funcionalidade
- Login aceita **e-mail ou CPF + senha** no mesmo campo e usa a mesma conta Auth.
- CPF **opcional** vinculado depois do primeiro acesso com e-mail e senha, em "Minha Conta".
- E-mail segue necessário para convite, recuperação de senha e confirmação; CPF não substitui senha nem comprova identidade civil.
- CPF único por usuário global, sem duplicar contas nem vínculos com os vários restaurantes.
- Cadastro/troca/desvinculação de CPF somente após reautenticação com a senha atual.
- Validação de 11 dígitos e dos dois verificadores do CPF; não aceita sequências iguais.
- Login por CPF faz correspondência **somente no servidor** e usa Supabase Auth por e-mail/senha para verificar credenciais.
- Banco guarda HMAC-SHA256 do CPF com chave de serviço exclusiva do backend e somente quatro últimos dígitos; CPF em texto claro não é armazenado no banco ou devolvido à UI.
- Proteção contra tentativas: limite de 5 tentativas/15 min por CPF e 25 por rede/15 min (quando origem de rede está disponível), com resposta genérica em caso de credencial incorreta.
- Funções publicadas no Supabase: \`cpf-login\` v2 (JWT desligado exclusivamente para etapa pré-login, controles próprios), \`account-cpf\` v1 (JWT obrigatório).
- Migrações de tabelas \`user_cpf_login\` e \`cpf_login_attempts\`, RLS habilitada e política negando totalmente acesso de clientes.
- Publicação manual de interface \`/intervalo/login\`, \`/intervalo/minha-conta\` e fallback de rota na 404.

### Ressalvas e homologação
- Não foi possível realizar teste E2E de CPF com usuário real. Nenhuma conta recebeu CPF automaticamente.
- Inicialmente, o funcionário precisa fazer seu primeiro login por e-mail para definir o CPF.
- O HMAC é derivado da chave secreta de serviço do projeto: se a chave mudar, será necessário planejar migração ou revinculação dos CPFs; para operação comercial, preferir segredo de HMAC independente e processo de rotação.
- O CPF informado é validado matematicamente, mas sua titularidade legal **não** é atestada sem verificação de identidade.
- Login por e-mail e recuperação de senha preservados.
- Security Advisor continua alertando que a proteção contra senhas vazadas do Supabase Auth está desativada.
- Ainda não há verificação HTTP/browser de propagação e autenticação ponta a ponta; versão em QA parcial.

---


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
