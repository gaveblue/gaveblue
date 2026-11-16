# Intervalo Marketplace — Arquitetura e roteiro de implementação

**Especificação de planejamento — 15/11/2026**  
**Projeto:** `gaveblue/gaveblue` → `intervalo/`  
**Base conhecida:** 1.0.0-rc.16  
**Próximo ciclo sugerido:** 1.1.0 (a numeração é uma proposta, não uma versão lançada)

> **Status:** DOCUMENTAÇÃO, NÃO IMPLEMENTAÇÃO. Nenhum pedido online, checkout, tabela ou API nova está em produção por causa deste documento. Não habilitar recebimento de pedidos até completar homologação real.

## 1. Visão e decisões fechadas

O Intervalo operará como **marketplace multirrestaurante** e, simultaneamente, como solução de **loja própria** por restaurante. O consumidor poderá comprar **sem cadastro obrigatório**, apenas com os dados necessários à compra, ou entrar com conta pessoal para endereço/histórico. Os estabelecimentos fazem **as próprias entregas** na primeira etapa; logística própria do marketplace fica fora da versão inicial.

Decisões não negociáveis:
- Reusar **uma fonte de verdade** para catálogo/preços/categorias por restaurante, sem duplicar produtos no marketplace;
- Preservar integralmente Gestão, Garçom, Mesas, Cozinha, Caixa e, sobretudo, **Equipe e Permissões** já existentes;
- Separar os **registros de pedido online** das comandas presenciais; não criar "mesa de delivery" artificial;
- Assegurar separação por `restaurant_id` em toda leitura e escrita;
- Não ligar vendas online antes de testar a cadeia do pedido e publicar conscientemente para cada restaurante;
- No MVP, pagamento **na entrega/retirada**, apenas com confirmação manual de recebimento. Não anunciar Pix automático, gateway ou antecipação;
- Um carrinho contém itens de **um único restaurante** na primeira versão.

## 2. Análise das estruturas reais no Supabase em 15/11/2026

Já existem: `restaurants`, `restaurant_modules`, `restaurant_settings`, `restaurant_publication`, `menu_categories`, `menu_products`, `menu_product_options`, `orders`, `order_items`, `order_rounds`, `order_events`, `payments`, `cash_sessions`, `stock_items`, `recipe_components`, `stock_movements`, membros, permissões e auditoria.

**Limitação estrutural:** `orders.table_id` é `NOT NULL`; `payments.order_id` também aponta ao ciclo presencial. Não alterar essas restrições de forma apressada. Construir fluxo online em tabelas separadas e integrar por uma **fachada de operação/consulta**, não por mudanças improvisadas às comandas.

**Flag existente:** `restaurant_publication.accepts_customer_orders` (boolean) já existe, mas o serviço público ainda devolve `customer_orders_enabled:false` e não oferece checkout. Os restaurantes `novo-mundo` e `intervalo27` estavam com flag **false** na inspeção. Mantê-la false até homologação e liberação individual.

**Cardápio público atual:** `/{slug}/cardapio` já consulta `public-menu`; serviço só retorna catálogo de restaurantes ativos, publicados e com módulo cardápio habilitado. Esta é a base de leitura pública, não o serviço de compra.

## 3. Produtos e rotas

| Rota proposta | Público | Função |
|---|---|---|
| `/intervalo/explorar` | Consumidor | Marketplace por cidade/bairro/CEP, busca e categorias |
| `/intervalo/loja/:slug` | Consumidor | Loja individual, catálogo, horários, taxas, carrinho |
| `/intervalo/checkout` | Consumidor | Delivery/retirada, endereço, dados de contato, resumo e confirmação |
| `/intervalo/pedido/:token` | Consumidor com link seguro | Acompanhar o pedido específico sem exigir cadastro |
| `/intervalo/cliente` | Consumidor com conta opcional | Histórico, perfil e endereços |
| `/intervalo/:slug/pedidos-online` | Restaurantes autorizados | Recepção e aceite/recusa, preparação, expedição |
| `/intervalo/:slug/gestao` | Gestão existente | Nova subseção **Vendas Online**, preservando Gestão atual |
| `/intervalo/admin` | Super Admin existente | Monitoramento agregado e regras de marketplace, sem reestruturar equipe |

**Compatibilidade:** preservar URLs existentes, especialmente `/intervalo/inicio`, `/intervalo/admin`, `/:slug/gestao`, `/:slug/garcom`, `/:slug/cozinha`, `/:slug/caixa` e `/:slug/cardapio`. O público `/:slug/cardapio` poderá redirecionar à nova loja somente após homologação. Não usar a rota raiz para marketplace sem planejamento de migração de links do sistema atual.

**Roteamento:** distinguir explicitamente prefixos públicos (`explorar`, `loja`, `checkout`, `pedido`, `cliente`) antes do roteador de módulos de restaurantes. Rotas públicas nunca exigem associação `restaurant_members`.

## 4. Modelo de dados proposto (não criado)

Todos os valores monetários armazenados como **inteiros em centavos** e todas as datas de eventos como `timestamptz`. FKs compostas por restaurante quando aplicável, índices por estado e data, unicidade e RLS habilitado.

### Contas e endereços
- `customer_profiles`: `id` (chave ligada ao usuário de autenticação), nome, contato verificado quando aplicável, preferências e datas. **Não usar `restaurant_members` para consumidores.**
- `customer_addresses`: cliente, rótulo, rua, número, bairro, cidade, UF, CEP, complemento e referência; visível só ao titular e ao restaurante **do pedido realizado**, nunca a outros lojistas.
- Guest checkout: dados mínimos inseridos no pedido, sem criação obrigatória de `auth.users`. Termos/privacidade aceitos no checkout; consentimento promocional separado e opcional.

### Vitrine e entrega
- `restaurant_online_settings`: `restaurant_id` único, `enabled`, modalidades (delivery/retirada), mínimo do pedido, prazo de preparo, antecedência máxima, fechamento temporário, política de cancelamento e instruções. Pode coexistir com a flag `restaurant_publication.accepts_customer_orders`; liberação exige ambas true.
- `restaurant_business_hours`: dia, hora inicial/final, fuso e exceções/feriados, inclusive horários que passam da meia-noite.
- `restaurant_delivery_zones`: `restaurant_id`, município, bairros/CEPs permitidos, taxa em centavos, mínimo por zona, tempo estimado e disponibilidade. Validar endereço e zona **no servidor**. A primeira versão usa regiões explícitas, sem prometer roteirização GPS.
- `restaurant_storefront`: nome comercial opcional, descrição, logo/foto, canais de contato, categorias de culinária, ordenação/visibilidade do marketplace. Nunca expor telefone pessoal de funcionário.

### Compra e acompanhamento
- `online_orders`: UUID, `restaurant_id`, código público sequencial **por restaurante** (ou código curto não adivinhável para exibição), `customer_id` opcional, contato do comprador, entrega ou retirada, endereço imutável de entrega (snapshot), subtotal, desconto, taxa, total, forma combinada de pagamento, estado operacional, estado financeiro, horários, observações, origem (`marketplace`/`loja`), versão do preço e hash/chave de idempotência.
- `online_order_items`: restaurante, pedido, produto, **snapshot** de nome/preço/quantidade/observações e adicionais com preços; nunca recalcular retroativamente uma venda a partir do catálogo.
- `online_order_events`: evento append-only, ator, instante e alterações de estado; trilha auditável de aceite, cancelamento, preparo e entrega.
- `online_order_payments`: status, método, valor confirmado, instante e identificador de conciliação (manual no início; integração futura), sem usar `payments.order_id` de comanda presencial.
- `online_order_tracking_tokens`: **hash** de token de acompanhamento aleatório, vencimento e revogação; token em claro apenas no link entregue ao cliente, nunca armazenado ou logado.
- `online_order_idempotency` (ou índice único em chave equivalente): evita duplicação por toques/retries.
- Evolução futura: `marketplace_promotions`, avaliações verificadas, couriers, repasses e comissões (fora do MVP).

**Separação:** manter `online_orders` isolado do ciclo `orders.table_id NOT NULL`; exposição unificada para Cozinha/Caixa via adaptador/serviço, com `source_type` e IDs próprios.

## 5. Contratos de API e regras de segurança

Novos endpoints Edge Functions, nomes sugeridos:
- `marketplace-discovery` **público**: lista lojas publicadas, aceitando pedidos e atendendo CEP/cidade/bairro informado; devolve só campos de vitrine.
- `storefront-public` **público**: dados da loja, catálogo vigente, zonas e estado de aberto/fechado. Reaproveitar lógica de filtragem de `public-menu` sempre que possível.
- `online-checkout-quote` **público protegido contra abuso**: valida produto/quantidade/adicionais, disponibilidade, horário, modalidade, CEP/bairro, mínimo e taxa e retorna total **calculado no servidor**, expiração do orçamento e disponibilidade.
- `online-order-create` **público protegido contra abuso**: confirma contato, valida orçamento novamente, aplica rate limit e idempotência, grava cabeçalho/itens/evento em transação, fornece link privado de acompanhamento. Não confia em total, desconto ou taxa enviados pelo navegador.
- `online-order-track` **acesso com token/caller autorizado**: devolve status e resumo de **um único pedido**, nunca permite listar pedidos de outros clientes ou revelar dados desnecessários.
- `online-restaurant-orders` **autenticado como membro autorizado**: lista pedidos apenas do `restaurant_id` permitido e aplica transições aceite/recusa/preparo/expedição/entrega.
- `online-reports` **autenticado**: agrega vendas online ao painel operacional com contagem e valores por origem, sem misturar recebimento real com venda aceita.

**Regras de segurança:**
1. Habilitar RLS e revogar acessos amplos nas tabelas novas; operações de pedido via funções que verificam as permissões e usam serviço privilegiado apenas quando estritamente necessário.
2. Nunca inserir `restaurant_id`, preço, taxa ou status financeiro confiando apenas no browser; validar contra dados do servidor.
3. Checkout convidado precisa de limites de taxa por origem/contato/loja, desafio ou verificação de celular quando houver sinais de abuso, limpeza de pedidos abandonados e controle de duplicidade. **CORS não é mecanismo de autenticação.**
4. Cada pedido e evento guarda `restaurant_id`; acesso por código público não basta para consultar dados privados. Acesso guest exige token forte, limitado a um pedido, com hash armazenado e opção de renovação/revogação.
5. Não registrar nome/endereço/telefone em logs de erro ou analytics; mascarar nos painéis e restringir acesso conforme a operação.
6. Clientes autenticados usam identidade própria; **não receber automaticamente acesso a membros do restaurante**. A mesma conta de Auth pode ser reutilizada apenas se autorização de papéis continuar totalmente isolada; preferir sessões/clientes claramente separados no frontend.
7. Termos, privacidade, finalidade do endereço/telefone, retenção e exclusão de dados de consumidor devem ser definidos antes de abrir para usuários externos.

Os guias de segurança atuais do Supabase diferenciam funções públicas, chamadas com JWT de usuário e chamadas com chaves secretas; o projeto deve seguir a matriz de autenticação explicitamente para cada função. Não desativar `verify_jwt` em ações administrativas.

## 6. Máquina de estados de pedido

Pedido de delivery:
`pending_acceptance → accepted → preparing → ready → out_for_delivery → delivered`.

Pedido para retirada:
`pending_acceptance → accepted → preparing → ready_for_pickup → picked_up`.

Estados de exceção: `rejected`, `cancelled`, `expired`. Regras explícitas de prazos e quem pode cancelar em cada etapa. Travas de transição no **banco/servidor**, não só no frontend.

**Estados financeiros independentes:** `unpaid`, `payment_pending`, `paid`, `refunded`, `partially_refunded` (últimos dois preparados para fase posterior). "Entregue" não significa "pago".

### Conexão com módulos atuais

| Módulo existente | Integração pretendida | Não fazer |
|---|---|---|
| Cardápio | Mesma fonte `menu_products`/categorias/flags | Duplicar catálogo por canal |
| Cozinha | Fila única com cartão `DELIVERY`, `RETIRADA`, `MESA` e `source_type` | Inventar uma mesa `online` |
| Estoque | Ao **aceitar para preparo**, contabilizar baixa exatamente uma vez em transação, reusando lógica de ficha técnica; estornos precisam de regra de insumo já consumido e auditoria | Descontar no carrinho e de novo ao preparar |
| Caixa | Nova seção para recebimentos delivery/retirada e conciliação com sessão; relatório separado por origem | Inserir pagamento online como se fosse `payments.order_id` de comanda presencial |
| Gestão | "Pedidos Online", "Loja Online", "Entregas", "Horários e Taxas" | Alterar cadastro de funcionários |
| Super Admin | Controle de restaurantes habilitados, pedidos sinalizados e métricas agregadas | Permitir leitura indiscriminada de dados de clientes por todos os lojistas |

### Fluxo do cliente (guest)
1. Abre link da loja ou marketplace, escolhe **um** restaurante e navega sem login.
2. Monta carrinho, adicionais, quantidades, observações.
3. Define **entrega** ou **retirada**. Para entrega: endereço, zona coberta e taxa.
4. Informa nome e telefone, aceita termos/privacidade. Cadastro permanece opcional. Conferência/validação contra fraude conforme risco.
5. Servidor verifica tudo e apresenta resumo final, horários, valor total, taxa e pagamento na entrega/retirada.
6. Confirmando, servidor grava pedido de forma idempotente e retorna identificador e link privado.
7. Restaurante recebe na Gestão, aceita ou recusa. Aceite entra na fila da Cozinha.
8. Restaurante prepara e marca saída de entrega ou pronto para retirada. Entregador é do restaurante, sem app de entregador nesta etapa.
9. Restaurante confirma entrega/retirada e, separadamente, registra pagamento real. Cliente acompanha pelo link.

## 7. Implementação incremental e versões propostas

**Não executar tudo em um único deploy.** A divisão evita interromper a Gestão já utilizada e permite rollback sem adulterar pedidos em produção. Cada etapa exige atualização de `CHANGELOG.md`, checklist QA e teste real antes de habilitar vendas.

| Etapa sugerida | Entrega | Critério para avançar |
|---|---|---|
| **1.1.0-rc.1 — Estrutura** | Tabelas do marketplace, RLS, APIs de leitura, configuração por loja, índices, logs, especificação de estados. Feature flag permanece OFF. | RLS e fronteiras por restaurante testadas; nenhuma regressão em Gestão/Cozinha/Caixa |
| **1.1.0-rc.2 — Vitrines** | `/explorar`, `/loja/:slug`, busca por cidade/bairro/CEP, páginas de loja, horários e taxa; reuso do catálogo atual. | Navegação pública e catálogo sem vazamento de dados; endereço correto; funciona sem login |
| **1.1.0-rc.3 — Carrinho e checkout** | Carrinho por restaurante, adicionais, cálculo servidor, entrega/retirada, checkout guest com termos; login opcional pode começar por conta simples. | Preço/taxa manipulados no cliente rejeitados, duplicidade impedida, pedidos inativos bloqueados |
| **1.1.0-rc.4 — Pedidos Online** | Pedido persistido, fila "Aguardando aceite", painel do restaurante e acompanhamento por link. | Pedidos errados de outros restaurantes inacessíveis; recusa/cancelamento testados; sem perda de pedido |
| **1.1.0-rc.5 — Cozinha/Estoque** | Pedidos online na fila de preparo com origem, estados e baixa idempotente de estoque. | Sem criação de mesa fictícia; sem baixas duplas; presencial funciona sem regressão |
| **1.1.0-rc.6 — Caixa e entrega** | Pagamento na entrega/retirada, conferência manual, entregas próprias, relatórios separados e zonas/taxas consolidados. | Entregue≠pago; total e taxa conciliados; teste real de operação completa |
| **1.1.0-rc.7 — Piloto** | Ativar `accepts_customer_orders` só em restaurante de teste, executar fluxos reais de ponta a ponta, rollback de leitura/checkout e suporte a erros. | Homologação em Android/iOS/desktop e pedidos reais controlados |
| **1.1.0 — Liberação gradual** | Publicar feature flag por loja, monitorar taxa de sucesso/rejeição, abrir novas lojas conforme suporte. | Evidência de homologação e capacidade de desativação imediata |

**Adiar para ciclos seguintes:** gateway Pix/cartão com webhook, estorno automático, aplicativo de entregadores, despacho por GPS, avaliações, campanhas e cupons, comissão/repasse do marketplace, fidelidade e notificações avançadas. Nada disso deve ser simulado como funcional.

## 8. Política comercial a definir antes do lançamento geral

O aplicativo é uma plataforma de vários estabelecimentos, mas a primeira versão opera com **entrega própria**. O Intervalo não assume frete, logística nem recebimento do pagamento do cliente até que essas funções sejam contratadas/implementadas.

Configuração de cobrança da plataforma a decidir: mensalidade SaaS, comissão por pedido ou híbrido. Registrar origem do pedido (`marketplace` x `link da loja`) desde o primeiro dia, pois taxas podem ser diferentes **no futuro**. Nenhuma comissão deve ser cobrada silenciosamente nesta versão.

## 9. Checklist mínimo de segurança, operação e testes

- [ ] Fluxo de guest, login opcional e isolamento de contas por restaurante
- [ ] Produto indisponível, categoria oculta, restaurante fechado, loja desligada
- [ ] Cidade/bairro/CEP fora da região e cobrança de taxa incorreta
- [ ] Manipulação de preço, produto de outro restaurante e cupom não autorizado
- [ ] Duplicidade por duplo clique, timeout, refresh, redes lentas e pedidos simultâneos
- [ ] Pedido recusado, expirado, cancelado e mudança de status fora de ordem
- [ ] Preparo e baixa de estoque exatamente uma vez, regras de estorno e auditoria
- [ ] Cozinha mostra `DELIVERY/RETIRADA` sem interferir no atendimento presencial
- [ ] Caixa não registra recebimentos inexistentes e não mistura "entregue" com "pago"
- [ ] Link de tracking seguro, dados de terceiros não enumeráveis, rate limit e políticas RLS
- [ ] Teste no telefone com teclado e Bottom Sheets, acessibilidade, erro e offline
- [ ] Documentação de aceite de privacidade, retenção de dados e suporte ao cliente
- [ ] Desligar vendas online por restaurante sem bloquear o cardápio de consulta
- [ ] Verificar deploy real no host, sem depender de GitHub Actions

## 10. Limites desta especificação

Baseado em inspeção do repositório e do schema real em 15/11/2026; as definições de novas tabelas e endpoints são **propostas**, não interfaces existentes. Não houve migração, deploy, ativação de pedidos, mudança em auth, funcionários ou permissões. As versões 1.1.0-rc.* acima são marcos propostos que só devem constar como entregues após código, testes e homologação verificável.

**Próxima tarefa de engenharia:** criar o pacote `rc.1` (migrations + políticas + contratos/API + testes de isolamento), **com feature flag de pedidos online desligada** e sem interferir em operações atuais.
