/* =====================================================================
 * js/seller/orders.js
 * الوظيفة: طلبات البائع (من خطوط المبيعات).
 * يعتمد على: js/seller/shared.js [tbl, pgh, pages] · window.Panel [$, $$, esc, money, moneyT, dt, ic, modal, skel, empty, orderBadge, ORDER, csv, loadSales, groupOrders]
 * يعرض على window.Panel.seller: لا شيء
 * ===================================================================== */
(() => {
'use strict';
const NS = (window.Panel.seller = window.Panel.seller || {});
const { $, $$, esc, money, moneyT, dt, ic, modal, skel, empty, orderBadge, ORDER, csv, loadSales, groupOrders } = window.Panel;
const { tbl, pgh, pages } = NS;   // js/seller/shared.js

/* ===================== #seller-orders: الطلبات ===================== */
// #seller #orders
// #page-orders #route #seller #orders
pages.orders = async (el, c) => {
  el.innerHTML = pgh('الطلبات', 'طلبات العملاء على منتجات متجرك. الشحن وتحديث الحالة بيتم عن طريق Kitchenly.', '<button class="btn btn-g" id="ex">' + ic('dl', 'sm') + ' تصدير CSV</button>') + skel(300);
  const orders = groupOrders(await loadSales(c.store.id)); let f = 'all', q = '';
  const draw = () => {
    const list = orders.filter(o => (f === 'all' || o.status === f) && (!q || `${o.no} ${o.name} ${o.phone}`.toLowerCase().includes(q)));
    el.innerHTML = pgh('الطلبات', 'طلبات العملاء على منتجات متجرك. الشحن وتحديث الحالة بيتم عن طريق Kitchenly.', `<button class="btn btn-g" id="ex">${ic('dl', 'sm')} تصدير CSV</button>`) +
      `<div class="tools"><div class="chips">${[['all', 'الكل'], ...Object.entries(ORDER).map(([k, v]) => [k, v[0]])].map(([k, t]) => `<button class="chip" data-f="${k}" aria-pressed="${f === k}">${t}${k !== 'all' ? ` (${orders.filter(o => o.status === k).length})` : ` (${orders.length})`}</button>`).join('')}</div><input class="field" id="q" placeholder="ابحث برقم الطلب أو اسم العميل" value="${esc(q)}"></div>` +
      tbl(['الطلب', 'التاريخ', 'العميل', 'المنتجات', 'المبلغ', 'الحالة', ''], list.map(o => `<tr><td dir="ltr" style="text-align:start"><b>${esc(o.no)}</b></td><td>${dt(o.at)}</td><td>${esc(o.name)}<span class="sub" dir="ltr" style="text-align:start">${esc(o.phone)}</span></td><td>${o.lines.length} صنف<span class="sub">${esc(o.lines[0].product_name)}${o.lines.length > 1 ? '...' : ''}</span></td><td>${money(o.total)}</td><td>${orderBadge(o.status)}</td><td class="act"><button class="btn btn-g btn-sm" data-o="${esc(o.id)}">تفاصيل</button></td></tr>`), empty('bag', orders.length ? 'لا نتائج مطابقة' : 'لا طلبات بعد', orders.length ? '' : 'لما عميل يطلب من منتجاتك هتشوفه هنا.'));
    $$('[data-f]').forEach(b => b.onclick = () => { f = b.dataset.f; draw(); });
    $('#q').oninput = e => { q = e.target.value.trim().toLowerCase(); const pos = e.target.selectionStart; draw(); const n = $('#q'); n.focus(); n.setSelectionRange(pos, pos); };
    $('#ex').onclick = () => csv('orders.csv', [['رقم الطلب', 'التاريخ', 'العميل', 'الموبايل', 'المحافظة', 'العنوان', 'المنتج', 'الكمية', 'السعر', 'الإجمالي', 'الحالة'], ...list.flatMap(o => o.lines.map(l => [o.no, dt(o.at), o.name, o.phone, o.city, o.address, l.product_name, l.qty, l.price, l.total, (ORDER[o.status] || [o.status])[0]]))]);
    $$('[data-o]').forEach(b => b.onclick = () => { const o = orders.find(x => x.id === b.dataset.o); modal(`<div class="dlg"><h2 dir="ltr" style="text-align:start">${esc(o.no)} ${orderBadge(o.status)}</h2><dl class="kv"><dt>العميل</dt><dd>${esc(o.name)}</dd><dt>الموبايل</dt><dd dir="ltr" style="text-align:start"><a href="tel:${esc(o.phone)}">${esc(o.phone)}</a></dd><dt>العنوان</dt><dd>${esc(o.city)} - ${esc(o.address)}</dd><dt>التاريخ</dt><dd>${dt(o.at)}</dd></dl><ul class="rows">${o.lines.map(l => `<li><span>${esc(l.product_name)} × ${l.qty}</span><b>${moneyT(l.total)}</b></li>`).join('')}<li><span>إجمالي منتجاتك</span><b>${moneyT(o.total)}</b></li></ul><div class="dlg__foot"><button class="btn btn-g" onclick="this.closest('dialog').close()">إغلاق</button></div></div>`); });
  };
  draw();
};
})();
