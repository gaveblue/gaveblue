# GB+ 3.0.7 — QA e cuidados de importação financeira no PC

Data: 10/11/2026. Cenário de origem: relatório de contas a receber digitalizado, relatório de contas a pagar XLSX e relatório Sicoob de liquidação/baixa.

## Critérios mapeados
- Receber: controle financeiro tem 5 títulos e total R$ 13.687,25. PDF é imagem, demanda OCR e revisão humana ou exportação Excel/CSV.
- Pagar: 52 títulos em XLSX, 4 com situação PAGO, 47 A VENCER e 1 VENCE HOJE. Total de R$ 1.921.587,47.
- Recebidas: Sicoob liquidações 58/68/212/215 totalizam 17 títulos / R$ 52.701,55. Grupo 82 contém 9 baixas administrativas / R$ 38.166,00: NÃO importar como recebimento.
- Não armazenar PDFs/XLSX originais nem carregá-los para servidor na prévia. Bibliotecas para PDF/OCR são carregadas remotamente quando usadas (precisa de internet).
- Não gravar até seleção, categoria válida e confirmação explícita; recebidas/pagas exigem conta ativa; duplicidades exatas ficam bloqueadas.
- Conferir se a origem já está lançada no GB+ antes de criar registros novos. Sistema deve bloquear correspondências por documento, parceiro, vencimento e valor principal.
- Desvios entre totais do banco e linhas lidas devem bloquear a confirmação.

## Verificações
- [x] Colunas dos três relatórios identificadas e semântica de baixas do banco conferida.
- [x] Implementadas prévia, escolha de situação, categoria, conta, detecção de duplicatas e confirmação.
- [x] Sem alterações na rotina de importação de extrato bancário.
- [x] Testes sintéticos de normalização, grupos Sicoob, importação e duplicatas executados em ambiente de análise.
- [ ] Teste real do PDF Sicoob no Chrome/Edge desktop (17 liquidações, 9 baixas excluídas).
- [ ] Teste real do arquivo XLSX no Chrome/Edge desktop (52 títulos, 4 pagos, total R$ 1.921.587,47).
- [ ] Teste real de OCR do PDF de contas a receber com correção de nomes antes da confirmação.
- [ ] Testar criação real e saldo em base de homologação, depois reversão/backup.
- [ ] Testar fluxo em conta local e conta sincronizada; verificar importação repetida.
- [ ] Confirmar execução da suíte Node/CI; observar bloqueios do runner.
- [ ] Verificar layout da modal e acessibilidade em PC 1280px e 1440px.

**Importante:** status de candidata — ainda não homologada integralmente. Não afirmar que OCR/PDF e saldo foram validados apenas por verificações estáticas. A inclusão dos arquivos no GitHub não envia relatórios de usuário.
