/* Zenvyro — NFT Marketplace, Home banner and Profile Summary (frontend UI, demo purchases).
   DEMO = true: "Buy NFT" only records the NFT in this browser and adds it to Level progress.
   Real purchases, ownership and balances must be verified on the server. */
(() => {
  "use strict";
  const DEMO = true;
  const HKEY = "zenvyro_nft_v1", TXKEY = "zenvyro_tx_v1";
  // price in TRX (sample prices: edit freely). Replace the image files with your own NFT art.
  const ITEMS = [
    { id: "N001", name: "Cyber Knight #001", price: 160, img: "nft-knight.jpg", badge: ["Hot", "hot"], tags: ["Trending"] },
    { id: "N009", name: "Royal Lion #009", price: 240, img: "nft-lion.jpg", badge: ["Premium", "pre"], tags: ["Legendary", "Limited"] },
    { id: "N023", name: "Crypto Ape #023", price: 315, img: "nft-ape.jpg", badge: ["Popular", "pop"], tags: ["Trending", "Limited"] },
    { id: "N017", name: "Space Explorer #017", price: 200, img: "nft-astro.jpg", badge: ["New", "new"], tags: ["Limited"] }
  ];
  const RATE = { Free: 0.001587, Standard: 0.002222, Silver: 0.006945, Gold: 0.017361, Platinum: 0.050505 };
  const TABS = ["All NFTs", "Limited", "Legendary", "Trending", "My NFTs"];
  const P = {
    gem: '<path d="M6 4h12l4 5-10 11L2 9z"/><path d="M2 9h20M9 4l-2 5 5 11 5-11-2-5"/>',
    back: '<path d="M15 5l-7 7 7 7"/>', search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>',
    store: '<path d="M4 9l1.5-5h13L20 9"/><path d="M4 9a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0A2.7 2.7 0 0 0 20 9"/><path d="M5 12v8h14v-8"/>',
    gift: '<rect x="3.5" y="9" width="17" height="11" rx="1.5"/><path d="M12 9v11M3.5 13.5h17"/><path d="M12 9c-3 0-5-1-5-3a2 2 0 0 1 4-.5C11.7 7 12 9 12 9zm0 0c3 0 5-1 5-3a2 2 0 0 0-4-.5C12.3 7 12 9 12 9z"/>',
    go: '<path d="M5 12h14M13 6l6 6-6 6"/>', bolt: '<path d="M13 3L5 13.5h6L10 21l8-10.5h-6z"/>',
    snow: '<path d="M12 3v18M4.2 7.5l15.6 9M19.8 7.5l-15.6 9"/>', out: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>', wallet: '<rect x="3" y="7" width="18" height="12" rx="2.5"/><path d="M16 13h2.5M5 7l11-3v3"/>'
  };
  const ic = n => `<svg class="zm-i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n]}</svg>`;
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fmt = (n, d) => (+n || 0).toLocaleString("en-US", { maximumFractionDigits: d == null ? 2 : d });
  const say = m => { if (typeof window.toast === "function") window.toast(m); };
  const jget = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k) || "null"); return v == null ? d : v; } catch (e) { return d; } };
  const holdings = () => { const a = jget(HKEY, []); return Array.isArray(a) ? a.filter(h => h && ITEMS.some(i => i.id === h.id)) : []; };
  const LVL = () => window.ZenvyroLevel;
  const tierName = () => { try { return (window.ZenvyroMining && window.ZenvyroMining.getState().tier) || "Free"; } catch (e) { return "Free"; } };
  const trxBal = () => { try { const b = window.ZenvyroWallet.balances().TRX; return b ? b.amount : 0; } catch (e) { return 0; } };

  const css = `
.zm-i{width:1em;height:1em;display:block;flex-shrink:0}
.zm-ban{display:flex;align-items:center;justify-content:space-between;gap:6px;margin:12px 0;padding:14px 0 14px 16px;border:1px solid #6b45d8;border-radius:22px;background:linear-gradient(135deg,#2a1475,#0b0830);box-shadow:0 0 24px #6b32ff40,inset 0 0 0 1px #2e1d7a;overflow:hidden;cursor:pointer;color:#fff;text-align:left}
.zm-ban h3{margin:0 0 4px;font-size:18px;line-height:1.2}.zm-ban p{margin:0 0 12px;color:#c8b8ff;font-size:13px}
.zm-ban img{width:44%;max-width:200px;align-self:stretch;object-fit:cover;-webkit-mask-image:linear-gradient(90deg,transparent,#000 40%);mask-image:linear-gradient(90deg,transparent,#000 40%)}
.zm-go{display:inline-flex;align-items:center;gap:6px;border:0;border-radius:16px;padding:9px 13px;font-weight:800;font-size:13px;color:#2a1a00;background:linear-gradient(180deg,#ffd36b,#e8a52a);box-shadow:0 0 14px #e8a52a66}
.zm-go .zm-i{font-size:15px}
#zvMarket{position:fixed;inset:0;z-index:4;overflow-y:auto;-webkit-overflow-scrolling:touch;display:none;padding:calc(12px + env(safe-area-inset-top,0px)) 14px 130px;background:radial-gradient(ellipse at 50% 0,#2b1475 0,#0a0720 46%,#04040e 100%);color:#fff}
#zvMarket.open{display:block}#zvMarket .in{max-width:1000px;margin:auto}
#zvMarket .hd{display:flex;align-items:center;gap:10px;margin-bottom:12px}
#zvMarket .hd b{flex:1;font-size:19px;display:flex;align-items:center;gap:8px}#zvMarket .hd b .zm-i{font-size:26px;color:#b28aff}
#zvMarket .ib{width:42px;height:42px;border-radius:14px;border:1px solid #4a32a8;background:#120c40;color:#e0d2ff;display:grid;place-items:center;font-size:22px;padding:0}
#zvMarket .sr{width:100%;border:1px solid #5a35d8;border-radius:14px;background:#0b0830;color:#fff;padding:11px 14px;margin-bottom:12px;font-size:15px}
#zvMarket .hero{position:relative;border:1px solid #6b45d8;border-radius:22px;background:linear-gradient(135deg,#2a1475,#0b0830);box-shadow:0 0 26px #6b32ff40;overflow:hidden;padding:18px 16px;min-height:130px;margin-bottom:14px}
#zvMarket .hero img{position:absolute;right:0;top:0;height:100%;width:52%;object-fit:cover;-webkit-mask-image:linear-gradient(90deg,transparent,#000 45%);mask-image:linear-gradient(90deg,transparent,#000 45%)}
#zvMarket .hero div{position:relative;max-width:58%}#zvMarket .hero h2{margin:0 0 4px;font-size:21px;line-height:1.2}#zvMarket .hero h2 span{color:#ffd36b;display:block}#zvMarket .hero p{margin:0 0 12px;color:#c8b8ff;font-size:13px}
#zvMarket .tabs{display:flex;gap:8px;overflow-x:auto;margin-bottom:14px;padding-bottom:4px}
#zvMarket .tabs button{flex-shrink:0;border:1px solid #3a2a90;border-radius:20px;background:#0b0830;color:#e0d2ff;padding:9px 16px;font-weight:700;font-size:14px}
#zvMarket .tabs button.on{background:linear-gradient(135deg,#6b32ff,#9a5cff);border-color:#b28aff;box-shadow:0 0 16px #8a3dff80;color:#fff}
#zvMarket .grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
@media(min-width:700px){#zvMarket .grid{grid-template-columns:repeat(4,minmax(0,1fr))}}
.zm-card{border:1px solid #5a35d8;border-radius:20px;background:linear-gradient(160deg,#150c4e,#0b0830);box-shadow:0 0 18px #6b32ff2a;overflow:hidden;padding-bottom:10px}
.zm-card .im{position:relative;aspect-ratio:1.3;background:#1a1058}.zm-card .im img{width:100%;height:100%;object-fit:cover;display:block}
.zm-bd{position:absolute;top:8px;right:8px;border-radius:10px;padding:3px 9px;font-size:11px;font-weight:800;color:#fff}
.zm-bd.hot{background:#e0306a}.zm-bd.pre{background:#c9922a;color:#2a1a00}.zm-bd.pop{background:#e0455a}.zm-bd.new{background:#27a66b}
.zm-card b{display:block;padding:9px 10px 6px;font-size:14px}
.zm-pr{display:flex;align-items:center;justify-content:space-between;gap:6px;padding:0 10px;font-size:13px;color:#e0d2ff}
.zm-pr span{display:flex;align-items:center;gap:5px;min-width:0}.zm-pr .zm-i{font-size:18px;color:#b28aff}
.zm-buy{border:0;border-radius:14px;padding:7px 11px;font-weight:800;font-size:12.5px;color:#2a1a00;background:linear-gradient(180deg,#ffd36b,#e8a52a)}
.zm-buy:disabled{background:#2a1a86;color:#cfc4ff}
.zm-bonus{display:flex;align-items:center;gap:12px;margin-top:16px;border:1px solid #d8a93a;border-radius:20px;background:linear-gradient(135deg,#2a1d08,#150c4e);padding:14px}
.zm-bonus .zm-i{font-size:34px;color:#ffd36b}.zm-bonus b{display:block;color:#ffd36b;font-size:15px}.zm-bonus small{color:#cfc4ff;font-size:12.5px}
.zm-empty{grid-column:1/-1;border:1px dashed #4a32a8;border-radius:16px;padding:22px;text-align:center;color:#b9b2ee}
.zm-note{color:#aeb9ff;font-size:12px;line-height:1.5;margin-top:12px}
.zm-bm{display:flex;gap:12px;align-items:center;margin-bottom:12px}.zm-bm img{width:96px;height:72px;object-fit:cover;border-radius:14px;border:1px solid #5a35d8}
.zm-bm b{display:block;font-size:16px}.zm-bm span{color:#c8b8ff;font-size:13px}
.zs-hero{border:1px solid #6b45d8;border-radius:20px;background:linear-gradient(135deg,#2a1475,#0b0830);box-shadow:0 0 24px #6b32ff40;padding:16px;margin-bottom:12px;color:#fff}
.zs-hero small{color:#c8b8ff;font-size:12px}.zs-hero .big{font-size:26px;font-weight:800;margin:4px 0 8px;overflow-wrap:anywhere}.zs-hero .big i{font-style:normal;font-size:13px;color:#c8b8ff;font-weight:600}
.zs-chip{display:inline-flex;align-items:center;gap:5px;border:1px solid #2bf0b0;border-radius:14px;background:#0a2b2b;color:#2bf0b0;padding:3px 10px;font-size:12px;font-weight:700}.zs-chip .zm-i{font-size:14px}
.zs-g{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px}
.zs-c{border:1px solid #4a32a8;border-radius:16px;background:#120c40;padding:12px;min-width:0;color:#fff}
.zs-c .zm-i{font-size:22px;color:#b28aff;margin-bottom:6px}.zs-c small{display:block;color:#c8b8ff;font-size:11.5px}.zs-c b{display:block;font-size:17px;margin-top:2px;overflow-wrap:anywhere}.zs-c em{display:block;font-style:normal;color:#aeb9ff;font-size:11.5px;margin-top:3px}
.zs-c.fz .zm-i{color:#7ee8ff}.zs-c.av{border-color:#1fbf8f}.zs-c.av .zm-i,.zs-c.av b{color:#2bf0b0}
.zs-c.hold{grid-column:1/-1;border-color:#d8a93a;background:linear-gradient(135deg,#2a1d08,#120c40)}.zs-c.hold .zm-i,.zs-c.hold b{color:#ffd36b}
.zs-w{border:1px solid #4a32a8;border-radius:16px;background:#120c40;padding:12px;color:#fff}.zs-w .r{display:flex;justify-content:space-between;font-size:13px;color:#cfc4ff}.zs-w .r b{color:#fff}
.zs-tr{height:8px;border-radius:8px;background:#0a0720;border:1px solid #2e1d7a;margin-top:8px;overflow:hidden}.zs-tr i{display:block;height:100%;background:linear-gradient(90deg,#6b32ff,#cda5ff)}
#zvAccount .mrow{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
#zvAccount .zv-sum{display:inline-flex;align-items:center;gap:4px;border:1px solid #6b45d8;border-radius:16px;background:linear-gradient(135deg,#2a1475,#1a1058);color:#e0d2ff;padding:5px 10px;font-size:11.5px;font-weight:700;box-shadow:0 0 10px #8a3dff44}`;
  const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

  // ---- Marketplace ----
  const S = { tab: "All NFTs", q: "", s: false };
  let root = null;
  const cardHtml = (i, owned) => `<article class="zm-card"><div class="im"><img src="${i.img}" alt="${esc(i.name)}" loading="lazy"><span class="zm-bd ${i.badge[1]}">${i.badge[0]}</span></div><b>${esc(i.name)}</b>
    <div class="zm-pr"><span>${ic("gem")}${fmt(i.price)} TRX</span><button class="zm-buy" ${owned ? "disabled" : ""} onclick="zvBuy('${i.id}')">${owned ? "Owned" : "Buy Now"}</button></div></article>`;
  function gridHtml() {
    const own = holdings(), ids = own.map(h => h.id), q = S.q.trim().toLowerCase();
    if (S.tab === "My NFTs") {
      const mine = ITEMS.filter(i => ids.includes(i.id));
      return mine.length ? mine.map(i => cardHtml(i, true)).join("") : '<div class="zm-empty">You do not hold any NFT yet. Buy one to see it here.</div>';
    }
    const list = ITEMS.filter(i => (S.tab === "All NFTs" || i.tags.includes(S.tab)) && (!q || i.name.toLowerCase().includes(q)));
    return list.length ? list.map(i => cardHtml(i, ids.includes(i.id))).join("") : '<div class="zm-empty">No NFT found.</div>';
  }
  function render() {
    root.innerHTML = `<div class="in"><div class="hd"><button class="ib" onclick="zvmClose()" aria-label="Back">${ic("back")}</button><b>${ic("store")}NFT Marketplace</b><button class="ib" onclick="zvmSearch()" aria-label="Search">${ic("search")}</button></div>
      ${S.s ? `<input class="sr" id="zmQ" placeholder="Search NFTs" value="${esc(S.q)}" oninput="zvmQ(this.value)">` : ""}
      <div class="hero"><div><h2>Discover<span>Premium NFTs</span></h2><p>Own &amp; Collect</p><button class="zm-go" onclick="document.getElementById('zmGrid').scrollIntoView({behavior:'smooth'})">Browse NFTs ${ic("go")}</button></div><img src="nft-hero.jpg" alt=""></div>
      <div class="tabs">${TABS.map(t => `<button class="${t === S.tab ? "on" : ""}" onclick="zvmTab('${t}')">${t}</button>`).join("")}</div>
      <div class="grid" id="zmGrid">${gridHtml()}</div>
      <div class="zm-bonus">${ic("gift")}<div><b>5% Bonus for your referrer</b><small>When you buy your first pack or NFT, the member who invited you earns a 5% Purchase Bonus.</small></div></div>
      <div class="zm-note">Every NFT you buy counts toward your Level progress. NFTs are not a promise of profit or income.${DEMO ? " Demo mode: purchases are samples only." : ""}</div></div>`;
  }
  const openMarket = () => { if (!root) return; render(); root.classList.add("open"); root.scrollTop = 0; };
  const closeMarket = () => { if (root) root.classList.remove("open"); };
  function buyForm(id) {
    const i = ITEMS.find(x => x.id === id); if (!i) return;
    window.openModal("Buy NFT", `<div class="zm-bm"><img src="${i.img}" alt=""><div><b>${esc(i.name)}</b><span>${fmt(i.price)} TRX</span></div></div>
      <div class="modal-list"><div><strong>Price</strong><span>${fmt(i.price)} TRX</span></div><div><strong>Your TRX balance</strong><span>${fmt(trxBal(), 6)} TRX</span></div></div>
      <div class="modal-note">${DEMO ? "Demo mode: payment is not connected. Confirming only adds this NFT to your list and your Level progress here." : "Purchases are not connected yet."}</div>
      <button class="btn" style="width:100%;margin-top:12px" onclick="zvBuyOk('${i.id}')">Confirm purchase</button>`);
  }
  function buyOk(id) {
    const i = ITEMS.find(x => x.id === id); if (!i) return;
    if (!DEMO) { window.closeModal(); return say("Purchases are not connected yet"); }
    const h = holdings(); if (h.some(x => x.id === id)) { window.closeModal(); return say("You already own this NFT"); }
    h.push({ id, price: i.price, ts: Date.now() });
    try { localStorage.setItem(HKEY, JSON.stringify(h)); } catch (e) {}
    if (LVL()) { LVL().addOwn(i.price); LVL().markPack(); }
    window.closeModal(); say(i.name + " added to My NFTs");
    if (root && root.classList.contains("open")) render();
  }

  // ---- Profile Summary ----
  function summaryBody() {
    const L = LVL() ? LVL().get() : { lvl: 0 };
    const tier = tierName(), PK = (window.ZenvyroAPI && window.ZenvyroAPI.PACKS) || {}, packVal = PK[tier] || 0;
    const nfts = holdings().map(h => ITEMS.find(i => i.id === h.id)), count = nfts.length + (packVal ? 1 : 0);
    const value = nfts.reduce((t, i) => t + i.price, 0) + packVal;
    const boost = LVL() ? LVL().boost() : 0, base = RATE[tier] || RATE.Free, total = base * (1 + boost / 100);
    const tx = jget(TXKEY, []), wds = Array.isArray(tx) ? tx.filter(t => t && t.kind === "withdraw" && t.sym === "TRX") : [];
    const pend = wds.filter(t => t.status === "pending").reduce((a, t) => a + (+t.amount || 0) + (+t.hold || 0), 0);
    const done = wds.filter(t => t.status === "completed").reduce((a, t) => a + (+t.amount || 0), 0);
    let held = 0; try { held = window.ZenvyroExchange.requests().filter(r => r.status === "pending").reduce((a, r) => a + (+r.zeny || 0), 0); } catch (e) {}
    const AH = window.ZenvyroAirdropHold || { get: () => ({}), pct: 30 }, holds = AH.get(), hTrx = +holds.TRX || 0;
    const hOthers = Object.keys(holds).filter(k => k !== "TRX" && +holds[k] > 0).map(k => fmt(holds[k], 8) + " " + k).join(", ");
    const avail = L.lvl < 1 ? 0 : Math.max(0, (trxBal() - pend) / (1 + AH.pct / 100));
    const ms = new Date(); ms.setDate(1); ms.setHours(0, 0, 0, 0);
    const used = wds.filter(t => t.status !== "rejected" && (+t.ts || 0) >= ms.getTime()).length;
    const lim = LVL() ? LVL().wd() : 0, unl = lim === Infinity;
    return `<div class="zs-hero"><small>Mining Speed</small><div class="big">${total.toFixed(6)} <i>ZENY / hour</i></div>
      <span class="zs-chip">${ic("bolt")}${boost ? "+" + boost + "% Level " + L.lvl + " boost" : "Level " + L.lvl + " · no boost yet"}</span><div class="zm-note" style="margin-top:8px">Base rate ${base.toFixed(6)} (${esc(tier)} Pack). The real reward is calculated by the server.</div></div>
      <div class="zs-g">
        <div class="zs-c">${ic("gem")}<small>NFT Holdings</small><b>${count}</b><em>${fmt(value)} TRX total</em></div>
        <div class="zs-c fz">${ic("snow")}<small>Frozen Balance</small><b>${fmt(pend, 6)} TRX</b><em>${fmt(held, 6)} ZENY on hold</em></div>
        <div class="zs-c">${ic("out")}<small>Total Withdrawal</small><b>${fmt(done, 6)} TRX</b><em>Withdrawn so far</em></div>
        <div class="zs-c av">${ic("wallet")}<small>Available Withdrawal</small><b>${fmt(avail, 6)} TRX</b><em>${L.lvl < 1 ? "Unlocks at Level 1" : "After Hold Token for Airdrop"}</em></div>
        <div class="zs-c hold">${ic("gem")}<small>Hold Token for Airdrop</small><b>${fmt(hTrx, 6)} TRX</b><em>${hOthers ? esc(hOthers) + " &middot; " : ""}Airdrop details coming soon.</em></div></div>
      <div class="zs-w"><div class="r"><span>Withdrawals this month</span><b>${lim === 0 ? "Locked (Level 1 needed)" : used + " / " + (unl ? "Unlimited" : lim)}</b></div>${unl ? "" : `<div class="zs-tr"><i style="width:${lim ? Math.min(100, used / lim * 100) : 0}%"></i></div>`}</div>
      ${nfts.length ? `<div class="zm-note">Your NFTs: ${nfts.map(i => esc(i.name)).join(", ")}</div>` : ""}`;
  }
  const openSummary = () => window.openModal("Summary", summaryBody());

  function init() {
    root = document.createElement("div"); root.id = "zvMarket"; document.body.appendChild(root);
    const q = document.querySelector("section.quick");
    if (q && !document.getElementById("zmBan")) q.insertAdjacentHTML("afterend", `<section class="zm-ban" id="zmBan" role="button" tabindex="0" onclick="zvOpenMarket()"><div><h3>Explore Premium<br>NFT Collection</h3><p>Collect &bull; Own &bull; Hold</p><span class="zm-go">Go to Marketplace ${ic("go")}</span></div><img src="nft-hero.jpg" alt=""></section>`);
    Object.assign(window, {
      zvOpenMarket: openMarket, zvmClose: closeMarket, zvBuy: buyForm, zvBuyOk: buyOk, zvaSummary: openSummary,
      zvmTab: t => { S.tab = t; render(); },
      zvmSearch: () => { S.s = !S.s; if (!S.s) S.q = ""; render(); const e = document.getElementById("zmQ"); if (e) e.focus(); },
      zvmQ: v => { S.q = v; const g = document.getElementById("zmGrid"); if (g) g.innerHTML = gridHtml(); }
    });
    const o = window.showSection;
    if (typeof o === "function") window.showSection = function () { closeMarket(); return o.apply(this, arguments); };
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
