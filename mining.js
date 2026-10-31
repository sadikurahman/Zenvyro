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
    const base = { tier: "Free", balance: 0, sessionEnd: null, pausedRemaining: null, totalMined: 0 };
    try {
      const s = JSON.parse(localStorage.getItem(STORE_KEY) || "null");
      if (!s) return base;
      return {
        tier: normTier(window.ZENVYRO_TIER || s.tier),
        balance: Number.isFinite(+s.balance) && +s.balance >= 0 ? +s.balance : 0,
        sessionEnd: Number.isFinite(+s.sessionEnd) && +s.sessionEnd > 0 ? +s.sessionEnd : null,
        pausedRemaining: Number.isFinite(+s.pausedRemaining) && +s.pausedRemaining > 0 && +s.pausedRemaining <= SESSION_MS ? +s.pausedRemaining : null,
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
    if (state.pausedRemaining) return "paused";
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
    } else if (st === "paused") {
      remaining = state.pausedRemaining;
      pct = Math.min(100, (SESSION_MS - remaining) / SESSION_MS * 100);
      label = "▶ &nbsp; Resume Mining";
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
    renderOrb(st, remaining);

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


  /* ---------- ZENY coin (orb): Start / timer / Pause inside the circle ---------- */
  const ORB_CSS = `
  .orb{cursor:pointer;-webkit-tap-highlight-color:transparent;user-select:none;-webkit-user-select:none;outline:none}
  .orb-core{z-index:2;padding:0 6px}
  .orb-core .zv-cta{display:block;font-size:13px;font-weight:900;letter-spacing:1.4px;line-height:1.35;margin-top:7px;text-align:center}
  .orb-core .zv-time{display:block;font-size:30px;font-weight:900;letter-spacing:1px;font-variant-numeric:tabular-nums;line-height:1;text-shadow:0 0 18px #c98bff}
  .orb-core .zv-sub{display:block;font-size:10px;font-weight:800;letter-spacing:2.2px;margin-top:8px;color:#e4c9ff;text-transform:uppercase}
  @media(max-width:650px){.orb-core .zv-cta{font-size:11px;margin-top:5px}.orb-core .zv-time{font-size:24px}.orb-core .zv-sub{font-size:9px;margin-top:6px}}
  .zv-spin{position:absolute;inset:-6px;border-radius:50%;pointer-events:none;opacity:0;transition:opacity .5s;
    background:conic-gradient(from 0deg,transparent 0 55%,#8b3dff 72%,#e3aaff 90%,#fff 100%);
    -webkit-mask:radial-gradient(farthest-side,transparent calc(100% - 4px),#000 calc(100% - 3px));
            mask:radial-gradient(farthest-side,transparent calc(100% - 4px),#000 calc(100% - 3px));
    filter:drop-shadow(0 0 7px #b46dff)}
  .zv-burst{position:absolute;inset:0;border-radius:50%;pointer-events:none;border:2px solid #e3aaff;opacity:0;animation:zvBurst 1.3s cubic-bezier(.15,.7,.3,1) forwards}
  .zv-burst.b2{animation-delay:.22s;border-color:#9a42ff}
  .orb.zv-run .zv-spin{opacity:1;animation:zvSpin 2.8s linear infinite}
  .orb.zv-run{animation:zvBreath 2.6s ease-in-out infinite}
  .orb.zv-run:before{animation:zvRing 2.6s ease-in-out infinite}
  .orb.zv-run:after{animation:zvRing 2.6s ease-in-out .9s infinite}
  .orb.zv-run .orb-core{animation:zvCore 2.6s ease-in-out infinite}
  .orb.zv-run .spark{animation:zvTwinkle 1.8s ease-in-out infinite}
  .orb.zv-pop{animation:zvPop .75s cubic-bezier(.2,.9,.3,1.3)}
  .orb.zv-ready{animation:zvReady 1.6s ease-in-out infinite}
  @keyframes zvSpin{to{transform:rotate(360deg)}}
  @keyframes zvBreath{0%,100%{box-shadow:inset 0 0 0 3px #d5a0ff,0 0 0 12px #5b31ff12,0 0 0 21px #6739ff12,0 0 45px #8b2cff70}50%{box-shadow:inset 0 0 0 3px #f0c8ff,0 0 0 14px #5b31ff1f,0 0 0 24px #6739ff1a,0 0 78px #a43cffb0}}
  @keyframes zvRing{0%,100%{transform:scale(1);opacity:.7}50%{transform:scale(1.045);opacity:.25}}
  @keyframes zvCore{0%,100%{background:#6d24e82b}50%{background:#8a3cff55}}
  @keyframes zvTwinkle{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.55;transform:scale(.88)}}
  @keyframes zvBurst{0%{transform:scale(.9);opacity:.95}100%{transform:scale(1.75);opacity:0}}
  @keyframes zvPop{0%{transform:scale(1)}30%{transform:scale(.93)}65%{transform:scale(1.07)}100%{transform:scale(1)}}
  @keyframes zvReady{0%,100%{box-shadow:inset 0 0 0 3px #ffe08a,0 0 0 12px #e5c16c14,0 0 0 21px #e5c16c10,0 0 40px #e5c16c80}50%{box-shadow:inset 0 0 0 3px #fff0b8,0 0 0 15px #e5c16c22,0 0 0 26px #e5c16c18,0 0 70px #ffd466b0}}
  @media (prefers-reduced-motion:reduce){.orb.zv-run,.orb.zv-run:before,.orb.zv-run:after,.orb.zv-run .orb-core,.orb.zv-run .spark,.orb.zv-ready{animation:none}.orb.zv-run .zv-spin{animation-duration:9s}}`;

  let orbEl = null, coreEl = null, orbMode = "";

  function setupOrb() {
    orbEl = document.querySelector("#miningPanel .orb");
    if (!orbEl) return;
    coreEl = orbEl.querySelector(".orb-core");
    const st = document.createElement("style");
    st.textContent = ORB_CSS;
    document.head.appendChild(st);
    const spin = document.createElement("div");
    spin.className = "zv-spin";
    orbEl.appendChild(spin);
    orbEl.setAttribute("role", "button");
    orbEl.setAttribute("tabindex", "0");
    orbEl.addEventListener("click", orbTap);
    orbEl.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); orbTap(); }
    });
  }

  function renderOrb(st, remaining) {
    if (!orbEl || !coreEl) return;
    if (orbMode !== st) {
      orbMode = st;
      const spark = '<div class="spark">✧</div>';
      let html;
      if (st === "idle") html = spark + '<span class="zv-cta">START<br>MINING</span>';
      else if (st === "ready") html = spark + '<span class="zv-cta">CLAIM<br>REWARD</span>';
      else html = '<span class="zv-time"></span><span class="zv-sub">' + (st === "paused" ? "Paused · Tap" : "Mining") + '</span>';
      coreEl.innerHTML = html;
      orbEl.classList.toggle("zv-run", st === "running");
      orbEl.classList.toggle("zv-ready", st === "ready");
      orbEl.setAttribute("aria-label",
        st === "idle" ? "Start mining" : st === "running" ? "Pause mining" :
        st === "paused" ? "Resume mining" : "Claim reward");
    }
    const t = coreEl.querySelector(".zv-time");
    if (t) t.textContent = mmss(remaining);
  }

  function playStartAnimation() {
    if (!orbEl) return;
    orbEl.classList.remove("zv-pop");
    void orbEl.offsetWidth;
    orbEl.classList.add("zv-pop");
    ["", "b2"].forEach(c => {
      const b = document.createElement("span");
      b.className = "zv-burst " + c;
      orbEl.appendChild(b);
      setTimeout(() => b.remove(), 1700);
    });
    setTimeout(() => orbEl && orbEl.classList.remove("zv-pop"), 800);
  }

  function startSession() {
    state.sessionEnd = Date.now() + SESSION_MS;
    state.pausedRemaining = null;
    save(); render(); playStartAnimation();
    say("1-hour mining session started");
  }
  function pauseSession() {
    const left = state.sessionEnd - Date.now();
    if (left <= 0) { render(); return; }
    state.pausedRemaining = left;   // the time already mined is kept
    state.sessionEnd = null;
    save(); render();
    say("Mining paused");
  }
  function resumeSession() {
    state.sessionEnd = Date.now() + state.pausedRemaining; // continues from the same point
    state.pausedRemaining = null;
    save(); render(); playStartAnimation();
    say("Mining resumed");
  }
  function claimReward() {
    const reward = RATES[state.tier];
    state.balance = Math.round((state.balance + reward) * 1e8) / 1e8;
    state.totalMined = Math.round(((state.totalMined || 0) + reward) * 1e8) / 1e8;
    state.sessionEnd = null;
    state.pausedRemaining = null;
    save(); render();
    say("+" + reward.toFixed(6) + " ZENY added");
  }

  // Tap on the coin: start -> pause -> resume (from the same time) -> claim
  function orbTap() {
    const st = status();
    if (st === "idle") startSession();
    else if (st === "running") pauseSession();
    else if (st === "paused") resumeSession();
    else claimReward();
  }

  function handleButton() {            // bottom Start / Resume / Claim button
    const st = status();
    if (st === "idle") startSession();
    else if (st === "paused") resumeSession();
    else if (st === "running") say("Session in progress — tap the coin to pause");
    else claimReward();
  }

  function init() {
    window.toggleMining = handleButton; // Start/Claim button

    // "Pause" button: pause a running session / resume a paused one (same as tapping the coin)
    const pause = document.querySelector(".mining-buttons .btn.alt");
    if (pause) pause.onclick = () => {
      const st = status();
      if (st === "running") pauseSession();
      else if (st === "paused") resumeSession();
      else say(st === "ready" ? "Session finished — claim your reward" : "Start mining first");
    };
    setupOrb();

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
