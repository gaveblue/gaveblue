# CHANGELOG — GB+ Gestão Financeira

## [3.0.1 — ABERTURA ANIMADA LOGO REVEAL (LIBERAÇÃO AUTORIZADA; QA PARCIAL)] — 2026-11-10

- **Identidade:** introdução minimalista com G e B formando-se gradualmente, finalizada pelo símbolo + azul; duração de 2,05 segundos e saída em fade suave.
- **Desempenho:** implementação em CSS local sem GIF, bibliotecas externas ou novos dados; transição não depende do carregamento da autenticação nem bloqueia o login após a animação.
- **Acessibilidade:** respeita `prefers-reduced-motion: reduce`, oculta a introdução para tecnologias assistivas e remove o elemento por temporizador de segurança mesmo se a animação falhar.
- **Tema:** cores apropriadas a claro/escuro aplicadas antes do primeiro desenho, com estilo isolado dos formulários financeiros.
- **PWA:** `splash.css` identificado no manifesto de atualização, CSS com cache-busting e versão de cache do service worker reservada para 3.0.1; não força reload de páginas abertas.
- **Conservação:** sem alteração de JavaScript financeiro, banco de dados, Supabase, saldos, lançamentos, faturas, contas ou fluxo de login.
- **Validação:** PR de desenvolvimento; regressão estática específica e conferência visual Android/desktop/instalação/offline exigidas antes de homologar e publicar. **Liberação expressamente autorizada em 10/11/2026 pelo responsável, mesmo com QA parcial; GitHub Actions 42843996230 falhou sem steps, sem teste executado. Não declarar homologação completa. Confirmar deploy separadamente antes de declarar publicação efetiva.**


## [3.0.0 — SISTEMA VISUAL FINANCEIRO UNIFICADO (LIBERAÇÃO AUTORIZADA; QA PARCIAL)] — 2026-11-09

- **Implantação confirmada:** build e deploy do GitHub Pages concluídos com sucesso em 09/11/2026 às 11:18:07 UTC (run 42607752722, commit bfa613cf). O acesso pelo domínio próprio e a experiência Android/PWA ainda precisam ser verificados.

- **Liberação autorizada em 09/11/2026:** testes fora de Functions em Node 22 para seletores (16 verificações) e ações de seleção (9 verificações) aprovados, após correção de required nativo e agrupamento Sem banco. Não houve execução de E2E visual: Chromium não iniciou; GitHub Actions falhou sem steps/runner. Publicação por decisão expressa do responsável, sem declarar homologação completa.
- **Escopo:** unificação visual de contas, cartões, cofrinhos, pagamentos, transferências, categorias e formulários. A regra de negócio financeira foi mantida.
- **Seletores:** o componente reutilizável `finance-picker-300.js` usa o Bottom Sheet existente, com busca, logos/ícones e valor selecionado. Opções de banco, conta, cartão, parceiro, categoria de compra, objetivos e ícones são exibidas no painel. O campo nativo permanece como fonte de `FormData`.
- **Conta personalizada e cofrinho:** ícone e objetivo usam Bottom Sheets; prazo e valor permanecem campos diretos; o saldo inicial opcional de novo cofrinho fica em seção expansível; ações e saldos preservados.
- **Contas e Cartões:** agrupamentos compactos, resumo visual de dinheiro em contas versus cofrinhos, ação principal clara, ações secundárias em `Mais opções`, cartões com compras e faturas recolhíveis sem remoção de dados.
- **Formulários:** Conta, Cartão, Compra, Categoria, Transferência e Baixa aplicam campos com o mesmo padrão visual. Campos opcionais de cartão recolhidos. Valor e data permanecem entradas diretas; diálogo compacto com rodapé de ações aderente ao scroll.
- **PC e celular:** Bottom Sheet expandido no celular e painel lateral no desktop; respeita tema claro/escuro, áreas seguras e redução de movimento. Formulário de lançamento mantém suas três etapas e botões inferiores existentes.
- **Conservação:** sem mutação do domínio financeiro, sem migração SQL, sem alteração da lógica de cartão e faturas, sem mudança de IDs ou dados anteriores.
- **3.0.0 visual:** painel administrativo e as respectivas proteções de acesso **não são incluídos** nesta entrega. Precisam de planejamento e homologação própria.
- **Verificação nesta execução:** regressão específica de seletores, formulários, cartões, cofrinhos e assets passou em execução JS isolada; sintaxe dos módulos revisada. GitHub Actions 42563325658 reportou failure sem runner e sem steps, não comprovando execução da suíte Node; QA visual Android/PWA e desktop segue pendente.
- **QA/publicação:** candidata em branch isolada; testes automatizados, regressões de fluxos existentes e validação real Android/desktop ainda requerem evidências. Não declarar homologação ou publicação antes da checagem.

## [2.9.0 — COFRINHOS E CONTAS PERSONALIZADAS (LIBERAÇÃO AUTORIZADA; QA VISUAL PENDENTE)] — 2026-11-09

- **Conta personalizada:** substitui “Dinheiro em caixa” na seleção de tipos; nome livre e ícone escolhido de uma paleta de pictogramas locais. Sem vínculo com instituição bancária.
- **Cofrinho:** cadastra uma meta com tipo (reserva de emergência, casamento, educação, viagem, casa ou outro objetivo), nome editável, ícone, valor-alvo em centavos e data final.
- **Painel de metas:** cofrinhos destacados na tela Contas e cartões, mostrando saldo, objetivo, porcentagem, prazo, falta para alcançar e estimativa de aporte por mês.
- **Aportes e resgates:** botões Guardar e Retirar abrem transferência interna, sem lançamento artificial de receita ou despesa; saídas de cofrinho não podem exceder seu saldo.
- **Compatibilidade:** arquivos de contas anteriores mantidos; novos campos opcionais em cada conta no documento JSON existente; não há nova tabela, mudança de RLS ou migração SQL.
- **Escopo:** telas de contas e cartões, visualização de saldos, registro de contas e transferências, validação e cache PWA. Cartões, faturas, lançamentos antigos, onboarding e LGPD mantidos.
- **Implantação confirmada:** GitHub Pages build + deploy concluídos com status success em 09/11/2026 às 04:18:26 UTC (execução 42561013587, commit 0e3963b4). O domínio final e PWA instalado ainda exigem conferência visual.
- **Liberação autorizada pelo responsável em 09/11/2026:** dois testes específicos executados em ambiente JS isolado passaram; a suíte integral no GitHub Actions falhou antes do início dos steps, sem evidência de execução. QA visual Android/PWA e validação online seguem pendentes. Não declarar homologado antes dessas evidências.

## [2.8.9 — CADASTRO DE CONTAS MAIS LIMPO (MERGE NA MAIN; SITE A CONFERIR)] — 2026-11-08

- **Escopo exclusivo:** tela Nova conta / Editar conta. Nenhum outro formulário sofreu redesign.
- **Seleção de instituição:** o campo único “Onde fica o dinheiro?” mostra a escolha atual e abre o **bottom sheet** já utilizado em lançamentos. Lista pesquisável com logo, abre totalmente expandida, pode ser recolhida à metade por gesto e fechada sem perder o formulário.
- **Caixa sem banco:** opção “Dinheiro em caixa” com ícone de carteira e subtítulo “Sem banco · caixa transitório”; não exige cadastro de instituição fictícia e grava `bankId=''` e `bank=''`.
- **Editor reduzido:** mantém Nome da conta, a seleção de banco/caixa, Saldo inicial opcional com valor destacado e Situação somente para conta existente. Removidos a busca em faixa, Outra instituição, Agência e Número da conta do formulário.
- **Compatibilidade:** dados legados de agência, número e instituição manual são mantidos ao editar; opção de instituição manual antiga permanece acessível no painel, sem adicionar novo campo. Todos os IDs e vínculos financeiros existentes permanecem intactos.
- **Saldo inicial:** opcional ao criar (vazio equivale a zero); seu significado contábil de saldo de abertura continua inalterado. Nada é transformado em receita.
- **QA e publicação:** PR #110 mesclado na branch principal. Testes do novo formulário, busca de bancos (12 casos), escolha banco/caixa, preservação dos dados antigos, regressões 2.8.2 (128) e 2.8.5 (32) e bottom sheet passaram. Site público e QA visual em Android/PWA ainda sem confirmação. Sem migração no banco.

## [2.8.8 — ÍCONES HD (MERGE EM MAIN; SITE A VERIFICAR)] — 2026-11-08

- **Problema da 2.8.7:** 13 logos exibidos por grade 4×4 de 256 px (cada marca tinha apenas 64×64 px), ampliados pelo CSS a 400%. Isso resultava em borrões especialmente nos logotipos com letras.
- **Correção:** 13 arquivos individuais `hq-*.webp`, todos **320×320 px**, criados a partir das imagens originais enviadas nesta conversa, com cores e proporções preservadas. Um arquivo por aplicativo, sem grade, sobreposição, cortes nem novos logotipos fictícios.
- **Catálogo:** mesmas **56 opções** e mesmos IDs da 2.8.7; nenhuma migração dos dados financeiros nem alterações em políticas ou painel administrativo.
- **Exibição:** renderer usa `logoPath` local e `object-fit: contain`; eliminada renderização do sprite, posicionamento por coordenadas, escala 400% e CSS antigo. Mantido fallback de imagem, e modos claro/escuro utilizam o mesmo arquivo.
- **PWA:** cache `gb-plus-shell-v2880`, HTML e imports atualizados, os 13 novos ícones incluídos no manifesto local da versão e o atlas antigo removido do manifesto.
- **Testes:** 13 imagens WebP individuais válidas de 320×320 px conferidas no GitHub; regressões de catálogo/renderer/serviços/financeiro passaram. **PR #108 mesclado em main**, com código da 2.8.8. Conferência visual final em Android/PWA e atualização do site ainda dependem de evidência de uso real.

## [2.8.7 — NOVOS APLICATIVOS E LOGOTIPOS (MERGE EM MAIN; SITE A VERIFICAR)] — 2026-11-08

- **Solicitação:** incorporar diretamente ao GB+ as imagens enviadas em duas mensagens, sem gerar telas/imagens independentes.
- **7 novas opções em Compras e pagamentos:** TikTok Shop, Shopee, Mercado Livre, Magalu, Casas Bahia, Temu e SHEIN. Todos com IDs novos estáveis (`shopping-*`), sem alterar IDs, nomes, categorias ou lançamentos dos 49 serviços anteriores.
- **6 ícones existentes atualizados:** HBO Max, 99Food, Prime Video, WhatsApp, Telegram e Spotify. A imagem enviada para cada serviço substitui apenas sua apresentação visual, preservando seus dados financeiros e vínculos.
- **13 artes locais:** atlas `assets/service-icons/service-brands-287.webp` de 256 × 256 pixels, organizado em 4 × 4 células de 64 × 64, com três células vazias. Imagens recebidas no chat, redimensionadas proporcionalmente, sem redesenhar marcas. Blob Git SHA `eb53925361d7e27940b6ae978c2debd1239229ab` conferido contra arquivo original preparado.
- **Exibição:** seletor Serviços e detalhes do lançamento usam posição do ícone na grade e fallback textual em caso de falha no carregamento; um único recurso armazenado localmente, sem CDN. Layout responsivo mantém modos claro e escuro.
- **Catálogo:** 49 → **56 serviços**. A página e os módulos tiveram as referências de cache atualizadas para build 2870; sem banco novo, migrações, disparos de marketing ou alterações em políticas.
- **Liberação:** PR #106 mesclado à branch `main`. Passaram os testes isolados de catálogo (56 serviços), painel e atlas (13 ícones), com hash Git confirmado. Ainda falta conferir em aparelho Android/PWA e confirmar a atualização efetiva do domínio; não declarar homologação visual antecipadamente.

## [2.8.6 — BIBLIOTECA, NAVEGAÇÃO E CONSENTIMENTO (MERGE EM MAIN; SITE A VERIFICAR)] — 2026-11-08
- **Liberação de código:** PR #105 mesclado em `main` no GitHub. O domínio público não pôde ser consultado diretamente deste ambiente; confirmar atualização em PWA Android antes de declarar homologação visual.
- **Supabase administrativo:** versão 9 da Edge Function `gbplus-admin` implantada, preservando convites, envio de mensagens e histórico; marketing agora exige consentimento válido na versão `2026-11-08-v1` dos Termos e Privacidade imediatamente antes do envio. Nenhuma campanha foi disparada nesta implantação.
- **QA:** validação de sintaxe dos módulos alterados, regressões isoladas de 128 verificações (2.8.2) e 32 (2.8.5), simulador de bloqueios do painel administrativo (consentimento antigo/ausência de aceite e não administrador). Ainda sem evidência de sessão real de homologação no Android.

### Consolidação e política de privacidade — build 2866
- Recebidos e incorporados em arquivos locais os ícones quadrados **Canva, inDrive, 99, Rappi e Globoplay**. Os cinco IDs existentes agora apontam para `.webp` locais. Total: **49 dos 49 serviços com imagem/vetor local**. Sem logotipos inventados, recortes ou dependência de CDN.
- Novo padrão dos cinco botões móveis: **Início, Lançamentos, Novo, Carteira, Mais**. A configuração antiga padrão é migrada visualmente, sem sobrescrever atalhos que o usuário tenha personalizado.
- **Termos de Uso e Privacidade 2026-11-08-v1**: páginas vinculadas, aviso de mudança após login com aceite obrigatório apenas dos termos, marketing em segunda caixa opcional e desmarcada; registro server-side do consentimento e de suas versões.
- **Marketing**: preferências configuráveis em Mais, revogação gratuita, eventos auditados no Supabase; API administrativa `marketing-audience` retorna somente usuários com opt-in válido, confirmação de e-mail e políticas atualizadas, **sem saldos ou lançamentos**. Nenhuma campanha é enviada por essa implementação; futuros envios devem revalidar a autorização no momento do disparo.
- Proteção: RLS e permissões restritas em tabela de termos; RPCs autenticadas com `auth.uid()` para obter estado, aceitar políticas e revogar consentimento; versão e horário gerados pelo banco.
- Testes e publicação: registrar evidências e estado da implantação no PR, sem confundir aprovação do usuário para lançar com a execução efetiva do QA.


### Recebimento de quatro logotipos — 08/11/2026 (revisão candidata build 2865)
- **Arquivos recebidos nesta conversa e incorporados à branch de desenvolvimento:** `Plus Delivery` → `assets/service-icons/plus-delivery.webp` (160×160), `99Food` → `assets/service-icons/99food.png` (261×258), `Prime Video` → `assets/service-icons/prime-video.webp` (128×39) e `Disney+` → `assets/service-icons/disney-plus.webp` (180×101).
- **Integridade:** cada objeto binário enviado ao GitHub foi comparado com o hash Git do arquivo preparado localmente; quatro coincidências confirmadas. Redução de tamanho e transcodificação não modificam a composição dos logos, as cores principais nem a proporção.
- **Renderer:** `serviceIconMarkup` aceita exclusivamente caminhos relativos locais fixados no catálogo para SVG/PNG/WebP e mantém fallback textual caso a imagem falhe. O CSS usa fundo neutro e `object-fit: contain` em ambos os temas; não recortar wordmarks horizontais.
- **Status da biblioteca:** **44 de 49 serviços com arte local**, 5 ainda sem arquivo: Globoplay, Rappi, 99, inDrive e Canva. Disney+ é imagem horizontal enviada (não ícone quadrado oficial); pode ser substituída posteriormente por asset quadrado.
- **PWA:** referências e versão de cache atualizadas para `2865`, quatro novos arquivos incluídos no manifesto de atualização. Mantidos IDs e lançamentos existentes, sem alterações financeiras.
- **Status:** somente branch/PR em rascunho, não publicado e não homologado. Testes de código e visualização final em Android/PWA ainda necessários.


- **Mais + Configurações (solicitado):** a tela Mais passa a exibir as opções de configurações em seções expansíveis; Preferências vem expandida por padrão e Dados e Registros, Sistema, Suporte e Administração ficam acessíveis sem navegar para uma rota duplicada. Minha Conta continua no topo, única. A rota `#settings` redireciona para `#more`, inclusive em atalhos antigos. Backup, notificações, aparência, exclusão de conta e confirmação de limpeza reutilizam as ações existentes.
- **ChatGPT (símbolo incorporado):** `assets/service-icons/chatgpt.svg` agora é um arquivo local, sem requisição a terceiros. Fonte vetorial identificada: SuperTinyIcons `images/svg/chatgpt.svg` (licença MIT; crédito no documento de fontes). O arquivo não foi extraído do ZIP oficial da OpenAI; tratar como reprodução pública identificativa da marca, sujeita às regras da OpenAI. O carregamento utiliza caminho fixo validado e fallback neutro caso o arquivo falhe. Modo claro e escuro conservam o branco/preto do desenho.
- **Ícones oficiais ainda pendentes (9):** Disney+, Prime Video, Globoplay, 99Food, Plus Delivery, Rappi, 99, inDrive e Canva. As páginas fornecidas foram avaliadas, mas os downloads binários/ZIPs ou imagens de lojas não puderam ser incorporados com verificação de conteúdo neste ambiente. Permanecem letras neutras; **não** afirmar que já possuem logo oficial.
- **Publicação:** todos os arquivos preparados apenas no PR de rascunho. Sem merge, deploy ou alteração na versão pública 2.8.5. QA real Android/PWA e Supabase continuam pendentes.
- **Testes isolados executados com fontes atuais da branch:** `gbplus-286-more-brand-regression.mjs` (Mais + Configurações + SVG local + fallbacks + navegação), `services-regression.mjs`, `bottom-sheet-regression.mjs`, `category-service-auto-regression.mjs`, `picker-expanded-regression.mjs`, `pf-entry-ui-regression.mjs`, `gbplus-281-interface-regression.mjs` (20 verificações), `gbplus-282-regression.mjs` (128 verificações), `gbplus-285-simple-theme-regression.mjs` (32 verificações). Todos passaram em execução isolada V8 com dependências locais simuladas. Ainda não equivalem a uma sessão de navegação real no Android.
- **Total de ícones locais agora:** 13 Simple Icons + 26 Font Awesome vetoriais (39) + 1 arquivo `ChatGPT.svg` (40 serviços com arte local). 9 continuam em monograma.


**Solicitação:** ampliar o catálogo de aplicativos usados para identificar despesas e substituir identificações genéricas por símbolos públicos confiáveis onde possível. O responsável informou que a versão 2.8.5 estava homologada; isso não constitui homologação antecipada das alterações 2.8.6.

- **Correção das categorias (captura Android):** removidas das sugestões para novos cadastros as categorias duplicadas **Aplicativos de transporte, Assinaturas digitais e Streaming**. A categoria única **Serviços** passa a ser o ponto de entrada para os oito grupos internos do catálogo, e a prévia Netflix/Spotify/iFood aparece só nela. O seletor do lançamento oculta as três opções antigas para novos registros. IDs antigos permanecem preservados para títulos, compras no cartão e importações já vinculados; na edição de um título antigo, a categoria previamente selecionada continua disponível. Na gestão de categorias, as opções legadas sem vínculo deixam de poluir a tela e aquelas com histórico são identificadas.
- **Navegação:** proposta de reunir configurações na tela Mais discutida com o responsável; **não implementada nesta candidata** para permitir validar a organização antes de alterar as rotas.
- **Catálogo:** 26 → **49 serviços**, com IDs antigos preservados e novos grupos Redes sociais e comunicação, Games e entretenimento e Compras e pagamentos. Disponibilizados YouTube, Twitch, SoundCloud, Bandcamp, Google Drive, Dropbox, Slack, Trello, Figma, GitHub, Discord, Patreon, Instagram, TikTok, WhatsApp, Telegram, Facebook, X, Steam, PlayStation, Xbox, Amazon e PayPal.
- **Logotipos:** 13 símbolos Simple Icons existentes permanecem locais; incorporados 26 mapeamentos Font Awesome Free Brands (23 novos e YouTube Premium, Google One, Microsoft 365), totalizando **39 serviços com vetor local**. As 10 marcas sem arquivo fiel confirmado usam monogramas legíveis, sem tentativa de fabricar uma marca.
- **Privacidade e offline:** somente SVG paths incorporados aos módulos, sem novas consultas de imagem/CDN no aplicativo. Dimensões originais preservadas via viewBox. Fontes e licenças em `SERVICE-ICON-SOURCES.md`.
- **Compatibilidade:** seletor expansível, pesquisa, personalização, nomes de serviço, receitas, saldos, cartões, faturas e dados existentes não alterados.
- **Integridade dos dados:** validação da base foi atualizada para aceitar IDs dos novos grupos `social`, `games` e `shopping`, com teste de salvamento/restauração e rejeição de IDs desconhecidos. Importações da validação sincronizadas com revisão de cache, inclusive adaptador Supabase. Sem cobranças ou novos lançamentos automáticos.
- **Cache:** módulos dependentes, identificador da página e shell PWA preparados para a candidata. `version.json` indica expressamente `candidate_not_published` e não inventa data de publicação.
- **Testes:** regressões de catálogo e seletor atualizadas para 49 serviços, integridade de IDs, ícones locais e fallbacks. Verificações de integração Android/PWA, Supabase e aceite visual ainda necessários para homologar e publicar. Não atribuir status “homologado” sem evidência da 2.8.6.

## [2.8.5 — BOTÃO DE TEMA SIMPLES, SOL E LUA (LIBERAÇÃO WEB PARA TESTE; HOMOLOGAÇÃO PARCIAL)] — 2026-11-08

**Motivo:** o usuário rejeitou a aparência e o funcionamento do seletor Liquid Glass que continuava visualmente inadequado no PWA Android. Solicitou retirar completamente o controle e substituí-lo por uma flag normal, com sol/lua simples de biblioteca. A versão foi preparada para ser publicada e testada no celular.

- **Cabeçalho:** excluído o iframe `gb-top-theme-frame` e substituído por um interruptor pequeno e discreto `gb-theme-toggle` com dois ícones da biblioteca Lucide-style já incorporada ao projeto. Sem fundo preto no modo claro.
- **Interação:** clique/toque para alternar entre temas. Sem arrasto, partículas, mola, barra orbital, comunicação de mensagens entre janelas ou pré-visualização de cores em tempo real.
- **Persistência:** reutiliza `top-theme` e `commit` já existentes; mantém a preferência salva, sem tocar em lançamentos. O estado visual e os rótulos acessíveis acompanham o tema escolhido.
- **Acessibilidade:** papel de interruptor, `aria-checked`, rótulo contextual, foco visível, suporte a teclado e respeito a movimento reduzido.
- **Configurações:** texto de Aparência atualizado para refletir o interruptor simples e as opções explícitas de modo claro/escuro; a área Minha Conta continua na página Mais.
- **Limpeza:** removidos código e CSS de animações do seletor no aplicativo. O laboratório experimental pode permanecer no histórico do Git, mas não é mais carregado no PWA e saiu da lista de assets da versão.
- **Testes:** regressão `gbplus-285-simple-theme-regression.mjs` cobre botões, símbolos, acessibilidade, persistência e remoção do iframe. Regressões de categorias, avisos, cartões e navegação executadas. Testes dos seletores 2.8.3/2.8.4 que já não existem foram retirados da suíte ativa (originais permanecem no histórico Git).
- **Status:** publicação web autorizada como versão 2.8.5 build 1 para permitir testes no Android. Ainda pendente validação visual no PWA instalado e testes integrados em conta Supabase de demonstração. Nenhum APK.

## [2.8.4 — SÍMBOLOS DO LIQUID GLASS NO ANDROID (LIBERAÇÃO WEB PARA TESTE; HOMOLOGAÇÃO PENDENTE)] — 2026-11-08

**Origem:** capturas reais do PWA Android 2.8.3 mostraram o seletor sem sol/lua em ambos os temas e luz azul persistindo no modo claro. As capturas mostram telas distintas (Início e Fluxo de caixa); **não comprovam**, por si só, que a mudança do tema causou troca de página.

- **Símbolos visíveis:** o controle compacto passa a usar pequenos ícones pixelados em SVG para o sol e a lua, com contraste alto em cada tema e opacidade proporcional ao arrasto. O laboratório/protótipo maior mantém o canvas de partículas e sua transformação original.
- **Faixa luminosa:** inicialização segura do comprimento da trajetória SVG e tratamento de falhas de `getPointAtLength()`/`getTotalLength()` em WebViews, preservando a cor dourada no modo claro e azul no modo escuro mesmo quando APIs geométricas não estão disponíveis.
- **Mantido:** arrasto progressivo claro/escuro, mola, gradação de cores da interface, checagem de origem, salvamento apenas após o fim do gesto, navegação e dados financeiros.
- **Cache:** query do iframe e do módulo principal atualizada para `20261108-2841`; nenhuma alteração ou migração de dados.
- **Testes:** 24 verificações de símbolos, geometria e tema aprovadas em V8; miniatura visual isolada em Chromium exibiu corretamente os ícones nas duas cores. Teste integrado em PWA Android real ainda pendente.
- **Status:** publicação web da **2.8.4 build 1** autorizada em 08/11/2026 pelo responsável para realizar a homologação no próprio PWA instalado. O código e os testes isolados foram verificados; aceitação visual no Android/PWA e validação integrada continuam pendentes. Não usar GitHub Actions para compilar APK.

## [2.8.3 — LIQUID GLASS CLARO E TRANSIÇÃO SUAVE (LIBERAÇÃO WEB AUTORIZADA; HOMOLOGAÇÃO PARCIAL)] — 2026-11-08

**Autorização:** publicação imediata da versão web 2.8.3 solicitada pelo responsável após aprovação da correção visual e da transição. Não usar GitHub Actions para compilar APK.

**Origem:** aprovação visual pelo responsável de um seletor claro/escuro menor, com cápsula branca translúcida, borda cinza sutil e iluminação dourada discreta no modo claro, sem moldura preta. Alteração preparada na branch `fix/gbplus-283-light-glass-header`.

- **Causa da moldura preta:** no iframe compacto, o documento mantinha `color-scheme: dark` independentemente do tema. O fundo transparente do iframe era desenhado sobre uma tela escura ao redor do trilho claro; reproduzido em navegador Chromium.
- **Correção:** o tema inicial é definido antes do primeiro desenho (modo claro ou escuro, com variáveis CSS correspondentes), e a indicação `color-scheme` acompanha o arrasto. O iframe segue transparente; o trilho claro e a lente receberam gradiente branco/cinza suave, bordas delicadas e sombras de baixa intensidade.
- **Transição progressiva (novo pedido):** o botão agora envia a posição fracionária de 0 a 1 para o aplicativo enquanto o usuário arrasta. O fundo, os cartões, os elementos de vidro e a barra inferior interpolam as cores com `color-mix()`, acompanhando a mola após soltar; textos trocam o contraste no ponto médio para permanecerem legíveis.
- **Segurança e persistência:** mensagens aceitas apenas do iframe de origem verificada; progresso inválido é ignorado. A prévia é apenas CSS e **não grava dados**. O tema é salvo uma única vez depois que o usuário solta; novo arrasto cancela uma gravação pendente, e a visualização volta ao tema salvo em caso de falha.
- **Preservado:** tecla/arrasto do seletor, trajetória orbital com luz azul no modo escuro e dourada no modo claro, sincronização com o tema salvo, notificações, dados financeiros e layout das demais telas.
- **Cabeçalho:** componente discretamente menor (59px de altura) e cache invalidado nos arquivos CSS/JS e no próprio iframe (`20261108-2832`).
- **Evidências:** comparação visual headless no Chromium reproduziu o defeito e a eliminação da moldura preta em modo claro. Regressões locais aprovadas: 131 verificações 2.8.2, 26 avisos/interface, 20 cartões/navegação, 23 Liquid Glass anterior e 19 específicas do vidro claro e 27 novas verificações do arrasto progressivo (tema claro/escuro, origem, persistência e cancelamento). Validação adicional de cores intermediárias no Chromium headless.
- **Status:** publicação web 2.8.3 build 1 expressamente autorizada em 08/11/2026. Testes direcionados aprovados; homologação integral Android/PWA e Supabase autenticado ainda pendente. A publicação não inclui APK nem leitura de notificações bancárias.

## [2.8.2 — CARTEIRA, CATEGORIAS, LIQUID GLASS E AVISOS (LIBERAÇÃO WEB AUTORIZADA; HOMOLOGAÇÃO PARCIAL)] — 2026-11-08

**Liberação web 2.8.2 build 1 autorizada expressamente em 08/11/2026 para empacotamento Android.** GitHub Actions indisponível para APK. Homologação integral continua pendente.

- **Saldo e bancos:** oculta apenas a barra visual de rolagem horizontal dos bancos no card de saldo, mantendo gesto de deslizar e acessibilidade.
- **Carteira:** rótulo do atalho móvel antes chamado "Cartões" agora é **Carteira**, sem mudar a rota interna, as faturas ou as contas relacionadas. Página Mais também reflete o nome.
- **Categorias ampliadas:** 50 sugestões adicionais para contas novas; contas existentes recebem botão opcional para incorporar categorias não cadastradas, sem sobrescrever categorias próprias, valores ou lançamentos. Biblioteca de ícones expandida de 21 para 55 opções reais, com busca.
- **Cabeçalho Liquid Glass:** seletor aprovado em tamanho compacto no topo, com vidro, lua/sol pixelados e luz orbital azul/dourada preservados; estado salvo pelo fluxo de preferência existente, com origem e janela do iframe validadas. O seletor grande deixa de aparecer em Configurações; permanece escolha acessível e simples de tema.
- **Minha Conta:** acesso deslocado para um cartão de perfil na página **Mais** e removida a criação dinâmica de botão no topo.
- **Nova tela de notificações:** avisos **dentro do aplicativo** para atrasados, vencimentos do dia e futuros, considerando pagamentos parciais, quitações, cancelamentos, despesas e receitas. Preferências: ativar, antecedência de 0 a 30 dias, receber/pagar e mostrar atrasados. **Não inclui push com app fechado nem requer permissões do dispositivo.**
- **Relatórios:** nova opção "Painel de vencimentos" reutiliza informações da visão analítica anterior, sem perder dados.
- **Persistência:** usa o documento de configurações existente; parâmetro opcional de avisos mantém compatibilidade com backups e usuários anteriores. Sem migração SQL.
- **Teste:** módulos e cenários de categorias, ícones, notificações, tema, rotas e cache foram verificados em execução isolada; suíte `gbplus/tests/gbplus-282-regression.mjs` adicionada. **Ainda precisa da execução nativa completa, do teste integrado Android/PWA e da homologação em ambiente autenticado de teste.**
- **Status:** liberação web autorizada com testes parciais documentados. Requer confirmação da propagação do site e validação separada do APK; não inclui leitura de notificações bancárias.

## [2.8.1 — CORREÇÃO DE CARTÕES E NAVEGAÇÃO (LIBERAÇÃO AUTORIZADA; HOMOLOGAÇÃO PARCIAL)] — 2026-11-08

**Liberação autorizada expressamente em 08/11/2026.** Preparada a versão 2.8.1 build 1 para publicação; a homologação técnica completa ainda não foi comprovada.

- **Correção de erro nos cartões:** restabelecida a concatenação do HTML das faturas. Antes, a ausência de `+` causava `TypeError: "string" is not a function` quando existia fatura. Garantida a atualização das importações e do cache em `accounts-cards-view.js` e `app.js`.
- **Barra superior:** texto "Conta online" removido visualmente do cabeçalho para liberar espaço e dar prioridade ao botão de alternar tema; sincronização e indicador de estado nas outras áreas preservados.
- **Mais como página:** a ação antes aberta em pop-up agora é a rota `#more`, com 16 destinos por grupos, histórico de navegação e item ativo na barra.
- **Liquid Glass centralizado:** posição e largura do foco animado medidas a partir do atalho real, inclusive cartões e atalhos personalizáveis; ícones/rótulos centralizados.
- **Testes parciais:** teste de renderização real de fatura pendente e quitada, 18 cenários da interface (mais duas conferências do cache), 22 verificações do toggle e sintaxe JS aprovados no V8 isolado. A suíte integral Node/Android/PWA e o teste autenticado Supabase ainda precisam de comprovação.
- **Homologação:** testes funcionais isolados e regressões estáticas aprovados; testes integrais Node, Android/PWA e Supabase autenticado ainda pendentes. A publicação autorizada não equivale a homologação completa.



## [2.8.0 — FATURAS + LIQUID GLASS (LIBERAÇÃO AUTORIZADA; HOMOLOGAÇÃO PARCIAL)] — 2026-11-08

### Interfaces aprovadas — incluídas na 2.8.0 em 08/11/2026
- **Navegação Liquid Glass:** lente translúcida segue o atalho ativo, preservando cinco atalhos, personalização e botão Novo. Modos claro/escuro, foco e preferência por movimento reduzido respeitados; barra oculta em Configurações como antes.
- **Seletor de tema Liquid Glass:** protótipo v2 aprovado integrado ao modal Configurações → Aparência; lua/sol pixelados e luz orbital azul embaixo → direita → dourado em cima. Tema gravado pelo fluxo financeiro atual, com evento limitado à mesma origem e janela, conclusão da animação antes da gravação e limpeza do iframe/timer ao fechar.
- **Estado:** interfaces aprovadas e incluídas na versão autorizada; homologação técnica integral **pendente**. Nenhuma migração SQL ou modificação manual em dados financeiros reais foi realizada.


**Liberação autorizada expressamente pelo responsável em 08/11/2026.** Homologação técnica integral não foi concluída: testes funcionais isolados e estáticos passaram, mas a execução da suíte Node foi bloqueada no GitHub Actions antes de começar; faltam Android/PWA integrado e Supabase com conta de testes. Publicação não deve ser confundida com homologação.

- **Faturas de cartões:** cada cartão passa a exibir o próximo fechamento, vencimento previsto, total em aberto, faturas existentes, situação de pagamento e um botão **Pagar**, conectado ao formulário de baixa já usado pelo Contas a pagar.
- **Lançar saldo de fatura externa:** novo formulário para registrar o valor consolidado de uma competência que ainda não possui compras no GB+. Gera um único título `cardInvoice` com vencimento e conta pagadora conforme o cartão; não desconta o saldo bancário até a baixa.
- **Proteção contra duplicidade:** uma competência não aceita simultaneamente saldo importado e compras individuais. Edição de valor de fatura consolidada mantém a origem e não multiplica títulos; faturas com baixas existentes exigem estorno antes de mudar valores ou excluir.
- **Categorias:** preservada a lista alta com Serviços priorizado e abertura automática já implementada em 2.7.7; o nome de categoria reservado `Fatura de cartão` deixa de aparecer entre as despesas avulsas no formulário geral, evitando registro acidental de uma segunda despesa. Categorias das compras permanecem independentes da obrigação de pagamento da fatura.
- **Validação técnica preliminar:** testes de cenários com as funções financeiras reais em V8 (criação, vencimento, duplicidade, edição, baixa parcial e valor de limite), além de validação real de `store.validateDatabase` para documento com fatura importada e baixa parcial. Não equivalem à execução integral nativa da suíte Node.
- **Pendente para homologar:** executar `node gbplus/scripts/homologar-local.mjs`, comprovar telas e navegação no Android/PWA e conferir gravação online em usuário de testes. O `version.json` foi preparado para 2.8.0 build 1 por autorização explícita; o lançamento ocorre com homologação parcial documentada. Ver `PLANO-2.8.0-FATURAS.md`.


## [2.7.8 — CORREÇÃO DE RODAPÉ APÓS VOLTAR DA REVISÃO] — 2026-11-07

**Hotfix de navegação:** após avançar pela terceira etapa para a prévia final, o botão Voltar restaurava apenas o `<form>`, mas os três conjuntos de botões Próximo/Voltar/Revisar haviam sido movidos para fora dele, para o rodapé fixo. Assim, a cópia destinada à volta não incluía a navegação e ela desaparecia.

- `js/app.js`: criada `serializeEntryFormForReview(form)`, que copia os campos preenchidos (inclusive radios, checkboxes e seletores) e reinsere, **apenas na cópia**, os três rodapés destacados. O `openModal` move os rodapés de volta para a área fixa, sem alterar a estrutura visual da versão 2.7.7. A restauração reativa a etapa indicada.
- **Cobertura:** tanto revisão de despesa/receita normal quanto revisão de compra em cartão usam a mesma serialização. Dados mantidos sem gravar títulos ou movimentações durante a navegação.
- **Regressão:** `tests/entry-review-navigation-regression.mjs` executou 72 asserções no código real em V8 adaptado, incluindo prévia, retorno, valores, radios, seleção de conta, checkbox e sequência 3→2→1→2→3. Testes de rodapé fixo, preferências, etapa final, três etapas, cartão e seletores também passaram no ambiente isolado.
- `index.html`, `sw.js` e `version.json`: versão 2.7.8 build 1 e atualização do cache da PWA.
- **Limite de homologação:** não foi realizada navegação visual em Android/PWA real nem execução nativa de toda a suíte no Node.js; não declarar homologação integral só pelo sucesso do deploy.


## [2.7.7 — PAINÉIS EXPANDIDOS E VALOR LIVRE] — 2026-11-07

**Correção visual do lançamento e dos seletores.** A altura compacta do formulário e os botões fixos no rodapé continuam iguais. O campo numérico da primeira etapa fica sem contorno, sublinhado ou borda mesmo em foco. Retirado o bloco persistente de erro abaixo da descrição; erros de validação seguem visíveis apenas quando ocorrerem, em aviso temporário, sem dispensar regras financeiras.

- **Categorias:** Serviços passa a ser listado primeiro nas despesas; as demais categorias permanecem ordenadas alfabeticamente. Selecionar Serviços continua abrindo automaticamente o painel de serviços, sem perder o que já foi digitado.
- **Painéis de categorias e serviços:** abrem expandidos no primeiro toque. Arrastar a alça para baixo recolhe o seletor até aproximadamente metade da tela; busca, foco, fechamento e seleção foram preservados.
- **Contas e cartões na 3ª etapa:** as listas nativas foram substituídas visualmente por gatilhos que abrem o mesmo painel alto. Os campos originais permanecem no formulário para gravação, sem alteração de contrato. Cada opção mostra instituição/banco (quando cadastrado), nome e saldo disponível da conta calculado pelo GB+ ou limite disponível calculado do cartão, incluindo identificação dos quatro últimos dígitos quando existente. Sem sincronização bancária em tempo real.
- **Usabilidade/acessibilidade:** seletores atualizam o resumo da escolha e o rótulo acessível; os campos ocultos não acionam validação nativa de `required`, mas seguem sujeitos à validação de negócio da terceira etapa.
- **Cache e versão:** `index.html`, imports de módulos, `sw.js` e `version.json` atualizados para 2.7.7 build 1.
- **Evidências de regressão antes da integração:** 26/26 arquivos de teste `.mjs` aprovados em V8 isolado, com adaptadores de módulos Node e fontes reais da branch. O teste novo `picker-expanded-regression.mjs` verificou ordenação, expansão inicial, gesto de recolher, dados das contas/cartões e ausência de aviso persistente. Limitação: execução nativa completa no Node e testes visuais em dispositivo Android/PWA real ainda não estão comprovados; publicação não equivale a homologação integral.


## [2.7.6 — LANÇAMENTOS, CARTÕES E ALERTAS DE ATRASO] — 2026-11-07

**VERIFICAÇÃO PRÉ-PUBLICAÇÃO:** 25 de 25 arquivos de regressão existentes foram executados com seus códigos reais em JavaScript V8 e adaptações para leitura de arquivos, asserções e recursos Node; todos passaram. Cinco cenários financeiros extras de edição e redistribuição entre cartões também passaram. **Homologação integral ainda pendente:** não houve execução nativa da suíte em checkout Node.js, nem teste visual real do Android/PWA ou sessão Supabase autenticada. A publicação, quando realizada, não deve ser descrita como homologação integral.

- **Etapa 1:** o campo Descrição deixa de ser obrigatório. Se ficar vazio, o nome da categoria será usado na identificação do lançamento; mantém os demais limites e validações. Digitação do valor sem contorno de caixa, com foco indicado por linha discreta.
- **Etapa 2:** removida a pergunta Forma de movimentação (conta/debito). Periodicidade, documento e observações permanecem.
- **Etapa 3:** escolher Deixar pendente, Baixar em uma conta ou Lançar no cartão de crédito. A compra no cartão gera exclusivamente parcelas de fatura, sem título financeiro duplicado nem baixa de banco. Para evitar distorções, a baixa imediata em conta continua limitada aos lançamentos únicos; cartão permite despesas únicas e parceladas até 36 vezes, não receitas nem recorrências automáticas.
- **Vencimentos:** prévia de parcelas fica escondida por padrão, acessível no botão Detalhar vencimentos, que abre uma folha nativa sem remontar o formulário. Ao escolher cartão, os vencimentos são calculados pelas regras do cartão.
- **Lançamentos:** indicação vermelha Em atraso há X dias para títulos vencidos e ainda com saldo, utilizando dias de calendário.
- **Cartão de crédito:** edição de compra a partir da tela de cartões e dos detalhes da fatura. Edição financeira recalcula as faturas em cópia isolada do banco e aplica apenas após passar nas validações de limite, datas e parcelas. Em faturas com pagamentos existentes, somente metadados podem ser editados até que a baixa seja estornada; não é possível alterar diretamente o total da fatura.
- **Regressões:** 25/25 arquivos de testes executados em V8 adaptado com fontes da PR e resultados aprovados. Testes ponta a ponta em navegador/Android e suíte Node completa ainda requerem evidência.


## [2.7.5 — NAVEGAÇÃO FIXA NO RODAPÉ DO LANÇAMENTO] — 2026-11-07

**ALTERAÇÃO DE INTERFACE:** os botões **Próximo**, **Voltar** e **Revisar/Salvar** voltam ao rodapé fixo do modal, fora da área rolável. O X continua no cabeçalho como única ação de fechar. A área central do formulário é rolável de forma independente nas três etapas; a altura compacta do painel móvel `min(575px,88dvh)` permanece inalterada.

- `js/app.js`: em vez de transferir as ações para o cabeçalho, monta navegação em `.gb-entry-bottom-nav` após `.modal-body`. Os controles das etapas acompanham o estado do formulário e o botão externo de revisão/salvamento mantém `form="title-form"`.
- `bottom-sheet.css`: rodapé com altura compacta e área de toque adequada; navegação visível inclusive com formulário extenso, sem alterar dados, rolagem da seção financeira ou processamento da baixa.
- `index.html`, `sw.js` e `version.json`: identificação 2.7.5 build 1 e atualização de cache PWA para que a mudança seja carregada.
- `tests/entry-footer-regression.mjs`: nova verificação dos três rodapés, vínculo do botão de salvar ao formulário, permanência do X e altura fixa. `tests/period-preference-regression.mjs` atualizada.
- **Testes isolados em JavaScript com fontes reais (não equivalem a CI integral):** `entry-footer-regression.mjs`, `period-preference-regression.mjs`, `title-three-step-regression.mjs` e `category-service-auto-regression.mjs` passaram. Validação visual real Android/PWA e execução da suíte completa em Node.js permanecem pendentes. Publicação e homologação integral são status diferentes.


## [2.7.4 — SEGURANÇA ADMINISTRATIVA E HOMOLOGAÇÃO LOCAL] — 2026-11-07

**LIBERAÇÃO AUTORIZADA PELO RESPONSÁVEL EM 07/11/2026; DEPLOY E HOMOLOGAÇÃO INTEGRAL AINDA DEVEM SER VERIFICADOS.** A API administrativa `gbplus-admin` foi reforçada no Supabase (Edge Function v2) com `verify_jwt=true` no gateway e autorização adicional por `auth.getUser()`. Esta versão registra a configuração em `supabase/config.toml` e mantém as demais funções intactas.

**Processo sem GitHub Actions:** removido o workflow de regressões financeiras, sem alterar o mecanismo de publicação do GitHub Pages. Adicionado `gbplus/scripts/homologar-local.mjs` para executar arquivos `.mjs` em Node.js 22 e gerar relatório JSON, com orientações em `gbplus/HOMOLOGACAO-SEM-ACTIONS.md`.

**Evidências disponíveis:** 22/22 arquivos de teste passaram em JavaScript V8 isolado com adaptadores de leitura/assertiva/codec e simulações de requisições. Corrigida uma asserção do teste de conciliação pendente que confundia a opção de ação em lote com a escolha por movimento, sem alterar a lógica financeira de produção.

**Limitações:** não houve execução integral de `node gbplus/scripts/homologar-local.mjs` em checkout Node real, nem teste Android/PWA ou sessão administrativa real. A autorização para publicar não equivale à homologação integral. O status público só poderá ser declarado após confirmação objetiva do deploy GitHub Pages. Nenhum saldo, lançamento ou movimentação foi alterado por esta release.

## [2.7.3 — LANÇAMENTO COM AÇÕES NO TOPO E PERÍODO MEMORIZADO] — 2026-11-07

**PUBLICAÇÃO CONFIRMADA:** PR [#91](https://github.com/gaveblue/gaveblue/pull/91) integrada à `main` por squash no commit `b24253d6d48f4056e2cd5b75faacbedd7cda58db`. GitHub Pages [#42339423278](https://github.com/gaveblue/gaveblue/actions/runs/42339423278) concluiu build e deploy com **success** em 07/11/2026 04:40 UTC. Verificações isoladas passaram, incluindo seis verificações funcionais do cabeçalho. O workflow financeiro #42339212876 falhou antes de executar qualquer etapa (0 passos). Inspeção real do PWA/Android continua pendente; publicação não equivale à homologação integral.

- Navegação de etapas no topo do modal com ações compactas Voltar, Próximo e Revisar/Salvar; X no cabeçalho substitui o Cancelar redundante do rodapé. Associação do botão submit ao formulário mantida mesmo após realocação; nenhuma ação financeira ocorre ao trocar de etapa.
- Modal de primeira etapa abre mais acima no celular, preservando rolagem em telas pequenas e com fontes ampliadas.
- Filtro de período salvo por ID autenticado no armazenamento deste navegador: Este mês, Mês anterior, Este ano, Todo o período e datas personalizadas. Meses/anos relativos recalculam na abertura; intervalos personalizados mantêm datas fixas.
- Preferência de interface não exige gravação no banco financeiro e não é compartilhada automaticamente entre dispositivos. Valores malformados ou de outra conta não são aproveitados.
- Regressão isolada de preferências e validações estáticas realizadas; CI financeiro do GitHub falhou antes de executar qualquer etapa. A implantação foi confirmada pelo GitHub Pages #42339423278. Permanecem pendentes a verificação visual no PWA Android e as evidências da execução integral dos testes financeiros. Publicação não equivale à homologação integral.


Registro de mudanças do aplicativo localizado em `gbplus/`. Toda versão e toda compilação deve possuir uma entrada própria. **Uma alteração não deve ser considerada homologada apenas porque existe commit, teste escrito ou publicação.** A homologação exige evidências da execução e aprovação explícita.

## [2.7.2 — SERVIÇOS AUTOMÁTICOS E LANÇAMENTO MAIS COMPACTO] — 2026-11-07

**PUBLICAÇÃO CONFIRMADA:** PR [#90](https://github.com/gaveblue/gaveblue/pull/90) integrada à `main` (commit `6bf9ecb9d733cd69b7185a80347cdd586e4848ed`). GitHub Pages [42337480435](https://github.com/gaveblue/gaveblue/actions/runs/42337480435) concluído com **success** em 07/11/2026 às 04:14 UTC. Cinco regressões isoladas com dados fictícios e 19 verificações estáticas passaram. O workflow financeiro [42337441986](https://github.com/gaveblue/gaveblue/actions/runs/42337441986) falhou antes de executar qualquer etapa (0 passos); a validação real no Android/PWA continua pendente. **Código publicado não equivale a homologação integral.**

### Categoria → serviço, sem etapa visual redundante
- Selecionar explicitamente uma categoria de despesa de **Serviços, Assinaturas, Streaming ou Aplicativos** abre, em sequência, o **Bottom Sheet com os 26 serviços**. A pessoa não precisa tocar em um segundo campo “Qual serviço?”.
- O painel de categoria conclui seu fechamento nativo **antes** de iniciar o painel de serviço. Evita dois diálogos simultâneos, preserva foco, rótulos acessíveis e conteúdo digitado no formulário. Categoria comum, receita e cancelamento não abrem o catálogo desnecessariamente.
- O antigo bloco grande “Qual serviço?” foi substituído por um **chip discreto, de uma linha**, com logo, nome e indicador para alterar; continua permitindo seleção personalizada e remoção do serviço.
- Quando o serviço determina automaticamente o nome do lançamento (ex.: Netflix), o campo redundante **Descrição** fica oculto visualmente, mantendo o valor real no `FormData` e as regras de validação financeira. Ao retirar o serviço, a descrição pode voltar a ser digitada.
- A seleção de categoria ou serviço, por si só, não cria títulos, assinaturas, faturas, pagamentos nem baixas.

### Primeira etapa com menos rolagem
- Reduzidos os espaços verticais do seletor Despesa/Receita, valor, categoria, chip de serviço, descrição e botões; diminuição da largura de diálogo no desktop.
- No celular, o modal no estado parcial da **etapa 1** recebeu limite de altura menor (`min(535px,84dvh)`), mantendo estados de expandir/recolher e rolagem disponível quando a tela for curta ou a fonte ampliada.
- As etapas 2 e 3 não foram comprimidas; periodicidade, parcelas, datas, dias úteis, confirmação, e baixa mantêm o comportamento da 2.7.1.

### Testes e integridade
- Criado `tests/category-service-auto-regression.mjs`, verificando transição automática, categorias comuns, categoria repetida, receita, formulário desconectado, chip compacto e preservação dos campos.
- Atualizado `tests/services-regression.mjs` para rejeitar o campo grande; atualizado mock de `tests/pf-entry-ui-regression.mjs` para refletir o estado do formulário.
- Cinco testes de regressão isolados com dados fictícios passaram: seleção automática, três etapas e baixa, PF, catálogo de 26 serviços e Bottom Sheet. Testes Node integrais no GitHub Actions e PWA/Android reais ainda requerem evidências.
- Pacote PWA e manifestos recebem `2.7.2` com cache e importações renovados.

## [2.7.1 — LANÇAMENTO EM TRÊS ETAPAS, BAIXA E PRÉVIA DE SERVIÇOS] — 2026-11-07

**PUBLICAÇÃO CONFIRMADA:** PR [#89](https://github.com/gaveblue/gaveblue/pull/89) integrada à `main` (commit `191f44e2b4cfc00038391e2dcbfdc339bbf8e63b`), com GitHub Pages [42336177501](https://github.com/gaveblue/gaveblue/actions/runs/42336177501) concluído com **success** em 07/11/2026 03:56 UTC. Quatro regressões isoladas passaram com dados fictícios, incluindo validações de baixa atômica e de bloqueio para parcelas. Workflow financeiro [42336147557](https://github.com/gaveblue/gaveblue/actions/runs/42336147557) falhou antes de executar etapas (0 passos); validação manual no PWA Android ainda pendente. **A publicação não equivale à homologação integral.**

### Formulário de lançamento
- Primeira etapa **Lançamento** padronizada entre Despesa e Receita: seletor de tipo, valor centralizado, categoria (com serviço quando aplicável) e descrição. O cartão foi removido da primeira etapa.
- Segunda etapa **Detalhes**: periodicidade, parcelas/meses, documento, observações e meio de movimentação (**Conta/Pix/dinheiro** ou **Cartão de débito**), disponível para despesas e receitas. A escolha de débito é metadado do título; a baixa movimenta a conta financeira, sem criar fatura de crédito.
- O atalho de compra no **cartão de crédito** fica exclusivamente na segunda etapa, para despesas, e abre o fluxo de compra que gera faturas sem duplicidade.
- Em **receitas**, há seleção opcional do cartão relacionado a um reembolso. Essa associação é **apenas informativa**: não abate limite/fatura. A operação real de estorno não está implantada e não deve ser apresentada como realizada.
- Terceira etapa **Confirmação**: datas de emissão e vencimento, prévia de parcelas, opção de dias úteis e destino do lançamento.
- Em novos lançamentos **únicos**, opção **Ficar pendente** (padrão) ou **Baixar agora**. Baixa imediata exige conta ativa, data válida não futura e faz a criação e o `addPayment` na **mesma gravação** via `commit`.
- Parcelamentos e recorrências exigem baixa individual posterior; a baixa imediata é bloqueada para evitar quitação indevida de várias parcelas. Títulos antigos, quando editados, não ganham uma baixa adicional.
- A revisão final informa se o título ficará pendente ou será liquidado, incluindo conta e data, antes da confirmação; nenhuma movimentação é executada ao navegar pelas etapas.

### Categoria Serviços
- Prévia de três miniaturas **Netflix, Spotify e iFood**, próximas e sobrepostas, incorporada à categoria de despesa Serviços no seletor e no Bottom Sheet. Usa os SVG/monogramas locais e as cores de marca já disponíveis.
- Uma troca entre Receita e Despesa atualiza a prévia conforme o tipo da categoria.

### Testes e compatibilidade
- Novo `tests/title-three-step-regression.mjs` verifica a divisão das etapas, obrigatoriedade de conta/data na baixa, operação financeira de valor exato, preservação da entrada ao retornar e localização da prévia de serviços.
- Permanecem os testes anteriores `pf-entry-ui-regression.mjs`, `services-regression.mjs` e `bottom-sheet-regression.mjs`.
- Testes isolados com dados fictícios e análise estática realizados. **CI completo e PWA real permanecem pendentes de evidência.**
- Sem mudança de schema no Supabase, sem transferência automática em cartões e sem migração de registros antigos.

## [2.7.0 — BOTTOM SHEETS ARRASTÁVEIS E IDENTIDADE VISUAL DOS ÍCONES] — 2026-11-07

**PUBLICAÇÃO CONFIRMADA:** PR [#88](https://github.com/gaveblue/gaveblue/pull/88) integrada à `main` (commit `31af5d5b3321c4f7ce4576b3875728f5105951f5`). GitHub Pages [42334207915](https://github.com/gaveblue/gaveblue/actions/runs/42334207915) concluído com `success` em **07/11/2026 03:29 UTC**. Testes isolados do bottom sheet, serviços e formulário PF passaram, mas o workflow financeiro [42334177960](https://github.com/gaveblue/gaveblue/actions/runs/42334177960) falhou antes de executar etapas (0 passos). A validação real dos gestos em Android/PWA e a homologação integral continuam pendentes. **Versão 2.7.0 publicada não equivale a homologação completa.**

### Painéis de categoria e serviço
- Novo componente reutilizável em `js/bottom-sheet.js` e `bottom-sheet.css`: `<dialog>` nativo com foco controlado, botões acessíveis, toque, teclado e gesto de arrastar pelo puxador; ESC e toque no fundo fecham o seletor, sem desmontar nem perder o formulário.
- **Categorias:** toda categoria já cadastrada para o tipo selecionado (Despesa/Receita) aparece em lista alfabética pesquisável, com ícone e indicação da seleção atual. Não cria nem renomeia categorias automaticamente.
- **Serviços:** os 26 itens do catálogo permanecem organizados em cinco grupos. A seleção é feita no mesmo padrão arrastável, com busca, logo/monograma, **Outro serviço** e **Sem serviço**.
- A seleção altera apenas os campos de formulário já existentes e dispara a mesma rotina de `change` responsável pelas categorias e validações. Não salva, baixa, assina ou concilia automaticamente.
- O seletor de categoria mantém seu `select` HTML de origem como transportador de `FormData`, mas a lista visual não fica mais espremida em dropdown pequeno.
- A lista rola de forma independente, enquanto a barra de arrastar pode levar o painel de parcial a expandido e recolher ou fechar. Controles funcionam com toque, mouse, Escape, teclado e leitor de tela.

### Formulário móvel
- O **Novo lançamento** também passa a funcionar como painel inferior móvel com puxador próprio, permitindo estado compacto, normal e expandido. Os valores digitados e a etapa do formulário permanecem intactos ao arrastar.
- A visualização desktop continua adaptada à largura disponível; o seletor de categorias e serviços abre em um painel centralizado na parte inferior.
- A preferência por movimento reduzido desativa animações, sem desativar os controles.

### Ícones de bancos e aplicativos
- Os símbolos de serviços passam a preencher aproximadamente 76% dos blocos, com fundos nas cores de referência e ícones/monogramas de alto contraste no tema claro e escuro.
- Os vetores locais de marcas existentes permanecem associados aos seus titulares. Serviços sem vetor verificado continuam usando iniciais legíveis, sem inventar logotipos oficiais.
- Logotipos de bancos preenchem o selo sem `padding` artificial e mantêm fundo claro de alto contraste no modo escuro. Falhas nos arquivos preservam a identidade textual por iniciais. Os arquivos SVG originais não são alterados.

### Testes, compatibilidade e próximos passos
- Novo `tests/bottom-sheet-regression.mjs` cobre 26 serviços, categorias dinâmicas e conteúdo potencialmente malicioso, busca com acentos, estados parcial/expandido/compacto, foco, seleção, rolagem independente e presença das salvaguardas.
- Atualizado `tests/services-regression.mjs` para o novo seletor compacto e contraste dos ícones.
- `tests/pf-entry-ui-regression.mjs` continua garantindo parceiro oculto no PF, valor centralizado, categorias de Serviços e preservação de vínculo antigo.
- Testes isolados com dados sintéticos e checagens estáticas realizados. CI completo e inspeção visual de PWA no aparelho real **não devem ser descritos como homologados sem evidências**.
- A publicação depende de merge/implantação do Pages e da documentação dos resultados, nunca apenas do número da versão.

## [2.6.3 — VALOR CENTRALIZADO E SERVIÇOS DENTRO DA CATEGORIA] — 2026-11-06

**PUBLICAÇÃO CONFIRMADA:** PR [#87](https://github.com/gaveblue/gaveblue/pull/87) integrada à `main` (commit `29cfae047aa78cbe9f7d48c489bff08d2f28dc56`) e GitHub Pages [42332219181](https://github.com/gaveblue/gaveblue/actions/runs/42332219181) concluído com `success` em 07/11/2026 às 03:04 UTC. Testes isolados do formulário PF e de serviços passaram. O workflow financeiro [42332188995](https://github.com/gaveblue/gaveblue/actions/runs/42332188995) falhou antes de executar etapas (0 passos); o PWA ainda aguarda teste manual em aparelho real. **Publicação não significa homologação integral.**

### Ajustes do Novo lançamento (PF)
- Campo de valor **centralizado como um conjunto R$ + valor**, com largura que acompanha o número digitado. Removida a linha divisória/traço inferior.
- Parceiro **totalmente oculto** na interface PF, não apenas bloqueado/desabilitado visualmente. O `partnerId` de registros antigos continua em um input oculto para edição sem perda de vínculos; uso do campo poderá retornar no módulo futuro PJ, sobre a mesma base.
- Aplicativos/serviços deixaram de ser uma seção genérica abaixo da descrição. Agora aparecem **dentro do bloco Categoria**, imediatamente após o seletor de categoria e antes da descrição.
- Ao selecionar categoria de despesa **Serviços** (ou categorias personalizadas claramente chamadas Assinaturas, Streaming ou Aplicativos), o usuário vê **Qual serviço?** e escolhe um dos 26 serviços; nome e logotipo seguem vinculados ao lançamento.
- Para outras categorias de despesas ou qualquer categoria de receita, a lista de serviços fica oculta. Ao trocar explicitamente a categoria para uma não relacionada a serviços, é desfeita uma escolha de aplicativo feita naquele formulário, evitando associação escondida.
- Edições de registros antigos preservam serviço e parceiro já existentes sem migrar dados; a categoria atual pode ser alterada pelo usuário, e o novo fluxo reage à alteração.
- A mudança de tipo Despesa/Receita continua atualizando as categorias com o evento nativo `change`.

### Testes e limites
- `tests/pf-entry-ui-regression.mjs` ampliado com categoria Serviços, categoria Água, categoria de receita, centralização, Parceiro oculto e reação à troca de categoria.
- `tests/services-regression.mjs` preserva as verificações do catálogo de 26 serviços, cores, nome automático e validação de persistência.
- Os testes isolados foram executados com dados fictícios e passaram. A execução completa do GitHub Actions e teste visual no PWA instalado continuam dependendo de evidência.
- O `version.json`, o cache PWA e as importações receberam a identificação **2.6.3**.

## [2.6.2 — NOVO LANÇAMENTO PF E SERVIÇOS COM CORES] — 2026-11-06

**PUBLICAÇÃO CONFIRMADA:** PR [#86](https://github.com/gaveblue/gaveblue/pull/86) integrada à `main` (commit `7019f01ff73ee79ac2bb397ddc50bc0195deed07`); deploy GitHub Pages [42331328476](https://github.com/gaveblue/gaveblue/actions/runs/42331328476) concluído com `success` em **07/11/2026 02:53 UTC**. Testes isolados de formulário PF e serviços passaram; workflow financeiro [42331303473](https://github.com/gaveblue/gaveblue/actions/runs/42331303473) não executou nenhuma etapa (falha de infraestrutura anterior, 0 passos). A validação manual de PWA instalado permanece pendente. Nenhum registro financeiro foi apagado ou alterado pela atualização.

### Interface do Novo lançamento
- Novo seletor segmentado horizontal **Despesa | Receita** no topo. O controle mantém um `select` nativo oculto apenas como transportador de `FormData`, com seleção via botões acessíveis `aria-pressed`, e dispara o evento de `change` para atualizar categorias e serviços existentes.
- Valor em reais **logo abaixo** do tipo, em destaque, na **primeira etapa**. Mantidos formatador de centavos, validação de valor positivo e regras de parcelas, vencimento, recorrência e dias úteis; etapa 2 agora organiza periodicidade, observações e revisão.
- **Parceiro desabilitado para PF** com aviso de disponibilidade futura para PJ. O controle não aceita escolha, mas preserva o `partnerId` original durante a edição de títulos antigos para impedir perdas silenciosas.
- Atalho de compra no cartão disponível somente para despesa e na primeira etapa.

### Serviços e logotipos
- O serviço selecionado determina o **nome canônico** do lançamento: Netflix gera título **Netflix**, mostrado com seu símbolo na lista e no detalhe, em vez de duplicar nome e identidade.
- Enquanto serviço padrão ou personalizado estiver selecionado, a descrição é preenchida automaticamente e fica bloqueada para edição, para evitar divergência entre marca e lançamento. A opção "Outro serviço" permite digitar o nome, e desassociar o serviço libera a edição manual.
- Os 13 símbolos SVG anteriormente incorporados recebem suas cores de referência; os outros serviços usam iniciais com acentos de cor conhecidos, sem fabricar logotipos oficiais. Plus Delivery permanece neutro sem fonte confirmada. As cores de alguns serviços sem vetor são aproximações visuais e não devem ser apresentadas como arquivos oficiais de marca.
- Referência de metadados para as marcas vetoriais: `https://github.com/simple-icons/simple-icons/blob/develop/data/simple-icons.json`. O uso descritivo não representa parceria ou endosso.
- Nenhum serviço cria cobrança, assinatura, baixa ou movimentação de saldo automaticamente.

### Testes e segurança
- Adicionado `tests/pf-entry-ui-regression.mjs`, atualizado `tests/services-regression.mjs` e ambos incluídos na pipeline.
- Executados testes funcionais isolados com dados fictícios e verificações sintáticas de módulos; **GitHub Actions, Android/PWA e regressões integrais** ainda precisam de evidências.
- Sem migração de banco, alteração da natureza dos títulos ou modificação de registros financeiros antigos.
- Pacote PWA, stylesheet e identificador público atualizados para **2.6.2**, sem compilação exibida ao usuário.

## [2.6.1 — LIMPEZA FINANCEIRA E EXCLUSÃO AUTENTICADA] — 2026-11-06

**PUBLICAÇÃO CONFIRMADA:** PR [#85](https://github.com/gaveblue/gaveblue/pull/85) integrada à `main` (commit `9a23aca2dae3ca275744d42b6ae6d5a7b664c880`). Implantação do GitHub Pages [42328190490](https://github.com/gaveblue/gaveblue/actions/runs/42328190490) concluída com `success` em **07/11/2026 02:15 UTC**. Edge Function `gbplus-delete-account` ativa no Supabase com JWT obrigatório. Teste isolado passou; workflow financeiro [42328163557](https://github.com/gaveblue/gaveblue/actions/runs/42328163557) falhou antes de iniciar as etapas (0 etapas). Ainda não há teste ponta a ponta de exclusão em conta descartável nem homologação PWA no celular. **Nenhum dado real foi apagado durante a implementação ou os testes.**

### Duas operações distintas em Configurações
- **Limpar todos os dados:** mostra os totais de lançamentos, baixas, contas, cartões, compras, transferências, parceiros, importações e instituições personalizadas. Exige marcar uma declaração e digitar **LIMPAR** para habilitar a confirmação; oferece exportação de backup. Recomeça o documento financeiro de forma atômica via repositório com controle de revisão. **Mantém Supabase Auth, e-mail e perfil pessoal**.
- **Excluir conta:** substitui a mensagem antiga de "exclusão automática ainda não disponível" por uma interface de exclusão real. Exige e-mail completo, digitar **EXCLUIR** e marcar declaração irreversível. Somente após confirmação, chama a Edge Function `gbplus-delete-account`.
- A Edge Function usa JWT obrigatório, valida o usuário via `auth.getUser(token)`, compara o e-mail informado ao e-mail de Auth e executa `auth.admin.deleteUser(user.id, false)` **exclusivamente para o usuário autenticado**. A chave administrativa fica apenas no servidor.
- No projeto Supabase GB+, `gbplus_documents` e `gbplus_profiles` possuem FKs para `auth.users` com exclusão em cascata; o Storage estava vazio durante a auditoria. A exclusão do usuário retira os registros vinculados. Sessões já emitidas dependem da validade de JWT e de seu vencimento.
- Após confirmação da exclusão, tenta encerrar a sessão local e remove histórico local de conversas do próprio usuário neste dispositivo. A exclusão não apaga backups exportados ou cópias isoladas de outros dispositivos.
- Os dois fluxos são independentes. Abrir a tela ou marcar uma caixa **não executa nenhuma exclusão**. Ação financeira e exclusão de identidade são irreversíveis e exigem confirmação explícita.
- Novos módulos `js/account-safety.js` e `js/account-safety-ui.js`, Edge Function `supabase/functions/gbplus-delete-account/index.ts` e testes `tests/account-safety-regression.mjs` registrados na regressão.
- Política de privacidade e referências do PWA atualizadas para **2.6.1**.

### Validação
- Teste isolado de confirmações, limpeza sem gravar, renderização dos diálogos e proteção da função remota passou com dados fictícios.
- Função remota implantada no Supabase e configurada com `verify_jwt=true`, mas **nenhuma exclusão real foi executada para testar**.
- Teste ponta a ponta autenticado em conta de teste, instalação PWA no aparelho real e GitHub Actions ainda necessitam de evidência. Não considerar homologado sem teste real.

## [2.6.0 — INTERFACE UNIFICADA, IMPORTAÇÃO INTUITIVA E CATÁLOGO DE SERVIÇOS] — 2026-11-06

**PUBLICAÇÃO CONFIRMADA:** PR [#84](https://github.com/gaveblue/gaveblue/pull/84) integrada à `main` (commit `d6ec0df762f54f0a1c87a0ad4beebcd8dad101b8`); deploy GitHub Pages [42324669146](https://github.com/gaveblue/gaveblue/actions/runs/42324669146) concluído com `success` em 07/11/2026 01:33 UTC. Três testes funcionais isolados com dados fictícios passaram. O workflow financeiro [42324622731](https://github.com/gaveblue/gaveblue/actions/runs/42324622731) falhou **antes de iniciar as etapas**, impedindo homologação CI (issue #75). A verificação em PWA Android/iOS real continua pendente; publicação não equivale à homologação integral.

### Entregas consolidadas
- Unificação de **Contas e Cartões** com seletor sticky, cabeçalho padronizado, cadastro no mesmo local e ações contextuais, preservando os componentes financeiros originais (implementação iniciada na 2.5.1).
- Importação OFX/CSV reformulada para fácil compreensão: resumo de entradas/saídas, texto preventivo sobre duplicidade, filtros e checkboxes para selecionar movimentações individuais ou a página atual.
- Decisões em lote de **ignorar, manter pendente ou preparar despesa paga**. A última exige categoria e só é elegível para saída negativa, sem vínculo ou duplicidade; conciliar com baixa existente continua individual.
- Cada decisão continua sendo revisada e confirmada. Criar título com baixa requer confirmação da conta e consentimento expresso do impacto no saldo. Seleção não grava nem baixa.
- Catálogo de **26 serviços** em cinco grupos no **Novo lançamento**: streaming, música, delivery, mobilidade e serviços digitais. Busca textual, filtro por grupo e inclusão de **Outro serviço** com nome personalizado.
- **13 pictogramas de marcas empacotados no aplicativo**, obtidos do acervo vetorial Simple Icons com procedência documentada em `SERVICE-ICON-SOURCES.md`; os 13 restantes apresentam iniciais neutras sem inventar logotipos. Uso visual não significa integração/parceria.
- Ao escolher serviço, preencher a descrição **somente se ela estiver vazia**; não modificar valores, vencimentos, categorias, contas ou periodicidade. Assinaturas permanecem opcionais.
- A identificação opcional `serviceId`/`serviceName` é persistida como atributo do título e mostrada em detalhes e na lista de lançamentos. Não há migração obrigatória ou novo esquema financeiro.
- Novas regras de validação para serviço opcional nos backups e armazenamento online. `version.json`, cache PWA e referências de módulos atualizados para **2.6.0**.
- Removida a exibição de numeração interna de compilações ao usuário no atualizador; a identificação pública segue somente `X.Y.Z`.

### Verificações e ressalvas
- Teste de serviço `tests/services-regression.mjs` e teste de interface de importação `tests/bank-import-usability-regression.mjs` adicionados à pipeline financeira.
- Verificações isoladas com dados 100% fictícios indicam comportamento esperado e ausência de alterações financeiras antes de confirmação. A realização integral das regressões Node/GitHub Actions e homologação visual em PWA instalado **depende de execução documentada**.
- A identidade de marca está sujeita às diretrizes de cada titular (Simple Icons não garante liberação de marcas).
- A reformulação visual completa de **Novo lançamento** permanece em aberto até o envio da inspiração pelo responsável do produto; esta atualização integra serviços ao formulário atual sem inventar novo layout.

## [2.5.2 — IMPORTAÇÕES MAIS CLARAS E SELEÇÃO CONTROLADA] — 2026-11-06

**Status: EM DESENVOLVIMENTO — SEM HOMOLOGAÇÃO OU PUBLICAÇÃO.** Branch `feature/gbplus-252-importacao-clara`. Esta atualização depende da integração/homologação anterior da 2.5.1; não foi incorporada à `main`.

### Objetivo: compreensão no primeiro uso
- Resumo do extrato com rótulos claros de **Entradas no banco**, **Saídas do banco**, quantidade de movimentos e possíveis vínculos. Texto explícito evita confundir dados do banco com receitas/despesas já registradas.
- Filtros por **Todos, Saídas, Entradas, Possíveis vínculos, Conferir, Sem vínculo e Com decisão**. Paginação permanece para não sobrecarregar dispositivos com milhares de movimentos.
- Lista de movimentos com seleção por checkbox e **Selecionar esta página**, com desmarcação disponível; seleções não são o mesmo que decisões e não alteram saldos.
- Ações coletivas apenas preparatórias: **Manter pendente**, **Ignorar** e **Preparar despesas pagas (com baixa)**. A última exige categoria de despesas e só aceita movimentos negativos que estejam sem vínculo; entradas, duplicidades e movimentos com correspondência não podem passar por baixa coletiva.
- Manter **Vincular à baixa existente** como decisão individual, prevenindo associação incorreta de muitas movimentações a um mesmo pagamento.
- Ajuda discreta explica cada ação e quando ela pode modificar o saldo; revisão final passa a listar todas as decisões do lote (até o limite de 200), não somente as 50 primeiras.

### Salvaguardas
- Apenas a decisão **Criar despesa e registrar baixa**, validada no `reviewSelection`, pode gerar título e pagamento. A aplicação em lote é **somente memória**, sem `commit()`, gravação de saldo ou envio do arquivo bancário a terceiros.
- Continuam exigidas duas confirmações distintas: conta bancária correta e, para criação de título/baixa, consentimento explícito sobre impacto financeiro.
- Persistem limites e barreiras do núcleo 2.5.0: até 50 novos títulos por lote, 200 decisões por lote, rejeição de movimento futuro, duplicado, incompatível ou semelhante a título existente.
- Sem alteração no backend, esquema de dados, liquidação de faturas ou regras de conciliação.
- `tests/bank-import-usability-regression.mjs` acrescentado à pipeline de regressões, cobrindo filtros, seleção, erros e confirmação; testes completos e interface real ainda **não executados/homologados** nesta rodada.
- Metadados e cache de teste versionados como **2.5.2**; o identificador interno `build` continua para compatibilidade técnica, mas deixou de ser exibido ao usuário no atualizador.

### Pendente antes da liberação
- Validar teste Node e regressões financeiras, CI quando runner disponível (issue #75), UI em Android/PWA e desktop, acessibilidade e o vínculo correto com o plano de serviços/Novo lançamento.
- Pedir a aprovação explícita do responsável pelo produto antes da implantação.

## [2.5.1 · compilação 3 — CABEÇALHO PADRONIZADO E SELETOR FIXO] — 2026-11-06

**Status: CANDIDATA, SEM PUBLICAÇÃO E SEM HOMOLOGAÇÃO FINAL.** Implementação isolada em `feature/gbplus-251-ajustes-seguintes`. Não alterar a `main` nem considerar a compilação 3 liberada até obter evidências e aprovação explícita.

### Ajustes de usabilidade
- Contas e Cartões passam a usar o mesmo título de página **Contas e cartões**, a mesma hierarquia de cabeçalho, o mesmo alinhamento para botão principal de cadastro e a mesma área para ações secundárias.
- O seletor compacto **Contas | Cartões** fica **sticky** no alto da área visível ao rolar a página, incluindo layouts móveis com suporte a *safe area*; mantém navegação por teclado e atributos de acessibilidade.
- **Contas:** `Nova conta`, `Bancos e ícones`, `Transferir`; **Cartões:** `Novo cartão`, `Nova compra`. Cada ação mantém o formulário original, sem repetir ações que não se aplicam à aba.
- Permanecem intocados o cálculo de saldos, a conta bancária, as transações, limites, faturas, compras, importação bancária, cadastros e regras de segurança/isolamento.
- Atualizados os identificadores de assets/cache e o manifesto da compilação candidata, sem publicação em produção.
- Acrescentadas verificações ao teste `tests/accounts-cards-unified-regression.mjs` para estrutura uniforme, ações contextuais e CSS sticky.

### Validação pendente
- Verificação funcional isolada com dados fictícios em JavaScript apontou cabeçalhos e ações esperados; **não equivale à execução completa de Node 22 ou à homologação do PWA**.
- Executar regressões Node, revisar comportamento do seletor em rolagem e modal nos navegadores móveis, executar CI quando o runner estiver disponível (issue #75), registrar resultados e obter aprovação explícita antes da liberação.

## [2.5.1 · compilação 2 — AJUSTE DE REGRESSÃO E HOMOLOGAÇÃO] — 2026-11-06

**Publicação confirmada:** PR [#81](https://github.com/gaveblue/gaveblue/pull/81) integrado e deploy GitHub Pages [42317536214](https://github.com/gaveblue/gaveblue/actions/runs/42317536214) concluído com sucesso (commit `f52f43b47746138a5cfd63480bf3d7fadbf7c70b`). Nenhuma mudança adicional no layout de Contas/Cartões nem no mecanismo financeiro.

- Corrigido `tests/bank-import-readonly-release-regression.mjs`: o teste antigo exigia a versão 2.5.0 build 9 de forma fixa, mesmo quando o aplicativo já estava em 2.5.1. A verificação agora compara `index.html` com `version.json`, preservando a garantia de que o importador não grava nada durante a simples prévia.
- **12/12 suítes de regressão aprovadas em Node.js 22.16.0 real** sobre o pacote do GitHub Pages da 2.5.1 build 1 com o teste corrigido. O teste específico da tela unificada cobre aba ativa, conteúdo antigo, links `#cards`, teclado e ausência de alteração de dados.
- Atualizados metadados de compilação e chave de cache PWA para 2.5.1 build 2.
- **Limitações:** Chromium automatizado do ambiente travou na geração de captura; teste visual e login no PWA instalado em celular real ainda pendentes. Workflow financeiro GitHub Actions permanece impedido antes do runner, issue #75.
- Os 26 serviços e logos de streaming/delivery seguem **planejados**, ainda não foram integrados ao formulário nesta compilação.

## [2.5.1 · compilação 1 — CONTAS E CARTÕES EM UMA TELA] — 2026-11-06

**Publicação confirmada:** PR [#80](https://github.com/gaveblue/gaveblue/pull/80) integrado à `main` e implantação do GitHub Pages [42317173087](https://github.com/gaveblue/gaveblue/actions/runs/42317173087) concluída com sucesso. A compilação 2 preservou integralmente essa interface e corrigiu somente o teste legado de versionamento.

### Organização da interface
- Unificadas as páginas de **Contas bancárias** e **Cartões de crédito** em uma entrada de navegação: **Contas e cartões** (`#accounts`), com seletor compacto **Contas | Cartões** no topo, inspirado somente na organização apresentada pelo usuário.
- O visual preexistente das contas e cartões foi preservado: cartões de conta, saldos, instituições, limites, faturas, compras, transferências, histórico de conciliação, edição e botões mantêm a implementação anterior.
- Na aba Contas permanecem os botões `Bancos e ícones`, `Transferir` e `Nova conta`. Na aba Cartões permanece `Novo cartão`, além de todos os controles próprios dos cartões de crédito.
- A entrada antiga `#cards` continua aceita para quem tem link ou atalho antigo: abre a aba Cartões dentro da rota única sem apagar configurações pessoais. Os atalhos móveis salvos mantêm compatibilidade.
- Mudança **exclusivamente de apresentação e navegação**; nenhum título, pagamento, saldo, limite, compra ou dado do usuário é modificado pela alternância.

### Técnica e verificação
- Criado `js/accounts-cards-view.js` e adicionado ao manifesto de assets; os componentes originais aceitam o modo de inserção na tela sem duplicar cabeçalhos.
- CSS leve para seletor arredondado, foco via teclado, controle acessível (`role=tablist/tab/tabpanel`) e temas claro/escuro sem introduzir uma nova paleta.
- `gbplus/tests/accounts-cards-unified-regression.mjs` verifica o seletor, compatibilidade dos links e ausência de mutação dos dados. Acrescentado à lista de regressões do repositório.
- A estrutura e os conteúdos reais de Contas e Cartões foram executados com dados totalmente fictícios em Node.js 22.16.0 e as 11 suítes regressivas anteriores passaram; `node --check` aprovou os módulos de apresentação e o controlador.
- **O Chromium do ambiente de teste travou ao gerar uma captura visual. Não registrar essa tentativa como homologação de layout no aparelho físico.** A comprovação do PWA completo em Android/iOS e o runner CI do GitHub Actions permanecem pendentes.

### Próximas compilações da 2.5.1
- O catálogo de **26 serviços** (streaming, música, delivery, mobilidade e serviços digitais) e o plano de logos estão preparatórios, **não disponíveis ainda no formulário**.
- Logos oficiais somente depois de verificação de fonte/direito de uso. Não declarar Netflix, HBO Max, iFood, 99Food ou Plus Delivery como integrações do GB+.
- Novos ajustes da 2.5.1 serão versionados e homologados individualmente.

## [2.5.0 · compilação 9 — MAPEAMENTO MANUAL DE CSV] — 2026-11-06

**Publicação confirmada:** PR [#79](https://github.com/gaveblue/gaveblue/pull/79) integrado e GitHub Pages [42314574315](https://github.com/gaveblue/gaveblue/actions/runs/42314574315) concluído com `success` em 06/11/2026 (commit `294f9266921ac6885373af699e4f195bb8a40832`). Esta compilação **não altera** as regras de gravação, baixa, reversão ou isolamento financeiro aprovadas na build 8.

### Entregas
- Agora existe etapa de **mapeamento manual** quando o banco entrega arquivo CSV com cabeçalhos desconhecidos. O usuário associa as colunas de data, descrição, valor com sinal (e natureza) **ou** crédito/débito separados; campos opcionais: identificador e saldo.
- Uma amostra local das primeiras linhas permite verificar os valores antes da prévia; os conteúdos são escapados para HTML. O usuário pode clicar em **Ajustar colunas** na prévia mesmo quando o mapeamento automático funciona.
- Leitura de delimitador `;`, `,`, tabulação e `|`. Colunas inexistentes, campos obrigatórios faltantes, índices fora do intervalo, mapeamentos repetidos, tipos desconhecidos e CSV com valores conflitantes são rejeitados com explicação.
- O arquivo bruto permanece **apenas na memória da modal e no dispositivo** enquanto a revisão estiver aberta. Não é enviado à IA nem ao Supabase. Fechar/trocar arquivo descarta a cópia.
- Nenhuma gravação ao mapear/gerar prévia. O usuário ainda deve escolher decisões, revisar, confirmar a conta e autorizar separadamente qualquer título novo que altere o saldo.
- Corrigido texto desatualizado do extrato bancário para explicar que a prévia é local e a gravação só acontece após confirmação. Cache do PWA e manifest atualizados para build 9.
- **XLSX, PDF, data-base histórica e auditoria completa PWA/CI** permanecem fora deste fechamento, documentados nas issues #78 e #75. A 2.5.1 receberá planejamento próprio de serviços.

### Testes e limitações
- Criada `tests/bank-import-mapping-regression.mjs` e adicionada ao workflow financeiro, cobrindo assinaturas de CSV, mapeamento duplicado, formato de valores, amostra maliciosa, sinais D/C, arquivo antigo e ausência de mutação financeira.
- **11 de 11 suítes aprovadas em Node.js 22.16.0 real**, executadas sobre o pacote `github-pages` da build 9 efetivamente implantada, incluindo `bank-import-mapping-regression.mjs`; também passaram `node --check` para `js/app.js`, `js/bank-import-preview.js` e `js/bank-import-ui.js`. A interface PWA instalada em aparelho físico não foi homologada por esse teste.
- GitHub Actions ainda falha antes da alocação do runner (issue #75). Isso não significa que o GitHub Pages falhou.
- Não classificar toda a homologação de dispositivos/PWA como concluída antes de evidência.

## [2.5.0 · compilação 8 — FECHAMENTO DO NÚCLEO OFX/CSV] — 2026-11-06

**Publicação confirmada:** PR [#77](https://github.com/gaveblue/gaveblue/pull/77) mesclado e deploy GitHub Pages [42310213381](https://github.com/gaveblue/gaveblue/actions/runs/42310213381) concluído com `success` (commit `b868eb6792d6bf8db64ec372ab3c3f01fda3acf9`). **Conciliação assistida disponível**, sem confundir os 10 testes Node reais com GitHub Actions aprovado ou homologação completa do PWA.

### O que muda
- Habilitado o fluxo de **conciliação manual supervisionada**: vincular movimento à baixa/transferência existente, ignorar, manter pendente e criar título com baixa após confirmação.
- **Confirmar a conta bancária torna-se obrigatório para qualquer lote**. A tela mostra o nome da conta selecionada. Sem o aceite, o botão de gravação permanece desativado e o controlador rejeita a ação.
- **Criação com impacto no saldo exige autorização adicional**, distinta da confirmação de conta, e exibe resumo com créditos, débitos e efeito líquido. Movimento futuro, categoria incompatível ou título semelhante não pode ser criado.
- Reimportação repetida é bloqueada por conta/identificador; decisões pendentes podem ser retomadas; histórico e reversão de lote permanecem auditáveis e recusam desfazer títulos alterados ou vinculados depois.
- Leitura do arquivo permanece local. Não há Open Finance, autenticação bancária, upload bruto ao Supabase ou conciliação automática sem confirmação.
- Preservada comparação *indicativa* de saldos quando o banco os declara. Saldo inicial sem data-base cadastrada não autoriza concluir divergência contábil nem corrigir valor automaticamente.
- Versão atualizada para **2.5.0 build 8**, cache PWA versionado.

### Evidências
- **10/10 suítes de regressão passaram em Node 22.16.0 real**, sobre cópia do pacote implantado com alterações desta compilação. Incluem criação/baixa, revisão, duplicidades, conta, histórico, estorno, leitura de OFX/CSV, saldo e armazenamento local com conflito concorrente.
- O backend Supabase foi exercitado em um único **teste SQL com usuário 100% fictício criado dentro de subtransação, com rollback obrigatório**. Sem erros: duas revisões, idempotência, conflito otimista, tentativa de gravação em outro usuário bloqueada, e operação repetida com payload diferente bloqueada. Nenhum usuário ou documento sintético ficou persistido. Não equivale a teste de navegador com sessão autenticada real.
- A UI já tinha sido inspecionada no Chromium em tela móvel e desktop durante a build 7. A nova checkbox/condição também foi coberta em Node; **o novo fluxo completo do PWA não foi homologado num Android ou iOS instalado** nesta rodada.
- Autorização explícita do responsável pelo produto para concluir a 2.5.0 e seguir para 2.5.1; sem alegar que CI verde ou teste PWA final ocorreu.

### Escopo complementar transferido formalmente para backlog, sem fingir conclusão
- Tela de mapeamento manual para CSV bancário com colunas não padronizadas.
- Importação de XLSX e planilhas de contas a pagar/receber; PDFs digitalizados/textuais.
- Cadastro da data-base do saldo inicial para uma **conciliação histórica conclusiva**, pois hoje a diferença calculada é só indicativa.
- Comprovação completa em múltiplos aparelhos reais e correção administrativa do runner do GitHub Actions (issue #75).

**Decisão:** encerrar **o núcleo OFX/CSV da 2.5.0** após confirmar o deploy, com restrições técnicas devidamente registradas, e permitir evolução da 2.5.1 em paralelo. Não confundir isso com entrega de XLSX/PDF ou homologação integral do PWA.

## [2.5.0 · compilação 7 — HOMOLOGAÇÃO DE SALDOS E REGRESSÕES] — 2026-11-06

**Publicação confirmada:** compilação 7 implantada em GitHub Pages no run [42299501899](https://github.com/gaveblue/gaveblue/actions/runs/42299501899) em 06/11/2026 (commit `f42b6e6e94fdd7912efff859cb42a45b3a378e8c`). **Liberada exclusivamente em modo somente leitura. Homologação integral da conciliação com gravação ainda pendente.**

### Alterações
- Adicionada leitura opcional do saldo final **realmente informado** no OFX (`LEDGERBAL/BALAMT/DTASOF`) e na coluna de saldo do CSV, quando presente.
- Exibida comparação indicativa entre saldo informado pelo banco e saldo calculado pelo GB+ **na mesma data**, sem modificar o saldo inicial ou gerar conciliação automática.
- Quando o arquivo não informa saldo, a prévia explica que a diferença de saldos não pode ser calculada sem essa informação; não inventa valores.
- CSV com múltiplos saldos **distintos na data mais recente**, sem horário/ordem confiável, não escolhe um saldo arbitrário; omite a diferença e explica a ambiguidade. Saldos informados apenas em datas anteriores também não são tratados como fechamento atual.
- Alerta visível de que o saldo inicial cadastrado não tem data-base, impedindo afirmar equivalência histórica sem revisão.
- Ajustados os textos da prévia para não sugerir criação de títulos/baixas enquanto `BANK_IMPORT_WRITES_ENABLED=false`.
- Acrescentada `tests/bank-import-balance-regression.mjs` e chamada no workflow CI. Cache PWA, CSS, JavaScript e manifest versionados como build 7, preservando a trava de gravação.

### Homologação executada
- Recuperado o artefato `github-pages` da implantação oficial [42277197480](https://github.com/gaveblue/gaveblue/actions/runs/42277197480) (build 6). Código local da build 7 confrontado com blobs Git pelo `git hash-object`.
- **10 suítes de regressão aprovadas em Node 22.16.0 real, zero falhas**: financeiro, gráficos, importação, codec, trava de publicação, leitura de saldo, conciliação, criação, pendências e armazenamento local/reversão.
- Prévia renderizada em **Chromium real**, no componente isolado, em 360 px claro, 390 px escuro e 1200 px claro, sem rolagem horizontal nem controles de gravação.
- Executado também **upload real de CSV pelo input de arquivo em Chromium**, com troca de conta, verificação de saldo comparativo e bloqueio de saldos intradiários ambíguos nas três larguras. Sem backend/autenticação nesse ensaio.
- SQL de metadados em Supabase conferiu RLS de `gbplus_documents`, `auth.uid() = user_id` para SELECT, ausência de EXECUTE para anon na função `gbplus_save` e controle de revisão transacional. **Sem consulta ou modificação de dados financeiros reais.**

### Ainda bloqueado
- **CI do GitHub Actions**: falha antes de executar passos mesmo com disparo por `push` e `runs-on: ubuntu-24.04`. Última execução [42293673029](https://github.com/gaveblue/gaveblue/actions/runs/42293673029); incidente [issue #75](https://github.com/gaveblue/gaveblue/issues/75). Não registrar falsamente CI verde.
- O Chromium neste ambiente bloqueia navegação de rede, inclusive localhost; os testes feitos renderizaram o componente, **não** o fluxo ponta a ponta no PWA instalado.
- Homologação de armazenamento online em **contas de teste fictícias**, com usuários independentes, concorrência, idempotência e estorno real, ainda pendente.
- Data-base do saldo inicial e homologação de equivalência de saldos históricos ainda pendentes.
- Falta registrar aprovação funcional/revisor/data para habilitar escrita financeira. `BANK_IMPORT_WRITES_ENABLED=false` permanece obrigatório.

**Relatório detalhado:** [HOMOLOGACAO-2.5.0-RELATORIO-B7.md](HOMOLOGACAO-2.5.0-RELATORIO-B7.md).

**Verificação pós-merge:** versão 2.5.0 build 7 na `main`, interface com `BANK_IMPORT_WRITES_ENABLED=false` preservada; a implantação oficial concluiu com `success`. Não foram feitos ajustes de dados financeiros reais.

## [2.5.0 · compilação 6 — LIBERAÇÃO CONTROLADA SOMENTE LEITURA] — 2026-11-06

**Autorização:** usuário autorizou expressamente publicação antecipada, condicionada à segurança.  
**Decisão de segurança:** publicar **apenas a importação e a prévia OFX/CSV sem gravação**, mantendo a conciliação com alterações financeiras desligada.  
**Publicação confirmada:** GitHub Pages concluiu com `success` no run [42276855704](https://github.com/gaveblue/gaveblue/actions/runs/42276855704), implantando o merge do PR #73 (`48354b8b73b6d7336901834db434fc400c6a430d`). A liberação mantém escrita desativada. **Não considerar homologação da conciliação com gravação.**

### Disponível nesta liberação

- Acesso a **Contas bancárias → Importar extrato OFX/CSV** e no extrato individual.
- Leitura do arquivo **localmente** (UTF-8 ou Windows-1252), seleção de conta, prévia, totais de créditos/débitos, sugestões de correspondências, ambiguidades, repetição no arquivo, filtros e paginação.
- Nenhum envio do arquivo bancário à IA nem a serviços externos pela função de importação.
- Mensagens visíveis de que a operação está em **modo somente leitura**, sem alteração de títulos, baixas, transferências ou saldos.

### Proteção obrigatória da versão pública

- `BANK_IMPORT_WRITES_ENABLED=false` fixado em `js/bank-import-ui.js`; a interface **não renderiza ações de conciliar, criar, confirmar gravação ou reverter lote**.
- Defesa adicional em `js/app.js`: os comandos `bank-import-review`, `bank-import-commit` e `bank-import-undo` rejeitam a ação com a trava desativada. O restante do financeiro tradicional do GB+ permanece funcional.
- A opção de habilitar gravação **não** está exposta em Configurações ou disponível para o usuário. Exigirá nova compilação com homologação das operações de persistência e reversão.
- Criada suíte `tests/bank-import-readonly-release-regression.mjs`: verifica a ausência de botões de gravação e reversão, bloqueios no controlador, prévia funcional e manifest.
- Verificações lógicas antes da liberação: **9/9** bloqueios e operações de leitura confirmados em simulação. **As 8 suítes de regressão do ramo passaram na execução simulada** (financeiro, prévia, codec, conciliação, criação, pendências, persistência local e trava de publicação). **Não foram executadas em GitHub Actions/Node real** — o job de regressão inicia sem etapas e falha.
- Atualizados `index.html` (versão 2.5.0, build 6), `version.json` e cache PWA `gb-plus-shell-v2506`.

### Homologação e limitações

- **Homologação parcial com ressalvas:** validado por simulação lógica e bloqueio de gravação, não por teste real de navegadores/dispositivos/arquivos bancários completos.
- [ ] Homologar upload em Android/desktop, modo escuro e PWA.
- [ ] Obter execução Node real / CI verde, resolver problema do GitHub Actions.
- [ ] Homologar conciliação de gravação em usuário e conta online **fictícios**, incluindo concorrência, idempotência, duplicidade, estorno e auditoria.
- [ ] Habilitar escrita somente em build posterior com evidências de homologação; **esta build 6 não cria lançamentos a partir de extrato**.

### Reversão segura

**Backup de código anterior:** ramo `backup/gbplus-249-build68-before-250-readonly`, SHA `e6515126289997bb4ca7e8dff39eb73950315d91` (2.4.9, build 68). Em caso de problema de UI, fazer commit de reversão pontual; **não executar reset forçado nem apagar dados financeiros**. O rollback de código não remove quaisquer registros financeiros previamente gravados, mas o importador nesta build não cria registros.

## [2.5.0 · compilação 5 — validação e correção de pendências] — 2026-11-06

**Situação:** código implementado no PR #73, em ramo de desenvolvimento; **não publicado nem homologado**.  
**Objetivo:** resolver bloqueios funcionais identificados na revisão antes da liberação de conciliações que podem alterar saldos.

### Correções

- Corrigida a contagem de decisões da interface: quando a única escolha era **Criar lançamento baixado**, o botão `Revisar decisões` permanecia desabilitado. A opção de criação agora é incluída corretamente.
- **Manter pendente** não pode ser uma decisão irreversível. A reimportação do mesmo extrato permite retomar movimentos pendentes e decidir conciliar, criar ou ignorar, sem duplicar registros.
- Ao resolver uma pendência em outro lote, o primeiro lote mantém evidências `resolvedByBatchId` e `resolvedAt`, verificadas pelo validador do documento financeiro.
- A reversão exige respeitar a ordem de dependências: lote com pendência anteriormente resolvida não pode ser revertido enquanto o lote de resolução estiver ativo. Reverter a resolução reabre a pendência sem apagar seu histórico.
- Histórico visual diferencia pendências abertas de pendências retomadas; a opção `Manter pendente` é ocultada para um movimento já pendente.
- Atualizadas dependências e versões de cache do PWA, `version.json` para **2.5.0 build 5**. Versão pública permanece em **2.4.9 build 68**.

### Evidências

- Adicionada `gbplus/tests/bank-reconciliation-pending-regression.mjs`, cobrindo retomada, vínculo entre lotes, reversão encadeada, ausência de dupla baixa e integridade do documento.
- Adicionada `gbplus/tests/bank-reconciliation-storage-regression.mjs`, cobrindo gravação local, revisão de transação, bloqueio de escrita concorrente, backup, reimportação e retorno do saldo após reversão.
- **Sete suítes executadas e aprovadas em ambiente JavaScript de simulação**: `finance-regression.mjs`, `bank-import-preview-regression.mjs`, `bank-import-codec-regression.mjs`, `bank-reconciliation-regression.mjs`, `bank-reconciliation-create-regression.mjs`, `bank-reconciliation-pending-regression.mjs` e `bank-reconciliation-storage-regression.mjs`.
- **A execução simulada usa adaptadores para APIs Node e decodificação**; não representa teste Node real, PWA real ou banco online. Nenhuma transação real foi criada.
- [ ] CI: execução de referência `42263814138` terminou com `failure` e **nenhuma etapa executada** (`steps=[]`). É necessário diagnosticar configuração/execução do GitHub Actions e obter comprovação de testes Node reais: https://github.com/gaveblue/gaveblue/actions/runs/42263814138
- [ ] Verificar importação, revisão e reversão em navegador real, incluindo 320/360/390/430px, claro/escuro, acessibilidade e foco.
- [ ] Homologar integração com conta fictícia online, sessão dupla e histórico após recarregamento. Modo local foi simulado com armazenamento falso, não no navegador.
- [ ] Registrar evidências, revisor, data/hora e aprovação final antes de publicar.

**Decisão:** não marcar a build 5 como homologada ou liberada enquanto persistirem os itens pendentes. Não houve alteração de tabelas nem de dados reais de clientes.

## [2.5.0 · compilação 4 — endurecimento de homologação] — 2026-11-06

**Situação:** correções aplicadas no PR #73; **não publicado, homologação de dispositivo e CI pendente**.  
**Objetivo:** eliminar falhas de importação antes de disponibilizar operações que alteram dados financeiros.

### Corrigido
- A validação de extensão no carregamento tinha barras invertidas excedentes no regex e poderia rejeitar **todos os arquivos OFX/CSV/TXT válidos**. Corrigida e centralizada na função `bankImportFileNameSupported`.
- Arquivos CSV codificados em **Windows-1252** tinham caracteres inválidos ao serem lidos com `file.text()`, podendo ocultar colunas como `Descrição`. Agora o arquivo é lido em bytes: tenta decodificação UTF-8 estrita, depois Windows-1252.
- O leitor também rejeita nomes com extensão disfarçada (por exemplo `.csv.exe`), arquivos vazios, maiores que 8 MB e arquivos cujo tamanho mude durante a leitura.
- Atualizado `gbplus/tests/bank-import-codec-regression.mjs` e seu acionamento em `.github/workflows/gbplus-regression.yml`.
- Criados extratos **inteiramente fictícios** em `gbplus/tests/fixtures/` (OFX e CSV), ambos conferidos no leitor: entrada de R$ 50,00, saída de R$ 12,50, líquido de +R$ 37,50. Adicionado protocolo `gbplus/HOMOLOGACAO-2.5.0.md` para verificar 10 critérios antes da aprovação.
- Incrementado o build 3 → 4 com atualização da versão de JavaScript e do cache PWA. **A versão pública permanece a 2.4.9 build 68**.

### Verificações
- Testes de funções em ambiente JavaScript de simulação confirmaram: nome OFX/CSV válido, rejeição de extensões disfarçadas, recuperação do cabeçalho `Descrição` em Windows-1252, cálculo do extrato e bloqueio de arquivos inválidos.
- Suíte `bank-import-codec-regression.mjs` executada por meio de um ambiente JavaScript de simulação com emulação de decodificação; terminou sem erros. **Não substituir por evidência de execução em Node real.**
- [ ] Executar todas as suítes em Node real / GitHub Actions e registrar o link de execução verde.
- [ ] Validar upload real em Chrome/Android, iOS/Safari e desktop, com arquivos UTF-8, Windows-1252 e OFX.
- [ ] Homologar a gravação e reversão dos lançamentos em uma **conta de teste**, sem dados reais.
- [ ] Revisar configurações/permissões de execução do GitHub Actions. Os jobs verificados terminam com **runner_id=0, sem passos**, de modo que os testes não foram efetivamente executados pelo CI.

**Nota de segurança:** nenhuma gravação em produção foi realizada nesta revisão, e não existe evidência suficiente para registrar homologação ou liberação.

## [2.5.0 · compilação 3 — desenvolvimento] — 2026-11-06

**Situação:** implementada no ramo `feature/gbplus-250-importacao-previa`, PR #73; **não publicada, homologação pendente**.  
**Objetivo:** permitir criar títulos e baixas de movimentos bancários não localizados **somente após aprovação expressa**.  
**Isolamento:** os arquivos brutos continuam exclusivamente na memória local; nenhum envio automático ao servidor, à IA ou a terceiros.

### Funcionalidades

- Nova decisão por movimento: **Criar lançamento baixado**, disponível apenas quando o extrato não tem baixa/transferência correspondente e não há repetição no próprio arquivo.
- Exigência de categoria compatível com a natureza do movimento (entrada = receita; saída = despesa) e descrição editável até 300 caracteres.
- Para data válida e não futura, criação **conjunta** de um título único e da respectiva baixa na conta selecionada, usando o valor exato em centavos.
- Bloqueio de categoria incompatível, descrição vazia, data futura, mesmo movimento já importado, identificação repetida e possível título ainda em aberto com **saldo residual equivalente**, histórico e vencimento próximo (inclusive baixa parcial).
- Limite de **50 lançamentos criados por lote**, além dos limites da conciliação existentes.
- Revisão final mostra quantidade de criações, entradas, saídas e efeito projetado no saldo, incluindo a categoria escolhida. Exige caixa de seleção independente confirmando a criação e a atualização financeira antes de liberar o botão de gravação. Também alerta para movimentos já incluídos no saldo inicial e transferências internas, que não são receitas/despesas.
- Persistência atômica por `commit` / `repository.save`, com verificação da revisão financeira existente: título, baixa e histórico só são gravados juntos se o lote inteiro passar pela validação.
- Histórico registra identificadores dos títulos e pagamentos criados; evita novo processamento do mesmo movimento.
- **Reversão segura:** lotes com criação podem estornar apenas seus próprios títulos e baixas, na mesma operação, desde que não tenham sido editados ou vinculados posteriormente em outra conciliação. Caso contrário, recusa a reversão e preserva os dados. O histórico de reversão permanece.
- Nenhuma alteração do esquema SQL de produção; a informação é validada no documento financeiro por usuário. O fluxo anterior de conciliar, ignorar e deixar pendente continua disponível.

### Verificações e riscos

- **22 verificações lógicas simuladas** foram aprovadas em 06/11/2026 para criação de receitas/despesas, centavos, categorias, conta, título em aberto semelhante, data futura, duplicidade, confirmação explícita, reversão atômica e proteção contra registros editados. Essas verificações **não equivalem** a homologação em dispositivo ou teste de banco online.
- Criada suíte reproduzível `gbplus/tests/bank-reconciliation-create-regression.mjs` e adicionada ao workflow `.github/workflows/gbplus-regression.yml`.
- Em 06/11/2026 foram executados os **quatro scripts regressivos completos em um ambiente JavaScript de simulação**, com substitutos para utilitários Node e geração de UUID; os quatro concluíram seus testes sem erros. Essa evidência não substitui execução em Node real nem homologação no navegador.
- [ ] Executar as quatro suítes de regressão em Node na automação CI; o GitHub Actions tem retornado falha **antes de mostrar etapas executadas**, ainda sem evidência de execução confiável.
- [ ] Homologar OFX/CSV reais, conta errada, troca de conta, tema escuro, dispositivos móveis, confirmação, reimportação e saldo após gravação.
- [ ] Testar simultaneidade de duas sessões, modo local e conta online, reversão de lote com título alterado, importação repetida e backup/restauração.
- [ ] Validar tratamento do saldo inicial sem data-base histórica antes de implementar comparação entre saldo do banco e GB+.
- [ ] Registrar responsável, data, evidências e aprovação para a liberação.

**Importante:** esta entrega **efetivamente pode alterar saldos** ao criar títulos e baixas, mas só após confirmação individual e do lote. A versão pública permanece na 2.4.9 compilação 68 até publicação explicitamente autorizada e verificada. Em caso de falha, corrigir/reverter o código da compilação 3 sem resetar dados financeiros nem forçar histórico Git.

## [2.5.0 · compilação 2 — desenvolvimento] — 2026-11-06

**Situação:** implementada na ramificação `feature/gbplus-250-importacao-previa`; **homologação pendente, não publicada**.  
**Continuação da compilação 1:** adiciona decisões individuais e registro de vínculos sem alterar o fluxo financeiro.

### Entregas
- Para cada movimento: opções **Conciliar com baixa/transferência existente**, **Ignorar**, **Manter pendente** ou **Sem decisão**. Na conciliação, a correspondência deve ser selecionada explicitamente; não existe aprovação automática.
- Tela de **revisão final** com quantidade de vínculos, ignorados e pendentes; confirmação individual do lote antes de gravar.
- Persistência atômica de **metadados aprovados** no documento financeiro do usuário, por meio do `repository.save` existente, com checagem de revisão e autenticação. **Nenhum título, baixa, transferência ou saldo é criado ou modificado** por esta etapa.
- Auditoria por conta, lote, data, formato, ação, vínculo e valores. Arquivo original não persistido; são guardados apenas os registros selecionados, com descrição reduzida.
- Prevenção de reutilização de movimento importado, correspondência duplicada, dupla vinculação à mesma baixa e reimportação de movimento já confirmado; duplicidades idênticas exigem revisão e não são conciliadas silenciosamente.
- Histórico de conciliações por conta e opção de **reverter vínculos do lote**, preservando um registro de reversão e sem estornar os pagamentos reais.
- Compatibilidade do histórico com estornos financeiros legítimos: o vínculo permanece registrado mesmo quando a baixa ou transferência original é estornada.
- Limite de 200 decisões por lote, 100 lotes e até 10.000 decisões históricas por documento; dados antigos sem histórico continuam compatíveis.
- Interface ajustada ao celular, atualização do cache PWA e inclusão de `js/bank-reconciliation.js` e `tests/bank-reconciliation-regression.mjs`.

### Verificações
- **17 verificações lógicas simuladas concluídas com sucesso**: seleção válida, ausência de mutação financeira, gravação de metadados, bloqueio de reimportação e alvo inválido, validação de documento, confirmação, histórico e reversão.
- [ ] Executar `node gbplus/tests/bank-reconciliation-regression.mjs` e regressões financeiras completas em ambiente Node.
- [ ] CI do GitHub: workflow adicionado em `.github/workflows/gbplus-regression.yml`; execuções iniciais em 06/11/2026 retornaram `failure` sem etapas de trabalho registradas (sem logs utilizáveis). **Não há evidência de que as suítes Node tenham executado**. Diagnosticar configuração/ambiente de execução e repetir antes da homologação.
- [ ] Homologar Android/PWA, iOS e desktop, arquivos OFX/CSV reais, contraste, rolagem, temas e atualização de cache.
- [ ] Verificar autenticação, isolamento de usuários, gravações concorrentes, restauro, histórico e reversões com contas de teste.
- [ ] Testar cancelamento/estorno de pagamentos já conciliados e movimentos repetidos legítimos no mesmo dia.
- [ ] Implementar aprovação para **criar lançamentos ausentes** e tratamento de divergências de saldo histórico; **fora desta compilação**.

**Risco controlado:** a confirmação atual registra apenas metadados de conciliação; não executa baixa nem cria lançamento. A tela de criação de lançamentos ausentes continua bloqueada até homologação específica. A publicação depende de evidências adicionais.

## [2.5.0 · compilação 1 — desenvolvimento] — 2026-11-06

**Situação:** código implementado em ramificação de desenvolvimento; **não publicado nem homologado**.  
**Origem:** início da 2.5.0 após a liberação da 2.4.9 build 68.  
**Escopo:** prévia de importação de OFX/CSV, sem qualquer gravação financeira.  
**Ramificação:** `feature/gbplus-250-importacao-previa`.

### Alterações

- Nova entrada **Importar extrato OFX/CSV** em Contas bancárias e no extrato individual.
- Tela minimalista para selecionar a conta, escolher arquivo local (até 8 MB) e visualizar a conferência.
- Resumo de créditos, débitos, quantidade de movimentos e possíveis vínculos com baixas ou transferências existentes.
- Classificação consultiva: possível vínculo, ambiguidade, possível repetição no arquivo e não localizado.
- Filtros Todos / Prováveis / Revisar / Não localizados e paginação limitada a 20 movimentos por tela.
- Suporte adicional a colunas de entrada/saída e ao campo Tipo em arquivos CSV, com valores íntegros em centavos.
- Otimização da pesquisa de correspondências por valor para arquivos maiores.
- Arquivo original não é enviado a IA nem ao servidor; conteúdo analisado apenas em memória e descartado ao fechar a prévia. Não há operação de baixa, título, ajuste de saldo ou persistência.
- Novos arquivos: `js/bank-import-ui.js`, `bank-import.css`, `tests/bank-import-preview-regression.mjs`. Atualizados `js/app.js`, `js/views.js`, `js/forms.js`, `js/bank-import-preview.js`, `index.html`, `version.json` e `sw.js`.

### Evidências e pendências

- Testes regressivos adicionados em `tests/bank-import-preview-regression.mjs`. **22 verificações lógicas simuladas** da leitura OFX/CSV, sinais, correspondências por conta, não mutação, segurança HTML e paginação passaram em 06/11/2026; essa execução não substitui o teste em navegador real.
- [ ] Registrar execução completa da regressão em Node.
- [ ] Homologar upload e visualização em dispositivo real, incluindo tema escuro, PWA e contas com muitos lançamentos.
- [ ] Validar OFX/CSV reais de instituições distintas e arquivos em outras codificações.
- [ ] Implementar e homologar mapeamento manual de CSV.
- [ ] Conciliação selecionada pelo usuário, persistência transacional, auditoria, isolamento RLS e prevenção de dupla contabilização (próximos marcos).

**Critério de avanço:** nenhuma importação deve alterar dados do GB+ antes de confirmação específica. Esta compilação **não representa conciliação bancária pronta**; é a interface segura de prévia para análise.

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
