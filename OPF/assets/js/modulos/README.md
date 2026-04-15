# Modularizacao planejada do OPF

Este diretorio prepara a proxima etapa da limpeza do frontend.

## Estado atual

- Execucao ativa: `assets/js/app.js`
- Backup preservado: `assets/js/backup/app.backup.workspace-modal.2026-04-12-1.js`
- Arquivos antigos movidos: `assets/js/inutilizados/`

## Ordem segura para extracao

1. `state.js`
Estado global, chaves de storage e catalogo de modulos.

2. `storage-search-utils.js`
Persistencia, busca global e utilitarios puros.

3. `documentos.js`
Filtros, selecao multipla, ordenacao e render da tabela de OPFs.

4. `cadastros-relatorios.js`
Cadastros auxiliares e relatorios.

5. `formulario-opf.js`
Formulario, itens, resumo e coleta dos dados da OPF.

6. `pagamentos.js`
PIX, validacoes, mascaras e detalhes de pagamento.

7. `configuracoes.js`
Tema, identidade visual e personalizacao da OPF.

8. `workspace-preview.js`
Workspace modal, preview e impressao.

9. `events.js`
Bindings de eventos e bootstrap final.

## Regra de migracao

Cada extracao deve acontecer em um bloco pequeno, mantendo a aplicacao executando a cada passo.
