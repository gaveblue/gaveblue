# GB+ AI — Plano de evolução e validação (sem API)

## Estratégia

O GB+ AI usa um **interpretador local determinístico**, não um modelo de linguagem treinado.
Gerar centenas de milhares de frases é um **teste de cobertura**, e não um treinamento
estatístico. A melhoria vem de corrigir as regras de interpretação, da cobertura das
funcionalidades, da memória limitada do diálogo e dos testes contra regressões reais.

Todo cálculo financeiro continua no GB+ (em centavos), com acesso apenas ao usuário
autenticado. **Nunca** enviar dados pessoais/financeiros a serviços externos nem cobrar
por API para usar este módulo.

## Primeira etapa — realizada nesta branch

- Simulações de compra futura, sem gravação de título:
  - "Quero comprar uma calça mês que vem. Como vai estar meu fluxo de caixa?"
  - "E se custar R$ 250?"
  - "E daqui a três meses?"
  - "Como vai estar meu saldo em janeiro?"
- Projeções cumulativas **até o fim do mês**; saldo atual menos títulos a pagar
  pendentes e, em cenário otimista, mais títulos a receber pendentes.
- Cenário conservador **sem contar recebimentos incertos**.
- Baixas parciais descontadas; títulos cancelados desconsiderados.
- Valores e datas ausentes geram esclarecimento, não uma suposição.
- Compras parceladas ainda **não simuladas**; o assistente avisa explicitamente
  em vez de computar incorretamente como compras à vista.
- Correção do erro ao abrir edição de títulos e de variável não definida no botão
  de confirmação.
- Contexto de projeção separado por conversa; não persistido em títulos.
- Correções de consultas mensais, período por nome e confusão entre "conta bancária"
  e "conta a vencer".
- Auditoria sintática do HTML do chatbot e do módulo de consultas.

## Bateria extensiva

Arquivo: `tests/gbplus-ai-scenarios.test.cjs`.

Executar testes curtos:

```sh
node --test tests/gbplus-ai-scenarios.test.cjs
```

Executar teste extensivo, gerando 216.000 perguntas localmente, sem rede:

```sh
GBPLUS_AI_STRESS=1 node --test tests/gbplus-ai-scenarios.test.cjs
```

**216.000 variações** são combinações de 60 objetos × 15 prazos × 10 preços
× 12 construções de frase × 2 formas de preço. O gerador verifica se
período, valor e intenção são corretamente interpretados. Os exemplos são
sintéticos; não comprovam compreensão irrestrita da língua portuguesa.

## Próximas etapas (guiadas pelos prints e uso real)

1. Adicionar cada erro reportado a uma lista de falhas reprodutíveis com
   entrada exata, contexto, resposta incorreta e resposta esperada.
2. Cobrir consultas: saldo; pagar/receber; despesas pagas; recebimentos baixados;
   vencidos; agrupamentos por categoria/parceiro; projeções por mês;
   alteração/baixa/estorno somente com confirmação.
3. Testar seguimentos como "e no mês passado?", "só as despesas" e
   "compare com dezembro" por tipo de consulta, evitando reutilizar contexto
   de uma conversa em outra.
4. Incorporar simulações de parcelamento com geração de cronograma,
   diferenças entre juros, entrada e valor total, sempre como prévia.
5. Testes de segurança para pedidos adversariais e instruções ambíguas:
   não inventar saldo, não afirmar gravação sem confirmação do servidor,
   não duplicar títulos, não executar comandos de escrita ao simular.
6. Validação de interface em Android e desktop antes da publicação.

## Critério de publicação

Não fazer merge automático. Primeiro: todos os testes automáticos aprovados;
depois: conferência humana no navegador, especialmente consultas com dados
reais e fluxos de confirmação. Esta branch é experimental e não altera a
instância de produção enquanto não for incorporada.

## Privacidade e custos

Nenhuma chamada ao Gemini/OpenAI. O interpretador de cenários executa no
navegador do GB+ com os dados já carregados e protegidos pela sessão atual.
A execução dos testes não exige chave, cartão ou plano de API.
