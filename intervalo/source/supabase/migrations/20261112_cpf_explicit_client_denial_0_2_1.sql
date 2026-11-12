begin;
create policy "deny_client_cpf_login_records"
 on public.user_cpf_login for all to anon,authenticated
 using (false) with check (false);
create policy "deny_client_cpf_auth_attempts"
 on public.cpf_login_attempts for all to anon,authenticated
 using (false) with check (false);
commit;