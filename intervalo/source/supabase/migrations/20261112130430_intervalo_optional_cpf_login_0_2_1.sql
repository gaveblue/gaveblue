-- Intervalo 0.2.1 — login opcional por CPF. APLICAR SOMENTE NO SUPABASE INTERVALO.
-- Esta migração já foi aplicada no projeto fynaaiazebydorzllwip.
begin;
create table if not exists public.user_cpf_login (
 user_id uuid primary key references auth.users(id) on delete cascade,
 cpf_digest text not null unique check (cpf_digest ~ '^[0-9a-f]{64}$'),
 cpf_last4 text not null check (cpf_last4 ~ '^[0-9]{4}$'),
 linked_at timestamptz not null default now()
);
comment on table public.user_cpf_login is
 'CPF opcional para login; apenas HMAC-SHA256 derivado de chave secreta do servidor + ultimos 4 digitos. Sem CPF em texto claro. Nao expor ao cliente.';
create table if not exists public.cpf_login_attempts (
 id bigint generated always as identity primary key,
 cpf_digest text not null check (cpf_digest ~ '^[0-9a-f]{64}$'),
 network_digest text not null check (network_digest ~ '^[0-9a-f]{64}$'),
 attempted_at timestamptz not null default now()
);
create index if not exists cpf_login_attempts_subject_idx
 on public.cpf_login_attempts(cpf_digest,attempted_at desc);
create index if not exists cpf_login_attempts_network_idx
 on public.cpf_login_attempts(network_digest,attempted_at desc);
comment on table public.cpf_login_attempts is
 'Tentativas de autenticação por CPF: identificadores HMAC, sem CPF ou IP em texto claro; usar janela de tempo e exclusao periodica.';
alter table public.user_cpf_login enable row level security;
alter table public.cpf_login_attempts enable row level security;
revoke all on public.user_cpf_login,public.cpf_login_attempts from public,anon,authenticated;
grant select,insert,update,delete on public.user_cpf_login,public.cpf_login_attempts to service_role;
grant usage,select on sequence public.cpf_login_attempts_id_seq to service_role;
commit;