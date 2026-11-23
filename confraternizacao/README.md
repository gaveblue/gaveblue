# Confraternização · RSVP (2026)
Implementação isolada do convite corporativo GaveBlue, sem alterações nos aplicativos GB+, Intervalo ou WeFrotas.

## Links
- Público: https://gaveblue.com.br/confraternizacao/
- Gestão: https://gaveblue.com.br/confraternizacao/admin/

## Dados e backend
- Projeto Supabase reutilizado: gaveblue.com (wkssfugzghwifaddagfr). O projeto denominado GB+ estava INACTIVE quando foi criado este módulo; nenhum projeto novo foi contratado.
- Tabelas dedicadas: rsvp_eventos, rsvp_colaboradores, rsvp_confirmacoes, rsvp_limiter.
- RLS habilitado e sem permissões diretas para anon/authenticated; somente Edge Function acessa com service role no servidor.
- Edge Function: rsvp-confraternizacao (verify_jwt=false por conter endpoints públicos; todas as ações admin validam getUser + platform_admins.active).
- Gestão usa o mesmo login de administradores da plataforma GaveBlue (Supabase Auth no projeto ativo).
- Convidados: busca única com nome e pelo menos 3 letras do último sobrenome; máximo 8 resultados por busca; rate limit no servidor. Nome + sobrenome não equivale a autenticação forte.
- Confirmação: unique(evento_id,colaborador_id), edição idempotente por upsert; inclui zero ou um acompanhante; redirecionamento via WhatsApp com número único configurado no evento.
- WhatsApp: salvar a confirmação não prova o envio da mensagem (o usuário deve tocar Enviar).
- Colaboradores: cadastro manual, edição, inativação, importação por texto, CSV ou TXT; exportação em CSV.

## Ativação
1. Entrar no painel administrativo com uma conta ativa em public.platform_admins.
2. Abrir Configurações e informar título, data, horário, local e número de WhatsApp com DDI (ex.: 5527999999999).
3. Abrir Colaboradores e cadastrar/importar a lista.
4. Alterar o status do evento de Rascunho para Aberto; salvar.
5. Compartilhar o link público.

## Limitações atuais
- Não foram fornecidos ainda colaboradores nem número do WhatsApp; evento continua em rascunho.
- Importação binária .xlsx não está habilitada; é possível colar nomes ou importar CSV/TXT.
- O servidor valida autorização administrativa, mas a página pública usa apenas identificação por nome/sobrenome, adequada somente se este risco for aceito.
- Checagens realizadas: scripts JS analisados sintaticamente, Edge Function ativa, endpoint 'event' respondeu HTTP 200, RLS e revogação de acessos públicos confirmados. Teste ponta a ponta com navegador e mensagens reais ainda pendente.
