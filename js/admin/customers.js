/* =====================================================================
 * js/admin/customers.js
 * الوظيفة: العملاء (بيانات مجمّعة من جدول الطلبات kt_orders).
 * يعتمد على: js/admin/shared.js [tbl, pgh, pages] · window.Panel [sb, $, esc, money, date, ic, skel, empty, csv]
 * يعرض على window.Panel.admin: لا شيء
 * ===================================================================== */
(() => {
'use strict';
const NS = (window.Panel.admin = window.Panel.admin || {});
const { sb, $, esc, money, date, ic, skel, empty, csv } = window.Panel;
const { tbl, pgh, pages } = NS;   // js/admin/shared.js

/* ===================== #admin-customers: العملاء ===================== */
// #admin #customers
// #page-customers #route #admin #customers
pages.customers = async el => {
  el.innerHTML = pgh('العملاء', 'مجمّعين من الطلبات برقم الموبايل') + skel(300);
  const { data, error } = await sb.from('kt_orders').select('customer_name,phone,city,total,status,created_at').order('created_at', { ascending: false }).limit(2000); if (error) throw error;
  const m = new Map();
  data.forEach(o => { const k = String(o.phone || '').replace(/\s/g, ''); if (!k) return; let c = m.get(k); if (!c) { c = { phone: k, name: o.customer_name, city: o.city, n: 0, done: 0, spent: 0, last: o.created_at }; m.set(k, c); } c.n++; if (o.status === 'delivered') { c.done++; c.spent += +o.total || 0; } });
  const all = [...m.values()].sort((a, b) => b.spent - a.spent || b.n - a.n); let q = '';
  const draw = () => {
    const list = all.filter(c => !q || `${c.name} ${c.phone} ${c.city}`.toLowerCase().includes(q));
    el.innerHTML = pgh('العملاء', `${all.length} عميل من آخر ${data.length} طلب`, `<button class="btn btn-g" id="ex">${ic('dl', 'sm')} تصدير CSV</button>`) +
      `<div class="tools"><input class="field" id="q" placeholder="ابحث بالاسم أو الموبايل أو المحافظة" value="${esc(q)}"></div>` +
      tbl(['العميل', 'المحافظة', 'الطلبات', 'مُسلّمة', 'إنفاق مُسلَّم', 'آخر طلب'], list.map(c => `<tr><td><b>${esc(c.name)}</b><span class="sub" dir="ltr" style="text-align:start"><a href="tel:${esc(c.phone)}">${esc(c.phone)}</a></span></td><td>${esc(c.city || '-')}</td><td>${c.n}</td><td>${c.done}</td><td>${money(c.spent)}</td><td>${date(c.last)}</td></tr>`), empty('users', 'لا عملاء'));
    $('#q').oninput = e => { q = e.target.value.trim().toLowerCase(); const p = e.target.selectionStart; draw(); const n = $('#q'); n.focus(); n.setSelectionRange(p, p); };
    $('#ex').onclick = () => csv('customers.csv', [['الاسم', 'الموبايل', 'المحافظة', 'الطلبات', 'مُسلّمة', 'إنفاق مُسلَّم'], ...list.map(c => [c.name, c.phone, c.city, c.n, c.done, c.spent])]);
  };
  draw();
};
})();
