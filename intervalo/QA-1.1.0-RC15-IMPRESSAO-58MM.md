# Intervalo 1.1.0-rc.15 — Impressão térmica 58 mm (Cozinha / Caixa)

Data: 2026-11-16
Status: **código implementado, QA técnico parcial; impressão real pendente**.

## Problema observado
Em Android, utilizando o serviço Thermal Printer, com tamanho de papel 2-inch (58 mm), a prévia do pedido da Cozinha apresentava caracteres muito pequenos no alto de uma página muito longa e praticamente vazia. O HTML anterior usava `max-width:76mm` no modo de impressão, maior que a largura disponível de uma impressora de 58 mm, e não informava uma altura compacta para a folha de rolo.

## Correção
- Criado `thermal-receipt-58mm-rc15.js`, gerador compartilhado de prévia para tickets térmicos (sem exigir instalação de driver no aparelho).
- A página, corpo e o conteúdo imprimível utilizam largura de **58 mm**, com área interna aproximada de **51 mm** e margens de 3,5 mm. Tipografia adaptada a cupons pequenos.
- No momento de impressão, `@page` recebe `size:58mm {altura}mm; margin:0`, com altura calculada a partir de `scrollHeight` do conteúdo e 5 mm de tolerância (mínimo 40 mm).
- No modo tela, o usuário continua tendo botão **Imprimir / PDF**; o botão é ocultado da impressão.
- Id longo da comanda abreviado visualmente (últimos 8 caracteres hexadecimais), sem mudar o identificador original no banco de dados.
- Cozinha e Caixa utilizam o mesmo mecanismo; preservados produtos, observações, rodadas, totais e aviso de documento não fiscal.
- `index.html` atualizado para carregar `kitchen.js` e `cash.js` em `1.1.0-rc.15`. Não altera dados, permissão ou API de pagamentos.
- Impressão permanece manual, depende do diálogo do Android e do serviço de impressão configurado. O navegador/serviço pode ignorar `@page` ou impor comprimento de página; isso deverá ser conferido no hardware.

## Verificações técnicas
- Validação de sintaxe: `thermal-receipt-58mm-rc15.js`, `kitchen.js` e `cash.js`: OK.
- Simulação da página: exemplo com `scrollHeight=314px` gera `@page{size:58mm 89mm;margin:0}`: OK.
- Verificação da largura real de 58 mm, do botão e do conteúdo HTML: OK.
- Caches atualizados nas rotas Cozinha e Caixa: OK.
- Pendente: confirmar propagação no domínio, reabrir Cozinha → Imprimir → Thermal Printer 58 mm, medir papel efetivamente alimentado, avaliar acentuação e largura. Testar cupom de 1, 3 e 10 itens; pedidos com nome/observações longas e comanda do Caixa.
- Não afirmar homologação física até retorno do usuário ou execução comprovada em impressora.

## Regressão manual prioritária
1. Cozinha: pedido com 1 item deve mostrar prévia curta, com texto legível, sem grande cauda branca.
2. Cozinha: pedido com vários itens deve crescer em altura automaticamente, sem cortes.
3. Caixa: totais e itens devem caber dentro de 58 mm, sem colunas cortadas.
4. Android: selecionar 2-inch (58 mm), 1 cópia, escala 100% se disponível. O serviço de impressão deve respeitar o comprimento; caso contrário, usar saída térmica nativa ESC/POS como alternativa.
