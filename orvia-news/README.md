# ORVIA NEWS · Portal colaborativo (v2)

Portal publicado dentro do repositório `gaveblue/gaveblue`, separado dos projetos GB+ e WeFrotas.

## Endereços

- **Portal público:** https://gaveblue.com.br/orvia-news/
- **Leitura de notícias:** https://gaveblue.com.br/orvia-news/noticia.html?slug=SLUG
- **Compartilhamento com manchete e foto:** https://ckpyhnqrlqxwkjvyurle.supabase.co/functions/v1/orvia-share?slug=SLUG
- **Candidatura e área do colaborador:** https://gaveblue.com.br/orvia-news/colaborar.html
- **Redação principal:** https://gaveblue.com.br/orvia-news/editor.html
- **Moderação e anúncios:** https://gaveblue.com.br/orvia-news/moderacao.html
- **Anuncie:** https://gaveblue.com.br/orvia-news/anuncie.html
- **Diretrizes editoriais e privacidade:** https://gaveblue.com.br/orvia-news/politica-editorial.html

## Governança de conteúdo

1. Qualquer interessado pode solicitar um cadastro por e-mail, nome e apresentação.
2. Após confirmação do endereço e login, o pedido surge na tabela `orvia_contributors` com estado `pending`.
3. O administrador autorizado acessa a central de moderação para aprovar, rejeitar ou suspender o cadastro.
4. O colaborador `approved` pode salvar rascunho e enviar notícia para revisão, mas **não pode publicar diretamente**.
5. O administrador revisa título, resumo, autoria, texto e notas privadas de apuração e decide: solicitar correções, rejeitar, salvar revisão ou aprovar/publicar.
6. A publicação exige `status='published'`, `review_state='approved'` e `published_at` preenchido, inclusive por restrição do banco.
7. Só notícias publicadas podem aparecer no portal e na visualização social. O compartilhamento utiliza uma Supabase Edge Function com metadados Open Graph.

**E-mail do administrador principal** autorizado: `guddubrowncontato@gmail.com`. O cadastro em si não cria a senha; a pessoa autorizada deve confirmar o e-mail e definir uma senha. Os cadastros abertos não têm direito de administrar, e o próprio usuário não pode se aprovar.

## Sistema de anúncios

A central permite inserir nome do anunciante, chamada, URL HTTPS, foto, posição, início, fim e ativação. Os anúncios patrocinados são identificados e publicados nas posições selecionadas, sem pagamento automático.

**Google AdSense:** implantação depende de uma conta aprovada, do ID do editor e de configuração de anúncios e consentimento de dados aplicável. Nenhum anúncio do Google é ativado sem essas condições.

## Assistência de IA

Os formulários de colaboradores e da redação principal permitem preparar e copiar um prompt para melhorar a estrutura textual no ChatGPT/Gemini. **Não existe integração automática com APIs de IA nem gasto associado neste momento**: ativá-la posteriormente exige credenciais de API em servidor seguro, política de tratamento de dados e limites de uso. A aprovação humana é obrigatória.

## Supabase

Projeto separado: `ORVIA NEWS` (ref `ckpyhnqrlqxwkjvyurle`), na mesma organização do GB+ e sem alterações nos bancos dos outros sistemas.

Tabelas: `orvia_editors` (administradores), `orvia_contributors` (candidaturas e aprovações), `orvia_articles` (matérias), `orvia_article_evidence` (fontes e notas internas privadas), `orvia_ads` (publicidade).

RLS habilitada em todas as tabelas; colaborações restritas à autoria; fontes e notas privadas nunca são lidas por visitantes anônimos. O bucket `orvia-news-images` só aceita uploads autenticados por administração ou por colaboradores aprovados, cada um em seu prefixo, com limites de tamanho e tipos de imagem. A leitura de imagens publicadas é pública.

## Segurança e etapas adicionais

- O endereço de confirmação de e-mail padrão do Supabase pode abrir uma página diferente. O usuário deve voltar ao portal para concluir o login. Recomenda-se configurar Site URL e Redirect URLs no painel de Auth.
- O aviso de segurança `Leaked Password Protection Disabled` precisa ser revisado em Authentication.
- A criação de contas, submissão, aprovação e exibição do cartão social ainda devem ser testadas do início ao fim usando contas de teste (antes de convidar público).
- Não foram integrados provedores externos de IA, pagamento de anúncios, Google AdSense, vídeo e newsletter.
- Revisão jurídica de termos de contribuição, privacidade e anúncios é recomendada antes de escala pública.
