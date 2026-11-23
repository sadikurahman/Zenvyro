/* Zenvyro Home data layer (sections 1, 2 and 3 of the new Home).
   Real values already come from the app: Account Balance, Total mined, ZNV Coin (mining.js), Total Referrals (referral.js), pack/membership (mining.js),
   Covered Countries (countries.js) and the network boxes in Admin > Home Boxes (site-settings.js).
   Everything else below is DEMO data, written in one place (DEMO). When the backend (Supabase) is connected, nothing on the page has to change:
     - set window.ZENVYRO_HOME_ENDPOINT to a JSON URL (same keys as DEMO, any subset; polled every 60 s), or
     - call ZenvyroHome.set({ ...same keys... }) from your own code after you load the rows.
   Keys: rate, reach{months,target}, referralUsdt, notifications[{title,text,date}], news[{title,text,date}], activity[{title,sub,amt,when}],
         network{income,withdraw,users,goal}.  Set window.ZENVYRO_HOME_DEMO = false to start with empty values instead of the demo ones. */
(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const SEEN = "zenvyro_notif_seen", NEWS_SEEN = "zenvyro_news_seen";
  const lget = k => { try { return +localStorage.getItem(k) || 0; } catch (e) { return 0; } };
  const lset = (k, v) => { try { localStorage.setItem(k, String(v)); } catch (e) {} };
  const N = (n, d) => Number(n || 0).toLocaleString("en-US", { maximumFractionDigits: d == null ? 2 : d, minimumFractionDigits: 0 });
  const N2 = n => Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const DEMO = {
    rate: 3,
    reach: { months: 2, target: 10 },
    referralUsdt: 0,
    notifications: [{ title: "Welcome to Zenvyro", text: "Your Free pack is active. Start mining from the Mining Overview and invite friends from Invite.", date: "Today" }],
    news: [{ title: "Welcome to Zenvyro", text: "Mining, the NFT Marketplace, Referral and Leaderboard are running in demo mode while the backend is being connected.", date: "Today" }],
    activity: [{ title: "Mining Reward", sub: "Daily mining reward received", amt: "+0.0000 ZNV", when: "Today, just now" }],
    network: { income: 18425.5, withdraw: 6240, users: 12840, goal: 30000000 }
  };
  const EMPTY = { rate: 3, reach: { months: 0, target: 10 }, referralUsdt: 0, notifications: [], news: [], activity: [], network: { income: 0, withdraw: 0, users: 0, goal: 30000000 } };
  const clone = o => JSON.parse(JSON.stringify(o));
  const merge = (a, b) => {
    Object.keys(b || {}).forEach(k => {
      if (b[k] && typeof b[k] === "object" && !Array.isArray(b[k]) && a[k] && typeof a[k] === "object" && !Array.isArray(a[k])) merge(a[k], b[k]);
      else a[k] = b[k];
    });
    return a;
  };
  let D = merge(clone(window.ZENVYRO_HOME_DEMO === false ? EMPTY : DEMO), window.ZENVYRO_HOME || {});
  if (!Array.isArray(window.ZENVYRO_NEWS)) window.ZENVYRO_NEWS = D.news;   // Update News reads this array

  const put = (id, v) => { const e = $(id); if (e && e.textContent !== v) e.textContent = v; };
  const putBox = (id, v) => { const e = $(id); if (!e) return; if (e.textContent !== v) e.textContent = v; e.dataset.orig = v; };   // keeps Admin "Home Boxes" auto mode in sync
  const M = () => (window.ZenvyroMining && window.ZenvyroMining.getState && window.ZenvyroMining.getState()) || null;

  function renderNetwork() {
    const n = D.network || {}, rate = +D.rate || 3;
    putBox("cdIncome", N(n.income)); putBox("cdWithdraw", N(n.withdraw)); putBox("cdNormalUsers", N(n.users, 0));
    const cap = $("cdIncomeCaption"); if (cap) { const t = "+" + N2((+n.income || 0) * rate) + " USDT - reference only"; if (cap.textContent !== t) cap.textContent = t; cap.dataset.orig = t; }
    renderGoal();
  }
  function renderGoal() {
    const goal = +(D.network && D.network.goal) || 0, el = $("cdCurrentBalance"), bal = el ? parseFloat(String(el.textContent).replace(/,/g, "")) || 0 : 0;
    const pct = goal > 0 ? Math.max(0, Math.min(100, bal / goal * 100)) : 0;
    put("cdGoalTxt", N(goal, 0)); put("cdGoalPercent", pct.toFixed(2) + "% reached"); put("cdRemaining", N(Math.max(0, goal - bal), 6) + " ZNV");
    const bar = $("cdGoalBar"); if (bar) { const w = pct + "%"; if (bar.style.width !== w) bar.style.width = w; }
  }
  function renderStats() {
    put("zhRate", "1 ZNV = " + N(D.rate, 6) + " USDT");
    const r = D.reach || {}, mo = +r.months || 0;
    put("zhReach", mo === 1 ? "1 Month" : N(mo, 1) + " Months"); put("zhReachSub", "To reach $" + N(r.target, 2));
    const st = M(), tier = (st && st.tier) || "Free";
    put("zhPack", tier + " Pack"); put("zhTier", tier); put("zhTierSt", "Active");
    const rc = window.ZenvyroReferral && window.ZenvyroReferral.count ? window.ZenvyroReferral.count() : 0;
    put("zhRefCount", N(rc, 0)); put("zhRefUsdt", "+" + N2(D.referralUsdt) + " USDT");
  }
  const RCH = '<svg viewBox="0 0 12 12" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 2l4 4-4 4"/></svg>';
  function renderActivity() {
    const box = $("zhActList"); if (!box) return;
    const list = Array.isArray(D.activity) ? D.activity.slice(0, 3) : [];
    const h = list.length ? list.map(a => `<div class="zh-ai"><span class="zh-az">${esc(String(a.icon || a.title || "Z").charAt(0).toUpperCase())}</span><div class="zh-am"><b>${esc(a.title)}</b><span>${esc(a.sub)}</span></div><div class="zh-ar"><b>${esc(a.amt)}</b><span>${esc(a.when)}</span></div>${RCH}</div>`).join("") : '<div class="zh-aempty">No activity yet.</div>';
    if (box.dataset.h !== h) { box.dataset.h = h; box.innerHTML = h; }
  }
  function renderDots() {
    const dot = $("zhBellDot"); if (dot) dot.classList.toggle("on", (D.notifications || []).length > lget(SEEN));
    const nd = $("zvhNewsDot"); if (nd) nd.style.display = (Array.isArray(window.ZENVYRO_NEWS) ? window.ZENVYRO_NEWS.length : 0) > lget(NEWS_SEEN) ? "block" : "none";
  }
  function renderName() {
    const h = document.querySelector(".welcome h1"); if (!h) return;
    if (!h.querySelector(".zh-sp") && /✦\s*$/.test(h.textContent)) {   // the gold sparkle; other scripts keep writing "Name ✦" and this re-wraps it
      const name = h.textContent.replace(/\s*✦\s*$/, "").trim(), sp = document.createElement("span");
      sp.className = "zh-sp"; sp.textContent = "✦"; h.textContent = name; h.appendChild(sp);
    }
    const nm = h.textContent.replace("✦", "").trim(), av = $("zhAvatar"), ch = (nm.charAt(0) || "Z").toUpperCase();
    if (av && av.textContent !== ch) av.textContent = ch;
  }
  function render() { renderNetwork(); renderStats(); renderActivity(); renderDots(); renderName(); }

  function listHtml(rows) {
    return '<div class="modal-list">' + rows.map(x => `<div style="display:block"><strong style="display:block">${esc(x.title)}</strong><span style="display:block;margin-top:4px;line-height:1.5">${esc(x.text || x.sub || "")}</span>${x.date || x.when ? `<small style="color:#8f8bd0">${esc(x.date || x.when)}${x.amt ? " · " + esc(x.amt) : ""}</small>` : ""}</div>`).join("") + "</div>";
  }
  function bell() {
    const n = D.notifications || [];
    if (typeof window.openModal === "function") window.openModal("Notifications", n.length ? listHtml(n) : '<div class="modal-note">No new notifications.</div>');
    lset(SEEN, n.length); renderDots();
  }
  function actAll() {
    const a = D.activity || [];
    if (typeof window.openModal === "function") window.openModal("Recent Activity", a.length ? listHtml(a.map(x => ({ title: x.title, text: x.sub, when: x.when, amt: x.amt }))) : '<div class="modal-note">No activity yet.</div>');
  }

  async function pull() {
    const ep = window.ZENVYRO_HOME_ENDPOINT; if (!ep) return;
    try { const r = await fetch(ep, { cache: "no-store", headers: { Accept: "application/json" } }); if (r.ok) set(await r.json()); } catch (e) {}
  }
  function set(patch) {
    if (!patch || typeof patch !== "object") return;
    merge(D, patch);
    if (Array.isArray(patch.news)) window.ZENVYRO_NEWS = D.news;
    render();
  }

  function start() {
    Object.assign(window, { zvhBell: bell, zvhActAll: actAll });
    window.ZenvyroHome = { data: () => D, set, refresh: pull };
    render(); setTimeout(render, 700); setTimeout(render, 2000);
    setInterval(() => { if (!document.hidden) { renderStats(); renderName(); } }, 2000);
    const cb = $("cdCurrentBalance"); if (cb && window.MutationObserver) new MutationObserver(renderGoal).observe(cb, { childList: true, characterData: true, subtree: true });
    const h = document.querySelector(".welcome h1"); if (h && window.MutationObserver) new MutationObserver(renderName).observe(h, { childList: true, characterData: true, subtree: true });
    pull(); setInterval(pull, 60000);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
