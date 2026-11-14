-- =====================================================================
-- Kitchenly Marketplace: متاجر، موافقات، إعلانات، مدفوعات
-- شغّله مرة واحدة في Supabase → SQL Editor (قبل رفع الموقع الجديد).
-- بيعتمد على وجود: kt_products, kt_categories, kt_orders, kt_messages و function kt_is_admin()
-- آمن لإعادة التشغيل (idempotent).
-- =====================================================================

-- ---------- 1) المتاجر ----------
create table if not exists public.kt_stores (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 60),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text,
  logo text,
  cover text,
  phone text,
  whatsapp text,
  city text,
  business_type text,
  payout_method text not null default 'instapay',
  payout_account text,
  notify_orders boolean not null default true,
  notify_marketing boolean not null default false,
  status text not null default 'pending' check (status in ('pending','approved','rejected','suspended')),
  reject_reason text,
  commission_rate numeric not null default 10 check (commission_rate between 0 and 60),
  ad_credit numeric not null default 0 check (ad_credit >= 0),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);
alter table public.kt_stores enable row level security;

-- عرض عام آمن (بدون تليفون/حساب سحب)
create or replace view public.kt_stores_public as
  select id, name, slug, description, logo, cover, city from public.kt_stores where status = 'approved';
grant select on public.kt_stores_public to anon, authenticated;

create or replace function public.kt_store_is_live(p_store uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select p_store is null or exists (select 1 from kt_stores s where s.id = p_store and s.status = 'approved');
$$;
grant execute on function public.kt_store_is_live(uuid) to anon, authenticated;

drop policy if exists kt_stores_owner_read on public.kt_stores;
drop policy if exists kt_stores_admin_all on public.kt_stores;
drop policy if exists kt_stores_owner_insert on public.kt_stores;
drop policy if exists kt_stores_owner_update on public.kt_stores;
create policy kt_stores_owner_read   on public.kt_stores for select using (owner_id = auth.uid());
create policy kt_stores_admin_all    on public.kt_stores for all    using (public.kt_is_admin()) with check (public.kt_is_admin());
create policy kt_stores_owner_insert on public.kt_stores for insert with check (owner_id = auth.uid());
create policy kt_stores_owner_update on public.kt_stores for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- البائع ما يقدرش يغيّر الحالة/العمولة/رصيد الإعلانات بنفسه
create or replace function public.kt_stores_guard() returns trigger
language plpgsql set search_path = public as $$
begin
  if auth.uid() is null or public.kt_is_admin() then return new; end if;
  if tg_op = 'INSERT' then
    new.status := 'pending'; new.commission_rate := 10; new.ad_credit := 0; new.reject_reason := null; new.reviewed_at := null;
  else
    new.owner_id := old.owner_id; new.commission_rate := old.commission_rate; new.ad_credit := old.ad_credit;
    new.reject_reason := old.reject_reason; new.reviewed_at := old.reviewed_at;
    -- الوحيد المسموح: بائع مرفوض يعيد التقديم
    if new.status is distinct from old.status then
      if old.status = 'rejected' and new.status = 'pending' then new.reject_reason := null;
      else new.status := old.status; end if;
    end if;
    new.slug := old.slug;
  end if;
  return new;
end $$;
drop trigger if exists kt_stores_guard_t on public.kt_stores;
create trigger kt_stores_guard_t before insert or update on public.kt_stores for each row execute function public.kt_stores_guard();

-- ---------- 2) المنتجات: ربط بالمتجر + موافقة الأدمن ----------
alter table public.kt_products add column if not exists store_id uuid references public.kt_stores(id) on delete set null;
alter table public.kt_products add column if not exists approval_status text not null default 'approved' check (approval_status in ('pending','approved','rejected'));
alter table public.kt_products add column if not exists reject_reason text;
create index if not exists kt_products_store_idx on public.kt_products(store_id);
create index if not exists kt_products_approval_idx on public.kt_products(approval_status);

create or replace function public.kt_products_guard() returns trigger
language plpgsql set search_path = public as $$
declare my_store uuid;
begin
  if auth.uid() is null or public.kt_is_admin() then return new; end if;
  if tg_op = 'INSERT' then
    select id into my_store from kt_stores where owner_id = auth.uid() and status = 'approved';
    if my_store is null then raise exception 'store_not_approved'; end if;
    new.store_id := my_store; new.approval_status := 'pending'; new.featured := false; new.reject_reason := null;
  else
    new.store_id := old.store_id; new.featured := old.featured;
    -- أي تعديل في المحتوى يرجّع المنتج للمراجعة؛ السعر والمخزون والظهور حرّين
    if (new.name, new.description, new.short_desc, new.image, new.images, new.features, new.category_id)
       is distinct from (old.name, old.description, old.short_desc, old.image, old.images, old.features, old.category_id)
       and old.store_id is not null then
      new.approval_status := 'pending'; new.reject_reason := null;
    else
      new.approval_status := old.approval_status; new.reject_reason := old.reject_reason;
    end if;
  end if;
  return new;
end $$;
drop trigger if exists kt_products_guard_t on public.kt_products;
create trigger kt_products_guard_t before insert or update on public.kt_products for each row execute function public.kt_products_guard();

-- نعيد بناء سياسات kt_products بالكامل (العام يشوف المعتمد + الفعّال + متجره شغال فقط)
do $$ declare r record; begin
  for r in select policyname from pg_policies where schemaname = 'public' and tablename = 'kt_products' loop
    execute format('drop policy %I on public.kt_products', r.policyname);
  end loop;
end $$;
alter table public.kt_products enable row level security;
create policy kt_products_public_read  on public.kt_products for select using (active and approval_status = 'approved' and public.kt_store_is_live(store_id));
create policy kt_products_admin_all    on public.kt_products for all    using (public.kt_is_admin()) with check (public.kt_is_admin());
create policy kt_products_seller_read  on public.kt_products for select using (store_id in (select id from public.kt_stores where owner_id = auth.uid()));
create policy kt_products_seller_ins   on public.kt_products for insert with check (store_id in (select id from public.kt_stores where owner_id = auth.uid() and status = 'approved'));
create policy kt_products_seller_upd   on public.kt_products for update using (store_id in (select id from public.kt_stores where owner_id = auth.uid())) with check (store_id in (select id from public.kt_stores where owner_id = auth.uid()));
create policy kt_products_seller_del   on public.kt_products for delete using (store_id in (select id from public.kt_stores where owner_id = auth.uid()));

-- الأدمن يدير الأقسام
drop policy if exists kt_categories_admin_all on public.kt_categories;
create policy kt_categories_admin_all on public.kt_categories for all using (public.kt_is_admin()) with check (public.kt_is_admin());

-- ---------- 3) مبيعات المتاجر (تُحسب من items في الطلبات) ----------
create or replace function public.kt_sales_lines(p_store uuid default null)
returns table(order_id text, order_no text, created_at timestamptz, status text, payment_method text,
              customer_name text, phone text, city text, address text,
              store_id uuid, store_name text, slug text, product_name text, qty int, price numeric)
language sql stable security definer set search_path = public as $$
  select o.id::text, o.order_no, o.created_at, o.status, o.payment_method,
         o.customer_name, o.phone, o.city, o.address,
         p.store_id, s.name, i->>'slug', coalesce(i->>'name', p.name), coalesce((i->>'qty')::int, 1), coalesce((i->>'price')::numeric, p.price)
  from kt_orders o
  cross join lateral jsonb_array_elements(o.items) i
  join kt_products p on p.slug = i->>'slug'
  left join kt_stores s on s.id = p.store_id
  where (p_store is null or p.store_id = p_store)
    and ( public.kt_is_admin()
          or p.store_id in (select id from kt_stores where owner_id = auth.uid()) );
$$;
revoke all on function public.kt_sales_lines(uuid) from public, anon;
grant execute on function public.kt_sales_lines(uuid) to authenticated;

-- ---------- 4) السحب (Payouts) ----------
create table if not exists public.kt_payouts (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.kt_stores(id) on delete cascade,
  amount numeric not null check (amount > 0),
  method text,
  account text,
  status text not null default 'pending' check (status in ('pending','paid','rejected')),
  note text,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);
alter table public.kt_payouts enable row level security;
drop policy if exists kt_payouts_read  on public.kt_payouts;
drop policy if exists kt_payouts_admin on public.kt_payouts;
create policy kt_payouts_read  on public.kt_payouts for select using (store_id in (select id from public.kt_stores where owner_id = auth.uid()));
create policy kt_payouts_admin on public.kt_payouts for all using (public.kt_is_admin()) with check (public.kt_is_admin());

-- ---------- 5) الحملات والإعلانات ----------
create table if not exists public.kt_campaigns (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.kt_stores(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 80),
  goal text not null default 'sales' check (goal in ('sales','awareness','clearance')),
  status text not null default 'active' check (status in ('active','paused','ended')),
  starts_at date,
  ends_at date,
  created_at timestamptz not null default now()
);
create table if not exists public.kt_ads (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.kt_campaigns(id) on delete cascade,
  store_id uuid not null references public.kt_stores(id) on delete cascade,
  product_id uuid not null references public.kt_products(id) on delete cascade,
  placement text not null check (placement in ('home','shop','category')),
  cpc numeric not null check (cpc >= 0.5),
  budget numeric not null check (budget >= 10),
  spent numeric not null default 0,
  impressions int not null default 0,
  clicks int not null default 0,
  status text not null default 'pending' check (status in ('pending','active','paused','rejected','exhausted')),
  reject_reason text,
  created_at timestamptz not null default now()
);
create index if not exists kt_ads_store_idx on public.kt_ads(store_id);
alter table public.kt_campaigns enable row level security;
alter table public.kt_ads enable row level security;
drop policy if exists kt_campaigns_owner on public.kt_campaigns; drop policy if exists kt_campaigns_admin on public.kt_campaigns;
drop policy if exists kt_ads_owner_read on public.kt_ads; drop policy if exists kt_ads_owner_ins on public.kt_ads; drop policy if exists kt_ads_owner_upd on public.kt_ads; drop policy if exists kt_ads_owner_del on public.kt_ads; drop policy if exists kt_ads_admin on public.kt_ads;
create policy kt_campaigns_owner on public.kt_campaigns for all using (store_id in (select id from public.kt_stores where owner_id = auth.uid())) with check (store_id in (select id from public.kt_stores where owner_id = auth.uid() and status = 'approved'));
create policy kt_campaigns_admin on public.kt_campaigns for all using (public.kt_is_admin()) with check (public.kt_is_admin());
create policy kt_ads_owner_read on public.kt_ads for select using (store_id in (select id from public.kt_stores where owner_id = auth.uid()));
create policy kt_ads_owner_ins  on public.kt_ads for insert with check (store_id in (select id from public.kt_stores where owner_id = auth.uid() and status = 'approved'));
create policy kt_ads_owner_upd  on public.kt_ads for update using (store_id in (select id from public.kt_stores where owner_id = auth.uid())) with check (store_id in (select id from public.kt_stores where owner_id = auth.uid()));
create policy kt_ads_owner_del  on public.kt_ads for delete using (store_id in (select id from public.kt_stores where owner_id = auth.uid()) and status in ('pending','rejected','paused'));
create policy kt_ads_admin      on public.kt_ads for all using (public.kt_is_admin()) with check (public.kt_is_admin());

-- ---------- 6) الرصيد: مبيعات مُسلَّمة - عمولة - سحب - إنفاق إعلانات + رصيد إعلاني ----------
create or replace function public.kt_store_balance(p_store uuid)
returns table(gross numeric, commission numeric, net numeric, paid numeric, pending numeric, ad_spent numeric, ad_credit numeric, available numeric)
language plpgsql stable security definer set search_path = public as $$
declare rate numeric; cr numeric; g numeric; pd numeric; pn numeric; sp numeric;
begin
  if not (public.kt_is_admin() or exists (select 1 from kt_stores where id = p_store and owner_id = auth.uid())) then raise exception 'forbidden'; end if;
  select commission_rate, kt_stores.ad_credit into rate, cr from kt_stores where id = p_store;
  select coalesce(sum(qty * price), 0) into g from public.kt_sales_lines(p_store) l where l.status = 'delivered';
  select coalesce(sum(amount) filter (where status = 'paid'), 0), coalesce(sum(amount) filter (where status = 'pending'), 0) into pd, pn from kt_payouts where store_id = p_store;
  select coalesce(sum(spent), 0) into sp from kt_ads where store_id = p_store;
  return query select g, round(g * rate / 100, 2), round(g - g * rate / 100, 2), pd, pn, sp, cr,
                      round(g - g * rate / 100 + cr - pd - pn - sp, 2);
end $$;
revoke all on function public.kt_store_balance(uuid) from public, anon;
grant execute on function public.kt_store_balance(uuid) to authenticated;

-- طلب سحب: لا يتجاوز الرصيد المتاح (بدون الرصيد الإعلاني)
create or replace function public.kt_request_payout(p_amount numeric) returns uuid
language plpgsql security definer set search_path = public as $$
declare s kt_stores; b record; pid uuid;
begin
  select * into s from kt_stores where owner_id = auth.uid() and status = 'approved';
  if s.id is null then raise exception 'store_not_approved'; end if;
  if s.payout_account is null or s.payout_account = '' then raise exception 'no_payout_account'; end if;
  select * into b from public.kt_store_balance(s.id);
  if p_amount < 100 then raise exception 'min_100'; end if;
  if p_amount > b.net - b.paid - b.pending - greatest(0, b.ad_spent - b.ad_credit) then raise exception 'exceeds_balance'; end if;
  insert into kt_payouts(store_id, amount, method, account) values (s.id, p_amount, s.payout_method, s.payout_account) returning id into pid;
  return pid;
end $$;
revoke all on function public.kt_request_payout(numeric) from public, anon;
grant execute on function public.kt_request_payout(numeric) to authenticated;

-- الإعلان لازم يكون ميزانيته في حدود الرصيد المتاح
create or replace function public.kt_ads_guard() returns trigger
language plpgsql set search_path = public as $$
declare b record; committed numeric; p kt_products;
begin
  if auth.uid() is null or public.kt_is_admin() then return new; end if;
  if tg_op = 'INSERT' then
    select * into p from kt_products where id = new.product_id;
    if p.store_id is distinct from new.store_id or p.approval_status <> 'approved' then raise exception 'product_not_eligible'; end if;
    select * into b from public.kt_store_balance(new.store_id);
    select coalesce(sum(budget - spent), 0) into committed from kt_ads where store_id = new.store_id and status in ('pending','active','paused');
    if new.budget > b.available - committed then raise exception 'insufficient_balance'; end if;
    new.status := 'pending'; new.spent := 0; new.impressions := 0; new.clicks := 0; new.reject_reason := null;
  else
    -- البائع يقدر يوقف/يشغّل بس، ويغيّر cpc/ميزانية المعلّق
    new.store_id := old.store_id; new.product_id := old.product_id; new.campaign_id := old.campaign_id;
    new.spent := old.spent; new.impressions := old.impressions; new.clicks := old.clicks; new.reject_reason := old.reject_reason;
    if new.status is distinct from old.status then
      if not ((old.status = 'active' and new.status = 'paused') or (old.status = 'paused' and new.status = 'active')) then new.status := old.status; end if;
    end if;
    new.placement := old.placement; new.cpc := old.cpc; new.budget := old.budget;
  end if;
  return new;
end $$;
drop trigger if exists kt_ads_guard_t on public.kt_ads;
create trigger kt_ads_guard_t before insert or update on public.kt_ads for each row execute function public.kt_ads_guard();

-- الإعلانات النشطة لمكان معين (بتظهر في الموقع)
create or replace function public.kt_active_ads(p_placement text)
returns table(ad_id uuid, slug text)
language sql stable security definer set search_path = public as $$
  select a.id, p.slug
  from kt_ads a
  join kt_campaigns c on c.id = a.campaign_id
  join kt_products p on p.id = a.product_id
  where a.placement = p_placement and a.status = 'active' and a.spent < a.budget
    and c.status = 'active' and (c.starts_at is null or c.starts_at <= current_date) and (c.ends_at is null or c.ends_at >= current_date)
    and p.active and p.approval_status = 'approved' and p.stock > 0 and public.kt_store_is_live(p.store_id)
  order by random() limit 8;
$$;
grant execute on function public.kt_active_ads(text) to anon, authenticated;

create or replace function public.kt_ad_event(p_ad uuid, p_kind text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_kind = 'impression' then
    update kt_ads set impressions = impressions + 1 where id = p_ad and status = 'active';
  elsif p_kind = 'click' then
    update kt_ads set clicks = clicks + 1, spent = least(budget, spent + cpc),
      status = case when spent + cpc >= budget then 'exhausted' else status end
    where id = p_ad and status = 'active';
  end if;
end $$;
grant execute on function public.kt_ad_event(uuid, text) to anon, authenticated;

-- ---------- 7) مشاهدات المنتجات (للتحليلات) ----------
create table if not exists public.kt_product_views (
  day date not null default current_date,
  product_id uuid not null references public.kt_products(id) on delete cascade,
  views int not null default 0,
  primary key (day, product_id)
);
alter table public.kt_product_views enable row level security;
drop policy if exists kt_pviews_read on public.kt_product_views;
create policy kt_pviews_read on public.kt_product_views for select using (
  public.kt_is_admin() or product_id in (select p.id from public.kt_products p join public.kt_stores s on s.id = p.store_id where s.owner_id = auth.uid()));
create or replace function public.kt_track_view(p_slug text) returns void
language sql security definer set search_path = public as $$
  insert into kt_product_views(day, product_id, views) select current_date, id, 1 from kt_products where slug = p_slug
  on conflict (day, product_id) do update set views = kt_product_views.views + 1;
$$;
grant execute on function public.kt_track_view(text) to anon, authenticated;

-- ---------- 8) تخزين الصور (شعار المتجر وصور المنتجات) ----------
insert into storage.buckets (id, name, public) values ('store-assets', 'store-assets', true) on conflict (id) do nothing;
drop policy if exists store_assets_read on storage.objects; drop policy if exists store_assets_write on storage.objects; drop policy if exists store_assets_del on storage.objects;
create policy store_assets_read  on storage.objects for select using (bucket_id = 'store-assets');
create policy store_assets_write on storage.objects for insert to authenticated with check (bucket_id = 'store-assets' and (storage.foldername(name))[1] = auth.uid()::text);
create policy store_assets_del   on storage.objects for delete to authenticated using (bucket_id = 'store-assets' and (storage.foldername(name))[1] = auth.uid()::text);
