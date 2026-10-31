/* Zenvyro — Step 3a: Exchange (ZENY → USDT / BTC / TON / BNB / SOL)
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
    { sym: "USDT", name: "Tether", icon: "₮", dec: 2 },
    { sym: "BTC", name: "Bitcoin", icon: "₿", dec: 8 },
    { sym: "TON", name: "Toncoin", icon: "💎", dec: 4 },
    { sym: "BNB", name: "BNB", icon: "◆", dec: 5 },
    { sym: "SOL", name: "Solana", icon: "◎", dec: 4 }
  ];
  const CG_URL = "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,the-open-network,binancecoin,solana&vs_currencies=usd";
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
      return Array.isArray(a) ? a.filter(r => r && r.id && asset(r.asset) && +r.zeny > 0 &&
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
    if (!reqs.length) return '<div><strong>No requests yet</strong><span>—</span></div>';
    return reqs.slice(0, 20).map(r => {
      const a = asset(r.asset);
      const st = r.status === "pending" ? "⏳ Pending"
        : r.status === "approved" ? "✓ " + (+r.receive).toFixed(a.dec) + " " + r.asset
        : "✕ Rejected · ZENY refunded";
      return `<div><strong>${(+r.zeny).toFixed(6)} ZENY → ${r.asset}<br><small style="color:#aeb9ff;font-weight:500">${when(r.created)} · ${r.id}</small></strong><span>${st}</span></div>`;
    }).join("");
  }
  function renderReqs() { const el = $("exReqs"); if (el) el.innerHTML = reqRows(); }

  // ---- Prices (in USDT) ----
  let prices = { USDT: 1 }, priceState = "idle", priceTime = 0, sel = "USDT";

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
        p = { BTC: +(j.bitcoin || {}).usd, TON: +(j["the-open-network"] || {}).usd,
              BNB: +(j.binancecoin || {}).usd, SOL: +(j.solana || {}).usd };
      }
      for (const k in p) if (!(Number.isFinite(p[k]) && p[k] > 0)) throw new Error("bad price");
      prices = Object.assign({ USDT: 1 }, p); priceState = "ok"; priceTime = Date.now();
    } catch (e) { priceState = "error"; }
    update();
  }

  const zenyBalance = () => (window.ZenvyroMining ? window.ZenvyroMining.getState().balance : 0);

  function calc() {
    const el = $("exAmount");
    const amount = el ? Math.max(0, parseFloat(el.value) || 0) : 0;
    const gross = amount * ZENY_USDT;
    const fees = FEES.map(f => ({ label: f.label, pct: f.pct, usdt: gross * f.pct / 100 }));
    const net = gross - fees.reduce((a, f) => a + f.usdt, 0);
    const price = prices[sel];
    const a = asset(sel);
    const receive = price ? floorTo(net / price, a.dec) : null;
    return { amount, gross, fees, net, price, receive, a };
  }

  function update() {
    if (!$("exAmount")) return;
    const c = calc(), bal = zenyBalance();
    $("exAvail").textContent = bal.toFixed(6) + " ZENY";
    if ($("exHeld")) $("exHeld").textContent = heldZeny().toFixed(6) + " ZENY";

    let rate;
    if (sel === "USDT") rate = "1 ZENY = " + ZENY_USDT + " USDT (before fees)";
    else if (c.price) rate = "1 ZENY ≈ " + (ZENY_USDT / c.price).toFixed(c.a.dec) + " " + sel + " (before fees)";
    else rate = priceState === "loading" ? "Loading price…" : "Live price unavailable — please try again later";
    $("exRate").textContent = rate;

    $("exRows").innerHTML =
      `<div><strong>Value (before fees)</strong><span>${c.gross.toFixed(2)} USDT</span></div>` +
      c.fees.map(f => `<div><strong>${f.label} (${f.pct}%)</strong><span>− ${f.usdt.toFixed(2)} USDT</span></div>`).join("") +
      `<div><strong>Total fees (${TOTAL_FEE}%)</strong><span>− ${(c.gross - c.net).toFixed(2)} USDT</span></div>`;

    $("exReceive").textContent = c.receive === null ? "—" : c.receive.toFixed(c.a.dec) + " " + sel;

    const over = c.amount > bal + 1e-12;
    $("exErr").textContent = over ? "Not enough ZENY balance" : "";
    const ok = c.amount > 0 && !over && c.receive !== null && c.receive > 0;
    const btn = $("exConfirm");
    btn.disabled = !ok; btn.style.opacity = ok ? "1" : ".5";

    ASSETS.forEach(x => {
      const t = $("exTile_" + x.sym);
      if (t) t.style.borderColor = x.sym === sel ? "#a54cff" : "#302864";
      if (t) t.style.boxShadow = x.sym === sel ? "0 0 18px #8d31ff30" : "none";
    });
  }

  function body() {
    const tiles = ASSETS.map(a =>
      `<button id="exTile_${a.sym}" onclick="exSelect('${a.sym}')" style="border:1px solid #302864;background:#0b0a23;color:#fff;border-radius:16px;padding:12px 4px;display:flex;flex-direction:column;align-items:center;gap:4px;font-weight:800;font-size:15px"><span style="font-size:24px;color:#b28aff;line-height:1">${a.icon}</span>${a.sym}<small style="color:#aeb9ff;font-weight:500;font-size:11px">${a.name}</small></button>`).join("");
    return `
      <div class="modal-list"><div><strong>Mining Available Balance</strong><span id="exAvail">0.000000 ZENY</span></div><div><strong>On hold (Pending requests)</strong><span id="exHeld">0.000000 ZENY</span></div></div>
      <label class="modal-label" for="exAmount">From · ZENY (Mining Balance)</label>
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
      <button class="btn" id="exConfirm" style="width:100%;margin-top:14px" onclick="exConfirm()">Request Exchange</button>
      <label class="modal-label">My Requests</label>
      <div class="modal-list" id="exReqs">${reqRows()}</div>
      <div class="modal-note">When you send a request, your ZENY is put on hold. When an admin accepts, the result is credited to your Wallet at the market price at acceptance (after the 10% fee); if rejected, your ZENY is refunded. Amounts shown here are estimates. The ZENY rate is a platform-set reference rate. Requests and the Wallet are in demo mode for now; real acceptance will happen via the server/admin panel.</div>`;
  }

  function openExchange() {
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
    window.exMax = () => { const el = $("exAmount"); if (el) { el.value = zenyBalance().toFixed(6); update(); } };
    window.exConfirm = () => {
      const c = calc();
      if (!(c.amount > 0) || c.receive === null || c.receive <= 0) return;
      if (c.amount > zenyBalance() + 1e-12) { say("Not enough ZENY balance"); return; }
      const msg = "Request: " + c.amount.toFixed(6) + " ZENY → " + sel +
                  "\nEstimated: " + c.receive.toFixed(c.a.dec) + " " + sel +
                  "\nTotal fees: " + TOTAL_FEE + "%\nThe rate will be set when the admin accepts; your ZENY will be held now.\n\nSend request?";
      if (!window.confirm(msg)) return;
      if (!window.ZenvyroMining || !window.ZenvyroMining.spendZeny(c.amount)) { say("Request failed"); return; }
      reqs.unshift({ id: newId(), zeny: c.amount, asset: sel, status: "pending", estimate: c.receive, receive: 0, created: Date.now() });
      saveReqs();
      if (window.ZenvyroTx) window.ZenvyroTx.log({ id: reqs[0].id, kind: "exchange", sym: sel, amount: c.receive, status: "pending", sub: "ZENY → " + sel });
      $("exAmount").value = "";
      renderReqs(); update();
      say("Request sent — ZENY is on hold");
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
