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
  const EMB = {
    Standard: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.800 19.500 6v5.500c0 4.700-3.100 8.200-7.500 9.700C7.600 19.700 4.500 16.200 4.500 11.500V6z"/><path d="M8.500 12l2.400 2.400 4.900-4.900" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    Silver: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.500l2.900 6 6.600.8-4.900 4.500 1.300 6.500L12 17l-5.900 3.300 1.300-6.500L2.500 9.300l6.600-.8z"/></svg>',
    Gold: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.500 8l4.800 4.200L12 4l4.700 8.200L21.500 8l-2.200 11H4.700z"/><rect x="5.500" y="19.800" width="13" height="2" rx="1"/></svg>',
    Platinum: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.500 3h11l4.500 6-10 12L2 9z"/><path d="M2 9h20M9.500 3 7.500 9 12 21M14.500 3l2 6L12 21" fill="none" stroke="#ffffffaa" stroke-width="1.100"/></svg>'
  };
  const CONF = { Standard: ["#7ee8ff", "#2f7bff", "#ffffff"], Silver: ["#ffffff", "#aab6cf", "#d8e0f0"], Gold: ["#fff0a0", "#ffb340", "#e8861a"], Platinum: ["#ff7ae6", "#4ac8ff", "#a45cff", "#7affc0"] };
  const TIER_KEY = "zenvyro_tier_seen_v1";
  const delay = ms => new Promise(r => setTimeout(r, ms));
  let flow = 0;                                   // changes whenever the modal view changes or closes
  const RATE = { Standard: "0.002222", Silver: "0.006945", Gold: "0.017361", Platinum: "0.050505" };
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const date = ts => new Date(ts).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false });
  const body = html => { const b = document.getElementById("modalBody"); if (b) b.innerHTML = html; };
  const say = m => { if (typeof window.toast === "function") window.toast(m); };
  let pack = "", busy = false;

  const DEMO_NOTE = () => API().mode === "demo" ? '<div class="pu-warn">Demo mode: payments are not live yet. Do not send real funds.</div>' : "";
  const head = () => `<div class="pu-head"><span class="pu-ic">${IC.crown}</span><div><b>${pack} Pack</b><small>${API().PACKS[pack]} TRX &middot; ${RATE[pack]} ZENY / hour</small></div></div>`;
  const backBtn = to => `<button type="button" class="pu-back" data-pu="${to}">${IC.back}Back</button>`;

  function chooser() {
    flow++;
    document.getElementById("modalTitle").textContent = "Upgrade Membership";
    body(head() + `<p class="pu-lead">Choose how you want to pay.</p>
<button type="button" class="pu-opt" data-pu="voucher"><span class="pu-ic">${IC.ticket}</span><span><b>Voucher Code</b><small>Redeem a prepaid ${API().PACKS[pack]} TRX code. Your pack is activated instantly.</small></span>${IC.next}</button>
<button type="button" class="pu-opt" data-pu="crypto"><span class="pu-ic">${IC.coin}</span><span><b>Crypto Payment</b><small>Pay with TRX (TRC20). Our team verifies your transaction.</small></span>${IC.next}</button>
${DEMO_NOTE()}`);
  }

  function restricted(until, longBan) {
    body(`<div class="pu-done"><span class="pu-ic">${IC.lock}</span><b>Account restricted</b><p>Too many invalid voucher attempts. Your account is restricted until<br><b>${date(until)}</b>.${longBan ? " This is a repeated violation." : ""}</p></div>`);
    guard();
  }

  async function voucher(opts) {
    flow++; opts = opts || {};
    const me = await API().me();
    if (me.banned) return restricted(me.bannedUntil, me.banCount > 1);
    document.getElementById("modalTitle").textContent = "Voucher Code";
    const warn = me.fails > 0 ? `<div class="pu-msg err">${me.fails} of ${API().MAX_FAILS} invalid attempts used.</div>` : '<div class="pu-msg" id="puMsg"></div>';
    body(`${backBtn("chooser")}<div class="pu-banner">You are buying the <b>${pack} Pack (${API().PACKS[pack]} TRX)</b>. Enter a <b>${API().PACKS[pack]} TRX</b> voucher code.</div>
<label class="modal-label" for="puCode">Voucher code</label>
<input class="modal-field pu-code" id="puCode" maxlength="19" autocomplete="off" autocapitalize="characters" spellcheck="false" inputmode="text" placeholder="XXXX-XXXX-XXXX-XXXX">
${me.fails > 0 ? warn + '<div class="pu-msg" id="puMsg"></div>' : warn}
<button type="button" class="btn" id="puRedeem" style="width:100%;margin-top:10px">Redeem Code</button>
<div class="modal-note">A code works only for its own pack. Entering ${API().MAX_FAILS} invalid, wrong-pack or already-used codes restricts your account for 3 days, and repeated misuse leads to a 1-year restriction. Check every character before you submit.</div>${DEMO_NOTE()}`);
    if (opts.code) { const i = document.getElementById("puCode"); if (i) i.value = opts.code; }
    if (opts.msg) { const m = document.getElementById("puMsg"); if (m) { m.className = "pu-msg err"; m.textContent = opts.msg; } }
  }

  /* ---------- processing (5 to 6 seconds) and the success celebration (about 3 seconds) ---------- */
  function loading(ms) {
    flow++;
    document.getElementById("modalTitle").textContent = "Processing";
    body(`<div class="pu-load"><div class="pu-spinw"><div class="pu-spin"></div><span class="pu-lic">${IC.crown}</span></div><b id="puStep">Verifying your code...</b><div class="pu-bar"><i id="puFill" style="--d:${ms}ms"></i></div><small>Please keep this window open.</small></div>`);
    requestAnimationFrame(() => requestAnimationFrame(() => { const f = document.getElementById("puFill"); if (f) f.style.width = "100%"; }));
    const steps = ["Verifying your code...", "Checking pack eligibility...", "Activating your membership..."], my = flow;
    steps.forEach((t, i) => setTimeout(() => { const e = document.getElementById("puStep"); if (e && my === flow) e.textContent = t; }, ms * i / 3));
  }
  function celebrate(tier) {
    flow++;
    document.getElementById("modalTitle").textContent = "Membership Activated";
    const cols = CONF[tier] || CONF.Gold; let parts = "";
    for (let i = 0; i < 22; i++) {
      const ang = (i / 22) * Math.PI * 2 + Math.random() * .3, dist = 90 + Math.random() * 90;
      parts += `<i class="pt" style="--c:${cols[i % cols.length]};--dx:${Math.round(Math.cos(ang) * dist)}px;--dy:${Math.round(Math.sin(ang) * dist + 40 + Math.random() * 50)}px;--r:${Math.round(Math.random() * 720 - 360)}deg;animation-delay:${(.35 + Math.random() * .25).toFixed(2)}s"></i>`;
    }
    body(`<div class="pu-cel zt-${tier}"><span class="pu-ring"></span><span class="pu-ring" style="animation-delay:.3s"></span>${parts}
<div class="pu-medal">${EMB[tier]}</div><h3>${esc(tier)} Pack Activated</h3><p>Your mining rate has been upgraded.<br>Your profile now shows the ${esc(tier)} emblem.</p>
<button type="button" class="btn" id="puDone" style="width:100%;margin-top:18px">Done</button></div>`);
  }

  async function redeem() {
    if (busy) return; const inp = document.getElementById("puCode"), msg = document.getElementById("puMsg");
    const typed = inp.value, code = typed.replace(/[^A-Z0-9]/gi, "");
    if (code.length !== 16) { msg.className = "pu-msg err"; msg.textContent = "Enter the full 16-character code."; return; }
    busy = true;
    const D = 5000 + Math.round(Math.random() * 1000);            // 5 to 6 seconds, the same for every result
    loading(D); const mine = flow, t0 = Date.now();
    let r; try { r = await API().redeem(pack, typed); } catch (e) { r = { ok: false, error: "server" }; }
    await delay(Math.max(0, D - (Date.now() - t0)));
    busy = false;
    if (r.ok) applyTier(r.tier);
    if (mine !== flow) { if (r.ok) say(r.tier + " Pack activated"); return; }      // the window was closed meanwhile
    if (r.ok) return celebrate(r.tier);
    if (r.error === "banned") return restricted(r.bannedUntil, r.longBan);
    voucher({ code: typed, msg: r.error === "invalid" ? `Invalid code for this pack. ${r.failsLeft} attempt${r.failsLeft === 1 ? "" : "s"} left before your account is restricted.`
      : r.error === "already_have" ? `You already have the ${r.tier} Pack or a higher one.` : "Something went wrong. Please try again." });
  }

  async function crypto() {
    flow++;
    const me = await API().me(); if (me.banned) return restricted(me.bannedUntil, me.banCount > 1);
    const info = await API().payInfo(), list = await API().myPayments();
    document.getElementById("modalTitle").textContent = "Crypto Payment";
    body(`${backBtn("chooser")}<div class="pu-banner">Pay <b>${API().PACKS[pack]} TRX</b> (TRC20) for the <b>${pack} Pack</b>, then submit your transaction ID.</div>
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
${list.length ? '<div class="pu-list">' + list.map(p => `<div><span>${esc(p.pack)} Pack &middot; ${p.trx} TRX<small>${date(p.createdAt)}</small></span><span class="pu-tag ${p.status}">${p.status.toUpperCase()}</span></div>`).join("") + "</div>" : ""}`);
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

  /* ---------- profile photo: tier ring and emblem (Account page) ---------- */
  const SPARK = '<span class="zt-spark"><i></i><i></i><i></i></span>';
  function decorate() {
    const M = window.ZenvyroMining, tier = M && M.getState ? M.getState().tier : "Free";
    if (!EMB[tier]) return;
    let seenAvatar = false;
    document.querySelectorAll("#zvAccount .prof .av").forEach(av => {
      seenAvatar = true; if (av.dataset.zt === tier) return;
      av.dataset.zt = tier;
      av.querySelectorAll(".zt-emblem,.zt-spark").forEach(n => n.remove());
      av.classList.remove("zt-open", "zt-Standard", "zt-Silver", "zt-Gold", "zt-Platinum");
      av.classList.add("zt", "zt-" + tier);
      if (localStorage.getItem(TIER_KEY) !== tier) av.classList.add("zt-open");
      av.insertAdjacentHTML("beforeend", `<span class="zt-emblem">${EMB[tier]}</span>${tier === "Gold" || tier === "Platinum" ? SPARK : ""}`);
    });
    document.querySelectorAll("#zvAccount .prem > span:not(.ch2)").forEach(el => { if (!el.querySelector("svg") && el.textContent !== tier + " Pack") el.textContent = tier + " Pack"; });
    if (seenAvatar) try { localStorage.setItem(TIER_KEY, tier); } catch (e) {}
  }
  let pend = 0; const soon = () => { cancelAnimationFrame(pend); pend = requestAnimationFrame(decorate); };

  /* ---------- keep the app in sync with the account (tier + restriction) ---------- */
  function applyTier(t) { const M = window.ZenvyroMining; if (M && M.getState && API().rank(t) > API().rank(M.getState().tier)) M.setTier(t); }
  let ov = null;
  const modalOpen = () => { const m = document.getElementById("modalBackdrop"); return !!(m && m.classList.contains("open")); };
  async function guard() {
    try {
      const me = await API().me(); applyTier(me.tier); if (!modalOpen()) soon();
      if (!ov) { ov = document.createElement("div"); ov.id = "puBan"; document.body.appendChild(ov); }
      if (me.banned) ov.innerHTML = `<div class="bx"><span class="pu-ic">${IC.lock}</span><h2>Account Restricted</h2><p>Your account is restricted because of repeated invalid voucher attempts.</p><div class="until">Until ${date(me.bannedUntil)}</div><p>If you think this is a mistake, please contact support.</p>${API().mode === "demo" ? '<p style="font-size:12px;color:#e7d9b7">Demo mode: this restriction is stored in this browser. To remove it, open admin.html in this same browser, then Manage Membership, Attempts, Unban.</p>' : ""}<button type="button" class="btn" data-zf="support" style="width:100%">Contact Support</button></div>`;
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
  document.addEventListener("click", e => {
    if (e.target.id === "puRedeem") redeem(); else if (e.target.id === "puPay") pay();
    else if (e.target.id === "puDone") { if (typeof window.closeModal === "function") window.closeModal(); }
  });
  document.addEventListener("change", e => { if (e.target.id === "puAsset") showAddr(); });
  document.addEventListener("input", e => {
    if (e.target.id !== "puCode") return;
    const v = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 16);
    e.target.value = (v.match(/.{1,4}/g) || []).join("-");
  });
  const origClose = window.closeModal;
  window.closeModal = function () { flow++; const r = typeof origClose === "function" ? origClose.apply(this, arguments) : undefined; setTimeout(soon, 120); return r; };
  new MutationObserver(soon).observe(document.documentElement, { childList: true, subtree: true });
  const start = () => { soon(); guard(); setInterval(guard, 4000); document.addEventListener("visibilitychange", () => { if (!document.hidden) guard(); }); };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
