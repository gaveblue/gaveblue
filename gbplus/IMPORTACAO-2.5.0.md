# GB+ 2.5.0 — Projeto de importação e conciliação de extratos

**Situação em 06/11/2026:** o núcleo OFX/CSV foi publicado na **compilação 8**, com conciliação assistida, criação mediante confirmação dupla, trilha de auditoria e reversão de lotes intactos. Testes Node reais e teste SQL transacional fictício foram aprovados; CI GitHub Actions e PWA autenticado real permanecem com ressalvas. **O mapeamento manual de CSV foi entregue na build 9**, com prévia, validação e confirmação financeira separada. **XLSX, PDF e data-base histórica** ainda não estão entregues: acompanhar [issue #78](https://github.com/gaveblue/gaveblue/issues/78). O restante deste arquivo preserva o escopo e histórico originalmente acordados.

**Decisão proposta:** realizar a importação manual de extratos e planilhas na **2.5.0**. Reservar a **3.0.0** para a grande evolução da **IA do GB+**. A integração bancária automatizada via Open Finance é um projeto separado e não integra este escopo.

**Base da 2.4.9:** o GB+ já apresenta saldo por conta e extrato diário (abertura, créditos, débitos e fechamento), calculado apenas a partir de baixas e transferências existentes. A 2.5.0 conectará movimentos importados a essa visualização sem confundir saldo bancário informado com saldo sistêmico. O esquema atual não guarda a data-base do saldo inicial; isso precisa ser tratado explicitamente antes de comparar históricos.

**Estado em 05/11/2026:** o parser/simulador isolado está em `js/bank-import-preview.js`. Na **2.4.8**, o GB+ AI ganhou um botão de anexo no chat: OFX e CSV geram apenas resumo de leitura local, sem selecionar conta nem conciliar; Excel e PDF apenas mostram que a leitura está pendente. **Nenhum arquivo pode criar títulos, baixar contas ou alterar saldos nesta etapa.** A conciliação e a gravação controlada continuam reservadas à 2.5.0.

## Implementação iniciada em 06/11/2026 — compilação 1

A primeira interface read-only está na ramificação `feature/gbplus-250-importacao-previa`, acessível em **Contas bancárias → Importar extrato** e **Movimentações da conta → Importar extrato**. Seleciona OFX/CSV, lê localmente, apresenta totais, prováveis correspondências, ambiguidades e não localizados, com paginação e filtros. **Não grava conciliações, títulos, baixas, dados no Supabase ou arquivo bruto**. A homologação da UI e de arquivos bancários reais continua pendente.

## Continuação em 06/11/2026 — compilação 2

A segunda compilação, no mesmo ramo de desenvolvimento, acrescenta revisão individual por movimento e confirmação final. Ações disponíveis: `conciliar` com baixa ou transferência existente, `ignorar` e `manter pendente`. **Sem decisão** não grava nada. O registro confirmado é armazenado como metadado por usuário, conta e lote em `bankImportBatches`, dentro de `gbplus_documents`, usando a gravação já existente com revisão concorrente.

- Não há inserção de títulos, baixas, transferências nem ajustes de saldo; o histórico dos vínculos é uma camada de referência.
- Um mesmo pagamento/transferência não pode ser vinculado duas vezes para a mesma conta; reimportações de chaves de movimento já confirmadas são bloqueadas.
- Reverter um lote marca seu histórico como revertido; não remove títulos nem estorna pagamentos. Um pagamento estornado pela rotina financeira original não é impedido pelo histórico.
- A função atual `gbplus_save` foi consultada **somente leitura**: verifica `auth.uid()` e a revisão esperada antes da substituição atômica do documento do usuário. A política de leitura de `gbplus_documents` limita o SELECT ao próprio `user_id`. Não houve DDL ou atualização dos dados reais.
- O arquivo original segue sem armazenamento ou envio à IA. Apenas metadados normalizados dos movimentos efetivamente aprovados são salvos no documento do usuário (incluindo descrição resumida e identificador externo).
- A criação de lançamentos ausentes, eventual tabela dedicada de auditoria e comparação de saldos históricos continuam etapas futuras; não antecipar essas operações sem testes e critérios de aceitação.
- Homologação em dispositivo real e testes de concorrência persistem pendentes. O build 2 ainda não foi publicado.

## Continuação em 06/11/2026 — compilação 3

A compilação 3 permite selecionar a decisão **Criar lançamento baixado** para um movimento importado ainda não localizado, com categoria e descrição obrigatórias. A confirmação do lote exibe o impacto no saldo e exige concordância expressa. O GB+ grava **um título único e a respectiva baixa** na conta indicada, na data do movimento e pelo valor exato em centavos. É diferente de simplesmente vincular uma baixa existente: a criação altera o saldo.

Restrições: somente movimentações não localizadas, sem duplicidade no arquivo nem título aberto semelhante; data de baixa não futura; categoria do mesmo tipo do lançamento; limite de 50 criações por lote. O resumo final e a caixa de confirmação são obrigatórios. Os arquivos brutos continuam locais; apenas os metadados aprovados ficam persistidos no documento do próprio usuário. A gravação é transacional pelo adaptador financeiro de revisão existente; nenhuma mudança de tabela SQL foi feita.

A reversão do lote pode excluir exclusivamente os títulos e as baixas **criados por ele**, se permanecerem intactos e não tiverem vínculos posteriores; o histórico continua auditável. Se o usuário editar algum lançamento após a criação, o sistema recusa a reversão automática para evitar perdas e requer revisão manual.

**Estado:** código da compilação 3 implementado no PR #73; verificações lógicas simuladas concluídas, mas testes reais em PWA, arquivos de bancos e integração com armazenamento online continuam pendentes. **Não confundir implementação com homologação ou publicação**.

## Complemento final de CSV — build 9

O banco pode exportar CSV com nomes de colunas fora do padrão. O usuário agora pode mapear a coluna de data, histórico, valor único **ou** colunas separadas de crédito/débito, tipo, identificador e saldo. A prévia usa os dados mapeados e não cria lançamentos automaticamente. É possível corrigir o mapeamento antes da confirmação. **11/11 suítes Node reais aprovadas no artefato publicado.**

Os formatos XLSX/PDF, campo de data-base do saldo inicial e homologação completa do PWA e GitHub Actions são acompanhados separadamente no backlog; não foram automaticamente considerados concluídos pela publicação.

## Objetivo

Conciliar o movimento registrado nos bancos com as baixas, títulos e transferências já existentes no GB+, exibindo diferenças de forma auditável. Uma importação jamais deve presumir que todo débito é uma nova despesa nem que toda entrada é receita.

## Experiência do usuário

1. O usuário acessa **Contas bancárias → [uma conta] → Importar extrato**. Só esta conta receberá a importação; o banco selecionado ajuda a reconhecer o formato, mas não autoriza acesso à conta externa.
2. Escolhe o arquivo **OFX ou CSV** (primeira etapa). A mesma infraestrutura será adaptada para **XLSX**, inclusive para planilhas de receitas e despesas. Arquivos são lidos localmente.
3. Aparece uma **prévia antes de salvar** com data, histórico, valor de crédito/débito, identificador do banco quando disponível, conta de destino e possíveis correspondências.
4. O sistema propõe vínculos com **baixas e transferências existentes** usando direção do valor, centavos, conta, janela de datas e identificador do banco. Valores e datas iguais produzem **sugestões**, nunca conciliação automática. Se houver múltiplos candidatos, o item vira **ambíguo**.
5. O usuário pode escolher, **por movimento**, uma das ações:
   - **Conciliar** com uma baixa ou transferência já existente (sem criar novo lançamento).
   - **Criar lançamento** com conferência de categoria, parceiro, data, valor, vencimento e estado; criar baixa somente com confirmação específica e conta correspondente.
   - **Manter pendente**, sem vínculo por enquanto.
   - **Ignorar**, com motivo opcional e mantendo histórico.
6. Aparece um resumo: **conciliados, prováveis, não localizados, duplicados, ignorados**, e diferença entre saldos bancário e sistêmico na mesma data. O sistema não altera o saldo inicial automaticamente.
7. A confirmação final apresenta o número de vínculos e novos lançamentos antes de gravar. Em operações em lote, devem existir auditoria, possibilidade de desfazer a ação autorizada e segurança contra reimportações.

## Formatos

- **OFX**: ler lançamentos `STMTTRN`, `DTPOSTED`, `TRNAMT`, `FITID`, `NAME` e `MEMO`, inclusive variações SGML e XML; identificar conta sem exibir integralmente dados sensíveis.
- **CSV**: reconhecer delimitador, aspas, cabeçalho, data brasileira, vírgula decimal, sinais, crédito/débito separados e identificador. Para bancos com formatos não conhecidos, abrir uma tela de **mapeamento manual de colunas**.
- **XLSX (etapa complementar dentro do projeto 2.5)**: selecionar aba, cabeçalho e mapeamento de data, descrição, valor, tipo, parceiro, categoria, vencimento e status. Importar somente valores de células; não executar fórmulas/macros; limitar tamanho/quantidade.
- **Planilhas de contas a pagar/receber**: importar títulos **em aberto** sem criar baixas; itens marcados como pagos exigem confirmação dos dados da baixa e da conta. Duplicidades devem ser detectadas antes de gravar.

## Regra de ouro: nenhuma duplicidade de caixa

O extrato importado é um **registro de referência**. Não é receita nem despesa por si só. Associá-lo a um título já baixado **não cria outro pagamento**. Uma compra de cartão de crédito vinculada a fatura não pode ser lançada novamente como débito ao conciliar a fatura.

O usuário deve conseguir ver simultaneamente:
- Saldo contábil/sistêmico calculado pelo GB+.
- Saldo apresentado no extrato bancário na data do arquivo (se disponível).
- Diferença de reconciliação e seus movimentos pendentes.

## Segurança, privacidade e sincronização

- O parser local da preparação atual aceita até **8 MB** e **20.000 movimentos** por arquivo. A interface final deve conferir limites de tamanho, codificação do arquivo e possíveis erros de conteúdo.
- **Sem envio automático de arquivos bancários a IA, ferramentas externas ou serviços de análise.** Não coletar senhas, tokens ou credenciais bancárias.
- Persistir apenas movimentos e vínculos aprovados pelo usuário. O arquivo bruto deve permanecer local e descartável, salvo autorização explícita.
- Para um histórico volumoso, preferir uma **tabela dedicada por usuário e por conta com RLS** em vez de aumentar indefinidamente o JSON principal. Planejar índice para banco/conta/`FITID` e hash de importação, sem misturar usuários.
- Conciliações devem usar revisão otimista, transações atômicas quando possível, regras de autorização e registro de autoria/data.
- Ao reimportar, **sinalizar** duplicidade por `FITID` e conteúdo; movimentos realmente idênticos no mesmo dia podem ser legítimos, então o sistema não deve apagá-los sem confirmação.

## Status técnico atual

Arquivo `js/bank-import-preview.js`:
- [x] Parse básico OFX (SGML e XML) e CSV (com delimitador/aspas).
- [x] Datas brasileiras e monetários em centavos (sem arredondamento de `float`).
- [x] Prévia read-only que compara créditos/débitos com baixas e transferências da **conta selecionada**.
- [x] Marcadores de possível vínculo, ambiguidade, duplicidade no arquivo e movimento não identificado.
- [x] Nove testes de cálculo e não mutação.
- [ ] Tela de upload, mapeamento e seleção de banco/conta.
- [ ] Persistência com autorização do usuário, RLS, rastreabilidade e prevenção idempotente de reimportação.
- [ ] Importação XLSX e planilhas de títulos, com prévia e regras por coluna.
- [ ] Conferência do saldo final e relatório de divergências.
- [ ] Homologação em extratos reais de bancos distintos, inclusive Pix, TED, tarifas, estornos, transferências, parcelamentos e contas com centenas de lançamentos.

**Importante:** a presença do parser no repositório não significa que a importação tenha sido habilitada no GB+. A gravação em produção exige implementação e homologação específicas da 2.5.0.

## Plano executivo de implantação da 2.5.0

| Fase | Entrega | Critério de aceite |
|---|---|---|
| 1. Entrada de arquivos | Seleção de conta + OFX/CSV + leitura local e validação | Arquivo inválido não altera dados; nenhum envio automático à IA |
| 2. Normalização | Data, histórico, identificador, crédito/débito, centavos, mapeamento CSV | Conferência de valores, datas e totais com arquivos reais anonimizados |
| 3. Conciliação sugerida | Cruzamento por conta, valor, direção, datas, identificadores; sinalização de ambiguidades | Nenhuma correspondência é aprovada silenciosamente |
| 4. Revisão pelo usuário | Marcar individualmente conciliar, criar, ignorar ou deixar pendente; seleção múltipla | Prévia mostra efeitos no saldo e em títulos antes de gravar |
| 5. Persistência segura | Gravar somente itens aprovados, histórico de lote, isolamento RLS e idempotência | Reimportação e repetição de confirmação não duplicam caixa |
| 6. Extrato comparativo | Mostrar saldo do fim do dia do GB+ versus saldo bancário quando fornecido, e diferença | Não alterar saldo inicial para forçar conciliação |
| 7. Planilhas | XLSX e CSV de receitas/despesas com mapeamento e prévia | Não executar fórmulas ou macros; não criar baixas sem autorização |
| 8. PDF | Leitura textual local quando tecnicamente viável; revisão manual para PDFs digitalizados | Nunca afirmar leitura bem-sucedida se o documento não puder ser interpretado |
| 9. Homologação | Pix, TED, tarifas, estornos, transferências, faturas, pagamentos parciais, múltiplos bancos | Testes em dispositivo real, auditoria, permissões e estorno controlado |

**Prioridade de entrega:** OFX/CSV com conciliação completa primeiro; XLSX/planilhas e PDF somente após o núcleo financeiro estar seguro. Se a qualidade de leitura de PDF não atender aos critérios, o formato deverá ficar em prévia experimental, sem habilitar gravação.

**Exemplo de comportamento:** o usuário importa 30 movimentos. O GB+ identifica 21 possíveis correspondências com baixas já registradas, 3 transferências internas, 4 movimentos não localizados e 2 ambiguidades. O usuário revisa cada grupo e escolhe quais dos quatro movimentos ausentes quer transformar em novos lançamentos. Nenhum dos 30 é lançado automaticamente; conciliar um já baixado não altera o saldo.

**Pendências de decisão:** data-base do saldo inicial, período máximo por lote, regras de feriados/fins de semana para sugestão de correspondência, e modelo de histórico de importação que permita reverter somente os vínculos e lançamentos criados pelo lote.
