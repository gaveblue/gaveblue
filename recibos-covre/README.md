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

## Pasta local para PDFs e anexos

Configurações → Pasta dos recibos no PC permite escolher uma pasta com a API
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

Testes locais em Chrome cobrem ambos os modelos, anexo, geração, persistência
após recarga, reabertura, busca, backup e restauração em outro contexto,
deduplicação, recuperação de falha de gravação e largura de tela móvel.
As páginas dos PDFs finais foram renderizadas e conferidas visualmente.
Impressão física depende das configurações do driver e não foi executada.

A biblioteca pdf-lib está vendorizada com sua licença em vendor/. O editor usa
PDF.js 5.6.205 local (Apache-2.0), incluindo worker e fontes padrão em vendor/pdfjs/.
Após alterar os PDFs-base, execute modelos/build-static-layout.py para extrair
os limites dos textos e modelos/build-bundle.cjs para atualizar o pacote local.
