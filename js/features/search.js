/* =====================================================================
 * js/features/search.js
 * الوظيفة: البحث: تطبيع عربي مرن + مرادفات + تقييم النتائج + البحث الذكي (AI) + تصغير صورة البحث بالصورة.
 * يعتمد على: js/core/utils.js [K] · js/core/data.js [loadAll]
 * يعرض على window.KTApp: norm, searchLocal, callAI, aiText, fileToJpeg
 * ===================================================================== */
(() => {
'use strict';
const NS = (window.KTApp = window.KTApp || {});
const { K } = NS;   // js/core/utils.js
const { loadAll } = NS;   // js/core/data.js

/* ===================== #search: بحث عربي مرن واقتراحات ذكية ===================== */
// #search #arabic-normalize #synonyms #levenshtein #ai-search

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

/* ===================== #image-search: تجهيز الصورة للبحث بالصورة (تصغير + JPEG) ===================== */
// #image-search #canvas #upload
function fileToJpeg(file, max = 1024) {
  return new Promise((resolve, reject) => {
    const img = new Image(), url = URL.createObjectURL(file);
    img.onload = () => { const k = Math.min(1, max / Math.max(img.width, img.height)), c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url); const d = c.toDataURL('image/jpeg', 0.82); resolve({ dataUrl: d, base64: d.split(',')[1] }); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('bad_image')); }; img.src = url;
  });
}

Object.assign(NS, { norm, searchLocal, callAI, aiText, fileToJpeg });
})();
