/* =====================================================================
 * js/stuff/team.js
 * الوظيفة: صفحة "فريقي": عرض وإضافة وحذف أعضاء الفريق (kt_team_*).
 * يعتمد على: js/stuff/shared.js [pgh, tbl, field, ico, pages] · window.Panel [sb, $, $$, esc, toast, ask, skel, empty, badge]
 * يعرض على window.Panel.stuff: لا شيء
 * ===================================================================== */
(() => {
'use strict';
const NS = (window.Panel.stuff = window.Panel.stuff || {});
const { sb, $, $$, esc, toast, ask, skel, empty, badge } = window.Panel;
const { pgh, tbl, field, ico, pages } = NS;   // js/stuff/shared.js

/* ===================== #stuff-team: فريقي ===================== */
// #stuff #team
// #page-team #route #stuff #team
pages.team = async (el, c) => {
  el.innerHTML = pgh('فريقي', 'من يقدر يدخل لوحة فريق العمل') + skel(200);
  const { data, error } = await sb.rpc('kt_team_list'); if (error) throw error;
  const me = (c.user.email || '').toLowerCase();
  el.innerHTML = pgh('فريقي', `${data.length} عضو في الفريق`) +
    `<div class="grid g-main"><div>${tbl(['البريد الإلكتروني', ''], data.map(m => `<tr><td dir="ltr" style="text-align:start"><b>${esc(m.email)}</b>${m.email === me ? ' ' + badge('b-ok', 'أنت') : ''}</td><td class="act">${m.email === me ? '' : `<button class="btn btn-d btn-sm" data-r="${esc(m.email)}">إزالة</button>`}</td></tr>`), empty('users', 'لا يوجد أعضاء'))}</div>
    <form class="card" id="af" style="display:grid;gap:12px;align-self:start" novalidate><h3 style="display:flex;gap:10px;align-items:center">${ico('users')} إضافة عضو</h3>${field('ae', 'البريد الإلكتروني', 'type="email" dir="ltr" required', 'لازم يكون عنده حساب على الموقع بنفس الإيميل')}<p id="err" class="alert" hidden></p><button class="btn btn-p">إضافة</button></form></div>`;
  $('#af').onsubmit = async e => {
    e.preventDefault(); const err = $('#err'), v = $('#ae').value.trim(); err.hidden = true;
    if (!/^\S+@\S+\.\S+$/.test(v)) { err.textContent = 'اكتب بريدًا صحيحًا'; err.hidden = false; return; }
    const { error: x } = await sb.rpc('kt_team_add', { p_email: v }); if (x) { err.textContent = 'تعذر الإضافة'; err.hidden = false; return; }
    toast('تمت الإضافة'); pages.team(el, c);
  };
  $$('[data-r]', el).forEach(b => b.onclick = async () => {
    if (!(await ask(`إزالة ${b.dataset.r} من الفريق؟`, 'إزالة', true))) return;
    const { error: x } = await sb.rpc('kt_team_remove', { p_email: b.dataset.r }); toast(x ? 'تعذرت الإزالة' : 'تمت الإزالة', x ? 'err' : ''); if (!x) pages.team(el, c);
  });
};
})();
