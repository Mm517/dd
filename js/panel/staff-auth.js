/* =====================================================================
 * js/panel/staff-auth.js
 * الوظيفة: شاشة دخول/إنشاء حساب للوحات الفريق والأدمن (مسموح فقط للإيميلات داخل kt_admins).
 * يعتمد على: js/panel/core.js [sb, signOutLocal, $, $$, esc, ic] · js/panel/ui.js [toast]
 * يعرض على window.Panel: authBrand, staffAuth
 * ===================================================================== */
(() => {
'use strict';
const NS = (window.Panel = window.Panel || {});
const { sb, signOutLocal, $, $$, esc, ic } = NS;   // js/panel/core.js
const { toast } = NS;   // js/panel/ui.js

/* ===================== #staff-auth: دخول وإنشاء حساب الفريق والأدمن ===================== */
// #staff-auth #login #signup #kt-admins

const authBrand = role => `<div class="auth__brand"><img src="/assets/img/logo-mark.jpg" alt="" width="56" height="56"><div class="auth__word"><b>كتشنلي</b><i class="auth__slash" aria-hidden="true"></i><small>KITCHENLY${role ? ` · ${esc(role)}` : ''}</small></div></div>`;

/* ---------- دخول / إنشاء حساب للوحات الفريق والأدمن (صفحة خارجية بحساب مستقل) ----------
   الدخول مسموح فقط لو الإيميل ضمن kt_admins (kt_is_admin). الإنشاء بإيميل جديد أو بنفس إيميل حسابك في المتجر. */
function staffAuth(root, { role, title, sub, bullets = [], art, back = '/', onDone, check }) {
  let mode = 'login', pending = '', pwd = '', prefill = '';
  const errTxt = e => { const m = String(e?.message || e || ''); return /Invalid login/i.test(m) ? 'الإيميل أو كلمة المرور غير صحيحة' : /not confirmed/i.test(m) ? 'الحساب لم يتم تأكيده بعد، سجّل من جديد ليصلك كود' : /rate|too many|seconds/i.test(m) ? 'محاولات كثيرة، انتظر قليلًا ثم حاول مرة أخرى' : /expired|invalid.*(token|otp)|Token/i.test(m) ? 'الكود غير صحيح أو انتهت صلاحيته' : /password/i.test(m) ? 'كلمة المرور ضعيفة (8 حروف على الأقل)' : 'حدث خطأ، حاول مرة أخرى'; };
  const fld = (id, label, attrs = '', hint = '') => `<div><label class="lbl" for="${id}">${label}</label><input class="field" id="${id}" ${attrs}>${hint ? `<p class="hint">${hint}</p>` : ''}</div>`;
  const layout = inner => `<div class="auth"><section class="auth__art">${authBrand(role)}<div><h2>${esc(title)}</h2>${bullets.length ? `<ul>${bullets.map(([i, t]) => `<li>${ic(i)}<span>${esc(t)}</span></li>`).join('')}</ul>` : ''}${art ? `<img src="${art}" alt="" width="300" height="300" style="margin-top:20px;width:min(300px,70%);height:auto;border-radius:20px;background:#fff">` : ''}</div><p style="opacity:.6;font-size:.85rem">© Kitchenly ${new Date().getFullYear()}</p></section><section class="auth__form"><div class="auth__box">${inner}</div></section></div>`;
  const show = (m, ok) => { const e = $('#err'); e.textContent = m; e.className = ok ? 'alert alert--ok' : 'alert'; e.hidden = false; };
  const finish = async () => { const c = await check(); if (c === true) return onDone(); await signOutLocal(); mode = 'login'; draw(); show(c || 'هذا الحساب غير مصرّح له بدخول هذه اللوحة'); };
  const tabs = () => `<div class="tabs" style="margin-bottom:0"><button type="button" data-md="login" aria-current="${mode === 'login'}">دخول</button><button type="button" data-md="signup" aria-current="${mode === 'signup'}">إنشاء حساب</button></div>`;
  async function draw() {
    if (mode === 'verify') {
      root.innerHTML = layout(`<div><h1>أدخل كود التأكيد</h1><p>أرسلنا كودًا إلى <b dir="ltr">${esc(pending)}</b></p></div><form id="f" class="fgrid" novalidate>${fld('code', 'الكود', 'inputmode="numeric" autocomplete="one-time-code" maxlength="8" placeholder="------"').replace('class="field"', 'class="field code-in"')}<p id="err" class="alert" hidden></p><button class="btn btn-p btn-block" id="b">تأكيد</button></form><p style="text-align:center;font-size:.9rem;display:flex;gap:14px;justify-content:center"><button class="link-b" id="rs">أعد إرسال الكود</button><button class="link-b" id="back">رجوع</button></p>`);
      $('#back').onclick = () => { mode = 'signup'; draw(); };
      $('#rs').onclick = async () => { const { error } = await sb.auth.resend({ type: 'signup', email: pending }); toast(error ? errTxt(error) : 'تم إرسال كود جديد', error ? 'err' : ''); };
      $('#f').onsubmit = async e => { e.preventDefault(); const t = $('#code').value.replace(/\D/g, ''); $('#err').hidden = true; if (t.length < 6) return show('اكتب الكود كاملًا'); $('#b').disabled = true; const { error } = await sb.auth.verifyOtp({ email: pending, token: t, type: 'signup' }); $('#b').disabled = false; if (error) return show(errTxt(error)); finish(); };
      return;
    }
    if (mode === 'signup') {
      root.innerHTML = layout(`<div><h1>إنشاء حساب ${esc(role)}</h1><p>${esc(sub)} الحساب هنا مستقل عن حساب المتجر، وتقدر تستخدم نفس إيميلك أو إيميل آخر.</p></div>${tabs()}<form id="f" class="fgrid" novalidate>${fld('nm', 'اسمك', 'maxlength="80" autocomplete="name"')}${fld('em', 'البريد الإلكتروني', `type="email" dir="ltr" autocomplete="email" value="${esc(prefill)}"`)}${fld('pw', 'كلمة المرور', 'type="password" dir="ltr" minlength="8" autocomplete="new-password"', '8 حروف على الأقل')}<p id="err" class="alert" role="alert" hidden></p><div id="ex" hidden style="display:flex;gap:8px;flex-wrap:wrap"></div><button class="btn btn-p btn-block" id="b">إنشاء الحساب</button></form><p style="text-align:center"><a class="link-b" href="${back}">العودة للموقع</a></p>`);
      $$('[data-md]').forEach(b => b.onclick = () => { mode = b.dataset.md; draw(); });
      $('#f').onsubmit = async e => {
        e.preventDefault(); $('#err').hidden = true; $('#ex').hidden = true;
        const name = $('#nm').value.trim(), email = $('#em').value.trim(), pw = $('#pw').value;
        if (name.length < 2) return show('اكتب اسمك'); if (!/^\S+@\S+\.\S+$/.test(email)) return show('اكتب بريدًا صحيحًا'); if (pw.length < 8) return show('كلمة المرور 8 حروف على الأقل');
        $('#b').disabled = true; const { data, error } = await sb.auth.signUp({ email, password: pw, options: { data: { name } } }); $('#b').disabled = false;
        if (error) return show(errTxt(error));
        if (data.user && data.user.identities && data.user.identities.length === 0) {
          show('الإيميل ده عليه حساب بالفعل (غالبًا حساب المتجر). سجّل دخولك بنفس الإيميل وكلمة مرور حسابه، أو اكتب إيميل آخر.');
          const ex = $('#ex'); ex.hidden = false; ex.innerHTML = '<button type="button" class="btn btn-g btn-sm" id="use">استخدم نفس الإيميل (دخول)</button><button type="button" class="btn btn-g btn-sm" id="other">إيميل آخر</button>';
          $('#use').onclick = () => { prefill = email; mode = 'login'; draw(); };
          $('#other').onclick = () => { $('#em').value = ''; $('#em').focus(); ex.hidden = true; $('#err').hidden = true; };
          return;
        }
        pending = email; if (data.session) return finish(); mode = 'verify'; draw();
      };
      return;
    }
    const otp = mode === 'otp';
    root.innerHTML = layout(`<div><h1>دخول ${esc(role)}</h1><p>${esc(sub)}</p></div>${tabs()}<form id="f" class="fgrid" novalidate>${fld('em', 'البريد الإلكتروني', `type="email" dir="ltr" autocomplete="email" value="${esc(prefill)}"`)}${otp ? '' : fld('pw', 'كلمة المرور', 'type="password" dir="ltr" autocomplete="current-password"')}<p id="err" class="alert" role="alert" hidden></p><button class="btn btn-p btn-block" id="b">${otp ? 'أرسل لي كود الدخول' : 'دخول'}</button></form><p style="text-align:center;font-size:.9rem"><button class="link-b" id="sw">${otp ? 'الدخول بكلمة المرور' : 'الدخول بكود يصلك على الإيميل'}</button></p><p style="text-align:center"><a class="link-b" href="${back}">العودة للموقع</a></p>`);
    $$('[data-md]').forEach(b => b.onclick = () => { mode = b.dataset.md; draw(); });
    $('#sw').onclick = () => { mode = otp ? 'login' : 'otp'; draw(); };
    $('#f').onsubmit = async e => {
      e.preventDefault(); $('#err').hidden = true; const email = $('#em').value.trim();
      if (!/^\S+@\S+\.\S+$/.test(email)) return show('اكتب بريدًا صحيحًا');
      $('#b').disabled = true;
      if (otp) { const { error } = await sb.auth.signInWithOtp({ email, options: { shouldCreateUser: false } }); $('#b').disabled = false; if (error) return show(errTxt(error)); pending = email; mode = 'otpverify'; return drawOtp(); }
      const { error } = await sb.auth.signInWithPassword({ email, password: $('#pw').value }); $('#b').disabled = false;
      if (error) return show(errTxt(error)); finish();
    };
  }
  function drawOtp() {
    root.innerHTML = layout(`<div><h1>أدخل كود الدخول</h1><p>أرسلنا كودًا إلى <b dir="ltr">${esc(pending)}</b></p></div><form id="f" class="fgrid" novalidate>${fld('code', 'الكود', 'inputmode="numeric" autocomplete="one-time-code" maxlength="8" placeholder="------"').replace('class="field"', 'class="field code-in"')}<p id="err" class="alert" hidden></p><button class="btn btn-p btn-block" id="b">تأكيد</button></form><p style="text-align:center"><button class="link-b" id="back">رجوع</button></p>`);
    $('#back').onclick = () => { mode = 'otp'; draw(); };
    $('#f').onsubmit = async e => { e.preventDefault(); const t = $('#code').value.replace(/\D/g, ''); $('#err').hidden = true; if (t.length < 6) return show('اكتب الكود كاملًا'); $('#b').disabled = true; const { error } = await sb.auth.verifyOtp({ email: pending, token: t, type: 'email' }); $('#b').disabled = false; if (error) return show(errTxt(error)); finish(); };
  }
  draw();
}

Object.assign(NS, { authBrand, staffAuth });
})();
