# Intervalo — QA técnico 1.0.0-rc.4 · Atualização do Garçom

Data: 15/11/2026  
Repositório: `gaveblue/gaveblue` · branch `main`  
Módulo: `intervalo/waiter.js`, entrada `intervalo/index.html`

## Alterações verificadas no código

| Cenário | Status | Evidência |
|---|---|---|
| Remoção de Internet disponível, Instalar app e Restaurantes do cabeçalho | PASSOU na inspeção estática | IDs `wg-connection` e `wg-install` não permanecem no `waiter.js` |
| Grade de mesas de três colunas | PASSOU na inspeção estática | CSS `repeat(3,minmax(0,1fr))` e cartões com `aspect-ratio:1/1` |
| Seleção, filtros e estados da mesa preservados | PASSOU na inspeção estática | IDs `data-w-table`, `data-w-filter` e cálculo de ocupação mantidos |
| Logo sem sublinhado sobreposto ao subtítulo | PASSOU na inspeção CSS | Pseudo-elemento antigo desativado e sublinhado desenhado por background |
| Barra inferior com botão central + e Mais | PASSOU na inspeção estática | Cinco elementos de navegação, IDs `wg-add-menu` e `wg-more-menu` |
| Folha de opções + e Mais | PASSOU na inspeção estática | `dialog.showModal`, ações definidas, fechamento por botão e fundo |
| Instalação condicional fora do cabeçalho | PASSOU na inspeção estática | Ação exibida em Mais somente sem `display-mode: standalone` ou `navigator.standalone` |
| Sintaxe JS | PASSOU | `new Function` sobre o módulo após remoção de ESM, sem executar operações |
| Atualização de cache | PASSOU na inspeção | `index.html` carrega Garçom com `v=1.0.0-rc.4` |
| Login real, permissões e operação de pedidos | PENDENTE | Exige sessão real, navegador e backend Supabase |
| Teste visual em celulares 320 px a 430 px e tablets | PENDENTE | Não foi executado teste visual autenticado |
| Instalação / atualização em PWA existente | PENDENTE | Requer teste físico no app instalado |
| Verificação HTTP no domínio | PENDENTE | Depende da disponibilidade e propagação da publicação |

## Roteiro de homologação manual

1. Abra `https://gaveblue.com.br/intervalo/?app=garcom` e selecione um restaurante autorizado.
2. Confirme ausência das três pílulas do topo e legibilidade do logotipo e nome do restaurante.
3. Verifique grade de 3 colunas, estado Livre/Ocupada, seleção destacada e filtros.
4. Acione botão + e verifique ações, incluindo Abrir comanda quando não houver pedido ativo.
5. Navegue por Mesas, Cardápio, Comanda e Mais; confirme funcionamento de Minha conta e Trocar restaurante.
6. Abra a comanda, adicione produto, confira total e envio para cozinha, sem duplicações.
7. Rode o PWA instalado; a opção Instalar aplicativo não deve aparecer no Mais.
8. Desligue a internet; aviso operacional de offline deve aparecer, sem simular pedido enviado.
9. Atualize página e reabra o app instalado; confira se a nova interface não está em cache antigo.

## Risco e rollback

Mudança limitada ao frontend; nenhum esquema SQL alterado. Riscos principais: CSS de dispositivos menores, cache de PWA e chamadas de pedido não testadas ponta a ponta.

Rollback via GitHub `main`, revertendo os commits de interface e cache (`94c8705`, `ff2ced8`, `41354a6`, `10523df`, `c0678fb`) em ordem reversa e atualizando o navegador. Não usar GitHub Actions.

**Conclusão:** implementação enviada ao repositório, homologação técnica **parcial**. Não declarar aprovação funcional ou entrega ao domínio sem smoke test real.
