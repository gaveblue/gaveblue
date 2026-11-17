-- Aplicada no Supabase Intervalo como 20261117164632.
create table public.restaurant_print_templates (
 restaurant_id uuid primary key references public.restaurants(id) on delete cascade,
 config jsonb not null default '{}'::jsonb check (jsonb_typeof(config)='object' and octet_length(config::text)<=18000),
 updated_at timestamptz not null default now()
);
alter table public.restaurant_print_templates enable row level security;
revoke all on public.restaurant_print_templates from public,anon,authenticated;
grant select,insert,update on public.restaurant_print_templates to service_role;
