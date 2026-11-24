/* Zenvyro — Tasks page (the "Tasks" item in the bottom menu, where Mining used to be; Mining stays on Home under "Mining Overview").
   Demo: the task list below (DEMO) and each member's progress are kept in this browser. Rewards are small placeholder amounts.
   When the backend (Supabase) is connected, nothing on the page has to change:
     - set window.ZENVYRO_TASKS_ENDPOINT to a JSON URL that returns an array of tasks (same fields as DEMO, polled every 60 s), or call ZenvyroTasks.set([...]);
     - define window.ZENVYRO_TASK_CLAIM = async id => true/false, so the server decides and pays the reward (the demo credit is skipped then).
   Task fields: id, type "daily" | "once", icon "cal" | "user" | "chat" | "gem", title, desc, reward (ZNV), kind "claim" (claim directly) |
   "referral" (needs `need` referrals) | "visit" (press Go first, then Claim), go "invite" | "community" | "market" | "board" | an https link. */
(() => {
  "use strict";
  const KEY = "zenvyro_tasks_v1";
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const r2 = n => Math.round(n * 100) / 100;
  const u = n => `calc(${r2(n)} * var(--u))`;
  const z = n => `max(10px, ${u(n)})`;
  const day = () => { const d = new Date(); return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate(); };
  const fz = n => (+n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 6 });

  const DEMO = [
    { id: "checkin", type: "daily", icon: "cal", title: "Daily Check-in", desc: "Check in once every day.", reward: 0.05, kind: "claim" },
    { id: "invite", type: "once", icon: "user", title: "Invite a Friend", desc: "Get 1 friend to join with your referral link.", reward: 0.2, kind: "referral", need: 1, go: "invite" },
    { id: "community", type: "once", icon: "chat", title: "Join the Community", desc: "Open the community links and join us.", reward: 0.1, kind: "visit", go: "community" },
    { id: "market", type: "once", icon: "gem", title: "Explore the NFT Marketplace", desc: "Open the marketplace and have a look.", reward: 0.05, kind: "visit", go: "market" }
  ];
  let LIST = Array.isArray(window.ZENVYRO_TASKS) && window.ZENVYRO_TASKS.length ? window.ZENVYRO_TASKS : DEMO;
  let st = (() => { try { const o = JSON.parse(localStorage.getItem(KEY) || "{}"); return { done: (o && o.done) || {}, visited: (o && o.visited) || {} }; } catch (e) { return { done: {}, visited: {} }; } })();
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} };
  let root = null, lastHtml = "", busy = false;

  const IC = {
    cal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="5" width="17" height="15" rx="3"/><path d="M8 3v4M16 3v4M3.5 10h17M9 15l2.2 2.2L15.5 13"/></svg>',
    user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="9.5" cy="8" r="3.5"/><path d="M3 20c.6-3.6 3.2-5.5 6.5-5.5s5.9 1.9 6.5 5.5M18.5 8v6M15.5 11h6"/></svg>',
    chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h16v11H9l-5 4z"/><path d="M8.5 9.5h7M8.5 12.5h4"/></svg>',
    gem: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4h12l3 5-9 11L3 9z"/><path d="M3 9h18M9 4l3 5 3-5M12 9v11"/></svg>',
    ok: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>'
  };

  const refCount = () => (window.ZenvyroReferral && window.ZenvyroReferral.count ? +window.ZenvyroReferral.count() || 0 : 0);
  const isDone = t => { const r = st.done[t.id]; return !!r && (t.type !== "daily" || r.day === day()); };
  const stateOf = t => isDone(t) ? "done" : t.kind === "claim" ? "claim" : t.kind === "referral" ? (refCount() >= (+t.need || 1) ? "claim" : "go") : (st.visited[t.id] ? "claim" : "go");

  function injectCss() {
    if ($("tkCss")) return;
    const s = document.createElement("style"); s.id = "tkCss";
    s.textContent = `
#zvTasks{--u:calc(min(100vw,560px)/414);position:fixed;inset:0;z-index:4;display:none;overflow-y:auto;overflow-x:hidden;-webkit-overflow-scrolling:touch;color:#fff;font-family:Inter,system-ui,-apple-system,"Segoe UI",sans-serif;
padding:calc(${u(14)} + env(safe-area-inset-top,0px)) ${u(14)} calc(120px + env(safe-area-inset-bottom,0px));background:radial-gradient(ellipse at 50% 0,#211052 0,#09071c 44%,#050511 100%)}
#zvTasks.open{display:block}
#zvTasks *{box-sizing:border-box}
#zvTasks .tk{max-width:560px;margin:0 auto}
#zvTasks h1{margin:${u(6)} 0 0;font-size:${u(26)};line-height:${u(32)};font-weight:800;letter-spacing:-.3px}
#zvTasks .sub{margin:${u(4)} 0 ${u(16)};font-size:${z(13)};color:#b9aef0}
#zvTasks .bd{position:relative}
#zvTasks .bd:before{content:"";position:absolute;inset:0;border-radius:inherit;padding:${u(1.5)};background:var(--bd,linear-gradient(135deg,#b58cff,#3b1aa0 45%,#8a4dff));-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);mask-composite:exclude;pointer-events:none}
#zvTasks .sm{display:flex;align-items:center;gap:${u(14)};padding:${u(14)} ${u(16)};border-radius:${u(22)};background:linear-gradient(120deg,#240a6a 0%,#0a0430 45%,#100650 100%);box-shadow:0 0 ${u(16)} #8a3dff55,inset 0 0 ${u(18)} #6a1be855;--bd:linear-gradient(120deg,#ffe0f0,#e060f8 18%,#8a3aff 40%,#4a22d0 65%,#ff9dff)}
#zvTasks .ring{position:relative;flex:none;width:${u(62)};height:${u(62)}}
#zvTasks .ring svg{width:100%;height:100%;transform:rotate(-90deg)}
#zvTasks .ring circle{fill:none;stroke-width:6;stroke-linecap:round}
#zvTasks .ring .tr{stroke:#2a1a78}#zvTasks .ring .pg{stroke:url(#tkg);transition:stroke-dashoffset .5s}
#zvTasks .ring b{position:absolute;inset:0;display:grid;place-items:center;font-size:${z(15)};font-weight:800}
#zvTasks .sm .tx{flex:1;min-width:0}
#zvTasks .sm small{display:block;font-size:${z(11.5)};color:#b9aef0}
#zvTasks .sm strong{display:block;margin-top:${u(3)};font-size:${u(22)};line-height:${u(27)};font-weight:800;color:#ffc72c;white-space:nowrap}
#zvTasks .sm span{display:block;margin-top:${u(2)};font-size:${z(11.5)};color:#cfc8ee}
#zvTasks h2{margin:${u(22)} 0 ${u(10)} ${u(4)};font-size:${z(12)};letter-spacing:.14em;text-transform:uppercase;font-weight:700;color:#a99bd9}
#zvTasks .c{display:flex;align-items:center;gap:${u(12)};margin:0 0 ${u(11)};padding:${u(12)} ${u(12)} ${u(12)} ${u(12)};border-radius:${u(18)};background:linear-gradient(150deg,#0b0538,#03011f 60%,#0a0440);box-shadow:0 0 ${u(12)} #5a2cd033,inset 0 0 ${u(14)} #4a1fc044;--bd:linear-gradient(135deg,#7a4ad0,#2a1070 40%,#4a22b0 70%,#9a62f0)}
#zvTasks .c.dn{opacity:.78}
#zvTasks .ti{flex:none;display:grid;place-items:center;width:${u(44)};height:${u(44)};border-radius:50%;color:#d9c2ff;background:radial-gradient(circle at 35% 28%,#4a2aa8,#1a0c5a 70%);border:1px solid #6a4ad8;box-shadow:0 0 ${u(12)} #6a3ce066}
#zvTasks .ti svg{width:${u(22)};height:${u(22)}}
#zvTasks .c.dn .ti{color:#4ef0b0;border-color:#1b8a64}
#zvTasks .m{flex:1;min-width:0}
#zvTasks .m b{display:block;font-size:${z(13.5)};line-height:1.25;font-weight:700}
#zvTasks .m span{display:block;margin-top:${u(3)};font-size:${z(11)};line-height:1.35;color:#b7a7f0}
#zvTasks .m em{display:inline-block;margin-top:${u(6)};padding:${u(2)} ${u(9)};border-radius:99px;border:1px solid #8a6a1b;background:#2d2208;font-style:normal;font-size:${z(10.5)};font-weight:700;color:#ffc72c}
#zvTasks .pb{height:${u(5)};margin-top:${u(7)};border-radius:99px;background:#1c1260;overflow:hidden}
#zvTasks .pb i{display:block;height:100%;border-radius:99px;background:linear-gradient(90deg,#8d42ff,#e060f8)}
#zvTasks .b{flex:none;min-width:${u(76)};height:${u(34)};padding:0 ${u(12)};border-radius:99px;border:0;font-family:inherit;font-size:${z(12)};font-weight:700;color:#fff;cursor:pointer;-webkit-tap-highlight-color:transparent;display:flex;align-items:center;justify-content:center;gap:${u(4)}}
#zvTasks .b svg{width:${u(14)};height:${u(14)}}
#zvTasks .b.go{background:#160a52;border:1.3px solid #6a4ad8}
#zvTasks .b.claim{background:linear-gradient(90deg,#e03ffc,#8c20fb 50%,#4e82fc);box-shadow:0 0 ${u(14)} #8a3dff77}
#zvTasks .b.done{background:#082d22;border:1.3px solid #1b8a64;color:#4ef0b0;pointer-events:none}
#zvTasks .b[disabled]{opacity:.6;pointer-events:none}
#zvTasks .nt{margin:${u(14)} ${u(4)} 0;font-size:${z(11)};line-height:1.5;color:#8f8bd0}
#zvTasks .zt{position:fixed;left:50%;bottom:calc(96px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);max-width:88vw;background:#211747;border:1px solid #6e42cc;color:#fff;padding:12px 18px;border-radius:14px;font-size:14px;line-height:1.4;text-align:center;display:none}
#zvTasks .zt.on{display:block}`;
    document.head.appendChild(s);
  }

  function html() {
    const total = LIST.length, dn = LIST.filter(isDone).length, pct = total ? dn / total : 0;
    const earned = LIST.reduce((a, t) => { const r = st.done[t.id]; return a + (r && r.day === day() ? (+t.reward || 0) : 0); }, 0);
    const C = 2 * Math.PI * 26, off = C * (1 - pct);
    const card = t => {
      const s = stateOf(t), need = +t.need || 1, rc = refCount();
      const btn = s === "done" ? `<button class="b done" type="button" disabled>${IC.ok}Claimed</button>` : s === "claim" ? `<button class="b claim" type="button" data-tk="claim" data-id="${esc(t.id)}">Claim</button>` : `<button class="b go" type="button" data-tk="go" data-id="${esc(t.id)}">Go</button>`;
      const bar = t.kind === "referral" && s !== "done" ? `<div class="pb"><i style="width:${Math.min(100, rc / need * 100)}%"></i></div>` : "";
      return `<article class="c bd${s === "done" ? " dn" : ""}"><span class="ti">${IC[t.icon] || IC.gem}</span><div class="m"><b>${esc(t.title)}</b><span>${esc(t.desc)}${t.kind === "referral" ? " (" + Math.min(rc, need) + " / " + need + ")" : ""}</span><em>+${fz(t.reward)} ZNV</em>${bar}</div>${btn}</article>`;
    };
    const daily = LIST.filter(t => t.type === "daily"), once = LIST.filter(t => t.type !== "daily");
    return `<div class="tk"><h1>Tasks</h1><p class="sub">Complete tasks and earn ZNV.</p>
      <div class="sm bd"><div class="ring"><svg viewBox="0 0 62 62"><defs><linearGradient id="tkg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#b46bff"/><stop offset="1" stop-color="#ff7ad8"/></linearGradient></defs><circle class="tr" cx="31" cy="31" r="26"/><circle class="pg" cx="31" cy="31" r="26" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}"/></svg><b>${dn}/${total}</b></div>
        <div class="tx"><small>Earned today</small><strong>+${fz(earned)} ZNV</strong><span>${dn} of ${total} tasks completed</span></div></div>
      ${daily.length ? "<h2>Daily tasks</h2>" + daily.map(card).join("") : ""}${once.length ? "<h2>One-time tasks</h2>" + once.map(card).join("") : ""}
      <p class="nt">Reward amounts are demo values for now. They become real when the backend is connected.</p></div><div class="zt" id="tkToast" role="status"></div>`;
  }

  let tt = 0;
  const say = m => { const e = $("tkToast"); if (!e) { if (typeof window.toast === "function") window.toast(m); return; } e.textContent = m; e.classList.add("on"); clearTimeout(tt); tt = setTimeout(() => e.classList.remove("on"), 2400); };
  function render() {
    if (!root || !root.classList.contains("open")) return;
    const h = html(); if (h === lastHtml) return; lastHtml = h;
    const keep = root.scrollTop; root.innerHTML = h; root.scrollTop = keep;
  }
  function openTasks() {
    injectCss();
    if (!root) { root = document.createElement("div"); root.id = "zvTasks"; root.setAttribute("role", "region"); root.setAttribute("aria-label", "Tasks"); document.body.appendChild(root); }
    root.classList.add("open"); root.scrollTop = 0; lastHtml = ""; render();
  }
  function closeTasks() { if (root) root.classList.remove("open"); }

  function go(t) {
    const g = t.go;
    if (g === "invite" && typeof window.zvhInvite === "function") window.zvhInvite();
    else if (g === "community" && typeof window.zvhCommunity === "function") window.zvhCommunity();
    else if (g === "market" && typeof window.zvOpenMarket === "function") window.zvOpenMarket();
    else if (g === "board" && typeof window.zvhBoard === "function") window.zvhBoard();
    else if (/^https:\/\//.test(g || "")) window.open(g, "_blank", "noopener");
    if (t.kind === "visit") { st.visited[t.id] = true; save(); render(); setTimeout(render, 300); }
  }
  async function claim(t) {
    if (busy || isDone(t) || stateOf(t) !== "claim") return;
    busy = true;
    try {
      let ok = true;
      if (typeof window.ZENVYRO_TASK_CLAIM === "function") ok = !!(await window.ZENVYRO_TASK_CLAIM(t.id));       // the server pays
      else if (window.ZenvyroMining && window.ZenvyroMining.addZeny) window.ZenvyroMining.addZeny(+t.reward || 0);   // demo credit
      if (!ok) return say("Could not claim. Please try again.");
      st.done[t.id] = { ts: Date.now(), day: day() }; save(); render();
      say("+" + fz(t.reward) + " ZNV added to your balance");
    } catch (e) { say("Could not claim. Please try again."); }
    finally { busy = false; }
  }

  function set(list) { if (Array.isArray(list) && list.length) { LIST = list; render(); } }
  async function pull() { const ep = window.ZENVYRO_TASKS_ENDPOINT; if (!ep) return; try { const r = await fetch(ep, { cache: "no-store", headers: { Accept: "application/json" } }); if (r.ok) set(await r.json()); } catch (e) {} }

  function init() {
    window.ZenvyroTasks = { set, list: () => LIST.slice(), open: openTasks, refresh: pull };
    document.addEventListener("click", e => {
      const b = e.target.closest && e.target.closest("#zvTasks [data-tk]"); if (!b) return;
      const t = LIST.find(x => x.id === b.dataset.id); if (!t) return;
      if (b.dataset.tk === "go") go(t); else claim(t);
    });
    document.addEventListener("visibilitychange", () => { if (!document.hidden) render(); });
    addEventListener("storage", () => render());
    addEventListener("load", () => {
      const o = window.showSection;
      window.showSection = function (name) { if (name === "tasks") { openTasks(); return; } closeTasks(); return typeof o === "function" ? o.apply(this, arguments) : undefined; };
      const n = window.navActive;
      window.navActive = function (el) { const r = typeof n === "function" ? n.apply(this, arguments) : undefined; if (el && !/Tasks/.test(el.textContent || "")) closeTasks(); return r; };
    });
    pull(); setInterval(pull, 60000); setInterval(() => { if (!document.hidden) render(); }, 5000);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
