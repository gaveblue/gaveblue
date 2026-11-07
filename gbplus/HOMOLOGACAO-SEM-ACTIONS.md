# Homologação do GB+ sem GitHub Actions

Este projeto usa **Node.js 22** para verificar os testes já existentes em `gbplus/tests/`, sem GitHub Actions, sem pacotes npm e sem acesso a contas financeiras reais.

## Executar

1. Abra o repositório `gaveblue/gaveblue` e baixe o código pelo botão **Code → Download ZIP**, ou utilize uma cópia local atualizada do Git.
2. Extraia o ZIP e instale o Node.js 22, se necessário.
3. Abra o terminal na **pasta principal do repositório**, aquela que contém `gbplus/`.
4. Execute:

```sh
node gbplus/scripts/homologar-local.mjs
```

O comando executa **todos os arquivos de teste `.mjs` presentes em `gbplus/tests/`**, um por vez, sem realizar lançamentos financeiros reais. Qualquer falha faz o comando terminar com código diferente de zero.

O relatório em JSON será salvo automaticamente em `gbplus/homologacao-local/relatorios/`. Os relatórios são ignorados pelo Git para evitar publicação acidental; guarde o arquivo como evidência e registre a versão/commit na PR. Se o projeto foi obtido por ZIP, o identificador do commit deve ser registrado separadamente.

## Conferência manual obrigatória antes de publicar

- **Login e permissões:** login do usuário, acesso autorizado ao painel administrativo, recusa do acesso com conta comum. Testar em ambiente seguro sem mexer em usuários reais.
- **Novo lançamento:** receita/despesa, três etapas, categorias e serviços, vencimento, parcelamento e opção de dias úteis, sem criar lançamentos reais desnecessários.
- **Baixa e saldos:** com dados fictícios, conferir conta, pagamento, caixa e ausência de duplicidade.
- **Android/PWA:** abertura, atualização, formulários sem rolagem desnecessária, Bottom Sheets, armazenamento de preferências após fechar/reabrir e comportamento offline quando aplicável.
- **Controle de versão:** registrar a alteração e a compilação no `CHANGELOG.md`, com evidências dos testes, pendências e aprovação explícita.

**Importante:** teste automatizado aprovado não substitui teste real em navegador/celular. Falha ou ausência de execução permanece **PENDENTE**, nunca `homologado`. Não incorporar a PR nem publicar sem a revisão e aprovação das etapas adequadas.

## Retorno ao GitHub Actions

O workflow específico das regressões do GB+ foi retirado da PR #92 para não depender da conta bloqueada. O histórico continua no Git e pode ser restaurado numa PR futura, se houver interesse. A implantação do site pelo GitHub Pages é um processo distinto e não foi alterada.
