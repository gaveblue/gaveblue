begin;
drop policy if exists "module_access_self_or_admin" on public.restaurant_member_module_access;
create policy "module_access_active_self_or_admin"
on public.restaurant_member_module_access for select to authenticated using (
 (
  user_id=(select auth.uid())
  and exists(
   select 1 from public.restaurant_members m
   where m.restaurant_id=restaurant_member_module_access.restaurant_id
     and m.user_id=(select auth.uid()) and m.status='active'
  )
 )
 or exists(select 1 from public.platform_admins p
   where p.user_id=(select auth.uid()) and p.active)
);
commit;