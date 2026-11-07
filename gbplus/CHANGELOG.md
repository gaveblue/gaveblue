# CHANGELOG — GB+ Gestão Financeira

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
