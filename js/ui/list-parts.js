/* =====================================================================
 * js/ui/list-parts.js
 * الوظيفة: مكوّنات مشتركة لصفحات القوائم: عنوان القسم، شريط الترتيب وعرض شبكة/قائمة، غلاف صفحة القائمة، شريحة الأقسام.
 * يعتمد على: window.KTApp [$, $$, esc, curl, ic, skeletons, discount]
 * يعرض على window.KTApp: head, sortBar, viewMode, viewBar, sortList, listShell, chipsRow
 * ===================================================================== */
(() => {
'use strict';
const NS = (window.KTApp = window.KTApp || {});
const { $, $$, esc, curl, ic, skeletons, discount } = window.KTApp;

/* ===================== #list-page: عنوان القسم والترتيب وعرض الشبكة/القائمة ===================== */
// #list-page #sort #view-mode #section-head

const head = (title, sub, href, label = 'عرض الكل') => `<div class="sec__head"><div><h2>${title}</h2>${sub ? `<p>${sub}</p>` : ''}</div>${href ? `<a href="${href}" class="sec__all">${label} ${ic('chevL', 'ico-sm')}</a>` : ''}</div>`;
const sortBar = cur => `<div class="sort"><label for="sort">ترتيب</label><select id="sort" class="field"><option value="for-you">مختارة لك</option><option value="new">الأحدث</option><option value="popular">الأكثر تقييمًا</option><option value="price-asc">السعر من الأقل</option><option value="price-desc">السعر من الأعلى</option><option value="discount">الأعلى خصمًا</option></select></div>`;
/* طريقة عرض أمازون: شبكة أو قائمة (بتتحفظ على جهاز العميل) */
const viewMode = () => { try { return localStorage.getItem('kt_view') === 'list' ? 'list' : 'grid'; } catch { return 'grid'; } };
const viewBar = () => `<div class="viewsw" role="group" aria-label="طريقة العرض"><button type="button" data-view="grid" aria-pressed="${viewMode() === 'grid'}" aria-label="عرض شبكة" title="شبكة"><svg viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="8" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/><rect x="13" y="13" width="8" height="8" rx="1.5"/></svg></button><button type="button" data-view="list" aria-pressed="${viewMode() === 'list'}" aria-label="عرض قائمة" title="قائمة"><svg viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="4" width="18" height="4" rx="1.5"/><rect x="3" y="10" width="18" height="4" rx="1.5"/><rect x="3" y="16" width="18" height="4" rx="1.5"/></svg></button></div>`;
const sortList = (list, s) => { const a = [...list]; if (s === 'price-asc') a.sort((x, y) => x.price - y.price); else if (s === 'price-desc') a.sort((x, y) => y.price - x.price); else if (s === 'popular') a.sort((x, y) => y.reviews_count - x.reviews_count); else if (s === 'discount') a.sort((x, y) => discount(y) - discount(x)); return a; };

/* ===================== #list-shell: غلاف صفحات القوائم (الأقسام والعروض) وشريحة الأقسام ===================== */
// #list-shell #breadcrumbs #category-chips
function listShell({ title, sub, icon, crumbs, sortable = true }) {
  $('#app').innerHTML = `<div class="wrap page"><nav class="crumbs" aria-label="مسار التصفح"><a href="/">الرئيسية</a><span>/</span>${crumbs}</nav>
  <div style="display:flex;gap:14px;align-items:center">${icon ? `<span class="cat__ic">${ic(icon)}</span>` : ''}<div><h1>${title}</h1>${sub ? `<p class="page__sub">${sub}</p>` : ''}</div></div>
  <div class="toolbar"><div id="chips" style="display:flex;flex-wrap:wrap;gap:8px"></div>${sortable ? sortBar() : ''}${viewBar()}</div><p id="count" class="count" aria-live="polite"></p><div class="grid${viewMode() === 'list' ? ' grid--list' : ''}" id="grid" style="margin-top:12px">${skeletons(8)}</div></div>`;
  $$('[data-view]').forEach(b => b.onclick = () => {
    const m = b.dataset.view; try { localStorage.setItem('kt_view', m); } catch { /* */ }
    $$('[data-view]').forEach(x => x.setAttribute('aria-pressed', x === b));
    $$('#grid, .grid[data-follow-view]').forEach(g => g.classList.toggle('grid--list', m === 'list'));
  });
}
const chipsRow = (cats, cur) => `<a class="chip" href="/shop.html" aria-current="false">الكل</a><a class="chip" href="/offers/" aria-current="${cur === 'offers'}">العروض</a><a class="chip" href="/yours-offer" aria-current="false">عروضك</a>` + cats.map(c => `<a class="chip" href="${curl(c.slug)}" aria-current="${cur === c.slug}">${esc(c.name)}</a>`).join('');

Object.assign(NS, { head, sortBar, viewMode, viewBar, sortList, listShell, chipsRow });
})();
