/* =====================================================================
 * js/seller/auth.js
 * الوظيفة: دخول البائع وإنشاء حسابه (بدون شل) + الحماية وبانر حالة المتجر.
 * يعتمد على: js/seller/shared.js [BASE, GOVS, BTYPES, errMsg, field, sel] · window.Panel [sb, $, esc, ic, toast, errBox, SLUG, rand, go]
 * يعرض على window.Panel.seller: loginView, signupView, guard, locked, statusBanner
 * ===================================================================== */
(() => {
'use strict';
const NS = (window.Panel.seller = window.Panel.seller || {});
const { sb, $, esc, ic, toast, errBox, SLUG, rand, go } = window.Panel;
const { BASE, GOVS, BTYPES, errMsg, field, sel } = NS;   // js/seller/shared.js

/* ===================== #seller-auth: الدخول والتسجيل (بدون شل) ===================== */
// #seller #auth #login #signup
const authLayout = (inner, art = true) => `<div class="auth"><section class="auth__art">${window.Panel.authBrand('للبائعين')}
  <div><h2>اعرض منتجاتك لآلاف العملاء على Kitchenly</h2><ul>
  <li>${ic('store')}<span>متجر خاص بك على الموقع بصفحة ورابط مستقل</span></li>
  <li>${ic('chart')}<span>لوحة تحكم بالطلبات والتحليلات والمدفوعات</span></li>
  <li>${ic('mega')}<span>إعلانات وحملات توصّل منتجك لعملاء أكثر</span></li>
  <li>${ic('shield')}<span>مراجعة سريعة للمنتجات، وسحب أرباحك بإنستا باي</span></li></ul><img src="/assets/img/pages/${location.pathname.endsWith('/signup') ? 'seller-signup' : 'seller-login-scooter'}.webp" alt="" width="280" height="280" style="margin-top:20px;width:min(280px,65%);height:auto;border-radius:20px;background:#fff"></div>
  <p style="opacity:.6;font-size:.85rem">© Kitchenly ${new Date().getFullYear()}</p></section>
  <section class="auth__form"><div class="auth__box">${inner}</div></section></div>`;

function loginView(root, { next }) {
  let mode = 'login', pending = '';
  const draw = async () => {
    const { data: { session } } = await sb.auth.getSession();
    if (session && mode === 'login' && !pending) { go(next, true); return; }
    if (mode === 'verify') {
      root.innerHTML = authLayout(`<div><h1>أدخل كود الدخول</h1><p>أرسلنا كودًا إلى <b dir="ltr">${esc(pending)}</b></p></div><form id="f" class="fgrid" novalidate>${field('code', 'الكود', 'inputmode="numeric" autocomplete="one-time-code" maxlength="8" placeholder="------"').replace('class="field"', 'class="field code-in"')}<p id="err" class="alert" hidden></p><button class="btn btn-p btn-block" id="b">تأكيد</button></form><p style="text-align:center;font-size:.9rem"><button class="link-b" id="back">رجوع</button></p>`);
      $('#back').onclick = () => { mode = 'otp'; draw(); };
      $('#f').onsubmit = async e => { e.preventDefault(); const t = $('#code').value.replace(/\D/g, ''), err = $('#err'); err.hidden = true; if (t.length < 6) { err.textContent = 'اكتب الكود كاملًا'; err.hidden = false; return; } $('#b').disabled = true; const { error } = await sb.auth.verifyOtp({ email: pending, token: t, type: 'email' }); $('#b').disabled = false; if (error) { err.textContent = errMsg(error); err.hidden = false; return; } go(next, true); };
      return;
    }
    const otp = mode === 'otp';
    root.innerHTML = authLayout(`<div><h1>تسجيل دخول البائع</h1><p>ادخل إلى لوحة متجرك على Kitchenly.</p></div>
    <form id="f" class="fgrid" novalidate>${field('em', 'البريد الإلكتروني', 'type="email" dir="ltr" autocomplete="email" required')}${otp ? '' : field('pw', 'كلمة المرور', 'type="password" dir="ltr" autocomplete="current-password" required')}<p id="err" class="alert" role="alert" hidden></p><button class="btn btn-p btn-block" id="b">${otp ? 'أرسل لي كود الدخول' : 'دخول'}</button></form>
    <p style="text-align:center;font-size:.9rem"><button class="link-b" id="sw">${otp ? 'الدخول بكلمة المرور' : 'الدخول بكود يصلك على الإيميل'}</button></p>
    <p style="text-align:center;font-size:.92rem;color:var(--muted)">ليس لديك متجر؟ <a class="link-b" data-l href="${BASE}/signup">سجّل كبائع</a></p>`);
    $('#sw').onclick = () => { mode = otp ? 'login' : 'otp'; draw(); };
    $('#f').onsubmit = async e => {
      e.preventDefault(); const err = $('#err'), b = $('#b'), email = $('#em').value.trim(); err.hidden = true;
      if (!/^\S+@\S+\.\S+$/.test(email)) { err.textContent = 'اكتب بريدًا صحيحًا'; err.hidden = false; return; }
      b.disabled = true;
      if (otp) { const { error } = await sb.auth.signInWithOtp({ email, options: { shouldCreateUser: false } }); b.disabled = false; if (error) { err.textContent = errMsg(error); err.hidden = false; return; } pending = email; mode = 'verify'; draw(); return; }
      const { error } = await sb.auth.signInWithPassword({ email, password: $('#pw').value }); b.disabled = false;
      if (error) { err.textContent = errMsg(error); err.hidden = false; return; }
      go(next, true);
    };
  };
  draw();
}

function signupView(root) {
  const qs = new URLSearchParams(location.search);
  let step = qs.get('step') === 'store' ? 'store' : 'account', email = '', pwd = '', name = '';
  const bar = n => `<div class="steps" aria-hidden="true">${[1, 2, 3].map(i => `<i class="${i <= n ? 'on' : ''}"></i>`).join('')}</div>`;
  const draw = async () => {
    if (step === 'store' || step === 'account') {
      const { data: { session } } = await sb.auth.getSession();
      if (session) {
        const { data: st } = await sb.from('kt_stores').select('id').eq('owner_id', session.user.id).maybeSingle();
        if (st) { go(BASE + '/dashboard', true); return; }
        step = 'store'; email = session.user.email; name = session.user.user_metadata?.name || '';
      } else if (step === 'store') step = 'account';
    }
    if (step === 'account') {
      root.innerHTML = authLayout(`${bar(1)}<div><h1>أنشئ حساب بائع</h1><p>الخطوة 1 من 3: بيانات الدخول</p></div>
      <form id="f" class="fgrid" novalidate>${field('nm', 'اسمك', 'maxlength="80" autocomplete="name" required')}${field('em', 'البريد الإلكتروني', 'type="email" dir="ltr" autocomplete="email" required')}${field('pw', 'كلمة المرور', 'type="password" dir="ltr" minlength="8" autocomplete="new-password" required', '8 حروف على الأقل')}<p id="err" class="alert" role="alert" hidden></p><button class="btn btn-p btn-block" id="b">متابعة</button></form>
      <p style="text-align:center;font-size:.92rem;color:var(--muted)">لديك حساب؟ <a class="link-b" data-l href="${BASE}/login?next=${encodeURIComponent(BASE + '/signup?step=store')}">سجّل دخولك</a> (تقدر تستخدم نفس إيميل حسابك في المتجر، والجلسة هنا مستقلة)</p>`);
      $('#f').onsubmit = async e => {
        e.preventDefault(); const err = $('#err'), b = $('#b'); err.hidden = true;
        name = $('#nm').value.trim(); email = $('#em').value.trim(); pwd = $('#pw').value;
        if (name.length < 2) return show(err, 'اكتب اسمك'); if (!/^\S+@\S+\.\S+$/.test(email)) return show(err, 'اكتب بريدًا صحيحًا'); if (pwd.length < 8) return show(err, 'كلمة المرور 8 حروف على الأقل');
        b.disabled = true; const { data, error } = await sb.auth.signUp({ email, password: pwd, options: { data: { name } } }); b.disabled = false;
        if (error) return show(err, errMsg(error));
        if (data.user && data.user.identities && data.user.identities.length === 0) { show(err, 'الإيميل ده عليه حساب بالفعل (غالبًا حساب المتجر). سجّل دخولك بنفس الإيميل وكلمة مرور حسابه علشان نفتح لك متجر عليه، أو اكتب إيميل آخر. '); err.insertAdjacentHTML('beforeend', `<a class="link-b" data-l href="${BASE}/login?next=${encodeURIComponent(BASE + '/signup?step=store')}">الدخول بنفس الإيميل</a>`); return; }
        step = data.session ? 'store' : 'verify'; draw();
      };
    } else if (step === 'verify') {
      root.innerHTML = authLayout(`${bar(1)}<div><h1>أدخل كود التأكيد</h1><p>أرسلنا كودًا إلى <b dir="ltr">${esc(email)}</b></p></div><form id="f" class="fgrid" novalidate>${field('code', 'الكود', 'inputmode="numeric" autocomplete="one-time-code" maxlength="8" placeholder="------"').replace('class="field"', 'class="field code-in"')}<p id="err" class="alert" hidden></p><button class="btn btn-p btn-block" id="b">تأكيد</button></form><p style="text-align:center;font-size:.9rem"><button class="link-b" id="rs">لم يصلك الكود؟ أعد الإرسال</button></p>`);
      $('#rs').onclick = async () => { const { error } = await sb.auth.resend({ type: 'signup', email }); toast(error ? errMsg(error) : 'تم إرسال كود جديد', error ? 'err' : ''); };
      $('#f').onsubmit = async e => { e.preventDefault(); const err = $('#err'), t = $('#code').value.replace(/\D/g, ''); err.hidden = true; if (t.length < 6) return show(err, 'اكتب الكود كاملًا'); $('#b').disabled = true; const { data, error } = await sb.auth.verifyOtp({ email, token: t, type: 'signup' }); $('#b').disabled = false; if (error || !data.session) return show(err, errMsg(error)); step = 'store'; draw(); };
    } else if (step === 'store') {
      root.innerHTML = authLayout(`${bar(3)}<div><h1>بيانات متجرك</h1><p>الخطوة 3 من 3. سيراجعها فريق Kitchenly قبل التفعيل.</p></div>
      <form id="f" class="fgrid" novalidate>${field('sn', 'اسم المتجر', 'maxlength="60" required')}${field('ss', 'رابط المتجر (إنجليزي، اختياري)', 'dir="ltr" placeholder="my-store"', 'سيظهر في kitchenly.../store/رابطك')}
      <div class="fgrid two">${field('sp', 'رقم الموبايل', 'type="tel" dir="ltr" inputmode="tel" placeholder="01xxxxxxxxx" required')}${sel('sc', 'المحافظة', GOVS, '', 'اختر')}</div>
      ${sel('sb', 'نوع النشاط', BTYPES, '', 'اختر')}<div><label class="lbl" for="sd">نبذة عن متجرك ومنتجاتك</label><textarea class="field" id="sd" rows="3" maxlength="400"></textarea></div>
      <label style="display:flex;gap:10px;align-items:flex-start;font-size:.88rem"><input type="checkbox" id="tm" style="margin-top:5px"> أوافق على شروط البيع وسياسة العمولة (10% من قيمة الطلبات المُسلّمة) وسياسة الاستبدال والاسترجاع.</label>
      <p id="err" class="alert" role="alert" hidden></p><button class="btn btn-p btn-block" id="b">إرسال طلب الانضمام</button></form>`);
      $('#f').onsubmit = async e => {
        e.preventDefault(); const err = $('#err'), b = $('#b'); err.hidden = true;
        const row = { name: $('#sn').value.trim(), slug: $('#ss').value.trim().toLowerCase(), phone: $('#sp').value.trim(), city: $('#sc').value, business_type: $('#sb').value, description: $('#sd').value.trim() };
        if (row.name.length < 2) return show(err, 'اكتب اسم المتجر'); if (row.slug && !SLUG.test(row.slug)) return show(err, 'الرابط حروف إنجليزية صغيرة وأرقام مفصولة بشرطات'); if (!/^(\+?20|0)?1[0125]\d{8}$/.test(row.phone.replace(/\s/g, ''))) return show(err, 'اكتب رقم موبايل مصري صحيح'); if (!row.city) return show(err, 'اختر المحافظة'); if (!row.business_type) return show(err, 'اختر نوع النشاط'); if (!$('#tm').checked) return show(err, 'لازم توافق على الشروط');
        if (!row.slug) row.slug = `store-${rand(6)}`;
        const { data: { session } } = await sb.auth.getSession(); if (!session) { step = 'account'; return draw(); }
        row.owner_id = session.user.id; b.disabled = true;
        const { error } = await sb.from('kt_stores').insert(row); b.disabled = false;
        if (error) return show(err, error.code === '23505' ? (error.message.includes('owner') ? 'لديك متجر بالفعل' : 'رابط المتجر مستخدم، جرّب غيره') : 'تعذر إرسال الطلب، حاول مرة أخرى');
        step = 'done'; draw();
      };
    }
    if (step === 'done') root.innerHTML = authLayout(`${bar(3)}<div style="text-align:center;display:grid;gap:14px;justify-items:center"><span class="badge b-ok" style="font-size:.9rem;padding:6px 16px">تم استلام طلبك</span><h1>شكرًا لانضمامك!</h1><p>سنراجع بيانات متجرك ونرد عليك خلال 24 إلى 48 ساعة. تقدر تدخل اللوحة وتجهّز منتجاتك من الآن.</p><a class="btn btn-p" data-l href="${BASE}/dashboard">الذهاب للوحة التحكم</a></div>`);
  };
  const show = (el, m) => { el.textContent = m; el.hidden = false; };
  draw();
}

/* ===================== #seller-guard: الحماية وحالة المتجر ===================== */
// #seller #guard #store-status
async function guard({ go: g }) {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) { g(`${BASE}/login?next=${encodeURIComponent(location.pathname)}`, true); return null; }
  const { data: store, error } = await sb.from('kt_stores').select('*').eq('owner_id', session.user.id).maybeSingle();
  if (error) { $('#root').innerHTML = `<div style="max-width:560px;margin:80px auto;padding:0 16px">${errBox('جدول المتاجر غير موجود. شغّل ملف supabase/seller-marketplace.sql على Supabase أولًا.')}</div>`; return null; }
  if (!store) { g(`${BASE}/signup?step=store`, true); return null; }
  return { user: session.user, store, name: store.name };
}
const locked = c => {
  const s = c.store.status, m = { pending: ['طلبك قيد المراجعة', 'هذه الصفحة تُفتح بعد موافقة فريق Kitchenly على متجرك. تقدر في الأثناء تراجع بيانات المتجر.'], rejected: ['تم رفض طلب المتجر', c.store.reject_reason || 'راجع بيانات متجرك وأعد الإرسال من صفحة المتجر.'], suspended: ['المتجر موقوف مؤقتًا', c.store.reject_reason || 'تواصل مع الدعم لمعرفة السبب وإعادة التفعيل.'] }[s] || ['غير متاح', ''];
  return `<div class="card lock">${ic('lock')}<h3 style="font-size:1.2rem">${m[0]}</h3><p style="color:var(--muted);max-width:440px;margin:6px auto 16px">${esc(m[1])}</p><a class="btn btn-p" data-l href="${BASE}/dashboard/store">بيانات المتجر</a> <a class="btn btn-g" data-l href="${BASE}/dashboard/help">المساعدة</a></div>`;
};
const statusBanner = c => {
  const s = c.store.status; if (s === 'approved') return '';
  const m = { pending: ['b-warn', 'clock', 'متجرك قيد المراجعة', 'فريق Kitchenly يراجع بياناتك الآن (عادةً خلال 24 إلى 48 ساعة). ستفتح كل الميزات فور الموافقة.'], rejected: ['b-red', 'x', 'تم رفض طلب المتجر', c.store.reject_reason || 'راجع البيانات وأعد الإرسال.'], suspended: ['b-red', 'lock', 'المتجر موقوف مؤقتًا', c.store.reject_reason || 'تواصل مع الدعم.'] }[s];
  return `<div class="banner" style="${s === 'pending' ? 'background:var(--amber-soft);color:var(--amber)' : 'background:var(--red-soft);color:var(--red)'}">${ic(m[1], 'lg')}<div><b>${m[2]}</b><p>${esc(m[3])}</p></div></div>`;
};

Object.assign(NS, { loginView, signupView, guard, locked, statusBanner });
})();
