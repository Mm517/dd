/* =====================================================================
 * js/admin/categories.js
 * الوظيفة: إدارة الأقسام.
 * يعتمد على: js/admin/shared.js [field, tbl, pgh, pages] · window.Panel [sb, $, $$, esc, ic, toast, modal, ask, empty, SLUG]
 * يعرض على window.Panel.admin: لا شيء
 * ===================================================================== */
(() => {
'use strict';
const NS = (window.Panel.admin = window.Panel.admin || {});
const { sb, $, $$, esc, ic, toast, modal, ask, empty, SLUG } = window.Panel;
const { field, tbl, pgh, pages } = NS;   // js/admin/shared.js

/* ===================== #admin-categories: الأقسام ===================== */
// #admin #categories
// #page-categories #route #admin #categories
pages.categories = async el => {
  const { data, error } = await sb.from('kt_categories').select('*').order('sort'); if (error) throw error;
  el.innerHTML = pgh('الأقسام', 'أقسام المتجر وترتيبها', `<button class="btn btn-p" id="nc">${ic('plus', 'sm')} قسم جديد</button>`) + tbl(['الترتيب', 'الاسم', 'الرابط', ''], data.map(c => `<tr><td>${c.sort ?? ''}</td><td><b>${esc(c.name)}</b></td><td dir="ltr" style="text-align:start">/category/${esc(c.slug)}</td><td class="act"><button class="btn btn-g btn-sm" data-e="${c.id}">تعديل</button> <button class="btn btn-d btn-sm" data-d="${c.id}">حذف</button></td></tr>`), empty('layers', 'لا أقسام'));
  const form = c => {
    const d = modal(`<form id="cf" novalidate><h2>${c ? 'تعديل القسم' : 'قسم جديد'}</h2>${field('cn', 'الاسم', `maxlength="40" value="${esc(c?.name || '')}"`)}${field('cs', 'الرابط (إنجليزي)', `dir="ltr" value="${esc(c?.slug || '')}" ${c ? 'readonly' : ''}`)}${field('co', 'الترتيب', `type="number" value="${c?.sort ?? data.length + 1}"`)}<p id="err" class="alert" hidden></p><div class="dlg__foot"><button type="button" class="btn btn-g" id="cx">إلغاء</button><button class="btn btn-p">حفظ</button></div></form>`);
    $('#cx', d).onclick = () => d.close();
    $('#cf', d).onsubmit = async e => { e.preventDefault(); const err = $('#err', d), row = { name: $('#cn', d).value.trim(), slug: $('#cs', d).value.trim(), sort: +$('#co', d).value || 0 }; if (!row.name) { err.textContent = 'اكتب الاسم'; err.hidden = false; return; } if (!SLUG.test(row.slug)) { err.textContent = 'الرابط حروف إنجليزية صغيرة وأرقام وشرطات'; err.hidden = false; return; } const { error: er } = c ? await sb.from('kt_categories').update(row).eq('id', c.id) : await sb.from('kt_categories').insert(row); if (er) { err.textContent = er.code === '23505' ? 'الرابط مستخدم' : 'تعذر الحفظ'; err.hidden = false; return; } d.close(); toast('تم الحفظ'); pages.categories(el); };
  };
  $('#nc').onclick = () => form(null); $$('[data-e]').forEach(b => b.onclick = () => form(data.find(c => c.id === b.dataset.e)));
  $$('[data-d]').forEach(b => b.onclick = async () => { if (!(await ask('حذف القسم؟ لو عليه منتجات ممكن الحذف يفشل.', 'حذف', true))) return; const { error: e } = await sb.from('kt_categories').delete().eq('id', b.dataset.d); toast(e ? 'تعذر الحذف (القسم عليه منتجات)' : 'تم الحذف', e ? 'err' : ''); if (!e) pages.categories(el); });
};
})();
