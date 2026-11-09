# Administração do GB+

Página: `/gbplus/admin.html`. Usa a sessão existente do GB+ e o mesmo cliente PKCE.
O código público não contém senhas nem credenciais privilegiadas.

## Implantação

1. Implantar `supabase/functions/gbplus-admin/index.ts`. A função valida o Bearer
   com `auth.getUser()` a cada solicitação e exige `app_metadata.gbplus_admin === true`.
   O gateway usa `verify_jwt = true`, conforme a configuração atual do projeto:
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

## Convites, comunicação e resumo de uso (novembro de 2026)

Aplicar `gbplus/integrations/supabase/admin-engagement.sql` e implantar também
`gbplus-mail-optout` (autorização por token individual, somente POST).
Adicionar `https://gaveblue.com.br/gbplus/convite.html` aos redirects do Auth.
Guardar `GBPLUS_RESEND_API_KEY` somente em Edge Function Secrets, com Sending access
restrito a `gbplus.gaveblue.com.br`. Convites usam o SMTP já configurado no Auth.

O painel cria convites sem senha compartilhada; o titular define a senha no link.
Mensagens de serviço e marketing têm prévia e confirmação. Marketing exige opt-in
registrado pelo próprio usuário; inclui descadastro individual e One-Click.
Limites: 10 destinatários por composição, 30 operações em 24h, 60s por destinatário.
Operações são idempotentes; resposta incerta exige conferir Resend antes de repetir.
Histórico guarda assunto/destinatário/status, não corpo; limpeza após 90 dias ocorre
na consulta do histórico ou reserva de envio. Aceito pelo provedor não significa entregue.

A API fornece cidade/UF informadas, atividade recente, tempo aproximado em primeiro
plano e apenas contagens de contas/cartões/lançamentos/parceiros. Não fornece saldos,
conteúdo financeiro, CPF nem senhas. Medição começa nesta versão, sem histórico retroativo.
As novas tabelas são fechadas ao cliente: RLS sem políticas e sem grants diretos.
Os dois RPCs autenticados são intencionalmente SECURITY DEFINER, com search_path vazio
 e auth.uid obrigatório, sem parâmetro de usuário. Demais RPCs são exclusivos do servidor.
Os avisos do advisor sobre essas funções e ausência de políticas foram revisados:
nenhuma tabela administrativa tem acesso direto anon/authenticated.

Validação: 13 testes mock sem envio; testes SQL de consentimento, idempotência e
contagem de atividade com rollback integral. Entrega real de convites/mensagens
personalizadas deve ser validada no primeiro envio autorizado pelo proprietário.
