/* =====================================================================
 * js/seller/store.js
 * الوظيفة: بيانات متجر البائع (جدول kt_stores).
 * يعتمد على: js/seller/shared.js [GOVS, BTYPES, field, sel, approved, pgh, pages] · js/seller/auth.js [statusBanner] · window.Panel [sb, $, esc, ic, toast, imageField, bindImage]
 * يعرض على window.Panel.seller: لا شيء
 * ===================================================================== */
(() => {
'use strict';
const NS = (window.Panel.seller = window.Panel.seller || {});
const { sb, $, esc, ic, toast, imageField, bindImage } = window.Panel;
const { GOVS, BTYPES, field, sel, approved, pgh, pages } = NS;   // js/seller/shared.js
const { statusBanner } = NS;   // js/seller/auth.js

/* ===================== #seller-store: المتجر ===================== */
// #seller #store #profile
// #page-store #route #seller #store
pages.store = async (el, c) => {
  const s = c.store, editable = ['pending', 'approved', 'rejected'].includes(s.status);
  el.innerHTML = statusBanner(c) + pgh('بيانات المتجر', 'هذه البيانات تظهر للعملاء في صفحة متجرك', approved(c) ? `<a class="btn btn-g" href="/store/${esc(s.slug)}" target="_blank" rel="noopener">${ic('ext', 'sm')} عرض صفحة المتجر</a>` : '') +
    `<form class="card" id="f" novalidate style="display:grid;gap:16px;max-width:760px">${imageField('lg', s.logo, 'شعار المتجر')}${imageField('cv', s.cover, 'صورة الغلاف (اختياري)')}
    <div class="fgrid two">${field('nm', 'اسم المتجر', `maxlength="60" value="${esc(s.name)}" required`)}${field('sl', 'رابط المتجر', `dir="ltr" value="${esc(s.slug)}" readonly`, 'لا يمكن تغييره بعد الإنشاء')}${field('ph', 'رقم الموبايل', `type="tel" dir="ltr" value="${esc(s.phone || '')}"`)}${field('wa', 'واتساب (اختياري)', `type="tel" dir="ltr" value="${esc(s.whatsapp || '')}"`)}${sel('ct', 'المحافظة', GOVS, s.city, 'اختر')}${sel('bt', 'نوع النشاط', BTYPES, s.business_type, 'اختر')}</div>
    <div><label class="lbl" for="ds">نبذة عن المتجر</label><textarea class="field" id="ds" rows="3" maxlength="400">${esc(s.description || '')}</textarea></div>
    <p id="err" class="alert" hidden></p><div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn btn-p" id="sv" ${editable ? '' : 'disabled'}>حفظ</button>${s.status === 'rejected' ? '<button type="button" class="btn btn-g" id="rs">حفظ وإعادة الإرسال للمراجعة</button>' : ''}</div></form>`;
  bindImage(el, 'lg', c.user.id); bindImage(el, 'cv', c.user.id);
  const save = async resubmit => {
    const err = $('#err'); err.hidden = true; const row = { name: $('#nm').value.trim(), phone: $('#ph').value.trim(), whatsapp: $('#wa').value.trim() || null, city: $('#ct').value || null, business_type: $('#bt').value || null, description: $('#ds').value.trim(), logo: $('#lg').value.trim() || null, cover: $('#cv').value.trim() || null };
    if (row.name.length < 2) { err.textContent = 'اكتب اسم المتجر'; err.hidden = false; return; }
    if (resubmit) row.status = 'pending';
    const { error } = await sb.from('kt_stores').update(row).eq('id', s.id); if (error) { err.textContent = 'تعذر الحفظ'; err.hidden = false; return; }
    toast(resubmit ? 'تم إرسال المتجر للمراجعة' : 'تم الحفظ'); window.Panel.refresh();
  };
  $('#f').onsubmit = e => { e.preventDefault(); save(false); }; $('#rs')?.addEventListener('click', () => save(true));
};
})();
