-- Supabase Intervalo: migração aplicada em 2026-11-12 (0.2.0)
-- Projeto: fynaaiazebydorzllwip. Não executar no GB+.
begin;
alter table public.restaurant_members
 add column if not exists display_name text,
 add column if not exists invited_email text;
update public.restaurant_members m set invited_email = lower(btrim(u.email))
 from auth.users u
 where u.id=m.user_id and m.invited_email is null and u.email is not null;
alter table public.restaurant_members add constraint member_display_name_check
 check (display_name is null or char_length(btrim(display_name)) between 2 and 100);
create unique index if not exists restaurant_member_email_unique
 on public.restaurant_members (restaurant_id, lower(invited_email))
 where invited_email is not null and status <> 'revoked';
create table public.restaurant_settings(
 restaurant_id uuid primary key references public.restaurants(id) on delete cascade,
 phone text,
 street text,
 address_number text,
 neighborhood text,
 city text,
 state text,
 postal_code text,
 timezone text not null default 'America/Sao_Paulo'
  check (timezone in ('America/Sao_Paulo','America/Manaus','America/Cuiaba','America/Rio_Branco','America/Belem','America/Fortaleza','America/Recife','America/Noronha')),
 onboarding_completed_at timestamptz,
 updated_at timestamptz not null default now(),
 constraint restaurant_settings_phone_size check (phone is null or char_length(phone)<=30),
 constraint restaurant_settings_address_size check (
  (street is null or char_length(street)<=150)
  and (address_number is null or char_length(address_number)<=30)
  and (neighborhood is null or char_length(neighborhood)<=100)
  and (city is null or char_length(city)<=120)
  and (state is null or state ~ '^[A-Z]{2}$')
  and (postal_code is null or postal_code ~ '^[0-9]{8}$')
 )
);
insert into public.restaurant_settings(restaurant_id)
 select id from public.restaurants on conflict do nothing;
create table public.restaurant_member_module_access(
 restaurant_id uuid not null,
 user_id uuid not null,
 module text not null check(module in ('gestao','garcom','cozinha','caixa','cardapio')),
 allowed boolean not null,
 updated_at timestamptz not null default now(),
 primary key(restaurant_id,user_id,module),
 foreign key(restaurant_id,user_id)
  references public.restaurant_members(restaurant_id,user_id) on delete cascade
);
create index if not exists restaurant_member_module_access_user_idx
 on public.restaurant_member_module_access(user_id,restaurant_id);
alter table public.restaurant_settings enable row level security;
alter table public.restaurant_member_module_access enable row level security;
revoke all on public.restaurant_settings,public.restaurant_member_module_access from anon,authenticated;
grant select on public.restaurant_settings,public.restaurant_member_module_access to authenticated;
create policy "settings_active_member_or_admin"
 on public.restaurant_settings for select to authenticated using (
 exists(select 1 from public.restaurant_members m
   where m.restaurant_id=restaurant_settings.restaurant_id
   and m.user_id=(select auth.uid()) and m.status='active')
 or exists(select 1 from public.platform_admins p
   where p.user_id=(select auth.uid()) and p.active)
);
create policy "module_access_self_or_admin"
 on public.restaurant_member_module_access for select to authenticated using (
 user_id=(select auth.uid())
 or exists(select 1 from public.platform_admins p
   where p.user_id=(select auth.uid()) and p.active)
);
comment on table public.restaurant_member_module_access is
 'Overrides de acesso individuais; sempre validados com membresia ativa, role, status e módulo habilitado no servidor.';
comment on table public.restaurant_settings is
 'Onboarding do restaurante; somente service_role pode alterar; RLS permite leitura a membros ativos.';
commit;
