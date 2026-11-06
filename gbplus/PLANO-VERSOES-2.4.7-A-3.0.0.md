# GB+ — Plano de versões 2.4.7 → 3.0.0

**Definido em:** 05/11/2026  
**Princípio:** versões menores entregam melhorias testáveis; a importação bancária estreia na 2.5.0 e a maior evolução de inteligência artificial fica para a 3.0.0.  
**Cronograma por marcos, não por datas rígidas:** uma etapa só avança depois dos testes essenciais e da publicação anterior confirmada.

| Marco | Tema | Entrega principal | Critério para avançar |
|---|---|---|---|
| **2.4.7** | Central de atualizações | Novidades ilustradas por cartões com ícones, títulos e descrições; mostrar todas as melhorias; manter download e reinício com confirmação; corrigir validação de pacotes com mais de 80 assets | Publicar versão e conferir painel no Android/PWA, notas e download real sem perder dados |
| **2.4.8** | GB+ AI: prévia visual e anexos | Prévia do lançamento integrada ao chat, vencimentos, edição antes de gravar e anexo OFX/CSV para leitura local. PDF e Excel ainda aguardam parser. | Validar no celular, conferir edição por comando e confirmar que nenhum arquivo cria lançamentos |
| **2.4.9** | Saldos por conta e extrato diário | Ícones, nomes e saldos individuais abaixo do total; extrato por dia com abertura, créditos, débitos, fechamento e acumulados. Sem importação nem alteração de saldos. | Homologar no celular e conferir cálculos com baixas e transferências reais anonimizadas |
| **2.5.0** | Importação e conciliação bancária | Interface de selecionar conta, importar OFX/CSV, visualizar movimentos, comparar com baixas/transferências, aprovar conciliação ou criação de títulos e conferir divergências | Testes ponta a ponta de autorização, RLS, idempotência/reimportação, reversão e ausência de dupla contabilização |
| **2.5.1** | **Identificação de serviços e logos** | Catálogo compacto de streaming, delivery, música e serviços digitais no lançamento; busca, IDs estáveis, recorrência opcional e logos oficiais locais (com fallback) | Não criar títulos/recorrências ao selecionar; integrar com formulário, garantir compatibilidade e homologar logos, acessibilidade e salvamento; ver `PLANO-2.5.1-SERVICOS.md` |
| **3.0.0** | **GB+ com IA financeira** | Assistente em linguagem natural para consultar e analisar dados, sugerir e preparar lançamentos; execução somente após prévia e confirmação do usuário | Política de segurança, permissões, histórico de ações, isolamento de dados, custo e testes de comandos reais |

## 2.5.1 — Catálogo de serviços

Após fechar a 2.5.0 com importação e mapeamento CSV, desenvolver identificação de serviços com logos discretos, começando por Netflix, HBO Max, iFood, 99Food e Plus Delivery. Catálogo detalhado e critérios estão em [`PLANO-2.5.1-SERVICOS.md`](PLANO-2.5.1-SERVICOS.md). **Este é um plano**, não confirmação de recurso publicado.

## 2.4.7 — Nova apresentação de atualizações

**Já implementado no GitHub (build 61):**
- A central de novidades apresenta **cards ilustrados**, cada um com ícone, nome da melhoria e descrição.
- O manifesto aceita uma lista estruturada `highlights` de objetos com os campos `icon`, `title` e `description`. O formato antigo `notes: string[]` continua aceito para compatibilidade.
- Ícones internos pré-definidos: `sparkles`, `shield`, `bank`, `chart`, `card`, `repeat`, `file`, `wallet`, `check`, `bell`, `gear`. Não carregar imagens externas apenas para apresentar as novidades.
- A lista de melhorias deixa de truncar nos três primeiros itens, e a verificação manual também apresenta as novidades da versão instalada quando o servidor as confirma.
- Correção do limite anterior de **80 arquivos**: versões com até **500 assets validados** podem ser reconhecidas, inclusive os 139 assets da versão 2.4.6. Não houve mudança nos dados financeiros.
- Mantidos a barra de progresso real de arquivos, os avisos de erro e a decisão explícita antes de reiniciar.

**Pendências:** testar no Android/iPhone, confirmar publicação da 2.4.7 e conferir que o processo não interrompe lançamentos não salvos.

## 2.4.8 — Chat redondo e prévia de lançamentos (implementado no código)

A expressão “lançamentos automáticos” foi esclarecida: trata-se de **criar lançamentos ausentes a partir de extratos importados, somente após aprovação**, não de gerar recorrências de maneira independente.

- [x] Prévia de título dentro da conversa, seguindo o layout minimalista do GB+ AI.
- [x] Detalhamento de datas/quantidades, inclusive 6 parcelas mensais de R$ 450,00.
- [x] Botões Detalhar, Editar, Descartar e Confirmar e gravar.
- [x] Editor de descrição, tipo, valor, primeiro vencimento, periodicidade, quantidade e parceiro.
- [x] Corrigir a interpretação de “altera para dia 20”, sem modificar o valor.
- [x] Botão de anexo para OFX, CSV, PDF e Excel no chat.
- [x] OFX/CSV: leitura e totalização preliminar **local e não persistente**; PDF/XLSX: identificar o arquivo e indicar que a leitura está pendente.
- [x] Manter a gravação existente via ponte autenticada somente depois de confirmação.
- [ ] Homologar em aparelho real o formulário, a rolagem dos vencimentos, o PWA e a sincronização.
- [ ] A importação em lote e a conciliação bancária real continuam reservadas à 2.5.0.

## 2.4.9 — Saldos por conta e extrato diário (implementado no GitHub)

- [x] Ícones das contas no rodapé do cartão de saldo, com rolagem horizontal e acesso direto ao extrato. Na compilação 66, cada ícone acompanha o nome e o saldo individual da conta, mantendo o total consolidado no alto.
- [x] Preservar o saldo total do dashboard, sem mudar sua composição.
- [x] Extrato individual por dia: saldo de abertura, movimentações, créditos, débitos e saldo de fechamento.
- [x] Acumulados de créditos e débitos por conta, considerando baixas e transferências.
- [x] Dia atual visível mesmo sem movimentações.
- [x] Transferências entram com sinais opostos nas contas de origem e destino, sem criar receita ou despesa.
- [x] Não incluir títulos pendentes, compras no cartão não baixadas nem lançamentos futuros no saldo realizado.
- [x] Visualização somente leitura, sem mutações de dados.
- [x] Manifesto 2.4.9 / build 66 e cache do PWA atualizados.
- [x] Onze testes específicos do extrato diário e do saldo por conta.
- [ ] Homologar em aparelho real o card, a rolagem e o modal com contas de diferentes bancos.
- [ ] Conferir extratos reais anonimizados e equivalência do saldo com o módulo Contas.

**Limitação herdada:** o esquema guarda o saldo inicial da conta, mas não a data de abertura desse saldo. O extrato calcula a evolução a partir do saldo inicial cadastrado; não pode afirmar o saldo histórico anterior à origem desse valor. A 2.5.0 deverá tratar essa informação ao importar períodos históricos.

**Replanejamento:** a ampliação dos parsers OFX/CSV e a detecção de duplicidades passam para a 2.5.0, junto à conciliação bancária.

## 2.5.0 — Importação e conciliação bancária

Fluxo previsto:
1. Selecionar conta e arquivo OFX/CSV.
2. Conferir prévia dos movimentos por data, histórico, valor, direção e identificador externo.
3. Sugerir vínculo com baixa/transferência existente; não confirmar automaticamente.
4. Por movimento, o usuário decide: conciliar, criar lançamento, deixar pendente ou ignorar.
5. Revisar diferenças, detectar reimportação e autorizar gravação específica.
6. Persistir trilha de auditoria, garantir isolamento de usuários e permitir correção/estorno controlado.

**Planilhas XLSX** de receitas e despesas serão integradas ao projeto de importação, com mapeamento de colunas e homologação própria; não antecipar suporte incompleto na primeira publicação de OFX.

**Regra principal:** importar extrato **não** significa reconhecer despesa/receita automaticamente. Somente um lançamento ou uma baixa confirmada muda a posição financeira.

## 3.0.0 — IA como grande atualização

Foco na **IA do GB+**, não na integração automática de contas bancárias:
- Entender comandos naturais do usuário para localizar títulos, vencimentos e saldos.
- Explicar a situação financeira e indicar possíveis ações com base nos dados autorizados.
- Preparar alterações e lançamentos automáticos em prévia estruturada.
- Exigir consentimento expresso para salvar, baixar, excluir ou alterar transações.
- Histórico auditável e regras para não expor informações entre usuários.
- Avaliar limites, custos e fornecedor de IA antes da implantação.

**Não confundir IA com Open Finance:** integração automatizada com bancos depende de regras e provedores próprios; permanece fora deste escopo, salvo decisão futura do usuário.

## Modelo de notas de versão ilustradas

```json
{
  "version": "2.4.7",
  "build": 61,
  "title": "Uma central de atualização mais visual",
  "highlights": [
    {
      "icon": "sparkles",
      "title": "Novidades organizadas",
      "description": "Cada melhoria aparece com ícone e explicação."
    },
    {
      "icon": "shield",
      "title": "Atualização mais confiável",
      "description": "O app reconhece pacotes maiores e mantém a confirmação de reinicialização."
    }
  ]
}
```

Para versões antigas, `notes: ["Melhoria A", "Melhoria B"]` continua válido. Ícones e descrições são dados de apresentação: não executam comandos ou alteram registros financeiros.

## Critérios permanentes de homologação

- Não apagar dados para resolver problemas de cache, design ou autenticação.
- Executar regressão de saldos, títulos, baixas, faturas e recorrências nas mudanças financeiras.
- Atualizar manifesto, cache do PWA e changelog juntos.
- Conferir interface móvel e desktop.
- Não marcar versão como publicada até confirmar o deploy e a disponibilidade dos arquivos.
- A IA e a importação não podem realizar operações financeiras sem autorização explícita.

**Documento complementar:** [IMPORTACAO-2.5.0.md](./IMPORTACAO-2.5.0.md).
