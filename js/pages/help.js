/* =====================================================================
 * js/pages/help.js
 * الوظيفة: مركز المساعدة /help.
 * يعتمد على: window.KTApp [A, K, $, $$, money, ic, pages]
 * يعرض على window.KTApp: لا شيء
 * ===================================================================== */
(() => {
'use strict';
const A = window.KTApp;
const { K, $, $$, money, ic, pages } = A;

/* ===================== #help: مركز المساعدة ===================== */
// #help #faq #support
// #page-help #route #help #faq
pages.help = () => {
  const pays = Object.values(K.payments || {}).filter(v => v.enabled).map(v => v.label).join(' أو ');
  const FAQ = [
    ['كيف أطلب من المتجر؟', `أضف المنتجات إلى السلة، ثم اضغط "إتمام الطلب" واكتب اسمك ورقم موبايلك وعنوانك واختر طريقة الدفع. تقدر تشتري بدون حساب، لكن الحساب يخلّيك تتابع طلباتك وتقيّم المنتجات.`],
    ['كم تكلفة الشحن؟', `رسوم الشحن ${money(K.shippingFee)}، ويكون الشحن مجانيًا للطلبات بقيمة ${money(K.freeShipFrom)} أو أكثر. نوصل لجميع محافظات مصر.`],
    ['ما طرق الدفع المتاحة؟', `${pays || 'الدفع أونلاين أو إنستا باي'}. بعد تأكيد الطلب تظهر لك تعليمات الدفع في صفحة نجاح الطلب.`],
    ['كيف أتتبّع طلبي؟', 'لو سجّلت دخولك: ادخل على <a href="/profile/my-orders">طلباتي</a> واضغط "تتبّع الطلب" فتفتح حالة الطلب مباشرة بدون كتابة أي بيانات. وبعد الطلب مباشرة يفتح لك زر "تتبع الطلب" نفس الشيء. لو بدون حساب: من <a href="/track.html">تتبع طلبك</a> اكتب رقم الطلب ورقم الموبايل.'],
    ['ماذا تعني حالات الطلب؟', 'تم استلام الطلب ← تم التأكيد ← في الطريق إليك ← تم التسليم. ولو تم إلغاء الطلب تظهر حالته "ملغي".'],
    ['كيف أقيّم منتج؟', 'التقييم متاح للعملاء الذين استلموا المنتج فعلًا، حتى تكون كل التقييمات حقيقية. بعد تغيّر حالة طلبك إلى "تم التسليم" ادخل على صفحة المنتج أو <a href="/profile/my-reviews">تقييماتي</a> واكتب رأيك. تقدر تعدّل تقييمك أو تحذفه في أي وقت.'],
    ['لماذا لا أستطيع تقييم منتج؟', 'غالبًا لأن طلبك لم يصل حالة "تم التسليم" بعد، أو لأنك غير مسجّل الدخول بنفس الحساب الذي طلبت منه.'],
    ['كيف أستبدل منتج؟', 'يمكنك طلب الاستبدال خلال 14 يومًا من الاستلام بشرط أن يكون المنتج بحالته الأصلية وغير مستخدم. تواصل معنا ومعك رقم الطلب. التفاصيل في <a href="/policy#returns">سياسة الاستبدال والاسترجاع</a>.'],
    ['نسيت كلمة المرور، أعمل إيه؟', 'من صفحة <a href="/auth.html">تسجيل الدخول</a> اختر "الدخول بكود يصلك على الإيميل" وسيصلك كود تدخل به مباشرة.'],
    ['ما هي صفحة "عروضك"؟', 'صفحة <a href="/yours-offer">عروضك</a> ترتّب لك المنتجات المخفّضة حسب اهتمامك: الأقسام التي تصفحتها أو أضفتها للسلة أو اشتريت منها.'],
    ['كيف يعمل البحث بالصورة؟', 'اضغط أيقونة الكاميرا في شريط البحث وارفع صورة المنتج، وسنقترح أقرب المنتجات الموجودة عندنا.']
  ];
  $('#app').innerHTML = `<div class="wrap page"><div class="help"><h1>مركز المساعدة</h1><p class="page__sub">إجابات سريعة لأكثر الأسئلة شيوعًا، ولو ما لقيت إجابتك تواصل معنا.</p>
  <div class="sbox help__q" style="margin-top:20px"><input id="hq" type="search" placeholder="ابحث في الأسئلة" aria-label="ابحث في الأسئلة"><span style="padding:0 12px;color:var(--muted)">${ic('search')}</span></div>
  <div class="quick">${[['/profile/my-orders', 'box', 'طلباتي'], ['/track.html', 'truck', 'تتبع طلبك'], ['/profile/my-reviews', 'star', 'تقييماتي'], ['/policy', 'shield', 'السياسات']].map(([h, i, t]) => `<a class="card quick__i" href="${h}">${ic(i, 'ico-lg')}<span>${t}</span></a>`).join('')}</div>
  <div id="faq" class="faq">${FAQ.map(([q, a]) => `<details class="card"><summary>${q}</summary><p>${a}</p></details>`).join('')}</div>
  <p id="faq-empty" class="card empty" hidden><span>لا توجد نتيجة مطابقة، جرّب كلمات أخرى أو تواصل معنا.</span></p>
  <div class="card help__contact"><div><h2>لسه محتاج مساعدة؟</h2><p>فريق خدمة العملاء يرد عليك يوميًا من 9 صباحًا إلى 9 مساءً.</p></div>
  <div class="help__btns"><a class="btn btn-sun" href="https://wa.me/${K.whatsapp}" target="_blank" rel="noopener">${ic('phone', 'ico-sm')}واتساب</a><a class="btn btn-ghost" href="/contact.html">${ic('mail', 'ico-sm')}راسلنا</a></div></div></div></div>`;
  const items = $$('#faq details'), norm = A.norm;
  $('#hq').addEventListener('input', e => { const q = norm(e.target.value); let n = 0; items.forEach(d => { const hit = !q || norm(d.textContent).includes(q); d.hidden = !hit; if (hit) n++; if (q && hit) d.open = true; else if (!q) d.open = false; }); $('#faq-empty').hidden = n > 0; });
};
})();
