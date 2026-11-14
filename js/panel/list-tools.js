/* =====================================================================
 * js/panel/list-tools.js
 * الوظيفة: أدوات القوائم: تحميل تدريجي (pager)، debounce، وتنظيف نص البحث لفلاتر PostgREST.
 * يعتمد على: js/panel/ui.js [skel, errBox]
 * يعرض على window.Panel: pager, debounce, qClean
 * ===================================================================== */
(() => {
'use strict';
const NS = (window.Panel = window.Panel || {});
const { skel, errBox } = NS;   // js/panel/ui.js

/* ===================== #pager: تحميل تدريجي ودوال مساعدة للبحث ===================== */
// #pager #infinite-load #debounce #postgrest

/* fetchPage(offset, size) => { rows, total } ; renderRows(rows, first) يضيف العناصر في الحاوية ؛ بيرجّع { reload, stop } */
function pager(host, { size = 20, fetchPage, renderRows, emptyHtml = '', onTotal }) {
  let offset = 0, busy = false, done = false, gen = 0, io = null;
  host.innerHTML = '<div data-rows></div><div data-more style="text-align:center;padding:14px"></div>';
  const rowsEl = host.querySelector('[data-rows]'), more = host.querySelector('[data-more]');
  const setMore = (state) => {
    if (state === 'loading') more.innerHTML = '<span style="color:var(--muted);font-size:.88rem">جاري التحميل...</span>';
    else if (state === 'more') { more.innerHTML = '<button class="btn btn-g" data-m>عرض المزيد</button>'; more.querySelector('[data-m]').onclick = load; }
    else if (state === 'error') { more.innerHTML = '<button class="btn btn-g" data-m>تعذر التحميل، أعد المحاولة</button>'; more.querySelector('[data-m]').onclick = load; }
    else more.innerHTML = '';
  };
  async function load() {
    if (busy || done) return; busy = true; const g = gen; setMore('loading');
    try {
      const { rows, total } = await fetchPage(offset, size);
      if (g !== gen) return;
      if (offset === 0) { onTotal && onTotal(total); if (!rows.length) { rowsEl.innerHTML = emptyHtml; done = true; setMore(''); busy = false; return; } }
      renderRows(rows, offset === 0, rowsEl); offset += rows.length;
      done = rows.length < size || (total != null && offset >= total);
      setMore(done ? '' : 'more');
    } catch (e) { console.error(e); if (g === gen) { if (offset === 0) { rowsEl.innerHTML = errBox(); setMore(''); done = true; } else setMore('error'); } }
    busy = false;
  }
  if ('IntersectionObserver' in window) { io = new IntersectionObserver(es => { if (es.some(x => x.isIntersecting) && offset > 0) load(); }, { rootMargin: '300px' }); io.observe(more); }
  const reload = () => { gen++; offset = 0; done = false; busy = false; rowsEl.innerHTML = skel(180); load(); };
  reload();
  return { reload, stop: () => { gen++; io && io.disconnect(); } };
}
const debounce = (fn, ms = 350) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
/* تنظيف نص البحث قبل استخدامه في فلتر PostgREST (or/ilike) */
const qClean = q => String(q || '').replace(/[,()%*\\]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60);

Object.assign(NS, { pager, debounce, qClean });
})();
