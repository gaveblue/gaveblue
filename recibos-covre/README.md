# Recibos Covre

Tela disponível em /recibos-covre/. O caminho antigo /recibos/frete/ redireciona
para esta área para evitar links quebrados. O gerador fica separado do
WeRecibos geral porque atende somente os pagamentos esporádicos da Covre.
Aplicação estática, sem instalação de dependências no servidor.

No primeiro acesso, o perfil do pagador é cadastrado localmente neste navegador.
Esse cadastro preenche novos recibos e pode ser alterado pelo menu Configurações;
nenhum dado do perfil é enviado para um banco remoto. A tela Início mostra uma
estimativa de uso, limite e espaço disponível do armazenamento do site informada
por `navigator.storage.estimate()`.

No editor do PDF, as linhas divisórias também podem ser selecionadas diretamente
na página. As setas alteram sua posição; os controles ajustam largura e espessura.
As medidas são extraídas dos modelos originais e aplicadas pelo mesmo gerador
na prévia e na emissão. Salvar, desfazer e restaurar funcionam também nas linhas.

## Financeiro

O menu Financeiro contém Movimentações (todos os recibos, inicialmente pendentes)
e Extrato bancário (créditos, débitos e saldo acumulado por conta e período).
O menu lateral é expansível e abre Movimentações por padrão; o submenu Extrato
bancário abre a consulta de saldos. Cadastre contas em Configurações → Contas
bancárias, informando saldo inicial e sua data. A baixa de um recibo exige conta
e data e gera um débito integral, sem marcar o cheque como sacado.
Somente a tela Cheques registra o saque e gera um crédito de compensação na mesma
conta e pelo mesmo valor, usando a data informada. A baixa continua ativa e passa
a aparecer como compensada. Desmarcar o saque cancela o crédito na data original;
corrigir sua data cancela o crédito anterior e registra outro na data corrigida.
O extrato considera apenas lançamentos ativos: baixas estornadas, compensações
canceladas e seus cancelamentos ficam fora das linhas e dos totais, mesmo quando
o cancelamento ocorre após o período consultado. Os vínculos permanecem no backup
para manter essa regra após restauração. Remova a compensação antes de estornar a baixa.
O botão + registra crédito; Imprimir usa a conta e o período selecionados, com
saldo anterior, totais e saldo acumulado, em A4 paisagem.
Saques antigos são preservados sem gerar créditos automaticamente; confirme sua
data em Cheques para compensá-los depois de vincular a baixa a uma conta.
Marcações antigas de saque são preservadas nos registros, mas não geram baixas
bancárias automaticamente: falta indicar a conta correspondente.

O estorno gera um crédito na conta original, preserva o histórico e devolve o
recibo para pendente. Recibos com baixa ativa não podem ser editados e recibos
com histórico financeiro não podem ser excluídos. Os valores são calculados em
centavos inteiros; o saldo anterior considera movimentações anteriores ao filtro.
O link do recibo abre sua linha em Recibos. Créditos avulsos podem ser registrados
no extrato. Não há conexão automática com bancos.

Contas e lançamentos ficam em `config/receipt-finance` no IndexedDB local. Gravações
são atômicas com os recibos e protegidas contra baixas duplicadas entre abas.
O backup normal e o backup anterior à migração de arquivos incluem o financeiro;
a restauração mescla IDs sem duplicar lançamentos e rejeita conflitos integralmente.

## Restaurar sistema

Em Backup, Restaurar sistema apaga apenas o banco local deste gerador, mediante
confirmação digitando APAGAR. O perfil e a numeração reiniciam no primeiro acesso.
Arquivos nas pastas do computador e bancos de outros sistemas não são apagados.
O popup oferece exportar o histórico antes; esse backup guarda recibos, parceiros
e financeiro, mas o perfil e as preferências precisarão ser configurados novamente.
Abas abertas fecham suas conexões e recarregam ao concluir a restauração.

## Pasta local para PDFs e anexos

Após o cadastro inicial, uma tela pergunta onde salvar os arquivos e abre o
seletor de pastas do computador ao clicar em Escolher pasta no computador.
A pasta escolhida fica salva; não é necessário criar subpastas manualmente.
Quem já tem perfil, mas ainda não escolheu uma pasta, também recebe essa tela.
Escolher depois mantém o armazenamento no navegador e dispensa novos avisos.
Configurações → Destino dos arquivos permite trocar a pasta. Migração e outras
opções ficam recolhidas em Arquivos antigos e outras opções. A seleção usa a API
File System Access no Chrome/Edge de computador. A autorização pertence ao
navegador. Novos arquivos são gravados em PDFs/ e anexos/cheques/, anexos/pix/
etc., com revisão única no nome; arquivos anteriores nunca são sobrescritos.
Os dados, a sequência e as referências continuam no IndexedDB existente.
Sem configuração, o comportamento anterior de armazenamento é preservado.

Copiar antigos cria primeiro um backup completo em Backups/, dividido em partes
importáveis de até 100 MB, e verifica SHA-256 de cada arquivo lido após gravar.
A cópia mantém os blobs originais no navegador. Liberar cópias exige confirmação
e verifica novamente o backup e a igualdade entre os blobs e os arquivos antes
de remover os blobs, recibo por recibo. Falhas mantêm as cópias do recibo afetado;
uma operação parcial pode ser retomada. A sequência não muda na migração.

A emissão em pasta só confirma o registro e consome o número depois da gravação
verificada; falta de permissão ou de espaço interrompe o salvamento, sem trocar
silenciosamente para IndexedDB. Abrir, editar, reimprimir, conferir layouts e
exportar backup leem os arquivos da pasta quando necessário. Backups exportados
incluem os bytes, sem depender dos identificadores de pasta, e podem ser
importados pelo fluxo existente. Arquivos ausentes ou alterados geram erro
sem excluir o histórico. Exclusões no histórico não apagam arquivos do PC.

## Fluxo

1. A tela Recibos abre a grade do histórico, com pesquisa, seleção e ações.
2. O botão + abre um popup de tamanho fixo, ajustado à tela: modelo → pagador → recebedor → emissão → serviço → forma de pagamento → dados do pagamento → comprovante → conferência. Cada avanço tem uma transição de 0,5 segundo. Círculos indicam a etapa atual e marcas verdes as concluídas; comprovante pulado recebe aviso amarelo.
3. O X vermelho oferece sair sem salvar, salvar e sair (com validação completa) ou apenas fechar o aviso e continuar preenchendo. IE, endereço, cidade e CEP ficam ocultos nas etapas dos parceiros, mas continuam preenchidos pelo cadastro e preservados nos dados do recibo.
4. A busca está integrada aos campos nome/razão social do pagador e recebedor. Encontra parceiros locais por nome ou CPF/CNPJ, com ou sem pontuação/acentos, e preenche seus dados.
5. Conferir a prévia em tela cheia e salvar. Abrir o PDF salvo para baixar ou imprimir em A4, tamanho real (100%).
6. O menu Configurações renderiza o próprio PDF produzido pelo gerador, com os dados de um recibo salvo ou dados de exemplo. Clique no texto da página para selecioná-lo, mova com as setas ou botões e ajuste fonte, peso e alinhamento. As áreas de seleção usam as posições medidas durante a geração. A cada alteração, um novo PDF é gerado e renderizado pelo PDF.js local; baixar e abrir para impressão usam exatamente esse arquivo. Salvar layout aplica as preferências por modelo às próximas emissões/edições, sem modificar os PDFs já guardados no histórico. Desfazer e restaurar ficam pendentes até salvar.

A tela Parceiros segue a grade de fornecedores do WeFrotas, com filtros,
ordenação e ações de incluir, editar e excluir. O cadastro abre em popup.
O banco, a agência e a conta do pagador também preenchem os dados do cheque.
Cheque, depósito, PIX e dinheiro possuem formulários condicionais. Os dados
bancários do recebedor cadastrado preenchem o depósito, sem aparecer na etapa
Recebedor. PIX solicita tipo de chave e chave; dinheiro não exige dados extras.
Os PDFs mostram a forma selecionada e seus dados; somente pagamentos em cheque
aparecem no menu Cheques. Recibos antigos sem forma definida são tratados como cheque.
Os modelos de pagamento reutilizam as coordenadas originais, substituindo o
título da seção de cheque por Dados do pagamento e mantendo a assinatura e o anexo.
Os campos obrigatórios e formatos inválidos são destacados em vermelho antes
de avançar. O valor usa máscara de centavos (1 → R$ 0,01; 100 → R$ 1,00).
O status do cheque não aparece no formulário; novas emissões são registradas
como emitidas e alterações preservam o status anteriormente salvo.
CPF/CNPJ recebem pontuação automática e validação dos dígitos verificadores,
incluindo rejeição de sequências repetidas, nos parceiros e nos recibos.

Novos recibos usam uma sequência única para frete e chapa: 0001, 0002, …,
9999, 10000, sem limite fixo de quatro dígitos. O número aparece abaixo do
título do PDF e no histórico. Alterações preservam o número; exclusões não
liberam números já utilizados. Recibos anteriores sem número mantêm o PDF
original e recebem número se forem alterados e salvos novamente.
O contador é local ao navegador e acompanha o backup. Abas simultâneas são
serializadas por Web Locks, e a gravação do contador e do recibo é atômica.
A prévia apresenta o próximo número disponível; ele é confirmado ao salvar.

O histórico permite abrir, alterar e excluir recibos. Alterações preservam o
mesmo identificador e substituem o PDF somente depois de a gravação concluir.
A prévia abre em tela cheia para conferência antes da emissão.

## Persistência

O IndexedDB guarda os dados e o Blob do PDF original, por origem e navegador.
A mesma base local guarda o cadastro de parceiros, o status dos cheques e os
anexos de imagem dos pagamentos. A tela Cheques permite filtrar emitidos e
pagos e abrir o comprovante guardado.
A reimpressão não reconstrói o documento. Exportação e importação JSON incluem
PDFs, empresas e anexos; a importação preserva registros existentes com o mesmo identificador.
O nome interno do banco e da coleção empresas foi preservado para manter os cadastros existentes.
Não há sincronização com Appwrite ou outros dispositivos. A tela informa esse
escopo. A emissão só é confirmada depois da transação de armazenamento concluir.

Os modelos e coordenadas são carregados junto com a página pelo arquivo
modelos/bundle.js. Depois de abrir a tela, gerar o PDF não faz requisições de
rede, mesmo se o servidor local parar. Ao atualizar os modelos, executar
`node recibos-covre/modelos/build-bundle.cjs` para reconstruir esse arquivo.

## Layout

Os dois modelos v1 foram convertidos dos DOCX fornecidos pelo Microsoft Word.
Os dados de exemplo e a imagem do cheque foram removidos do conteúdo dos PDFs.
As posições dos textos fixos foram comparadas com os PDFs originais.
Os modelos partners-v2 removem também os textos fixos do pagador e da declaração,
mantendo as demais posições. Quando o pagador muda, esses textos são preenchidos
com os dados do formulário. Recibos existentes mantêm o PDF salvo; novas emissões
com os dados originais da Covre continuam usando a base v1.
Os campos variáveis usam as coordenadas medidas, Arial e imagens transparentes
sem perda em 288 dpi, incorporadas ao PDF. Isso mantém a aparência na reimpressão,
mas os campos variáveis não são texto selecionável no PDF. A busca usa os dados
salvos no histórico. A fonte Arial precisa estar disponível no dispositivo de
emissão; o navegador utiliza sans-serif se ela não estiver instalada.

O anexo é ajustado proporcionalmente à área disponível. O valor por extenso
quebra automaticamente em até duas linhas, com ajuste de fonte para valores
muito longos, preservando o texto completo e o espaço das próximas seções.
Outros textos que excedem a largura do modelo são bloqueados com aviso, sem corte silencioso. A assinatura
usa o nome do prestador, substituindo o marcador NOME do modelo de frete.

## Validação

Antes de publicar alterações, execute `node recibos-covre/build-release.cjs` a partir
da raiz do projeto e inclua `index.html` e `release.json` na publicação. O comando
versiona os recursos por conteúdo para evitar misturar scripts e estilos antigos.
Abas que já carregaram o verificador de versão avisam quando houver atualização;
formulários abertos não são recarregados automaticamente. Nenhum dado local é apagado.

Testes locais em Chrome cobrem ambos os modelos, anexo, geração, persistência
após recarga, reabertura, busca, backup e restauração em outro contexto,
deduplicação, recuperação de falha de gravação e largura de tela móvel.
As páginas dos PDFs finais foram renderizadas e conferidas visualmente.
Impressão física depende das configurações do driver e não foi executada.

A biblioteca pdf-lib está vendorizada com sua licença em vendor/. O editor usa
PDF.js 5.6.205 local (Apache-2.0), incluindo worker e fontes padrão em vendor/pdfjs/.
Após alterar os PDFs-base, execute modelos/build-static-layout.py para extrair
os limites dos textos e modelos/build-bundle.cjs para atualizar o pacote local.
