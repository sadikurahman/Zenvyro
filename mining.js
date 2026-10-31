/* Zenvyro — Step 1: Mining session (1 hour) + Claim Reward
   JavaScript logic only. No changes to the HTML/CSS design.
   Data is kept in localStorage for now (demo/testing). It is editable in the browser,
   so real balances and payments must be verified on a backend. */
(() => {
  "use strict";

  const RATES = {            // ZENY / hour
    Free: 0.001984,
    Standard: 0.002778,
    Silver: 0.008681,
    Gold: 0.021701,
    Platinum: 0.063131
  };
  const SESSION_MS = 60 * 60 * 1000;
  const STORE_KEY = "zenvyro_mining_v1";
  const ZENY_TO_USDT = 3; // reference only

  const $ = id => document.getElementById(id);

  function normTier(t) {
    t = String(t || "Free").replace(/\s*pack$/i, "").trim();
    if (/^starter$/i.test(t)) t = "Standard";
    t = t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
    return RATES[t] ? t : "Free";
  }

  function load() {
    const base = { tier: "Free", balance: 0, sessionEnd: null, totalMined: 0 };
    try {
      const s = JSON.parse(localStorage.getItem(STORE_KEY) || "null");
      if (!s) return base;
      return {
        tier: normTier(window.ZENVYRO_TIER || s.tier),
        balance: Number.isFinite(+s.balance) && +s.balance >= 0 ? +s.balance : 0,
        sessionEnd: Number.isFinite(+s.sessionEnd) && +s.sessionEnd > 0 ? +s.sessionEnd : null,
        totalMined: Number.isFinite(+s.totalMined) && +s.totalMined >= 0 ? +s.totalMined
          : (Number.isFinite(+s.balance) && +s.balance > 0 ? +s.balance : 0)
      };
    } catch (e) { return base; }
  }

  const state = load();
  if (window.ZENVYRO_TIER) state.tier = normTier(window.ZENVYRO_TIER);

  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) {}
  }

  const say = msg => { if (typeof window.toast === "function") window.toast(msg); };
  const mmss = ms => {
    const s = Math.max(0, Math.ceil(ms / 1000));
    return String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");
  };

  function status() {
    if (!state.sessionEnd) return "idle";
    return Date.now() >= state.sessionEnd ? "ready" : "running";
  }

  function render() {
    const st = status();
    const rate = RATES[state.tier];
    const btn = $("startBtn");
    const timeEl = $("time");
    let remaining = SESSION_MS, pct = 0, label;

    if (st === "running") {
      remaining = state.sessionEnd - Date.now();
      pct = Math.min(100, (SESSION_MS - remaining) / SESSION_MS * 100);
      label = "⏳ &nbsp; Mining...";
    } else if (st === "ready") {
      remaining = 0; pct = 100;
      label = "🎁 &nbsp; Claim Reward";
    } else {
      label = "▶ &nbsp; Start Mining";
    }

    if (btn && btn.innerHTML !== label) btn.innerHTML = label;
    if (timeEl) timeEl.textContent = mmss(remaining);
    if ($("progressText")) $("progressText").textContent = Math.floor(pct) + "%";
    if ($("progressBar")) $("progressBar").style.width = pct + "%";
    if ($("reward")) $("reward").textContent = (rate * 24).toFixed(4); // daily rate (per plan)

    const bal = state.balance;
    if ($("coinBalance")) {
      $("coinBalance").textContent = bal.toFixed(6);
      const cap = $("coinBalance").parentElement.querySelector("small");
      if (cap) cap.textContent = "≈ " + (bal * ZENY_TO_USDT).toFixed(2) + " USDT · reference only";
    }
    // Home: big balance in ZENY, small dollar equivalent beside it
    const hb = document.querySelector(".balance .balance-num");
    if (hb) {
      const h = bal.toFixed(6) + " <span>ZENY</span> <small style=\"font-size:15px;color:#b8c1ff;font-weight:500;letter-spacing:0\">≈ $" + (bal * ZENY_TO_USDT).toFixed(2) + "</small>";
      if (hb.dataset.zv !== h) { hb.dataset.zv = h; hb.innerHTML = h; }
    }
    const hg = document.querySelector(".balance .gain");
    if (hg) {
      const g = "↗ " + (state.totalMined || 0).toFixed(6) + " ZENY <small>(Total mined)</small>";
      if (hg.dataset.zv !== g) { hg.dataset.zv = g; hg.innerHTML = g; }
    }
    if ($("cdCurrentBalance")) $("cdCurrentBalance").textContent = bal.toFixed(6);
    if ($("walletZeny")) $("walletZeny").textContent = bal.toFixed(6) + " ZENY";
  }

  function handleButton() {
    const st = status();
    if (st === "idle") {
      state.sessionEnd = Date.now() + SESSION_MS;
      save(); render();
      say("1-hour mining session started");
    } else if (st === "running") {
      say("Session in progress — you can claim after 1 hour");
    } else {
      const reward = RATES[state.tier];
      state.balance = Math.round((state.balance + reward) * 1e8) / 1e8;
      state.totalMined = Math.round(((state.totalMined || 0) + reward) * 1e8) / 1e8;
      state.sessionEnd = null;
      save(); render();
      say("+" + reward.toFixed(6) + " ZENY added");
    }
  }

  function init() {
    window.toggleMining = handleButton; // Start/Claim button

    // The "Pause" button used to call toggleMining; a 1-hour session has no pause
    const pause = document.querySelector(".mining-buttons .btn.alt");
    if (pause) pause.onclick = () => say("A 1-hour session can't be paused");

    // Update the ZENY balance when the Wallet modal opens
    const origShow = window.showSection;
    if (typeof origShow === "function") {
      window.showSection = function (name) {
        const r = origShow.apply(this, arguments);
        render();
        return r;
      };
    }

    // Once payments/backend are connected, the tier is set from here
    window.ZenvyroMining = {
      setTier(t) { state.tier = normTier(t); save(); render(); },
      addZeny(n) { n = +n; if (n > 0) { state.balance = Math.round((state.balance + n) * 1e8) / 1e8; save(); render(); } },
      spendZeny(n) { n = +n; if (!(n > 0) || n > state.balance + 1e-12) return false; state.balance = Math.max(0, Math.round((state.balance - n) * 1e8) / 1e8); save(); render(); return true; },
      getState() { return { ...state, status: status() }; }
    };

    render();
    setInterval(render, 500);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
