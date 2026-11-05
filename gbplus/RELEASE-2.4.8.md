# GB+ 2.4.8 — GB+ AI com prévia na conversa

**Versão de código:** 2.4.8 · **Compilação:** 62 · **Registro no GitHub:** 05/11/2026

## Inspirado na imagem de referência

A interface do GB+ AI foi preparada para apresentar uma **prévia do lançamento dentro da conversa**, abaixo da mensagem do assistente. O restante do aplicativo e o fluxo de acesso continuam os mesmos.

- ✦ **Conversa minimalista:** mensagens com cantos suaves, avatar discreto e composer preservado.
- 📋 **Prévia organizada:** descrição, valor, vencimento, periodicidade, quantidade e total; controle para expandir a relação de títulos.
- ✏️ **Editar sem sair do chat:** alterar descrição, receita/despesa, valor, vencimento, periodicidade, quantidade e parceiro.
- ✓ **Confirmar e gravar:** único botão de gravação do rascunho, seguindo a ponte autenticada já existente; dados reais somente após a confirmação do usuário.
- ⨯ **Descartar:** limpa o rascunho e não altera títulos.
- 📆 **Correção por conversa:** comandos como “altera para dia 20” corrigem o vencimento sem transformar o número do dia em um valor financeiro; “edita o vencimento” pode pedir a nova data.
- 📎 **Botão de anexo:** preparado na barra de mensagem, separado da confirmação de títulos.

## Importação: o que a 2.4.8 faz e o que não faz

O botão de anexo reconhece:
- **OFX/CSV/TXT**: faz a leitura local inicial do arquivo, identifica movimentos e mostra soma de entradas/saídas. Esses valores **não são cruzados com nenhuma conta do usuário, nem gravados**.
- **PDF/XLSX/XLS**: o arquivo pode ser selecionado, mas sua interpretação **ainda não foi implementada**. A interface apresenta uma mensagem clara, sem fingir que o conteúdo foi lido.

Os arquivos não são automaticamente enviados para um modelo de IA nem armazenados no Supabase. O conteúdo não fica salvo no histórico do chat.

Na 2.4.9 aprofundaremos a interpretação e o reconhecimento de divergências **sem gravar**, e na 2.5.0 construiremos o processo de conciliar, selecionar e confirmar movimentos de extratos com prevenção de duplicidades.

## Regras financeiras preservadas

- A prévia do chat não altera o saldo até haver baixa em um título.
- Um comando de criação ainda passa por validação de tipo, valor em centavos, data, quantidade e categoria no aplicativo principal.
- A gravação exige a ação explícita **Confirmar e gravar**, comunicação autenticada e retorno do aplicativo.
- Um retorno incerto por timeout continua bloqueando a tentativa automática para não duplicar títulos.
- Ao alternar entre chats, nenhum rascunho de confirmação pendente é restaurado automaticamente.
- O catálogo bancário, cartões, saldos e permissões do Supabase não foram alterados nesta atualização.

## Cenário de referência

Pedido: “Lança uma conta de energia de 450 reais para dia 15 e repete por seis meses.”

A prévia calcula seis títulos de **R$ 450,00**, com vencimento inicial em **15/11/2026** (dependendo da data em que o pedido for realizado), totalizando **R$ 2.700,00**. A geração mensal mantém o dia-base e respeita a quantidade informada.

A interface permite abrir a lista, editar o vencimento, descartar ou confirmar. Não cria qualquer título antes da confirmação.

## Homologação

- [x] Novo módulo \`ai-lab/preview-card.js\` para cálculos e construção segura do cartão.
- [x] Novo CSS \`ai-lab/preview-card.css\` para layouts desktop/mobile, com modo escuro.
- [x] Novo módulo \`ai-lab/file-stage.js\` para anexos em prévia local.
- [x] Corrigida a interpretação do comando de ajuste de data no \`ai-lab/engine.js\`.
- [x] Manifesto, iframe, cache do PWA e versão atualizados para **2.4.8 / build 62**, incluindo os módulos novos.
- [x] Oito novos testes de visualização, vencimentos, correções e salvamento seguro do rascunho.
- [ ] Confirmar publicação em \`gaveblue.com.br\`.
- [ ] Testar numa tela Android de 320–390px e em desktop: lista de vencimentos, teclado do editor, abertura/fechamento, botão de confirmação e rolagem.
- [ ] Homologar OFX/CSV com arquivos anonimizados de bancos distintos e confirmar que nenhum dado é salvo.
- [ ] Preparar a conciliação real por conta na 2.5.0.

**Nota:** implementação no repositório não equivale à publicação ou homologação em dispositivos reais.

Veja o [cronograma até a 3.0.0](./PLANO-VERSOES-2.4.7-A-3.0.0.md).
