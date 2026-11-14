/* =====================================================================
 * js/core/supabase.js
 * الوظيفة: إنشاء عميل Supabase للمتجر وجلسة العميل (getSession / requireLogin).
 * يعتمد على: js/core/utils.js [K]
 * يعرض على window.KTApp: sb, getSession, requireLogin, session (getter)
 * ===================================================================== */
(() => {
'use strict';
const NS = (window.KTApp = window.KTApp || {});
const { K } = NS;   // js/core/utils.js

/* ===================== #supabase: عميل قاعدة البيانات ===================== */
// #supabase #client
const sb = window.supabase.createClient(K.url, K.key);

/* ===================== #session: جلسة العميل وحماية الصفحات ===================== */
// #session #auth #require-login

let SESSION = null;
const getSession = async () => { const { data } = await sb.auth.getSession(); SESSION = data.session; return SESSION; };
const requireLogin = async () => { await getSession(); if (!SESSION) { location.replace(`/auth.html?next=${encodeURIComponent(location.pathname + location.search)}`); return false; } return true; };

Object.defineProperty(NS, 'session', { get: () => SESSION, enumerable: true, configurable: true });   // قراءة حيّة للمتغير (بدل نسخة ثابتة)
Object.assign(NS, { sb, getSession, requireLogin });
})();
