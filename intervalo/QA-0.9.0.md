# Intervalo 0.9.0 — QA técnico de acesso e operações

Data: 12/11/2026. Projeto fynaaiazebydorzllwip.

## Testes executados
| Componente | Resultado | Evidência / ressalva |
|---|---|---|
| Cadastro e convite do Master | Confirmado no banco | Conta com e-mail confirmado e last_sign_in_at, mas vínculo ainda pendente; prazo prorrogado 7 dias |
| Master por senha | Backend implantado | Função `activate-master` v3 valida a senha via Supabase Auth, não apenas o JWT; teste com senha real ainda pendente |
| Reset administrado | Backend implantado | `platform-control` v3 exige JWT + papel admin + confirmação da senha do próprio admin; só gera senha nova para membros confirmados não-admin |
| Troca obrigatória | Backend implantado | app_metadata protegida e bloqueio nas APIs de negócio; função `account-password` v1 valida senha atual e substitui |
| Interface de reset | PASS sintaxe | platform.js inclui geração, confirmação em diálogo e visualização uma vez; não testado em navegador real |
| Recuperação por e-mail | Interface corrigida, ENTREGA NÃO COMPROVADA | Supabase Auth chama resetPasswordForEmail; SMTP e redirects precisam configuração externa |
| Login + Minha Conta | PASS sintaxe | index.html e account.js; rotas novas no fallback da 404 |
| Vincular Super Admin como Master | Backend implantado | Autorização e senha revalidada com auditoria; não executado automaticamente no piloto |
| Cancelamento de comanda aberta | PASS SQL | Teste em transação rollback: criação, itens, cancelamento, liberação de mesa, reabertura |
| Bloquear cancelamento após envio | PASS SQL | Transição submitted seguida de tentativa de cancelar retorna erro |
| Cancelar pedido que tenha pagamentos | Regra implementada | Verifica existência de qualquer pagamento e bloqueia antes de cancelar |
| RPC de cancelamento | PASS privilégios | anon=false, authenticated=false, service_role=true |
| Cozinha automática a cada 15 segundos | PASS sintaxe | Polling somente quando aba visível; E2E pendente |
| Edge Functions | Todas ACTIVE | Verificação em list_edge_functions, incluindo account-password |
| Código no GitHub | PASS | Commits em branch main, sem GitHub Actions |
| Integração real / envio de e-mail | PENDENTE | Sem confirmação da entrega SMTP nem do domínio |
| Segurança Auth | AVISO | Proteção contra senhas comprometidas desativada no Supabase Advisor |

## Roteiro recomendado de validação
1. Entre no Super Admin em https://gaveblue.com.br/intervalo/admin.
2. Expanda o card Intervalo 27 e localize `Usuários do restaurante`. No usuário Master confirmado, clique `Redefinir senha` e confirme sua **própria** senha de Super Admin.
3. Copie a senha provisória exibida uma única vez, entregue pelo canal apropriado e feche a tela. Não envie a senha pelo chat ou por canais públicos.
4. Em janela anônima, o Master faz login, define nova senha obrigatória, faz login novamente e ativa seu vínculo na página `Meus restaurantes`.
5. Alternativa: o próprio Super Admin pode usar `Vincular minha conta como Master`; depois entra em `Meus restaurantes` sem depender do outro usuário.
6. Verifique a rota de recuperação por e-mail em /intervalo/recuperar-senha somente depois de configurar SMTP e redirect URLs na autenticação Supabase.
7. Crie mesa e produto de teste, abra comanda e cancele antes de enviar. Confirme que a mesa foi liberada.
8. Envie outra comanda para a cozinha e confirme que cancelamento deixa de aparecer/funcionar.
9. Mantenha a tela Cozinha aberta e confirme que a fila atualiza após 15 segundos sem exigir clique no botão Atualizar.
10. Teste separação de contas de dois restaurantes antes da homologação comercial.

## Riscos e limites
- A senha provisória é visível ao Super Admin enquanto o modal estiver aberto. Isso é uma alternativa administrativa à recuperação por e-mail, não substitui comunicação segura ao titular.
- Resetar a senha no Auth não garante encerramento imediato de todos os JWTs já emitidos. APIs privadas fazem bloqueio de app_metadata até troca, mas revogação de sessões e MFA adicional devem ser homologadas antes de operação comercial.
- A validação de senha do Super Admin exige que ele tenha login por e-mail/senha; contas exclusivamente OAuth podem exigir configurar uma senha antes.
- Redirecionamentos do Auth e SMTP não foram modificados no painel por não existir conector apropriado. Links ainda podem falhar até configuração.
- Ainda não existe navegador integrado para homologar clique real, redirecionamento e entrega HTTP; não declarar a versão homologada por completo.

**Status final:** QA estrutural e SQL parcial aprovado, E2E e entrega comercial pendentes.
