/* =====================================================================
 * js/seller/premium.js
 * الوظيفة: صفحات البريميوم في لوحة البائع (/be-seller/premuim/...): الرئيسية /premuim، تفعيل بالكود (بيختفي ويحوّل لـ /premuim بعد التفعيل)، وبناء متجر خاص بقالب جاهز أو بكتابة كود أو برفع ملفات.
 *   الموقع المنشور بيظهر على domain/<slug> كصفحة جوه موقع Kitchenly (مش iframe). الرسم المشترك بين المعاينة والموقع المنشور في js/shared/premium-store.js (window.KTPremium).
 * يعتمد على: js/shared/premium-store.js [KTPremium] · js/seller/shared.js [BASE, approved, pgh, field, sel, stat, pages] · window.Panel [sb, $, $$, esc, ic, toast, ask, go, imageField, bindImage, date, dt, badge]
 * يعرض على window.Panel.seller: PREM (المسارات) · isPremium · premiumLocked
 * الجداول: kt_stores.premium_until · kt_premium_codes (RPC kt_redeem_premium_code) · kt_store_sites (supabase/seller-premium.sql)
 * ===================================================================== */
(() => {
'use strict';
const NS = (window.Panel.seller = window.Panel.seller || {});
const { sb, $, $$, esc, ic, toast, ask, imageField, bindImage, date, dt, badge } = window.Panel;
const { BASE, approved, pgh, field, sel, stat, pages } = NS;   // js/seller/shared.js
const { TPL, tplOf, defaults } = window.KTPremium;   // js/shared/premium-store.js

/* ===================== #premium-routes: المسارات والحالة ===================== */
// #seller #premium #routes
const P = `${BASE}/premuim`;
const PREM = {
  home: P,
  code: `${P}/code-entering`,
  build: `${P}/build-ownstore`,
  tpl: `${P}/build-ownstore/template`,
  codeYo: `${P}/build-ownstore/code-yo`,
  write: `${P}/build-ownstore/code-yo/write-and-create`,
  upload: `${P}/build-ownstore/code-yo/upload`,
  gallery: `${P}/premuim-own-templat/templates`,
  edit: `${P}/template-sdeded/edit`
};
const isPremium = c => !!c.store.premium_until && new Date(c.store.premium_until) > new Date();
const premiumLocked = c => `<div class="card lock">${ic('crown')}<h3 style="font-size:1.2rem">هذه الصفحة للمتاجر البريميوم</h3><p style="color:var(--muted);max-width:440px;margin:6px auto 16px">${c.store.premium_until ? 'انتهت مدة البريميوم في متجرك. أدخل كود جديد لتكمل تعديل موقعك.' : 'فعّل البريميوم بكود التفعيل لتبني موقعك الخاص بقالب جاهز أو بالكود.'}</p><a class="btn btn-p" data-l href="${PREM.code}">إدخال كود التفعيل</a></div>`;

const go = (h, r) => window.Panel.go(h, r);
const deb = (fn, ms = 300) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
const crumbs = items => `<nav class="pcrumbs" aria-label="مسار الصفحة">${items.map(([t, h], i) => (h ? `<a data-l href="${h}">${t}</a>` : i === items.length - 1 ? `<span aria-current="page">${t}</span>` : `<span>${t}</span>`) + (i < items.length - 1 ? '<i aria-hidden="true">/</i>' : '')).join('')}</nav>`;
const MODE = { template: 'قالب جاهز', code: 'كود مكتوب', upload: 'ملفات مرفوعة' };
const TPL_HTML = '<!-- kitchenly-template -->';   /* عمود html مطلوب في الجدول؛ القالب بيتعرض من settings */
const siteUrl = c => `${location.host}/${c.store.slug}`;

/* ===================== #premium-data: قراءة وحفظ موقع المتجر ===================== */
// #seller #premium #site #supabase
const getSite = async c => { const { data, error } = await sb.from('kt_store_sites').select('*').eq('store_id', c.store.id).maybeSingle(); if (error) throw error; return data; };
const putSite = async (c, row) => {
  const { error } = await sb.from('kt_store_sites').upsert({ store_id: c.store.id, updated_at: new Date().toISOString(), ...row }, { onConflict: 'store_id' });
  if (error) throw new Error(/check|violat|too long/i.test(error.message) ? 'حجم الكود أكبر من المسموح' : /row-level|policy/i.test(error.message) ? 'البريميوم غير مفعّل أو انتهت مدته' : 'تعذر الحفظ، حاول مرة أخرى');
};
const patchSite = async (c, row) => { const { error } = await sb.from('kt_store_sites').update({ ...row, updated_at: new Date().toISOString() }).eq('store_id', c.store.id); if (error) throw new Error('تعذر الحفظ'); };
const LIM = { html: 400000, css: 200000, js: 200000 };
/* لو عنده موقع بنوع مختلف، لازم يوافق قبل ما نستبدله */
const confirmReplace = async (site, mode) => !site || site.mode === mode || !site.html || (await ask(`عندك موقع حالي (${MODE[site.mode]}). حفظ الجديد هيستبدله. تكمل؟`, 'استبدال', true));

/* ===================== #premium-bridge: بيانات المتجر للمعاينة ===================== */
// #seller #premium #preview-data
/* بيانات المعاينة: نفس شكل البيانات اللي بيعرضها الموقع المنشور (js/pages/premium-site.js) */
const abs = u => { u = String(u || ''); return /^https?:/i.test(u) ? u : u ? location.origin + '/' + u.replace(/^\//, '') : ''; };
const DEMO = [['منظم أدوات المائدة', 189, 240, 'cutlery-holder.jpg', 'منظمات'], ['مناشف ميكروفايبر', 95, 120, 'microfiber-towels.jpg', 'تنظيف'], ['حامل إسفنج للمجلى', 79, 0, 'sponge-holders.jpg', 'منظمات'], ['فرشاة تنظيف ملوّنة', 55, 70, 'brush-colors.jpg', 'تنظيف']];
async function loadBridge(c) {
  const { data } = await sb.from('kt_products').select('slug,name,price,old_price,image,images,stock,rating,reviews_count,short_desc,category:kt_categories(name)').eq('store_id', c.store.id).eq('approval_status', 'approved').eq('active', true).order('created_at', { ascending: false }).limit(60);
  let products = (data || []).map(p => ({ slug: p.slug, name: p.name, price: +p.price, old_price: +p.old_price || 0, image: abs(p.image), images: (p.images || []).map(abs), stock: p.stock, rating: +p.rating || 0, reviews_count: p.reviews_count || 0, description: p.short_desc || '', category: p.category?.name || '' })), demo = false;
  if (!products.length) { demo = true; products = DEMO.map(([name, price, old, img, category], i) => ({ slug: `demo-${i}`, name, price, old_price: old, image: abs(`assets/img/${img}`), images: [], stock: 20, rating: 4.5, reviews_count: 12, description: '', category })); }
  const s = c.store;
  return { store: { name: s.name, slug: s.slug, logo: abs(s.logo), cover: abs(s.cover), description: s.description || '', city: s.city || '' }, products, demo, shop: { freeShipFrom: window.KT.freeShipFrom, shippingFee: window.KT.shippingFee } };
}

/* ===================== #premium-preview: معاينة الموقع بنفس رسم الموقع المنشور ===================== */
// #seller #premium #preview #iframe #render
/* المعاينة iframe بس عشان زرار موبايل/كمبيوتر يطبّق media queries صح؛ جواه نفس js/shared/premium-store.js ونفس premium-site.css بتوع الموقع المنشور */
const origin = () => location.origin;
const SANDBOX = 'allow-scripts allow-popups allow-forms allow-modals';
const pvDoc = payload => `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><base href="${origin()}/"><link href="https://fonts.googleapis.com/css2?family=Readex+Pro:wght@300;400;500;600;700&display=swap" rel="stylesheet"><link rel="stylesheet" href="/css/base.css"><link rel="stylesheet" href="/css/pages/premium-site.css"></head><body><div id="r"></div><script src="/js/shared/premium-store.js"><\/script><script>(function(){var P=${JSON.stringify(payload || null).replace(/</g, '\\u003c')},r=document.getElementById('r'),send=function(m){parent.postMessage(m,'*')},H={onAdd:function(s){send({kt:'add',slug:s})},onOpen:function(s){send({kt:'open',slug:s})},onGoto:function(u){send({kt:'goto',url:u})}};function run(p){if(!p)return;if(p.custom)KTPremium.mountCustom(r,p.data,p.site,H).catch(function(){r.textContent='تعذر عرض الكود'});else KTPremium.mount(r,p.data,H)}addEventListener('message',function(e){var m=e.data;if(m&&m.kt==='render')run(m.p)});run(P);send({kt:'ready'})})();<\/script></body></html>`;
const tplPayload = (data, tid, settings) => ({ custom: false, data: { ...data, tid, settings } });
const customPayload = (data, S) => ({ custom: true, data: { ...data, tid: 'fresh', settings: {} }, site: { html: S.html, css: S.css } });

const previewBox = id => `<div class="pv"><div class="pv__bar"><span>معاينة مباشرة</span><div class="chips"><button type="button" class="chip" data-dev="d" aria-pressed="true">كمبيوتر</button><button type="button" class="chip" data-dev="m" aria-pressed="false">موبايل</button></div></div><div class="pv__stage" id="${id}-st"><iframe id="${id}" class="pv__f" title="معاينة الموقع" sandbox="${SANDBOX}"></iframe></div></div>`;
let pvListener = null;
function bindPreview(root, id) {
  const frame = $(`#${id}`, root); let ready = false, last = null;
  $$('[data-dev]', root).forEach(b => b.onclick = () => { const m = b.dataset.dev === 'm'; $(`#${id}-st`, root).classList.toggle('pv--m', m); $$('[data-dev]', root).forEach(x => x.setAttribute('aria-pressed', x === b)); });
  if (pvListener) window.removeEventListener('message', pvListener);
  pvListener = e => {
    if (e.source !== frame.contentWindow) return; const m = e.data || {};
    if (m.kt === 'ready') { ready = true; if (last) frame.contentWindow.postMessage({ kt: 'render', p: last }, '*'); }
    else if (m.kt === 'add') toast('في الموقع المنشور المنتج هيتضاف لسلة العميل');
    else if (m.kt === 'open') toast('في الموقع المنشور هتفتح صفحة المنتج');
    else if (m.kt === 'goto') toast('في الموقع المنشور هتفتح الصفحة دي');
  };
  window.addEventListener('message', pvListener);
  frame.srcdoc = pvDoc(null);
  return p => { last = p; if (ready) frame.contentWindow.postMessage({ kt: 'render', p }, '*'); };
}
const saveBar = site => `<div class="savebar"><span class="sub" id="sv-st">${site ? `آخر حفظ ${esc(dt(site.updated_at))}${site.published ? ' · منشور' : ' · مسودة'}` : 'لم يتم الحفظ بعد'}</span><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-g" id="sv-d">حفظ كمسودة</button><button class="btn btn-p" id="sv-p">${ic('up', 'sm')} حفظ ونشر</button></div></div>`;

/* ===================== #page-premium-home: رئيسية البريميوم (/premuim) ===================== */
// #page-premium-home #route #seller #premium #premuim
pages.premHome = async (el, c) => {
  const site = await getSite(c), left = Math.max(0, Math.ceil((new Date(c.store.premium_until) - Date.now()) / 864e5)), url = `${location.origin}/${c.store.slug}`;
  el.innerHTML = crumbs([['البريميوم']]) + pgh('البريميوم', 'متجرك الخاص على Kitchenly: صفحة باسمك ومنتجاتك وسلة الموقع.') +
    `<div class="banner" style="background:var(--ok-soft);color:var(--ok)">${ic('check', 'lg')}<div><b>البريميوم شغّال على متجرك</b><p>ينتهي في ${esc(date(c.store.premium_until))}.</p></div></div>
    <div class="grid g3" style="margin-bottom:18px">${stat('crown', 'المدة المتبقية', `${left}<small>يوم</small>`, `ينتهي في ${esc(date(c.store.premium_until))}`, 'stat--hl')}${stat('store', 'حالة الموقع', site ? (site.published ? 'منشور' : 'مسودة') : 'لم يُبنَ بعد', site ? `آخر تعديل ${esc(dt(site.updated_at))}` : 'اختار طريقة البناء من تحت')}${stat('layers', 'طريقة البناء', site ? esc(MODE[site.mode]) : '-', site?.template_id ? `قالب ${esc(tplOf(site.template_id).name)}` : '')}</div>
    ${site?.published ? `<div class="linkrow" style="margin-bottom:18px"><span dir="ltr">${esc(siteUrl(c))}</span><div style="display:flex;gap:8px"><a class="btn btn-g btn-sm" target="_blank" rel="noopener" href="/${esc(c.store.slug)}">${ic('ext', 'sm')} فتح الموقع</a><button class="btn btn-g btn-sm" id="cp">نسخ الرابط</button></div></div>` : ''}
    <div class="choose"><a class="choice" data-l href="${PREM.build}"><span class="choice__i">${ic('layers', 'lg')}</span><h3>ابنِ متجرك</h3><p>قالب جاهز أو HTML و CSS من عندك، مع منتجاتك وسلة Kitchenly.</p><b class="btn btn-p">${site ? 'كمّل البناء' : 'ابدأ البناء'}</b></a><a class="choice" data-l href="${PREM.gallery}"><span class="choice__i">${ic('star', 'lg')}</span><h3>القوالب الجاهزة</h3><p>أربعة تصاميم بشكل مميز لمتجرك، المعاينة باسمك ومنتجاتك.</p><b class="btn btn-g">تصفح القوالب</b></a></div>`;
  $('#cp')?.addEventListener('click', () => { navigator.clipboard?.writeText(url).then(() => toast('تم نسخ الرابط'), () => toast('تعذر النسخ', 'err')); });
};

/* ===================== #page-premium-code: تفعيل البريميوم بالكود ===================== */
// #page-premium-code #route #seller #premium #code-entering
/* بعد التفعيل الصفحة دي بتختفي: مفيش إدخال كود تاني والبائع بيتحوّل لـ /premuim (والسيرفر كمان بيرفض: already_premium) */
pages.premCode = async (el, c) => {
  if (isPremium(c)) return go(PREM.home, true);
  el.innerHTML = crumbs([['البريميوم'], ['تفعيل بالكود']]) + pgh('تفعيل البريميوم', 'أدخل الكود اللي وصلك من فريق Kitchenly لتفتح بناء متجرك الخاص.') +
    (c.store.premium_until ? `<div class="banner" style="background:var(--amber-soft);color:var(--amber)">${ic('clock', 'lg')}<div><b>انتهت مدة البريميوم</b><p>انتهت في ${esc(date(c.store.premium_until))}. أدخل كود جديد علشان تكمّل تعديل موقعك.</p></div></div>` : '') +
    `<div class="g2 grid" style="max-width:920px"><form class="card" id="f" novalidate style="display:grid;gap:14px;align-content:start"><div><label class="lbl" for="cd">كود التفعيل</label><input class="field code-in" id="cd" dir="ltr" autocomplete="off" spellcheck="false" maxlength="32" placeholder="KT-XXXX-XXXX"></div><p id="err" class="alert" hidden></p><button class="btn btn-p btn-block" id="go">تفعيل الكود</button></form>
    <div class="card"><h3 style="margin-bottom:10px">اللي هتفتحه بالبريميوم</h3><ul class="rows"><li><span>رابط خاص باسم متجرك: <b dir="ltr">${esc(siteUrl(c))}</b></span></li><li><span>صفحة متجر بشكل مميز جوه موقع Kitchenly بمنتجاتك والسلة والبحث</span></li><li><span>قوالب جاهزة، أو HTML و CSS من عندك</span></li><li><span>رفع ملفات موقعك أو ملف zip</span></li></ul></div></div>`;
  const err = $('#err'), msg = e => { const m = String(e?.message || ''); return /invalid_code/.test(m) ? 'الكود غير صحيح، راجعه وحاول تاني' : /code_used/.test(m) ? 'الكود ده اتستخدم قبل كده' : /store_not_approved/.test(m) ? 'متجرك لازم يتوافق عليه الأول' : 'تعذر التفعيل، حاول مرة أخرى'; };
  $('#cd').oninput = e => { e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ''); };
  $('#f').onsubmit = async e => {
    e.preventDefault(); err.hidden = true; const code = $('#cd').value.trim();
    if (code.length < 6) { err.textContent = 'اكتب الكود كامل'; err.hidden = false; return; }
    const b = $('#go'); b.disabled = true; const { error } = await sb.rpc('kt_redeem_premium_code', { p_code: code }); b.disabled = false;
    if (error) { if (/already_premium/.test(String(error.message))) { toast('البريميوم مفعّل بالفعل'); return go(PREM.home, true); } err.textContent = msg(error); err.hidden = false; return; }
    toast('تم تفعيل البريميوم'); go(PREM.home, true);
  };
};


/* ===================== #page-premium-build: اختيار طريقة بناء المتجر ===================== */
// #page-premium-build #route #seller #premium #build-ownstore
pages.premBuild = async (el, c) => {
  const site = await getSite(c), url = `${location.origin}/${c.store.slug}`;
  const cur = site ? `<div class="card" style="margin-bottom:18px;display:grid;gap:12px"><div style="display:flex;gap:14px;align-items:center;flex-wrap:wrap;justify-content:space-between"><div><h3>موقعك الحالي</h3><p class="sub">${esc(MODE[site.mode])}${site.template_id ? ` · ${esc(tplOf(site.template_id).name)}` : ''} · آخر تعديل ${esc(dt(site.updated_at))}</p></div><div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">${badge(site.published ? 'b-ok' : 'b-warn', site.published ? 'منشور' : 'مسودة')}<a class="btn btn-g btn-sm" data-l href="${site.mode === 'template' ? PREM.edit : site.mode === 'upload' ? PREM.upload : PREM.write}">تعديل</a>${site.published ? `<a class="btn btn-g btn-sm" target="_blank" rel="noopener" href="/${esc(c.store.slug)}">${ic('ext', 'sm')} فتح الموقع</a><button class="btn btn-d btn-sm" id="unp">إلغاء النشر</button>` : ''}<button class="btn btn-d btn-sm" id="del">حذف الموقع</button></div></div>${site.published ? `<div class="linkrow"><span dir="ltr">${esc(siteUrl(c))}</span><button class="btn btn-g btn-sm" id="cp">نسخ الرابط</button></div>` : '<p class="hint">الموقع مسودة. اضغط «حفظ ونشر» من صفحة التعديل ليظهر على رابطك الخاص.</p>'}</div>` : '';
  el.innerHTML = crumbs([['البريميوم'], ['ابنِ متجرك']]) + pgh('ابنِ متجرك الخاص', `موقعك هيكون على <b dir="ltr">${esc(siteUrl(c))}</b> ومتصل بمنتجاتك وسلة Kitchenly. غير البريميوم بيفضلوا على /store.`) + cur +
    `<div class="choose"><a class="choice" data-l href="${PREM.tpl}"><span class="choice__i">${ic('layers', 'lg')}</span><h3>قالب جاهز</h3><p>اختار تصميم، غيّر الألوان والنصوص والصور، وانشر. منتجاتك والبحث والسلة شغالين تلقائيًا.</p><b class="btn btn-p">ابدأ بقالب</b></a><a class="choice" data-l href="${PREM.codeYo}"><span class="choice__i">${ic('code', 'lg')}</span><h3>بالكود</h3><p>اكتب HTML و CSS و JavaScript بنفسك أو ارفع ملفات موقعك الجاهز، مع وصول لمنتجاتك والسلة.</p><b class="btn btn-g">ابدأ بالكود</b></a></div>`;
  $('#cp')?.addEventListener('click', () => { navigator.clipboard?.writeText(url).then(() => toast('تم نسخ الرابط'), () => toast('تعذر النسخ', 'err')); });
  $('#unp')?.addEventListener('click', async () => { try { await patchSite(c, { published: false }); toast('تم إلغاء النشر'); pages.premBuild(el, c); } catch (e) { toast(e.message, 'err'); } });
  $('#del')?.addEventListener('click', async () => { if (!(await ask('حذف الموقع نهائيًا؟', 'حذف', true))) return; const { error } = await sb.from('kt_store_sites').delete().eq('store_id', c.store.id); toast(error ? 'تعذر الحذف' : 'تم حذف الموقع', error ? 'err' : ''); if (!error) pages.premBuild(el, c); });
};

/* ===================== #page-premium-template: مدخل طريق القالب ===================== */
// #page-premium-template #route #seller #premium #template
pages.premTemplate = async (el, c) => {
  const site = await getSite(c), has = site?.mode === 'template';
  el.innerHTML = crumbs([['البريميوم'], ['ابنِ متجرك', PREM.build], ['قالب جاهز']]) + pgh('ابنِ متجرك بقالب جاهز', 'ثلاث خطوات وموقعك يبقى جاهز.') +
    `<ol class="stepsl"><li><b>اختار القالب</b><span>أربعة تصاميم، كلها بتعرض منتجاتك المعتمدة لحظيًا مع بحث وأقسام وعروض وسلة.</span></li><li><b>عدّل عليه</b><span>الألوان والعنوان والنبذة والصور ورقم واتساب، مع معاينة قدامك على طول.</span></li><li><b>انشر</b><span>الموقع بيظهر على ${esc(siteUrl(c))}.</span></li></ol>
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:20px"><a class="btn btn-p" data-l href="${PREM.gallery}">${has ? 'تغيير القالب' : 'تصفح القوالب'}</a>${has ? `<a class="btn btn-g" data-l href="${PREM.edit}">كمّل التعديل على قالبك</a>` : ''}</div>`;
};

/* ===================== #page-premium-templates: معرض القوالب ===================== */
// #page-premium-templates #route #seller #premium #templates
pages.premTemplates = async (el, c) => {
  const site = await getSite(c), data = await loadBridge(c);
  el.innerHTML = crumbs([['البريميوم'], ['ابنِ متجرك', PREM.build], ['قالب جاهز', PREM.tpl], ['القوالب']]) + pgh('اختار قالبك', 'المعاينة بتاعتك فعلًا: باسم متجرك وبمنتجاتك.') +
    `<div class="tgrid">${TPL.map(t => `<article class="card tcard"><div class="tcard__pv" data-pv="${t.id}"><iframe tabindex="-1" title="${esc(t.name)}" sandbox="allow-scripts"></iframe></div><div class="tcard__b"><h3>${esc(t.name)}${site?.template_id === t.id ? ` ${badge('b-ok', 'قالبك الحالي')}` : ''}</h3><p>${esc(t.desc)}</p><button class="btn btn-p btn-block" data-use="${t.id}">${site?.template_id === t.id ? 'كمّل التعديل' : 'استخدم هذا القالب'}</button></div></article>`).join('')}</div>`;
  $$('[data-pv]').forEach(b => { const t = tplOf(b.dataset.pv); $('iframe', b).srcdoc = pvDoc(tplPayload(data, t.id, defaults(c.store, t))); });
  const fit = () => $$('[data-pv]').forEach(b => { const k = b.clientWidth / 1200, f = $('iframe', b); f.style.transform = `scale(${k})`; b.style.height = `${Math.round(820 * k)}px`; });
  fit(); window.addEventListener('resize', fit, { once: true }); requestAnimationFrame(fit);
  $$('[data-use]').forEach(b => b.onclick = async () => {
    const t = tplOf(b.dataset.use);
    if (site?.mode === 'template') { if (site.template_id !== t.id) await patchSite(c, { template_id: t.id }).catch(() => {}); return go(PREM.edit); }
    if (!(await confirmReplace(site, 'template'))) return;
    b.disabled = true; const s = defaults(c.store, t);
    try { await putSite(c, { mode: 'template', template_id: t.id, settings: s, html: TPL_HTML, css: '', js: '', published: false }); go(PREM.edit); } catch (e) { toast(e.message, 'err'); b.disabled = false; }
  });
};

/* ===================== #page-premium-edit: تعديل القالب ===================== */
// #page-premium-edit #route #seller #premium #template-edit
pages.premEdit = async (el, c) => {
  const site = await getSite(c);
  if (!site || site.mode !== 'template') return go(PREM.gallery, true);
  const data = await loadBridge(c); let tid = site.template_id, published = site.published;
  const S = { ...defaults(c.store, tplOf(tid)), ...(site.settings || {}) };
  el.innerHTML = crumbs([['البريميوم'], ['ابنِ متجرك', PREM.build], ['قالب جاهز', PREM.tpl], ['تعديل القالب']]) + pgh('تعديل القالب', 'أي تغيير بيظهر في المعاينة على طول، ولازم تحفظ عشان يتثبّت. المنتجات بتتحدّث لوحدها من متجرك.', `<a class="btn btn-g" data-l href="${PREM.gallery}">تغيير القالب</a>`) +
    `<div class="pe"><form class="card pe__f" id="f" novalidate>${sel('e-tpl', 'القالب', TPL.map(t => [t.id, t.name]), tid)}
    <div class="fgrid two">${field('e-title', 'اسم المتجر في الموقع', `maxlength="60" value="${esc(S.title)}"`)}${field('e-cta', 'نص الزر', `maxlength="24" value="${esc(S.cta)}"`)}</div>
    ${field('e-tag', 'العبارة تحت العنوان', `maxlength="90" value="${esc(S.tagline)}"`)}
    <div><label class="lbl" for="e-about">نبذة عن المتجر</label><textarea class="field" id="e-about" rows="3" maxlength="500">${esc(S.about)}</textarea></div>
    ${field('e-wa', 'رقم واتساب (اختياري)', `type="tel" dir="ltr" value="${esc(S.whatsapp)}"`, 'بيظهر زر تواصل عائم وقسم تواصل')}
    <div class="fgrid" style="grid-template-columns:repeat(3,1fr)">${[['e-brand', 'اللون الأساسي', S.brand], ['e-accent', 'لون التمييز', S.accent], ['e-bg', 'الخلفية', S.bg]].map(([i, l, v]) => `<div><label class="lbl" for="${i}">${l}</label><input class="field clr" type="color" id="${i}" value="${esc(v)}"></div>`).join('')}</div>
    ${imageField('e-hero', S.hero, 'الصورة الرئيسية')}${imageField('e-logo', S.logo, 'الشعار')}
    <label class="chk"><input type="checkbox" id="e-prod" ${S.products !== false ? 'checked' : ''}> عرض منتجاتي في الموقع <small>(المنتجات المعتمدة فقط، مع البحث والأقسام والعروض)</small></label>
    <p id="err" class="alert" hidden></p>${saveBar(site)}</form>${previewBox('pv')}</div>`;
  bindImage(el, 'e-hero', c.user.id); bindImage(el, 'e-logo', c.user.id);
  const show = bindPreview(el, 'pv');
  const read = () => ({ brand: $('#e-brand').value, accent: $('#e-accent').value, bg: $('#e-bg').value, title: $('#e-title').value.trim(), tagline: $('#e-tag').value.trim(), about: $('#e-about').value.trim(), cta: $('#e-cta').value.trim(), hero: $('#e-hero').value.trim(), logo: $('#e-logo').value.trim(), whatsapp: $('#e-wa').value.trim(), products: $('#e-prod').checked });
  const draw = () => { tid = $('#e-tpl').value; show(tplPayload(data, tid, read())); };
  const dd = deb(draw, 250); const f = $('#f'); f.addEventListener('input', dd); f.addEventListener('change', dd);
  $('#e-hero-pv').addEventListener('load', dd); $('#e-logo-pv').addEventListener('load', dd);   // بعد رفع صورة
  draw();
  const save = async pub => {
    const err = $('#err'); err.hidden = true; const s = read();
    if (s.title.length < 2) { err.textContent = 'اكتب اسم المتجر'; err.hidden = false; return; }
    if (s.hero && !/^https:\/\//i.test(s.hero)) { err.textContent = 'رابط الصورة لازم يبدأ بـ https://'; err.hidden = false; return; }
    $$('#sv-d,#sv-p').forEach(b => b.disabled = true);
    try { tid = $('#e-tpl').value; published = pub ? true : published; await putSite(c, { mode: 'template', template_id: tid, settings: s, html: TPL_HTML, css: '', js: '', published }); toast(pub ? 'تم الحفظ والنشر' : 'تم الحفظ كمسودة'); $('#sv-st').textContent = `آخر حفظ الآن${published ? ' · منشور' : ' · مسودة'}`; } catch (e) { err.textContent = e.message; err.hidden = false; }
    $$('#sv-d,#sv-p').forEach(b => b.disabled = false);
  };
  f.onsubmit = e => e.preventDefault(); $('#sv-d').onclick = () => save(false); $('#sv-p').onclick = () => save(true);
};

/* ===================== #page-premium-codeyo: مدخل طريق الكود ===================== */
// #page-premium-codeyo #route #seller #premium #code-yo
pages.premCodeYo = async (el, c) => {
  const site = await getSite(c);
  el.innerHTML = crumbs([['البريميوم'], ['ابنِ متجرك', PREM.build], ['بالكود']]) + pgh('ابنِ متجرك بالكود', 'اكتب HTML و CSS وموقعك يتعرض كصفحة جوه Kitchenly. حط <div data-kt-products></div> وهتظهر منتجاتك مع السلة تلقائيًا. الـ JavaScript مش بيتشغّل في الموقع المنشور لحماية العملاء.') +
    `<div class="choose"><a class="choice" data-l href="${PREM.write}"><span class="choice__i">${ic('code', 'lg')}</span><h3>اكتب وأنشئ</h3><p>محرر لـ HTML و CSS مع معاينة مباشرة للموبايل والكمبيوتر.</p>${site?.mode === 'code' ? badge('b-ok', 'موقعك الحالي') : ''}<b class="btn btn-p">افتح المحرر</b></a>
    <a class="choice" data-l href="${PREM.upload}"><span class="choice__i">${ic('up', 'lg')}</span><h3>ارفع ملفاتك</h3><p>ارفع index.html مع ملفات css وصور، أو ملف zip فيه موقعك كله.</p>${site?.mode === 'upload' ? badge('b-ok', 'موقعك الحالي') : ''}<b class="btn btn-g">ارفع الملفات</b></a></div>`;
};

/* ===================== #page-premium-write: الكتابة والإنشاء ===================== */
// #page-premium-write #route #seller #premium #write-and-create
const STARTER = {
  html: `<header class="top">\n  <h1 data-kt-store-name></h1>\n  <a class="cta" data-kt-cart>السلة</a>\n</header>\n\n<main>\n  <section class="intro">\n    <h2>اكتب هنا عنوان يشدّ العميل</h2>\n    <p>جملة قصيرة تشرح إنت بتبيع إيه وليه يشتري منك.</p>\n  </section>\n  <section>\n    <h3>منتجاتنا</h3>\n    <div data-kt-products></div>\n  </section>\n</main>\n\n<footer>كل الحقوق محفوظة</footer>`,
  css: `body{margin:0;font-family:system-ui,Tahoma,sans-serif;background:#f7f5ee;color:#17261d;line-height:1.7}\n.top{display:flex;justify-content:space-between;align-items:center;padding:16px 6vw}\n.cta{background:#2f7d4a;color:#fff;padding:8px 18px;border-radius:99px;text-decoration:none}\nmain{padding:2vw 6vw}\n.intro h2{font-size:clamp(1.8rem,5vw,3rem);margin:0 0 8px}\nfooter{padding:24px;text-align:center;opacity:.6}`
};
const API_DOC = `<!-- شبكة منتجاتك الحقيقية (أضف للسلة + صفحة المنتج) -->
<div data-kt-products></div>

<!-- اسم متجرك كنص -->
<span data-kt-store-name></span>

<!-- رابط سلة Kitchenly -->
<a data-kt-cart>السلة</a>

/* لتعديل شكل كروت المنتجات في الـ CSS: */
.ps-grid { }  .ps-p { }  .ps-p__n { }  .ps-p__a { }

HTML و CSS فقط. الـ JavaScript بيتشال من الموقع المنشور (أمان العملاء).
لو مفيش data-kt-products بنضيف منتجاتك تحت الصفحة تلقائيًا.`;
pages.premWrite = async (el, c) => {
  const site = await getSite(c), data = await loadBridge(c), S = site?.mode === 'code' ? { html: site.html, css: site.css } : { ...STARTER }; let tab = 'html', published = !!site?.published && site?.mode === 'code';
  const TABS = [['html', 'HTML'], ['css', 'CSS']];
  el.innerHTML = crumbs([['البريميوم'], ['ابنِ متجرك', PREM.build], ['بالكود', PREM.codeYo], ['اكتب وأنشئ']]) + pgh('اكتب وأنشئ', 'اكتب HTML و CSS والمعاينة بتتحدّث لوحدها. حط <div data-kt-products></div> لعرض منتجاتك.') +
    `<div class="pe pe--wide"><div class="card pe__f"><div class="chips" role="tablist">${TABS.map(([k, t]) => `<button class="chip" role="tab" data-t="${k}" aria-pressed="${k === tab}">${t}</button>`).join('')}</div>
    <textarea class="field code" id="ed" dir="ltr" spellcheck="false" autocapitalize="off" autocomplete="off"></textarea><div class="sub" id="cnt" dir="ltr"></div>
    <details class="faq"><summary>مرجع عرض المنتجات والسلة</summary><pre class="apidoc" dir="ltr">${esc(API_DOC)}</pre></details><p id="err" class="alert" hidden></p>${saveBar(site?.mode === 'code' ? site : null)}</div>${previewBox('pv')}</div>`;
  const show = bindPreview(el, 'pv'), ed = $('#ed'), draw = () => show(customPayload(data, S)), dd = deb(draw, 350);
  const load = () => { ed.value = S[tab]; $('#cnt').textContent = `${S[tab].length.toLocaleString('en-US')} / ${LIM[tab].toLocaleString('en-US')}`; $$('[data-t]').forEach(b => b.setAttribute('aria-pressed', b.dataset.t === tab)); };
  $$('[data-t]').forEach(b => b.onclick = () => { S[tab] = ed.value; tab = b.dataset.t; load(); ed.focus(); });
  ed.addEventListener('input', () => { S[tab] = ed.value; $('#cnt').textContent = `${ed.value.length.toLocaleString('en-US')} / ${LIM[tab].toLocaleString('en-US')}`; dd(); });
  ed.addEventListener('keydown', e => { if (e.key !== 'Tab') return; e.preventDefault(); const a = ed.selectionStart; ed.setRangeText('  ', a, ed.selectionEnd, 'end'); ed.dispatchEvent(new Event('input')); });
  load(); draw();
  const save = async pub => {
    const err = $('#err'); err.hidden = true; S[tab] = ed.value;
    const over = ['html', 'css'].find(k => S[k].length > LIM[k]); if (over) { err.textContent = `ملف ${over.toUpperCase()} أكبر من الحد المسموح`; err.hidden = false; return; }
    if (!S.html.trim()) { err.textContent = 'اكتب HTML الأول'; err.hidden = false; return; }
    if (!(await confirmReplace(site, 'code'))) return;
    $$('#sv-d,#sv-p').forEach(b => b.disabled = true);
    try { published = pub ? true : published; await putSite(c, { mode: 'code', template_id: null, html: S.html, css: S.css, js: '', published }); toast(pub ? 'تم الحفظ والنشر' : 'تم الحفظ كمسودة'); $('#sv-st').textContent = `آخر حفظ الآن${published ? ' · منشور' : ' · مسودة'}`; } catch (e) { err.textContent = e.message; err.hidden = false; }
    $$('#sv-d,#sv-p').forEach(b => b.disabled = false);
  };
  $('#sv-d').onclick = () => save(false); $('#sv-p').onclick = () => save(true);
};

/* ===================== #page-premium-upload: رفع الملفات ===================== */
// #page-premium-upload #route #seller #premium #upload #zip
const MIME = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml', avif: 'image/avif' };
const isLocal = u => !/^(https?:)?\/\//i.test(u) && !/^(data|mailto|tel|#)/i.test(u);
const ext = n => (n.split('.').pop() || '').toLowerCase();
const loadJSZip = () => window.JSZip ? Promise.resolve(window.JSZip) : new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js'; s.onload = () => res(window.JSZip); s.onerror = () => rej(new Error('تعذر تحميل مكتبة الـ zip، تأكد من الاتصال')); document.head.appendChild(s); });
const toDataUri = blob => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(blob); });
async function ingest(files) {
  const htmls = [], css = [], imgs = [], notes = [], list = [];
  const take = async (name, getText, getBlob) => {
    const e = ext(name), base = name.split('/').pop();
    if (/^(__MACOSX|\.)/.test(base) || name.includes('__MACOSX/')) return;
    if (e === 'html' || e === 'htm') { htmls.push({ name, text: await getText() }); list.push(name); }
    else if (e === 'css') { css.push(await getText()); list.push(name); }
    else if (e === 'js') { if (!notes.some(n => /JavaScript/.test(n))) notes.push('ملفات JavaScript مش بتتشغّل في الموقع المنشور لحماية العملاء. استخدم HTML و CSS، ولعرض منتجاتك حط <div data-kt-products></div>'); }
    else if (MIME[e] && getBlob) { const b = await getBlob(); if (b.size <= 200 * 1024) { imgs.push({ name, blob: b, e }); list.push(name); } else notes.push(`الصورة ${base} أكبر من 200 كيلو، استخدم رابط https بدلها`); }
  };
  for (const f of files) {
    if (ext(f.name) === 'zip') {
      const Z = await loadJSZip(), z = await Z.loadAsync(f);
      for (const [n, en] of Object.entries(z.files)) if (!en.dir) await take(n, () => en.async('string'), async () => new Blob([await en.async('arraybuffer')], { type: MIME[ext(n)] }));
    } else await take(f.name, () => f.text(), () => Promise.resolve(f));
  }
  if (!htmls.length) throw new Error('مفيش ملف HTML في اللي رفعته');
  htmls.sort((a, b) => (/(^|\/)index\.html?$/i.test(b.name) ? 1 : 0) - (/(^|\/)index\.html?$/i.test(a.name) ? 1 : 0) || a.name.split('/').length - b.name.split('/').length);
  if (htmls.length > 1) notes.push(`استخدمنا ${htmls[0].name} كصفحة رئيسية وتجاهلنا باقي صفحات HTML (${htmls.length - 1})`);
  let html = htmls[0].text, style = css.join('\n');
  html = html.replace(/<link\b[^>]*>/gi, t => { if (!/rel=["']?stylesheet/i.test(t)) return t; const m = t.match(/href=["']([^"']+)["']/i); return m && isLocal(m[1]) ? '' : t; }).replace(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>\s*<\/script>/gi, (t, u) => (isLocal(u) ? '' : t));
  for (const im of imgs) { const uri = await toDataUri(im.blob), n = im.name.replace(/^\.?\//, ''), names = [...new Set([n, n.split('/').slice(1).join('/'), n.split('/').pop()].filter(Boolean))]; for (const nm of names) for (const pre of ['', './', '/']) { const p = pre + nm; html = html.split(p).join(uri); style = style.split(p).join(uri); } }
  const left = (html.match(/(?:src|href)=["'](?!https?:|\/\/|data:|#|mailto:|tel:)[^"']+/gi) || []).length; if (left) notes.push('فيه روابط محلية لم نجد ملفاتها داخل الرفع، ممكن ما تظهرش في الموقع');
  return { html, css: style, list, notes };
}
pages.premUpload = async (el, c) => {
  const site = await getSite(c), data = await loadBridge(c); let S = site?.mode === 'upload' ? { html: site.html, css: site.css } : null, published = !!site?.published && site?.mode === 'upload';
  el.innerHTML = crumbs([['البريميوم'], ['ابنِ متجرك', PREM.build], ['بالكود', PREM.codeYo], ['ارفع ملفاتك']]) + pgh('ارفع ملفاتك', 'index.html مع ملفات css وصور، أو ملف zip واحد. حط <div data-kt-products></div> لعرض منتجاتك. الـ JavaScript مش بيتشغّل في الموقع المنشور.') +
    `<div class="pe pe--wide"><div class="card pe__f"><label class="drop" id="dz"><input type="file" id="fl" accept=".html,.htm,.css,.zip,.png,.jpg,.jpeg,.gif,.webp,.svg,.avif" multiple hidden>${ic('up', 'lg')}<b>اسحب الملفات هنا أو اضغط للاختيار</b><span class="sub">HTML · CSS · ZIP · صور حتى 200 كيلو للصورة</span></label>
    <ul class="rows" id="fls" hidden></ul><div id="nts"></div><div class="alert alert--info" style="font-size:.82rem">الصور الصغيرة اللي داخل الـ zip بتتدمج في الصفحة تلقائيًا. للصور الأكبر استخدم روابط https. أي ملف css محلي بيتدمج في الصفحة. مرجع عرض المنتجات والسلة في صفحة «اكتب وأنشئ».</div><p id="err" class="alert" hidden></p>${saveBar(site?.mode === 'upload' ? site : null)}</div>${previewBox('pv')}</div>`;
  const show = bindPreview(el, 'pv'), err = $('#err'), draw = () => S && show(customPayload(data, S)); draw();
  const run = async files => {
    err.hidden = true; if (![...files].length) return; $('#dz').classList.add('busy');
    try { const r = await ingest([...files]); const tot = { html: r.html.length, css: r.css.length }, over = Object.keys(tot).find(k => tot[k] > LIM[k]); if (over) throw new Error(`حجم ${over.toUpperCase()} بعد الدمج أكبر من الحد المسموح`); S = { html: r.html, css: r.css }; const ul = $('#fls'); ul.hidden = false; ul.innerHTML = r.list.slice(0, 40).map(n => `<li><span dir="ltr">${esc(n)}</span><b>${ic('check', 'sm')}</b></li>`).join('') + (r.list.length > 40 ? `<li><span>و ${r.list.length - 40} ملف آخر</span></li>` : ''); $('#nts').innerHTML = r.notes.map(n => `<p class="alert alert--warn" style="margin-bottom:8px">${esc(n)}</p>`).join(''); draw(); }
    catch (e) { err.textContent = e.message || 'تعذر قراءة الملفات'; err.hidden = false; }
    $('#dz').classList.remove('busy');
  };
  $('#fl').onchange = e => { run(e.target.files); e.target.value = ''; };
  const dz = $('#dz'); ['dragover', 'dragenter'].forEach(ev => dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.add('over'); })); ['dragleave', 'drop'].forEach(ev => dz.addEventListener(ev, () => dz.classList.remove('over'))); dz.addEventListener('drop', e => { e.preventDefault(); run(e.dataTransfer.files); });
  const save = async pub => {
    err.hidden = true; if (!S) { err.textContent = 'ارفع ملفات موقعك الأول'; err.hidden = false; return; }
    if (!(await confirmReplace(site, 'upload'))) return;
    $$('#sv-d,#sv-p').forEach(b => b.disabled = true);
    try { published = pub ? true : published; await putSite(c, { mode: 'upload', template_id: null, html: S.html, css: S.css, js: '', published }); toast(pub ? 'تم الحفظ والنشر' : 'تم الحفظ كمسودة'); $('#sv-st').textContent = `آخر حفظ الآن${published ? ' · منشور' : ' · مسودة'}`; } catch (e) { err.textContent = e.message; err.hidden = false; }
    $$('#sv-d,#sv-p').forEach(b => b.disabled = false);
  };
  $('#sv-d').onclick = () => save(false); $('#sv-p').onclick = () => save(true);
};

Object.assign(NS, { PREM, isPremium, premiumLocked });
})();
