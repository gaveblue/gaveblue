# GB+ 2.5.0 — Protocolo de homologação

**Estado durante a preparação da build 8:** build 7 pública somente leitura; build 8 contém conciliação assistida com confirmação dupla, testada em Node real e por transação SQL fictícia revertida, aguardando merge/deploy. A homologação integral em Android/iPhone e o workflow CI verde ainda não foram comprovados.

**Evidências de fechamento do núcleo:** [HOMOLOGACAO-2.5.0-RELATORIO-B8.md](./HOMOLOGACAO-2.5.0-RELATORIO-B8.md).

**Decisão de escopo:** as fases complementares de mapeamento CSV manual, XLSX e PDF não foram cumpridas e ficam registradas para versão posterior. A build 8 entrega OFX/CSV assistidos; não chamar as outras fases de concluídas. Responsável pela homologação integral: **não registrado**. Data de aprovação integral: **não registrada**.

## Evidências mais recentes da compilação 7

Consultar o relatório verificável em [HOMOLOGACAO-2.5.0-RELATORIO-B7.md](./HOMOLOGACAO-2.5.0-RELATORIO-B7.md).

- **10/10 suítes aprovadas em Node 22.16.0 real**, a partir do pacote GitHub Pages publicado da build 6 com as alterações do ramo 7 aplicadas e conferidas por hash Git. Esta é uma evidência melhor que as simulações anteriores.
- Chromium headless renderizou o componente de prévia com 360 px (claro), 390 px (escuro) e 1200 px, sem rolagem horizontal nem controles de gravação. **Não foi um teste do PWA integral**: a navegação do navegador foi bloqueada pelo ambiente.
- Importação OFX com `LEDGERBAL` ou CSV com coluna `Saldo` pode exibir **comparação indicativa** com o saldo GB+ na data declarada, sem alterar o saldo inicial; quando o arquivo não informa saldo, a diferença não é inventada.
- Estrutura de RLS/Supabase e função de gravação conferidas em **modo somente leitura**. Nenhuma baixa ou título de cliente foi acessado ou modificado.
- O GitHub Actions segue falhando antes de iniciar os testes em `push`, `pull_request`, `ubuntu-latest` e `ubuntu-24.04`; bloqueio rastreado na [issue #75](https://github.com/gaveblue/gaveblue/issues/75).
- **Evidência adicional da build 8:** circuito financeiro aprovado em 10 suítes Node, teste do caminho SQL de gravação com usuário e documento fictícios revertidos, confirmação de conta para qualquer lote e confirmação adicional de criação com baixa. O fluxo web autenticado real e o PWA instalado **não** foram testados ponta a ponta; GitHub Actions segue bloqueado. Consulte o relatório B8.



## Ambiente e dados permitidos

- Utilizar **conta de teste sem dados reais**, com saldo inicial de **R$ 100,00** e categorias fictícias `Recebimentos` e `Tarifas`. Não executar no financeiro pessoal do responsável ou de clientes.
- Arquivos fictícios disponíveis em `tests/fixtures/extrato-homologacao-250.csv` e `tests/fixtures/extrato-homologacao-250.ofx`. **Use apenas um deles para a criação**, pois os dois representam os mesmos movimentos/IDs.
- Abrir a futura prévia da build 7 quando houver ambiente de homologação disponível; uma ramificação/PR **não disponibiliza automaticamente uma página executável**.
- Fazer um backup antes da operação de gravação e documentar revisão, dispositivo e capturas de tela. Não incluir CPF, identificadores bancários ou dados pessoais nas evidências.

## Cenário reproduzível

O arquivo contém duas transações em 06/11/2026 (data de teste; para testes em outra data, gerar um arquivo equivalente com data passada, nunca futura).

| Movimento fictício | Natureza | Valor |
| --- | --- | ---: |
| HOMOLOGACAO PIX RECEBIDO | Receita | R$ 50,00 |
| HOMOLOGACAO TARIFA BANCARIA | Despesa | R$ 12,50 |
| **Impacto líquido** | | **+ R$ 37,50** |

**Saldo esperado antes da importação:** R$ 100,00.  
**Saldo esperado após a aprovação dos dois lançamentos:** **R$ 137,50**.  
**Saldo esperado após a reversão integral do lote intacto:** R$ 100,00.

### Critérios obrigatórios

- [ ] **01. Extensões:** OFX/CSV legítimos são aceitos; `.csv.exe`, PDF, vazio e arquivo acima de 8 MB são rejeitados.
- [ ] **02. Codificação:** o cabeçalho com acento `Descrição` é reconhecido em UTF-8 e Windows-1252.
- [ ] **03. Conta:** o sistema exige conta financeira ativa; trocar a conta limpa decisões e reavalia correspondências.
- [ ] **04. Prévia:** crédito de 50,00 e débito de 12,50 têm sinais, data e quantidades corretos; a leitura não altera saldo.
- [ ] **05. Revisão:** `Criar lançamento baixado` exige categoria compatível com a natureza e descrição. `Sem decisão` não gera movimento.
- [ ] **06. Segurança:** o resumo final mostra os dois lançamentos, impacto `+R$ 37,50`, e exige confirmação independente antes do botão de gravação.
- [ ] **07. Gravação:** após confirmar na conta fictícia, surgem **2 títulos e 2 baixas**, com R$ 137,50 de saldo. Verificar com persistência online (usuario de teste) e modo local.
- [ ] **08. Anti-duplicidade:** reimportar o arquivo não pode criar novas baixas; um título parcial aberto semelhante também bloqueia criação indevida.
- [ ] **09. Reversão e integridade:** reverter lote sem edição restaura R$ 100,00 e mantém histórico; se algum título foi editado, reversão automática falha **sem apagar nada**.
- [ ] **10. Interface e regressões:** verificar Chrome Android (320/360/390/430 px), desktop, tema escuro, focos, modais, rolagem e executar as dez suítes em Node real (concluído na compilação 7) e, separadamente, obter resultados CI verdes e homologar o PWA real.

**Nota:** não marcar o item 10 como aprovado sem resultados visuais e testes de regressão executados. O CI atual falha com `runner_id=0`, `steps=[]` e sem logs de etapas; isso indica que o runner não executou os comandos, **não confirma a causa raiz**.

## Evidências técnicas — compilação 5

**Testes executados em simulação JavaScript:** sete suítes passaram, incluindo a regressão financeira anterior, leitura OFX/CSV, UTF-8/Windows-1252, vínculo e bloqueio de duplicidades, criação de títulos com baixa, retomada de pendências, gravação local com revisão concorrente, backup e estorno. A simulação usou adaptadores para APIs Node, `TextDecoder` e geração de identificadores. **Não é uma execução Node real nem uma homologação em navegador real.**

Foram corrigidos defeitos encontrados nos próprios testes:
- O botão `Revisar decisões` ficava desabilitado quando o único movimento selecionado era `Criar lançamento baixado`.
- A decisão `Manter pendente` bloqueava a conclusão futura; agora a reimportação pode retomar o movimento, com vínculo auditável entre lotes e reversão encadeada.
- A validação de extensão rejeitava OFX/CSV reais; corrigida na compilação 4.
- Regressões permanentes incluem agora `bank-reconciliation-pending-regression.mjs` e `bank-reconciliation-storage-regression.mjs` (além das outras cinco).

**Último CI tentado:** [run #42263995585](https://github.com/gaveblue/gaveblue/actions/runs/42263995585), duas tentativas com `failure` sem nenhuma etapa executada (`steps=[]`). **O bloqueio depende do ambiente do GitHub Actions e a causa específica ainda não foi obtida.**

### Ações que exigem ambiente de homologação

1. **GitHub Actions:** alguém com acesso às configurações do repositório deve consultar as anotações da execução e as páginas `Settings → Actions → General` e `Settings → Billing`. Confirmar se runners, políticas e cobrança permitem a execução. Não supor a causa apenas por `steps=[]`.
2. **Navegador/PWA:** abrir uma cópia de homologação da build 5 e validar upload real no Android, desktop e temas claro/escuro. A ramificação GitHub não é um site de testes por si só.
3. **Conta de teste:** usar somente dados fictícios e verificar saldo inicial de R$ 100,00, saldo de R$ 137,50 após importação, R$ 100,00 após reversão, reimportação sem duplicidade e duas sessões simultâneas.
4. **Aprovação:** gravar links, capturas sem dados sensíveis, revisor e data antes de mesclar/publicar. O rollback de código **não** estorna dados que já foram gravados.

## Falha atual do GitHub Actions

Run de referência: https://github.com/gaveblue/gaveblue/actions/runs/42250189099

1. Na execução, conferir a seção **Annotations/Checks** para identificar o motivo exato da rejeição do job.
2. Verificar permissões de **Settings → Actions → General** e disponibilidade do runner do repositório.
3. Verificar **Settings → Billing & licensing → Budgets and alerts / Actions usage** para possíveis bloqueios de cota ou cobrança; não assumir que seja o motivo sem evidência.
4. Se nenhuma causa aparecer, consultar o suporte do GitHub com os IDs da execução e do job e a informação `steps=[]`.
5. Reexecutar o workflow `GB+ — regressões financeiras`; só registrar a suíte como aprovada quando os comandos Node efetivamente executarem.

## Segurança de liberação e rollback

A build 7 atual é **desenvolvimento**, com `published_at=null`. A versão pública é a **2.4.9, compilação 68**, e não deverá ser modificada sem autorização explícita de publicação.

Se uma versão que crie títulos e baixas for publicada no futuro, **reverter apenas o código não reverte nem apaga lançamentos financeiros já gravados**. A reversão de dados deve ser feita pelo histórico do lote, sob validação de integridade, e com backup e conferência do saldo. Nunca executar `git reset --hard` ou excluir dados de usuários como método de rollback.

## Registro de resultado

| Evidência | Responsável | Data/hora | Resultado |
| --- | --- | --- | --- |
| Testes Node e CI | A preencher | A preencher | Pendente |
| Android e desktop | A preencher | A preencher | Pendente |
| Armazenamento online em conta fictícia | A preencher | A preencher | Pendente |
| Aprovação final | A preencher | A preencher | Pendente |

**Aprovação/homologação não confirmadas.** Registrar explicitamente a decisão e anexar evidências antes de marcar como homologado.
