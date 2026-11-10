# WeFrotas — Central × abastecimento de veículo reserva (10/11/2026)

## Situação e causa identificada

- A Central permanece **sem alterações**. O motorista envia o abastecimento normalmente; interpretação do veículo, alerta de reserva e lançamento financeiro são responsabilidade exclusiva do WeFrotas administrativo.
- O fluxo anterior tinha exceção para sinistro em `WeFrotasSubstitutions.association`: aceitava a placa do titular com `sinisterFuelReview=true` e permitia salvar KM sem forçar a placa do reserva. Isso poderia comparar o odômetro ao histórico do veículo errado.
- Na consulta **somente leitura** ao WeFrotas de produção em 10/11, a OS **45** relaciona o titular **TOK-6F54** ao reserva **ABC1234**, mas registra o início da substituição em **13/11/2026**. Abastecimentos em 09/11 e anteriores **não** pertencem à substituição segundo as datas gravadas. O sistema não pode antecipar automaticamente o começo sem confirmação da data real.
- O histórico do titular inclui a NF 7302 de 29/09/2026, 36.488 km. Nenhum dado financeiro ou cadastral foi corrigido automaticamente.

## O que mudou na branch

1. Um resolvedor administrativo `resolveCentralFuel` usa a substituição ativa do motorista na **data efetiva do abastecimento** e confronta a placa recebida com o titular e o reserva. Somente em correspondência segura troca a seleção para o reserva.
2. Se a Central informar placa de um terceiro, o formulário abre sem veículo escolhido e exige conferência manual; nunca atribui custos ou KM silenciosamente.
3. Se a data do abastecimento for anterior em até 7 dias à entrega registrada do reserva do mesmo titular/motorista, a tela administrativa mostra **CONFERIR DATA DO RESERVA**; não altera a OS nem rotula o lançamento antigo como reserva.
4. Mesmo em sinistro, o formulário financeiro impede salvar combustível na placa do titular durante substituição ativa. O histórico de KM do titular fica isolado do reserva.
5. O carregamento administrativo usa a data do registro da Central de forma consistente, e as versões dos scripts em `index.html` foram atualizadas para invalidar cache.

## Validação

- Checagens executadas em V8 isolado: com data ativa, placa original resolve para reserva; placa não relacionada exige revisão; data anterior à entrega mostra alerta; lançamento direto na placa sinistrada é recusado.
- Foi compilada sintaticamente a versão alterada de `wefrotas.js` em V8 isolado.
- Novos testes Node adicionados a `tests/wefrotas-substitutions.test.cjs`; **não** foram executados neste ambiente. GitHub Actions segue sem execução útil para homologação devido ao bloqueio pré-existente de cobrança.
- **Pendente antes de liberar**: testar sessão autenticada na Central e no WeFrotas, aprovação manual, comportamento offline/reenvio e reconciliação. Não aprovar como homologação final sem evidências.
- **Pendência de dados**: confirmar a **data verdadeira da entrega do ABC1234** na OS 45. Se o reserva estava em uso antes de 13/11, corrigir data por fluxo autorizado da própria OS após conferir evidências, sem alteração direta no banco. Não alterar datas automaticamente.

## Segurança de publicação

Branch isolada; sem merge, deploy, modificação de schema, RPCs, dados reais, registros financeiros ou app Central.
