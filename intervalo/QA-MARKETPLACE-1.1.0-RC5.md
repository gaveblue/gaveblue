# Intervalo Marketplace — QA técnico da versão 1.1.0-rc.5

**Data:** 16/11/2026  
**Repositório:** `gaveblue/gaveblue`, branch `main`  
**Supabase:** `fynaaiazebydorzllwip`  
**Status:** implementação de área opcional do consumidor com segurança de acesso verificada; **homologação em navegador e implantação HTTP ainda pendentes**.

## Mudanças verificadas

- `marketplace-customer-rc5.js`: registro/login por e-mail e senha com sessão independente do login de funcionários, perfil, endereços salvos, edição/exclusão e saída.
- `intervalo/index.html`: `/intervalo/cliente` abre o módulo de cliente, sem passar pelo login de Gestão; callback de autenticação do consumidor isolado do cliente Auth da equipe.
- `marketplace-checkout-rc4.js`: quem estiver autenticado pode preencher nome/celular e endereço salvo; modalidade guest segue disponível. A região de entrega e o frete continuam sempre exigindo validação por loja no servidor. O botão de retorno não injeta `slug` inválido.
- `20261116_marketplace_customer_accounts_rc5.sql`: migração aplicada em `marketplace_customer_accounts_rc5`, RLS ativo e sete políticas em `customer_profiles` e `customer_addresses`, restritas a `auth.uid()`. `anon` não lê essas tabelas. O cliente não pode mudar o ID do perfil nem o proprietário de endereço por `UPDATE`.
- Nenhum novo acesso liberado para `online_orders`, `online_order_items` e `online_order_tracking_tokens`. Os links privados de acompanhamento continuam sendo a autorização de pedidos guest.

## Evidências técnicas

| Validação | Resultado |
|---|---|
| Migração aplicada no Supabase | PASSOU: success=true |
| Políticas próprias de perfil | PASSOU: SELECT, INSERT, UPDATE com `auth.uid()` |
| Políticas próprias de endereço | PASSOU: SELECT, INSERT, UPDATE e DELETE com `auth.uid()` |
| SELECT de visitante anônimo no perfil/endereço | PASSOU: sem GRANT |
| Proibição de alterar `customer_profiles.id` ou `customer_addresses.customer_id` | PASSOU: sem GRANT UPDATE nas colunas |
| Sintaxe JavaScript de `index.html`, `marketplace-customer-rc5.js` e `marketplace-checkout-rc4.js` | PASSOU em compilação sintática estática |
| Carrinho e checkout sem login permanecem disponíveis | PRESERVADOS no código; não há teste de compra real |
| Vendas online | DESLIGADAS: 0 lojas ativadas |
| Pedidos/perfis/endereços de consumidor no banco após implantação | 0 / 0 / 0 |
| Teste de cadastro e confirmação de e-mail em celular | PENDENTE |
| Teste autenticado dos formulários e endereços em navegador real | PENDENTE |
| Teste de isolamento com duas contas autenticadas reais | PENDENTE |
| URL ao vivo, HTTP 200, service worker e propagação | NÃO VERIFICADOS |
| Histórico de pedidos vinculado à conta | NÃO IMPLEMENTADO: compras guest continuam por link privado |
| Associação de compras autenticadas a `customer_id` | NÃO IMPLEMENTADA nesta versão |
| Teste completo de pedido, pagamento e movimentação de estoque | PENDENTE desde rc.4 |

## Validação necessária

1. Conferir que a página `/intervalo/cliente` abre em navegador e PWA.
2. Criar conta de consumidor com e-mail válido; confirmar e-mail conforme configuração do Auth; testar login, sessão, saída e reinício.
3. Salvar perfil e dois endereços, editar e excluir; verificar permissões com duas contas diferentes.
4. Entrar na loja publicada, conferir preenchimento do checkout pelo endereço salvo e nova seleção da região/frete.
5. Conferir checkout guest sem login nem CPF obrigatório.
6. Testar links diretos de checkout/acompanhamento no navegador real e em WhatsApp/Instagram.
7. Em restaurante **de testes** autorizado, validar pedido fim a fim sem alterar restaurante comercial real.
8. Verificar status de implantação HTTP do domínio e rollback, sem GitHub Actions.

**Não declarar homologação comercial, nem afirmar que o domínio publicou automaticamente.** Segurança de banco e parsing são evidências limitadas. Sem captura e associação de compras à conta, o histórico de pedidos autenticado não está disponível.
