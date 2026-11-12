# Intervalo — QA e causa-raiz da falha crítica 0.9.1
Data: 12/11/2026 · Ambiente Supabase fynaaiazebydorzllwip

## Por que a criação de restaurantes falhava
Os logs reais do Supabase confirmaram três requisições POST /functions/v1/admin-provision com HTTP 409 em 12/11/2026, às 15:08:19, 15:08:26 e 15:09:52 UTC. A operação chamada por esse endpoint, POST /auth/v1/invite, devolveu HTTP 429 nas três tentativas. O endpoint antigo não criava restaurante caso o envio por e-mail falhasse.
O serviço POST /auth/v1/recover também devolveu HTTP 429 às 14:43:34 UTC no mesmo dia. Assim, o serviço de envio do Auth estava limitado, afetando tanto convites como recuperação de senhas. Nenhum erro de CPF ou nome do restaurante foi demonstrado nesses logs.

## Reparos
1. Criação SQL atômica com `intervalo_create_restaurant`, privilégio EXECUTE restrito a `service_role`; não envolve SMTP.
2. E-mail do Master opcional, registrado separadamente em `restaurant_master_setup` somente quando informado.
3. `intervalo_assign_master` vincula Auth existente, sem novo convite por e-mail.
4. Para novos usuários, Super Admin pode pedir manualmente `generateLink('invite')` após confirmar sua senha; o link é mostrado uma única vez, e não é enviado por e-mail.
5. Banco protegido por RLS e grants; transações de teste com rollback; cadastro não cria registros de teste permanentes.
6. Super Admin mostra formulário mesmo sem resposta da listagem de usuários e autocompleta o identificador.
7. Fallback do GitHub Pages restaura URL interna antes do roteamento, inclusive rotas de ativação.

## Matriz de verificação
| Teste | Resultado | Base |
|---|---|---|
| Causa da falha no Auth SMTP | CONFIRMADA | Logs HTTP 429 /auth/v1/invite |
| Requisições de criação com 409 | CONFIRMADAS | Logs HTTP 409 /functions/v1/admin-provision |
| Criação sem Master/sem e-mail, como `service_role` | PASSOU | SQL BEGIN/ROLLBACK |
| Criação com e-mail não registrado, setup pendente | PASSOU | SQL BEGIN/ROLLBACK |
| Vinculação a usuário Auth já registrado | PASSOU | SQL BEGIN/ROLLBACK |
| Identificador duplicado | PASSOU | SQL BEGIN/ROLLBACK |
| Criação sem permissão de Super Admin | BLOQUEADA | SQL BEGIN/ROLLBACK |
| RLS para setup privado do Master | PASSOU | service_role tem SELECT, authenticated não tem SELECT |
| Função de criação executável diretamente por authenticated | BLOQUEADA | EXECUTE=false |
| Formulário JS com lista carregando normalmente | PASSOU (simulado) | Mock de API e DOM |
| Formulário JS com lista de restaurantes indisponível | PASSOU (simulado) | Mock de API e DOM |
| Slug automático a partir do nome | PASSOU (simulado) | Cantina do Bairro → cantina-do-bairro |
| Criação nova com usuário real via navegador | NÃO COMPROVADA | Precisa testar no domínio |
| Geração real de link de convite, com destinatário novo | NÃO COMPROVADA | Função preparada; Auth Admin Link não exercitado com usuário real |
| Autenticação e recuperação por e-mail | PENDENTE | SMTP customizado e redirects Auth |
| Propagação no domínio gaveblue.com.br | NÃO COMPROVADA | Verificador de rede não resolve host |

## Reteste prático no painel
1. Abrir https://gaveblue.com.br/intervalo/admin autenticado como Super Admin.
2. No formulário Novo restaurante, informar apenas o nome, por exemplo `Restaurante de Teste`, deixar Master vazio e verificar o slug automático. Clicar Criar restaurante.
3. Confirmar que o restaurante aparece na lista com status ativo, cinco módulos e Gestão habilitada. Não há envio de convite nesta etapa.
4. Para usar o mesmo Super Admin como Master de teste, escolher Vincular minha conta como Master no card do restaurante e confirmar senha de admin.
5. Para Master diferente, no card definir e-mail do Master, clicar Preparar link de acesso, confirmar senha de Super Admin e copiar o link apenas para o destinatário; não compartilhar publicamente.
6. Verificar que falta/limitação de e-mails não impede cadastrar novo restaurante.
7. Abrir diretamente /intervalo/admin e atualizar navegador para validar fallback e cache.

## Pendências antes de homologar
- Configurar SMTP próprio, URL allowlist do Auth e capacidade de entrega. Veja https://supabase.com/dashboard/project/fynaaiazebydorzllwip/auth/url-configuration e Auth SMTP Settings.
- Testar operações com usuário real e sem acesso a segredos de Auth no navegador.
- Ativar proteção contra senhas vazadas e estudar MFA para administradores.
- Restaurar versões anteriores somente dos arquivos Intervalo em rollback; não deletar tabelas nem contas Auth.

**Status: correção técnica confirmada por testes isolados; QA E2E de produção ainda pendente.**
