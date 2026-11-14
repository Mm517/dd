/* =====================================================================
 * js/seller/overview.js
 * الوظيفة: نظرة عامة للبائع.
 * يعتمد على: js/seller/shared.js [BASE, tbl, balance, stat, live, approved, pgh, pages] · js/seller/auth.js [statusBanner] · window.Panel [sb, $, esc, money, moneyT, date, ic, skel, empty, orderBadge, areaChart, hbars, lastDays, dkey, sum, loadSales, groupOrders]
 * يعرض على window.Panel.seller: لا شيء
 * ===================================================================== */
(() => {
'use strict';
const NS = (window.Panel.seller = window.Panel.seller || {});
const { sb, $, esc, money, moneyT, date, ic, skel, empty, orderBadge, areaChart, hbars, lastDays, dkey, sum, loadSales, groupOrders } = window.Panel;
const { BASE, tbl, balance, stat, live, approved, pgh, pages } = NS;   // js/seller/shared.js
const { statusBanner } = NS;   // js/seller/auth.js

/* ===================== #seller-overview: نظرة عامة ===================== */
// #seller #overview #stats
// #page-overview #route #seller #overview
pages.overview = async (el, c) => {
  const st = c.store;
  if (!approved(c)) { el.innerHTML = statusBanner(c) + `<div class="grid g3">${[['store', 'أكمل بيانات متجرك', 'الشعار والوصف ورقم التواصل', '/dashboard/store'], ['box', 'جهّز منتجاتك', 'ستتاح إضافة المنتجات بعد التفعيل', '/dashboard/store'], ['help', 'اقرأ دليل البائع', 'العمولة والسحب والإعلانات', '/dashboard/help']].map(([i, t, d, h]) => `<a data-l href="${BASE}${h}" class="card" style="display:grid;gap:6px">${ic(i, 'lg')}<h3>${t}</h3><p style="color:var(--muted);font-size:.88rem">${d}</p></a>`).join('')}</div>`; return; }
  el.innerHTML = pgh(`أهلًا، ${esc(st.name)}`, 'ملخص أداء متجرك', `<a class="btn btn-p" data-l href="${BASE}/dashboard/products">${ic('plus', 'sm')} منتج جديد</a>`) + `<div class="grid g4" id="st">${[1, 2, 3, 4].map(() => skel(110)).join('')}</div><div class="grid g-main" style="margin-top:16px"><div id="ch">${skel(300)}</div><div id="tp">${skel(300)}</div></div><div id="ro" style="margin-top:16px">${skel(200)}</div>`;
  const [lines, bal, prods] = await Promise.all([loadSales(st.id), balance(st.id), sb.from('kt_products').select('id,approval_status,active,stock').eq('store_id', st.id)]);
  const days = lastDays(14), now = Date.now(), d30 = live(lines).filter(l => now - new Date(l.created_at) < 30 * 864e5), orders30 = groupOrders(d30);
  const pl = prods.data || [], pend = pl.filter(p => p.approval_status === 'pending').length, low = pl.filter(p => p.approval_status === 'approved' && p.stock <= 5).length;
  $('#st').innerHTML = stat('wallet', 'الرصيد المتاح', money(bal.available), `إجمالي أرباحك ${moneyT(bal.net)}`, 'stat--hl') + stat('cash', 'مبيعات آخر 30 يوم', money(sum(d30, l => l.total)), `${orders30.length} طلب`) + stat('bag', 'طلبات جديدة', orders30.filter(o => ['new', 'confirmed'].includes(o.status)).length, 'تنتظر الشحن') + stat('box', 'منتجاتك', pl.length, `${pend ? pend + ' قيد المراجعة • ' : ''}${low ? low + ' مخزونها قليل' : 'المخزون سليم'}`);
  const byDay = Object.fromEntries(days.map(k => [k, 0])); live(lines).forEach(l => { const k = dkey(l.created_at); if (k in byDay) byDay[k] += l.total; });
  $('#ch').innerHTML = `<div class="card"><div class="card__head"><div><h3>المبيعات، آخر 14 يوم</h3><p>قيمة المنتجات المباعة (بدون الملغي)</p></div></div>${areaChart(days, days.map(k => byDay[k]), { unit: 'جنيه' })}</div>`;
  const top = Object.values(live(lines).reduce((m, l) => { (m[l.slug] ||= { l: l.product_name, v: 0 }).v += l.total; return m; }, {})).sort((a, b) => b.v - a.v).slice(0, 5);
  $('#tp').innerHTML = `<div class="card" style="height:100%"><div class="card__head"><h3>الأكثر مبيعًا</h3></div>${top.length ? hbars(top, moneyT) : '<p class="empty" style="padding:30px 0">لا مبيعات بعد</p>'}</div>`;
  const recent = groupOrders(lines).slice(0, 6);
  $('#ro').innerHTML = `<div class="card__head"><h3>آخر الطلبات</h3><a class="btn-link" data-l href="${BASE}/dashboard/orders">عرض الكل</a></div>` + tbl(['الطلب', 'التاريخ', 'العميل', 'المبلغ', 'الحالة'], recent.map(o => `<tr><td dir="ltr" style="text-align:start"><b>${esc(o.no)}</b></td><td>${date(o.at)}</td><td>${esc(o.name)}<span class="sub">${esc(o.city)}</span></td><td>${money(o.total)}</td><td>${orderBadge(o.status)}</td></tr>`), empty('bag', 'لا طلبات بعد', 'أول طلب على منتجاتك هيظهر هنا.'));
};
})();
