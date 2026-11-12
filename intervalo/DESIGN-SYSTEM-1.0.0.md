# Intervalo — Design System 1.0.0 (candidata RC.1)

**Padrão visual aprovado pelo proprietário:** minimalismo, branco e laranja, símbolos SVG no lugar de emojis, dashboards com hierarquia visual clara. Referências: mockups aprovados na conversa de 12/11/2026.

## Identidade visual

- **Cor principal:** laranja `#FF7600`; alternativa forte `#ED6100`.
- **Fundo geral:** `#F7F8FB`; cartões brancos `#FFFFFF`; texto carvão `#101827`.
- **Linhas:** `#E9EDF3`; cantos de cartões em torno de `16px`; sombra discreta.
- **Sem emojis** em controles, navegação, atalhos ou imagens substitutas. Todos os pictogramas são SVG locais de `ui-icons.js`, com traço consistente, `aria-hidden` para símbolos decorativos e textos acessíveis nos botões.
- **Tipografia:** Inter, com alternativas seguras do sistema; títulos fortes, labels diretas, números operacionais legíveis.
- **Feedback:** verde apenas em sucesso e pronto; vermelho apenas em erro, atraso ou perigo; laranja para ações primárias, seleção e atenção.
- **Componentes:** `design-system.css` controla `iv-shell`, `iv-sidebar`, `iv-stats`, `iv-card-grid`, `iv-header`, `iv-btn`, `iv-chip`, formulários, estados de foco e responsividade.

## Estrutura das principais telas

| Perfil | Organização visual | Fonte dos dados |
|---|---|---|
| Super Admin | Menu lateral, 4 KPIs reais (restaurantes, ativos, usuários vinculados, módulos habilitados), busca e cartões recolhíveis | `platform-control.list` |
| Master | Sidebar, resumo operacional (comandas em andamento, mesas em uso, equipe ativa e estoque baixo), atalhos, abas Dados/Equipe/Permissões | `restaurant-team.list` e consultas opcionais autorizadas a `restaurant-core` |
| Cozinha KDS | Três colunas: Novos pedidos, Em preparo, Prontos; observações e botões grandes; impressão manual | `restaurant-core.orders`, `order_progress` |
| Caixa POS | Três painéis: fila de pagamento, comanda selecionada e recebimento manual; sessão e quitadas | `orders`, `cash_summary`, `pay_manual`, `cash_open`, `cash_close` |
| Garçom | Desktop: mesas, cardápio e comanda; mobile: navegação por três áreas com atalho fixo da comanda | `tables`, `catalog`, `orders`, operações autorizadas |
| Cardápio digital | Cabeçalho do restaurante, busca, categorias, fotos com ícone SVG como fallback, preço; sem checkout | `public-menu` somente publicado |
| Catálogo / Estoque / Mesas / Relatórios / Minha Conta | Títulos e botões padronizados, mesmos tokens, grades responsivas e ações existentes preservadas | APIs já existentes |

**Regra de desenho:** não mostrar dados fictícios como reais, percentuais inventados, notificações de conexão não verificadas ou botões que prometem operações inexistentes.

## Cuidados operacionais

- Fichas técnicas e estoque seguem baixa transacional do banco já implantada; nenhuma alteração de regra SQL nesta etapa de redesign.
- Caixa continua registrando dinheiro, Pix e cartão **recebidos externamente**. O usuário informa cada recebimento e o backend valida as regras; não há gateway automático.
- Cozinha usa consulta de 15 s; Garçom de 10 s em aba visível, sem prometer WebSocket.
- Contas, permissões, senha provisória, cadastro de restaurantes, suspensões e controles de módulos seguem regras de backend existentes.
- Cardápio público segue apenas consulta; não gerar pagamento por QR Code sem PSP real.
- Impressão somente manual pelo navegador / salvar PDF. Não há emissor fiscal, SMTP ou necessidade de impressora física para 1.0.0.
- Acessibilidade: foco visível, contraste, links e labels em botões, possibilidade de reduzir animação, tamanho de toque no mobile.

## Planejamento da entrega

**1.0.0-rc.1:** HTML, CSS, biblioteca SVG e telas de Super Admin, Master, Cozinha, Caixa, Garçom, Cardápio, Estoque, Mesas, Relatórios e Minha Conta padronizados. Testes de sintaxe e renderização simulada, sem e-mail/fiscal/hardware.

**Gate 1.0.0 final:** homologação em navegador e PWA real de cada perfil, responsividade e fluxo completo de pedido, baixa, cozinha, atendimento e recebimento; isolamento de restaurantes e permissões. Não usar GitHub Actions. A publicação efetiva no domínio não deve ser presumida a partir de commit na main.

**Arquivos principais:** `index.html`, `design-system.css`, `ui-icons.js`, `platform.js`, `management.js`, `kitchen.js`, `cash.js`, `waiter.js`, `catalog.js`, `public-menu.js`, `support.js`, `account.js`.

