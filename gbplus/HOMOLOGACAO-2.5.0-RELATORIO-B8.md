# GB+ 2.5.0 — Homologação do núcleo OFX/CSV, build 8

**Situação:** preparado para publicação assistida, sem homologação completa de dispositivos/CI. O usuário autorizou a liberação para prosseguir à 2.5.1.

## Testes executados em 06/11/2026

- **10/10 suítes em Node 22.16.0 real: aprovadas**, incluindo entrada OFX/CSV, categorias, revisão, confirmação explícita da conta, pagamento baixado, duplicidade, pendência, concorrência local, saldo e reversão.
- O teste fictício de saldo passou: **R$ 100,00 → R$ 137,50 → R$ 100,00** depois de criar e reverter duas movimentações.
- Arquivos efetivamente testados foram confrontados com os blobs Git do ramo: `js/app.js` `e91b6fd9005f067ea48a75dc868cc8d1dbd28ad3`, `js/bank-import-ui.js` `eeb1a51b0b5b3bbf798e09aebb3b47e5e8c7af70`.
- **Backend Supabase:** um teste SQL com usuário 100% fictício (inserido temporariamente em subtransação que foi revertida obrigatoriamente) validou duas revisões do documento, idempotência, conflito concorrente, isolamento de usuário e proteção contra reutilizar identificador de operação. Verificou que **nenhuma conta e nenhum documento fictício ficaram persistidos**. Não envolveu dados de clientes.
- UI de leitura no Chromium já havia sido testada na build 7 em 360, 390 e 1200 px. A confirmação nova foi validada em Node; **o PWA autenticado inteiro não foi testado num Android/iPhone real** nesta rodada.

## Funcionalidades habilitadas

Importação OFX/CSV local, sugestões de correspondências, conciliar com baixa/transferência existente, ignorar, pendente, criar título baixado **apenas após revisão e confirmação expressa** da conta e, separadamente, da criação. Impedir reimportações e reverter lote intacto. Nenhum ajuste automático do saldo inicial.

## Pendências assumidas, sem alegar entrega

- GitHub Actions falha antes de executar qualquer teste, issue [#75](https://github.com/gaveblue/gaveblue/issues/75); testes Node locais **não são CI verde**.
- PWA com sessão real e dispositivos móveis permanece sem homologação ponta a ponta; o teste SQL simulou uma identidade, não login JWT/HTTP.
- Mapeamento manual de CSV bancário não padronizado, XLSX, PDF e data-base explícita do saldo inicial são itens complementares, **não entregues**. Podem ser planejados em versões posteriores.

**Critério de comunicação:** registrar a 2.5.0 como núcleo OFX/CSV entregue, com homologação funcional parcialmente documentada; não afirmar que todas as promessas originais foram cumpridas.
