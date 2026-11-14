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


  /* ---------- ZENY core animation: fills the whole orb area (canvas, GPU-friendly, pauses off-screen) ----------
     Circuit board + core sprite are drawn once; per frame only a few cheap draws run.
     Idle / running / paused / ready run at ~30 fps; the start burst runs at full rate for ~3 s. */
  const ORB_CSS = `
  .orb-area{position:relative;overflow:hidden;border-radius:18px;border:1px solid #2a2468;background:radial-gradient(ellipse at 50% 50%,#2b1275 0,#120a3a 48%,#0a0720 100%)}
  .zv-cv{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:0}
  #zvBg{opacity:.55;transition:opacity 1s}
  .zv-fl{position:absolute;inset:0;pointer-events:none;z-index:3;opacity:0;background:radial-gradient(circle,rgba(255,236,210,.95),rgba(186,83,255,.55) 28%,rgba(69,56,255,0) 62%)}
  .orb{z-index:1;background:none!important;box-shadow:none!important;cursor:pointer;-webkit-tap-highlight-color:transparent;user-select:none;-webkit-user-select:none;outline:none}
  .orb:before,.orb:after{display:none!important}
  .orb-core{z-index:2;padding:0 6px;background:none!important;border:0!important;width:auto!important;height:auto!important}
  .orb-core .zv-cta{display:block;font-size:clamp(10px,calc(var(--zr,70px)*.17),15px);font-weight:900;letter-spacing:1.4px;line-height:1.35;margin-top:5px;text-align:center}
  .orb-core .zv-time{display:block;font-size:clamp(15px,calc(var(--zr,70px)*.28),30px);font-weight:900;letter-spacing:1px;font-variant-numeric:tabular-nums;line-height:1;text-shadow:0 0 18px #c98bff}
  .orb-core .zv-sub{display:block;font-size:clamp(8px,calc(var(--zr,70px)*.125),10px);font-weight:800;letter-spacing:2.2px;margin-top:6px;color:#e4c9ff;text-transform:uppercase}`;

  const TAU = Math.PI * 2, REDUCED = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const CAN_ANIMATE = typeof Element !== "undefined" && typeof Element.prototype.animate === "function";
  const COL = { or: "255,138,43", or2: "255,193,90", bl: "58,160,255", vi: "192,123,255", gold: "255,212,102" };
  const STREAK = ["255,138,43", "58,160,255", "192,123,255"];
  const DIRS = [[1,0],[.7071,.7071],[0,1],[-.7071,.7071],[-1,0],[-.7071,-.7071],[0,-1],[.7071,-.7071]];
  let orbEl = null, coreEl = null, orbMode = "", areaEl = null, cvB = null, cvF = null, bctx = null, ctx = null, flEl = null;
  let fw = 0, fh = 0, fcx = 0, fcy = 0, fR = 0, fMax = 0, fd = 1, fN = 60, prog = 0, energy = 0, pulseK = 0, lastT = 0, burstA = 0, burstB = 0, rafId = 0, inView = true;
  let shocks = [], traces = [], parts = [], pls = [], lights = [], sprCore, sprGlow, sprHeat, dotO, dotB, rot = [0, 0, 0], px = 0, py = 0;

  const mk = (w, h) => { const c = document.createElement("canvas"); c.width = Math.ceil(w); c.height = Math.ceil(h); return c; };
  function rng(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function dotSpr(rgb) { const c = mk(32, 32), g = c.getContext("2d"), r = g.createRadialGradient(16, 16, 0, 16, 16, 16); r.addColorStop(0, "rgba(255,255,255,1)"); r.addColorStop(.25, "rgba(" + rgb + ",.9)"); r.addColorStop(1, "rgba(" + rgb + ",0)"); g.fillStyle = r; g.fillRect(0, 0, 32, 32); return c; }

  function fxTraces() {
    const r = rng(7), n = Math.round(Math.max(18, Math.min(44, fw * fh / 2600)));
    traces = [];
    for (let i = 0; i < n; i++) {
      const a = r() * TAU, s = fR * (1.55 + r() * 1.1);
      let x = fcx + Math.cos(a) * s, y = fcy + Math.sin(a) * s, d = Math.round(a / (TAU / 8)) % 8;
      const pts = [[x, y]];
      for (let k = 0; k < 14; k++) {
        const L = 16 + r() * 60; x += DIRS[d][0] * L; y += DIRS[d][1] * L; pts.push([x, y]);
        if (x < -20 || y < -20 || x > fw + 20 || y > fh + 20) break;
        if (r() < .6) {
          const turn = r() < .5 ? 1 : -1; let nd = (d + turn + 8) % 8;
          if (DIRS[nd][0] * (x - fcx) + DIRS[nd][1] * (y - fcy) < 0) nd = (d - turn + 8) % 8;
          d = nd;
        }
      }
      const q = r(), cum = [0];
      for (let j = 1; j < pts.length; j++) cum.push(cum[j - 1] + Math.hypot(pts[j][0] - pts[j - 1][0], pts[j][1] - pts[j - 1][1]));
      traces.push({ pts, cum, len: cum[cum.length - 1], col: q < .22 ? "or" : q < .6 ? "bl" : "vi", w: q < .22 ? 1.6 : 1 });
    }
  }
  function fxBg() {
    const c = bctx; c.setTransform(fd, 0, 0, fd, 0, 0); c.clearRect(0, 0, fw, fh); c.lineJoin = "round";
    for (const t of traces) {
      c.beginPath(); t.pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]));
      if (t.col === "or") { c.strokeStyle = "rgba(" + COL.or + ",.14)"; c.lineWidth = 5; c.stroke(); c.strokeStyle = "rgba(" + COL.or2 + ",.85)"; }
      else c.strokeStyle = "rgba(" + COL[t.col] + ",.42)";
      c.lineWidth = t.w; c.stroke();
      c.fillStyle = c.strokeStyle; c.beginPath(); c.arc(t.pts[0][0], t.pts[0][1], 1.8, 0, TAU); c.fill();
    }
    c.strokeStyle = "rgba(200,170,255,.35)"; c.lineWidth = 1; c.beginPath();
    for (let i = 0; i < 72; i++) { const a = i / 72 * TAU, u = Math.cos(a), v = Math.sin(a), e = fR * (1.46 + (i % 3) * .03); c.moveTo(fcx + u * fR * 1.4, fcy + v * fR * 1.4); c.lineTo(fcx + u * e, fcy + v * e); }
    c.stroke();
  }
  function fxSprites() {
    const R = fR, S = R * 2 + 12, k = fd;
    sprCore = mk(S * k, S * k); let c = sprCore.getContext("2d"); c.scale(k, k); c.translate(S / 2, S / 2);
    let g = c.createRadialGradient(-R * .36, -R * .54, 0, 0, 0, R);
    [[0, "#e3aaff"], [.16, "#a947ff"], [.48, "#6123e4"], [.72, "#210b70"], [1, "#090625"]].forEach(a => g.addColorStop(a[0], a[1]));
    c.fillStyle = g; c.beginPath(); c.arc(0, 0, R, 0, TAU); c.fill();
    c.strokeStyle = "#d5a0ff"; c.lineWidth = 3; c.beginPath(); c.arc(0, 0, R - 1.5, 0, TAU); c.stroke();
    c.fillStyle = "rgba(9,6,37,.66)"; c.strokeStyle = "rgba(255,255,255,.3)"; c.lineWidth = 1; c.beginPath(); c.arc(0, 0, R * .76, 0, TAU); c.fill(); c.stroke();
    c.strokeStyle = "rgba(255,150,70,.45)"; c.beginPath();
    for (let i = 0; i < 8; i++) { const a = i * TAU / 8 + TAU / 16, u = Math.cos(a), v = Math.sin(a); c.moveTo(u * R * .76, v * R * .76); c.lineTo(u * R * .66, v * R * .66); }
    c.stroke();
    for (let i = 0; i < 8; i++) { const a = i * TAU / 8 + TAU / 16, q = R * .05; c.save(); c.translate(Math.cos(a) * R * .66, Math.sin(a) * R * .66); c.fillStyle = "#ff9a3c"; c.fillRect(-q, -q, q * 2, q * 2); c.strokeStyle = "rgba(255,190,110,.8)"; c.beginPath(); c.moveTo(-q * 1.7, 0); c.lineTo(-q, 0); c.moveTo(q, 0); c.lineTo(q * 1.7, 0); c.stroke(); c.restore(); }
    sprGlow = mk(S * 2 * k, S * 2 * k); c = sprGlow.getContext("2d");
    g = c.createRadialGradient(S * k, S * k, R * .7 * k, S * k, S * k, S * k);
    g.addColorStop(0, "rgba(186,83,255,.75)"); g.addColorStop(.45, "rgba(120,60,255,.25)"); g.addColorStop(1, "rgba(69,56,255,0)");
    c.fillStyle = g; c.fillRect(0, 0, S * 2 * k, S * 2 * k);
    sprHeat = mk(S * k, S * k); c = sprHeat.getContext("2d");
    g = c.createRadialGradient(S * k / 2, S * k / 2, 0, S * k / 2, S * k / 2, R * k);
    g.addColorStop(0, "rgba(255,190,110,.55)"); g.addColorStop(.7, "rgba(186,83,255,.4)"); g.addColorStop(1, "rgba(186,83,255,0)");
    c.fillStyle = g; c.fillRect(0, 0, S * k, S * k);
    dotO = dotSpr(COL.or); dotB = dotSpr(COL.bl);
    const r = rng(3), cols = ["255,170,80", "90,170,255", "255,255,255"];
    lights = Array.from({ length: 28 }, () => { const a = r() * TAU, d = R * (.58 + r() * .14); return { x: Math.cos(a) * d, y: Math.sin(a) * d, c: cols[r() * 3 | 0], ph: r() * TAU, sp: 2 + r() * 4 }; });
  }
  function layoutFx() {
    const w = areaEl.clientWidth, h = areaEl.clientHeight; if (w < 40 || h < 40) return;
    fw = w; fh = h; fd = Math.min(devicePixelRatio || 1, 2);
    fR = Math.max(40, (Math.min(w, h) / 2 - 6) / 1.4); fcx = w / 2; fcy = h / 2; fMax = Math.hypot(w, h) / 2 + 10;
    fN = Math.max(45, Math.min(120, Math.round(w * h / 1400)));
    [cvB, cvF].forEach(c => { c.width = w * fd; c.height = h * fd; });
    orbEl.style.width = orbEl.style.height = fR * 2 + "px"; areaEl.style.setProperty("--zr", fR + "px");
    fxTraces(); fxBg(); fxSprites();
    parts = Array.from({ length: fN }, () => ({ u: -1 }));
    pls = Array.from({ length: 24 }, () => { const t = Math.random() * traces.length | 0; return { t, s: Math.random() * traces[t].len, v: 60 + Math.random() * 50 }; });
    wake();
  }
  function spawn(p, burst) {
    p.a = Math.random() * TAU; p.c = Math.cos(p.a); p.s = Math.sin(p.a);
    p.r0 = fMax * (.3 + .7 * Math.random()); p.dur = .9 + Math.random() * 1.1; p.u = burst ? Math.random() * .45 : 0;
    p.k = Math.random() < .45 ? 0 : Math.random() < .6 ? 1 : 2; p.w = Math.random() < .3 ? 1 : 0;
  }
  function at(t, s) {
    const c = t.cum; s = Math.max(0, Math.min(t.len, s)); let i = 1;
    while (i < c.length - 1 && s > c[i]) i++;
    const f = Math.max(0, Math.min(1, (s - c[i - 1]) / (c[i] - c[i - 1] || 1))), a = t.pts[i - 1], b = t.pts[i];
    px = a[0] + (b[0] - a[0]) * f; py = a[1] + (b[1] - a[1]) * f;
  }
  function ring(r, w, rgb, dash, ang, a) {
    ctx.save(); ctx.translate(fcx, fcy); ctx.rotate(ang); ctx.setLineDash(dash);
    ctx.lineWidth = w * 3; ctx.strokeStyle = "rgba(" + rgb + "," + a * .18 + ")"; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.stroke();
    ctx.lineWidth = w; ctx.strokeStyle = "rgba(" + rgb + "," + a + ")"; ctx.stroke(); ctx.restore();
  }
  function flash(peak) { if (flEl && CAN_ANIMATE && !REDUCED) flEl.animate([{ opacity: 0 }, { opacity: peak, offset: .15 }, { opacity: 0 }], { duration: 700, easing: "ease-out" }); }
  function burst(now) {
    burstA = now; burstB = now + 3200; shocks.push(now, now + 130, now + 260); flash(.9);
    parts.forEach((p, i) => { if (i < fN * .7) spawn(p, true); });
  }
  function wake() { if (!rafId && inView && cvF && fw) rafId = requestAnimationFrame(loop); }

  function loop(ts) {
    rafId = requestAnimationFrame(loop);
    const now = performance.now(), bursting = now < burstB;
    if (ts - lastT < (bursting || shocks.length ? 0 : 32)) return;
    const dt = Math.min(.05, (ts - lastT) / 1000 || .016); lastT = ts;
    const T = now / 1000, st = orbMode, ready = st === "ready";
    const tgtE = st === "idle" ? .08 : st === "running" ? .3 + .6 * prog : st === "paused" ? .2 + .4 * prog : 1;
    energy += (tgtE - energy) * (1 - Math.exp(-dt * 3)); pulseK *= Math.exp(-dt * 5);
    const sp = REDUCED ? 0 : (st === "paused" ? .12 : st === "idle" ? .6 : 1.1) + (bursting ? 2.4 : 0);
    rot[0] += dt * .8 * sp; rot[1] -= dt * 1.1 * sp; rot[2] += dt * .35 * sp;

    ctx.setTransform(fd, 0, 0, fd, 0, 0); ctx.clearRect(0, 0, fw, fh);
    ctx.globalCompositeOperation = "lighter"; ctx.lineCap = "round";

    shocks = shocks.filter(s => now - s < 1200);
    for (const s of shocks) {
      const p = (now - s) / 1200; if (p < 0) continue;
      const r = fR * 1.1 + (fMax - fR * 1.1) * (1 - Math.pow(1 - p, 3));
      ctx.lineWidth = 2 + 8 * (1 - p); ctx.strokeStyle = "rgba(235,190,255," + .85 * (1 - p) + ")"; ctx.beginPath(); ctx.arc(fcx, fcy, r, 0, TAU); ctx.stroke();
      ctx.lineWidth = 1.5; ctx.strokeStyle = "rgba(255,150,60," + .8 * (1 - p) + ")"; ctx.beginPath(); ctx.arc(fcx, fcy, r * .96, 0, TAU); ctx.stroke();
    }

    if (!REDUCED) {
      const tgt = bursting ? fN * (.3 + .7 * Math.min(1, (now - burstA) / 1200)) : (st === "running" ? 10 : 0), rE = fR * .9;
      let alive = 0, made = 0; const P = Array.from({ length: 6 }, () => new Path2D());
      for (const p of parts) {
        if (p.u >= 0) { p.u += dt / p.dur; if (p.u >= 1) { pulseK = Math.min(1, pulseK + .05); p.u = -1; } }
        if (p.u < 0 && alive + made < tgt && made < 12) { spawn(p, false); made++; }
        if (p.u < 0) continue;
        alive++;
        const u = p.u, u2 = Math.max(0, u - .08), r1 = rE + (p.r0 - rE) * (1 - u * u), r2 = rE + (p.r0 - rE) * (1 - u2 * u2), b = P[p.k * 2 + p.w];
        b.moveTo(fcx + p.c * r1, fcy + p.s * r1); b.lineTo(fcx + p.c * r2, fcy + p.s * r2);
      }
      for (let i = 0; i < 6; i++) { ctx.lineWidth = i % 2 ? 2.2 : 1.2; ctx.strokeStyle = "rgba(" + STREAK[i >> 1] + ",.85)"; ctx.stroke(P[i]); }

      const n = bursting ? 24 : st === "running" ? 12 : st === "paused" ? 3 : ready ? 8 : 6, mul = bursting ? 3 : st === "paused" ? .3 : 1;
      for (let i = 0; i < n; i++) {
        const p = pls[i], t = traces[p.t]; p.s -= p.v * mul * dt;
        if (p.s <= 0) { p.t = Math.random() * traces.length | 0; p.s = traces[p.t].len; continue; }
        const spr = t.col === "or" ? dotO : dotB;
        for (let j = 0; j < 3; j++) { at(t, p.s + j * 10); const z = 13 - j * 3.5; ctx.globalAlpha = 1 - j * .3; ctx.drawImage(spr, px - z / 2, py - z / 2, z, z); }
      }
      ctx.globalAlpha = 1;
    }

    const S = fR * 2 + 12, br = 1 + .025 * Math.sin(T * 1.8);
    ctx.globalAlpha = Math.min(1, .3 + .5 * energy + .2 * pulseK); ctx.drawImage(sprGlow, fcx - S * br, fcy - S * br, S * 2 * br, S * 2 * br); ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over"; ctx.drawImage(sprCore, fcx - S / 2, fcy - S / 2, S, S);
    ctx.globalCompositeOperation = "lighter";
    const lit = .25 + .75 * energy;
    for (const l of lights) { ctx.fillStyle = "rgba(" + l.c + "," + (.5 + .5 * Math.sin(T * l.sp + l.ph)) * lit + ")"; ctx.fillRect(fcx + l.x, fcy + l.y, fR * .04, fR * .04); }
    ctx.globalAlpha = Math.min(1, .06 + .5 * energy + .3 * pulseK); ctx.drawImage(sprHeat, fcx - S / 2, fcy - S / 2, S, S); ctx.globalAlpha = 1;

    const main = ready ? COL.gold : COL.or2;
    ring(fR * 1.08, 2, main, [24, 11, 5, 11], rot[0], .9);
    ring(fR * 1.17, 1.4, COL.vi, [3, 8], rot[1], .8);
    ring(fR * 1.26, 1, COL.bl, [55, 18], rot[2], .7);
    ctx.setLineDash([]); ctx.lineWidth = 4; ctx.strokeStyle = "rgba(200,170,255,.15)"; ctx.beginPath(); ctx.arc(fcx, fcy, fR * 1.34, 0, TAU); ctx.stroke();
    if (st !== "idle" && prog > 0) {
      const end = -Math.PI / 2 + TAU * Math.min(1, prog), rgb = ready ? COL.gold : "255,150,60";
      ctx.lineWidth = 10; ctx.strokeStyle = "rgba(" + (ready ? COL.gold : "186,83,255") + ",.22)"; ctx.beginPath(); ctx.arc(fcx, fcy, fR * 1.34, -Math.PI / 2, end); ctx.stroke();
      ctx.lineWidth = 4; ctx.strokeStyle = "rgba(" + rgb + ",.95)"; ctx.stroke();
      ctx.drawImage(dotO, fcx + Math.cos(end) * fR * 1.34 - 11, fcy + Math.sin(end) * fR * 1.34 - 11, 22, 22);
    }
    ctx.globalCompositeOperation = "source-over";
  }

  function setupOrb() {
    orbEl = document.querySelector("#miningPanel .orb");
    if (!orbEl) return;
    areaEl = orbEl.closest(".orb-area") || orbEl.parentElement;
    coreEl = orbEl.querySelector(".orb-core");
    const st = document.createElement("style"); st.textContent = ORB_CSS; document.head.appendChild(st);
    cvB = document.createElement("canvas"); cvB.id = "zvBg"; cvB.className = "zv-cv";
    cvF = document.createElement("canvas"); cvF.id = "zvFx"; cvF.className = "zv-cv";
    flEl = document.createElement("div"); flEl.className = "zv-fl";
    areaEl.insertBefore(cvB, areaEl.firstChild); areaEl.insertBefore(cvF, orbEl); areaEl.appendChild(flEl);
    bctx = cvB.getContext("2d"); ctx = cvF.getContext("2d");
    orbEl.setAttribute("role", "button"); orbEl.setAttribute("tabindex", "0");
    orbEl.addEventListener("click", orbTap);
    orbEl.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); orbTap(); } });
    if ("ResizeObserver" in window) new ResizeObserver(layoutFx).observe(areaEl); else window.addEventListener("resize", layoutFx);
    if ("IntersectionObserver" in window) new IntersectionObserver(es => {
      inView = es[es.length - 1].isIntersecting;
      if (inView) wake(); else if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
    }).observe(areaEl);
    layoutFx();
  }

  function renderOrb(st, remaining) {
    if (!orbEl || !coreEl) return;
    prog = st === "idle" ? 0 : st === "ready" ? 1 : Math.max(0, Math.min(1, 1 - remaining / SESSION_MS));
    if (orbMode !== st) {
      orbMode = st;
      const spark = '<div class="spark">✧</div>';
      let html;
      if (st === "idle") html = spark + '<span class="zv-cta">START<br>MINING</span>';
      else if (st === "ready") html = spark + '<span class="zv-cta">CLAIM<br>REWARD</span>';
      else html = '<span class="zv-time"></span><span class="zv-sub">' + (st === "paused" ? "Paused · Tap" : "Mining") + '</span>';
      coreEl.innerHTML = html;
      if (cvB) cvB.style.opacity = (st === "running" || st === "ready") ? "1" : ".55";
      orbEl.setAttribute("aria-label", st === "idle" ? "Start mining" : st === "running" ? "Pause mining" : st === "paused" ? "Resume mining" : "Claim reward");
      wake();
    }
    const t = coreEl.querySelector(".zv-time");
    if (t) t.textContent = mmss(remaining);
  }

  // Called after a tap changed the session: start/resume = energy burst, pause/claim = one shockwave
  function playStartAnimation() {
    if (!orbEl || REDUCED || !fw) return;
    const now = performance.now();
    if (orbMode === "running") burst(now); else { shocks.push(now); if (orbMode === "idle") flash(.45); }
    wake();
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
