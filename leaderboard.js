/* Zenvyro — Leaderboard page: Top Referrals and Top NFT Holders (top 100 + Your Rank).
   DEMO = true shows SAMPLE members and says so on the page. For real data set window.ZENVYRO_LEADERBOARD_ENDPOINT:
   GET <endpoint>?type=ref|nft  ->  { list: [{ name, value }], myRank: number|null, myValue: number }   (the server ranks everyone) */
(() => {
  "use strict";
  const DEMO = true, LIMIT = 100;
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const num = n => Math.round(+n || 0).toLocaleString("en-US");
  let root = null, tab = "ref", token = 0;
  const I = {
    users: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="8" r="3.2"/><path d="M2.5 19c0-3.4 2.9-5.5 6.5-5.5s6.5 2.1 6.5 5.5z"/><circle cx="17" cy="9" r="2.4"/><path d="M16.5 13.6c3 0 5 1.7 5 4.4h-4.2c0-1.8-.3-3.2-.8-4.4z"/></svg>',
    gem: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 3h12l4 6-10 12L2 9z"/><path d="M2 9h20M8 3l-2 6 6 12 6-12-2-6" fill="none" stroke="#0b0824" stroke-width="1" opacity=".45"/></svg>',
    back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
    go: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    chev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>',
    gift: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="8" width="18" height="4" rx="1"/><path d="M5 12v8h14v-8M12 8v12M12 8c-2.5 0-4-1-4-2.5S9.5 3 11 4.5 12 8 12 8zm0 0c2.5 0 4-1 4-2.5S14.5 3 13 4.5 12 8 12 8z"/></svg>',
    crown: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z"/></svg>',
    trophy: '<svg class="t" viewBox="0 0 120 120"><defs><linearGradient id="lbg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff2a8"/><stop offset=".5" stop-color="#f5b82e"/><stop offset="1" stop-color="#a8680a"/></linearGradient></defs><path d="M35 14h50v26c0 18-11 31-25 31S35 58 35 40z" fill="url(#lbg)"/><path d="M35 22H20c0 18 8 28 20 30M85 22h15c0 18-8 28-20 30" fill="none" stroke="url(#lbg)" stroke-width="6" stroke-linecap="round"/><rect x="54" y="70" width="12" height="16" fill="url(#lbg)"/><path d="M38 104l6-18h32l6 18z" fill="url(#lbg)"/><path d="M60 24l4.5 9.5 10 1.2-7.4 7 2 10-9.1-5-9.1 5 2-10-7.4-7 10-1.2z" fill="#fff6cf"/></svg>'
  };
  const hue = s => { let h = 0; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) % 360; return h; };
  const av = (name, size, ring) => `<span class="lb-av" style="width:${size}px;height:${size}px;font-size:${Math.round(size * .42)}px;background:linear-gradient(145deg,hsl(${hue(name)} 70% 55%),hsl(${(hue(name) + 50) % 360} 70% 30%))${ring ? ";box-shadow:0 0 0 3px " + ring : ""}">${esc(String(name).slice(0, 1).toUpperCase())}</span>`;

  function rng(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function sample(k) {   // SAMPLE members, only for the demo
    const r = rng(k === "ref" ? 11 : 29), P = ["Crypto", "Zeny", "NFT", "Block", "Moon", "Star", "Dream", "Alpha", "Nova", "Cyber"], S = ["King", "Master", "Pro", "Legend", "Holder", "Builder", "Hunter", "Wolf", "Queen", "Team"], names = [];
    P.forEach(p => S.forEach(s => names.push(p + s)));
    for (let i = names.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [names[i], names[j]] = [names[j], names[i]]; }
    let v = k === "ref" ? 2750 : 125750, last = Infinity; const out = [];
    for (let i = 0; i < LIMIT; i++) { const x = Math.max(1, Math.min(last - 1, Math.round(v))); out.push({ name: names[i], value: x }); last = x; v *= (k === "ref" ? .965 : .945) - r() * .02; }
    return out;
  }
  const myValue = k => k === "ref" ? (window.ZenvyroReferral && window.ZenvyroReferral.count ? +window.ZenvyroReferral.count() || 0 : 0)
    : (window.ZenvyroNft && window.ZenvyroNft.totalPaid ? +window.ZenvyroNft.totalPaid() || 0 : 0);   // NFT value = every NFT bought, expired ones too
  const myName = () => (window.ZENVYRO_USER && window.ZENVYRO_USER.name) || "You";

  async function load(k) {
    const ep = window.ZENVYRO_LEADERBOARD_ENDPOINT, mv = myValue(k);
    if (ep) {
      try {
        const r = await fetch(ep + (ep.indexOf("?") >= 0 ? "&" : "?") + "type=" + k, { cache: "no-store" }); if (!r.ok) throw 0;
        const j = await r.json();
        return { list: (Array.isArray(j.list) ? j.list : []).slice(0, LIMIT).map(x => ({ name: String(x.name || "Member"), value: +x.value || 0 })), rank: +j.myRank || null, value: j.myValue != null ? +j.myValue : mv, demo: false };
      } catch (e) { return { list: [], rank: null, value: mv, demo: false, error: true }; }
    }
    if (!DEMO) return { list: [], rank: null, value: mv, demo: false, empty: true };
    const list = sample(k);
    return { list, rank: mv > 0 ? 1 + list.filter(x => x.value > mv).length : null, value: mv, demo: true };
  }

  const css = `
#zvBoard{position:fixed;inset:0;z-index:4;overflow-y:auto;-webkit-overflow-scrolling:touch;display:none;padding:calc(12px + env(safe-area-inset-top,0px)) 14px 200px;background:radial-gradient(ellipse at 50% 0,#2b1475 0,#0b0824 46%,#050511 100%);color:#fff}
#zvBoard.open{display:block}
#zvBoard .in{max-width:620px;margin:auto}
#zvBoard .hd{display:flex;align-items:center;justify-content:space-between}
#zvBoard .hd b{font-size:20px}
#zvBoard .ib{width:44px;height:44px;border-radius:50%;border:1px solid #6b45d8;background:#1b1050;color:#fff;display:grid;place-items:center;padding:0}
#zvBoard .ib svg{width:20px;height:20px}
#zvBoard .ib.cr{color:#c58bff;border-color:#4a2f9c}
#zvBoard .hero{text-align:center;padding:0 0 4px}
#zvBoard .hero .t{width:108px;height:108px;filter:drop-shadow(0 0 16px #ffb52e66)}
#zvBoard .hero h2{margin:-4px 0 4px;font-size:30px;letter-spacing:-.3px}#zvBoard .hero h2 span{color:#ffc933}
#zvBoard .hero p{margin:0;color:#cfc4ff;font-size:14px}
#zvBoard .dm{display:inline-block;margin-top:8px;font-size:11px;font-weight:700;color:#ffc24a;border:1px solid #a8791b;background:#2d2208;border-radius:12px;padding:3px 10px}
#zvBoard .tabs{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:14px 0}
#zvBoard .tabs button{display:flex;align-items:center;justify-content:center;gap:8px;border:1px solid #3d2a9a;border-radius:20px;background:#120c40;color:#fff;font-weight:800;font-size:14px;padding:13px 6px}
#zvBoard .tabs button.on{background:linear-gradient(180deg,#9a4dff,#5a2bd8);border-color:#a67bff;box-shadow:0 0 18px #7a33ff55}
#zvBoard .tabs svg{width:20px;height:20px}
#zvBoard .pod{display:grid;grid-template-columns:1fr 1.2fr 1fr;align-items:end;gap:6px;margin:4px 0 14px}
#zvBoard .pc{text-align:center;display:flex;flex-direction:column;align-items:center}
#zvBoard .pc .cw{width:24px;height:24px;margin-bottom:2px}
#zvBoard .p1 .cw{color:#ffc933;width:30px;height:30px}#zvBoard .p2 .cw{color:#cfd6ff}#zvBoard .p3 .cw{color:#e0914a}
#zvBoard .pl{width:100%;border-radius:16px 16px 6px 6px;padding:8px 4px 10px;margin-top:6px;border:1px solid #5a3fc0;background:linear-gradient(180deg,#2d2078,#140d45)}
#zvBoard .p1 .pl{min-height:118px;border-color:#d8a93a;background:linear-gradient(180deg,#5a3f10,#1c1240)}
#zvBoard .p2 .pl{min-height:92px}#zvBoard .p3 .pl{min-height:84px}
#zvBoard .pl i{display:block;font-style:normal;font-weight:900;font-size:30px;line-height:1.1}
#zvBoard .p1 .pl i{color:#ffc933;font-size:38px}
#zvBoard .pl b{display:block;font-size:13px;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding:0 4px}
#zvBoard .pl span{display:flex;align-items:center;justify-content:center;gap:4px;font-size:12px;color:#d9ccff;margin-top:3px}
#zvBoard .pl span svg{width:14px;height:14px;color:#b36bff}
#zvBoard .lb-av{display:inline-grid;place-items:center;border-radius:50%;font-weight:900;color:#fff;flex-shrink:0;text-shadow:0 1px 3px #0008}
#zvBoard .row{display:flex;align-items:center;gap:10px;padding:8px 12px;border:1px solid #3a2490;border-radius:18px;background:linear-gradient(135deg,#1c1060cc,#0e0a33e6);margin-bottom:8px}
#zvBoard .row.me{border-color:#ffc933;background:linear-gradient(135deg,#3a2a0acc,#150e3ae6)}
#zvBoard .rk{width:30px;height:30px;border-radius:50%;background:#15104a;border:1px solid #3d2a9a;display:grid;place-items:center;font-weight:800;font-size:13px;flex-shrink:0}
#zvBoard .nm{flex:1;min-width:0;font-weight:700;color:#cfe3ff;font-size:15px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#zvBoard .vl{display:flex;align-items:center;gap:6px;font-weight:800;font-size:15px;white-space:nowrap}
#zvBoard .vl svg{width:17px;height:17px;color:#b36bff}
#zvBoard .row>svg{width:16px;height:16px;color:#a98bff;flex-shrink:0}
#zvBoard .emp{padding:22px 10px;text-align:center;color:#b9b2ee;border:1px dashed #4a32a8;border-radius:18px}
#zvBoard .bot{position:fixed;left:0;right:0;bottom:calc(86px + env(safe-area-inset-bottom,0px));padding:0 14px;z-index:6;pointer-events:none}
#zvBoard .bot>div{max-width:620px;margin:0 auto 8px;pointer-events:auto}
#zvBoard .mine{display:flex;align-items:center;gap:10px;padding:9px 12px;border:1px solid #ffc933;border-radius:18px;background:linear-gradient(135deg,#2e220a,#140d3a)}
#zvBoard .mine small{display:block;color:#ffd36b;font-size:11px;font-weight:800;letter-spacing:.5px}
#zvBoard .cta{display:flex;align-items:center;gap:12px;padding:10px 12px;border:1px solid #6a3ff0;border-radius:18px;background:linear-gradient(135deg,#241470,#0e0a33)}
#zvBoard .cta>svg{width:34px;height:34px;color:#ffb12e;flex-shrink:0}
#zvBoard .cta div{flex:1;min-width:0;font-size:13px;color:#f1ecff;font-weight:600;line-height:1.3}#zvBoard .cta div small{display:block;color:#b9b2ee;font-weight:500;font-size:11.5px}
#zvBoard .cta button{border:0;border-radius:16px;padding:11px 14px;font-weight:900;font-size:14px;color:#2a1a00;background:linear-gradient(180deg,#ffd35a,#f0a315);display:flex;align-items:center;gap:6px;white-space:nowrap}
#zvBoard .cta button svg{width:16px;height:16px}`;

  function html(d) {
    const ref = tab === "ref", icon = ref ? I.users : I.gem, L = d.list.map(x => ({ ...x }));
    const mine = { name: myName(), value: d.value, me: true }, inList = d.rank && d.rank <= L.length && d.value > 0;
    if (inList) { L.splice(d.rank - 1, 0, mine); if (L.length > LIMIT) L.length = LIMIT; }
    const val = x => `<span class="vl">${icon}${num(x)}</span>`;
    const pc = (x, n, cls) => x ? `<div class="pc ${cls}"><span class="cw">${I.crown}</span>${av(x.name, n === 1 ? 70 : 58, n === 1 ? "#ffc933" : n === 2 ? "#cfd6ff" : "#e0914a")}<div class="pl"><i>${n}</i><b>${esc(x.name)}${x.me ? " (You)" : ""}</b><span>${icon}${num(x.value)}</span></div></div>` : "<div></div>";
    const pod = L.length >= 3 ? `<div class="pod">${pc(L[1], 2, "p2")}${pc(L[0], 1, "p1")}${pc(L[2], 3, "p3")}</div>` : "";
    const rows = L.slice(L.length >= 3 ? 3 : 0).map((x, i) => `<div class="row${x.me ? " me" : ""}"><span class="rk">${i + (L.length >= 3 ? 4 : 1)}</span>${av(x.name, 34)}<span class="nm">${esc(x.name)}${x.me ? " (You)" : ""}</span>${val(x.value)}${I.chev}</div>`).join("");
    const body = L.length ? pod + rows : `<div class="emp">${d.error ? "Could not load the ranking. Please try again." : "The ranking will appear here once members are connected."}</div>`;
    const rtxt = d.value > 0 && d.rank ? (d.rank > LIMIT ? LIMIT + "+" : "#" + d.rank) : "-";
    const cta = ref ? `<div>Invite your friends &amp; get rewards!</div><button onclick="zvbInvite()">Invite Now ${I.go}</button>`
      : `<div><b style="font-weight:800">Own Premium NFTs</b><small>Unlock more benefits &amp; climb higher!</small></div><button onclick="zvbNft()">Explore NFTs ${I.go}</button>`;
    return `<div class="in"><div class="hd"><button class="ib" onclick="zvbClose()" aria-label="Back">${I.back}</button><b>Leaderboard</b><span class="ib cr">${I.crown}</span></div>
      <div class="hero">${I.trophy}<h2>${ref ? "Top <span>Referrals</span>" : "Top <span>NFT Holders</span>"}</h2><p>${ref ? "Invite More &bull; Earn More" : "Hold More &bull; Get Higher Rewards"}</p>${d.demo ? '<span class="dm">Demo ranking: sample members</span>' : ""}</div>
      <div class="tabs"><button class="${ref ? "on" : ""}" onclick="zvbTab('ref')">${I.users}Top Referrals</button><button class="${ref ? "" : "on"}" onclick="zvbTab('nft')">${I.gem}Top NFT Holders</button></div>
      ${body}
      ${ref ? "" : '<p style="color:#9d93e0;font-size:12px;text-align:center;margin:6px 0 0">Ranked by the total TRX of NFTs each member has bought.</p>'}</div>
      <div class="bot"><div class="mine">${av(myName(), 34)}<span class="rk" style="width:auto;min-width:34px;padding:0 6px;border-color:#ffc933;color:#ffc933">${rtxt}</span><span class="nm" style="color:#fff"><small>YOUR RANK</small>${esc(myName())}</span>${val(d.value)}</div><div class="cta">${ref ? I.gift : '<span style="font-size:26px">&#128142;</span>'}${cta}</div></div>`;
  }

  async function paint() {
    if (!root) return;
    const my = ++token;
    root.innerHTML = '<div class="in"><div class="emp" style="margin-top:80px">Loading...</div></div>';
    const d = await load(tab);
    if (my !== token || !root.classList.contains("open")) return;
    const y = root.scrollTop; root.innerHTML = html(d); root.scrollTop = y;
  }
  function ensure() {
    if (root) return;
    const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
    root = document.createElement("section"); root.id = "zvBoard"; document.body.appendChild(root);
  }
  window.zvOpenBoard = () => { ensure(); root.classList.add("open"); root.scrollTop = 0; paint(); };
  window.zvbClose = () => { if (root) root.classList.remove("open"); };
  window.zvbTab = k => { if (k !== "ref" && k !== "nft") return; tab = k; if (root) root.scrollTop = 0; paint(); };
  window.zvbInvite = () => { window.zvbClose(); if (typeof window.zvhInvite === "function") window.zvhInvite(); };
  window.zvbNft = () => { window.zvbClose(); if (typeof window.zvOpenMarket === "function") window.zvOpenMarket(); };
})();
