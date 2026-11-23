# Intervalo — QA UX/UI e navegação 1.2.0-rc.16
Data: 2026-11-23

## O que mudou
Navegação compartilhada hierárquica; nomenclatura de Pedidos online; seleção de restaurantes com ação primária; abas da Gestão com histórico; quatro KPIs prioritários + indicadores adicionais; contraste de ações e área de toque da navegação.

## Restrições preservadas
Nenhuma alteração de banco de dados, Supabase, RLS, permissões, API, transações, cálculos, comanda, checkout ou impressão. Módulos são filtrados de acordo com as flags e permissões existentes.

## Rotas de referência
- Início => /intervalo/{slug}/gestao
- Pedidos online => /intervalo/{slug}/gestao?tab=vendas&area=pedidos
- Garçom, Cozinha, Caixa => rotas operacionais originais
- Administrar mesas => /intervalo/{slug}/mesas
- Produtos => /intervalo/{slug}/gestao?tab=produtos
- Categorias => /intervalo/{slug}/catalogo?aba=categorias
- Adicionais => /intervalo/{slug}/catalogo?aba=adicionais
- Cardápio digital => /intervalo/{slug}/catalogo?aba=publicacao
- Insumos => /intervalo/{slug}/gestao?tab=estoque
- Fichas técnicas => /intervalo/{slug}/estoque?aba=fichas
- Movimentações => /intervalo/{slug}/estoque?aba=historico
- Vitrine => /intervalo/{slug}/gestao?tab=vendas&area=vitrine
- Entrega e retirada, Horários e Pagamentos => Gestão > Vendas, mesma estrutura de URL
- Relatórios, Dados, Equipe, Permissões e Impressão => rotas existentes

## Evidências de verificação estática
- Sintaxe compilável de global-navigation-rc7.js e management.js.
- Exibição de itens por papel (Master e Garçom), com exclusão de Permissões do Garçom.
- currentMenuId para categorias, adicionais, fichas técnicas, histórico e pagamentos.
- Links antigos do catálogo/estoque preservados e carregamento de CSS e JS com versão nova.
- Gestão com pushState/popstate para Voltar/Avançar; menu móvel com foco e Escape.
- Contraste primário usa fundo #c2410c, texto branco e hover #9a3412.

## Verificações manuais necessárias antes de homologar
1. Android / PWA do Garçom: menu, retorno e grade de mesas com e sem seleção.
2. Gestão Master: menu lateral desktop/celular, Pedidos online, Vitrine, Estoque, Produtos, Dados e Voltar/Avançar.
3. Caixa e Cozinha: abrir menu, navegar e voltar à operação sem perda de dados.
4. Meu restaurante: botão primário e expansão de módulos para Master e funcionário com poucas permissões.
5. Visão geral: indicadores com dados reais, legibilidade em 360, 390, 430 e desktop.
6. Validar atualização do domínio e cache do PWA em dispositivo.
7. Testes funcionais completos de pedidos, pagamento e impressão, embora as regras de negócio não tenham sido alteradas.

Observação: aprovação de testes estáticos e commit na main não demonstram propagação no domínio nem homologação visual ou funcional em dispositivo real.
