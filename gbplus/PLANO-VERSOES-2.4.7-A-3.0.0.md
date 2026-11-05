# GB+ — Plano de versões 2.4.7 → 3.0.0

**Definido em:** 05/11/2026  
**Princípio:** versões menores entregam melhorias testáveis; a importação bancária estreia na 2.5.0 e a maior evolução de inteligência artificial fica para a 3.0.0.  
**Cronograma por marcos, não por datas rígidas:** uma etapa só avança depois dos testes essenciais e da publicação anterior confirmada.

| Marco | Tema | Entrega principal | Critério para avançar |
|---|---|---|---|
| **2.4.7** | Central de atualizações | Novidades ilustradas por cartões com ícones, títulos e descrições; mostrar todas as melhorias; manter download e reinício com confirmação; corrigir validação de pacotes com mais de 80 assets | Publicar versão e conferir painel no Android/PWA, notas e download real sem perder dados |
| **2.4.8** | Lançamentos automáticos e recorrências | Revisão da criação automática de títulos, datas de vencimento, periodicidade e dias úteis; melhorar a prévia e o processo de confirmação | Receber do usuário a regra adicional ainda não detalhada; testar recorrências/parcelas sem duplicidade |
| **2.4.9** | Preparação da importação | Ampliar parser e prévia OFX/CSV em modo somente leitura; detectar transações duplicadas e ambíguas; reconhecer formatos diferentes; validar segurança e volume | Testar extratos reais anonimizados de bancos distintos, sem escrita de lançamentos |
| **2.5.0** | Importação e conciliação bancária | Interface de selecionar conta, importar OFX/CSV, visualizar movimentos, comparar com baixas/transferências, aprovar conciliação ou criação de títulos e conferir divergências | Testes ponta a ponta de autorização, RLS, idempotência/reimportação, reversão e ausência de dupla contabilização |
| **3.0.0** | **GB+ com IA financeira** | Assistente em linguagem natural para consultar e analisar dados, sugerir e preparar lançamentos; execução somente após prévia e confirmação do usuário | Política de segurança, permissões, histórico de ações, isolamento de dados, custo e testes de comandos reais |

## 2.4.7 — Nova apresentação de atualizações

**Já implementado no GitHub (build 61):**
- A central de novidades apresenta **cards ilustrados**, cada um com ícone, nome da melhoria e descrição.
- O manifesto aceita uma lista estruturada `highlights` de objetos com os campos `icon`, `title` e `description`. O formato antigo `notes: string[]` continua aceito para compatibilidade.
- Ícones internos pré-definidos: `sparkles`, `shield`, `bank`, `chart`, `card`, `repeat`, `file`, `wallet`, `check`, `bell`, `gear`. Não carregar imagens externas apenas para apresentar as novidades.
- A lista de melhorias deixa de truncar nos três primeiros itens, e a verificação manual também apresenta as novidades da versão instalada quando o servidor as confirma.
- Correção do limite anterior de **80 arquivos**: versões com até **500 assets validados** podem ser reconhecidas, inclusive os 139 assets da versão 2.4.6. Não houve mudança nos dados financeiros.
- Mantidos a barra de progresso real de arquivos, os avisos de erro e a decisão explícita antes de reiniciar.

**Pendências:** testar no Android/iPhone, confirmar publicação da 2.4.7 e conferir que o processo não interrompe lançamentos não salvos.

## 2.4.8 — Lançamentos automáticos e vencimentos

**A especificar com o usuário:** o novo comportamento de lançamentos automáticos mencionado na solicitação. Não implementar uma regra desconhecida por suposição.

Revisões já identificadas:
- Geração de parcelas e títulos recorrentes sem duplicidade.
- Condição de vencimento em dias úteis, sem perder a data-base.
- Prévia das próximas datas e valores **antes da confirmação**.
- Edição de lançamentos futuros sem reescrever pagamentos já realizados.
- Mensagens claras de validação, confirmação e histórico.

## 2.4.9 — Preparação segura da importação

- Parser local de arquivos OFX/CSV, com tratamento de data, centavos e múltiplos layouts de bancos.
- Prévia read-only por conta; informações de `FITID`, histórico, direção, data e valor.
- Candidatos de conciliação, duplicidades, transferências internas, valores iguais em datas próximas e movimentos ambíguos.
- Homologação de OFX e CSV reais **anonimizados**, sem gravar.
- Definição da arquitetura de armazenamento, RLS, revisão e testes de reimportação.

**Base existente:** `js/bank-import-preview.js`, criada na preparação da 2.4.6. Esse código não é acessível como importação ativa no aplicativo.

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
