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
