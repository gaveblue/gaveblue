# QA Intervalo 0.1.1 — evidências e limitações

**Data:** 2026-11-12

| Verificação | Evidência | Estado |
|---|---|---|
| Supabase separado do GB+ | Projeto fynaaiazebydorzllwip ativo | Aprovado |
| Sem alteração nos dados do GB+ | Projeto GB+ não sofreu operações nesta etapa | Aprovado |
| Primeiro Super Admin configurado | Singleton privado não consumido; trigger em auth.users criado | Aprovado (estrutura) |
| Limite de uso único | `initial_admin_bootstrap.consumed_at IS NULL` verificado antes do cadastro | Aprovado (estrutura) |
| Privacidade | Acesso ao schema privado negado a `anon` e `authenticated` | Aprovado |
| Security Advisor | Zero avisos retornados | Aprovado |
| Tela de configuração e roteamento | Commits no repositório; requer smoke test no navegador | Parcial |
| Envio de confirmação e Auth real | Não houve criação de usuário ou confirmação de e-mail | Pendente |
| Redirecionamento Auth | Sem ação de configuração disponível pela integração atual | Pendente |
| Site público no domínio | Página externa não acessível pelos verificadores atuais | Não comprovado |
| Isolamento entre dois restaurantes | Sem usuários e restaurantes de teste criados | Pendente |
| Build React | Dependências npm não disponíveis no ambiente de homologação | Pendente |

## Configuração antes do primeiro login
- Supabase → Authentication → URL Configuration:
  Site URL = `https://gaveblue.com.br/intervalo/`
  Redirect URL = `https://gaveblue.com.br/intervalo/login`
  Redirect URL = `https://gaveblue.com.br/intervalo/ativar`
  Redirect URL = `https://gaveblue.com.br/intervalo/redefinir`
- Authentication → Providers → Email: manter confirmação de e-mail habilitada.
- Verificar se o endereço autorizado é membro da organização Supabase ou configurar SMTP próprio, sem criar planos pagos sem aprovação.
- Abrir `https://gaveblue.com.br/intervalo/configurar-admin`, definir senha forte, confirmar e-mail e efetuar login.
- Conferir no banco que `platform_admins` contém um administrador ativo e o bootstrap aparece como consumido.

**Não marque a versão como homologada até validar o fluxo completo.**
