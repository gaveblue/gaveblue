# Intervalo — QA integrado 1.0.0-rc.8 a rc.10 (15/11/2026)

**Repositório:** `gaveblue/gaveblue` · `main`  
**Supabase:** INTERVALO `fynaaiazebydorzllwip` (organização Primary)  
**Escopo:** rodadas no Garçom (rc.8), KDS por rodada (rc.9), fechamento consolidado no Caixa (rc.10).  
**Fora do escopo:** funcionários, CPF, login, permissões de papel e recuperação de senha.

## Arquitetura e preservação de dados

- A comanda permanece em `public.orders` com o mesmo `id`, `restaurant_id` e `table_id`.
- Nova `public.order_rounds` registra `round_no`, estado e horários por rodada. `order_items.round_no` vincula cada produto à rodada; FK composta previne vínculos entre comandas/restaurantes.
- Migração fez **backfill** das 7 comandas existentes em rodada 1, com **8 itens e zero órfãos**; dados originais e pagamentos preservados.
- Nova função SQL `intervalo_add_item_auto` reutiliza a comanda ativa e cria rodada `draft` quando necessário, bloqueando adição após início do pagamento.
- `intervalo_submit_order` envia somente o `draft` e baixa o estoque somente dos itens daquela rodada. `intervalo_advance_round` progride cada rodada separadamente. Funções antigas de inclusão/progresso preservadas como compatibilidade controlada.
- `orders.status` é uma situação agregada: somente chega a `served` depois que todas as rodadas são servidas e não existe rodada pendente; `pay_manual` continua exigindo `served`.
- Edge Function `restaurant-core` v12 mantém `verify_jwt=true` e verifica acesso ao restaurante/módulo. A listagem inclui `rounds` e o indicador `payment_started`, sem expor valores recebidos aos garçons.

## Evidências de teste

| Verificação | Resultado | Evidência |
|---|---|---|
| Ensaio da migração em transação com rollback | PASSOU | DDL / funções compiladas sem erros |
| Migração aplicada ao banco INTERVALO | PASSOU | Supabase retornou sucesso |
| Backfill de comandas e itens | PASSOU | 7 comandas, 7 rodadas, 8 itens, 0 órfãos |
| Execução direta por `anon` ou `authenticated` | BLOQUEADA | SELECT de `order_rounds` e EXECUTE de `intervalo_advance_round` restritos a `service_role` |
| Duas rodadas na mesma comanda | PASSOU | Teste SQL transacional criou rodada 1 e rodada 2, sem duplicar comanda |
| Processamento e entrega por rodada | PASSOU | Transições `submitted→preparing→ready→served` nas duas rodadas |
| Pagamento antes de tudo ser servido | BLOQUEADO | Teste SQL confirmou recusa de pagamento com rodada em produção e com rodada `draft` |
| Novo item depois de pagamento parcial | BLOQUEADO | RPC recusou criação de rodada após primeiro recebimento |
| Pagamento parcial e fechamento integral | PASSOU | Primeiro recebimento manteve aberta, segundo fechou comanda; tudo desfeito com `ROLLBACK` |
| Estado original após testes | PASSOU | Contagem de 7 comandas, 7 rodadas, 8 itens e zero órfãos |
| Garçom exibe rodadas, envio da rodada pendente e bloqueio após pagamento | PASSOU em simulação JS/DOM | Duas rodadas, botão 'Enviar rodada 2', + ativo sem pagamento e desabilitado após pagamento |
| Cozinha gera um ticket por rodada | PASSOU em simulação JS/DOM | Dois tickets separados, produtos de cada rodada e ações específicas |
| Caixa agrupa as rodadas e calcula total único | PASSOU em simulação JS/DOM | Duas rodadas, total R$ 15,00 de fixture e fila somente de comanda servida |
| Desconto de ficha técnica por rodada | PASSOU com rollback | Criada ficha técnica temporária com insumo real: a Rodada 1 retirou 1 unidade e a Rodada 2 retirou mais 1; 2 movimentos de estoque para a mesma comanda, sem duplicar |
| Concorrência real de garçons em duas sessões | PENDENTE | Bloqueio de linhas / índice mantidos, sem teste simultâneo em dispositivos |
| Impressão real em impressora térmica | PENDENTE | Prévia HTML implementada, impressão manual ainda precisa de dispositivo |
| Teste de ponta a ponta autenticado no domínio/PWA | PENDENTE | Sem sessão real de navegador; verificador HTTP externo não conseguiu abrir o domínio |

## Roteiro para validação no aplicativo publicado

1. No Garçom, selecione a mesa livre, adicione produto pelo `+` e confirme a comanda automática.
2. Envie **Rodada 1** e abra a Cozinha; deve aparecer exclusivamente o ticket da Rodada 1.
3. No Garçom, ainda na mesma mesa, adicione outro produto sem abrir nova comanda; envie **Rodada 2**.
4. Verifique na Cozinha tickets distintos, cada qual com seus itens, comentários e tempo desde o envio.
5. Marque as rodadas em preparo e prontas. Pelo Garçom, marque cada rodada pronta como servida.
6. Confirme que o Caixa só lista a mesa depois de **todas** as rodadas servidas.
7. Abra sessão do Caixa, registre pagamento parcial e verifique saldo; complete o pagamento e confira que a mesa fica livre.
8. Verifique que não se pode adicionar produtos depois de iniciado pagamento.
9. Confira a prévia de impressão da Cozinha por rodada e o recibo de Caixa com todas as rodadas.
10. Reabra o PWA instalado e confira que os novos módulos são carregados (rc.8 / rc.9 / rc.10).

## Riscos, publicação e rollback

- **Código enviado à branch `main` e backend aplicado.** Não há confirmação de propagação do GitHub Pages ou homologação de uso real.
- Sem uso do GitHub Actions. Login, cadastro e permissões de funcionários **não foram alterados**.
- A baixa de estoque ocorre no envio de cada rodada; nunca na inclusão ou no fechamento.
- Rollback de UI e Edge é possível antes do uso de múltiplas rodadas. **Depois que existirem comandas com duas ou mais rodadas reais, NÃO remover `order_rounds` nem a coluna `round_no`: isso causaria perda de rastreabilidade.** Nessa hipótese, corrigir para frente mantendo os dados; se necessário, suspender temporariamente novas inclusões enquanto corrige.
- Migração adicional `20261115_rounds_deny_clients_rc10.sql` criou política explícita de bloqueio para clientes. O aviso RLS sem política desapareceu dos Advisors; permanecendo somente o alerta pré-existente de proteção de senha vazada no Supabase Auth, fora do escopo e sem mudanças agora.
- Teste de ficha técnica temporária executado em transação com rollback; o banco terminou com **7 comandas, 7 rodadas, 8 itens, 0 receitas persistidas e zero órfãos**.

**Conclusão:** QA técnico e transacional passou, com homologação **parcial** até testes reais em PWA e fluxo completo no domínio.
