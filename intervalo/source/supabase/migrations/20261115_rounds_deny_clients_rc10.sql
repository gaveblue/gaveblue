-- Defesa explícita: dados de rodadas acessíveis apenas pela Edge Function (service_role).
create policy deny_clients_order_rounds on public.order_rounds
 for all to anon,authenticated using(false) with check(false);
