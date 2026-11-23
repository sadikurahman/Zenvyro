/* Zenvyro — Step 3a: Exchange (income ZENY or TRX → TRX / USDT / BTC / TON / BNB / SOL), instant
   JavaScript only; uses the existing modal design.
   A total 10% fee is deducted (Exchange 3% + Network 2% + Platform 5%) and shown before converting.
   Exchange is a Request: ZENY is held; when an admin accepts (at the rate at acceptance) it is credited to the Wallet, and if rejected the ZENY is refunded.
   Wallet balances and requests are in localStorage for now (demo). Real conversion/balances must happen on a backend. */
(() => {
  "use strict";
  const L = k => (k === "ZENY" ? "ZNV" : k);   // display name of the income coin; the internal key stays ZENY

  const ZENY_USDT = 3; // platform-set reference rate
  const FEES = [
    { label: "Exchange fee", pct: 3 },
    { label: "Network fee", pct: 2 },
    { label: "Platform fee", pct: 5 }
  ];
  const TOTAL_FEE = FEES.reduce((a, f) => a + f.pct, 0); // 10
  const ASSETS = [
    { sym: "TRX", name: "TRON", icon: "◈", dec: 6 },
    { sym: "USDT", name: "Tether", icon: "₮", dec: 2 },
    { sym: "BTC", name: "Bitcoin", icon: "₿", dec: 8 },
    { sym: "TON", name: "Toncoin", icon: "💎", dec: 4 },
    { sym: "BNB", name: "BNB", icon: "◆", dec: 5 },
    { sym: "SOL", name: "Solana", icon: "◎", dec: 4 }
  ];
  const CG_URL = "https://api.coingecko.com/api/v3/simple/price?ids=tron,bitcoin,the-open-network,binancecoin,solana&vs_currencies=usd";
  const WKEY = "zenvyro_wallet_v1";

  const $ = id => document.getElementById(id);
  const say = m => { if (typeof window.toast === "function") window.toast(m); };
  const asset = sym => ASSETS.find(a => a.sym === sym);
  const floorTo = (n, d) => Math.floor(n * Math.pow(10, d) + 1e-9) / Math.pow(10, d);

  // ---- Wallet store (demo) ----
  function loadWallet() {
    const w = { _val: 0, _v: {} }; ASSETS.forEach(a => { w[a.sym] = 0; w._v[a.sym] = 0; });
    try {
      const s = JSON.parse(localStorage.getItem(WKEY) || "null");
      if (s && Number.isFinite(+s._val) && +s._val > 0) w._val = +s._val;
      if (s && s._v) ASSETS.forEach(a => { if (Number.isFinite(+s._v[a.sym]) && +s._v[a.sym] > 0) w._v[a.sym] = +s._v[a.sym]; });
      if (s) ASSETS.forEach(a => { if (Number.isFinite(+s[a.sym]) && +s[a.sym] > 0) w[a.sym] = +s[a.sym]; });
    } catch (e) {}
    const sumV = ASSETS.reduce((t, a) => t + w._v[a.sym], 0);
    if (w._val > 0 && sumV === 0) { // old demo data: split the value
      w._v.USDT = Math.min(w.USDT, w._val);
      const rest = w._val - w._v.USDT, others = ASSETS.filter(a => a.sym !== "USDT" && w[a.sym] > 0);
      others.forEach(a => (w._v[a.sym] = rest / others.length));
    }
    return w;
  }
  let wallet = loadWallet();
  const saveWallet = () => { try { localStorage.setItem(WKEY, JSON.stringify(wallet)); } catch (e) {} };

  // Exchange Wallet = the member's INCOME balance. ZENY income lives in the mining balance; TRX income (NFT rewards, bonuses) is kept here.
  // To spend or withdraw it, the member exchanges it (10% fee) and the result lands in the Wallet. A server must hold this in the real system.
  const EKEY = "zenvyro_earn_v1";
  let earn = (() => { try { const o = JSON.parse(localStorage.getItem(EKEY) || "{}"); return { TRX: Math.max(0, +o.TRX || 0) }; } catch (e) { return { TRX: 0 }; } })();
  const saveEarn = () => { try { localStorage.setItem(EKEY, JSON.stringify(earn)); } catch (e) {} };
  const trxEarn = () => earn.TRX;
  function addTrx(n) { n = +n; if (!(n > 0)) return false; earn.TRX = Math.round((earn.TRX + n) * 1e6) / 1e6; saveEarn(); update(); return true; }
  function takeTrx(n) { n = +n; if (!(n > 0) || n > earn.TRX + 1e-9) return false; earn.TRX = Math.max(0, Math.round((earn.TRX - n) * 1e6) / 1e6); saveEarn(); update(); return true; }

  const fmtUsd = n => Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Home Account Balance
  function renderHome() {
    // Home shows the ZENY balance (handled in mining.js); nothing to do here.
  }

  // Credit to the Wallet (Exchange approval / Purchase Bonus go through here)
  function credit(sym, amount, usdtValue) {
    amount = +amount;
    if (!asset(sym) || !(amount > 0)) return false;
    const val = +usdtValue > 0 ? +usdtValue : (sym === "USDT" ? amount : 0);
    wallet[sym] = Math.round((wallet[sym] + amount) * 1e8) / 1e8;
    wallet._v[sym] = Math.round((wallet._v[sym] + val) * 100) / 100;
    wallet._val = Math.round((wallet._val + val) * 100) / 100;
    saveWallet(); renderHome();
    return true;
  }

  // Debit from the Wallet (Withdraw approval / Transfer)
  function debit(sym, amount) {
    amount = +amount;
    if (!asset(sym) || !(amount > 0) || amount > wallet[sym] + 1e-12) return false;
    const out = wallet[sym] > 0 ? wallet._v[sym] * Math.min(1, amount / wallet[sym]) : 0;
    wallet[sym] = Math.max(0, Math.round((wallet[sym] - amount) * 1e8) / 1e8);
    wallet._v[sym] = Math.max(0, Math.round((wallet._v[sym] - out) * 100) / 100);
    wallet._val = Math.max(0, Math.round((wallet._val - out) * 100) / 100);
    saveWallet(); renderHome();
    return true;
  }

  // ---- Exchange Requests (demo) ----
  const RKEY = "zenvyro_exreq_v1";
  function loadReqs() {
    try {
      const a = JSON.parse(localStorage.getItem(RKEY) || "[]");
      return Array.isArray(a) ? a.filter(r => r && r.id && asset(r.asset) && (+r.zeny > 0 || +r.amt > 0) &&
        ["pending", "approved", "rejected"].includes(r.status)) : [];
    } catch (e) { return []; }
  }
  let reqs = loadReqs();
  const saveReqs = () => { try { localStorage.setItem(RKEY, JSON.stringify(reqs.slice(0, 100))); } catch (e) {} };
  const heldZeny = () => reqs.filter(r => r.status === "pending").reduce((a, r) => a + +r.zeny, 0);
  const newId = () => "EX" + Date.now().toString(36).toUpperCase() + Math.floor(Math.random() * 1296).toString(36).toUpperCase();
  const when = ts => new Date(ts).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

  // Admin Accept: rate at acceptance time (priceUsdt). In a real system this runs on the server.
  function approve(id, priceUsdt) {
    const r = reqs.find(x => x.id === id && x.status === "pending");
    if (!r) return false;
    const a = asset(r.asset), p = r.asset === "USDT" ? 1 : +priceUsdt;
    if (!(p > 0)) return false;
    const net = r.zeny * ZENY_USDT * (1 - TOTAL_FEE / 100);
    const receive = floorTo(net / p, a.dec);
    if (!(receive > 0)) return false;
    credit(r.asset, receive, net);
    r.status = "approved"; r.receive = receive; r.rate = p; r.decided = Date.now();
    if (window.ZenvyroTx) window.ZenvyroTx.update(r.id, { status: "completed", amount: receive });
    saveReqs(); renderReqs(); update();
    return true;
  }
  // Admin Reject: refund ZENY
  function reject(id) {
    const r = reqs.find(x => x.id === id && x.status === "pending");
    if (!r) return false;
    if (window.ZenvyroMining) window.ZenvyroMining.addZeny(r.zeny);
    r.status = "rejected"; r.decided = Date.now();
    if (window.ZenvyroTx) window.ZenvyroTx.update(r.id, { status: "rejected" });
    saveReqs(); renderReqs(); update();
    return true;
  }

  const whenX = ts => { const d = new Date(ts); return d.toLocaleString("en-GB", { day: "2-digit", month: "short" }) + " at " + d.toLocaleString("en-GB", { hour: "2-digit", minute: "2-digit" }); };
  function reqRows() {
    if (!reqs.length) return '<div class="xe">No exchanges yet</div>';
    return reqs.slice(0, exShowAll ? 20 : 3).map(r => {
      const a = asset(r.asset), from = r.src || "ZENY", amt = +(r.amt || r.zeny);
      const st = r.status === "pending" ? '<span class="rs pe">Pending</span>' : r.status === "approved" ? `<span class="rs">${XSV.ok}${(+r.receive).toFixed(a.dec)} ${r.asset}</span>` : '<span class="rs rj">Rejected · refunded</span>';
      return `<div class="xr"><span class="ti">${XSV.swap}</span><div class="md"><b>${amt.toFixed(6)} ${L(from)} → ${r.asset}</b><small>${whenX(r.created)} · ${r.id}</small></div>${st}</div>`;
    }).join("");
  }
  function renderReqs() { const el = $("exReqs"); if (el) el.innerHTML = reqRows(); const va = $("exVA"); if (va) va.innerHTML = (exShowAll ? "Show Less " : "View All ") + XSV.arr; }

  // ---- Prices (in USDT) ----
  let prices = { USDT: 1 }, priceState = "idle", priceTime = 0, sel = "TRX", src = "ZENY";

  async function loadPrices() {
    if (priceState === "ok" && Date.now() - priceTime < 60000) return;
    priceState = "loading"; update();
    try {
      let p;
      if (window.ZENVYRO_PRICE_ENDPOINT) {
        const r = await fetch(window.ZENVYRO_PRICE_ENDPOINT, { cache: "no-store" });
        if (!r.ok) throw new Error("price");
        const j = await r.json();
        p = { BTC: +j.BTC, TON: +j.TON, BNB: +j.BNB, SOL: +j.SOL };
      } else {
        const r = await fetch(CG_URL, { cache: "no-store" });
        if (!r.ok) throw new Error("price");
        const j = await r.json();
        p = { TRX: +(j.tron || {}).usd, BTC: +(j.bitcoin || {}).usd, TON: +(j["the-open-network"] || {}).usd,
              BNB: +(j.binancecoin || {}).usd, SOL: +(j.solana || {}).usd };
      }
      for (const k in p) if (!(Number.isFinite(p[k]) && p[k] > 0)) throw new Error("bad price");
      prices = Object.assign({ USDT: 1 }, p); priceState = "ok"; priceTime = Date.now();
    } catch (e) { priceState = "error"; }
    update();
  }

  const zenyBalance = () => (window.ZenvyroMining ? window.ZenvyroMining.getState().balance : 0);
  const srcBal = () => (src === "TRX" ? trxEarn() : zenyBalance());

  function calc() {
    const el = $("exAmount");
    const amount = el ? Math.max(0, parseFloat(el.value) || 0) : 0;
    const sp = src === "ZENY" ? ZENY_USDT : (prices.TRX || 0), gross = amount * sp;
    const fees = FEES.map(f => ({ label: f.label, pct: f.pct, usdt: gross * f.pct / 100 }));
    const net = gross - fees.reduce((a, f) => a + f.usdt, 0);
    const price = prices[sel];
    const a = asset(sel);
    const receive = price && sp > 0 ? floorTo(net / price, a.dec) : null;
    return { amount, gross, fees, net, price, receive, a };
  }

  function update() {
    if (!$("exAmount")) return;
    const c = calc(), bal = srcBal(), sp = src === "ZENY" ? ZENY_USDT : (prices.TRX || 0);
    $("exAvail").textContent = bal.toFixed(6) + " " + L(src);
    if ($("exAvailLbl")) $("exAvailLbl").textContent = "Exchange Wallet · " + L(src);
    if ($("exFromLbl")) $("exFromLbl").textContent = "· " + L(src);
    if ($("exHeld")) $("exHeld").textContent = heldZeny().toFixed(6) + " ZNV";

    let rate;
    if (!sp || !c.price) rate = priceState === "loading" ? "Loading price…" : "Live price unavailable — please try again later";
    else rate = "1 " + L(src) + " ≈ " + (sp / c.price).toFixed(c.a.dec) + " " + sel + " <em>(before fees)</em>";
    $("exRate").innerHTML = rate;

    const fr = (ic, l, v) => `<div class="fr"><i class="xs-${ic}"></i><span>${l}</span><b>${v}</b></div>`;
    $("exRows").innerHTML = fr("f1", "Value (before fees)", c.gross.toFixed(2) + " USDT") +
      c.fees.map((f, i) => fr(["f2", "f3", "f4"][i], `${f.label} (${f.pct}%)`, "− " + f.usdt.toFixed(2) + " USDT")).join("") +
      fr("f5", `Total fees (${TOTAL_FEE}%)`, "− " + (c.gross - c.net).toFixed(2) + " USDT");

    const rt = c.receive === null ? "—" : c.receive.toFixed(c.a.dec) + " " + sel;
    $("exReceive").textContent = rt; $("exReceive").style.fontSize = u(rt.length > 15 ? 40 : rt.length > 12 ? 48 : 56);

    const over = c.amount > bal + 1e-12;
    $("exErr").textContent = over ? "Not enough " + L(src) + " balance" : "";
    const ok = c.amount > 0 && !over && c.receive !== null && c.receive > 0;
    const btn = $("exConfirm");
    btn.disabled = !ok; btn.style.opacity = ok ? "1" : ".7";

    ASSETS.forEach(x => { const t = $("exTile_" + x.sym); if (t) t.classList.toggle("on", x.sym === sel); });
    ["ZENY", "TRX"].forEach(k => { const t = $("exSrc_" + k); if (t) t.classList.toggle("on", k === src); });
  }

  // ---- Exchange screen: every size is design-pixels x --u (scales exactly on any phone) ----
  const u = n => `calc(${n} * var(--u))`;
  const XART = {"W":700,"H":328,"p":{"xlogo":[0,0,106,120],"wallet":[108,0,70,68],"gem":[180,0,80,82],"gems":[262,0,58,62],"trxb":[322,0,94,100],"trxt":[418,0,72,80],"usdt":[492,0,80,80],"btc":[574,0,80,80],"ton":[0,122,66,66],"bnb":[68,122,66,66],"sol":[136,122,68,60],"swapr":[206,122,60,64],"calc":[268,122,46,46],"f1":[316,122,50,52],"f2":[368,122,50,50],"f3":[420,122,50,50],"f4":[472,122,50,48],"f5":[524,122,50,52],"ring":[0,190,250,138]}}, XAV = "20261114q";
  const XSV = {
    x: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.8" stroke-linecap="round"><path d="M5 5l14 14M19 5L5 19"/></svg>',
    bolt: '<svg viewBox="0 0 20 28"><path d="M12 1L2 16h7l-2 11 11-16h-7z" fill="#ffc83d"/></svg>',
    copy: '<svg viewBox="0 0 24 26" fill="none" stroke="#d7ceff" stroke-width="2.4" stroke-linejoin="round"><rect x="8" y="2" width="14" height="16" rx="3"/><path d="M16 22H6a3 3 0 0 1-3-3V8"/></svg>',
    chk: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 11v6M12 7.200v.1"/></svg>',
    clock: '<svg viewBox="0 0 32 32" fill="none" stroke="#a98bff" stroke-width="2.800" stroke-linecap="round" stroke-linejoin="round"><circle cx="16" cy="16" r="12"/><path d="M16 9v7.500l5 3"/></svg>',
    swap: '<svg viewBox="0 0 38 38" fill="none" stroke="currentColor" stroke-width="3.200" stroke-linecap="round" stroke-linejoin="round"><path d="M6 14h26M26 7l7 7-7 7M32 25H6M12 18l-7 7 7 7"/></svg>',
    chv: '<svg viewBox="0 0 14 24" fill="none" stroke="#fff" stroke-width="3.400" stroke-linecap="round" stroke-linejoin="round"><path d="M2 2l10 10L2 22"/></svg>',
    arr: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.800" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h15M13 6l6 6-6 6"/></svg>',
    ok: '<svg viewBox="0 0 24 24" fill="none" stroke="#a070ff" stroke-width="3.200" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12.500l5 5L20 6.500"/></svg>'
  };
  function injectCss() {
    if ($("exCss")) return;
    const spr = Object.keys(XART.p).map(k => { const q = XART.p[k]; return `#zvEx .xs-${k}{display:block;flex-shrink:0;width:${u(q[2])};height:${u(q[3])};background:url(exchange-art.webp?v=${XAV}) no-repeat;background-size:${u(XART.W)} ${u(XART.H)};background-position:calc(${-q[0]} * var(--u)) calc(${-q[1]} * var(--u))}`; }).join("\n");
    const st = document.createElement("style"); st.id = "exCss";
    st.textContent = `
#zvEx{--u:calc(min(100vw,560px)/1020);position:fixed;inset:0;z-index:25;overflow-y:auto;overflow-x:hidden;-webkit-overflow-scrolling:touch;padding:calc(${u(26)} + env(safe-area-inset-top,0px)) 0 calc(40px + env(safe-area-inset-bottom,0px));color:#fff;font-family:Inter,system-ui,-apple-system,"Segoe UI",sans-serif;
background:radial-gradient(ellipse ${u(520)} ${u(300)} at 0 0,#3a14a0aa,transparent 70%),radial-gradient(ellipse ${u(500)} ${u(400)} at 100% 100%,#4a1fb099,transparent 70%),#040219;background-attachment:local}
#zvEx *{box-sizing:border-box}
#zvEx button{font-family:inherit;color:inherit;cursor:pointer;-webkit-tap-highlight-color:transparent;appearance:none;-webkit-appearance:none}
#zvEx .exs{position:relative;width:${u(980)};max-width:100%;margin:0 auto;border-radius:${u(46)};padding:${u(34)} ${u(32)} ${u(36)};box-shadow:0 0 ${u(60)} #6b32ff55;
background:radial-gradient(ellipse ${u(560)} ${u(320)} at 100% 18%,#4a1fb099,transparent 70%),radial-gradient(ellipse ${u(560)} ${u(360)} at 0 100%,#3a1ab099,transparent 70%),linear-gradient(165deg,#10064e 0%,#08043a 38%,#07033a 70%,#0e0658 100%)}
#zvEx .exs:before,#zvEx .bd:before{content:"";position:absolute;inset:0;border-radius:inherit;padding:${u(2.6)};background:var(--bd,linear-gradient(135deg,#efe2ff 0%,#8a52ff 22%,#3a2aa0 52%,#6a3ff0 78%,#c88aff 100%));-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);mask-composite:exclude;pointer-events:none}
#zvEx .bd{position:relative}
#zvEx .hd{display:flex;align-items:center;height:${u(120)};margin-bottom:${u(28)}}
#zvEx .hd .xs-xlogo{margin-left:${u(-4)}}
#zvEx .hd .tt{margin-left:${u(30)};min-width:0}
#zvEx .hd h2{margin:0;font-size:${u(44)};line-height:${u(52)};font-weight:700}
#zvEx .hd p{margin:${u(6)} 0 0;display:flex;align-items:center;gap:${u(10)};font-size:${u(26)};line-height:${u(34)};color:#a89ce8;white-space:nowrap}
#zvEx .hd p svg{width:${u(20)};height:${u(28)}}
#zvEx .exx{margin-left:auto;width:${u(76)};height:${u(76)};border-radius:${u(22)};border:${u(2.5)} solid #8d6dff;background:#120a4a;display:grid;place-items:center;padding:0;flex-shrink:0;box-shadow:0 0 ${u(24)} #6b32ff55}
#zvEx .exx svg{width:${u(32)};height:${u(32)}}
#zvEx .wr{display:flex;align-items:center;height:${u(98)};border-radius:${u(30)};padding:0 ${u(20)} 0 ${u(34)};background:linear-gradient(120deg,#1a0f66cc,#0f0a4acc);--bd:linear-gradient(135deg,#7a5aff,#3a2aa0 50%,#6a4aff)}
#zvEx .wr .xs-wallet{flex-shrink:0}
#zvEx .wr b{margin-left:${u(24)};font-size:${u(29)};font-weight:700;white-space:nowrap}
#zvEx .wr button.pl{margin-left:auto;display:flex;align-items:center;gap:${u(16)};height:${u(60)};padding:0 ${u(18)} 0 ${u(24)};border-radius:${u(30)};border:1px solid #4a3aa8;background:#1b1050;font-size:${u(27)};font-weight:500;color:#e8e2ff;white-space:nowrap}
#zvEx .wr .pl svg{width:${u(26)};height:${u(28)}}
#zvEx .lb{display:flex;align-items:center;gap:${u(16)};height:${u(34)};margin:${u(40)} 0 ${u(20)} ${u(9)};font-size:${u(30)};font-weight:700}
#zvEx .lb:before{content:"";width:${u(8)};height:${u(34)};border-radius:${u(4)};background:linear-gradient(#c070ff,#7a3dff)}
#zvEx .lb em{font-style:normal;font-weight:500;color:#a89ce8}
#zvEx .g2{display:grid;grid-template-columns:1fr 1fr;gap:${u(26)};margin:0 ${u(5)} 0 ${u(3)}}
#zvEx .g3{display:grid;grid-template-columns:repeat(3,1fr);gap:${u(20)};margin:0 ${u(5)} 0 ${u(8)}}
#zvEx .tl{position:relative;border:${u(2)} solid #3a2a8a;background:linear-gradient(135deg,#07052c,#050322);color:#fff;text-align:left;padding:0}
#zvEx .tl.on{border-color:transparent;background:linear-gradient(135deg,#0c0748,#070436);box-shadow:0 0 ${u(30)} #7a4aff77,inset 0 0 ${u(30)} #5a3aff44}
#zvEx .tl.on:before{content:"";position:absolute;inset:${u(-2)};border-radius:inherit;padding:${u(3)};background:linear-gradient(135deg,#46d8ff,#7a4aff 50%,#c14aff);-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);mask-composite:exclude;pointer-events:none}
#zvEx .fm{height:${u(128)};border-radius:${u(36)};display:flex;align-items:center;gap:${u(28)};padding-left:${u(56)}}
#zvEx .fm .tx b{display:block;font-size:${u(34)};line-height:${u(40)};font-weight:700}
#zvEx .fm .tx small{display:block;font-size:${u(22)};line-height:${u(30)};color:#a89ce8;white-space:nowrap}
#zvEx .fm .ck{position:absolute;top:${u(12)};right:${u(18)};width:${u(36)};height:${u(36)};border-radius:50%;background:#a070ff;display:none;place-items:center}
#zvEx .fm.on .ck{display:grid}
#zvEx .fm .ck svg{width:${u(22)};height:${u(22)}}
#zvEx .fm .ic{display:grid;place-items:center;width:${u(96)};height:${u(100)}}
#zvEx .af{display:flex;align-items:center;height:${u(100)};border-radius:${u(34)};padding:0 ${u(16)} 0 ${u(38)};background:#0b0830aa;--bd:linear-gradient(135deg,#5a3ad0,#2a1a80 50%,#4a3ac8);margin:0 ${u(5)} 0 ${u(8)}}
#zvEx .af .sep{width:1px;height:${u(54)};background:#ffffff1f;margin:0 ${u(26)} 0 ${u(24)}}
#zvEx .af input{flex:1;min-width:0;border:0;outline:0;background:transparent;color:#fff;font-family:inherit;font-weight:500;font-size:max(16px,${u(40)});padding:0}
#zvEx .af input::placeholder{color:#6f6a9a}
#zvEx .af .mx{width:${u(112)};height:${u(68)};border-radius:${u(24)};border:1px solid #5a3ad0;background:#1c1250;font-size:${u(28)};font-weight:700;color:#e8e2ff;flex-shrink:0}
#zvEx .er{color:#ff8aa0;font-size:${u(22)};line-height:${u(28)};margin:${u(6)} ${u(14)} 0;min-height:0}
#zvEx .tt3{height:${u(172)};border-radius:${u(34)};display:flex;flex-direction:column;align-items:center;padding-top:${u(18)}}
#zvEx .tt3 .ic{display:grid;place-items:center;width:${u(90)};height:${u(76)}}
#zvEx .tt3 b{margin-top:${u(10)};font-size:${u(31)};line-height:${u(38)};font-weight:700}
#zvEx .tt3 small{font-size:${u(23)};line-height:${u(30)};color:#a89ce8}
#zvEx .rr{display:flex;align-items:center;height:${u(108)};margin:${u(42)} ${u(5)} 0 ${u(8)};border-radius:${u(36)};padding:0 ${u(30)} 0 ${u(44)};background:linear-gradient(120deg,#1a0f66cc,#0f0a4acc);--bd:linear-gradient(135deg,#7a5aff,#3a2aa0 50%,#6a4aff)}
#zvEx .rr span{margin-left:${u(30)};font-size:${u(29)};font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}
#zvEx .rr em{font-style:normal;font-size:${u(25)};color:#cfc6f5}
#zvEx .rr .inf{margin-left:auto;width:${u(40)};height:${u(40)};color:#fff;flex-shrink:0}
#zvEx .fee{margin:${u(30)} ${u(5)} 0 ${u(8)};border-radius:${u(38)};overflow:hidden;background:linear-gradient(135deg,#150a5acc,#0c0844cc);--bd:linear-gradient(135deg,#7a5aff,#3a2aa0 50%,#6a4aff)}
#zvEx .fee .fh{display:flex;align-items:center;height:${u(82)};padding:0 ${u(24)} 0 ${u(46)};font-size:${u(30)};font-weight:700}
#zvEx .fee .fh b{margin-left:${u(21)}}
#zvEx .fee .fh .inf{margin-left:auto;width:${u(40)};height:${u(40)};color:#8a5aff}
#zvEx .fee #exRows{margin:0 ${u(4)} ${u(4)};border-radius:${u(34)};background:#0d0944aa;border:1px solid #2e2290;overflow:hidden}
#zvEx .fr{display:flex;align-items:center;height:${u(66)};padding:0 ${u(37)} 0 ${u(42)};border-top:1px solid #4a3ac844;font-size:${u(26)};color:#f0ecff}
#zvEx .fr:first-child{border-top:0;height:${u(68)}}
#zvEx .fr i{width:${u(50)};height:${u(52)};flex-shrink:0;transform:scale(.9)}
#zvEx .fr span{margin-left:${u(52)};min-width:0}
#zvEx .fr b{margin-left:auto;font-weight:500;color:#bdb2f2;white-space:nowrap}
#zvEx .fr:first-child b{color:#fff;font-weight:600}
#zvEx .rc{position:relative;height:${u(141)};margin-top:${u(27)};border-radius:${u(40)};overflow:hidden;padding:${u(22)} ${u(34)};background:linear-gradient(110deg,#14085f,#0a0640 62%,#2a0f7a);--bd:linear-gradient(135deg,#8a6aff,#3a2aa0 50%,#8a4aff)}
#zvEx .rc .l{display:flex;align-items:center;gap:${u(22)};font-size:${u(26)};line-height:${u(40)};color:#c4bcf0;position:relative;z-index:2}
#zvEx .rc .l i{width:${u(42)};height:${u(42)};border-radius:50%;background:#2fd47c;display:grid;place-items:center;flex-shrink:0;box-shadow:0 0 ${u(16)} #2fd47c88}
#zvEx .rc .l i svg{width:${u(24)};height:${u(24)}}
#zvEx .rc #exReceive{position:relative;z-index:2;margin-top:${u(2)};font-weight:700;line-height:${u(68)};white-space:nowrap}
#zvEx .rc .xs-ring{position:absolute;right:0;top:${u(4)};z-index:1}
#zvEx #exConfirm{display:flex;align-items:center;justify-content:center;gap:${u(26)};width:100%;height:${u(91)};margin-top:${u(24)};border:0;border-radius:${u(46)};font-size:${u(31)};font-weight:700;color:#fff;background:linear-gradient(90deg,#3a6cff 0%,#7a3dff 55%,#e84fd0 100%);box-shadow:0 0 ${u(34)} #7a3dff66;position:relative}
#zvEx #exConfirm svg.sw{width:${u(42)};height:${u(42)}}
#zvEx #exConfirm svg.cv{position:absolute;right:${u(40)};width:${u(18)};height:${u(30)}}
#zvEx .rx{margin-top:${u(25)};border-radius:${u(38)};overflow:hidden;background:linear-gradient(135deg,#150a5acc,#0c0844cc);--bd:linear-gradient(135deg,#7a5aff,#3a2aa0 50%,#6a4aff)}
#zvEx .rx .rh{display:flex;align-items:center;height:${u(78)};padding:0 ${u(26)} 0 ${u(22)}}
#zvEx .rx .rh svg.cl{width:${u(40)};height:${u(40)}}
#zvEx .rx .rh b{margin-left:${u(20)};font-size:${u(28)};font-weight:700}
#zvEx .rx .rh button{margin-left:auto;display:flex;align-items:center;gap:${u(10)};border:0;background:none;padding:0;font-size:${u(26)};font-weight:600;color:#6c9bff}
#zvEx .rx .rh button svg{width:${u(26)};height:${u(26)}}
#zvEx .xr{display:flex;align-items:center;min-height:${u(86)};margin:0 ${u(8)};padding:0 ${u(16)} 0 ${u(20)};border-top:1px solid #4a3ac844}
#zvEx .xr .ti{width:${u(58)};height:${u(58)};border-radius:50%;border:${u(2)} solid #6a4aff;background:#1a1060;display:grid;place-items:center;flex-shrink:0;color:#a98bff}
#zvEx .xr .ti svg{width:${u(30)};height:${u(30)}}
#zvEx .xr .md{margin-left:${u(38)};min-width:0;flex:1}
#zvEx .xr .md b{display:block;font-size:${u(26)};line-height:${u(32)};font-weight:700;white-space:nowrap}
#zvEx .xr .md small{display:block;font-size:${u(20)};line-height:${u(28)};color:#a89ce8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#zvEx .xr .rs{display:flex;align-items:center;gap:${u(12)};font-size:${u(23)};color:#cbc4f5;white-space:nowrap;flex-shrink:0;margin-left:${u(10)}}
#zvEx .xr .rs svg{width:${u(26)};height:${u(26)}}
#zvEx .xr .rs.pe{color:#ffc24a}#zvEx .xr .rs.rj{color:#ff7a90}
#zvEx .xe{padding:${u(26)} ${u(30)};font-size:${u(25)};color:#a89ce8;border-top:1px solid #4a3ac844}
#zvEx .nt{margin:${u(24)} ${u(14)} 0;font-size:${u(21)};line-height:${u(30)};color:#8f86c8}
${spr}`;
    document.head.appendChild(st);
  }

  let exShowAll = false;
  const TILE_ICON = { TRX: "trxt", USDT: "usdt", BTC: "btc", TON: "ton", BNB: "bnb", SOL: "sol" };
  function body() {
    const tiles = ASSETS.map(a => `<button id="exTile_${a.sym}" class="tl tt3" onclick="exSelect('${a.sym}')"><span class="ic"><i class="xs-${TILE_ICON[a.sym]}"></i></span><b>${a.sym}</b><small>${a.name}</small></button>`).join("");
    const sb = k => `<button id="exSrc_${k}" class="tl fm" onclick="exSrc('${k}')"><span class="ic"><i class="xs-${k === "ZENY" ? "gem" : "trxb"}"></i></span><span class="tx"><b>${L(k)}</b><small>${k === "ZENY" ? "Mining income" : "NFT and other income"}</small></span><span class="ck">${XSV.chk}</span></button>`;
    return `
      <div class="hd"><i class="xs-xlogo"></i><div class="tt"><h2>Exchange</h2><p>Swap Your Assets Instantly ${XSV.bolt}</p></div><button class="exx" aria-label="Close" onclick="exClose()">${XSV.x}</button></div>
      <div class="wr bd"><i class="xs-wallet"></i><b id="exAvailLbl">Exchange Wallet · ZNV</b><button class="pl" onclick="exCopy()"><span id="exAvail">0.000000 ZNV</span>${XSV.copy}</button></div>
      <div class="lb">From</div>
      <div class="g2">${sb("ZENY")}${sb("TRX")}</div>
      <div class="lb"><span>Amount <em id="exFromLbl">· ZNV</em></span></div>
      <div class="af bd"><i class="xs-gems"></i><span class="sep"></span><input id="exAmount" type="number" inputmode="decimal" step="any" min="0" placeholder="0.000000" oninput="exUpdate()"><button class="mx" onclick="exMax()">Max</button></div>
      <div class="er" id="exErr"></div>
      <div class="lb">To <em>· Select asset</em></div>
      <div class="g3">${tiles}</div>
      <div class="rr bd"><i class="xs-swapr"></i><span id="exRate"></span><i class="inf">${XSV.info}</i></div>
      <div class="fee bd"><div class="fh"><i class="xs-calc"></i><b>Fee Breakdown</b><i class="inf">${XSV.info}</i></div><div id="exRows"></div></div>
      <div class="rc bd"><div class="l"><i>${XSV.chk}</i>You receive (estimated)</div><div id="exReceive">—</div><i class="xs-ring"></i></div>
      <button id="exConfirm" onclick="exConfirm()"><svg class="sw" viewBox="0 0 38 38" fill="none" stroke="#fff" stroke-width="3.200" stroke-linecap="round" stroke-linejoin="round"><path d="M6 14h26M26 7l7 7-7 7M32 25H6M12 18l-7 7 7 7"/></svg>Exchange Now<svg class="cv" viewBox="0 0 14 24" fill="none" stroke="#fff" stroke-width="3.400" stroke-linecap="round" stroke-linejoin="round"><path d="M2 2l10 10L2 22"/></svg></button>
      <div class="rx bd"><div class="rh">${XSV.clock.replace("<svg", '<svg class="cl"')}<b>Recent Exchanges</b><button id="exVA" onclick="exAll()">View All ${XSV.arr}</button></div><div id="exReqs">${reqRows()}</div></div>
      <div class="nt">Exchange is instant. A total ${TOTAL_FEE}% fee is taken and the result is added straight to your Wallet, where you can spend it, transfer it or withdraw it. Only your income (mining ZNV and TRX rewards) can be exchanged. Amounts shown here are estimates until you confirm.</div>`;
  }

  // ---- 2.6 s loading animation, then a success popup ----
  let busy = false;
  function exFx(from, to, done) {
    const old = $("exFx"); if (old) old.remove();
    if (!$("exFxCss")) {
      const st = document.createElement("style"); st.id = "exFxCss";
      st.textContent = "#exFx{position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;background:#03020de6;-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);animation:exfin .25s ease-out both}" +
        ".exfx-c{text-align:center;color:#fff}.exfx-r{position:relative;width:96px;height:96px;margin:0 auto 18px}" +
        ".exfx-r i{position:absolute;inset:0;border-radius:50%;border:3px solid transparent;border-top-color:#a54cff;animation:exfs 1s linear infinite}" +
        ".exfx-r i:nth-child(2){inset:12px;border-top-color:#2bf0b0;animation-duration:1.4s;animation-direction:reverse}" +
        ".exfx-r i:nth-child(3){inset:28px;border:0;background:radial-gradient(circle,#c9a0ff,#7a2cff 60%,transparent 72%);animation:exfp 1.2s ease-in-out infinite}" +
        ".exfx-c b{display:block;font-size:18px}.exfx-c span{display:inline-block;margin-top:8px;padding:4px 12px;border-radius:12px;border:1px solid #5a35d8;color:#cfc4ff;font-size:13px;font-weight:700}" +
        ".ex-ok{width:76px;height:76px;margin:6px auto 0;color:#2bf0b0;animation:expop .5s ease-out both}.ex-ok svg{width:100%;height:100%;display:block}" +
        "@keyframes exfs{to{transform:rotate(360deg)}}@keyframes exfp{50%{transform:scale(.7);opacity:.7}}@keyframes exfin{from{opacity:0}}@keyframes expop{from{transform:scale(.4);opacity:0}}";
      document.head.appendChild(st);
    }
    const ov = document.createElement("div"); ov.id = "exFx";
    ov.innerHTML = '<div class="exfx-c"><div class="exfx-r"><i></i><i></i><i></i></div><b id="exFxT">Exchanging…</b><span>' + L(from) + " → " + to + "</span></div>";
    document.body.appendChild(ov);
    setTimeout(() => { const t = $("exFxT"); if (t) t.textContent = "Adding to your Wallet…"; }, 1300);
    setTimeout(() => { ov.remove(); done(); }, 2600);
  }
  function exDone(r) {
    window.openModal("Exchange Successful", '<div style="text-align:center"><div class="ex-ok"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9.5"/><path d="M7.5 12.5l3 3 6-6.5"/></svg></div>' +
      '<b style="display:block;font-size:19px;margin:10px 0 12px">Added to your Wallet</b></div>' +
      '<div class="modal-list"><div><strong>Exchanged</strong><span>' + r.amount.toFixed(6) + " " + L(r.from) + "</span></div><div><strong>Received</strong><span>" + r.receive.toFixed(r.dec) + " " + r.to + "</span></div>" +
      "<div><strong>Total fees (" + TOTAL_FEE + '%)</strong><span>' + r.fee.toFixed(2) + " USDT</span></div><div><strong>Reference</strong><span>" + r.id + "</span></div></div>" +
      '<button class="btn" style="width:100%;margin-top:12px" onclick="closeModal()">Done</button>');
  }

  function openExchange() {
    if (window.ZenvyroSettings && window.ZenvyroSettings.block("exchange")) return;
    injectCss();
    const old = $("zvEx"); if (old) old.remove();
    const ov = document.createElement("div"); ov.id = "zvEx"; ov.innerHTML = `<div class="exs">${body()}</div>`;
    document.body.appendChild(ov); document.body.style.overflow = "hidden";
    update(); loadPrices();
  }

  function walletRows() {
    return ASSETS.map(a => `<div><strong>${a.sym} <small style="color:#aeb9ff;font-weight:500">${a.name}</small></strong><span>${wallet[a.sym].toFixed(a.dec)}</span></div>`).join("");
  }

  function init() {
    renderHome();
    window.ZenvyroWallet = {
      credit, debit, totalUsdt: () => wallet._val,
      total: () => wallet._val,
      balances: () => { const o = {}; ASSETS.forEach(a => (o[a.sym] = { amount: wallet[a.sym], value: wallet._v[a.sym] })); return o; },
      prices: () => (priceState === "ok" ? Object.assign({}, prices) : {}),
      ensurePrices: () => loadPrices()
    };
    // demo testing only (no admin panel/backend yet). In a real system Accept/Reject is verified on the server.
    window.ZenvyroExchange = { requests: () => reqs.slice(), approve, reject };
    window.exSelect = sym => { if (asset(sym)) { sel = sym; update(); } };
    window.exUpdate = update;
    window.exClose = () => { const ov = $("zvEx"); if (ov) ov.remove(); document.body.style.overflow = ""; };
    window.exCopy = () => { try { navigator.clipboard.writeText(srcBal().toFixed(6)); say("Copied"); } catch (e) {} };
    window.exAll = () => { exShowAll = !exShowAll; renderReqs(); };
    window.exMax = () => { const el = $("exAmount"); if (el) { el.value = srcBal().toFixed(6); update(); } };
    window.exSrc = k => { if (k === "ZENY" || k === "TRX") { src = k; const el = $("exAmount"); if (el) el.value = ""; update(); } };
    window.ZenvyroEarn = { get: () => ({ ZENY: zenyBalance(), TRX: trxEarn() }), addTrx, takeTrx };
    window.exConfirm = () => {
      if (busy) return;
      const c = calc();
      if (window.ZenvyroSettings && window.ZenvyroSettings.block("exchange")) return;
      if (!(c.amount > 0) || c.receive === null || c.receive <= 0) return;
      if (c.amount > srcBal() + 1e-12) { say("Not enough " + L(src) + " balance"); return; }
      const msg = "Exchange " + c.amount.toFixed(6) + " " + L(src) + " → " + c.receive.toFixed(c.a.dec) + " " + sel +
                  "\nTotal fees: " + TOTAL_FEE + "%\nThe result is added to your Wallet at once.\n\nContinue?";
      if (!window.confirm(msg)) return;
      const from = src, to = sel;
      const took = from === "ZENY" ? !!(window.ZenvyroMining && window.ZenvyroMining.spendZeny(c.amount)) : takeTrx(c.amount);
      if (!took) { say("Exchange failed"); return; }
      busy = true;
      const id = newId();
      credit(to, c.receive, c.net);
      reqs.unshift({ id, src: from, amt: c.amount, zeny: from === "ZENY" ? c.amount : 0, asset: to, status: "approved", estimate: c.receive, receive: c.receive, rate: c.price, created: Date.now(), decided: Date.now() });
      saveReqs();
      if (window.ZenvyroTx) window.ZenvyroTx.log({ id, kind: "exchange", sym: to, amount: c.receive, status: "completed", sub: L(from) + " → " + to });
      const am = $("exAmount"); if (am) am.value = "";
      renderReqs(); update();
      exFx(from, to, () => { busy = false; exDone({ id, from, to, amount: c.amount, receive: c.receive, dec: c.a.dec, fee: c.gross - c.net }); });
    };

    const orig = window.showSection;
    window.showSection = function (name) {
      if (name === "exchange" && typeof window.openModal === "function") { openExchange(); return; }
      const r = orig.apply(this, arguments);
      if (name === "wallet") { // show converted assets in the Wallet
        const mb = $("modalBody"), actions = mb && mb.querySelector(".modal-actions");
        const bn = mb && mb.querySelector(".balance-num");
        if (bn) bn.innerHTML = fmtUsd(wallet._val) + " <span>USDT</span>";
        if (actions) {
          const wrap = document.createElement("div");
          wrap.innerHTML = '<label class="modal-label">Exchanged assets</label><div class="modal-list">' + walletRows() + "</div>";
          mb.insertBefore(wrap, actions);
        }
      }
      return r;
    };
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
