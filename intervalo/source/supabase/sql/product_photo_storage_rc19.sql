-- Intervalo 1.1.0-rc.19 — fotos dos produtos em Storage, leitura pública e escrita exclusiva via URL assinada.
-- Não são concedidas policies de INSERT/UPDATE/DELETE para anon/authenticated em storage.objects.
-- Upload é autorizado por Edge Function autenticada, com token temporário para um objeto único.
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('intervalo-product-images','intervalo-product-images',true,1500000,array['image/jpeg']::text[])
on conflict (id) do nothing;
