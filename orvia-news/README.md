# ORVIA NEWS — portal e redação

Projeto hospedado dentro do repositório público `gaveblue/gaveblue`, na pasta `/orvia-news/`.

- Portal público: https://gaveblue.com.br/orvia-news/
- Painel editorial: https://gaveblue.com.br/orvia-news/editor.html
- Supabase independente: `ORVIA NEWS` (`ckpyhnqrlqxwkjvyurle`), região São Paulo, mesma organização do GB+; o banco do GB+ e o WeFrotas não são utilizados.
- Apenas a chave *publishable* do Supabase está no navegador; **nenhuma service-role key**.

## Primeiro acesso do editor

No painel da redação, crie uma senha para o e-mail autorizado e confirme o cadastro pelo link enviado ao e-mail.

O fluxo atual de cadastro utiliza o redirecionamento padrão do Supabase para reduzir a dependência de configurações externas: após confirmar o e-mail, volte diretamente ao painel da ORVIA NEWS e entre com o e-mail e senha. O link de confirmação **pode abrir outro endereço** enquanto o URL Configuration não estiver ajustado.

Recomendação administrativa futura (a conexão Supabase disponível aqui não permite alterar essa opção):
1. No projeto ORVIA NEWS, abra **Authentication → URL Configuration**.
2. Configure **Site URL** como `https://gaveblue.com.br/orvia-news/editor.html`.
3. Inclua essa URL em **Redirect URLs**, para que futuros links de confirmação e recuperação retornem à redação.

O e-mail autorizado para o painel editorial é: `guddubrowncontato@gmail.com`.
Para cadastrar outro editor depois, a administração do Supabase deve inserir o e-mail verificado na tabela `public.orvia_editors`; **não conceda permissões a qualquer usuário automaticamente**.

## Como publicar uma notícia

1. Acesse `/orvia-news/editor.html`.
2. Na primeira vez, informe o e-mail autorizado, uma senha de no mínimo 8 caracteres e clique em **Criar meu acesso**.
3. Confirme o link recebido por e-mail. Volte e clique em **Entrar**.
4. Preencha título, resumo, editoria, autor, texto completo e opcionalmente a imagem (JPG/PNG/WebP, até 5 MB).
5. Clique em **Pré-visualizar** para revisar, **Salvar rascunho** para guardar sem publicar ou **Publicar notícia** para colocar no ar.
6. Em **Minhas matérias**, use **Editar**, **Retirar do ar** ou **Excluir**.

O site lê somente matérias `status='published'` com `published_at <= now()`. Até existir alguma matéria publicada, o site mostra conteúdo ilustrativo claramente identificado como demonstrativo. A primeira publicação substitui esses exemplos.

## Segurança

- Tabelas `public.orvia_articles` e `public.orvia_editors` com RLS.
- Leitura pública apenas para artigos publicados.
- Edição, criação, remoção e upload de mídias só para e-mail cadastrado na tabela de editores, após autenticação.
- Bucket público `orvia-news-images` só para imagens autorizadas, com limite de tamanho e tipos MIME.
- Criação de outros editores feita somente por administrador do banco.
- Scripts do navegador nunca contêm chaves secretas nem credenciais.

## Ainda não implementado

Newsletter por e-mail, estatísticas reais de mais lidas e upload nativo de vídeos não estão ativos nesta versão inicial. A publicação deve ser feita manualmente por um editor, após apuração jornalística e checagem de fontes.
