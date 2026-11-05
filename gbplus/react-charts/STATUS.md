# Status de validação dos gráficos GB+ 2.2.7

Os componentes EasyUI originais e o adaptador de dados estão no branch `feature/gbplus-easyui-charts-227`. **A interface da 2.2.6 em `main` permanece intacta.**

## Bloqueio confirmado (05/11/2026)

GitHub Actions personalizado (ubuntu-latest e ubuntu-slim) concluiu `failure` após segundos, com `runner_id: 0`, `runner_name: ""` e `steps: []`. Workflow mínimo falhou igual. O GitHub Actions de Pages padrão teve execuções bem-sucedidas. A atribuição do executor falhou ANTES de rodar Node, npm, ou verificações do aplicativo.

GitHub Status registrou incidentes Actions/Pages em 04/11/2026, declarados resolvidos. **Não há confirmação** de causa específica: pode ser restrição de conta, faturamento ou problema residual de provisionamento.

## Alternativa sem Actions

O proprietário pode compilar dentro do GitHub Codespaces na própria ramificação, sem instalar nada no computador:

1. Abrir o branch `feature/gbplus-easyui-charts-227` no GitHub.
2. Code → Codespaces → Create codespace on feature/gbplus-easyui-charts-227.
3. No terminal, executar `bash gbplus/react-charts/build-no-actions.sh`.
4. Se os testes forem aprovados, executar os três comandos `git add`, `git commit` e `git push` que o script imprime.
5. Confirmar `gbplus/charts-dist/gb-react-charts.js` e `gbplus/charts-dist/gb-react-charts.css`, testar os gráficos no celular antes de mesclar o PR.

**Não mesclar o PR sem os dois assets compilados:** o atual `version.json` lista esses arquivos, que ainda não existem.

## Diagnóstico de Actions

Verificar: `https://github.com/gaveblue/gaveblue/actions` → falha do workflow → avisos; `https://github.com/settings/billing` para alertas/limites e `https://github.com/gaveblue/gaveblue/settings/actions` para habilitação. Como o repositório é público, runners padrão normalmente são gratuitos; não pressupor problema de cobrança sem mensagem de confirmação.
