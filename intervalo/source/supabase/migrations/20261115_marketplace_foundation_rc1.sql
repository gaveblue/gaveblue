-- Intervalo Marketplace 1.1.0-rc.1 | 2026-11-15
-- Estrutura paralela. NÃO habilita vendas, não modifica pedidos presenciais.
-- Acesso a dados pessoais e pedidos: SOMENTE service_role por Edge Function autenticada/autorizada.
create table public.customer_profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null check (char_length(btrim(display_name)) between 2 and 120),
 phone text check (phone is null or char_length(phone) between 10 and 20),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

create table public.customer_addresses (
 id uuid primary key default gen_random_uuid(),
 customer_id uuid not null references public.customer_profiles(id) on delete cascade,
 label text not null default 'Casa' check (char_length(label) between 1 and 45),
 street text not null check (char_length(btrim(street)) between 2 and 160),
 number text not null check (char_length(btrim(number)) between 1 and 25),
 complement text not null default '' check (char_length(complement) <= 120),
 neighborhood text not null check (char_length(btrim(neighborhood)) between 2 and 100),
 city text not null check (char_length(btrim(city)) between 2 and 100),
 state char(2) not null check (state ~ '^[A-Z]{2}$'),
 postal_code char(8) not null check (postal_code ~ '^[0-9]{8}$'),
 reference text not null default '' check (char_length(reference) <= 160),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index customer_addresses_customer_idx on public.customer_addresses(customer_id);

create table public.restaurant_storefront (
 restaurant_id uuid primary key references public.restaurants(id) on delete cascade,
 display_name text check(display_name is null or char_length(btrim(display_name)) between 2 and 120),
 description text not null default '' check(char_length(description)<=1000),
 cuisine_tags text[] not null default '{}'::text[] check(cardinality(cuisine_tags)<=12),
 logo_url text check(logo_url is null or (length(logo_url)<=1200 and logo_url ~ '^https://')),
 banner_url text check(banner_url is null or (length(banner_url)<=1200 and banner_url ~ '^https://')),
 marketplace_visible boolean not null default false,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index restaurant_storefront_visible_idx on public.restaurant_storefront(marketplace_visible) where marketplace_visible;

create table public.restaurant_online_settings (
 restaurant_id uuid primary key references public.restaurants(id) on delete cascade,
 enabled boolean not null default false,
 delivery_enabled boolean not null default true,
 pickup_enabled boolean not null default true,
 paused boolean not null default false,
 minimum_order_cents bigint not null default 0 check(minimum_order_cents between 0 and 100000000),
 estimated_prep_minutes integer not null default 30 check(estimated_prep_minutes between 5 and 240),
 acceptance_timeout_minutes integer not null default 10 check(acceptance_timeout_minutes between 2 and 60),
 notes text not null default '' check(char_length(notes)<=500),
 updated_at timestamptz not null default now(),
 check (delivery_enabled or pickup_enabled)
);

create table public.restaurant_business_hours (
 id uuid primary key default gen_random_uuid(),
 restaurant_id uuid not null references public.restaurants(id) on delete cascade,
 weekday smallint not null check(weekday between 0 and 6),
 opens_at time not null,
 closes_at time not null,
 active boolean not null default true,
 delivery_enabled boolean not null default true,
 pickup_enabled boolean not null default true,
 unique(restaurant_id,weekday,opens_at,closes_at),
 check (opens_at <> closes_at)
);
create index restaurant_business_hours_day_idx on public.restaurant_business_hours(restaurant_id,weekday);

create table public.restaurant_delivery_zones (
 id uuid primary key default gen_random_uuid(),
 restaurant_id uuid not null references public.restaurants(id) on delete cascade,
 name text not null check(char_length(btrim(name)) between 2 and 90),
 city text not null check(char_length(btrim(city)) between 2 and 100),
 state char(2) not null check(state ~ '^[A-Z]{2}$'),
 postal_code_from char(8) check(postal_code_from is null or postal_code_from ~ '^[0-9]{8}$'),
 postal_code_to char(8) check(postal_code_to is null or postal_code_to ~ '^[0-9]{8}$'),
 neighborhoods text[] not null default '{}'::text[] check(cardinality(neighborhoods)<=80),
 fee_cents bigint not null default 0 check(fee_cents between 0 and 10000000),
 minimum_order_cents bigint not null default 0 check(minimum_order_cents between 0 and 100000000),
 estimated_delivery_minutes integer not null default 40 check(estimated_delivery_minutes between 5 and 240),
 active boolean not null default false,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 check((postal_code_from is null and postal_code_to is null) or
       (postal_code_from is not null and postal_code_to is not null and postal_code_from<=postal_code_to)),
 unique(restaurant_id,id)
);
create index restaurant_delivery_zones_restaurant_idx on public.restaurant_delivery_zones(restaurant_id,active);

-- Não reusar orders.table_id: obrigatório no ciclo de comandas presenciais.
create table public.online_orders (
 id uuid primary key default gen_random_uuid(),
 restaurant_id uuid not null references public.restaurants(id) on delete restrict,
 customer_id uuid references public.customer_profiles(id) on delete set null,
 public_code text not null check(char_length(public_code) between 6 and 30),
 checkout_key uuid not null,
 source text not null check(source in ('marketplace','storefront')),
 fulfillment_type text not null check(fulfillment_type in ('delivery','pickup')),
 status text not null default 'pending_acceptance'
   check(status in ('pending_acceptance','accepted','preparing','ready','ready_for_pickup','out_for_delivery','delivered','picked_up','rejected','cancelled','expired')),
 payment_status text not null default 'unpaid'
   check(payment_status in ('unpaid','payment_pending','paid','refunded','partially_refunded')),
 payment_method text not null check(payment_method in ('cash','pix_on_delivery','card_on_delivery','cash_on_pickup','pix_on_pickup','card_on_pickup')),
 customer_name text not null check(char_length(btrim(customer_name)) between 2 and 120),
 customer_phone text not null check(char_length(customer_phone) between 10 and 20),
 delivery_address jsonb check(delivery_address is null or (jsonb_typeof(delivery_address)='object' and pg_column_size(delivery_address)<=4096)),
 delivery_zone_id uuid,
 customer_note text not null default '' check(char_length(customer_note)<=500),
 subtotal_cents bigint not null check(subtotal_cents between 0 and 100000000),
 delivery_fee_cents bigint not null default 0 check(delivery_fee_cents between 0 and 10000000),
 discount_cents bigint not null default 0 check(discount_cents between 0 and 100000000),
 total_cents bigint not null check(total_cents between 0 and 110000000),
 created_at timestamptz not null default now(),
 accepted_at timestamptz,prepared_at timestamptz,dispatched_at timestamptz,fulfilled_at timestamptz,cancelled_at timestamptz,
 updated_at timestamptz not null default now(),
 unique(restaurant_id,id),
 unique(restaurant_id,public_code),
 unique(restaurant_id,checkout_key),
 foreign key(restaurant_id,delivery_zone_id) references public.restaurant_delivery_zones(restaurant_id,id) on delete restrict,
 check(total_cents=subtotal_cents+delivery_fee_cents-discount_cents),
 check(discount_cents<=subtotal_cents+delivery_fee_cents),
 check((fulfillment_type='delivery' and delivery_address is not null) or
       (fulfillment_type='pickup' and delivery_address is null and delivery_fee_cents=0))
);
create index online_orders_restaurant_queue_idx on public.online_orders(restaurant_id,status,created_at desc);
create index online_orders_customer_idx on public.online_orders(customer_id,created_at desc) where customer_id is not null;

create table public.online_order_items (
 id uuid primary key default gen_random_uuid(),
 restaurant_id uuid not null,
 order_id uuid not null,
 product_id uuid,
 product_name text not null check(char_length(btrim(product_name)) between 2 and 150),
 unit_price_cents bigint not null check(unit_price_cents between 0 and 100000000),
 options_snapshot jsonb not null default '[]'::jsonb
    check(jsonb_typeof(options_snapshot)='array' and pg_column_size(options_snapshot)<=8192),
 options_unit_cents bigint not null default 0 check(options_unit_cents between 0 and 10000000),
 quantity smallint not null check(quantity between 1 and 99),
 line_total_cents bigint not null check(line_total_cents between 0 and 110000000),
 note text not null default '' check(char_length(note)<=350),
 created_at timestamptz not null default now(),
 foreign key(restaurant_id,order_id) references public.online_orders(restaurant_id,id) on delete restrict,
 foreign key(restaurant_id,product_id) references public.menu_products(restaurant_id,id) on delete restrict,
 check(line_total_cents=(unit_price_cents+options_unit_cents)*quantity)
);
create index online_order_items_order_idx on public.online_order_items(restaurant_id,order_id);

create table public.online_order_events (
 id uuid primary key default gen_random_uuid(),
 restaurant_id uuid not null,
 order_id uuid not null,
 actor_user_id uuid references auth.users(id) on delete set null,
 event text not null check(char_length(event) between 3 and 70),
 from_status text,
 to_status text,
 details jsonb not null default '{}'::jsonb check(jsonb_typeof(details)='object' and pg_column_size(details)<=4096),
 created_at timestamptz not null default now(),
 foreign key(restaurant_id,order_id) references public.online_orders(restaurant_id,id) on delete restrict
);
create index online_order_events_order_idx on public.online_order_events(restaurant_id,order_id,created_at);

create table public.online_order_payments (
 id uuid primary key default gen_random_uuid(),
 restaurant_id uuid not null,
 order_id uuid not null,
 method text not null check(method in ('cash','pix','card','online_gateway')),
 status text not null default 'pending' check(status in ('pending','confirmed','failed','refunded')),
 amount_cents bigint not null check(amount_cents between 1 and 110000000),
 recorded_by uuid references auth.users(id) on delete set null,
 external_reference text check(external_reference is null or char_length(external_reference)<=150),
 created_at timestamptz not null default now(),
 confirmed_at timestamptz,
 foreign key(restaurant_id,order_id) references public.online_orders(restaurant_id,id) on delete restrict
);
create index online_order_payments_order_idx on public.online_order_payments(restaurant_id,order_id);

-- Nunca guardar o token em claro: SHA-256 hex, não um código numérico enumerável.
create table public.online_order_tracking_tokens (
 id uuid primary key default gen_random_uuid(),
 restaurant_id uuid not null,
 order_id uuid not null,
 token_hash char(64) not null unique check(token_hash ~ '^[0-9a-f]{64}$'),
 expires_at timestamptz not null,
 revoked_at timestamptz,
 created_at timestamptz not null default now(),
 foreign key(restaurant_id,order_id) references public.online_orders(restaurant_id,id) on delete restrict,
 check(expires_at>created_at)
);
create index online_order_tracking_order_idx on public.online_order_tracking_tokens(restaurant_id,order_id,expires_at);

-- Isolamento da API pública. Nenhuma policy = acesso de visitantes negado por padrão.
-- Todas as operações sensíveis futuramente mediadas por funções com validação por restaurante.
do $$
declare t text;
begin
 foreach t in array array[
  'customer_profiles','customer_addresses','restaurant_storefront','restaurant_online_settings',
  'restaurant_business_hours','restaurant_delivery_zones','online_orders','online_order_items',
  'online_order_events','online_order_payments','online_order_tracking_tokens'
 ] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('revoke all on table public.%I from public, anon, authenticated',t);
  execute format('grant select,insert,update,delete on table public.%I to service_role',t);
 end loop;
end $$;

comment on table public.online_orders is 'Pedidos de marketplace/loja próprios, independentes de orders.table_id. Vendas online OFF até piloto homologado.';
comment on table public.restaurant_online_settings is 'Configuração de vendas online desligada por padrão; exige também restaurant_publication.accepts_customer_orders.';
comment on table public.online_order_tracking_tokens is 'Token em SHA-256, nunca armazenar token puro. Apenas acesso privilegiado por API.';

-- Não modificar restaurant_publication, restaurant_members, orders, payments nem funções presenciais.
