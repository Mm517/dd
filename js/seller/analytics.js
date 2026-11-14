/* =====================================================================
 * js/seller/analytics.js
 * الوظيفة: تحليلات البائع (مبيعات ومشاهدات المنتجات).
 * يعتمد على: js/seller/shared.js [stat, live, pgh, pages] · window.Panel [sb, $$, fmt, money, moneyT, skel, ORDER, areaChart, hbars, lastDays, dkey, sum, loadSales, groupOrders]
 * يعرض على window.Panel.seller: لا شيء
 * ===================================================================== */
(() => {
'use strict';
const NS = (window.Panel.seller = window.Panel.seller || {});
const { sb, $$, fmt, money, moneyT, skel, ORDER, areaChart, hbars, lastDays, dkey, sum, loadSales, groupOrders } = window.Panel;
const { stat, live, pgh, pages } = NS;   // js/seller/shared.js

/* ===================== #seller-analytics: التحليلات ===================== */
// #seller #analytics #charts #sales
// #page-analytics #route #seller #analytics
pages.analytics = async (el, c) => {
  let range = 30;
  const draw = async () => {
    el.innerHTML = pgh('التحليلات', 'أداء متجرك ومنتجاتك', `<div class="chips">${[7, 30, 90].map(n => `<button class="chip" data-r="${n}" aria-pressed="${range === n}">آخر ${n} يوم</button>`).join('')}</div>`) + skel(400);
    $$('[data-r]').forEach(b => b.onclick = () => { range = +b.dataset.r; draw(); });
    const from = new Date(Date.now() - range * 864e5), keys = lastDays(Math.min(range, 60));
    const [all, pv, prods] = await Promise.all([loadSales(c.store.id), sb.from('kt_product_views').select('day,product_id,views').gte('day', dkey(from)), sb.from('kt_products').select('id,name,slug').eq('store_id', c.store.id)]);
    const inR = all.filter(l => new Date(l.created_at) >= from), lv = live(inR), orders = groupOrders(lv), views = pv.data || [], names = Object.fromEntries((prods.data || []).map(p => [p.id, p.name]));
    const totalV = sum(views, v => v.views), rev = sum(lv, l => l.total), units = sum(lv, l => l.qty), cancelled = new Set(inR.filter(l => l.status === 'cancelled').map(l => l.order_id)).size, allO = new Set(inR.map(l => l.order_id)).size;
    const byDay = Object.fromEntries(keys.map(k => [k, 0])), vDay = { ...byDay }; lv.forEach(l => { const k = dkey(l.created_at); if (k in byDay) byDay[k] += l.total; }); views.forEach(v => { if (v.day in vDay) vDay[v.day] += v.views; });
    const topRev = Object.values(lv.reduce((m, l) => { (m[l.slug] ||= { l: l.product_name, v: 0, u: 0 }); m[l.slug].v += l.total; m[l.slug].u += l.qty; return m; }, {})).sort((a, b) => b.v - a.v).slice(0, 6);
    const topV = Object.entries(views.reduce((m, v) => (m[v.product_id] = (m[v.product_id] || 0) + v.views, m), {})).map(([id, v]) => ({ l: names[id] || 'منتج', v })).sort((a, b) => b.v - a.v).slice(0, 6);
    const stt = Object.entries(ORDER).map(([k, v]) => ({ l: v[0], v: groupOrders(inR).filter(o => o.status === k).length })).filter(x => x.v);
    const cities = Object.entries(orders.reduce((m, o) => (m[o.city || 'غير محدد'] = (m[o.city || 'غير محدد'] || 0) + 1, m), {})).map(([l, v]) => ({ l, v })).sort((a, b) => b.v - a.v).slice(0, 6);
    el.innerHTML = pgh('التحليلات', 'أداء متجرك ومنتجاتك', `<div class="chips">${[7, 30, 90].map(n => `<button class="chip" data-r="${n}" aria-pressed="${range === n}">آخر ${n} يوم</button>`).join('')}</div>`) +
      `<div class="grid g4 keep2">${stat('cash', 'المبيعات', money(rev), `${units} وحدة`)}${stat('bag', 'الطلبات', orders.length, cancelled ? `${cancelled} ملغي من ${allO}` : 'بدون إلغاء')}${stat('eye', 'مشاهدات المنتجات', fmt(totalV), 'زيارات صفحات منتجاتك')}${stat('trend', 'معدل التحويل', totalV ? `${((orders.length / totalV) * 100).toFixed(1)}%` : '-', `متوسط الطلب ${orders.length ? moneyT(rev / orders.length) : '-'}`)}</div>
      <div class="grid g2" style="margin-top:16px"><div class="card"><div class="card__head"><h3>المبيعات اليومية</h3></div>${areaChart(keys, keys.map(k => byDay[k]), { unit: 'جنيه' })}</div><div class="card"><div class="card__head"><h3>مشاهدات المنتجات</h3></div>${areaChart(keys, keys.map(k => vDay[k]), { color: 'var(--blue)', unit: 'مشاهدة' })}</div></div>
      <div class="grid g2" style="margin-top:16px"><div class="card"><div class="card__head"><h3>الأعلى مبيعًا</h3></div>${topRev.length ? hbars(topRev, moneyT) : '<p class="empty">لا بيانات</p>'}</div><div class="card"><div class="card__head"><h3>الأكثر مشاهدة</h3></div>${topV.length ? hbars(topV) : '<p class="empty">لا بيانات</p>'}</div>
      <div class="card"><div class="card__head"><h3>حالات الطلبات</h3></div>${stt.length ? hbars(stt) : '<p class="empty">لا بيانات</p>'}</div><div class="card"><div class="card__head"><h3>أكثر المحافظات طلبًا</h3></div>${cities.length ? hbars(cities) : '<p class="empty">لا بيانات</p>'}</div></div>`;
    $$('[data-r]').forEach(b => b.onclick = () => { range = +b.dataset.r; draw(); });
  };
  await draw();
};
})();
