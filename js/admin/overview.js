/* =====================================================================
 * js/admin/overview.js
 * الوظيفة: نظرة عامة على لوحة الإدارة (إحصاءات المتاجر والملخصات).
 * يعتمد على: js/admin/shared.js [BASE, tbl, stat, pgh, live, KIT, count, pages] · window.Panel [sb, esc, money, moneyT, date, ic, skel, empty, orderBadge, areaChart, hbars, lastDays, dkey, sum, loadSales, groupOrders]
 * يعرض على window.Panel.admin: لا شيء
 * ===================================================================== */
(() => {
'use strict';
const NS = (window.Panel.admin = window.Panel.admin || {});
const { sb, esc, money, moneyT, date, ic, skel, empty, orderBadge, areaChart, hbars, lastDays, dkey, sum, loadSales, groupOrders } = window.Panel;
const { BASE, tbl, stat, pgh, live, KIT, count, pages } = NS;   // js/admin/shared.js

/* ===================== #admin-overview: نظرة عامة ===================== */
// #admin #overview #stats
// #page-overview #route #admin #overview
pages.overview = async el => {
  el.innerHTML = pgh('نظرة عامة', 'ملخص نشاط المتجر والمتاجر الشريكة') + `<div class="grid g4" id="st">${[1, 2, 3, 4].map(() => skel(110)).join('')}</div><div class="grid g-main" style="margin-top:16px"><div>${skel(300)}</div><div>${skel(300)}</div></div>`;
  const [lines, stores, pq, sq, aq, pr] = await Promise.all([loadSales(null), sb.from('kt_stores').select('*'), count('kt_products', q => q.eq('approval_status', 'pending')), count('kt_stores', q => q.eq('status', 'pending')), count('kt_ads', q => q.eq('status', 'pending')), count('kt_payouts', q => q.eq('status', 'pending'))]);
  const sl = stores.data || [], now = Date.now(), l30 = live(lines).filter(l => now - new Date(l.created_at) < 30 * 864e5), orders = groupOrders(lines), o30 = groupOrders(l30);
  const days = lastDays(14), byDay = Object.fromEntries(days.map(k => [k, 0])); live(lines).forEach(l => { const k = dkey(l.created_at); if (k in byDay) byDay[k] += l.total; });
  const top = Object.values(l30.reduce((m, l) => { (m[l.store_name || KIT] ||= { l: l.store_name || KIT, v: 0 }).v += l.total; return m; }, {})).sort((a, b) => b.v - a.v).slice(0, 6);
  const q = [['product-requests', 'box', 'منتجات تنتظر المراجعة', pq], ['seller-request', 'store', 'طلبات بائعين جدد', sq], ['ads', 'target', 'إعلانات تنتظر الموافقة', aq], ['money', 'wallet', 'طلبات سحب', pr]];
  const stats = stat('cash', 'إجمالي المبيعات (30 يوم)', money(sum(l30, l => l.total)), `${o30.length} طلب`, 'stat--hl') + stat('bag', 'كل الطلبات', orders.length, `${orders.filter(o => ['new', 'confirmed'].includes(o.status)).length} تنتظر المعالجة`) + stat('store', 'المتاجر الشريكة', sl.filter(s => s.status === 'approved').length, `${sl.length} إجمالي`) + stat('clock', 'بانتظار إجراء منك', pq + sq + aq + pr, 'مراجعات وطلبات سحب');
  el.innerHTML = pgh('نظرة عامة', 'ملخص نشاط المتجر والمتاجر الشريكة') + `<div class="grid g4 keep2">${stats}</div><div class="grid g4 keep2" style="margin-top:16px">${q.map(([h, i, t, n]) => `<a data-l href="${BASE}/${h}" class="card" style="display:flex;gap:12px;align-items:center">${ic(i, 'lg')}<div><b class="num" style="font-size:1.4rem;display:block;line-height:1.2;${n ? 'color:var(--red)' : ''}">${n}</b><span style="color:var(--muted);font-size:.85rem">${t}</span></div></a>`).join('')}</div>
  <div class="grid g-main" style="margin-top:16px"><div class="card"><div class="card__head"><div><h3>المبيعات، آخر 14 يوم</h3><p>كل المتاجر بدون الطلبات الملغية</p></div></div>${areaChart(days, days.map(k => byDay[k]), { unit: 'جنيه' })}</div><div class="card"><div class="card__head"><h3>أعلى المتاجر مبيعًا (30 يوم)</h3></div>${top.length ? hbars(top, moneyT) : '<p class="empty">لا مبيعات بعد</p>'}</div></div>
  <div class="card__head" style="margin-top:22px"><h3>آخر الطلبات</h3><a class="btn-link" data-l href="${BASE}/orders">كل الطلبات</a></div>` +
    tbl(['الطلب', 'التاريخ', 'العميل', 'المتاجر', 'المبلغ', 'الحالة'], orders.slice(0, 6).map(o => `<tr><td dir="ltr" style="text-align:start"><b>${esc(o.no)}</b></td><td>${date(o.at)}</td><td>${esc(o.name)}</td><td>${[...o.stores].map(esc).join('، ')}</td><td>${money(o.total)}</td><td>${orderBadge(o.status)}</td></tr>`), empty('bag', 'لا طلبات بعد'));
};
})();
