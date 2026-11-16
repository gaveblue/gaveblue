-- Intervalo 1.1.0-rc.8: estrutura isolada por restaurante para InfinitePay.
-- NAO habilita pagamentos e NAO armazena API Keys no banco/front-end.
create table if not exists public.restaurant_payment_gateways(
  restaurant_id uuid not null references public.restaurants(id) on delete restrict,
  provider text not null check(provider in ('infinitepay')),
  handle text,
  enabled boolean not null default false,
  secret_env_name text,
  configured_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  primary key(restaurant_id,provider),
  constraint restaurant_payment_gateway_handle_check check
    (handle is null or handle ~ '^[A-Za-z0-9][A-Za-z0-9_.-]{1,63}$'),
  constraint restaurant_payment_gateway_secret_env_check check
    (secret_env_name is null or secret_env_name ~ '^INFINITEPAY_[A-Z0-9_]+_API_KEY$'),
  constraint restaurant_payment_gateway_enabled_check check
    (not enabled or (handle is not null and secret_env_name is not null))
);
comment on table public.restaurant_payment_gateways is
 'Configuração não secreta por estabelecimento; a API Key fica apenas em Supabase Edge Function Secrets.';
create table if not exists public.online_payment_attempts(
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null,
  order_id uuid not null,
  provider text not null default 'infinitepay' check(provider in ('infinitepay')),
  order_nsu text not null,
  invoice_slug text,
  transaction_nsu text,
  payment_url text,
  expected_amount_cents bigint not null check(expected_amount_cents between 100 and 110000000),
  paid_amount_cents bigint check(paid_amount_cents is null or paid_amount_cents>=0),
  state text not null default 'created'
    check(state in ('created','link_ready','pending','paid','failed','refunded','cancelled')),
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint online_payment_attempts_order_fkey foreign key(restaurant_id,order_id)
    references public.online_orders(restaurant_id,id) on delete restrict,
  unique(restaurant_id,order_id,provider),
  unique(provider,order_nsu),
  unique(provider,transaction_nsu)
);
create index if not exists online_payment_attempts_restaurant_state_idx
  on public.online_payment_attempts(restaurant_id,state,created_at desc);
comment on table public.online_payment_attempts is
 'Tentativas e conciliação auditáveis de pagamentos online; sem credenciais de provedores.';
create table if not exists public.online_payment_events(
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete restrict,
  attempt_id uuid references public.online_payment_attempts(id) on delete restrict,
  provider text not null default 'infinitepay' check(provider in ('infinitepay')),
  provider_event text not null check(char_length(provider_event) between 3 and 60),
  verified boolean not null default false,
  transaction_nsu text,
  occurred_at timestamptz not null default now()
);
create index if not exists online_payment_events_attempt_idx
  on public.online_payment_events(restaurant_id,attempt_id,occurred_at desc);
alter table public.restaurant_payment_gateways enable row level security;
alter table public.online_payment_attempts enable row level security;
alter table public.online_payment_events enable row level security;
-- Dados financeiros acessíveis apenas via Edge Functions autenticadas/service_role.
revoke all on public.restaurant_payment_gateways from public,anon,authenticated;
revoke all on public.online_payment_attempts from public,anon,authenticated;
revoke all on public.online_payment_events from public,anon,authenticated;
grant select,insert,update,delete on public.restaurant_payment_gateways to service_role;
grant select,insert,update,delete on public.online_payment_attempts to service_role;
grant select,insert,update,delete on public.online_payment_events to service_role;
-- Apenas Novo Mundo ganha uma linha preparada, sem handle, chave ou ativação.
insert into public.restaurant_payment_gateways(restaurant_id,provider,secret_env_name,enabled)
select id,'infinitepay','INFINITEPAY_NOVO_MUNDO_API_KEY',false
from public.restaurants where slug='novo-mundo'
on conflict(restaurant_id,provider) do nothing;
