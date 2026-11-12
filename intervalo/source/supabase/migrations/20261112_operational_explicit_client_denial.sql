begin;
do $$
declare tab text;
begin
 foreach tab in array array[
 'menu_categories','menu_products','menu_product_options','restaurant_publication',
 'restaurant_tables','orders','order_items','order_events','cash_sessions','payments',
 'stock_items','recipe_components','stock_movements','printer_devices','print_jobs',
 'subscription_plans','restaurant_subscriptions'
 ] loop
 execute format('create policy %I on public.%I for all to anon,authenticated using (false) with check (false)',
                'deny_clients_'||tab,tab);
 end loop;
end $$;
commit;