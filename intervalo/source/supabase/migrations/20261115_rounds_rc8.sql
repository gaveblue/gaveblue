
create table public.order_rounds(
 id uuid primary key default gen_random_uuid(),
 restaurant_id uuid not null,
 order_id uuid not null,
 round_no integer not null check(round_no between 1 and 9999),
 status text not null default 'draft' check(status in ('draft','submitted','preparing','ready','served','cancelled')),
 created_at timestamptz not null default now(),
 submitted_at timestamptz,started_at timestamptz,ready_at timestamptz,served_at timestamptz,
 unique(restaurant_id,order_id,round_no),
 foreign key(restaurant_id,order_id) references public.orders(restaurant_id,id) on delete cascade
);
alter table public.order_rounds enable row level security;
revoke all on public.order_rounds from public,anon,authenticated;
grant select,insert,update,delete on public.order_rounds to service_role;
create index order_rounds_queue on public.order_rounds(restaurant_id,status,submitted_at desc);
alter table public.order_items add column round_no integer not null default 1;
insert into public.order_rounds(restaurant_id,order_id,round_no,status,created_at,submitted_at)
select restaurant_id,id,1,case when status='open' then 'draft' when status='closed' then 'served' else status end,opened_at,submitted_at from public.orders;
alter table public.order_items add constraint order_items_round_fk
 foreign key(restaurant_id,order_id,round_no) references public.order_rounds(restaurant_id,order_id,round_no);
create index order_items_round_idx on public.order_items(restaurant_id,order_id,round_no);

create or replace function public.intervalo_round_state(p_restaurant uuid,p_order uuid)
returns text language plpgsql security definer set search_path='' as $$
declare v text;
begin
select case
 when count(*) filter(where status='submitted')>0 then 'submitted'
 when count(*) filter(where status='preparing')>0 then 'preparing'
 when count(*) filter(where status='ready')>0 then 'ready'
 when count(*) filter(where status='draft')>0 and count(*) filter(where status='served')>0 then 'submitted'
 when count(*) filter(where status='draft')>0 then 'open'
 when count(*) filter(where status='served')>0 then 'served'
 else 'open' end into v
from public.order_rounds where restaurant_id=p_restaurant and order_id=p_order and status<>'cancelled';
update public.orders set status=v where restaurant_id=p_restaurant and id=p_order and status not in('closed','cancelled');
return v;
end $$;
revoke all on function public.intervalo_round_state(uuid,uuid) from public,anon,authenticated;
grant execute on function public.intervalo_round_state(uuid,uuid) to service_role;

create or replace function public.intervalo_add_item_auto(
 p_restaurant uuid,p_table uuid,p_product uuid,p_quantity integer,p_note text,p_actor uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_order uuid;v_round int;v_item uuid;v_name text;v_price bigint;v_created boolean:=false;
begin
if p_quantity is null or p_quantity not between 1 and 99 or char_length(coalesce(p_note,''))>350
then raise exception 'Quantidade ou observação inválida';end if;
perform 1 from public.restaurant_tables where restaurant_id=p_restaurant and id=p_table and active for update;
if not found then raise exception 'Mesa indisponível';end if;
if not exists(select 1 from public.restaurant_members where restaurant_id=p_restaurant and user_id=p_actor and status='active')
then raise exception 'Atendente não autorizado';end if;
select p.name,p.price_cents into v_name,v_price from public.menu_products p
join public.menu_categories c on c.restaurant_id=p.restaurant_id and c.id=p.category_id
where p.restaurant_id=p_restaurant and p.id=p_product and p.available and c.active;
if v_name is null then raise exception 'Produto indisponível';end if;
select id into v_order from public.orders where restaurant_id=p_restaurant and table_id=p_table and status in('open','submitted','preparing','ready','served') for update;
if v_order is null then v_order:=public.intervalo_open_order(p_restaurant,p_table,p_actor);v_created:=true;end if;
if exists(select 1 from public.payments where restaurant_id=p_restaurant and order_id=v_order)
then raise exception 'Não é possível lançar após iniciar o pagamento';end if;
select round_no into v_round from public.order_rounds where restaurant_id=p_restaurant and order_id=v_order and status='draft' for update;
if v_round is null then
select coalesce(max(round_no),0)+1 into v_round from public.order_rounds where restaurant_id=p_restaurant and order_id=v_order;
insert into public.order_rounds(restaurant_id,order_id,round_no) values(p_restaurant,v_order,v_round);
end if;
insert into public.order_items(restaurant_id,order_id,round_no,product_id,product_name,unit_price_cents,quantity,note)
values(p_restaurant,v_order,v_round,p_product,v_name,v_price,p_quantity,coalesce(p_note,'')) returning id into v_item;
insert into public.order_events(restaurant_id,order_id,actor_id,event,details)
values(p_restaurant,v_order,p_actor,'item_added',jsonb_build_object('item_id',v_item,'quantity',p_quantity,'round_no',v_round));
perform public.intervalo_round_state(p_restaurant,v_order);
return jsonb_build_object('order_id',v_order,'item_id',v_item,'created',v_created,'round_no',v_round);
end $$;
revoke all on function public.intervalo_add_item_auto(uuid,uuid,uuid,integer,text,uuid) from public,anon,authenticated;
grant execute on function public.intervalo_add_item_auto(uuid,uuid,uuid,integer,text,uuid) to service_role;

create or replace function public.intervalo_add_order_item(
 p_restaurant uuid,p_order uuid,p_product uuid,p_quantity integer,p_note text,p_actor uuid)
returns uuid language plpgsql security definer set search_path='' as $$
declare t uuid;r jsonb;
begin
select table_id into t from public.orders where restaurant_id=p_restaurant and id=p_order and status not in('closed','cancelled');
if t is null then raise exception 'Comanda indisponível';end if;
r:=public.intervalo_add_item_auto(p_restaurant,t,p_product,p_quantity,p_note,p_actor);
if (r->>'order_id')::uuid<>p_order then raise exception 'Comanda alterada';end if;
return (r->>'item_id')::uuid;
end $$;
revoke all on function public.intervalo_add_order_item(uuid,uuid,uuid,integer,text,uuid) from public,anon,authenticated;
grant execute on function public.intervalo_add_order_item(uuid,uuid,uuid,integer,text,uuid) to service_role;

create or replace function public.intervalo_submit_order(p_restaurant uuid,p_order uuid,p_actor uuid)
returns boolean language plpgsql security definer set search_path='' as $$
declare v_status text;v_round int;v_recipe record;v_name text;v_qty numeric;v_count int:=0;
begin
select status into v_status from public.orders where restaurant_id=p_restaurant and id=p_order for update;
if v_status is null or v_status in('closed','cancelled') then raise exception 'Comanda indisponível';end if;
select round_no into v_round from public.order_rounds where restaurant_id=p_restaurant and order_id=p_order and status='draft' for update;
if v_round is null or not exists(select 1 from public.order_items where restaurant_id=p_restaurant and order_id=p_order and round_no=v_round and status='draft')
then raise exception 'Nenhuma rodada com itens para enviar';end if;
for v_recipe in
 select rc.stock_item_id,sum(rc.quantity*oi.quantity)::numeric(14,3) required_quantity
 from public.order_items oi join public.recipe_components rc on rc.restaurant_id=oi.restaurant_id and rc.product_id=oi.product_id
 where oi.restaurant_id=p_restaurant and oi.order_id=p_order and oi.round_no=v_round and oi.status='draft'
 group by rc.stock_item_id order by rc.stock_item_id
loop
update public.stock_items set quantity=quantity-v_recipe.required_quantity
where restaurant_id=p_restaurant and id=v_recipe.stock_item_id and active and quantity>=v_recipe.required_quantity;
if not found then
 select name,quantity into v_name,v_qty from public.stock_items where restaurant_id=p_restaurant and id=v_recipe.stock_item_id;
 raise exception 'Estoque insuficiente ou inativo: % (saldo %)',coalesce(v_name,'não encontrado'),coalesce(v_qty,0);
end if;
insert into public.stock_movements(restaurant_id,stock_item_id,quantity_delta,reason,actor_id,ref_order_id)
values(p_restaurant,v_recipe.stock_item_id,-v_recipe.required_quantity,'sale',p_actor,p_order);
v_count:=v_count+1;
end loop;
update public.order_items set status='queued' where restaurant_id=p_restaurant and order_id=p_order and round_no=v_round and status='draft';
update public.order_rounds set status='submitted',submitted_at=now()
where restaurant_id=p_restaurant and order_id=p_order and round_no=v_round;
update public.orders set submitted_at=coalesce(submitted_at,now()) where restaurant_id=p_restaurant and id=p_order;
perform public.intervalo_round_state(p_restaurant,p_order);
insert into public.order_events(restaurant_id,order_id,actor_id,event,details)
values(p_restaurant,p_order,p_actor,'order_round_submitted',jsonb_build_object('round_no',v_round,'stock_movements',v_count));
return true;
end $$;
revoke all on function public.intervalo_submit_order(uuid,uuid,uuid) from public,anon,authenticated;
grant execute on function public.intervalo_submit_order(uuid,uuid,uuid) to service_role;

create or replace function public.intervalo_advance_round(
 p_restaurant uuid,p_order uuid,p_round integer,p_next text,p_actor uuid)
returns boolean language plpgsql security definer set search_path='' as $$
declare v_old text;
begin
perform 1 from public.orders where restaurant_id=p_restaurant and id=p_order and status not in('closed','cancelled') for update;
if not found then raise exception 'Comanda indisponível';end if;
select status into v_old from public.order_rounds where restaurant_id=p_restaurant and order_id=p_order and round_no=p_round for update;
if not ((v_old='submitted' and p_next='preparing') or(v_old='preparing' and p_next='ready') or(v_old='ready' and p_next='served'))
then raise exception 'Transição de rodada inválida';end if;
update public.order_rounds set status=p_next,
started_at=case when p_next='preparing' then now() else started_at end,
ready_at=case when p_next='ready' then now() else ready_at end,
served_at=case when p_next='served' then now() else served_at end
where restaurant_id=p_restaurant and order_id=p_order and round_no=p_round;
update public.order_items set status=case p_next when 'preparing' then 'preparing' when 'ready' then 'ready' else 'served' end
where restaurant_id=p_restaurant and order_id=p_order and round_no=p_round and status<>'cancelled';
perform public.intervalo_round_state(p_restaurant,p_order);
insert into public.order_events(restaurant_id,order_id,actor_id,event,details)
values(p_restaurant,p_order,p_actor,'round_status_changed',jsonb_build_object('round_no',p_round,'from',v_old,'to',p_next));
return true;
end $$;
revoke all on function public.intervalo_advance_round(uuid,uuid,integer,text,uuid) from public,anon,authenticated;
grant execute on function public.intervalo_advance_round(uuid,uuid,integer,text,uuid) to service_role;

create or replace function public.intervalo_advance_order(
 p_restaurant uuid,p_order uuid,p_next text,p_actor uuid)
returns boolean language plpgsql security definer set search_path='' as $$
declare v_from text;v_round int;v_count int;
begin
v_from:=case p_next when 'preparing' then 'submitted' when 'ready' then 'preparing' when 'served' then 'ready' end;
if v_from is null then raise exception 'Status inválido';end if;
select count(*),min(round_no) into v_count,v_round from public.order_rounds where restaurant_id=p_restaurant and order_id=p_order and status=v_from;
if v_count<>1 then raise exception 'Atualize o app para tratar rodadas separadamente';end if;
return public.intervalo_advance_round(p_restaurant,p_order,v_round,p_next,p_actor);
end $$;
revoke all on function public.intervalo_advance_order(uuid,uuid,text,uuid) from public,anon,authenticated;
grant execute on function public.intervalo_advance_order(uuid,uuid,text,uuid) to service_role;

create or replace function public.intervalo_cancel_open_order(
 p_restaurant uuid,p_order uuid,p_actor uuid,p_reason text default 'Cancelado pelo operador')
returns boolean language plpgsql security definer set search_path='' as $$
declare v_status text;
begin
if p_reason is null or char_length(btrim(p_reason))<3 or char_length(p_reason)>180 then raise exception 'Justificativa inválida';end if;
select status into v_status from public.orders where restaurant_id=p_restaurant and id=p_order for update;
if v_status is distinct from 'open' then raise exception 'Somente comandas nunca enviadas podem ser canceladas';end if;
if exists(select 1 from public.payments where restaurant_id=p_restaurant and order_id=p_order) then raise exception 'Já existe recebimento';end if;
if exists(select 1 from public.order_rounds where restaurant_id=p_restaurant and order_id=p_order and status not in('draft','cancelled'))
then raise exception 'Não é possível cancelar rodadas já enviadas';end if;
update public.order_items set status='cancelled' where restaurant_id=p_restaurant and order_id=p_order and status='draft';
update public.order_rounds set status='cancelled' where restaurant_id=p_restaurant and order_id=p_order and status='draft';
update public.orders set status='cancelled',closed_at=now() where restaurant_id=p_restaurant and id=p_order;
insert into public.order_events(restaurant_id,order_id,actor_id,event,details)
values(p_restaurant,p_order,p_actor,'order_cancelled',jsonb_build_object('reason',btrim(p_reason)));
return true;
end $$;
revoke all on function public.intervalo_cancel_open_order(uuid,uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.intervalo_cancel_open_order(uuid,uuid,uuid,text) to service_role;
