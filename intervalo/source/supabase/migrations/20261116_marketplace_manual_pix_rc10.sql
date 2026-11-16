-- Intervalo Marketplace 1.1.0-rc.10 — Pix manual com QR BR Code estático.
-- Execute uma única vez no Supabase INTERVALO. Chave Pix deve ser cadastrada somente pelo Master na aplicação.
-- O QR estático não expira no banco; o prazo de dez minutos governa o status do pedido.

create table if not exists public.restaurant_manual_pix_settings(
 restaurant_id uuid primary key references public.restaurants(id) on delete restrict,
 pix_key text not null check(length(pix_key) between 8 and 77),
 recipient_name text not null check(length(recipient_name) between 2 and 120),
 recipient_city text not null check(length(recipient_city) between 2 and 100),
 enabled boolean not null default false,
 updated_at timestamptz not null default now()
);
alter table public.restaurant_manual_pix_settings enable row level security;
revoke all on public.restaurant_manual_pix_settings from anon,authenticated;
create table if not exists public.online_manual_pix_charges(
 order_id uuid primary key,
 restaurant_id uuid not null,
 payload text,
 txid text not null default '',
 expires_at timestamptz not null,
 reported_at timestamptz,
 confirmed_at timestamptz,
 confirmed_by uuid references auth.users(id),
 state text not null default 'pending' check(state in ('pending','reported','confirmed','expired')),
 created_at timestamptz not null default now(),
 foreign key(restaurant_id,order_id) references public.online_orders(restaurant_id,id)
);
create index if not exists online_manual_pix_charges_exp_idx on public.online_manual_pix_charges(expires_at,state);
alter table public.online_manual_pix_charges enable row level security;
revoke all on public.online_manual_pix_charges from anon,authenticated;
alter table public.online_orders drop constraint if exists online_orders_payment_method_check;
alter table public.online_orders add constraint online_orders_payment_method_check check(payment_method in ('cash','pix_on_delivery','card_on_delivery','cash_on_pickup','pix_on_pickup','card_on_pickup','infinitepay','manual_pix'));

CREATE OR REPLACE FUNCTION public.marketplace_accept_manual_pix(p_restaurant uuid, p_order uuid, p_actor uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare o public.online_orders%rowtype; c public.online_manual_pix_charges%rowtype; v_ret jsonb;
begin
 select * into o from public.online_orders where restaurant_id=p_restaurant and id=p_order for update;
 select * into c from public.online_manual_pix_charges where restaurant_id=p_restaurant and order_id=p_order for update;
 if o.id is null or c.order_id is null or o.payment_method<>'manual_pix' then raise exception 'Cobrança manual não encontrada';end if;
 if o.status<>'pending_acceptance' or o.payment_status<>'payment_pending' or c.state<>'reported' or c.reported_at is null or c.reported_at>=c.expires_at then raise exception 'Este Pix não está disponível para conferência';end if;
 -- A interface pede a confirmação explícita de que o responsável conferiu o crédito no extrato bancário.
 update public.online_manual_pix_charges set state='confirmed',confirmed_at=now(),confirmed_by=p_actor where order_id=p_order;
 update public.online_orders set payment_status='paid',updated_at=now() where id=p_order and restaurant_id=p_restaurant;
 insert into public.online_order_payments(restaurant_id,order_id,method,status,amount_cents,recorded_by,confirmed_at)
 values(p_restaurant,p_order,'pix','confirmed',o.total_cents,p_actor,now());
 insert into public.online_order_events(restaurant_id,order_id,actor_user_id,event,details)
 values(p_restaurant,p_order,p_actor,'manual_pix_confirmed',jsonb_build_object('amount_cents',o.total_cents,'manual_verification',true));
 select public.marketplace_transition_order(p_restaurant,p_order,'accepted',p_actor) into v_ret;
 return jsonb_build_object('paid',true,'accepted',true,'order_id',p_order,'transition',v_ret);
end $function$
;
revoke all on function public.marketplace_accept_manual_pix(uuid,uuid,uuid) from public,anon,authenticated;
grant execute on function public.marketplace_accept_manual_pix(uuid,uuid,uuid) to service_role;

CREATE OR REPLACE FUNCTION public.marketplace_expire_manual_pix()
 RETURNS integer
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare n integer;
begin
 with expired as (
 update public.online_orders o set status='expired',cancelled_at=now(),updated_at=now()
 from public.online_manual_pix_charges c
 where o.id=c.order_id and o.restaurant_id=c.restaurant_id
 and o.payment_method='manual_pix' and o.payment_status='payment_pending'
 and o.status='pending_acceptance' and c.reported_at is null and c.expires_at<=now()
 returning o.id,o.restaurant_id
 ), charges as (
 update public.online_manual_pix_charges c set state='expired'
 from expired e where c.order_id=e.id and c.restaurant_id=e.restaurant_id
 returning c.order_id
 ), events as (
 insert into public.online_order_events(restaurant_id,order_id,event,to_status,details)
 select e.restaurant_id,e.id,'manual_pix_expired','expired',jsonb_build_object('reason','no_payment_report_within_10_minutes')
 from expired e returning id
 )
 select count(*) into n from expired;
 return n;
end $function$
;
revoke all on function public.marketplace_expire_manual_pix() from public,anon,authenticated;
grant execute on function public.marketplace_expire_manual_pix() to service_role;

CREATE OR REPLACE FUNCTION public.marketplace_manual_pix_report(p_order uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare c public.online_manual_pix_charges%rowtype; o public.online_orders%rowtype;
begin
 select * into o from public.online_orders where id=p_order for update;
 if o.id is null then raise exception 'Pedido não encontrado';end if;
 select * into c from public.online_manual_pix_charges where order_id=p_order and restaurant_id=o.restaurant_id for update;
 if c.order_id is null then raise exception 'Cobrança não encontrada';end if;
 if o.payment_method<>'manual_pix' or o.status<>'pending_acceptance' or o.payment_status<>'payment_pending' then raise exception 'Pedido indisponível';end if;
 if c.reported_at is not null then return jsonb_build_object('reported',true,'expires_at',c.expires_at);end if;
 if now()>=c.expires_at then raise exception 'O prazo de pagamento expirou'; end if;
 update public.online_manual_pix_charges set reported_at=now(),state='reported' where order_id=p_order;
 insert into public.online_order_events(restaurant_id,order_id,event,details)
 values(c.restaurant_id,p_order,'manual_pix_reported',jsonb_build_object('review_required',true));
 return jsonb_build_object('reported',true,'expires_at',c.expires_at);
end $function$
;
revoke all on function public.marketplace_manual_pix_report(uuid) from public,anon,authenticated;
grant execute on function public.marketplace_manual_pix_report(uuid) to service_role;

CREATE OR REPLACE FUNCTION public.marketplace_place_order(p_restaurant uuid, p_checkout_key uuid, p_source text, p_kind text, p_zone uuid, p_address jsonb, p_items jsonb, p_name text, p_phone text, p_note text, p_method text, p_track_hash text, p_terms_version text, p_marketing boolean)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare v_existing record;v_quote jsonb;v_order uuid:=gen_random_uuid();v_code text;
 v_item jsonb;v_name text;v_phone text;v_note text;v_address jsonb;
begin
 if p_checkout_key is null or p_restaurant is null or p_track_hash !~ '^[0-9a-f]{64}$'
 then raise exception 'Chave de checkout inválida';end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_restaurant::text||':'||p_checkout_key::text,0));
 select id,public_code,total_cents,status into v_existing from public.online_orders
  where restaurant_id=p_restaurant and checkout_key=p_checkout_key for update;
 if v_existing.id is not null then
  return jsonb_build_object('order_id',v_existing.id,'public_code',v_existing.public_code,
   'total_cents',v_existing.total_cents,'status',v_existing.status,'reused',true);
 end if;
 v_name:=trim(coalesce(p_name,''));v_phone:=pg_catalog.regexp_replace(coalesce(p_phone,''),'[^0-9]','','g');
 v_note:=trim(coalesce(p_note,''));
 if length(v_name) not between 2 and 120 or length(v_phone) not between 10 and 13 or length(v_note)>500
 then raise exception 'Confira o nome, telefone e observações';end if;
 if p_terms_version not in ('2026-11') then raise exception 'Aceite dos termos é obrigatório';end if;
 if p_source not in ('marketplace','storefront') then raise exception 'Origem inválida';end if;
 if p_method='infinitepay' and not exists (select 1 from public.restaurant_payment_gateways g where g.restaurant_id=p_restaurant and g.provider='infinitepay' and g.enabled and g.secret_env_name is not null and g.handle is not null) then raise exception 'Pagamento online indisponível'; end if;
 if p_method='manual_pix' and not exists (select 1 from public.restaurant_manual_pix_settings s where s.restaurant_id=p_restaurant and s.enabled and s.pix_key is not null and s.recipient_name is not null and s.recipient_city is not null) then raise exception 'Pix manual não configurado'; end if;
 if p_kind='delivery' and p_method not in ('cash','pix_on_delivery','card_on_delivery','infinitepay','manual_pix')
 then raise exception 'Pagamento inválido para entrega';end if;
 if p_kind='pickup' and p_method not in ('cash_on_pickup','pix_on_pickup','card_on_pickup','infinitepay','manual_pix')
 then raise exception 'Pagamento inválido para retirada';end if;
 v_quote:=public.marketplace_quote_order(p_restaurant,p_kind,p_zone,p_address,p_items);
 v_code:='ON-'||upper(substr(replace(v_order::text,'-',''),1,12));
 v_address:=case when p_kind='delivery' then jsonb_build_object(
  'street',trim(p_address->>'street'),'number',trim(p_address->>'number'),
  'neighborhood',trim(p_address->>'neighborhood'),'city',trim(p_address->>'city'),
  'state',trim(p_address->>'state'),'postal_code',trim(p_address->>'postal_code'),
  'complement',trim(coalesce(p_address->>'complement','')),
  'reference',trim(coalesce(p_address->>'reference',''))) else null end;
 insert into public.online_orders(
  id,restaurant_id,checkout_key,public_code,source,fulfillment_type,status,payment_status,payment_method,
  customer_name,customer_phone,delivery_address,delivery_zone_id,customer_note,
  subtotal_cents,delivery_fee_cents,discount_cents,total_cents,terms_accepted_at,terms_version,marketing_opt_in
 ) values(
  v_order,p_restaurant,p_checkout_key,v_code,p_source,p_kind,'pending_acceptance',case when p_method in ('infinitepay','manual_pix') then 'payment_pending' else 'unpaid' end,p_method,
  v_name,v_phone,v_address,case when p_kind='delivery' then p_zone else null end,v_note,
  (v_quote->>'subtotal_cents')::bigint,(v_quote->>'delivery_fee_cents')::bigint,0,
  (v_quote->>'total_cents')::bigint,now(),p_terms_version,coalesce(p_marketing,false)
 );
 for v_item in select value from jsonb_array_elements(v_quote->'items') loop
  insert into public.online_order_items(restaurant_id,order_id,product_id,product_name,unit_price_cents,
    options_snapshot,options_unit_cents,quantity,line_total_cents,note)
   values(p_restaurant,v_order,(v_item->>'product_id')::uuid,v_item->>'product_name',
    (v_item->>'unit_price_cents')::bigint,v_item->'options_snapshot',
    (v_item->>'options_unit_cents')::bigint,(v_item->>'quantity')::integer,
    (v_item->>'line_total_cents')::bigint,v_item->>'note');
 end loop;
 insert into public.online_order_events(restaurant_id,order_id,event,to_status,details)
  values(p_restaurant,v_order,'created','pending_acceptance',jsonb_build_object('source',p_source,'fulfillment_type',p_kind));
 insert into public.online_order_tracking_tokens(restaurant_id,order_id,token_hash,expires_at)
  values(p_restaurant,v_order,p_track_hash,now()+interval '30 days');
 if p_method='manual_pix' then
  insert into public.online_manual_pix_charges(restaurant_id,order_id,expires_at)
  values(p_restaurant,v_order,now()+interval '10 minutes');
 end if;
 return jsonb_build_object('order_id',v_order,'public_code',v_code,
  'total_cents',(v_quote->>'total_cents')::bigint,'status','pending_acceptance','reused',false);
end $function$
;

CREATE OR REPLACE FUNCTION public.marketplace_transition_order(p_restaurant uuid, p_order uuid, p_target text, p_actor uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
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
 if v_order.payment_method='manual_pix' and p_target='accepted' and v_order.payment_status<>'paid' then raise exception 'Confirme o Pix na conta do restaurante antes de aceitar';end if;
 -- Abate estoque na aprovação do pedido, uma única vez, em mesma transação.
 if p_target='accepted' and v_order.payment_method='infinitepay' and v_order.payment_status<>'paid' then
  raise exception 'Aguarde a confirmação do pagamento online';
 end if;
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
end $function$
;

create extension if not exists pg_cron with schema pg_catalog;
select cron.schedule('intervalo-manual-pix-expire-10min','* * * * *','select public.marketplace_expire_manual_pix()');
