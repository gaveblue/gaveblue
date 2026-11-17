# Intervalo — QA 1.1.0-rc.17 · Garçom: lista/grade e pedidos delivery/retirada

Data: 2026-11-16

## Mudanças
- `waiter.js`: botão compacto de escolha **Lista / Grade** no topo do Cardápio, com modo lista (linhas horizontais) e preferência `intervalo.waiter.catalog.layout.v1` salva neste aparelho. Filtros, buscas, adicionar e abrir comanda da mesa preservados.
- `waiter.js`: botão **Novo delivery ou retirada** no módulo Mesas e atalho equivalente em **Ações rápidas**.
- `waiter-delivery-rc17.js`: formulário móvel em etapas: selecionar produtos e quantidades, observações por item, selecionar delivery ou retirada, cliente, telefone, endereço e região de entrega, forma de pagamento *na entrega/retirada*, observação geral e confirmação. O usuário recebe código do pedido e link privado de acompanhamento. Não cria mesa nem comanda presencial.
- `marketplace-staff-orders` (Edge Function): autenticada via sessão Supabase; exige restaurante ativo, vínculo de funcionário ativo com papel `waiter`, `manager` ou `master`, módulo `garcom` habilitado e ausência de bloqueio de permissão individual.
- `marketplace_staff_place_order` (RPC com `SECURITY INVOKER` e `EXECUTE` exclusivo para `service_role`): valida vínculo novamente, usa `marketplace_quote_order` para regras de preços, estoque, horários, endereço/CEP/região e taxa, e `marketplace_transition_order` para aceitar o pedido e reservar insumos **na mesma transação**. Usa idempotência por `request_id` para evitar pedidos duplicados. `online_order_events` registra origem `garcom` e funcionário responsável.
- Pedido do Garçom é registrado na estrutura `online_orders` como modalidade delivery ou retirada, status `accepted`, pagamento `unpaid`; **não falsifica aceite de termos do consumidor** e não marca pagamento como recebido.
- Cozinha continua exibindo pedidos aceitos do online em sua fila unificada, e Loja Online acompanha o pedido como pedido externo.
- Rota `garcom` tem importação com cache atualizado para `1.1.0-rc.17`.
- Mantidos limites de produto, preço, volume de itens e seleção de região do servidor; sem alterar os dados de pedidos existentes.

## Evidências técnicas
- Migração `marketplace_staff_orders_rc17` aplicada ao projeto Supabase `fynaaiazebydorzllwip`.
- Edge Function `marketplace-staff-orders` publicada: versão 1 ativa e `verify_jwt=true`.
- `has_function_privilege`: `service_role=true`, `authenticated=false`, `anon=false` para a RPC de criação.
- Dois testes transacionais no restaurante `novo-mundo`: um pedido delivery e um pedido retirada foram criados, chegaram a `accepted` e foram revertidos no próprio bloco transacional; **sem persistir pedidos, pagamentos ou movimentos de estoque de teste**.
- Síntese JS verificada em `waiter.js`, `waiter-delivery-rc17.js` e script principal `index.html`.
- 15 verificações estáticas de referências (rotas, formulários, permissões, cotação e estoque): 15/15 OK.

## Limites e riscos atuais
- O fluxo de pedidos de Garçom reutiliza a cotação do marketplace: exige Loja Online publicada e apta a receber pedidos, horários e regiões de entrega cadastrados. Pedidos fora do horário ou com loja pausada são rejeitados corretamente. Uma futura modalidade de pedido agendado requer novas regras.
- Nenhuma cobrança é processada pelo aplicativo: a modalidade selecionada informa **como o cliente pretende pagar no recebimento**. O recebimento deve ser confirmado pelos canais já existentes.
- QA técnico **não equivale** a homologação visual Android nem a teste real com conta de Garçom. Pendente abrir `gaveblue.com.br/intervalo/novo-mundo/garcom` no celular, testar botões, teclado, filtros e concluir pedido em situação real.
- Não foram usados serviços pagos nem GitHub Actions.

## Roteiro do teste no celular
1. Garçom → Cardápio → alternar entre Lista/Grade e reabrir para conferir persistência.
2. Garçom → Mesas → Novo delivery ou retirada (ou botão + → Ações rápidas).
3. Adicionar dois produtos, alterar quantidades, definir observação e continuar.
4. Informar cliente, telefone, delivery, região, CEP e endereço válido; verificar taxa e total.
5. Escolher dinheiro/Pix/cartão na entrega, confirmar uma única vez; verificar código e link.
6. Conferir que o pedido aparece na Cozinha (novos pedidos), com etiqueta DELIVERY e sem mesa fictícia.
7. Conferir Estoque e Loja Online; registrar pagamento apenas após confirmação externa.
8. Repetir como Retirada e conferir que não pede endereço nem frete.
