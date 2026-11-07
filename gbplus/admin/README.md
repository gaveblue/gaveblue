# Administração do GB+

Página: `/gbplus/admin.html`. Usa a sessão existente do GB+ e o mesmo cliente PKCE.
O código público não contém senhas nem credenciais privilegiadas.

## Implantação

1. Implantar `supabase/functions/gbplus-admin/index.ts`. A função valida o Bearer
   com `auth.getUser()` a cada solicitação e exige `app_metadata.gbplus_admin === true`.
   O gateway pode usar `verify_jwt = false` para aceitar o SDK com chave publishable:
   a autenticação e a autorização são obrigatórias dentro da função.
2. Conceder a marca de administrador apenas à identidade do proprietário confirmada
   no painel do Supabase. Nunca usar `user_metadata` ou uma lista de e-mails no frontend.
3. Preservar as URLs existentes e acrescentar à lista de redirecionamentos do Auth:
   `https://gaveblue.com.br/gbplus/admin.html`.
4. Publicar somente os arquivos deste painel e da função.

## Escopo

Lista paginada (50 contas), busca e filtros na página carregada, nome, celular,
situação de confirmação, provedores, datas de cadastro/acesso, edição de nome/celular,
suspensão/reativação de login e recuperação por e-mail. Ações são registradas nos logs
da função por ID de ator/alvo e operação; não se registra conteúdo do perfil ou tokens.
Não permite exclusão, mudança de e-mail, CPF, senha, papel administrativo ou finanças.

Suspender usa a operação oficial `ban_duration` do Supabase Auth. Tokens já emitidos
podem continuar válidos até expirar. Nenhuma política financeira/RLS é modificada.
O painel não apresenta suspensão como revogação imediata de todas as sessões.

Administradores usam o Google ou a própria senha existente. Não há senha compartilhada
nem senha de administrador embutida. Recuperação é realizada pelo titular no GB+.
