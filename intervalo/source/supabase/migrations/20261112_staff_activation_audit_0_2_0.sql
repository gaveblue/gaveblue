create or replace function intervalo_private.audit_membership_activation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.status = 'pending' and new.status = 'active' then
    insert into public.audit_logs(restaurant_id,actor_user_id,event,details)
    values(
      new.restaurant_id,
      new.user_id,
      case when new.role = 'master' then 'master_invite_activated'
           else 'staff_invite_activated' end,
      jsonb_build_object('role',new.role,'activation','authenticated')
    );
  end if;
  return new;
end;
$$;
revoke all on function intervalo_private.audit_membership_activation() from public,anon,authenticated;