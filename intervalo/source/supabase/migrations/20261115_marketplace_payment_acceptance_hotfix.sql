-- Bloqueio de recebimentos antes de aceite.
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
