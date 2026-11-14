/* =====================================================================
 * js/pages/contact-404.js
 * الوظيفة: صفحة تواصل معنا وصفحة 404 وتحويل صفحة السياسات القديمة للصفحات الجديدة.
 * يعتمد على: window.KTApp [K, sb, $, esc, toast, emptyBox, pages]
 * يعرض على window.KTApp: لا شيء
 * ===================================================================== */
(() => {
'use strict';
const { K, sb, $, esc, toast, emptyBox, pages } = window.KTApp;

/* ===================== #contact: تواصل / 404 / تحويل السياسات القديمة ===================== */
// #contact #not-found #legacy-redirect
// #page-contact #route #contact #not-found
pages.contact = () => {
  $('#app').innerHTML = `<div class="wrap page"><h1>تواصل معنا</h1><p class="page__sub">اسأل عن منتج أو طلب، ونرد عليك في أقرب وقت.</p>
  <div class="cols" style="margin-top:20px"><form id="ct" class="card" style="padding:22px;display:grid;gap:16px"><div class="form-grid two"><div><label class="lbl" for="cn">الاسم</label><input class="field" id="cn" required maxlength="80"></div><div><label class="lbl" for="cp">رقم الموبايل (اختياري)</label><input class="field" id="cp" maxlength="20" dir="ltr" inputmode="tel"></div></div><div><label class="lbl" for="cb">رسالتك</label><textarea class="field" id="cb" rows="5" required maxlength="1000"></textarea></div><button class="btn btn-primary">إرسال الرسالة</button></form>
  <aside class="card aside"><p dir="ltr" style="text-align:start"><a href="tel:${esc(K.phone.replace(/\s/g, ''))}">${esc(K.phone)}</a></p><p style="margin:10px 0">يوميًا من 9 صباحًا إلى 9 مساءً</p><a class="btn btn-sun btn-block" href="https://wa.me/${K.whatsapp}" target="_blank" rel="noopener">راسلنا على واتساب</a></aside></div></div>`;
  $('#ct').addEventListener('submit', async e => {
    e.preventDefault(); const b = $('button', e.currentTarget); b.disabled = true;
    const { error } = await sb.from('kt_messages').insert({ name: $('#cn').value.trim(), phone: $('#cp').value.trim() || null, body: $('#cb').value.trim() });
    b.disabled = false; if (error) return toast('تعذر إرسال الرسالة، حاول مرة أخرى', 'err'); e.currentTarget.reset(); toast('تم إرسال رسالتك، شكرًا لتواصلك');
  });
};
// #page-notfound #route #contact #not-found
pages.notfound = () => { $('#app').innerHTML = `<div class="wrap page">${emptyBox('الصفحة التي تبحث عنها غير موجودة.', '/', 'العودة للرئيسية', 'notfound')}</div>`; };
/* صفحة السياسات القديمة: نحوّل للصفحات الجديدة */
// #page-policies #route #contact #not-found
pages.policies = () => { location.replace(location.hash === '#privacy' ? '/privacy' : `/policy${location.hash}`); };
})();
