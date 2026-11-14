/* =====================================================================
 * js/ui/card-motion.js
 * الوظيفة: أشكال الكروت المتعددة (variants) + الظهور التدريجي مع السكرول + تبديل صور الكارت عند المرور.
 * يعتمد على: js/core/utils.js [$]
 * يعرض على window.KTApp: MOTION, variantOf
 * ===================================================================== */
(() => {
'use strict';
const NS = (window.KTApp = window.KTApp || {});
const { $ } = NS;   // js/core/utils.js

/* ===================== #card-motion: أشكال الكروت والحركة والظهور التدريجي ===================== */
// #card-motion #variants #reveal #intersection-observer

const CARD_MOTION = true;   /* false = قفل كل حركات الكروت (الشكل بيفضل زي ما هو) */
const VARIANTS = 8;         /* لازم يساوي عدد .pcard--vN في css/components/product-card-motion.css */
const MOTION = CARD_MOTION && !matchMedia('(prefers-reduced-motion: reduce)').matches;
if (!MOTION) document.documentElement.classList.add('no-motion');

/* hash ثابت (FNV-1a) للـ slug/id: نفس المنتج = نفس الشكل في كل زيارة، من غير Math.random */
function hashStr(str) {
  let h = 2166136261; str = String(str);
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  h ^= h >>> 15; h = Math.imul(h, 2246822519); h ^= h >>> 13;
  return h >>> 0;
}
const variantOf = p => (hashStr(p.slug || p.id || p.name || '') % VARIANTS) + 1;

/* لو كارتين متجاورين طلعوا بنفس الشكل نغيّر التاني للشكل اللي بعده (تعديل بسيط بيحصل بس عند التصاق نفس الشكل) */
const setVariant = (el, v) => { el.classList.remove(`pcard--v${el.dataset.v}`); el.classList.add(`pcard--v${v}`); el.dataset.v = v; };
function spreadVariants(cards) {
  for (const el of cards) {
    const v = +el.dataset.v; if (!v) continue;
    const near = []; let s = el.previousElementSibling;
    while (s && near.length < 2) { if (s.classList.contains('pcard') && s.dataset.v) near.push(+s.dataset.v); s = s.previousElementSibling; }
    if (!near.includes(v)) continue;
    for (let k = 1; k < VARIANTS; k++) { const c = ((v - 1 + k) % VARIANTS) + 1; if (!near.includes(c)) { setVariant(el, c); break; } }
  }
}

/* ظهور تدريجي مع السكرول: fade + translateY مع stagger */
const revealIO = MOTION && 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
  let i = 0;
  for (const en of entries) {
    const el = en.target;
    if (!el.isConnected) { revealIO.unobserve(el); continue; }
    if (!en.isIntersecting) continue;
    revealIO.unobserve(el);
    el.style.setProperty('--pc-d', `${Math.min(i++, 8) * 70}ms`);
    el.classList.remove('rv-pre'); el.classList.add('rv-in', 'is-seen');
    setTimeout(() => el.classList.remove('rv-in'), 1000);
  }
}, { rootMargin: '0px 0px -6% 0px', threshold: 0.08 }) : null;

new MutationObserver(muts => {
  const found = new Set();
  for (const m of muts) for (const n of m.addedNodes) {
    if (n.nodeType !== 1) continue;
    if (n.matches('.pcard')) found.add(n); else if (n.firstElementChild) n.querySelectorAll('.pcard').forEach(c => found.add(c));
  }
  if (!found.size) return;
  const cards = [...found].filter(c => c.isConnected && !c.classList.contains('pcard--skel'));
  spreadVariants(cards);
  if (revealIO) for (const c of cards) { c.classList.add('rv-pre'); revealIO.observe(c); }
}).observe(document.documentElement, { childList: true, subtree: true });

/* ===================== #card-gallery: تبديل صور المنتج عند مرور المؤشر ===================== */
// #card-gallery #hover #product-card

/* تبديل صور المنتج عند مرور المؤشر على الكارت (الصور اللي ما تتحمّلش بتتشال تلقائيًا) */
(() => {
  const STEP = 1100, tm = new WeakMap();
  const dots = (a, n, on) => { const d = $('.pcard__dots', a); if (d) d.innerHTML = Array.from({ length: n }, (_, i) => `<i class="${i === on ? 'on' : ''}"></i>`).join(''); };
  const show = (a, list, i) => { const im = $('img', a); if (im) im.src = list[i]; a.dataset.i = i; dots(a, list.length, i); };
  const probe = src => new Promise(res => { const im = new Image(); im.onload = () => res(src); im.onerror = () => res(null); im.src = src; });
  const verify = async a => {
    if (a.dataset.ok) return; a.dataset.ok = '1';
    const list = JSON.parse(a.dataset.imgs), ok = (await Promise.all(list.slice(1).map(probe))).filter(Boolean);
    const clean = [list[0], ...ok]; a.dataset.imgs = JSON.stringify(clean); dots(a, clean.length, +a.dataset.i || 0);
    if (clean.length < 2) { a.classList.remove('is-multi'); const d = $('.pcard__dots', a); if (d) d.remove(); }
  };
  const start = async a => {
    if (tm.has(a)) return; tm.set(a, 0); await verify(a);
    if (!tm.has(a)) return;
    const list = JSON.parse(a.dataset.imgs); if (list.length < 2) return;
    let i = 0; const tick = () => { i = (i + 1) % list.length; show(a, list, i); };
    tick(); tm.set(a, setInterval(tick, STEP));
  };
  const stop = a => { const t = tm.get(a); if (t === undefined) return; clearInterval(t); tm.delete(a); const list = JSON.parse(a.dataset.imgs || '[]'); if (list.length) show(a, list, 0); };
  document.addEventListener('pointerover', e => { if (e.pointerType === 'touch') return; const a = e.target.closest?.('.pcard__img[data-imgs]'); if (a && !a.contains(e.relatedTarget)) start(a); });
  document.addEventListener('pointerout', e => { if (e.pointerType === 'touch') return; const a = e.target.closest?.('.pcard__img[data-imgs]'); if (a && !a.contains(e.relatedTarget)) stop(a); });
  document.addEventListener('focusin', e => { const a = e.target.closest?.('.pcard__img[data-imgs]'); if (a) start(a); });
  document.addEventListener('focusout', e => { const a = e.target.closest?.('.pcard__img[data-imgs]'); if (a) stop(a); });
})();

Object.assign(NS, { MOTION, variantOf });
})();
