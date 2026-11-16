-- Corrige retirada sem região, função completa regravada.
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
