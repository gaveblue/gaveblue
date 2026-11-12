-- Intervalo 0.9.4 — estoque transacional por ficha técnica.
-- Envio de pedido e baixa de insumos são uma única transação.
-- Sem ficha técnica, o produto é enviado sem movimento; UI deve alertar explicitamente.
begin;

create or replace function public.intervalo_submit_order(
 p_restaurant uuid,p_order uuid,p_actor uuid
) returns boolean
language plpgsql security definer
set search_path to ''
as $fn$
declare
 v_status text;
 v_recipe record;
 v_stock_name text;
 v_stock_quantity numeric;
 v_count integer := 0;
begin
 select o.status into v_status
 from public.orders o
 where o.restaurant_id=p_restaurant and o.id=p_order
 for update;
 if v_status is distinct from 'open' then
  raise exception 'Comanda não está aberta para envio';
 end if;
 if not exists(
  select 1 from public.order_items oi
  where oi.restaurant_id=p_restaurant and oi.order_id=p_order and oi.status='draft'
 ) then raise exception 'Adicione pelo menos um item'; end if;

 -- Agrega por insumo e segue ordem determinística para evitar deadlocks.
 for v_recipe in
  select rc.stock_item_id, sum(rc.quantity*oi.quantity)::numeric(14,3) as required_quantity
  from public.order_items oi
  join public.recipe_components rc
    on rc.restaurant_id=oi.restaurant_id and rc.product_id=oi.product_id
  where oi.restaurant_id=p_restaurant
    and oi.order_id=p_order and oi.status='draft'
  group by rc.stock_item_id
  order by rc.stock_item_id
 loop
  update public.stock_items si
  set quantity=si.quantity-v_recipe.required_quantity
  where si.restaurant_id=p_restaurant
    and si.id=v_recipe.stock_item_id
    and si.active=true and si.quantity>=v_recipe.required_quantity;
  if not found then
   select si.name,si.quantity into v_stock_name,v_stock_quantity
   from public.stock_items si
   where si.restaurant_id=p_restaurant and si.id=v_recipe.stock_item_id;
   raise exception 'Estoque insuficiente ou insumo inativo: % (saldo %)',
     coalesce(v_stock_name,'não encontrado'),coalesce(v_stock_quantity,0);
  end if;
  insert into public.stock_movements(
    restaurant_id,stock_item_id,quantity_delta,reason,actor_id,ref_order_id
  ) values(
    p_restaurant,v_recipe.stock_item_id,-v_recipe.required_quantity,
    'sale',p_actor,p_order
  );
  v_count:=v_count+1;
 end loop;

 update public.orders
 set status='submitted',submitted_at=now()
 where restaurant_id=p_restaurant and id=p_order;
 update public.order_items set status='queued'
 where restaurant_id=p_restaurant and order_id=p_order and status='draft';
 insert into public.order_events(restaurant_id,order_id,actor_id,event,details)
 values(p_restaurant,p_order,p_actor,'order_submitted',
        pg_catalog.jsonb_build_object('stock_movements',v_count));
 return true;
end;
$fn$;

create or replace function public.intervalo_stock_adjust(
 p_restaurant uuid,p_item uuid,p_actor uuid,p_delta numeric,p_reason text
) returns numeric
language plpgsql security definer
set search_path to ''
as $fn$
declare v_remaining numeric;
begin
 if p_delta is null or p_delta=0 or pg_catalog.abs(p_delta)>10000000
   or p_delta<>pg_catalog.round(p_delta,3) then
  raise exception 'Quantidade inválida: use até três casas decimais';
 end if;
 if p_reason not in ('receive','waste','adjustment') then
  raise exception 'Motivo de ajuste inválido';
 end if;
 if (p_reason='receive' and p_delta<0)
    or (p_reason='waste' and p_delta>0) then
  raise exception 'Sinal incompatível com o tipo de movimentação';
 end if;
 update public.stock_items si set quantity=si.quantity+p_delta
 where si.restaurant_id=p_restaurant and si.id=p_item and si.active=true
   and si.quantity+p_delta>=0
 returning si.quantity into v_remaining;
 if not found then
  raise exception 'Insumo inexistente, inativo ou saldo insuficiente para a movimentação';
 end if;
 insert into public.stock_movements(restaurant_id,stock_item_id,quantity_delta,reason,actor_id)
 values(p_restaurant,p_item,p_delta,p_reason,p_actor);
 return v_remaining;
end;
$fn$;

revoke all on function public.intervalo_submit_order(uuid,uuid,uuid) from public,anon,authenticated;
grant execute on function public.intervalo_submit_order(uuid,uuid,uuid) to service_role;
revoke all on function public.intervalo_stock_adjust(uuid,uuid,uuid,numeric,text) from public,anon,authenticated;
grant execute on function public.intervalo_stock_adjust(uuid,uuid,uuid,numeric,text) to service_role;
commit;