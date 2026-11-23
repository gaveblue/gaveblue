# Intervalo — QA de polimento visual RC17
Data: 2026-11-23

## Motivação
Feedback do responsável: a reorganização da RC16 deixou a interface "bem crua". A RC17 preserva a nova arquitetura de navegação e melhora sua composição, acabamento e consistência.

## Escopo efetivamente alterado
- Navegação compartilhada: wordmark, contexto do restaurante, grupos com ícones e descrições, seleção ativa, rodapé da conta e drawer mobile.
- Gestão: cabeçalho, seletor de restaurante, atalhos operacionais, dashboard com KPI hierarquizado, cartões com melhor espaçamento e alvos de toque.
- Meus restaurantes: status e função contextualizados, CTA prioritário, demais módulos recolhíveis.
- Referências de assets versionadas RC17 nos módulos operacionais e index para reduzir risco de cache misto.

## Validações estáticas executadas
- global-navigation-rc7.js, management.js, waiter.js, cash.js, kitchen.js, support.js e catalog.js: parse de JavaScript OK.
- index.html: parse de 8 scripts inline OK (imports ESM desconsiderados no parse isolado).
- global-navigation-rc7.css, management-design-rc11.css e visual-unified-rc15.css: chaves CSS equilibradas.
- Sidebar Master e Garçom: marcação gerada, seção ativa expandida e itens sujeitos à permissão; Garçom não vê opções de Gestão.
- Seções ativas por URL: pagamentos, adicionais e movimentações compatíveis.
- Roteamento Voltar/Avançar e ação primária de escolha de restaurante preservados.

## Ainda precisa de validação visual em dispositivo
- Abrir /intervalo/inicio com 1+ restaurantes e perfis diferentes; conferir cartões e CTAs.
- Abrir Gestão em 360/390/430 px e desktop; conferir largura, quebras, rolagem, overlay, cabeçalho, cartões e submenus.
- Repetir abertura do menu em Garçom, Cozinha, Caixa, Estoque e Cardápio.
- Conferir versão entregue pelo domínio em janela sem cache e PWA instalado; o commit na main não demonstra publicação efetiva no site.
- Validar contraste real, teclado, navegação por foco e retorno às telas anteriores.
- Conferir um fluxo com dados reais de teste antes de homologação final.

## Impactos excluídos
Não foram alterados backend, banco de dados, políticas de segurança, autenticação, permissões, cálculo financeiro, pedidos, checkout, Pix ou impressão.

Status: **código publicado no repositório / QA estrutural concluído / homologação visual real pendente**.
