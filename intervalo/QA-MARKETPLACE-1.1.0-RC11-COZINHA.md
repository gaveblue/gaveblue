# QA — Intervalo 1.1.0-rc.11 — Pedidos online na Cozinha
Data: 16/11/2026

## Causa e correção
- Antes: a tela `intervalo/kitchen.js` desenhava as rodadas presenciais nas três colunas do KDS e somente **depois do quadro**, em uma seção independente, os pedidos online. Para quem consultava `Novos pedidos`, o pedido aceito parecia não chegar.
- Antes: a chamada `marketplace-operations / kitchen_queue` engolia erros e os interpretava como fila vazia.
- Agora: pedidos da Loja Online com `status=accepted` surgem em **Novos pedidos**; `preparing` em **Em preparo**; `ready` e `ready_for_pickup` em **Prontos**. Atributos DELIVERY/RETIRADA e itens preservados.
- As chamadas ao backend presencial e online são independentes; erro de uma não impede mostrar os pedidos da outra. O erro online tem mensagem visível com ação Atualizar.
- Botões continuarão chamando `marketplace-operations / transition` para `preparing` e `ready`/`ready_for_pickup`; nenhuma mesa fictícia ou comanda presencial é criada.
- `intervalo/index.html` passou a carregar `kitchen.js?v=1.1.0-rc.11`, para invalidar cache. Atualização a cada 15 segundos preservada.

## Testes concluídos
1. JavaScript passou parse sintático após alteração.
2. Simulação de renderização com 4 pedidos online: `accepted`, `preparing`, `ready_for_pickup` aparecem nas três colunas; `pending_acceptance` é omitido.
3. Simulação de falha da consulta online mostrou aviso com erro em vez de lista silenciosamente vazia.
4. Teste SQL transacional no Supabase INTERVALO: novo pedido com item criado, transição `pending_acceptance → accepted → preparing → ready_for_pickup` executada, consulta da fila retornou pedido/item, depois `ROLLBACK`. Nenhum teste ficou gravado.
5. Os módulos `cozinha` e `gestao` estão habilitados no Novo Mundo, e o Master possui associação ativa.
6. Histórico do Novo Mundo comprovou um aceite anterior, mas o pedido foi cancelado depois. Não havia pedido aceito ativo durante a análise.

## Pendências de homologação
- Testar novo pedido de verdade no Novo Mundo: Loja Online → Aceitar → conferir imediatamente **Novos pedidos** em `/intervalo/novo-mundo/cozinha`.
- Tocar **Iniciar preparo** e **Marcar pronto** no celular; conferir que os pedidos mudam de coluna e de status na Gestão.
- Confirmar propagação do frontend no domínio `gaveblue.com.br`; o ambiente de validação não conseguiu acessar a URL pública diretamente.
- Não rodar GitHub Actions (indisponível no projeto).

**Status: QA técnico passou; teste real no domínio ainda pendente.**