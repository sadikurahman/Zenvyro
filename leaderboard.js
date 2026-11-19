/* Zenvyro — Leaderboard page: Top Referrals and Top NFT Holders (top 100, Your Rank at the end). Full screen, hides the bottom bar.
   DEMO = true shows SAMPLE members and says so on the page. For real data set window.ZENVYRO_LEADERBOARD_ENDPOINT:
   GET <endpoint>?type=ref|nft  ->  { list: [{ name, value, avatar? }], myRank: number|null, myValue: number }   (the server ranks everyone) */
(() => {
  "use strict";
  const DEMO = true, LIMIT = 100;
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const num = n => Math.round(+n || 0).toLocaleString("en-US");
  let root = null, tab = "ref", token = 0, isOpen = false, thr = 9999, sc = false, tick = false;
  const I = {
    users: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="8" r="3.2"/><path d="M2.5 19c0-3.4 2.9-5.5 6.5-5.5s6.5 2.1 6.5 5.5z"/><circle cx="17" cy="9" r="2.4"/><path d="M16.5 13.6c3 0 5 1.7 5 4.4h-4.2c0-1.8-.3-3.2-.8-4.4z"/></svg>',
    gem: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 3h12l4 6-10 12L2 9z"/><path d="M2 9h20M8 3l-2 6 6 12 6-12-2-6" fill="none" stroke="#0b0824" stroke-width="1" opacity=".45"/></svg>',
    back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
    go: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    chev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>',
    gift: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="8" width="18" height="4" rx="1"/><path d="M5 12v8h14v-8M12 8v12M12 8c-2.5 0-4-1-4-2.5S9.5 3 11 4.5 12 8 12 8zm0 0c2.5 0 4-1 4-2.5S14.5 3 13 4.5 12 8 12 8z"/></svg>',
    crown: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z"/></svg>'
  };
  // laurel branches around a podium avatar
  const laurel = col => { let s = ""; for (let i = 0; i < 7; i++) { const t = 130 + i * (100 / 6), a = t * Math.PI / 180, b = (180 - t) * Math.PI / 180;
    s += `<ellipse cx="${(50 + 42 * Math.cos(a)).toFixed(1)}" cy="${(50 + 42 * Math.sin(a)).toFixed(1)}" rx="3.3" ry="7.2" transform="rotate(${(t - 18).toFixed(0)} ${(50 + 42 * Math.cos(a)).toFixed(1)} ${(50 + 42 * Math.sin(a)).toFixed(1)})"/>`
      + `<ellipse cx="${(50 + 42 * Math.cos(b)).toFixed(1)}" cy="${(50 + 42 * Math.sin(b)).toFixed(1)}" rx="3.3" ry="7.2" transform="rotate(${(180 - t + 18).toFixed(0)} ${(50 + 42 * Math.cos(b)).toFixed(1)} ${(50 + 42 * Math.sin(b)).toFixed(1)})"/>`; }
    return `<svg class="lau" viewBox="0 0 100 100" fill="${col}">${s}</svg>`; };
  const SP = { r1: 0, r2: 1, r3: 2, r4: 3, r6: 4, r7: 5, r8: 6, n1: 7, n2: 8, n3: 9, n4: 10, n5: 11, n6: 12, n7: 13, n8: 14 };   // cells of lb-avatars.jpg (5 x 3)
  const hue = s => { let h = 0; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) % 360; return h; };
  const av = (x, size, ring) => {
    const sh = ring ? `box-shadow:0 0 0 3px ${ring},0 0 16px ${ring}88;` : "", base = `width:${size}px;height:${size}px;${sh}`;
    if (x.sp && SP[x.sp] !== undefined) { const i = SP[x.sp]; return `<span class="lb-av" style="${base}background:url(lb-avatars.jpg) ${(i % 5) * 25}% ${Math.floor(i / 5) * 50}%/500% 300%"></span>`; }
    if (x.avatar) return `<span class="lb-av" style="${base}background:url('${esc(encodeURI(x.avatar))}') center/cover"></span>`;
    const n = x.name || "?";
    return `<span class="lb-av" style="${base}font-size:${Math.round(size * .44)}px;background:linear-gradient(145deg,hsl(${hue(n)} 70% 55%),hsl(${(hue(n) + 50) % 360} 70% 30%))">${esc(String(n).slice(0, 1).toUpperCase())}</span>`;
  };

  function rng(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const TOP = {   // SAMPLE members for the demo (the first eight match the design)
    ref: [["CryptoKing", 2750, "r1"], ["ZenvyMaster", 2210, "r2"], ["NFTPro", 1890, "r3"], ["CryptoRider", 1750, "r4"], ["ZenvyTeam", 1620, ""], ["DreamBuilder", 1480, "r6"], ["CryptoGirl", 1320, "r7"], ["BlockMaster", 1210, "r8"]],
    nft: [["NFTKing", 125750, "n1"], ["NFTLegend", 98420, "n2"], ["DragonHolder", 87390, "n3"], ["ZenvyPro", 75230, "n4"], ["PhoenixNFT", 68770, "n5"], ["MetaCat", 62450, "n6"], ["WolfNFT", 58210, "n7"], ["DiamondHolder", 54980, "n8"]]
  };
  function sample(k) {
    const r = rng(k === "ref" ? 11 : 29), P = ["Crypto", "Zeny", "NFT", "Block", "Moon", "Star", "Dream", "Alpha", "Nova", "Cyber"], S = ["King", "Master", "Pro", "Legend", "Holder", "Builder", "Hunter", "Wolf", "Queen", "Team"];
    const used = new Set(TOP[k].map(t => t[0])), names = [];
    P.forEach(p => S.forEach(s => { if (!used.has(p + s)) names.push(p + s); }));
    for (let i = names.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [names[i], names[j]] = [names[j], names[i]]; }
    const out = TOP[k].map(t => ({ name: t[0], value: t[1], sp: t[2] }));
    let last = out[out.length - 1].value, v = last;
    for (let i = out.length; i < LIMIT; i++) { v *= (k === "ref" ? .955 : .93) - r() * .02; last = Math.max(1, Math.min(last - 1, Math.round(v))); out.push({ name: names[i - out.length + (out.length - TOP[k].length)] || "Member" + i, value: last }); }
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
        return { list: (Array.isArray(j.list) ? j.list : []).slice(0, LIMIT).map(x => ({ name: String(x.name || "Member"), value: +x.value || 0, avatar: x.avatar || "" })), rank: +j.myRank || null, value: j.myValue != null ? +j.myValue : mv, demo: false };
      } catch (e) { return { list: [], rank: null, value: mv, demo: false, error: true }; }
    }
    if (!DEMO) return { list: [], rank: null, value: mv, demo: false, empty: true };
    const list = sample(k);
    return { list, rank: mv > 0 ? 1 + list.filter(x => x.value > mv).length : null, value: mv, demo: true };
  }

  const css = `
#zvBoard{position:fixed;inset:0;z-index:8;overflow-y:auto;-webkit-overflow-scrolling:touch;display:none;padding:calc(10px + env(safe-area-inset-top,0px)) 14px calc(36px + env(safe-area-inset-bottom,0px));background:radial-gradient(ellipse at 50% 0,#2b1475 0,#0b0824 42%,#050511 100%);color:#fff}
#zvBoard.open{display:block}
#zvBoard .in{max-width:620px;margin:auto}
#zvBoard .hd{display:flex;align-items:center;justify-content:space-between}
#zvBoard .hd b{font-size:20px}
#zvBoard .ib{width:44px;height:44px;border-radius:50%;border:1px solid #6b45d8;background:#1b1050;color:#fff;display:grid;place-items:center;padding:0;flex-shrink:0}
#zvBoard .ib svg{width:20px;height:20px}
#zvBoard .ib.cr{color:#c58bff;border-color:#4a2f9c}
#zvBoard .hero{margin:0 -14px;text-align:center}
#zvBoard .hero img{display:block;width:100%;max-width:620px;height:auto;margin:0 auto;-webkit-mask-image:radial-gradient(ellipse 78% 88% at 50% 46%,#000 60%,transparent 100%);mask-image:radial-gradient(ellipse 78% 88% at 50% 46%,#000 60%,transparent 100%)}
#zvBoard .dm{display:inline-block;margin:2px 0 4px;font-size:11px;font-weight:700;color:#ffc24a;border:1px solid #a8791b;background:#2d2208;border-radius:12px;padding:3px 10px}
#zvBoard .stk{position:sticky;top:0;z-index:6;display:flex;gap:10px;margin:8px -14px 6px;padding:8px 14px;transition:background .2s}
#zvBoard.sc .stk{background:linear-gradient(#0c0928,#0a0722f6);box-shadow:0 8px 18px #000a}
#zvBoard .stk .bk{display:none}
#zvBoard.sc .stk .bk{display:grid}
#zvBoard .stk button.tb{flex:1;display:flex;align-items:center;justify-content:center;gap:8px;border:1px solid #3d2a9a;border-radius:22px;background:#120c40;color:#fff;font-weight:800;font-size:14px;padding:13px 6px}
#zvBoard .stk button.tb.on{background:linear-gradient(180deg,#9a4dff,#5a2bd8);border-color:#b08bff;box-shadow:0 0 18px #7a33ff66}
#zvBoard .stk svg{width:20px;height:20px}
#zvBoard .pod{display:grid;grid-template-columns:1fr 1.22fr 1fr;align-items:end;gap:6px;margin:16px 0 16px}
#zvBoard .pc{display:flex;flex-direction:column;align-items:center;min-width:0}
#zvBoard .pc .cw{width:26px;height:26px;margin-bottom:2px}
#zvBoard .p1 .cw{color:#ffc933;width:34px;height:34px;filter:drop-shadow(0 0 8px #ffc93399)}#zvBoard .p2 .cw{color:#dfe3ff}#zvBoard .p3 .cw{color:#e8934a}
#zvBoard .pv{position:relative;display:grid;place-items:center;margin-bottom:-6px;z-index:2}
#zvBoard .pv .lau{position:absolute;width:132%;height:132%;left:-16%;top:-14%;opacity:.95}
#zvBoard .p1 .lau{fill:#e9b43a}#zvBoard .p2 .lau{fill:#aeb6e8}#zvBoard .p3 .lau{fill:#c9783c}
#zvBoard .pl{position:relative;width:100%;border-radius:14px 14px 6px 6px;padding:16px 4px 12px;text-align:center;border-top:2px solid #ffffff55}
#zvBoard .p1 .pl{min-height:128px;background:linear-gradient(180deg,#7a5517,#2a1b05);border:1px solid #e0b040;border-top:2px solid #ffe08a;box-shadow:0 0 26px #e0a02a55,inset 0 0 22px #ffcc4433}
#zvBoard .p2 .pl{min-height:104px;background:linear-gradient(180deg,#4d4f9a,#191344);border:1px solid #8c92d8;border-top:2px solid #dfe3ff;box-shadow:0 0 18px #7a86ff33}
#zvBoard .p3 .pl{min-height:96px;background:linear-gradient(180deg,#7a4a28,#2a1608);border:1px solid #c9783c;border-top:2px solid #ffc18a;box-shadow:0 0 18px #e8934a33}
#zvBoard .pl i{display:block;font-style:normal;font-weight:900;font-size:32px;line-height:1.05;text-shadow:0 2px 10px #0008}
#zvBoard .p1 .pl i{color:#ffd24a;font-size:42px}#zvBoard .p2 .pl i{color:#e6e9ff}#zvBoard .p3 .pl i{color:#ffb27a}
#zvBoard .pl b{display:block;font-size:13px;margin-top:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding:0 4px}
#zvBoard .pl span{display:flex;align-items:center;justify-content:center;gap:4px;font-size:12.5px;color:#e6dcff;margin-top:4px;font-weight:700}
#zvBoard .pl span svg{width:14px;height:14px;color:#c07bff}
#zvBoard .lb-av{display:inline-grid;place-items:center;border-radius:50%;font-weight:900;color:#fff;flex-shrink:0;text-shadow:0 1px 3px #0008;background-repeat:no-repeat}
#zvBoard .row{display:flex;align-items:center;gap:10px;padding:8px 12px;border:1px solid #3a2490;border-radius:20px;background:linear-gradient(135deg,#1f1268cc,#0e0a33e6);margin-bottom:8px;box-shadow:inset 0 0 0 1px #ffffff08}
#zvBoard .row.me{border-color:#ffc933;background:linear-gradient(135deg,#3a2a0acc,#150e3ae6);box-shadow:0 0 18px #ffc93333}
#zvBoard .rk{min-width:30px;height:30px;padding:0 4px;border-radius:50%;background:#15104a;border:1px solid #3d2a9a;display:grid;place-items:center;font-weight:800;font-size:13px;flex-shrink:0}
#zvBoard .nm{flex:1;min-width:0;font-weight:700;color:#cfe3ff;font-size:15px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#zvBoard .nm small{display:block;color:#ffd36b;font-size:10.5px;font-weight:800;letter-spacing:.6px}
#zvBoard .vl{display:flex;align-items:center;gap:6px;font-weight:800;font-size:15px;white-space:nowrap}
#zvBoard .vl svg{width:17px;height:17px;color:#b36bff}
#zvBoard .row>svg{width:16px;height:16px;color:#a98bff;flex-shrink:0}
#zvBoard .emp{padding:22px 10px;text-align:center;color:#b9b2ee;border:1px dashed #4a32a8;border-radius:18px}
#zvBoard .note{color:#9d93e0;font-size:12px;text-align:center;margin:2px 0 12px}
#zvBoard .cta{display:flex;align-items:center;gap:12px;padding:12px;margin-top:10px;border:1px solid #7a4dff;border-radius:20px;background:linear-gradient(135deg,#2a1a80,#0e0a33);box-shadow:0 0 20px #6b32ff33}
#zvBoard .cta>svg{width:36px;height:36px;color:#ffb12e;flex-shrink:0}
#zvBoard .cta .ce{font-size:26px;line-height:1;flex-shrink:0}
#zvBoard .cta div{flex:1;min-width:0;font-size:13.5px;color:#f1ecff;font-weight:700;line-height:1.3}#zvBoard .cta div small{display:block;color:#b9b2ee;font-weight:500;font-size:11.5px}
#zvBoard .cta button{border:0;border-radius:16px;padding:12px 15px;font-weight:900;font-size:14px;color:#2a1a00;background:linear-gradient(180deg,#ffd35a,#f0a315);display:flex;align-items:center;gap:6px;white-space:nowrap;box-shadow:0 0 14px #f0a31555}
#zvBoard .cta button svg{width:16px;height:16px}`;

  function html(d) {
    const ref = tab === "ref", icon = ref ? I.users : I.gem, L = d.list.map(x => ({ ...x }));
    const mine = { name: myName(), value: d.value, me: true, avatar: (window.ZENVYRO_USER && window.ZENVYRO_USER.avatar) || "" }, inList = d.rank && d.rank <= L.length && d.value > 0;
    if (inList) { L.splice(d.rank - 1, 0, mine); if (L.length > LIMIT) L.length = LIMIT; }
    const val = x => `<span class="vl">${icon}${num(x)}</span>`;
    const pc = (x, n) => { const cls = "p" + n, ring = n === 1 ? "#ffc933" : n === 2 ? "#dfe3ff" : "#e8934a", S = n === 1 ? 76 : 62;
      return x ? `<div class="pc ${cls}"><span class="cw">${I.crown}</span><div class="pv" style="width:${S}px;height:${S}px">${laurel("#fff")}${av(x, S - 8, ring)}</div><div class="pl"><i>${n}</i><b>${esc(x.name)}${x.me ? " (You)" : ""}</b><span>${icon}${num(x.value)}</span></div></div>` : "<div></div>"; };
    const pod = L.length >= 3 ? `<div class="pod">${pc(L[1], 2)}${pc(L[0], 1)}${pc(L[2], 3)}</div>` : "";
    const rows = L.slice(L.length >= 3 ? 3 : 0).map((x, i) => `<div class="row${x.me ? " me" : ""}"><span class="rk">${i + (L.length >= 3 ? 4 : 1)}</span>${av(x, 36)}<span class="nm">${esc(x.name)}${x.me ? " (You)" : ""}</span>${val(x.value)}${I.chev}</div>`).join("");
    const body = L.length ? pod + rows : `<div class="emp">${d.error ? "Could not load the ranking. Please try again." : "The ranking will appear here once members are connected."}</div>`;
    const rtxt = d.value > 0 && d.rank ? (d.rank > LIMIT ? LIMIT + "+" : "#" + d.rank) : "-";
    const cta = ref ? `<span style="display:contents">${I.gift}</span><div>Invite your friends &amp; get rewards!</div><button onclick="zvbInvite()">Invite Now ${I.go}</button>`
      : `<span class="ce">&#128142;</span><div><b style="font-weight:800">Own Premium NFTs</b><small>Unlock more benefits &amp; climb higher!</small></div><button onclick="zvbNft()">Explore NFTs ${I.go}</button>`;
    return `<div class="in"><div class="hd"><button class="ib" onclick="zvbClose()" aria-label="Back">${I.back}</button><b>Leaderboard</b><span class="ib cr">${I.crown}</span></div>
      <div class="hero"><img src="lb-hero-${tab}.jpg" alt="${ref ? "Top Referrals" : "Top NFT Holders"}"></div><div style="text-align:center">${d.demo ? '<span class="dm">Demo ranking: sample members</span>' : ""}</div>
      <div class="stk" id="lbStk"><button class="ib bk" onclick="zvbClose()" aria-label="Back">${I.back}</button><button class="tb${ref ? " on" : ""}" onclick="zvbTab('ref')">${I.users}Top Referrals</button><button class="tb${ref ? "" : " on"}" onclick="zvbTab('nft')">${I.gem}Top NFT Holders</button></div>
      ${body}
      ${ref ? "" : '<p class="note">Ranked by the total TRX of NFTs each member has bought.</p>'}
      <div class="row me" style="margin-top:6px">${av(mine, 36)}<span class="rk" style="border-color:#ffc933;color:#ffc933">${rtxt}</span><span class="nm" style="color:#fff"><small>YOUR RANK</small>${esc(myName())}</span>${val(d.value)}</div>
      <div class="cta">${cta}</div></div>`;
  }

  async function paint(keepScroll) {
    if (!root) return;
    const my = ++token, y = keepScroll ? root.scrollTop : 0;
    const d = await load(tab);
    if (my !== token || !isOpen) return;
    root.innerHTML = html(d); root.scrollTop = y;
    const s = document.getElementById("lbStk"); thr = s ? s.offsetTop - 4 : 9999; onScroll();
  }
  function onScroll() {
    tick = false; const on = root.scrollTop > thr;
    if (on !== sc) { sc = on; root.classList.toggle("sc", on); }
  }
  function ensure() {
    if (root) return;
    const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
    root = document.createElement("section"); root.id = "zvBoard"; document.body.appendChild(root);
    root.addEventListener("scroll", () => { if (!tick) { tick = true; requestAnimationFrame(onScroll); } }, { passive: true });
    window.addEventListener("popstate", () => { if (isOpen) hide(); });
    ["ref", "nft"].forEach(k => { const im = new Image(); im.src = "lb-hero-" + k + ".jpg"; });
    const sp = new Image(); sp.src = "lb-avatars.jpg";
  }
  function hide() { isOpen = false; sc = false; if (root) { root.classList.remove("open", "sc"); } }
  window.zvOpenBoard = () => {
    ensure(); if (!isOpen) { isOpen = true; try { history.pushState({ zvb: 1 }, ""); } catch (e) {} }
    root.classList.add("open"); root.scrollTop = 0; sc = false; root.classList.remove("sc"); paint(false);
  };
  window.zvbClose = () => { if (!isOpen) return; if (history.state && history.state.zvb) history.back(); else hide(); };
  window.zvbTab = k => { if (k !== "ref" && k !== "nft" || k === tab) return; tab = k; paint(true); };
  window.zvbInvite = () => { window.zvbClose(); if (typeof window.zvhInvite === "function") setTimeout(window.zvhInvite, 30); };
  window.zvbNft = () => { window.zvbClose(); if (typeof window.zvOpenMarket === "function") setTimeout(window.zvOpenMarket, 30); };
})();
