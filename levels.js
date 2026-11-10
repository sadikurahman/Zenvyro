/* Zenvyro — Level progress + Team list (frontend UI only).
   DEMO = true shows sample numbers so you can see the design. Set it to false for the real site:
   then Team shows only what window.ZENVYRO_TEAM_ENDPOINT returns, and progress comes from
   window.ZenvyroLevel.setTotals(own, team) (the server must decide the Upgrade and the bonus). */
(() => {
  "use strict";
  const DEMO = true;
  const KEY = "zenvyro_level_v1", MAX = 8;
  // Level plan. own / team = target to reach THAT level (own NFT OR team NFT, 2 layers). boost = extra mining % added at that level (adds up).
  // wd = withdrawals per month (0 = unlimited). extra = perks of that level only. Level 1 needs any premium pack.
  const LV = {
    1: { wd: 1, boost: 0, extra: [] },
    2: { own: 945, team: 3780, boost: 7, wd: 2, extra: [] },
    3: { own: 2520, team: 12600, boost: 15, wd: 3, extra: [] },
    4: { own: 9450, team: 47250, boost: 25, wd: 4, extra: [] },
    5: { own: 31500, team: 94500, boost: 40, wd: 6, extra: ["630 TRX monthly bonus"] },
    6: { own: 78750, team: 220500, boost: 70, wd: 0, extra: ["1,575 TRX monthly salary", "Country Manager"] },
    7: { own: 157500, team: 630000, boost: 100, wd: 0, extra: ["4,725 TRX monthly salary", "National Co-founder", "1% company profit share"] },
    8: { own: 630000, team: 3150000, boost: 300, wd: 0, extra: ["Global Partner", "4% company profit share (3% + 1%)"] }
  };
  const tierName = () => { try { return (window.ZenvyroMining && window.ZenvyroMining.getState().tier) || "Free"; } catch (e) { return "Free"; } };
  const cum = n => { let t = 0; for (let i = 2; i <= n; i++) t += LV[i].boost; return t; };
  const wdText = n => LV[n].wd ? `${LV[n].wd} withdrawal${LV[n].wd > 1 ? "s" : ""} per month` : "Unlimited withdrawals";
  const nowList = n => n < 1 ? ["Purchase commission only", "Referral commission is locked"]
    : ["Referral commission by your pack", wdText(n)].concat(cum(n) ? [`+${cum(n)}% total mining speed`] : [], LV[n].extra);
  const nextList = n => n === 1 ? ["Referral commission unlocked", wdText(1)]
    : [`+${LV[n].boost}% mining speed (total +${cum(n)}%)`, wdText(n)].concat(LV[n].extra);
  const DEMO_TEAM = [
    { id: "ZNV-889301", name: "Rohan Ahmed", level: 3, own: 315, team: 1260 },
    { id: "ZNV-774120", name: "Tanvir Islam", level: 2, own: 160, team: 2050 },
    { id: "ZNV-662908", name: "Hasan Mahmud", level: 2, own: 80, team: 570 },
    { id: "ZNV-551744", name: "Sakib Hossain", level: 1, own: 32, team: 280 },
    { id: "ZNV-430215", name: "Habib Rahman", level: 1, own: 32, team: 0 }
  ];
  const I = {
    gift: '<rect x="3.5" y="9" width="17" height="11" rx="1.5"/><path d="M12 9v11M3.5 13.5h17"/><path d="M12 9c-3 0-5-1-5-3a2 2 0 0 1 4-.5C11.7 7 12 9 12 9zm0 0c3 0 5-1 5-3a2 2 0 0 0-4-.5C12.3 7 12 9 12 9z"/>',
    unlock: '<rect x="5" y="10.5" width="14" height="10" rx="2.2"/><path d="M8 10.5V8a4 4 0 0 1 7.6-1.7"/>',
    check: '<path d="M5 12.5l4.2 4.2L19 7"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4.5 21c0-4.2 3.3-6.8 7.5-6.8s7.5 2.6 7.5 6.8"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6"/><circle cx="17" cy="9" r="2.6"/><path d="M17.5 14.2c2.4.2 4 2 4 4.8"/>',
    up: '<path d="M12 19V6M6 11l6-6 6 6"/>'
  };
  const ic = n => `<svg class="zl-i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[n]}</svg>`;
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fmt = n => (+n || 0).toLocaleString("en-US", { maximumFractionDigits: 2 });

  const css = `
.zl{color:#fff}.zl-i{width:1em;height:1em;display:block;flex-shrink:0}
.zl-h{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;font-weight:800;font-size:17px}
.zl-h span{border:1px solid #9a5cff;background:#1a1058;color:#e0d2ff;border-radius:16px;padding:3px 11px;font-size:12px;font-weight:700}
.zl-bar{border:1px solid #4a32a8;border-radius:16px;background:#120c40;padding:12px;margin-bottom:8px}
.zl-bt{display:flex;justify-content:space-between;gap:8px;font-size:13px;color:#cfc4ff}.zl-bt b{color:#fff;white-space:nowrap}
.zl-tr{height:10px;border-radius:8px;background:#0a0720;border:1px solid #2e1d7a;margin-top:9px;overflow:hidden}
.zl-tr i{display:block;height:100%;border-radius:8px;background:linear-gradient(90deg,#6b32ff,#cda5ff);box-shadow:0 0 12px #8a3dff;transition:width .6s ease}
.zl-bar small{display:block;color:#aeb9ff;font-size:11px;margin-top:7px}
.zl-or{text-align:center;color:#b7a8ff;font-size:12px;margin:2px 0 8px}
.zl-sec{font-weight:800;font-size:15px;margin:14px 0 8px}
.zl-ben{display:flex;gap:10px;align-items:center;border:1px solid #5a35d8;border-radius:14px;background:linear-gradient(135deg,#150c4e,#0b0830);padding:10px 12px;margin-bottom:8px;font-size:14px}
.zl-ben .zl-i{font-size:22px;color:#ffd36b}
.zl-up{width:100%;margin-top:10px;border:0;border-radius:16px;padding:14px;font-weight:800;font-size:15px;color:#fff;background:linear-gradient(135deg,#7a3dff,#b28aff);box-shadow:0 0 20px #8a3dff80}
.zl-up:disabled{opacity:.45;box-shadow:none}
.zl-dm{display:flex;gap:8px;margin-top:10px}.zl-dm button{flex:1;border:1px dashed #6b45d8;background:none;color:#cfc4ff;border-radius:12px;padding:9px 4px;font-size:12px}
.zl-note{color:#aeb9ff;font-size:12px;margin-top:10px;line-height:1.45}
.zl-win{position:relative;text-align:center;padding:26px 6px 8px;overflow:hidden}
.zl-ring{width:92px;height:92px;margin:0 auto 14px;border-radius:50%;display:grid;place-items:center;font-size:44px;color:#ffd36b;border:3px solid #ffd36b;background:#2a1d08;box-shadow:0 0 30px #d8a93a99;animation:zlPop .7s cubic-bezier(.2,1.4,.4,1) both}
.zl-ring:after{content:"";position:absolute;width:92px;height:92px;border-radius:50%;border:2px solid #cda5ff;animation:zlWave 1.4s ease-out 2}
.zl-win h3{margin:0 0 6px;font-size:22px}.zl-win p{margin:0 0 4px;color:#cfc4ff}.zl-win b.g{color:#2bf0b0;font-size:20px}
.zl-cf{position:absolute;left:50%;top:70px;width:8px;height:8px;border-radius:2px;background:#cda5ff;animation:zlCf 1.6s ease-out both}
.zl-sum{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px}
.zl-sum div{border:1px solid #5a35d8;border-radius:16px;background:linear-gradient(135deg,#150c4e,#0b0830);padding:10px 12px;display:flex;gap:10px;align-items:center}
.zl-sum .zl-i{font-size:24px;color:#b28aff}.zl-sum small{display:block;color:#c8b8ff;font-size:11px}.zl-sum b{font-size:18px}
.zl-m{display:flex;gap:10px;align-items:center;border:1px solid #4a32a8;border-radius:16px;background:linear-gradient(135deg,#150c4e,#0b0830);padding:10px;margin-bottom:8px}
.zl-rk{width:34px;height:34px;border-radius:50%;border:2px solid #6b45d8;display:grid;place-items:center;font-weight:800;flex-shrink:0}
.zl-m:nth-child(1) .zl-rk{border-color:#ffd36b;color:#ffd36b}.zl-m:nth-child(2) .zl-rk{border-color:#d9d9e6;color:#d9d9e6}.zl-m:nth-child(3) .zl-rk{border-color:#e08a4a;color:#e08a4a}
.zl-av{width:44px;height:44px;border-radius:50%;border:2px solid #9a5cff;background:#1a1058;display:grid;place-items:center;font-size:24px;color:#b28aff;flex-shrink:0}
.zl-w{min-width:0;flex:1}.zl-w b{display:block;font-size:14px;overflow-wrap:anywhere}
.zl-lp{display:inline-block;margin:3px 6px 0 0;border:1px solid #9a5cff;border-radius:12px;background:#1a1058;color:#e0d2ff;padding:1px 9px;font-size:11px}
.zl-id{font-size:11px;color:#aeb9ff}
.zl-r{text-align:right;font-size:11.5px;color:#c8b8ff;line-height:1.5;white-space:nowrap}.zl-r b{color:#fff}
.zl-empty{border:1px dashed #4a32a8;border-radius:14px;padding:18px;text-align:center;color:#b9b2ee;font-size:14px}
.zl-ben .zl-i{font-size:20px}
#zvAccount .pt{gap:8px;align-items:center}
#zvAccount .zv-lvb{display:inline-flex;align-items:center;gap:4px;border:1px solid #9a5cff;border-radius:16px;background:#1a1058;color:#e0d2ff;padding:4px 10px;font-size:11px;font-weight:700;line-height:1.2;box-shadow:0 0 10px #8a3dff55}
@keyframes zlPop{from{transform:scale(.2);opacity:0}to{transform:scale(1);opacity:1}}
@keyframes zlWave{from{transform:scale(1);opacity:.9}to{transform:scale(2.2);opacity:0}}
@keyframes zlCf{from{transform:translate(0,0) rotate(0);opacity:1}to{transform:translate(var(--x),var(--y)) rotate(300deg);opacity:0}}
@media(prefers-reduced-motion:reduce){.zl-ring,.zl-ring:after,.zl-cf{animation:none}.zl-tr i{transition:none}}`;
  const style = document.createElement("style"); style.textContent = css; document.head.appendChild(style);

  // ---- level state ----
  const load = () => {
    try {
      const s = JSON.parse(localStorage.getItem(KEY) || "null");
      if (s) return { lvl: Math.min(MAX, Math.max(0, Math.floor(+s.lvl) || 0)), own: Math.max(0, +s.own || 0), team: Math.max(0, +s.team || 0), pack: !!s.pack };
    } catch (e) {}
    return { lvl: 0, own: 0, team: 0, pack: false };
  };
  let st = load();
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} };
  const syncBadge = () => document.querySelectorAll(".zv-lvb b").forEach(e => { e.textContent = st.lvl; });
  const modalOpen = () => { const m = document.getElementById("modalBackdrop"); return m && m.classList.contains("open"); };

  function levelBody() {
    const n = st.lvl + 1, last = st.lvl >= MAX;
    const li = (a, i) => a.map(t => `<div class="zl-ben">${ic(i)}<span>${esc(t)}</span></div>`).join("");
    const note = `<div class="zl-note">Progress starts from zero after every level. Benefits are plan details, not guaranteed income, and follow the Terms.</div>`;
    let h = `<div class="zl"><div class="zl-h">Level ${st.lvl}<span>Your current level</span></div><div class="zl-sec" style="margin-top:0">Your Benefits</div>${li(nowList(st.lvl), "check")}`;
    if (last) return h + `<div class="zl-empty">You have reached the highest level.</div>${note}</div>`;
    const bar = (label, v, max, sub) => `<div class="zl-bar"><div class="zl-bt"><span>${label}</span><b>${fmt(Math.min(v, max))} / ${fmt(max)} TRX</b></div><div class="zl-tr"><i style="width:${Math.min(100, v / max * 100)}%"></i></div><small>${sub}</small></div>`;
    let ready, prog;
    if (st.lvl === 0) {
      ready = tierName() !== "Free" || (DEMO && st.pack);
      prog = `<div class="zl-bar"><div class="zl-bt"><span>Premium Pack</span><b>${ready ? "Done" : "Needed"}</b></div><small>Buy any NFT pack to reach Level 1. Your pack: ${esc(tierName())}</small></div>${ready ? "" : '<button class="zl-up" style="margin-top:0" onclick="closeModal();showSection(\'membership\')">View Packs</button>'}`;
    } else {
      const t = LV[n]; ready = st.own >= t.own || st.team >= t.team;
      prog = bar("Own NFT Investment", st.own, t.own, "Your own NFT purchases") + `<div class="zl-or">Complete any one target to level up</div>` + bar("Team Investment", st.team, t.team, "NFT purchases by your team (Layer 1 + Layer 2)");
    }
    return h + `<div class="zl-sec">Progress to Level ${n}</div>${prog}
      <div class="zl-sec">Next Level Benefits (Level ${n})</div>${li(nextList(n), "up")}
      <button class="zl-up" ${ready ? "" : "disabled"} onclick="zvLvUp()">Upgrade to Level ${n}</button>
      ${DEMO ? `<div class="zl-dm">${st.lvl === 0 ? `<button onclick="zvLvDemo('pack')">Demo: pretend pack bought</button>` : `<button onclick="zvLvDemo('own')">Demo: +315 TRX own</button><button onclick="zvLvDemo('team')">Demo: +1000 TRX team</button>`}</div><div class="zl-note">Demo mode: sample numbers only.</div>` : ""}${note}</div>`;
  }

  function winBody(n) {
    let cf = "";
    for (let i = 0; i < 16; i++) {
      const a = i / 16 * Math.PI * 2, d = 90 + (i % 3) * 25;
      cf += `<span class="zl-cf" style="--x:${Math.round(Math.cos(a) * d)}px;--y:${Math.round(Math.sin(a) * d)}px;background:${i % 2 ? "#ffd36b" : "#cda5ff"};animation-delay:${(i % 4) * 60}ms"></span>`;
    }
    const items = nextList(n).map(t => `<div class="zl-ben">${ic("check")}<span>${esc(t)}</span></div>`).join("");
    return `<div class="zl"><div class="zl-win">${cf}<div class="zl-ring">${ic("up")}</div><h3>Level ${n} Complete</h3><p>You are now on Level ${n}</p></div>${items}
      <button class="zl-up" onclick="zvaLevel()">Continue</button></div>`;
  }

  function openLevel() { window.openModal("Level", levelBody()); }
  function upgrade() {
    if (st.lvl >= MAX) return;
    const n = st.lvl + 1;
    const ready = st.lvl === 0 ? (tierName() !== "Free" || (DEMO && st.pack)) : (st.own >= LV[n].own || st.team >= LV[n].team);
    if (!ready) return;
    st = { lvl: n, own: 0, team: 0, pack: st.pack }; save(); syncBadge();
    document.getElementById("modalBody").innerHTML = winBody(n);
  }
  function demoAdd(kind) {
    if (!DEMO) return;
    if (kind === "pack") st.pack = true; else if (kind === "own") st.own += 315; else st.team += 1000;
    save(); document.getElementById("modalBody").innerHTML = levelBody();
  }

  // ---- Team (direct referrals who bought an NFT) ----
  async function getMembers() {
    if (DEMO) return DEMO_TEAM;
    const u = window.ZENVYRO_TEAM_ENDPOINT;
    if (!u) return [];
    try {
      const r = await fetch(u, { headers: { Accept: "application/json" }, cache: "no-store" });
      if (!r.ok) throw new Error("bad status");
      const j = await r.json();
      return (Array.isArray(j.members) ? j.members : []).slice(0, 200).map(m => ({
        id: String(m.id || ""), name: String(m.name || "Member"),
        level: Math.min(MAX, Math.max(0, Math.floor(+m.level) || 0)), own: Math.max(0, +m.own || 0), team: Math.max(0, +m.team || 0)
      }));
    } catch (e) { return null; }
  }
  function teamBody(list) {
    if (list === null) return `<div class="zl"><div class="zl-empty">Could not load your team. Please try again later.</div></div>`;
    const ms = list.filter(m => m.own > 0); // only members who bought an NFT are listed
    const vol = ms.reduce((s, m) => s + m.own + m.team, 0);
    const rows = ms.map((m, i) => `<div class="zl-m"><div class="zl-rk">${i + 1}</div><div class="zl-av">${ic("user")}</div>
      <div class="zl-w"><b>${esc(m.name)}</b><span class="zl-lp">Level ${m.level}</span><span class="zl-id">${esc(m.id)}</span></div>
      <div class="zl-r">Your NFT: <b>${fmt(m.own)} TRX</b><br>Team NFT: <b>${fmt(m.team)} TRX</b></div></div>`).join("");
    return `<div class="zl"><div class="zl-sum"><div>${ic("users")}<span><small>Direct Referrals</small><b>${ms.length}</b></span></div><div>${ic("gift")}<span><small>Total Team Volume</small><b>${fmt(vol)} TRX</b></span></div></div>
      <div class="zl-sec">Your Direct Referrals</div>
      ${rows || '<div class="zl-empty">No direct referral has bought an NFT yet.</div>'}
      <div class="zl-note">Only members who bought an NFT are listed. Team NFT is the volume of the members they referred (Layer 2).${DEMO ? " Demo mode: sample data only." : ""}</div></div>`;
  }
  async function openTeam() {
    window.openModal("Team", '<div class="zl"><div class="zl-empty">Loading team...</div></div>');
    const list = await getMembers();
    if (modalOpen() && document.getElementById("modalTitle").textContent === "Team") document.getElementById("modalBody").innerHTML = teamBody(list);
  }

  window.ZenvyroLevel = {
    get: () => Object.assign({}, st),
    setTotals(own, team) { st.own = Math.max(0, +own || 0); st.team = Math.max(0, +team || 0); save(); if (modalOpen() && document.querySelector("#modalBody .zl-up")) document.getElementById("modalBody").innerHTML = levelBody(); }
  };
  Object.assign(window, { zvaLevel: openLevel, zvLvUp: upgrade, zvLvDemo: demoAdd, zvaTeam: openTeam });
})();
