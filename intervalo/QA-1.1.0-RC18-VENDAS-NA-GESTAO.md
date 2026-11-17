# Intervalo · QA 1.1.0-rc.18 — Vendas Online integradas à Gestão
Data: 2026-11-16

## Problema
A rota /intervalo/{restaurante}/vendas-online abria uma área completa e independente da Gestão, com cabeçalho, carregador, navegação e layout próprios. A experiência parecia outro aplicativo e exigia sair da Gestão para ajustar vitrine, entregas, pagamentos e pedidos.

## Solução implementada
- Gestão agora possui aba **Vendas** com ícone Bag, tanto no menu lateral como na barra inferior do celular.
- Na Visão geral, há cartão resumido com contagem de pedidos aguardando aceite e em andamento, lida de `marketplace-operations` (`overview`), com botão **Abrir vendas**.
- A rota `/intervalo/{restaurante}/gestao?tab=vendas` renderiza os recursos atuais da Loja Online **dentro do shell da Gestão**, sem outro cabeçalho ou outra navegação.
- Seções de Vendas: **Pedidos**, **Entregas**, **Vitrine** e **Pagamentos**, com seletor compacto e conteúdo segmentado, sem uma página longa com todos os cartões empilhados. A subseção pode ser aberta via `?area=pedidos|entregas|vitrine|pagamentos`.
- Pedidos: status de vendas, lista de pedidos, aceite, transições e registrar pagamento (mantendo validações do servidor).
- Entregas: regiões, CEPs, taxas e horários atuais.
- Vitrine: marca, descrição, categorias e exibição no marketplace.
- Pagamentos: abertura de recebimento, Pix direto e InfinitePay, com restrição Master preservada.
- A antiga URL `/intervalo/{restaurante}/vendas-online` redireciona para `/intervalo/{restaurante}/gestao?tab=vendas`, após passar pelas checagens de acesso. Links externos e favoritos continuam úteis.
- APIs, tabelas, transações, pedidos e controles de permissão **não foram alterados**. O cardápio público e as experiências de compra dos consumidores continuam independentes da Gestão.

## Arquivos revisados
- `intervalo/management.js`: navegação, cartão Vendas, roteamento interno, lazy import da Loja Online.
- `intervalo/online-management-rc1.js`: modo `embedded`, título contextual e quatro seções.
- `intervalo/management-design-rc11.css` e `intervalo/online-management-rc1.css`: estilos integrados no tema branco/laranja sem novas barras fixas.
- `intervalo/index.html`: versão do módulo Gestão e redirecionamento da rota antiga.

## Testes técnicos
- Sintaxe do `management.js`, `online-management-rc1.js` e entrypoint principal `index.html`: OK.
- Verificações estáticas: menu Vendas desktop/mobile, rota antiga, import lazy, quatro seções, funções Pix/InfinitePay, APIs de pedidos, versionamento CSS e respeito às permissões: OK.
- Não houve alterações de banco ou deploy de Edge Functions nesta versão; os pedidos e pagamentos continuam na estrutura existente.

## Pendências antes da homologação
- Conferir que `gaveblue.com.br` atualizou para rc.18 (GitHub não confirma propagação no domínio).
- Testar com Master/gerente em Android: Gestão → Vendas → Pedidos/Entregas/Vitrine/Pagamentos → voltar à Visão geral sem perder o menu e a barra inferior.
- Testar edição em Bottom Sheet (horários, região, vitrine, pagamentos), retorno do teclado, validações e carregamentos.
- Testar pedidos reais: aceitar, preparar na Cozinha e registrar pagamento apenas após conferência externa. Não criar pedidos de teste de cobrança real sem controle.
- Verificar que o link antigo redireciona e que a loja pública continua disponível.

Status: **implementação concluída no repositório e QA técnico parcial aprovado; homologação visual Android pendente**.
