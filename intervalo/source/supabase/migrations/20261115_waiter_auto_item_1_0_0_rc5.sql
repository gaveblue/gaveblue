-- Intervalo 1.0.0-rc.5 — adicionar item com abertura automática e transacional da comanda
-- Chamável SOMENTE pela Edge Function restaurant-core (service_role).
-- A validação de permissões do papel/módulo permanece na Edge Function.
begin;

create or replace function public.intervalo_add_item_auto(
  p_restaurant uuid,
  p_table uuid,
  p_product uuid,
  p_quantity integer,
  p_note text,
  p_actor uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order uuid;
  v_status text;
  v_item uuid;
  v_created boolean := false;
begin
  if p_quantity is null or p_quantity not between 1 and 99
     or char_length(coalesce(p_note,'')) > 350 then
    raise exception 'Quantidade ou observação inválida';
  end if;

  -- A mesa trava a operação para que dois garçons não criem duas comandas.
  perform 1
    from public.restaurant_tables t
   where t.id = p_table
     and t.restaurant_id = p_restaurant
     and t.active = true
   for update;
  if not found then
    raise exception 'Mesa não encontrada ou desativada';
  end if;

  if not exists(
    select 1 from public.restaurant_members m
    where m.restaurant_id=p_restaurant and m.user_id=p_actor and m.status='active'
  ) then
    raise exception 'Atendente não está ativo neste restaurante';
  end if;

  -- Rejeitar produto inválido ANTES de tentar criar comanda.
  if not exists(
    select 1
      from public.menu_products p
      join public.menu_categories c
        on c.restaurant_id=p.restaurant_id and c.id=p.category_id
     where p.restaurant_id=p_restaurant
       and p.id=p_product and p.available=true and c.active=true
  ) then
    raise exception 'Produto indisponível';
  end if;

  select o.id,o.status into v_order,v_status
    from public.orders o
   where o.restaurant_id=p_restaurant and o.table_id=p_table
     and o.status in ('open','submitted','preparing','ready','served')
   order by o.opened_at desc
   limit 1
   for update;

  if v_order is not null and v_status <> 'open' then
    raise exception 'Esta mesa já tem uma comanda enviada. Aguarde o fechamento para um novo lançamento';
  end if;

  if v_order is null then
    v_order := public.intervalo_open_order(p_restaurant,p_table,p_actor);
    v_created := true;
  end if;

  -- As duas operações rodam na MESMA transação do banco.
  -- Qualquer falha aqui desfaz também a abertura da comanda.
  v_item := public.intervalo_add_order_item(
    p_restaurant,v_order,p_product,p_quantity,coalesce(p_note,''),p_actor
  );

  return jsonb_build_object(
    'order_id',v_order,'item_id',v_item,'created',v_created
  );
end;
$$;

revoke all on function public.intervalo_add_item_auto(uuid,uuid,uuid,integer,text,uuid)
  from public,anon,authenticated;
grant execute on function public.intervalo_add_item_auto(uuid,uuid,uuid,integer,text,uuid)
  to service_role;

commit;
