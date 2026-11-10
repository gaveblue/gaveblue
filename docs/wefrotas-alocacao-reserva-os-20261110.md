# WeFrotas — abastecimento do reserva em OS do titular (10/11/2026)

## Regra de negócio

Uma **despesa** de combustível pode pertencer administrativamente à OS do titular sinistrado (OS de sinistro **ou** mensal), mesmo tendo sido realizada em **outro veículo físico**, o reserva. O valor financeiro acompanha a OS escolhida; **placa, quilometragem e histórico de consumo continuam pertencendo ao veículo efetivamente abastecido**.

Exemplo observado (consulta **somente leitura**): titular **TOK-6F54**, reserva **ABC1234**, substituição de sinistro em uso desde **06/10/2026**, conforme data atualizada pelo operador. O banco ainda continha lançamentos anteriores associados ao titular, e não foram alterados automaticamente.

## Alterações

- Nova regra isolada em `wefrotas/wefrotas-reserve-allocation.js`: valida período, motorista, placa física, substituição e vínculos contraditórios. Só permite OS do titular em substituição única comprovada e se aberta/em andamento. OS de outro veículo e OS fechada/cancelada continuam indisponíveis.
- Em **Financeiro → Fechar despesa → Alocar na OS**, abastecimento real do reserva passa a exibir também as OSs abertas do titular, inclusive sinistro e mensal. A vinculação é conferida novamente no envio do formulário.
- **Correção opcional de registros antigos**: se um abastecimento aprovado permaneceu no titular durante uma substituição de sinistro, o responsável pode marcar explicitamente que a leitura e combustível foram realmente do reserva. O sistema valida motorista, período e odômetro e registra `reserveReclassification` (placa anterior, reserva, substituição, data e método). Sem confirmação, nada é reclassificado. Identificadores da Central, valores e comprovantes são preservados.
- `getOrderKmData` agora recebe leituras apenas de lançamentos do **mesmo veículo físico da OS**. O mesmo princípio foi aplicado a `getVehicleFuelKmRange` e ao denominador de KM em `getVehicleCostStats`, evitando misturar odômetros sem subtrair os custos.
- Visualização da OS, impressão individual e em lote passam a incluir **VEÍCULO SINISTRADO** quando há evidência do incidente, e cada lançamento **efetivamente** confirmado como abastecimento do substituto é marcado **VEÍCULO RESERVA — placa**. As linhas comuns não são etiquetadas.
- Nenhuma mudança na Central do motorista, schema ou funções de banco.

## Verificação

- Testes de lógica em V8 isolado: **10 cenários aprovados**, executando os callbacks da suíte `tests/wefrotas-reserve-allocation.test.cjs` com equivalentes locais das funções assert/fs. Incluem OS de sinistro e mensal, bloqueios de terceiro/fechada, período, motorista, agrupamento, leitura da OS, impressão e confirmação manual. Este resultado **não** substitui `node --test` ou teste real no navegador.
- Verificação sintática isolada de `wefrotas.js` concluída.
- Pendente: teste autenticado em duas sessões da Central/WeFrotas, confirmação do fechamento e reconciliação com banco, impressão A4 simples e lote, caso de valor financeiro igual com leituras distintas, e estorno/devolução da OS. Revisar com o motorista quais lançamentos históricos são realmente do reserva.

## Estado de publicação

Branch isolada e PR em rascunho, sem merge/deploy nem gravação em dados reais. Não declarar homologado até teste integrado e evidência de persistência.
