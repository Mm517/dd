/* Kitchenly - النواة: عميل Supabase، السلة، البيانات، البحث الذكي، الهيدر والفوتر. */
(() => {
'use strict';
const K = window.KT;
const sb = window.supabase.createClient(K.url, K.key);
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = n => Number(n).toLocaleString('en-US', { maximumFractionDigits: 2 });
const money = n => `${fmt(n)} جنيه`;
const purl = p => `/product-${p.slug}.html`;
const curl = slug => `/category/${slug}`;
const params = new URLSearchParams(location.search);

/* ---------- أيقونات SVG ---------- */
const ICONS = {
  search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
  camera: '<path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="3.5"/>',
  cart: '<circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/><path d="M2 3h3l2.7 12.4a1 1 0 0 0 1 .8h9.2a1 1 0 0 0 1-.8L21 7H6"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  truck: '<path d="M3 6h11v10H3zM14 9h4l3 3v4h-7"/><circle cx="7" cy="18" r="1.6"/><circle cx="17" cy="18" r="1.6"/>',
  shield: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="m9 12 2 2 4-4"/>',
  ret: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
  card: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h4"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  check: '<path d="m5 12 5 5 9-10"/>',
  arrow: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  box: '<path d="M3 8l9-5 9 5v8l-9 5-9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/>',
  home: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v10h13V10"/><path d="M10 20v-5h4v5"/>',
  grid: '<rect x="3.5" y="3.5" width="7" height="7" rx="1.6"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.6"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.6"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.6"/>',
  chevL: '<path d="m15 6-6 6 6 6"/>',
  chevD: '<path d="m6 9 6 6 6-6"/>',
  sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 16v4M17 18h4"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  star: '<path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.4 6.1 20.6l1.3-6.6L2.5 9.4l6.6-.8z"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.6 2.6 0 1 1 3.6 2.4c-.7.4-1.1.9-1.1 1.7"/><path d="M12 17h.01"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
  logout: '<path d="M10 4H5v16h5"/><path d="M15 8l4 4-4 4M19 12H9"/>',
  gift: '<rect x="3" y="9" width="18" height="11" rx="1.5"/><path d="M12 9v11M3 13h18"/><path d="M12 9C10 5 6 5 7 8c.5 1.5 3 1 5 1zm0 0c2-4 6-4 5-1-.5 1.5-3 1-5 1z"/>',
  phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5a6.5 6.5 0 0 1 3.5 5.5"/>',
  /* أيقونات الأقسام */
  'cleaning-tools': '<path d="M14 3l4 4"/><path d="M16 5 8.5 12.5"/><path d="M5 15c1.5-1 3-1 4.5 0l-2 6H4z"/><path d="M9.5 15l1.5 6M13 12.5l.5 8.5M17 14l-1.5 7"/>',
  sponges: '<rect x="3" y="9" width="18" height="8" rx="2"/><path d="M3 13h18"/><circle cx="8" cy="15" r=".7" fill="currentColor"/><circle cx="12" cy="15" r=".7" fill="currentColor"/><circle cx="16" cy="15" r=".7" fill="currentColor"/><path d="M6 6.5c1-1.5 2-1.5 3 0M12 5c1-1.5 2-1.5 3 0"/>',
  organizers: '<rect x="3" y="10" width="18" height="10" rx="1.5"/><path d="M9 10v10M15 10v10"/><path d="M8 10V5h3v5M14 10V7h2v3"/>',
  brushes: '<path d="M18 3l3 3-8 8-3-3z"/><path d="M10 11l-4 1c-2 1-2 4-4 6 3 1 7 1 9-3l1-3z" transform="translate(1 0)"/>',
  microfiber: '<path d="M4 7l8-3 8 3-8 3z"/><path d="M4 11l8 3 8-3"/><path d="M4 15l8 3 8-3"/>',
  bundles: '<rect x="3" y="9" width="18" height="11" rx="1.5"/><path d="M12 9v11M3 13h18"/><path d="M12 9C10 5 6 5 7 8c.5 1.5 3 1 5 1zm0 0c2-4 6-4 5-1-.5 1.5-3 1-5 1z"/>',
  offers: '<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.3"/><path d="m10.5 16.5 5-5M11 12h.01M15.5 16h.01"/>',
  tag: '<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.3"/>',
  default: '<path d="M3 8l9-5 9 5v8l-9 5-9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/>'
};
/* أيقونات صور (3D) بدل الـ SVG للأقسام والعروض وحالات الطلب */
const IMGDIR = '/assets/img/icons/';
const ICONIMG = { offers: 'offers', yours: 'yours', sponges: 'sponges', brushes: 'brushes', microfiber: 'microfiber', 'cleaning-tools': 'cleaning-tools', bundles: 'bundles', organizers: 'organizers', 'st-new': 'order-received', 'st-ship': 'on-the-way', 'st-done': 'courier-arrived', join: 'join-us' };
const ic = (n, c = 'ico') => ICONIMG[n] ? `<img class="${c} ico-img" src="${IMGDIR}${ICONIMG[n]}.png" alt="" loading="lazy" decoding="async">` : `<svg class="${c}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n] || ICONS.default}</svg>`;
const stars = r => { const n = Math.round(r); return `<span class="stars" aria-label="تقييم ${r} من 5">${Array.from({ length: 5 }, (_, i) => `<svg class="${i < n ? 'on' : ''}" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.4 6.1 20.6l1.3-6.6L2.5 9.4l6.6-.8z"/></svg>`).join('')}</span>`; };

/* ---------- هاشتاج الصفحة (شرح عام بالعربي) ---------- */
const TAGS = {
  home: '#متجر_أدوات_المطبخ_والتنظيف', shop: '#كل_منتجات_المطبخ', category: '#تسوق_حسب_القسم', offers: '#عروض_وخصومات_المطبخ',
  product: '#تفاصيل_المنتج', cart: '#سلة_التسوق', checkout: '#إتمام_الطلب_والدفع', success: '#تم_استلام_طلبك', track: '#تتبع_طلبك',
  auth: '#تسجيل_الدخول_والحساب', account: '#حسابي_وطلباتي', profile: '#حسابي', myorders: '#طلباتي', myreviews: '#تقييماتي', help: '#مركز_المساعدة', privacy: '#سياسة_الخصوصية', policy: '#سياسات_المتجر', join: '#انضم_إلينا', yours: '#عروضك_أنت', admin: '#لوحة_تحكم_المتجر', policies: '#سياسات_المتجر', contact: '#تواصل_معنا', notfound: '#الصفحة_غير_موجودة'
};
function setHashtag(tag) { const el = $('#page-tag'); if (el) el.textContent = tag; }

/* ---------- واجهة مشتركة ---------- */
function toast(msg, type = '') {
  let w = $('.toast-wrap'); if (!w) { w = document.createElement('div'); w.className = 'toast-wrap'; w.setAttribute('role', 'status'); document.body.appendChild(w); }
  const t = document.createElement('div'); t.className = `toast ${type}`; t.textContent = msg; w.appendChild(t);
  setTimeout(() => t.remove(), 3200);
}

/* ---------- السلة ---------- */
const Cart = {
  read() { try { return JSON.parse(localStorage.getItem('kt_cart') || '[]'); } catch { return []; } },
  write(v) { try { localStorage.setItem('kt_cart', JSON.stringify(v)); } catch { /* التخزين محجوب */ } badge(); },
  add(p, q = 1) {
    const c = this.read(), max = Math.min(p.stock ?? 20, 20), i = c.find(x => x.slug === p.slug);
    if (i) i.qty = Math.min(i.qty + q, max); else c.push({ slug: p.slug, name: p.name, price: +p.price, image: p.image, stock: p.stock, qty: Math.min(q, max) });
    this.write(c);
  },
  set(slug, q) { const c = this.read(), i = c.find(x => x.slug === slug); if (!i) return; i.qty = Math.max(1, Math.min(q, i.stock ?? 20, 20)); this.write(c); },
  remove(slug) { this.write(this.read().filter(x => x.slug !== slug)); },
  clear() { this.write([]); },
  count() { return this.read().reduce((a, x) => a + x.qty, 0); },
  subtotal() { return this.read().reduce((a, x) => a + x.price * x.qty, 0); }
};
const shipping = sub => (sub >= K.freeShipFrom || sub === 0 ? 0 : K.shippingFee);
function badge() { const n = Cart.count(); $$('[data-cart-count]').forEach(el => { el.textContent = n; el.hidden = !n; }); }

/* ---------- البيانات ---------- */
const PC = {};
const remember = list => { (list || []).forEach(p => { PC[p.slug] = p; }); return list; };
const db = {
  async categories() { const { data, error } = await sb.from('kt_categories').select('*').order('sort'); if (error) throw error; return data; },
  async products({ cat, sort = 'new', featured, limit, exclude, sale } = {}) {
    let query = sb.from('kt_products').select(cat ? '*, category:kt_categories!inner(slug,name)' : '*, category:kt_categories(slug,name)').eq('active', true);
    if (cat) query = query.eq('category.slug', cat);
    if (featured) query = query.eq('featured', true);
    if (exclude) query = query.neq('slug', exclude);
    if (sort === 'price-asc') query = query.order('price', { ascending: true });
    else if (sort === 'price-desc') query = query.order('price', { ascending: false });
    else if (sort === 'popular') query = query.order('reviews_count', { ascending: false });
    else query = query.order('created_at', { ascending: false }).order('name');
    if (limit) query = query.limit(limit);
    const { data, error } = await query; if (error) throw error;
    return remember(sale ? data.filter(p => p.old_price > p.price) : data);
  },
  async product(slug) {
    const { data, error } = await sb.from('kt_products').select('*, category:kt_categories(slug,name)').eq('slug', slug).eq('active', true).maybeSingle();
    if (error) throw error; if (data) remember([data]); return data;
  },
  async bySlugs(slugs) {
    if (!slugs.length) return [];
    const { data, error } = await sb.from('kt_products').select('*, category:kt_categories(slug,name)').in('slug', slugs).eq('active', true); if (error) throw error; return remember(data);
  }
};
let CATS = null;
const loadCats = () => (CATS ||= db.categories().catch(() => { CATS = null; return []; }));
let ALL = null;
const loadAll = () => (ALL ||= db.products({ sort: 'popular' }).catch(() => { ALL = null; return []; }));

/* ---------- البحث: عربي مرن + اقتراحات ذكية + بحث بالصورة ---------- */
const norm = s => String(s || '').toLowerCase()
  .replace(/[ً-ٰٟـ]/g, '').replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي')
  .replace(/[^a-z0-9؀-ۿ\s]/g, ' ').replace(/\s+/g, ' ').trim();
const stem = w => w.replace(/^(ال|وال|بال|لل)/, '').replace(/(ات|ين|ون|ه)$/, '');
const SYN = [['اسفنج', 'اسفنجه', 'ليفه', 'ليف', 'سفنجه', 'sponge'], ['فرش', 'فرشه', 'فرشاه', 'brush'], ['ممسحه', 'مسح', 'موب', 'mop', 'مساحه', 'مقشه'], ['فوط', 'فوطه', 'منشفه', 'مناشف', 'مايكروفايبر', 'microfiber', 'قماش'], ['منظم', 'منظمات', 'حامل', 'رف', 'ستاند', 'organizer', 'caddy'], ['صابون', 'سائل', 'موزع', 'ديسبنسر', 'soap', 'dispenser'], ['ادوات', 'مجموعه', 'طقم', 'سيت', 'set', 'bundle'], ['حوض', 'مجلي', 'sink'], ['ملاعق', 'شوك', 'سكاكين', 'cutlery', 'اواني']];
const synOf = t => { const s = stem(t); const g = SYN.find(g => g.some(x => x === t || stem(x) === s)); return g ? g.map(stem) : [s]; };
function lev(a, b) { if (Math.abs(a.length - b.length) > 2) return 9; const m = []; for (let i = 0; i <= a.length; i++) m[i] = [i]; for (let j = 0; j <= b.length; j++) m[0][j] = j; for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) m[i][j] = Math.min(m[i - 1][j] + 1, m[i][j - 1] + 1, m[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); return m[a.length][b.length]; }
function scoreProduct(p, toks) {
  const name = norm(p.name), cat = norm(p.category?.name), desc = norm(`${p.short_desc} ${p.description} ${(p.features || []).join(' ')}`);
  const nameW = name.split(' ').map(stem), all = new Set(`${name} ${cat} ${desc}`.split(' ').map(stem));
  let total = 0, hit = 0;
  for (const t of toks) {
    const alts = synOf(t); let s = 0;
    for (const a of alts) {
      if (!a) continue;
      if (name.includes(a)) s = Math.max(s, a === stem(t) ? 6 : 4);
      else if (cat.includes(a)) s = Math.max(s, 3);
      else if (desc.includes(a)) s = Math.max(s, 1.5);
      else if (a.length >= 4 && (nameW.some(w => lev(w, a) <= 1) || [...all].some(w => w.length >= 4 && lev(w, a) <= 1))) s = Math.max(s, 2);
    }
    if (s) hit++; total += s;
  }
  return { score: total, hit };
}
/* يرجع { exact, partial }: exact = كل كلمات البحث موجودة، partial = بعضها */
function searchLocal(q, list) {
  const toks = norm(q).split(' ').filter(Boolean); if (!toks.length) return { exact: [], partial: [] };
  const rows = list.map(p => ({ p, ...scoreProduct(p, toks) })).filter(r => r.hit);
  rows.sort((a, b) => b.hit - a.hit || b.score - a.score);
  return { exact: rows.filter(r => r.hit === toks.length).map(r => r.p), partial: rows.filter(r => r.hit < toks.length).map(r => r.p) };
}
async function callAI(payload) {
  if (!K.aiSearch) throw new Error('disabled');
  const res = await fetch(`${K.url}/functions/v1/ai-search`, { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: K.key, Authorization: `Bearer ${K.key}` }, body: JSON.stringify(payload) });
  if (!res.ok) throw new Error(`ai_${res.status}`);
  const out = await res.json(); if (out.error) throw new Error(out.error);
  const all = await loadAll(), by = Object.fromEntries(all.map(p => [p.slug, p]));
  return { label: out.label || '', message: out.message || '', exact: out.exact.map(s => by[s]).filter(Boolean), similar: out.similar.map(s => by[s]).filter(Boolean) };
}
const aiText = q => callAI({ mode: 'text', q });

/* ---------- فهم اهتمام العميل: بحثه + اللي شاهده + سلته + طلباته (محفوظ على جهازه فقط) ---------- */
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
      const ses = SESSION || await getSession();
      if (ses) { const { data } = await sb.from('kt_orders').select('items').eq('user_id', ses.user.id).limit(30); (data || []).forEach(o => (o.items || []).forEach(i => { sig(i.slug, 2); bought.add(i.slug); })); }
    } catch { /* بدون اتصال */ }
    return { all, by, prodW, catW, queries, bought, known: prodW.size > 0 || catW.size > 0 };
  }
  /* ترتيب حسب الاهتمام + قدر بسيط من العشوائية عشان الصفحة تتغير كل مرة */
  const rank = (list, prof, jitter = 1.4) => list.map(p => ({ p, s: (prof.prodW.get(p.slug) || 0) + (prof.catW.get(p.category?.slug) || 0) * .5 + Math.random() * jitter })).sort((a, b) => b.s - a.s).map(r => r.p);
  return { shuffle, addSearch, addCat, searches, profile, rank };
})();

/* لوجوهات وسائل الدفع */
const PAYIMG = { instapay: ['instapay'], online: ['paymob', 'visa'] };
const PAYALT = { instapay: 'InstaPay', paymob: 'Paymob', visa: 'Visa' };
const payLogos = (keys, cls = '') => `<span class="paylogos ${cls}">${keys.map(k => `<img src="/assets/img/pay/${k}.webp" alt="${PAYALT[k]}" loading="lazy" decoding="async">`).join('')}</span>`;
function fileToJpeg(file, max = 1024) {
  return new Promise((resolve, reject) => {
    const img = new Image(), url = URL.createObjectURL(file);
    img.onload = () => { const k = Math.min(1, max / Math.max(img.width, img.height)), c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url); const d = c.toDataURL('image/jpeg', 0.82); resolve({ dataUrl: d, base64: d.split(',')[1] }); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('bad_image')); }; img.src = url;
  });
}

/* ---------- بطاقة المنتج وصناديق الحالة ---------- */
const discount = p => (p.old_price > p.price ? Math.round((1 - p.price / p.old_price) * 100) : 0);
function card(p) {
  const d = discount(p), out = p.stock < 1, low = !out && p.stock <= 10, save = d ? Math.round(p.old_price - p.price) : 0;
  const il = imgList(p), multi = il.length > 1;
  return `<article class="pcard"><a href="${purl(p)}" class="pcard__img${multi ? ' is-multi' : ''}" ${multi ? `data-imgs="${esc(JSON.stringify(il))}"` : ''}><img src="${esc(il[0])}" alt="${esc(p.name)}" loading="lazy">${multi ? `<span class="pcard__dots" aria-hidden="true">${il.map((_, i) => `<i class="${i ? '' : 'on'}"></i>`).join('')}</span>` : ''}${d ? `<span class="pcard__off">-${d}%</span>` : ''}${p.badge ? `<span class="pcard__badge">${esc(p.badge)}</span>` : ''}</a>
  <div class="pcard__body"><a href="${purl(p)}" class="pcard__name">${esc(p.name)}</a>${p.reviews_count > 0 ? `<div class="stars">${stars(p.rating)}<span>(${p.reviews_count})</span></div>` : '<div class="stars"><span class="newtag">لا تقييمات بعد</span></div>'}
  <div class="price"><b>${money(p.price)}</b>${d ? `<s>${money(p.old_price)}</s>` : ''}</div>${save ? `<p class="pcard__save">وفّر ${fmt(save)} جنيه</p>` : ''}${low ? `<p class="pcard__low">متبقي ${p.stock} قطع فقط</p>` : ''}
  <button class="btn btn-primary btn-block" data-add="${esc(p.slug)}" ${out ? 'disabled' : ''}>${out ? 'غير متوفر' : 'أضف للسلة'}</button></div></article>`;
}
const imgSrc = p => (/^https?:/.test(p.image || '') ? p.image : `/${String(p.image || '').replace(/^\//, '')}`);
/* كل صور المنتج: الرئيسية أولًا ثم الباقي (عمود images) بدون تكرار */
const imgList = p => { const first = imgSrc(p); const rest = (Array.isArray(p.images) ? p.images : []).filter(Boolean).map(x => imgSrc({ image: x })).filter(x => x !== first); return [first, ...new Set(rest)]; };
const skeletons = (n = 4) => Array.from({ length: n }, () => '<div class="skel" style="aspect-ratio:3/4"></div>').join('');
const errorBox = (msg = 'تعذر تحميل البيانات. تحقق من الاتصال ثم حاول مرة أخرى.') => `<div class="card empty"><p>${esc(msg)}</p><button class="btn btn-ghost" onclick="location.reload()">إعادة المحاولة</button></div>`;
const emptyBox = (msg, href = '/shop.html', label = 'تصفح المنتجات') => `<div class="card empty"><p>${esc(msg)}</p><a class="btn btn-primary" href="${href}">${label}</a></div>`;
const STATUS = { new: 'تم استلام الطلب', confirmed: 'تم التأكيد', shipping: 'الأوردر في الطريق', delivered: 'المندوب وصل', cancelled: 'ملغي' };
const PAYNAME = { cod: 'عند الاستلام', wallet: 'محفظة إلكترونية', online: 'دفع أونلاين', instapay: 'إنستا باي' };

let SESSION = null;
const getSession = async () => { const { data } = await sb.auth.getSession(); SESSION = data.session; return SESSION; };
const requireLogin = async () => { await getSession(); if (!SESSION) { location.replace(`/auth.html?next=${encodeURIComponent(location.pathname + location.search)}`); return false; } return true; };

/* ---------- الهيدر + البحث ---------- */
function renderHeader() {
  const page = document.body.dataset.page;
  $('#site-header').innerHTML = `
  <div class="topstrip">شحن مجاني للطلبات فوق ${fmt(K.freeShipFrom)} جنيه • دفع أونلاين أو إنستا باي</div>
  <header class="hdr"><div class="hdr__bar wrap">
    <a href="/" class="hdr__logo" aria-label="Kitchenly - الرئيسية"><img src="/assets/img/logo-mark.jpg" alt=""><span>KITCHENLY</span></a>
    <div class="hdr__search" id="srch"><form class="sbox" action="/shop.html" role="search" autocomplete="off">
      <input name="q" id="q" type="search" placeholder="ابحث عن منتج، أو صِف ما تحتاجه" aria-label="بحث" value="${esc(params.get('q') || '')}">
      ${K.aiSearch ? `<button type="button" id="imgbtn" aria-label="بحث بالصورة" title="بحث بالصورة">${ic('camera')}</button><input type="file" id="imgfile" accept="image/jpeg,image/png,image/webp" hidden>` : ''}
      <button class="sbox__go" aria-label="بحث">${ic('search')}</button></form><div class="sug" id="sug" hidden></div></div>
    <div class="hdr__act">
      <a href="/track.html" class="hdr__link" aria-label="تتبع طلبك">${ic('box')}<span>تتبع طلبك</span></a>
      <a href="${SESSION ? '/profile' : '/auth.html'}" class="hdr__link" aria-label="${SESSION ? 'حسابي' : 'تسجيل الدخول'}">${ic('user')}<span>${SESSION ? 'حسابي' : 'دخول'}</span></a>
      <a href="/cart.html" class="hdr__link" aria-label="السلة">${ic('cart')}<span>السلة</span><b class="badge" data-cart-count hidden>0</b></a></div></div>
    <nav class="catnav" aria-label="الأقسام"><div class="catnav__in wrap"><a href="/offers/" class="deal" ${page === 'offers' ? 'aria-current="true"' : ''}>العروض</a><a href="/yours-offer" class="mine" ${page === 'yours' ? 'aria-current="true"' : ''}>عروضك</a><a href="/shop.html" ${page === 'shop' ? 'aria-current="true"' : ''}>كل المنتجات</a><span id="catnav-list" style="display:contents"></span><button type="button" class="catnav__more" id="catmore" aria-expanded="false" aria-controls="catpanel">المزيد ${ic('chevD', 'ico-sm')}</button></div>
    <div class="catpanel" id="catpanel" hidden><div class="wrap"><p class="catpanel__t">تسوّق حسب القسم</p><div class="catpanel__grid" id="catpanel-grid"></div></div></div></nav>
  </header>
  <div class="hashtag-bar"><div class="wrap"><span>في هذه الصفحة:</span><span class="hashtag" id="page-tag">${esc(TAGS[page] || '')}</span></div></div>`;
  const cur = location.pathname.match(/^\/category\/([^/]+)/)?.[1];
  loadCats().then(list => {
    const el = $('#catnav-list'); if (!el) return;
    el.innerHTML = list.map(x => `<a href="${curl(x.slug)}" class="cn" ${cur === x.slug ? 'aria-current="true"' : ''}>${esc(x.name)}</a>`).join('');
    const tiles = [['/offers/', 'offers', 'العروض', 'on-offer'], ['/yours-offer', 'yours', 'عروضك', 'on-offer'], ...list.map(c => [curl(c.slug), c.slug, c.name, ''])];
    $('#catpanel-grid').innerHTML = tiles.map(([h, i, n, k]) => `<a href="${h}" class="catpanel__tile ${k}"><span class="cat__ic">${ic(i)}</span><span>${esc(n)}</span></a>`).join('');
    fitNav();
  });
  initNavMore();
  initSearch();
  renderTabbar(page);
}

/* شريط الأقسام بدون سكرول: اللي يتسع يظهر، وكل الأقسام في زر "المزيد" */
function fitNav() {
  const inner = $('.catnav__in'); if (!inner) return;
  const links = $$('#catnav-list .cn'); links.forEach(a => { a.hidden = false; });
  let i = links.length; while (i > 0 && inner.scrollWidth > inner.clientWidth + 1) links[--i].hidden = true;
}
function initNavMore() {
  const btn = $('#catmore'), panel = $('#catpanel'); if (!btn || !panel) return;
  const set = open => { panel.hidden = !open; btn.setAttribute('aria-expanded', String(open)); };
  btn.addEventListener('click', e => { e.stopPropagation(); set(panel.hidden); });
  document.addEventListener('click', e => { if (!panel.hidden && !e.target.closest('#catpanel')) set(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') set(false); });
  let t = null; window.addEventListener('resize', () => { clearTimeout(t); t = setTimeout(fitNav, 120); });
  if (document.fonts?.ready) document.fonts.ready.then(fitNav);
}

function initSearch() {
  const input = $('#q'), box = $('#sug'); if (!input) return;
  let t = null, seq = 0;
  const hide = () => { box.hidden = true; };
  const row = p => `<a href="${purl(p)}"><img src="${imgSrc(p)}" alt=""><span><b>${esc(p.name)}</b><small>${money(p.price)}</small></span></a>`;
  const run = async () => {
    const q = input.value.trim(); if (norm(q).length < 2) return hide();
    const my = ++seq, all = await loadAll(); if (my !== seq) return;
    const { exact, partial } = searchLocal(q, all), top = [...exact, ...partial].slice(0, 5);
    box.innerHTML = (top.length ? top.map(row).join('') : `<p style="padding:12px 14px;color:var(--muted)">لا يوجد تطابق مباشر لـ "${esc(q)}"</p>`) +
      `<a class="sug__ai" href="/shop.html?q=${encodeURIComponent(q)}">${ic(K.aiSearch && !exact.length ? 'sparkle' : 'search')}<span>${exact.length ? `عرض كل النتائج لـ "${esc(q)}"` : 'اعرض لي اقتراحات ذكية'}</span></a>`;
    box.hidden = false;
  };
  input.addEventListener('input', () => { clearTimeout(t); t = setTimeout(run, 180); });
  input.addEventListener('focus', run);
  document.addEventListener('click', e => { if (!e.target.closest('#srch')) hide(); });
  input.addEventListener('keydown', e => { if (e.key === 'Escape') hide(); });
  const btn = $('#imgbtn'), file = $('#imgfile');
  if (btn) {
    btn.onclick = () => file.click();
    file.onchange = async () => {
      const f = file.files[0]; file.value = ''; if (!f) return;
      if (f.size > 12e6) return toast('الصورة كبيرة، اختر صورة أصغر', 'err');
      toast('جارٍ تحليل الصورة بالذكاء الاصطناعي...');
      try {
        const { dataUrl, base64 } = await fileToJpeg(f), out = await callAI({ mode: 'image', image: base64, mime: 'image/jpeg' });
        const thumb = await fileToJpeg(f, 160);
        sessionStorage.setItem('kt_img', JSON.stringify({ thumb: thumb.dataUrl, label: out.label, message: out.message, exact: out.exact.map(p => p.slug), similar: out.similar.map(p => p.slug) }));
        location.href = '/shop.html?img=1';
      } catch (e) { console.error(e); toast(e.message === 'not_configured' ? 'البحث بالصورة غير مفعّل بعد' : 'تعذر تحليل الصورة، حاول مرة أخرى', 'err'); }
    };
  }
}

/* ---------- تبويبات الموبايل ---------- */
function renderTabbar(page) {
  document.body.classList.add('has-tabbar');
  const t = (href, icon, label, on, attrs = '') => `<${href ? `a href="${href}"` : 'button type="button"'} class="tabbar__item ${on ? 'is-on' : ''}" ${attrs}>${ic(icon, 'ico-lg')}${icon === 'cart' ? '<b class="badge" data-cart-count hidden>0</b>' : ''}<span>${label}</span></${href ? 'a' : 'button'}>`;
  const el = document.createElement('nav'); el.className = 'tabbar'; el.setAttribute('aria-label', 'التنقل');
  el.innerHTML = t('/', 'home', 'الرئيسية', page === 'home') + t('', 'grid', 'الأقسام', page === 'category', 'data-open-cats') + t('/offers/', 'offers', 'العروض', page === 'offers') + t('/cart.html', 'cart', 'السلة', page === 'cart') + t(SESSION ? '/profile' : '/auth.html', 'user', 'حسابي', ['account', 'profile', 'myorders', 'myreviews', 'auth'].includes(page));
  document.body.appendChild(el);
  const sh = document.createElement('div'); sh.className = 'sheet'; sh.hidden = true;
  sh.innerHTML = `<div class="sheet__scrim" data-close-cats></div><div class="sheet__panel" role="dialog" aria-modal="true" aria-label="الأقسام"><div class="sheet__head"><h2>تسوق حسب القسم</h2><button class="icon-btn" data-close-cats aria-label="إغلاق">${ic('x')}</button></div><div id="sheet-grid" class="sheet__grid"></div></div>`;
  document.body.appendChild(sh);
  const close = () => { sh.hidden = true; document.body.classList.remove('no-scroll'); };
  const open = async () => { sh.hidden = false; document.body.classList.add('no-scroll'); const list = await loadCats(); $('#sheet-grid').innerHTML = [['/offers/', 'offers', 'العروض'], ['/yours-offer', 'yours', 'عروضك'], ...list.map(c => [curl(c.slug), c.slug, c.name])].map(([h, i, n]) => `<a href="${h}" class="sheet__tile"><span class="cat__ic">${ic(i)}</span><span>${esc(n)}</span></a>`).join(''); };
  document.addEventListener('click', e => { if (e.target.closest('[data-open-cats]')) open(); else if (e.target.closest('[data-close-cats]')) close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !sh.hidden) close(); });
}

function renderFooter() {
  const l = (h, t) => `<a href="${h}">${t}</a>`;
  $('#site-footer').innerHTML = `<footer class="ftr"><div class="wrap"><div class="ftr__row"><a href="/" class="logo" aria-label="Kitchenly"><img src="/assets/img/logo-mark.jpg" alt="">KITCHENLY</a>
  <nav class="ftr__links" aria-label="روابط">${l('/shop.html', 'المنتجات')}${l('/offers/', 'العروض')}${l('/yours-offer', 'عروضك')}${l('/track.html', 'تتبع طلبك')}${l('/help', 'المساعدة')}${l('/contact.html', 'تواصل معنا')}</nav></div>
  <nav class="ftr__links ftr__legal" aria-label="السياسات">${l('/policy', 'سياسات المتجر')}${l('/policy#returns', 'الاستبدال والاسترجاع')}${l('/privacy', 'سياسة الخصوصية')}${l('/policy#terms', 'الشروط والأحكام')}${l('/join-us', 'انضم إلينا')}</nav>
  <div class="ftr__pay"><span>وسائل الدفع</span>${payLogos(['instapay'], 'on-dark')}${payLogos(['paymob', 'visa'], 'on-dark')}</div>
  <p class="ftr__copy">جميع الحقوق محفوظة، Kitchenly ${new Date().getFullYear()}</p></div></footer>`;
}

document.addEventListener('click', e => {
  const b = e.target.closest('[data-add]'); if (!b) return;
  const p = PC[b.dataset.add]; if (!p) return;
  if (p.stock < 1) return toast('المنتج غير متوفر حاليًا', 'err');
  Cart.add(p); toast('تمت إضافة المنتج إلى السلة');
});

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

const recent = slug => { try { const l = JSON.parse(localStorage.getItem('kt_recent') || '[]').filter(x => x !== slug); l.unshift(slug); localStorage.setItem('kt_recent', JSON.stringify(l.slice(0, 12))); } catch { /* التخزين محجوب */ } };
const pages = {};
window.KTApp = { Discover, payLogos, recent, K, sb, $, $$, esc, fmt, money, purl, curl, imgSrc, imgList, params, ic, stars, toast, Cart, shipping, badge, db, loadCats, loadAll, searchLocal, aiText, norm, card, skeletons, errorBox, emptyBox, discount, STATUS, PAYNAME, pages, setHashtag, TAGS, getSession, requireLogin, get session() { return SESSION; } };

document.addEventListener('DOMContentLoaded', async () => {
  try { await getSession(); } catch { /* بدون اتصال */ }
  renderHeader(); renderFooter(); badge();
  const run = pages[document.body.dataset.page];
  if (run) { try { await run(); } catch (err) { console.error(err); const a = $('#app'); if (a) a.innerHTML = `<div class="wrap page">${errorBox()}</div>`; } }
});
})();
