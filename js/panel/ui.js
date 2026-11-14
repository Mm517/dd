/* =====================================================================
 * js/panel/ui.js
 * الوظيفة: مكوّنات واجهة اللوحات: toast، نافذة، تأكيد، سكلتون، حالة فاضية، شارات، وخرائط حالات الطلب/المتجر/المنتج/الإعلان.
 * يعتمد على: js/panel/core.js [$, esc, ic]
 * يعرض على window.Panel: toast, modal, ask, skel, empty, errBox, badge, ORDER, orderBadge, STORE, PROD, AD, sBadge, PLACE, GOAL
 * ===================================================================== */
(() => {
'use strict';
const NS = (window.Panel = window.Panel || {});
const { $, esc, ic } = NS;   // js/panel/core.js

/* ===================== #panel-ui: مكوّنات الواجهة المشتركة ===================== */
// #panel-ui #toast #modal #confirm #skeleton #empty-state

function toast(msg, type = '') {
  let w = $('.toast-wrap'); if (!w) { w = document.createElement('div'); w.className = 'toast-wrap'; w.setAttribute('role', 'status'); document.body.appendChild(w); }
  const t = document.createElement('div'); t.className = `toast ${type}`; t.textContent = msg; w.appendChild(t); setTimeout(() => t.remove(), 3400);
}
function modal(html) {
  const d = document.createElement('dialog'); d.innerHTML = html; document.body.appendChild(d);
  d.addEventListener('close', () => d.remove()); d.addEventListener('click', e => { if (e.target === d) d.close(); }); d.showModal(); return d;
}
const ask = (msg, ok = 'تأكيد', danger = false) => new Promise(res => {
  const d = modal(`<div class="dlg"><h2>${esc(msg)}</h2><div class="dlg__foot"><button class="btn btn-g" data-no>إلغاء</button><button class="btn ${danger ? 'btn-d' : 'btn-p'}" data-yes>${esc(ok)}</button></div></div>`);
  let done = false; d.querySelector('[data-yes]').onclick = () => { done = true; d.close(); res(true); }; d.querySelector('[data-no]').onclick = () => d.close();
  d.addEventListener('close', () => { if (!done) res(false); });
});
const skel = (h = 160) => `<div class="skel" style="height:${h}px"></div>`;
const empty = (icon, title, msg = '', action = '') => `<div class="card empty">${ic(icon)}<h3>${esc(title)}</h3>${msg ? `<p>${esc(msg)}</p>` : ''}${action}</div>`;
const errBox = (m = 'تعذر تحميل البيانات. تأكد من تشغيل ملف SQL على Supabase ثم حاول مرة أخرى.') => `<div class="card empty">${ic('x')}<h3>حصلت مشكلة</h3><p>${esc(m)}</p><button class="btn btn-g" onclick="location.reload()">إعادة المحاولة</button></div>`;
const badge = (cls, t) => `<span class="badge ${cls}">${esc(t)}</span>`;

/* ===================== #panel-status: حالات الطلب والمتجر والمنتج والإعلان ===================== */
// #panel-status #badge #order-status
/* حالات الطلب + المتجر + المنتج + الإعلان */
const ORDER = { new: ['تم استلام الطلب', 'b-blue'], confirmed: ['تم التأكيد', 'b-blue'], shipping: ['في الطريق', 'b-warn'], delivered: ['تم التسليم', 'b-ok'], cancelled: ['ملغي', 'b-red'] };
const orderBadge = s => badge((ORDER[s] || [])[1] || '', (ORDER[s] || [s])[0]);
const STORE = { pending: ['قيد المراجعة', 'b-warn'], approved: ['مفعّل', 'b-ok'], rejected: ['مرفوض', 'b-red'], suspended: ['موقوف', 'b-red'] };
const PROD = { pending: ['قيد المراجعة', 'b-warn'], approved: ['معتمد', 'b-ok'], rejected: ['مرفوض', 'b-red'] };
const AD = { pending: ['قيد المراجعة', 'b-warn'], active: ['نشط', 'b-ok'], paused: ['متوقف', ''], rejected: ['مرفوض', 'b-red'], exhausted: ['انتهت الميزانية', 'b-blue'] };
const sBadge = (map, s) => badge((map[s] || [])[1] || '', (map[s] || [s])[0]);
const PLACE = { home: 'الصفحة الرئيسية', shop: 'صفحة المنتجات', category: 'صفحات الأقسام' };
const GOAL = { sales: 'زيادة المبيعات', awareness: 'التعريف بالمتجر', clearance: 'تصفية مخزون' };

Object.assign(NS, { toast, modal, ask, skel, empty, errBox, badge, ORDER, orderBadge, STORE, PROD, AD, sBadge, PLACE, GOAL });
})();
