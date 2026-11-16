-- Intervalo Marketplace 1.1.0-rc.3 · Operação transacional, estoque e caixa
-- Mantém intactos orders/order_items/order_rounds/payments e cadastro de funcionários.
alter table public.online_order_payments
 add column if not exists cash_session_id uuid,
 add constraint online_order_payments_session_fkey
 foreign key(restaurant_id,cash_session_id) references public.cash_sessions(restaurant_id,id) on delete restrict;

create index if not exists online_order_payments_cash_idx on public.online_order_payments(restaurant_id,cash_session_id);
create index if not exists online_orders_status_created_idx on public.online_orders(restaurant_id,status,created_at);
create index if not exists online_request_limits_cleanup_idx on public.online_request_limits(window_start);

create or replace function public.marketplace_transition_order(
 p_restaurant uuid,p_order uuid,p_target text,p_actor uuid
) returns jsonb language plpgsql security invoker set search_path='' as $$
declare v_order record;v_stock record;v_balance numeric;v_allowed boolean:=false;v_now timestamptz:=now();
begin
 select * into v_order from public.online_orders
  where restaurant_id=p_restaurant and id=p_order for update;
 if v_order.id is null then raise exception 'Pedido não encontrado';end if;
 if v_order.status=p_target then
  return jsonb_build_object('status',v_order.status,'order_id',v_order.id,'unchanged',true);
 end if;
 v_allowed:=(
  (v_order.status='pending_acceptance' and p_target in ('accepted','rejected','cancelled')) or
  (v_order.status='accepted' and p_target in ('preparing','cancelled')) or
  (v_order.status='preparing' and (
    (v_order.fulfillment_type='delivery' and p_target='ready') or
    (v_order.fulfillment_type='pickup' and p_target='ready_for_pickup'))) or
  (v_order.status='ready' and v_order.fulfillment_type='delivery' and p_target='out_for_delivery') or
  (v_order.status='out_for_delivery' and p_target='delivered') or
  (v_order.status='ready_for_pickup' and v_order.fulfillment_type='pickup' and p_target='picked_up')
 );
 if not v_allowed then raise exception 'Transição de pedido não permitida';end if;
 -- Abate estoque na aprovação do pedido, uma única vez, em mesma transação.
 if p_target='accepted' then
  for v_stock in
   select rc.stock_item_id,sum(rc.quantity*i.quantity) as needed
   from public.online_order_items i
    join public.recipe_components rc on rc.restaurant_id=i.restaurant_id and rc.product_id=i.product_id
   where i.restaurant_id=p_restaurant and i.order_id=p_order
   group by rc.stock_item_id order by rc.stock_item_id
  loop
   select quantity into v_balance from public.stock_items
    where restaurant_id=p_restaurant and id=v_stock.stock_item_id and active for update;
   if v_balance is null then raise exception 'Ingrediente da ficha técnica indisponível';end if;
   if v_balance<v_stock.needed then raise exception 'Estoque insuficiente para aceitar este pedido';end if;
   update public.stock_items set quantity=quantity-v_stock.needed
    where restaurant_id=p_restaurant and id=v_stock.stock_item_id;
   insert into public.online_stock_movements(restaurant_id,online_order_id,stock_item_id,quantity_delta)
    values(p_restaurant,p_order,v_stock.stock_item_id,-v_stock.needed);
  end loop;
 end if;
 -- Cancelado antes da preparação devolve reserva física, com movimento compensatório no evento.
 if v_order.status='accepted' and p_target='cancelled' then
  for v_stock in
   select stock_item_id,-quantity_delta as to_restore
   from public.online_stock_movements where restaurant_id=p_restaurant and online_order_id=p_order
   order by stock_item_id
  loop
   update public.stock_items set quantity=quantity+v_stock.to_restore
    where restaurant_id=p_restaurant and id=v_stock.stock_item_id;
  end loop;
 end if;
 update public.online_orders set status=p_target,updated_at=v_now,
  accepted_at=case when p_target='accepted' then v_now else accepted_at end,
  prepared_at=case when p_target in ('ready','ready_for_pickup') then v_now else prepared_at end,
  dispatched_at=case when p_target='out_for_delivery' then v_now else dispatched_at end,
  fulfilled_at=case when p_target in ('delivered','picked_up') then v_now else fulfilled_at end,
  cancelled_at=case when p_target in ('cancelled','rejected') then v_now else cancelled_at end
 where id=p_order and restaurant_id=p_restaurant;
 insert into public.online_order_events(restaurant_id,order_id,actor_user_id,event,from_status,to_status,
  details) values(p_restaurant,p_order,p_actor,'status_changed',v_order.status,p_target,
   case when p_target='accepted' then jsonb_build_object('stock_reserved',true)
    when v_order.status='accepted' and p_target='cancelled' then jsonb_build_object('stock_restored',true)
    else '{}'::jsonb end);
 return jsonb_build_object('order_id',p_order,'status',p_target,'unchanged',false);
end $$;
revoke all on function public.marketplace_transition_order(uuid,uuid,text,uuid) from public,anon,authenticated;
grant execute on function public.marketplace_transition_order(uuid,uuid,text,uuid) to service_role;

-- Uma confirmação financeira por pedido: não interpreta entrega como pagamento.
create or replace function public.marketplace_confirm_payment(
 p_restaurant uuid,p_order uuid,p_actor uuid,p_method text
) returns jsonb language plpgsql security invoker set search_path='' as $$
declare v_order record;v_session record;v_method text;v_now timestamptz:=now();
begin
 select * into v_order from public.online_orders
  where restaurant_id=p_restaurant and id=p_order for update;
 if v_order.id is null then raise exception 'Pedido não encontrado';end if;
 if v_order.status in ('rejected','cancelled','expired') then
  raise exception 'Não é possível registrar pagamento de pedido cancelado';end if;
 if v_order.status='pending_acceptance' then raise exception 'O restaurante precisa aceitar o pedido antes de confirmar pagamento';end if;
 if v_order.payment_status='paid' then
  return jsonb_build_object('paid',true,'already_paid',true,'amount_cents',v_order.total_cents);
 end if;
 if v_order.payment_status<>'unpaid' then raise exception 'Estado financeiro não permite confirmação';end if;
 if p_method not in ('cash','pix','card') then raise exception 'Forma de pagamento inválida';end if;
 select id into v_session from public.cash_sessions
  where restaurant_id=p_restaurant and status='open'
  order by opened_at desc limit 1 for update;
 if v_session.id is null then raise exception 'Abra uma sessão de Caixa antes de confirmar recebimento';end if;
 insert into public.online_order_payments(restaurant_id,order_id,method,status,amount_cents,
   recorded_by,cash_session_id,confirmed_at)
  values(p_restaurant,p_order,p_method,'confirmed',v_order.total_cents,p_actor,v_session.id,v_now);
 update public.online_orders set payment_status='paid',updated_at=v_now
  where restaurant_id=p_restaurant and id=p_order;
 insert into public.online_order_events(restaurant_id,order_id,actor_user_id,event,details)
  values(p_restaurant,p_order,p_actor,'payment_confirmed',
   jsonb_build_object('method',p_method,'amount_cents',v_order.total_cents,'cash_session_id',v_session.id));
 return jsonb_build_object('paid',true,'already_paid',false,
  'amount_cents',v_order.total_cents,'cash_session_id',v_session.id);
end $$;
revoke all on function public.marketplace_confirm_payment(uuid,uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.marketplace_confirm_payment(uuid,uuid,uuid,text) to service_role;
