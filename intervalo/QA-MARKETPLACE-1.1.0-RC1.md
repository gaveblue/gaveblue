# Intervalo Marketplace 1.1.0-rc.1 — QA da fundação

**Data:** 15/11/2026  
**Status:** fundação implantada; checkout e pedidos reais **DESLIGADOS**. Homologação técnica parcial.  
**Base:** `gaveblue/gaveblue`, branch `main` e Supabase `fynaaiazebydorzllwip`.

## Entregas verificadas

### Banco
Migração aplicada com sucesso: `source/supabase/migrations/20261115_marketplace_foundation_rc1.sql`, registrada como `intervalo_marketplace_foundation_rc1`. Estrutura **paralela** às comandas existentes, composta por 11 tabelas:

1. `customer_profiles`
2. `customer_addresses`
3. `restaurant_storefront`
4. `restaurant_online_settings`
5. `restaurant_business_hours`
6. `restaurant_delivery_zones`
7. `online_orders`
8. `online_order_items`
9. `online_order_events`
10. `online_order_payments`
11. `online_order_tracking_tokens`

Dados iniciais de `restaurant_storefront` e `restaurant_online_settings` criados com script idempotente `20261115_marketplace_seed_default_rc1.sql`; **marketplace_visible=false**, **online_settings.enabled=false** em ambos os restaurantes. Confirmado também `restaurant_publication.accepts_customer_orders=false` para `novo-mundo` e `intervalo27`.

**RLS:** ligado nas 11 tabelas. Verificação de privilégios `has_table_privilege` mostrou `anon_select=false`, `auth_select=false`, `service_select=true` em todas. Nenhuma policy de acesso direto criada nesta etapa: acesso de clientes e restaurantes será mediado por APIs explicitamente validadas.

Advisors Supabase: regra informativa `rls_enabled_no_policy` notifica as 11 tabelas, comportamento **deliberado** (acesso bloqueado). Há também aviso do projeto sobre proteção contra senhas vazadas desativada, não introduzido pela migração. Referência: https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy

### Edge Functions
- **`marketplace-public` v1**: deploy **ACTIVE**, `verify_jwt=false`, ações apenas de leitura `discover` e `store`, CORS limitado ao domínio oficial. Descoberta exige `marketplace_visible=true`, restaurante ativo, cardápio publicado e módulo habilitado. Loja direta por slug não exige login, mas só lê cardápio já público. **Não há endpoint de compra**. Resposta contém `checkout_available=false`.
- **`marketplace-management` v2**: deploy **ACTIVE**, `verify_jwt=true` e conferência de token com `auth.getUser`, restaurante ativo, vínculo Master/gerente e módulo de Gestão habilitado. Ações `get`, `save_draft` e `set_visible`, sem permissão de criar pedidos. `save_draft` força `enabled=false` e preserva imagens/visibilidade/pausa.
- Edge Functions existentes `restaurant-core` e `public-menu` **não foram modificadas** por esta etapa.

### Interface
- `/intervalo/explorar`: prévia de marketplace, com busca por nome/categoria/cidade nos restaurantes publicamente inscritos. **Nenhuma loja listada até que o responsável opte por aparecer**.
- `/intervalo/loja/:slug`: vitrine pública baseada em catálogo real, detalhes de produto em Bottom Sheet. Exemplo para homologação: `/intervalo/loja/novo-mundo`.
- `/intervalo/checkout`, `/intervalo/pedido`, `/intervalo/cliente`: telas de indisponibilidade explícitas, sem falsa criação de pedido/conta.
- `/intervalo/:slug/vendas-online`: tela separada de configuração de rascunho, com Bottom Sheet; permite pré-configurar descrição, categorias, entrega/retirada, valor mínimo, preparo e exibição no marketplace. A exibição no marketplace **não permite finalizar pedidos**.
- Navegação pública é resolvida antes do login. Rotas privadas de Loja Online usam a mesma checagem de Gestão existente, **sem mexer no módulo de Equipe/Permissões**.

## Testes realizados

| Validação | Resultado |
|---|---|
| Aplicação da migração | PASSOU |
| 11 tabelas novas com RLS | PASSOU |
| SELECT direto por anon e authenticated sem privilégio | PASSOU |
| Contas pessoais / pedidos separados do presencial | PASSOU por inspeção |
| Estados de venda desligados nos 2 restaurantes | PASSOU com query real |
| Functions públicas e privadas implantadas/ativas | PASSOU |
| Login/role no código da função administrativa | PASSOU por inspeção |
| Checkout impossibilitado nesta etapa | PASSOU por inspeção |
| JavaScript de marketplace e loja privada | PASSOU no parse |
| Renderização simulada: descoberta vazia | PASSOU |
| Renderização simulada: restaurante da busca | PASSOU |
| Renderização simulada: loja com produto | PASSOU |
| Renderização simulada: checkout bloqueado | PASSOU |
| Renderização simulada: Loja Online na Gestão | PASSOU |
| Link privado da Gestão e links das vitrines | PASSOU por inspeção |
| Sessão autenticada real de Master/gerente | **PENDENTE** |
| Requisição HTTP OPTIONS/POST em navegador real | **PENDENTE** |
| CSS/touch/sheet em Android/iOS/desktop | **PENDENTE** |
| Deploy do frontend via domínio gaveblue.com.br | **NÃO VERIFICADO** |
| RLS cross-tenant com pedidos reais | **PENDENTE**, não há pedidos online |
| Cálculo de frete, checkout e pagamentos online | **NÃO IMPLEMENTADOS** |

## Restrições preservadas
- Não alteradas `orders`, `order_items`, `order_rounds`, `payments`, `restaurant_members`, Equipe/Permissões, login de funcionários ou as APIs presenciais.
- Nenhum pedido online foi registrado, nenhuma ativação/assinatura/valor financeiro modificado.
- Não criar mesa falsa para delivery.
- Sem GitHub Actions.
- Se o cliente abrir a vitrine agora, vê catálogo de consulta, **não compra**.

## Roteiro manual de homologação

1. Confirmar landing antiga `/intervalo/`, Login, Gestão, Garçom, Cozinha, Caixa e Mesas sem regressões.
2. Abrir `/intervalo/explorar`: lista inicialmente vazia por opção de visibilidade desativada.
3. Abrir `/intervalo/loja/novo-mundo`: catálogo real sem botão de compra.
4. Entrar como Master/gerente em `/intervalo/novo-mundo/vendas-online`. Abrir Bottom Sheet, ajustar rascunho e conferir que **não** ativa compras.
5. Se quiser aparecer na busca pública, optar por "Exibir no marketplace", depois retornar a `/explorar`. Exibição só é permitida com cardápio publicado.
6. Verificar bloqueio da página privada para usuário sem associação ou permissões da Gestão; gerente com override negado não acessa.
7. Verificar `/intervalo/checkout`, `/pedido` e `/cliente`: nenhuma permite criar pedido.
8. Conferir atualização do frontend no navegador/PWA; propagação real ainda não foi comprovada.

## Próxima etapa recomendada
`1.1.0-rc.2`: homologar vitrines e aprimorar horário/zonas por restaurante. Depois `rc.3` implementar quote e checkout guest com preço calculado no servidor, token seguro, rate limit e idempotência; tudo inicialmente com flags OFF. O primeiro pedido real exige integração com fila, estoque, Caixa e aceite, não está liberado.

**Rollback:** frontend retorna ao `index.html` da rc.16; Edge Functions `marketplace-*` podem ser desativadas. Tabelas novas estão isoladas e vazias de pedidos — **não apagar** dados sem análise futura.
