# GB+ 3.0.8 — QA de cadastro e movimentação financeira Sankhya

Data: 10/11/2026. Escopo: duas planilhas encaminhadas pelo responsável.

## Estruturas observadas nas planilhas reais
- **Parceiros.xlsx**: linha de cabeçalho 3; 53 colunas e 1.626 cadastros de parceiros (mais a linha de total). **Cód. Parceiro** único nas 1.626 linhas. Campos: razão social, nome fantasia, CPF/CNPJ, ativo, pessoa física/jurídica, inscrição, endereço, cidade/UF, contato, dados tributários e comerciais.
- **Movimentacao_Financeira (1).xlsx**: linha de cabeçalho 3; 24 colunas e 2.123 movimentos (mais total). **Nro Único** sem duplicação dentro desta amostra; todos os códigos de parceiros deste arquivo estão presentes em Parceiros.xlsx.
- Natureza financeira: 1.691 receitas e 432 despesas. O campo **Valor Líquido** tem sinal positivo nas receitas e negativo nas despesas da amostra.
- 355 linhas têm **Data Baixa** e valor de baixa positivo; três dessas datas são futuras para 10/11/2026 e portanto **não entram como baixas realizadas nessa data**.
- Notas fiscais repetidas são comuns: foram identificadas 257 combinações de parceiro + nota com repetição, incluindo grupos de dez vencimentos mensais. Não deduplicar pelo número da nota.
- Entre as linhas com Data Baixa, 52 não informam conta da baixa; o importador exige atribuição manual da conta financeira para esses registros.
- Há CPF/CNPJ iguais em mais de um cadastro com códigos diferentes. Não fundir parceiros por CPF/CNPJ sem conferência; Cód. Parceiro é a chave do vínculo.

## Critérios de implementação
- [x] Cadastro de parceiros por Cód. Parceiro, com metadados e atributos extras preservados.
- [x] Campos de referência Sankhya disponíveis em submenu da edição do parceiro.
- [x] Movimentação ligada a parceiro por código, sem depender da grafia do nome.
- [x] Receita/Despesa validada pelo sinal do Valor Líquido.
- [x] Nro Único + Empresa como chave estável; reimportação repetida não cria títulos duplicados.
- [x] Agrupamento de parcelas por parceiro, NF, negociação, operação, empresa e natureza.
- [x] Atualização de baixa em título previamente importado, sem duplicar principal.
- [x] Mapeamento obrigatório de conta para baixas; data futura não movimenta saldo.
- [x] Revisão e seleção explícita antes de gravação; conflitos bloqueados.
- [x] Testes sintéticos de criação, atualização, agrupamento, reimportação e conflito.
- [ ] Teste navegador Chrome/Edge desktop com ambas as planilhas completas, incluindo 53 colunas.
- [ ] Validar desempenho em 1.626 cadastros + 2.123 lançamentos e limites de armazenamento local.
- [ ] Confirmar resultado financeiro de baixas com juros/descontos em conta de homologação.
- [ ] Validar reversão/backup e sincronização do banco em ambiente de teste.
- [ ] Validar importação diária incremental com partes da mesma série em arquivos distintos.
- [ ] Execução CI/runner com evidência do teste `node gbplus/tests/sankhya-import-308.mjs`.

## Operação recomendada
1. No PC, abrir **Relatórios → Importação Sankhya → Cadastro de parceiros**.
2. Selecionar Parceiros.xlsx, verificar conflitos e confirmar novos cadastros.
3. Abrir **Movimentação financeira** e selecionar Movimentacao_Financeira.xlsx.
4. Selecionar novos títulos. Separadamente selecionar baixas posteriores quando houver; indicar categorias e associar as contas de baixa.
5. Confirmar após revisar os totais. No dia seguinte, repetir com o novo arquivo: Nro Único existente não cria título novo.

**Status:** candidatura 3.0.8 com QA estrutural e sintético; homologação real com arquivo e persistência pendentes. Nenhum dado do arquivo de usuário foi gravado na conta automaticamente.
