# Intervalo — Arquitetura consolidada da prévia 0.7.0

## Separação
- SaaS multiempresa da Gaveblue, projeto Supabase próprio fynaaiazebydorzllwip.
- GB+, WeFrotas e ORVIA não compartilham tabelas nem credenciais do Intervalo.
- Única app em /intervalo; slug é contexto de navegação e nunca autoriza acesso.
- Frontend atual é HTML/ES modules estáticos em /intervalo. A migração/compilação React+TypeScript originalmente prevista ainda precisa ser executada e homologada.
- Deploy manual por commits na branch main do repositório gaveblue/gaveblue. GitHub Actions não utilizado.

## Navegação
- /intervalo: apresentação
- /intervalo/login: e-mail ou CPF (se previamente vinculado)
- /intervalo/minha-conta: vinculação opcional de CPF
- /intervalo/admin: somente Super Admin da Gaveblue
- /intervalo/{slug}/gestao: Master e gerente habilitado
- /intervalo/{slug}/catalogo, /mesas, /estoque, /impressao, /relatorios: áreas de gestão
- /intervalo/{slug}/garcom, /cozinha, /caixa: operação
- /intervalo/{slug}/cardapio: público somente quando explicitamente publicado

## Supabase / Segurança
- Supabase Auth controla contas; o mesmo usuário pode ter várias restaurant_members.
- 26 tabelas públicas com RLS habilitada, sem privilégios diretos públicos de escrita para dados operacionais.
- Operações privadas passam pelas Edge Functions com JWT e validação de restaurant_id, status, membership, role, override e módulos habilitados.
- Cardápio público é retornado por public-menu apenas se restaurante ativo, publicação ativa e módulo habilitado.
- A Edge Function public-menu e o login-CPF são pré-autenticados mas não devolvem dados privados arbitrários; autenticação CPF exige senha Auth.
- Toda FK operacional entre tenant e recurso usa (restaurant_id,id) ou equivalente; impedindo chaves de outros restaurantes.
- Funções SQL de comanda e caixa são transacionais e concedidas apenas a service_role.
- A API não substitui uma revisão de pentest, abuso, chargeback e observabilidade de produção.

## Esquema
- Cadastro: restaurants, restaurant_settings, restaurant_members, restaurant_member_module_access, platform_admins.
- Ativação comercial: restaurant_modules, restaurant_publication, subscription_plans, restaurant_subscriptions.
- Menu: menu_categories, menu_products, menu_product_options.
- Atendimento: restaurant_tables, orders, order_items, order_events.
- Caixa: cash_sessions, payments.
- Estoque: stock_items, recipe_components, stock_movements.
- Impressão: printer_devices, print_jobs.
- Auditoria: audit_logs.
- Identificação: user_cpf_login, cpf_login_attempts.

## Limites não simulados
- A lista da cozinha usa atualização manual; Supabase Realtime com escopo por tenant ainda será implementado.
- Adicionais aparecem como informação de catálogo, mas não alteram itens/preço de comandas nesta prévia.
- Estoque/fichas técnicas são cadastros e estrutura; não há baixa automática.
- Caixa registra valores informados por operador; não faz transação bancária/Pix nem emissão fiscal.
- O agente Windows em print-agent gera apenas texto offline; não consulta jobs nem imprime fisicamente.
- Assinaturas são dados de plano e habilitação. Não existe billing real ou preço aprovado.
- Pedidos públicos via cardápio permanecem desativados.
- Produto 1.0 depende de testes E2E, proteção e verificação HTTP efetiva, conforme QA-0.7.0.md.
