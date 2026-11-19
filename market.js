/* Zenvyro — NFT Marketplace, My NFTs (claims), Home banner and Profile Summary. NFT list and terms come from nft-catalog.js (set in Admin > Market Place).
   DEMO = true: "Buy NFT" only records the NFT in this browser and adds it to Level progress (no TRX is taken).
   Real purchases, ownership and balances must be verified on the server. */
(() => {
  "use strict";
  const DEMO = true;
  const HKEY = "zenvyro_nft_v1", TXKEY = "zenvyro_tx_v1";
  const RATE = { Free: 0.001587, Standard: 0.002222, Silver: 0.006945, Gold: 0.017361, Platinum: 0.050505 };
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
  const DAY = 864e5, HK2 = "zenvyro_nft_v2";
  const C = () => window.ZenvyroNftCatalog;
  const r6 = x => Math.round(x * 1e6) / 1e6, r8 = x => Math.round(x * 1e8) / 1e8;
  const active = (h, t) => h.exp == null || t < h.exp;
  // A holding keeps the terms the NFT had when it was bought (later admin changes do not touch it).
  function mkHolding(i, paid, ts) {
    const daily = i.btype === "trx" ? r6(i.bval) : i.btype === "comm" ? r6(paid * i.bval / 100) : 0;
    return { hid: "H" + ts + Math.floor(Math.random() * 1e4), id: i.id, name: i.name, img: i.img, paid, ts, exp: i.durDays ? ts + i.durDays * DAY : null, bt: i.btype, bv: i.bval, daily, cur: C().slotOf(ts), pendTrx: 0, pendZeny: 0 };
  }
  const store = a => { try { localStorage.setItem(HK2, JSON.stringify(a)); } catch (e) {} };
  function load() {
    const a = jget(HK2, null); if (Array.isArray(a)) return a.filter(h => h && h.hid);
    const old = jget(HKEY, []), cat = C().get(), out = [];   // one-time move of the earlier demo list
    if (Array.isArray(old)) old.forEach(o => { const i = cat.items.find(x => x.id === o.id); if (i) out.push(mkHolding(i, +o.price || i.price, +o.ts || Date.now())); });
    store(out); return out;
  }
  // Daily rewards (fixed TRX / commission NFTs): +1 day at every 10 PM Bangladesh time while the NFT is active. Unclaimed days pile up.
  function settle() {
    const a = load(), t = Date.now(), cs = C().slotOf(t); let ch = false;
    a.forEach(h => {
      if (!(h.daily > 0)) return;
      const last = h.exp == null ? cs : Math.min(cs, C().slotOf(h.exp)), n = Math.max(0, last - h.cur);
      if (n > 0) { h.pendTrx = r6(h.pendTrx + n * h.daily); ch = true; }
      if (cs > h.cur) { h.cur = cs; ch = true; }
    });
    if (ch) store(a);
    return a;
  }
  // Mining NFTs: every main mining claim adds bv% of that claim to each ACTIVE mining NFT (claimed later from My NFTs).
  function onMiningClaim(reward) {
    reward = +reward; if (!(reward > 0)) return;
    const a = load(), t = Date.now(); let ch = false;
    a.forEach(h => { if (h.bt === "mining" && active(h, t)) { h.pendZeny = r8(h.pendZeny + reward * h.bv / 100); ch = true; } });
    if (ch) store(a);
  }
  const LVL = () => window.ZenvyroLevel;
  const tierName = () => { try { return (window.ZenvyroMining && window.ZenvyroMining.getState().tier) || "Free"; } catch (e) { return "Free"; } };
  const trxBal = () => { try { const b = window.ZenvyroWallet.balances().TRX; return b ? b.amount : 0; } catch (e) { return 0; } };
  const trxAvail = () => { try { const I = window.ZenvyroWalletInfo; return I ? I.avail("TRX") : trxBal(); } catch (e) { return 0; } };

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
#zvAccount .zv-sum{display:inline-flex;align-items:center;gap:4px;border:1px solid #6b45d8;border-radius:16px;background:linear-gradient(135deg,#2a1475,#1a1058);color:#e0d2ff;padding:5px 10px;font-size:11.5px;font-weight:700;box-shadow:0 0 10px #8a3dff44}
.zm-card .ch{position:absolute;top:8px;left:8px;border-radius:10px;padding:3px 8px;font-size:11px;font-weight:800;background:#e0306a;color:#fff}
.zm-old{text-decoration:line-through;color:#9d93e0;font-size:11.5px;margin-right:4px}
.zm-bf{padding:0 10px 6px;color:#2bf0b0;font-size:11.5px;font-weight:700;line-height:1.35}
.zm-mt{padding:6px 10px 0;color:#aeb9ff;font-size:11px;line-height:1.45}
.zm-st{position:absolute;bottom:8px;left:8px;border-radius:10px;padding:3px 9px;font-size:11px;font-weight:800;background:#0a2b2bcc;color:#2bf0b0;border:1px solid #2bf0b0}
.zm-st.ex{background:#2b0a0acc;color:#ff8a8a;border-color:#ff8a8a}
.zm-cl{display:block;width:calc(100% - 20px);margin:8px 10px 0;border:0;border-radius:14px;padding:9px;font-weight:800;font-size:13px;color:#06231c;background:linear-gradient(180deg,#5dffd0,#1fbf8f)}
.zm-cl:disabled{background:#1a1058;color:#9d93e0}
.zm-all{grid-column:1/-1;display:flex;align-items:center;justify-content:space-between;gap:10px;border:1px solid #1fbf8f;border-radius:16px;background:#0a2b2b;padding:12px 14px;color:#cfeee6;font-size:13px}
.zm-all .zm-cl{width:auto;margin:0;padding:9px 16px;flex-shrink:0}
.zm-fx{position:fixed;inset:0;z-index:60;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:42px;background:radial-gradient(ellipse at 50% 45%,#2b1275 0,#120a3a 45%,#04040e 100%);opacity:0;color:#fff;overflow:hidden}
.zm-fx-c{position:relative;width:150px;height:150px;display:grid;place-items:center}
.zm-fx-c img{width:112px;height:112px;object-fit:cover;border-radius:50%;border:3px solid #d5a0ff;position:relative;z-index:2;will-change:transform}
.zm-fx-c .r{position:absolute;inset:0;border-radius:50%;border:2px dashed #ba53ff;will-change:transform}
.zm-fx-c .r2{inset:-16px;border:2px dotted #ff9a3c}
.zm-fx-c .r3{inset:-32px;border:1px solid #3aa0ff}
.zm-fx-c .s{position:absolute;left:50%;top:50%;width:26px;height:2px;margin:-1px 0 0 -13px;border-radius:2px;opacity:0;will-change:transform,opacity}
.zm-fx-t{margin:0;font-size:15px;font-weight:800;letter-spacing:.5px;color:#e4c9ff}
.zm-fx-f{position:absolute;inset:0;pointer-events:none;opacity:0;background:radial-gradient(circle at 50% 45%,rgba(255,236,210,.95),rgba(186,83,255,.5) 30%,rgba(69,56,255,0) 65%)}
.zm-ok{width:76px;height:76px;margin:6px auto 0;color:#2bf0b0;animation:zmpop .5s ease-out both}.zm-ok svg{width:100%;height:100%;display:block}
@keyframes zmpop{0%{transform:scale(.4);opacity:0}70%{transform:scale(1.12)}100%{transform:scale(1);opacity:1}}
.zm-bn2{position:relative;border-radius:3.3%/8.8%;overflow:hidden;margin-bottom:14px;line-height:0;box-shadow:0 0 26px #8a3dff44}
.zm-bn2 img{display:block;width:100%;height:auto}
.zm-bgo{position:absolute;left:3.4%;top:81.5%;width:27.2%;height:14.8%;border:0;background:transparent;border-radius:999px;cursor:pointer;-webkit-tap-highlight-color:transparent;padding:0}`;
  const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

  // ---- Marketplace ----
  const S = { tab: "All NFTs", q: "", s: false };
  let root = null;
  const dleft = (ts, t) => { const d = Math.max(1, Math.ceil((ts - t) / DAY)); return d + (d === 1 ? " day" : " days"); };
  const durText = d => d ? d + " days" : "Permanent";
  const benefitFor = (i, p) => i.btype === "mining" ? "+" + fmt(i.bval, 2) + "% extra ZENY on every mining claim" : i.btype === "trx" ? fmt(i.bval, 6) + " TRX every day" : fmt(i.bval, 2) + "% of the price = " + fmt(r6(p * i.bval / 100), 6) + " TRX every day";
  const mstate = (i, a, t) => a.some(h => h.id === i.id && active(h, t)) ? "owned" : C().left(i) <= 0 ? "sold" : !C().saleOpen(i, t) ? "closed" : "buy";
  const cardHtml = (i, s, t) => {
    const pct = C().discPct(i, t), p = C().priceNow(i, t), lf = C().left(i), se = C().saleEnd(i), b = C().BADGES[i.badge];
    const lab = s === "owned" ? "Owned" : s === "sold" ? "Sold Out" : s === "closed" ? "Closed" : "Buy Now";
    return `<article class="zm-card"><div class="im"><img src="${esc(i.img)}" alt="${esc(i.name)}" loading="lazy">${b ? `<span class="zm-bd ${b[1]}">${b[0]}</span>` : ""}${pct ? `<span class="ch">-${fmt(pct, 0)}%</span>` : ""}</div><b>${esc(i.name)}</b>
    <div class="zm-bf">${esc(benefitFor(i, p))}</div>
    <div class="zm-pr"><span>${ic("gem")}${pct ? `<s class="zm-old">${fmt(i.price)}</s>` : ""}${fmt(p)} TRX</span><button class="zm-buy" ${s !== "buy" ? "disabled" : ""} onclick="zvBuy('${esc(i.id)}')">${lab}</button></div>
    <div class="zm-mt">${durText(i.durDays)} &middot; ${lf === Infinity ? "Unlimited stock" : lf + " left"}${se && s === "buy" ? " &middot; Sale ends in " + dleft(se, t) : ""}</div></article>`;
  };
  const myCard = (h, t) => {
    const act = active(h, t), mining = h.bt === "mining", pend = mining ? h.pendZeny : h.pendTrx, unit = mining ? "ZENY" : "TRX";
    const st = h.exp == null ? "Permanent" : act ? dleft(h.exp, t) + " left" : "Expired";
    const info = mining ? "+" + fmt(h.bv, 2) + "% extra ZENY on every mining claim" : h.bt === "trx" ? fmt(h.daily, 6) + " TRX every day" : fmt(h.bv, 2) + "% of " + fmt(h.paid) + " TRX = " + fmt(h.daily, 6) + " TRX every day";
    const none = !(pend > 0), why = act ? (mining ? "Grows with your mining claims" : "Next reward at 10 PM") : "Nothing to claim";
    return `<article class="zm-card"><div class="im"><img src="${esc(h.img)}" alt="${esc(h.name)}" loading="lazy"><span class="zm-st ${act ? "" : "ex"}">${st}</span></div><b>${esc(h.name)}</b>
    <div class="zm-bf">${esc(info)}</div><div class="zm-mt">Ready to claim: <strong style="color:#fff">${fmt(pend, 8)} ${unit}</strong></div>
    <button class="zm-cl" ${none ? "disabled" : ""} onclick="zvNftClaim('${h.hid}')">${none ? why : "Claim " + fmt(pend, 6) + " " + unit}</button></article>`;
  };
  function gridHtml() {
    const t = Date.now(), q = S.q.trim().toLowerCase();
    if (S.tab === "My NFTs") {
      const a = settle().slice().sort((x, y) => (active(y, t) - active(x, t)) || y.ts - x.ts);
      if (!a.length) return '<div class="zm-empty">You do not hold any NFT yet. Buy one to see it here.</div>';
      const tr = a.reduce((s, h) => s + h.pendTrx, 0), zn = a.reduce((s, h) => s + h.pendZeny, 0);
      return `<div class="zm-all"><span>Ready: <strong>${fmt(tr, 6)} TRX</strong> &middot; <strong>${fmt(zn, 8)} ZENY</strong><br><small>A new day starts at 10 PM.</small></span><button class="zm-cl" ${tr > 0 || zn > 0 ? "" : "disabled"} onclick="zvNftClaimAll()">Claim all</button></div>` + a.map(h => myCard(h, t)).join("");
    }
    const own = load(), list = C().get().items.filter(i => !i.hidden && (S.tab === "All NFTs" || i.cats.includes(S.tab)) && (!q || i.name.toLowerCase().includes(q)));
    return list.length ? list.map(i => cardHtml(i, mstate(i, own, t), t)).join("") : '<div class="zm-empty">No NFT found.</div>';
  }
  function render() {
    const tabs = ["All NFTs", ...C().get().cats, "My NFTs"]; if (!tabs.includes(S.tab)) S.tab = "All NFTs";
    root.innerHTML = `<div class="in"><div class="hd"><button class="ib" onclick="zvmClose()" aria-label="Back">${ic("back")}</button><b>${ic("store")}NFT Marketplace</b><button class="ib" onclick="zvmSearch()" aria-label="Search">${ic("search")}</button></div>
      ${S.s ? `<input class="sr" id="zmQ" placeholder="Search NFTs" value="${esc(S.q)}" oninput="zvmQ(this.value)">` : ""}
      <div class="zm-bn2"><img src="nft-banner.jpg" alt="Discover Premium NFTs. Own and collect."><button class="zm-bgo" aria-label="Browse NFTs" onclick="document.getElementById('zmGrid').scrollIntoView({behavior:'smooth'})"></button></div</div>
      <div class="tabs">${tabs.map(t => `<button class="${t === S.tab ? "on" : ""}" onclick="zvmTab('${esc(t)}')">${esc(t)}</button>`).join("")}</div>
      <div class="grid" id="zmGrid">${gridHtml()}</div>
      <div class="zm-bonus">${ic("gift")}<div><b>5% Bonus for your referrer</b><small>When you buy your first pack or NFT, the member who invited you earns a 5% Purchase Bonus.</small></div></div>
      <div class="zm-note">Every NFT you buy counts toward your Level progress. NFT rewards follow the active period shown on each NFT. NFTs are not a promise of profit or income.${DEMO ? " Demo mode: purchases are samples only." : ""}</div></div>`;
  }
  const refresh = () => { if (!root || !root.classList.contains("open")) return; const g = document.getElementById("zmGrid"); if (g) g.innerHTML = gridHtml(); };
  const openMarket = () => { if (!root) return; render(); root.classList.add("open"); root.scrollTop = 0; };
  const closeMarket = () => { if (root) root.classList.remove("open"); };
  function buyForm(id) {
    if (window.ZenvyroSettings && window.ZenvyroSettings.block("market")) return;
    const t = Date.now(), i = C().get().items.find(x => x.id === id); if (!i) return;
    const pct = C().discPct(i, t), p = C().priceNow(i, t), lf = C().left(i), se = C().saleEnd(i);
    window.openModal("Buy NFT", `<div class="zm-bm"><img src="${esc(i.img)}" alt=""><div><b>${esc(i.name)}</b><span>${fmt(p)} TRX</span></div></div>
      <div class="modal-list"><div><strong>Price</strong><span>${pct ? "<s>" + fmt(i.price) + "</s> " : ""}${fmt(p)} TRX${pct ? " (-" + fmt(pct, 0) + "%)" : ""}</span></div>
      <div><strong>Benefit</strong><span>${esc(benefitFor(i, p))}</span></div><div><strong>Active for</strong><span>${durText(i.durDays)}</span></div>
      <div><strong>Stock</strong><span>${lf === Infinity ? "Unlimited" : lf + " left"}</span></div>${se ? `<div><strong>Sale ends in</strong><span>${dleft(se, t)}</span></div>` : ""}
      <div><strong>Your TRX balance</strong><span>${fmt(trxAvail(), 6)} TRX</span></div></div>
      <div class="modal-note">Daily rewards are added at 10 PM and wait for you to claim. When the active period ends, new rewards stop but what you already earned can still be claimed. ${DEMO ? "Demo mode: payment is not connected, so confirming adds this NFT without taking TRX." : "The price is taken from your TRX Wallet."}</div>
      <button class="btn" style="width:100%;margin-top:12px" onclick="zvBuyOk('${esc(i.id)}')">Confirm purchase</button>`);
  }
  // Purchase animation (~3.6 s): only transform/opacity are animated (GPU, light on CPU), then the success popup opens.
  let buying = false;
  function successPop(i, paid) {
    window.openModal("Purchase Successful", `<div style="text-align:center"><div class="zm-ok"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9.5"/><path d="M7.5 12.5l3 3 6-6.5"/></svg></div>
      <b style="display:block;font-size:19px;margin:10px 0 12px">Your NFT purchase was successful</b></div>
      <div class="zm-bm"><img src="${esc(i.img)}" alt=""><div><b>${esc(i.name)}</b><span>${fmt(paid)} TRX paid</span></div></div>
      <div class="modal-list"><div><strong>Benefit</strong><span>${esc(benefitFor(i, paid))}</span></div><div><strong>Active for</strong><span>${durText(i.durDays)}</span></div></div>
      <button class="btn" style="width:100%;margin-top:12px" onclick="zvBuyDone()">View My NFTs</button>`);
  }
  function buyFx(i, paid) {
    const done = () => { buying = false; successPop(i, paid); };
    const red = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    const ov = document.createElement("div"); ov.className = "zm-fx";
    ov.innerHTML = `<div class="zm-fx-c"><i class="r"></i><i class="r r2"></i><i class="r r3"></i><img src="${esc(i.img)}" alt=""></div><p class="zm-fx-t">Confirming your purchase...</p>`;
    if (red || typeof ov.animate !== "function") return done();
    document.body.appendChild(ov);
    const c = ov.firstChild, rg = c.querySelectorAll(".r"), tx = ov.querySelector(".zm-fx-t");
    ov.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 250, fill: "forwards" });
    [[5200, 0], [3800, 1], [7000, 0]].forEach((r, k) => rg[k].animate([{ transform: "rotate(0deg)" }, { transform: "rotate(360deg)" }], { duration: r[0], iterations: Infinity, direction: r[1] ? "reverse" : "normal" }));
    c.querySelector("img").animate([{ transform: "scale(.84)" }, { transform: "scale(1.05)" }], { duration: 850, direction: "alternate", iterations: Infinity, easing: "ease-in-out" });
    const cols = ["#ff8a2b", "#3aa0ff", "#c07bff"];
    for (let k = 0; k < 18; k++) {   // energy streaks pulled into the NFT
      const s = document.createElement("i"); s.className = "s"; s.style.background = cols[k % 3]; c.appendChild(s);
      const a = k * 20 + Math.random() * 12;
      s.animate([{ transform: `rotate(${a}deg) translateX(260px) scaleX(.4)`, opacity: 0 }, { opacity: 1, offset: .5 }, { transform: `rotate(${a}deg) translateX(80px) scaleX(1.4)`, opacity: 0 }],
        { duration: 700 + Math.random() * 500, delay: Math.random() * 600, iterations: Infinity, easing: "ease-in" });
    }
    setTimeout(() => { tx.textContent = "Adding it to your collection..."; }, 1700);
    setTimeout(() => {   // final flash + shockwave
      const f = document.createElement("div"); f.className = "zm-fx-f"; ov.appendChild(f);
      f.animate([{ opacity: 0 }, { opacity: .9, offset: .25 }, { opacity: 0 }], { duration: 500, easing: "ease-out" });
      c.animate([{ transform: "scale(1)" }, { transform: "scale(1.18)", offset: .3 }, { transform: "scale(1)" }], { duration: 500, easing: "ease-out" });
    }, 3100);
    setTimeout(() => { if (ov.parentNode) ov.parentNode.removeChild(ov); done(); }, 3600);
  }
  function buyOk(id) {
    if (buying) return;
    if (window.ZenvyroSettings && window.ZenvyroSettings.block("market")) return;
    const cat = C().get(), t = Date.now(), i = cat.items.find(x => x.id === id), W = window.ZenvyroWallet;
    const stop = m => { buying = false; window.closeModal(); say(m); };
    if (!i || i.hidden) return stop("This NFT is not available");
    if (!C().saleOpen(i, t)) return stop("The sale of this NFT has ended");
    if (C().left(i) <= 0) return stop("This NFT is sold out");
    const a = load(); if (a.some(h => h.id === id && active(h, t))) return stop("You already own this NFT");
    const paid = C().priceNow(i, t);
    buying = true;
    if (!DEMO) {   // real payment: TRX from the Wallet (on the real server this check and debit happen there)
      if (trxAvail() + 1e-9 < paid) return stop("Not enough TRX in your Wallet");
      if (!W || !W.debit("TRX", paid)) return stop("Payment failed");
    }
    i.sold = (i.sold || 0) + 1; C().save(cat);
    a.push(mkHolding(i, paid, t)); store(a);
    if (LVL()) { LVL().addOwn(paid); LVL().markPack(); }
    window.closeModal();
    if (root && root.classList.contains("open")) render();
    buyFx(i, paid);
  }
  function claimOne(hid) {
    const a = settle(), h = a.find(x => x.hid === hid), M = window.ZenvyroMining, E = window.ZenvyroEarn; if (!h) return;
    if (h.bt === "mining") {
      const n = h.pendZeny; if (!(n > 0)) return;
      if (!M || !M.addZeny) return say("Mining is not ready");
      M.addZeny(n); h.pendZeny = 0; store(a); say("+" + fmt(n, 8) + " ZENY added");
    } else {
      const n = h.pendTrx; if (!(n > 0)) return;
      if (!E || !E.addTrx(n)) return say("Claim failed");
      h.pendTrx = 0; store(a); say("+" + fmt(n, 6) + " TRX added to your Exchange Wallet");
    }
    refresh();
  }
  function claimAll() {
    const a = settle(), M = window.ZenvyroMining, E = window.ZenvyroEarn; let tr = 0, zn = 0;
    a.forEach(h => { tr += h.pendTrx; zn += h.pendZeny; }); tr = r6(tr); zn = r8(zn);
    if (!(tr > 0 || zn > 0)) return;
    if (zn > 0 && !(M && M.addZeny)) return say("Mining is not ready");
    if (tr > 0 && !(E && E.addTrx(tr))) return say("Claim failed");
    if (zn > 0) M.addZeny(zn);
    a.forEach(h => { h.pendTrx = 0; h.pendZeny = 0; }); store(a);
    say("Added to your Exchange Wallet: " + (tr > 0 ? fmt(tr, 6) + " TRX" : "") + (tr > 0 && zn > 0 ? " and " : "") + (zn > 0 ? fmt(zn, 8) + " ZENY" : ""));
    refresh();
  }

  // ---- Profile Summary ----
  function summaryBody() {
    const L = LVL() ? LVL().get() : { lvl: 0 };
    const tier = tierName(), PK = (window.ZenvyroAPI && window.ZenvyroAPI.PACKS) || {}, packVal = PK[tier] || 0;
    const nfts = load().filter(h => active(h, Date.now())), count = nfts.length + (packVal ? 1 : 0);
    const value = nfts.reduce((t, i) => t + (+i.paid || 0), 0) + packVal;
    const boost = LVL() ? LVL().boost() : 0, base = RATE[tier] || RATE.Free, total = base * (1 + boost / 100);
    const tx = jget(TXKEY, []), wds = Array.isArray(tx) ? tx.filter(t => t && t.kind === "withdraw" && t.sym === "TRX") : [];
    const pend = wds.filter(t => t.status === "pending").reduce((a, t) => a + (+t.amount || 0) + (t.holdIn ? 0 : (+t.hold || 0)), 0);
    const done = wds.filter(t => t.status === "completed").reduce((a, t) => a + (+t.amount || 0), 0);
    let held = 0; try { held = window.ZenvyroExchange.requests().filter(r => r.status === "pending").reduce((a, r) => a + (+r.zeny || 0), 0); } catch (e) {}
    const AH = window.ZenvyroAirdropHold || { get: () => ({}), pct: 30 }, holds = AH.get(), hZ = +holds.ZENY || 0;
    const hOthers = Object.keys(holds).filter(k => k !== "ZENY" && +holds[k] > 0).map(k => fmt(holds[k], 8) + " " + k).join(", ");
    const avail = L.lvl < 1 ? 0 : Math.max(0, trxBal() - pend);
    const ms = new Date(); ms.setDate(1); ms.setHours(0, 0, 0, 0);
    const used = wds.filter(t => t.status !== "rejected" && (+t.ts || 0) >= ms.getTime()).length;
    const lim = LVL() ? LVL().wd() : 0, unl = lim === Infinity;
    return `<div class="zs-hero"><small>Mining Speed</small><div class="big">${total.toFixed(6)} <i>ZENY / hour</i></div>
      <span class="zs-chip">${ic("bolt")}${boost ? "+" + boost + "% Level " + L.lvl + " boost" : "Level " + L.lvl + " · no boost yet"}</span><div class="zm-note" style="margin-top:8px">Base rate ${base.toFixed(6)} (${esc(tier)} Pack). The real reward is calculated by the server.</div></div>
      <div class="zs-g">
        <div class="zs-c">${ic("gem")}<small>NFT Holdings</small><b>${count}</b><em>${fmt(value)} TRX total</em></div>
        <div class="zs-c fz">${ic("snow")}<small>Frozen Balance</small><b>${fmt(pend, 6)} TRX</b><em>${fmt(held, 6)} ZENY on hold</em></div>
        <div class="zs-c">${ic("out")}<small>Total Withdrawal</small><b>${fmt(done, 6)} TRX</b><em>Withdrawn so far</em></div>
        <div class="zs-c av">${ic("wallet")}<small>Available Withdrawal</small><b>${fmt(avail, 6)} TRX</b><em>${L.lvl < 1 ? "Unlocks at Level 1" : "You receive 70% of each withdrawal"}</em></div>
        <div class="zs-c hold">${ic("gem")}<small>Hold Token for Airdrop</small><b>${fmt(hZ, 6)} ZENY</b><em>${hOthers ? esc(hOthers) + " (older holds) &middot; " : ""}${AH.pct}% of each withdrawal is held as ZENY. Airdrop details coming soon.</em></div></div>
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
      zvNftClaim: claimOne, zvNftClaimAll: claimAll,
      zvBuyDone: () => { window.closeModal(); S.tab = "My NFTs"; if (root && !root.classList.contains("open")) openMarket(); else render(); },
      zvmTab: t => { S.tab = t; render(); },
      zvmSearch: () => { S.s = !S.s; if (!S.s) S.q = ""; render(); const e = document.getElementById("zmQ"); if (e) e.focus(); },
      zvmQ: v => { S.q = v; const g = document.getElementById("zmGrid"); if (g) g.innerHTML = gridHtml(); }
    });
    window.ZenvyroNft = { onMiningClaim, holdings: () => load(), totalPaid: () => load().reduce((t, h) => t + (+h.paid || 0), 0) };   // every NFT ever bought counts, expired ones too
    const o = window.showSection;
    if (typeof o === "function") window.showSection = function () { closeMarket(); return o.apply(this, arguments); };
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
