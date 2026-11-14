/* Kitchenly - لوحة البائع: /be-seller/... (صفحة كاملة مستقلة عن الموقع) */
(() => {
'use strict';
const { sb, $, $$, esc, fmt, money, moneyT, date, dt, ic, toast, modal, ask, skel, empty, errBox, badge, orderBadge, sBadge, STORE, PROD, AD, PLACE, GOAL, ORDER, areaChart, barChart, hbars, lastDays, dkey, dshort, sum, csv, loadSales, groupOrders, imageField, bindImage, uploadImage, productForm, SLUG, rand, go } = window.Panel;
const BASE = '/be-seller';
const GOVS = ['القاهرة', 'الجيزة', 'الإسكندرية', 'الدقهلية', 'البحر الأحمر', 'البحيرة', 'الفيوم', 'الغربية', 'الإسماعيلية', 'المنوفية', 'المنيا', 'القليوبية', 'الوادي الجديد', 'السويس', 'الشرقية', 'أسوان', 'أسيوط', 'بني سويف', 'بورسعيد', 'دمياط', 'جنوب سيناء', 'كفر الشيخ', 'مطروح', 'الأقصر', 'قنا', 'شمال سيناء', 'سوهاج'];
const BTYPES = ['أدوات تنظيف', 'أدوات مطبخ', 'منظمات وتخزين', 'أجهزة منزلية صغيرة', 'مصنع / مورّد جملة', 'أخرى'];
const errMsg = e => { const m = String(e?.message || e || ''); return /Invalid login/i.test(m) ? 'الإيميل أو كلمة المرور غير صحيحة' : /not confirmed/i.test(m) ? 'الحساب لم يتم تأكيده بعد، اطلب كود جديد' : /already|registered/i.test(m) ? 'هذا الإيميل مسجّل بالفعل، سجّل دخولك' : /rate|too many|seconds/i.test(m) ? 'محاولات كثيرة، انتظر قليلًا ثم حاول مرة أخرى' : /expired|invalid.*(token|otp)|Token/i.test(m) ? 'الكود غير صحيح أو انتهت صلاحيته' : /password/i.test(m) ? 'كلمة المرور ضعيفة (8 حروف على الأقل)' : 'حدث خطأ، حاول مرة أخرى'; };
const field = (id, label, attrs = '', hint = '') => `<div><label class="lbl" for="${id}">${label}</label><input class="field" id="${id}" ${attrs}>${hint ? `<p class="hint">${hint}</p>` : ''}</div>`;
const sel = (id, label, opts, val = '', ph = '') => `<div><label class="lbl" for="${id}">${label}</label><select class="field" id="${id}">${ph ? `<option value="">${ph}</option>` : ''}${opts.map(o => { const [v, t] = Array.isArray(o) ? o : [o, o]; return `<option value="${esc(v)}" ${String(v) === String(val) ? 'selected' : ''}>${esc(t)}</option>`; }).join('')}</select></div>`;
const tbl = (head, rows, empt) => rows.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr>${head.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>` : empt;
const balance = async id => { const { data, error } = await sb.rpc('kt_store_balance', { p_store: id }); if (error) throw error; return data?.[0] || { gross: 0, commission: 0, net: 0, paid: 0, pending: 0, ad_spent: 0, ad_credit: 0, available: 0 }; };
const stat = (icon, label, val, d = '', cls = '') => `<div class="card stat ${cls}"><div class="stat__l">${ic(icon)}${label}</div><div class="stat__v">${val}</div>${d ? `<div class="stat__d">${d}</div>` : ''}</div>`;
const live = l => l.filter(x => x.status !== 'cancelled');
const approved = c => c.store.status === 'approved';
const pgh = (t, s, act = '') => `<div class="pgh"><div><h2>${t}</h2>${s ? `<p>${s}</p>` : ''}</div><div>${act}</div></div>`;

/* ======================= الدخول والتسجيل (بدون شل) ======================= */
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

/* ======================= الشل: الحماية والتنقل ======================= */
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

/* ======================= الصفحات ======================= */
const pages = {};

/* ---- نظرة عامة ---- */
pages.overview = async (el, c) => {
  const st = c.store;
  if (!approved(c)) { el.innerHTML = statusBanner(c) + `<div class="grid g3">${[['store', 'أكمل بيانات متجرك', 'الشعار والوصف ورقم التواصل', '/dashboard/store'], ['box', 'جهّز منتجاتك', 'ستتاح إضافة المنتجات بعد التفعيل', '/dashboard/store'], ['help', 'اقرأ دليل البائع', 'العمولة والسحب والإعلانات', '/dashboard/help']].map(([i, t, d, h]) => `<a data-l href="${BASE}${h}" class="card" style="display:grid;gap:6px">${ic(i, 'lg')}<h3>${t}</h3><p style="color:var(--muted);font-size:.88rem">${d}</p></a>`).join('')}</div>`; return; }
  el.innerHTML = pgh(`أهلًا، ${esc(st.name)}`, 'ملخص أداء متجرك', `<a class="btn btn-p" data-l href="${BASE}/dashboard/products">${ic('plus', 'sm')} منتج جديد</a>`) + `<div class="grid g4" id="st">${[1, 2, 3, 4].map(() => skel(110)).join('')}</div><div class="grid g-main" style="margin-top:16px"><div id="ch">${skel(300)}</div><div id="tp">${skel(300)}</div></div><div id="ro" style="margin-top:16px">${skel(200)}</div>`;
  const [lines, bal, prods] = await Promise.all([loadSales(st.id), balance(st.id), sb.from('kt_products').select('id,approval_status,active,stock').eq('store_id', st.id)]);
  const days = lastDays(14), now = Date.now(), d30 = live(lines).filter(l => now - new Date(l.created_at) < 30 * 864e5), orders30 = groupOrders(d30);
  const pl = prods.data || [], pend = pl.filter(p => p.approval_status === 'pending').length, low = pl.filter(p => p.approval_status === 'approved' && p.stock <= 5).length;
  $('#st').innerHTML = stat('wallet', 'الرصيد المتاح', money(bal.available), `إجمالي أرباحك ${moneyT(bal.net)}`, 'stat--hl') + stat('cash', 'مبيعات آخر 30 يوم', money(sum(d30, l => l.total)), `${orders30.length} طلب`) + stat('bag', 'طلبات جديدة', orders30.filter(o => ['new', 'confirmed'].includes(o.status)).length, 'تنتظر الشحن') + stat('box', 'منتجاتك', pl.length, `${pend ? pend + ' قيد المراجعة • ' : ''}${low ? low + ' مخزونها قليل' : 'المخزون سليم'}`);
  const byDay = Object.fromEntries(days.map(k => [k, 0])); live(lines).forEach(l => { const k = dkey(l.created_at); if (k in byDay) byDay[k] += l.total; });
  $('#ch').innerHTML = `<div class="card"><div class="card__head"><div><h3>المبيعات، آخر 14 يوم</h3><p>قيمة المنتجات المباعة (بدون الملغي)</p></div></div>${areaChart(days, days.map(k => byDay[k]), { unit: 'جنيه' })}</div>`;
  const top = Object.values(live(lines).reduce((m, l) => { (m[l.slug] ||= { l: l.product_name, v: 0 }).v += l.total; return m; }, {})).sort((a, b) => b.v - a.v).slice(0, 5);
  $('#tp').innerHTML = `<div class="card" style="height:100%"><div class="card__head"><h3>الأكثر مبيعًا</h3></div>${top.length ? hbars(top, moneyT) : '<p class="empty" style="padding:30px 0">لا مبيعات بعد</p>'}</div>`;
  const recent = groupOrders(lines).slice(0, 6);
  $('#ro').innerHTML = `<div class="card__head"><h3>آخر الطلبات</h3><a class="btn-link" data-l href="${BASE}/dashboard/orders">عرض الكل</a></div>` + tbl(['الطلب', 'التاريخ', 'العميل', 'المبلغ', 'الحالة'], recent.map(o => `<tr><td dir="ltr" style="text-align:start"><b>${esc(o.no)}</b></td><td>${date(o.at)}</td><td>${esc(o.name)}<span class="sub">${esc(o.city)}</span></td><td>${money(o.total)}</td><td>${orderBadge(o.status)}</td></tr>`), empty('bag', 'لا طلبات بعد', 'أول طلب على منتجاتك هيظهر هنا.'));
};

/* ---- الطلبات ---- */
pages.orders = async (el, c) => {
  el.innerHTML = pgh('الطلبات', 'طلبات العملاء على منتجات متجرك. الشحن وتحديث الحالة بيتم عن طريق Kitchenly.', '<button class="btn btn-g" id="ex">' + ic('dl', 'sm') + ' تصدير CSV</button>') + skel(300);
  const orders = groupOrders(await loadSales(c.store.id)); let f = 'all', q = '';
  const draw = () => {
    const list = orders.filter(o => (f === 'all' || o.status === f) && (!q || `${o.no} ${o.name} ${o.phone}`.toLowerCase().includes(q)));
    el.innerHTML = pgh('الطلبات', 'طلبات العملاء على منتجات متجرك. الشحن وتحديث الحالة بيتم عن طريق Kitchenly.', `<button class="btn btn-g" id="ex">${ic('dl', 'sm')} تصدير CSV</button>`) +
      `<div class="tools"><div class="chips">${[['all', 'الكل'], ...Object.entries(ORDER).map(([k, v]) => [k, v[0]])].map(([k, t]) => `<button class="chip" data-f="${k}" aria-pressed="${f === k}">${t}${k !== 'all' ? ` (${orders.filter(o => o.status === k).length})` : ` (${orders.length})`}</button>`).join('')}</div><input class="field" id="q" placeholder="ابحث برقم الطلب أو اسم العميل" value="${esc(q)}"></div>` +
      tbl(['الطلب', 'التاريخ', 'العميل', 'المنتجات', 'المبلغ', 'الحالة', ''], list.map(o => `<tr><td dir="ltr" style="text-align:start"><b>${esc(o.no)}</b></td><td>${dt(o.at)}</td><td>${esc(o.name)}<span class="sub" dir="ltr" style="text-align:start">${esc(o.phone)}</span></td><td>${o.lines.length} صنف<span class="sub">${esc(o.lines[0].product_name)}${o.lines.length > 1 ? '...' : ''}</span></td><td>${money(o.total)}</td><td>${orderBadge(o.status)}</td><td class="act"><button class="btn btn-g btn-sm" data-o="${esc(o.id)}">تفاصيل</button></td></tr>`), empty('bag', orders.length ? 'لا نتائج مطابقة' : 'لا طلبات بعد', orders.length ? '' : 'لما عميل يطلب من منتجاتك هتشوفه هنا.'));
    $$('[data-f]').forEach(b => b.onclick = () => { f = b.dataset.f; draw(); });
    $('#q').oninput = e => { q = e.target.value.trim().toLowerCase(); const pos = e.target.selectionStart; draw(); const n = $('#q'); n.focus(); n.setSelectionRange(pos, pos); };
    $('#ex').onclick = () => csv('orders.csv', [['رقم الطلب', 'التاريخ', 'العميل', 'الموبايل', 'المحافظة', 'العنوان', 'المنتج', 'الكمية', 'السعر', 'الإجمالي', 'الحالة'], ...list.flatMap(o => o.lines.map(l => [o.no, dt(o.at), o.name, o.phone, o.city, o.address, l.product_name, l.qty, l.price, l.total, (ORDER[o.status] || [o.status])[0]]))]);
    $$('[data-o]').forEach(b => b.onclick = () => { const o = orders.find(x => x.id === b.dataset.o); modal(`<div class="dlg"><h2 dir="ltr" style="text-align:start">${esc(o.no)} ${orderBadge(o.status)}</h2><dl class="kv"><dt>العميل</dt><dd>${esc(o.name)}</dd><dt>الموبايل</dt><dd dir="ltr" style="text-align:start"><a href="tel:${esc(o.phone)}">${esc(o.phone)}</a></dd><dt>العنوان</dt><dd>${esc(o.city)} - ${esc(o.address)}</dd><dt>التاريخ</dt><dd>${dt(o.at)}</dd></dl><ul class="rows">${o.lines.map(l => `<li><span>${esc(l.product_name)} × ${l.qty}</span><b>${moneyT(l.total)}</b></li>`).join('')}<li><span>إجمالي منتجاتك</span><b>${moneyT(o.total)}</b></li></ul><div class="dlg__foot"><button class="btn btn-g" onclick="this.closest('dialog').close()">إغلاق</button></div></div>`); });
  };
  draw();
};

/* ---- المنتجات ---- */
pages.products = async (el, c) => {
  const [{ data: cats }, { data: list, error }] = await Promise.all([sb.from('kt_categories').select('*').order('sort'), sb.from('kt_products').select('*, category:kt_categories(name)').eq('store_id', c.store.id).order('created_at', { ascending: false })]);
  if (error) throw error; let f = 'all', q = '';
  const open = p => productForm({ p, cats: cats || [], uid: c.user.id, store: c.store, onSaved: () => pages.products(el, c) });
  const draw = () => {
    const rows = list.filter(p => (f === 'all' || p.approval_status === f) && (!q || p.name.toLowerCase().includes(q)));
    el.innerHTML = pgh('المنتجات', 'كل منتج جديد يُراجع من فريق Kitchenly قبل ظهوره في الموقع.', `<button class="btn btn-p" id="np">${ic('plus', 'sm')} منتج جديد</button>`) +
      `<div class="tools"><div class="chips">${[['all', 'الكل'], ['approved', 'معتمد'], ['pending', 'قيد المراجعة'], ['rejected', 'مرفوض']].map(([k, t]) => `<button class="chip" data-f="${k}" aria-pressed="${f === k}">${t} (${k === 'all' ? list.length : list.filter(p => p.approval_status === k).length})</button>`).join('')}</div><input class="field" id="q" placeholder="ابحث باسم المنتج" value="${esc(q)}"></div>` +
      tbl(['المنتج', 'القسم', 'السعر', 'المخزون', 'الحالة', ''], rows.map(p => `<tr><td><div class="thumb"><img src="${esc(p.image)}" alt="" loading="lazy"><div><b>${esc(p.name)}</b>${p.approval_status === 'rejected' && p.reject_reason ? `<span class="sub" style="color:var(--red)">سبب الرفض: ${esc(p.reject_reason)}</span>` : `<span class="sub">${p.active ? 'ظاهر' : 'مخفي'}</span>`}</div></div></td><td>${esc(p.category?.name || '-')}</td><td>${money(p.price)}${p.old_price > p.price ? '<span class="sub">عليه خصم</span>' : ''}</td><td>${p.stock <= 5 ? `<b style="color:var(--red)">${p.stock}</b>` : p.stock}</td><td>${sBadge(PROD, p.approval_status)}</td><td class="act">${p.approval_status === 'approved' ? `<a class="btn btn-g btn-sm" href="/product/${esc(p.slug)}" target="_blank" rel="noopener">عرض</a> ` : ''}<button class="btn btn-g btn-sm" data-e="${p.id}">تعديل</button> <button class="btn btn-d btn-sm" data-d="${p.id}">حذف</button></td></tr>`), empty('box', list.length ? 'لا نتائج مطابقة' : 'لم تضف منتجات بعد', list.length ? '' : 'أضف أول منتج وسيراجعه الفريق خلال ساعات.', list.length ? '' : '<button class="btn btn-p" id="np2">إضافة منتج</button>'));
    $$('[data-f]').forEach(b => b.onclick = () => { f = b.dataset.f; draw(); });
    $('#q').oninput = e => { q = e.target.value.trim().toLowerCase(); const pos = e.target.selectionStart; draw(); const n = $('#q'); n.focus(); n.setSelectionRange(pos, pos); };
    $('#np').onclick = () => open(null); $('#np2')?.addEventListener('click', () => open(null));
    $$('[data-e]').forEach(b => b.onclick = () => open(list.find(p => p.id === b.dataset.e)));
    $$('[data-d]').forEach(b => b.onclick = async () => { if (!(await ask('حذف المنتج نهائيًا؟', 'حذف', true))) return; const { error: e } = await sb.from('kt_products').delete().eq('id', b.dataset.d); toast(e ? (/has_orders/.test(e.message) ? 'المنتج عليه طلبات سابقة ولا يمكن حذفه. أخفِه بإلغاء "ظاهر في المتجر" من التعديل' : 'تعذر الحذف (قد يكون عليه إعلان)') : 'تم الحذف', e ? 'err' : ''); if (!e) pages.products(el, c); });
  };
  draw();
};

/* ---- التحليلات ---- */
pages.analytics = async (el, c) => {
  let range = 30;
  const draw = async () => {
    el.innerHTML = pgh('التحليلات', 'أداء متجرك ومنتجاتك', `<div class="chips">${[7, 30, 90].map(n => `<button class="chip" data-r="${n}" aria-pressed="${range === n}">آخر ${n} يوم</button>`).join('')}</div>`) + skel(400);
    $$('[data-r]').forEach(b => b.onclick = () => { range = +b.dataset.r; draw(); });
    const from = new Date(Date.now() - range * 864e5), keys = lastDays(Math.min(range, 60));
    const [all, pv, prods] = await Promise.all([loadSales(c.store.id), sb.from('kt_product_views').select('day,product_id,views').gte('day', dkey(from)), sb.from('kt_products').select('id,name,slug').eq('store_id', c.store.id)]);
    const inR = all.filter(l => new Date(l.created_at) >= from), lv = live(inR), orders = groupOrders(lv), views = pv.data || [], names = Object.fromEntries((prods.data || []).map(p => [p.id, p.name]));
    const totalV = sum(views, v => v.views), rev = sum(lv, l => l.total), units = sum(lv, l => l.qty), cancelled = new Set(inR.filter(l => l.status === 'cancelled').map(l => l.order_id)).size, allO = new Set(inR.map(l => l.order_id)).size;
    const byDay = Object.fromEntries(keys.map(k => [k, 0])), vDay = { ...byDay }; lv.forEach(l => { const k = dkey(l.created_at); if (k in byDay) byDay[k] += l.total; }); views.forEach(v => { if (v.day in vDay) vDay[v.day] += v.views; });
    const topRev = Object.values(lv.reduce((m, l) => { (m[l.slug] ||= { l: l.product_name, v: 0, u: 0 }); m[l.slug].v += l.total; m[l.slug].u += l.qty; return m; }, {})).sort((a, b) => b.v - a.v).slice(0, 6);
    const topV = Object.entries(views.reduce((m, v) => (m[v.product_id] = (m[v.product_id] || 0) + v.views, m), {})).map(([id, v]) => ({ l: names[id] || 'منتج', v })).sort((a, b) => b.v - a.v).slice(0, 6);
    const stt = Object.entries(ORDER).map(([k, v]) => ({ l: v[0], v: groupOrders(inR).filter(o => o.status === k).length })).filter(x => x.v);
    const cities = Object.entries(orders.reduce((m, o) => (m[o.city || 'غير محدد'] = (m[o.city || 'غير محدد'] || 0) + 1, m), {})).map(([l, v]) => ({ l, v })).sort((a, b) => b.v - a.v).slice(0, 6);
    el.innerHTML = pgh('التحليلات', 'أداء متجرك ومنتجاتك', `<div class="chips">${[7, 30, 90].map(n => `<button class="chip" data-r="${n}" aria-pressed="${range === n}">آخر ${n} يوم</button>`).join('')}</div>`) +
      `<div class="grid g4 keep2">${stat('cash', 'المبيعات', money(rev), `${units} وحدة`)}${stat('bag', 'الطلبات', orders.length, cancelled ? `${cancelled} ملغي من ${allO}` : 'بدون إلغاء')}${stat('eye', 'مشاهدات المنتجات', fmt(totalV), 'زيارات صفحات منتجاتك')}${stat('trend', 'معدل التحويل', totalV ? `${((orders.length / totalV) * 100).toFixed(1)}%` : '-', `متوسط الطلب ${orders.length ? moneyT(rev / orders.length) : '-'}`)}</div>
      <div class="grid g2" style="margin-top:16px"><div class="card"><div class="card__head"><h3>المبيعات اليومية</h3></div>${areaChart(keys, keys.map(k => byDay[k]), { unit: 'جنيه' })}</div><div class="card"><div class="card__head"><h3>مشاهدات المنتجات</h3></div>${areaChart(keys, keys.map(k => vDay[k]), { color: 'var(--blue)', unit: 'مشاهدة' })}</div></div>
      <div class="grid g2" style="margin-top:16px"><div class="card"><div class="card__head"><h3>الأعلى مبيعًا</h3></div>${topRev.length ? hbars(topRev, moneyT) : '<p class="empty">لا بيانات</p>'}</div><div class="card"><div class="card__head"><h3>الأكثر مشاهدة</h3></div>${topV.length ? hbars(topV) : '<p class="empty">لا بيانات</p>'}</div>
      <div class="card"><div class="card__head"><h3>حالات الطلبات</h3></div>${stt.length ? hbars(stt) : '<p class="empty">لا بيانات</p>'}</div><div class="card"><div class="card__head"><h3>أكثر المحافظات طلبًا</h3></div>${cities.length ? hbars(cities) : '<p class="empty">لا بيانات</p>'}</div></div>`;
    $$('[data-r]').forEach(b => b.onclick = () => { range = +b.dataset.r; draw(); });
  };
  await draw();
};

/* ---- المتجر ---- */
pages.store = async (el, c) => {
  const s = c.store, editable = ['pending', 'approved', 'rejected'].includes(s.status);
  el.innerHTML = statusBanner(c) + pgh('بيانات المتجر', 'هذه البيانات تظهر للعملاء في صفحة متجرك', approved(c) ? `<a class="btn btn-g" href="/store/${esc(s.slug)}" target="_blank" rel="noopener">${ic('ext', 'sm')} عرض صفحة المتجر</a>` : '') +
    `<form class="card" id="f" novalidate style="display:grid;gap:16px;max-width:760px">${imageField('lg', s.logo, 'شعار المتجر')}${imageField('cv', s.cover, 'صورة الغلاف (اختياري)')}
    <div class="fgrid two">${field('nm', 'اسم المتجر', `maxlength="60" value="${esc(s.name)}" required`)}${field('sl', 'رابط المتجر', `dir="ltr" value="${esc(s.slug)}" readonly`, 'لا يمكن تغييره بعد الإنشاء')}${field('ph', 'رقم الموبايل', `type="tel" dir="ltr" value="${esc(s.phone || '')}"`)}${field('wa', 'واتساب (اختياري)', `type="tel" dir="ltr" value="${esc(s.whatsapp || '')}"`)}${sel('ct', 'المحافظة', GOVS, s.city, 'اختر')}${sel('bt', 'نوع النشاط', BTYPES, s.business_type, 'اختر')}</div>
    <div><label class="lbl" for="ds">نبذة عن المتجر</label><textarea class="field" id="ds" rows="3" maxlength="400">${esc(s.description || '')}</textarea></div>
    <p id="err" class="alert" hidden></p><div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn btn-p" id="sv" ${editable ? '' : 'disabled'}>حفظ</button>${s.status === 'rejected' ? '<button type="button" class="btn btn-g" id="rs">حفظ وإعادة الإرسال للمراجعة</button>' : ''}</div></form>`;
  bindImage(el, 'lg', c.user.id); bindImage(el, 'cv', c.user.id);
  const save = async resubmit => {
    const err = $('#err'); err.hidden = true; const row = { name: $('#nm').value.trim(), phone: $('#ph').value.trim(), whatsapp: $('#wa').value.trim() || null, city: $('#ct').value || null, business_type: $('#bt').value || null, description: $('#ds').value.trim(), logo: $('#lg').value.trim() || null, cover: $('#cv').value.trim() || null };
    if (row.name.length < 2) { err.textContent = 'اكتب اسم المتجر'; err.hidden = false; return; }
    if (resubmit) row.status = 'pending';
    const { error } = await sb.from('kt_stores').update(row).eq('id', s.id); if (error) { err.textContent = 'تعذر الحفظ'; err.hidden = false; return; }
    toast(resubmit ? 'تم إرسال المتجر للمراجعة' : 'تم الحفظ'); window.Panel.refresh();
  };
  $('#f').onsubmit = e => { e.preventDefault(); save(false); }; $('#rs')?.addEventListener('click', () => save(true));
};

/* ---- الحملات ---- */
pages.campaigns = async (el, c) => {
  const [{ data: camps, error }, { data: ads }, bal] = await Promise.all([sb.from('kt_campaigns').select('*').eq('store_id', c.store.id).order('created_at', { ascending: false }), sb.from('kt_ads').select('campaign_id,spent,clicks,impressions,status').eq('store_id', c.store.id), balance(c.store.id)]);
  if (error) throw error;
  const agg = id => { const a = (ads || []).filter(x => x.campaign_id === id); return { n: a.length, spent: sum(a, x => x.spent), clicks: sum(a, x => x.clicks), imp: sum(a, x => x.impressions) }; };
  el.innerHTML = pgh('الحملات', 'نظّم إعلاناتك داخل حملات بهدف وفترة زمنية', `<a class="btn btn-g" data-l href="${BASE}/dashboard/campings/ads">إعلاناتي</a> <button class="btn btn-p" id="nc">${ic('plus', 'sm')} حملة جديدة</button>`) +
    `<div class="grid g3" style="margin-bottom:16px">${stat('wallet', 'الرصيد المتاح للإعلانات', money(bal.available), 'الإنفاق على الإعلانات يُخصم من أرباحك أو رصيدك الإعلاني')}${stat('mega', 'عدد الحملات', (camps || []).length, `${(camps || []).filter(x => x.status === 'active').length} نشطة`)}${stat('cash', 'إجمالي الإنفاق', money(sum(ads || [], x => x.spent)), `${fmt(sum(ads || [], x => x.clicks))} نقرة`)}</div>` +
    tbl(['الحملة', 'الهدف', 'الفترة', 'الإعلانات', 'ظهور', 'نقرات', 'الإنفاق', 'الحالة', ''], (camps || []).map(x => { const a = agg(x.id); return `<tr><td><b>${esc(x.name)}</b></td><td>${GOAL[x.goal]}</td><td>${x.starts_at ? date(x.starts_at) : 'من الآن'}<span class="sub">${x.ends_at ? 'حتى ' + date(x.ends_at) : 'بدون نهاية'}</span></td><td>${a.n}</td><td>${fmt(a.imp)}</td><td>${fmt(a.clicks)}</td><td>${money(a.spent)}</td><td>${badge(x.status === 'active' ? 'b-ok' : x.status === 'paused' ? 'b-warn' : '', { active: 'نشطة', paused: 'متوقفة', ended: 'منتهية' }[x.status])}</td><td class="act">${x.status !== 'ended' ? `<button class="btn btn-g btn-sm" data-t="${x.id}" data-s="${x.status === 'active' ? 'paused' : 'active'}">${x.status === 'active' ? 'إيقاف' : 'تشغيل'}</button> ` : ''}<button class="btn btn-d btn-sm" data-d="${x.id}">حذف</button></td></tr>`; }), empty('mega', 'لا توجد حملات بعد', 'أنشئ حملة ثم أضف لها إعلانات لمنتجاتك.', '<button class="btn btn-p" id="nc2">إنشاء حملة</button>'));
  const create = () => {
    const d = modal(`<form id="cf" novalidate><h2>حملة جديدة</h2>${field('cn', 'اسم الحملة', 'maxlength="80" placeholder="مثال: عروض نهاية الأسبوع"')}${sel('cg', 'الهدف', Object.entries(GOAL), 'sales')}<div class="fgrid two">${field('cs', 'تبدأ في', 'type="date"')}${field('ce', 'تنتهي في (اختياري)', 'type="date"')}</div><p id="err" class="alert" hidden></p><div class="dlg__foot"><button type="button" class="btn btn-g" id="cc">إلغاء</button><button class="btn btn-p">إنشاء</button></div></form>`);
    $('#cc', d).onclick = () => d.close();
    $('#cf', d).onsubmit = async e => { e.preventDefault(); const err = $('#err', d), row = { store_id: c.store.id, name: $('#cn', d).value.trim(), goal: $('#cg', d).value, starts_at: $('#cs', d).value || null, ends_at: $('#ce', d).value || null }; if (row.name.length < 2) { err.textContent = 'اكتب اسم الحملة'; err.hidden = false; return; } if (row.starts_at && row.ends_at && row.ends_at < row.starts_at) { err.textContent = 'تاريخ النهاية قبل البداية'; err.hidden = false; return; } const { error: er } = await sb.from('kt_campaigns').insert(row); if (er) { err.textContent = 'تعذر إنشاء الحملة'; err.hidden = false; return; } d.close(); toast('تم إنشاء الحملة'); pages.campaigns(el, c); };
  };
  $('#nc').onclick = create; $('#nc2')?.addEventListener('click', create);
  $$('[data-t]').forEach(b => b.onclick = async () => { const { error: e } = await sb.from('kt_campaigns').update({ status: b.dataset.s }).eq('id', b.dataset.t); toast(e ? 'تعذر التحديث' : 'تم التحديث', e ? 'err' : ''); pages.campaigns(el, c); });
  $$('[data-d]').forEach(b => b.onclick = async () => { if (!(await ask('حذف الحملة وكل إعلاناتها؟', 'حذف', true))) return; const { error: e } = await sb.from('kt_campaigns').delete().eq('id', b.dataset.d); toast(e ? 'تعذر الحذف' : 'تم الحذف', e ? 'err' : ''); pages.campaigns(el, c); });
};

/* ---- الإعلانات ---- */
pages.ads = async (el, c) => {
  const [{ data: ads, error }, { data: camps }, { data: prods }, bal] = await Promise.all([sb.from('kt_ads').select('*, product:kt_products(name,image), campaign:kt_campaigns(name)').eq('store_id', c.store.id).order('created_at', { ascending: false }), sb.from('kt_campaigns').select('id,name').eq('store_id', c.store.id).eq('status', 'active'), sb.from('kt_products').select('id,name').eq('store_id', c.store.id).eq('approval_status', 'approved').eq('active', true), balance(c.store.id)]);
  if (error) throw error;
  const committed = sum((ads || []).filter(a => ['pending', 'active', 'paused'].includes(a.status)), a => a.budget - a.spent), free = Math.max(0, bal.available - committed);
  el.innerHTML = pgh('الإعلانات', 'اعرض منتجاتك في أماكن مميزة بالموقع. بتدفع فقط لما العميل يضغط على الإعلان.', `<a class="btn btn-g" data-l href="${BASE}/dashboard/campings">الحملات</a> <button class="btn btn-p" id="na">${ic('plus', 'sm')} إعلان جديد</button>`) +
    `<div class="grid g3" style="margin-bottom:16px">${stat('wallet', 'متاح لميزانيات جديدة', money(free), `رصيدك ${moneyT(bal.available)} - محجوز ${moneyT(committed)}`)}${stat('eye', 'مرات الظهور', fmt(sum(ads || [], a => a.impressions)))}${stat('trend', 'النقرات', fmt(sum(ads || [], a => a.clicks)), sum(ads || [], a => a.impressions) ? `CTR ${((sum(ads || [], a => a.clicks) / sum(ads || [], a => a.impressions)) * 100).toFixed(1)}%` : '')}</div>` +
    tbl(['الإعلان', 'الحملة', 'المكان', 'سعر النقرة', 'الميزانية', 'ظهور', 'نقرات', 'الحالة', ''], (ads || []).map(a => `<tr><td><div class="thumb"><img src="${esc(a.product?.image || '')}" alt=""><b>${esc(a.product?.name || '-')}</b></div></td><td>${esc(a.campaign?.name || '-')}</td><td>${PLACE[a.placement]}</td><td>${moneyT(a.cpc)}</td><td style="min-width:130px">${moneyT(a.spent)} / ${moneyT(a.budget)}<div class="bar" style="margin-top:6px"><i style="width:${Math.min(100, (a.spent / a.budget) * 100)}%"></i></div></td><td>${fmt(a.impressions)}</td><td>${fmt(a.clicks)}${a.impressions ? `<span class="sub">${((a.clicks / a.impressions) * 100).toFixed(1)}%</span>` : ''}</td><td>${sBadge(AD, a.status)}${a.status === 'rejected' && a.reject_reason ? `<span class="sub" style="color:var(--red)">${esc(a.reject_reason)}</span>` : ''}</td><td class="act">${['active', 'paused'].includes(a.status) ? `<button class="btn btn-g btn-sm" data-t="${a.id}" data-s="${a.status === 'active' ? 'paused' : 'active'}">${a.status === 'active' ? 'إيقاف' : 'تشغيل'}</button> ` : ''}${['pending', 'rejected', 'paused'].includes(a.status) ? `<button class="btn btn-d btn-sm" data-d="${a.id}">حذف</button>` : ''}</td></tr>`), empty('target', 'لا توجد إعلانات', 'أنشئ إعلانًا لمنتج معتمد وسيراجعه الفريق قبل التشغيل.'));
  $('#na').onclick = () => {
    if (!(camps || []).length) { modal(`<div class="dlg"><h2>أنشئ حملة أولًا</h2><p>الإعلانات بتتجمع داخل حملات. أنشئ حملة نشطة ثم ارجع هنا.</p><div class="dlg__foot"><a class="btn btn-p" data-l href="${BASE}/dashboard/campings" onclick="this.closest('dialog').close()">إنشاء حملة</a></div></div>`); return; }
    if (!(prods || []).length) { toast('لازم يكون عندك منتج معتمد وظاهر أولًا', 'err'); return; }
    const d = modal(`<form id="af" novalidate><h2>إعلان جديد</h2>${sel('ac', 'الحملة', (camps).map(x => [x.id, x.name]))}${sel('ap', 'المنتج', prods.map(x => [x.id, x.name]))}${sel('al', 'مكان الظهور', Object.entries(PLACE), 'home')}<div class="fgrid two">${field('ak', 'سعر النقرة (جنيه)', 'type="number" min="0.5" step="0.25" value="1"', 'الحد الأدنى 0.5 جنيه')}${field('ab', 'الميزانية (جنيه)', `type="number" min="10" step="1" value="${Math.min(100, Math.floor(free)) || 10}"`, `المتاح: ${moneyT(free)}`)}</div><p id="err" class="alert" hidden></p><p class="hint">الإعلان يظهر بعد موافقة Kitchenly، ويتوقف تلقائيًا عند نفاد الميزانية.</p><div class="dlg__foot"><button type="button" class="btn btn-g" id="ax">إلغاء</button><button class="btn btn-p">إرسال للمراجعة</button></div></form>`);
    $('#ax', d).onclick = () => d.close();
    $('#af', d).onsubmit = async e => { e.preventDefault(); const err = $('#err', d), row = { store_id: c.store.id, campaign_id: $('#ac', d).value, product_id: $('#ap', d).value, placement: $('#al', d).value, cpc: +$('#ak', d).value, budget: +$('#ab', d).value }; if (!(row.cpc >= 0.5)) { err.textContent = 'سعر النقرة 0.5 جنيه على الأقل'; err.hidden = false; return; } if (!(row.budget >= 10)) { err.textContent = 'الميزانية 10 جنيه على الأقل'; err.hidden = false; return; } if (row.budget > free) { err.textContent = 'الميزانية أكبر من الرصيد المتاح'; err.hidden = false; return; } const { error: er } = await sb.from('kt_ads').insert(row); if (er) { err.textContent = /insufficient/.test(er.message) ? 'الرصيد غير كافٍ لهذه الميزانية' : 'تعذر إنشاء الإعلان'; err.hidden = false; return; } d.close(); toast('تم إرسال الإعلان للمراجعة'); pages.ads(el, c); };
  };
  $$('[data-t]').forEach(b => b.onclick = async () => { const { error: e } = await sb.from('kt_ads').update({ status: b.dataset.s }).eq('id', b.dataset.t); toast(e ? 'تعذر التحديث' : 'تم التحديث', e ? 'err' : ''); pages.ads(el, c); });
  $$('[data-d]').forEach(b => b.onclick = async () => { if (!(await ask('حذف الإعلان؟', 'حذف', true))) return; const { error: e } = await sb.from('kt_ads').delete().eq('id', b.dataset.d); toast(e ? 'تعذر الحذف' : 'تم الحذف', e ? 'err' : ''); pages.ads(el, c); });
};

/* ---- المدفوعات ---- */
pages.payouts = async (el, c) => {
  const [bal, { data: po }] = await Promise.all([balance(c.store.id), sb.from('kt_payouts').select('*').eq('store_id', c.store.id).order('created_at', { ascending: false })]);
  const withdrawable = Math.max(0, bal.net - bal.paid - bal.pending - Math.max(0, bal.ad_spent - bal.ad_credit));
  el.innerHTML = pgh('المدفوعات', 'أرباحك من الطلبات المُسلّمة بعد خصم العمولة', `<button class="btn btn-p" id="rq" ${withdrawable < 100 ? 'disabled' : ''}>${ic('cash', 'sm')} طلب سحب</button>`) +
    `<div class="grid g4 keep2">${stat('wallet', 'متاح للسحب', money(withdrawable), withdrawable < 100 ? 'الحد الأدنى للسحب 100 جنيه' : '', 'stat--hl')}${stat('cash', 'إجمالي المبيعات المُسلّمة', money(bal.gross))}${stat('tag', `عمولة Kitchenly (${c.store.commission_rate}%)`, money(bal.commission))}${stat('check', 'تم تحويله لك', money(bal.paid), bal.pending ? `${moneyT(bal.pending)} قيد التحويل` : '')}</div>
    <div class="card" style="margin:16px 0"><h3 style="margin-bottom:8px">كيف يُحسب رصيدك؟</h3><ul class="rows"><li><span>مبيعات الطلبات المُسلّمة</span><b>${moneyT(bal.gross)}</b></li><li><span>− عمولة Kitchenly</span><b>${moneyT(bal.commission)}</b></li><li><span>− تحويلات تمت أو قيد التنفيذ</span><b>${moneyT(bal.paid + bal.pending)}</b></li><li><span>− إنفاق الإعلانات</span><b>${moneyT(bal.ad_spent)}</b></li><li><span>+ رصيد إعلاني مُهدى</span><b>${moneyT(bal.ad_credit)}</b></li><li><span><b>الرصيد المتاح</b></span><b>${moneyT(bal.available)}</b></li></ul></div>` +
    `<div class="card__head"><h3>سجل التحويلات</h3></div>` + tbl(['التاريخ', 'المبلغ', 'الطريقة', 'الحساب', 'الحالة'], (po || []).map(p => `<tr><td>${dt(p.created_at)}</td><td>${money(p.amount)}</td><td>${{ instapay: 'إنستا باي', wallet: 'محفظة إلكترونية', bank: 'حساب بنكي' }[p.method] || esc(p.method)}</td><td dir="ltr" style="text-align:start">${esc(p.account)}</td><td>${badge(p.status === 'paid' ? 'b-ok' : p.status === 'rejected' ? 'b-red' : 'b-warn', { paid: 'تم التحويل', pending: 'قيد التنفيذ', rejected: 'مرفوض' }[p.status])}${p.note ? `<span class="sub">${esc(p.note)}</span>` : ''}</td></tr>`), empty('cash', 'لا تحويلات بعد'));
  $('#rq').onclick = () => {
    if (!c.store.payout_account) { modal(`<div class="dlg"><h2>أضف بيانات الاستلام أولًا</h2><p>حدد حساب إنستا باي أو المحفظة من الإعدادات.</p><div class="dlg__foot"><a class="btn btn-p" data-l href="${BASE}/dashboard/settings" onclick="this.closest('dialog').close()">فتح الإعدادات</a></div></div>`); return; }
    const d = modal(`<form id="pf" novalidate><h2>طلب سحب</h2><p>سيُحوَّل إلى <b dir="ltr">${esc(c.store.payout_account)}</b></p>${field('am', 'المبلغ (جنيه)', `type="number" min="100" max="${Math.floor(withdrawable)}" step="1" value="${Math.floor(withdrawable)}"`, `المتاح ${moneyT(withdrawable)}، والحد الأدنى 100 جنيه`)}<p id="err" class="alert" hidden></p><div class="dlg__foot"><button type="button" class="btn btn-g" id="x">إلغاء</button><button class="btn btn-p">تأكيد الطلب</button></div></form>`);
    $('#x', d).onclick = () => d.close();
    $('#pf', d).onsubmit = async e => { e.preventDefault(); const err = $('#err', d), amt = +$('#am', d).value; if (!(amt >= 100) || amt > withdrawable) { err.textContent = 'اكتب مبلغًا بين 100 والمتاح'; err.hidden = false; return; } const { error } = await sb.rpc('kt_request_payout', { p_amount: amt }); if (error) { err.textContent = /exceeds/.test(error.message) ? 'المبلغ أكبر من المتاح' : 'تعذر تنفيذ الطلب'; err.hidden = false; return; } d.close(); toast('تم إرسال طلب السحب'); pages.payouts(el, c); };
  };
};

/* ---- الإعدادات ---- */
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

/* ---- المساعدة ---- */
pages.help = async (el, c) => {
  const faq = [['كم عمولة Kitchenly؟', `العمولة ${c.store.commission_rate}% من قيمة الطلبات المُسلّمة فقط. لا رسوم اشتراك ولا رسوم على الطلبات الملغية.`], ['إزاي بيتم شحن الطلبات؟', 'Kitchenly بتتولى الشحن والتحصيل وتحديث حالة الطلب. أنت بتجهّز المنتجات وبنتواصل معاك لاستلامها.'], ['متى يظهر منتجي في الموقع؟', 'بعد مراجعة فريق Kitchenly (غالبًا خلال ساعات). أي تعديل على الاسم أو الصور أو الوصف يرجّع المنتج للمراجعة، أما السعر والمخزون فبيتحدثوا فورًا.'], ['متى أقدر أسحب أرباحي؟', 'الرصيد بيُحسب من الطلبات اللي حالتها "تم التسليم". اطلب السحب من صفحة المدفوعات بحد أدنى 100 جنيه، والتحويل بيتم على إنستا باي أو المحفظة اللي سجلتها.'], ['إزاي الإعلانات بتشتغل؟', 'بتختار منتج ومكان الظهور وسعر النقرة وميزانية. بعد موافقة Kitchenly بيظهر الإعلان بعلامة "مُموّل" وبتدفع فقط عند النقر، ويتوقف عند نفاد الميزانية. الإنفاق بيتخصم من أرباحك أو رصيدك الإعلاني.'], ['ليه منتجي اترفض؟', 'هتلاقي السبب تحت المنتج في صفحة المنتجات. الأسباب الشائعة: صور غير واضحة، وصف ناقص، أو منتج غير مسموح به. عدّل وأعد الإرسال.']];
  el.innerHTML = pgh('المساعدة', 'إجابات سريعة، ولو احتجت أكتر ابعتلنا') + `<div class="grid g-main"><div><h3 style="margin-bottom:12px">الأسئلة الشائعة</h3>${faq.map(([q, a]) => `<details class="faq"><summary>${q}</summary><p>${esc(a)}</p></details>`).join('')}</div>
  <form class="card" id="hf" style="display:grid;gap:12px;align-self:start"><h3>تواصل مع الدعم</h3>${field('hs', 'الموضوع', 'maxlength="80" required')}<div><label class="lbl" for="hb">رسالتك</label><textarea class="field" id="hb" rows="5" maxlength="1000" required></textarea></div><p id="err" class="alert" hidden></p><button class="btn btn-p">إرسال</button><p class="hint">أو عبر واتساب: <a class="btn-link" dir="ltr" target="_blank" rel="noopener" href="https://wa.me/${esc(window.KT.whatsapp)}">${esc(window.KT.phone)}</a></p></form></div>`;
  $('#hf').onsubmit = async e => { e.preventDefault(); const err = $('#err'), sub = $('#hs').value.trim(), body = $('#hb').value.trim(); if (sub.length < 3 || body.length < 10) { err.textContent = 'اكتب الموضوع والرسالة'; err.hidden = false; return; } const { error } = await sb.from('kt_messages').insert({ name: `${c.store.name} (بائع)`, phone: c.store.phone || '', body: `[دعم بائع] ${sub}\n${body}\nالإيميل: ${c.user.email}` }); if (error) { err.textContent = 'تعذر الإرسال'; err.hidden = false; return; } $('#hf').reset(); toast('تم إرسال رسالتك، سنرد قريبًا'); };
};

/* ======================= التسجيل ======================= */
window.Panel.start({
  base: BASE, home: '/dashboard', loginPath: '/login', brandSub: 'لوحة البائع', docTitle: 'لوحة البائع',
  aliases: { '/': '/dashboard', '/dashboard/analytics': '/dashboard/analystics', '/dashboard/campaigns': '/dashboard/campings', '/dashboard/campaigns/ads': '/dashboard/campings/ads' },
  nav: [
    { path: '/dashboard', label: 'نظرة عامة', icon: 'home' }, { group: 'المبيعات' },
    { path: '/dashboard/orders', label: 'الطلبات', icon: 'bag' }, { path: '/dashboard/products', label: 'المنتجات', icon: 'box' }, { path: '/dashboard/payouts', label: 'المدفوعات', icon: 'wallet' }, { group: 'النمو' },
    { path: '/dashboard/analystics', label: 'التحليلات', icon: 'chart' }, { path: '/dashboard/campings', label: 'الحملات', icon: 'mega' }, { path: '/dashboard/campings/ads', label: 'الإعلانات', sub: true }, { group: 'المتجر' },
    { path: '/dashboard/store', label: 'بيانات المتجر', icon: 'store' }, { path: '/dashboard/settings', label: 'الإعدادات', icon: 'gear' }, { path: '/dashboard/help', label: 'المساعدة', icon: 'help' }],
  footLinks: [{ href: '/', label: 'العودة للموقع', icon: 'ext' }],
  topExtra: c => (c.store.status === 'approved' ? `<a class="btn btn-g btn-sm" href="/store/${esc(c.store.slug)}" target="_blank" rel="noopener">${ic('ext', 'sm')} <span>صفحة متجري</span></a>` : badge(STORE[c.store.status][1], STORE[c.store.status][0])),
  guard, locked,
  routes: {
    '/login': { public: true, title: 'تسجيل الدخول', view: loginView }, '/signup': { public: true, title: 'حساب بائع جديد', view: signupView },
    '/dashboard': { title: 'نظرة عامة', view: pages.overview }, '/dashboard/orders': { title: 'الطلبات', view: pages.orders, needs: approved }, '/dashboard/products': { title: 'المنتجات', view: pages.products, needs: approved },
    '/dashboard/payouts': { title: 'المدفوعات', view: pages.payouts, needs: approved }, '/dashboard/analystics': { title: 'التحليلات', view: pages.analytics, needs: approved },
    '/dashboard/campings': { title: 'الحملات', view: pages.campaigns, needs: approved }, '/dashboard/campings/ads': { title: 'الإعلانات', view: pages.ads, needs: approved },
    '/dashboard/store': { title: 'بيانات المتجر', view: pages.store }, '/dashboard/settings': { title: 'الإعدادات', view: pages.settings }, '/dashboard/help': { title: 'المساعدة', view: pages.help }
  }
});
})();
