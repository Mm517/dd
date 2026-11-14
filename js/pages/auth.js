/* =====================================================================
 * js/pages/auth.js
 * الوظيفة: تسجيل الدخول (كلمة مرور أو كود على الإيميل) وإنشاء الحساب بتأكيد الكود، وتحويل صفحة الحساب القديمة للبروفايل.
 * يعتمد على: window.KTApp [sb, $, $$, esc, params, toast, pages, ic]
 * يعرض على window.KTApp: لا شيء
 * ===================================================================== */
(() => {
'use strict';
const { sb, $, $$, esc, params, toast, pages, ic } = window.KTApp;

/* ===================== #auth: تسجيل الدخول وإنشاء الحساب ===================== */
// #auth #login #signup #otp #supabase
const AUTH_ERR = {
  'Invalid login credentials': 'البريد أو كلمة المرور غير صحيحة', 'User already registered': 'هذا البريد مسجل بالفعل، سجّل الدخول',
  'Email not confirmed': 'أكّد بريدك أولًا بالكود المرسل إليك', 'Token has expired or is invalid': 'الكود غير صحيح أو انتهت صلاحيته',
  'Signups not allowed for otp': 'لا يوجد حساب بهذا البريد، أنشئ حسابًا جديدًا', 'Email rate limit exceeded': 'تم إرسال رسائل كثيرة، انتظر دقيقة ثم حاول'
};
const errMsg = e => AUTH_ERR[e?.message] || (/rate limit|seconds/i.test(e?.message || '') ? AUTH_ERR['Email rate limit exceeded'] : 'تعذر إتمام العملية، حاول مرة أخرى');
const safeNext = () => { const n = params.get('next') || '/profile'; return /^\/[a-z0-9._\-/]*(\?[^#]*)?$/i.test(n) && !n.startsWith('//') ? n : '/profile'; };
const validEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

// #page-auth #route #auth #login
pages.auth = async () => {
  if (window.KTApp.session) { location.replace(safeNext()); return; }
  /* mode: login | signup | otp-login | verify  (verify = إدخال الكود بعد التسجيل أو الدخول بالكود) */
  let mode = 'login', pending = { email: '', type: 'signup' };
  const field = (id, label, attrs = '') => `<div><label class="lbl" for="${id}">${label}</label><input class="field" id="${id}" ${attrs}></div>`;
  const draw = () => {
    const app = $('#app');
    if (mode === 'verify') {
      app.innerHTML = `<div class="wrap page"><div class="card center"><span class="okmark">${ic('mail', 'ico-lg')}</span><h1 style="font-size:1.4rem;text-align:center">أدخل كود التأكيد</h1>
      <p class="page__sub" style="text-align:center">أرسلنا كودًا إلى <b dir="ltr">${esc(pending.email)}</b>. افتح بريدك وانسخ الكود هنا.</p>
      <form id="af" class="form-grid" style="margin-top:20px" novalidate>${field('code', 'الكود', 'inputmode="numeric" autocomplete="one-time-code" maxlength="8" class="field code-in" required placeholder="------"')}
      <p id="aerr" class="alert" role="alert" hidden></p><button class="btn btn-primary btn-block" id="ab">تأكيد</button></form>
      <p style="text-align:center;margin-top:14px;font-size:.88rem"><button class="link-btn" id="resend">لم يصلك الكود؟ أعد الإرسال</button> • <button class="link-btn" id="back">تغيير البريد</button></p></div></div>`;
      $('#code').focus();
      $('#back').onclick = () => { mode = 'login'; draw(); };
      $('#resend').onclick = async () => {
        const { error } = pending.type === 'signup' ? await sb.auth.resend({ type: 'signup', email: pending.email }) : await sb.auth.signInWithOtp({ email: pending.email, options: { shouldCreateUser: false } });
        toast(error ? errMsg(error) : 'تم إرسال كود جديد', error ? 'err' : '');
      };
      $('#af').addEventListener('submit', async e => {
        e.preventDefault(); const err = $('#aerr'), btn = $('#ab'), token = $('#code').value.replace(/\D/g, '');
        err.hidden = true; if (token.length < 6) { err.textContent = 'اكتب الكود المكوّن من الأرقام التي وصلتك'; err.hidden = false; return; }
        btn.disabled = true;
        const { data, error } = await sb.auth.verifyOtp({ email: pending.email, token, type: pending.type === 'signup' ? 'signup' : 'email' });
        btn.disabled = false;
        if (error || !data.session) { err.textContent = errMsg(error); err.hidden = false; return; }
        location.href = safeNext();
      });
      return;
    }
    const signup = mode === 'signup', otp = mode === 'otp-login';
    app.innerHTML = `<div class="wrap page"><div class="card center"><div class="tabs"><button data-m="login" aria-current="${!signup}">تسجيل الدخول</button><button data-m="signup" aria-current="${signup}">حساب جديد</button></div>
    <form id="af" class="form-grid" novalidate>${signup ? field('an', 'الاسم', 'required maxlength="80" autocomplete="name"') : ''}
    ${field('ae', 'البريد الإلكتروني', 'type="email" required dir="ltr" autocomplete="email"')}
    ${otp ? '' : field('ap', 'كلمة المرور', `type="password" required minlength="8" dir="ltr" autocomplete="${signup ? 'new-password' : 'current-password'}"`)}
    <p id="aerr" class="alert" role="alert" hidden></p>
    <button class="btn btn-primary btn-block" id="ab">${signup ? 'إنشاء الحساب وإرسال الكود' : otp ? 'أرسل لي كود الدخول' : 'دخول'}</button></form>
    ${signup ? '' : `<p style="text-align:center;margin-top:14px"><button class="link-btn" id="swap">${otp ? 'الدخول بكلمة المرور' : 'الدخول بكود يصلك على الإيميل'}</button></p>`}
    <p style="margin-top:14px;text-align:center;font-size:.8rem;color:var(--muted)">يمكنك الشراء بدون حساب. الحساب يتيح لك متابعة طلباتك السابقة.</p></div></div>`;
    $$('[data-m]', app).forEach(b => b.onclick = () => { mode = b.dataset.m; draw(); });
    $('#swap')?.addEventListener('click', () => { mode = otp ? 'login' : 'otp-login'; draw(); });
    $('#af').addEventListener('submit', async e => {
      e.preventDefault(); const err = $('#aerr'), btn = $('#ab'), email = $('#ae').value.trim(), password = $('#ap')?.value || '';
      const show = m => { err.textContent = m; err.hidden = false; };
      err.hidden = true;
      if (!validEmail(email)) return show('اكتب بريدًا إلكترونيًا صحيحًا');
      if (!otp && password.length < 8) return show('كلمة المرور 8 أحرف على الأقل');
      if (signup && !$('#an').value.trim()) return show('اكتب اسمك');
      btn.disabled = true;
      let res;
      if (signup) res = await sb.auth.signUp({ email, password, options: { data: { name: $('#an').value.trim() } } });
      else if (otp) res = await sb.auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
      else res = await sb.auth.signInWithPassword({ email, password });
      btn.disabled = false;
      if (res.error) {
        if (!signup && !otp && res.error.message === 'Email not confirmed') { await sb.auth.resend({ type: 'signup', email }); pending = { email, type: 'signup' }; mode = 'verify'; return draw(); }
        return show(errMsg(res.error));
      }
      if (signup) {
        /* بريد مسجل مسبقًا: Supabase يرجع user بدون identities */
        if (res.data.user && res.data.user.identities && !res.data.user.identities.length) return show(AUTH_ERR['User already registered']);
        if (res.data.session) { location.href = safeNext(); return; }
        pending = { email, type: 'signup' }; mode = 'verify'; return draw();
      }
      if (otp) { pending = { email, type: 'email' }; mode = 'verify'; return draw(); }
      location.href = safeNext();
    });
  };
  draw();
};

/* ===================== #account-redirect: تحويل صفحة الحساب القديمة ===================== */
// #account #redirect #profile
/* صفحة الحساب القديمة: نحوّلها للبروفايل الجديد (/profile) */
// #page-account #route #auth #login
pages.account = () => { location.replace('/profile'); };
})();
