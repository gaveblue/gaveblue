-- Intervalo 0.9.7: foto opcional dos produtos; exibição pública apenas após publicação e disponibilidade.
-- URLs HTTPS, sem conteúdo base64 ou imagem embutida no banco.
begin;
alter table public.menu_products
  add column if not exists image_url text;
alter table public.menu_products
  drop constraint if exists menu_products_image_url_safe_check;
alter table public.menu_products
  add constraint menu_products_image_url_safe_check check (
    image_url is null or (
      length(image_url) between 12 and 1200
      and image_url ~ '^https://[^[:space:]<>"'']+$'
    )
  );
commit;