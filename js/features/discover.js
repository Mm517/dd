/* =====================================================================
 * js/features/discover.js
 * الوظيفة: فهم اهتمام العميل (بحثه، اللي شاهده، سلته، طلباته) محليًا على جهازه لاقتراح "مختارة لك".
 * يعتمد على: js/core/supabase.js [sb, getSession] · js/features/cart.js [Cart] · js/core/data.js [loadAll] · js/features/search.js [norm, searchLocal] · NS.session (قراءة حيّة)
 * يعرض على window.KTApp: Discover, recent
 * ===================================================================== */
(() => {
'use strict';
const NS = (window.KTApp = window.KTApp || {});
const { sb, getSession } = NS;   // js/core/supabase.js
const { Cart } = NS;   // js/features/cart.js
const { loadAll } = NS;   // js/core/data.js
const { norm, searchLocal } = NS;   // js/features/search.js

/* ===================== #discover: مختارة لك حسب اهتمام العميل ===================== */
// #discover #recommendations #personalization #localstorage

const Discover = (() => {
  const rd = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k) || 'null'); return v ?? d; } catch { return d; } };
  const wr = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* التخزين محجوب */ } };
  const shuffle = a => { const r = [...a]; for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };
  const addSearch = q => { q = String(q || '').trim().slice(0, 60); if (norm(q).length < 2) return; wr('kt_searches', [q, ...rd('kt_searches', []).filter(x => x !== q)].slice(0, 10)); };
  const addCat = slug => { if (slug) wr('kt_catvisits', [slug, ...rd('kt_catvisits', [])].slice(0, 10)); };
  const searches = () => rd('kt_searches', []);
  /* يبني صورة لاهتمام العميل من منتجات المتجر الحقيقية فقط */
  async function profile() {
    const all = await loadAll(), by = Object.fromEntries(all.map(p => [p.slug, p]));
    const prodW = new Map(), catW = new Map(), bump = (m, k, w) => m.set(k, (m.get(k) || 0) + w);
    const queries = [], bought = new Set();
    searches().slice(0, 6).forEach((q, i) => {
      const { exact } = searchLocal(q, all); if (!exact.length) return;
      const w = Math.max(2, 7 - i), items = exact.slice(0, 8);
      queries.push({ q, items });
      items.forEach(p => { bump(prodW, p.slug, w); if (p.category?.slug) bump(catW, p.category.slug, w * .6); });
    });
    const sig = (slug, w) => { const p = by[slug]; if (!p) return; bump(prodW, slug, w); if (p.category?.slug) bump(catW, p.category.slug, w); };
    rd('kt_recent', []).forEach((s, i) => sig(s, Math.max(1, 3 - i * .3)));
    Cart.read().forEach(i => sig(i.slug, 3));
    rd('kt_catvisits', []).slice(0, 6).forEach((c, i) => bump(catW, c, Math.max(1, 3 - i * .4)));
    try {
      const ses = NS.session || await getSession();
      if (ses) { const { data } = await sb.from('kt_orders').select('items').eq('user_id', ses.user.id).limit(30); (data || []).forEach(o => (o.items || []).forEach(i => { sig(i.slug, 2); bought.add(i.slug); })); }
    } catch { /* بدون اتصال */ }
    return { all, by, prodW, catW, queries, bought, known: prodW.size > 0 || catW.size > 0 };
  }
  /* ترتيب حسب الاهتمام + قدر بسيط من العشوائية عشان الصفحة تتغير كل مرة */
  const rank = (list, prof, jitter = 1.4) => list.map(p => ({ p, s: (prof.prodW.get(p.slug) || 0) + (prof.catW.get(p.category?.slug) || 0) * .5 + Math.random() * jitter })).sort((a, b) => b.s - a.s).map(r => r.p);
  return { shuffle, addSearch, addCat, searches, profile, rank };
})();

/* ===================== #recently-viewed: آخر المنتجات المشاهدة ===================== */
// #recently-viewed #localstorage
const recent = slug => { try { const l = JSON.parse(localStorage.getItem('kt_recent') || '[]').filter(x => x !== slug); l.unshift(slug); localStorage.setItem('kt_recent', JSON.stringify(l.slice(0, 12))); } catch { /* التخزين محجوب */ } };

Object.assign(NS, { Discover, recent });
})();
