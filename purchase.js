/* Zenvyro premium purchase flow: choose a pack, then pay with a voucher code or crypto.
   Needs zenvyro-api.js. All checks happen inside ZenvyroAPI (the screens never decide anything about money). */
(() => {
  "use strict";
  const API = () => window.ZenvyroAPI;
  const SV = d => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const IC = {
    crown: SV('<path d="M3 8l4.500 4L12 4l4.500 8L21 8l-2 11H5z"/>'),
    ticket: SV('<path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4z"/><path d="M14 6v12" stroke-dasharray="2 2.500"/>'),
    coin: SV('<circle cx="12" cy="12" r="9"/><path d="M9.500 9.500h4a1.800 1.800 0 0 1 0 3.600h-3a1.800 1.800 0 0 0 0 3.600h4.300M12 7.500v1.800M12 16.700v1.800"/>'),
    next: SV('<path d="M9 5l7 7-7 7"/>'), back: SV('<path d="M15 5l-7 7 7 7"/>'),
    check: SV('<path d="M5 12.500l4.500 4.500L19 7.500"/>'), lock: SV('<rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>')
  };
  const RATE = { Standard: "0.002222", Silver: "0.006945", Gold: "0.017361", Platinum: "0.050505" };
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const date = ts => new Date(ts).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false });
  const body = html => { const b = document.getElementById("modalBody"); if (b) b.innerHTML = html; };
  const say = m => { if (typeof window.toast === "function") window.toast(m); };
  let pack = "", busy = false;

  const DEMO_NOTE = () => API().mode === "demo" ? '<div class="pu-warn">Demo mode: payments are not live yet. Do not send real funds.</div>' : "";
  const head = () => `<div class="pu-head"><span class="pu-ic">${IC.crown}</span><div><b>${pack} Pack</b><small>$${API().PACKS[pack]} &middot; ${RATE[pack]} ZENY / hour</small></div></div>`;
  const backBtn = to => `<button type="button" class="pu-back" data-pu="${to}">${IC.back}Back</button>`;

  function chooser() {
    document.getElementById("modalTitle").textContent = "Upgrade Membership";
    body(head() + `<p class="pu-lead">Choose how you want to pay.</p>
<button type="button" class="pu-opt" data-pu="voucher"><span class="pu-ic">${IC.ticket}</span><span><b>Voucher Code</b><small>Redeem a prepaid $${API().PACKS[pack]} code. Your pack is activated instantly.</small></span>${IC.next}</button>
<button type="button" class="pu-opt" data-pu="crypto"><span class="pu-ic">${IC.coin}</span><span><b>Crypto Payment</b><small>Pay with USDT, BNB, BTC, TON or SOL. Our team verifies your transaction.</small></span>${IC.next}</button>
${DEMO_NOTE()}`);
  }

  function restricted(until, longBan) {
    body(`<div class="pu-done"><span class="pu-ic">${IC.lock}</span><b>Account restricted</b><p>Too many invalid voucher attempts. Your account is restricted until<br><b>${date(until)}</b>.${longBan ? " This is a repeated violation." : ""}</p></div>`);
    guard();
  }

  async function voucher() {
    const me = await API().me();
    if (me.banned) return restricted(me.bannedUntil, me.banCount > 1);
    document.getElementById("modalTitle").textContent = "Voucher Code";
    const warn = me.fails > 0 ? `<div class="pu-msg err">${me.fails} of ${API().MAX_FAILS} invalid attempts used.</div>` : '<div class="pu-msg" id="puMsg"></div>';
    body(`${backBtn("chooser")}<div class="pu-banner">You are buying the <b>${pack} Pack ($${API().PACKS[pack]})</b>. Enter a <b>$${API().PACKS[pack]}</b> voucher code.</div>
<label class="modal-label" for="puCode">Voucher code</label>
<input class="modal-field pu-code" id="puCode" maxlength="19" autocomplete="off" autocapitalize="characters" spellcheck="false" inputmode="text" placeholder="XXXX-XXXX-XXXX-XXXX">
${me.fails > 0 ? warn + '<div class="pu-msg" id="puMsg"></div>' : warn}
<button type="button" class="btn" id="puRedeem" style="width:100%;margin-top:10px">Redeem Code</button>
<div class="modal-note">A code works only for its own pack. Entering ${API().MAX_FAILS} invalid, wrong-pack or already-used codes restricts your account for 3 days, and repeated misuse leads to a 1-year restriction. Check every character before you submit.</div>${DEMO_NOTE()}`);
  }

  async function redeem() {
    if (busy) return; const inp = document.getElementById("puCode"), msg = document.getElementById("puMsg"), btn = document.getElementById("puRedeem");
    const code = inp.value.replace(/[^A-Z0-9]/gi, "");
    if (code.length !== 16) { msg.className = "pu-msg err"; msg.textContent = "Enter the full 16-character code."; return; }
    busy = true; btn.disabled = true; btn.textContent = "Checking...";
    const r = await API().redeem(pack, inp.value);
    busy = false;
    if (r.ok) { applyTier(r.tier); return body(`<div class="pu-done"><span class="pu-ic">${IC.check}</span><b>${esc(r.tier)} Pack activated</b><p>Your mining rate has been upgraded. Thank you for joining the ${esc(r.tier)} Pack.</p></div>`), say(r.tier + " Pack activated"); }
    if (r.error === "banned") return restricted(r.bannedUntil, r.longBan);
    btn.disabled = false; btn.textContent = "Redeem Code";
    msg.className = "pu-msg err";
    msg.textContent = r.error === "invalid" ? `Invalid code for this pack. ${r.failsLeft} attempt${r.failsLeft === 1 ? "" : "s"} left before your account is restricted.`
      : r.error === "already_have" ? `You already have the ${r.tier} Pack or a higher one.` : "Something went wrong. Please try again.";
  }

  async function crypto() {
    const me = await API().me(); if (me.banned) return restricted(me.bannedUntil, me.banCount > 1);
    const info = await API().payInfo(), list = await API().myPayments();
    document.getElementById("modalTitle").textContent = "Crypto Payment";
    body(`${backBtn("chooser")}<div class="pu-banner">Pay the equivalent of <b>$${API().PACKS[pack]}.00 USD</b> for the <b>${pack} Pack</b>, then submit your transaction ID.</div>
<label class="modal-label" for="puAsset">Asset and network</label>
<select class="modal-field" id="puAsset">${info.map(a => `<option value="${a.id}">${a.asset} (${a.network})</option>`).join("")}</select>
<label class="modal-label">Send payment to</label>
<div class="pu-addr"><code id="puAddr"></code><button type="button" data-pu="copy" id="puCopy">Copy</button></div>
<div class="pu-warn">Send only on the selected network. Funds sent on the wrong network or to a wrong address cannot be recovered.</div>
<label class="modal-label" for="puTx">Transaction ID (TXID)</label>
<input class="modal-field" id="puTx" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Paste your transaction ID">
<div class="pu-msg" id="puMsg"></div>
<button type="button" class="btn" id="puPay" style="width:100%;margin-top:10px">Submit Payment</button>
<div class="modal-note">Each transaction ID can be used only once. A team member checks the transaction before your pack is activated.</div>${DEMO_NOTE()}
${list.length ? '<div class="pu-list">' + list.map(p => `<div><span>${esc(p.pack)} Pack &middot; $${p.usd}<small>${date(p.createdAt)}</small></span><span class="pu-tag ${p.status}">${p.status.toUpperCase()}</span></div>`).join("") + "</div>" : ""}`);
    window.__puInfo = info; showAddr();
  }
  function showAddr() {
    const sel = document.getElementById("puAsset"); if (!sel) return;
    const a = (window.__puInfo || []).find(x => x.id === sel.value), el = document.getElementById("puAddr"), pay = document.getElementById("puPay");
    el.textContent = a && a.address ? a.address : "Payment address not set yet"; if (pay) pay.disabled = !(a && a.address);
  }
  async function pay() {
    if (busy) return; const msg = document.getElementById("puMsg"), btn = document.getElementById("puPay");
    busy = true; btn.disabled = true; btn.textContent = "Submitting...";
    const r = await API().submitPayment({ pack, asset: document.getElementById("puAsset").value, txid: document.getElementById("puTx").value });
    busy = false; btn.disabled = false; btn.textContent = "Submit Payment";
    if (r.ok) return body(`<div class="pu-done"><span class="pu-ic">${IC.check}</span><b>Payment submitted</b><p>Your transaction is pending review. Your ${esc(pack)} Pack will be activated once a team member confirms it.</p></div>`), say("Payment submitted");
    msg.className = "pu-msg err";
    msg.textContent = ({ bad_txid: "This transaction ID does not look valid for the selected network.", txid_used: "This transaction ID has already been used.", too_many: "You already have 3 payments pending review.",
      already_have: "You already have this pack or a higher one.", banned: "Your account is restricted." })[r.error] || "Something went wrong. Please try again.";
  }

  /* ---------- keep the app in sync with the account (tier + restriction) ---------- */
  function applyTier(t) { const M = window.ZenvyroMining; if (M && M.getState && API().rank(t) > API().rank(M.getState().tier)) M.setTier(t); }
  let ov = null;
  async function guard() {
    try {
      const me = await API().me(); applyTier(me.tier);
      if (!ov) { ov = document.createElement("div"); ov.id = "puBan"; document.body.appendChild(ov); }
      if (me.banned) ov.innerHTML = `<div class="bx"><span class="pu-ic">${IC.lock}</span><h2>Account Restricted</h2><p>Your account is restricted because of repeated invalid voucher attempts.</p><div class="until">Until ${date(me.bannedUntil)}</div><p>If you think this is a mistake, please contact support.</p><button type="button" class="btn" data-zf="support" style="width:100%">Contact Support</button></div>`;
      ov.classList.toggle("on", !!me.banned);
    } catch (e) {}
  }

  /* ---------- wiring ---------- */
  window.selectPack = function (name) {
    if (/^Free/.test(name)) { if (typeof window.closeModal === "function") window.closeModal(); return say("Free Pack selected"); }
    pack = String(name).replace(/ Pack$/, "");
    if (!API().PACKS[pack]) return;
    API().me().then(me => {
      if (me.banned) { if (typeof window.openModal === "function") window.openModal("Upgrade Membership", ""); return restricted(me.bannedUntil, me.banCount > 1); }
      if (API().rank(me.tier) >= API().rank(pack)) { if (typeof window.closeModal === "function") window.closeModal(); return say("You already have the " + me.tier + " Pack" + (me.tier === pack ? "" : " or higher")); }
      window.openModal("Upgrade Membership", ""); chooser();
    });
  };
  document.addEventListener("click", e => {
    const b = e.target.closest("[data-pu]"); if (!b || !document.getElementById("modalBody") || !document.getElementById("modalBody").contains(b)) return;
    const a = b.dataset.pu;
    if (a === "chooser") chooser(); else if (a === "voucher") voucher(); else if (a === "crypto") crypto();
    else if (a === "copy") { const t = document.getElementById("puAddr").textContent; if (!/not set/.test(t) && navigator.clipboard) navigator.clipboard.writeText(t).then(() => say("Address copied")).catch(() => {}); }
  });
  document.addEventListener("click", e => { if (e.target.id === "puRedeem") redeem(); else if (e.target.id === "puPay") pay(); });
  document.addEventListener("change", e => { if (e.target.id === "puAsset") showAddr(); });
  document.addEventListener("input", e => {
    if (e.target.id !== "puCode") return;
    const v = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 16);
    e.target.value = (v.match(/.{1,4}/g) || []).join("-");
  });
  const start = () => { guard(); setInterval(guard, 4000); document.addEventListener("visibilitychange", () => { if (!document.hidden) guard(); }); };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
