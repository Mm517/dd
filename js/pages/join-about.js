/* =====================================================================
 * js/pages/join-about.js
 * الوظيفة: انضم إلينا /join-us ومن نحن /about.
 * يعتمد على: window.KTApp [K, sb, $, money, ic, pages]
 * يعرض على window.KTApp: لا شيء
 * ===================================================================== */
(() => {
'use strict';
const A = window.KTApp;
const { K, sb, $, money, ic, pages } = A;

/* ===================== #join-us: انضم إلينا ===================== */
// #join-us #seller #team
// #page-join #route #join-us #about
pages.join = () => {
  const ROLES = [['delivery', 'مندوب توصيل', 'st-ship', 'وصّل طلبات Kitchenly في منطقتك'], ['partner', 'شريك بيع أو مورّد', 'box', 'اعرض منتجاتك معنا أو وفّرها لنا'], ['affiliate', 'تسويق بالعمولة', 'tag', 'روّج للمتجر وسجّل عملاءك'], ['team', 'العمل مع الفريق', 'users', 'خدمة عملاء، تجهيز طلبات، تصميم، وغيرها']];
  $('#app').innerHTML = `<div class="wrap page"><div class="join"><div class="join__hero">${ic('join', 'hero-ic')}<h1>انضم إلينا</h1></div><p class="page__sub">عايز تشتغل معانا أو تبقى شريك نجاح؟ اختر المجال واكتب بياناتك وهنتواصل معاك.</p>
  <form id="jf" class="card" style="padding:22px;display:grid;gap:16px;margin-top:20px" novalidate>
    <fieldset class="join__roles"><legend class="lbl">تحب تنضم كـ</legend>${ROLES.map(([k, t, i, d], n) => `<label class="role"><input type="radio" name="role" value="${t}" ${n === 0 ? 'checked' : ''}><span>${ic(i, 'ico-lg')}<b>${t}</b><small>${d}</small></span></label>`).join('')}</fieldset>
    <div class="form-grid two"><div><label class="lbl" for="jn">الاسم</label><input class="field" id="jn" required maxlength="80" autocomplete="name"></div><div><label class="lbl" for="jp">رقم الموبايل</label><input class="field" id="jp" required inputmode="numeric" maxlength="11" dir="ltr" placeholder="01xxxxxxxxx" autocomplete="tel"></div>
    <div><label class="lbl" for="je">البريد الإلكتروني (اختياري)</label><input class="field" id="je" type="email" dir="ltr" maxlength="100" autocomplete="email"></div><div><label class="lbl" for="jc">المحافظة / المنطقة</label><input class="field" id="jc" maxlength="60"></div></div>
    <div><label class="lbl" for="jm">عرّفنا بنفسك</label><textarea class="field" id="jm" rows="4" maxlength="500" placeholder="خبرتك، وإيه اللي تحب تعمله معانا"></textarea></div>
    <p class="alert" id="j-err" role="alert" hidden></p><button class="btn btn-primary" id="j-btn">إرسال الطلب</button></form>
  <div class="card empty join__ok" id="j-ok" hidden><span class="okmark">${ic('check', 'ico-lg')}</span><h2>وصل طلبك، شكرًا لك</h2><p>هنتواصل معاك على رقم الموبايل في أقرب وقت.</p><a class="btn btn-primary" href="/">العودة للرئيسية</a></div></div></div>`;
  $('#jf').addEventListener('submit', async e => {
    e.preventDefault(); const err = $('#j-err'), v = Object.fromEntries(new FormData(e.currentTarget)), show = m => { err.textContent = m; err.hidden = false; };
    err.hidden = true; const name = $('#jn').value.trim(), phone = $('#jp').value.trim(), mail = $('#je').value.trim();
    if (!name) return show('اكتب اسمك'); if (!/^01[0-9]{9}$/.test(phone)) return show('رقم الموبايل يجب أن يكون 11 رقمًا ويبدأ بـ 01');
    if (mail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) return show('اكتب بريدًا إلكترونيًا صحيحًا');
    const text = `[طلب انضمام: ${v.role}] المحافظة: ${$('#jc').value.trim() || '-'}${mail ? ` | البريد: ${mail}` : ''}\n${$('#jm').value.trim()}`.slice(0, 1000);
    const b = $('#j-btn'); b.disabled = true;
    const { error } = await sb.from('kt_messages').insert({ name, phone, body: text });
    b.disabled = false; if (error) return show('تعذر إرسال الطلب، حاول مرة أخرى');
    $('#jf').hidden = true; $('#j-ok').hidden = false; window.scrollTo({ top: 0, behavior: 'smooth' });
  });
};

/* ===================== #about: من نحن ===================== */
// #about #team #trust
// #page-about #route #join-us #about
pages.about = () => {
  const pts = [['box', 'تجهيز وتغليف بعناية', 'كل طلب بيتجهّز ويتراجع قبل ما يخرج، ويتغلّف بشكل يحميه في الطريق.'], ['truck', 'توصيل لكل المحافظات', `شحن لجميع محافظات مصر، ومجاني للطلبات فوق ${money(K.freeShipFrom)}.`], ['check', 'جودة مضمونة', 'منتجاتنا مختارة ومجرّبة، والاستبدال متاح خلال 14 يومًا.']];
  $('#app').innerHTML = `<div class="wrap page"><div class="about">
    <figure class="about__hero"><img src="/assets/img/states/team.webp" alt="فريق تجهيز وتغليف الطلبات في المخزن" width="1200" height="931" loading="eager" decoding="async"><figcaption><h1>إحنا Kitchenly</h1><p>فريق بيجهّز طلبك بإيده، من المخزن لباب بيتك.</p></figcaption></figure>
    <p class="about__lead">بدأنا Kitchenly عشان نوفّر أدوات تنظيف وتنظيم للمطبخ بجودة تعتمد عليها وسعر عادل. بنختار كل منتج بنفسنا، ونجهّز كل طلب بعناية، ونوصّله لحد بابك.</p>
    <div class="about__pts">${pts.map(([i, t, d]) => `<div class="card about__pt">${ic(i, 'ico-lg')}<h2>${t}</h2><p>${d}</p></div>`).join('')}</div>
    <div class="about__cta"><a class="btn btn-primary" href="/shop.html">ابدأ التسوق</a><a class="btn btn-ghost" href="/contact.html">تواصل معنا</a><a class="btn btn-ghost" href="/join-us">انضم إلينا</a></div></div></div>`;
};
})();
