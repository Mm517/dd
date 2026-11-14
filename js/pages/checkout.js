/* =====================================================================
 * js/pages/checkout.js
 * الوظيفة: إتمام الطلب والدفع (المحافظات، الشحن، طرق الدفع) وصفحة تأكيد الطلب.
 * يعتمد على: window.KTApp [K, sb, $, esc, money, imgSrc, params, Cart, shipping, emptyBox, pages, payLogos]
 * يعرض على window.KTApp: لا شيء
 * ===================================================================== */
(() => {
'use strict';
const { K, sb, $, esc, money, imgSrc, params, Cart, shipping, emptyBox, pages, payLogos } = window.KTApp;

/* ===================== #checkout: إتمام الطلب والدفع وصفحة النجاح ===================== */
// #checkout #order #payment #shipping #order-success
const GOV = ['القاهرة', 'الجيزة', 'الإسكندرية', 'القليوبية', 'الدقهلية', 'الشرقية', 'الغربية', 'المنوفية', 'كفر الشيخ', 'البحيرة', 'دمياط', 'بورسعيد', 'الإسماعيلية', 'السويس', 'شمال سيناء', 'جنوب سيناء', 'الفيوم', 'بني سويف', 'المنيا', 'أسيوط', 'سوهاج', 'قنا', 'الأقصر', 'أسوان', 'البحر الأحمر', 'الوادي الجديد', 'مطروح'];
const ERR = { invalid_name: 'تأكد من كتابة الاسم', invalid_phone: 'رقم الموبايل يجب أن يكون 11 رقمًا ويبدأ بـ 01', invalid_city: 'اختر المحافظة', invalid_address: 'اكتب عنوانًا واضحًا', empty_cart: 'السلة فارغة', product_unavailable: 'أحد المنتجات لم يعد متاحًا، راجع السلة', invalid_payment: 'اختر طريقة دفع صحيحة' };
// #page-checkout #route #checkout #order
pages.checkout = async () => {
  const items = Cart.read(), app = $('#app');
  if (!items.length) { app.innerHTML = `<div class="wrap page">${emptyBox('سلتك فارغة، أضف منتجات أولًا.', '/shop.html', 'ابدأ التسوق', 'cart')}</div>`; return; }
  const sub = Cart.subtotal(), sh = shipping(sub), meta = window.KTApp.session?.user?.user_metadata || {};
  const methods = Object.entries(K.payments).filter(([, v]) => v.enabled), first = methods[0]?.[0];
  app.innerHTML = `<div class="wrap page"><h1>إتمام الطلب</h1>
  <form id="co" class="cols" style="margin-top:20px" novalidate>
    <div class="card" style="padding:22px;display:grid;gap:16px"><div class="form-grid two">
      <div><label class="lbl" for="name">الاسم بالكامل</label><input class="field" id="name" name="name" required maxlength="80" autocomplete="name" value="${esc(meta.name || '')}"></div>
      <div><label class="lbl" for="phone">رقم الموبايل</label><input class="field" id="phone" name="phone" required inputmode="numeric" maxlength="11" dir="ltr" placeholder="01xxxxxxxxx" autocomplete="tel"></div>
      <div><label class="lbl" for="city">المحافظة</label><select class="field" id="city" name="city" required><option value="">اختر المحافظة</option>${GOV.map(g => `<option>${g}</option>`).join('')}</select></div>
      <div><label class="lbl" for="address">العنوان بالتفصيل</label><input class="field" id="address" name="address" required maxlength="300" autocomplete="street-address" placeholder="المدينة أو القرية، الشارع، رقم المبنى"></div></div>
      <div><label class="lbl" for="notes">ملاحظات (اختياري)</label><textarea class="field" id="notes" name="notes" rows="2" maxlength="300"></textarea></div>
      <fieldset style="border:0;padding:0;margin:0"><legend class="lbl">طريقة الدفع</legend><div class="pay">${methods.map(([k, v]) => `<label><input type="radio" name="payment" value="${k}" ${k === first ? 'checked' : ''}><span><b>${esc(v.label)}</b><small>${esc(v.hint)}</small></span>${payLogos(k === 'instapay' ? ['instapay'] : ['paymob', 'visa'], 'pay__logos')}</label>`).join('')}</div></fieldset>
      <p id="co-err" class="alert" role="alert" hidden></p></div>
    <aside class="card aside"><h2>طلبك</h2><ul class="mini" style="display:grid;gap:10px">${items.map(i => `<li><img src="${esc(imgSrc(i))}" alt=""><span class="n">${esc(i.name)} <span style="color:var(--muted)">x${i.qty}</span></span><b>${money(i.price * i.qty)}</b></li>`).join('')}</ul>
      <dl class="rows" style="margin-top:14px;border-top:1px solid var(--line);padding-top:14px"><div><dt>المجموع الفرعي</dt><dd>${money(sub)}</dd></div><div><dt>الشحن</dt><dd>${sh ? money(sh) : 'مجاني'}</dd></div><div class="tot"><dt>الإجمالي</dt><dd>${money(sub + sh)}</dd></div></dl>
      <button class="btn btn-primary btn-block" id="co-btn" style="margin-top:16px">تأكيد الطلب</button><a href="/cart.html" class="link-btn" style="display:block;text-align:center;margin-top:10px">العودة إلى السلة</a></aside></form></div>`;
  $('#co').addEventListener('submit', async e => {
    e.preventDefault(); const v = Object.fromEntries(new FormData(e.currentTarget)), err = $('#co-err'), btn = $('#co-btn');
    const show = m => { err.textContent = m; err.hidden = false; err.scrollIntoView({ block: 'center' }); };
    err.hidden = true;
    if (!v.name.trim()) return show(ERR.invalid_name); if (!/^01[0-9]{9}$/.test(v.phone.trim())) return show(ERR.invalid_phone); if (!v.city) return show(ERR.invalid_city); if (!v.address.trim()) return show(ERR.invalid_address); if (!v.payment) return show(ERR.invalid_payment);
    btn.disabled = true; btn.textContent = 'جارٍ إرسال الطلب';
    const { data, error } = await sb.rpc('kt_place_order', { p_name: v.name, p_phone: v.phone.trim(), p_city: v.city, p_address: v.address, p_notes: v.notes || null, p_payment: v.payment, p_items: Cart.read().map(i => ({ slug: i.slug, qty: i.qty })) });
    btn.disabled = false; btn.textContent = 'تأكيد الطلب';
    if (error) { const m = (error.message || '').match(/out_of_stock:(.+)/); return show(m ? `الكمية المطلوبة من "${m[1]}" غير متاحة، عدّلها من السلة` : ERR[(error.message || '').trim()] || 'تعذر إرسال الطلب، حاول مرة أخرى'); }
    try { localStorage.setItem('kt_last', JSON.stringify({ no: data.order_no, phone: v.phone.trim() })); } catch { /* التخزين محجوب */ }
    Cart.clear(); location.href = `/order-success.html?no=${encodeURIComponent(data.order_no)}&total=${data.total}&pay=${encodeURIComponent(v.payment)}`;
  });
};

/* صفحة النجاح: هنا تتعلق تعليمات الدفع. اربط البوابة من js/core/config.js (K.payments). */
// #page-success #route #checkout #order
pages.success = () => {
  const no = params.get('no'), total = params.get('total'), pay = params.get('pay');
  const P = K.payments || {}; let box = '';
  if (pay === 'instapay') {
    const to = P.instapay?.handle || P.instapay?.phone;
    box = `<div class="paybox"><b>الدفع عبر إنستا باي</b>${payLogos(['instapay'])}<p style="margin-top:6px">${to ? `حوّل ${money(total)} إلى: <b dir="ltr">${esc(to)}</b> واكتب رقم الطلب في الملاحظات.` : 'سنرسل لك بيانات التحويل على رقم الموبايل خلال دقائق.'}</p></div>`;
  } else if (pay === 'online') {
    const u = P.online?.checkoutUrl;
    box = `<div class="paybox"><b>الدفع أونلاين</b>${payLogos(['paymob', 'visa'])}<p style="margin-top:6px">${u ? 'أكمل الدفع بأمان من خلال الزر التالي.' : 'سنرسل لك رابط الدفع الآمن على رقم الموبايل.'}</p>${u ? `<a class="btn btn-primary" style="margin-top:10px" href="${esc(u)}${u.includes('?') ? '&' : '?'}order=${encodeURIComponent(no || '')}&amount=${encodeURIComponent(total || '')}">ادفع الآن</a>` : ''}</div>`;
  }
  $('#app').innerHTML = `<div class="wrap page"><div class="card center wide" style="text-align:center"><img class="hero-ic hero-ic--ok" src="/assets/img/states/order-success.webp" alt="" width="150" height="150"><h1>تم استلام طلبك</h1>
  <p class="page__sub">سنتواصل معك على رقم الموبايل لتأكيد الطلب وموعد التوصيل.</p>
  ${no ? `<p style="margin-top:20px;color:var(--muted);font-size:.9rem">رقم الطلب</p><p style="font-size:1.6rem;font-weight:600;color:var(--green-d)" dir="ltr">${esc(no)}</p>${total ? `<p>الإجمالي ${money(total)}</p>` : ''}` : ''}${box}
  <div class="buyrow" style="justify-content:center;margin-top:24px"><a class="btn btn-primary" href="/track.html${no ? `?no=${encodeURIComponent(no)}` : ''}">تتبع الطلب</a><a class="btn btn-ghost" href="/shop.html">متابعة التسوق</a></div></div></div>`;
};
})();
