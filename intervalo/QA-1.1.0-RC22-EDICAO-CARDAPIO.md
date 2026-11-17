# Intervalo 1.1.0-rc.22 — Edição de insumos, categorias, vitrine e modo grade/lista

Data: 17/11/2026 (UTC). Atualização direta no GitHub `main` sem GitHub Actions.

## Entregue no código

- Gestão > Estoque e Produtos > Insumos: botão **Editar insumo** com nome, unidade e estoque mínimo; botão **Excluir / arquivar** com confirmação; **Restaurar insumo** para itens arquivados. O saldo só é alterado via movimentações para preservar o histórico. Impede arquivamento ou mudança de unidade se o insumo ainda faz parte de ficha técnica.
- Gestão > Cardápio Digital > Categorias: **Editar categoria** (nome e ordem), **Ocultar/Exibir**, **Excluir** apenas quando não possui produtos associados. Orientação para migrar produtos previamente.
- Gestão > Vendas Online > Vitrine: botões explícitos **Editar logo**, **Editar capa** e **Configurar vitrine**; o editor usa a biblioteca ou envio otimizado já existente.
- Cardápio público de consulta (/intervalo/{slug}/cardapio): alternância **Grade / Lista** persistida por restaurante no navegador.
- Loja pública de pedidos (/intervalo/loja/{slug}): alternância **Grade / Lista** persistida por restaurante no navegador.
- API `restaurant-core` versão 14 (verify_jwt=true), com ações protegidas por autorização de Gestão: `category_delete`, `stock_update`, `stock_delete` e `stock_restore`.

## Verificações executadas

- Parser JavaScript passou em support.js, catalog.js, public-menu.js, online-management-rc1.js, marketplace-preview-rc1.js, management.js, storefront-media-rc21.js, operational-sheets-rc15.js e no script de módulo do index.html.
- Função `restaurant-core` versão 14 confirmada como ACTIVE no Supabase INTERVALO, JWT requerido e ações presentes.
- Referências de cache do index.html, management.js e marketplace-preview-rc1.js atualizadas para rc.22.

## Homologação manual pendente

1. Entrar como Master/Gerente, abrir Gestão > Vendas Online > Vitrine e testar trocar logo e capa por upload e biblioteca. Salvar, atualizar e conferir em /loja/{slug}.
2. Abrir Estoque e Produtos > Insumos, editar nome/unidade/mínimo e testar arquivamento/restauração de item sem ficha técnica. Conferir mensagem de bloqueio em item vinculado e histórico de movimentações preservado.
3. Abrir Cardápio > Categorias, editar nome e ordem, alternar visibilidade e excluir categoria sem produtos. Tentar excluir vinculada e confirmar bloqueio.
4. Abrir cardápio público e loja pública no Android, alternar grade/lista, atualizar e verificar persistência.
5. Verificar a publicação dos arquivos no domínio (web externo não respondeu na verificação automática) e a atualização de cache no PWA.
6. Testar isolamento de dados de dois restaurantes; nenhuma conta de cliente ou pedido deve ser afetado pela manutenção.

**Estado:** código no GitHub main e função backend ativa; publicação efetiva no domínio e homologação Android ainda não verificadas. Não tratar como versão estável nem pronta para comercialização.
