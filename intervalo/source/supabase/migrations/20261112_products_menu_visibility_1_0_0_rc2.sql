-- Intervalo 1.0.0 RC.2 — separar cadastro comercial da vitrine pública.
-- Preserva todos os produtos atuais como exibidos, sem alterar preço, estoque, pedidos ou fichas.
BEGIN;
ALTER TABLE public.menu_products
  ADD COLUMN IF NOT EXISTS show_on_menu boolean NOT NULL DEFAULT true;
COMMENT ON COLUMN public.menu_products.show_on_menu IS
  'Vitrine pública: false oculta do cardápio digital; não altera available nem a venda interna pelo garçom.';
COMMIT;
