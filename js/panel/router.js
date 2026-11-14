/* =====================================================================
 * js/panel/router.js
 * الوظيفة: الراوتر والهيكل (History API): تنقل بدون ريفريش، رسم الشل، تشغيل الصفحات، و Panel.start.
 * يعتمد على: js/panel/core.js [sb, signOutLocal, $, $$, esc, ic] · js/panel/ui.js [skel, errBox]
 * يعرض على window.Panel: go, start
 * ===================================================================== */
(() => {
'use strict';
const NS = (window.Panel = window.Panel || {});
const { sb, signOutLocal, $, $$, esc, ic } = NS;   // js/panel/core.js
const { skel, errBox } = NS;   // js/panel/ui.js

/* ===================== #panel-router: الراوتر وهيكل اللوحة ===================== */
// #panel-router #shell #history-api #navigation
let CFG = null, CTX = null, shellOn = false;
const rel = () => { const p = location.pathname.replace(/\/+$/, '') || '/'; return p === CFG.base ? '/' : p.startsWith(CFG.base + '/') ? p.slice(CFG.base.length) : '/'; };
const canon = r => (CFG.aliases && CFG.aliases[r]) || r;
function go(href, replace = false) { history[replace ? 'replaceState' : 'pushState'](null, '', href); return render(); }
const nextUrl = () => { const n = new URLSearchParams(location.search).get('next'); return n && n.startsWith(CFG.base) ? n : CFG.base + CFG.home; };

function shellHtml(ctx) {
  const items = CFG.nav.map(n => n.group ? `<p class="side__grp">${esc(n.group)}</p>` : `<a data-l href="${CFG.base}${n.path === '/' ? '' : n.path}" data-path="${n.path}" class="${n.sub ? 'sub' : ''}">${n.sub ? '' : ic(n.icon)}<span>${esc(n.label)}</span><b class="cnt" data-cnt="${n.path}" hidden></b></a>`).join('');
  const nm = ctx.name || ctx.user?.email || '';
  return `<div class="shell"><aside class="side" id="side"><a data-l href="${CFG.base}${CFG.home === '/' ? '' : CFG.home}" class="side__brand"><img src="/assets/img/logo-mark.jpg" alt=""><span>KITCHENLY<small>${esc(CFG.brandSub)}</small></span></a><nav aria-label="القائمة">${items}</nav>
  <div class="side__foot">${CFG.footLinks.map(l => `<a href="${l.href}" ${l.href.startsWith('http') ? '' : 'target="_blank" rel="noopener"'}>${ic(l.icon, 'sm')}<span>${esc(l.label)}</span></a>`).join('')}<button id="signout">${ic('out', 'sm')}<span>تسجيل الخروج</span></button></div></aside>
  <div class="scrim" id="scrim"></div>
  <div class="main"><header class="top"><button class="burger" id="burger" aria-label="القائمة">${ic('menu')}</button><h1 id="ptitle"></h1><span class="top__sp"></span>${CFG.topExtra ? CFG.topExtra(ctx) : ''}<div class="me"><span class="me__av">${esc(nm.trim().charAt(0).toUpperCase() || 'K')}</span><div><b>${esc(ctx.name || 'حسابي')}</b><small dir="ltr">${esc(ctx.user?.email || '')}</small></div></div></header>
  <main class="content" id="view"></main></div></div>`;
}
const applyBadges = ctx => { if (CFG.badges) CFG.badges(ctx).then(b => Object.entries(b || {}).forEach(([k, n]) => { const el = $(`[data-cnt="${k}"]`); if (!el) return; el.textContent = n; el.hidden = !(n > 0); })).catch(() => {}); };
function ensureShell(ctx) {
  if (!shellOn) {
    $('#root').innerHTML = shellHtml(ctx); shellOn = true;
    const close = () => document.body.classList.remove('nav-open');
    $('#burger').onclick = () => document.body.classList.toggle('nav-open'); $('#scrim').onclick = close;
    $('#signout').onclick = async () => { await signOutLocal(); shellOn = false; CTX = null; location.href = CFG.base + CFG.loginPath; };
  }
  applyBadges(ctx);
  document.body.classList.remove('nav-open');
}
async function render() {
  let key = canon(rel()), route = CFG.routes[key], params = {};
  if (!route && CFG.patterns) for (const [rx, r] of CFG.patterns) { const m = key.match(rx); if (m) { route = r; params = { m, key }; break; } }
  window.scrollTo(0, 0);
  if (route && CFG.aliases && CFG.aliases[rel()] && !params.m) history.replaceState(null, '', CFG.base + key);
  if (!route) return go(CFG.base + CFG.home, true);
  if (route.public) {
    shellOn = false; document.body.classList.remove('nav-open'); document.title = `${route.title} | Kitchenly`;
    return route.view($('#root'), { next: nextUrl(), go });
  }
  const ctx = await CFG.guard({ go, sb, nextUrl });
  if (!ctx) { shellOn = false; return; }
  CTX = ctx; ensureShell(ctx);
  const paths = CFG.nav.filter(n => n.path).map(n => n.path), best = route.nav || paths.filter(p => key === p || (p !== '/' && key.startsWith(p + '/'))).sort((a, b) => b.length - a.length)[0];
  $$('.side nav a').forEach(a => { if (a.dataset.path === best) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  $('#ptitle').textContent = route.title; document.title = `${route.title} | ${CFG.docTitle}`;
  const oldV = $('#view'), view = oldV.cloneNode(false); oldV.replaceWith(view); view.innerHTML = skel(220); /* عنصر جديد كل مرة: يمنع تراكم مستمعات الأحداث */
  if (route.needs && !route.needs(ctx)) { view.innerHTML = CFG.locked(ctx); return; }
  try { await route.view(view, ctx, params); } catch (e) { console.error(e); view.innerHTML = errBox(); }
}
function start(cfg) {
  CFG = cfg;
  document.addEventListener('click', e => { const a = e.target.closest('a[data-l]'); if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button) return; e.preventDefault(); go(a.getAttribute('href')); });
  window.addEventListener('popstate', render);
  document.addEventListener('DOMContentLoaded', render);
  if (document.readyState !== 'loading') render();
}

Object.assign(NS, { go, start });
NS.refreshBadges = () => CTX && applyBadges(CTX);
NS.refresh = render;
})();
