/* Zenvyro — Step 3a: Exchange (income ZENY or TRX → TRX / USDT / BTC / TON / BNB / SOL), instant
   JavaScript only; uses the existing modal design.
   A total 10% fee is deducted (Exchange 3% + Network 2% + Platform 5%) and shown before converting.
   Exchange is a Request: ZENY is held; when an admin accepts (at the rate at acceptance) it is credited to the Wallet, and if rejected the ZENY is refunded.
   Wallet balances and requests are in localStorage for now (demo). Real conversion/balances must happen on a backend. */
(() => {
  "use strict";

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

  function reqRows() {
    if (!reqs.length) return '<div><strong>No exchanges yet</strong><span>—</span></div>';
    return reqs.slice(0, 20).map(r => {
      const a = asset(r.asset), from = r.src || "ZENY", amt = +(r.amt || r.zeny);
      const st = r.status === "pending" ? "⏳ Pending" : r.status === "approved" ? "✓ " + (+r.receive).toFixed(a.dec) + " " + r.asset : "✕ Rejected · ZENY refunded";
      return `<div><strong>${amt.toFixed(6)} ${from} → ${r.asset}<br><small style="color:#aeb9ff;font-weight:500">${when(r.created)} · ${r.id}</small></strong><span>${st}</span></div>`;
    }).join("");
  }
  function renderReqs() { const el = $("exReqs"); if (el) el.innerHTML = reqRows(); }

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
    $("exAvail").textContent = bal.toFixed(6) + " " + src;
    if ($("exAvailLbl")) $("exAvailLbl").textContent = "Exchange Wallet · " + src;
    if ($("exFromLbl")) $("exFromLbl").textContent = "Amount · " + src;
    if ($("exHeld")) $("exHeld").textContent = heldZeny().toFixed(6) + " ZENY";

    let rate;
    if (!sp || !c.price) rate = priceState === "loading" ? "Loading price…" : "Live price unavailable — please try again later";
    else rate = "1 " + src + " ≈ " + (sp / c.price).toFixed(c.a.dec) + " " + sel + " (before fees)";
    $("exRate").textContent = rate;

    $("exRows").innerHTML =
      `<div><strong>Value (before fees)</strong><span>${c.gross.toFixed(2)} USDT</span></div>` +
      c.fees.map(f => `<div><strong>${f.label} (${f.pct}%)</strong><span>− ${f.usdt.toFixed(2)} USDT</span></div>`).join("") +
      `<div><strong>Total fees (${TOTAL_FEE}%)</strong><span>− ${(c.gross - c.net).toFixed(2)} USDT</span></div>`;

    $("exReceive").textContent = c.receive === null ? "—" : c.receive.toFixed(c.a.dec) + " " + sel;

    const over = c.amount > bal + 1e-12;
    $("exErr").textContent = over ? "Not enough " + src + " balance" : "";
    const ok = c.amount > 0 && !over && c.receive !== null && c.receive > 0;
    const btn = $("exConfirm");
    btn.disabled = !ok; btn.style.opacity = ok ? "1" : ".5";

    ASSETS.forEach(x => {
      const t = $("exTile_" + x.sym);
      if (t) t.style.borderColor = x.sym === sel ? "#a54cff" : "#302864";
      if (t) t.style.boxShadow = x.sym === sel ? "0 0 18px #8d31ff30" : "none";
    });
    ["ZENY", "TRX"].forEach(k => {
      const t = $("exSrc_" + k);
      if (t) { t.style.borderColor = k === src ? "#a54cff" : "#302864"; t.style.boxShadow = k === src ? "0 0 18px #8d31ff30" : "none"; }
    });
  }

  function body() {
    const tiles = ASSETS.map(a =>
      `<button id="exTile_${a.sym}" onclick="exSelect('${a.sym}')" style="border:1px solid #302864;background:#0b0a23;color:#fff;border-radius:16px;padding:12px 4px;display:flex;flex-direction:column;align-items:center;gap:4px;font-weight:800;font-size:15px"><span style="font-size:24px;color:#b28aff;line-height:1">${a.icon}</span>${a.sym}<small style="color:#aeb9ff;font-weight:500;font-size:11px">${a.name}</small></button>`).join("");
    const sb = k => `<button id="exSrc_${k}" onclick="exSrc('${k}')" style="border:1px solid #302864;background:#0b0a23;color:#fff;border-radius:16px;padding:12px 4px;display:flex;flex-direction:column;align-items:center;gap:4px;font-weight:800;font-size:14px">${k}<small style="font-weight:500;color:#aeb9ff">${k === "ZENY" ? "Mining income" : "NFT and other income"}</small></button>`;
    return `
      <div class="modal-list"><div><strong id="exAvailLbl">Exchange Wallet · ZENY</strong><span id="exAvail">0.000000 ZENY</span></div></div>
      <label class="modal-label">From</label>
      <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px">${sb("ZENY")}${sb("TRX")}</div>
      <label class="modal-label" for="exAmount" id="exFromLbl">Amount · ZENY</label>
      <input class="modal-field" id="exAmount" type="number" inputmode="decimal" step="any" min="0" placeholder="0.000000" oninput="exUpdate()">
      <button class="btn alt" style="width:100%;margin-top:8px;padding:10px" onclick="exMax()">Max</button>
      <div id="exErr" style="color:#ff8aa0;font-size:12px;margin-top:6px;min-height:14px"></div>
      <label class="modal-label">To · Select asset</label>
      <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px">${tiles}</div>
      <div class="modal-note" id="exRate"></div>
      <label class="modal-label">Fee breakdown</label>
      <div class="modal-list" id="exRows"></div>
      <label class="modal-label">You receive (estimated)</label>
      <div class="balance-num" style="font-size:30px;margin:0" id="exReceive">—</div>
      <button class="btn" id="exConfirm" style="width:100%;margin-top:14px" onclick="exConfirm()">Exchange Now</button>
      <label class="modal-label">Recent Exchanges</label>
      <div class="modal-list" id="exReqs">${reqRows()}</div>
      <div class="modal-note">Exchange is instant. A total 10% fee is taken and the result is added straight to your Wallet, where you can spend it, transfer it or withdraw it. Only your income (mining ZENY and TRX rewards) can be exchanged. Amounts shown here are estimates until you confirm.</div>`;
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
    ov.innerHTML = '<div class="exfx-c"><div class="exfx-r"><i></i><i></i><i></i></div><b id="exFxT">Exchanging…</b><span>' + from + " → " + to + "</span></div>";
    document.body.appendChild(ov);
    setTimeout(() => { const t = $("exFxT"); if (t) t.textContent = "Adding to your Wallet…"; }, 1300);
    setTimeout(() => { ov.remove(); done(); }, 2600);
  }
  function exDone(r) {
    window.openModal("Exchange Successful", '<div style="text-align:center"><div class="ex-ok"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9.5"/><path d="M7.5 12.5l3 3 6-6.5"/></svg></div>' +
      '<b style="display:block;font-size:19px;margin:10px 0 12px">Added to your Wallet</b></div>' +
      '<div class="modal-list"><div><strong>Exchanged</strong><span>' + r.amount.toFixed(6) + " " + r.from + "</span></div><div><strong>Received</strong><span>" + r.receive.toFixed(r.dec) + " " + r.to + "</span></div>" +
      "<div><strong>Total fees (" + TOTAL_FEE + '%)</strong><span>' + r.fee.toFixed(2) + " USDT</span></div><div><strong>Reference</strong><span>" + r.id + "</span></div></div>" +
      '<button class="btn" style="width:100%;margin-top:12px" onclick="closeModal()">Done</button>');
  }

  function openExchange() {
    if (window.ZenvyroSettings && window.ZenvyroSettings.block("exchange")) return;
    window.openModal("Exchange", body());
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
    window.exMax = () => { const el = $("exAmount"); if (el) { el.value = srcBal().toFixed(6); update(); } };
    window.exSrc = k => { if (k === "ZENY" || k === "TRX") { src = k; const el = $("exAmount"); if (el) el.value = ""; update(); } };
    window.ZenvyroEarn = { get: () => ({ ZENY: zenyBalance(), TRX: trxEarn() }), addTrx, takeTrx };
    window.exConfirm = () => {
      if (busy) return;
      const c = calc();
      if (window.ZenvyroSettings && window.ZenvyroSettings.block("exchange")) return;
      if (!(c.amount > 0) || c.receive === null || c.receive <= 0) return;
      if (c.amount > srcBal() + 1e-12) { say("Not enough " + src + " balance"); return; }
      const msg = "Exchange " + c.amount.toFixed(6) + " " + src + " → " + c.receive.toFixed(c.a.dec) + " " + sel +
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
      if (window.ZenvyroTx) window.ZenvyroTx.log({ id, kind: "exchange", sym: to, amount: c.receive, status: "completed", sub: from + " → " + to });
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
