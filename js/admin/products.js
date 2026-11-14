/* =====================================================================
 * js/admin/products.js
 * الوظيفة: المنتجات: قائمة بتحميل تدريجي (20 منتج كل مرة) وتعديل المنتج.
 * يعتمد على: js/admin/shared.js [pgh, pages] · window.Panel [sb, $, $$, esc, fmt, money, ic, toast, ask, empty, badge, sBadge, PROD, productForm]
 * يعرض على window.Panel.admin: لا شيء
 * ===================================================================== */
(() => {
'use strict';
const NS = (window.Panel.admin = window.Panel.admin || {});
const { sb, $, $$, esc, fmt, money, ic, toast, ask, empty, badge, sBadge, PROD, productForm } = window.Panel;
const { pgh, pages } = NS;   // js/admin/shared.js

/* ===================== #admin-products: المنتجات (تحميل تدريجي) ===================== */
// #admin #products #pager #product-form
// #page-products #route #admin #products
pages.products = async (el, c) => {
  const [{ data: cats }, { data: stores }] = await Promise.all([sb.from('kt_categories').select('id,name').order('sort'), sb.from('kt_stores').select('id,name')]);
  const sn = Object.fromEntries((stores || []).map(s => [s.id, s.name])), byId = new Map(); let f = 'all', q = '';
  el.innerHTML = pgh('المنتجات', '<span id="tot">...</span>', `<button class="btn btn-p" id="np">${ic('plus', 'sm')} منتج جديد</button>`) +
    `<div class="tools"><div class="chips">${[['all', 'الكل'], ['own', 'منتجاتنا'], ['sellers', 'منتجات البائعين']].map(([k, t]) => `<button class="chip" data-f="${k}" aria-pressed="${f === k}">${t}</button>`).join('')}</div><input class="field" id="q" placeholder="ابحث باسم المنتج"></div><div id="list"></div>`;
  const open = p => productForm({ p, cats: cats || [], uid: c.user.id, admin: true, onSaved: () => P.reload() });
  const P = window.Panel.pager($('#list', el), {
    size: 20, emptyHtml: empty('box', 'لا منتجات'), onTotal: n => { $('#tot', el).textContent = `${fmt(n)} منتج`; },
    fetchPage: async (off, n) => {
      let r = sb.from('kt_products').select('*, category:kt_categories(name)', { count: 'exact' }).order('created_at', { ascending: false }).range(off, off + n - 1);
      if (f === 'own') r = r.is('store_id', null); else if (f === 'sellers') r = r.not('store_id', 'is', null);
      if (q) r = r.ilike('name', `%${q}%`);
      const { data, error, count: total } = await r; if (error) throw error; return { rows: data || [], total };
    },
    renderRows: (rows, first, host) => {
      if (first) { byId.clear(); host.innerHTML = `<div class="tbl-wrap"><table class="tbl"><thead><tr>${['المنتج', 'المتجر', 'القسم', 'السعر', 'المخزون', 'الحالة', ''].map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody data-tb></tbody></table></div>`; }
      rows.forEach(p => byId.set(p.id, p));
      $('[data-tb]', host).insertAdjacentHTML('beforeend', rows.map(p => `<tr data-row="${p.id}"><td><div class="thumb"><img src="${esc(p.image)}" alt="" loading="lazy"><b>${esc(p.name)}</b></div></td><td>${esc(sn[p.store_id] || 'Kitchenly')}</td><td>${esc(p.category?.name || '-')}</td><td>${money(p.price)}${p.old_price > p.price ? '<span class="sub">عرض</span>' : ''}</td><td>${p.stock}</td><td>${sBadge(PROD, p.approval_status)} ${p.active ? '' : badge('', 'مخفي')}</td><td class="act"><button class="btn btn-g btn-sm" data-e="${p.id}">تعديل</button> <button class="btn btn-d btn-sm" data-d="${p.id}">حذف</button></td></tr>`).join(''));
    }
  });
  el.addEventListener('click', async e => {
    const b = e.target.closest('[data-e],[data-d]'); if (!b) return;
    if (b.dataset.e) return open(byId.get(b.dataset.e));
    if (!(await ask('حذف المنتج نهائيًا؟', 'حذف', true))) return;
    const { error: er } = await sb.from('kt_products').delete().eq('id', b.dataset.d); toast(er ? 'تعذر الحذف' : 'تم الحذف', er ? 'err' : '');
    if (!er) $(`[data-row="${b.dataset.d}"]`, el)?.remove();
  });
  $$('[data-f]', el).forEach(b => b.onclick = () => { f = b.dataset.f; $$('[data-f]', el).forEach(x => x.setAttribute('aria-pressed', x === b)); P.reload(); });
  $('#q', el).oninput = window.Panel.debounce(e => { q = window.Panel.qClean(e.target.value); P.reload(); });
  $('#np', el).onclick = () => open(null);
};
})();
