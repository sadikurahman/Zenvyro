/* Zenvyro site settings: feature switches, Phase 1 timer and Home box controls, all set from the Admin Panel.
   Demo: stored in this browser (admin.html writes, index.html reads). For all members, host the same JSON at
   window.ZENVYRO_SETTINGS_ENDPOINT:  { "set": {maint,wdraw,dep,exch,trans,mine,buy,nft}, "site": {phase, boxes} }.
   Real stats for Automatic boxes come from window.ZENVYRO_STATS_ENDPOINT (totalIncome,totalWithdraw,normalUsers,coveredCountries). */
(() => {
  "use strict";
  const AKEY = "zenvyro_admin_v2", SKEY = "zenvyro_site_v1", DAY = 864e5, START0 = Date.parse("2026-11-05T00:00:00+06:00");
  const FLAGS = { withdraw: ["wdraw", "Withdrawals"], deposit: ["dep", "Deposits"], exchange: ["exch", "Exchange"], transfer: ["trans", "Transfers"], mining: ["mine", "Mining"], purchase: ["buy", "Pack purchases"], market: ["nft", "NFT purchases"] };
  const BOXES = { income: ["Total Income", "cdIncome"], withdraw: ["Total Withdraw", "cdWithdraw"], normal: ["Normal Users", "cdNormalUsers"], countries: ["Covered Countries", "cdCountries"] };
  const jget = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k) || "null"); return v == null ? d : v; } catch (e) { return d; } };
  const defaults = () => ({ phase: { show: true, start: START0, end: START0 + 120 * DAY, paused: false, left: 0 }, boxes: { income: { show: true, mode: "auto", value: 0, ts: 0 }, withdraw: { show: true, mode: "auto", value: 0, ts: 0 }, normal: { show: true, mode: "auto", value: 0, ts: 0 }, countries: { show: true, mode: "auto", value: 0, ts: 0 } } });
  let remote = null, live = null;
  const merge = o => { const d = defaults(), s = o || {}; return { phase: Object.assign(d.phase, s.phase || {}), boxes: Object.fromEntries(Object.keys(d.boxes).map(k => [k, Object.assign(d.boxes[k], (s.boxes || {})[k] || {})])) }; };
  const site = () => merge(remote ? remote.site : jget(SKEY, null));
  const saveSite = s => { try { localStorage.setItem(SKEY, JSON.stringify(s)); } catch (e) {} };
  const adminSet = () => (remote && remote.set) || (jget(AKEY, {}) || {}).set || {};
  const say = m => { if (typeof window.toast === "function") window.toast(m); };
  const allow = k => { const s = adminSet(); return !(s.maint === true) && s[FLAGS[k][0]] !== false; };
  const block = k => { if (allow(k)) return false; say(adminSet().maint === true ? "The app is under maintenance. Please try again later." : FLAGS[k][1] + " are temporarily closed."); return true; };
  const phase = () => {
    const p = site().phase, now = Date.now(); let left = p.paused ? Math.max(0, +p.left || 0) : Math.max(0, p.end - now);
    if (!p.paused && now < p.start) left = Math.max(0, p.end - p.start);
    return { show: p.show !== false, start: p.start, end: p.end, paused: !!p.paused, left, days: Math.max(1, Math.round((p.end - p.start) / DAY)) };
  };
  const edit = fn => { const s = site(); fn(s); saveSite(s); };
  window.ZenvyroSettings = {
    FLAGS, BOXES, allow, block, phase, box: k => site().boxes[k], all: () => site(),
    setPhase: patch => edit(s => Object.assign(s.phase, patch)),
    pause: () => edit(s => { if (!s.phase.paused) { s.phase.left = Math.max(0, s.phase.end - Date.now()); s.phase.paused = true; } }),
    resume: () => edit(s => { if (s.phase.paused) { s.phase.end = Date.now() + (+s.phase.left || 0); s.phase.paused = false; } }),
    extend: ms => edit(s => { if (s.phase.paused) s.phase.left = Math.max(0, (+s.phase.left || 0) + ms); else s.phase.end += ms; }),
    reset: () => saveSite(merge(null)),
    setBox: (k, patch) => edit(s => { if (s.boxes[k]) Object.assign(s.boxes[k], patch); })
  };
  // ---- Home boxes (index.html only) ----
  const fmtN = n => Number(n).toLocaleString("en-US", { maximumFractionDigits: 6 });
  function applyBoxes() {
    const cfg = site().boxes;
    document.querySelectorAll(".cd-metric").forEach(a => {
      const lab = (a.querySelector(".cd-metric-label") || {}).textContent, key = Object.keys(BOXES).find(k => BOXES[k][0] === lab); if (!key) return;
      const c = cfg[key], el = document.getElementById(BOXES[key][1]), em = a.querySelector("em");
      a.style.display = c.show === false ? "none" : "";
      if (em && em.dataset.orig == null) em.dataset.orig = em.textContent;
      if (el && el.dataset.orig == null) el.dataset.orig = el.textContent;
      if (c.mode === "manual" && el) { el.textContent = fmtN(c.value); if (em) em.textContent = "Updated by admin" + (c.ts ? " · " + new Date(c.ts).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : ""); }
      else if (c.mode === "auto" && live && el && live[key] != null) { el.textContent = fmtN(live[key]); if (em) em.textContent = "Live data"; }
      else { if (el && el.dataset.orig != null) el.textContent = el.dataset.orig; if (em && em.dataset.orig != null) em.textContent = em.dataset.orig; }
    });
  }
  async function pull() {
    const e1 = window.ZENVYRO_SETTINGS_ENDPOINT, e2 = window.ZENVYRO_STATS_ENDPOINT;
    try { if (e1) { const r = await fetch(e1, { cache: "no-store", headers: { Accept: "application/json" } }); if (r.ok) remote = await r.json(); } } catch (e) {}
    try { if (e2) { const r = await fetch(e2, { cache: "no-store", headers: { Accept: "application/json" } }); if (r.ok) { const j = await r.json(), ok = ["totalIncome", "totalWithdraw", "normalUsers", "coveredCountries"].every(f => Number.isFinite(+j[f]) && +j[f] >= 0); if (ok) live = { income: +j.totalIncome, withdraw: +j.totalWithdraw, normal: +j.normalUsers, countries: +j.coveredCountries }; } } } catch (e) {}
  }
  function start() { if (!document.querySelector(".cd-metric")) return; pull().then(applyBoxes); setInterval(applyBoxes, 1500); setInterval(pull, 60000); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
