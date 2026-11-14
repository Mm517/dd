/* =====================================================================
 * js/admin/product-requests.js
 * الوظيفة: طلبات المنتجات من البائعين: بانتظار المراجعة / معتمدة / مرفوضة.
 * يعتمد على: js/admin/shared.js [BASE, pgh, reason, pages] · window.Panel [sb, $, esc, fmt, moneyT, toast, modal, empty, sBadge, PROD]
 * يعرض على window.Panel.admin: لا شيء
 * ===================================================================== */
(() => {
'use strict';
const NS = (window.Panel.admin = window.Panel.admin || {});
const { sb, $, esc, fmt, moneyT, toast, modal, empty, sBadge, PROD } = window.Panel;
const { BASE, pgh, reason, pages } = NS;   // js/admin/shared.js

/* ===================== #admin-product-requests: طلبات المنتجات ===================== */
// #admin #product-requests #review #sellers
const PRROUTE = { 'waiting-for-check': ['pending', 'قيد المراجعة'], approved: ['approved', 'المعتمدة'], canceld: ['rejected', 'المرفوضة'] };
const storeNames = {};
async function loadStoreNames(ids) {
  const miss = [...new Set(ids.filter(i => i && !(i in storeNames)))]; if (!miss.length) return;
  const { data } = await sb.from('kt_stores').select('id,name').in('id', miss); (data || []).forEach(s => { storeNames[s.id] = s.name; }); miss.forEach(i => { storeNames[i] ??= '-'; });
}
function productRequests(el, key) {
  const [status] = PRROUTE[key], byId = new Map();
  el.innerHTML = pgh('طلبات المنتجات', 'راجع منتجات البائعين قبل ظهورها في الموقع <b id="tot"></b>') + `<div class="tabs">${Object.entries(PRROUTE).map(([k, v]) => `<a data-l href="${BASE}/product-requests/${k}" aria-current="${k === key}">${v[1]}</a>`).join('')}</div><div id="list"></div>`;
  window.Panel.pager($('#list', el), {
    size: 10, emptyHtml: empty('check', status === 'pending' ? 'لا منتجات بانتظار المراجعة' : 'لا نتائج'), onTotal: n => { $('#tot', el).textContent = `(${fmt(n)})`; },
    fetchPage: async (off, n) => {
      const { data, error, count: total } = await sb.from('kt_products').select('*, category:kt_categories(name)', { count: 'exact' }).not('store_id', 'is', null).eq('approval_status', status).order('created_at', { ascending: false }).range(off, off + n - 1);
      if (error) throw error; await loadStoreNames((data || []).map(p => p.store_id)); return { rows: data || [], total };
    },
    renderRows: (rows, first, host) => {
      if (first) { byId.clear(); host.innerHTML = '<div class="grid" data-g></div>'; }
      rows.forEach(p => byId.set(p.id, p));
      $('[data-g]', host).insertAdjacentHTML('beforeend', rows.map(p => `<article class="card pcard-r" data-card="${p.id}"><img src="${esc(p.image)}" alt="" loading="lazy"><div><h3>${esc(p.name)} ${sBadge(PROD, p.approval_status)}</h3><p>${esc(storeNames[p.store_id] || '-')} • ${esc(p.category?.name || '-')} • ${moneyT(p.price)}${p.old_price > p.price ? ` <s>${moneyT(p.old_price)}</s>` : ''} • مخزون ${p.stock}</p><p style="margin-top:4px">${esc((p.description || '').slice(0, 160))}${(p.description || '').length > 160 ? '...' : ''}</p>${p.reject_reason ? `<p style="color:var(--red)">سبب الرفض: ${esc(p.reject_reason)}</p>` : ''}</div><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-g btn-sm" data-v="${p.id}">تفاصيل</button>${p.approval_status !== 'approved' ? `<button class="btn btn-ok btn-sm" data-a="${p.id}">اعتماد</button>` : ''}${p.approval_status !== 'rejected' ? `<button class="btn btn-d btn-sm" data-r="${p.id}">رفض</button>` : ''}</div></article>`).join(''));
    }
  });
  const upd = async (id, row, msg) => { const { error: e } = await sb.from('kt_products').update(row).eq('id', id); toast(e ? 'تعذر التنفيذ' : msg, e ? 'err' : ''); if (!e) { $(`[data-card="${id}"]`, el)?.remove(); window.Panel.refreshBadges(); } };
  el.onclick = async e => {
    const b = e.target.closest('[data-a],[data-r],[data-v]'); if (!b) return;
    if (b.dataset.a) return upd(b.dataset.a, { approval_status: 'approved', reject_reason: null }, 'تم اعتماد المنتج');
    if (b.dataset.r) { const r = await reason('رفض المنتج'); if (r) upd(b.dataset.r, { approval_status: 'rejected', reject_reason: r }, 'تم رفض المنتج'); return; }
    const p = byId.get(b.dataset.v); if (!p) return;
    modal(`<div class="dlg"><h2>${esc(p.name)}</h2><div class="upl"><img src="${esc(p.image)}" alt="" style="width:120px;height:120px"><dl class="kv"><dt>المتجر</dt><dd>${esc(storeNames[p.store_id] || '-')}</dd><dt>القسم</dt><dd>${esc(p.category?.name || '-')}</dd><dt>السعر</dt><dd>${moneyT(p.price)}</dd><dt>المخزون</dt><dd>${p.stock}</dd></dl></div><p>${esc(p.short_desc || '')}</p><p style="white-space:pre-wrap">${esc(p.description || '')}</p>${(p.features || []).length ? `<ul class="rows">${p.features.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}${(p.images || []).length > 1 ? `<div style="display:flex;gap:8px;flex-wrap:wrap">${p.images.map(i => `<img src="${esc(i)}" alt="" style="width:72px;height:72px;object-fit:cover;border-radius:10px">`).join('')}</div>` : ''}<div class="dlg__foot"><button class="btn btn-g" onclick="this.closest('dialog').close()">إغلاق</button></div></div>`);
  };
}
for (const k of Object.keys(PRROUTE)) pages['pr-' + k] = el => productRequests(el, k);
})();
