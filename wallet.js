/* Zenvyro — Step 3b: Wallet page (Deposit / Withdraw / Transfer / My Assets / Recent Transactions)
   JavaScript only; styles are scoped to #zvWallet, the rest of the page CSS is unchanged.
   - Deposit and Withdraw: requests that an admin accepts/rejects.
   - Transfer: user to user, instant, no admin involvement.
   Data is in localStorage for now (demo). Real balances/approvals/transfers must be verified on a server. */
(() => {
  "use strict";

  const ASSETS = [
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
      return Array.isArray(a) ? a.filter(t => t && t.id && t.kind && asset(t.sym) && ["pending", "completed", "rejected"].includes(t.status)) : [];
    } catch (e) { return []; }
  }
  let txs = loadTx();
  const saveTx = () => { try { localStorage.setItem(TXKEY, JSON.stringify(txs.slice(0, 200))); } catch (e) {} };
  const newId = p => p + Date.now().toString(36).toUpperCase() + Math.floor(Math.random() * 1296).toString(36).toUpperCase();

  window.ZenvyroTx = {
    log(t) { txs.unshift(Object.assign({ ts: Date.now() }, t)); saveTx(); render(); },
    update(id, patch) { const t = txs.find(x => x.id === id); if (t) { Object.assign(t, patch); saveTx(); render(); } }
  };

  const locked = sym => txs.filter(t => t.kind === "withdraw" && t.status === "pending" && t.sym === sym).reduce((a, t) => a + +t.amount, 0);
  const availAmt = sym => Math.max(0, (bals()[sym] ? bals()[sym].amount : 0) - locked(sym));
  function availUsdt() {
    const b = bals(); let v = 0;
    ASSETS.forEach(a => { const x = b[a.sym]; if (x && x.amount > 0) v += x.value * (availAmt(a.sym) / x.amount); });
    return v;
  }
  const zenyBal = () => (window.ZenvyroMining ? window.ZenvyroMining.getState().balance : 0);

  // ---- CSS (only for #zvWallet) ----
  const css = `
#zvWallet{position:fixed;inset:0;z-index:4;overflow-y:auto;-webkit-overflow-scrolling:touch;display:none;padding:calc(14px + env(safe-area-inset-top,0px)) 14px 130px;background:radial-gradient(ellipse at 50% 0,#2b1475 0,#0b0824 46%,#050511 100%);color:#fff}
#zvWallet.open{display:block}
#zvWallet .in{max-width:760px;margin:auto}
#zvWallet .top{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px}
#zvWallet .logo{display:flex;gap:10px;align-items:center}
#zvWallet .z{font-size:40px;font-weight:900;font-style:italic;color:#cda5ff;text-shadow:0 0 18px #8a32ff;line-height:1}
#zvWallet .brand b{letter-spacing:5px;font-size:20px;display:block}
#zvWallet .brand small{color:#b7b5ec;font-size:11px;letter-spacing:1px}
#zvWallet .ic{width:46px;height:46px;border-radius:15px;border:1px solid #6b45d8;background:#1b1050;display:grid;place-items:center;font-size:20px;color:#fff;position:relative}
#zvWallet .dot{position:absolute;top:8px;right:9px;width:9px;height:9px;border-radius:50%;background:#ff4466}
#zvWallet .card{border:1px solid #6a3ff0;border-radius:24px;background:linear-gradient(135deg,#1c1060ee,#0e0a33f2);box-shadow:0 0 30px #6b32ff30,inset 0 0 0 1px #3a2490;margin-bottom:14px}
#zvWallet .total{padding:16px;position:relative;overflow:hidden}
#zvWallet .trow{display:flex;gap:14px;align-items:center}
#zvWallet .wic{width:64px;height:64px;border-radius:18px;background:linear-gradient(145deg,#8b4dff,#4a2bd0);display:grid;place-items:center;font-size:30px;flex-shrink:0;box-shadow:0 0 20px #7a3dff66}
#zvWallet .tl{color:#c8b8ff;font-size:15px}
#zvWallet .amt{font-size:38px;font-weight:900;letter-spacing:-1px;margin:2px 0}
#zvWallet .est{color:#b9b2ee;font-size:13px}
#zvWallet .pill{position:absolute;top:14px;right:14px;border:1px solid #1fbf8f;color:#2bf0b0;background:#0a2b2b;border-radius:20px;padding:5px 10px;font-size:12px;font-weight:700}
#zvWallet .coins{position:absolute;right:14px;top:50px;display:flex;gap:-6px}
#zvWallet .coin{width:30px;height:30px;border-radius:50%;display:grid;place-items:center;font-weight:900;font-size:15px;margin-left:-8px;box-shadow:0 0 12px #0006}
#zvWallet .subs{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:14px}
#zvWallet .sub{border:1px solid #4a32a8;border-radius:18px;background:#120c40;padding:12px;display:flex;gap:10px;align-items:center;min-width:0}
#zvWallet .sub .si{width:42px;height:42px;border-radius:50%;border:1px solid #7a55e8;display:grid;place-items:center;font-size:20px;flex-shrink:0;background:#1b1050}
#zvWallet .sub small{color:#c8b8ff;font-size:12px;display:block}
#zvWallet .sub strong{font-size:16px;display:block;margin:2px 0;overflow-wrap:anywhere}
#zvWallet .sub em{font-style:normal;color:#b9b2ee;font-size:11px}
#zvWallet .acts{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px}
#zvWallet .acts button{border:1px solid #5b38d8;border-radius:20px;padding:14px 4px;background:linear-gradient(145deg,#1a1060,#0d0a30);color:#fff;display:flex;flex-direction:column;align-items:center;gap:5px;font-weight:800;font-size:15px}
#zvWallet .acts button.main{background:linear-gradient(145deg,#8a33ff,#3c1fc0);box-shadow:0 0 22px #7a33ff55}
#zvWallet .acts .ai{width:42px;height:42px;border-radius:50%;border:1px solid #8a66ff;display:grid;place-items:center;font-size:20px;background:#ffffff14}
#zvWallet .acts small{font-weight:500;color:#cfc4ff;font-size:12px}
#zvWallet .hd{display:flex;align-items:center;gap:10px;padding:14px 16px}
#zvWallet .hd .hi{width:34px;height:34px;border-radius:10px;background:#1b1050;display:grid;place-items:center}
#zvWallet .hd h3{margin:0;font-size:19px;flex:1}
#zvWallet .hd .tv{text-align:right;font-size:11px;color:#c8b8ff}
#zvWallet .hd .tv b{display:block;color:#fff;font-size:16px}
#zvWallet .hd a{color:#a98bff;font-size:14px;font-weight:700}
#zvWallet .row{display:flex;align-items:center;gap:12px;padding:12px 16px;border-top:1px solid #2a2170;width:100%;background:none;border-left:0;border-right:0;border-bottom:0;color:#fff;text-align:left}
#zvWallet .ai2{width:44px;height:44px;border-radius:50%;display:grid;place-items:center;font-weight:900;font-size:20px;flex-shrink:0;color:#fff}
#zvWallet .mid{flex:1;min-width:0}
#zvWallet .mid b{font-size:16px}
#zvWallet .tk{margin-left:8px;font-size:11px;padding:2px 8px;border:1px solid #4a3aa8;border-radius:12px;color:#c8b8ff;background:#17104a}
#zvWallet .rt{text-align:right}
#zvWallet .rt b{display:block;font-size:15px}
#zvWallet .rt small{color:#b9b2ee;font-size:12px}
#zvWallet .tx small.s{display:block;color:#b9b2ee;font-size:12px;margin-top:2px}
#zvWallet .st{display:inline-block;margin-top:4px;font-size:11px;padding:2px 9px;border-radius:12px;border:1px solid}
#zvWallet .st.completed{color:#2bf0b0;border-color:#1fbf8f;background:#0a2b2b}
#zvWallet .st.pending{color:#ffc24a;border-color:#a8791b;background:#2d2208}
#zvWallet .st.rejected{color:#ff7a90;border-color:#a8283f;background:#2d0c14}
#zvWallet .pos{color:#2bf0b0}#zvWallet .neg{color:#ffa33a}
#zvWallet .empty{padding:18px 16px;color:#b9b2ee;border-top:1px solid #2a2170;font-size:14px}`;
  const style = document.createElement("style"); style.textContent = css; document.head.appendChild(style);

  // ---- Page ----
  let hidden = false, showAll = false, root = null;
  const mask = t => (hidden ? "••••" : t);

  // up to 8/6 decimals, trailing zeros trimmed (at least 2 places)
  const fmtAmt = (n, a) => { let x = (+n).toFixed(a.dec > 6 ? 8 : 6).replace(/0+$/, ""); const d = x.split(".")[1] || ""; return d.length < 2 ? (+n).toFixed(2) : x; };

  function txRow(t) {
    const a = asset(t.sym);
    const ic = { deposit: ["↓", "#1fbf8f"], withdraw: ["↑", "#f7931a"], exchange: ["⇄", "#8a4dff"], transfer: ["⇄", "#8a4dff"] }[t.kind] || ["•", "#555"];
    const title = { deposit: "Deposit", withdraw: "Withdraw", exchange: "Exchange", transfer: "Transfer" }[t.kind] || t.kind;
    const out = t.kind === "withdraw" || (t.kind === "transfer" && t.dir === "out");
    const sign = out ? "-" : "+";
    const date = new Date(t.ts).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false });
    const stText = { completed: "Completed", pending: "Pending", rejected: "Rejected" }[t.status];
    return `<div class="row tx"><span class="ai2" style="background:${ic[1]}">${ic[0]}</span>
      <div class="mid"><b>${title}</b><small class="s">${esc(t.sub || a.sym)}</small><small class="s">${date}</small></div>
      <div class="rt"><b class="${t.status === "pending" ? "neg" : out ? "neg" : "pos"}">${sign}${fmtAmt(t.amount, a)} ${a.sym}</b><span class="st ${t.status}">${stText}</span></div></div>`;
  }

  function render() {
    if (!root || !root.classList.contains("open") || !W()) return;
    const b = bals(), total = W().total(), pr = W().prices();
    const btc = pr.BTC ? total / pr.BTC : null;
    const avail = availUsdt(), zb = zenyBal();
    const availBtc = pr.BTC ? avail / pr.BTC : null;
    const coins = [["₿", "#f7931a"], ["₮", "#1fbf8f"], ["◆", "#8a4dff"]].map(c => `<span class="coin" style="background:${c[1]}">${c[0]}</span>`).join("");
    const assets = ASSETS.map(a => {
      const x = b[a.sym] || { amount: 0, value: 0 };
      return `<button class="row" onclick="zvwAsset('${a.sym}')"><span class="ai2" style="background:${a.bg}">${a.ch}</span>
        <div class="mid"><b>${a.name}</b><span class="tk">${a.sym}</span></div>
        <div class="rt"><b>${mask(x.amount.toFixed(a.dec > 6 ? 8 : 6))}</b><small>${mask("≈ " + usd(x.value))}</small></div><span style="color:#a98bff">›</span></button>`;
    }).join("");
    const list = (showAll ? txs.slice(0, 30) : txs.slice(0, 4));
    root.innerHTML = `<div class="in">
      <div class="top"><div class="logo"><span class="z">Z</span><div class="brand"><b>ZENVYRO</b><small>Your Crypto Future</small></div></div>
        <div style="display:flex;gap:10px"><button class="ic" onclick="toast('No new notifications')">🔔<span class="dot"></span></button><button class="ic" onclick="showSection('account')">👤</button></div></div>
      <div class="card total"><span class="pill">● Wallet Active</span><div class="coins">${coins}</div>
        <div class="trow"><span class="wic">👛</span><div><div class="tl">Total Wallet Balance <a onclick="zvwEye()" style="cursor:pointer">${hidden ? "🙈" : "👁"}</a></div>
        <div class="amt">${mask("$ " + Number(total).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }))}</div>
        <div class="est">${btc !== null ? mask("≈ " + btc.toFixed(4) + " BTC") + " &nbsp;•&nbsp; " : ""}Est. value</div></div></div>
        <div class="subs">
          <div class="sub"><span class="si">⛏</span><div><small>Mining Balance</small><strong>${mask(zb.toFixed(6))} <span style="font-size:12px;color:#c8b8ff">ZENY</span></strong><em>${mask("≈ " + usd(zb * ZENY_USDT))}</em></div></div>
          <div class="sub"><span class="si">🪙</span><div><small>Available to Withdraw</small><strong>${mask("$ " + Number(avail).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }))}</strong><em>${availBtc !== null ? mask("≈ " + availBtc.toFixed(4) + " BTC") : "&nbsp;"}</em></div></div>
        </div></div>
      <div class="acts"><button class="main" onclick="zvwDepositForm()"><span class="ai">↓</span>Deposit<small>Add Funds</small></button>
        <button onclick="zvwWithdrawForm()"><span class="ai">↑</span>Withdraw<small>Cash Out</small></button>
        <button onclick="zvwTransferForm()"><span class="ai">⇄</span>Transfer<small>Move Funds</small></button></div>
      <div class="card"><div class="hd"><span class="hi">▦</span><h3>My Assets</h3><div class="tv">Total Value<b>${mask(usd(total))}</b></div></div>${assets}</div>
      <div class="card"><div class="hd"><span class="hi">🕒</span><h3>Recent Transactions</h3><a onclick="zvwAll()" style="cursor:pointer">${showAll ? "Show Less" : "View All"} ›</a></div>
        ${list.length ? list.map(txRow).join("") : '<div class="empty">No transactions yet</div>'}</div></div>`;
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
    sel = sel || "USDT";
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
    const sym = val("dpAsset"), a = asset(sym), amount = parseFloat(val("dpAmt")), txid = val("dpTx");
    if (!(amount > 0)) return say("Enter a valid amount");
    if (txid.length < 6) return say("Enter the TXID");
    window.ZenvyroTx.log({ id: newId("DP"), kind: "deposit", sym, amount, status: "pending", sub: sym + " (" + a.net + ")", txid });
    window.closeModal(); say("Deposit request sent");
  }

  function withdrawForm(sel) {
    sel = sel || "USDT";
    window.openModal("Withdraw", `
      <label class="modal-label" for="wdAsset">Asset</label>
      <select class="modal-field" id="wdAsset" onchange="zvwWdInfo()">${opts(sel)}</select>
      <div class="modal-note" id="wdInfo" style="margin-top:10px"></div>
      <label class="modal-label" for="wdAddr">Wallet address</label>
      <input class="modal-field" id="wdAddr" type="text" placeholder="Your wallet address" autocapitalize="off" autocorrect="off">
      <label class="modal-label" for="wdAmt">Amount</label>
      <input class="modal-field" id="wdAmt" type="number" inputmode="decimal" step="any" min="0" placeholder="0.00">
      <button class="btn alt" style="width:100%;margin-top:8px;padding:10px" onclick="zvwWdMax()">Max</button>
      <button class="btn" style="width:100%;margin-top:12px" onclick="zvwWithdraw()">Submit Withdraw Request</button>
      <div class="modal-note">When you send a request, that amount is locked. If an admin accepts, it is sent; if rejected, the lock is released. Double-check the address and network — funds sent to a wrong address cannot be recovered.</div>`);
    wdInfo();
  }
  function wdInfo() {
    const sym = val("wdAsset"), a = asset(sym);
    $("wdInfo").textContent = "Network: " + a.net + " · Available: " + availAmt(sym).toFixed(a.dec > 6 ? 8 : 6) + " " + sym;
  }
  function submitWithdraw() {
    const sym = val("wdAsset"), a = asset(sym), addr = val("wdAddr"), amount = parseFloat(val("wdAmt"));
    if (!/^[A-Za-z0-9:_-]{20,120}$/.test(addr)) return say("Enter a valid wallet address");
    if (!(amount > 0)) return say("Enter a valid amount");
    if (amount > availAmt(sym) + 1e-12) return say("Not enough available balance");
    window.ZenvyroTx.log({ id: newId("WD"), kind: "withdraw", sym, amount, status: "pending", sub: sym + " (" + a.net + ")", addr });
    window.closeModal(); say("Withdraw request sent");
  }

  function transferForm(sel) {
    sel = sel || "USDT";
    window.openModal("Transfer", `
      <label class="modal-label" for="trAsset">Asset (exchanged balance)</label>
      <select class="modal-field" id="trAsset" onchange="zvwTrInfo()">${opts(sel)}</select>
      <div class="modal-note" id="trInfo" style="margin-top:10px"></div>
      <label class="modal-label" for="trTo">Recipient ID</label>
      <input class="modal-field" id="trTo" type="text" placeholder="Recipient's user ID" autocapitalize="characters" autocorrect="off">
      <label class="modal-label" for="trAmt">Amount</label>
      <input class="modal-field" id="trAmt" type="number" inputmode="decimal" step="any" min="0" placeholder="0.00">
      <button class="btn" style="width:100%;margin-top:14px" onclick="zvwTransfer()">Send</button>
      <div class="modal-note">Transfers happen instantly and do not go through an admin, so they cannot be reversed once sent. Double-check the recipient's ID. In demo mode the recipient is not verified.</div>`);
    trInfo();
  }
  function trInfo() {
    const sym = val("trAsset"), a = asset(sym);
    $("trInfo").textContent = "Available: " + availAmt(sym).toFixed(a.dec > 6 ? 8 : 6) + " " + sym;
  }
  function submitTransfer() {
    const sym = val("trAsset"), a = asset(sym), to = val("trTo"), amount = parseFloat(val("trAmt"));
    if (!/^[A-Za-z0-9_-]{3,32}$/.test(to)) return say("Enter a valid recipient ID");
    if (to.toLowerCase() === MY_ID.toLowerCase()) return say("You can't transfer to your own ID");
    if (!(amount > 0)) return say("Enter a valid amount");
    if (amount > availAmt(sym) + 1e-12) return say("Not enough available balance");
    if (!window.confirm("Send " + amount + " " + sym + " to " + to + "?\n\nThis happens instantly and cannot be reversed.")) return;
    if (!W().debit(sym, amount)) return say("Transfer failed");
    window.ZenvyroTx.log({ id: newId("TR"), kind: "transfer", dir: "out", sym, amount, status: "completed", sub: "To " + to });
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
  function adminApprove(id, priceUsdt) {
    const t = txs.find(x => x.id === id && x.status === "pending");
    if (!t || !W()) return false;
    if (t.kind === "deposit") {
      const v = t.sym === "USDT" ? t.amount : t.amount * +priceUsdt;
      if (!(v > 0)) return false;
      W().credit(t.sym, t.amount, v);
    } else if (t.kind === "withdraw") {
      if (!W().debit(t.sym, t.amount)) return false;
    } else return false;
    t.status = "completed"; saveTx(); render(); return true;
  }
  function adminReject(id) {
    const t = txs.find(x => x.id === id && x.status === "pending" && (x.kind === "deposit" || x.kind === "withdraw"));
    if (!t) return false;
    t.status = "rejected"; saveTx(); render(); return true; // a withdraw's lock is released automatically
  }

  function init() {
    Object.assign(window, {
      zvwClose: closeWallet,
      zvwEye: () => { hidden = !hidden; render(); },
      zvwAll: () => { showAll = !showAll; render(); },
      zvwAsset: assetDetail,
      zvwDepositForm: depositForm, zvwDepositAddr: depositAddr, zvwDeposit: submitDeposit,
      zvwWithdrawForm: withdrawForm, zvwWdInfo: wdInfo, zvwWithdraw: submitWithdraw,
      zvwWdMax: () => { const sym = val("wdAsset"); $("wdAmt").value = availAmt(sym).toFixed(8); },
      zvwTransferForm: transferForm, zvwTrInfo: trInfo, zvwTransfer: submitTransfer,
      zvwCopy: () => {
        const el = document.querySelector("#dpAddr .ref-box");
        if (el && navigator.clipboard) navigator.clipboard.writeText(el.textContent).then(() => say("Address copied")).catch(() => say(el.textContent));
      }
    });
    window.ZenvyroWalletAdmin = {
      list: () => txs.filter(t => t.status === "pending" && (t.kind === "deposit" || t.kind === "withdraw")),
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
    setInterval(render, 5000); // reflect Mining/ZENY and other changes
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
