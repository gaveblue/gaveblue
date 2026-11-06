# GB+ — Plano de evolução após a versão 2.0.0

Este arquivo separa o que já entrou no código do que ainda depende de implementação e testes. Não representa homologação de uma versão publicada no servidor.

## Versão 2.1.0 — Acesso e cadastro (código implementado, homologação pendente)

- [x] Tela de confirmação de e-mail com possibilidade de reenvio
- [x] Validação de e-mail e senha e mensagens de feedback mais claras
- [x] Tratamento de retorno cancelado/expirado do login Google
- [x] Prevenção de reloads duplicados ao mudar a sessão
- [x] Diagnóstico de configuração Google e proteção contra espera excessiva
- [x] Checklist de produção em [AUTH-DEPLOY.md](./AUTH-DEPLOY.md)
- [ ] Validar SMTP, URLs permitidas e provedor Google no Supabase e no Google Cloud
- [ ] Homologar cadastro, confirmação, recuperação, login Google e PWA com usuários de teste

## Versão 2.0.0 — Grande Atualização (código concluído)

- [x] Configuração inicial para contas novas, com cadastro opcional de conta e saldo de abertura
- [x] Revisão e confirmação antes de gravar dados financeiros iniciais
- [x] Atalhos móveis personalizáveis: Início e Novo fixos; três posições editáveis
- [x] Tela de abertura com conteúdo em toda a largura, sem margens do painel
- [x] Menu hambúrguer de recolhimento exclusivo do desktop; atalho móvel “Mais” com três pontos
- [x] Bolha de IA móvel: posição inicial visível, arraste, docking lateral e área sempre recuperável
- [x] Preferências preservadas nas estruturas existentes, sem migração destrutiva

## Próxima etapa — Estabilidade e validação em dispositivos

- [ ] Testar a abertura e a autenticação no Android, no iPhone e em navegadores desktop
- [ ] Homologar primeiro acesso, conta com saldo positivo/negativo e opção de pular
- [ ] Testar transição claro/escuro, atualização de PWA, offline e rotação de tela
- [ ] Confirmar visual do menu inferior em aparelhos de diferentes larguras
- [ ] Confirmar persistência das preferências ao entrar na mesma conta em dois dispositivos

## Etapa seguinte — Configuração mais completa

- [ ] Possibilidade de adicionar mais de uma conta no passo a passo
- [ ] Melhor orientação sobre saldo inicial, sem duplicar receitas nem baixas
- [ ] Personalização da barra de ações mais intuitiva, com prévia e reordenação
- [x] Checklist opcional de primeiros passos: conta, saldo inicial e primeiro lançamento, sem gravar movimentações automaticamente

## Etapa seguinte — GB+ AI

- [ ] Comandos em linguagem natural para localizar, filtrar e editar títulos de forma guiada
- [ ] Prévia obrigatória antes de criar, editar, baixar ou excluir lançamentos
- [ ] Histórico de conversas e recuperação de contexto sem ações silenciosas
- [ ] Mensagens de erro claras e acesso seguro aos registros, respeitando o usuário conectado

## Etapa seguinte — Controle e confiabilidade

- [ ] Conferências e alertas para vencimentos, saldos e inconsistências
- [ ] Exportação e restauração verificáveis com versões de backup compatíveis
- [ ] Melhorar relatório do fluxo de caixa e controle de contas a pagar/receber
- [ ] Testes automatizados de regressão antes de cada publicação

**Regra:** alterações financeiras exigem confirmação e persistência validada. Não apagar dados do usuário para corrigir interface, cache ou atualização.

## Arquitetura de longo prazo — GB+ Pessoal e GB+ Empresas

- [x] Projeto de arquitetura definido e documentado em [ARQUITETURA-PF-PJ.md](./ARQUITETURA-PF-PJ.md)
- [~] CPF único e imutável já protegido na tabela `gbplus_profiles` (primeiro cadastro validado, sem alterar registros financeiros); migração completa dos demais dados PF ainda pendente
- [ ] Implementar ambientes financeiros (workspaces) independentes, sem alterar visual de usuários PF
- [ ] Implantar cadastro PJ, CNPJ, matriz, filiais e vínculos de equipe por permissão
- [ ] Evoluir o financeiro para segregação por empresa/filial, com consolidados e trilhas de auditoria

> Plano futuro: o documento é preparatório; não autoriza migração, atualização do banco ou mudança de cadastro sem revisão e testes.

## Interface personalizada — GB+ 2.2.2

- [x] Seletores próprios nos formulários e filtros do GB+, com navegação por toque e teclado e integração com dados existentes.
- [x] Calendário visual do GB+ para os campos de data, com limites de data, confirmação por seleção e fundo desfocado.
- [x] Janela de atualização centralizada, sem simulações de download/instalação e com confirmação própria para reiniciar.
- [x] Convite de instalação PWA no navegador de celular, utilizando o evento real do navegador quando oferecido.
- [x] Menu de Receita e Despesa com setas coloridas (v2.2.1).
- [ ] Continuar refinando outros elementos nativos fora de seletores/calendários (por exemplo: seletor de arquivos, teclado do dispositivo e recursos do sistema). Algumas interfaces do navegador ou sistema operacional não podem ser substituídas pela aplicação; não simular ações do sistema.

> Os elementos de origem dos formulários continuam existentes, mas ficam visualmente ocultos quando substituídos pelos controles GB+, preservando FormData e validações. Nunca alterar dados financeiros apenas ao abrir um seletor ou calendário.

## GB+ 2.3.8 — autenticação e boas-vindas

- [x] Indicador de força da senha (consultivo) e confirmação em tempo real.
- [x] Avisos de sessão encerrada e links de acesso/recuperação inválidos ou expirados.
- [x] Feedback para HTTP 429 e intervalo local de reenvio de e-mails.
- [x] Checklist de conta, saldo inicial e primeiro lançamento.
- [ ] Revisar limites efetivos de Auth no painel Supabase e homologar em dispositivos reais.
- [ ] Auditar avisos do Security Advisor antes de considerar a proteção concluída.

## GB+ 2.3.9 — correções de estabilidade e segurança

- [x] Unificar e persistir na sessão o intervalo de reenvio de e-mails na autenticação.
- [x] Impedir recuperação indiscriminada de recursos não versionados de caches de PWA de outros builds.
- [x] Atualizar versão, build, histórico e testes de regressão (28 verificações em ambiente simulado).
- [x] Inspecionar read-only RLS de documentos/perfis e a autorização básica de `gbplus_save`.
- [ ] Homologar fluxo real em dispositivos, PWA, SMTP e Google.
- [ ] Revisar configurações efetivas de limites de Auth e proteção contra senhas vazadas no painel.
- [ ] Auditar formalmente a função financeira privilegiada antes de qualquer mudança no banco.

O fechamento da 2.3.9 no repositório não equivale à confirmação da implantação no site e nos aplicativos instalados.


## GB+ 2.4.0 — Cartões, bancos e futuro financeiro (implementado no código)

- [x] Catálogo de bancos principais com logos por ISPB e identificação alternativa por iniciais.
- [x] Cadastro e edição de bancos personalizados em Bancos e Configurações.
- [x] Seleção de banco nas contas financeiras e no assistente de primeiro acesso.
- [x] Cadastro de cartão de crédito, limite, fechamento, vencimento e conta prevista para pagamento.
- [x] Compras vinculadas ao cartão, com categoria, parceiro e parcelamento de até 36 parcelas.
- [x] Geração/atualização automática das faturas em títulos de Contas a pagar sem despesa duplicada.
- [x] Baixa parcial ou integral das faturas pela rotina financeira existente, liberando limite somente pelo pagamento efetivo.
- [x] Bloqueio de exclusão de compras com faturas pagas e edição/exclusão direta de faturas.
- [x] Projeção de caixa para 7, 15, 30, 60 e 90 dias; resumo no Dashboard, calendário e alertas de saldo negativo.
- [x] Projeção por conta bancária e simulador de vencimento sem alteração de registros reais.
- [x] Relatório de compras no cartão por categoria, independente da despesa realizada em caixa.
- [x] Compatibilidade de validação com backups do formato anterior e inclusão dos novos módulos na atualização do PWA.
- [x] Testes lógicos/de regressão em ambiente simulado (46 aprovações).
- [ ] Homologar a publicação, PWA, sincronização Supabase, parcelamentos e faturas em dispositivos reais.
- [ ] Refinar logos offline, histórico de faturas fechadas, contestação de compras e regras bancárias especiais após feedback.

**Detalhes e limites:** consulte [RELEASE-2.4.0.md](./RELEASE-2.4.0.md). A implementação dos arquivos não equivale à homologação final no site.


## GB+ 2.4.5 — ajuste visual sem mudança de dados (código implementado)

- [x] Colocar “Seu futuro financeiro” antes do fluxo de caixa, abaixo dos indicadores principais, sem redesenhar o topo do Dashboard.
- [x] Corrigir largura do fluxo de caixa em telas móveis; conter rolagem de SVG e tabela dentro do painel.
- [x] Criar visualizações de Barras, Linhas e Resultado líquido, mantendo os valores das baixas originais.
- [x] Mostrar últimos 6 períodos no gráfico móvel, mantendo a tabela completa.
- [x] Incorporar localmente 12 logotipos SVG de instituições financeiras e incluí-los no pacote do PWA.
- [x] Permitir seleção visual do logo no cadastro de contas, cartões e configuração inicial, preservando instituições personalizadas.
- [x] Testes de código (52 aprovações em ambiente simulado) e documentação da atualização.
- [ ] Homologar em celular real (320/360/390 px), com logos, atualização do PWA e dados já cadastrados.
- [ ] Confirmar publicação da compilação 59 no site oficial.

Detalhes: [RELEASE-2.4.5.md](./RELEASE-2.4.5.md). A evolução maior permanece reservada para **2.5.0**, conforme planejamento.


## GB+ 2.4.6 — instituições, códigos e pesquisa (código implementado)

- [x] Ampliar o catálogo de 12 para **78 instituições** em ordem alfabética, usando o COMPE e ISPB da fonte consultada.
- [x] Incluir Sicoob (756, termo de busca “Sicobi”), Banco do Nordeste (004) e Banco Pan (623).
- [x] Incorporar localmente os **78 arquivos SVG** e incluí-los no manifesto de atualização do PWA.
- [x] Buscar por nome, código COMPE, ISPB e apelidos na seleção visual de contas e cartões.
- [x] Manter faixa horizontal filtrável com logos, além do seletor nativo opcional.
- [x] Buscar instituições também no módulo Bancos, com exibição dos códigos.
- [x] Preservar IDs internos antigos e permitir instituições personalizadas.
- [x] Criar base read-only de leitura OFX/CSV e teste da lógica de comparação, sem ativar importação.
- [ ] Homologar a publicação, seleção no celular, imagens offline e preservação das contas antigas.

## GB+ 2.5.0 — Importação manual e conciliação bancária (planejada)

- [ ] Interface de seleção da conta e upload local de OFX/CSV.
- [ ] Prévia dos movimentos antes de gravar, com os valores em centavos e data de origem.
- [ ] Sugestão de conciliação com baixas e transferências existentes, sem lançar em duplicidade.
- [ ] Ações por movimento: vincular, criar título/baixa com confirmação, ignorar ou manter pendente.
- [ ] Tratamento de reimportações, identificação FITID, duplicidades e histórico de auditoria.
- [ ] Exibição de divergências entre saldos bancários e sistêmicos, sem modificar saldo de abertura.
- [ ] Importação de planilhas CSV/XLSX para receitas e despesas, com mapeamento e revisão.
- [ ] Persistência segura por conta/usuário com RLS, testes de isolamento e possibilidade de desfazer.
- [ ] Homologação de arquivos bancários reais, múltiplos bancos, dispositivos e PWA offline.

**Não antecipar a sincronização via Open Finance**: ela permanece candidata a uma versão estrutural posterior como a 3.0.0. Arquivo de design: [IMPORTACAO-2.5.0.md](./IMPORTACAO-2.5.0.md). A existência do parser não ativa a importação nesta versão.

## GB+ — Cronograma 2.4.7 a 3.0.0

**Plano formal:** [PLANO-VERSOES-2.4.7-A-3.0.0.md](./PLANO-VERSOES-2.4.7-A-3.0.0.md).

### 2.4.7 — Notas de atualização ilustradas (código implementado)

- [x] Cartões visuais com ícones, títulos e descrições nas novidades da versão.
- [x] Suporte a `highlights` estruturados e às `notes` antigas.
- [x] Mostrar todas as melhorias listadas em vez de truncar nos três primeiros itens.
- [x] Mostrar notas da versão instalada na conferência manual, quando publicada e confirmada.
- [x] Corrigir leitura de manifestos com mais de 80 assets (139 no catálogo atual).
- [x] Manifesto **2.4.7 / build 61**, estilos e cache atualizados.
- [x] Cinco testes novos de validação de manifesto, ícones e apresentação.
- [ ] Conferir publicação e homologar central de atualização no Android/PWA.

### 2.4.8 — Estrutura do GB+ AI e anexos (implementada no GitHub)

- [x] Prévia dentro da conversa, com vencimentos e total detalhados.
- [x] Botões Detalhar, Editar, Descartar e Confirmar e gravar, com gravação expressamente autorizada.
- [x] Edição completa dos dados antes da confirmação e tratamento de pedidos como “altera para dia 20”.
- [x] Botão de anexos: OFX/CSV com prévia local e PDF/Excel aguardando interpretação.
- [x] Quatro novos assets registrados no PWA e build 62.
- [x] Testes de cálculos e segurança do fluxo do chat.
- [ ] Conferir a publicação e homologar em celular real.

**Esclarecimento:** “lançamentos automáticos” significa sugerir a criação de títulos a partir do extrato bancário não conciliado, com seleção e aprovação pelo usuário. O motor de conciliação completa entra na 2.5.0.

### 2.4.9 — Preparação de OFX/CSV (planejada)

- [ ] Melhorar cobertura do parser de extratos e o tratamento de arquivos problemáticos.
- [ ] Endurecer a proposta de conciliação e a detecção de duplicidades.
- [ ] Homologar operações em modo prévia, sem permitir gravação.

### 2.5.0 — Importação bancária (planejada)

- [ ] Tela de importação, conferência e conciliação OFX/CSV por conta.
- [ ] Aprovação por lançamento e gravação segura sem dupla contabilização.
- [ ] RLS, auditoria, reversão controlada e testes ponta a ponta.
- [ ] XLSX de despesas/receitas em etapa de homologação específica.

### 3.0.0 — Evolução principal da IA (planejada)

- [ ] Linguagem natural para análise financeira e preparação de operações.
- [ ] Prévia e confirmação obrigatórias antes de qualquer gravação.
- [ ] Permissões, histórico auditável, privacidade e testes da IA.
- [ ] Não assumir Open Finance automático como parte desta versão.

### 2.4.8 · Compilação 63 — Bancos em destaque

- [x] Mostrar 20 instituições conhecidas nos seletores de contas e cartões, sem exibir os 78 logos de uma vez.
- [x] Preservar o catálogo de 78 bancos e instituições para busca por nome/código e diretório completo.
- [x] Preservar contas com bancos fora dos 20 destaques.
- [x] Atualizador passou a reconhecer compilação (build) dentro da mesma versão numérica.
- [x] Quinze testes específicos de bancos e atualizador.
- [ ] Homologação visual e instalação no aparelho.

### 2.4.8 · Compilação 64 — Pesquisa e escolha de bancos simplificadas

- [x] Mostrar todas as instituições na faixa horizontal de contas, cartões e primeiro acesso.
- [x] Posicionar os bancos mais conhecidos no início, mantendo os demais disponíveis pela rolagem.
- [x] Unificar o campo “Pesquisar” e retirar textos técnicos, contagens e opção de abrir lista extra.
- [x] Reduzir os destaques do resumo de atualização ao que é relevante para o usuário final.
- [x] Preservar instituições personalizadas e bancos selecionados em contas anteriores.
- [ ] Homologar a faixa no celular, busca, rolagem e publicação da compilação 64.

### 2.4.9 · Compilação 67 — Pílulas de saldo bancário

- [x] Substituir os mini-cartões por pílulas compactas com logo redondo e valor da conta.
- [x] Manter saldo consolidado no cartão principal e rolagem horizontal dos bancos.
- [x] Preservar clique para abrir as movimentações da conta, sem alternar saldo principal nem adicionar botão de voltar.
- [x] Atualizar versão PWA e testes de regressão.
- [ ] Homologar visualmente no celular e confirmar publicação.
