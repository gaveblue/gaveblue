-- Intervalo: operações transacionais da comanda e caixa, chamadas SOMENTE pela Edge Function com service_role.
begin;
create or replace function public.intervalo_open_order(p_restaurant uuid,p_table uuid,p_actor uuid)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_order uuid;
begin
 if not exists(select 1 from public.restaurant_tables t where t.id=p_table and t.restaurant_id=p_restaurant and t.active) then
  raise exception 'Mesa não encontrada ou desativada';
 end if;
 insert into public.orders(restaurant_id,table_id,opened_by) values(p_restaurant,p_table,p_actor) returning id into v_order;
 insert into public.order_events(restaurant_id,order_id,actor_id,event)
 values(p_restaurant,v_order,p_actor,'order_opened');
 return v_order;
exception when unique_violation then
 raise exception 'A mesa já possui uma comanda ativa';
end;
$$;

create or replace function public.intervalo_add_order_item(p_restaurant uuid,p_order uuid,p_product uuid,p_quantity int,p_note text,p_actor uuid)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_name text;v_price bigint;v_id uuid;v_status text;
begin
 if p_quantity not between 1 and 99 or char_length(coalesce(p_note,''))>350 then raise exception 'Quantidade ou observação inválida'; end if;
 select status into v_status from public.orders where id=p_order and restaurant_id=p_restaurant for update;
 if v_status is distinct from 'open' then raise exception 'Esta comanda não aceita novos itens'; end if;
 select p.name,p.price_cents into v_name,v_price
 from public.menu_products p join public.menu_categories c
 on c.restaurant_id=p.restaurant_id and c.id=p.category_id
 where p.restaurant_id=p_restaurant and p.id=p_product and p.available and c.active;
 if v_name is null then raise exception 'Produto indisponível';end if;
 insert into public.order_items(restaurant_id,order_id,product_id,product_name,unit_price_cents,quantity,note)
 values(p_restaurant,p_order,p_product,v_name,v_price,p_quantity,coalesce(p_note,'')) returning id into v_id;
 insert into public.order_events(restaurant_id,order_id,actor_id,event,details)
 values(p_restaurant,p_order,p_actor,'item_added',jsonb_build_object('item_id',v_id,'quantity',p_quantity));
 return v_id;
end;
$$;

create or replace function public.intervalo_submit_order(p_restaurant uuid,p_order uuid,p_actor uuid)
returns boolean language plpgsql security definer set search_path='' as $$
declare v_status text;
begin
 select status into v_status from public.orders where id=p_order and restaurant_id=p_restaurant for update;
 if v_status is distinct from 'open' then raise exception 'Comanda não está aberta para envio'; end if;
 if not exists(select 1 from public.order_items where restaurant_id=p_restaurant and order_id=p_order and status='draft') then raise exception 'Adicione pelo menos um item'; end if;
 update public.orders set status='submitted',submitted_at=now() where restaurant_id=p_restaurant and id=p_order;
 update public.order_items set status='queued' where restaurant_id=p_restaurant and order_id=p_order and status='draft';
 insert into public.order_events(restaurant_id,order_id,actor_id,event) values(p_restaurant,p_order,p_actor,'order_submitted');
 return true;
end;
$$;

create or replace function public.intervalo_advance_order(p_restaurant uuid,p_order uuid,p_next text,p_actor uuid)
returns boolean language plpgsql security definer set search_path='' as $$
declare v_status text;
begin
 select status into v_status from public.orders where restaurant_id=p_restaurant and id=p_order for update;
 if not(
 (v_status='submitted' and p_next='preparing') or
 (v_status='preparing' and p_next='ready') or
 (v_status='ready' and p_next='served')
 ) then raise exception 'Transição de estado inválida'; end if;
 update public.orders set status=p_next where restaurant_id=p_restaurant and id=p_order;
 update public.order_items set status=case when p_next='preparing' then 'preparing' when p_next='ready' then 'ready' else 'served' end
 where restaurant_id=p_restaurant and order_id=p_order and status<>'cancelled';
 insert into public.order_events(restaurant_id,order_id,actor_id,event,details)
 values(p_restaurant,p_order,p_actor,'order_status_changed',jsonb_build_object('from',v_status,'to',p_next));
 return true;
end;
$$;

create or replace function public.intervalo_open_cash(p_restaurant uuid,p_actor uuid,p_start bigint)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_id uuid;
begin
 if p_start is null or p_start<0 or p_start>10000000000 then raise exception 'Troco inicial inválido'; end if;
 insert into public.cash_sessions(restaurant_id,opened_by,starting_cash_cents)
 values(p_restaurant,p_actor,p_start) returning id into v_id;
 insert into public.audit_logs(restaurant_id,actor_user_id,event,details)
 values(p_restaurant,p_actor,'cash_session_opened',jsonb_build_object('session_id',v_id));
 return v_id;
exception when unique_violation then raise exception 'Já existe caixa aberto';
end;
$$;

create or replace function public.intervalo_record_manual_payment(p_restaurant uuid,p_order uuid,p_actor uuid,p_amount bigint,p_method text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_status text;v_total bigint;v_paid bigint;v_session uuid;v_id uuid;v_due bigint;
begin
 if p_amount is null or p_amount<=0 or p_amount>10000000000 then raise exception 'Valor inválido';end if;
 if p_method not in ('cash','debit_recorded','credit_recorded','pix_recorded','other_recorded') then raise exception 'Forma de registro inválida';end if;
 select status into v_status from public.orders where restaurant_id=p_restaurant and id=p_order for update;
 if v_status is distinct from 'served' then raise exception 'Comanda precisa estar servida para receber';end if;
 select id into v_session from public.cash_sessions where restaurant_id=p_restaurant and status='open' for update;
 if v_session is null then raise exception 'Abra um caixa antes de registrar recebimentos';end if;
 select coalesce(sum(unit_price_cents*quantity),0) into v_total from public.order_items where restaurant_id=p_restaurant and order_id=p_order and status<>'cancelled';
 select coalesce(sum(amount_cents),0) into v_paid from public.payments where restaurant_id=p_restaurant and order_id=p_order;
 v_due=v_total-v_paid;
 if v_total<=0 or v_due<=0 or p_amount>v_due then raise exception 'Pagamento maior que o saldo em aberto';end if;
 insert into public.payments(restaurant_id,order_id,cash_session_id,method,amount_cents,recorded_by)
 values(p_restaurant,p_order,v_session,p_method,p_amount,p_actor) returning id into v_id;
 if p_amount=v_due then
  update public.orders set status='closed',closed_at=now() where restaurant_id=p_restaurant and id=p_order;
 end if;
 insert into public.order_events(restaurant_id,order_id,actor_id,event,details)
 values(p_restaurant,p_order,p_actor,'payment_recorded_manual',jsonb_build_object('method',p_method,'amount_cents',p_amount,'payment_id',v_id));
 return jsonb_build_object('payment_id',v_id,'fully_paid',p_amount=v_due,'remaining_cents',v_due-p_amount);
end;
$$;

create or replace function public.intervalo_close_cash(p_restaurant uuid,p_actor uuid,p_counted bigint)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_id uuid;v_start bigint;v_expected bigint;
begin
 if p_counted is null or p_counted<0 or p_counted>10000000000 then raise exception 'Contagem inválida';end if;
 select id,starting_cash_cents into v_id,v_start
 from public.cash_sessions where restaurant_id=p_restaurant and status='open' for update;
 if v_id is null then raise exception 'Não existe caixa aberto';end if;
 select v_start+coalesce(sum(amount_cents),0) into v_expected from public.payments
 where restaurant_id=p_restaurant and cash_session_id=v_id and method='cash';
 update public.cash_sessions set status='closed',closed_by=p_actor,counted_cash_cents=p_counted,closed_at=now()
 where restaurant_id=p_restaurant and id=v_id;
 insert into public.audit_logs(restaurant_id,actor_user_id,event,details)
 values(p_restaurant,p_actor,'cash_session_closed',
 jsonb_build_object('session_id',v_id,'expected_cash_cents',v_expected,'counted_cash_cents',p_counted));
 return jsonb_build_object('session_id',v_id,'expected_cash_cents',v_expected,'difference_cents',p_counted-v_expected);
end;
$$;

-- A camada HTTP usa service_role; cliente anon/authenticated jamais executa estas RPCs.
do $$
declare fn text;
begin
 foreach fn in array array[
 'intervalo_open_order(uuid,uuid,uuid)',
 'intervalo_add_order_item(uuid,uuid,uuid,integer,text,uuid)',
 'intervalo_submit_order(uuid,uuid,uuid)',
 'intervalo_advance_order(uuid,uuid,text,uuid)',
 'intervalo_open_cash(uuid,uuid,bigint)',
 'intervalo_record_manual_payment(uuid,uuid,uuid,bigint,text)',
 'intervalo_close_cash(uuid,uuid,bigint)'
 ] loop
 execute format('revoke all on function public.%s from public,anon,authenticated',fn);
 execute format('grant execute on function public.%s to service_role',fn);
 end loop;
end $$;
commit;