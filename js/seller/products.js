/* =====================================================================
 * js/seller/products.js
 * الوظيفة: منتجات البائع (إضافة/تعديل).
 * يعتمد على: js/seller/shared.js [tbl, pgh, pages] · window.Panel [sb, $, $$, esc, money, ic, toast, ask, empty, sBadge, PROD, productForm]
 * يعرض على window.Panel.seller: لا شيء
 * ===================================================================== */
(() => {
'use strict';
const NS = (window.Panel.seller = window.Panel.seller || {});
const { sb, $, $$, esc, money, ic, toast, ask, empty, sBadge, PROD, productForm } = window.Panel;
const { tbl, pgh, pages } = NS;   // js/seller/shared.js

/* ===================== #seller-products: المنتجات ===================== */
// #seller #products #product-form
// #page-products #route #seller #products
pages.products = async (el, c) => {
  const [{ data: cats }, { data: list, error }] = await Promise.all([sb.from('kt_categories').select('*').order('sort'), sb.from('kt_products').select('*, category:kt_categories(name)').eq('store_id', c.store.id).order('created_at', { ascending: false })]);
  if (error) throw error; let f = 'all', q = '';
  const open = p => productForm({ p, cats: cats || [], uid: c.user.id, store: c.store, onSaved: () => pages.products(el, c) });
  const draw = () => {
    const rows = list.filter(p => (f === 'all' || p.approval_status === f) && (!q || p.name.toLowerCase().includes(q)));
    el.innerHTML = pgh('المنتجات', 'كل منتج جديد يُراجع من فريق Kitchenly قبل ظهوره في الموقع.', `<button class="btn btn-p" id="np">${ic('plus', 'sm')} منتج جديد</button>`) +
      `<div class="tools"><div class="chips">${[['all', 'الكل'], ['approved', 'معتمد'], ['pending', 'قيد المراجعة'], ['rejected', 'مرفوض']].map(([k, t]) => `<button class="chip" data-f="${k}" aria-pressed="${f === k}">${t} (${k === 'all' ? list.length : list.filter(p => p.approval_status === k).length})</button>`).join('')}</div><input class="field" id="q" placeholder="ابحث باسم المنتج" value="${esc(q)}"></div>` +
      tbl(['المنتج', 'القسم', 'السعر', 'المخزون', 'الحالة', ''], rows.map(p => `<tr><td><div class="thumb"><img src="${esc(p.image)}" alt="" loading="lazy"><div><b>${esc(p.name)}</b>${p.approval_status === 'rejected' && p.reject_reason ? `<span class="sub" style="color:var(--red)">سبب الرفض: ${esc(p.reject_reason)}</span>` : `<span class="sub">${p.active ? 'ظاهر' : 'مخفي'}</span>`}</div></div></td><td>${esc(p.category?.name || '-')}</td><td>${money(p.price)}${p.old_price > p.price ? '<span class="sub">عليه خصم</span>' : ''}</td><td>${p.stock <= 5 ? `<b style="color:var(--red)">${p.stock}</b>` : p.stock}</td><td>${sBadge(PROD, p.approval_status)}</td><td class="act">${p.approval_status === 'approved' ? `<a class="btn btn-g btn-sm" href="/product/${esc(p.slug)}" target="_blank" rel="noopener">عرض</a> ` : ''}<button class="btn btn-g btn-sm" data-e="${p.id}">تعديل</button> <button class="btn btn-d btn-sm" data-d="${p.id}">حذف</button></td></tr>`), empty('box', list.length ? 'لا نتائج مطابقة' : 'لم تضف منتجات بعد', list.length ? '' : 'أضف أول منتج وسيراجعه الفريق خلال ساعات.', list.length ? '' : '<button class="btn btn-p" id="np2">إضافة منتج</button>'));
    $$('[data-f]').forEach(b => b.onclick = () => { f = b.dataset.f; draw(); });
    $('#q').oninput = e => { q = e.target.value.trim().toLowerCase(); const pos = e.target.selectionStart; draw(); const n = $('#q'); n.focus(); n.setSelectionRange(pos, pos); };
    $('#np').onclick = () => open(null); $('#np2')?.addEventListener('click', () => open(null));
    $$('[data-e]').forEach(b => b.onclick = () => open(list.find(p => p.id === b.dataset.e)));
    $$('[data-d]').forEach(b => b.onclick = async () => { if (!(await ask('حذف المنتج نهائيًا؟', 'حذف', true))) return; const { error: e } = await sb.from('kt_products').delete().eq('id', b.dataset.d); toast(e ? (/has_orders/.test(e.message) ? 'المنتج عليه طلبات سابقة ولا يمكن حذفه. أخفِه بإلغاء "ظاهر في المتجر" من التعديل' : 'تعذر الحذف (قد يكون عليه إعلان)') : 'تم الحذف', e ? 'err' : ''); if (!e) pages.products(el, c); });
  };
  draw();
};
})();
