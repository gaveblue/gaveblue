# Intervalo — CHANGELOG

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
