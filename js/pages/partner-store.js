/* =====================================================================
 * js/pages/partner-store.js
 * الوظيفة: صفحة المتجر الشريك /store/<slug>.
 * يعتمد على: js/ui/list-parts.js [sortBar, viewMode, viewBar, sortList] · window.KTApp [$, $$, esc, ic, db, card, skeletons, noProducts, emptyBox, pages, setHashtag]
 * يعرض على window.KTApp: لا شيء
 * ===================================================================== */
(() => {
'use strict';
const NS = (window.KTApp = window.KTApp || {});
const { $, $$, esc, ic, db, sb, card, skeletons, noProducts, emptyBox, pages, setHashtag } = window.KTApp;
const { sortBar, viewMode, viewBar, sortList } = NS;   // js/ui/list-parts.js

/* ===================== #partner-store: صفحة المتجر الشريك ===================== */
// #partner-store #store #page
// #page-store #route #partner-store #page
pages.store = async () => {
  const slug = (location.pathname.match(/^\/store\/([a-z0-9-]+)\/?$/) || [])[1], app = $('#app');
  app.innerHTML = `<div class="wrap page"><div class="skel" style="height:200px"></div><div class="grid" style="margin-top:20px">${skeletons(4)}</div></div>`;
  const st = slug ? await db.store(slug).catch(() => null) : null;
  if (!st) { document.title = 'المتجر غير موجود | Kitchenly'; app.innerHTML = `<div class="wrap page">${emptyBox('لم نجد هذا المتجر. ربما تم إيقافه أو تغير رابطه.', '/shop.html', 'تصفح المنتجات', 'notfound')}</div>`; return; }
  document.title = `${st.name} | Kitchenly`; setHashtag(`#${st.name.trim().replace(/\s+/g, '_')}`);
  /* موقع البريميوم المنشور (قالب أو كود): يظهر في إطار معزول. ?classic=1 يرجّع الصفحة العادية */
  const site = new URLSearchParams(location.search).has('classic') ? null : await sb.from('kt_store_sites').select('html,css,js').eq('store_id', st.id).eq('published', true).maybeSingle().then(r => r.data).catch(() => null);
  if (site?.html) {
    const doc = ((h, c, j) => { const sty = c.trim() ? `<style>${c.replace(/<\/style/gi, '<\\/style')}</style>` : '', scr = j.trim() ? `<script>${j.replace(/<\/script/gi, '<\\/script')}<\/script>` : ''; if (/<html[\s>]/i.test(h)) { const d = /<\/head>/i.test(h) ? h.replace(/<\/head>/i, () => `${sty}</head>`) : sty + h; return /<\/body>/i.test(d) ? d.replace(/<\/body>/i, () => `${scr}</body>`) : d + scr; } return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${sty}</head><body>${h}${scr}</body></html>`; })(site.html, site.css || '', site.js || '');
    app.innerHTML = `<iframe class="sitef" title="${esc(st.name)}" sandbox="allow-scripts allow-popups allow-forms allow-modals"></iframe>`; $('.sitef').srcdoc = doc; return;
  }
  app.innerHTML = `<div class="wrap page"><nav class="crumbs" aria-label="مسار التصفح"><a href="/">الرئيسية</a><span>/</span><span>${esc(st.name)}</span></nav>
  <header class="storehd${st.cover ? '' : ' storehd--def'}"${st.cover ? ` style="background-image:linear-gradient(180deg,rgba(0,0,0,.05),rgba(0,0,0,.55)),url('${esc(st.cover)}')"` : ` style="background-image:linear-gradient(270deg,rgba(255,255,255,.92),rgba(255,255,255,.6) 55%,rgba(255,255,255,.1)),url('/assets/img/pages/seller-cover.webp')"`}>
    <span class="storehd__lg">${st.logo ? `<img src="${esc(st.logo)}" alt="">` : ic('box', 'ico-lg')}</span>
    <div><h1>${esc(st.name)}</h1><p>${[st.city, 'متجر شريك على Kitchenly'].filter(Boolean).map(esc).join(' • ')}</p>${st.description ? `<p class="storehd__ds">${esc(st.description)}</p>` : ''}</div></header>
  <div class="toolbar"><div style="flex:1"></div>${sortBar().replace('<option value="for-you">مختارة لك</option>', '').replace(/<option value="discount">[^<]*<\/option>/, '')}${viewBar()}</div>
  <p id="count" class="count" aria-live="polite"></p><div class="grid${viewMode() === 'list' ? ' grid--list' : ''}" id="grid" style="margin-top:12px">${skeletons(4)}</div></div>`;
  $$('[data-view]').forEach(b => b.onclick = () => { const m = b.dataset.view; try { localStorage.setItem('kt_view', m); } catch { /* */ } $$('[data-view]').forEach(x => x.setAttribute('aria-pressed', x === b)); $('#grid').classList.toggle('grid--list', m === 'list'); });
  let list = [], s = 'new'; $('#sort').value = s;
  const draw = () => { $('#count').textContent = `${list.length} منتج`; $('#grid').innerHTML = list.length ? sortList(list, s).map(card).join('') : noProducts('لا توجد منتجات في هذا المتجر حاليًا.', false); };
  try { list = await db.byStore(st.id); draw(); } catch (e) { console.error(e); $('#grid').innerHTML = noProducts('تعذر تحميل المنتجات الآن.'); }
  $('#sort').onchange = e => { s = e.target.value; draw(); };
};
})();
