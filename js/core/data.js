/* =====================================================================
 * js/core/data.js
 * الوظيفة: طبقة بيانات المتجر: استعلامات Supabase للأقسام والمنتجات والطلبات والتقييمات + كاش الأقسام والمنتجات.
 * يعتمد على: js/core/supabase.js [sb]
 * يعرض على window.KTApp: PC, db, loadCats, loadAll
 * ===================================================================== */
(() => {
'use strict';
const NS = (window.KTApp = window.KTApp || {});
const { sb } = NS;   // js/core/supabase.js

/* ===================== #data: استعلامات Supabase وكاش المنتجات والأقسام ===================== */
// #data #supabase #products #categories #cache

const PC = {};
const remember = list => { (list || []).forEach(p => { PC[p.slug] = p; }); return list; };
const db = {
  async categories() { const { data, error } = await sb.from('kt_categories').select('*').order('sort'); if (error) throw error; return data; },
  async products({ cat, sort = 'new', featured, limit, exclude, sale } = {}) {
    let query = sb.from('kt_products').select(cat ? '*, category:kt_categories!inner(slug,name)' : '*, category:kt_categories(slug,name)').eq('active', true).eq('approval_status', 'approved');
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
    const { data, error } = await sb.from('kt_products').select('*, category:kt_categories(slug,name)').eq('slug', slug).eq('active', true).eq('approval_status', 'approved').maybeSingle();
    if (error) throw error; if (data) remember([data]); return data;
  },
  async store(slug) { const { data, error } = await sb.from('kt_stores_public').select('*').eq('slug', slug).maybeSingle(); if (error) throw error; return data; },
  async storeById(id) { if (!id) return null; const { data } = await sb.from('kt_stores_public').select('id,name,slug,logo,city').eq('id', id).maybeSingle(); return data; },
  async byStore(id, sort = 'new') {
    let q = sb.from('kt_products').select('*, category:kt_categories(slug,name)').eq('store_id', id).eq('active', true).eq('approval_status', 'approved');
    q = sort === 'price-asc' ? q.order('price', { ascending: true }) : sort === 'price-desc' ? q.order('price', { ascending: false }) : q.order('created_at', { ascending: false });
    const { data, error } = await q; if (error) throw error; return remember(data);
  },
  async bySlugs(slugs) {
    if (!slugs.length) return [];
    const { data, error } = await sb.from('kt_products').select('*, category:kt_categories(slug,name)').in('slug', slugs).eq('active', true).eq('approval_status', 'approved'); if (error) throw error; return remember(data);
  }
};
let CATS = null;
const loadCats = () => (CATS ||= db.categories().catch(() => { CATS = null; return []; }));
let ALL = null;
const loadAll = () => (ALL ||= db.products({ sort: 'popular' }).catch(() => { ALL = null; return []; }));

Object.assign(NS, { PC, db, loadCats, loadAll });
})();
