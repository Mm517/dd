/* =====================================================================
 * js/panel/uploads.js
 * الوظيفة: رفع الصور إلى Supabase Storage (bucket store-assets) مع تصغير وحقل صورة بمعاينة.
 * يعتمد على: js/panel/core.js [sb, $, esc, rand, ic] · js/panel/ui.js [toast]
 * يعرض على window.Panel: uploadImage, imageField, bindImage
 * ===================================================================== */
(() => {
'use strict';
const NS = (window.Panel = window.Panel || {});
const { sb, $, esc, rand, ic } = NS;   // js/panel/core.js
const { toast } = NS;   // js/panel/ui.js

/* ===================== #uploads: رفع الصور وحقل الصورة ===================== */
// #uploads #image #storage #preview
function toBlob(file, max = 1200) {
  return new Promise((res, rej) => {
    const img = new Image(), url = URL.createObjectURL(file);
    img.onload = () => { const k = Math.min(1, max / Math.max(img.width, img.height)), c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url); c.toBlob(b => (b ? res(b) : rej(new Error('blob'))), 'image/jpeg', 0.86); };
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('bad_image')); }; img.src = url;
  });
}
async function uploadImage(file, uid) {
  if (!file || !/^image\//.test(file.type)) throw new Error('اختر ملف صورة');
  if (file.size > 12 * 1024 * 1024) throw new Error('الصورة كبيرة، الحد 12 ميجا');
  const blob = await toBlob(file), path = `${uid}/${Date.now()}-${rand(6)}.jpg`;
  const { error } = await sb.storage.from('store-assets').upload(path, blob, { contentType: 'image/jpeg', cacheControl: '31536000' });
  if (error) throw new Error('تعذر رفع الصورة. تأكد من تشغيل ملف SQL (bucket: store-assets).');
  return sb.storage.from('store-assets').getPublicUrl(path).data.publicUrl;
}
/* حقل صورة: معاينة + رفع + رابط يدوي */
const imageField = (id, value, label) => `<div><label class="lbl" for="${id}">${label}</label><div class="upl"><img id="${id}-pv" src="${esc(value || '')}" alt="" ${value ? '' : 'style="visibility:hidden"'}><div style="flex:1;display:grid;gap:8px"><input class="field" id="${id}" dir="ltr" placeholder="https://… أو ارفع صورة" value="${esc(value || '')}"><label class="btn btn-g btn-sm" style="justify-self:start">${ic('up', 'sm')} رفع صورة<input type="file" accept="image/*" id="${id}-f" hidden></label></div></div></div>`;
function bindImage(root, id, uid) {
  const inp = $(`#${id}`, root), pv = $(`#${id}-pv`, root), f = $(`#${id}-f`, root);
  const show = () => { pv.src = inp.value; pv.style.visibility = inp.value ? 'visible' : 'hidden'; };
  inp.addEventListener('change', show);
  f.onchange = async () => { const file = f.files[0]; if (!file) return; try { toast('جاري رفع الصورة...'); inp.value = await uploadImage(file, uid); show(); toast('تم رفع الصورة'); } catch (e) { toast(e.message, 'err'); } f.value = ''; };
}

Object.assign(NS, { uploadImage, imageField, bindImage });
})();
