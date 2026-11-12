-- Intervalo 0.9.4 — insumos com saldo inicial e extrato em transação única.
begin;
create or replace function public.intervalo_create_stock(
 p_restaurant uuid,p_name text,p_unit text,p_quantity numeric,p_min numeric,p_actor uuid
) returns uuid
language plpgsql security definer
set search_path to ''
as $fn$
declare v_id uuid;
begin
 if p_name is null or length(btrim(p_name)) not between 2 and 120
    or p_unit not in ('un','kg','g','l','ml')
    or p_quantity is null or p_min is null or p_quantity<0 or p_min<0
    or p_quantity>10000000 or p_min>10000000
    or p_quantity<>pg_catalog.round(p_quantity,3)
    or p_min<>pg_catalog.round(p_min,3) then
   raise exception 'Dados do insumo ou quantidades inválidos';
 end if;
 insert into public.stock_items(restaurant_id,name,unit,quantity,min_quantity)
 values(p_restaurant,btrim(p_name),p_unit,p_quantity,p_min)
 returning id into v_id;
 if p_quantity>0 then
  insert into public.stock_movements(restaurant_id,stock_item_id,quantity_delta,reason,actor_id)
  values(p_restaurant,v_id,p_quantity,'receive',p_actor);
 end if;
 return v_id;
end;
$fn$;
revoke all on function public.intervalo_create_stock(uuid,text,text,numeric,numeric,uuid) from public,anon,authenticated;
grant execute on function public.intervalo_create_stock(uuid,text,text,numeric,numeric,uuid) to service_role;
commit;