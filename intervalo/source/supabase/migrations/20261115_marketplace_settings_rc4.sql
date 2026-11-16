-- Intervalo Marketplace · Horários em lote, liberação explícita e auditoria da loja.
create table if not exists public.online_sales_activations (
 id uuid primary key default gen_random_uuid(),
 restaurant_id uuid not null references public.restaurants(id) on delete restrict,
 actor_user_id uuid references auth.users(id) on delete set null,
 enabled boolean not null,
 created_at timestamptz not null default now()
);
alter table public.online_sales_activations enable row level security;
revoke all on public.online_sales_activations from public,anon,authenticated;
grant select,insert,update,delete on public.online_sales_activations to service_role;

create or replace function public.marketplace_replace_hours(p_restaurant uuid,p_hours jsonb)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare v_item jsonb;v_weekday integer;v_from time;v_until time;v_count integer:=0;
begin
 if jsonb_typeof(p_hours)<>'array' or jsonb_array_length(p_hours)>28 then
  raise exception 'Horários inválidos';end if;
 -- Valida tudo antes de remover os registros anteriores.
 for v_item in select value from jsonb_array_elements(p_hours) loop
  if jsonb_typeof(v_item)<>'object' or coalesce(v_item->>'weekday','') !~ '^[0-6]$'
    or coalesce(v_item->>'opens_at','') !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
    or coalesce(v_item->>'closes_at','') !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
  then raise exception 'Formato de horário inválido';end if;
  v_weekday:=(v_item->>'weekday')::integer;
  v_from:=(v_item->>'opens_at')::time;v_until:=(v_item->>'closes_at')::time;
  if v_from=v_until then raise exception 'Abertura e fechamento não podem ser iguais';end if;
  if jsonb_typeof(v_item->'delivery_enabled') not in ('true','false') or
     jsonb_typeof(v_item->'pickup_enabled') not in ('true','false') then
   raise exception 'Modalidade de horário inválida';end if;
 end loop;
 delete from public.restaurant_business_hours where restaurant_id=p_restaurant;
 for v_item in select value from jsonb_array_elements(p_hours) loop
  insert into public.restaurant_business_hours
    (restaurant_id,weekday,opens_at,closes_at,active,delivery_enabled,pickup_enabled)
  values(p_restaurant,(v_item->>'weekday')::integer,(v_item->>'opens_at')::time,
   (v_item->>'closes_at')::time,true,
   (v_item->>'delivery_enabled')::boolean,(v_item->>'pickup_enabled')::boolean);
  v_count:=v_count+1;
 end loop;
 return jsonb_build_object('saved',true,'hours',v_count);
end $$;
revoke all on function public.marketplace_replace_hours(uuid,jsonb) from public,anon,authenticated;
grant execute on function public.marketplace_replace_hours(uuid,jsonb) to service_role;

create or replace function public.marketplace_set_sales_enabled(
 p_restaurant uuid,p_actor uuid,p_enabled boolean
) returns jsonb language plpgsql security invoker set search_path='' as $$
declare v_settings record;v_pub record;v_modules record;v_rest record;v_hours integer;v_zones integer;
begin
 select status into v_rest from public.restaurants where id=p_restaurant for update;
 select delivery_enabled,pickup_enabled,paused into v_settings from public.restaurant_online_settings where restaurant_id=p_restaurant for update;
 select is_published,accepts_customer_orders into v_pub from public.restaurant_publication where restaurant_id=p_restaurant for update;
 select enabled into v_modules from public.restaurant_modules where restaurant_id=p_restaurant and module='cardapio';
 if v_rest.status<>'active' or v_settings is null or v_pub is null
 then raise exception 'Restaurante indisponível';end if;
 if p_enabled then
  if v_pub.is_published is distinct from true or v_modules.enabled is distinct from true
   then raise exception 'Publique o cardápio antes de ativar pedidos';end if;
  if v_settings.paused then raise exception 'Loja pausada. Retire a pausa antes de ativar';end if;
  select count(*) into v_hours from public.restaurant_business_hours
   where restaurant_id=p_restaurant and active;
  if v_hours=0 then raise exception 'Configure os horários antes de ativar pedidos';end if;
  if v_settings.delivery_enabled then
   select count(*) into v_zones from public.restaurant_delivery_zones
   where restaurant_id=p_restaurant and active;
   if v_zones=0 then raise exception 'Cadastre uma região de entrega ativa';end if;
  end if;
 end if;
 update public.restaurant_online_settings set enabled=p_enabled,updated_at=now() where restaurant_id=p_restaurant;
 update public.restaurant_publication set accepts_customer_orders=p_enabled,updated_at=now() where restaurant_id=p_restaurant;
 insert into public.online_sales_activations(restaurant_id,actor_user_id,enabled) values(p_restaurant,p_actor,p_enabled);
 return jsonb_build_object('enabled',p_enabled,'updated',true);
end $$;
revoke all on function public.marketplace_set_sales_enabled(uuid,uuid,boolean) from public,anon,authenticated;
grant execute on function public.marketplace_set_sales_enabled(uuid,uuid,boolean) to service_role;
