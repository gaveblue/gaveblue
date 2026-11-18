# QA — Intervalo 1.2.0 RC12–RC14

## Entregas publicadas
- RC12: cozinha MM:SS por rodada/pedido externo, atraso 20 min, origem do tempo por registro; modelos e prévias de impressão externos; funções marketplace-operations e restaurant-core estendidas.
- RC13: detalhe de sessões e comparação do dinheiro presencial, histórico das 40 últimas sessões e impressão do pedido externo e recibo por pagamento confirmado.
- RC14: Gestão compacta, indicadores adicionais, folhas dos formulários de equipe e dados, central de pedidos externos por origem/modalidade/etapa, folhas de pagamento, estilo compartilhado e redução de consultas estáticas no Garçom.

## Evidências
- Sintaxe JS dos arquivos alterados e módulo do index conferida por compilação de função (imports removidos para teste).
- Casos simulados: cronômetro e limite de atraso/ausência de horário; renderização de pedido online com adicional, taxa, desconto, total armazenado, escape de dados e prévia de recibo. Verificações estruturais dos fluxos e permissões. Não são testes E2E.
- Consultas SQL somente leitura confirmaram colunas, funções de transição/fechamento e origem de lançamento por Garçom. Há sessão aberta e não havia sessão fechada na consulta, de modo que o histórico real não foi homologado com dados encerrados. Não se criaram pedidos nem pagamentos de teste.
- A autenticação JWT permanece habilitada nas duas Edge Functions. Não alterou tabelas, RLS, cálculo oficial de fechamento nem modos de pagamento. Não executar dados financeiros falsos para testar.

## Limitações e próximos testes
- Testar em ambiente autenticado, incluir pedido externo presencial simulado pelo usuário, conferir transições cozinha/expedição, recibo real, checkout e Pix, fechamento com dinheiro contado e reabertura de histórico. Banco mantém conferência presencial e online separado; não integrar valores online ao dinheiro esperado sem decidir regra e testar transação.
- Contagens usam limites existentes das APIs (lista externa 100, sessões 40, resumo 1000 pagamentos); detalhe de sessão pagina por sessão e falha se limite atingido. Nenhum recibo emitido quando registro confirmado indisponível.
- Alguns painéis próprios (checkout, garçom, marketplace e integrações) ainda têm implementações distintas de Bottom Sheet; CSS compartilhado não equivale a refatoração total. Responsividade visual em Android/iOS/desktop e impressão térmica física não foram realizadas. Não declarar versão definitiva homologada.
