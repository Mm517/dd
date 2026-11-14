/* =====================================================================
 * js/seller/settings.js
 * الوظيفة: إعدادات البائع وصفحة المساعدة (رسائل kt_messages).
 * يعتمد على: js/seller/shared.js [errMsg, field, sel, pgh, pages] · window.Panel [sb, $, esc, toast]
 * يعرض على window.Panel.seller: لا شيء
 * ===================================================================== */
(() => {
'use strict';
const NS = (window.Panel.seller = window.Panel.seller || {});
const { sb, $, esc, toast } = window.Panel;
const { errMsg, field, sel, pgh, pages } = NS;   // js/seller/shared.js

/* ===================== #seller-settings: الإعدادات ===================== */
// #seller #settings
// #page-settings #route #seller #settings
pages.settings = async (el, c) => {
  const s = c.store, u = c.user;
  el.innerHTML = pgh('الإعدادات', 'الحساب وبيانات استلام الأرباح والإشعارات') +
    `<div class="grid" style="max-width:760px"><form class="card" id="fa" style="display:grid;gap:14px"><h3>الحساب</h3>${field('em', 'البريد الإلكتروني', `dir="ltr" value="${esc(u.email)}" readonly`)}${field('on', 'اسمك', `maxlength="80" value="${esc(u.user_metadata?.name || '')}"`)}<div><button class="btn btn-p">حفظ</button></div></form>
    <form class="card" id="fp" style="display:grid;gap:14px"><h3>تغيير كلمة المرور</h3>${field('p1', 'كلمة المرور الجديدة', 'type="password" dir="ltr" minlength="8" autocomplete="new-password"', '8 حروف على الأقل')}${field('p2', 'تأكيد كلمة المرور', 'type="password" dir="ltr" autocomplete="new-password"')}<p id="perr" class="alert" hidden></p><div><button class="btn btn-p">تحديث كلمة المرور</button></div></form>
    <form class="card" id="fo" style="display:grid;gap:14px"><h3>استلام الأرباح</h3><div class="fgrid two">${sel('pm', 'الطريقة', [['instapay', 'إنستا باي'], ['wallet', 'محفظة إلكترونية'], ['bank', 'حساب بنكي']], s.payout_method)}${field('pa', 'الحساب / الرقم', `dir="ltr" value="${esc(s.payout_account || '')}" placeholder="name@instapay أو 01xxxxxxxxx"`)}</div><p class="hint">تأكد من صحة البيانات، التحويلات بتتم عليها.</p><div><button class="btn btn-p">حفظ</button></div></form>
    <form class="card" id="fn" style="display:grid;gap:12px"><h3>الإشعارات</h3><label style="display:flex;gap:10px;align-items:center"><input type="checkbox" id="n1" ${s.notify_orders ? 'checked' : ''}> إشعار عند وصول طلب جديد</label><label style="display:flex;gap:10px;align-items:center"><input type="checkbox" id="n2" ${s.notify_marketing ? 'checked' : ''}> نصائح وعروض للبائعين</label><div><button class="btn btn-p">حفظ</button></div></form></div>`;
  $('#fa').onsubmit = async e => { e.preventDefault(); const { error } = await sb.auth.updateUser({ data: { name: $('#on').value.trim() } }); toast(error ? 'تعذر الحفظ' : 'تم الحفظ', error ? 'err' : ''); };
  $('#fp').onsubmit = async e => { e.preventDefault(); const er = $('#perr'), a = $('#p1').value; er.hidden = true; if (a.length < 8) { er.textContent = 'كلمة المرور 8 حروف على الأقل'; er.hidden = false; return; } if (a !== $('#p2').value) { er.textContent = 'كلمتا المرور غير متطابقتين'; er.hidden = false; return; } const { error } = await sb.auth.updateUser({ password: a }); if (error) { er.textContent = errMsg(error); er.hidden = false; return; } $('#fp').reset(); toast('تم تحديث كلمة المرور'); };
  $('#fo').onsubmit = async e => { e.preventDefault(); const { error } = await sb.from('kt_stores').update({ payout_method: $('#pm').value, payout_account: $('#pa').value.trim() || null }).eq('id', s.id); toast(error ? 'تعذر الحفظ' : 'تم الحفظ', error ? 'err' : ''); window.Panel.refresh(); };
  $('#fn').onsubmit = async e => { e.preventDefault(); const { error } = await sb.from('kt_stores').update({ notify_orders: $('#n1').checked, notify_marketing: $('#n2').checked }).eq('id', s.id); toast(error ? 'تعذر الحفظ' : 'تم الحفظ', error ? 'err' : ''); };
};

/* ===================== #seller-help: المساعدة ===================== */
// #seller #help #support
// #page-help #route #seller #settings
pages.help = async (el, c) => {
  const faq = [['كم عمولة Kitchenly؟', `العمولة ${c.store.commission_rate}% من قيمة الطلبات المُسلّمة فقط. لا رسوم اشتراك ولا رسوم على الطلبات الملغية.`], ['إزاي بيتم شحن الطلبات؟', 'Kitchenly بتتولى الشحن والتحصيل وتحديث حالة الطلب. أنت بتجهّز المنتجات وبنتواصل معاك لاستلامها.'], ['متى يظهر منتجي في الموقع؟', 'بعد مراجعة فريق Kitchenly (غالبًا خلال ساعات). أي تعديل على الاسم أو الصور أو الوصف يرجّع المنتج للمراجعة، أما السعر والمخزون فبيتحدثوا فورًا.'], ['متى أقدر أسحب أرباحي؟', 'الرصيد بيُحسب من الطلبات اللي حالتها "تم التسليم". اطلب السحب من صفحة المدفوعات بحد أدنى 100 جنيه، والتحويل بيتم على إنستا باي أو المحفظة اللي سجلتها.'], ['إزاي الإعلانات بتشتغل؟', 'بتختار منتج ومكان الظهور وسعر النقرة وميزانية. بعد موافقة Kitchenly بيظهر الإعلان بعلامة "مُموّل" وبتدفع فقط عند النقر، ويتوقف عند نفاد الميزانية. الإنفاق بيتخصم من أرباحك أو رصيدك الإعلاني.'], ['ليه منتجي اترفض؟', 'هتلاقي السبب تحت المنتج في صفحة المنتجات. الأسباب الشائعة: صور غير واضحة، وصف ناقص، أو منتج غير مسموح به. عدّل وأعد الإرسال.']];
  el.innerHTML = pgh('المساعدة', 'إجابات سريعة، ولو احتجت أكتر ابعتلنا') + `<div class="grid g-main"><div><h3 style="margin-bottom:12px">الأسئلة الشائعة</h3>${faq.map(([q, a]) => `<details class="faq"><summary>${q}</summary><p>${esc(a)}</p></details>`).join('')}</div>
  <form class="card" id="hf" style="display:grid;gap:12px;align-self:start"><h3>تواصل مع الدعم</h3>${field('hs', 'الموضوع', 'maxlength="80" required')}<div><label class="lbl" for="hb">رسالتك</label><textarea class="field" id="hb" rows="5" maxlength="1000" required></textarea></div><p id="err" class="alert" hidden></p><button class="btn btn-p">إرسال</button><p class="hint">أو عبر واتساب: <a class="btn-link" dir="ltr" target="_blank" rel="noopener" href="https://wa.me/${esc(window.KT.whatsapp)}">${esc(window.KT.phone)}</a></p></form></div>`;
  $('#hf').onsubmit = async e => { e.preventDefault(); const err = $('#err'), sub = $('#hs').value.trim(), body = $('#hb').value.trim(); if (sub.length < 3 || body.length < 10) { err.textContent = 'اكتب الموضوع والرسالة'; err.hidden = false; return; } const { error } = await sb.from('kt_messages').insert({ name: `${c.store.name} (بائع)`, phone: c.store.phone || '', body: `[دعم بائع] ${sub}\n${body}\nالإيميل: ${c.user.email}` }); if (error) { err.textContent = 'تعذر الإرسال'; err.hidden = false; return; } $('#hf').reset(); toast('تم إرسال رسالتك، سنرد قريبًا'); };
};
})();
