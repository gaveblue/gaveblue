# Intervalo — QA 1.0.0-rc.14 · Mesas com Bottom Sheet

**Data:** 15/11/2026 · **repositório:** `gaveblue/gaveblue`, branch `main`

## Escopo implementado

Redesign da tela administrativa **Mesas e salões**, sem alterar tabelas, SQL, Edge Functions, funcionários ou permissões.

- Formulário **Nova mesa** removido da posição fixa no início da página; botão **+ Nova mesa** no cabeçalho da área.
- Lista em cartões compactos e responsivos, com nome, salão, capacidade, estado e ação de editar. Indicadores de total, ativas e inativas.
- Filtros locais **Todas / Ativas / Inativas** sem solicitações extras à API.
- **Bottom Sheet** para criar e editar, com alça de arrastar, botão de fechar, cancelamento, clique no fundo e rolagem interna. Campos Nome, Salão e Capacidade; no modo edição, chave de disponibilidade.
- Validação dentro do formulário (`noValidate=true`): nome 1–45, salão 1–60, capacidade inteira de 1 a 50; erro contextual por campo. Não dispara popup nativo `Preencha este campo`.
- Atualizações mantêm operações existentes do backend `table_create` e `table_update`. Nenhum botão de exclusão foi criado, pois essa operação não foi identificada no fluxo atual.
- Não há foco automático nos campos ao abrir; o foco fica no botão Fechar e o teclado é solicitado somente quando o usuário toca nos inputs.
- Proteção contra toques duplicados ao salvar: botão desabilitado com texto `Salvando...`. Erro do servidor permanece no painel para correção, sem fechar o formulário.
- CSS isolado em `tables-design-rc14.css` e seletor `body.iv-tables`, sem mudanças nas demais telas de `support.js`.

## Evidências de testes

| Caso | Resultado | Evidência |
|---|---|---|
| Sintaxe JavaScript | PASSOU | Código compilável após retirar ESM |
| Lista inicial | PASSOU em DOM simulado | 3 mesas, cards, indicadores, filtros e botão Nova mesa |
| Formulário fixo removido | PASSOU | HTML não contém `newtable` |
| Bottom Sheet abre ao cadastrar | PASSOU | `dialog.showModal()` chamado |
| Sem popup nativo e sem autofocus em texto | PASSOU | `form.noValidate=true` e foco no botão Fechar |
| Campo nome vazio | REJEITADO corretamente | Erro inline e nenhuma chamada `table_create` |
| Cadastro válido | PASSOU | Uma chamada `table_create` com Nome/Salão/Capacidade e `active:true`; 4ª mesa na lista |
| Editar mesa preenche dados existentes | PASSOU | Nome/Capacidade carregados no sheet |
| Desativar mesa no editor | PASSOU | `table_update` chamado com `active:false` |
| Filtro Inativas | PASSOU | 2 mesas inativas exibidas após atualização simulada |
| Preservação da API | PASSOU por inspeção | `restaurant-core` via `call` com as ações atuais |
| Gestos em Android/iOS físico | PENDENTE | Nenhum teste com navegador/dispositivo real |
| Propagação da interface no domínio | NÃO VERIFICADA | Push na `main` não comprova implantação no host |
| Integração real com restaurante autenticado | PENDENTE | QA simulou respostas de API, sem gravar dados reais |

## Arquivos

- `intervalo/support.js` — frontend de Mesas.
- `intervalo/tables-design-rc14.css` — estilos da tela e do Bottom Sheet.
- `intervalo/index.html` — import de `support.js` em Mesas com cache `rc.14`.
- `intervalo/CHANGELOG.md` — registro de versão.
- `intervalo/RELATORIO-PADRAO-VISUAL-RC14.md` — auditoria visual do restante do app por código.

## Checklist em aparelho real

1. Abra `/intervalo/novo-mundo/mesas` e confirme que não há formulário fixo nem aviso nativo.
2. Toque em **+ Nova mesa**: sheet abre fechado no teclado; role/arraste para expandir.
3. Tente cadastrar sem nome, com capacidade 0 e 51. Confira erros dentro do sheet, sem popup do navegador.
4. Cadastre uma mesa de teste e confira na lista.
5. Toque em uma mesa, altere nome/salão/capacidade; desative e reative. Verifique atualização da listagem.
6. Tente desativar uma mesa com comanda aberta para confirmar a regra de negócio do backend, observando a mensagem de erro.
7. Teste os filtros, telas estreitas, teclado aberto e botão Cancelar/Fechar.
8. Reabra o PWA para validar o carregamento `rc.14`.

**Status:** homologação técnica parcial. Código enviado à `main`, sem uso de GitHub Actions. O teste de UI autenticada e a propagação no domínio dependem de validação posterior.
