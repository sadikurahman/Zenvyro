/* Zenvyro — ধাপ ৩ক: Exchange (ZENY → USDT / BTC / TON / BNB / SOL)
   শুধু JavaScript; বিদ্যমান modal ডিজাইন ব্যবহার করা হয়েছে।
   মোট ১০% ফি কাটা হয় (Exchange 3% + Network 2% + Platform 5%) এবং কনভার্টের আগেই দেখানো হয়।
   Wallet ব্যালেন্স এখন localStorage-এ (ডেমো)। আসল কনভার্ট/ব্যালেন্স ব্যাকএন্ডে হতে হবে। */
(() => {
  "use strict";

  const ZENY_USDT = 3; // প্ল্যাটফর্মের নির্ধারিত রেফারেন্স রেট
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

  // ---- Wallet store (ডেমো) ----
  function loadWallet() {
    const w = { _val: 0 }; ASSETS.forEach(a => (w[a.sym] = 0));
    try {
      const s = JSON.parse(localStorage.getItem(WKEY) || "null");
      if (s && Number.isFinite(+s._val) && +s._val > 0) w._val = +s._val;
      if (s) ASSETS.forEach(a => { if (Number.isFinite(+s[a.sym]) && +s[a.sym] > 0) w[a.sym] = +s[a.sym]; });
    } catch (e) {}
    return w;
  }
  let wallet = loadWallet();
  const saveWallet = () => { try { localStorage.setItem(WKEY, JSON.stringify(wallet)); } catch (e) {} };

  const fmtUsd = n => Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // হোমের Account Balance = Wallet-এ জমা হওয়া মোট মূল্য (USDT)
  function renderHome() {
    const el = document.querySelector(".balance .balance-num");
    if (el) el.innerHTML = fmtUsd(wallet._val) + " <span>USDT</span>";
  }

  // Wallet-এ জমা (Exchange অনুমোদন / Purchase Bonus সরাসরি এখান দিয়ে)
  function credit(sym, amount, usdtValue) {
    amount = +amount;
    if (!asset(sym) || !(amount > 0)) return false;
    const val = +usdtValue > 0 ? +usdtValue : (sym === "USDT" ? amount : 0);
    wallet[sym] = Math.round((wallet[sym] + amount) * 1e8) / 1e8;
    wallet._val = Math.round((wallet._val + val) * 100) / 100;
    saveWallet(); renderHome();
    return true;
  }

  // ---- Prices (USDT-এ) ----
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

    let rate;
    if (sel === "USDT") rate = "1 ZENY = " + ZENY_USDT + " USDT (ফি কাটার আগে)";
    else if (c.price) rate = "1 ZENY ≈ " + (ZENY_USDT / c.price).toFixed(c.a.dec) + " " + sel + " (ফি কাটার আগে)";
    else rate = priceState === "loading" ? "প্রাইস লোড হচ্ছে…" : "লাইভ প্রাইস পাওয়া যায়নি — পরে আবার চেষ্টা করুন";
    $("exRate").textContent = rate;

    $("exRows").innerHTML =
      `<div><strong>Value (before fees)</strong><span>${c.gross.toFixed(2)} USDT</span></div>` +
      c.fees.map(f => `<div><strong>${f.label} (${f.pct}%)</strong><span>− ${f.usdt.toFixed(2)} USDT</span></div>`).join("") +
      `<div><strong>Total fees (${TOTAL_FEE}%)</strong><span>− ${(c.gross - c.net).toFixed(2)} USDT</span></div>`;

    $("exReceive").textContent = c.receive === null ? "—" : c.receive.toFixed(c.a.dec) + " " + sel;

    const over = c.amount > bal + 1e-12;
    $("exErr").textContent = over ? "ব্যালেন্সে এতো ZENY নেই" : "";
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
      <div class="modal-list"><div><strong>Mining Available Balance</strong><span id="exAvail">0.000000 ZENY</span></div></div>
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
      <button class="btn" id="exConfirm" style="width:100%;margin-top:14px" onclick="exConfirm()">Confirm Exchange</button>
      <div class="modal-note">ZENY রেট প্ল্যাটফর্ম-নির্ধারিত রেফারেন্স রেট। BTC/TON/BNB/SOL-এর পরিমাণ বাজারদর (≈USD) থেকে হিসাব করা, চূড়ান্ত রেট ও ব্যালেন্স ব্যাকএন্ডে যাচাই হবে। এখন Wallet-এ জমা ডেমো মোডে আছে।</div>`;
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
    window.ZenvyroWallet = { credit, totalUsdt: () => wallet._val };
    window.exSelect = sym => { if (asset(sym)) { sel = sym; update(); } };
    window.exUpdate = update;
    window.exMax = () => { const el = $("exAmount"); if (el) { el.value = zenyBalance().toFixed(6); update(); } };
    window.exConfirm = () => {
      const c = calc();
      if (!(c.amount > 0) || c.receive === null || c.receive <= 0) return;
      if (c.amount > zenyBalance() + 1e-12) { say("ব্যালেন্সে এতো ZENY নেই"); return; }
      const msg = "Exchange " + c.amount.toFixed(6) + " ZENY → " + c.receive.toFixed(c.a.dec) + " " + sel +
                  "\nTotal fees: " + TOTAL_FEE + "% (" + (c.gross - c.net).toFixed(2) + " USDT)\n\nConfirm?";
      if (!window.confirm(msg)) return;
      if (!window.ZenvyroMining || !window.ZenvyroMining.spendZeny(c.amount)) { say("Exchange করা যায়নি"); return; }
      credit(sel, c.receive, c.net);
      $("exAmount").value = "";
      update();
      say("+" + c.receive.toFixed(c.a.dec) + " " + sel + " Wallet-এ যোগ হয়েছে");
    };

    const orig = window.showSection;
    window.showSection = function (name) {
      if (name === "exchange" && typeof window.openModal === "function") { openExchange(); return; }
      const r = orig.apply(this, arguments);
      if (name === "wallet") { // Wallet-এ কনভার্ট করা অ্যাসেট দেখাও
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
