-- Intervalo 1.1.0-rc.5: perfil e enderecos de consumidores opcionais.
-- Nao altera equipe, comandas, pedidos, pagamento ou lojas online.
-- As tabelas permanecem com RLS e sem acesso para anon.
begin;
alter table public.customer_profiles enable row level security;
alter table public.customer_addresses enable row level security;
revoke all on table public.customer_profiles from anon,authenticated;
revoke all on table public.customer_addresses from anon,authenticated;
grant select on table public.customer_profiles to authenticated;
grant insert (id,display_name,phone) on public.customer_profiles to authenticated;
grant update (display_name,phone,updated_at) on public.customer_profiles to authenticated;
grant select on table public.customer_addresses to authenticated;
grant insert (customer_id,label,street,number,complement,neighborhood,city,state,postal_code,reference) on public.customer_addresses to authenticated;
grant update (label,street,number,complement,neighborhood,city,state,postal_code,reference,updated_at) on public.customer_addresses to authenticated;
grant delete on public.customer_addresses to authenticated;
create policy customer_profiles_read_own on public.customer_profiles for select to authenticated
 using (id=(select auth.uid()));
create policy customer_profiles_insert_own on public.customer_profiles for insert to authenticated
 with check (id=(select auth.uid()));
create policy customer_profiles_update_own on public.customer_profiles for update to authenticated
 using (id=(select auth.uid())) with check (id=(select auth.uid()));
create policy customer_addresses_read_own on public.customer_addresses for select to authenticated
 using (customer_id=(select auth.uid()));
create policy customer_addresses_insert_own on public.customer_addresses for insert to authenticated
 with check (customer_id=(select auth.uid()));
create policy customer_addresses_update_own on public.customer_addresses for update to authenticated
 using (customer_id=(select auth.uid())) with check (customer_id=(select auth.uid()));
create policy customer_addresses_delete_own on public.customer_addresses for delete to authenticated
 using (customer_id=(select auth.uid()));
commit;
