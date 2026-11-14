/* =====================================================================
 * js/stuff/help.js
 * الوظيفة: طلبات المساعدة: مستخدمين / بائعين / الكل.
 * يعتمد على: js/stuff/shared.js [BASE, pgh, ico, isSeller, pages] · window.Panel [sb, $$, esc, dt, toast, skel, empty, badge]
 * يعرض على window.Panel.stuff: لا شيء
 * ===================================================================== */
(() => {
'use strict';
const NS = (window.Panel.stuff = window.Panel.stuff || {});
const { sb, $$, esc, dt, toast, skel, empty, badge } = window.Panel;
const { BASE, pgh, ico, isSeller, pages } = NS;   // js/stuff/shared.js

/* ===================== #stuff-help: طلبات المساعدة ===================== */
// #stuff #help #support #tickets
const helpTabs = cur => `<div class="tabs">${[['', 'الكل'], ['/users', 'العملاء'], ['/seller', 'البائعون']].map(([p, t]) => `<a data-l href="${BASE}/help-requests${p}" aria-current="${cur === p}">${t}</a>`).join('')}</div>`;
async function helpList(el, kind) {
  const titles = { '': ['طلبات المساعدة', 'كل رسائل العملاء والبائعين'], '/users': ['طلبات العملاء', 'رسائل العملاء من صفحة اتصل بنا'], '/seller': ['طلبات البائعين', 'دعم البائعين وطلبات الانضمام'] };
  const [t, s] = titles[kind];
  el.innerHTML = pgh(t, s) + helpTabs(kind) + skel(240);
  const { data, error } = await sb.from('kt_messages').select('*').order('created_at', { ascending: false }).limit(300); if (error) throw error;
  const all = data.filter(m => kind === '' || (kind === '/seller') === isSeller(m)); let f = 'open';
  const draw = () => {
    const list = all.filter(m => f === 'all' || (f === 'open' ? !m.handled : m.handled));
    el.innerHTML = pgh(t, s) + helpTabs(kind) + `<div class="tools"><div class="chips">${[['open', `بدون رد (${all.filter(m => !m.handled).length})`], ['done', 'تم الرد'], ['all', 'الكل']].map(([k, x]) => `<button class="chip" data-f="${k}" aria-pressed="${f === k}">${x}</button>`).join('')}</div></div>` +
      (list.length ? `<div class="grid">${list.map(m => `<article class="card"><div style="display:flex;flex-wrap:wrap;justify-content:space-between;gap:8px"><b>${esc(m.name)} ${kind === '' ? badge(isSeller(m) ? 'b-blue' : '', isSeller(m) ? 'بائع' : 'عميل') : ''}</b><span style="color:var(--muted);font-size:.85rem">${dt(m.created_at)}</span></div>${m.phone ? `<p dir="ltr" style="text-align:start;font-size:.88rem;color:var(--muted)"><a href="tel:${esc(m.phone)}">${esc(m.phone)}</a></p>` : ''}<p style="margin-top:8px;white-space:pre-wrap">${esc(m.body)}</p><label style="display:flex;gap:8px;align-items:center;margin-top:12px;font-size:.9rem"><input type="checkbox" data-h="${m.id}" ${m.handled ? 'checked' : ''}> تم الرد</label></article>`).join('')}</div>` : empty('inbox', 'لا توجد طلبات هنا', 'كل الرسائل تم الرد عليها'));
    $$('[data-f]', el).forEach(b => b.onclick = () => { f = b.dataset.f; draw(); });
    $$('[data-h]', el).forEach(c => c.onchange = async () => { const { error: e } = await sb.from('kt_messages').update({ handled: c.checked }).eq('id', c.dataset.h); if (!e) { data.find(m => String(m.id) === c.dataset.h).handled = c.checked; window.Panel.refresh?.(); } toast(e ? 'تعذر التحديث' : 'تم', e ? 'err' : ''); });
  };
  draw();
}
// #page-help #route #stuff #help
pages.help = async el => {
  el.innerHTML = pgh('طلبات المساعدة', 'متابعة رسائل العملاء والبائعين') + skel(160);
  const { data, error } = await sb.from('kt_messages').select('body,name,handled').limit(1000); if (error) throw error;
  const s = data.filter(isSeller), u = data.filter(m => !isSeller(m)), open = l => l.filter(m => !m.handled).length;
  el.innerHTML = pgh('طلبات المساعدة', 'متابعة رسائل العملاء والبائعين') + helpTabs('') +
    `<div class="grid g3">${[['/users', 'help', 'طلبات العملاء', u], ['/seller', 'store', 'طلبات البائعين', s]].map(([p, i, tt, l]) => `<a data-l href="${BASE}/help-requests${p}" class="card" style="display:flex;gap:12px;align-items:center">${ico(i, 'lg')}<div><b>${tt}</b><p style="color:var(--muted);font-size:.9rem">${open(l)} بدون رد من ${l.length}</p></div></a>`).join('')}</div>`;
};
// #page-help-users #route #stuff #help
pages.helpUsers = el => helpList(el, '/users');
// #page-help-seller #route #stuff #help
pages.helpSeller = el => helpList(el, '/seller');
// #page-help-all #route #stuff #help
pages.helpAll = el => helpList(el, '');
})();
