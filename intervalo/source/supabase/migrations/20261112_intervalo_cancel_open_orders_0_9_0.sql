begin;
create or replace function public.intervalo_cancel_open_order(p_restaurant uuid,p_order uuid,p_actor uuid,p_reason text default 'Cancelado pelo operador')
returns boolean language plpgsql security definer set search_path='' as $$
declare v_status text;
begin
 if p_reason is null or char_length(btrim(p_reason))<3 or char_length(p_reason)>180 then raise exception 'Justificativa inválida';end if;
 select status into v_status from public.orders where restaurant_id=p_restaurant and id=p_order for update;
 if v_status is distinct from 'open' then raise exception 'Somente comandas ainda não enviadas podem ser canceladas';end if;
 if exists(select 1 from public.payments where restaurant_id=p_restaurant and order_id=p_order) then raise exception 'Comanda com recebimento registrado não pode ser cancelada';end if;
 if exists(select 1 from public.order_items where restaurant_id=p_restaurant and order_id=p_order and status <> 'draft') then raise exception 'Itens já enviados não permitem cancelamento automático';end if;
 update public.order_items set status='cancelled' where restaurant_id=p_restaurant and order_id=p_order and status='draft';
 update public.orders set status='cancelled',closed_at=now() where restaurant_id=p_restaurant and id=p_order;
 insert into public.order_events(restaurant_id,order_id,actor_id,event,details)
 values(p_restaurant,p_order,p_actor,'order_cancelled',jsonb_build_object('reason',btrim(p_reason)));
 return true;
end;
$$;
revoke all on function public.intervalo_cancel_open_order(uuid,uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.intervalo_cancel_open_order(uuid,uuid,uuid,text) to service_role;
commit;