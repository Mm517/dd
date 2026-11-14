-- =====================================================================
-- Kitchenly Marketplace: تعديلات تكميلية. شغّله بعد seller-marketplace.sql (آمن لإعادة التشغيل).
-- =====================================================================

-- 1) منع حذف منتج عليه طلبات: مبيعات المتجر بتتحسب من kt_products عبر الـ slug،
--    فحذف المنتج كان هيمسح مبيعاته المُسلَّمة من رصيد البائع. الأدمن فقط يقدر يحذف.
create or replace function public.kt_products_no_delete_sold() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or public.kt_is_admin() then return old; end if;
  if exists (select 1 from kt_orders o, jsonb_array_elements(o.items) i where i->>'slug' = old.slug) then
    raise exception 'product_has_orders';
  end if;
  return old;
end $$;
drop trigger if exists kt_products_no_delete_sold_t on public.kt_products;
create trigger kt_products_no_delete_sold_t before delete on public.kt_products for each row execute function public.kt_products_no_delete_sold();

-- 2) طلب السحب: قفل صف المتجر عشان طلبين متزامنين ما يتخطوش الرصيد
create or replace function public.kt_request_payout(p_amount numeric) returns uuid
language plpgsql security definer set search_path = public as $$
declare s kt_stores; b record; pid uuid;
begin
  select * into s from kt_stores where owner_id = auth.uid() and status = 'approved' for update;
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

-- 3) البائع ما يعدّلش بيانات تواصل/سحب متجر موقوف (إيقاف = إيقاف فعلي)
create or replace function public.kt_stores_lock_suspended() returns trigger
language plpgsql set search_path = public as $$
begin
  if auth.uid() is null or public.kt_is_admin() then return new; end if;
  if old.status = 'suspended' then raise exception 'store_suspended'; end if;
  return new;
end $$;
drop trigger if exists kt_stores_lock_suspended_t on public.kt_stores;
create trigger kt_stores_lock_suspended_t before update on public.kt_stores for each row execute function public.kt_stores_lock_suspended();

-- 4) منتجات المتجر المعتمد فقط تظهر في الدالة العامة، وفهرس للمشاهدات
create index if not exists kt_product_views_product_idx on public.kt_product_views(product_id, day);
