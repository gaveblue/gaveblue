# GB+ 2.5.1 — Serviços com identificação visual e catálogo de aplicativos

**Situação:** plano aprovado para desenvolvimento na 2.5.1, **ainda não publicado como funcionalidade**. Conservar a 2.5.0 exclusivamente para encerrar o núcleo de importação/conciliação OFX/CSV e o mapeamento manual de CSV da build 9.

## Objetivo

Permitir que o usuário identifique despesas com **serviços que realmente usa** (assinaturas e compras eventuais) por nome e logo durante o lançamento. O catálogo será um auxílio de identificação e preenchimento; **não** representa login, acesso à conta desses serviços, integração de pagamento nem parceria comercial com as marcas.

### Catálogo inicial, extensível

| Grupo | Serviços sugeridos | Natureza sugerida |
| --- | --- | --- |
| Vídeo e streaming | Netflix, HBO Max, Disney+, Prime Video, Globoplay, Apple TV, Paramount+, Crunchyroll | Assinatura opcional |
| Música e conteúdo | Spotify, Deezer, Apple Music, YouTube Music, YouTube Premium | Assinatura opcional |
| Delivery | iFood, 99Food, **Plus Delivery**, Rappi, aiqfome | Compra avulsa por padrão |
| Mobilidade | Uber, 99, inDrive | Compra avulsa por padrão |
| Assinaturas digitais | Google One, iCloud+, Microsoft 365, Canva, ChatGPT | Assinatura opcional |

Os serviços são exemplos para seleção, não assinaturas ativadas. O usuário pode buscar, cadastrar **Outros serviços** e editar tudo. Nomes de serviços podem mudar; o catálogo deve ser revisável sem reescrever lançamentos históricos.

**Confirmações de nomenclatura:** Plus Delivery (serviço capixaba: `institucional.plusdelivery.com.br`), 99Food (retomada em 2025, `99app.com`/comunicados oficiais), HBO Max (marca usada no Brasil, `help.hbomax.com`).

## Experiência de uso, sem poluição visual

1. No formulário **Novo lançamento**, uma ação discreta **Identificar serviço** permite abrir busca rápida e filtros: Streaming, Música, Delivery, Mobilidade, Serviços digitais, Todos.
2. Cada resultado mostra logo/ícone em miniatura (28–32 px), nome e grupo. **Nenhum card gigante** e nenhuma tela forçada para quem não usa serviços.
3. Ao selecionar, o GB+ pode preencher **descrição** e sugerir a categoria correspondente, sem trocar valor/data/conta já preenchidos pelo usuário. O usuário pode desconsiderar a sugestão.
4. Streaming e música: oferecer periodicidade mensal/anual como **opção**, nunca marcar como assinatura ou gerar recorrências automaticamente. Delivery e transporte: **avulso por padrão**, sem supor mensalidade.
5. Depois, em detalhes do lançamento e na lista, exibir a mesma identificação visual quando houver serviço associado. Se a marca mudar ou o asset sumir, preservar o texto.
6. Serviços personalizados terão nome próprio e ícone genérico selecionável, sem gerar automaticamente logos falsificados.

## Logos: contrato visual e privacidade

- Adotar **logos oficiais autorizados ou disponibilizados para essa finalidade**, conferindo marca atual, direitos de uso e fonte. **Não desenhar logos aproximados** nem afirmar parceria.
- Os arquivos aprovados ficam **empacotados localmente** no GB+ (PNG/WebP/SVG seguro conforme licenciamento), evitando consultas ao domínio do serviço toda vez que o usuário abrir o financeiro.
- Ícones exibidos em 28–32 px, alinhados com a identidade discreta do GB+, com fallback por **iniciais neutras**, descrição acessível por nome, contraste nos temas claro/escuro e tratamento de arquivo ausente.
- Só incluir logo após verificar origem, licença/uso permitidos e legibilidade. Na ausência de permissão, o nome e fallback são suficientes.
- Nenhum logo realiza conexão à conta do serviço; nenhuma senha/código de assinaturas é solicitada.

## Dados, integridade e segurança

- Catálogo de serviços com **IDs estáveis** (por exemplo `streaming-netflix`, `delivery-ifood`), tipo, rótulo, grupo, modo de cobrança sugerido, ícone fallback e status de logo.
- O serviço é um **atributo opcional do lançamento**; não confundir com `categoria` nem `parceiro`. Preservar compatibilidade do banco de dados antigo e de backups.
- Aplicar os controles de criação/edição que já existem: não duplicar títulos, baixas, parcelas, despesas de cartão ou transferências ao escolher um serviço. **Selecionar um logo não grava dinheiro.**
- Não armazenar credenciais, preços fixos nem valores presumidos de serviços.

## Critérios de aceite e homologação da 2.5.1

- [ ] Seleção e busca por nome (inclusive variações sem acento), grupo e opção personalizada.
- [ ] Logos aprovados aparecem corretamente no Android, desktop e tema escuro; na falha o fallback permanece utilizável.
- [ ] Nenhum valor, vencimento, categoria já escolhida ou periodicidade é alterado silenciosamente.
- [ ] Delivery permanece pagamento avulso salvo escolha do usuário; streaming só cria recorrências após confirmação.
- [ ] A mesma despesa não é contabilizada duas vezes por associação de serviço.
- [ ] O serviço salvo é exibido e pode ser editado/removido sem apagar o lançamento.
- [ ] Novo cadastro e edição em modo local e usuário autenticado, com revisão de permissões e regressões.
- [ ] Registro de todas as compilações no `CHANGELOG.md`, relatório de homologação e implantação confirmada antes de status público.

## Fases

- **2.5.1 build 1:** catálogo técnico e seletor compacto no formulário, com iniciais como fallback.
- **2.5.1 build 2:** logos oficiais verificados, detalhes visuais e aprimoramentos de busca.
- **2.5.1 build 3 (se necessário):** revisão de assinaturas/recorrências e testes de acessibilidade/relatórios.

As fases são marcos técnicos, não uma promessa de que tudo está publicado. **A 2.6.0 fica reservada para a expansão de orientação financeira contextual e organização de orçamento**, sem deixar esse catálogo competir com o escopo principal da 2.6.
