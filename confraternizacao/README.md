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
