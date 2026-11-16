# QA — Intervalo 1.1.0-rc.9 — InfinitePay Novo Mundo
Data: 2026-11-16

## Situação
**Homologação técnica parcial; pagamento real ainda não testado.**
Não declarar financeiro homologado até verificar uma cobrança real e o callback.

## Evidências
- Supabase INTERVALO: `marketplace-infinitepay` Edge Function ACTIVE, v3, JWT desativado só para receber evento público e atender visitantes com token privado; `marketplace-online` v3 e `marketplace-payments-admin` v3.
- Banco: checkout `infinitepay` aceito; pedidos com esse método iniciam `payment_pending`; transição para `accepted` bloqueada até `paid`.
- Novo Mundo: loja publicada/aceitando pedidos, não pausada; gateway específico `enabled=true`; apenas nome da variável `INFINITEPAY_NOVO_MUNDO_API_KEY` registrado no banco, nunca seu valor.
- RPC de finalização: privilégio EXECUTE do papel anônimo = NÃO, service_role = SIM.
- Contagens de conferência imediatamente após migração: 0 pedidos `infinitepay`, 0 tentativas de cobrança. Nenhum pagamento real iniciado pela implantação.
- JS `marketplace-checkout-rc7.js` e `marketplace-tracking-rc4.js` passou validação sintática. Arquivos atualizados no GitHub `main`. Propagação no domínio não verificada: acesso externo bloqueado no ambiente de validação.

## Pontos para teste real
1. Abrir `/intervalo/loja/novo-mundo` → checkout; confirmar produto, retirada ou entrega, telefone e aceite.
2. Dentro do bottom sheet de Pagamento, escolher `Pagar agora · Pix online`; confirmar que o botão fixo do rodapé calcula o total e abre checkout hospedado InfinitePay.
3. Conferir valor = subtotal de produtos com adicionais + frete; QR Pix e Pix Copia e Cola aparecem **na InfinitePay**, não no Intervalo.
4. Realizar uma cobrança real pequena (a InfinitePay não tem sandbox e o mínimo é R$ 1,00), conferir webhook e `/payment_check`.
5. Testar a volta ao `/intervalo/pedido/:token`, status `paid`, histórico de evento, Caixa/Gestão/Cozinha.
6. Reenviar callback idêntico e clicar novamente no botão de pagar: não pode duplicar pagamento registrado ou pedido.
7. Enviar callback falso, transação de outro pedido ou montante divergente: não pode marcar `paid`.
8. Confirmar que pedidos dos outros restaurantes permanecem intactos, e Pix na entrega/retirada segue disponível.

## Limitações
- Checkout da InfinitePay não é embutível, nem a API fornece QR Code/Pix Copia e Cola diretamente ao sistema.
- Cartão também permanece disponível na página hospedada da InfinitePay: não é possível ocultá-lo pela API atual.
- Link expira após 30 minutos; tentativa expirada orienta criar outro pedido.
- Ausência de confirmação real de hospedagem no domínio, da existência/validade operacional da API Key e do webhook. Exige teste manual com lojista.
- GitHub Actions não utilizado.

Referência: https://www.infinitepay.io/checkout-documentacao
