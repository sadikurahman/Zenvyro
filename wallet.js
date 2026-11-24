/* Zenvyro — Step 3b: Wallet page (Deposit / Withdraw / Transfer / My Assets / Recent Transactions)
   JavaScript only; styles are scoped to #zvWallet, the rest of the page CSS is unchanged.
   - Deposit and Withdraw: requests that an admin accepts/rejects.
   - Transfer: user to user, instant, no admin involvement.
   Data is in localStorage for now (demo). Real balances/approvals/transfers must be verified on a server. */
(() => {
  "use strict";

  const ASSETS = [
    { sym: "TRX", name: "TRON", ch: "T", bg: "#e8003d", net: "TRC20", dec: 6 },
    { sym: "USDT", name: "Tether", ch: "₮", bg: "#1fbf8f", net: "TRC20", dec: 6 },
    { sym: "BTC", name: "Bitcoin", ch: "₿", bg: "#f7931a", net: "BTC", dec: 8 },
    { sym: "TON", name: "Toncoin", ch: "▽", bg: "#1da1f2", net: "TON", dec: 6 },
    { sym: "BNB", name: "BNB", ch: "◆", bg: "#f3ba2f", net: "BEP20", dec: 6 },
    { sym: "SOL", name: "Solana", ch: "≡", bg: "#9b4dff", net: "SOL", dec: 6 }
  ];
  const TXKEY = "zenvyro_tx_v1";
  const MY_ID = window.ZENVYRO_MY_ID || "ZENV-NEW-MEMBER";
  const ZENY_USDT = 3;

  const $ = id => document.getElementById(id);
  const say = m => { if (typeof window.toast === "function") window.toast(m); };
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const asset = sym => ASSETS.find(a => a.sym === sym);
  const usd = n => "$" + Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const W = () => window.ZenvyroWallet;
  const bals = () => (W() ? W().balances() : {});

  // ---- Transactions store ----
  function loadTx() {
    try {
      const a = JSON.parse(localStorage.getItem(TXKEY) || "[]");
      return Array.isArray(a) ? a.filter(t => t && t.id && t.kind && asset(t.sym) && typeof t.status === "string") : [];
    } catch (e) { return []; }
  }
  let txs = loadTx();
  const saveTx = () => { try { localStorage.setItem(TXKEY, JSON.stringify(txs.slice(0, 200))); } catch (e) {} };
  const newId = p => p + Date.now().toString(36).toUpperCase() + Math.floor(Math.random() * 1296).toString(36).toUpperCase();

  window.ZenvyroTx = {
    log(t) { txs = loadTx(); txs.unshift(Object.assign({ ts: Date.now() }, t)); saveTx(); render(); },
    update(id, patch) { txs = loadTx(); const t = txs.find(x => x.id === id); if (t) { Object.assign(t, patch); saveTx(); render(); } }
  };

  // Airdrop Hold: 30% of every withdrawal is NOT paid out. The member receives 70% of the requested amount; when the withdrawal
  // is completed, the 30% is converted to ZENY and kept in "Airdrop Hold" (shown in the Wallet and Summary, never withdrawable).
  // Requests made under the earlier rule (extra 30% on top, no holdIn flag) are still honoured. A server must enforce this too.
  const HOLD_PCT = 30, HKEY = "zenvyro_airdrophold_v1";
  let holds = (() => { try { const o = JSON.parse(localStorage.getItem(HKEY) || "{}"); return o && typeof o === "object" ? o : {}; } catch (e) { return {}; } })();
  const saveHolds = () => { try { localStorage.setItem(HKEY, JSON.stringify(holds)); } catch (e) {} };
  window.ZenvyroAirdropHold = { get: () => Object.assign({}, holds), pct: HOLD_PCT };
  const holdOf = amt => Math.round(amt * HOLD_PCT / 100 * 1e8) / 1e8;
  const locked = sym => txs.filter(t => t.kind === "withdraw" && ["pending", "accepted", "confirmed"].includes(t.status) && t.sym === sym).reduce((a, t) => a + +t.amount + (t.holdIn ? 0 : (+t.hold || 0)), 0);
  const availAmt = sym => Math.max(0, (bals()[sym] ? bals()[sym].amount : 0) - locked(sym));
  const maxWd = sym => availAmt(sym);
  function availUsdt() {
    const b = bals(); let v = 0;
    ASSETS.forEach(a => { const x = b[a.sym]; if (x && x.amount > 0) v += x.value * (availAmt(a.sym) / x.amount); });
    return v;
  }
  const zenyBal = () => (window.ZenvyroMining ? window.ZenvyroMining.getState().balance : 0);

  // ---- CSS (only for #zvWallet). Every size is design-pixels x --u, so the page scales exactly like the design on any phone width ----
  const u = n => `calc(${n} * var(--u))`;
  const ART = {"W":820,"H":568,"p":{"hero":[0,0,460,376],"gift":[462,0,256,148],"zlogo":[720,0,82,82],"bell":[0,378,80,80],"user":[82,378,80,80],"swap":[164,378,98,98],"gem":[264,378,98,98],"dep":[364,378,80,80],"wd":[446,378,80,80],"tr":[528,378,80,80],"trx":[610,378,90,90],"usdt":[702,378,90,90],"btc":[0,478,90,90],"ton":[92,478,90,90],"bnb":[184,478,90,90],"sol":[276,478,90,90]}}, AV = "20261114p";
  (window.ZV_ART = window.ZV_ART || []).push("wallet-art.webp?v=" + AV);
  const spriteCss = Object.keys(ART.p).map(k => { const q = ART.p[k]; return `#zvWallet .s-${k}{display:block;flex-shrink:0;width:${u(q[2])};height:${u(q[3])};background:url(wallet-art.webp?v=${AV}) no-repeat;background-size:${u(ART.W)} ${u(ART.H)};background-position:calc(${-q[0]} * var(--u)) calc(${-q[1]} * var(--u))}`; }).join("\n");
  const css = `
#zvWallet{--u:calc(min(100vw,var(--maxw,520px))/852);position:fixed;inset:0;z-index:4;overflow-y:auto;overflow-x:hidden;-webkit-overflow-scrolling:touch;display:none;padding:calc(${u(40)} + env(safe-area-inset-top,0px)) 0 calc(130px + env(safe-area-inset-bottom,0px));color:#fff;font-family:Inter,system-ui,-apple-system,"Segoe UI",sans-serif;
background-attachment:local;background-image:radial-gradient(ellipse ${u(300)} ${u(200)} at 0 0,#4c099ecc,transparent 72%),radial-gradient(ellipse ${u(320)} ${u(120)} at 70% 0,#3a14a0bb,transparent 72%),radial-gradient(ellipse ${u(120)} ${u(330)} at 0 ${u(400)},#8a2070dd,transparent 74%),radial-gradient(ellipse ${u(70)} ${u(200)} at 0 ${u(470)},#d0603acc,transparent 74%),radial-gradient(ellipse ${u(200)} ${u(300)} at 0 ${u(1300)},#2a0a7acc,transparent 72%),radial-gradient(ellipse ${u(520)} ${u(300)} at 100% ${u(1500)},#1a0a6a99,transparent 72%),radial-gradient(ellipse ${u(700)} ${u(400)} at 50% 100%,#2a0f7a77,transparent 72%);background-color:#030119}
#zvWallet.open{display:block}
#zvWallet *{box-sizing:border-box}
#zvWallet button{font-family:inherit;color:inherit;cursor:pointer;-webkit-tap-highlight-color:transparent;appearance:none;-webkit-appearance:none}
#zvWallet .in{position:relative;width:${u(852)};max-width:100%;margin:0 auto}
#zvWallet .pg{padding:0 ${u(28)}}
#zvWallet .h0{position:relative;height:${u(75)}}
#zvWallet .h0 .bgr{position:absolute;left:${u(45)};top:${u(18)};width:${u(43)};height:${u(37)};border:0;background:none;padding:0}
#zvWallet .h0 .bgr svg,#zvWallet .eye svg,#zvWallet .chv svg{display:block;width:100%;height:100%}
#zvWallet .h0 .dv{position:absolute;left:${u(121)};top:0;width:1px;height:${u(75)};background:linear-gradient(transparent,#ffffff2b,transparent)}
#zvWallet .h0 .s-zlogo{position:absolute;left:${u(142)};top:${u(-6)}}
#zvWallet .h0 .wm{position:absolute;left:${u(250)};top:${u(7)};font-size:${u(33)};line-height:${u(40)};font-weight:600;letter-spacing:${u(9)};color:#fff;white-space:nowrap}
#zvWallet .h0 .tg{position:absolute;left:${u(250)};top:${u(49)};font-size:${u(18.3)};line-height:${u(24)};color:#b9b3ea;letter-spacing:${u(.5)};white-space:nowrap}
#zvWallet .h0 .hb{position:absolute;top:${u(-2)};border:0;background:none;padding:0;width:${u(80)};height:${u(80)}}
#zvWallet .bx{position:relative}
#zvWallet .bx:before{content:"";position:absolute;inset:0;border-radius:inherit;padding:${u(2.4)};background:var(--bd);-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);mask-composite:exclude;pointer-events:none;z-index:3}
#zvWallet .hero{height:${u(383)};margin-top:${u(55)};border-radius:${u(46)};overflow:hidden;box-shadow:0 0 ${u(50)} #6b32ff44;--bd:linear-gradient(135deg,#efe2ff 0%,#8a52ff 24%,#3a2aa0 52%,#6a3ff0 78%,#c06aff 100%);
background:radial-gradient(ellipse ${u(320)} ${u(230)} at 0 26%,#2a0a8a99,transparent 72%),radial-gradient(ellipse ${u(300)} ${u(220)} at 0 100%,#0a24a099,transparent 72%),radial-gradient(ellipse ${u(520)} ${u(200)} at 70% 112%,#5a1a9a88,transparent 72%),linear-gradient(160deg,#12034a 0%,#04012a 40%,#02012a 72%,#06104a 100%)}
#zvWallet .hero>*{position:absolute;z-index:2}
#zvWallet .hero .s-hero{left:${u(328)};top:0;z-index:1}
#zvWallet .hero .sc{left:${u(45)};top:${u(22)};width:${u(284)};height:${u(48)};border-radius:${u(24)};background:linear-gradient(90deg,#2850dc,#1b2a9c 65%,#171a6a);border:1px solid #5b7bff77;display:flex;align-items:center;gap:${u(10)};padding-left:${u(13)};font-size:${u(19)};font-weight:500;color:#fff;white-space:nowrap}
#zvWallet .hero .sc svg{width:${u(26)};height:${u(30)}}
#zvWallet .hero .tl{left:${u(48)};top:${u(95)};font-size:${u(28)};line-height:${u(36)};color:#dcd6f7;display:flex;align-items:center;gap:${u(18)};white-space:nowrap}
#zvWallet .eye{width:${u(38)};height:${u(24)};border:0;background:none;padding:0;display:block}
#zvWallet .hero .amt{left:${u(46)};top:${u(128)};line-height:${u(112)};font-weight:700;letter-spacing:${u(-1)};white-space:nowrap}
#zvWallet .hero .es{left:${u(52)};top:${u(247)};display:flex;align-items:center;gap:${u(16)};font-size:${u(24.5)};line-height:${u(36)};color:#e6e2fa;white-space:nowrap}
#zvWallet .hero .es svg{width:${u(27)};height:${u(30)}}
#zvWallet .hero .wa{left:${u(46)};top:${u(302)};width:${u(207)};height:${u(53)};border-radius:${u(27)};border:1px solid #3dd6a0aa;background:linear-gradient(90deg,#1b5a52,#0a2a3a 75%);display:flex;align-items:center;gap:${u(14)};padding-left:${u(20)};font-size:${u(21.5)};font-weight:700;color:#79ffa8;white-space:nowrap}
#zvWallet .hero .wa i{width:${u(20)};height:${u(20)};border-radius:50%;background:#5cff8c;box-shadow:0 0 ${u(12)} #5cff8c}
#zvWallet .two{display:grid;grid-template-columns:1fr 1fr;gap:${u(26)};margin-top:${u(42)}}
#zvWallet .xc,#zvWallet .ac{height:${u(192)};border-radius:${u(42)};overflow:hidden;text-align:left;border:0;padding:0;color:#fff;cursor:pointer}
#zvWallet .xc{--bd:linear-gradient(135deg,#4a7bff,#2a2a90 40%,#3a2aa0 70%,#6a4aff);background:radial-gradient(ellipse ${u(220)} ${u(160)} at 0 0,#2548c8bb,transparent 70%),radial-gradient(ellipse ${u(320)} ${u(120)} at 50% 115%,#3a2ac077,transparent 70%),linear-gradient(160deg,#10114a,#050326 55%,#0b0540)}
#zvWallet .ac{--bd:linear-gradient(135deg,#5a3aff,#2a2a90 40%,#2a3ad0 80%,#5a7aff);background:radial-gradient(ellipse ${u(280)} ${u(190)} at 100% 100%,#3a78f0dd,transparent 70%),radial-gradient(ellipse ${u(220)} ${u(150)} at 0 0,#2a0f70bb,transparent 70%),linear-gradient(160deg,#1a0c58,#121236 55%,#1a2a9a)}
#zvWallet .xc>*,#zvWallet .ac>*{position:absolute;z-index:2;white-space:nowrap}
#zvWallet .xc .s-swap{left:${u(25)};top:${u(26)}}
#zvWallet .ac .s-gem{left:${u(21)};top:${u(26)}}
#zvWallet .xc .a{left:${u(150)};top:${u(24)};font-size:${u(23.5)};line-height:${u(36)};font-weight:700}
#zvWallet .xc .chv{right:${u(24)};top:${u(31)};width:${u(18)};height:${u(26)}}
#zvWallet .xc .b{left:${u(150)};top:${u(67)};font-size:${u(18)};line-height:${u(26)};color:#bdb8ea}
#zvWallet .xc .c{left:${u(150)};top:${u(100)};font-size:${u(23.5)};line-height:${u(36)};font-weight:700}
#zvWallet .xc .c em,#zvWallet .ac .c em{font-style:normal;font-weight:400;font-size:.85em;color:#d0cbf0}
#zvWallet .xc .d{left:${u(147)};top:${u(146)};display:flex;align-items:center;gap:${u(8)};font-size:${u(17)};line-height:${u(26)};color:#cfcaf0}
#zvWallet .xc .d svg{width:${u(24)};height:${u(24)}}
#zvWallet .ac .a{left:${u(145)};top:${u(24)};font-size:${u(20.5)};line-height:${u(36)};font-weight:500;color:#ece8ff;display:flex;align-items:center;gap:${u(8)}}
#zvWallet .ac .a svg{width:${u(14)};height:${u(22)}}
#zvWallet .ac .c{left:${u(145)};top:${u(74)};font-size:${u(38)};line-height:${u(46)};font-weight:700}
#zvWallet .ac .d{left:${u(145)};top:${u(134)};font-size:${u(21.5)};line-height:${u(30)};color:#c9c5ef}
#zvWallet .acts{display:grid;grid-template-columns:repeat(3,1fr);gap:${u(26)};margin-top:${u(33)}}
#zvWallet .acts button{position:relative;height:${u(188)};border-radius:${u(40)};overflow:hidden;border:0;padding:0;color:#fff;text-align:center}
#zvWallet .acts button>*{position:absolute;z-index:2;left:0;right:0}
#zvWallet .acts .ai{left:50%;right:auto;top:${u(5)};transform:translateX(-50%)}
#zvWallet .acts b{top:${u(102)};font-size:${u(26.5)};line-height:${u(32)};font-weight:700}
#zvWallet .acts small{top:${u(142)};font-size:${u(19.5)};line-height:${u(24)};font-weight:400;color:#f1eeff}
#zvWallet .acts .dep{--bd:linear-gradient(135deg,#9af5d4,#2c584f 50%,#5cc8a0);background:radial-gradient(ellipse 90% 70% at 20% 0,#52b595cc,transparent 65%),linear-gradient(165deg,#2f7d6a,#0a2a30 60%,#1b4c50)}
#zvWallet .acts .wd{--bd:linear-gradient(135deg,#ffc98a,#6f4b29 50%,#ff9a6a);background:radial-gradient(ellipse 90% 70% at 20% 0,#d07a2aee,transparent 65%),radial-gradient(ellipse 80% 60% at 90% 100%,#d4605ccc,transparent 65%),linear-gradient(165deg,#8a4a1e,#3a1418 60%,#9a4a44)}
#zvWallet .acts .trf{--bd:linear-gradient(135deg,#9abaff,#325abc 50%,#6a8aff);background:radial-gradient(ellipse 90% 70% at 20% 0,#4a74f0cc,transparent 65%),linear-gradient(165deg,#2a54c8,#232a8a 60%,#4a66e0)}
#zvWallet .air{display:block;width:100%;height:${u(158)};margin-top:${u(37)};border-radius:${u(48)};overflow:hidden;border:0;padding:0;text-align:left;color:#fff;cursor:pointer;--bd:linear-gradient(120deg,#8aefff 0%,#5a2ac0 25%,#3a1a80 55%,#c8607a 90%,#ffb06a);background:radial-gradient(ellipse ${u(320)} ${u(170)} at 100% 100%,#c8506add,transparent 65%),radial-gradient(ellipse ${u(280)} ${u(170)} at 85% 15%,#3a1a9a99,transparent 70%),radial-gradient(ellipse ${u(260)} ${u(120)} at 4% 95%,#c87a2a66,transparent 70%),linear-gradient(100deg,#0b022f,#050030 50%,#14023f 75%,#2a0a4a)}
#zvWallet .air>*{position:absolute;z-index:2;white-space:nowrap}
#zvWallet .air .s-gift{left:${u(6)};top:${u(5)}}
#zvWallet .air .a{left:${u(269)};top:${u(29)};font-size:${u(26)};line-height:${u(32)};font-weight:500;display:flex;align-items:center;gap:${u(12)}}
#zvWallet .air .a svg{width:${u(22)};height:${u(28)}}
#zvWallet .air .c{left:${u(269)};top:${u(65)};font-size:${u(31)};line-height:${u(40)};font-weight:700}
#zvWallet .air .c em{font-style:normal;font-weight:500}
#zvWallet .air .d{left:${u(269)};top:${u(110)};font-size:${u(20.5)};line-height:${u(26)};color:#efeaff}
#zvWallet .air .chv{right:${u(30)};top:${u(58)};width:${u(24)};height:${u(42)}}
#zvWallet .mc,#zvWallet .tc{border-radius:${u(46)};overflow:hidden;margin-top:${u(39)};--bd:linear-gradient(135deg,#c8a0ff 0%,#6a3ac8 30%,#3a2290 60%,#a070ff 100%);background:radial-gradient(ellipse ${u(220)} ${u(420)} at 0 30%,#8a2ed766,transparent 70%),radial-gradient(ellipse ${u(520)} ${u(170)} at 85% 100%,#4a22c088,transparent 70%),linear-gradient(170deg,#12053f,#07031f 40%,#06031c 75%,#0d0640)}
#zvWallet .mc{height:${u(852)};position:relative}
#zvWallet .tc{position:relative;padding:${u(86)} 0 ${u(10)}}
#zvWallet .mc>.ib,#zvWallet .tc>.ib{position:absolute;left:${u(40)};top:${u(32)};width:${u(62)};height:${u(66)};border-radius:${u(18)};border:1px solid #7a4aff99;background:linear-gradient(160deg,#2a1475,#0c0634);box-shadow:0 0 ${u(18)} #7a3dff77;display:grid;place-items:center}
#zvWallet .tc>.ib{top:${u(20)};height:${u(60)};width:${u(60)}}
#zvWallet .ib svg{width:${u(34)};height:${u(34)}}
#zvWallet .mc>h3,#zvWallet .tc>h3{position:absolute;left:${u(130)};top:${u(45)};margin:0;font-size:${u(34.5)};line-height:${u(44)};font-weight:700}
#zvWallet .tc>h3{top:${u(26)};font-size:${u(29)};font-weight:600}
#zvWallet .mc .tv{position:absolute;right:${u(48)};top:${u(18)};text-align:right}
#zvWallet .mc .tv small{display:flex;align-items:center;justify-content:flex-end;gap:${u(12)};font-size:${u(22)};line-height:${u(30)};color:#b9b4e8}
#zvWallet .mc .tv b{display:block;font-size:${u(41)};line-height:${u(52)};font-weight:700;margin-top:${u(8)}}
#zvWallet .mc .tv .eye{width:${u(30)};height:${u(20)}}
#zvWallet .rows{position:absolute;left:${u(22)};right:${u(22)};top:${u(135)}}
#zvWallet .ar{display:flex;align-items:center;gap:${u(26)};width:100%;height:${u(114)};margin-bottom:${u(4)};padding:0 ${u(26)} 0 ${u(20)};border-radius:${u(34)};border:1px solid #2a1a6a;background:linear-gradient(90deg,#0c0430,#080226);color:#fff;text-align:left}
#zvWallet .ar.hl{border-color:#8a2ed7;background:linear-gradient(90deg,#34055dcc,#0d0433 58%);box-shadow:inset 0 0 ${u(30)} #7a2ae055}
#zvWallet .ar .nm{font-size:${u(29.5)};font-weight:700;white-space:nowrap}
#zvWallet .ar .tk{margin-left:${u(18)};display:inline-block;height:${u(40)};padding:0 ${u(17)};line-height:${u(38)};border-radius:${u(20)};border:1px solid #4a3aa8;background:#1a1250aa;color:#c8b8ff;font-size:${u(20)};font-weight:500;vertical-align:middle}
#zvWallet .ar .rt{margin-left:auto;text-align:right}
#zvWallet .ar .rt b{display:block;font-size:${u(29)};line-height:${u(38)};font-weight:700}
#zvWallet .ar .rt small{display:block;font-size:${u(22.3)};line-height:${u(30)};color:#c0bce8}
#zvWallet .ar .go{width:${u(14)};height:${u(24)};flex-shrink:0}
#zvWallet .tc .va{position:absolute;right:${u(44)};top:${u(26)};font-size:${u(24)};line-height:${u(44)};font-weight:700;color:#a98bff;display:flex;align-items:center;gap:${u(10)};cursor:pointer}
#zvWallet .tc .va svg{width:${u(14)};height:${u(24)}}
#zvWallet .tx{display:flex;align-items:center;gap:${u(26)};min-height:${u(112)};margin:0 ${u(22)};padding:0 ${u(8)};border-top:1px solid #ffffff14}
#zvWallet .tx:first-of-type{border-top-color:#ffffff1f}
#zvWallet .tx .ti{width:${u(76)};height:${u(76)};border-radius:50%;display:grid;place-items:center;flex-shrink:0;box-shadow:0 0 ${u(18)} #7a3dff55}
#zvWallet .tx .ti svg{width:${u(38)};height:${u(38)}}
#zvWallet .tx .mid{flex:1;min-width:0}
#zvWallet .tx .mid b{font-size:${u(26)};line-height:${u(38)};font-weight:700;display:flex;align-items:center;gap:${u(12)}}
#zvWallet .tx .mid small{display:block;font-size:${u(21.5)};line-height:${u(30)};color:#b8b3e8;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#zvWallet .tx .rt{text-align:right;flex-shrink:0}
#zvWallet .tx .rt b{display:block;font-size:${u(26.5)};line-height:${u(38)};font-weight:700}
#zvWallet .tx .rt small{display:block;font-size:${u(21)};line-height:${u(30)};color:#b8b3e8}
#zvWallet .st{display:inline-block;font-size:${u(19)};line-height:${u(26)};padding:0 ${u(12)};border-radius:${u(13)};border:1px solid;font-weight:600}
#zvWallet .st.pending{color:#ffc24a;border-color:#a8791b;background:#2d2208}
#zvWallet .st.rejected{color:#ff7a90;border-color:#a8283f;background:#2d0c14}
#zvWallet .st.accepted{color:#6ab8ff;border-color:#2a68a8;background:#08203a}
#zvWallet .st.done{color:#4ef0b0;border-color:#1b8a64;background:#082d22}
#zvWallet .pos{color:#6dffb0}#zvWallet .neg{color:#ffa33a}
#zvWallet .empty{margin:0 ${u(22)};padding:${u(30)} ${u(8)};color:#b8b3e8;border-top:1px solid #ffffff14;font-size:${u(26)}}
${spriteCss}`;
  const style = document.createElement("style"); style.textContent = css; document.head.appendChild(style);

  // ---- Page ----
  let hidden = false, showAll = false, root = null, lastHtml = "";
  const mask = t => (hidden ? "••••" : t);

  // up to 8/6 decimals, trailing zeros trimmed (at least 2 places)
  const fmtAmt = (n, a) => { let x = (+n).toFixed(a.dec > 6 ? 8 : 6).replace(/0+$/, ""); const d = x.split(".")[1] || ""; return d.length < 2 ? (+n).toFixed(2) : x; };

  const SV = {
    burger: '<svg viewBox="0 0 43 37" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"><path d="M3 4h37M3 18.500h37M3 33h37"/></svg>',
    shield: '<svg viewBox="0 0 24 28"><path d="M12 1l10 4v8c0 7-4.500 11.500-10 14C6.500 24.500 2 20 2 13V5z" fill="#fff"/><path d="M8 13l3 3 5-6" stroke="#2850dc" stroke-width="2.600" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    eye: '<svg viewBox="0 0 38 24" fill="none" stroke="#d5ccff" stroke-width="2.800" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12C7 4.500 12.500 2 19 2s12 2.500 17 10c-5 7.500-10.500 10-17 10S7 19.500 2 12z"/><circle cx="19" cy="12" r="5.200" fill="#d5ccff" stroke="none"/></svg>',
    eyeoff: '<svg viewBox="0 0 38 24" fill="none" stroke="#d5ccff" stroke-width="2.800" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12C7 4.500 12.500 2 19 2s12 2.500 17 10c-5 7.500-10.500 10-17 10S7 19.500 2 12z"/><path d="M5 22L33 2"/></svg>',
    up: '<svg viewBox="0 0 28 30" fill="none" stroke="#5cff8c" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><path d="M14 28V4M4 13L14 3l10 10"/></svg>',
    chv: '<svg viewBox="0 0 14 24" fill="none" stroke="currentColor" stroke-width="3.200" stroke-linecap="round" stroke-linejoin="round"><path d="M2 2l10 10L2 22"/></svg>',
    chart: '<svg viewBox="0 0 24 24" fill="none" stroke="#b36bff" stroke-width="3.200" stroke-linecap="round"><path d="M3 21v-7M9 21V9M15 21v-6M21 21V4"/></svg>',
    lock: '<svg viewBox="0 0 22 28"><path d="M5 12V8a6 6 0 0 1 12 0v4" fill="none" stroke="#f6c453" stroke-width="3"/><rect x="2" y="12" width="18" height="14" rx="3.500" fill="#f6c453"/></svg>',
    bars: '<svg viewBox="0 0 32 32" fill="none" stroke-width="5" stroke-linecap="round"><path d="M6 27v-8" stroke="#d38dff"/><path d="M16 27V7" stroke="#a45cff"/><path d="M26 27V14" stroke="#7a4aff"/></svg>',
    clock: '<svg viewBox="0 0 32 32" fill="none" stroke="#fff" stroke-width="3.400" stroke-linecap="round" stroke-linejoin="round"><circle cx="16" cy="16" r="11"/><path d="M16 9.500V17l4.500 3"/></svg>',
    swap: '<svg viewBox="0 0 38 38" fill="none" stroke="#fff" stroke-width="3.400" stroke-linecap="round" stroke-linejoin="round"><path d="M6 14h26M26 7l7 7-7 7M32 25H6M12 18l-7 7 7 7"/></svg>',
    down: '<svg viewBox="0 0 38 38" fill="none" stroke="#fff" stroke-width="3.600" stroke-linecap="round" stroke-linejoin="round"><path d="M19 5v27M8 21l11 11 11-11"/></svg>',
    out: '<svg viewBox="0 0 38 38" fill="none" stroke="#fff" stroke-width="3.600" stroke-linecap="round" stroke-linejoin="round"><path d="M19 33V6M8 17L19 6l11 11"/></svg>'
  };
  const D = (n, d) => (+n).toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });

  function txRow(t) {
    const a = asset(t.sym);
    const ic = { deposit: [SV.down, "linear-gradient(160deg,#35d0a0,#16856a)"], withdraw: [SV.out, "linear-gradient(160deg,#ffb04a,#d4701a)"], exchange: [SV.swap, "linear-gradient(160deg,#8a3dff,#4a14e0)"], transfer: [SV.swap, "linear-gradient(160deg,#8a3dff,#4a14e0)"] }[t.kind] || [SV.swap, "#555"];
    const title = { deposit: "Deposit", withdraw: "Withdraw", exchange: "Exchange", transfer: "Transfer" }[t.kind] || t.kind;
    const out = t.kind === "withdraw" || (t.kind === "transfer" && t.dir === "out");
    const date = new Date(t.ts).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
    const STN = { pending: ["Pending", "pending"], accepted: ["Accepted", "accepted"], confirmed: ["Completed", "done"], rejected: ["Rejected", "rejected"], approved: ["Approved", "accepted"], cancelled: ["Cancelled", "rejected"] };
    const chip = t.status === "completed" ? (t.kind === "withdraw" ? '<span class="st done">Completed</span>' : "") : (STN[t.status] ? `<span class="st ${STN[t.status][1]}">${STN[t.status][0]}</span>` : "");
    return `<div class="tx"><span class="ti" style="background:${ic[1]}">${ic[0]}</span>
      <div class="mid"><b>${title}${chip}</b><small>${esc(t.sub || a.sym)}</small></div>
      <div class="rt"><b class="${t.status === "pending" || t.status === "accepted" || out ? "neg" : "pos"}">${out ? "-" : "+"} ${fmtAmt(t.amount, a)} ${a.sym}</b><small>${date}</small></div></div>`;
  }

  function render() {
    if (!root || !root.classList.contains("open") || !W()) return;
    const b = bals(), total = W().total(), pr = W().prices();
    const btc = pr.BTC ? total / pr.BTC : null;
    const avail = availUsdt(), zb = zenyBal();
    const te = window.ZenvyroEarn ? window.ZenvyroEarn.get().TRX : 0, hz = +holds.ZENY || 0;
    const availBtc = pr.BTC ? avail / pr.BTC : null;
    const totalTxt = mask("$ " + D(total, 2)), amtPx = totalTxt.length <= 8 ? 90 : totalTxt.length <= 10 ? 75 : 62;
    let best = null; ASSETS.forEach(a => { const x = b[a.sym]; if (x && x.value > 0 && (!best || x.value > b[best].value)) best = a.sym; });
    const assets = ASSETS.map(a => {
      const x = b[a.sym] || { amount: 0, value: 0 };
      return `<button class="ar${a.sym === best ? " hl" : ""}" onclick="zvwAsset('${a.sym}')"><i class="s-${a.sym.toLowerCase()}"></i>
        <div><span class="nm">${a.name}</span><span class="tk">${a.sym}</span></div>
        <div class="rt"><b>${mask(x.amount.toFixed(a.dec > 6 ? 8 : 6))}</b><small>${mask("≈ $" + D(x.value, 2))}</small></div><span class="go" style="color:#8f7bff">${SV.chv}</span></button>`;
    }).join("");
    const list = (showAll ? txs.slice(0, 30) : txs.slice(0, 3));
    const eyeBtn = `<button class="eye" aria-label="Show or hide balances" onclick="zvwEye()">${hidden ? SV.eyeoff : SV.eye}</button>`;
    const html = `<div class="in">
      <div class="h0"><button class="bgr" aria-label="Menu" onclick="toast('Menu coming soon')">${SV.burger}</button><span class="dv"></span><i class="s-zlogo"></i>
        <div class="wm">ZENVYRO</div><div class="tg">Your Crypto Future</div>
        <button class="hb" style="left:${u(650)}" aria-label="Notifications" onclick="window.zvhBell ? zvhBell() : toast('No new notifications')"><i class="s-bell"></i></button>
        <button class="hb" style="left:${u(745)}" aria-label="Account" onclick="showSection('account')"><i class="s-user"></i></button></div>
      <div class="pg">
        <div class="hero bx"><i class="s-hero"></i>
          <div class="sc">${SV.shield}Secure &amp; Decentralized</div>
          <div class="tl">Total Wallet Balance ${eyeBtn}</div>
          <div class="amt" style="font-size:${u(amtPx)}">${totalTxt}</div>
          <div class="es">${SV.up}<span>${btc !== null ? mask("≈ " + btc.toFixed(4) + " BTC") + " &nbsp;•&nbsp; " : ""}Est. value</span></div>
          <div class="wa"><i></i>Wallet Active</div></div>
        <div class="two">
          <div class="xc bx" role="button" tabindex="0" onclick="showSection('exchange')"><i class="s-swap"></i><span class="a">Exchange</span><span class="chv">${SV.chv.replace("currentColor", "#fff")}</span>
            <span class="b">Wallet · tap to exchange</span><span class="c">${mask(zb.toFixed(6))} <em>ZNV</em></span><span class="d">${SV.chart}${mask(te.toFixed(6))} TRX · income</span></div>
          <div class="ac bx" role="button" tabindex="0" onclick="zvwWithdrawForm()"><i class="s-gem"></i><span class="a">Available Withdrawal ${SV.chv.replace("currentColor", "#fff")}</span>
            <span class="c">${mask("$ " + D(avail, 2))}</span><span class="d">${availBtc !== null ? mask("≈ " + availBtc.toFixed(4) + " BTC") : "&nbsp;"}</span></div></div>
        <div class="acts">
          <button class="dep bx" onclick="zvwDepositForm()"><i class="ai s-dep"></i><b>Deposit</b><small>Add Funds</small></button>
          <button class="wd bx" onclick="zvwWithdrawForm()"><i class="ai s-wd"></i><b>Withdraw</b><small>Cash Out</small></button>
          <button class="trf bx" onclick="zvwTransferForm()"><i class="ai s-tr"></i><b>Transfer</b><small>Move Funds</small></button></div>
        <div class="air bx" role="button" tabindex="0" onclick="toast('Airdrop details coming soon')"><i class="s-gift"></i>
          <span class="a">Airdrop Hold ${SV.lock}</span><span class="c">${mask(hz.toFixed(6))} <em>ZNV</em></span><span class="d">${HOLD_PCT}% of every withdrawal is kept here as ZNV</span><span class="chv">${SV.chv.replace("currentColor", "#fff")}</span></div>
        <div class="mc bx"><span class="ib">${SV.bars}</span><h3>My Assets</h3>
          <div class="tv"><small>Total Value ${eyeBtn}</small><b>${mask("$" + D(total, 2))}</b></div>
          <div class="rows">${assets}</div></div>
        <div class="tc bx"><span class="ib">${SV.clock}</span><h3>Recent Transactions</h3>
          <a class="va" onclick="zvwAll()">${showAll ? "Show Less" : "View All"} ${SV.chv}</a>
          ${list.length ? list.map(txRow).join("") : '<div class="empty">No transactions yet</div>'}</div>
      </div></div>`;
    if (html === lastHtml && root.firstChild) return;   // same picture as before: keep the page as it is
    lastHtml = html; root.innerHTML = html;
  }

  const navBtn = () => Array.from(document.querySelectorAll(".nav button")).find(b => /Wallet/.test(b.textContent));
  function openWallet() {
    if (!root) { root = document.createElement("div"); root.id = "zvWallet"; document.body.appendChild(root); }
    root.classList.add("open"); root.scrollTop = 0;
    if (typeof window.navActive === "function" && navBtn()) { document.querySelectorAll(".nav button").forEach(b => b.classList.remove("active")); navBtn().classList.add("active"); }
    render();
    if (W()) W().ensurePrices().then(render);
  }
  function closeWallet() { if (root) root.classList.remove("open"); }

  // ---- Forms (existing modal design) ----
  const opts = sel => ASSETS.map(a => `<option value="${a.sym}" ${a.sym === sel ? "selected" : ""}>${a.sym} · ${a.name}</option>`).join("");
  const val = id => ($(id) ? $(id).value.trim() : "");

  function depositForm(sel) {
    sel = sel || "TRX";
    window.openModal("Deposit", `
      <label class="modal-label" for="dpAsset">Asset</label>
      <select class="modal-field" id="dpAsset" onchange="zvwDepositAddr()">${opts(sel)}</select>
      <div id="dpAddr"></div>
      <label class="modal-label" for="dpAmt">Sent amount</label>
      <input class="modal-field" id="dpAmt" type="number" inputmode="decimal" step="any" min="0" placeholder="0.00">
      <label class="modal-label" for="dpTx">Transaction ID (TXID)</label>
      <input class="modal-field" id="dpTx" type="text" placeholder="Blockchain transaction ID">
      <button class="btn" style="width:100%;margin-top:14px" onclick="zvwDeposit()">Submit Deposit Request</button>
      <div class="modal-note">Once an admin verifies and accepts, the amount is credited to your Wallet; if rejected, nothing is credited. Send only to the address and network shown above.</div>`);
    depositAddr();
  }
  function depositAddr() {
    const sym = val("dpAsset"), a = asset(sym), cfg = (window.ZENVYRO_DEPOSIT_ADDRESSES || {})[sym];
    $("dpAddr").innerHTML = cfg && cfg.address
      ? `<label class="modal-label">Network: ${esc(cfg.network || a.net)} · Deposit address</label><div class="ref-box">${esc(cfg.address)}</div><button class="btn alt" style="width:100%;margin-top:8px;padding:10px" onclick="zvwCopy()">Copy address</button>`
      : `<div class="modal-note" style="margin-top:12px">⚠ The deposit address is not set yet (demo). Do not send any funds until a real address is shown.</div>`;
  }
  function submitDeposit() {
    if (window.ZenvyroSettings && window.ZenvyroSettings.block("deposit")) return;
    const sym = val("dpAsset"), a = asset(sym), amount = parseFloat(val("dpAmt")), txid = val("dpTx");
    if (!(amount > 0)) return say("Enter a valid amount");
    if (txid.length < 6) return say("Enter the TXID");
    window.ZenvyroTx.log({ id: newId("DP"), kind: "deposit", sym, amount, status: "pending", sub: sym + " (" + a.net + ")", txid });
    window.closeModal(); say("Deposit request sent");
  }

  function withdrawForm(sel) {
    sel = sel || "TRX";
    window.openModal("Withdraw", `
      <label class="modal-label" for="wdAsset">Asset</label>
      <select class="modal-field" id="wdAsset" onchange="zvwWdInfo()">${opts(sel)}</select>
      <div class="modal-note" id="wdInfo" style="margin-top:10px"></div>
      <label class="modal-label" for="wdAddr">Wallet address</label>
      <input class="modal-field" id="wdAddr" type="text" placeholder="Your wallet address" autocapitalize="off" autocorrect="off">
      <label class="modal-label" for="wdAmt">Amount</label>
      <input class="modal-field" id="wdAmt" type="number" inputmode="decimal" step="any" min="0" placeholder="0.00" oninput="zvwWdBreak()">
      <div class="modal-note" id="wdBreak" style="margin-top:8px"></div>
      <button class="btn alt" style="width:100%;margin-top:8px;padding:10px" onclick="zvwWdMax()">Max</button>
      <button class="btn" style="width:100%;margin-top:12px" onclick="zvwWithdraw()">Submit Withdraw Request</button>
      <div class="modal-note">When you send a request, the amount is locked. If an admin accepts, you receive 70% and the other 30% goes to your Airdrop Hold as ZNV; if rejected, the lock is released. Double-check the address and network: funds sent to a wrong address cannot be recovered.</div>`);
    wdInfo();
  }
  function wdInfo() {
    const sym = val("wdAsset"), a = asset(sym);
    $("wdInfo").textContent = "Network: " + a.net + " · Available: " + availAmt(sym).toFixed(a.dec > 6 ? 8 : 6) + " " + sym + " · You can withdraw up to: " + maxWd(sym).toFixed(a.dec > 6 ? 8 : 6) + " " + sym + " · Minimum withdrawal: $10";
    wdBreak();
  }
  function wdBreak() {
    const el = $("wdBreak"); if (!el) return;
    const sym = val("wdAsset"), a = asset(sym), amt = parseFloat(val("wdAmt")), d = a.dec > 6 ? 8 : 6;
    if (!(amt > 0)) { el.textContent = HOLD_PCT + "% of every withdrawal goes to Airdrop Hold as ZNV. You receive the other " + (100 - HOLD_PCT) + "%."; return; }
    const h = holdOf(amt), px = sym === "USDT" ? 1 : (W() ? +W().prices()[sym] : 0), z = px > 0 ? h * px / ZENY_USDT : null;
    el.textContent = "You receive " + (amt - h).toFixed(d) + " " + sym + " · Airdrop Hold " + h.toFixed(d) + " " + sym + (z !== null ? " = " + z.toFixed(6) + " ZNV (shown in your Wallet)" : " (converted to ZNV)");
  }
  const MIN_WITHDRAW_USD = 10; // minimum withdrawal per request (USD value). A server must enforce this too.
  const MIN_TRANSFER_USD = 5; // minimum transfer (USD value). A server must enforce this too.
  async function doWithdraw(sym, addr, amount) {
    // returns "" when the request was created, "__blocked" when the admin switched withdrawals off, otherwise a message for the member
    if (window.ZenvyroSettings && window.ZenvyroSettings.block("withdraw")) return "__blocked";
    const a = asset(sym);
    if (!a) return "Choose an asset";
    if (!/^[A-Za-z0-9:_-]{20,120}$/.test(addr)) return "Enter a valid wallet address";
    if (!(amount > 0)) return "Enter a valid amount";
    let px = sym === "USDT" ? 1 : (W() ? +W().prices()[sym] : 0);
    if (!(px > 0) && W()) { try { await W().ensurePrices(); } catch (e) {} px = +W().prices()[sym]; }
    if (!(px > 0)) return "Could not check the current price. Please try again.";
    if (amount * px < MIN_WITHDRAW_USD - 1e-9)
      return "Minimum withdrawal is $" + MIN_WITHDRAW_USD + " (about " + +(MIN_WITHDRAW_USD / px).toFixed(a.dec > 6 ? 8 : 6) + " " + sym + ")";
    const hold = holdOf(amount);
    if (amount > availAmt(sym) + 1e-12) return "Not enough available balance";
    window.ZenvyroTx.log({ id: newId("WD"), kind: "withdraw", sym, amount, hold, holdIn: true, status: "pending", sub: sym + " (" + a.net + ")", addr });
    return "";
  }
  async function submitWithdraw() {
    const msg = await doWithdraw(val("wdAsset"), val("wdAddr"), parseFloat(val("wdAmt")));
    if (msg === "__blocked") return;
    if (msg) return say(msg);
    window.closeModal(); say("Withdraw request sent");
  }

  function transferForm(sel) {
    sel = sel || "TRX";
    window.openModal("Transfer", `
      <label class="modal-label" for="trAsset">Asset (exchanged balance)</label>
      <select class="modal-field" id="trAsset" onchange="zvwTrInfo()">${opts(sel)}</select>
      <div class="modal-note" id="trInfo" style="margin-top:10px"></div>
      <label class="modal-label" for="trTo">Recipient ID</label>
      <input class="modal-field" id="trTo" type="text" placeholder="Recipient's user ID (e.g. ZNV-7K4M9XQ)" autocapitalize="characters" autocorrect="off" spellcheck="false" maxlength="14" oninput="zvwTrTo(this)">
      <div class="zid-card" id="trCard" aria-live="polite"></div>
      <label class="modal-label" for="trAmt">Amount</label>
      <input class="modal-field" id="trAmt" type="number" inputmode="decimal" step="any" min="0" placeholder="0.00">
      <button class="btn" style="width:100%;margin-top:14px" onclick="zvwTransfer()">Send</button>
      <div class="modal-note">Minimum transfer: $5 (value). Transfers happen instantly and do not go through an admin, so they are final once sent, except in cases of error or fraud. Double-check the recipient's ID. In demo mode the recipient is not verified. Try a demo ID: ${window.ZenvyroId.demoMembers.map(m => m.id).join(", ")}</div>`);
    trInfo();
  }
  function trInfo() {
    const sym = val("trAsset"), a = asset(sym);
    $("trInfo").textContent = "Available: " + availAmt(sym).toFixed(a.dec > 6 ? 8 : 6) + " " + sym;
  }
  async function doTransfer(sym, toRaw, amount) {
    // returns "" when sent, "__blocked" (feature off) or "__cancel" (member said no) or a message for the member
    if (window.ZenvyroSettings && window.ZenvyroSettings.block("transfer")) return "__blocked";
    const a = asset(sym), to = window.ZenvyroId.norm(toRaw);
    if (!a) return "Choose an asset";
    if (!to || !window.ZenvyroId.valid(to)) return "Enter a valid recipient ID";
    if (window.ZENVYRO_LOOKUP_ENDPOINT && !window.ZenvyroId.lastFound(to)) return "Recipient ID not found";
    if (to.toLowerCase() === MY_ID.toLowerCase()) return "You can't transfer to your own ID";
    if (!(amount > 0)) return "Enter a valid amount";
    if (amount > availAmt(sym) + 1e-12) return "Not enough available balance";
    let px = sym === "USDT" ? 1 : (W() ? +W().prices()[sym] : 0);
    if (!(px > 0) && W()) { try { await W().ensurePrices(); } catch (e) {} px = +W().prices()[sym]; }
    if (!(px > 0)) return "Could not check the current price. Please try again.";
    if (amount * px < MIN_TRANSFER_USD - 1e-9) return "Minimum transfer is $" + MIN_TRANSFER_USD + " (about " + +(MIN_TRANSFER_USD / px).toFixed(a.dec > 6 ? 8 : 6) + " " + sym + ")";
    if (!window.confirm("Send " + amount + " " + sym + " to " + to + "?\n\nThis happens instantly. Zenvyro can reverse a transfer only in cases of error or fraud.")) return "__cancel";
    if (!W().debit(sym, amount)) return "Transfer failed";
    window.ZenvyroTx.log({ id: newId("TR"), kind: "transfer", dir: "out", sym, amount, status: "completed", sub: "To " + to });
    return "";
  }
  async function submitTransfer() {
    const msg = await doTransfer(val("trAsset"), val("trTo"), parseFloat(val("trAmt")));
    if (msg === "__blocked" || msg === "__cancel") return;
    if (msg) return say(msg);
    window.closeModal(); say("Transfer completed");
  }

  function assetDetail(sym) {
    const a = asset(sym), x = bals()[sym] || { amount: 0, value: 0 };
    window.openModal(a.name + " (" + sym + ")", `
      <div class="modal-list">
        <div><strong>Balance</strong><span>${x.amount.toFixed(a.dec > 6 ? 8 : 6)} ${sym}</span></div>
        <div><strong>Locked (Pending withdraw)</strong><span>${locked(sym).toFixed(a.dec > 6 ? 8 : 6)} ${sym}</span></div>
        <div><strong>Available</strong><span>${availAmt(sym).toFixed(a.dec > 6 ? 8 : 6)} ${sym}</span></div>
        <div><strong>Est. value</strong><span>${usd(x.value)}</span></div></div>
      <div class="modal-actions"><button class="btn" onclick="zvwDepositForm('${sym}')">Deposit</button><button class="btn alt" onclick="zvwWithdrawForm('${sym}')">Withdraw</button></div>
      <button class="btn alt" style="width:100%;margin-top:10px" onclick="zvwTransferForm('${sym}')">Transfer</button>`);
  }

  // ---- Admin (demo test hooks) ----
  // Finishing a withdrawal: the locked amount leaves the balance and the 30% becomes ZNV in Airdrop Hold. Used when the admin confirms.
  function finalizeWithdraw(t, priceUsdt) {
    const h = +t.hold || 0;
    if (t.holdIn) {   // current rule: the 30% is part of the requested amount; the member gets the rest, the 30% becomes ZNV in Airdrop Hold
      const px = t.sym === "USDT" ? 1 : (+priceUsdt > 0 ? +priceUsdt : +(W().prices()[t.sym] || 0));
      if (h > 0 && !(px > 0)) return false;
      if (!W().debit(t.sym, t.amount)) return false;
      if (h > 0) { const z = Math.round(h * px / ZENY_USDT * 1e8) / 1e8; holds.ZENY = Math.round(((+holds.ZENY || 0) + z) * 1e8) / 1e8; saveHolds(); t.holdZeny = z; }
    } else {          // request made under the earlier rule (extra 30% on top)
      if (!W().debit(t.sym, t.amount + h)) return false;
      if (h > 0) { holds[t.sym] = Math.round(((+holds[t.sym] || 0) + h) * 1e8) / 1e8; saveHolds(); }
    }
    t.status = "completed"; t.completedAt = Date.now();
    return true;
  }
  function adminApprove(id, priceUsdt) {
    txs = loadTx();
    const t = txs.find(x => x.id === id && (x.status === "pending" || (x.kind === "withdraw" && x.status === "accepted")));
    if (!t || !W()) return false;
    if (t.kind === "deposit") {
      const v = t.sym === "USDT" ? t.amount : t.amount * +priceUsdt;
      if (!(v > 0)) return false;
      W().credit(t.sym, t.amount, v);
      t.status = "completed";
    } else if (t.kind === "withdraw") {
      if (!finalizeWithdraw(t, priceUsdt)) return false;
    } else return false;
    saveTx(); render(); return true;
  }
  function adminReject(id) {
    txs = loadTx();
    const t = txs.find(x => x.id === id && (x.kind === "deposit" || x.kind === "withdraw") && (x.status === "pending" || (x.kind === "withdraw" && x.status === "accepted")));
    if (!t) return false;
    t.status = "rejected"; saveTx(); render(); return true; // a withdraw's lock is released automatically
  }
  // The admin page (admin-withdraw.js) moves a request: pending -> accepted -> confirmed, or rejected. The amount stays locked until "confirmed";
  // here the member app then finishes it (balance, Airdrop Hold) and the member sees "Completed". Demo: both pages share this browser's localStorage.
  function applyWithdrawals(retry) {
    if (!W()) return;
    const fresh = loadTx(); let n = 0, wait = false;
    fresh.forEach(t => { if (t.kind === "withdraw" && t.status === "confirmed") { if (finalizeWithdraw(t)) n++; else wait = true; } });
    const same = JSON.stringify(fresh) === JSON.stringify(txs);
    txs = fresh;
    if (n) { saveTx(); say(n > 1 ? n + " withdrawals completed" : "Your withdrawal is completed"); }
    if (n || !same) render();
    if (wait && (retry || 0) < 3 && W().ensurePrices) W().ensurePrices().then(() => setTimeout(() => applyWithdrawals((retry || 0) + 1), 1200)).catch(() => {});
  }

  // A transfer cancelled by the admin is returned to the sender here.
  function applyRefunds() {
    let fresh; try { fresh = JSON.parse(localStorage.getItem(TXKEY) || "[]"); } catch (e) { return; }
    if (!Array.isArray(fresh)) return; let n = 0;
    fresh.forEach(t => { if (t && t.kind === "transfer" && t.status === "cancelled" && !t.refunded && W() && W().credit(t.sym, +t.amount || 0, 0)) { t.refunded = true; n++; } });
    if (n) { txs.splice(0, txs.length, ...fresh); saveTx(); render(); say("A transfer was cancelled and refunded to your wallet"); }
  }
  // A deposit approved by the admin (admin.html) is credited here, once. The admin page and this page share localStorage on this device (demo).
  function applyDeposits() {
    let fresh; try { fresh = JSON.parse(localStorage.getItem(TXKEY) || "[]"); } catch (e) { return; }
    if (!Array.isArray(fresh) || !W()) return; let n = 0, tot = 0;
    fresh.forEach(t => {
      if (t && t.kind === "deposit" && t.status === "approved" && !t.credited) {
        const amt = +t.credit || +t.amount || 0, usd = +t.creditUsdt || (t.sym === "USDT" ? amt : 0);
        if (amt > 0 && W().credit(t.sym || "TRX", amt, usd)) { t.credited = true; t.status = "completed"; t.amount = amt; n++; tot += amt; }
      }
    });
    if (n) { txs.splice(0, txs.length, ...fresh); saveTx(); render(); say("Deposit approved: " + (Math.round(tot * 1e6) / 1e6) + " TRX added to your Wallet"); }
  }
  function init() {
    setTimeout(applyDeposits, 600); addEventListener("storage", applyDeposits); document.addEventListener("visibilitychange", () => { if (!document.hidden) applyDeposits(); });
    setTimeout(applyWithdrawals, 700); addEventListener("storage", () => applyWithdrawals()); document.addEventListener("visibilitychange", () => { if (!document.hidden) applyWithdrawals(); });
    setTimeout(applyRefunds, 400); addEventListener("storage", applyRefunds); document.addEventListener("visibilitychange", () => { if (!document.hidden) applyRefunds(); });
    Object.assign(window, {
      zvwClose: closeWallet,
      zvwEye: () => { hidden = !hidden; render(); },
      zvwAll: () => { showAll = !showAll; render(); },
      zvwAsset: assetDetail,
      zvwDepositForm: s => (window.ZenvyroDeposit ? window.ZenvyroDeposit.open(s) : depositForm(s)), zvwDepositAddr: depositAddr, zvwDeposit: submitDeposit,
      zvwWithdrawForm: s => (window.ZenvyroWithdraw ? window.ZenvyroWithdraw.open(s) : withdrawForm(s)), zvwWdInfo: wdInfo, zvwWithdraw: submitWithdraw,
      zvwWdMax: () => { const sym = val("wdAsset"); $("wdAmt").value = maxWd(sym).toFixed(8); wdBreak(); }, zvwWdBreak: wdBreak,
      zvwTransferForm: s => (window.ZenvyroTransfer ? window.ZenvyroTransfer.open(s) : transferForm(s)), zvwTrInfo: trInfo, zvwTransfer: submitTransfer,
      zvwCopy: () => {
        const el = document.querySelector("#dpAddr .ref-box");
        if (el && navigator.clipboard) navigator.clipboard.writeText(el.textContent).then(() => say("Address copied")).catch(() => say(el.textContent));
      }
    });
    window.ZenvyroWalletInfo = { avail: availAmt };
    window.ZenvyroWalletOps = { assets: ASSETS, withdraw: doWithdraw, transfer: doTransfer, holdOf, holdPct: HOLD_PCT, zenyUsdt: ZENY_USDT, minWdUsd: MIN_WITHDRAW_USD, minTrUsd: MIN_TRANSFER_USD };
    window.ZenvyroWalletAdmin = {
      list: () => txs.filter(t => (t.status === "pending" || (t.kind === "withdraw" && t.status === "accepted")) && (t.kind === "deposit" || t.kind === "withdraw")),
      approve: adminApprove, reject: adminReject
    };

    const origShow = window.showSection;
    window.showSection = function (name) {
      if (name === "wallet") { openWallet(); return; }
      closeWallet();
      return origShow.apply(this, arguments);
    };
    const origNav = window.navActive;
    if (typeof origNav === "function") {
      window.navActive = function (el) {
        const r = origNav.apply(this, arguments);
        if (el && !/Wallet/.test(el.textContent || "")) closeWallet();
        return r;
      };
    }
    setInterval(render, 5000); // reflect Mining/ZNV and other changes
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();

/* Switches from the Admin Panel: closed features cannot be opened. */
(() => {
  const wrap = () => [["Deposit", "deposit"], ["Withdraw", "withdraw"], ["Transfer", "transfer"]].forEach(([n, k]) => {
    const f = window["zvw" + n + "Form"];
    if (typeof f === "function") window["zvw" + n + "Form"] = function () { if (window.ZenvyroSettings && window.ZenvyroSettings.block(k)) return; return f.apply(this, arguments); };
  });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", wrap); else wrap();
})();
