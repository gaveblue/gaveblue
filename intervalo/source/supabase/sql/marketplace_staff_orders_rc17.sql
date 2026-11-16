-- Intervalo 1.1.0-rc.17 · pedidos de entrega/retirada feitos por funcionário Garçom.
-- Invocação apenas pelo service_role da Edge Function autenticada.
-- Reutiliza cotação do marketplace e transição de aceite, mantendo frete, estoque e limites.
-- Não atribui aceite de termos nem pagamento ao consumidor.
CREATE OR REPLACE FUNCTION public.marketplace_staff_place_order(
 p_restaurant uuid,p_actor uuid,p_request_id uuid,p_kind text,p_zone uuid,
 p_address jsonb,p_items jsonb,p_name text,p_phone text,p_note text,
 p_method text,p_track_hash text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER SET search_path TO ''
AS $function$
DECLARE
 v_member record;
 v_enabled boolean;
 v_override boolean;
 v_rest_status text;
 v_existing record;
 v_quote jsonb;
 v_order_id uuid:=gen_random_uuid();
 v_code text;
 v_name text:=btrim(coalesce(p_name,''));
 v_phone text:=pg_catalog.regexp_replace(coalesce(p_phone,''),'[^0-9]','','g');
 v_note text:=btrim(coalesce(p_note,''));
 v_item jsonb;
 v_address jsonb;
BEGIN
 IF p_request_id IS NULL OR p_restaurant IS NULL OR p_actor IS NULL
  OR p_track_hash !~ '^[0-9a-f]{64}$' THEN RAISE EXCEPTION 'Identificação do pedido inválida'; END IF;
 SELECT status INTO v_rest_status FROM public.restaurants WHERE id=p_restaurant;
 SELECT role,status INTO v_member FROM public.restaurant_members
  WHERE restaurant_id=p_restaurant AND user_id=p_actor;
 SELECT enabled INTO v_enabled FROM public.restaurant_modules
  WHERE restaurant_id=p_restaurant AND module='garcom';
 SELECT allowed INTO v_override FROM public.restaurant_member_module_access
  WHERE restaurant_id=p_restaurant AND user_id=p_actor AND module='garcom';
 IF v_rest_status IS DISTINCT FROM 'active'
   OR v_member.status IS DISTINCT FROM 'active'
   OR v_member.role NOT IN ('master','manager','waiter')
   OR v_enabled IS DISTINCT FROM true OR v_override IS false
 THEN RAISE EXCEPTION 'Acesso de Garçom não autorizado'; END IF;
 IF length(v_name) NOT BETWEEN 2 AND 120 OR length(v_phone) NOT BETWEEN 10 AND 13
   OR length(v_note)>500 THEN RAISE EXCEPTION 'Confira nome, telefone e observações'; END IF;
 IF (p_kind='delivery' AND p_method NOT IN ('cash','pix_on_delivery','card_on_delivery'))
  OR (p_kind='pickup' AND p_method NOT IN ('cash_on_pickup','pix_on_pickup','card_on_pickup'))
  OR p_kind NOT IN ('delivery','pickup')
 THEN RAISE EXCEPTION 'Forma de pagamento ou modalidade inválida'; END IF;
 PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_restaurant::text||':'||p_request_id::text,0));
 SELECT id,public_code,total_cents,status INTO v_existing FROM public.online_orders
  WHERE restaurant_id=p_restaurant AND checkout_key=p_request_id FOR UPDATE;
 IF v_existing.id IS NOT NULL THEN
  RETURN pg_catalog.jsonb_build_object('order_id',v_existing.id,'public_code',v_existing.public_code,
   'total_cents',v_existing.total_cents,'status',v_existing.status,'reused',true);
 END IF;
 -- A cotação valida cardápio, disponibilidade, horários, valores, CEP, taxa e região.
 v_quote:=public.marketplace_quote_order(p_restaurant,p_kind,p_zone,p_address,p_items);
 v_code:='ON-'||pg_catalog.upper(pg_catalog.substr(pg_catalog.replace(v_order_id::text,'-',''),1,12));
 v_address:=CASE WHEN p_kind='delivery' THEN pg_catalog.jsonb_build_object(
  'street',btrim(coalesce(p_address->>'street','')),
  'number',btrim(coalesce(p_address->>'number','')),
  'neighborhood',btrim(coalesce(p_address->>'neighborhood','')),
  'city',btrim(coalesce(p_address->>'city','')),
  'state',btrim(coalesce(p_address->>'state','')),
  'postal_code',btrim(coalesce(p_address->>'postal_code','')),
  'complement',btrim(coalesce(p_address->>'complement','')),
  'reference',btrim(coalesce(p_address->>'reference',''))) ELSE NULL END;
 INSERT INTO public.online_orders(
  id,restaurant_id,checkout_key,public_code,source,fulfillment_type,status,payment_status,payment_method,
  customer_name,customer_phone,delivery_address,delivery_zone_id,customer_note,
  subtotal_cents,delivery_fee_cents,discount_cents,total_cents,terms_accepted_at,marketing_opt_in
 ) VALUES (
  v_order_id,p_restaurant,p_request_id,v_code,'storefront',p_kind,'pending_acceptance','unpaid',p_method,
  v_name,v_phone,v_address,CASE WHEN p_kind='delivery' THEN p_zone ELSE NULL END,v_note,
  (v_quote->>'subtotal_cents')::bigint,(v_quote->>'delivery_fee_cents')::bigint,0,
  (v_quote->>'total_cents')::bigint,NULL,false
 );
 FOR v_item IN SELECT value FROM pg_catalog.jsonb_array_elements(v_quote->'items') LOOP
  INSERT INTO public.online_order_items(
   restaurant_id,order_id,product_id,product_name,unit_price_cents,
   options_snapshot,options_unit_cents,quantity,line_total_cents,note
  ) VALUES (
   p_restaurant,v_order_id,(v_item->>'product_id')::uuid,v_item->>'product_name',
   (v_item->>'unit_price_cents')::bigint,coalesce(v_item->'options_snapshot','[]'::jsonb),
   (v_item->>'options_unit_cents')::bigint,(v_item->>'quantity')::integer,
   (v_item->>'line_total_cents')::bigint,coalesce(v_item->>'note','')
  );
 END LOOP;
 INSERT INTO public.online_order_events(restaurant_id,order_id,actor_user_id,event,to_status,details)
 VALUES(p_restaurant,v_order_id,p_actor,'created','pending_acceptance',
  pg_catalog.jsonb_build_object('origin','garcom','fulfillment_type',p_kind,'staff_user_id',p_actor));
 INSERT INTO public.online_order_tracking_tokens(restaurant_id,order_id,token_hash,expires_at)
 VALUES(p_restaurant,v_order_id,p_track_hash,now()+interval '30 days');
 -- Aceite automático de pedido lançado por funcionário: faz reserva/baixa do estoque na transação.
 PERFORM public.marketplace_transition_order(p_restaurant,v_order_id,'accepted',p_actor);
 RETURN pg_catalog.jsonb_build_object('order_id',v_order_id,'public_code',v_code,
  'total_cents',(v_quote->>'total_cents')::bigint,'delivery_fee_cents',(v_quote->>'delivery_fee_cents')::bigint,
  'status','accepted','reused',false);
END
$function$;
REVOKE ALL ON FUNCTION public.marketplace_staff_place_order(uuid,uuid,uuid,text,uuid,jsonb,jsonb,text,text,text,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.marketplace_staff_place_order(uuid,uuid,uuid,text,uuid,jsonb,jsonb,text,text,text,text,text) TO service_role;
