/* =====================================================================
 * js/features/ads.js
 * الوظيفة: الإعلانات المموّلة (kt_active_ads): تسجيل الظهور والنقر وعرض الكروت المموّلة.
 * يعتمد على: js/ui/list-parts.js [head] · window.KTApp [K, sb, $$, esc, db, card]
 * يعرض على window.KTApp: mountAds
 * ===================================================================== */
(() => {
'use strict';
const NS = (window.KTApp = window.KTApp || {});
const { K, sb, $$, esc, db, card } = window.KTApp;
const { head } = NS;   // js/ui/list-parts.js

/* ===================== #ads: الإعلانات المموّلة وتسجيل الأحداث ===================== */
// #ads #sponsored #tracking
const adEvent = (ad, kind) => { try { fetch(`${K.url}/rest/v1/rpc/kt_ad_event`, { method: 'POST', keepalive: true, headers: { apikey: K.key, Authorization: `Bearer ${K.key}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ p_ad: ad, p_kind: kind }) }).catch(() => {}); } catch { /* */ } };
const once = k => { try { if (sessionStorage.getItem(k)) return false; sessionStorage.setItem(k, '1'); } catch { /* */ } return true; };
async function mountAds(placement, before, { title = 'منتجات مموّلة', n = 4 } = {}) {
  if (!before || !before.parentNode) return;
  try {
    const { data, error } = await sb.rpc('kt_active_ads', { p_placement: placement }); if (error || !data || !data.length) return;
    const list = data.slice(0, n), prods = await db.bySlugs(list.map(a => a.slug)), by = Object.fromEntries(prods.map(p => [p.slug, p]));
    const rows = list.filter(a => by[a.slug]); if (!rows.length) return;
    const sec = document.createElement('section'); sec.className = 'sec sec--ads';
    sec.innerHTML = head(title, 'إعلانات من متاجر شريكة') + `<div class="grid">${rows.map(a => card(by[a.slug]).replace(/^<article class="([^"]*)"([^>]*)>/, (m, c, rest) => `<article class="${c} pcard--ad"${rest} data-ad="${esc(a.ad_id)}"><span class="pcard__sp">مُموّل</span>`)).join('')}</div>`;
    before.parentNode.insertBefore(sec, before);
    const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { io.unobserve(e.target); const id = e.target.dataset.ad; if (once(`kt_ai_${id}`)) adEvent(id, 'impression'); } }), { threshold: .5 }) : null;
    $$('[data-ad]', sec).forEach(el => io ? io.observe(el) : (once(`kt_ai_${el.dataset.ad}`) && adEvent(el.dataset.ad, 'impression')));
    sec.addEventListener('click', e => { const a = e.target.closest('a[href]'), c = e.target.closest('[data-ad]'); if (a && c && once(`kt_ac_${c.dataset.ad}`)) adEvent(c.dataset.ad, 'click'); });
  } catch (e) { console.warn('ads', e.message); }
}

Object.assign(NS, { mountAds });
})();
