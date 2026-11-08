-- Additive GB+ administration features; existing financial tables/policies are unchanged.
create table if not exists public.gbplus_activity (
 user_id uuid primary key references auth.users(id) on delete cascade,
 started_at timestamptz not null default now(), last_seen_at timestamptz not null default now(),
 active_seconds bigint not null default 0 check(active_seconds >= 0)
);
create table if not exists public.gbplus_email_preferences (
 user_id uuid primary key references auth.users(id) on delete cascade,
 marketing boolean not null default false,
 changed_at timestamptz not null default now(), consent_version text not null default '2026-11-07'
);
create table if not exists public.gbplus_consent_events (
 id bigint generated always as identity primary key,
 user_id uuid not null references auth.users(id) on delete cascade,
 marketing boolean not null, source text not null, created_at timestamptz not null default now()
);
create table if not exists public.gbplus_mail_jobs (
 id uuid primary key, actor_id uuid references auth.users(id) on delete set null,
 user_id uuid references auth.users(id) on delete set null,
 kind text not null check(kind in ('invite','service','marketing')),
 recipient text not null, subject text not null, body_hash text not null,
 status text not null default 'sending' check(status in ('sending','accepted','failed','unknown')),
 provider_id text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists gbplus_mail_jobs_created on public.gbplus_mail_jobs(created_at desc);
create table if not exists public.gbplus_mail_unsubscribe (
 token_hash text primary key, user_id uuid not null references auth.users(id) on delete cascade,
 created_at timestamptz not null default now()
);
alter table public.gbplus_activity enable row level security;
alter table public.gbplus_email_preferences enable row level security;
alter table public.gbplus_consent_events enable row level security;
alter table public.gbplus_mail_jobs enable row level security;
alter table public.gbplus_mail_unsubscribe enable row level security;
revoke all on public.gbplus_activity,public.gbplus_email_preferences,public.gbplus_consent_events,public.gbplus_mail_jobs,public.gbplus_mail_unsubscribe from public,anon,authenticated;
grant all on public.gbplus_activity,public.gbplus_email_preferences,public.gbplus_consent_events,public.gbplus_mail_jobs,public.gbplus_mail_unsubscribe to service_role;
grant usage,select on sequence public.gbplus_consent_events_id_seq to service_role;

-- No timestamp or elapsed seconds supplied by the browser. Per-user row locking
-- prevents multiple tabs/devices from double-counting the same elapsed interval.
create or replace function public.gbplus_activity_ping() returns void
language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); t timestamptz := clock_timestamp();
begin
 if uid is null then raise exception 'Authentication required'; end if;
 insert into public.gbplus_activity(user_id,started_at,last_seen_at) values(uid,t,t)
 on conflict(user_id) do update set
 active_seconds=public.gbplus_activity.active_seconds + case
 when t-public.gbplus_activity.last_seen_at between interval '15 seconds' and interval '75 seconds'
 then least(45,floor(extract(epoch from(t-public.gbplus_activity.last_seen_at)))::bigint) else 0 end,
 last_seen_at=t
 where t-public.gbplus_activity.last_seen_at >= interval '15 seconds';
end $$;

create or replace function public.gbplus_email_preference(p_marketing boolean default null) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); pref public.gbplus_email_preferences; old_value boolean;
begin
 if uid is null then raise exception 'Authentication required'; end if;
 -- Serialize opt-in/out for this user, including unsubscribe requests.
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(uid::text,17));
 select * into pref from public.gbplus_email_preferences where user_id=uid;
 old_value:=coalesce(pref.marketing,false);
 if p_marketing is not null then
  insert into public.gbplus_email_preferences(user_id,marketing) values(uid,p_marketing)
  on conflict(user_id) do update set marketing=excluded.marketing,changed_at=now(),consent_version='2026-11-07'
  returning * into pref;
  if old_value is distinct from p_marketing then
   insert into public.gbplus_consent_events(user_id,marketing,source) values(uid,p_marketing,'user_settings');
  end if;
 end if;
 return jsonb_build_object('marketing',coalesce(pref.marketing,false),'changed_at',pref.changed_at);
end $$;

create or replace function public.gbplus_admin_usage(p_users uuid[]) returns jsonb
language sql stable security invoker set search_path = '' as $$
 select coalesce(jsonb_agg(jsonb_build_object(
 'user_id',u.id,'tracked_since',a.started_at,'last_seen_at',a.last_seen_at,
 'online',coalesce(a.last_seen_at > now()-interval '75 seconds',false),'active_seconds',a.active_seconds,
 'marketing',coalesce(p.marketing,false),'consent_changed_at',p.changed_at,
 'has_data',d.user_id is not null,'data_updated_at',d.updated_at,
 'accounts',case when jsonb_typeof(d.data->'accounts')='array' then jsonb_array_length(d.data->'accounts') else 0 end,
 'cards',case when jsonb_typeof(d.data->'cards')='array' then jsonb_array_length(d.data->'cards') else 0 end,
 'titles',case when jsonb_typeof(d.data->'titles')='array' then jsonb_array_length(d.data->'titles') else 0 end,
 'partners',case when jsonb_typeof(d.data->'partners')='array' then jsonb_array_length(d.data->'partners') else 0 end
 )), '[]'::jsonb)
 from auth.users u left join public.gbplus_activity a on a.user_id=u.id
 left join public.gbplus_email_preferences p on p.user_id=u.id
 left join public.gbplus_documents d on d.user_id=u.id
 where u.id=any(p_users) and cardinality(p_users)<=50;
$$;

-- Atomic quota reservation + immutable operation identity. A timeout must not
-- be blindly retried, even after the provider's idempotency window expires.
create or replace function public.gbplus_reserve_mail(p_id uuid,p_actor uuid,p_user uuid,p_kind text,p_recipient text,p_subject text,p_hash text) returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare job public.gbplus_mail_jobs;
begin
 perform pg_catalog.pg_advisory_xact_lock(736281902);
 delete from public.gbplus_mail_jobs where created_at<now()-interval '90 days';
 select * into job from public.gbplus_mail_jobs where id=p_id;
 if found then
  if job.actor_id is distinct from p_actor or job.user_id is distinct from p_user or job.kind<>p_kind or job.recipient<>p_recipient or job.subject<>p_subject or job.body_hash<>p_hash then raise exception 'OPERATION_CONFLICT'; end if;
  return jsonb_build_object('reserved',false,'status',job.status);
 end if;
 if (select count(*) from public.gbplus_mail_jobs where created_at>now()-interval '24 hours')>=30 then raise exception 'DAILY_LIMIT'; end if;
 if exists(select 1 from public.gbplus_mail_jobs where recipient=p_recipient and created_at>now()-interval '60 seconds') then raise exception 'RECIPIENT_COOLDOWN'; end if;
 insert into public.gbplus_mail_jobs(id,actor_id,user_id,kind,recipient,subject,body_hash)
 values(p_id,p_actor,p_user,p_kind,p_recipient,p_subject,p_hash);
 return jsonb_build_object('reserved',true,'status','sending');
end $$;

create or replace function public.gbplus_mail_history() returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare result jsonb;
begin
 delete from public.gbplus_mail_jobs where created_at<now()-interval '90 days';
 select coalesce(jsonb_agg(to_jsonb(j)),'[]'::jsonb) into result from
 (select id,kind,recipient,subject,status,created_at from public.gbplus_mail_jobs order by created_at desc limit 50) j;
 return result;
end $$;
revoke all on function public.gbplus_mail_history() from public,anon,authenticated;
grant execute on function public.gbplus_mail_history() to service_role;

create or replace function public.gbplus_unsubscribe(p_hash text) returns boolean
language plpgsql security invoker set search_path = '' as $$
declare uid uuid;
begin
 select user_id into uid from public.gbplus_mail_unsubscribe where token_hash=p_hash;
 if uid is null then return false; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(uid::text,17));
 insert into public.gbplus_email_preferences(user_id,marketing) values(uid,false)
 on conflict(user_id) do update set marketing=false,changed_at=now();
 insert into public.gbplus_consent_events(user_id,marketing,source)
 select uid,false,'email_unsubscribe' where not exists(select 1 from public.gbplus_consent_events where user_id=uid and source='email_unsubscribe' and created_at>now()-interval '1 minute');
 return true;
end $$;

revoke all on function public.gbplus_activity_ping(),public.gbplus_email_preference(boolean),public.gbplus_admin_usage(uuid[]),public.gbplus_reserve_mail(uuid,uuid,uuid,text,text,text,text),public.gbplus_unsubscribe(text) from public,anon,authenticated;
grant execute on function public.gbplus_activity_ping(),public.gbplus_email_preference(boolean) to authenticated;
grant execute on function public.gbplus_admin_usage(uuid[]),public.gbplus_reserve_mail(uuid,uuid,uuid,text,text,text,text),public.gbplus_unsubscribe(text) to service_role;
