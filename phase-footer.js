/* Zenvyro: Phase 1 live countdown + footer actions.
   Settings (all optional, set them before this file loads):
     window.ZENVYRO_PHASE1_START  = "2026-11-05T00:00:00+06:00"   // when the 120-day phase starts
     window.ZENVYRO_COMMUNITY     = { telegram:"https://t.me/...", twitter:"https://x.com/...", youtube:"https://youtube.com/...", email:"support@..." }
*/
(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const esc = t => String(t).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const say = m => (typeof window.toast === "function" ? window.toast(m) : null);
  const safeUrl = u => /^https:\/\//i.test(u || "") ? u : "";

  /* ---------- Countdown: a fixed end date, so a refresh or a closed tab never loses time ---------- */
  const DAYS = 120, DAY_MS = 864e5;
  let start = Date.parse(window.ZENVYRO_PHASE1_START || "2026-11-05T00:00:00+06:00");
  if (!Number.isFinite(start)) {            // bad setting: fall back to the first visit on this device
    try { start = +localStorage.getItem("zenvyro_phase1_start") || Date.now(); localStorage.setItem("zenvyro_phase1_start", String(start)); }
    catch (e) { start = Date.now(); }
  }
  const END = start + DAYS * DAY_MS;
  const pad = n => String(n).padStart(2, "0");
  let last = -1;

  function tick() {
    const box = $("zphBox"); if (!box) return;
    const left = Math.max(0, Math.min(DAYS * DAY_MS, END - Date.now()));   // before the start it stays at the full 120 days
    const s = Math.ceil(left / 1000), d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60), sec = s % 60;
    $("zphD").textContent = d; $("zphH").textContent = pad(h); $("zphM").textContent = pad(m); $("zphS").textContent = pad(sec);
    if (sec !== last) { last = sec; const el = $("zphS"); el.classList.remove("zph-tick"); void el.offsetWidth; el.classList.add("zph-tick"); }
    const done = left <= 0;
    box.classList.toggle("is-done", done);
    $("zphName").textContent = done ? "Phase 1 Completed" : "Phase 1 Active Status";
    $("zphLive").lastChild.textContent = done ? "ENDED" : "LIVE";
  }
  function startClock() {
    tick();
    setInterval(tick, 1000);
    document.addEventListener("visibilitychange", () => { if (!document.hidden) tick(); });
  }

  /* ---------- Footer links ---------- */
  const row = (a, b) => `<div style="display:block"><strong style="display:block">${a}</strong><span style="display:block;margin-top:4px;line-height:1.55">${b}</span></div>`;
  const note = t => `<div class="modal-note">${t}</div>`;
  const open = {
    about() { location.href = "about.html"; },
    whitepaper() { location.href = "whitepaper.html"; },
    faq() { location.href = "faq.html"; },
    privacy() { if (window.ZENVYRO_LEGAL) window.ZENVYRO_LEGAL.open("privacy"); },
    terms() { if (window.ZENVYRO_LEGAL) window.ZENVYRO_LEGAL.open("terms"); },
    support() {
      const c = window.ZENVYRO_SUPPORT || window.ZENVYRO_COMMUNITY || {}, rows = [];
      [["telegram", "Telegram"], ["whatsapp", "WhatsApp"], ["facebook", "Facebook"], ["youtube", "YouTube"]].forEach(k => {
        const u = safeUrl(c[k[0]]); if (u) rows.push(`<div><strong>${k[1]}</strong><span><a style="color:#c69aff" target="_blank" rel="noopener" href="${esc(u)}">Open</a></span></div>`);
      });
      if (/^[^\s@<>"']+@[^\s@<>"']+\.[a-z]{2,}$/i.test(c.email || "")) rows.push(`<div><strong>Email</strong><span><a style="color:#c69aff" href="mailto:${esc(c.email)}">${esc(c.email)}</a></span></div>`);
      openModal("Contact Support", rows.length ? '<div class="modal-list">' + rows.join("") + "</div>" : note("Support channels have not been added yet."));
    }
  };
  const social = k => {
    const c = window.ZENVYRO_COMMUNITY || window.ZENVYRO_SUPPORT || {};
    const u = safeUrl(k === "twitter" ? (c.twitter || c.x) : c[k]);
    if (u) window.open(u, "_blank", "noopener"); else say("Official link coming soon");
  };

  function init() {
    startClock();
    document.addEventListener("click", e => {
      const a = e.target.closest("[data-zf]"); if (a && open[a.dataset.zf]) { e.preventDefault(); open[a.dataset.zf](); return; }
      const s = e.target.closest("[data-s]"); if (s && s.closest(".zvf")) social(s.dataset.s);
    });
    const y = $("zvfYear"); if (y) y.textContent = new Date().getFullYear();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
