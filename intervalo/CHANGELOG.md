# Intervalo — CHANGELOG

## 1.2.0-rc.6 — 2026-11-17 · Caixa como central de operações

- Nova home compacta aprovada: resumo da sessão, quatro blocos (Pedidos em aberto, Recebimentos, Pedidos pagos, Delivery e retirada), cabeçalho e navegação por telas internas. Busca local e detalhes acessados por pedido; ações de impressão dentro dos detalhes. Terminologia Pedido na interface do Caixa (modelos de impressão salvos preservados).
- Sessão com data legível e detalhamento por meio de pagamento; valores presenciais mantidos separados de delivery. Formulários em Bottom Sheet com ação no rodapé e orientação Pix contextual. Pagamento online manual também em folha, sem prompt de digitação.
- Reutiliza API, QR Pix, impressão e regras de recebimento existentes; sem alterações no banco ou custos. Contagens e histórico limitados ao recorte da API atual. Atualização manual disponível diretamente nas listas; rodapé das folhas em flex com ação fixa. Teste de navegação com dados simulados e sintaxe verificados; teste real e propagação pendentes.

## 1.2.0-rc.5 — 2026-11-17 · Recibos e QR Pix no caixa

- Caixa presencial: cobrança Pix impressa antes de receber, usando chave de Pix direto já ativada no restaurante e valor parcial ou integral validado pelo servidor. QR estático gerado sem registrar pagamento, biblioteca QR já usada no marketplace, carregada sob demanda; matriz integrada ao PNG térmico e impressão Android.
- Após confirmação manual, opção de abrir recibo individual; reimpressão de recebimentos parciais e quitados. Reutiliza modelo de caixa com título e dados específicos de recibo/Pix editáveis. Não é comprovante bancário, fiscal ou confirmação automática. QR não é reutilizado em recibos pagos.
- Edge restaurant-core v18, sem novas tabelas, serviços pagos ou mudanças no fluxo de pedidos online. Sintaxe e renderização simulada; autenticação real, leitura do QR no banco e impressão física pendentes.

## 1.2.0-rc.4 — 2026-11-17 · Carregamento padronizado da impressão

- Substitui texto antigo e skeleton sem dimensões pelo componente visual compartilhado `iv-loading-inline` / `iv-load-skeleton`, com blocos que antecipam a configuração e a prévia da comanda. Rótulo de carregamento acessível e sem texto visível antigo.
- Atualiza versões dos módulos para evitar cache desatualizado. Sem alterações de modelos, API ou banco. Sintaxe e estrutura verificadas; propagação e teste visual Android pendentes.

## 1.2.0-rc.3 — 2026-11-17 · Personalização ampla da comanda

- Avisos do documento e da amostra editáveis e opcionais; a interface de teste continua identificando a amostra. Formatos dos itens e dos preços, rótulos e campos automáticos ampliados; escolha de exibição de observações, preços, totais, recebido, saldo, rodadas e separadores em ambos os modelos.
- Dados reais, cálculos e pagamentos inalterados; documento continua não fiscal. API restaurant-core v17, compatível com campos ausentes em modelos antigos. Sem alteração de schema ou custos.
- Sintaxe e renderização simulada aprovadas; teste autenticado, propagação e impressão física pendentes.

## 1.2.0-rc.2 — 2026-11-17 · Modelos de impressão personalizáveis

- Dados comerciais e modelos independentes de caixa/cozinha salvos por restaurante; campos automáticos, textos livres, títulos, cabeçalhos, rodapés, labels, separadores e agrupamento por rodada. Totais e itens reais preservados; aviso não fiscal obrigatório.
- Configuração em Bottom Sheet, prévia e teste fictício; mantém PNG compacto, papel 58/80 mm, ajustes locais e impressão manual. Sem novos custos.
- API restaurant-core v16; tabela protegida sem acesso direto para anon/authenticated. QA sintático e simulação; teste físico e login real pendentes.

## 1.2.0-rc.1 — 2026-11-17 · Reorganização da Gestão

- Menu hambúrguer mantido como navegação principal, agrupado por Principal, Operação, Gerenciamento, Canais de venda, Restaurante e Pessoal. Remove barra inferior redundante e mantém ações rápidas no início. Seletor de restaurante por link.
- Horários, entrega/retirada, formas de pagamento e loja online têm destinos próprios integrados à Gestão; resumo semanal dos horários e edição no Bottom Sheet original. Ativação de pedidos fica na Loja online. Pedidos nesta fase são os de delivery/retirada; comandas presenciais continuam em Mesas/Garçom/Caixa.
- Produtos e Estoque ganham centrais de acesso aos cadastros existentes. Submódulos mantêm rotas compatíveis, agora com seções separadas de publicação, categorias e adicionais e navegação própria de Produtos e Estoque. Nenhuma alteração de schema, APIs ou papéis.
- Sintaxe e verificação estrutural; teste visual, navegação e salvamento reais pendentes. Próximas fases: telas internas, unificação de pedidos e Design System.

## 1.1.0-rc.37 — 2026-11-17 · Progresso visual sem numeração

- Cadastro e checkout exibem apenas as barras de progresso, sem legendas de contagem de etapas. A informação de progresso permanece disponível a tecnologias assistivas. Fluxos, validações, pagamento e navegação preservados.
- Sem alteração no banco ou custos; sintaxe e estrutura verificadas, teste visual no Android pendente.

## 1.1.0-rc.36 — 2026-11-17 · Cadastro compacto e checkout em etapas

- Corrige margens herdadas do seletor global `form label` no cadastro, pesos de inputs, placeholders e espaçamento; orientação de nome mais curta, foco inicial no botão fechar.
- Checkout guiado em Bottom Sheets: modalidade, endereço (só entrega), contato, pagamento e revisão. Progresso dinâmico, voltar/continuar fixos, validações por etapa, opcionais recolhíveis. Carrinho editável permanece na página; revisão mostra itens, termos, cotação e confirmação.
- Reutiliza controles do mesmo formulário; preserva APIs, preço/frete no servidor, consentimento, idempotência, InfinitePay e Pix direto. Não modifica Supabase. Sintaxe verificada; teste real de checkout, Android e propagação pendentes.

## 1.1.0-rc.35 — 2026-11-17 · Cadastro compacto em quatro etapas

- Cadastro manual: nome/CPF, senha, contato e endereço/aceite. Acesso já autenticado (Google ou conta existente) pula a senha e mostra três etapas. Progresso, voltar e ações fixas mantidos.
- Menor espaçamento entre campos, inputs com altura mínima de 44 px, endereço organizado em três linhas duplas; complemento e referência opcionais recolhíveis. Conserva valores em memória. No erro de senha fraca do servidor, volta à etapa de senha.
- Sem alteração no banco, autenticação, dependências ou custos. Sintaxe e estrutura verificadas; teste real no Android, propagação e Google pendentes.

## 1.1.0-rc.34 — 2026-11-17 · Acesso e cadastro em Bottom Sheets

- Tela de acesso compacta, login manual em Bottom Sheet e cadastro em uma folha de três etapas, com progresso, rolagem interna, rodapé fixo, voltar/cancelar, gesto de expansão/fechamento e ajuste ao teclado.
- Mostrar/ocultar senha no login, criação e confirmação; senha manual mínima de 6 caracteres no frontend (não restrita a números). Política global do Supabase permanece intacta e pode exigir mais; mensagens de senha fraca orientam o usuário. Senhas não são persistidas localmente pelo formulário.
- Compra visitante e retorno ao checkout preservados; Google ainda depende de configuração. Sem mudanças no banco, dependências ou custos. Sintaxe conferida; teste visual, teclado e cadastro real pendentes.

## 1.1.0-rc.33 — 2026-11-17 · Nome único no cadastro

- Cadastro e edição de perfil usam um único campo Nome, com orientação para nome completo ou social, exibido nos pedidos.
- Novos perfis enviam o nome informado aos campos internos de identificação e exibição já existentes; edição preserva nomes distintos legados. Sem alteração de schema ou exclusão de dados.
- Termos/privacidade e cache dos módulos atualizados; demais etapas e checkout visitante preservados. Sintaxe verificada; teste visual e propagação pendentes. Google continua pendente de configuração.

## 1.1.0-rc.32 — 2026-11-17 · Cadastro do consumidor e endereços

- Onboarding em três etapas: identificação (nome completo/social/no pedido, CPF, senha), contato (e-mail/celular) e endereço/aceite. Senha manual mínima de oito caracteres; não reduz a política do Auth. Google preparado via OAuth; depende de credenciais e redirect allowlist do provedor.
- Tabelas existentes ampliadas com dados de cadastro; RPC autenticada e security invoker valida CPF e celular e grava perfil/endereço inicial na mesma transação. RLS por titular preservada. CPF não enviado ao checkout; não comprova titularidade fiscal.
- Contas antigas completam perfil; endereço salvo pré-preenchido no checkout, com escolha de outros ou preenchimento manual. Compra visitante independente. Histórico de pedidos vinculado à conta permanece pendente.
- Termos/privacidade atualizados como textos de teste, pendentes de revisão jurídica. Sem nova assinatura ou envio de dados a serviços externos. Ao continuar como visitante, limpa o destino de retorno do login. Confirmação de e-mail segue configuração existente; sem sessão, formulário pode precisar ser preenchido novamente.
- Cupons e promoções foram deslocados para versão posterior. QA: sintaxe, CPF e permissões verificadas; Google, confirmação de e-mail, cadastro integral e checkout real pendentes.

## 1.1.0-rc.31 — 2026-11-17 · Busca integrada de restaurantes e produtos

- Busca local imediata por nome, descrição, cidade e tags do restaurante; pesquisa de produtos públicos via API após 500 ms sem digitação e mínimo de 3 caracteres. Correspondência sem acentos e por palavras, sem serviço externo de IA.
- Resultados exibem nomes de até 3 produtos por restaurante e quantidade adicional; ao abrir uma loja com correspondência de produto, a busca é pré-preenchida. Filtros existentes continuam aplicáveis.
- RPC `marketplace_search_products` usa produtos disponíveis e visíveis, restaurantes ativos/publicados e categorias ativas; execução direta restrita ao service_role, retorno limitado a 100 restaurantes. Edge Function marketplace-public v6. Cache volátil limitado a 20 consultas por 60 s, sem guardar catálogos completos.
- Busca do cardápio também ignora acentos e ordem de palavras. Nenhum plano pago ativado. Sintaxe e consulta SQL real conferidas; teste de interface e propagação pendentes.

## 1.1.0-rc.30 — 2026-11-17 · Nova home do marketplace

- Home pública com seleção de cidade, campo de busca, banner compacto, categorias visuais, filtros e cards com capas/logos reais. Gestão removida da navegação do consumidor, mantida em `/intervalo/inicio`.
- Favoritos e cidade persistidos localmente; busca e filtros sobre dados públicos retornados, sem requisição por toque. Categoria usa tags/nome/descrição da vitrine; busca não indexa os produtos de cada loja. Ícones de comida e banner são arte vetorial local (sem fotos externas); notificações ainda sem serviço ativo.
- API marketplace-public v5 adiciona capa e disponibilidade de checkout calculada a partir de horários, fuso, configuração e zonas, com consultas em lote. Nenhuma nova tabela/recurso pago; checkout continua validando no servidor.
- Início e Buscar têm destinos diferenciados; Busca abre o campo. Sintaxe verificada; homologação visual e testes reais pendentes.

## 1.1.0-rc.29 — 2026-11-17 · Padrão de cardápio no Garçom

- Mesas: agrupamento de opções compartilhado com a vitrine, miniaturas quadradas compactas, preço à direita junto da ação, prévia da foto e descrição no detalhe. Mantém fluxo de comanda existente.
- Delivery/retirada: usa o mesmo agrupador e seletor de variantes, busca, categorias e ícones de grade/lista com preferência compartilhada com o salão, fotos e preço inicial. Carrinho conserva ID e preço da variação escolhida. Mantém elegibilidade de venda online e controles do servidor.
- Busca do delivery filtra DOM sem reconstruir fotos a cada tecla. Atualização silenciosa do garçom não reconstrói tela durante os painéis de pedido/variação/delivery abertos.
- Sem alteração no banco ou nos preços; sintaxe verificada, testes reais Android/propagação e pedidos completos pendentes.

## 1.1.0-rc.28 — 2026-11-17 · Variações de produtos

- Cadastro de produtos com variação opcional e atalho para criar outra opção (mesmo nome-base/categoria, preço próprio). Agrupa por restaurante, categoria e nome-base; cada opção mantém ID, nome completo, preço, disponibilidade e ficha técnica independente. Para agrupar um produto já existente, edite-o e preencha sua variação também.
- Loja e Garçom (mesas): mostram card único por grupo e menor preço; escolha obrigatória em painel antes de abrir a seleção do item. Cardápio de consulta apresenta tamanhos e preços. Delivery interno/checkout continuam operando sobre IDs individuais e nomes completos.
- Supabase: migration `menu_product_variants_rc28`, colunas opcionais `variant_group_name` e `variant_label`, unicidade por restaurante/categoria/grupo/variação; funções restaurant-core v15, public-menu v6, marketplace-public v4 implantadas. Sem alteração em pedidos já gravados.
- Cache público inclui somente os metadados públicos novos. Sintaxe e agrupamento simulados; cadastro, pedido completo, fichas técnicas e publicação no domínio pendentes de homologação real.

## 1.1.0-rc.27 — 2026-11-17 · Miniaturas compactas no cardápio

- Modo lista da loja e do cardápio público: fotos quadradas de 56 px no celular e 64 px em telas maiores, com recorte central e dimensões independentes do arquivo original. Cards compactos, descrição em até duas linhas e preço laranja alinhado à direita.
- Seleção do produto na loja: prévia da foto em quadro quadrado de até 190 px, preservando proporção, legenda discreta “Imagem meramente ilustrativa” e preço à direita do título. Sem foto ou com erro, omite a prévia.
- Mantém carregamento preguiçoso das fotos da lista, reutiliza a URL original, preserva grade/lista e cache RC26; sem novas dependências ou alterações no banco.
- Sintaxe JavaScript verificada; teste visual no Android e propagação pendentes.

## 1.1.0-rc.26 — 2026-11-17 · Cache público por restaurante

- Loja e cardápio de consulta exibem a última resposta pública válida (até 15 min na abertura) enquanto consultam o servidor. Primeira visita continua consultando a API; cada acesso revalida.
- Cache local separado por slug e canal, limitado a 8 entradas de até 180 mil caracteres; guarda campos públicos selecionados, URLs das fotos (não binários), sem sessão, pedidos, dados de cliente ou status de checkout.
- Vitrine em atualização bloqueia ações de compra e oculta carrinho até resposta atual. Falha mantém aviso e botão de nova tentativa; publicação negada remove o cache. Preferências e busca/filtro preservados durante atualização.
- Rota de cardápio público não espera consulta de usuário autenticado. Sem alterações no Supabase.
- QA: análise sintática e testes simulados de cache; validação visual Android, tempo real de carregamento e propagação pendentes.

## 1.1.0-rc.25 — 2026-11-17 · Navegação pública e cache

- Rota explícita validada antes da inicialização; rota legada não sobrescreve destino explícito ou navegação direta.
- Início, Buscar e links de lojas do marketplace passam pela entrada única versionada; Início continua apontando para Explorar.
- Entradas estáticas de Explorar e Novo Mundo atualizadas; service worker recarrega navegações públicas pela rede, sem armazenar respostas autenticadas.
- QA: análise sintática e simulação de rotas com objetos de navegador simulados; propagação e teste real no PWA pendentes.

## 1.1.0-rc.24 — 2026-11-17 · Ícones de visualização do cardápio

- Loja pública e cardápio digital: substitui os textos Lista/Grade pelos mesmos SVGs `bars` e `dashboard` (19 px), na mesma ordem e com o mesmo estilo compacto do Garçom.
- Mantém rótulos acessíveis, títulos, indicador de seleção e preferência gravada por restaurante. Nenhuma mudança na lógica de pedidos ou banco de dados.
- Cache JS/CSS atualizado; sintaxe verificada. Teste visual no Android e propagação do domínio pendentes.

## 1.1.0-rc.23 — 2026-11-17 · Vitrine pública reorganizada

- Capa ampla sem margens laterais no celular, logo quadrada com cantos arredondados sobreposta à transição da capa, nome e dados abaixo em painel branco.
- Status único baseado na disponibilidade real do checkout, pedido mínimo quando configurado, localização quando cadastrada e botão Informações com horários e modalidades reais.
- Busca por botão sobre a capa; área de busca expansível. Removidos da vitrine do consumidor os controles de prévia e Gestão; navegação inferior, filtros, grade/lista e carrinho preservados.
- Ajuste visual para nomes que coincidem com o slug, sem alterar o cadastro.
- Sem mudanças no Supabase ou em pagamentos. Cache dos módulos da vitrine atualizado.
- Validação: sintaxe JavaScript conferida; teste visual no navegador/Android e propagação do domínio pendentes.

## 1.1.0-rc.22 — 2026-11-16/17 · Edição de insumos/categorias, vitrine e grade/lista

**Status:** GitHub `main` atualizado; `restaurant-core` v14 ativa no Supabase; parser JavaScript aprovado. **Pendente:** comprovação da propagação no site e testes de interação reais no Android.

- **Insumos:** editar nome, unidade e mínimo, arquivar/restaurar sem apagar movimentos; impedir arquivamento e mudança de unidade quando houver ficha técnica vinculada.
- **Categorias:** editar nome/ordem, ocultar/exibir e excluir categorias vazias; categorias vinculadas a produtos ficam protegidas.
- **Vitrine:** acesso direto aos controles de logo/capa dentro de Gestão > Vendas Online > Vitrine, usando o editor de mídia existente.
- **Cardápio público e loja:** alternância grade/lista responsiva, com preferência gravada localmente por restaurante.
- **Publicação:** URLs de módulos e estilos atualizadas para `1.1.0-rc.22`, sem GitHub Actions.
- QA detalhado em `QA-1.1.0-RC22-EDICAO-CARDAPIO.md`.

## 1.1.0-rc.21 — 2026-11-16 · Logo e capa na vitrine do restaurante

**Status:** arquivos do GitHub `main` atualizados; `marketplace-management` v5 implantada; verificação sintática aprovada. **Pendente:** conferir propagação do domínio, testar upload e biblioteca no Android, homologar aparência da vitrine.

- **Gestão > Vendas Online > Vitrine:** configuração de logo/foto de perfil e imagem de capa, com pré-visualização, envio otimizado, escolha da biblioteca de fotos e remoção de vínculos.
- **Loja pública:** capa horizontal no topo, logo do restaurante e apresentação padrão quando não houver imagem.
- Reutiliza bucket `intervalo-product-images` e sua autorização assinada; arquivos de biblioteca existentes podem ser associados sem novo upload.
- Campos `restaurant_storefront.logo_url` e `banner_url` já existiam; nenhuma migração, módulo pago ou GitHub Actions.
- Backend `marketplace-management`: valida URLs HTTPS e mantém compatibilidade com clientes antigos, sem alterar pedidos e pagamentos.
- QA: `QA-1.1.0-RC21-VITRINE.md`.
- Backlog comercial: backups externos, monitoramento avançado e simulações de desastre adiados para fase de preparação para comercialização.

## 1.1.0-rc.20 — 2026-11-16 · Biblioteca de fotos reutilizáveis dos produtos

**Status:** GitHub `main` atualizado; Edge Function Supabase `restaurant-product-photos` v2 ativa e isolada por restaurante. **Pendente:** homologação visual no Android e confirmação da publicação no domínio.

- **Biblioteca** dentro dos formulários de **Cadastrar produto** e **Editar produto** em Gestão → Estoque e Produtos → Produtos, além dos botões Enviar foto, Câmera, Remover e link HTTPS.
- A biblioteca oferece grade de miniaturas, busca pelo nome dos produtos associados, filtros **Todas / Enviadas / Em produtos**, contador de reutilizações e carregamento paginado.
- As fotos já enviadas para `intervalo-product-images` e os URLs já utilizados por produtos daquele restaurante passam a aparecer na biblioteca. Assim não é necessário reenviar imagens existentes.
- Um toque na imagem aplica a **mesma URL** em outro produto; ao Salvar, o sistema reutiliza o mesmo arquivo, sem criar cópias e sem aumentar o uso de Storage. Vários produtos podem referenciar a mesma foto.
- Remover a foto do produto desassocia apenas o produto editado: **não exclui o arquivo compartilhado**, evitando quebrar outras fichas de produtos.
- `restaurant-product-photos` recebeu ação `list` após autenticação e validações Master/Gerente + permissão Gestão; lista **somente** o prefixo `{restaurant_id}/` no bucket e produtos do mesmo restaurante. Nenhuma permissão de escrita foi ampliada e a `service_role` continua exclusiva do servidor.
- Novo módulo `product-image-library-rc20.js` e CSS responsivo; `product-photo-rc19.js`, `support.js` e `index.html` atualizados com cache rc.20.
- Verificação do Supabase: bucket já possuía **1 foto** e Novo Mundo possuía **1 foto associada a produto**, que passam a alimentar a biblioteca sem migração.
- QA registrado em `QA-1.1.0-RC20-BIBLIOTECA-DE-FOTOS.md`. Nenhuma tabela de produtos, pedido, estoque ou pagamento foi modificada.
- Compartilhamento automático entre restaurantes distintos **não** foi ativado; a biblioteca é do restaurante para manter isolamento multiempresa. Nenhum serviço pago/GitHub Actions foi ativado.

## 1.1.0-rc.19 — 2026-11-16 · Fotos dos produtos por câmera/galeria + armazenamento Supabase

**Status:** GitHub `main` atualizado; bucket Storage e Edge Function implantados; QA sintático, segurança e simulação aprovados. **Pendente:** confirmar propagação no domínio e testar envio real pelo Android antes de homologar.

- O cadastro de produtos em **Gestão → Estoque e Produtos → Produtos** passou a oferecer **Enviar foto**, **Câmera**, **Prévia** e **Remover**, além da URL HTTPS direta existente (agora em seção recolhível). Disponível em criação e edição, nos Bottom Sheets.
- Nova biblioteca `product-photo-rc19.js` e estilo `product-photo-rc19.css`: fotos de origem até **16 MB** são reduzidas a **até 1.400 px** e convertidas para **JPEG até 1,5 MB**, para reduzir consumo de dados, preservar rapidez do cardápio e evitar arquivos enormes. Formatos de origem dependem da capacidade de decodificação do navegador.
- Envio acontece ao **Salvar** produto: foto otimizada vai ao Supabase Storage; o endereço público é gravado pelo backend existente `restaurant-core`, sem alterar preço, disponibilidade, estoque ou permissões.
- Nova migração `product_photo_storage_rc19`: bucket público somente para leitura `intervalo-product-images`, com MIME `image/jpeg` e máximo **1.500.000 bytes** por objeto. Sem políticas de upload direto para `anon`/`authenticated`.
- Edge Function **`restaurant-product-photos`** com JWT obrigatório e token temporário de upload, restrito ao restaurante e usuário Master/gerente com Gestão ativa; caminho aleatório por restaurante; limite de solicitações por usuário. Nenhuma credencial privilegiada fica no frontend.
- Campo alternativo de URL continua aceitando links HTTPS diretos, com prévia e aviso quando o navegador não consegue carregá-los; links de páginas privadas/Instagram/Drive continuam não sendo imagens diretas.
- Cards do Estoque, Catálogo e Marketplace mostram placeholder quando imagens antigas externas falham, em vez de imagem quebrada. Garçom e cardápio público preservaram seus fallbacks existentes.
- `index.html` atualizado para carregar `estoque`, `catalogo` e `marketplace-preview` em **rc.19**. Registros técnicos em `QA-1.1.0-RC19-FOTOS-PRODUTOS.md`.
- QA: sintaxe JS dos módulos e ponto de entrada aprovada, **21/21** verificações de integração e **6/6** casos de URL; simulação de conversão para JPEG aprovada; bucket e restrições de escrita auditados.
- Sem nova assinatura ou serviço pago: armazenamento consome a cota Supabase existente. Arquivos antigos substituídos não são apagados automaticamente nesta fase. Não foram usados GitHub Actions.

## 1.1.0-rc.18 — 2026-11-16 · Loja Online integrada à Gestão como Vendas

**Status:** alterações integradas ao GitHub `main` e QA de sintaxe aprovado. **Pendente:** confirmar a publicação no domínio e testar a navegação completa no Android com perfil Master ou gerente.

- A Loja Online deixa de aparecer como plataforma separada dentro do sistema: a **Gestão** passa a ter a área **Vendas online** no menu lateral e o atalho **Vendas** na barra inferior, mantendo a identidade do painel do restaurante.
- **Quatro seções internas**: **Pedidos** (fila, aceite e andamento), **Entregas** (horários, regiões e taxas), **Vitrine** (dados da loja e exposição no marketplace) e **Pagamentos** (ativação de pedidos, Pix manual e InfinitePay). As áreas ficam separadas, sem a rolagem longa da tela antiga.
- Vendas reaproveita o frontend `online-management-rc1.js`, agora com opção de incorporação `embedded`. O cabeçalho e a navegação duplicados deixam de aparecer no modo Gestão; APIs e permissões existentes permanecem.
- A Visão geral da Gestão ganhou cartão **Vendas online**, com pendências e andamento consultados pelo serviço `marketplace-operations`, e botão **Abrir vendas**. O menu **Mais** também abre diretamente a aba Vendas.
- O endereço antigo `/intervalo/{restaurante}/vendas-online` redireciona para `/intervalo/{restaurante}/gestao?tab=vendas` após validação de acesso. Favoritos antigos não ficam quebrados.
- Os links do cardápio digital e marketplace públicos **não foram alterados**; clientes ainda compram pelo link normal. Pedidos, taxas, meios de pagamento e regras de estoque não sofrem migração.
- CSS do `management-design-rc11.css` e `online-management-rc1.css` atualizado para integrar os cards e botões à estética da Gestão, inclusive no celular. Versionamento atualizado para rc.18.
- Verificação técnica: sintaxe JavaScript do painel, do módulo online e da entrada principal aprovada. QA documentada em `QA-1.1.0-RC18-VENDAS-NA-GESTAO.md`. Nenhum serviço pago ou GitHub Actions utilizado.

## 1.1.0-rc.17 — 2026-11-16 · Garçom: Cardápio em lista/grade + pedidos delivery e retirada

**Status:** atualizado no GitHub `main`; migração Supabase aplicada, Edge Function ativa e testes técnicos com rollback aprovados. **Pendente:** conferir propagação no domínio e homologar o fluxo real no Android, com perfil Garçom.

- **Cardápio:** criado seletor de visualização **Lista / Grade**. Padrão inicial em lista (produto em linha horizontal com foto, nome, preço, descrição e botão de adicionar); a preferência fica salva no navegador em `intervalo.waiter.catalog.layout.v1`. Busca, filtros e seleção de mesas preservados.
- **Delivery e retirada:** botão **Novo delivery ou retirada** na área de Mesas e atalho em Ações rápidas. Formulário móvel independente da mesa para selecionar produtos, quantidades e observações, cliente, celular, modalidade, região/endereço, pagamento previsto e confirmação.
- O funcionário escolhe **dinheiro, Pix ou cartão no recebimento**, sem processar ou confirmar pagamentos automaticamente. Ao finalizar recebe código e link de acompanhamento do pedido.
- Pedido gravado em `online_orders` e `online_order_items`, com evento de auditoria (`origin=garcom` e funcionário responsável), status `accepted` e pagamento `unpaid`. Não usa mesa fictícia e não atribui aceite de termos do consumidor.
- Backend: migração `marketplace_staff_orders_rc17` (RPC `marketplace_staff_place_order`) com transação atômica, idempotência e execução restrita a `service_role`, além da Edge Function `marketplace-staff-orders` autenticada, `verify_jwt=true`, validando membro ativo, papel e módulo Garçom.
- Precificação, regiões, taxas, disponibilidade e horários reaproveitam as regras de `marketplace_quote_order`. O aceite usa `marketplace_transition_order`, mantendo a reserva/baixa de estoque e a fila unificada da Cozinha.
- Status de infraestrutura: os testes transacionais de delivery e retirada no `novo-mundo` chegaram a `accepted` e foram revertidos sem persistir registros de teste; privilégios conferidos (`service_role=true`, `authenticated=false`, `anon=false`).
- QA sintático de JS, verificação do ponto de entrada e 15 verificações estáticas aprovados. Documentação em `QA-1.1.0-RC17-GARCOM-DELIVERY.md`.
- O pedido atendido pelo Garçom exige Loja Online publicada e operante; pedidos fora do horário ou com loja pausada seguem as validações atuais e podem ser recusados. Nenhum GitHub Actions foi utilizado.

## 1.1.0-rc.16 — 2026-11-16 · Impressão configurável e cupom compacto para Android

**Status:** atualizado no GitHub `main`; testes técnicos e Canvas aprovados. **Impressão real na GAO MPT-II e disponibilidade em gaveblue.com.br ainda pendentes de validação no celular.**

- Problema confirmado no fluxo anterior: a prévia nativa do serviço de impressão Android pode apresentar página longa, mesmo quando `@page` solicita um cupom curto. O sistema web não controla o tamanho da janela do spooler.
- Criado `thermal-receipt-rc16.js`: prévia própria com comprovante recortado e ação principal **Compartilhar cupom compacto**. O conteúdo é convertido em PNG com largura de 384 px (58 mm) ou 576 px (80 mm) e altura proporcional aos itens, evitando enviar uma folha gigante como imagem.
- A opção de compartilhamento abre o menu nativo Android para enviar a PNG ao aplicativo térmico compatível; se o navegador não suportar `navigator.share({files})`, há alternativa **Salvar imagem**. Mantida **Impressão do Android**, com aviso de que o serviço ainda pode incluir branco.
- Ajustes configuráveis e salvos no próprio aparelho: largura 58/80 mm, tamanho de fonte, margens laterais e avanço final de papel.
- Cozinha, Caixa e módulo **Impressão** carregam a nova versão. Criado botão **Configurar e imprimir teste** na área de Impressão, sem operação de banco de dados nem cobranças.
- QA técnico: sintaxe JS válida nos módulos, importações conferidas, canvas 58 mm com 1 pedido `384×388 px` e com vários itens `384×2152 px`; Canvas 80 mm também cresceu corretamente. Registro: `QA-1.1.0-RC16-IMPRESSAO-CONFIGURAVEL.md`.
- Não habilita impressão automática nem modifica permissões, lançamentos ou pedidos. Sem GitHub Actions.

## 1.1.0-rc.15 — 2026-11-16 · Cupom térmico 58 mm com altura conforme conteúdo

**Status:** atualizado no GitHub `main`, QA sintático e simulado aprovado; **impressão Android real e publicação final no domínio ainda pendentes de conferência**.

- Corrigido o cupom de pedidos da Cozinha que estava sendo visualizado com texto pequeno e uma enorme faixa em branco na prévia do Android.
- Criado `thermal-receipt-58mm-rc15.js`, gerador de cupom manual compartilhado entre Cozinha e Caixa. Padrão físico de **58 mm**, conteúdo interno de 49 mm e fontes dimensionadas para impressora térmica.
- A `@page` da impressão recebe altura dinâmica calculada a partir do conteúdo efetivo, com mínima folga de corte. Isso evita predefinir uma página longa mesmo para um pedido com um único item, na medida do suporte pelo navegador/serviço de impressão.
- Identificador de comanda mostrado abreviado no cupom, sem modificar UUID ou dados de pedidos. Produtos, observações, rodadas, valores e avisos de documento interno preservados.
- Botão **Imprimir / PDF** permanece manual e não aparece no papel. Cache de `kitchen.js` e `cash.js` atualizado para rc.15.
- QA: sintaxe JS dos três módulos aprovada; teste simulado de `scrollHeight=314px` produziu página de **58 × 89 mm**. `QA-1.1.0-RC15-IMPRESSAO-58MM.md` contém checklist.
- Impressão no dispositivo real ainda depende do Android e do serviço escolhido respeitarem o tamanho de página solicitado. Não ativada impressão automática; sem GitHub Actions.

## 1.1.0-rc.14 — 2026-11-16 · Máscaras automáticas e teclado móvel

**Status:** atualização aplicada no GitHub `main`. QA de funções e conversores aprovado. **Pendente teste real no navegador/Android e confirmação da propagação em gaveblue.com.br.**

- Criado o componente global `form-enhancements-rc14.js`, carregado no `index.html` e aplicado por delegação de eventos a formulários comuns e dinâmicos, incluindo bottom sheets.
- Valores monetários formatados durante a digitação no padrão brasileiro: `0,01`, `24,90`, `1.234,56`. Máscara preserva centavos e grupo de milhar, aceita colagem e permite apagar o campo.
- CPF, CNPJ, CEP e celular/fixo com formatação automática. O login misto e-mail/CPF identifica o formato sem tratar e-mails como números.
- Mantidas exceções importantes: chave Pix genérica, quantidades de estoque, medidas fracionárias, assentos, minutos e campos de senha não recebem máscaras inadequadas.
- Conversores de valores em `support.js`, `catalog.js`, `cash.js` e `online-management-rc1.js` passaram a aceitar o separador de milhar e a devolver o valor original em centavos.
- Criado `form-enhancements-rc14.css` com melhor visualização ao abrir o teclado virtual: rolagem ao campo focado, espaço de viewport, tamanho de texto adequado, navegação entre campos e ocultação temporária de barras fixas que poderiam sobrepor conteúdo.
- Cache atualizado para módulos modificados; Gestão/Conta/Garçom/Checkout/Cliente também recebem máscara global no `index.html`.
- QA: 14/14 formatações, 19/19 detecções de campos, quatro conversores `1.234,56 → 123456` e análise sintática do código. Registro: `QA-1.1.0-RC14-FORMULARIOS.md`.
- Nenhum pagamento, alteração de permissões, banco de dados ou Edge Function nesta revisão. GitHub Actions não utilizado.

## 1.1.0-rc.13 — 2026-11-16 · Correção do bottom sheet Ações rápidas na Gestão

**Status:** código atualizado no GitHub `main`, com verificação sintática do JavaScript e conferência de estilos, rotas e cache. **Teste visual no Android e propagação no domínio ainda pendentes.**

- Corrigido o bug de alinhamento mostrado no celular: o CSS antigo dava `flex:1` aos três `span` de cada opção, deslocando o título e a seta para o meio do bottom sheet e deixando uma área vazia à direita.
- Cada ação passa a ter **ícone com largura fixa, título/descrição flexível e seta alinhada à direita**, sem colunas artificiais.
- Bottom sheet responsivo com altura máxima limitada, lista rolável, tamanho de toque adequado e respeito à área segura do Android.
- Ações rápidas passam a exibir Garçom, **Cozinha**, **Caixa**, Mesas, Cardápio e Estoque de acordo com permissões já existentes; `Mais` conserva as opções administrativas.
- A alça superior permite fechar deslizando para baixo; fechamento por X, toque no fundo e Escape permanece.
- Atualizado cache do módulo Gestão em `index.html` (`management.js?v=1.1.0-rc.13`) e CSS isolado (`management-design-rc11.css?v=1.0.0-rc.13`).
- Não há mudanças na autenticação, pedidos, Pix, caixa, estoque ou políticas Supabase. Sem GitHub Actions.

## 1.1.0-rc.11 — 2026-11-16 · Pedidos da Loja Online integrados à Cozinha

**Status:** correção no código publicada na `main`; validação sintática, simulação visual e teste transacional SQL concluídos. **Publicação no domínio e teste visual em celular ainda não confirmados.**

- O KDS passa a exibir pedidos online aceitos diretamente em **Novos pedidos**, seguindo para **Em preparo** e **Prontos**, nas mesmas colunas dos pedidos presenciais, sem criar mesa fictícia.
- Tickets online exibem código do pedido, itens/quantidades/observações e marcador **DELIVERY** ou **RETIRADA**. Ações **Iniciar preparo** e **Marcar pronto** mantêm a atualização de status na API `marketplace-operations`.
- A consulta da Loja Online e das comandas presenciais deixou de ser dependente da mesma falha. Se uma API falhar, os pedidos da outra permanecem visíveis.
- Erros da API de pedidos online, antes silenciados, agora aparecem com aviso na Cozinha e opção de atualizar; não é mais exibido `Nenhum pedido` como se a consulta tivesse funcionado.
- Cache da rota Cozinha atualizado para `kitchen.js?v=1.1.0-rc.11`. Atualização automática mantida a cada 15 segundos.
- QA: parse JS OK; simulação com pedidos `accepted`, `preparing`, `ready_for_pickup` passa, e `pending_acceptance` não aparece na produção; erro de API gera aviso; transação de banco percorreu aceite, preparo e pronto com item disponível na fila, revertida por `ROLLBACK`.
- Diagnóstico: o histórico do Novo Mundo mostra um pedido aceito em 16/11/2026 que foi cancelado posteriormente; nenhum pedido online aceito ativo estava disponível na inspeção para teste visual real. Não houve alteração do status de pedidos reais.
- Pix manual/InfinitePay, caixa, gestão de funcionários, estoque e mesas não alterados nesta revisão. Sem GitHub Actions.

## 1.1.0-rc.10 — 2026-11-16 · Pix direto do restaurante (10 minutos)

**Status:** funções e agendamento ativos no Supabase; interface e gestão atualizadas no GitHub `main`; **não homologado com chave Pix e pagamento real**.

- Pix estático gerado no servidor conforme BR Code do Banco Central, com valor exato do pedido, txid único, QR Code renderizado no navegador e Pix Copia e Cola.
- O checkout passa a usar Pix direto como primeira opção **quando o Master cadastrar e habilitar** chave Pix + nome/cidade do recebedor. InfinitePay continua como alternativa, sem desativação nem alteração da chave previamente configurada.
- No acompanhamento, o cliente vê contador de 10 minutos e botão **Já paguei**. O aviso antes do vencimento suspende o cancelamento até a conferência; o aviso por si só nunca marca a compra como paga.
- Gestão → Loja Online ganhou card **Pix direto do restaurante** (chave armazenada em tabela privada com RLS, não no bundle). Apenas Master pode configurar; card não retorna a chave completa após o cadastro.
- O responsável vê **Conferi o Pix · aceitar pedido** para pedidos sinalizados como pagos, após confirmar o crédito no extrato; a confirmação financeira e o aceite são gravados atomicamente no banco. A fila atualiza a cada 15 s.
- Sem sinalização de pagamento até 10 minutos, o pedido fica **expirado**, com evento de cancelamento, por `pg_cron` a cada minuto. Operações de aceite impedem confirmação indevida sem pagamento.
- **Limitação fundamental:** QR Pix estático não expira no banco do pagador: apenas o pedido expira no Intervalo. Pix pago após cancelamento exige conciliação/reembolso manual. Não há consulta bancária automática.
- QA: validação sintática JS; simulação SQL transacional de expiração, sinalização e aceite com `ROLLBACK`; cron ativo; 0 pedidos fictícios persistidos; 0 restaurantes com chave Pix manual cadastrada. Teste em banco real ainda não realizado.
- **Sem GitHub Actions**. Migração reprodutível: `source/supabase/migrations/20261116_marketplace_manual_pix_rc10.sql`. Interface web precisa da propagação e teste em celular.

## 1.1.0-rc.9 — 2026-11-16 · Checkout Pix InfinitePay — Novo Mundo

**Status:** estrutura ativa no Supabase e código publicado no GitHub `main`. **Compra real, confirmação de webhook e propagação do domínio ainda não homologadas.**

- Loja `novo-mundo`: gateway InfinitePay habilitado com `secret_env_name=INFINITEPAY_NOVO_MUNDO_API_KEY`, sem registrar a credencial em SQL, repositório ou navegador; InfiniteTag salva no cadastro do restaurante.
- Edge Function `marketplace-infinitepay` criada: gera links via `/links`, controla idempotência, expiração em 30 minutos e valida pagamentos com `/payment_check` antes de registrar o pedido como pago. Webhook público sem assinatura é conferido exclusivamente no provedor.
- Inclusão de `infinitepay` como meio de pagamento antecipado; permanece separado de Pix/cartão/dinheiro na entrega ou retirada. Pedidos antecipados não podem ser aceitos sem pagamento `paid` verificado.
- Checkout mobile mantém bottom sheet e botão inferior fixo; para Novo Mundo oferece pagar agora, redireciona ao checkout seguro InfinitePay e traz o cliente ao acompanhamento. Tela de acompanhamento mostra status e opção de retomar cobrança.
- O valor cobrado é calculado dos itens persistidos no banco e frete do pedido; cliente não informa o valor. Pagamento confirmado é registrado uma vez, com referência de transação e evento auditável.
- Limitação documentada da InfinitePay: não fornece QR Code/Pix Copia e Cola via API e não permite checkout embutido. Também não permite desabilitar cartão no checkout hospedado.
- Sem GitHub Actions. Precisa comprovar atualização em `gaveblue.com.br`, testar link real de pelo menos R$ 1,00, retorno, webhook, reenvio, valor e aceite na Gestão/Cozinha, antes de declarar homologação.

## 1.1.0-rc.8 — 2026-11-16 · Estrutura InfinitePay para Novo Mundo

**Status:** migração aplicada, API administrativa ACTIVE, arquivos na branch main. **Não há cobranças nem links gerados. Publicação no domínio e teste de cadastro ainda pendentes.**

- Criadas 3 tabelas para configuração por restaurante, tentativas de pagamento e eventos, com RLS e sem acesso direto ao navegador.
- Preparado apenas novo-mundo com referência ao segredo INFINITEPAY_NOVO_MUNDO_API_KEY; gateway enabled=false e nenhuma InfiniteTag cadastrada.
- Implantada a Edge Function marketplace-payments-admin com JWT, validação de vínculo por restaurante e mutações Master-only.
- Inserido card de status e conexão InfinitePay na Loja Online com bottom sheet; cache do módulo e estilos versionado em rc.8.
- A chave API deve ser cadastrada em Supabase Edge Functions Secrets e jamais aparece no navegador ou banco.
- **Não alterou o checkout, pedidos, estoque, comandas ou permissões existentes.** Não gera links nem valida pagamentos até etapa futura.
- Sem GitHub Actions. Guias: INFINITEPAY-NOVO-MUNDO-CONEXAO-RC8.md e QA-MARKETPLACE-1.1.0-RC8-INFINITEPAY.md.


## 1.1.0-rc.7 — 2026-11-16 · Checkout mobile-first com bottom sheets

**Status:** arquivos publicados no GitHub `main`; simulação de renderização e de cotação/confirmar pedido aprovadas. **Testes reais no site, com teclado e toque em Android, pendentes.**

- Substituído o checkout de formulário longo por cards organizados e resumo de valores, mantendo botão principal fixo no rodapé e carregamento com skeleton próprio desde a rota inicial.
- Incorporados **bottom sheets arrastáveis** para endereço, contato e pagamento; abrem parcialmente e expandem ao arrastar para cima, mantendo os dados associados ao formulário único.
- Mantida a compra como visitante, endereços salvos de clientes cadastrados, modalidade entrega/retirada, autorização de marketing opcional, termos obrigatórios, frete e valor calculados no servidor.
- Validação de endereço e contato abre o painel pertinente e indica o campo a corrigir, em vez de deixar um erro apenas no rodapé.
- A cotação `marketplace-online/quote` e confirmação `marketplace-online/place` preservam contrato e idempotência anteriores.
- Alterado import de rota do checkout para `marketplace-checkout-rc7.js?v=1.1.0-rc.7` e estilos isolados em `marketplace-checkout-rc7.css`.
- **Sem alterações no backend ou em restaurantes, estoque, caixa, funcionários e pedidos existentes.** Sem GitHub Actions.
- **QA:** `QA-MARKETPLACE-1.1.0-RC7-CHECKOUT.md`.


## 1.1.0-rc.6 — 2026-11-16 · Loja Online redesenhada e carregamento unificado

**Status:** alterações de frontend na `main`; validação sintática e renderização simulada aprovadas. **Propagação no domínio e homologação em navegador ainda pendentes.**

- Reorganizada a Loja Online em vitrine, operação e regiões, recebimento e pedidos, com indicadores reais e ações compactas.
- Removido o antigo aviso fixo de "marketplace em preparação" e os rótulos estáticos de pedidos desligados; os estados são exibidos conforme retorno de `marketplace-management`.
- Formulários e ações originais preservados em bottom sheets já padronizados no Intervalo.
- Substituído o loader interno `iv-loading-inline` por skeletons que imitam o layout final; a abertura inicial da rota `vendas-online` também adota o mesmo esqueleto.
- CSS mobile-first, hierarquia visual da Gestão, ícones locais e estados vazios padronizados.
- Cache dos imports de Loja Online, CSS e primeira tela renovado com `?v=1.1.0-rc.6`.
- **Sem alteração de banco, roles, funcionários, cardápio, pedidos, estoque ou flags de vendas.** GitHub Actions não usado.
- **QA:** `QA-1.1.0-RC6-LOJA-ONLINE.md`.


## 1.1.0-rc.5 — 2026-11-16 · Conta opcional do consumidor

**Status:** banco e código enviados à `main`; RLS e sintaxe verificados. **Acesso real por navegador, propagação HTTP e homologação comercial pendentes.**

- Criada área do cliente em `/intervalo/cliente`, com registro/login de consumidor por e-mail, sessão independente da equipe, perfil e gestão de até 20 endereços (editar/excluir).
- Implementado preenchimento de nome/celular/endereço salvo no checkout, sem retirar a possibilidade de comprar como visitante. Região e frete continuam calculados por loja.
- Migração `marketplace_customer_accounts_rc5` aplicada no Supabase com políticas de RLS por `auth.uid()` para perfis e endereços; visitantes não acessam dados pessoais e IDs de propriedade não são editáveis.
- Corrigido o retorno do checkout para não usar um slug inválido em `href`.
- Preservados os acessos dos funcionários, Gestão, Garçom, Cozinha, Caixa e comandas presenciais; sem GitHub Actions e sem ativar lojas para pedidos.
- **Limites:** histórico de compras da conta e vínculo `customer_id` ainda não implementados. Testes de confirmação de e-mail, dispositivos reais, isolamento entre dois usuários e compra completa continuam pendentes.
- **QA:** `QA-MARKETPLACE-1.1.0-RC5.md`.


## 1.1.0-rc.4 — 2026-11-15 · Marketplace: checkout guest, delivery próprio e operações

**Status:** banco e Edge Functions implantados; frontend enviado à `main`; testes estáticos e verificações de acesso aprovados. **Homologação técnica parcial**, sem pedido real finalizado e sem confirmação de propagação HTTP.

- Implementado carrinho de um único restaurante com produtos, quantidades, adicionais e observações, sem armazenar dados pessoais no carrinho.
- Criado checkout de visitante sem CPF ou conta obrigatória: entrega/retirada, regiões e CEPs, forma de pagamento na entrega/retirada, aceite de termos e revalidação de preço, taxa, produto, categoria, opção, disponibilidade e horário no servidor.
- Criada API `marketplace-online` para cotação, pedido transacional idempotente e acompanhamento privado com token assinado e armazenado apenas como hash, limites básicos por IP/telefone.
- Banco ampliado com migrações `checkout_rc2`, `operations_rc3`, `settings_rc4`, além dos hotfixes `quote_pickup_hotfix` e `payment_acceptance_hotfix`. RPCs restritas a `service_role`; todas as funções atuais verificadas sem EXECUTE direto por `anon`/`authenticated`.
- Operação do restaurante em `marketplace-operations` autenticada: aceite, recusa, preparação, saída/retirada, entrega e confirmação de pagamento em sessão aberta do Caixa. Status de pedido independente do pagamento.
- Entrega própria: Gestão permite cadastrar dias/faixas de horário, bairros, CEPs, fretes, mínimos e prazo, além de ativação explícita pelo Master, após configurar cardápio/horários/zonas. Todos os restaurantes permanecem com pedidos **desligados**.
- Cozinha exibe cartões identificados DELIVERY/RETIRADA junto aos tickets presenciais sem mesa fictícia. Baixa de ficha técnica ocorre no aceite e há compensação ao cancelar antes do início do preparo. Caixa apresenta recebimentos online separados.
- Criadas páginas iniciais de <code>/intervalo/termos/</code> e <code>/intervalo/privacidade/</code> com links no aceite do checkout; **pendentes de validação jurídica**.
- Corrigido fallback `404.html` e restaurador de `index.html` para aceitar tokens no formato UUID.assinatura nos links diretos `/intervalo/pedido/:token`. Testes de rota, inclusive com armazenamento bloqueado, passaram.
- **QA:** código JS compilável; carrinho e links testados em simulação; funções Supabase ativas; dados finais confirmados com 0 pedidos/pagamentos/lojas habilitadas. O teste de compra SQL inicialmente identificou erro de região na retirada, corrigido por hotfix; o reteste transacional foi bloqueado pelo ambiente. Portanto **não declarar checkout homologado em produção**.
- Pendências: pedido real controlado de ponta a ponta, testes autenticados em celular/PWA, antifraude mais forte, login opcional de clientes com endereços salvos, revisão legal e comprovação de deploy do frontend.
- Gestão presencial, Equipe e Permissões preservadas. Sem GitHub Actions.

**QA:** `QA-MARKETPLACE-1.1.0-RC4.md`.

### Hotfix de rotas do marketplace — 2026-11-15 (base 1.1.0-rc.1)

**Status:** commitado na `main`; testes simulados do redirecionamento aprovados, propagação no domínio ainda **não confirmada**.

- Corrigido o **404 do site principal** ao abrir links diretos do Intervalo: o script em `/404.html` só reconhecia rotas antigas e ignorava `/intervalo/explorar`, `/intervalo/loja/:slug`, `/intervalo/:slug/vendas-online`, `/checkout`, `/pedido` e `/cliente`.
- Ampliada a lista de rotas válidas do fallback, incluindo proteção para deixar o 404 original de outras páginas corporativas intacto.
- `intervalo/index.html` agora recupera a URL por parâmetro seguro `intervalo_route`, sem exigir `sessionStorage` (importante para navegadores do Instagram/WhatsApp e PWA), preservando parâmetros e fragmentos.
- Criados seis arquivos `index.html` específicos para entrada estática dos endereços já divulgados (explorar, loja Novo Mundo, vendas online Novo Mundo, checkout, pedido e cliente), diminuindo dependência de resposta 404 do host.
- Simulações automatizadas: **12 cenários** do roteamento raiz, **6 redirecionamentos estáticos**, incluindo query e hash, aprovados.
- **Sem alteração no banco, funções Supabase, funcionários, permissões ou pedidos presenciais. Checkout continua bloqueado e compras online não foram liberadas.**
- **QA:** `QA-MARKETPLACE-ROUTAS-404-20261115.md`.
- GitHub Actions não executado. Hosting/HTTPS e deploy em produção precisam ser conferidos separadamente.

## 1.1.0-rc.1 — 2026-11-15 · Fundação do marketplace (pedidos desligados)

**Status:** migração aplicada no Supabase, duas Edge Functions novas ativas, frontend de prévia enviado à `main`. Homologação técnica parcial: deploy do frontend no domínio e testes reais em dispositivos **não confirmados**.

- Implantadas **11 tabelas novas** para consumidor, endereços, loja, regiões/horários, pedidos online, itens, eventos, pagamentos e tokens de acompanhamento. Estrutura independente de `orders.table_id` presencial.
- Aplicada migração `intervalo_marketplace_foundation_rc1`; RLS habilitado e grants de leitura negados a `anon` e `authenticated` em todas as novas tabelas. Acesso apenas por serviço privilegiado, mediado por APIs que validam cada operação.
- Criados registros iniciais seguros para `novo-mundo` e `intervalo27` com `restaurant_online_settings.enabled=false`, `restaurant_storefront.marketplace_visible=false`. Ambas as flags existentes `restaurant_publication.accepts_customer_orders` permanecem `false`.
- Implantada `marketplace-public` v1 com consultas públicas **apenas de leitura** `discover` e `store`, exigindo cardápio publicado e, na busca, opt-in de visibilidade. Sem checkout ou exposição de dados do comprador.
- Implantada `marketplace-management` v2, com autenticação via JWT de usuário, vínculo de Master/gerente e módulo Gestão ativo. Salva rascunho da loja e condições de entrega/retirada sem habilitar recebimento de pedidos, preservando mídia, visibilidade e pausa ao salvar.
- Novas telas: `/intervalo/explorar`, `/intervalo/loja/:slug`, `/intervalo/:slug/vendas-online`; prévias explícitas de `/checkout`, `/pedido` e `/cliente`, todas sem ações de compra.
- Loja pública com catálogo real e detalhes de produto em Bottom Sheet, sem carrinho funcional; Gestão com formulário de rascunho em Bottom Sheet, visibilidade em marketplace opcional e atalho na navegação.
- O arquivo `index.html` diferencia rotas públicas antes do login; rotas privadas seguem checagens existentes de Gestão. Sem alterar os arquivos de funcionário e permissão.
- **QA:** 11 tabelas verificadas, grants de leitura negados a papéis comuns, flags de compra verificadas `false`, Edge Functions recuperadas como ativas, código JS compilável e testes simulados de páginas pública e privada. Teste HTTP/browser autenticado e propagação do frontend permanecem pendentes.
- **Proteções:** não houve alteração em `orders`, `order_items`, `payments`, `restaurant_members`, Equipe, Permissões, Cozinha, Caixa ou estoque.
- **Rollback:** remover os links de frontend da `rc.1` e desativar as duas funções de marketplace. As tabelas podem permanecer vazias/isoladas, sem destruir dados. Não utilizar GitHub Actions.

**QA:** `QA-MARKETPLACE-1.1.0-RC1.md`.  
**Projeto:** `ARQUITETURA-MARKETPLACE-1.1.0.md`.

## 1.0.0-rc.16 — 2026-11-15 · Corrigir cardápio online indisponível

**Status:** backend corrigido e **Edge Function pública `public-menu` v4 ativa no Supabase**, código frontend enviado à `main`. Testes estáticos e simulados aprovados; acesso HTTP real ao domínio ainda não foi confirmado.

- **Causa:** a função pública respondia ao preflight CORS sem permitir o cabeçalho `authorization`, enviado pelo SDK ao chamar `functions.invoke`; o navegador podia bloquear a consulta antes da leitura do cardápio. O frontend exibia a mensagem genérica de cardápio não publicado para qualquer falha.
- **Correção backend:** `Access-Control-Allow-Headers` agora inclui `authorization, apikey, content-type, x-client-info, x-retry-count, traceparent, tracestate, baggage`. Mantidas origem restrita, `POST/OPTIONS`, verificação de publicação e `verify_jwt=false` para consulta sem login.
- **Correção frontend:** tela `public-menu.js` distingue cardápio efetivamente não publicado de falhas de rede ou serviço, com mensagem e opção **Tentar novamente**. Cache atualizado para `rc.16` no `index.html`.
- **Estado real do `novo-mundo`:** ativo, publicação habilitada e módulo ativo, 3 categorias e 3 produtos visíveis. **Estado do `intervalo27`:** cardápio despublicado e 0 produtos; não foram alterados.
- **QA:** Edge Function implantada v4 confirmada, cabeçalho publicado conferido, respostas frontend simuladas de sucesso, indisponibilidade de rede e não publicação aprovadas. Validação real no navegador/PWA e propagação do host permanecem pendentes.
- Sem alterações em funcionários, permissões, autenticação, preço, estoque ou tabelas. Sem GitHub Actions.

**QA detalhado:** `QA-1.0.0-RC16.md`.

## 1.0.0-rc.15 — 2026-11-15 · Padronização visual de todos os módulos operacionais

**Status:** interface enviada à `main`; testes de sintaxe, inspeção de integrações e simulação DOM do Bottom Sheet aprovados. **Homologação técnica parcial**: teste real no PWA e propagação do host ainda não confirmados.

- Criado `visual-unified-rc15.css` como estilo comum branco/laranja, com cards compactos, ícones, botões, responsividade, formulários, seleção de restaurantes, Login, Minha Conta, Cozinha, Impressão, Relatórios e Super Admin.
- Criado `operational-sheets-rc15.js`, componente reutilizável de **Bottom Sheet**: ações compactas, alça arrastável, botão Fechar e Cancelar, viewport ajustado ao teclado, sem foco automático em campos editáveis, formulário original movido para `dialog` sem alterar a função de submit.
- Validadores HTML (`required`, valores, `pattern`, tipo) passam a mostrar mensagens inline nos formulários convertidos; falhas de API nesses formulários exibidas no próprio painel, com campos preservados.
- **Cardápio administrativo:** criar categoria e cadastrar adicional em Bottom Sheets, sem mudar operações de publicação.
- **Estoque:** novo insumo, movimentações, nova categoria, cadastro/edição de produto e ficha técnica em Bottom Sheets; chaves de disponibilidade e cardápio permanecem independentes e com chamadas existentes.
- **Caixa:** abertura e fechamento de caixa, além do recebimento confirmado manualmente, apresentados em Bottom Sheets. Nenhuma integração nova com Pix/adquirentes.
- **Super Admin:** cadastro de restaurante em Bottom Sheet, sem modificar criação de funcionários, vínculos Master, senhas, convites ou permissões.
- **Minha Conta:** formulário de vinculação/atualização de CPF movido a Bottom Sheet, mantendo `account-cpf` e exigências existentes de senha.
- **Meus restaurantes:** cartões responsivos, mantendo as mesmas restrições de acesso, módulos habilitados e estados de convite.
- **Login, Cozinha, Relatórios e Impressão:** acabamento visual aplicado com espaçamento, tipografia, cards e botões consistentes, preservando regras de operação. Relatórios mantêm dados reais do backend, **sem filtros de período fictícios**. Impressão permanece manual.
- **Equipe e Permissões:** intocadas funcionalmente; CSS da plataforma restringido para não redesenhar cartões de funcionários.
- Mantidos os aprimoramentos de **Gestão (rc.11/rc.12)** e **Mesas (rc.14)**.
- `index.html` importa o design comum com cache `rc.15` e importa módulos alterados na mesma versão. Não exige migração nem Edge Function.
- **QA:** compilação JS dos módulos, verificação de imports/cache, teste DOM do componente compartilhado com foco no Fechar, validação, reaproveitamento de `onsubmit`, erro inline e descarte do diálogo. Testes reais por tela permanecem pendentes.
- **Rollback:** restaurar `index.html` e módulos frontend às revisões anteriores e deixar CSS/JS novos inativos. Nenhum rollback de dados.
- **Sem GitHub Actions**, conforme restrição da infraestrutura.

**Registro detalhado:** `QA-1.0.0-RC15.md`.

## 1.0.0-rc.14 — 2026-11-15 · Mesas em Bottom Sheet e auditoria de telas

**Status:** interface enviada à branch `main`; QA de sintaxe e comportamento com DOM/API simulados passou. **Homologação parcial** até validar PWA autenticado e propagação do site.

- **Mesas e salões:** removido o formulário fixo **Nova mesa** do topo da tela e substituído por botão **+ Nova mesa**, que abre um Bottom Sheet ancorado na parte inferior.
- **Edição contextual:** toque no card da mesa abre o mesmo Bottom Sheet preenchido com nome, salão, capacidade e chave de mesa ativa/inativa. Ações de exclusão não foram criadas; permanecem `table_create` e `table_update` do backend original.
- **Validação sem popup nativo:** `form.noValidate=true`, mensagens por campo para nome (até 45 caracteres), salão (até 60), capacidade (1–50) e mensagens de erro da API no próprio painel.
- **Acessibilidade/mobile:** foco inicial no botão Fechar, sem teclado automático; alça de arrasto para expandir ou fechar, fechamento pelo botão/Cancelamento, layout responsivo e `visualViewport` para ajustar o sheet ao teclado.
- **Listagem:** cards menores, indicadores de total/ativas/inativas, filtros locais e ações de edição. Ícones SVG e paleta branco/laranja conforme o visual aprovado.
- **Proteção de salvamento:** botão mostra `Salvando...` e bloqueia envio repetido; fecha o painel após confirmação da API e atualiza a listagem.
- **Cache:** `support.js` para rota `/mesas` atualizado para `1.0.0-rc.14` no `index.html`; CSS próprio em `tables-design-rc14.css`. Outras rotas do suporte mantidas sem mudança funcional.
- **Auditoria estática:** criado `RELATORIO-PADRAO-VISUAL-RC14.md`, classificando telas alinhadas, parcialmente alinhadas, fora do padrão e partes congeladas por decisão de projeto, com priorização de próximos ajustes.
- **QA:** `QA-1.0.0-RC14.md` registra smoke test com 3 mesas, cadastro válido, validação inválida, edição, desativação e filtro. Não houve teste autenticado no navegador real.
- **Sem alterações em funcionários, permissões, banco, Edge Functions ou GitHub Actions.**
- **Rollback:** restaurar `support.js` e `index.html` anteriores, mantendo `tables-design-rc14.css` inativo ou removendo-o. Nenhuma migração.

## 1.0.0-rc.13 — 2026-11-15 · Carregamento unificado em todo o Intervalo

**Status:** alterações enviadas à `main`; QA estático e simulado aprovado. Propagação no domínio e teste autenticado/PWA **não verificados**.

- Substituído o **“Carregando Intervalo...”** fixo do `index.html` por uma abertura minimalista com marca Intervalo, indicação de espera e skeleton de KPIs. CSS crítico inline garante exibição antes da inicialização da aplicação.
- Evitado o flash do cabeçalho/rodapé antigos no início via `body.iv-initializing`. A função `box()` encerra o estado de inicialização, inclusive na mensagem de erro.
- Se o aplicativo permanecer apenas na abertura por 18 segundos (por exemplo, import externo não iniciado), a tela oferece **Tentar novamente**, em vez de manter o usuário preso ao loading.
- Estados de espera padronizados por componente `iv-loading-inline` em Garçom, Cozinha, Caixa, Cardápio, Mesas/Estoque/Relatórios, Conta, Cardápio público, Super Admin e seletor inicial do Garçom.
- Respeitado `prefers-reduced-motion`, sem pulso nem shimmer animados no modo de movimento reduzido.
- URLs de importação de `platform.js`, `public-menu.js`, `account.js` e demais módulos atualizadas para `rc.13` a fim de evitar carregar scripts antigos em cache. O skeleton próprio da Gestão (rc.12) permanece.
- Testes: remoção da frase antiga e dos textos avulsos de carregamento nos módulos alterados, JavaScript compilável, simulação de `box()` encerrando inicialização, classes CSS presentes e rotas de módulos preservadas.
- **Nenhuma alteração** na lógica de funcionários, senhas, permissões, banco ou backend. Sem GitHub Actions.
- **Pendências:** teste real em Android/PWA, internet lenta, import CDN indisponível e propagação no domínio. A URL pública não pôde ser acessada pelo verificador.
- **Rollback:** restaurar `index.html` e os scripts de interface alterados para a rc.12; nenhum rollback de dados necessário.

**QA:** `QA-1.0.0-RC13.md`.

## 1.0.0-rc.12 — 2026-11-15 · Carregamento visual da Gestão

**Status:** código enviado à `main`; homologação técnica parcial, sem confirmação de propagação no domínio ou uso real no PWA.

- **Skeleton responsivo** enquanto a Gestão consulta dados: espaços reservados para cabeçalho, quatro indicadores, atalhos e painéis, no visual branco e laranja aprovado.
- Animação shimmer suave, com estado textual **“Preparando sua visão geral...”**; respeita `prefers-reduced-motion`.
- Ao atualizar dados, uma linha de progresso discreta no cabeçalho sinaliza atividade sem substituir a tela por completo.
- Em falha de carregamento, o skeleton é substituído pela mensagem de erro. Indicadores de progresso são removidos em `finally`, evitando tela presa em carregamento.
- No formulário **Dados do restaurante**, botões exibem **Salvando... / Concluindo...** e ficam bloqueados até a resposta, prevenindo toques duplicados.
- Nenhuma mudança em cadastro de funcionários, funções de servidor, senhas, equipe, permissões, Supabase ou banco.
- Arquivos: `management.js`, `management-design-rc11.css` (com cache `rc.12`), `index.html` (carregamento de `management.js?v=1.0.0-rc.12`).
- Testes simulados: skeleton antes de uma resposta adiada; renderização real posterior; sinalização `aria-busy`; limpeza após sucesso ou falha. **Pendente:** teste em celular/PWA autenticado e propagação no domínio.
- **Rollback:** restaurar `management.js`, CSS e `index.html` da rc.11. Não usar GitHub Actions.

**Relatório:** `QA-1.0.0-RC12.md`.

## 1.0.0-rc.11 — 2026-11-15 · Redesign aprovado da Gestão (mobile first)

**Status:** código enviado à branch `main`, homologação técnica parcial. Testes de renderização e navegação com DOM/backend simulado passaram; publicação no domínio e uso em PWA autenticado não confirmados.

- Novo visual da Gestão do restaurante com fundo claro, laranja como cor principal, tipografia compacta, cartões de KPIs, ícones SVG da biblioteca interna e grades responsivas.
- Desktop: menu lateral permanente com restaurante selecionado, módulos de operação, dados do estabelecimento e acesso aos menus existentes, mantendo checagens de disponibilidade e papel do backend.
- Celular: menu lateral recolhível, barra inferior com **Início / Mesas / + / Relatórios / Mais**, e Bottom Sheets nativos para atalhos e mais opções.
- Acesso rápido aos módulos existentes: Garçom, Cozinha, Caixa, Cardápio, Mesas, Estoque, Relatórios e Impressão; links só aparecem se o módulo estiver habilitado, sem simular operação inexistente.
- Indicadores reais continuam vindo de `restaurant-team.list` e `restaurant-core.orders`/`stock_list`; estados indisponíveis não são inventados. Painéis de fluxo operacional e estoque em alerta reorganizados.
- Abas Dados, Equipe e Permissões preservam os respectivos formulários, funções de salvamento, regras de papel e exceções de acesso. **Nenhuma alteração na lógica, cadastro ou segurança dos funcionários.**
- Arquivos modificados/criados: `management.js`, `management-design-rc11.css` e `index.html` (cache de import `rc.11`).
- QA: sintaxe JS, renderização de duas comandas, alerta de estoque, atalhos condicionais, navegação para Dados/Equipe/Permissões, bloqueio de Permissões ao gerente e abertura dos Bottom Sheets passaram em simulação.
- Pendências: validar CSS em navegador real (Android/PWA/desktop), conferir atualizações de cache, teste autenticado e propagação no domínio. Não houve GitHub Actions.
- Rollback: restaurar versões anteriores de `management.js` e `index.html`, mantendo o arquivo CSS novo inativo; nenhuma migração no banco foi feita nesta versão.

**Relatório:** `QA-1.0.0-RC11.md`.

## 1.0.0-rc.10 — 2026-11-15 · Caixa: cobrança consolidada e fechamento por mesa

**Status:** frontend enviado à `main`, backend das rodadas ativo no Supabase. Testes SQL transacionais e renderização simulada aprovados. **Homologação parcial**, sem confirmação de PWA/domínio.

- Caixa reúne todas as rodadas da comanda, exibe subtotais agrupados e o total único da mesa.
- Fila de pagamento mantém somente comandas completamente servidas; saldo recebido/pendente e pagamentos parciais seguem os registros reais do backend.
- Sessão de caixa passa a informar o **dinheiro esperado** (troco inicial + recebimentos registrados em dinheiro).
- Prévia não fiscal da comanda agrupa todos os itens por rodada, sem perder o total acumulado.
- Testes SQL com `ROLLBACK`: pagamento bloqueado enquanto existem rodadas pendentes; recebimento parcial não fecha a comanda; quitação integral encerra a comanda e libera a mesa.
- Sem alteração no processamento financeiro externo: Pix/cartão seguem como **recebimentos registrados manualmente após confirmação fora do app**.

## 1.0.0-rc.9 — 2026-11-15 · Cozinha: produção independente por rodada

**Status:** frontend enviado à `main`; teste de renderização JS/DOM aprovou dois tickets distintos. Homologação real em dispositivo pendente.

- KDS passa a consultar `order_rounds` e organizar cada rodada da mesa por estado: **Novo pedido → Em preparo → Pronto**.
- Cada ticket mostra identificação da comanda e número da rodada, seus próprios itens/observações e tempo desde o envio.
- Ações de progresso atuam somente na rodada selecionada, via `round_progress`.
- Impressão manual/HTML inclui apenas os itens da respectiva rodada, sem misturar pedidos anteriores.
- Atualização automática por consulta a cada 15s preservada; não é Realtime nem impressão térmica automática.

## 1.0.0-rc.8 — 2026-11-15 · Garçom: múltiplas rodadas na mesma comanda

**Status:** migração aplicada ao Supabase INTERVALO, Edge Function `restaurant-core` v12 ativa e frontend enviado à `main`. QA transacional com rollback e renderização simulada aprovados; **homologação real pendente**.

- Adicionada tabela `order_rounds` e campo `order_items.round_no`. Dados legados preservados: 7 comandas, 7 rodadas e 8 itens vinculados, sem órfãos.
- A função `item_add_auto` continua criando a comanda ao confirmar o primeiro produto, mas permite novos produtos e novas rodadas sem abrir uma segunda comanda.
- Ao enviar à cozinha, somente os itens da **rodada em lançamento** mudam de estado e descontam estoque; rodadas anteriores permanecem intactas.
- Comanda mostra rodadas numeradas com estados, subtotais e total consolidado; Garçom marca a entrega de cada rodada pronta separadamente.
- Novo lançamento proibido depois de iniciado qualquer pagamento; pagamento só permitido quando **todas** as rodadas estão servidas.
- Regras de papel/restaurante continuam verificadas pela Edge Function, com RLS e funções SQL restritas ao `service_role`.
- Política explícita `deny_clients_order_rounds` bloqueia consultas e gravações diretas por `anon`/`authenticated`; Advisor RLS sem política resolvido. Nenhuma permissão de funcionário alterada.
- Compatibilidade mantida para operações antigas `item_add` e `order_progress` de clientes legados, sem permitir atualizar todas as rodadas por engano.
- Testes no banco fizeram duas rodadas, progresso, pagamentos parciais e **baixa de estoque por rodada com ficha técnica temporária**, todos com `ROLLBACK`. Concorrência real simultânea permanece pendente.
- **Sem alterações em login, CPF, senhas, permissões ou módulo de funcionários.**

**QA integrado e procedimentos de rollback:** `QA-1.0.0-RC8-RC10.md`. Não remover a estrutura de rodadas depois que houver dados reais com múltiplas rodadas.

## 1.0.0-rc.7 — 2026-11-15 · Bottom Sheet para inclusão de produtos no Garçom

**Status:** interface implementada na `main`; sintaxe JS e testes de interação com DOM simulado passaram. **Homologação parcial** até validação em celular autenticado e propagação no domínio.

- Formulário de adição de produto substituído por **Bottom Sheet** ancorado na parte inferior, com alça para expandir (arrastar para cima) ou fechar (arrastar para baixo), botão Fechar, toque no fundo, ESC e layout com rolagem interna.
- Nome e preço unitário no topo; quantidade controlada por botões **− / +** ou por **teclado numérico interno** ao tocar no número. O teclado do sistema não abre ao mostrar o painel nem ao alterar a quantidade.
- **Observações opcionais:** teclado do aparelho aberto somente quando o usuário toca no campo de texto; layout ajusta altura/posição via `visualViewport` para evitar que o teclado encubra a área de ações.
- Total do produto atualizado conforme a quantidade, limitado de 1 a 99 unidades. Botões Cancelar / Adicionar à comanda mantidos no rodapé do sheet, com bloqueio contra confirmação repetida durante salvamento.
- Mantida a operação transacional `item_add_auto` da rc.5: primeiro produto cria comanda automaticamente, e o fluxo permanece no Cardápio para adicionar outros.
- **Escopo:** apenas `intervalo/waiter.js` e cache-buster/rodapé em `intervalo/index.html`. Sem SQL, novas permissões ou alterações em outras telas.
- **QA:** compilação JS com `new Function` após remover ESM e simulação de elementos DOM: sheet abre sem focar entrada, teclado interno oculto inicialmente, `+`/`−`, digitação 23, confirmação de 5 unidades com observação e chamada única a `item_add_auto`, atualização de totais, retorno ao Cardápio — todos passaram.
- **Pendentes:** abertura e gestos em Android/iOS reais, exibição sobre teclado nativo, comportamento PWA instalado, teste ponta a ponta autenticado e propagação no site.
- **Commits:** `f85f9e3` (CSS), `ab55c94` (Bottom Sheet), `b923324` (teclado numérico interno), `af203bd` (cache rc.7).
- **Rollback:** reverter os commits citados em ordem inversa, preservando a rc.6; não requer GitHub Actions. Nenhuma migração nesta versão.

## 1.0.0-rc.6 — 2026-11-15 · Simplificação da tela inicial do Garçom

**Status:** alteração registrada na branch `main`; QA estático e simulação do fluxo aprovados. Publicação/propagação no domínio e PWA instalado **não verificadas**.

- Tela de entrada após login em `/?app=garcom` e `/garcom`: título **“Seja bem-vindo Garçom!”** e subtítulo **“Para começar seu atendimento clique em Iniciar.”** tanto no carregamento como na renderização final.
- Cartão de restaurante mantém função/estabelecimento e regra de permissões, mas a ação vira **Iniciar**, apontando para `/{slug}/garcom`.
- Removidos da tela de entrada os controles **Instalar app do garçom** e **Todos os módulos**; sem remover funcionalidades de outras telas.
- Submarca **UM PRODUTO GAVEBLUE** e rodapé de versão ocultados apenas nessa entrada, preservando-os nas demais áreas.
- Ajustados espaçamentos e tipografia do banner e cartões, sem interferir na lógica de login, comandas, módulos, dados ou Supabase.
- **Smoke test:** duas renderizações (carregamento e final), rota de um restaurante autorizado, ausência dos controles removidos, estado sem acesso e sintaxe JavaScript verificados por simulação. Browser autenticado/PWA real pendentes.
- **Arquivo alterado:** `intervalo/index.html`. **Commit:** `519225f860867b8937f3c90034b558af6ed6c308`.
- **Rollback:** reverter `519225f` ou restaurar o `index.html` anterior, sem alterar tabelas ou Edge Functions. Sem GitHub Actions.

## 1.0.0-rc.5 — 2026-11-15 · Garçom: primeiro produto abre comanda automaticamente

**Status:** código na `main`, função SQL implantada no Supabase INTERVALO e Edge Function `restaurant-core` versão 10 ativa. **Homologação parcial:** testes transacionais reais com rollback passaram; navegador autenticado e propagação no domínio/PWA não comprovados.

- Clicar em uma mesa continua abrindo o **Cardápio**. A inclusão pelo `+` do produto é permitida mesmo quando não há comanda aberta.
- Ao confirmar quantidade e observações, `item_add_auto` cria uma comanda **somente se necessário** e registra o primeiro produto na mesma transação do Postgres. Se já existe comanda aberta, a reutiliza.
- Selecionar mesa, visualizar produto ou cancelar o formulário **não abre comanda**. Produto inválido não deixa comanda vazia.
- Pedido já enviado/preparando/pronto/servido **não recebe novos itens** nessa primeira etapa; novas rodadas ficam para implementação futura.
- Após a inclusão, a interface permanece no Cardápio, permitindo continuar o lançamento. A Comanda e seu botão **Enviar para cozinha** continuam acessíveis no fluxo.
- Retirado o passo obrigatório **Abrir comanda** e sua opção de atalho na tela Mais/Ações rápidas.
- Backend: função `public.intervalo_add_item_auto` com bloqueio por mesa e reaproveitamento de comanda, execução restrita ao `service_role`, identidade e permissões de Garçom validadas na Edge Function. Nenhuma chave privilegiada foi enviada ao cliente.
- Implementação: migration `20261115_waiter_auto_item_1_0_0_rc5.sql`, `restaurant-core/index.ts`, `waiter.js` e `index.html`, com cache-busting para `1.0.0-rc.5` apenas no Garçom.
- **QA de banco:** testada criação em mesa livre (result.created=true), reutilização de comanda aberta (false), rejeição de produto inexistente sem criação de comanda e verificados grants de execução. Testes positivos foram revertidos com `ROLLBACK`; 1 comanda ativa permaneceu ativa, sem alteração da contagem.
- **QA de frontend:** sintaxe JS válida e verificação de integração dos pontos de entrada. **Pendentes:** clique real no celular, autenticação, atualização de PWA, conectividade em produção, smoke test de pedido completo com cozinha e corrida simultânea entre dois garçons.
- **Publicação:** commits feitos na `main`, sem GitHub Actions. Verificação externa de `gaveblue.com.br` não foi possível por falha de resolução de DNS nas ferramentas; não afirmar propagação.
- **Rollback:** reverter commits `index.html` / `waiter.js`, restaurar `restaurant-core` v9 em Supabase e revogar/remover a função `intervalo_add_item_auto` quando a Edge Function antiga já não a utilizar. Somente executar rollback após conferir usos em produção.

## 1.0.0-rc.4 — 2026-11-15 · Garçom: mesas em grade, cabeçalho limpo e navegação rápida

**Status:** alterações de interface publicadas como commits na `main`. **Homologação técnica parcial:** sintaxe JavaScript compilada sem erros e inspeção dos arquivos na branch; teste real autenticado e propagação HTTP/PWA no domínio não comprovados.

- Removidas do cabeçalho do Garçom as pílulas de conexão, instalação e restaurantes. **Aviso de modo offline permanece** quando necessário.
- Corrigido o sublinhado do logotipo, que sobrepunha o subtítulo do restaurante.
- Mesas renderizadas em grade responsiva de **3 colunas de cartões quadrados**, preservando seleção, área, situação e filtros Todas/Ocupadas/Livres.
- Barra inferior: **Mesas, Cardápio, + central laranja, Comanda e Mais**.
- O **+** abre folha de ações rápidas (seleção de mesa, cardápio e comanda; abrir comanda apenas quando a mesa selecionada não possui pedido ativo).
- **Mais** abre Minha conta, Trocar restaurante, Atualizar informações e Instalar aplicativo (somente se a experiência não está em modo instalado/standalone).
- Ações de pedido continuam usando as chamadas reais ao backend `restaurant-core`. Sem mudanças de esquema, autorização, pedidos ou estoque.
- Cache-buster do `waiter.js` atualizado para `1.0.0-rc.4` no carregador e rodapé atualizado. Outros módulos mantidos na versão anterior.
- **Verificações:** sintaxe JS validada com `new Function` após retirar as declarações ESM; inspeção na `main` confirmou os elementos e a condição para instalação. Testes de clique, visual em dispositivo, PWA instalado, permissões, pedidos e rollback ainda pendentes.
- **Commits de código:** `c0678fb` (grade), `10523df` (navegação), `41354a6` (cache), `ff2ced8` (proporção), `94c8705` (versão).
- **Rollback:** reverter esses commits em ordem inversa ou restaurar os blobs anteriores de `intervalo/waiter.js` e `intervalo/index.html`. Não depende de GitHub Actions.

## 1.0.0-rc.3 — 2026-11-12 · Correção de chaves e melhoria mobile em Estoque e Produtos

**Status:** versão candidata ao piloto visual na `main`; verificação estática, renderização simulada e fixture de layout em Chromium aprovadas. **Sem homologação de uso real em dispositivos ou comprovação de propagação no domínio.**

- Resolvida a causa dos interruptores deformados nas flags **Exibir no cardápio** e **Disponível para venda**: `.x-form input` aplicava largura de 100% e padding às caixas de seleção, superando o CSS da chave.
- Interruptores compactos de **46 × 26 px**, com polegar de 20 px, laranja para ligado e cinza para desligado; sem esticamento ou flex-shrink, com foco de teclado visível e estado de carregamento.
- As opções agora aparecem em **linhas de ajustes com título e subtítulo**, área de toque maior, inspiradas nas interfaces mobile de configuração.
- O cadastro de novo produto virou um formulário **recolhível** por padrão; expansão via `details/summary`. A tela de produtos prioriza a lista comercial, seus preços e chaves.
- **Insumos, Produtos, Fichas técnicas e Movimentações** ficam acessíveis por navegação inferior fixa em dispositivos com tela de até 700 px, sem encobrir o conteúdo.
- Cartões, formulários e indicadores compactados e reorganizados para uso com uma mão. No desktop, abas permanecem no conteúdo.
- Atualização silenciosa após alternar flags, preservando a rolagem em vez de mostrar uma tela temporária de carregamento.
- Sem alterações de backend, acesso, precificação, disponibilidade, regras de estoque ou cadastro persistente. Versão exibida e cache de assets atualizados para `1.0.0-rc.3`.
- Testes: renderização simulada de produtos e seis chaves, especificidade CSS, protótipo visual equivalente no Chromium em 320/360/390/412/768/1280 px, sem overflow horizontal e com chaves 46 × 26 px. Não equivalem a testes reais no site.
- Documentação: `QA-1.0.0-RC3.md`.

---

## 1.0.0-rc.2 — 2026-11-12 · Separação de insumos e produtos com precificação central

**Estado:** migração aditiva aplicada no Supabase; `restaurant-core` v9 e `public-menu` v3 ativos; frontend atualizado na `main`. Testes SQL e renderização simulada aprovados. **Ainda não homologada no domínio ou aparelhos reais.**

- `Estoque` passa a se chamar **Estoque e Produtos** na gestão, com 4 abas: **Insumos**, **Produtos**, **Fichas técnicas** e **Movimentações**.
- Os **Insumos** continuam controlando saldos, mínimos, entradas e perdas; **Produtos** concentram cadastro, nome, categoria, descrição, foto HTTPS e **preço de venda**.
- Nova chave individual **Exibir no cardápio** (`menu_products.show_on_menu`): produto pode sair da vitrine pública sem ser apagado ou indisponibilizado para uso interno. A chave **Disponível para venda** (`menu_products.available`) permanece separada e controla a seleção pelo Garçom.
- Produtos atuais preservados e marcados por padrão para exibição, sem alterações de preço nem de fichas técnicas. Publicação geral e categoria ativa continuam necessárias.
- Produto com `show_on_menu=false` e `available=true` pode continuar disponível na operação interna do Garçom.
- Categoria também pode ser criada dentro do novo cadastro central de Produtos.
- A tela **Cardápio digital** mantém publicação, categorias, adicionais informativos, prévia, link e QR de consulta; remove formulário duplicado de cadastro e edição de produto, substituindo-o por atalho para `Estoque e Produtos → Produtos`.
- Backend com ação `product_flags` atualiza apenas a chave escolhida, com autorização, isolamento por restaurante e auditoria; não sobrescreve o preço.
- `public-menu` filtra `available=true` **e** `show_on_menu=true`, mantendo todos os demais filtros e requisitos de publicação.
- O estoque **não** oculta o produto automaticamente quando falta insumo; a regra de bloqueio do envio da comanda por insuficiência permanece transacional, sem alterações.
- Evidência SQL: `BEGIN/ROLLBACK` testou default, isolamento da flag, edição do preço e filtro da vitrine; nenhum dado de QA persistido. Testes simulados de 4 abas e Cardápio passaram.
- Documentos: `PRODUTOS-INSUMOS-1.0.0-RC2.md`, `QA-1.0.0-RC2.md`. Pendente homologação E2E real.

---

## 1.0.0-rc.1 — 2026-11-12 · Redesign integral do Intervalo (candidata à versão 1)

**Status:** implementado na `main` do GitHub, com verificação estática e renderização simulada de módulos. **Liberado apenas para avaliação visual e piloto**; não há comprovação de publicação no domínio, fluxo completo com usuários reais ou homologação de produção. Não renomear para `1.0.0` final sem QA funcional.

### Novo padrão visual
- Direção aprovada: visual minimalista laranja/branco/carvão, cartões organizados, responsividade, tipografia consistente e **ícones SVG locais no lugar de emojis**.
- Design compartilhado `design-system.css` e biblioteca `ui-icons.js`, sem dependência de biblioteca externa de ícones.
- Atualizados logo da aplicação e cor do manifesto PWA geral para laranja.
- Página inicial e seletor de restaurantes com botões, módulos e navegação no mesmo padrão.

### Redesign de painéis
- **Super Admin:** sidebar, indicadores operacionais reais, busca de restaurantes, ações sensíveis recolhidas por estabelecimento; mantidas criação, gestão de módulos, senhas provisórias e permissões.
- **Master/Gestão:** dashboard inicial com resumo obtido das consultas autorizadas de pedidos e estoque, equipe ativa (vínculos), menu lateral e atalhos para os módulos.
- **KDS/Cozinha:** três colunas `Novos pedidos`, `Em preparo`, `Prontos`, cartões de pedido com observações, tempo desde envio quando disponível, ações existentes e impressão manual.
- **Caixa/POS:** três áreas na mesma tela: fila de comandas servidas, detalhes da comanda selecionada e registro manual de pagamentos; sessão de caixa e impressão manual preservadas.
- **Garçom/PWA:** ícones SVG nos produtos e nas abas, fallback para fotos ausentes e atalho fixo à comanda no celular; regras de pedido do backend preservadas.
- **Cardápio Público e Gestão do Cardápio:** produtos, categorias, busca e fotos com símbolos vetoriais no lugar de emojis; QR permanece somente link de consulta.
- **Mesas, Estoque, Relatórios e Minha Conta:** cabeçalhos, navegação, cartões e botões padronizados.

### QA
- Sintaxe JS verificada nos arquivos modificados; renderização simulada de Super Admin, Master, KDS, Caixa, Garçom, Cardápio e módulos auxiliares aprovada, sem inserção de dados fictícios no banco.
- Ainda pendente: testes reais em navegador e dispositivos, isolamento multi-restaurante, responsividade, todas as rotas e ciclo comanda → cozinha → garçom → caixa → estoque.
- Limites da versão preservados: sem fiscal, sem SMTP, sem impressão automática; pagamentos Pix/cartão são **registros manuais de recebimentos externos**.
- Evidências e documentação: `QA-1.0.0-RC1.md` e `DESIGN-SYSTEM-1.0.0.md`.
- GitHub Actions continua indisponível por cobrança; commits não comprovam propagação no domínio.

---

## 0.9.8 — 2026-11-12 · Correção de instalação do PWA Garçom e liberação para piloto

**Status:** homologação técnica aprovada para TESTE PILOTO assistido. **Ainda sem validação funcional no domínio real, Android/iPhone ou fluxo operacional completo; não é homologação comercial da 1.0.0.**

- Link canônico de instalação: `https://gaveblue.com.br/intervalo/?app=garcom`; a URL aponta para `/intervalo/index.html` existente com parâmetro de inicialização, evitando usar rota sem resposta HTTP 200 como `start_url` do PWA.
- `manifest-garcom.webmanifest`: atualizado `start_url` e shortcut; mantém `id` exclusivo, ícones SVG e PNG 192/512 e aparência standalone.
- `404.html` do domínio inclui agora a rota curta `/intervalo/garcom`; o app restaura e reavalia o manifesto após o fallback de URL.
- Login com `destino=garcom` retorna ao launcher via URL canônica; launcher não redireciona automaticamente para a única empresa, permitindo instalar o PWA antes de escolher restaurante.
- Novo `offline.html` e service worker: trata navegação sem rede mostrando instrução segura de reconexão; **não** armazena tokens, respostas privadas ou comandas e **não** permite confirmar pedidos offline.
- Atualizados versionamento/cache imports `0.9.8`, rota e manifesto.
- Conferência estática de 8 arquivos (HTML principal, fallback, JS Garçom, Cardápio, Catálogo, SW, página offline e manifest); Edge Functions `restaurant-core`, `restaurant-team`, `public-menu` ativas.
- Não foi possível consultar o domínio vivo devido a DNS indisponível no ambiente; não alegar publicação/propagação confirmada.
- Ver `QA-0.9.8.md` para resultados, restrições e roteiro de instalação/teste Android/iPhone.

---

## 0.9.7 — 2026-11-12 · PWA Garçom e Cardápio Digital

**Status:** UI e APIs implantadas no GitHub/Supabase; testes de sintaxe, renderização simulada e transação SQL aprovados. **Sem homologação E2E no domínio nem teste de instalação em aparelhos.** Arquitetura e QA documentados.

### PWA do Garçom
- Novo painel responsivo baseado nas referências: **Mesas / Cardápio / Comanda**, navegação por abas no celular, painel em três áreas no desktop, cores branco/laranja.
- Tabelas livres/ocupadas, seleção de mesa, busca e categorias com cartões de foto/emoji; pedido mostra itens e total a partir de valores reais.
- Quantidade e observação em diálogo acessível; ligações reais a `restaurant-core` para abrir comanda, adicionar item, enviar à cozinha, cancelar antes de envio e marcar servido. Sem alterar saldos ou status somente no front-end.
- Leitura periódica a cada 10 segundos sem substituir a busca ou diálogo em andamento.
- `/intervalo/garcom`: launcher com controle de restaurantes e permissões; primeira sessão sem login volta ao launcher após autenticação.
- Identidade PWA independente em `manifest-garcom.webmanifest` com `id`, `start_url`, ícone SVG e PNG 192/512, instalação nativa quando disponível e instruções iOS/Android. Service Worker não guarda dados privados nem confirma pedidos offline.

### Cardápio Digital
- Novo visual público responsivo com nome do restaurante, categorias, busca, fotos, preços, descrição, opcionais informativos e compartilhamento do link.
- Coluna `menu_products.image_url` opcional com restrição HTTPS por migração.
- Gestão agora cadastra e altera foto do produto por URL HTTPS, oferece link de cardápio e botão QR Code (biblioteca client-side carregada sob demanda com fallback de copiar link).
- `public-menu` v2 mantém exclusão de cardápios não publicados, estabelecimentos inativos e módulos desabilitados.
- `restaurant-core` v7 permite salvar/consultar a URL da foto com autorização; mantenha validação no servidor.
- Cardápio segue **consulta pública apenas**: sem carrinho, Pix online, pedidos automáticos e sem cobrança de adicionais em comandas.

### Qualidade e documentação
- Renderização simulada de Garçom, Cardápio Público e Gestão, sem erros de sintaxe.
- Foto HTTPS aceita; protocolo de imagem inseguro rejeitado em teste transacional SQL com ROLLBACK. Zero registros artificiais permanentes.
- Artefatos: `ARQUITETURA-PWA-GARCOM-CARDAPIO-0.9.7.md`, `QA-0.9.7.md`.
- Pendente: testar ícones/instalação no Android/iPhone, visual responsivo, QR em navegador real, fluxos E2E, isolamento entre restaurantes e propagação em gaveblue.com.br.
- Sem mudanças no escopo fiscal, SMTP e impressão manual definida em `ESCOPO-1.0.0.md`.

---

## 0.9.6 — 2026-11-12 · Escopo 1.0.0 sem fiscal, SMTP ou impressora térmica

**Status:** código da interface atualizado na `main`; `restaurant-team` v6 publicado no Supabase. Teste real de navegador e propagação do site ainda não comprovados; 1.0.0 não homologada.

- Decisão explícita do produto: a 1.0.0 será lançada sem emissão fiscal, sem entrega de e-mails e sem integração/testes de impressora física. Equipamentos e automação ficam para etapa futura, sem apagar a estrutura existente.
- A área **Impressão** foi convertida em **Impressão manual** com instruções e atalhos para pedidos da Cozinha e comandas do Caixa. Não há formulário para cadastrar ou ativar impressora nessa tela.
- Cozinha: botão `Imprimir pedido (manual)`; Caixa: `Visualizar / imprimir comanda`. Prévia do navegador permite imprimir em dispositivo disponível ou salvar PDF. Sem envio automático nem comprovação de impressão.
- Gestão de equipe: novo funcionário por senha provisória, e vínculo entre contas já existentes sem SMTP. `restaurant-team` agora rejeita convite a e-mail não cadastrado, sem chamar `inviteUserByEmail`.
- Recuperação de senha: página instrui obtenção de senha provisória pelo Super Admin, sem `resetPasswordForEmail`; bootstrap público do Super Admin encerrado no aplicativo, sem `signUp`.
- A conta do próprio Super Admin requer recuperação legítima pelo painel Supabase; credenciais não são expostas.
- A emissão fiscal continua inexistente na aplicação; recibos/comandas são documentos internos não fiscais.
- Os pagamentos de Pix e cartões permanecem registros declaratórios de recebimentos externos; integração de gateway não é anunciada como funcional.
- Atualizada a chave de cache dos módulos para 0.9.6.
- Referências: `ESCOPO-1.0.0.md`, `QA-0.9.6.md`, `ROTEIRO-TESTES-PILOTO.md`.

### Evidência e pendências
- Teste estático de sintaxe e fluxo de navegação; Edge Function `restaurant-team` implantada com JWT obrigatório.
- Pendente: homologação E2E real com todos os papéis, dois restaurantes, comanda, cozinha, caixa, estoque, impressão manual/PDF e segurança, além da comprovação de publicação no domínio.
- **SMTP, fiscal e impressão térmica não bloqueiam a 1.0.0 por decisão de escopo.**

---

## 0.9.5 — 2026-11-12 · Gestão de equipe, atendimento e impressão manual

**Status:** backend e interface no GitHub; funções no Supabase ativas; testes estáticos/simulados passaram. **Homologação real no domínio pendente.**

- Master do restaurante pode cadastrar novos funcionários com senha provisória manual (gerente, garçom, cozinha ou caixa), sem esperar SMTP. Confirma sua própria senha; tem limite de 20 novos usuários/hora.
- O usuário provisionado deve trocar a senha antes de acessar recursos. Contas Auth já existentes não são recriadas e devem ser vinculadas pelo fluxo existente.
- A confirmação de e-mail usada no provisionamento é apenas administrativa no Auth, não comprova o domínio do endereço: responsável deve validar a identidade fora do sistema.
- Garçom consulta alterações de mesas e comandas a cada 10 segundos com aba visível; não sobrepõe edição ativa do formulário.
- Prévia de pedido para cozinha e de comanda para caixa, com impressão pelo navegador ou PDF. Não representa integração com impressora térmica nem documento fiscal.
- Atualizado cache de módulos do site para 0.9.5.

**QA:** ver `QA-0.9.5.md` (sem E2E de browser/hardware/pagamento real).

---

## 0.9.4 — 2026-11-12 · Estoque e fichas técnicas transacionais

**Status:** migrações aplicadas no banco; Edge Function `restaurant-core` v5 publicada; painel atualizado e verificado em simulação, sem validação HTTP do domínio.

- `intervalo_submit_order`: venda desconta estoque por ficha técnica em transação única, com agregação por insumo, lock e validação de saldo; impede duplicidade e consumo parcial em erro.
- `intervalo_stock_adjust`: entradas, perdas e ajustes rastreados em `stock_movements`; saldo negativo é bloqueado.
- `intervalo_create_stock`: insumo criado com saldo inicial gera entrada no extrato na mesma transação.
- Cadastro e remoção de ingredientes por produto no painel de Estoque; mostra saldos, estoque mínimo, últimas movimentações e produtos ainda sem ficha.
- Produtos sem ficha não baixam estoque automaticamente, com alerta explícito no painel.
- RPCs de estoque com execução restrita ao `service_role`, sem exposição direta a `anon`/`authenticated`.
- Testes SQL em transações com `ROLLBACK`: baixa correta, envio repetido recusado, falta de estoque sem efeito parcial, entrada/perda e saldo inicial; sem registros de QA persistentes.

---

## 0.9.3 — 2026-11-12 · Criação e redefinição manual de senhas pelo Super Admin

**Status:** função Supabase publicada (super-admin-credentials v2) e interface enviada à main do GitHub. QA de navegador no domínio e login real com novos usuários **não comprovados**.

### Funcionalidades
- Novo formulário por restaurante: Super Admin informa e-mail e papel (Master, gerente, garçom, cozinha ou caixa), define uma **senha provisória manualmente** (12 a 128 caracteres), confirma a própria senha e cria a conta sem convite SMTP.
- Para contas existentes vinculadas ao restaurante (inclusive pendentes): botão **Definir senha provisória**, com senha manual e confirmação da própria senha do Super Admin.
- O backend bloqueia redefinição de conta Super Admin, exige autenticação de sessão mais senha atual do administrador, valida vínculo do usuário ao restaurante e registra auditoria sem gravar segredo.
- Usuários provisionados ficam com `intervalo_password_change_required=true` e precisam escolher nova senha antes de operar o restaurante; vínculo pendente passa a ativo depois de operação autorizada.
- Para contas criadas pelo administrador, usa `email_confirm:true` por exigência do Supabase Auth para permitir entrada imediata por senha sem SMTP. **Isso é confirmação administrativa no Auth, não prova de posse do e-mail**; essa identidade deverá ser validada independentemente no futuro.
- Contas Auth globais pré-existentes não podem ser recriadas com outro restaurante diretamente pelo formulário de novo usuário, evitando alteração surpresa de senhas compartilhadas. Para contas já vinculadas, a redefinição da senha impacta todos os restaurantes vinculados à mesma identidade.
- Módulos GB+ e automações do GitHub não alterados.

### Homologação
- Edge Function nova implantada diretamente no Supabase, status ACTIVE, verify_jwt=true.
- Inspeção estática do controle de acesso, da senha obrigatória e da apresentação em UI.
- Pendente: simular autenticação real e fluxo completo pelo domínio; testar criação e redefinição com usuários fictícios e acesso autorizado, sem mudar senhas de pessoas reais na homologação.
- Configuração SMTP de recuperação por e-mail continua pendente, sem bloquear o recurso manual.

---

## 0.9.2 — 2026-11-12 · Cadastro de restaurantes sem etapa de e-mail

**Status:** interface alterada e enviada à branch main; o backend já permitia criar restaurante sem Master/e-mail desde 0.9.1. Verificação prática no domínio ainda pendente.

### Alteração
- Retirado o campo de e-mail do Master do formulário **Novo restaurante** do Super Admin.
- A criação exige apenas nome e slug (sugerido automaticamente) e não solicita nem envia confirmação/convite por e-mail.
- O restaurante criado aparece no painel, onde o responsável Master pode ser definido posteriormente.
- Mensagem de sucesso esclarece que não foi exigido e-mail.
- O backend existente `admin-provision` v5 mantém autorização Super Admin, criação atômica, RLS e a possibilidade de atribuir Master depois.
- Atualizado o versionamento de interface e cache dos módulos para 0.9.2, sem GitHub Actions.
- **Não alteramos** a configuração global de confirmação de e-mail do Supabase Auth: desativá-la marca automaticamente e-mails como confirmados, impedindo uma verificação real posterior. Contas novas e primeiro login seguem exigindo ativação segura por link/credenciais válidas e confirmação aplicável.

### Homologação
- Inspeção estática do fluxo de front-end e API em andamento; teste real no domínio e login de novos usuários não comprovados.
- O envio de SMTP para recuperação de senhas continua pendente; não é requisito para criar o restaurante.

---

## 0.9.1 — 2026-11-12 · Correção crítica: não conseguia cadastrar restaurante

**Status:** correção do backend implantada no Supabase e código commitado no GitHub; testes SQL e simulações do formulário passaram. Teste E2E real e propagação no domínio **ainda não foram comprovados**.

### Causa-raiz demonstrada pelos logs
- 12/11/2026 às 15:08:19, 15:08:26 e 15:09:52 UTC: `POST /functions/v1/admin-provision` retornou **409** nas tentativas de cadastro.
- As chamadas anteriores `POST /auth/v1/invite` retornaram **429 (rate limit)**. O projeto não permitiu mais envios de convites pelo SMTP padrão.
- Em 12/11/2026 às 14:43:34 UTC: recuperação `POST /auth/v1/recover` também retornou 429.
- A função anterior condicionava o cadastro ao envio de convite, transformando indisponibilidade de e-mail em bloqueio de criação.

### Correção
- Cadastro do restaurante agora é **uma única transação SQL** (`intervalo_create_restaurant`) que cria estabelecimento, cinco módulos, configurações, publicação desativada, assinatura de teste, auditoria e estado opcional do Master.
- E-mail Master tornou-se **opcional**. Sem e-mail, restaurante é criado normalmente, e Master pode ser definido depois.
- Com e-mail de um usuário já cadastrado, backend tenta criar vínculo pendente em operação SQL transacional independente de SMTP (`intervalo_assign_master`).
- Com e-mail novo, registra o responsável pendente em `restaurant_master_setup` (RLS habilitada, somente service_role); o restaurante continua cadastrado.
- Super Admin tem o botão **Preparar link de acesso (sem enviar e-mail)** que chama `auth.admin.generateLink` protegido por confirmação da senha do próprio administrador. O link sensível aparece uma vez para entrega manual ao destinatário.
- Se a preparação do convite falhar, o restaurante permanece cadastrado e o usuário pode tentar novamente.
- Criador de restaurante no Super Admin não depende mais do sucesso de consultas secundárias de membros, autenticação, módulos ou assinaturas. O formulário continua visível mesmo se a lista de restaurantes falhar.
- Slug passa a ser sugerido automaticamente a partir do nome com tratamento de acentos e caracteres especiais.
- Corrigido fallback de deep links do GitHub Pages: `404.html` já armazenava o caminho solicitado, mas o aplicativo não o restaurava. `intervalo/index.html` agora recupera o endereço com `history.replaceState` antes do roteamento.
- URLs de imports receberam `v=0.9.1` para evitar scripts de gestão antigos em cache.
- Projeto GB+ e arquivos da página inicial não alterados; sem GitHub Actions.

### Testes realizados
- SQL como `service_role`: criação sem e-mail com cinco módulos e demais tabelas esperadas: **PASS**.
- SQL com usuário Auth existente, vinculado como Master: **PASS**.
- SQL com e-mail de Master novo, sem criar usuário Auth, deixando registro pendente: **PASS**.
- SQL slug duplicado: **rejeitado sem deixar segundo restaurante**.
- SQL criação por UUID não-administrador: **bloqueada**.
- Todos os testes de gravação acima ocorreram sob transação **ROLLBACK**, sem registros de QA persistentes.
- Interface Super Admin simulada em runtime JS: submissão do formulário e criação acionadas com listagem OK e listagem indisponível; autogeração de slug: **PASS**.
- JS de `intervalo/index.html` e `platform.js` válido sintaticamente.
- **Pendente:** teste real de clique, SMTP, links de convite e carregamento HTTP do domínio.

---


## 0.9.0 — 2026-11-12 · Recuperação de acesso, Master e comandas

**Situação:** código enviado ao GitHub e funções Supabase ativas; QA estrutural/SQL aprovado. **E2E e entrega HTTP ainda não comprovados**.

### v0.8.0 — Acesso, credenciais e Super Admin
- Super Admin ganhou seção **Usuários do restaurante**, identificando vínculos e convites.
- Botão **Redefinir senha** para membro confirmado e não-administrador; exige reautenticação do próprio Super Admin por senha, gera senha provisória criptograficamente aleatória, mostra somente uma vez e não registra o segredo em logs ou banco em texto claro. A senha antiga deixa de valer.
- O backend define `app_metadata.intervalo_password_change_required` e os recursos privados negam acesso até o próprio usuário trocar a senha.
- Nova rota `/intervalo/trocar-senha` e botão em Minha Conta; troca valida senha atual no Supabase Auth e atualiza a senha com serviço do servidor, depois exige novo login.
- Botão **Renovar acesso Master** aumenta convite pendente em sete dias após confirmação da senha do Super Admin.
- Botão **Vincular minha conta como Master** associa explicitamente a própria conta Super Admin ao restaurante ativo (não remove outro Master), com auditoria e confirmação de senha.
- Ativação de Master no login ou em **Meus restaurantes** valida senha novamente no servidor e não depende de claims AMR potencialmente ausentes.
- Convite pendente do piloto Intervalo 27 prorrogado por sete dias, **sem ativar artificialmente a conta**.
- Nova página `/intervalo/recuperar-senha` com envio de link de recuperação e mensagem correta para erro/falta de SMTP; `404.html` reconhece as novas rotas.
- **Limitação:** envio real de e-mails de recuperação ainda depende da configuração de SMTP e URLs de redirecionamento no painel Supabase, que não pode ser concluída pelas integrações atuais sem configuração do titular. Não afirmar que um e-mail foi entregue.

### v0.9.0 — Atendimento e cozinha
- Nova operação transacional `intervalo_cancel_open_order`: apenas comanda ainda não enviada; cancela itens rascunho, libera a mesa e registra justificativa e autor.
- Proíbe cancelamento após envio à cozinha, e de comandas com pagamentos.
- Garçom ganhou botão **Cancelar comanda não enviada** e confirmação de motivo.
- Cozinha consulta novos pedidos automaticamente a cada 15 segundos com aba visível, sem WebSocket/Realtime e sem alegar impressão ativa.
- Imports dos módulos estáticos receberam `?v=0.9.0` para evitar cache de scripts anteriores.

### Evidências
- Edge Functions: `platform-control` v4, `activate-master` v3, `account-password` v1, `restaurant-core` v3, `restaurant-team` v4, `admin-provision` v3 e `account-cpf` v2.
- Teste transacional SQL com rollback: cancelar comanda aberta, cancelar itens de rascunho, liberar mesa, reabrir e bloquear cancelamento de comanda enviada.
- RPC de cancelamento: `anon` e `authenticated` sem EXECUTE; apenas service_role.
- Sintaxe JS do frontend, painel, conta, garçom e cozinha revisada.
- Master do Intervalo 27 continua pendente de ativação e convite foi prorrogado; nenhuma senha ou usuário foi alterado nesta implantação.
- Security Advisor mantém aviso de proteção contra senhas vazadas do Auth desabilitada.
- O endereço gaveblue.com.br/intervalo/ **não ficou acessível aos verificadores externos**, portanto os fluxos públicos e novos botões permanecem sem homologação de navegador.

### Documentos
- `QA-0.9.0.md`
- `ACESSO-RECUPERACAO-0.9.0.md`
- `DEPLOY-ROLLBACK-0.9.0.md`

---


## 0.7.0 — 2026-11-12 · Estrutura operacional multiempresa (prévia técnica)

**Situação:** esquema e APIs implantados, interfaces publicadas por commits na `main`; testes SQL e sintaxe aprovados. **Não homologada integralmente:** faltam browser/E2E, equipe ativa, hardware e validação no domínio.

### 0.3.0 — Cardápio
- Categorias, produtos, preço, disponibilidade e adicionais com restrição de tenant por FKs compostas.
- Administração de catálogo no painel `/intervalo/{slug}/catalogo`.
- `/intervalo/{slug}/cardapio` consulta apenas informações marcadas como publicadas, com módulo habilitado e restaurante ativo.
- Pedido público direto **não habilitado**, evitando pedidos não verificados.

### 0.4.0 — Mesas e comandas
- Cadastro de mesas e salões, uma comanda ativa por mesa (índice único parcial).
- Garçom abre comanda, adiciona itens com snapshot de preços, envia à cozinha e marca servido.
- Transições e preços calculados no servidor em funções transacionais exclusivas do `service_role`.

### 0.5.0 — Cozinha e impressão
- Fila de cozinha por restaurante com estágios recebido/preparando/pronto, atualização manual.
- Tabelas de impressoras e jobs, mas fila e agente de impressão **não estão ativados**.
- Protótipo **offline** do agente Windows em `print-agent/`; hardware B&G BG-06 não testado. Realtime automático pendente.

### 0.6.0 — Estoque e caixa
- Insumos, fichas técnicas e movimentos estruturados; cadastro de saldo inicial.
- **Baixa automática de estoque ainda não implementada**.
- Caixa manual com sessão de abertura, recebimentos parciais, quitação da comanda e fechamento com conferência.
- Registro de Pix/cartão é **somente declaratório**; não há transação com bancos, adquirentes nem emissão de documento fiscal.

### 0.7.0 — Plataforma, planos e relatórios
- Super Admin habilita módulos e suspende/reativa restaurantes por função protegida.
- Estrutura para planos e assinaturas sem precificação ou provedor de cobrança operacional.
- Relatórios gerenciais preliminares, limitados a recortes recentes; não fiscais.
- Piloto `intervalo27`: cinco módulos centrais habilitados **somente para testes**, sem cobrança.
- Frontend dividido em módulos JS independentes; rotas profundas suportadas pelo fallback condicional do GitHub Pages.

### Segurança, QA e riscos remanescentes
- 26/26 tabelas públicas com RLS; nenhum `SELECT` anônimo ou `INSERT/UPDATE` autenticado diretamente concedido às tabelas.
- Funções de comanda e caixa sem privilégio EXECUTE de `anon` ou `authenticated`; somente `service_role`.
- Teste SQL rollback: abertura de comanda, item, envio, preparação, pronto, servido, pagamento parcial e quitação, abertura e fechamento de caixa.
- Teste SQL rollback: vínculos estrangeiros entre restaurantes rejeitados.
- 10 módulos JS e frontend principal passaram por verificação sintática estática; não houve build React nem E2E.
- Cardápio do piloto não publicado, sem produtos/mesas/pagamentos criados artificialmente.
- Supabase Advisor alerta para proteção de senhas vazadas desabilitada.
- Endereço real ainda não verificado por HTTP neste ambiente (erro DNS); commit GitHub não é prova de propagação no domínio.
- Master do restaurante piloto continua pendente de ativação; nenhum fluxo real foi exercitado como Master/garçom/caixa.

### Artefatos
- `QA-0.7.0.md`: matriz técnica e limites de homologação.
- `ROTEIRO-TESTES-PILOTO.md`: passos para o titular testar os módulos.
- `DEPLOY-ROLLBACK-0.7.0.md`: estratégia de publicação manual e reversão sem remover dados.

---


## 0.2.1 — 2026-11-12 · Login alternativo por CPF

**Estado:** implementação aplicada; testes estruturais aprovados; homologação funcional pendente de CPF vinculado e login real.

### Funcionalidade
- Login aceita **e-mail ou CPF + senha** no mesmo campo e usa a mesma conta Auth.
- CPF **opcional** vinculado depois do primeiro acesso com e-mail e senha, em "Minha Conta".
- E-mail segue necessário para convite, recuperação de senha e confirmação; CPF não substitui senha nem comprova identidade civil.
- CPF único por usuário global, sem duplicar contas nem vínculos com os vários restaurantes.
- Cadastro/troca/desvinculação de CPF somente após reautenticação com a senha atual.
- Validação de 11 dígitos e dos dois verificadores do CPF; não aceita sequências iguais.
- Login por CPF faz correspondência **somente no servidor** e usa Supabase Auth por e-mail/senha para verificar credenciais.
- Banco guarda HMAC-SHA256 do CPF com chave de serviço exclusiva do backend e somente quatro últimos dígitos; CPF em texto claro não é armazenado no banco ou devolvido à UI.
- Proteção contra tentativas: limite de 5 tentativas/15 min por CPF e 25 por rede/15 min (quando origem de rede está disponível), com resposta genérica em caso de credencial incorreta.
- Funções publicadas no Supabase: \`cpf-login\` v2 (JWT desligado exclusivamente para etapa pré-login, controles próprios), \`account-cpf\` v1 (JWT obrigatório).
- Migrações de tabelas \`user_cpf_login\` e \`cpf_login_attempts\`, RLS habilitada e política negando totalmente acesso de clientes.
- Publicação manual de interface \`/intervalo/login\`, \`/intervalo/minha-conta\` e fallback de rota na 404.

### Ressalvas e homologação
- Não foi possível realizar teste E2E de CPF com usuário real. Nenhuma conta recebeu CPF automaticamente.
- Inicialmente, o funcionário precisa fazer seu primeiro login por e-mail para definir o CPF.
- O HMAC é derivado da chave secreta de serviço do projeto: se a chave mudar, será necessário planejar migração ou revinculação dos CPFs; para operação comercial, preferir segredo de HMAC independente e processo de rotação.
- O CPF informado é validado matematicamente, mas sua titularidade legal **não** é atestada sem verificação de identidade.
- Login por e-mail e recuperação de senha preservados.
- Security Advisor continua alertando que a proteção contra senhas vazadas do Supabase Auth está desativada.
- Ainda não há verificação HTTP/browser de propagação e autenticação ponta a ponta; versão em QA parcial.

---


## 0.2.0 — 2026-11-12 · Onboarding, equipes e permissões

**Estado:** implementação e migrações aplicadas; QA estrutural/parcial aprovado. **Ainda NÃO homologada integralmente** (falta teste funcional autenticado e verificação pública do domínio).

### Implementações
- Formulário de cadastro e atualização de dados do restaurante (telefone, endereço, CEP, cidade, UF e fuso horário).
- Conclusão do onboarding com validação mínima de telefone, cidade e UF.
- Cadastro de funcionários por convite, reconhecimento de conta já existente e vínculo ao restaurante sem duplicar o Auth.
- Papéis e equipe: Master, gerente, garçom, cozinha e caixa. Convites pendentes, ativação, revisão de função e revogação.
- Overrides individuais de acesso por módulo com validação do papel e do módulo de Gestão no backend.
- Seletor de restaurantes agora exibe somente módulos habilitados e permitidos, com troca por recarregamento integral de contexto.
- Super Admin pode vincular Master já existente a outro restaurante sem criar novo usuário Auth.
- Migrações SQL versionadas e Edge Functions autenticadas: \`restaurant-team\` v3 e \`admin-provision\` v2.
- Auditoria específica de ativação de funcionário e de alterações administrativas; a operação usa credenciais de servidor, não do cliente.
- Publicação manual: arquivos de navegação e gestão adicionados em \`/intervalo\`. Nada editado no GB+.

### Evidências da sessão
- Supabase Intervalo: 2 usuários Auth, 1 Super Admin ativo, 1 restaurante (Intervalo 27) e 1 Master pendente, em 12/11/2026.
- RLS ativa nas sete tabelas públicas pertinentes (incluindo duas novas). Gravações diretas por \`anon\` e \`authenticated\` negadas.
- Simulação de usuário externo sem vínculo: 0 linhas acessíveis; membro pendente não consegue ler \`restaurant_settings\` ou \`restaurant_modules\`.
- JavaScript inline e \`management.js\`: sintaxe aprovada.
- Supabase Security Advisor: 1 aviso de proteção de senhas vazadas desabilitada (pendência, sem alteração de configuração).
- Endereço público: arquivos enviados ao GitHub, mas acesso HTTP/browser não comprovado pelo ambiente de verificação.

### Limites para avançar
- Master do Intervalo 27 ainda deve ativar seu vínculo por login com senha.
- Testar fluxo completo com dois restaurantes e usuários reais antes de homologação final.
- Testar envio de convites reais e recebimento de e-mail antes de usar comercialmente.
- Compilação do frontend React/TypeScript original ainda não validada; a prévia de 0.2.0 é HTML/JS modular.
- Não publicar dados reais de terceiros nem conceder permissões no lugar de usuários.

---


## 0.1.1 — 2026-11-12 · Bootstrap do Super Admin

### Implementado
- E-mail do primeiro Super Admin vinculado **somente em configuração privada do banco**, não no JavaScript público.
- Bootstrap único com verificação de e-mail pelo Supabase Auth, sem armazenamento de senha em texto claro nem promoção baseada em `user_metadata`.
- Função/trigger no banco: após confirmação do endereço exato, registra `platform_admins` e auditoria; bloqueia reutilização do bootstrap.
- Nova rota `/intervalo/configurar-admin` para registrar acesso inicial por senha e confirmar e-mail.
- Login detecta Super Admin ativo e o direciona para `/intervalo/admin`.
- Roteamento profundo correspondente incluído no fallback 404, mantendo site institucional e GB+.
- Identificação visual atualizada para 0.1.1.

### Ambiente
- Supabase Intervalo: `fynaaiazebydorzllwip`, projeto separado do GB+.
- Registro do primeiro Super Admin: **pendente de confirmação de e-mail pelo titular**.
- Versão publicada como arquivos estáticos via GitHub, aguardando confirmação externa de propagação.

### Pendências para homologação
- Configurar Auth Site URL e allowlist de redirecionamentos no projeto Supabase.
- Confirmar capacidade de entrega de e-mail (SMTP padrão somente para membros da organização no plano Free; SMTP próprio para outros e-mails).
- Registro da conta, confirmação de e-mail, login e autorização real no painel Super Admin.
- Build React/TypeScript e testes de navegação física no domínio.
- Testes de segregação entre dois restaurantes com usuários reais.

**Estado:** QA parcial, não homologado integralmente.
