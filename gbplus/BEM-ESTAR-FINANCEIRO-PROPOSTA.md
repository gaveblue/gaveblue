# GB+ Bem-Estar Financeiro — estudo e proposta de produto

**Data:** 06/11/2026  
**Status:** proposta para avaliação, não implementada, não homologada e não publicada.  
**Escopo:** GB+ Personal; não misturar orçamento doméstico com métricas do GB+ Business.  
**Recomendação de versão:** primeira entrega **2.6.0**, depois da homologação da importação/conciliação da 2.5.0. Uma camada conversacional de IA, opcional, pode vir em 3.0.0.

## 1. Problema e evidências

Educação financeira eficaz não é apenas ensinar termos: deve ajudar as pessoas a registrar/entender o orçamento, antecipar compromissos, decidir sobre crédito e consumo, formar reserva e avançar em objetivos.

Fontes consultadas:

1. **Banco Central do Brasil, Cidadania Financeira** — orientações em orçamento, dívidas, imprevistos, consumo, planejamento e prevenção: https://www.bcb.gov.br/cidadaniafinanceira
2. **Banco Central, Relatório de Letramento Financeiro, pesquisa de 2023** — 65% dos entrevistados não conseguiriam enfrentar uma despesa inesperada equivalente à renda mensal sem empréstimo ou ajuda de terceiros; 44,8% declaram que nunca ou raramente sobra dinheiro no fim do mês. São resultados **da pesquisa de 2023**, não estatísticas de 2026: https://www.bcb.gov.br/cidadaniafinanceira/letramento_financeiro
3. **Banco Central, biblioteca de educação financeira** — seis áreas: relação com dinheiro, orçamento, crédito/dívidas, consumo planejado, poupança/investimentos, prevenção/proteção: https://www.bcb.gov.br/cidadaniafinanceira/cidadania_biblioteca
4. **CFPB, Financial Well-Being** — quatro dimensões qualitativas: controle do dia a dia, resiliência diante de choques, progresso nas metas e liberdade de escolha. Não confundir bem-estar financeiro com saldo bancário ou score de crédito: https://www.consumerfinance.gov/consumer-tools/educator-tool/financial-well-being-resources/
5. **CVM, Educação Financeira** — apoio ao investimento consciente, informação sobre riscos e proteção do investidor: https://www.gov.br/cvm/pt-br/assuntos/educacao/
6. **SUSEP, Orçamento** — distinguir receitas/despesas previstas e realizadas e criar hábitos de registro: https://www.gov.br/susep/pt-br/assuntos/meu-futuro-seguro/educacao-financeira/orcamento-1

**Princípio:** o GB+ deve ensinar *durante a decisão*, usando fatos dos dados autorizados pelo usuário, sem tom de julgamento. Exemplos: “Se este pagamento for feito hoje, quanto ainda ficará para as contas que vencem?” e “Por que separar uma reserva para imprevistos?”.

## 2. Nome e experiência recomendados

**Nome da área:** **Meu dinheiro**.  
**Subtítulo:** “Entenda seu mês e planeje seus próximos passos.”

**Três cartões pequenos na parte superior**, no estilo visual atual do GB+ (neutros, espaçamento generoso; verde apenas para resultado favorável e vermelho apenas quando necessário):
- **Seu mês:** Recebido / Pago / Ainda a vencer / Resultado efetivo (seleção mensal).
- **Compromissos à frente:** contas previstas até uma data escolhida e *saldo livre estimado* sob premissas transparentes.
- **Seu próximo passo:** uma sugestão única e contextual, com ação concreta (criar orçamento, revisar conta, começar reserva, cadastrar objetivo).

A tela detalhada pode ter abas **Visão geral**, **Orçamentos**, **Reserva e metas**, **Aprenda**. Não criar banners com dezenas de dicas, pop-ups frequentes, notificações de culpa ou competições por saldo.

### Exemplo de comunicação

- “Há R$ 780,00 em contas ainda não baixadas até o próximo recebimento informado. Confira antes de reservar dinheiro para outras compras.”
- “Sua categoria Transporte consumiu 85% do limite mensal que você definiu. Ver despesas | Ajustar orçamento.”
- “Sua reserva cobre cerca de 1,4 mês das despesas que você marcou como essenciais. Criar plano de contribuição.”
- “Quer entender por que pagar só uma parte da fatura pode aumentar o custo? Entenda em 60 segundos.”

**Nunca** afirmar “Você está financeiramente saudável” ou “Pode gastar sem risco” com base apenas em uma conta ou um período.

## 3. Funcionalidades e prioridade

### MVP — 2.6.0 (alto benefício e baixo risco)

**A. Orçamento mensal por categoria**
- Usuário define **se quiser** um teto em reais por categoria (moradia, transporte, alimentação, lazer etc.) e pode editar a qualquer momento.
- Mostrar **realizado**, **pendente já contratado** e **limite configurado** de forma distinta.
- Começar com gasto realizado pelas baixas de despesas do período; tratar compras no cartão e pagamento de fatura com uma estratégia única de competência/caixa, sem contagem dupla.
- Apresentar “nenhuma meta definida” quando não houver orçamento; não inferir limites universais como regra 50/30/20.
- Filtro por conta/período apenas se os dados permitem separação confiável.

**B. Compromissos e margem de decisão**
- Mostrar **saldo financeiro atual**, **títulos de despesa ainda pendentes até data escolhida** e **recursos separados para metas**, se informados.
- Indicador explicativo: `margem_estimada = saldo_disponivel - compromissos_prioritarios_pendentes - quantia_reservada_confirmada`.
- **Não incluir receitas futuras incertas** na disponibilidade. Exibir recebimentos esperados separadamente e apontar que a margem é uma estimativa, não uma recomendação para gastar.
- Sinalizar despesas previstas acima do saldo; apresentar o detalhe dos títulos, não apenas um alerta vermelho.

**C. Aprendizado contextual em microlições**
- Pequenos textos de 40–90 palavras, com ligação às fontes do BC/CVM.
- Exibir por contexto e com frequência limitada (ex.: uma sugestão relevante por sessão/semana; usuário pode ocultar).
- “Previsto x realizado”, “Por que separar reserva?”, “Juros e custo total do crédito”, “Compra por impulso”, “Transferências não são receita”, “Parcelamento compromete meses futuros”.
- As lições não substituem aconselhamento financeiro personalizado.

### Etapa seguinte — 2.7.0

**D. Reserva de emergência**
- Usuário identifica **explicitamente** que conta/quantia faz parte da reserva e marca categorias como **despesa essencial**.
- `meses_de_cobertura = reserva_identificada / media_mensal_de_despesas_essenciais`.
- Meta mensal e progresso opcional; sugerir simulações de cobertura de vários meses sem apresentar uma quantidade fixa como recomendação universal.
- Não presumir que o saldo total da conta é a reserva, nem retirar/transferir fundos automaticamente.

**E. Metas reais**
- Objetivos com valor, prazo e contribuição escolhida; previsão simples de progresso e simulação “quanto guardar por mês”.
- Progresso não deve somar saldo de conta e contribuições como se fossem recursos distintos.
- Considerar inflação e juros apenas se houver hipóteses explícitas e linguagem de projeção.

**F. Dívidas e custo do crédito**
- Exibir parcelas futuras, vencimentos, total contratado/pago/pendente.
- Comparar CET somente quando o usuário informar taxas e encargos necessários; nunca inventar taxa ou custo.
- Alertas sobre cartão rotativo, faturas e juros com conteúdo educativo e ação de revisar dados, não incentivo à contratação.

### Etapa opcional — 3.0.0

**G. Orientador GB+ com IA, opcional**
- Exemplos: “Posso fazer uma compra de R$ 600?” → simulação com saldo, compromissos e hipóteses, não promessa de aprovação.
- “O que elevou minhas despesas?” → decomposição por categorias e mudanças no período.
- O motor de cálculos deve ser **determinístico e testado**; IA explica os resultados e orienta, não altera registros nem cria promessas de retorno.
- Não enviar movimentações, CPF, conta ou histórico a provedor de IA sem consentimento específico e escopo mínimo; oferecer controles de exclusão e desligamento.

## 4. Integração com o GB+ existente

Já existem (verificado no código do repositório): `titles` (lançamentos), `payments` (baixas), `transfers`, `accounts`, `categories`, `metrics()`, `accountBalance()`, filtros de previsto/realizado e módulo de previsão.

**Não duplicar funções existentes**: construir uma camada derivada, só de leitura:
- `js/financial-wellbeing-core.js`: cálculos puros, sem gravação e sem uso de IA;
- `js/financial-wellbeing-rules.js`: regra → explicação → fonte → ação navegável;
- `js/financial-wellbeing-view.js`: cartões/abas e microlições;
- `settings.financialWellbeing` (opcional): preferências, orçamentos, metas, categorias essenciais e lembretes, validadas no mesmo armazenamento com revisão.

**Normas de cálculo:**
1. Uma baixa efetiva entra no realizado uma única vez; transferência entre contas próprias não é receita/despesa.
2. Vencimento e pagamento são datas distintas. Baixas parciais precisam refletir realizado e pendente sem duplicar valores.
3. Compras no cartão devem ser apresentadas sem somar a compra e a quitação da fatura duas vezes no mesmo total de gastos.
4. Saldo inicial não é receita do mês e não significa reserva disponível.
5. Sem dados suficientes: exibir “não há informação para estimar” ou pedir uma preferência; jamais zero fictício nem score enganoso.
6. Resultados e alertas devem indicar período e premissas, com botão “Ver cálculo”.

## 5. Não criar um score arbitrário de 0 a 100

“Score de saúde financeira” não é equivalente ao score de crédito, nem ao índice de bem-estar financeiro validado pelo CFPB.

- **MVP:** usar indicadores nomeados e transparentes (“contas a vencer”, “uso do orçamento”, “reserva identificada”), sem nota.
- Se o projeto desejar uma **medida de bem-estar subjetivo** no futuro, considerar o questionário e método oficiais, incluindo orientações e limitações de aplicação; não alterar itens nem chamar uma nota interna de “índice oficial”.
- Não punir pessoas com renda irregular, dependentes, gastos de saúde ou emergência; evitar comparações sociais.

## 6. Segurança, privacidade e inclusão

- Escopo inicial **Personal**; se houver Business, não sugerir regras de orçamento doméstico na visão empresarial.
- Preferências e metas são **opt-in**, editáveis e exportáveis. Sugestões podem ser ocultadas.
- Evitar notificações sensíveis na tela bloqueada (“você tem dívidas”). Nada de anúncios ou ofertas de crédito embutidas no aprendizado.
- Linguagem brasileira acessível, sem vergonha ou moralismo, com suporte a diferentes rendas e hábitos financeiros.
- Sem inferir renda, profissão, saúde, classe social ou investimentos com base em categorias de transação.
- Regras de acessibilidade: 320 px, contraste de tema escuro, VoiceOver/TalkBack, foco e leitura por teclado.
- As fontes externas servem para fundamentar conteúdo, não para entregar os dados do usuário a elas.

## 7. Critérios de aceitação para o MVP

- [ ] Com R$ 3.000,00 em contas, R$ 1.200,00 de despesas prioritárias não baixadas até o horizonte e R$ 400,00 explicitamente reservados, mostrar **margem estimada R$ 1.400,00**, com explicação da fórmula.
- [ ] Uma transferência própria de R$ 300,00 **não aumenta** a receita nem a despesa, e não muda o patrimônio total.
- [ ] Um pagamento parcial de R$ 25,00 sobre despesa de R$ 100,00 resulta em **R$ 25,00 realizado e R$ 75,00 pendente**.
- [ ] Não contabilizar compra de cartão e pagamento da fatura como duas despesas independentes.
- [ ] Ao configurar limite de R$ 500,00 e realizar R$ 425,00 numa categoria, mostrar **85% do orçamento utilizado**, sem tratar 85% como problema universal.
- [ ] Se uma meta tem R$ 1.000,00 identificados para R$ 5.000,00 de objetivo, mostrar **20% de progresso**, sem dobrar saldo.
- [ ] Sem orçamento, mostrar chamada opcional de configuração; nunca classificar o usuário como “ruim”.
- [ ] As microlições citam fonte e exibem motivo do alerta (“Com base em: contas de novembro”).
- [ ] Funcionar com dados insuficientes, conta sem movimentações e acesso offline, sem chamadas à IA.
- [ ] Testes automatizados e homologação real em Android/desktop, sem alterar dados históricos.

## 8. Sequência de implementação proposta

1. **Fechar e homologar a 2.5.0** (importação e conciliação) para reduzir riscos de escrita financeira.
2. **2.6.0, primeira compilação:** módulo visual Meu dinheiro + orçamento e margem estimada, apenas cálculos derivados e preferências explícitas.
3. **2.6.0, próxima compilação:** microlições contextuais e navegação para ações já existentes.
4. **2.7.0:** reserva, metas e organização de dívidas.
5. **3.0.0:** orientador conversacional opcional, com regras auditáveis e consentimento.

**Condição de qualidade:** apresentar cálculos verificáveis, evitar conselhos financeiros garantidos, preservar os registros, documentar cada build no CHANGELOG e homologar antes de qualquer publicação.

---

Este arquivo é **proposta de escopo**. Não cria funcionalidades e não autoriza publicação. Nenhum lançamento ou dado de usuário foi acessado ou alterado.
