-- Intervalo v0.9.1 — recuperação do provisionamento independente de SMTP.
-- Aplicado via SQL no Supabase exclusivo fynaaiazebydorzllwip em 2026-11-12.
-- Este script é reexecutável quanto ao objeto, não cria usuários Auth automaticamente.
begin;
create table if not exists public.restaurant_master_setup (
 restaurant_id uuid primary key references public.restaurants(id) on delete cascade,
 master_email text not null check(length(master_email) between 5 and 254),
 status text not null default 'awaiting_account' check(status in ('awaiting_account','linked')),
 linked_user_id uuid references auth.users(id) on delete set null,
 updated_at timestamptz not null default now()
);
alter table public.restaurant_master_setup enable row level security;
drop policy if exists "deny_client_master_setup" on public.restaurant_master_setup;
create policy "deny_client_master_setup" on public.restaurant_master_setup for all to anon,authenticated using(false) with check(false);
revoke all on public.restaurant_master_setup from public,anon,authenticated;
grant select,insert,update,delete on public.restaurant_master_setup to service_role;
comment on table public.restaurant_master_setup is 'Configuração do Master pendente, sem depender do Auth SMTP; leitura e escrita somente backend.';

CREATE OR REPLACE FUNCTION public.intervalo_create_restaurant(p_admin uuid, p_name text, p_slug text, p_email text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare v_restaurant uuid; v_name text:=btrim(coalesce(p_name,''));v_slug text:=btrim(coalesce(p_slug,''));v_email text:=nullif(lower(btrim(coalesce(p_email,''))),'');
begin
 if not exists (select 1 from public.platform_admins where user_id=p_admin and active) then raise exception 'SUPER_ADMIN_REQUIRED';end if;
 if char_length(v_name) not between 2 and 120 or char_length(v_slug) not between 3 and 60
 or v_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$'
 or v_slug = any(array['admin','login','api','auth','assets','static','app','ativar','redefinir','manifest','suporte','cadastro','entrar','sair','inicio','configuracoes','www','recuperar-senha','trocar-senha','minha-conta'])
 or (v_email is not null and (char_length(v_email) not between 5 and 254 or v_email !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'))
 then raise exception 'INVALID_RESTAURANT_INPUT';end if;
 insert into public.restaurants(name,slug,status) values(v_name,v_slug,'active') returning id into v_restaurant;
 insert into public.restaurant_modules(restaurant_id,module,enabled)
 select v_restaurant,m,(m='gestao') from unnest(array['gestao','garcom','cozinha','caixa','cardapio']) as m;
 insert into public.restaurant_settings(restaurant_id) values(v_restaurant) on conflict do nothing;
 insert into public.restaurant_publication(restaurant_id,is_published,accepts_customer_orders) values(v_restaurant,false,false) on conflict do nothing;
 insert into public.restaurant_subscriptions(restaurant_id,status) values(v_restaurant,'trial') on conflict do nothing;
 if v_email is not null then
  insert into public.restaurant_master_setup(restaurant_id,master_email) values(v_restaurant,v_email);
 end if;
 insert into public.audit_logs(restaurant_id,actor_user_id,event,details)
 values(v_restaurant,p_admin,'restaurant_created_master_pending',jsonb_build_object('slug',v_slug,'master_setup',case when v_email is null then 'not_configured' else 'awaiting_account' end));
 return jsonb_build_object('id',v_restaurant,'name',v_name,'slug',v_slug,'status','active','master_email_configured',v_email is not null);
end;$function$

CREATE OR REPLACE FUNCTION public.intervalo_assign_master(p_admin uuid, p_restaurant uuid, p_user uuid, p_email text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare v_email text;v_status text;v_linked uuid;v_existing_role text;v_existing_status text;v_expires timestamptz:=now()+interval '7 days';
begin
 if not exists(select 1 from public.platform_admins where user_id=p_admin and active) then raise exception 'SUPER_ADMIN_REQUIRED';end if;
 select master_email,status,linked_user_id into v_email,v_status,v_linked
 from public.restaurant_master_setup where restaurant_id=p_restaurant for update;
 if v_email is null then raise exception 'MASTER_SETUP_NOT_FOUND';end if;
 if lower(btrim(p_email))<>v_email then raise exception 'EMAIL_MISMATCH';end if;
 if v_status='linked' and v_linked is distinct from p_user then raise exception 'MASTER_ALREADY_ASSIGNED';end if;
 select role,status into v_existing_role,v_existing_status
 from public.restaurant_members where restaurant_id=p_restaurant and user_id=p_user for update;
 if v_existing_role is null then
  insert into public.restaurant_members(restaurant_id,user_id,role,status,invited_email,invite_expires_at)
  values(p_restaurant,p_user,'master','pending',v_email,v_expires);
 elsif v_existing_role='master' and v_existing_status='pending' then
  update public.restaurant_members set invite_expires_at=v_expires
  where restaurant_id=p_restaurant and user_id=p_user;
 elsif v_existing_role='master' and v_existing_status='active' then
  v_expires:=null;
 else
  raise exception 'EXISTING_MEMBERSHIP_CONFLICT';
 end if;
 update public.restaurant_master_setup set status='linked',linked_user_id=p_user,updated_at=now()
 where restaurant_id=p_restaurant;
 insert into public.audit_logs(restaurant_id,actor_user_id,event,details)
 values(p_restaurant,p_admin,'master_account_linked',jsonb_build_object('target_user_id',p_user,'email_matching',true));
 return jsonb_build_object('linked',true,'user_id',p_user,'invite_expires_at',v_expires);
end;$function$

revoke all on function public.intervalo_create_restaurant(uuid,text,text,text) from public,anon,authenticated;
grant execute on function public.intervalo_create_restaurant(uuid,text,text,text) to service_role;
revoke all on function public.intervalo_assign_master(uuid,uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.intervalo_assign_master(uuid,uuid,uuid,text) to service_role;
commit;
