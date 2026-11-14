/* =====================================================================
 * js/panel/product-form.js
 * الوظيفة: نموذج المنتج المشترك بين البائع والأدمن (إضافة/تعديل منتج).
 * يعتمد على: js/panel/core.js [sb, $, esc, SLUG, rand, ic] · js/panel/ui.js [toast, modal] · js/panel/uploads.js [uploadImage, imageField, bindImage]
 * يعرض على window.Panel: productForm
 * ===================================================================== */
(() => {
'use strict';
const NS = (window.Panel = window.Panel || {});
const { sb, $, esc, SLUG, rand, ic } = NS;   // js/panel/core.js
const { toast, modal } = NS;   // js/panel/ui.js
const { uploadImage, imageField, bindImage } = NS;   // js/panel/uploads.js

/* ===================== #product-form: نموذج المنتج (مشترك: البائع + الأدمن) ===================== */
// #product-form #products #seller #admin
async function productForm({ p, cats, uid, admin = false, store = null, onSaved }) {
  const v = p || { name: '', slug: '', short_desc: '', description: '', features: [], price: '', old_price: '', image: '', images: [], stock: 20, badge: '', featured: false, active: true, category_id: cats[0]?.id };
  const f = (id, label, input, hint = '') => `<div><label class="lbl" for="${id}">${label}</label>${input}${hint ? `<p class="hint">${hint}</p>` : ''}</div>`;
  const d = modal(`<form id="pf" novalidate><h2>${p ? 'تعديل المنتج' : 'منتج جديد'}</h2>
  ${!admin && p && p.approval_status === 'rejected' ? `<p class="alert">تم رفض المنتج${p.reject_reason ? `: ${esc(p.reject_reason)}` : ''}. عدّل ما يلزم وسيعود للمراجعة.</p>` : ''}
  ${!admin ? '<p class="alert alert--info">أي تعديل في الاسم أو الصور أو الوصف يعيد المنتج للمراجعة. تعديل السعر والمخزون فوري.</p>' : ''}
  <div class="fgrid two">${f('f-name', 'اسم المنتج', `<input class="field" id="f-name" maxlength="120" value="${esc(v.name)}" required>`)}
  ${admin ? f('f-slug', 'الرابط (إنجليزي بشرطات)', `<input class="field" id="f-slug" dir="ltr" value="${esc(v.slug)}" ${p ? 'readonly' : ''} placeholder="green-brush">`, 'يظهر في /product/الرابط') : f('f-cat', 'القسم', `<select class="field" id="f-cat">${cats.map(c => `<option value="${c.id}" ${c.id === v.category_id ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select>`)}
  ${admin ? f('f-cat', 'القسم', `<select class="field" id="f-cat">${cats.map(c => `<option value="${c.id}" ${c.id === v.category_id ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select>`) : ''}
  ${f('f-price', 'السعر (جنيه)', `<input class="field" id="f-price" type="number" min="0" step="0.01" value="${v.price}">`)}
  ${f('f-old', 'السعر قبل الخصم', `<input class="field" id="f-old" type="number" min="0" step="0.01" value="${v.old_price ?? ''}">`, 'اتركه فارغًا لو مفيش خصم')}
  ${f('f-stock', 'المخزون', `<input class="field" id="f-stock" type="number" min="0" value="${v.stock}">`)}
  ${admin ? f('f-badge', 'شارة (اختياري)', `<input class="field" id="f-badge" maxlength="20" value="${esc(v.badge || '')}">`) : ''}</div>
  ${imageField('f-img', v.image, 'الصورة الرئيسية')}
  ${f('f-imgs', 'صور إضافية (رابط في كل سطر)', `<textarea class="field" id="f-imgs" dir="ltr" rows="2" placeholder="https://...">${esc((Array.isArray(v.images) ? v.images : []).filter(x => x !== v.image).join('\n'))}</textarea>`)}
  <label class="btn btn-g btn-sm" style="justify-self:start;margin-top:-8px">${ic('up', 'sm')} رفع صور إضافية<input type="file" accept="image/*" multiple id="f-imgs-f" hidden></label>
  ${f('f-short', 'وصف مختصر', `<input class="field" id="f-short" maxlength="120" value="${esc(v.short_desc || '')}">`)}
  ${f('f-desc', 'الوصف', `<textarea class="field" id="f-desc" rows="3">${esc(v.description || '')}</textarea>`)}
  ${f('f-feat', 'المميزات (كل ميزة في سطر)', `<textarea class="field" id="f-feat" rows="3">${esc((v.features || []).join('\n'))}</textarea>`)}
  <div style="display:flex;gap:24px;flex-wrap:wrap;font-size:.9rem"><label style="display:flex;gap:8px;align-items:center"><input type="checkbox" id="f-active" ${v.active ? 'checked' : ''}> ظاهر في المتجر</label>${admin ? `<label style="display:flex;gap:8px;align-items:center"><input type="checkbox" id="f-featured" ${v.featured ? 'checked' : ''}> الأكثر مبيعًا</label>` : ''}</div>
  <p id="f-err" class="alert" role="alert" hidden></p>
  <div class="dlg__foot"><button type="button" class="btn btn-g" id="f-cancel">إلغاء</button><button class="btn btn-p" id="f-save">${p ? 'حفظ التعديلات' : admin ? 'حفظ' : 'إرسال للمراجعة'}</button></div></form>`);
  bindImage(d, 'f-img', uid);
  $('#f-imgs-f', d).onchange = async e => { const ta = $('#f-imgs', d); for (const file of e.target.files) { try { const u = await uploadImage(file, uid); ta.value = (ta.value.trim() ? ta.value.trim() + '\n' : '') + u; } catch (er) { toast(er.message, 'err'); } } e.target.value = ''; };
  $('#f-cancel', d).onclick = () => d.close();
  $('#pf', d).addEventListener('submit', async e => {
    e.preventDefault(); const err = $('#f-err', d), show = m => { err.textContent = m; err.hidden = false; };
    const main = $('#f-img', d).value.trim();
    const row = { name: $('#f-name', d).value.trim(), category_id: $('#f-cat', d).value, image: main, price: Number($('#f-price', d).value), old_price: $('#f-old', d).value === '' ? null : Number($('#f-old', d).value), stock: parseInt($('#f-stock', d).value, 10), short_desc: $('#f-short', d).value.trim(), description: $('#f-desc', d).value.trim(), features: $('#f-feat', d).value.split('\n').map(s => s.trim()).filter(Boolean), images: [...new Set([main, ...$('#f-imgs', d).value.split('\n').map(s => s.trim()).filter(Boolean)].filter(Boolean))], active: $('#f-active', d).checked };
    if (admin) { row.slug = $('#f-slug', d).value.trim(); row.badge = $('#f-badge', d).value.trim() || null; row.featured = $('#f-featured', d).checked; }
    else if (!p) row.slug = `${store?.slug || 'shop'}-${rand(6)}`;
    if (!row.name) return show('اكتب اسم المنتج');
    if (!SLUG.test(row.slug || (p && p.slug) || '')) return show('الرابط يجب أن يكون حروفًا إنجليزية صغيرة وأرقامًا مفصولة بشرطات');
    if (!(row.price >= 0) || $('#f-price', d).value === '') return show('اكتب سعرًا صحيحًا');
    if (row.old_price !== null && row.old_price <= row.price) return show('السعر قبل الخصم لازم يكون أكبر من السعر الحالي');
    if (!Number.isInteger(row.stock) || row.stock < 0) return show('اكتب مخزونًا صحيحًا');
    if (!row.image) return show('أضف صورة رئيسية للمنتج');
    if (!row.description || row.description.length < 10) return show('اكتب وصفًا للمنتج (10 حروف على الأقل)');
    const btn = $('#f-save', d); btn.disabled = true;
    const { error } = p ? await sb.from('kt_products').update(row).eq('id', p.id) : await sb.from('kt_products').insert(row);
    btn.disabled = false;
    if (error) return show(error.code === '23505' ? 'هذا الرابط مستخدم لمنتج آخر' : error.message?.includes('store_not_approved') ? 'متجرك لم يتم تفعيله بعد' : 'تعذر حفظ المنتج');
    d.close(); toast(admin || p ? 'تم الحفظ' : 'تم إرسال المنتج للمراجعة'); onSaved && onSaved();
  });
}

Object.assign(NS, { productForm });
})();
