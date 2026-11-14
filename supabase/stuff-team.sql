-- Kitchenly /stuff/my-team: إدارة فريق العمل (kt_admins) عن طريق دوال محمية (admin فقط).
create or replace function public.kt_team_list() returns table(email text)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.kt_is_admin() then raise exception 'not_allowed'; end if;
  return query select a.email from public.kt_admins a order by a.email;
end $$;

create or replace function public.kt_team_add(p_email text) returns void
language plpgsql security definer set search_path = '' as $$
declare e text := lower(btrim(coalesce(p_email, '')));
begin
  if not public.kt_is_admin() then raise exception 'not_allowed'; end if;
  if e !~ '^\S+@\S+\.\S+$' then raise exception 'bad_email'; end if;
  insert into public.kt_admins(email) values (e) on conflict do nothing;
end $$;

create or replace function public.kt_team_remove(p_email text) returns void
language plpgsql security definer set search_path = '' as $$
declare e text := lower(btrim(coalesce(p_email, '')));
begin
  if not public.kt_is_admin() then raise exception 'not_allowed'; end if;
  if e = lower(coalesce(auth.jwt()->>'email', '')) then raise exception 'cannot_remove_self'; end if;
  delete from public.kt_admins where email = e;
end $$;

revoke all on function public.kt_team_list() from public, anon;
revoke all on function public.kt_team_add(text) from public, anon;
revoke all on function public.kt_team_remove(text) from public, anon;
grant execute on function public.kt_team_list() to authenticated;
grant execute on function public.kt_team_add(text) to authenticated;
grant execute on function public.kt_team_remove(text) to authenticated;
