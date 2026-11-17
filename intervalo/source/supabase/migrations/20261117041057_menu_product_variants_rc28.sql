-- Supabase migration applied: 20261117041057 menu_product_variants_rc28.
alter table public.menu_products add column if not exists variant_group_name text, add column if not exists variant_label text;
alter table public.menu_products add constraint menu_products_variant_pair_check check ((variant_group_name is null and variant_label is null) or (variant_group_name is not null and variant_label is not null and char_length(btrim(variant_group_name)) between 2 and 100 and char_length(btrim(variant_label)) between 1 and 45));
create unique index menu_products_variant_unique_idx on public.menu_products(restaurant_id,category_id,lower(btrim(variant_group_name)),lower(btrim(variant_label))) where variant_group_name is not null;
