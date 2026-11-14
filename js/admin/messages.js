/* =====================================================================
 * js/admin/messages.js
 * الوظيفة: رسائل التواصل من العملاء.
 * يعتمد على: js/admin/shared.js [pgh, pages] · window.Panel [sb, $$, esc, dt, toast, empty]
 * يعرض على window.Panel.admin: لا شيء
 * ===================================================================== */
(() => {
'use strict';
const NS = (window.Panel.admin = window.Panel.admin || {});
const { sb, $$, esc, dt, toast, empty } = window.Panel;
const { pgh, pages } = NS;   // js/admin/shared.js

/* ===================== #admin-messages: الرسائل ===================== */
// #admin #messages #contact
// #page-messages #route #admin #messages
pages.messages = async el => {
  const { data, error } = await sb.from('kt_messages').select('*').order('created_at', { ascending: false }).limit(200); if (error) throw error; let f = 'open';
  const draw = () => {
    const list = data.filter(m => f === 'all' || (f === 'open' ? !m.handled : f === 'sellers' ? /\[(دعم بائع|طلب انضمام)\]/.test(m.body || '') : m.handled));
    el.innerHTML = pgh('الرسائل', 'رسائل العملاء والبائعين') + `<div class="tools"><div class="chips">${[['open', `بدون رد (${data.filter(m => !m.handled).length})`], ['sellers', 'دعم البائعين'], ['done', 'تم الرد'], ['all', 'الكل']].map(([k, t]) => `<button class="chip" data-f="${k}" aria-pressed="${f === k}">${t}</button>`).join('')}</div></div>` +
      (list.length ? `<div class="grid">${list.map(m => `<article class="card"><div style="display:flex;flex-wrap:wrap;justify-content:space-between;gap:8px"><b>${esc(m.name)}</b><span style="color:var(--muted);font-size:.85rem">${dt(m.created_at)}</span></div>${m.phone ? `<p dir="ltr" style="text-align:start;font-size:.88rem;color:var(--muted)">${esc(m.phone)}</p>` : ''}<p style="margin-top:8px;white-space:pre-wrap">${esc(m.body)}</p><label style="display:flex;gap:8px;align-items:center;margin-top:10px;font-size:.9rem"><input type="checkbox" data-h="${m.id}" ${m.handled ? 'checked' : ''}> تم الرد</label></article>`).join('')}</div>` : empty('inbox', 'لا رسائل'));
    $$('[data-f]').forEach(b => b.onclick = () => { f = b.dataset.f; draw(); });
    $$('[data-h]').forEach(c => c.onchange = async () => { const { error: e } = await sb.from('kt_messages').update({ handled: c.checked }).eq('id', c.dataset.h); if (!e) data.find(m => String(m.id) === c.dataset.h).handled = c.checked; toast(e ? 'تعذر التحديث' : 'تم', e ? 'err' : ''); });
  };
  draw();
};
})();
