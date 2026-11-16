# Intervalo Marketplace — QA da implementação 1.1.0-rc.4

**Data:** 15/11/2026  
**Repositório:** `gaveblue/gaveblue`, branch `main`  
**Projeto Supabase:** `fynaaiazebydorzllwip`  
**Resultado:** código do MVP guest + delivery/retirada estruturado, implantação backend confirmada; **homologação real ainda PENDENTE**. Vendas online **desligadas por padrão**.

## Implementação nesta etapa

### Banco
Migrações aplicadas e preservadas no repositório:

- `20261115_marketplace_checkout_rc2.sql`: campos de termos/marketing, limite de requisições com hash, trilha de estoque, cotação de pedido no servidor, janela de funcionamento e criação transacional idempotente de pedido/itens/eventos/link privado
- `20261115_marketplace_operations_rc3.sql`: transições de pedidos com estoque em aceite, compensação ao cancelar antes de iniciar preparo, recebimento em sessão de Caixa, auditoria
- `20261115_marketplace_settings_rc4.sql`: faixas de horário por dia, controle de regiões de entrega e ativação auditada da loja
- `20261115_marketplace_quote_pickup_hotfix.sql`: corrigido acesso a variável não inicializada no cálculo de pedido para retirada sem zona de entrega
- `20261115_marketplace_payment_acceptance_hotfix.sql`: bloqueia confirmação financeira enquanto o restaurante não aceitar o pedido

O status `delivered/picked_up` é separado do status de pagamento `paid/unpaid`. As comandas antigas (`orders` / `order_rounds`) **não foram alteradas**.

### Edge Functions

| Função | Versão verificada | JWT | Escopo |
|---|---:|---|---|
| `marketplace-public` | 2, ACTIVE | Não obrigatório | Leitura pública de lojas, horários, taxas, cardápio e disponibilidade |
| `marketplace-online` | 1, ACTIVE | Não obrigatório (guest) | Cotação, pedido idempotente, tracking privado e proteção básica contra abuso |
| `marketplace-operations` | 1, ACTIVE | Obrigatório | Operações por restaurante, status, fila de Cozinha, recebimentos no Caixa |
| `marketplace-management` | 3, ACTIVE | Obrigatório | Rascunho da loja, faixas de horário, regiões, taxas, ativação somente por Master |

Todas as RPCs `marketplace_*` consultadas tiveram `EXECUTE=false` para `anon` e `authenticated`, e `EXECUTE=true` para `service_role`. As funções públicas usam credenciais privilegiadas apenas no servidor e não são substituto de RLS.

### Telas criadas/alteradas
- **Loja pública:** `marketplace-preview-rc1.js` integrado ao `marketplace-cart-rc4.js`, com detalhe em Bottom Sheet, adicionais, quantidade, observações, carrinho por restaurante, CTA de checkout
- **Checkout visitante:** `marketplace-checkout-rc4.js`, com entrega/retirada, bairro/CEP/endereço quando delivery, nome/celular, escolha de Pix/cartão/dinheiro para entrega/retirada, aceite de termos, cotação e confirmação do pedido no servidor
- **Acompanhamento:** `marketplace-tracking-rc4.js`, token privado `UUID.assinatura`, atualização de status e pagamento sem divulgar telefone ou endereço
- **Gestão/Loja Online:** `online-management-rc1.js`, controle de horários, zonas, taxas, configurações, ativação confirmada de vendas e lista de pedidos recebidos, mudanças de status e recebimento
- **Cozinha:** `kitchen.js`, cartões DELIVERY/RETIRADA ao lado dos tickets presenciais, sem criar mesa fictícia
- **Caixa:** `cash.js`, vendas online e pagamentos separados das comandas, com pagamento vinculado à sessão
- **Roteamento:** `index.html` e `404.html` suportam a rota privada `/intervalo/pedido/<uuid>.<assinatura>`, incluindo ponto entre UUID e assinatura
- **Termos e privacidade:** páginas `/intervalo/termos/` e `/intervalo/privacidade/`; **textos iniciais sujeitos à revisão jurídica**, não versões comerciais juridicamente homologadas

### Testes realizados

| Validação | Resultado |
|---|---|
| Migrações e hotfixes aplicados ao banco | PASSOU |
| Edge Functions recuperadas como ACTIVE | PASSOU |
| RPCs sem execução direta por visitantes/usuários comuns | PASSOU |
| Status de vendas dos restaurantes | PASSOU: zero ativas |
| Pedidos/itens/pagamentos/movimentações online após alterações | PASSOU: zero registros |
| Compilação JavaScript das interfaces e `index.html` | PASSOU |
| Roteamento do token privado com ponto, query, hash e storage indisponível | PASSOU em simulação |
| Carrinho: soma de itens, observações independentes, limite por loja, remoção e limpeza | PASSOU em simulação |
| Integração de chamadas da loja, checkout, Gestão, Cozinha e Caixa | PASSOU por inspeção e compilação |
| Confirmação de pagamento antes do aceite | Corrigido com migration, sem teste transacional real |
| Cálculo de retirada sem zona | **Falha encontrada e corrigida**; teste completo subsequente indisponível |
| Pedido de teste completo com gravação e rollback | **NÃO CONCLUÍDO**: a primeira tentativa falhou com bug de variável não atribuída; depois da correção, o ambiente bloqueou o teste transacional de gravação |
| Browser real, Android, PWA, Instagram, WhatsApp | **PENDENTE** |
| Deploy propagado do frontend no domínio | **NÃO VERIFICADO** |
| Login opcional do consumidor, endereços salvos e histórico | **NÃO IMPLEMENTADOS** nesta versão; checkout guest sem conta |
| Segurança antifraude (verificação real de telefone / avaliação de abuso) | **PARCIAL**; existe limitação por hash de IP/telefone, mas não substitui verificação anti-abuso de produção |
| Política operacional de cancelamento, retenção e termos revisados juridicamente | **PENDENTE** |

**Não declarar homologado** o checkout nem habilitar todas as lojas de uma vez. O primeiro pedido deve ser controlado, em restaurante de teste, com acompanhamento real na fila, conferência do pagamento e registro de estoque; só depois da operação observada podem ser habilitadas lojas reais.

### Estado real do projeto na inspeção final

- 0 lojas com `restaurant_online_settings.enabled=true`
- 0 lojas com `restaurant_publication.accepts_customer_orders=true`
- 0 faixas de horário, 0 regiões de entrega ativas
- 0 pedidos, 0 itens, 0 pagamentos e 0 movimentos de estoque online
- `novo-mundo` tem 3 itens públicos disponíveis e cardápio publicado; vendas continuam desligadas
- `intervalo27` ainda não tem cardápio publicado nem produtos

### Aceitação prática antes da liberação

1. Verificar publicação da branch `main` no `gaveblue.com.br` e PWA instalado. GitHub Actions **não** foi usado.
2. Abrir a Gestão do restaurante; cadastrar horários e bairros/CEP; confirmar preview do frete e disponibilidade.
3. Preparar um restaurante de testes separado, com catálogo e ficha técnica, e conferir que ninguém mais pode ler seus pedidos.
4. Validar cotação sem login, rejeição de valores manipulados, produto de outra loja, item fora de estoque, horário fechado e limite de pedido.
5. Testar criação real de pedido e repetição com mesma chave idempotente. Confirmar que há **um único** pedido.
6. Ver pedido na Gestão e na Cozinha com etiqueta DELIVERY/RETIRADA; confirmar baixa de estoque exatamente uma vez.
7. Exercitar recusa, cancelamento antes de preparo, status de entrega/retirada e compensação de estoque.
8. Abrir sessão de Caixa, registrar pagamento manual confirmado e conferir conciliação por sessão. Não registrar pagamento fictício em operação real.
9. Conferir acompanhamento via link privado, expiração, tentativa de adivinhar outro token e não exposição de PII.
10. Revisar termos, LGPD, antifraude, atendimento e só então ativar o primeiro restaurante comercialmente.

## Rollback
A equipe pode desligar imediatamente o recebimento via Master, sem interromper consulta de cardápio. Para rollback visual, restaurar módulos frontend para a rc.1. Tabelas de compras devem **ser preservadas** se existirem pedidos reais; nunca excluir tabelas ou funções sem análise. Sem dependência de GitHub Actions.

**Limite da afirmação:** engenharia aplicada e verificada parcialmente; não há prova de pedido pago real de ponta a ponta, portanto não há homologação comercial.
