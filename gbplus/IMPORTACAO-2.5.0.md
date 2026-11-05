# GB+ 2.5.0 — Projeto de importação e conciliação de extratos

**Decisão proposta:** realizar a importação manual de extratos e planilhas na **2.5.0**. Reservar a **3.0.0** para integração bancária automatizada, novos módulos estruturais ou Open Finance, não para a primeira importação de arquivos.

**Estado em 05/11/2026:** desenho funcional aprovado como preparação técnica; há parser e simulador isolados em `js/bank-import-preview.js`, sem botão de importação, envio de arquivos, mutação do banco nem atualização dos saldos. Nove testes iniciais passaram em ambiente simulado. O recurso **não está liberado** na versão 2.4.6.

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
