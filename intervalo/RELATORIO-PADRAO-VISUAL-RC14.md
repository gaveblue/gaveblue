# Intervalo — Auditoria de telas fora do padrão visual

**Versão de referência:** 1.0.0-rc.14  
**Data:** 15/11/2026  
**Escopo:** aplicativo Intervalo, com foco nas telas de gestão e operação mobile-first. Auditoria realizada por inspeção dos arquivos JavaScript/CSS da branch `main` e pela captura enviada da tela de Mesas. **Não equivale à inspeção visual em navegador real de todas as rotas.**

## Padrão aprovado

Identidade branco/laranja, ícones consistentes de biblioteca, cabeçalhos compactos, cards enxutos, navegação padronizada, formulários contextualizados em Bottom Sheets onde melhoram o uso no celular, erros em linha (em vez de popups nativos) e boas versões para PC e PWA. A parte de funcionários e permissões **não será alterada** enquanto a arquitetura funcional for estruturada.

## Inventário e prioridades

| Área | Arquivo/rota | Situação atual observável no código | Classificação | Prioridade | Próxima melhoria recomendada |
|---|---|---|---|---|---|
| Gestão — Visão geral | `management.js`, `/gestao` | Design aprovado em rc.11, skeleton e carregamento em rc.12 | Alinhada tecnicamente | — | Só ajustes após capturas/teste real |
| Mesas e salões | `support.js`, `/mesas` | Formulário inline substituído por botão e Bottom Sheet na rc.14; cards compactos, filtros e validação contextual | Atualizada na rc.14 | — | Homologar em celular e na API real |
| Garçom | `waiter.js`, `/garcom` | Barra inferior, seleção por mesa, cardápio e Bottom Sheet de produto já implementados | Predominantemente alinhada | Baixa | Refinos de consistência/gestos após teste real |
| Cardápio administrativo / Categorias | `catalog.js`, `/catalogo` | Formulário **Cadastrar categoria** permanece fixo em card; publicação, QR e categorias ocupam blocos grandes `.op-card`; não há Bottom Sheet próprio | Fora do padrão aprovado | **Alta** | Criar categorias/ações de publicação em painéis compactos e Bottom Sheet; reorganizar catálogo |
| Estoque — Insumos | `support.js`, `/estoque?aba=insumos` | **Novo insumo** e **Entrada/perda/ajuste** aparecem como formulários permanentes, gerando rolagem vertical longa | Fora do padrão aprovado | **Alta** | Cards de saldo, ações + Novo insumo e Registrar movimentação em Bottom Sheets |
| Estoque — Produtos | `support.js`, `/estoque?aba=produtos` | Chaves visualmente refinadas e navegação por abas; cadastro de produto ainda usa expansão HTML `details/summary`, com muitos campos | Parcial | Alta | Bottom Sheet de cadastro/edição com etapas e seleção de categoria/foto mais compacta |
| Estoque — Fichas técnicas | `support.js`, `/estoque?aba=fichas` | Formulário de vínculo ingrediente/produto fixo; ingredientes exibidos como parágrafos sequenciais | Fora do padrão aprovado | Alta | Bottom Sheet de vínculo e listagem em grade compacta com agrupamento por produto |
| Estoque — Histórico | `support.js`, `/estoque?aba=historico` | Movimentações exibidas em sequência simples; sem organização mobile detalhada no padrão aprovado | Parcial | Média | Histórico em linhas, filtros por período/tipo e cartões de resumo |
| Caixa | `cash.js`, `/caixa` | Rodadas e recebimentos consolidados já funcionam, mas formulários de abrir/fechar caixa e pagamento continuam inline, com estilos `.c-form` e `.c-card` antigos | Parcial / fora nas ações | **Alta** | Bottom Sheets de abertura/fechamento/recebimento, hierarquia de totais e navegação mobile |
| Cozinha / KDS | `kitchen.js`, `/cozinha` | Tickets por rodada e colunas de status implementados; CSS local ainda define botões verdes (`#0f766e`) e cartões do layout legado | Parcial | Média | Padronizar contraste, botões, tickets mobile e estados sem alterar produção |
| Relatórios operacionais | `support.js`, `/relatorios` | Exibição básica de contagens por status e valores por método em `.x-grid`; não incorpora a hierarquia de indicadores/gráficos/filtragem aprovada | Fora do padrão aprovado | **Alta** | KPIs compactos, filtros por período e gráficos/lists sem alterar regra de apuração |
| Impressão manual | `support.js`, `/impressao` | Página com blocos informativos grandes e links no estilo legado `.x-panel` / `.x-btn`; impressão continua manual | Parcial | Baixa | Cards compactos de ações e instruções; **não** prometer impressão automática |
| Login, recuperação, ativação | `index.html`, `/login` e fluxos de acesso | Usam `.formbox.panel`, campos expostos e validações de formulário tradicionais; não seguem o shell visual da nova Gestão | Fora do padrão atual | Média | Redesign visual separado preservando autenticação, CPF e recuperação como estão |
| Meus restaurantes / seleção após login | `index.html`, `/inicio` | Lista montada com `.item`, `.links`, vários links por restaurante; diferente dos cards enxutos aprovados | Fora do padrão aprovado | **Alta** | Cards de restaurante compactos, ação principal evidente e módulos organizados em submenu |
| Minha Conta | `account.js`, `/minha-conta` | Formulário de vinculação por CPF permanece na tela; layout de perfil anterior, sem reorganização em submenus/Bottom Sheet | Parcial | Média | Agrupar segurança e dados em submenus; não mexer na funcionalidade de CPF |
| Super Admin da plataforma | `platform.js`, `/admin` | Parte dos controles usa diálogos, mas **Novo restaurante** ainda aparece em formulário fixo; layout e botões de administração anteriores | Fora/parcial | Média | Reorganizar cadastro de restaurante e listas, **sem alterar** provisionamento nem funcionários |
| Cardápio público | `public-menu.js`, `/{slug}/cardapio` | Identidade própria para o consumidor; produtos e categorias em outra linguagem visual intencional | Separado por finalidade | Baixa | Revisar mobile, mas **não** forçar a interface de administração ao cliente |
| Equipe e permissões | `management.js`, abas `equipe` / `acessos` | Formulários anteriores preservados deliberadamente após redesign da Gestão | **Congeladas por decisão do projeto** | Fora do escopo | Não modificar sem decisão explícita futura |

## Ordem sugerida de intervenção

1. **rc.15 — Cardápio administrativo e categorias:** evitar formulários permanentes e uniformizar o cadastro de categorias.
2. **rc.16 — Estoque e produtos:** insumos, movimentações, cadastro de produtos e fichas técnicas em ações contextualizadas. Não alterar regras de movimentação.
3. **rc.17 — Caixa:** Bottom Sheets de pagamentos e abertura/fechamento, sem alterar recebimentos manuais ou a segurança financeira.
4. **rc.18 — Relatórios:** indicadores reais e filtros com tratamento de dados indisponíveis, sem criar métricas fictícias.
5. **rc.19 — Seleção de restaurantes e melhorias restantes de login/minha conta, Cozinha e Super Admin:** exclusivamente visual e progressivamente, conforme homologação.

As versões acima são **planejamento proposto**, não tarefas executadas ou publicadas.

## Critérios de aceite por tela

- Mesmo padrão de cores, espaçamento, tipografia e ícones no celular e no computador.
- Ações primárias claras sem exigir rolagem extensa; formulários em Bottom Sheets quando fizer sentido.
- Sem `required` causando popup nativo nos formulários convertidos; erros contextuais e mensagens do backend exibidos sem fechar o sheet em falhas.
- Sem teclado virtual inesperado ao abrir um painel; controles adequados para toque.
- Nenhum botão muda função, permissão, estoque, comanda ou preço apenas por redesenho.
- Teste de autenticação real, dados do restaurante, dispositivo móvel e desktop antes de marcar **homologado**.
- Registro no CHANGELOG e caminho de rollback sem GitHub Actions.

## Ressalva

Esta é uma **auditoria estática de interface**, baseada nos arquivos atuais e na captura apresentada para Mesas. Ela identifica padrões legados e pontos de maior risco visual, mas não comprova defeitos específicos de renderização em todos os dispositivos. A prioridade pode mudar com capturas adicionais.
