/* =====================================================================
 * js/seller/auth.js
 * الوظيفة: دخول البائع (بدون شل) + هيكل صفحات الدخول والتسجيل المشترك + الحماية وبانر حالة المتجر. إنشاء الحساب نفسه في js/seller/signup.js.
 * يعتمد على: js/seller/shared.js [BASE, errMsg, field] · window.Panel [sb, $, esc, ic, errBox, go]
 * يعرض على window.Panel.seller: authLayout, loginView, guard, locked, statusBanner
 * ===================================================================== */
(() => {
'use strict';
const NS = (window.Panel.seller = window.Panel.seller || {});
const { sb, $, esc, ic, errBox, go } = window.Panel;
const { BASE, errMsg, field } = NS;   // js/seller/shared.js

/* ===================== #seller-auth: الدخول والتسجيل (بدون شل) ===================== */
// #seller #auth #login #signup-layout
const authLayout = (inner, art = true) => `<div class="auth"><section class="auth__art">${window.Panel.authBrand('للبائعين')}
  <div><h2>اعرض منتجاتك لآلاف العملاء على Kitchenly</h2><ul>
  <li>${ic('store')}<span>متجر خاص بك على الموقع بصفحة ورابط مستقل</span></li>
  <li>${ic('chart')}<span>لوحة تحكم بالطلبات والتحليلات والمدفوعات</span></li>
  <li>${ic('mega')}<span>إعلانات وحملات توصّل منتجك لعملاء أكثر</span></li>
  <li>${ic('shield')}<span>مراجعة سريعة للمنتجات، وسحب أرباحك بإنستا باي</span></li></ul><img src="/assets/img/pages/${location.pathname.includes('/signup') ? 'seller-signup' : 'seller-login-scooter'}.webp" alt="" width="280" height="280" style="margin-top:20px;width:min(280px,65%);height:auto;border-radius:20px;background:#fff"></div>
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

/* ===================== #seller-guard: الحماية وحالة المتجر ===================== */
// #seller #guard #store-status
async function guard({ go: g }) {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) { g(`${BASE}/login?next=${encodeURIComponent(location.pathname)}`, true); return null; }
  const { data: store, error } = await sb.from('kt_stores').select('*').eq('owner_id', session.user.id).maybeSingle();
  if (error) { $('#root').innerHTML = `<div style="max-width:560px;margin:80px auto;padding:0 16px">${errBox('جدول المتاجر غير موجود. شغّل ملف supabase/seller-marketplace.sql على Supabase أولًا.')}</div>`; return null; }
  if (!store) { g(`${BASE}/signup/first`, true); return null; }
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

Object.assign(NS, { authLayout, loginView, guard, locked, statusBanner });
})();
