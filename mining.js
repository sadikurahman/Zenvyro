/* Zenvyro — Step 1: Mining session (4 hours) + Claim Reward
   JavaScript logic only. No changes to the HTML/CSS design.
   Data is kept in localStorage for now (demo/testing). It is editable in the browser,
   so real balances and payments must be verified on a backend. */
(() => {
  "use strict";

  const RATES = {            // ZENY / hour
    Free: 0.001587,
    Standard: 0.002222,
    Silver: 0.006945,
    Gold: 0.017361,
    Platinum: 0.050505
  };
  const SESSION_HOURS = 4;                      // claim interval (hours)
  const SESSION_MS = SESSION_HOURS * 60 * 60 * 1000;
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
    const base = { v: 3, tier: "Free", balance: 0, sessionEnd: null, pausedRemaining: null, totalMined: 0 };
    try {
      const s = JSON.parse(localStorage.getItem(STORE_KEY) || "null");
      if (!s) return base;
      const o = {
        v: 3,
        tier: normTier(window.ZENVYRO_TIER || s.tier),
        balance: Number.isFinite(+s.balance) && +s.balance >= 0 ? +s.balance : 0,
        sessionEnd: Number.isFinite(+s.sessionEnd) && +s.sessionEnd > 0 ? +s.sessionEnd : null,
        pausedRemaining: Number.isFinite(+s.pausedRemaining) && +s.pausedRemaining > 0 && +s.pausedRemaining <= SESSION_MS ? +s.pausedRemaining : null,
        totalMined: Number.isFinite(+s.totalMined) && +s.totalMined >= 0 ? +s.totalMined
          : (Number.isFinite(+s.balance) && +s.balance > 0 ? +s.balance : 0)
      };
      // Session saved before the 4-hour update (v1 = 1-hour, v2 = 2-hour): finish it cleanly so the 4-hour timer starts fresh.
      // A completed old session is credited once at its OLD length; an unfinished one is reset.
      if (s.v !== 3 && (o.sessionEnd || o.pausedRemaining)) {
        if (o.sessionEnd && o.sessionEnd <= Date.now()) {
          const r = RATES[o.tier] * (s.v === 2 ? 2 : 1);
          o.balance = Math.round((o.balance + r) * 1e8) / 1e8;
          o.totalMined = Math.round((o.totalMined + r) * 1e8) / 1e8;
        }
        o.sessionEnd = null; o.pausedRemaining = null;
      }
      return o;
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
    return Math.floor(s / 3600) + ":" + String(Math.floor(s % 3600 / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0"); // H:MM:SS, e.g. 4:00:00
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


  /* ---------- ZENY coin (orb): Start / timer / Pause inside the circle ----------
     Animation notes (CPU friendly): only transform + opacity are animated (these run on the GPU,
     no repaint/layout), via the Web Animations API. No box-shadow / filter / mask animation.
     The glow loop pauses when the tab is hidden or the coin is off-screen. */
  const ORB_CSS = `
  .orb{cursor:pointer;-webkit-tap-highlight-color:transparent;user-select:none;-webkit-user-select:none;outline:none}
  .orb-core{z-index:2;padding:0 6px}
  .orb-core .zv-cta{display:block;font-size:13px;font-weight:900;letter-spacing:1.4px;line-height:1.35;margin-top:7px;text-align:center}
  .orb-core .zv-time{display:block;font-size:30px;font-weight:900;letter-spacing:1px;font-variant-numeric:tabular-nums;line-height:1;text-shadow:0 0 18px #c98bff}
  .orb-core .zv-sub{display:block;font-size:10px;font-weight:800;letter-spacing:2.2px;margin-top:8px;color:#e4c9ff;text-transform:uppercase}
  @media(max-width:650px){.orb-core .zv-cta{font-size:11px;margin-top:5px}.orb-core .zv-time{font-size:24px}.orb-core .zv-sub{font-size:9px;margin-top:6px}}
  .zv-glow,.zv-ripple{position:absolute;border-radius:50%;pointer-events:none;opacity:0;will-change:transform,opacity}
  .zv-glow{inset:-12px;background:radial-gradient(circle,transparent 62%,rgba(164,60,255,.55) 76%,rgba(139,44,255,0) 100%)}
  .zv-glow.zv-gold{background:radial-gradient(circle,transparent 62%,rgba(255,212,102,.55) 76%,rgba(229,193,108,0) 100%)}
  .zv-ripple{inset:0;border:2px solid #e3aaff}`;

  let orbEl = null, coreEl = null, orbMode = "";
  let glowEl = null, rippleEl = null, glowAnim = null, glowOn = false, orbInView = true;
  const REDUCED = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const CAN_ANIMATE = typeof Element !== "undefined" && typeof Element.prototype.animate === "function";

  // Run the glow loop only while it can actually be seen
  function syncGlow() {
    if (!glowAnim) return;
    if (glowOn && !document.hidden && orbInView) glowAnim.play(); else glowAnim.pause();
  }

  function setGlow(on, gold) {
    if (!glowEl) return;
    glowEl.classList.toggle("zv-gold", !!gold);
    glowOn = on;
    if (glowAnim) { glowAnim.cancel(); glowAnim = null; }
    if (!on) { glowEl.style.opacity = "0"; return; }
    if (!CAN_ANIMATE || REDUCED) { glowEl.style.opacity = ".6"; return; }  // static glow, no motion
    glowEl.style.opacity = "";
    glowAnim = glowEl.animate(
      [{ transform: "scale(.97)", opacity: 0.3 }, { transform: "scale(1.07)", opacity: 0.85 }],
      { duration: 2400, direction: "alternate", iterations: Infinity, easing: "ease-in-out" }
    );
    syncGlow();
  }

  function setupOrb() {
    orbEl = document.querySelector("#miningPanel .orb");
    if (!orbEl) return;
    coreEl = orbEl.querySelector(".orb-core");
    const st = document.createElement("style");
    st.textContent = ORB_CSS;
    document.head.appendChild(st);
    glowEl = document.createElement("div");
    glowEl.className = "zv-glow";
    rippleEl = document.createElement("div");
    rippleEl.className = "zv-ripple";
    orbEl.appendChild(glowEl);
    orbEl.appendChild(rippleEl);
    orbEl.setAttribute("role", "button");
    orbEl.setAttribute("tabindex", "0");
    orbEl.addEventListener("click", orbTap);
    orbEl.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); orbTap(); }
    });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(es => { orbInView = es[es.length - 1].isIntersecting; syncGlow(); }).observe(orbEl);
    }
    document.addEventListener("visibilitychange", () => { syncGlow(); if (!document.hidden) render(); });
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
      setGlow(st === "running" || st === "ready", st === "ready");
      orbEl.setAttribute("aria-label",
        st === "idle" ? "Start mining" : st === "running" ? "Pause mining" :
        st === "paused" ? "Resume mining" : "Claim reward");
    }
    const t = coreEl.querySelector(".zv-time");
    if (t) t.textContent = mmss(remaining);
  }

  // Tap feedback: a quick press-and-release on the coin plus one ripple ring (transform/opacity only)
  function playStartAnimation() {
    if (!orbEl || !CAN_ANIMATE || REDUCED) return;
    orbEl.animate(
      [{ transform: "scale(1)" }, { transform: "scale(.94)", offset: 0.28 }, { transform: "scale(1.04)", offset: 0.62 }, { transform: "scale(1)" }],
      { duration: 520, easing: "ease-out" }
    );
    if (rippleEl) rippleEl.animate(
      [{ transform: "scale(.95)", opacity: 0.8 }, { transform: "scale(1.55)", opacity: 0 }],
      { duration: 850, easing: "ease-out" }
    );
  }

  function startSession() {
    if (window.ZenvyroSettings && window.ZenvyroSettings.block("mining")) return;
    state.sessionEnd = Date.now() + SESSION_MS;
    state.pausedRemaining = null;
    save(); render(); playStartAnimation();
    say(SESSION_HOURS + "-hour mining session started");
  }
  function pauseSession() {
    const left = state.sessionEnd - Date.now();
    if (left <= 0) { render(); return; }
    state.pausedRemaining = left;   // the time already mined is kept
    state.sessionEnd = null;
    save(); render(); playStartAnimation();
    say("Mining paused");
  }
  function resumeSession() {
    if (window.ZenvyroSettings && window.ZenvyroSettings.block("mining")) return;
    state.sessionEnd = Date.now() + state.pausedRemaining; // continues from the same point
    state.pausedRemaining = null;
    save(); render(); playStartAnimation();
    say("Mining resumed");
  }
  function claimReward() {
    if (window.ZenvyroSettings && window.ZenvyroSettings.block("mining")) return;
    const reward = RATES[state.tier] * SESSION_HOURS; // reward = hourly rate x session hours
    state.balance = Math.round((state.balance + reward) * 1e8) / 1e8;
    state.totalMined = Math.round(((state.totalMined || 0) + reward) * 1e8) / 1e8;
    state.sessionEnd = null;
    state.pausedRemaining = null;
    save(); render(); playStartAnimation();
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
    setInterval(() => { if (!document.hidden) render(); }, 500);  // skip work while the tab is hidden
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
