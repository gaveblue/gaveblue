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


## Alocação do carro reserva à OS do titular — revisão complementar

O WeFrotas deve aceitar a despesa de combustível do **veículo fisicamente abastecido (reserva)** em uma OS do **titular sinistrado**, seja OS de sinistro, seja OS mensal aberta. O vínculo financeiro usa `orderId` da OS do titular; **não muda `vehicleId` nem `km`** do abastecimento. OS fechadas e OS de terceiro não são elegíveis.

- Correção: `wefrotas/wefrotas-reserve-allocation.js` verifica a substituição pelo veículo, motorista e período, sem inferência por KM ou placa habitual.
- Interface: `Fechar despesa` mostra as OS elegíveis do titular, além das do veículo físico, e sinaliza a substituição.
- Impressão: OS de sinistro ou titular com sinistro recebe destaque; somente cada lançamento validado do carro reserva recebe etiqueta **VEÍCULO RESERVA** e placa. Visualização, impressão unitária e lote seguem a mesma regra.
- Odômetro: `getOrderKmData`, faixa de KM por veículo e indicadores financeiros ignoram leituras de outro carro, mesmo quando o custo pertence à OS do titular.
- Regressões adicionadas em `tests/wefrotas-reserve-allocation.test.cjs`; verificações isoladas no V8 passaram em 13 cenários, incluindo OS mensal, OS de sinistro, placas divergentes, intervalo histórico, bloqueio de OS encerrada e distinção individual de impressão. A suíte Node foi adicionada, mas **não executada neste ambiente**.
- Consultado somente em leitura: após a correção manual pelo administrador, a substituição da OS 45, **TOK-6F54 → ABC1234**, inicia em **06/10/2026**. Em 10/11/2026 a tabela financeira ainda não tinha abastecimentos lançados com o `vehicleId` do ABC1234 para a substituição. Portanto, a rotina não deve converter lançamentos antigos do titular automaticamente. Cada comprovante precisa ser aprovado ou revisado com a placa física correta.
- Integração autenticada e impressão no navegador com dados reais permanecem **pendentes de homologação manual**. Sem alteração de dados financeiros ou banco nesta branch.
