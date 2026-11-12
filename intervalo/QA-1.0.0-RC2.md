# Intervalo — QA 1.0.0 RC.2 · Produtos e Insumos

Data: 12/11/2026 · Supabase `fynaaiazebydorzllwip`, repositório `gaveblue/gaveblue`.

**Estado:** migração e backend ativos; frontend na `main`; testes SQL e renderização simulada passaram. **Homologação visual/funcional em navegador real pendente. Não declarar 1.0.0 final aprovada.**

## Evidências

| Verificação | Resultado |
|---|---|
| Migração aditiva `show_on_menu boolean not null default true` | PASSOU — aplicada no Supabase |
| Default de produtos antigos preserva visibilidade | PASSOU — default e teste em transação |
| Desligar `show_on_menu` preserva preço e `available` | PASSOU — teste SQL em transação |
| Produto oculto não satisfaz filtro da vitrine | PASSOU — teste SQL em transação |
| Atualizar preço não altera a flag | PASSOU — teste SQL em transação |
| Nenhum registro de QA persistido | PASSOU — transação com `ROLLBACK`; resíduo zero |
| `restaurant-core` v9 ativa, JWT obrigatório | PASSOU — deploy confirmado |
| Ação `product_flags` | IMPLEMENTADA — autenticação, role e mudança parcial auditada; teste E2E pendente |
| `public-menu` v3 ativa | PASSOU — deploy confirmado; testa filtro `show_on_menu` |
| Aba Insumos | PASSOU em renderização JS simulada |
| Aba Produtos | PASSOU em renderização JS simulada — formulário, chaves independentes, edição/precificação, categoria |
| Aba Fichas Técnicas | PASSOU em renderização JS simulada |
| Aba Movimentações | PASSOU em renderização JS simulada |
| Cardápio Digital | PASSOU em renderização JS simulada — publicação, prévia e atalho para Produtos, sem cadastro duplicado |
| JS de `support.js`, `catalog.js`, `index.html` | PASSOU sintaxe estática |
| Testes com sessão autenticada e navegador no domínio | NÃO EXECUTADOS |
| Propagação do domínio | NÃO COMPROVADA |

## Segurança e regras preservadas

- Não há SQL `UPDATE` de dados reais na migração, apenas coluna com default.
- Somente Master/Gerente com permissão de Gestão pode modificar produto, preço e chaves. O Garçom não recebe permissão de edição.
- A chave `show_on_menu` **não é** botão de venda. Vitrine pública e venda interna são independentes.
- Publicação geral do Cardápio permanece necessária.
- Baixa atômica do estoque ao enviar comanda e controle da ficha técnica não foram modificados.

## Próximos testes obrigatórios

- Abrir `/intervalo/{slug}/estoque?aba=produtos` após login Master/Gerente; criar categoria e produto, editar preço e foto.
- Alternar as duas chaves e verificar publicação/ocultação ao recarregar o cardápio público e o PWA Garçom.
- Validar categoria inativa, produto pausado e cardápio despublicado.
- Confirmar que produtos e preços antigos permaneceram inalterados.
- Conferir se funções só retornam produtos do restaurante autenticado e se tentativa de mudança por Garçom é rejeitada.
- Fazer regressão de pedido, cozinha, estoque, caixa e relatórios.

**Links internos:** `PRODUTOS-INSUMOS-1.0.0-RC2.md` e `QA-1.0.0-RC1.md`.
