/* Zenvyro — member notifications (the bell on Home and in Wallet).
   Demo: saved in this browser (localStorage "zenvyro_notifs_v1"). The admin page writes here when it confirms a withdrawal (admin-withdraw.js).
   When the backend is connected, replace load()/save() with the member's rows from the database (same fields: id, title, text, ts, read, kind, ref). */
(() => {
  "use strict";
  const KEY = "zenvyro_notifs_v1";
  const load = () => { try { const a = JSON.parse(localStorage.getItem(KEY) || "[]"); return Array.isArray(a) ? a.filter(n => n && n.id && n.title) : []; } catch (e) { return []; } };
  const save = a => { try { localStorage.setItem(KEY, JSON.stringify(a.slice(0, 100))); } catch (e) {} };
  const fire = () => { try { window.dispatchEvent(new CustomEvent("zv-notify")); } catch (e) {} };
  const api = {
    list: () => load().sort((a, b) => (b.ts || 0) - (a.ts || 0)),
    unread: () => load().filter(n => !n.read).length,
    add(n) { const a = load(); a.unshift(Object.assign({ id: "N" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), ts: Date.now(), read: false }, n)); save(a); fire(); },
    markAllRead() { const a = load(); let c = false; a.forEach(n => { if (!n.read) { n.read = true; c = true; } }); if (c) { save(a); fire(); } }
  };
  window.ZenvyroNotify = api;
  addEventListener("storage", e => {
    if (e.key !== KEY) return;
    fire();
    const n = api.list().find(x => !x.read);
    if (n && typeof window.toast === "function") window.toast(n.title);   // the admin confirmed something while the app was open
  });
  document.addEventListener("visibilitychange", () => { if (!document.hidden) fire(); });
})();
