/* Zenvyro — Step 2: Referral page + commission history
   JavaScript only. HTML/CSS design unchanged (uses existing modal classes).
   Real referral data comes from the backend: set window.ZENVYRO_REFERRAL_ENDPOINT.
   Without a backend the list stays empty; no made-up data. */
(() => {
  "use strict";

  // income commission %, locked at the time the referee joins, based on the referrer's pack
  const INCOME_COMMISSION = { Free: 2, Standard: 4, Silver: 6, Gold: 8, Platinum: 10 };
  const PACK_PRICE = { Free: 0, Standard: 10, Silver: 25, Gold: 50, Platinum: 100 };
  const PURCHASE_BONUS_PCT = 5; // on the referee's first pack purchase, once

  // calculation helpers for the backend (should run on the server)
  const incomeCommission = (refereeClaimZeny, lockedPct) => refereeClaimZeny * lockedPct / 100;
  const purchaseBonus = (packName, isFirstPurchase) =>
    !isFirstPurchase || !PACK_PRICE[packName] ? 0 : PACK_PRICE[packName] * PURCHASE_BONUS_PCT / 100;

  const REF_KEY = "zenvyro_ref_v1";
  const MY_CODE = "ZENV-NEW-MEMBER"; // will come per user once a backend exists

  const esc = s => String(s).replace(/[&<>"']/g,
    c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // if someone arrives with ?ref=CODE, keep the code (used at registration)
  try {
    const r = new URLSearchParams(location.search).get("ref");
    if (r && /^[A-Za-z0-9_-]{3,32}$/.test(r) && !localStorage.getItem(REF_KEY))
      localStorage.setItem(REF_KEY, r);
  } catch (e) {}

  const myLink = () => location.origin + location.pathname + "?ref=" + encodeURIComponent(MY_CODE);
  const currentTier = () =>
    (window.ZenvyroMining && window.ZenvyroMining.getState().tier) || "Free";
  const say = m => { if (typeof window.toast === "function") window.toast(m); };


  // ---- 10 PM claim (Asia/Dhaka = UTC+6, no DST) ----
  const CLAIM_KEY = "zenvyro_refclaim_v1";
  const DHAKA_MS = 6 * 3600 * 1000, DAY_MS = 86400000, CLAIM_HOUR = 22;

  const loadClaim = () => {
    const b = { pendingIncome: 0, pendingBonus: 0, lastSlot: 0, claimedBonus: 0 };
    try {
      const s = JSON.parse(localStorage.getItem(CLAIM_KEY) || "null");
      if (s) for (const k in b) b[k] = Number.isFinite(+s[k]) && +s[k] >= 0 ? +s[k] : 0;
    } catch (e) {}
    return b;
  };
  const claim = loadClaim();
  const saveClaim = () => { try { localStorage.setItem(CLAIM_KEY, JSON.stringify(claim)); } catch (e) {} };

  // most recent 10 PM slot (UTC ms)
  function latestSlot(now) {
    let slot = Math.floor((now + DHAKA_MS) / DAY_MS) * DAY_MS + CLAIM_HOUR * 3600000 - DHAKA_MS;
    if (now < slot) slot -= DAY_MS;
    return slot;
  }
  const nextSlot = now => latestSlot(now) + DAY_MS;
  const hasPending = () => claim.pendingIncome > 0; // Income Commission only (ZENY); Purchase Bonus goes straight to the Wallet
  // claimable when something is pending and a new 10 PM has passed since the last claim
  const canClaim = () => hasPending() && claim.lastSlot < latestSlot(Date.now());
  const hms = ms => {
    const s = Math.max(0, Math.ceil(ms / 1000));
    return [Math.floor(s / 3600), Math.floor(s % 3600 / 60), s % 60].map(n => String(n).padStart(2, "0")).join(":");
  };

  async function doClaim() {
    if (!canClaim()) { say(hasPending() ? "You can claim at the next 10 PM" : "Nothing to claim"); return; }
    let inc = claim.pendingIncome;
    const url = window.ZENVYRO_REFERRAL_CLAIM_ENDPOINT;
    if (url) { // in a real system the server decides amount and timing
      try {
        const res = await fetch(url, { method: "POST", headers: { Accept: "application/json" } });
        if (!res.ok) throw new Error("claim failed");
        const j = await res.json();
        inc = Math.max(0, +j.income || 0);
      } catch (e) { say("Claim failed, please try again later"); return; }
    }
    if (window.ZenvyroMining && inc > 0) window.ZenvyroMining.addZeny(inc);
    claim.pendingIncome = 0;
    claim.lastSlot = latestSlot(Date.now());
    saveClaim();
    say("+" + inc.toFixed(6) + " ZENY added to your Exchange balance");
    refreshModal();
  }

  function refreshModal() {
    const m = document.getElementById("modalBackdrop");
    if (m && m.classList.contains("open") && document.getElementById("refHistory"))
      document.getElementById("modalBody").innerHTML = body();
  }

  function tick() {
    const info = document.getElementById("refClaimInfo"), btn = document.getElementById("refClaimBtn");
    if (!info || !btn) return;
    const now = Date.now();
    const ok = canClaim();
    btn.disabled = !ok; btn.style.opacity = ok ? "1" : ".5";
    info.textContent = ok ? "Claim is open now" :
      (hasPending() ? "Next claim in: " : "Nothing pending · Next claim in: ") + hms(nextSlot(now) - now) + " (at 10 PM)";
  }

  let data = { referrals: 0, users: [], incomeEarned: 0, bonusEarned: 0, history: [], loaded: false, error: false };

  async function fetchData() {
    const url = window.ZENVYRO_REFERRAL_ENDPOINT;
    if (!url) { data.loaded = true; return; }
    try {
      const res = await fetch(url, { headers: { Accept: "application/json" }, cache: "no-store" });
      if (!res.ok) throw new Error("bad status");
      const j = await res.json();
      const list = Array.isArray(j.referrals) ? j.referrals : (Array.isArray(j.referredUsers) ? j.referredUsers : []);
      data = {
        referrals: Math.max(0, +j.referralCount || (typeof j.referrals === "number" ? j.referrals : 0) || list.length),
        users: list.slice(0, 200).map(u => ({
          name: String(u.name || "User"),
          pack: String(u.pack || "Free").replace(/\s*pack$/i, ""),
          joined: String(u.joined || "")
        })),
        incomeEarned: Math.max(0, +j.incomeEarned || 0),
        bonusEarned: Math.max(0, +j.bonusEarned || 0),
        pendingIncome: Math.max(0, +j.pendingIncome || 0),
        pendingBonus: Math.max(0, +j.pendingBonus || 0),
        history: Array.isArray(j.history) ? j.history.slice(0, 50) : [],
        loaded: true, error: false
      };
      claim.pendingIncome = data.pendingIncome; saveClaim();
    } catch (e) { data.loaded = true; data.error = true; }
  }

  function historyHtml() {
    if (data.error) return '<div><strong>Could not load data</strong><span>Please try again later</span></div>';
    if (!data.history.length) return '<div><strong>No referrals yet</strong><span>No commission yet</span></div>';
    return data.history.map(h => {
      const isBonus = h.type === "bonus";
      const amt = (+h.amount || 0).toFixed(isBonus ? 2 : 6) + (isBonus ? " USDT" : " ZENY");
      return `<div><strong>${isBonus ? "Purchase Bonus · Credited to Wallet" : "Income Commission"}<br><small style="color:#aeb9ff;font-weight:500">${esc(h.from || "User")} · ${esc(h.date || "")}</small></strong><span>+${amt}</span></div>`;
    }).join("");
  }

  const isPremium = u => !/^free$/i.test(u.pack);

  function userRows(list, emptyText) {
    if (data.error) return '<div><strong>Could not load data</strong><span>Please try again later</span></div>';
    if (!list.length) return `<div><strong>${emptyText}</strong><span>—</span></div>`;
    return list.map(u => `<div><strong>${esc(u.name)}${u.joined ? '<br><small style="color:#aeb9ff;font-weight:500">' + esc(u.joined) + "</small>" : ""}</strong><span>${esc(u.pack)}${isPremium(u) ? " ✦" : ""}</span></div>`).join("");
  }

  // Refer page
  function body() {
    const premium = data.users.filter(isPremium);
    return `
      <button class="btn alt" style="width:100%;margin-bottom:12px" onclick="closeModal();showSection('account')">‹ &nbsp; Back</button>
      <div class="modal-list">
        <div><strong>Total Referrals</strong><span>${data.referrals}</span></div>
        <div><strong>Premium Members</strong><span>${premium.length}</span></div>
        <div><strong>Income Commission</strong><span>${data.incomeEarned.toFixed(6)} ZENY</span></div>
        <div><strong>Purchase Bonus (to Wallet)</strong><span>${data.bonusEarned.toFixed(2)} USDT</span></div>
        <div><strong>Pending (to claim)</strong><span>${claim.pendingIncome.toFixed(6)} ZENY</span></div>
      </div>
      <button class="btn" id="refClaimBtn" style="width:100%;margin-top:12px" onclick="claimReferral()">🎁 &nbsp; Claim Referral Income</button>
      <div class="modal-note" id="refClaimInfo" style="margin-top:8px"></div>
      <label class="modal-label">Your referral code</label>
      <div class="ref-box" id="refCode">${esc(MY_CODE)}</div>
      <label class="modal-label">Your referral link</label>
      <div class="ref-box" id="refLink">${esc(myLink())}</div>
      <div class="modal-actions">
        <button class="btn" onclick="copyReferral('code')">Copy code</button>
        <button class="btn alt" onclick="copyReferral('link')">Copy link</button>
      </div>
      <button class="btn" style="width:100%;margin-top:10px" onclick="shareReferral()">Share</button>
      <label class="modal-label">Users you referred (${data.users.length})</label>
      <div class="modal-list" id="refUsers">${userRows(data.users, "No referrals yet")}</div>
      <label class="modal-label">Purchased a Premium Pack (${premium.length})</label>
      <div class="modal-list" id="refPremium">${userRows(premium, "No one has purchased Premium yet")}</div>
      <label class="modal-label">Commission history</label>
      <div class="modal-list" id="refHistory">${historyHtml()}</div>
      <div class="modal-note">Referral Income Commission can be claimed every night at 10 PM (Bangladesh time) and is added to your Exchange balance as ZENY; if you don't claim, it keeps accumulating. Purchase Bonus is credited straight to your Wallet once, on the referee's first pack purchase. Referral earnings are not guaranteed, and nothing is credited for real until a backend is connected.</div>`;
  }

  // Account page — Profile, Membership and Refer option
  function accountBody() {
    return `
      <div class="modal-list">
        <div><strong>Profile</strong><span>Sadiqur Rahman</span></div>
        <div><strong>Membership</strong><span>${esc(currentTier())} Pack</span></div>
      </div>
      <button class="btn" style="width:100%;margin-top:14px" onclick="openReferral()">👥 &nbsp; Refer &amp; Earn &nbsp; ›</button>`;
  }

  function openReferral() {
    window.openModal("Refer & Earn", body());
    tick();
    fetchData().then(() => { refreshModal(); tick(); });
  }

  async function copyText(text, okMsg) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text); say(okMsg); return;
      }
    } catch (e) {}
    say(text);
  }

  function init() {
    window.claimReferral = doClaim;
    window.openReferral = openReferral;
    setInterval(tick, 1000);
    window.copyReferral = kind =>
      kind === "link" ? copyText(myLink(), "Referral link copied")
                      : copyText(MY_CODE, "Referral code copied");

    window.shareReferral = async () => {
      const text = "Join me on Zenvyro: " + myLink();
      if (navigator.share) { try { await navigator.share({ title: "Zenvyro", text, url: myLink() }); } catch (e) {} }
      else copyText(myLink(), "Referral link copied");
    };

    const orig = window.showSection;
    window.showSection = function (name) {
      if (name === "account" && typeof window.openModal === "function") {
        window.openModal("Account", accountBody());
        return;
      }
      return orig.apply(this, arguments);
    };

    // for testing without a backend only: adds Pending (a real system does this on the server)
    window.ZenvyroReferral = {
      incomeCommission, purchaseBonus,
      count: () => data.referrals,
      refresh: () => fetchData(),
      addPendingForTest(zeny) {
        claim.pendingIncome += Math.max(0, +zeny || 0);
        saveClaim(); refreshModal(); tick();
      }
    };
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
