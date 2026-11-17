CREATE OR REPLACE FUNCTION public.marketplace_search_products(p_query text)
 RETURNS TABLE(slug text, matches text[], matched_count bigint)
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$
 with tokens as (
  select distinct token from pg_catalog.regexp_split_to_table(
   pg_catalog.translate(pg_catalog.lower(pg_catalog.left(coalesce(p_query,''),80)),
   'áàâãäéèêëíìîïóòôõöúùûüçñ','aaaaaeeeeiiiiooooouuuucn'), '[^a-z0-9]+') token
  where pg_catalog.length(token)>=2
  limit 8
 ), eligible as (
  select r.id,r.slug::text as slug
  from public.restaurants r
  join public.restaurant_storefront s on s.restaurant_id=r.id and s.marketplace_visible
  join public.restaurant_publication pub on pub.restaurant_id=r.id and pub.is_published
  join public.restaurant_modules m on m.restaurant_id=r.id and m.module='cardapio' and m.enabled
  where r.status='active'
 ), matched as (
  select distinct e.slug,coalesce(nullif(p.variant_group_name,''),p.name)::text as product_name
  from eligible e
  join public.menu_products p on p.restaurant_id=e.id and p.available and p.show_on_menu
  join public.menu_categories c on c.id=p.category_id and c.restaurant_id=e.id and c.active
  where pg_catalog.length(pg_catalog.btrim(coalesce(p_query,''))) between 3 and 80
   and exists(select 1 from tokens)
   and not exists(select 1 from tokens t where pg_catalog.strpos(
    pg_catalog.translate(pg_catalog.lower(pg_catalog.concat_ws(' ',p.name,p.variant_group_name,p.variant_label,p.description,c.name)),
    'áàâãäéèêëíìîïóòôõöúùûüçñ','aaaaaeeeeiiiiooooouuuucn'),t.token)=0)
 )
 select m.slug,(pg_catalog.array_agg(m.product_name order by m.product_name))[1:3],pg_catalog.count(*)
 from matched m group by m.slug order by m.slug limit 100;
$function$;
revoke all on function public.marketplace_search_products(text) from public,anon,authenticated;
grant execute on function public.marketplace_search_products(text) to service_role;
