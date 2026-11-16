-- Intervalo Marketplace 1.1.0-rc.2 · checkout seguro e transacional
-- Pedidos ainda OFF por padrão. Não altera tabelas/rotinas presenciais.
alter table public.online_orders
 add column if not exists terms_accepted_at timestamptz,
 add column if not exists terms_version text not null default '2026-11',
 add column if not exists marketing_opt_in boolean not null default false;

create table if not exists public.online_request_limits (
 key_hash char(64) not null check(key_hash ~ '^[0-9a-f]{64}$'),
 window_start timestamptz not null,
 attempts integer not null default 0 check(attempts >= 0),
 primary key(key_hash,window_start)
);
alter table public.online_request_limits enable row level security;
revoke all on table public.online_request_limits from public,anon,authenticated;
grant select,insert,update,delete on table public.online_request_limits to service_role;

create table if not exists public.online_stock_movements (
 id uuid primary key default gen_random_uuid(),
 restaurant_id uuid not null,
 online_order_id uuid not null,
 stock_item_id uuid not null,
 quantity_delta numeric not null check(quantity_delta <> 0),
 created_at timestamptz not null default now(),
 foreign key(restaurant_id,online_order_id) references public.online_orders(restaurant_id,id) on delete restrict,
 foreign key(restaurant_id,stock_item_id) references public.stock_items(restaurant_id,id) on delete restrict,
 unique(restaurant_id,online_order_id,stock_item_id)
);
alter table public.online_stock_movements enable row level security;
revoke all on table public.online_stock_movements from public,anon,authenticated;
grant select,insert,update,delete on table public.online_stock_movements to service_role;

-- Rate gate atômico. Somente serviço privilegiado envia hash HMAC irreversível, nunca IP/telefone puro.
create or replace function public.marketplace_rate_gate(p_hash text,p_window_seconds integer,p_max integer)
returns boolean language plpgsql security invoker set search_path='' as $$
declare v_start timestamptz;v_attempts integer;
begin
 if p_hash !~ '^[0-9a-f]{64}$' or p_window_seconds not in (60,3600,86400) or p_max < 1 or p_max > 200 then return false; end if;
 v_start:=to_timestamp(floor(extract(epoch from now())/p_window_seconds)*p_window_seconds);
 insert into public.online_request_limits(key_hash,window_start,attempts) values(p_hash,v_start,1)
 on conflict(key_hash,window_start) do update
 set attempts=public.online_request_limits.attempts+1 returning attempts into v_attempts;
 return v_attempts<=p_max;
end $$;
revoke all on function public.marketplace_rate_gate(text,integer,integer) from public,anon,authenticated;
grant execute on function public.marketplace_rate_gate(text,integer,integer) to service_role;

-- Verifica horários; faixas overnight continuam válidas no início do dia seguinte.
create or replace function public.marketplace_store_is_open(p_restaurant uuid,p_kind text)
returns boolean language plpgsql security invoker stable set search_path='' as $$
declare v_timezone text;v_time time;v_dow integer;
begin
 if p_kind not in ('delivery','pickup') then return false; end if;
 select timezone into v_timezone from public.restaurant_settings where restaurant_id=p_restaurant;
 if v_timezone is null then return false; end if;
 begin
  v_time:=(now() at time zone v_timezone)::time;
  v_dow:=extract(dow from (now() at time zone v_timezone));
 exception when invalid_parameter_value then return false; end;
 return exists(
  select 1 from public.restaurant_business_hours h
  where h.restaurant_id=p_restaurant and h.active
   and ((p_kind='delivery' and h.delivery_enabled) or (p_kind='pickup' and h.pickup_enabled))
   and (
    (h.weekday=v_dow and (
      (h.closes_at>h.opens_at and v_time>=h.opens_at and v_time<h.closes_at)
      or (h.closes_at<h.opens_at and v_time>=h.opens_at)
    ))
    or (h.weekday=((v_dow+6)%7) and h.closes_at<h.opens_at and v_time<h.closes_at)
   )
 );
end $$;
revoke all on function public.marketplace_store_is_open(uuid,text) from public,anon,authenticated;
grant execute on function public.marketplace_store_is_open(uuid,text) to service_role;

-- Ponto ÚNICO de cálculo de preços, horários, taxas, adicionais e disponibilidade.
-- O backend sempre chama novamente a cotação dentro da transação que grava o pedido.
create or replace function public.marketplace_quote_order(
 p_restaurant uuid,p_kind text,p_zone uuid,p_address jsonb,p_items jsonb
) returns jsonb language plpgsql security invoker set search_path='' as $$
declare
 v_rest record;v_pub record;v_settings record;v_mod record;v_zone record;v_product record;
 v_item jsonb;v_line jsonb;v_options uuid[];v_count integer;v_opt_total bigint;v_option_snap jsonb;
 v_rows jsonb:='[]'::jsonb;v_subtotal bigint:=0;v_fee bigint:=0;
 v_qty integer;v_note text;v_price bigint;v_name text;v_pid uuid;v_opt jsonb;v_has integer;
begin
 if p_kind not in ('delivery','pickup') then raise exception 'Modalidade inválida';end if;
 if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) not between 1 and 25
 then raise exception 'Selecione entre 1 e 25 produtos';end if;
 select id,status into v_rest from public.restaurants where id=p_restaurant;
 select is_published,accepts_customer_orders into v_pub from public.restaurant_publication where restaurant_id=p_restaurant;
 select enabled,paused,delivery_enabled,pickup_enabled,minimum_order_cents into v_settings from public.restaurant_online_settings where restaurant_id=p_restaurant;
 select enabled into v_mod from public.restaurant_modules where restaurant_id=p_restaurant and module='cardapio';
 if v_rest.id is null or v_rest.status<>'active' or v_pub.is_published is distinct from true
  or v_pub.accepts_customer_orders is distinct from true or v_mod.enabled is distinct from true
  or v_settings.enabled is distinct from true or v_settings.paused is distinct from false
 then raise exception 'Restaurante não está recebendo pedidos online';end if;
 if (p_kind='delivery' and not v_settings.delivery_enabled) or (p_kind='pickup' and not v_settings.pickup_enabled)
 then raise exception 'Modalidade indisponível';end if;
 if not public.marketplace_store_is_open(p_restaurant,p_kind)
 then raise exception 'Restaurante fechado para esta modalidade';end if;
 if p_kind='delivery' then
  if p_zone is null or jsonb_typeof(p_address)<>'object' then raise exception 'Informe endereço e região de entrega';end if;
  if length(trim(coalesce(p_address->>'street',''))) < 2
   or length(trim(coalesce(p_address->>'number',''))) < 1
   or length(trim(coalesce(p_address->>'neighborhood',''))) < 2
   or length(trim(coalesce(p_address->>'city',''))) < 2
   or coalesce(p_address->>'state','') !~ '^[A-Z]{2}$'
   or coalesce(p_address->>'postal_code','') !~ '^[0-9]{8}$'
   or length(coalesce(p_address->>'reference',''))>160
   or length(coalesce(p_address->>'complement',''))>120
  then raise exception 'Endereço de entrega incompleto';end if;
  select * into v_zone from public.restaurant_delivery_zones
  where id=p_zone and restaurant_id=p_restaurant and active for share;
  if v_zone.id is null
   or lower(trim(v_zone.city))<>lower(trim(p_address->>'city'))
   or trim(v_zone.state)<>trim(p_address->>'state')
   or (v_zone.postal_code_from is not null and (
     (p_address->>'postal_code')<v_zone.postal_code_from or (p_address->>'postal_code')>v_zone.postal_code_to))
   or (cardinality(v_zone.neighborhoods)>0 and not exists(
     select 1 from unnest(v_zone.neighborhoods) as n where lower(trim(n))=lower(trim(p_address->>'neighborhood'))
   ))
  then raise exception 'Endereço fora da região de entrega';end if;
  v_fee:=v_zone.fee_cents;
 else
  if p_zone is not null or p_address is not null then raise exception 'Retirada não exige endereço ou taxa';end if;
 end if;
 for v_item in select value from jsonb_array_elements(p_items) loop
  if jsonb_typeof(v_item)<>'object' or coalesce(v_item->>'product_id','') !~* '^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$'
  then raise exception 'Produto inválido';end if;
  v_pid:=(v_item->>'product_id')::uuid;
  if coalesce(v_item->>'quantity','') !~ '^[0-9]{1,2}$'
  then raise exception 'Quantidade inválida';end if;
  v_qty:=(v_item->>'quantity')::integer;
  if v_qty<1 or v_qty>20 then raise exception 'Quantidade inválida';end if;
  v_note:=trim(coalesce(v_item->>'note',''));
  if length(v_note)>350 then raise exception 'Observação muito longa';end if;
  if jsonb_typeof(coalesce(v_item->'option_ids','[]'::jsonb))<>'array'
   or jsonb_array_length(coalesce(v_item->'option_ids','[]'::jsonb))>12
  then raise exception 'Adicionais inválidos';end if;
  select * into v_product from public.menu_products p
   where p.restaurant_id=p_restaurant and p.id=v_pid and p.available and p.show_on_menu
     and exists(select 1 from public.menu_categories c where c.id=p.category_id and c.restaurant_id=p_restaurant and c.active)
   for share;
  if v_product.id is null then raise exception 'Produto indisponível no cardápio';end if;
  if exists(select 1 from jsonb_array_elements_text(coalesce(v_item->'option_ids','[]'::jsonb)) x(value)
    where x.value !~* '^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$')
  then raise exception 'Identificador de adicional inválido';end if;
  select coalesce(array_agg(value::uuid),array[]::uuid[]) into v_options
   from jsonb_array_elements_text(coalesce(v_item->'option_ids','[]'::jsonb)) x(value);
  if cardinality(v_options) <> (select count(distinct x) from unnest(v_options) x)
  then raise exception 'Adicionais duplicados';end if;
  select count(*),coalesce(sum(o.price_delta_cents),0),
   coalesce(jsonb_agg(jsonb_build_object('id',o.id,'name',o.name,'price_cents',o.price_delta_cents) order by o.sort_order),'[]'::jsonb)
   into v_count,v_opt_total,v_option_snap
  from public.menu_product_options o
  where o.restaurant_id=p_restaurant and o.product_id=v_pid and o.available and o.id=any(v_options);
  if v_count<>cardinality(v_options) then raise exception 'Adicional indisponível para este produto';end if;
  v_price:=v_product.price_cents+v_opt_total;
  if v_price<0 or v_price>100000000 then raise exception 'Valor do produto inválido';end if;
  v_subtotal:=v_subtotal+v_price*v_qty;
  if v_subtotal>100000000 then raise exception 'Pedido acima do limite permitido';end if;
  v_line:=jsonb_build_object(
   'product_id',v_product.id,'product_name',v_product.name,'unit_price_cents',v_product.price_cents,
   'options_snapshot',v_option_snap,'options_unit_cents',v_opt_total,'quantity',v_qty,
   'line_total_cents',v_price*v_qty,'note',v_note);
  v_rows:=v_rows||jsonb_build_array(v_line);
 end loop;
 if v_subtotal<v_settings.minimum_order_cents
 then raise exception 'Pedido abaixo do mínimo do restaurante';end if;
 if p_kind='delivery' then
  if v_subtotal<v_zone.minimum_order_cents then raise exception 'Pedido abaixo do mínimo da região de entrega';end if;
 end if;
 return jsonb_build_object('restaurant_id',p_restaurant,'fulfillment_type',p_kind,
  'subtotal_cents',v_subtotal,'delivery_fee_cents',v_fee,'discount_cents',0,
  'total_cents',v_subtotal+v_fee,'items',v_rows,'expires_in_seconds',180,
  'quote_generated_at',now(),'checkout_available',true,'currency','BRL');
end $$;
revoke all on function public.marketplace_quote_order(uuid,text,uuid,jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.marketplace_quote_order(uuid,text,uuid,jsonb,jsonb) to service_role;

-- Pedido e itens criados atomicamente. A repetição da mesma chave é idempotente.
create or replace function public.marketplace_place_order(
 p_restaurant uuid,p_checkout_key uuid,p_source text,p_kind text,p_zone uuid,
 p_address jsonb,p_items jsonb,p_name text,p_phone text,p_note text,p_method text,
 p_track_hash text,p_terms_version text,p_marketing boolean
) returns jsonb language plpgsql security invoker set search_path='' as $$
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
 if p_kind='delivery' and p_method not in ('cash','pix_on_delivery','card_on_delivery')
 then raise exception 'Pagamento inválido para entrega';end if;
 if p_kind='pickup' and p_method not in ('cash_on_pickup','pix_on_pickup','card_on_pickup')
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
  v_order,p_restaurant,p_checkout_key,v_code,p_source,p_kind,'pending_acceptance','unpaid',p_method,
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
 return jsonb_build_object('order_id',v_order,'public_code',v_code,
  'total_cents',(v_quote->>'total_cents')::bigint,'status','pending_acceptance','reused',false);
end $$;
revoke all on function public.marketplace_place_order(uuid,uuid,text,text,uuid,jsonb,jsonb,text,text,text,text,text,text,boolean) from public,anon,authenticated;
grant execute on function public.marketplace_place_order(uuid,uuid,text,text,uuid,jsonb,jsonb,text,text,text,text,text,text,boolean) to service_role;
