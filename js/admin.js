/* Kitchenly - لوحة التحكم (طلبات، منتجات، رسائل). الصلاحية بواسطة RLS عبر kt_is_admin(). */
(() => {
'use strict';
const { sb, $, $$, esc, money, imgSrc, toast, STATUS, PAYNAME, pages, requireLogin } = window.KTApp;
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const date = d => new Date(d).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' });

pages.admin = async () => {
  const app = $('#app');
  if (!(await requireLogin())) return;
  const { data: ok } = await sb.rpc('kt_is_admin');
  if (ok !== true) { app.innerHTML = `<div class="wrap page"><div class="card center" style="text-align:center"><h1 style="font-size:1.5rem">غير مصرح</h1><p class="page__sub">هذا الحساب ليس ضمن مديري المتجر.</p><a href="/" class="btn btn-primary" style="margin-top:16px">العودة للمتجر</a></div></div>`; return; }
  let tab = 'orders';
  const cats = (await sb.from('kt_categories').select('*').order('sort')).data || [];
  const shell = () => {
    app.innerHTML = `<div class="wrap page"><div style="display:flex;flex-wrap:wrap;gap:12px;justify-content:space-between;align-items:center"><h1>لوحة التحكم</h1><div style="display:flex;gap:8px">${[['orders', 'الطلبات'], ['products', 'المنتجات'], ['messages', 'الرسائل']].map(([k, l]) => `<button class="chip" data-tab="${k}" aria-current="${tab === k}">${l}</button>`).join('')}</div></div><div id="pane" style="margin-top:20px"></div></div><dialog id="dlg"></dialog>`;
    $$('[data-tab]').forEach(b => b.onclick = () => { tab = b.dataset.tab; shell(); views[tab](); });
  };
  const views = {
    async orders() {
      const pane = $('#pane'); pane.innerHTML = '<div class="skel" style="height:160px"></div>';
      const { data, error } = await sb.from('kt_orders').select('*').order('created_at', { ascending: false }).limit(100);
      if (error) { pane.innerHTML = '<p class="card empty">تعذر تحميل الطلبات</p>'; return; }
      pane.innerHTML = data.length ? `<div style="display:grid;gap:14px">${data.map(o => `<article class="card order"><div class="order__head"><div><h3 dir="ltr">${esc(o.order_no)}</h3><small style="color:var(--muted)">${date(o.created_at)}</small></div>
        <select class="field" style="width:auto" data-status="${o.id}" aria-label="حالة الطلب">${Object.entries(STATUS).map(([k, v]) => `<option value="${k}" ${o.status === k ? 'selected' : ''}>${v}</option>`).join('')}</select></div>
        <div class="form-grid two" style="font-size:.9rem"><div><b>${esc(o.customer_name)}</b><p dir="ltr" style="text-align:start"><a href="tel:${esc(o.phone)}">${esc(o.phone)}</a></p><p>${esc(o.city)} - ${esc(o.address)}</p>${o.notes ? `<p style="color:var(--muted)">ملاحظات: ${esc(o.notes)}</p>` : ''}<p style="color:var(--muted)">الدفع: ${PAYNAME[o.payment_method] || esc(o.payment_method)}</p></div>
        <ul class="rows">${o.items.map(i => `<li style="display:flex;justify-content:space-between;gap:8px"><span>${esc(i.name)} x${i.qty}</span><span>${money(i.price * i.qty)}</span></li>`).join('')}<li class="tot" style="display:flex;justify-content:space-between;border-top:1px solid var(--line);padding-top:8px;font-weight:600"><span>الإجمالي</span><span>${money(o.total)}</span></li></ul></div></article>`).join('')}</div>` : '<p class="card empty">لا توجد طلبات بعد.</p>';
      $$('[data-status]').forEach(s => s.onchange = async () => { const { error: e } = await sb.from('kt_orders').update({ status: s.value }).eq('id', s.dataset.status); toast(e ? 'تعذر تحديث الحالة' : 'تم تحديث الحالة', e ? 'err' : ''); });
    },
    async products() {
      const pane = $('#pane'); pane.innerHTML = '<div class="skel" style="height:160px"></div>';
      const { data, error } = await sb.from('kt_products').select('*, category:kt_categories(name)').order('created_at', { ascending: false });
      if (error) { pane.innerHTML = '<p class="card empty">تعذر تحميل المنتجات</p>'; return; }
      pane.innerHTML = `<div style="text-align:end;margin-bottom:12px"><button class="btn btn-primary btn-sm" id="np">إضافة منتج</button></div><div class="card scroll-x"><table class="tbl"><thead><tr><th>المنتج</th><th>القسم</th><th>السعر</th><th>المخزون</th><th>الحالة</th><th></th></tr></thead><tbody>${data.map(p => `<tr><td><img src="${esc(imgSrc(p))}" alt="">${esc(p.name)}</td><td>${esc(p.category?.name || '-')}</td><td>${money(p.price)}${p.old_price > p.price ? ` <small style="color:var(--red)">(عرض)</small>` : ''}</td><td>${p.stock}</td><td>${p.active ? 'ظاهر' : 'مخفي'}</td><td style="text-align:end;white-space:nowrap"><button class="btn btn-ghost btn-sm" data-edit="${p.id}">تعديل</button> <button class="btn btn-ghost btn-sm" data-del="${p.id}">حذف</button></td></tr>`).join('')}</tbody></table></div>`;
      const byId = Object.fromEntries(data.map(p => [p.id, p]));
      $('#np').onclick = () => form(null); $$('[data-edit]').forEach(b => b.onclick = () => form(byId[b.dataset.edit]));
      $$('[data-del]').forEach(b => b.onclick = async () => { if (!confirm('حذف هذا المنتج نهائيًا؟')) return; const { error: e } = await sb.from('kt_products').delete().eq('id', b.dataset.del); toast(e ? 'تعذر الحذف' : 'تم الحذف', e ? 'err' : ''); if (!e) views.products(); });
    },
    async messages() {
      const pane = $('#pane'); const { data, error } = await sb.from('kt_messages').select('*').order('created_at', { ascending: false }).limit(100);
      if (error) { pane.innerHTML = '<p class="card empty">تعذر تحميل الرسائل</p>'; return; }
      pane.innerHTML = data.length ? `<div style="display:grid;gap:12px">${data.map(m => `<article class="card" style="padding:16px"><div style="display:flex;flex-wrap:wrap;justify-content:space-between;gap:8px;font-size:.9rem"><strong>${esc(m.name)}</strong><span style="color:var(--muted)">${date(m.created_at)}</span></div>${m.phone ? `<p dir="ltr" style="text-align:start;font-size:.9rem">${esc(m.phone)}</p>` : ''}<p style="margin-top:8px">${esc(m.body)}</p><label style="display:flex;gap:8px;align-items:center;margin-top:8px;font-size:.9rem"><input type="checkbox" data-handled="${m.id}" ${m.handled ? 'checked' : ''}> تم الرد</label></article>`).join('')}</div>` : '<p class="card empty">لا توجد رسائل.</p>';
      $$('[data-handled]').forEach(c => c.onchange = async () => { await sb.from('kt_messages').update({ handled: c.checked }).eq('id', c.dataset.handled); });
    }
  };
  function form(p) {
    const d = $('#dlg'), v = p || { name: '', slug: '', short_desc: '', description: '', features: [], price: '', old_price: '', image: 'assets/img/', stock: 50, badge: '', featured: false, active: true, category_id: cats[0]?.id };
    const f = (id, label, input) => `<div><label class="lbl" for="${id}">${label}</label>${input}</div>`;
    d.innerHTML = `<form id="pf" novalidate><h2>${p ? 'تعديل المنتج' : 'منتج جديد'}</h2>
    <div class="form-grid two">${f('f-name', 'الاسم', `<input class="field" id="f-name" value="${esc(v.name)}" required>`)}${f('f-slug', 'الرابط (إنجليزي بشرطات)', `<input class="field" id="f-slug" dir="ltr" value="${esc(v.slug)}" ${p ? 'readonly' : ''} placeholder="green-brush">`)}
    ${f('f-cat', 'القسم', `<select class="field" id="f-cat">${cats.map(c => `<option value="${c.id}" ${c.id === v.category_id ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select>`)}${f('f-img', 'مسار الصورة أو رابطها', `<input class="field" id="f-img" dir="ltr" value="${esc(v.image)}">`)}
    ${f('f-price', 'السعر', `<input class="field" id="f-price" type="number" min="0" step="0.01" value="${v.price}">`)}${f('f-old', 'السعر قبل الخصم (يُظهره في العروض)', `<input class="field" id="f-old" type="number" min="0" step="0.01" value="${v.old_price ?? ''}">`)}
    ${f('f-stock', 'المخزون', `<input class="field" id="f-stock" type="number" min="0" value="${v.stock}">`)}${f('f-badge', 'شارة (اختياري)', `<input class="field" id="f-badge" maxlength="20" value="${esc(v.badge || '')}">`)}</div>
    ${f('f-short', 'وصف مختصر', `<input class="field" id="f-short" maxlength="120" value="${esc(v.short_desc || '')}">`)}
    ${f('f-desc', 'الوصف', `<textarea class="field" id="f-desc" rows="3">${esc(v.description || '')}</textarea>`)}
    ${f('f-feat', 'المميزات (كل ميزة في سطر)', `<textarea class="field" id="f-feat" rows="3">${esc((v.features || []).join('\n'))}</textarea>`)}
    <div style="display:flex;gap:24px;font-size:.9rem"><label style="display:flex;gap:8px;align-items:center"><input type="checkbox" id="f-feat-on" ${v.featured ? 'checked' : ''}> في الأكثر مبيعًا</label><label style="display:flex;gap:8px;align-items:center"><input type="checkbox" id="f-active" ${v.active ? 'checked' : ''}> ظاهر في المتجر</label></div>
    <p id="f-err" class="alert" role="alert" hidden></p><div style="display:flex;justify-content:flex-end;gap:8px"><button type="button" class="btn btn-ghost" id="f-cancel">إلغاء</button><button class="btn btn-primary">حفظ</button></div></form>`;
    d.showModal(); $('#f-cancel').onclick = () => d.close();
    $('#pf').addEventListener('submit', async e => {
      e.preventDefault(); const err = $('#f-err'), show = m => { err.textContent = m; err.hidden = false; };
      const row = { name: $('#f-name').value.trim(), slug: $('#f-slug').value.trim(), category_id: $('#f-cat').value, image: $('#f-img').value.trim(), price: Number($('#f-price').value), old_price: $('#f-old').value === '' ? null : Number($('#f-old').value), stock: parseInt($('#f-stock').value, 10), badge: $('#f-badge').value.trim() || null, short_desc: $('#f-short').value.trim(), description: $('#f-desc').value.trim(), features: $('#f-feat').value.split('\n').map(s => s.trim()).filter(Boolean), featured: $('#f-feat-on').checked, active: $('#f-active').checked };
      if (!row.name) return show('اكتب اسم المنتج'); if (!SLUG.test(row.slug)) return show('الرابط يجب أن يكون حروفًا إنجليزية صغيرة وأرقامًا مفصولة بشرطات'); if (!(row.price >= 0)) return show('اكتب سعرًا صحيحًا'); if (!Number.isInteger(row.stock) || row.stock < 0) return show('اكتب مخزونًا صحيحًا'); if (!row.image) return show('أضف صورة للمنتج');
      const { error } = p ? await sb.from('kt_products').update(row).eq('id', p.id) : await sb.from('kt_products').insert(row);
      if (error) return show(error.code === '23505' ? 'هذا الرابط مستخدم لمنتج آخر' : 'تعذر حفظ المنتج');
      d.close(); toast('تم الحفظ'); views.products();
    });
  }
  shell(); views[tab]();
};
})();
