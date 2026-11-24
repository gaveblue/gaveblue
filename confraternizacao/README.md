# Confraternização · RSVP (2026)
Implementação isolada do convite corporativo GaveBlue, sem alterações nos aplicativos GB+, Intervalo ou WeFrotas.

## Links
- Público: https://gaveblue.com.br/confraternizacao/
- Gestão: https://gaveblue.com.br/confraternizacao/admin/

## Dados e backend
- Projeto Supabase reutilizado: gaveblue.com (wkssfugzghwifaddagfr). O projeto denominado GB+ estava INACTIVE quando foi criado este módulo; nenhum projeto novo foi contratado.
- Tabelas dedicadas: rsvp_eventos, rsvp_colaboradores, rsvp_confirmacoes, rsvp_limiter, rsvp_admin_access, rsvp_admin_sessions.
- RLS habilitado e sem permissões diretas para anon/authenticated; somente Edge Function acessa com service role no servidor.
- Edge Function: rsvp-confraternizacao (verify_jwt=false por conter endpoints públicos; todas as ações admin validam o token de sessão próprio da confraternização).
- Gestão usa um código exclusivo do evento, sem e-mail nem login do GB+ / GaveBlue. Código armazenado apenas como verificador PBKDF2-SHA256 com sal (140 mil iterações) e protegido pelo servidor; sessões aleatórias de 256 bits com duração de 8 horas e tokens armazenados somente como hashes SHA-256. A autenticação sofre limite de tentativas.
- Não registrar nem commitar o código administrativo em documentos ou arquivos públicos do repositório.
- Convidados: busca única com nome e pelo menos 3 letras do último sobrenome; máximo 8 resultados por busca; rate limit no servidor. Nome + sobrenome não equivale a autenticação forte.
- Confirmação: unique(evento_id,colaborador_id), edição idempotente por upsert; inclui zero ou um acompanhante; redirecionamento via WhatsApp com número único configurado no evento.
- WhatsApp: salvar a confirmação não prova o envio da mensagem (o usuário deve tocar Enviar).
- Colaboradores: cadastro manual, edição, inativação, importação por texto, CSV ou TXT; exportação em CSV.

## Ativação
1. Entrar no painel administrativo com o código exclusivo informado ao responsável.
2. Abrir Configurações e informar título, data, horário, local e número de WhatsApp com DDI (ex.: 5527999999999).
3. Abrir Colaboradores e cadastrar/importar a lista.
4. Alterar o status do evento de Rascunho para Aberto; salvar.
5. Compartilhar o link público.

## Limitações atuais
- 46 colaboradores importados; 8 sem sobrenome estão inativos até correção; ainda falta número do WhatsApp, então o evento continua em rascunho. Data: 12/12/2026, início 15:00, local Loja Maçônica Fenelon Barbosa.
- Importação binária .xlsx não está habilitada; é possível colar nomes ou importar CSV/TXT.
- O servidor valida autorização administrativa, mas a página pública usa apenas identificação por nome/sobrenome, adequada somente se este risco for aceito.
- Checagens realizadas: JS analisado sintaticamente, Edge Function v3 ativa, login válido respondeu HTTP 200, código errado HTTP 401 e sessão autenticada retornou 46 colaboradores no bootstrap. Teste ponta a ponta com navegador e mensagens reais ainda pendente.

## Painel v4 · 23/11/2026
- O card de Cadastrados considera **todos** os convidados importados (83), não apenas os aptos à busca (66).
- O dashboard separa Pendentes de confirmação (entre os aptos) de Sem sobrenome (17), e inclui confirmações manuais no total esperado.
- O cadastro administrativo permite editar nome, setor/grupo, disponibilidade na busca e flag de presença confirmada. Desmarcar presença remove a confirmação, inclusive a efetuada pelo link; a tela informa essa consequência.
- Novo campo `rsvp_colaboradores.setor`, inicialmente preenchido com o grupo original; `grupo` permanece como histórico da lista de origem.
- Novo campo `rsvp_confirmacoes.origem`, que distingue `link` e `manual`.
- RPC `rsvp_admin_save_person` atômica, liberada apenas para service_role, para salvar dados e presença juntos.
- Os 83 cadastros foram preservados; teste transacional de criação, edição, confirmação e desmarcação passou e não deixou dados de QA.
- Edge Function v4 implantada; JS validado sintaticamente e referências a IDs HTML conferidas. Publicação no GitHub main realizada. Validação visual do site externo não concluída no ambiente.

## Convite v5 · 23/11/2026
- Página pública com verde-escuro, verde-folha e amarelo do convite, título “Você foi convocado para nossa Confraternização 2026” e destaque visual do prazo de resposta até 30/11.
- Duas marcas na abertura: Covre Agrícola (imagem já referenciada pelo site da própria empresa, em i.imgur.com/kXwEnSs.png) e Covre & Cia (arquivo existente do próprio repositório em postoscredenciados-covreecia/assets/brand/covre-e-cia.png). A primeira imagem é externa; avaliar armazenamento local se o host externo falhar.
- Skeleton no carregamento inicial e na lista, indicador giratório de pesquisa e animação suave de aparecimento, respeitando prefers-reduced-motion.
- Otimização na busca: debounce reduzido de 320ms para 175ms, abort de requisições obsoletas, cache por consulta no navegador (até 32 chaves) e RPC rsvp_busca_rapida com filtro/limite/rate limit no banco em uma consulta; somente service_role pode executar a RPC.
- Testes HTTP na API v5: retorno 200 e um registro para busca válida, nenhum resultado com menos de 3 letras, e resultado para sobrenome posterior. Sem alteração nos convidados e confirmações.
- Os assets públicos foram versionados com ?v=5 para forçar atualização do CSS/JS nos navegadores.
- A renderização no domínio não pôde ser conferida por navegador automatizado neste ambiente.

## Ajuste visual v6 · 23/11/2026
- Layout público mais enxuto: logos sem caixa gigante, título menor com melhor hierarquia, cores oficiais e menos espaço vazio.
- Data/horário/local agrupados em um único cartão responsivo; busca e formulário mantidos com identidade Covre.
- Tela de sucesso refatorada: cabeçalho discreto, resumo com colaborador e acompanhante, botão do WhatsApp em evidência e instrução explícita de que é necessário enviar a mensagem.
- Dados de presença e banco não alterados; preservada a confirmação por busca e o redirecionamento.
- Confirmações de código: JS analisado sem erro de sintaxe, IDs referenciados existentes no HTML e assets versionados com ?v=6.
- Limite de QA: não foi possível abrir a página pública pelo navegador automatizado deste ambiente (rede/DNS); confirmar aparência e integração no aparelho.

## Convite v7 · 23/11/2026
- Página pública mais compacta: títulos e logos menores, informações do evento organizadas verticalmente (data, horário, local).
- Prazo de 30/11 destacado como alerta compacto vermelho com ícone de atenção.
- Removido o stepper de 2 etapas da página principal; busca permanece no card inicial.
- Após escolher colaborador, bottom sheet abre a partir de baixo com sobreposição, alça, fechar, clique no backdrop, Escape e gestos de arrastar para baixo na alça.
- Acompanhante sim/não e campo de nome condicional ficam no bottom sheet; botão de confirmação fica destacado no rodapé do conteúdo e continua salvando antes de direcionar ao WhatsApp.
- Sucesso também dentro do sheet, com resumo de colaborador e acompanhante; após fechar há cartão compacto para reabrir o comprovante.
- Altura adaptada à viewport dinâmica no celular, scroll interno e bloqueio de rolagem do fundo, sem focar automaticamente no campo de texto.
- HTML com tags balanceadas e IDs únicos; JS passa em verificação de sintaxe, referências de sheet conferidas, CSS com chaves equilibradas; assets versionados com ?v=7.
- O teste visual em navegador externo ainda depende de validação no dispositivo do usuário, pois este ambiente não resolve o domínio gaveblue.com.br.

## Convite v8 · 23/11/2026
- Visual de fundo reconstruído com faixas decorativas curvas verde e amarelo, sem downloads de imagens ou dependências adicionais.
- Identidade Covre Agrícola + Covre & Cia preservada; título centralizado e composição reduzida para caber melhor no celular.
- Data e horário unidos na mesma linha (12/12 e 15h00), local logo abaixo.
- Alerta de presença até 30/11 centralizado, compacto e vermelho.
- Página pública exibe apenas botão destacado "Confirmar presença"; ao tocar, o bottom sheet abre com a busca única por nome e sobrenome.
- Identificação, acompanhante e comprovante usam as etapas do mesmo bottom sheet, com mensagens de erro, indicador de pesquisa, fechar, gesto na alça e suporte ao teclado.
- Abertura agora usa tela de carregamento integral "Carregando seu convite"; conteúdo principal fica oculto até a API do evento responder. Em caso de erro, exibe botão "Tentar novamente" na abertura em vez de tela aparentemente travada.
- Folha de estilos específica guest-v8.css carregada após style.css para não modificar o painel administrativo. Arquivos cache-busted com v=8.
- Testes estáticos: HTML balanceado e sem IDs duplicados, nenhum identificador da etapa pública sem elemento, JS com sintaxe válida e CSS com chaves balanceadas. Não houve alteração no banco nem nas regras de confirmação. O domínio não foi acessível para teste visual automatizado.

## Convite v9 · 23/11/2026
- Incluído link externo de Google Maps fornecido pela organização abaixo do endereço: “Não sabe onde fica? Clique aqui”, abrindo em nova aba com rel=noopener noreferrer.
- Substituída a imagem Covre & Cia por logotipo enviado pelo usuário em 328456.png, sem recriar a arte. Versão publicada comprimida em PNG transparente, 440×394 px, com recorte das margens transparentes e redução para web. Arquivo: `confraternizacao/assets/covre-e-cia-oficial.png` (16.521 bytes).
- Ajustado dimensionamento do logotipo vertical para manter proporções no cabeçalho.
- Corrigido posicionamento do bottom sheet ao abrir teclado Android: usa `window.visualViewport.height` e `offsetTop`, recalcula em resize/scroll/foco e limita altura do painel à área visível, permitindo rolagem interna da busca.
- Assets com cache-busting `?v=9`; sem alteração nos cadastros, confirmados ou backend.
- Conferência: assets presentes na árvore do GitHub, URL do Maps correta, JavaScript compilado, identificadores HTML consistentes e CSS sem desequilíbrio de chaves. O comportamento específico do teclado deverá ser validado no aparelho, pois não há teste Android real disponível neste ambiente.

## Convite v10 · 23/11/2026
- Pesquisa de inspiração em convites digitais mobile e páginas RSVP minimalistas: The Details, Avenly Arc e documentação de interação do Google Calendar.
- O texto “Confraternização 2026” no título oscila discretamente entre verde institucional e amarelo-ocre legível (9 s); `prefers-reduced-motion` desativa a animação.
- Subtítulo exato com dois parágrafos institucionais: “Convidamos vocês colaboradores, parceiros e amigos para a nossa confraternização.” e “Será um momento especial para celebrarmos as conquistas, fortalecer os laços e renovar as energias para novos desafios.” 
- A descrição foi atualizada na tabela `rsvp_eventos` e renderizada com parágrafos por `textContent`, sem perder a edição pelo painel administrativo.
- Faixas decorativas reposicionadas para cantos controlados; removidas faixas inferiores que atravessavam o rodapé, substituídas por pequeno traço verde/amarelo no rodapé.
- A data agora tem affordance e link de adicionar lembrete ao Google Agenda. O lembrete começa no horário oficial 15h00 em America/Sao_Paulo e tem janela técnica de 15 minutos, com descrição explícita de que o horário de encerramento não foi informado. O evento não tem sua duração presumida.
- Nova folha de estilo `guest-v10.css?v=10` carregada somente na página do convidado; `app.js?v=10`. Painel administrativo não alterado.
- QA estático: JS sintaticamente válido; HTML balanceado; IDs únicos, correspondência das referências; CSS equilibrado; banco conferido com evento aberto, 83 cadastrados e 1 presença preservada. Navegador externo não verificado.

## Versão visual v15 — 23/11/2026
- Título em duas linhas exatas: "Você foi convocado para nossa" e "Confraternização 2026", com tamanho adaptativo no celular; mantém oscilação verde/dourado discreta na segunda linha.
- Cronômetro em cartão verde com 4 divisões em fundo verde-escuro: dias, horas, minutos, segundos. Números atualizados a cada segundo calculados da data/hora do evento (12/12/2026, 15h00, UTC-03:00); ao chegar a zero muda para "O grande dia chegou!" e para de contar. Sem números estáticos e sem acréscimo de backend/planos pagos.
- Ficha do evento menor: data/hora lado a lado, localização em grupo centralizado horizontalmente com link do mapa. Nenhum botão/integração de calendário foi reintroduzido.
- Animação, marcas, descrição institucional, prazo RSVP 30/11 e confirmação em bottom sheet preservados.
- Cache-busting assets v15, atualização do caminho padrão e de convite-atualizado.html; também URL única convite-v15.html para evitar cache de HTML antigo.
- Verificações estáticas: HTML balanceado, IDs únicos, referências do JS presentes, sintaxe JS válida, CSS com chaves equilibradas; teste de fórmula 23/11 às 20h BRT → 18 dias e 19 horas para 12/12 às 15h.

## Convite v16 · 23/11/2026
- **Organização:** removido o antigo bloco lateral de data/horário; abaixo do contador principal há uma linha discreta dinâmica: `Dia 12 de dezembro, a partir das 15h`. O card branco agora mostra apenas local e Google Maps.
- **Prazo alterado:** até 25/11/2026, 23h59:59.999 (UTC-03:00). Substituído o chip de aviso de 30/11 por cartão vermelho compacto, com contador de horas totais, minutos, segundos e milésimos (atualização de 50 ms, sem exibir dias fictícios).
- **Segurança:** Supabase Edge Function `rsvp-confraternizacao` v6 define o prazo e impede buscas/confirmar após a data. O endpoint de evento retorna `prazo_confirmacao` e status `encerrado` após o prazo. O Super Admin continua podendo gerenciar cadastros e confirmações manuais.
- **Celebração:** carregamento opcional da biblioteca open source `canvas-confetti@1.9.4` (licença ISC, repositório https://github.com/catdad/canvas-confetti; distribuição https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.4/dist/confetti.browser.min.js) para explosões sutis nas cores verde/dourado/branco após gravação bem-sucedida. Pares de ícones `wine` do Lucide animam um brinde. Sem dependência de imagens nem bibliotecas pagas, e com fallback gracioso caso o CDN não carregue.
- **Fluxo WhatsApp:** abre automaticamente após ~2,3 segundos para que a animação fique visível (300 ms para quem prefere movimento reduzido). Botão de WhatsApp continua clicável no estado de sucesso.
- **QA estático:** IDs presentes, HTML fechado, JS sintaticamente válido, CSS equilibrado, contador com horário real de Brasília, e regras do servidor confirmadas na versão implantada. Ainda requer teste visual e abertura do WhatsApp no celular.
- **Publicação:** folhas de estilo v16 em CSS isolado `guest-v16.css` e arquivos base versionados; caminhos `index.html`, `convite-atualizado.html`, `convite-v15.html` atualizados, mais `convite-v16.html`.

## Visual v21 — 23/11/2026
- Covre Agrícola: logo original preservado e ampliado visualmente ~15% (10% em telas muito estreitas), sem alterar arquivo/fundo.
- Cronômetro do prazo 25/11: legendas compactas HORAS, MIN, SEG e MILÉS. em uma linha, sem alterar cálculos da API e do frontend.
- Título “Confraternização 2026” ~10–15% maior no mobile, mantendo “Você foi convocado para nossa” na linha anterior.
- 10 brilhos/confetes dourados leves com CSS puro sobre a região do título, com deriva para cima, animações escalonadas e desativação por `prefers-reduced-motion`.
- Novos arquivos: `guest-v21.css` e `convite-v21.html`; todos os links de versão anteriores permanecem sincronizados com o mesmo convite.
- Não houve mudança em `app.js`, formulários, backend, calendário ou dados de colaboradores.

## Convite público v22 — rodapé institucional
- Rodapé anterior com nomes Covre Agrícola/Covre & Cia e ano removido; as marcas permanecem no topo.
- Rodapé novo em duas linhas centralizadas: `Desenvolvido com ❤️ por gaveblue.com.br` (link oficial) e `© Copyright 2026 - Todos os direitos reservados`.
- Tipografia pequena, cores discretas, sem alterar fluxos de RSVP nem demais conteúdos.
- Atualizadas rotas existentes e novo acesso `convite-v22.html`; estilo isolado em `guest-v22.css`.

## Admin visual v5 — 23/11/2026
- Primeira reorganização visual do painel administrativo, **sem modificar banco de dados, Supabase ou lógica das confirmações**.
- Paleta verde/branco com detalhes leves em dourado para se alinhar ao convite.
- Indicadores compactos, painéis com hierarquia mais clara e maior equilíbrio entre espaços.
- Navegação móvel fixa no rodapé com abas Geral/Lista/Evento e botão acessível de sair no topo.
- Lista móvel dos colaboradores reformatada em linhas-cartões com nome, status, setor, acompanhante, data e edição, sem rolagem horizontal obrigatória; tabela desktop preservada.
- Formulários de inclusão/importação em bottom sheets no celular e sem alteração dos fluxos existentes.
- No texto das configurações, substituída menção indevida a "período de confirmação" por "status das confirmações"; a data limite pública continua controlada pela API e **ainda não pode ser alterada pelo admin**.
- Carregamento: `admin/index.html` agora usa `admin-v5.css?v=5` e `app.js?v=5` para invalidação de cache; `app.js` alterado apenas para disponibilizar sair no celular.

## Admin v6 / Convite v23 — Prazo e controle de estados (23/11/2026)
- Aplicada migration no Supabase Confraternização `rsvp_prazo_e_mensagem_encerramento_20261123`, com `rsvp_eventos.prazo_confirmacao timestamptz not null` e `mensagem_encerramento text not null default ''`. Valor inicial do prazo: 25/11/2026 23:59:59.999 no horário de Brasília.
- Edge Function `rsvp-confraternizacao` v7: prazo lido do banco a cada consulta; estados `nao_iniciadas`, `aberto`, `encerrado_manual`, `prazo_expirado`, bloqueio de busca/confirmação quando fechado. Nenhuma alteração na autenticação ou nas tabelas de participantes.
- Admin: edição de data/horário de prazo com seleção da situação, ações Abrir / Encerrar agora (confirmação explícita) / Reabrir, mensagem opcional de encerramento e card com situação efetiva no dashboard.
- Convite: mensagens distintas para cada estado, campo de mensagem personalizada, timer e rótulo de prazo dinâmicos, polling leve de status com janela ativa e bloqueio imediato ao vencer o prazo.
- Ao expirar, o status salvo `aberto` pode permanecer no banco; a **situação efetiva** é `prazo_expirado` calculada no servidor. Para reabrir, configure prazo futuro e salve com status `aberto`.
- O encerramento manual fica salvo como `encerrado`; o estado `rascunho` representa confirmações ainda não iniciadas.
- Estilos: `admin-v6.css` e `guest-v23.css` com escopo por página. Versionamento JS: `app.js?v=23`. Novo link anti-cache `/confraternizacao/convite-v23.html` e `/confraternizacao/admin/painel-v6.html`.
- QA estático: HTML equilibrado e sem IDs duplicados, CSS equilibrado, JS sintaticamente válido; 6 cenários de status no convidado, 3 mensagens e 6 estados do admin verificados via funções reais do JS. API real não testada com código de acesso privado; não manipular dados reais para testes.
- Seguranças preexistentes: RPC `rsvp_busca_rapida` não concedida a `anon`/`authenticated`; Edge Function mantém validação de sessão admin com token do evento e `verify_jwt=false` já configurado originalmente.
- Para verificação manual: entrar no admin com código existente, conferir status e prazo, testar `rascunho`, `encerrado` e `aberto` (em janela segura de homologação), confirmar que a lista histórica se mantém.

## Admin v7 — loader animado e sessão preservada
- Login inicial oculto até decidir se existe sessão em `sessionStorage`; evita piscar a tela de login antes do dashboard.
- Tela de carregamento com ícone, halo/anel em movimento, barra de progresso e textos de estado; efeitos acessíveis e desativados sob `prefers-reduced-motion`.
- Botão Entrar apresenta estado `Verificando acesso...` com indicador giratório.
- Reconexão: se `admin-bootstrap` falhar por rede ou tempo esgotado, mantém a sessão e mostra `Tentar novamente` e `Entrar com outro código`, sem expulsar o usuário automaticamente.
- Sai para login apenas com resposta de sessão inválida/expirada do servidor, logout explícito ou ausência de sessão.
- Previne chamadas simultâneas de bootstrap; as respostas de pedidos antigos não reabrem a sessão após logout. Timeout de 15 s evita spinner infinito.
- Atualização silenciosa só ocorre se painel e dados já estiverem carregados.
- Isolado ao admin, sem alteração no RSVP, banco, backend, convite público ou outras aplicações.

## Admin v9 — navegação recolhível, acompanhantes e avisos (24/11/2026)

- Botão hambúrguer no cabeçalho para ocultar/mostrar a navegação. No desktop recolhe a barra lateral; no celular oculta/mostra a navegação inferior.
- Barra inferior reforçada como fixa no celular, com espaçamento da área segura.
- Cabeçalho desktop com atalho de **Configurações** e logos oficiais da Covre Agrícola e Covre & Cia reaproveitados do convite. Logos ocultos em telas de até 960 px.
- Botão **Novo colaborador** removido do cabeçalho geral; disponível apenas em Colaboradores, junto a Importar e Exportar.
- Lista: removida a coluna Setor, incorporado à linha abaixo do nome do colaborador; a coluna Acompanhante recebe mais espaço e quebra de linha. Grade mobile reorganizada em 5 colunas lógicas.
- Confirmação manual: sobreposição central de carregamento ao salvar / retirar confirmação e ao salvar colaborador, bloqueando interação enquanto a mutação está em andamento. Popups e controles anteriores preservados.
- Toast e demais avisos do admin movidos para o alto da tela. Aviso de nova confirmação pública toca um *duplo tom suave* gerado por Web Audio API (sem arquivo de áudio); sujeito à permissão de reprodução após interação humana no navegador e apenas com o painel em primeiro plano.
- Arquivo visual específico `confraternizacao/admin-v9.css`; JavaScript `app.js?v=26`; administração em `confraternizacao/admin/painel-v9.html`.
- Caminhos do admin `index.html`, `painel-v6.html`, `painel-v7.html` e `painel-v8.html` alinhados à mesma interface, prevenindo referências a IDs antigos.
- Nenhuma alteração feita no Supabase, respostas existentes, Edge Functions ou arquivos do convite público.

## Admin v10 — polling adaptativo para o prazo RSVP (24/11/2026)
- Consultas de `admin-bootstrap` automáticas a cada cerca de 5 segundos **somente** com status efetivo `aberto`, sessão ativa, aba visível e sem operação em andamento.
- Status `rascunho`, `encerrado` e prazo expirado suspendem novas consultas automáticas, sem invalidar sessão e preservando tela/dados históricos.
- Primeiro acesso, atualizações por botão `Atualizar dados` e gravação/reabertura pelo admin continuam funcionando; se outro administrador reabrir o evento, clicar `Atualizar dados` para retomar.
- A Visão Geral informa quando o ciclo está ativo (5 segundos) ou pausado.
- Reutilizado `app.js?v=28` com cache bust em todas as versões de URL do admin, sem tocar no convite público, dados SQL ou Supabase.

## Admin v11 — cabeçalho corrigido e confirmação mais ágil (24/11/2026)
- Removido **Configurações** do cabeçalho. Permanece apenas na navegação lateral/aba de menu; preservado o hambúrguer.
- Logos originais da **Covre Agrícola** e **Covre & Cia** ampliados e centralizados no cabeçalho desktop; ocultos na versão mobile.
- Título do evento em negrito com transição suave verde/amarelo/laranja; dez partículas/confetes discretos inspirados na animação original do convite. Respeitado `prefers-reduced-motion`.
- O título continua atualizado dinamicamente do registro do evento; o JavaScript escreve em `admin-title-text`, preservando as partículas decorativas.
- Ao salvar confirmação/desconfirmação manual, após a **resposta positiva do servidor**, atualiza colaboradores, confirmação, contadores e lista na memória sem aguardar novo `admin-bootstrap` completo. A consulta automática de 5 segundos permanece para reconciliar estado quando o evento estiver aberto.
- Confirmação manual preserva dados preexistentes do acompanhante quando continua confirmada; retirar confirmação reflete sua exclusão somente após gravação bem-sucedida. Status de salvamento/antiduplo-clique existentes mantidos.
- Proteção para não sobrescrever a atualização local com respostas antigas de bootstrap usando `mutationEpoch`; o fluxo público e Supabase não foram modificados.
- Novos arquivos: `admin-v11.css`, `admin/painel-v11.html`, `app.js?v=29`; caminhos legados do admin sincronizados para evitar incompatibilidade de DOM.
- Verificações: validação de sintaxe JS, integridade de IDs/HTML, CSS equilibrado, testes de cálculo e renderização local sem alterar dados de produção.

## Admin v12 / Convite v24 — edição, identificação e celebração (24/11/2026)

- **Mensagem editável:** painel permite selecionar texto e aplicar **negrito** (`**texto**`), *itálico* (`*texto*`) e ~~tachado~~ (`~~texto~~`) com barra de ferramentas e prévia em tempo real. Até 500 caracteres (incluindo marcações). O convite cria elementos de texto por DOM e `textContent`, não usa HTML bruto de usuário; parágrafos preservados no backend.
- **Identificação com nome único:** não exige sobrenome do colaborador. Nomes com no mínimo três caracteres são aceitos; consultas com só um nome exigem correspondência exata do `nome_chave` (sem exibir várias pessoas com o mesmo primeiro nome). Permanece busca prefixada de nome + sobrenome para os cadastros completos. Companheiro continua exigindo nome completo. A RPC `rsvp_busca_rapida` foi atualizada via migração `rsvp_permitir_busca_nome_unico_exato_20261124` mantendo limites de busca. Edge Function `rsvp-confraternizacao` versão 8.
- **Identidade visual:** logos originais da Covre Agrícola e Covre & Cia voltaram ao canto direito no desktop, com taças e fogos discretos. Título mantém o degradê e ganhou pequenos fogos complementares; movimentos desativados quando usuário opta por movimento reduzido.
- **Indicadores:** Confirmados verdes e Pendentes amarelos; o indicador antigo de sobrenome foi renomeado para **Nome único**, informativo, sem impedir participação.
- **Lista:** sem rótulo **Manual** ao lado do status; linhas com altura constante e nomes longos limitados a duas linhas, preservando o nome completo em `title`. A confirmação manual preserva dados já registrados dos acompanhantes quando continua ativa.
- **Festa manual:** após confirmação positiva do servidor, toca o mesmo som curto permitido pelo navegador e surge um efeito temporário de fogos/taças. Não ocorre na desconfirmação ou em tentativas malsucedidas.
- **Carregamento:** indicação indeterminada verdadeira durante o pedido de rede (sem porcentagem fingida), com **Validando dados da confirmação...** ou **Removendo confirmação...** de acordo com a ação.
- Código do admin em `app.js?v=30`, estilos `admin-v12.css`, versão de URL `admin/painel-v12.html`; convite público usa `guest-v24.css` e todas as páginas/aliases foram sincronizadas. Nenhuma confirmação preexistente foi alterada durante a implementação.

## Admin v13 / Convite v25 — Apelido opcional e busca com 5 letras (24/11/2026)
- Campo opcional de apelido de até 60 caracteres no cadastro/edição. Preservado na edição, nas confirmações manuais, no CSV e na listagem, sem alterar respostas antigas.
- Busca pública inicia com **pelo menos 5 letras** (sem contar espaços), por início de nome, outras partes do nome ou apelido. Retorna até 40 colaboradores, incluindo vários com primeiro nome igual; o convidado escolhe o cadastro identificado pelo nome completo, com apelido visível quando houver.
- O backend revalida que o registro selecionado corresponde à busca, mantendo limite de tentativas, verificação de evento aberto e confirmação por ID.
- Novas colunas `apelido`/`apelido_chave` com valor padrão vazio; função `rsvp_admin_save_person_v2` atualiza cadastro e confirmação atomicamente; `rsvp_busca_rapida` preserva limite de requisições e aplica pesquisa parcial com 5 letras.
- HTML e CSS do admin v13 e convite v25 sincronizados entre links principais e aliases. Sem alterações aos colaboradores existentes na migração.


## Convite v26 · 24/11/2026
- Identificação simplificada, mantendo a busca a partir de cinco letras sem instruções repetidas. Rodapé de privacidade centralizado.
- Bottom sheet com altura preferencial de 80% da área visível em repouso, redução da altura quando o teclado aparece e rolagem restrita ao conteúdo; ações no rodapé.
- Escolha de acompanhante separada do preenchimento do nome. Continuar abre a etapa adicional, Voltar preserva a seleção, e somente a ação final registra a presença. Sem alterações de backend ou de outros aplicativos.
- Script público isolado em guest-app-v26.js; painel administrativo e versões anteriores preservados. Referências a IDs HTML verificadas; validação visual em aparelho real pendente.

## Admin v14 — Classificação de colaboradores em lote (24/11/2026)
- Seleção múltipla de colaboradores por checkbox individual, checkbox no cabeçalho da tabela e ação "Selecionar visíveis" (respeitando pesquisa, status, setor e grupo). A seleção persiste ao mudar filtros, com contagem e opção "Limpar seleção".
- Barra de ação contextual para **Editar setor e grupo**; modal com opções independentes de aplicar setor, grupo, ou ambos. Campo desmarcado nunca é modificado; setor pode ser limpo explicitamente; grupo exige nome. Sugestões dos setores e grupos já cadastrados.
- Incluído **Filtro por grupo** junto aos filtros existentes, e setor/grupo visíveis como metadados abaixo do nome (com tooltip quando truncados).
- Edição individual agora tem **Setor** e **Grupo / categoria** separados, preservando as confirmações, nomes e apelidos.
- Confirmação explícita antes de editar em lote, carregamento enquanto o servidor grava, bloqueio contra cliques duplicados e toast ao concluir. Máximo de 200 selecionados por operação.
- No Supabase: funções novas rsvp_admin_bulk_classify (atômica por evento, validação de IDs e atualização de campos opcionais) e rsvp_admin_save_person_v3 (edição individual de grupo). Permissão apenas para service_role; nenhuma leitura ou gravação pública de classificação. A Edge Function rsvp-confraternizacao v11 exige sessão de administrador antes da ação admin-bulk-update.
- Mudanças no banco foram apenas de definição de funções: nenhuma pessoa existente foi alterada pela migração. Testes de consultas, grupos, apelidos e filtros foram realizados com dados simulados, sem salvar alterações de teste em produção.
- Visual novo: admin-v14.css; app.js?v=32; atalho da versão em confraternizacao/admin/painel-v14.html; aliases antigos sincronizados.


## Painel v15 · 24/11/2026
- Checkbox de seleção menor, contorno discreto e realce suave. Toque em qualquer área não interativa do card/linha para selecionar ou desmarcar; editar e confirmar presença continuam ações independentes.
- Seleção individual atualiza o card e contador sem recriar a lista, preservando foco e limite de 200. Sem mudanças no banco ou convite público. Sintaxe JS verificada; teste em aparelho real pendente.


## Painel v16 · 24/11/2026
- Cadastro e edição em lote com um campo Categoria, filtro unificado e classificação anterior preservada quando não modificada; alterações explícitas sincronizam setor/grupo. Exportação legada preservada.
- Cadastro separado da confirmação de presença (admin-save-profile); editar perfil não altera confirmação nem acompanhante. A ação de presença continua na tabela.
- Exclusão individual com aviso de remoção definitiva da confirmação e acompanhante; admin-delete autentica sessão, restringe ao evento e usa FK CASCADE existente. Nenhum cadastro excluído durante a publicação.
- Sintaxe JS e referências HTML verificadas; teste visual pendente.


## Convite v27 / painel v17
- Recusa de presença com motivo opcional (500 caracteres); etapa própria, sem WhatsApp obrigatório. Uma resposta por colaborador; nova resposta substitui a anterior.
- Painel: recusados separados de pendentes e confirmados, motivo na lista e CSV. Presença manual pode substituir recusa; recusados fora do total esperado. Migração rsvp_resposta_recusada preserva respostas antigas. JS e IDs verificados.


## Painel v18
- Corrige a célula de acompanhante/motivo: display table-cell no desktop, alinhamento vertical central e quebra de linha natural; no celular, acompanha o início do texto do colaborador, sem truncar nomes ou motivos. Mantém seleção e ações existentes. Sem alterações no banco ou no convite.


## Convite v28
- Opção discreta de recusa abaixo do botão principal. Identificação por nome/apelido abre diretamente a etapa de motivo opcional quando iniciada pela recusa; fluxo de acompanhante permanece apenas para confirmações. Voltar permite corrigir a identificação. Sem alterações no backend ou painel.


## Painel v19
- Botões de impressão na visão geral e colaboradores. Nova aba com relatório A4 de confirmados, nomes de colaboradores e acompanhantes, logos existentes das Covres e assinatura tipográfica da confraternização; totais, data de emissão e cabeçalho de tabela repetido. Consulta atualizada via sessão administrativa; exclui pendentes/recusados. Impressão ou PDF pelo navegador. JS, IDs e amostra sintética verificados; impressão real pendente.
