-- =====================================================================
-- Kitchenly Premium: كود التفعيل + موقع البائع الخاص (قالب أو كود)
-- شغّله بعد seller-marketplace.sql (آمن لإعادة التشغيل).
-- =====================================================================

-- 1) مدة البريميوم على المتجر (البائع ما يقدرش يغيّرها بنفسه)
alter table public.kt_stores add column if not exists premium_until timestamptz;

create or replace function public.kt_stores_guard() returns trigger
language plpgsql set search_path = public as $$
begin
  if auth.uid() is null or public.kt_is_admin() then return new; end if;
  if tg_op = 'INSERT' then
    new.status := 'pending'; new.commission_rate := 10; new.ad_credit := 0; new.reject_reason := null; new.reviewed_at := null; new.premium_until := null;
  else
    new.owner_id := old.owner_id; new.commission_rate := old.commission_rate; new.ad_credit := old.ad_credit;
    new.reject_reason := old.reject_reason; new.reviewed_at := old.reviewed_at; new.premium_until := old.premium_until;
    if new.status is distinct from old.status then
      if old.status = 'rejected' and new.status = 'pending' then new.reject_reason := null;
      else new.status := old.status; end if;
    end if;
    new.slug := old.slug;
  end if;
  return new;
end $$;

-- 2) أكواد التفعيل (الأدمن بس يضيفها من SQL editor)
create table if not exists public.kt_premium_codes (
  code text primary key check (code ~ '^[A-Z0-9-]{6,32}$'),
  days integer not null default 365 check (days between 1 and 3650),
  note text,
  used_by_store uuid references public.kt_stores(id) on delete set null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.kt_premium_codes enable row level security;
drop policy if exists kt_premium_codes_admin on public.kt_premium_codes;
create policy kt_premium_codes_admin on public.kt_premium_codes for all using (public.kt_is_admin()) with check (public.kt_is_admin());
-- مفيش سياسة للبائع: التفعيل بيتم فقط عن طريق الدالة تحت (security definer)

create or replace function public.kt_redeem_premium_code(p_code text) returns timestamptz
language plpgsql security definer set search_path = public as $$
declare st kt_stores; c kt_premium_codes; base timestamptz; res timestamptz;
begin
  select * into st from kt_stores where owner_id = auth.uid() for update;
  if st.id is null then raise exception 'no_store'; end if;
  if st.status <> 'approved' then raise exception 'store_not_approved'; end if;
  select * into c from kt_premium_codes where code = upper(trim(p_code)) for update;
  if c.code is null then raise exception 'invalid_code'; end if;
  if c.used_at is not null then raise exception 'code_used'; end if;
  base := greatest(coalesce(st.premium_until, now()), now());
  res := base + make_interval(days => c.days);
  update kt_stores set premium_until = res where id = st.id;
  update kt_premium_codes set used_by_store = st.id, used_at = now() where code = c.code;
  return res;
end $$;
grant execute on function public.kt_redeem_premium_code(text) to authenticated;

-- 3) موقع المتجر الخاص
create table if not exists public.kt_store_sites (
  store_id uuid primary key references public.kt_stores(id) on delete cascade,
  mode text not null check (mode in ('template','code','upload')),
  template_id text,
  settings jsonb not null default '{}'::jsonb,
  html text not null default '' check (char_length(html) <= 400000),
  css  text not null default '' check (char_length(css)  <= 200000),
  js   text not null default '' check (char_length(js)   <= 200000),
  published boolean not null default false,
  updated_at timestamptz not null default now()
);
alter table public.kt_store_sites enable row level security;

create or replace function public.kt_store_is_premium(p_store uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from kt_stores s where s.id = p_store and s.status = 'approved' and s.premium_until > now());
$$;
grant execute on function public.kt_store_is_premium(uuid) to anon, authenticated;

drop policy if exists kt_sites_owner_read on public.kt_store_sites;
drop policy if exists kt_sites_owner_ins  on public.kt_store_sites;
drop policy if exists kt_sites_owner_upd  on public.kt_store_sites;
drop policy if exists kt_sites_owner_del  on public.kt_store_sites;
drop policy if exists kt_sites_public     on public.kt_store_sites;
drop policy if exists kt_sites_admin      on public.kt_store_sites;
create policy kt_sites_owner_read on public.kt_store_sites for select using (store_id in (select id from public.kt_stores where owner_id = auth.uid()));
create policy kt_sites_owner_ins  on public.kt_store_sites for insert with check (store_id in (select id from public.kt_stores where owner_id = auth.uid()) and public.kt_store_is_premium(store_id));
create policy kt_sites_owner_upd  on public.kt_store_sites for update using (store_id in (select id from public.kt_stores where owner_id = auth.uid()) and public.kt_store_is_premium(store_id)) with check (store_id in (select id from public.kt_stores where owner_id = auth.uid()) and public.kt_store_is_premium(store_id));
create policy kt_sites_owner_del  on public.kt_store_sites for delete using (store_id in (select id from public.kt_stores where owner_id = auth.uid()));
create policy kt_sites_public     on public.kt_store_sites for select using (published and public.kt_store_is_premium(store_id));
create policy kt_sites_admin      on public.kt_store_sites for all using (public.kt_is_admin()) with check (public.kt_is_admin());

-- لإنشاء كود تفعيل (الأدمن):
--   insert into public.kt_premium_codes (code, days, note) values ('KT-PREMIUM-2026', 365, 'سنة');

-- 4) أسماء محجوزة: موقع البريميوم بيشتغل على domain/<slug> فلازم الـ slug ما يتعارضش مع صفحات الموقع
create or replace function public.kt_slug_reserved() returns trigger
language plpgsql set search_path = public as $$
begin
  if public.kt_is_admin() then return new; end if;
  if new.slug = any (array['admin','stuff','be-seller','store','product','category','offers','shop','cart','checkout','track','auth','account','profile','about','help','privacy','policy','policies','join-us','yours-offer','contact','order-success','offline','assets','css','js','supabase','docs','premium-site','premuim','login','signup','dashboard','kitchenly','api']) then
    raise exception 'slug_reserved';
  end if;
  return new;
end $$;
drop trigger if exists kt_stores_slug_reserved_t on public.kt_stores;
create trigger kt_stores_slug_reserved_t before insert on public.kt_stores for each row execute function public.kt_slug_reserved();
