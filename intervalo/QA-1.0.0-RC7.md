# Intervalo — QA 1.0.0-rc.7 · Bottom Sheet para produto

Data: 15/11/2026 · repositório `gaveblue/gaveblue`, branch `main`.  
Arquivos alterados: `intervalo/waiter.js`, `intervalo/index.html`.

## Mudança
No Garçom, toque em `+` no produto abre Bottom Sheet em vez de modal centralizado. Não há `focus()` em entrada editável ao abrir. Quantidade editável pelos botões `− / +` ou teclado numérico **interno** ao tocar no valor, sem teclado nativo. Campo de observação, quando focado pelo usuário, permite teclado do aparelho. Total atualizado e ações no rodapé. Permanece o envio `item_add_auto` para comanda.

## Evidências de QA automatizado leve

| Cenário | Status | Evidência |
|---|---|---|
| JS compilável sem erros | PASSOU | `new Function` aplicado à fonte após retirar import/export ESM |
| Painel aberto sem teclado | PASSOU em simulação DOM | Foco em botão de fechar, sem foco no campo de texto |
| Teclado numérico começa oculto | PASSOU | `keypad.hidden === true` |
| Botão `+` altera quantidade e total | PASSOU | 1 → 2; total de teste R$ 90,90 → R$ 181,80 |
| Botão `−` volta a 1 | PASSOU | 2 → 1 |
| Toque no número mostra teclado interno | PASSOU | `keypad.hidden === false` |
| Digitar quantidade 23 | PASSOU | Valor 23 e total recalculado |
| Concluído fecha teclado interno | PASSOU | Painel numérico oculto |
| Foco em observações fecha teclado interno | PASSOU | Foco do textarea aciona fechamento do numérico |
| Confirmar 5 unidades com observação | PASSOU | Uma única chamada `item_add_auto` com quantidade 5 e `sem gelo` |
| Continuar no Cardápio depois de adicionar | PASSOU | `view=cardapio` e recarregamento acionado |
| Gestos em dispositivo físico | PENDENTE | Android/iOS não testados em browser real |
| Ajuste com teclado real do Android | PENDENTE | Precisa conferir `visualViewport` e footer visível |
| Requisição real autenticada e cozinha | PENDENTE | Não foi feito E2E no domínio |
| Publicação HTTP do GitHub Pages | NÃO VERIFICADA | Sem teste confiável do domínio |

## Roteiro manual
1. No Garçom, selecione a mesa e toque no `+` de um produto.
2. Confirme que o Bottom Sheet abre de baixo sem teclado do celular.
3. Aumente/diminua quantidade e confira total. Toque no número para digitar usando teclado interno, depois Concluído.
4. Toque em observações e confira se teclado normal aparece só nesse momento, sem ocultar o rodapé do Bottom Sheet.
5. Tente expandir arrastando a alça para cima; feche arrastando para baixo. Reabra.
6. Confirme a inclusão e verifique a comanda sem etapas adicionais.
7. Teste Cancelar, erros de rede e repetição do toque em Adicionar.
8. Reabra PWA instalado para garantir atualização de versão.

**Homologação: técnica parcial.** Não considerar uso real homologado apenas com simulação. Nenhum backend ou esquema de banco alterado.
