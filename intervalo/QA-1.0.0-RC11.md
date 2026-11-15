# Intervalo — QA 1.0.0-rc.11 · Novo visual da Gestão

Data: 15/11/2026 · repositório `gaveblue/gaveblue`, branch `main`.

## Escopo aprovado
Redesign da Gestão do restaurante `novo-mundo`, inspirado na prévia interativa aprovada: branco/laranja, interface mobile-first, menu lateral no PC, menu sobreposto no celular, barra inferior com **Início / Mesas / + / Relatórios / Mais**, módulos compactos em grade, KPIs operacionais reais e painéis de fluxo e estoque. Sem alterar o módulo de funcionários, o contrato dos dados ou o backend.

Arquivos de implementação:
- `intervalo/management.js` (marcações, layout, navegação e visualização da Gestão)
- `intervalo/management-design-rc11.css` (estilos responsivos isolados sob `.mg-v2-shell` e `body.iv-master.iv-management-v2`)
- `intervalo/index.html` (cache-buster `management.js?v=1.0.0-rc.11` e texto da versão)

## Testes realizados

| Teste | Resultado | Evidência |
|---|---|---|
| Sintaxe JavaScript | PASSOU | `new Function` após retirar import/export ESM |
| Primeira renderização da Gestão | PASSOU com backend simulado | `restaurant-team.list`, `restaurant-core.orders` e `stock_list` simulados |
| Indicadores com dados reais do modelo | PASSOU na simulação | Duas comandas ativas, um insumo em alerta, valores resultaram das respostas e não de placeholders |
| Menus de módulos | PASSOU | URLs do estabelecimento `/novo-mundo/<módulo>` e filtros por módulos habilitados |
| Menu mobile | PASSOU na simulação | Botões conectados ao controle de classe `menu-open` |
| Bottom Sheets `+` e `Mais` | PASSOU na simulação | `dialog.showModal()` e opções condicionadas aos módulos habilitados |
| Navegar para Dados do restaurante | PASSOU na simulação | Formulário `restaurant-settings` permanece na tela |
| Navegar para Equipe | PASSOU na simulação | Formulário de funcionário `manual-staff` permanece intacto |
| Navegar para Permissões (Master) | PASSOU na simulação | Controles existentes `data-perm` preservados |
| Gerente sem acesso a Permissões Master | PASSOU | O menu de permissões não é exibido |
| Gerente sem módulo Garçom habilitado | PASSOU | Atalho ao módulo Garçom não é exibido |
| Cache do módulo | PASSOU por inspeção | Import dinâmico aponta para `1.0.0-rc.11` |
| Celular físico e PC em navegador autenticado | PENDENTE | Nenhum navegador com login real nessa sessão |
| Publicação e propagação no domínio | NÃO VERIFICADA | URL pública não acessível pelo verificador |
| Teste visual de CSS em múltiplos aparelhos | PENDENTE | Depende de validação no PWA/desktop |

## Preservações
- Rotinas existentes do `restaurant-team`: `list`, `save_settings`, `create_staff_with_password`, `invite`, `set_role`, `revoke` e `set_access` não foram alteradas.
- Não houve alteração em tabelas, migrações, Edge Functions, CPF, senha, cadastro ou permissões.
- Nenhum indicador falso é marcado como real; falhas de API permanecem identificadas com traço e mensagens de indisponibilidade.
- Nenhum código de GitHub Actions foi executado.

## Roteiro manual
1. Abra `https://gaveblue.com.br/intervalo/novo-mundo/gestao` autenticado e com acesso.
2. Teste a Visão geral e veja se os indicadores batem com comandas e estoque reais.
3. No celular, confira os quatro cards e os módulos, a barra inferior e o menu hambúrguer.
4. Toque no botão laranja `+`, navegue pelas ações liberadas; abra `Mais` e confirme que as opções funcionam.
5. No computador, teste a barra lateral, o nome do restaurante e o ajuste de largura.
6. Abra Dados e confirme que o formulário salva normalmente; entre e saia de Equipe e Permissões sem modificar registros.
7. Teste um usuário não-Master: `Permissões` não deve ser oferecido.
8. Reabra o PWA instalado, verificando se a versão de `management.js` mudou e o CSS novo foi carregado.

**Status:** homologação técnica parcial; a aprovação do protótipo não representa homologação de funcionamento real. Não afirmar publicação no domínio sem evidência.
