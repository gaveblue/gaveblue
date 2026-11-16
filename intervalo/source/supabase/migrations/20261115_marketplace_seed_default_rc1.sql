-- Intervalo Marketplace 1.1.0-rc.1 — dados iniciais seguros e idempotentes.
-- O cadastro de cada restaurante fica pronto para configurar a loja, SEM receber pedidos.
insert into public.restaurant_storefront (restaurant_id, display_name)
select r.id,r.name from public.restaurants r
on conflict (restaurant_id) do nothing;

insert into public.restaurant_online_settings (restaurant_id, enabled)
select r.id,false from public.restaurants r
on conflict (restaurant_id) do nothing;

-- Importante: nao alterar restaurant_publication.accepts_customer_orders,
-- nao marcar marketplace_visible, nem criar jornadas de compra.
