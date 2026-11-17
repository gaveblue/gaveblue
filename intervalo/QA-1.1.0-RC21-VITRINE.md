# Intervalo 1.1.0-rc.21 — identidade visual da vitrine

Data: 16/11/2026 · Escopo: logo e capa do restaurante (Gestão > Vendas online > Vitrine).

## Entregue no código

- Campos de identidade visual já existentes em `restaurant_storefront`: `logo_url` e `banner_url`; nenhuma migração ou tabela nova.
- Formulário da vitrine em Bottom Sheet: foto de perfil (logo) e capa; selecionar arquivo, reutilizar pela Biblioteca de fotos do próprio restaurante, visualizar e remover.
- Upload otimizado em JPG, até 1.400 px e 1,5 MB por arquivo, reutilizando bucket `intervalo-product-images` e autorização de envio assinada em `restaurant-product-photos`.
- Validação de URLs HTTPS no `marketplace-management`; exclusão voluntária gravada como `NULL`. Omitir campos em clientes antigos preserva as imagens anteriores.
- Visualização da logo e banner no cartão Minha vitrine e na página pública `/intervalo/loja/:slug`; visual alternativo se o restaurante não possuir imagens.
- Reutilização por URL para evitar duplicação de arquivos e consumo desnecessário de armazenamento.
- Alteradas versões de cache de JS/CSS para rc.21.

## Verificações realizadas

- JavaScript: análise sintática de `storefront-media-rc21.js`, `online-management-rc1.js` e `marketplace-preview-rc1.js` — PASSOU.
- PostgreSQL: `restaurant_storefront` contém `logo_url` e `banner_url` — CONFIRMADO.
- Supabase: `marketplace-management` v5 implantada, `verify_jwt=true` — CONFIRMADO.
- Histórico: commits no GitHub `main` com o frontend e backend — CONFIRMADO.
- Compatibilidade: não foram alterados pedidos, estoque, preço ou pagamento.

## Pendente para homologação final

- Confirmar propagação do `main` no domínio `gaveblue.com.br`.
- Testar no Android/PWA: enviar logo/capa, selecionar da Biblioteca, remover e salvar, abrir loja pública, atualizar a imagem, conferir fallback offline.
- Testar permissão por gerente/master e bloqueio de usuários de outro restaurante.
- Não afirmar que o comportamento no dispositivo foi homologado sem evidência de teste real.

## Backlog adiado

- Simulações de desastre, backups e contingência de pedidos ficam para a preparação comercial do Intervalo; fora do escopo desta RC.
