/* =====================================================================
 * js/ui/search-box.js
 * الوظيفة: صندوق البحث في الهيدر: اقتراحات فورية، بحث نصي، وبحث بالصورة.
 * يعتمد على: js/core/utils.js [K, $, esc, money, purl] · js/ui/icons.js [ic] · js/ui/toast.js [toast] · js/core/data.js [loadAll] · js/features/search.js [norm, searchLocal, callAI, fileToJpeg] · js/ui/cards.js [imgSrc]
 * يعرض على window.KTApp: initSearch
 * ===================================================================== */
(() => {
'use strict';
const NS = (window.KTApp = window.KTApp || {});
const { K, $, esc, money, purl } = NS;   // js/core/utils.js
const { ic } = NS;   // js/ui/icons.js
const { toast } = NS;   // js/ui/toast.js
const { loadAll } = NS;   // js/core/data.js
const { norm, searchLocal, callAI, fileToJpeg } = NS;   // js/features/search.js
const { imgSrc } = NS;   // js/ui/cards.js

/* ===================== #search-box: اقتراحات البحث والبحث بالصورة في الهيدر ===================== */
// #search-box #suggestions #image-search #header

function initSearch() {
  const input = $('#q'), box = $('#sug'); if (!input) return;
  let t = null, seq = 0;
  const hide = () => { box.hidden = true; };
  const imgRow = `<button type="button" class="sug__row sug__img" data-pick-img><img src="/assets/img/states/image-search.webp" alt="" width="44" height="44"><span><b>ابحث بالصورة</b><small>ارفع صورة للمنتج وهنوصلك لأقرب منتج عندنا</small></span></button>`;
  const row = p => `<a href="${purl(p)}"><img src="${imgSrc(p)}" alt=""><span><b>${esc(p.name)}</b><small>${money(p.price)}</small></span></a>`;
  const run = async () => {
    const q = input.value.trim();
    if (norm(q).length < 2) { if (K.aiSearch) { box.innerHTML = imgRow; box.hidden = false; } else hide(); return; }
    const my = ++seq, all = await loadAll(); if (my !== seq) return;
    const { exact, partial } = searchLocal(q, all), top = [...exact, ...partial].slice(0, 5);
    box.innerHTML = (top.length ? top.map(row).join('') : `<p style="padding:12px 14px;color:var(--muted)">لا يوجد تطابق مباشر لـ "${esc(q)}"</p>`) +
      `<a class="sug__ai" href="/shop.html?q=${encodeURIComponent(q)}">${ic(K.aiSearch && !exact.length ? 'sparkle' : 'search')}<span>${exact.length ? `عرض كل النتائج لـ "${esc(q)}"` : 'اعرض لي اقتراحات ذكية'}</span></a>` + (K.aiSearch ? imgRow : '');
    box.hidden = false;
  };
  input.addEventListener('input', () => { clearTimeout(t); t = setTimeout(run, 180); });
  input.addEventListener('focus', run);
  document.addEventListener('click', e => { if (!e.target.closest('#srch')) hide(); });
  input.addEventListener('keydown', e => { if (e.key === 'Escape') hide(); });
  const btn = $('#imgbtn'), file = $('#imgfile');
  box.addEventListener('click', e => { if (e.target.closest('[data-pick-img]') && file) { hide(); file.click(); } });
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

Object.assign(NS, { initSearch });
})();
