# QA — Intervalo 1.1.0-rc.10 | Pix direto e prazo de 10 minutos

**Situação:** homologação técnica parcial, sem recebimento real testado e sem chave Pix do estabelecimento cadastrada.

## Entregue
- Supabase: `marketplace-manual-pix` e `marketplace-manual-pix-admin` ativos; `marketplace-operations` permite `accept_manual_pix` com autenticação e permissão Gestão.
- `online_orders.payment_method` aceita `manual_pix`; pagamentos começam em `payment_pending`.
- `online_manual_pix_charges`: payload BR Code, TxId único por pedido, expiração, aviso `reported_at` e confirmação manual; RLS ativa e sem acesso ao navegador.
- `restaurant_manual_pix_settings`: chave do recebedor, nome/cidade e status por restaurante; gravação permitida apenas via Edge Function de Master.
- Job pg_cron `intervalo-manual-pix-expire-10min`: executa a cada 1 minuto; pedido não sinalizado dentro de 10 minutos é marcado `expired`.
- Botão `Já paguei`: registro auditável, não equivale a confirmação bancária; impede cancelamento enquanto restaurante confere.
- Aceite de Pix manual só pode ocorrer depois da sinalização, com confirmação explícita de que crédito de valor correto apareceu no extrato. O banco registra pagamento e aceite em mesma transação.
- InfinitePay permanece alternativa no checkout e suas credenciais não foram alteradas.

## Verificações concluídas (sem movimentação financeira)
- Parse sintático do JS: checkout, tracking, painel Gestão e configuração Pix: **OK**.
- Teste SQL com `BEGIN ... ROLLBACK`: pedido não informado após vencimento passou a `expired`; pedido informado pôde ser confirmado, resultando em `accepted` e `paid`; nenhum registro de teste persistiu.
- `cron.job.active = true`, agenda `* * * * *`, grant EXECUTE anônimo negado para `marketplace_accept_manual_pix`.
- Sem cadastro de chave Pix manual (0 linhas em `restaurant_manual_pix_settings`), portanto opção indisponível até Master configurar.

## Testes práticos pendentes
1. Entrar como Master na Gestão do Novo Mundo e preencher chave Pix válida de recebimento, nome e cidade do titular.
2. Publicar/recarregar `gaveblue.com.br/intervalo` e conferir o card Pix manual em Loja Online.
3. Criar um pedido real de valor baixo, confirmar BR Code e QR Code com aplicativo bancário (titular e valor corretos).
4. Sem pagar nem clicar em `Já paguei`, confirmar expiração e mudança do pedido para Expirado (até 1 minuto após o prazo).
5. Em novo pedido, pagar dentro do prazo, clicar em `Já paguei`, conferir o crédito no banco e aceitar no painel; verificar `paid` e entrada na Cozinha.
6. Repetir confirmação e report: não deve duplicar pagamento nem causar segundo aceite.
7. Confirmar que Pix direto do restaurante A não pode redirecionar para chave do restaurante B.
8. Conferir responsividade, cópia de código e QR Code em Android e desktop; testar falha de carregamento da biblioteca de QR.

## Riscos e limites
- **O banco não invalida QR Pix estático após 10 min.** Somente a autorização do pedido no Intervalo expira. Pagamentos tardios ou sem aviso podem exigir revisão manual, inclusive reembolso.
- A marcação `Já paguei` pode ser falsa: gerente deve verificar o extrato, não confiar apenas no cliente ou em comprovantes.
- O QR Code usa um script de código aberto carregado de jsDelivr; Copia e Cola permanece disponível se a renderização falhar.
- Publicação no domínio, funcionamento do carregamento da biblioteca externa e compra real ainda não confirmados.
- Sem GitHub Actions.
