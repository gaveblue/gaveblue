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


## Ajuste da compilação 63 — bancos em destaque

Para diminuir a poluição visual na criação de contas bancárias e cartões de crédito, a faixa horizontal agora exibe **20 instituições pré-selecionadas como mais conhecidas**, em ordem alfabética: Banco do Brasil, Banco do Nordeste, Banco Pan, Banrisul, Bradesco, BTG Pactual, BV, C6 Bank, Caixa, Inter, Itaú, Mercado Pago, Neon, Nubank, PagBank, PicPay, Safra, Santander, Sicoob e Sicredi.

Esta é uma **seleção de interface** baseada em reconhecimento e uso amplo, não uma classificação estatística oficial das 20 maiores.

Os **78 bancos** permanecem disponíveis pela busca (nome, apelido “Sicobi”, COMPE ou ISPB), pelo seletor “Ver lista completa de bancos” e na página Bancos e instituições. Instituições personalizadas seguem acessíveis. Ao editar conta ou cartão com banco fora dos 20, o banco atual continua identificado no campo selecionado.

O módulo `banks.js` foi atualizado, junto aos importadores e ao cache do PWA; o manifesto permanece em **2.4.8**, com a compilação incrementada para **63**. A central de atualizações também passou a comparar a compilação, além da versão numérica, para aceitar ajustes sem pular a 2.4.9. Essa correção exige receber o JavaScript atualizado; em dispositivos com a versão anterior do atualizador pode ser necessário recarregar a página uma vez.

**Homologação pendente:** confirmar a atualização no celular, o filtro dos 20 logos, a pesquisa por bancos fora do destaque e a seleção de bancos previamente vinculados. Nenhum registro financeiro, saldo ou fatura foi migrado ou alterado.

## Compilação 64 — Faixa completa de bancos e pesquisa discreta

**Decisão de produto:** manter todos os bancos no mesmo seletor horizontal, nos cadastros de novas contas, novos cartões e no primeiro acesso. A faixa não precisa exibir números de bancos, códigos de compensação ou instruções técnicas para o usuário final.

- [x] Ícones de todas as instituições na faixa deslizável, sem recorte arbitrário.
- [x] Ordem inicial dos mais conhecidos: **Banco do Brasil, Sicoob, Caixa, Bradesco, Itaú, C6 Bank e Nubank**; em seguida outros populares e o restante do catálogo em ordem alfabética.
- [x] Remover o expansor “Ver lista completa de bancos”; manter o campo nativo de seleção fora da tela para acessibilidade e envio do formulário.
- [x] Campo de busca com apenas **Pesquisar**, tanto em contas/cartões quanto no diretório Bancos.
- [x] Retirar a contagem de instituições e a orientação técnica do seletor; contagem filtrada segue disponível apenas em aviso acessível a leitores de tela.
- [x] A pesquisa por nome, código bancário, ISPB e apelido continua funcionando internamente, sem exibir essas instruções.
- [x] A instituição anteriormente escolhida continua visível no resumo do campo mesmo quando não está entre as primeiras da faixa.
- [x] Notas de versão no aplicativo reescritas em linguagem simples, sem números do catálogo nem decisões internas.
- [x] Manter a mesma versão numérica **2.4.8**, avançando a compilação para **64**; atualizador por compilação e PWA sincronizados.

**Não houve alteração de dados financeiros, contas, cartões ou saldos.** A nova faixa é um controle visual de seleção e não representa integração bancária.

**Pendente:** homologação da rolagem horizontal e do teclado de pesquisa em Android/iPhone, especialmente nos formulários de cartões.
