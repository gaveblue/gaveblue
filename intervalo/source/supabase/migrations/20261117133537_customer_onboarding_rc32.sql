begin;
alter table public.customer_profiles add column if not exists full_name text, add column if not exists social_name text, add column if not exists cpf text, add column if not exists terms_version text, add column if not exists terms_accepted_at timestamptz;
CREATE OR REPLACE FUNCTION public.customer_cpf_valid(p_cpf text)
 RETURNS boolean
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO ''
AS $function$
declare n text:=coalesce(p_cpf,''); s integer; d integer; i integer; k integer;
begin
 if n !~ '^[0-9]{11}$' or n=repeat(substr(n,1,1),11) then return false; end if;
 for k in 9..10 loop
  s:=0;
  for i in 1..k loop s:=s+substr(n,i,1)::integer*(k+2-i); end loop;
  d:=(s*10)%11; if d=10 then d:=0; end if;
  if d<>substr(n,k+1,1)::integer then return false; end if;
 end loop;
 return true;
end $function$;
revoke all on function public.customer_cpf_valid(text) from public,anon;
grant execute on function public.customer_cpf_valid(text) to authenticated,service_role;
alter table public.customer_profiles add constraint customer_profiles_rc32_cpf_check check (cpf is null or public.customer_cpf_valid(cpf));
alter table public.customer_profiles add constraint customer_profiles_rc32_names_check check ((full_name is null or char_length(btrim(full_name)) between 3 and 150) and (social_name is null or char_length(btrim(social_name)) between 2 and 120));
alter table public.customer_profiles add constraint customer_profiles_rc32_terms_check check ((terms_version is null and terms_accepted_at is null) or (terms_version is not null and terms_accepted_at is not null and full_name is not null and cpf is not null and phone is not null));
grant insert (full_name,social_name,cpf,terms_version,terms_accepted_at) on public.customer_profiles to authenticated;
grant update (full_name,social_name,cpf,terms_version,terms_accepted_at) on public.customer_profiles to authenticated;
CREATE OR REPLACE FUNCTION public.customer_complete_registration(p_full_name text, p_social_name text, p_display_name text, p_cpf text, p_phone text, p_accept boolean, p_address jsonb)
 RETURNS boolean
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare uid uuid:=auth.uid(); n text:=btrim(coalesce(p_full_name,'')); sn text:=nullif(btrim(coalesce(p_social_name,'')),''); dn text:=btrim(coalesce(p_display_name,'')); cpf_value text:=coalesce(p_cpf,''); ph text:=coalesce(p_phone,''); a jsonb:=coalesce(p_address,'{}'::jsonb); affected integer;
begin
 if uid is null then raise exception 'Acesso necessario'; end if;
 if p_accept is distinct from true then raise exception 'Aceite os termos para continuar'; end if;
 if char_length(n) not between 3 and 150 or char_length(dn) not between 2 and 120 or (sn is not null and char_length(sn) not between 2 and 120) or not public.customer_cpf_valid(cpf_value) or ph !~ '^[1-9][0-9]9[0-9]{8}$' then raise exception 'Confira nome, CPF e celular'; end if;
 if jsonb_typeof(a)<>'object' or coalesce(a->>'postal_code','') !~ '^[0-9]{8}$' or coalesce(a->>'state','') !~ '^(AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO)$' or char_length(btrim(coalesce(a->>'city',''))) not between 2 and 100 or char_length(btrim(coalesce(a->>'street',''))) not between 2 and 160 or char_length(btrim(coalesce(a->>'number',''))) not between 1 and 25 or char_length(btrim(coalesce(a->>'neighborhood',''))) not between 2 and 100 or char_length(coalesce(a->>'reference',''))>160 or char_length(coalesce(a->>'complement',''))>120 then raise exception 'Confira o endereco'; end if;
 insert into public.customer_profiles(id,display_name,phone,full_name,social_name,cpf,terms_version,terms_accepted_at)
 values(uid,dn,ph,n,sn,cpf_value,'2026-11-17-rc32',now())
 on conflict(id) do update set display_name=excluded.display_name,phone=excluded.phone,full_name=excluded.full_name,social_name=excluded.social_name,cpf=excluded.cpf,terms_version=excluded.terms_version,terms_accepted_at=excluded.terms_accepted_at,updated_at=now()
 where public.customer_profiles.terms_accepted_at is null;
 get diagnostics affected=row_count;
 if affected=0 then return true; end if;
 if not exists(select 1 from public.customer_addresses where customer_id=uid and postal_code=a->>'postal_code' and street=btrim(a->>'street') and number=btrim(a->>'number')) then
  insert into public.customer_addresses(customer_id,label,street,number,complement,neighborhood,city,state,postal_code,reference)
  values(uid,'Casa',btrim(a->>'street'),btrim(a->>'number'),btrim(coalesce(a->>'complement','')),btrim(a->>'neighborhood'),btrim(a->>'city'),a->>'state',a->>'postal_code',btrim(coalesce(a->>'reference','')));
 end if;
 return true;
end $function$;
revoke all on function public.customer_complete_registration(text,text,text,text,text,boolean,jsonb) from public,anon;
grant execute on function public.customer_complete_registration(text,text,text,text,text,boolean,jsonb) to authenticated;
commit;