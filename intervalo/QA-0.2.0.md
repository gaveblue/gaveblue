# Intervalo 0.2.0 — QA técnico / evidências
Data: 12/11/2026
Projeto Supabase: fynaaiazebydorzllwip
Repositório: gaveblue/gaveblue (diretório intervalo/)

## Testes executados com evidências verificáveis

| Caso | Resultado | Verificação |
|---|---|---|
| Master/empresa existente | Confirmado | Intervalo 27 (`intervalo27`), Master pendente, sem alterá-lo |
| Super Admin | 1 ativo | Consulta de `platform_admins` |
| Novo esquema | PASS | `restaurant_settings` e `restaurant_member_module_access` criadas |
| RLS | PASS | Todas as 7 tabelas do domínio v0.2.0 com RLS true |
| ANON | PASS (acesso negado) | Acesso direto SQL retornou `permission denied` antes mesmo de ler dados |
| Outsider autenticado | PASS | Impersonação de UUID sem vínculo, sem linhas visíveis |
| Master pendente | PASS | Própria associação visível; configurações e módulos operacionais invisíveis |
| Super Admin | PASS | Consegue consultar restaurante e configurações por política |
| Escritas diretas por anon/authenticated | PASS | Nenhum INSERT, UPDATE ou DELETE concedido nas 7 tabelas |
| Backend autenticado | PASS (publicação) | Edge Functions `restaurant-team` v3 e `admin-provision` v2 ativas, JWT requerido |
| Navegação/gestão JS | PASS (sintaxe) | `new Function()` passou no script inline e em management.js (sem import/export) |
| Migrações | PASS | Migrações 0.2.0 registradas no banco |
| Arquivos site GitHub | PASS | Novos commits; sem mudança no GB+ |
| Site público | NÃO COMPROVADO | Falha de acesso ao domínio nos verificadores disponíveis |
| Teste de clique no navegador | PENDENTE | Sem browser real acessível nesse ambiente |
| Dois restaurantes / equipe convidada | PENDENTE | Sem criar dados fictícios persistentes nem disparar e-mail de teste |
| React+TS build | PENDENTE | Publicação é a prévia estática do PWA |

## Aviso de segurança
Supabase Security Advisor retornou `auth_leaked_password_protection`:
proteção contra senhas vazadas está desabilitada. Ver:
https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

## Checklist de homologação de integração
1. Master do Intervalo 27 entra com senha e ativa convite; confirmar mudança para `active`.
2. Abrir `/intervalo/intervalo27/gestao`; salvar dados; concluir onboarding.
3. Convidar funcionário novo e testar convite e senha, inclusive entrega de e-mail.
4. Convidar usuário já cadastrado; aceitar vínculo sem duplicar autenticação.
5. Revogar função de funcionário e tentar acessar novamente; backend deve negar.
6. Criar segundo restaurante piloto e testar que funcionários não visualizam o primeiro.
7. Reabrir rota profunda diretamente no navegador; checar 404 fallback.
8. Revisar versão do PWA no Android, domínio e limpeza de contexto.
9. Reverter somente arquivos e funções da 0.2.0 se ocorrer regressão; não fazer DROP em tabelas com dados.

**Resultado da homologação:** PARCIAL. Não liberar o produto a clientes pagantes até concluir testes funcionais e de segurança.
