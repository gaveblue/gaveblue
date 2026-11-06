# GB+ 2.5.0 — Protocolo de homologação

**Estado atual:** builds 1–4 no PR #73, ainda não publicados. Responsável pela homologação: **não registrado**. Data de aprovação: **não registrada**.

## Ambiente e dados permitidos

- Utilizar **conta de teste sem dados reais**, com saldo inicial de **R$ 100,00** e categorias fictícias `Recebimentos` e `Tarifas`. Não executar no financeiro pessoal do responsável ou de clientes.
- Arquivos fictícios disponíveis em `tests/fixtures/extrato-homologacao-250.csv` e `tests/fixtures/extrato-homologacao-250.ofx`. **Use apenas um deles para a criação**, pois os dois representam os mesmos movimentos/IDs.
- Abrir a futura prévia da build 4 quando houver ambiente de homologação disponível; uma ramificação/PR **não disponibiliza automaticamente uma página executável**.
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
- [ ] **10. Interface e regressões:** verificar Chrome Android (320/360/390/430 px), desktop, tema escuro, focos, modais, rolagem e executar todas as suítes em Node real com resultados verdes.

**Nota:** não marcar o item 10 como aprovado sem resultados visuais e testes de regressão executados. O CI atual falha com `runner_id=0`, `steps=[]` e sem logs de etapas; isso indica que o runner não executou os comandos, **não confirma a causa raiz**.

## Falha atual do GitHub Actions

Run de referência: https://github.com/gaveblue/gaveblue/actions/runs/42250189099

1. Na execução, conferir a seção **Annotations/Checks** para identificar o motivo exato da rejeição do job.
2. Verificar permissões de **Settings → Actions → General** e disponibilidade do runner do repositório.
3. Verificar **Settings → Billing & licensing → Budgets and alerts / Actions usage** para possíveis bloqueios de cota ou cobrança; não assumir que seja o motivo sem evidência.
4. Se nenhuma causa aparecer, consultar o suporte do GitHub com os IDs da execução e do job e a informação `steps=[]`.
5. Reexecutar o workflow `GB+ — regressões financeiras`; só registrar a suíte como aprovada quando os comandos Node efetivamente executarem.

## Segurança de liberação e rollback

A build 4 atual é **desenvolvimento**, com `published_at=null`. A versão pública é a **2.4.9, compilação 68**, e não deverá ser modificada sem autorização explícita de publicação.

Se uma versão que crie títulos e baixas for publicada no futuro, **reverter apenas o código não reverte nem apaga lançamentos financeiros já gravados**. A reversão de dados deve ser feita pelo histórico do lote, sob validação de integridade, e com backup e conferência do saldo. Nunca executar `git reset --hard` ou excluir dados de usuários como método de rollback.

## Registro de resultado

| Evidência | Responsável | Data/hora | Resultado |
| --- | --- | --- | --- |
| Testes Node e CI | A preencher | A preencher | Pendente |
| Android e desktop | A preencher | A preencher | Pendente |
| Armazenamento online em conta fictícia | A preencher | A preencher | Pendente |
| Aprovação final | A preencher | A preencher | Pendente |

**Aprovação/homologação não confirmadas.** Registrar explicitamente a decisão e anexar evidências antes de marcar como homologado.
