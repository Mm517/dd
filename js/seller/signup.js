/* =====================================================================
 * js/seller/signup.js
 * الوظيفة: إنشاء حساب البائع على أربع صفحات بروابط مستقلة:
 *   /be-seller/signup (الحساب + كود التأكيد) ← /signup/first (بيانات المتجر) ← /signup/second (النشاط والشروط وإرسال الطلب) ← /signup/finish (تم)
 *   بيانات الخطوة الأولى بتتحفظ مؤقتًا في sessionStorage لحد ما الطلب يتبعت.
 * يعتمد على: js/seller/shared.js [BASE, GOVS, BTYPES, RESERVED, errMsg, field, sel] · js/seller/auth.js [authLayout] · window.Panel [sb, $, esc, toast, SLUG, rand, badge, STORE]
 * يعرض على window.Panel.seller: signupAccount, signupFirst, signupSecond, signupFinish
 * ===================================================================== */
(() => {
'use strict';
const NS = (window.Panel.seller = window.Panel.seller || {});
const { sb, $, esc, toast, SLUG, rand } = window.Panel;
const { BASE, GOVS, BTYPES, RESERVED, errMsg, field, sel } = NS;   // js/seller/shared.js
const { authLayout } = NS;   // js/seller/auth.js

/* ===================== #seller-signup: مسودة الخطوات والأدوات ===================== */
// #seller #signup #draft #steps
const DRAFT = 'kt-seller-draft', STEPS = ['الحساب', 'المتجر', 'النشاط'];
const readDraft = () => { try { return JSON.parse(sessionStorage.getItem(DRAFT) || '{}'); } catch { return {}; } };
const saveDraft = v => { try { sessionStorage.setItem(DRAFT, JSON.stringify({ ...readDraft(), ...v })); } catch { /* التخزين محجوب */ } };
const clearDraft = () => { try { sessionStorage.removeItem(DRAFT); } catch { /* */ } };
const bar = (n, all = false) => `<div class="steps" aria-hidden="true">${[1, 2, 3].map(i => `<i class="${all || i <= n ? 'on' : ''}"></i>`).join('')}</div><p class="stepl">${all ? 'اكتملت الخطوات' : `الخطوة ${n} من 3 · ${STEPS[n - 1]}`}</p>`;
const show = (el, m) => { el.textContent = m; el.hidden = false; return false; };
async function who() {
  const { data: { session } } = await sb.auth.getSession(); if (!session) return {};
  const { data: store } = await sb.from('kt_stores').select('id,name,status').eq('owner_id', session.user.id).maybeSingle();
  return { session, store };
}
const codeForm = (title, email, extra = '') => `<div><h1>${title}</h1><p>أرسلنا كودًا إلى <b dir="ltr">${esc(email)}</b></p></div><form id="f" class="fgrid" novalidate>${field('code', 'الكود', 'inputmode="numeric" autocomplete="one-time-code" maxlength="8" placeholder="------"').replace('class="field"', 'class="field code-in"')}<p id="err" class="alert" hidden></p><button class="btn btn-p btn-block" id="b">تأكيد</button></form>${extra}`;

/* ===================== #signup-account: /be-seller/signup (الحساب + كود التأكيد) ===================== */
// #seller #signup #account #verify-code
async function signupAccount(root, { go }) {
  let mode = 'account', email = '';
  const draw = async () => {
    if (mode === 'account') {
      const { session, store } = await who();
      if (store) return go(`${BASE}/dashboard`, true);
      if (session) return go(`${BASE}/signup/first`, true);
      root.innerHTML = authLayout(`${bar(1)}<div><h1>أنشئ حساب بائع</h1><p>ابدأ ببيانات الدخول، وبعدها بيانات متجرك.</p></div>
      <form id="f" class="fgrid" novalidate>${field('nm', 'اسمك', 'maxlength="80" autocomplete="name" required')}${field('em', 'البريد الإلكتروني', 'type="email" dir="ltr" autocomplete="email" required')}${field('pw', 'كلمة المرور', 'type="password" dir="ltr" minlength="8" autocomplete="new-password" required', '8 حروف على الأقل')}<p id="err" class="alert" role="alert" hidden></p><button class="btn btn-p btn-block" id="b">متابعة</button></form>
      <p style="text-align:center;font-size:.92rem;color:var(--muted)">لديك حساب؟ <a class="link-b" data-l href="${BASE}/login?next=${encodeURIComponent(`${BASE}/signup/first`)}">سجّل دخولك</a> (تقدر تستخدم نفس إيميل حسابك في المتجر، والجلسة هنا مستقلة)</p>`);
      $('#f').onsubmit = async e => {
        e.preventDefault(); const err = $('#err'), b = $('#b'); err.hidden = true;
        const name = $('#nm').value.trim(), pwd = $('#pw').value; email = $('#em').value.trim();
        if (name.length < 2) return show(err, 'اكتب اسمك'); if (!/^\S+@\S+\.\S+$/.test(email)) return show(err, 'اكتب بريدًا صحيحًا'); if (pwd.length < 8) return show(err, 'كلمة المرور 8 حروف على الأقل');
        b.disabled = true; const { data, error } = await sb.auth.signUp({ email, password: pwd, options: { data: { name } } }); b.disabled = false;
        if (error) return show(err, errMsg(error));
        if (data.user && data.user.identities && data.user.identities.length === 0) { show(err, 'الإيميل ده عليه حساب بالفعل (غالبًا حساب المتجر). سجّل دخولك بنفس الإيميل وكلمة مرور حسابه علشان نفتح لك متجر عليه، أو اكتب إيميل آخر. '); err.insertAdjacentHTML('beforeend', `<a class="link-b" data-l href="${BASE}/login?next=${encodeURIComponent(`${BASE}/signup/first`)}">الدخول بنفس الإيميل</a>`); return; }
        if (data.session) return go(`${BASE}/signup/first`);
        mode = 'verify'; draw();
      };
    } else {
      root.innerHTML = authLayout(`${bar(1)}${codeForm('أدخل كود التأكيد', email, '<p style="text-align:center;font-size:.9rem;display:flex;gap:14px;justify-content:center"><button class="link-b" id="rs">لم يصلك الكود؟ أعد الإرسال</button><button class="link-b" id="back">رجوع</button></p>')}`);
      $('#back').onclick = () => { mode = 'account'; draw(); };
      $('#rs').onclick = async () => { const { error } = await sb.auth.resend({ type: 'signup', email }); toast(error ? errMsg(error) : 'تم إرسال كود جديد', error ? 'err' : ''); };
      $('#f').onsubmit = async e => {
        e.preventDefault(); const err = $('#err'), t = $('#code').value.replace(/\D/g, ''); err.hidden = true; if (t.length < 6) return show(err, 'اكتب الكود كاملًا');
        $('#b').disabled = true; const { data, error } = await sb.auth.verifyOtp({ email, token: t, type: 'signup' }); $('#b').disabled = false;
        if (error || !data.session) return show(err, errMsg(error)); go(`${BASE}/signup/first`);
      };
    }
  };
  draw();
}

/* ===================== #signup-first: /be-seller/signup/first (بيانات المتجر) ===================== */
// #seller #signup #first #store-identity
async function signupFirst(root, { go }) {
  const { session, store } = await who();
  if (!session) return go(`${BASE}/signup`, true);
  if (store) return go(`${BASE}/dashboard`, true);
  const d = readDraft();
  root.innerHTML = authLayout(`${bar(2)}<div><h1>بيانات متجرك</h1><p>اسم المتجر ورابطه ووسيلة التواصل معاك.</p></div>
  <form id="f" class="fgrid" novalidate>${field('sn', 'اسم المتجر', `maxlength="60" value="${esc(d.sn || '')}" required`)}${field('ss', 'رابط المتجر (إنجليزي، اختياري)', `dir="ltr" placeholder="my-store" value="${esc(d.ss || '')}"`, 'هيظهر في kitchenly.../store/رابطك')}
  <div class="fgrid two">${field('sp', 'رقم الموبايل', `type="tel" dir="ltr" inputmode="tel" placeholder="01xxxxxxxxx" value="${esc(d.sp || '')}" required`)}${sel('sc', 'المحافظة', GOVS, d.sc || '', 'اختر')}</div>
  <p id="err" class="alert" role="alert" hidden></p><button class="btn btn-p btn-block" id="b">متابعة</button></form>`);
  $('#f').onsubmit = e => {
    e.preventDefault(); const err = $('#err'); err.hidden = true;
    const v = { sn: $('#sn').value.trim(), ss: $('#ss').value.trim().toLowerCase(), sp: $('#sp').value.trim(), sc: $('#sc').value };
    if (v.sn.length < 2) return show(err, 'اكتب اسم المتجر'); if (v.ss && !SLUG.test(v.ss)) return show(err, 'الرابط حروف إنجليزية صغيرة وأرقام مفصولة بشرطات'); if (RESERVED.includes(v.ss)) return show(err, 'اسم الرابط ده محجوز، اختار اسم تاني');
    if (!/^(\+?20|0)?1[0125]\d{8}$/.test(v.sp.replace(/\s/g, ''))) return show(err, 'اكتب رقم موبايل مصري صحيح'); if (!v.sc) return show(err, 'اختر المحافظة');
    saveDraft(v); go(`${BASE}/signup/second`);
  };
}

/* ===================== #signup-second: /be-seller/signup/second (النشاط والشروط + إرسال الطلب) ===================== */
// #seller #signup #second #submit #terms
async function signupSecond(root, { go }) {
  const { session, store } = await who();
  if (!session) return go(`${BASE}/signup`, true);
  if (store) return go(`${BASE}/signup/finish`, true);
  const d = readDraft(); if (!d.sn) return go(`${BASE}/signup/first`, true);
  root.innerHTML = authLayout(`${bar(3)}<div><h1>نشاط متجرك</h1><p>سيراجعها فريق Kitchenly قبل التفعيل.</p></div>
  <div class="card card--flat" style="padding:12px 14px;display:flex;justify-content:space-between;align-items:center;gap:10px"><span><b>${esc(d.sn)}</b><small class="sub" dir="ltr">${esc(d.ss || 'رابط تلقائي')} · ${esc(d.sc)}</small></span><a class="link-b" data-l href="${BASE}/signup/first">تعديل</a></div>
  <form id="f" class="fgrid" novalidate>${sel('sb', 'نوع النشاط', BTYPES, d.sb || '', 'اختر')}<div><label class="lbl" for="sd">نبذة عن متجرك ومنتجاتك</label><textarea class="field" id="sd" rows="3" maxlength="400">${esc(d.sd || '')}</textarea></div>
  <label style="display:flex;gap:10px;align-items:flex-start;font-size:.88rem"><input type="checkbox" id="tm" style="margin-top:5px"> أوافق على شروط البيع وسياسة العمولة (10% من قيمة الطلبات المُسلّمة) وسياسة الاستبدال والاسترجاع.</label>
  <p id="err" class="alert" role="alert" hidden></p><button class="btn btn-p btn-block" id="b">إرسال طلب الانضمام</button></form><p style="text-align:center;font-size:.9rem"><a class="link-b" data-l href="${BASE}/signup/first">رجوع</a></p>`);
  $('#f').onsubmit = async e => {
    e.preventDefault(); const err = $('#err'), b = $('#b'); err.hidden = true;
    const bt = $('#sb').value, ds = $('#sd').value.trim(); saveDraft({ sb: bt, sd: ds });
    if (!bt) return show(err, 'اختر نوع النشاط'); if (!$('#tm').checked) return show(err, 'لازم توافق على الشروط');
    const row = { name: d.sn, slug: d.ss || `store-${rand(6)}`, phone: d.sp, city: d.sc, business_type: bt, description: ds, owner_id: session.user.id };
    b.disabled = true; const { error } = await sb.from('kt_stores').insert(row); b.disabled = false;
    if (error) {
      if (error.code === '23505' && !error.message.includes('owner')) { show(err, 'رابط المتجر مستخدم، '); err.insertAdjacentHTML('beforeend', `<a class="link-b" data-l href="${BASE}/signup/first">غيّره من الخطوة السابقة</a>`); return; }
      return show(err, error.code === '23505' ? 'لديك متجر بالفعل' : /slug_reserved/.test(error.message) ? 'اسم الرابط ده محجوز، اختار اسم تاني' : 'تعذر إرسال الطلب، حاول مرة أخرى');
    }
    clearDraft(); go(`${BASE}/signup/finish`);
  };
}

/* ===================== #signup-finish: /be-seller/signup/finish (تم استلام الطلب) ===================== */
// #seller #signup #finish #done
async function signupFinish(root, { go }) {
  const { session, store } = await who();
  if (!session) return go(`${BASE}/login?next=${encodeURIComponent(`${BASE}/signup/finish`)}`, true);
  if (!store) return go(`${BASE}/signup/first`, true);
  root.innerHTML = authLayout(`${bar(3, true)}<div style="text-align:center;display:grid;gap:14px;justify-items:center"><span class="badge b-ok" style="font-size:.9rem;padding:6px 16px">تم استلام طلبك</span><h1>شكرًا لانضمامك${store.name ? `، ${esc(store.name)}` : ''}!</h1><p>سنراجع بيانات متجرك ونرد عليك خلال 24 إلى 48 ساعة. تقدر تدخل اللوحة وتجهّز منتجاتك من الآن.</p>
  <ol class="stepsl" style="text-align:start;width:100%"><li><b>مراجعة الطلب</b><span>فريق Kitchenly يراجع بيانات متجرك.</span></li><li><b>جهّز منتجاتك</b><span>أضف منتجاتك من لوحة التحكم وتتراجع عند تفعيل المتجر.</span></li></ol>
  <a class="btn btn-p" data-l href="${BASE}/dashboard">الذهاب للوحة التحكم</a></div>`);
}

Object.assign(NS, { signupAccount, signupFirst, signupSecond, signupFinish });
})();
