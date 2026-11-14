/* =====================================================================
 * js/admin/analytics.js
 * الوظيفة: التحليلات: أرقام الإعلانات ومشاهدات المنتجات والمتاجر (kt_ads / kt_product_views / kt_stores).
 * يعتمد على: js/admin/shared.js [stat, pgh, live, KIT, pages] · window.Panel [sb, $$, fmt, money, moneyT, skel, ORDER, areaChart, barChart, hbars, lastDays, dkey, sum, loadSales, groupOrders]
 * يعرض على window.Panel.admin: لا شيء
 * ===================================================================== */
(() => {
'use strict';
const NS = (window.Panel.admin = window.Panel.admin || {});
const { sb, $$, fmt, money, moneyT, skel, ORDER, areaChart, barChart, hbars, lastDays, dkey, sum, loadSales, groupOrders } = window.Panel;
const { stat, pgh, live, KIT, pages } = NS;   // js/admin/shared.js

/* ===================== #admin-analytics: التحليلات ===================== */
// #admin #analytics #charts #sales
// #page-analytics #route #admin #analytics
pages.analytics = async el => {
  let range = 30;
  const draw = async () => {
    el.innerHTML = pgh('التحليلات', 'أداء الموقع والمتاجر', `<div class="chips">${[7, 30, 90].map(n => `<button class="chip" data-r="${n}" aria-pressed="${range === n}">آخر ${n} يوم</button>`).join('')}</div>`) + skel(400);
    $$('[data-r]').forEach(b => b.onclick = () => { range = +b.dataset.r; draw(); });
    const from = new Date(Date.now() - range * 864e5), keys = lastDays(Math.min(range, 60));
    const [all, pv, { data: stores }, { data: ads }] = await Promise.all([loadSales(null), sb.from('kt_product_views').select('day,views').gte('day', dkey(from)), sb.from('kt_stores').select('id,status,created_at'), sb.from('kt_ads').select('impressions,clicks,spent')]);
    const lv = live(all.filter(l => new Date(l.created_at) >= from)), orders = groupOrders(lv), views = sum(pv.data || [], v => v.views), rev = sum(lv, l => l.total);
    const byDay = Object.fromEntries(keys.map(k => [k, 0])), oDay = { ...byDay }; lv.forEach(l => { const k = dkey(l.created_at); if (k in byDay) byDay[k] += l.total; }); orders.forEach(o => { const k = dkey(o.at); if (k in oDay) oDay[k]++; });
    const topStores = Object.values(lv.reduce((m, l) => { (m[l.store_name || KIT] ||= { l: l.store_name || KIT, v: 0 }).v += l.total; return m; }, {})).sort((a, b) => b.v - a.v).slice(0, 6);
    const topProd = Object.values(lv.reduce((m, l) => { (m[l.slug] ||= { l: l.product_name, v: 0 }).v += l.qty; return m; }, {})).sort((a, b) => b.v - a.v).slice(0, 6);
    const cities = Object.entries(orders.reduce((m, o) => (m[o.city || 'غير محدد'] = (m[o.city || 'غير محدد'] || 0) + 1, m), {})).map(([l, v]) => ({ l, v })).sort((a, b) => b.v - a.v).slice(0, 6);
    const stt = Object.entries(ORDER).map(([k, v]) => ({ l: v[0], v: groupOrders(all.filter(l => new Date(l.created_at) >= from)).filter(o => o.status === k).length })).filter(x => x.v);
    const newStores = (stores || []).filter(s => new Date(s.created_at) >= from).length, imp = sum(ads || [], a => a.impressions), clk = sum(ads || [], a => a.clicks);
    el.innerHTML = pgh('التحليلات', 'أداء الموقع والمتاجر', `<div class="chips">${[7, 30, 90].map(n => `<button class="chip" data-r="${n}" aria-pressed="${range === n}">آخر ${n} يوم</button>`).join('')}</div>`) +
      `<div class="grid g4 keep2">${stat('cash', 'المبيعات', money(rev), `${orders.length} طلب`)}${stat('bag', 'متوسط الطلب', orders.length ? money(rev / orders.length) : '-')}${stat('eye', 'مشاهدات المنتجات', fmt(views), views ? `تحويل ${((orders.length / views) * 100).toFixed(1)}%` : '')}${stat('store', 'متاجر جديدة', newStores, `${(stores || []).filter(s => s.status === 'approved').length} متجر مفعّل`)}</div>
      <div class="grid g2" style="margin-top:16px"><div class="card"><div class="card__head"><h3>المبيعات اليومية</h3></div>${areaChart(keys, keys.map(k => byDay[k]), { unit: 'جنيه' })}</div><div class="card"><div class="card__head"><h3>عدد الطلبات يوميًا</h3></div>${barChart(keys.slice(-14).map(k => ({ l: k.slice(8), v: oDay[k] })), { color: 'var(--blue)', unit: 'طلب' })}</div>
      <div class="card"><div class="card__head"><h3>أعلى المتاجر مبيعًا</h3></div>${topStores.length ? hbars(topStores, moneyT) : '<p class="empty">لا بيانات</p>'}</div><div class="card"><div class="card__head"><h3>الأكثر مبيعًا (كمية)</h3></div>${topProd.length ? hbars(topProd) : '<p class="empty">لا بيانات</p>'}</div>
      <div class="card"><div class="card__head"><h3>حالات الطلبات</h3></div>${stt.length ? hbars(stt) : '<p class="empty">لا بيانات</p>'}</div><div class="card"><div class="card__head"><h3>أكثر المحافظات طلبًا</h3></div>${cities.length ? hbars(cities) : '<p class="empty">لا بيانات</p>'}</div></div>
      <div class="card" style="margin-top:16px"><div class="card__head"><h3>أداء الإعلانات (الإجمالي)</h3></div><div class="grid g3"><div><p class="sub">مرات الظهور</p><b class="num" style="font-size:1.4rem">${fmt(imp)}</b></div><div><p class="sub">النقرات</p><b class="num" style="font-size:1.4rem">${fmt(clk)}</b></div><div><p class="sub">CTR</p><b class="num" style="font-size:1.4rem">${imp ? ((clk / imp) * 100).toFixed(2) + '%' : '-'}</b></div></div></div>`;
    $$('[data-r]').forEach(b => b.onclick = () => { range = +b.dataset.r; draw(); });
  };
  await draw();
};
})();
