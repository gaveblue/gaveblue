# CHANGELOG — GB+ Gestão Financeira

Registro de mudanças do aplicativo localizado em `gbplus/`. Toda versão e toda compilação deve possuir uma entrada própria. **Uma alteração não deve ser considerada homologada apenas porque existe commit, teste escrito ou publicação.** A homologação exige evidências da execução e aprovação explícita.

## [2.4.9 · compilação 68] — 2026-11-06

**Situação:** publicação autorizada pelo responsável em 2026-11-06; **homologação funcional completa ainda pendente de evidências**.  
**Origem:** solicitação de correções de responsividade e filtros no fluxo de caixa.  
**Ramo de implementação:** `fix/gbplus-249-fluxo-responsivo-build68` (PR #72).  
**Autorização de publicação:** o responsável pelo GB+ solicitou expressamente liberar a compilação 68 antes de concluir a homologação visual, aceitando a possibilidade de correções ou retorno à compilação 67. **Não equivale a afirmar que todas as verificações passaram.**  
**Ponto de retorno:** `backup/gbplus-249-build67-before-build68` (SHA `bb2bd690639d76a78fde7eda95340a6342f2558f`).

### Alterações previstas e implementadas no ramo

- Filtro de situação no fluxo financeiro: **Todos**, **Baixados**, **Pendentes**. Aplica-se ao gráfico, à tabela e à exportação CSV.
- Tabelas filtradas apresentam colunas pertinentes à situação selecionada. **Baixados** utiliza datas das baixas; **Pendentes** utiliza datas de vencimento e saldo residual; **Todos** combina os dois grupos sem duplicar valores.
- Títulos parcialmente baixados mostram separadamente o valor recebido/pago e o saldo ainda em aberto, respeitando centavos inteiros da base financeira.
- Gráficos SVG redimensionáveis no celular, textos e legendas dentro dos cartões, seleção diária/semanal/mensal e visualizações Barras/Linhas/Resultado preservadas.
- O gráfico mostra até seis períodos no celular e até doze em telas maiores, próximos à data atual; a tabela continua com todo o conjunto de períodos filtrados, inclusive lançamentos futuros distantes.
- Tabela com rolagem horizontal **interna**, primeira coluna fixa em telas pequenas e indicação de navegação horizontal.
- Exibição de mensagem clara quando não existem movimentações para o filtro/período.
- Identificação de compilação atualizada de 67 para 68 e recursos atualizados no cache do PWA. Não houve migração de dados.
- Botão móvel da IA **não alterado**: permanece arrastável e ocultável conforme comportamento existente.

### Verificações e evidências

- Teste automatizável adicionado: `gbplus/tests/flow-visual-regression.mjs`, com cenário de baixas parciais, separação das situações e seleção de períodos.
- Verificação de sintaxe das funções de gráfico e fluxo e execução simulada de **27 combinações** (3 tipos de gráfico × 3 granularidades × 3 situações), sem erro; não equivale a teste visual em dispositivo real.
- Cálculo sintético conferido: receita de R$ 100,00 parcialmente recebida (R$ 25,00) mostra R$ 75,00 pendentes, sem duplicação.
- **Execução em ambiente real com dispositivo móvel:** pendente.
- **Teste visual em larguras de 320/360/390/430 px e desktop:** pendente.
- **Teste interativo de Barras, Linhas, Resultado, Todos/Baixados/Pendentes e CSV com dados reais:** pendente.
- **Evidência de homologação, revisor e data da aprovação:** pendente.

### Critério de aprovação

Confirmar margens sem cortes, rolagem apenas dentro da tabela/gráfico quando necessária, consistência de 2026/2027 nos gráficos e tabela, dados de baixa parcial sem duplicidade e ausência de regressões financeiras. Registrar captura ou execução reproduzível, resultado e responsável antes de aprovar o merge/publicação.

## [2.4.9 · compilação 67] — 2026-11-06

**Situação:** compilação existente na ramificação principal antes deste ajuste; a evidência de homologação não foi reavaliada aqui.

- Pílulas compactas por banco com logo e saldo individual no cartão principal.
- Acesso às movimentações de cada conta por toque na pílula, preservando saldo geral.

---

## Padrão obrigatório para a 2.5.0 e seguintes

Cada **versão ou compilação**, inclusive correções pequenas, deve acrescentar uma seção com identificador, data, resumo da alteração, arquivos impactados, risco, testes, evidências, responsável e estado de homologação. Estados sugeridos: `em desenvolvimento`, `em revisão`, `homologação pendente`, `homologado`, `liberado`, `reprovado`.

**Fluxo padrão de liberação:** implementar em ramo separado → registrar CHANGELOG → executar testes e registrar evidências → obter homologação explícita → aprovar merge/publicação. Um PR ou commit isoladamente não constitui aprovação.

**Exceção documentada da compilação 68:** autorização explícita do responsável para publicação antecipada com riscos aceitos; a homologação funcional visual permanece pendente e deverá ser concluída com evidências no uso. Em caso de falha, preferir um commit de reversão dos arquivos específicos do GB+; não fazer reset forçado do ramo principal nem apagar dados financeiros.
