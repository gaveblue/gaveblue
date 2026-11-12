# Intervalo — Arquitetura de Insumos e Produtos · 1.0.0 RC.2

Data: 12/11/2026 · Decisão de produto para o Intervalo 1.0.0.

## Conceito

**Insumos não são produtos.** Insumos representam quantidades, estoque mínimo, movimentos e consumo. Produtos são itens de venda com **cadastro único**, preço, descrição, categoria, foto e flags independentes.

| Entidade | O que controla | Tabelas |
|---|---|---|
| Insumo | Unidade, quantidade, mínimo, entradas e perdas | `stock_items`, `stock_movements` |
| Produto | Nome, categoria, foto, preço e regras de exibição/venda | `menu_products` |
| Ficha técnica | Insumos e consumo por unidade de produto | `recipe_components` |
| Cardápio público | Publicação geral, categorias ativas e produtos escolhidos para a vitrine | `restaurant_publication`, `menu_categories`, `menu_products` |

## Flags e comportamento

- `menu_products.show_on_menu`: **Exibir no cardápio**. `true` mostra na vitrine pública *se* o restaurante tiver cardápio publicado, módulo habilitado, categoria ativa e produto disponível. `false` oculta **apenas** da vitrine pública.
- `menu_products.available`: **Disponível para venda**. `true` permite seleção pelo Garçom e venda interna (se categoria ativa); `false` retira o produto da seleção e da vitrine pública. Não apaga o cadastro.
- Produtos com `show_on_menu=false` e `available=true` podem continuar sendo vendidos internamente pelo Garçom. Ex.: item exclusivo da casa ou item administrativo.
- Nenhuma dessas flags está vinculada automaticamente ao saldo do estoque. O envio do pedido à cozinha continua sujeito à validação transacional dos insumos configurados na ficha técnica.
- Produto sem ficha técnica não debita insumos automaticamente. Não habilitar ocultação automática por falta de estoque sem uma regra adicional expressamente aprovada.
- Preço do produto é definido no seu cadastro central em centavos; mudanças de preço afetam novos itens, não valores históricos já registrados nas comandas.

## Navegação

`Gestão → Estoque e Produtos` possui quatro abas:

1. **Insumos:** criar insumo, visualizar saldo/mínimo e registrar entrada, perda ou ajuste.
2. **Produtos:** cadastrar/editar nome, preço, descrição, foto e categoria; ajustar chaves `Exibir no cardápio` e `Disponível para venda`, e criar categoria diretamente.
3. **Fichas técnicas:** configurar consumo de insumos por unidade de produto.
4. **Movimentações:** histórico recente de alterações de estoque.

A área `Cardápio digital` é destinada a **publicar/despublicar**, gerenciar/ocultar categorias, mostrar a prévia, copiar link e gerar QR de consulta, e ainda contém adicionais informativos. Não mantém um segundo formulário de cadastro de produtos.

## Atualização técnica

- Banco: migração aditiva `intervalo_products_menu_visibility_1_0_0_rc2` com `show_on_menu boolean not null default true`. Preserva os produtos existentes como marcados para exibição.
- `restaurant-core` v9: consulta `show_on_menu`, cria/atualiza com flag opcional, ação `product_flags` atualiza apenas os campos escolhidos, sem sobrescrever preço, com registro de auditoria.
- `public-menu` v3: filtra `available=true` e `show_on_menu=true`; mantém categoria ativa, publicação e módulo do restaurante.
- `intervalo_submit_order` mantém baixa transacional por ficha técnica, sem alteração.
- Todos os dados continuam separados por `restaurant_id`; mutações exigem `manage()` no servidor.
- Não há envio de e-mails, impressão automática ou fiscal nesta fase.

## Aceite de produção

1. Verificar as quatro abas com Master/Gerente autenticado e todos os formulários de cadastro/edição.
2. Criar produto e categoria, definir preço e exibição; confirmar consulta pública só após publicação.
3. Desligar a chave de exibição e confirmar que desaparece da vitrine pública, mas permanece no Garçom quando disponível.
4. Desligar a disponibilidade de venda e confirmar que deixa de poder ser adicionado a novas comandas.
5. Editar preço e confirmar que novos pedidos usam o preço novo, sem alterar histórico.
6. Conferir ficha técnica e bloqueio por estoque insuficiente no envio.
7. Confirmar isolamento de dois restaurantes e auditoria de alterações.

**Estado:** candidato ao teste, sem homologação de navegador real ou publicação de domínio comprovada.
