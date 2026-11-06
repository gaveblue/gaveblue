# GB+ 2.5.0 — Evidências da compilação 7

**Data:** 06/11/2026  
**Ramo:** `feature/gbplus-250-build7-homologacao`  
**Publicação atual:** 2.5.0 build 7 em modo **somente leitura**, com implantação GitHub Pages concluída no [run 42299501899](https://github.com/gaveblue/gaveblue/actions/runs/42299501899). A conciliação com gravação **não foi homologada nem liberada**.  
**Alteração da build 7:** comparação **indicativa**, não transacional, de saldo final declarado por arquivo OFX (`LEDGERBAL/BALAMT/DTASOF`) ou CSV (coluna `Saldo`) com saldo do GB+ na mesma data. Sem saldo declarado, não há comparação; sem data-base do saldo inicial, a divergência não confirma erro contábil.

## Testes reais em Node 22.16.0

**Proveniência dos arquivos:** pacote `github-pages`, artefato **13532694546** da execução [42277197480](https://github.com/gaveblue/gaveblue/actions/runs/42277197480) (publicação 2.5.0 build 6 em 06/11/2026). A extração local continha o aplicativo e seus scripts originais.

Para testar a build 7, os arquivos alterados da cópia foram atualizados com **exatamente o código do ramo de homologação**, e o `git hash-object` local foi comparado ao blob SHA do GitHub:
- `js/bank-import-preview.js` — `38cf6440f1937243965e9825362a2df3f40d1eeb`
- `js/bank-import-ui.js` — `95004ebdea3fc735ef9cb39d21baf14aae10980e`
- `js/app.js` — `8de34152a135abe84774c11ab281c8d049d37e5e`
- `bank-import.css` — `481e56f8c2a92776bc9836590a85582a3cbe3cf1`
- `tests/bank-import-balance-regression.mjs` — `2741ad96ce4431f8d75f29a784936c709681a1ba`
- `tests/bank-import-readonly-release-regression.mjs` — `137227d5f6b2616d657cc73616fa0e61bd7349eb`

**Resultado: 10/10 suítes em Node real, 0 falhas**, incluindo nove scripts disponíveis na publicação (um deles de filtros/visualização) e o novo teste de saldo da build 7:

| Suíte | Status |
| --- | --- |
| `finance-regression.mjs` | Aprovada |
| `flow-visual-regression.mjs` | Aprovada |
| `bank-import-preview-regression.mjs` | Aprovada |
| `bank-import-codec-regression.mjs` | Aprovada |
| `bank-import-readonly-release-regression.mjs` | Aprovada |
| `bank-import-balance-regression.mjs` | Aprovada |
| `bank-reconciliation-regression.mjs` | Aprovada |
| `bank-reconciliation-create-regression.mjs` | Aprovada |
| `bank-reconciliation-pending-regression.mjs` | Aprovada |
| `bank-reconciliation-storage-regression.mjs` | Aprovada |

Os testes de escrita são **unidades/regressões com dados fictícios**, não ensaios de uma sessão Supabase real. A trava `BANK_IMPORT_WRITES_ENABLED=false` continua ativa.

## Renderização real em Chromium (somente componente)

Teste com Chromium headless do HTML gerado por `bankImportMarkup()` usando o CSS do aplicativo, sem autenticação ou backend:
- **360 px / claro:** sem rolagem horizontal (`documentElement.scrollWidth=360`), 2 movimentos exibidos, 0 botões de gravação;
- **390 px / escuro:** sem rolagem horizontal (`scrollWidth=390`), 2 movimentos exibidos, 0 botões de gravação;
- **1200 px / claro:** sem rolagem horizontal (`scrollWidth=1200`), 2 movimentos exibidos, 0 botões de gravação.
- Saldo ilustrativo do banco **R$ 137,50**, saldo do GB+ **R$ 100,00**, diferença **R$ 37,50**. Nenhuma mutação. Os dados exibidos foram inteiramente fictícios.
- Texto de prévia ajustado: não sugere que a criação de lançamentos esteja disponível na build pública.

**Limitação:** o ambiente de automação do navegador bloqueia navegação de rede (`net::ERR_BLOCKED_BY_ADMINISTRATOR`), inclusive `localhost`, portanto este teste avaliou o **componente renderizado** e não um fluxo ponta a ponta de login, upload por seletor de arquivos ou PWA instalado. Essas áreas **não estão homologadas**.

## Supabase — auditoria estrutural somente leitura

Consultas de metadados em projeto já existente, sem selecionar lançamentos, credenciais ou dados pessoais:
- `public.gbplus_documents`: RLS habilitado; política SELECT `gbplus_read_own` para `authenticated` com `auth.uid()=user_id`.
- A função `public.gbplus_save` exige identidade de sessão igual ao `expected_user_id`, valida número de revisão, verifica conflito de gravação, uso de `operation_id`, e realiza a atualização numa transação com `pg_advisory_xact_lock`.
- `anon` não possui EXECUTE; `authenticated` possui EXECUTE.
- **Não foi executada nenhuma gravação em Supabase**. Esses controles estruturais não substituem ensaios com usuários fictícios diferentes.

## Verificação adicional de upload real no Chromium

Foi utilizado o **seletor de arquivos do navegador**, com `File.arrayBuffer()`, `TextDecoder`, `parseBankStatement()`, `proposeReconciliation()` e `bankImportMarkup()` originais, integrados a um contêiner de teste isolado com dados fictícios. Não foi necessário acessar contas reais.

- Em **360 px claro, 390 px escuro e 1200 px claro**, um arquivo CSV foi selecionado no input real, lido e renderizado. A troca entre duas contas recalculou o saldo GB+ da conta selecionada. Nenhuma rolagem horizontal e nenhum botão de gravação.
- O teste identificou ambiguidade de saldo final em CSV: **duas movimentações na mesma data e com saldos diferentes, sem horário**, podem corresponder a qualquer ordem. A build 7 agora **omite a comparação**, explica o motivo e preserva todos os lançamentos.
- Quando há **um único saldo informado na data mais recente**, a comparação indicativa é exibida. Se o saldo só existe em data antiga, a comparação é omitida.
- O teste de regressão `bank-import-balance-regression.mjs` foi ampliado para cobrir as duas ambiguidades; a bateria completa de **10 suítes Node** voltou a passar.
- O upload testado foi no **componente real com controlador de teste** — não incluiu login, Supabase ou instalação completa do PWA. Essa distinção permanece obrigatória na homologação.

## CI do GitHub Actions — problema externo ainda aberto

O workflow de regressões falha **antes de executar passos** em `pull_request` e também em `push`, com `ubuntu-latest` e `ubuntu-24.04`. Evidência: [run 42293673029](https://github.com/gaveblue/gaveblue/actions/runs/42293673029), issue [#75](https://github.com/gaveblue/gaveblue/issues/75).

Isso confirma que o GitHub Actions ainda **não oferece a evidência de CI verde**. A causa raiz exige verificar políticas/runner/cobrança na conta ou suporte GitHub. A execução local em Node é uma evidência independente, não uma substituição silenciosa do CI.

## Gate de homologação

| Gate | Situação |
| --- | --- |
| Testes financeiros reais em Node | **Aprovado** (10/10) |
| Lógica de leitura e comparação de saldos | **Aprovado em Node** |
| Layout do componente em 360/390/1200 px | **Aprovado em Chromium isolado** |
| Trava de gravação financeira | **Mantida e testada** |
| Estrutura de autenticação/RLS | **Revisada somente leitura** |
| Workflow CI verde | **Pendente (issue #75)** |
| Importação fim a fim em Android/iPhone/PWA instalado | **Pendente** |
| Gravação/reversão online com usuários fictícios | **Pendente** |
| Verificação da data-base histórica do saldo inicial | **Pendente** |
| Aprovação funcional com responsável e data | **Pendente** |

**Decisão:** não habilitar a conciliação com escrita nem considerar concluída a homologação integral da 2.5.0 nesta compilação. A compilação 7 está publicada **somente leitura**, com melhorias comprovadas de apresentação e cálculo; a conciliação com gravação não está habilitada.
