# Intervalo — QA 1.0.0-rc.13 · Carregamento global unificado

**Data:** 15/11/2026 · **repositório:** `gaveblue/gaveblue`, branch `main`.

## Motivo
Depois do skeleton na Gestão (rc.12), ainda havia um placeholder fixo `Carregando Intervalo...` no HTML inicial e textos de carregamento avulsos em outros módulos. Eles apareciam durante a autenticação, navegação, importação JavaScript e consultas.

## Alterações
- `intervalo/index.html`: conteúdo estático inicial substituído por abertura **Intervalo** minimalista com marca laranja, indicador de progresso e skeletons. Os estilos críticos estão no próprio HTML para aparecerem **antes** do carregamento de bibliotecas JS e arquivos CSS externos.
- `body.iv-initializing`: evita exibir momentaneamente o cabeçalho e rodapé antigos durante inicialização. A função `box()` remove a classe ao substituir a tela pela rota real. O tratamento `start().catch` usa o mesmo caminho.
- Um aviso com botão **Tentar novamente** aparece se a abertura permanecer sem renderizar por 18 segundos, inclusive se a importação de biblioteca externa falhar antes do início do módulo. O aviso não afirma operação offline.
- Placeholder reutilizável em CSS embutido `iv-loading-inline` com indicador e dois skeletons, aplicado a `platform.js`, `kitchen.js`, `cash.js`, `catalog.js`, `support.js`, `waiter.js`, `account.js`, `public-menu.js` e seleção do Garçom em `index.html`.
- Respeita `prefers-reduced-motion`: animação shimmer e pulso param quando movimento reduzido está ativo.
- Versão dos imports dinâmicos dos módulos alterados atualizada para `?v=1.0.0-rc.13`; Gestão mantém seu skeleton específico rc.12. CSS global `design-system.css?v=1.0.0-rc.13`.
- Não alteradas autenticação, cadastro de funcionários, permissões, tabelas, Edge Functions, estoque ou comandas.

## Verificações técnicas

| Cenário | Resultado | Evidência |
|---|---|---|
| Remoção de `Carregando Intervalo...` | PASSOU | Ausente em `intervalo/index.html` |
| UI inicial antes de importar JavaScript | PASSOU por inspeção | HTML estático inclui `#intervalo-boot-loader` e CSS crítico inline |
| Encerramento do estado de inicialização após `box()` | PASSOU em simulação | `body.classList.remove('iv-initializing')` é executado após render |
| Erro geral substitui abertura | PASSOU por inspeção | `start().catch` chama `box` |
| Fallback de conexão lenta | PASSOU por inspeção | Em 18s, o HTML inicial mostra aviso e botão de recarregar se ainda existir |
| Carregamento padronizado nos módulos | PASSOU | 9 arquivos de UI possuem o componente `iv-loading-inline` |
| Ausência dos textos antigos nesses arquivos | PASSOU | Busca nas versões atualizadas dos arquivos |
| Sintaxe de JavaScript | PASSOU | Compilação das fontes de 10 módulos (retirando cabeçalho ESM) |
| Recurso visual com movimento reduzido | PASSOU por inspeção CSS | Media query `prefers-reduced-motion:reduce` |
| Cache de módulos | PASSOU | Imports de plataforma, conta, cardápio público e demais módulos em rc.13 |
| Dispositivo real e PWA instalado | PENDENTE | Teste autenticado não realizado neste ambiente |
| Propagação da versão no domínio | NÃO VERIFICADA | O verificador web não conseguiu abrir a URL pública |
| Comportamento com rede lenta no navegador real | PENDENTE | Apenas inspeção de fallback e simulação de DOM disponíveis |

## Testes manuais sugeridos
1. Abra `https://gaveblue.com.br/intervalo/` em nova aba e observe a abertura sem o texto antigo.
2. Acesse o Garçom PWA instalado e a Gestão em `/novo-mundo/gestao`. A abertura global deve ser substituída pelo skeleton específico da Gestão quando a tela carregar.
3. Troque entre Mesas, Cardápio, Cozinha, Caixa, Minha Conta e painel administrativo, confirmando ausência dos textos antigos soltos.
4. Confira que telas com erro exibem mensagem em vez de carregar indefinidamente.
5. Simule conexão lenta ou bloqueio da biblioteca externa; após 18 segundos deve aparecer **Tentar novamente** se a inicialização ainda não tiver ocorrido.
6. Verifique a opção de acessibilidade **Reduzir movimento** e que os skeletons deixam de animar.
7. Reabra o PWA para atualizar o HTML e módulos em cache.

**Conclusão:** QA técnico e estático passou, homologação real pendente. Nenhuma publicação automática foi usada. Não confundir commit na `main` com verificação de propagação no domínio.
