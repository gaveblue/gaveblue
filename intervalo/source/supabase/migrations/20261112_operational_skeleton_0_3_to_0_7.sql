-- Intervalo: esquema operacional multiempresa 0.3.0-0.7.0. Projeto fynaaiazebydorzllwip apenas.
begin;
create table public.menu_categories (
 id uuid primary key default gen_random_uuid(),
 restaurant_id uuid not null references public.restaurants(id) on delete cascade,
 name text not null check(char_length(btrim(name)) between 2 and 90),
 sort_order integer not null default 0,
 active boolean not null default true,
 created_at timestamptz not null default now(),
 unique(restaurant_id,id)
);
create index menu_categories_tenant_idx on public.menu_categories(restaurant_id,sort_order);

create table public.menu_products (
 id uuid primary key default gen_random_uuid(),
 restaurant_id uuid not null references public.restaurants(id) on delete cascade,
 category_id uuid not null,
 name text not null check(char_length(btrim(name)) between 2 and 150),
 description text not null default '' check(char_length(description)<=1000),
 price_cents bigint not null check(price_cents between 0 and 100000000),
 available boolean not null default true,
 sort_order integer not null default 0,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(restaurant_id,id),
 foreign key(restaurant_id,category_id) references public.menu_categories(restaurant_id,id) on delete restrict
);
create index menu_products_tenant_category on public.menu_products(restaurant_id,category_id,sort_order);

create table public.menu_product_options (
 id uuid primary key default gen_random_uuid(),
 restaurant_id uuid not null references public.restaurants(id) on delete cascade,
 product_id uuid not null,
 name text not null check(char_length(btrim(name)) between 2 and 120),
 price_delta_cents bigint not null default 0 check(price_delta_cents between 0 and 10000000),
 available boolean not null default true,
 sort_order integer not null default 0,
 unique(restaurant_id,id),
 foreign key(restaurant_id,product_id) references public.menu_products(restaurant_id,id) on delete cascade
);
create index menu_options_product on public.menu_product_options(restaurant_id,product_id);

create table public.restaurant_publication (
 restaurant_id uuid primary key references public.restaurants(id) on delete cascade,
 is_published boolean not null default false,
 accepts_customer_orders boolean not null default false,
 updated_at timestamptz not null default now()
);
insert into public.restaurant_publication(restaurant_id)
 select id from public.restaurants on conflict do nothing;

create table public.restaurant_tables (
 id uuid primary key default gen_random_uuid(),
 restaurant_id uuid not null references public.restaurants(id) on delete cascade,
 label text not null check(char_length(btrim(label)) between 1 and 45),
 area text not null default 'Salão' check(char_length(btrim(area)) between 1 and 60),
 seats smallint not null default 4 check(seats between 1 and 50),
 active boolean not null default true,
 created_at timestamptz not null default now(),
 unique(restaurant_id,id),
 unique(restaurant_id,label)
);

create table public.orders (
 id uuid primary key default gen_random_uuid(),
 restaurant_id uuid not null references public.restaurants(id) on delete cascade,
 table_id uuid not null,
 status text not null default 'open' check(status in ('open','submitted','preparing','ready','served','closed','cancelled')),
 opened_by uuid references auth.users(id) on delete set null,
 note text not null default '' check(char_length(note)<=500),
 opened_at timestamptz not null default now(),
 submitted_at timestamptz,
 closed_at timestamptz,
 unique(restaurant_id,id),
 foreign key(restaurant_id,table_id) references public.restaurant_tables(restaurant_id,id) on delete restrict
);
create unique index orders_one_active_per_table on public.orders(restaurant_id,table_id)
 where status in ('open','submitted','preparing','ready','served');
create index orders_tenant_status on public.orders(restaurant_id,status,opened_at desc);

create table public.order_items (
 id uuid primary key default gen_random_uuid(),
 restaurant_id uuid not null references public.restaurants(id) on delete cascade,
 order_id uuid not null,
 product_id uuid,
 product_name text not null check(char_length(product_name) between 2 and 150),
 unit_price_cents bigint not null check(unit_price_cents between 0 and 100000000),
 quantity smallint not null check(quantity between 1 and 99),
 note text not null default '' check(char_length(note)<=350),
 status text not null default 'draft' check(status in ('draft','queued','preparing','ready','served','cancelled')),
 created_at timestamptz not null default now(),
 unique(restaurant_id,id),
 foreign key(restaurant_id,order_id) references public.orders(restaurant_id,id) on delete cascade,
 foreign key(restaurant_id,product_id) references public.menu_products(restaurant_id,id) on delete restrict
);
create index order_items_tenant_order on public.order_items(restaurant_id,order_id);

create table public.order_events (
 id bigint generated always as identity primary key,
 restaurant_id uuid not null references public.restaurants(id) on delete cascade,
 order_id uuid not null,
 actor_id uuid references auth.users(id) on delete set null,
 event text not null check(char_length(event) between 3 and 80),
 details jsonb not null default '{}'::jsonb,
 at timestamptz not null default now(),
 foreign key(restaurant_id,order_id) references public.orders(restaurant_id,id) on delete cascade
);
create index order_events_tenant_order on public.order_events(restaurant_id,order_id,at desc);

create table public.cash_sessions (
 id uuid primary key default gen_random_uuid(),
 restaurant_id uuid not null references public.restaurants(id) on delete cascade,
 opened_by uuid references auth.users(id) on delete set null,
 closed_by uuid references auth.users(id) on delete set null,
 status text not null default 'open' check(status in ('open','closed')),
 starting_cash_cents bigint not null default 0 check(starting_cash_cents between 0 and 10000000000),
 counted_cash_cents bigint check(counted_cash_cents between 0 and 10000000000),
 opened_at timestamptz not null default now(),
 closed_at timestamptz,
 unique(restaurant_id,id)
);
create unique index only_one_open_cash_session on public.cash_sessions(restaurant_id) where status='open';

create table public.payments (
 id uuid primary key default gen_random_uuid(),
 restaurant_id uuid not null references public.restaurants(id) on delete cascade,
 order_id uuid not null,
 cash_session_id uuid,
 method text not null check(method in ('cash','debit_recorded','credit_recorded','pix_recorded','other_recorded')),
 amount_cents bigint not null check(amount_cents>0),
 recorded_by uuid references auth.users(id) on delete set null,
 at timestamptz not null default now(),
 foreign key(restaurant_id,order_id) references public.orders(restaurant_id,id) on delete restrict,
 foreign key(restaurant_id,cash_session_id) references public.cash_sessions(restaurant_id,id) on delete restrict
);
create index payments_order on public.payments(restaurant_id,order_id,at desc);

create table public.stock_items (
 id uuid primary key default gen_random_uuid(),
 restaurant_id uuid not null references public.restaurants(id) on delete cascade,
 name text not null check(char_length(btrim(name)) between 2 and 120),
 unit text not null default 'un' check(unit in ('un','kg','g','l','ml')),
 quantity numeric(14,3) not null default 0,
 min_quantity numeric(14,3) not null default 0 check(min_quantity>=0),
 active boolean not null default true,
 unique(restaurant_id,id)
);
create table public.recipe_components (
 id uuid primary key default gen_random_uuid(),
 restaurant_id uuid not null references public.restaurants(id) on delete cascade,
 product_id uuid not null,
 stock_item_id uuid not null,
 quantity numeric(14,3) not null check(quantity>0),
 unique(restaurant_id,product_id,stock_item_id),
 foreign key(restaurant_id,product_id) references public.menu_products(restaurant_id,id) on delete cascade,
 foreign key(restaurant_id,stock_item_id) references public.stock_items(restaurant_id,id) on delete restrict
);
create table public.stock_movements (
 id uuid primary key default gen_random_uuid(),
 restaurant_id uuid not null references public.restaurants(id) on delete cascade,
 stock_item_id uuid not null,
 quantity_delta numeric(14,3) not null check(quantity_delta<>0),
 reason text not null check(reason in ('receive','sale','waste','adjustment','reversal')),
 actor_id uuid references auth.users(id) on delete set null,
 ref_order_id uuid,
 created_at timestamptz not null default now(),
 foreign key(restaurant_id,stock_item_id) references public.stock_items(restaurant_id,id) on delete restrict,
 foreign key(restaurant_id,ref_order_id) references public.orders(restaurant_id,id) on delete restrict
);
create index stock_movements_item_time on public.stock_movements(restaurant_id,stock_item_id,created_at desc);

create table public.printer_devices (
 id uuid primary key default gen_random_uuid(),
 restaurant_id uuid not null references public.restaurants(id) on delete cascade,
 display_name text not null check(char_length(btrim(display_name)) between 2 and 100),
 station text not null default 'cozinha' check(station in ('cozinha','caixa','balcao')),
 connection_type text not null default 'windows_agent' check(connection_type in ('windows_agent')),
 enabled boolean not null default false,
 created_at timestamptz not null default now(),
 unique(restaurant_id,id)
);
create table public.print_jobs (
 id uuid primary key default gen_random_uuid(),
 restaurant_id uuid not null references public.restaurants(id) on delete cascade,
 printer_id uuid not null,
 order_id uuid,
 status text not null default 'queued' check(status in ('queued','leased','completed','failed','cancelled')),
 dedupe_key text not null check(char_length(dedupe_key) between 8 and 200),
 payload jsonb not null default '{}'::jsonb,
 attempts integer not null default 0 check(attempts>=0),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(restaurant_id,dedupe_key),
 foreign key(restaurant_id,printer_id) references public.printer_devices(restaurant_id,id) on delete restrict,
 foreign key(restaurant_id,order_id) references public.orders(restaurant_id,id) on delete restrict
);
create index print_jobs_queue on public.print_jobs(restaurant_id,status,created_at);

create table public.subscription_plans (
 id uuid primary key default gen_random_uuid(),
 code text not null unique check(code ~ '^[a-z0-9_]{3,40}$'),
 display_name text not null check(char_length(btrim(display_name)) between 3 and 100),
 price_cents bigint check(price_cents>=0),
 active boolean not null default false,
 created_at timestamptz not null default now()
);
create table public.restaurant_subscriptions (
 restaurant_id uuid primary key references public.restaurants(id) on delete cascade,
 plan_id uuid references public.subscription_plans(id),
 status text not null default 'trial' check(status in ('trial','active','paused','cancelled')),
 starts_at timestamptz not null default now(),
 ends_at timestamptz,
 updated_at timestamptz not null default now()
);
insert into public.restaurant_subscriptions(restaurant_id)
 select id from public.restaurants on conflict do nothing;
-- As estruturas operacionais são exclusivas do backend. A RLS permanece ligada em TODAS as tabelas.
do $block$
declare tab text;
begin
 foreach tab in array array[
  'menu_categories','menu_products','menu_product_options','restaurant_publication',
  'restaurant_tables','orders','order_items','order_events','cash_sessions','payments',
  'stock_items','recipe_components','stock_movements','printer_devices','print_jobs',
  'subscription_plans','restaurant_subscriptions'
 ] loop
  execute format('alter table public.%I enable row level security',tab);
  execute format('revoke all on public.%I from anon,authenticated,public',tab);
  execute format('grant select,insert,update,delete on public.%I to service_role',tab);
 end loop;
end;
$block$;
grant usage,select on sequence public.order_events_id_seq to service_role;
-- Segurança extra: sem políticas para clientes, anon/authenticated não lê nem escreve.
commit;