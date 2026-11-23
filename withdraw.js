/* Zenvyro — Withdrawal screen (full-screen sheet #zvWd), built same-to-same from the member's mockup.
   Logic is unchanged and lives in wallet.js (ZenvyroWalletOps.withdraw): the amount is locked as a request, an admin accepts or rejects,
   the member receives 70% and 30% goes to Airdrop Hold as ZNV, minimum $10 value.
   Sensitive form: the sheet is never closed by the app going to the background, and the typed values (asset, address, amount) are kept in
   sessionStorage for 30 minutes, so if the phone reloads the page after a long minimise the sheet opens again with the same values.
   Demo: requests and approvals live in this browser (localStorage). A server must hold them in the real system. */
(() => {
  "use strict";
  const DKEY = "zenvyro_wd_draft_v1", TTL = 30 * 60 * 1000;
  const ART = {"W":480,"H":250,"p":{"hero":[0,0,176,156],"layers":[178,0,68,64],"trx":[248,0,90,94],"wallet":[340,0,64,54],"coins":[406,0,64,58],"warn":[0,158,80,76],"shield":[82,158,80,92],"sol":[164,158,68,60],"bnb":[234,158,66,66]},"o":{"hero":[60,60],"layers":[66,250],"trx":[108,318],"wallet":[66,578],"coins":[66,758],"warn":[90,1064],"shield":[84,1344],"sol":[0,0],"bnb":[0,0]}}, AV = "20261114s";
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const r2 = n => Math.round(n * 100) / 100;
  const u = n => `calc(${r2(n)} * var(--u))`;
  const T = (x, cy, s, w) => `left:${u(x)};top:${u(cy - s * 0.62)};font-size:${u(s)};line-height:${u(s * 1.24)};font-weight:${w}`;
  const ops = () => window.ZenvyroWalletOps;
  const W = () => window.ZenvyroWallet;
  const asset = s => ops().assets.find(a => a.sym === s) || ops().assets[0];
  const dp = a => (a.dec > 6 ? 8 : 6);
  let cur = "TRX", busy = false, tmr = 0;

  const SV = {
    x: '<svg viewBox="0 0 32 32" fill="none" stroke="#fff" stroke-width="4.200" stroke-linecap="round"><path d="M5 5l22 22M27 5L5 27"/></svg>',
    chv: '<svg viewBox="0 0 28 18" fill="none" stroke="#fff" stroke-width="4.400" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3l11 11L25 3"/></svg>',
    scan: '<svg viewBox="0 0 42 40" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12V6a4 4 0 0 1 4-4h8M28 2h8a4 4 0 0 1 4 4v6M40 28v6a4 4 0 0 1-4 4h-8M14 38H6a4 4 0 0 1-4-4v-6M2 20h38"/></svg>',
    up: '<svg viewBox="0 0 60 58" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"><path d="M30 38V6M16 20L30 6l14 14M6 34v14a4 4 0 0 0 4 4h40a4 4 0 0 0 4-4V34"/></svg>'
  };

  function injectCss() {
    if ($("wdCss")) return;
    const spr = Object.keys(ART.p).map(k => {
      const q = ART.p[k], o = ART.o[k];
      return `#zvWd .i-${k}{display:block;flex-shrink:0;width:${u(q[2])};height:${u(q[3])};background:url(withdraw-art.webp?v=${AV}) no-repeat;background-size:${u(ART.W)} ${u(ART.H)};background-position:calc(${-q[0]} * var(--u)) calc(${-q[1]} * var(--u))}\n#zvWd .s-${k}{position:absolute;left:${u(o[0])};top:${u(o[1])};pointer-events:none}`;
    }).join("\n");
    const st = document.createElement("style"); st.id = "wdCss";
    st.textContent = `
#zvWd{--u:calc(min(100vw,560px)/1024);position:fixed;inset:0;z-index:25;overflow-y:auto;overflow-x:hidden;-webkit-overflow-scrolling:touch;padding:env(safe-area-inset-top,0px) 0 calc(20px + env(safe-area-inset-bottom,0px));color:#fff;font-family:Inter,system-ui,-apple-system,"Segoe UI",sans-serif;
background:radial-gradient(ellipse ${u(700)} ${u(500)} at 100% 0,#3a14a0aa,transparent 70%),radial-gradient(ellipse ${u(640)} ${u(520)} at 0 100%,#2a0e80aa,transparent 70%),#06011f;background-attachment:local}
#zvWd *{box-sizing:border-box}
#zvWd button{font-family:inherit;color:inherit;cursor:pointer;-webkit-tap-highlight-color:transparent;appearance:none;-webkit-appearance:none;padding:0}
#zvWd .wd{position:relative;width:${u(1024)};height:${u(1536)};margin:0 auto}
#zvWd .a{position:absolute}
#zvWd .bd:before{content:"";position:absolute;inset:0;border-radius:inherit;padding:${u(3)};background:var(--bd,linear-gradient(135deg,#9a7aff,#3a2aa0 50%,#7a4aff));-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);mask-composite:exclude;pointer-events:none;z-index:3}
#zvWd .card{left:${u(30)};top:${u(38)};width:${u(965)};height:${u(1454)};border-radius:${u(70)};background:linear-gradient(165deg,#1c0a6c 0%,#0e0336 30%,#0a0230 62%,#14044c 100%);box-shadow:0 0 ${u(50)} #7a2cff66,inset 0 0 ${u(70)} #3a14a055;--bd:linear-gradient(135deg,#7a46ff 0%,#3a14b0 28%,#22088a 50%,#9a2ee8 78%,#e03cf8 100%)}
#zvWd .hd{left:${u(30)};top:${u(38)};width:${u(965)};height:${u(198)};border-radius:${u(70)} ${u(70)} 0 0;overflow:hidden;background:linear-gradient(100deg,#08011f 0%,#12044a 45%,#26077a 100%)}
#zvWd .hd:after{content:"";position:absolute;right:${u(-30)};top:${u(-60)};width:${u(520)};height:${u(320)};background:linear-gradient(118deg,transparent 34%,#9a6aff3a 44%,#d2b4ff44 47%,transparent 54%)}
#zvWd .dv{left:${u(33)};top:${u(236)};width:${u(959)};height:${u(2)};background:linear-gradient(90deg,#2a1088,#6a3ae0aa 50%,#2a1088)}
#zvWd .t{white-space:nowrap;pointer-events:none}
#zvWd .t b{font-weight:700}#zvWd .t b.g{color:#1ff27c}#zvWd .t b.y{color:#ffd21a}#zvWd .t b.w{font-weight:600}
#zvWd .xb{left:${u(902)};top:${u(55)};width:${u(76)};height:${u(72)};border-radius:${u(18)};border:${u(2.5)} solid #9a6aff;background:#14086e;display:grid;place-items:center;box-shadow:0 0 ${u(18)} #7a4aff66;z-index:6}
#zvWd .xb svg{width:${u(31)};height:${u(31)}}
#zvWd .sel{left:${u(66)};top:${u(320)};width:${u(896)};height:${u(90)};border-radius:${u(45)};background:linear-gradient(90deg,#10033a,#0b012b 60%,#12044a);--bd:linear-gradient(90deg,#c418f2,#6a22d8 35%,#5a2ad0 65%,#b030ee);cursor:pointer;z-index:2}
#zvWd .selic{left:${u(108)};top:${u(318)};width:${u(90)};height:${u(94)};display:grid;place-items:center;pointer-events:none;z-index:4}
#zvWd .chv{left:${u(908)};top:${u(356)};width:${u(28)};height:${u(18)};pointer-events:none;z-index:4;transition:transform .2s}
#zvWd .sel.open~.chv{transform:rotate(180deg)}
#zvWd .cb{display:grid;place-items:center;width:${u(66)};height:${u(66)};border-radius:50%;background:var(--c,#7a4aff);color:#fff;font-weight:800;font-size:${u(36)};line-height:1}
#zvWd .opts{left:${u(66)};top:${u(416)};width:${u(896)};border-radius:${u(34)};border:${u(2.5)} solid #6a3ae0;background:#0b0540;overflow:hidden;display:none;z-index:9;box-shadow:0 ${u(18)} ${u(40)} #000a}
#zvWd .opts.on{display:block}
#zvWd .opts button{display:flex;align-items:center;gap:${u(28)};width:100%;height:${u(84)};padding:0 ${u(40)};border:0;border-top:1px solid #4a3ac844;background:transparent;font-size:${u(31)};font-weight:500;text-align:left}
#zvWd .opts button:first-child{border-top:0}#zvWd .opts button.on{background:#3a1aa388}
#zvWd .ri{display:grid;place-items:center;width:${u(80)};height:${u(70)}}#zvWd .ri>i{transform:scale(.66)}#zvWd .ri .cb{width:${u(54)};height:${u(54)};font-size:${u(29)}}
#zvWd .ib{left:${u(66)};top:${u(433)};width:${u(896)};height:${u(115)};border-radius:${u(30)};background:linear-gradient(90deg,#2d0a76,#210a66 60%,#250a78);--bd:linear-gradient(135deg,#8a46ff,#4a22c0 50%,#7a38f0)}
#zvWd .ii{position:absolute;display:grid;place-items:center;border-radius:50%;background:radial-gradient(circle at 35% 30%,#4a3ae8,#1f1294 70%);border:${u(4)} solid #6a52ff;color:#fff;font-weight:800;font-style:normal;z-index:2;pointer-events:none}
#zvWd .fl{width:${u(896)};left:${u(66)};background:#06011d}
#zvWd .fl.f1{top:${u(641)};height:${u(92)};border-radius:${u(46)};--bd:linear-gradient(135deg,#7a46ff,#3a1aa8 50%,#6a38e8)}
#zvWd .fl.f2{top:${u(823)};height:${u(87)};border-radius:${u(43.5)};--bd:linear-gradient(135deg,#7a46ff,#3a1aa8 50%,#6a38e8)}
#zvWd .in{border:0;outline:0;background:transparent;color:#fff;font-family:inherit;font-weight:500;font-size:max(16px,${u(30)});caret-color:#c9a8ff;z-index:4;padding:0;margin:0;-moz-appearance:textfield}
#zvWd .in::placeholder{color:#8d84c2;font-weight:400;font-size:${u(30)};opacity:1}
#zvWd .in::-webkit-outer-spin-button,#zvWd .in::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}
#zvWd .scan{left:${u(874)};top:${u(650)};width:${u(78)};height:${u(74)};border:0;background:transparent;display:grid;place-items:center;z-index:5}
#zvWd .scan svg{width:${u(42)};height:${u(40)}}
#zvWd .mx{left:${u(797)};top:${u(826)};width:${u(165)};height:${u(82)};border-radius:${u(41)};border:${u(2.5)} solid #b48aff;background:linear-gradient(135deg,#b008fa 0%,#6a02f6 50%,#3a04d8 100%);font-size:${u(29)};font-weight:700;z-index:5;box-shadow:0 0 ${u(18)} #8a3dff66}
#zvWd .sm{left:${u(66)};top:${u(928)};width:${u(896)};height:${u(80)};border-radius:${u(26)};background:linear-gradient(90deg,#220a5e,#1c074f 60%,#240c68);--bd:linear-gradient(135deg,#7a46ff,#3a1aa8 50%,#6a38e8)}
#zvWd .wn{left:${u(62)};top:${u(1041)};width:${u(902)};height:${u(120)};border-radius:${u(32)};background:linear-gradient(90deg,#7e3214,#5d2116 55%,#6b2a1c);box-shadow:0 0 ${u(30)} #f5a02340;--bd:linear-gradient(135deg,#f6b83a,#c8721e 50%,#f0b040)}
#zvWd .sb{left:${u(62)};top:${u(1187)};width:${u(902)};height:${u(110)};border-radius:${u(55)};border:${u(2)} solid #ffffff66;background:linear-gradient(90deg,#e03ffc 0%,#a810fd 30%,#6a2cf8 65%,#4e82fc 100%);box-shadow:0 0 ${u(40)} #8a3dff77;display:flex;align-items:center;justify-content:center;gap:${u(34)};font-size:${u(32)};font-weight:700;z-index:5;transition:transform .12s,opacity .2s}
#zvWd .sb:active{transform:scale(.985)}#zvWd .sb[disabled]{opacity:.6;pointer-events:none}
#zvWd .sb svg{width:${u(60)};height:${u(58)};flex-shrink:0}
#zvWd .nt{left:${u(62)};top:${u(1322)};width:${u(902)};height:${u(146)};border-radius:${u(34)};background:linear-gradient(90deg,#140346,#110340);--bd:linear-gradient(135deg,#6a3ae0,#2a1590 50%,#5a2ed0)}
#zvWd .zt{position:fixed;left:50%;bottom:calc(36px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);max-width:88vw;background:#211747;border:1px solid #6e42cc;color:#fff;padding:12px 18px;border-radius:14px;font-size:14px;line-height:1.4;text-align:center;z-index:20;display:none}
#zvWd .zt.show{display:block}
${spr}`;
    document.head.appendChild(st);
  }

  const aic = s => s === "TRX" ? '<i class="i-trx"></i>' : s === "SOL" ? '<i class="i-sol"></i>' : s === "BNB" ? '<i class="i-bnb"></i>' : `<span class="cb" style="--c:${asset(s).bg}">${esc(asset(s).ch)}</span>`;
  const ii = (cx, cy, d) => `<i class="ii" style="left:${u(cx - d / 2)};top:${u(cy - d / 2)};width:${u(d)};height:${u(d)};font-size:${u(d * 0.56)}">i</i>`;

  function html() {
    const rows = ops().assets.map(a => `<button type="button" data-s="${a.sym}" onclick="zvWdPick('${a.sym}')"><span class="ri">${aic(a.sym)}</span>${a.sym} · ${esc(a.name)}</button>`).join("");
    return `<div class="wd" onpointerdown="zvWdOut(event)">
      <div class="a card bd"></div><div class="a hd"></div><div class="a dv"></div>
      <i class="s-hero i-hero"></i>
      <div class="a t" style="${T(254, 118, 53, 700)}">Withdrawal</div>
      <div class="a t" style="${T(255, 179, 29, 400)};color:#c9c1f5">Withdraw your funds securely</div>
      <button class="a xb" aria-label="Close" onclick="zvWdClose()">${SV.x}</button>
      <i class="s-layers i-layers"></i><div class="a t" style="${T(153, 283, 28, 600)}">Asset</div>
      <div class="a sel bd" id="wdSel" onclick="zvWdToggle()"></div>
      <div class="a selic" id="wdSelIc"></div><div class="a t" id="wdSelTx" style="${T(226, 363, 36, 500)};z-index:4"></div>
      <div class="a chv">${SV.chv}</div>
      <div class="a opts" id="wdOpts">${rows}</div>
      <div class="a ib bd"></div>${ii(134, 490, 63)}
      <div class="a t" id="wdI1" style="${T(206, 472, 25, 400)}"></div>
      <div class="a t" id="wdI2" style="${T(206, 509, 23, 400)}"></div>
      <i class="s-wallet i-wallet"></i><div class="a t" style="${T(149, 605, 28, 600)}">Wallet Address</div>
      <div class="a fl f1 bd"></div>
      <input class="a in" id="wdAddr" type="text" placeholder="Enter your wallet address" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" oninput="zvWdIn()" style="left:${u(107)};top:${u(641)};width:${u(760)};height:${u(92)}">
      <button class="a scan" aria-label="Scan QR code" onclick="zvWdScan()">${SV.scan}</button>
      <i class="s-coins i-coins"></i><div class="a t" style="${T(147, 787, 27, 600)}">Amount</div>
      <div class="a fl f2 bd"></div>
      <input class="a in" id="wdAmt" type="number" inputmode="decimal" step="any" min="0" placeholder="Enter amount (e.g. 100)" oninput="zvWdIn()" style="left:${u(107)};top:${u(823)};width:${u(672)};height:${u(87)}">
      <button class="a mx" onclick="zvWdMax()">MAX</button>
      <div class="a sm bd"></div>${ii(118, 968, 44)}
      <div class="a t" id="wdCan" style="${T(169, 968, 23, 400)}"></div>
      <div class="a wn bd"></div><i class="s-warn i-warn"></i>
      <div class="a t" id="wdW1" style="${T(207, 1086, 24, 400)}"></div>
      <div class="a t" id="wdW2" style="${T(206, 1119, 24, 400)}"></div>
      <button class="a sb" id="wdSubmit" onclick="zvWdSubmit()">${SV.up}<span>Submit Withdrawal Request</span></button>
      <div class="a nt bd"></div><i class="s-shield i-shield"></i>
      <div class="a t" style="${T(194, 1364, 24, 700)};color:#20e8d4">Security Notice:</div>
      <div class="a t" style="${T(195, 1400, 22, 400)};color:#d7d2f4">Make sure the wallet address is correct. Withdrawals are processed</div>
      <div class="a t" style="${T(195, 1432, 22, 400)};color:#d7d2f4">manually and may take some time to complete.</div>
    </div><div class="zt" id="wdToast" role="status"></div>`;
  }

  const say = m => { const el = $("wdToast"); if (!el) { if (typeof window.toast === "function") window.toast(m); return; } el.textContent = m; el.classList.add("show"); clearTimeout(tmr); tmr = setTimeout(() => el.classList.remove("show"), 2600); };
  const getVals = () => ({ addr: $("wdAddr") ? $("wdAddr").value : "", amt: $("wdAmt") ? $("wdAmt").value : "" });
  const saveDraft = open => { try { const v = getVals(); sessionStorage.setItem(DKEY, JSON.stringify({ sym: cur, addr: v.addr, amt: v.amt, open: !!open, ts: Date.now() })); } catch (e) {} };
  const clearDraft = () => { try { sessionStorage.removeItem(DKEY); } catch (e) {} };
  const loadDraft = () => { try { const d = JSON.parse(sessionStorage.getItem(DKEY) || "null"); if (d && typeof d === "object" && Date.now() - (+d.ts || 0) < TTL) return d; } catch (e) {} return null; };

  function breakdown() {
    const a = asset(cur), d = dp(a), l1 = $("wdW1"), l2 = $("wdW2"); if (!l1) return;
    const pct = ops().holdPct, amt = parseFloat($("wdAmt").value);
    l1.innerHTML = `${pct}% of every withdrawal goes to Airdrop Hold as <b class="y">ZNV</b>.`;
    if (!(amt > 0)) { l2.innerHTML = `You receive the other <b class="y">${100 - pct}%</b>.`; return; }
    const h = ops().holdOf(amt), px = cur === "USDT" ? 1 : (W() ? +W().prices()[cur] : 0), z = px > 0 ? h * px / ops().zenyUsdt : 0;
    l2.innerHTML = `You receive <b class="y">${(amt - h).toFixed(d)} ${a.sym}</b>` + (z > 0 ? ` · Hold ≈ ${z.toFixed(4)} ZNV` : "");
  }
  function paint() {
    if (!$("wdSel")) return;
    const a = asset(cur), d = dp(a), av = window.ZenvyroWalletInfo ? window.ZenvyroWalletInfo.avail(cur) : 0, min = ops().minWdUsd;
    $("wdSelIc").innerHTML = aic(cur); $("wdSelTx").textContent = a.sym + " · " + a.name;
    document.querySelectorAll("#wdOpts button").forEach(b => b.classList.toggle("on", b.dataset.s === cur));
    $("wdI1").innerHTML = `Network: <b class="w">${esc(a.net)}</b> &nbsp;•&nbsp; Available: <b class="g">${av.toFixed(d)} ${a.sym}</b>`;
    $("wdI2").textContent = "Minimum withdrawal: $" + min;
    $("wdCan").innerHTML = `You can withdraw up to <b class="y">${av.toFixed(d)} ${a.sym}</b>.` + ((av.toFixed(d) + a.sym).length > 15 ? "" : ` Minimum withdrawal is $${min}.`);
    breakdown();
  }

  function open(sym, restore) {
    if (!ops() || !window.ZenvyroWalletInfo) return;
    if (window.ZenvyroSettings && window.ZenvyroSettings.block("withdraw")) return;
    try { if (typeof window.closeModal === "function") window.closeModal(); } catch (e) {}
    injectCss(); const old = $("zvWd"); if (old) old.remove();
    const d = loadDraft(), keep = d && (restore || !sym || sym === d.sym);
    cur = keep ? d.sym : (sym && ops().assets.some(a => a.sym === sym) ? sym : "TRX");
    if (!ops().assets.some(a => a.sym === cur)) cur = "TRX";
    const ov = document.createElement("div"); ov.id = "zvWd"; ov.setAttribute("role", "dialog"); ov.setAttribute("aria-label", "Withdrawal"); ov.innerHTML = html(); document.body.appendChild(ov);
    if (keep) { $("wdAddr").value = d.addr || ""; $("wdAmt").value = d.amt || ""; }
    paint(); saveDraft(true);
    try { if (W() && W().ensurePrices) W().ensurePrices().then(() => { if ($("zvWd")) breakdown(); }).catch(() => {}); } catch (e) {}
  }
  function close() {
    const ov = $("zvWd"); if (!ov) return;
    const v = getVals(); ov.remove();
    if (v.addr || v.amt) saveDraft(false); else clearDraft();
  }

  async function submit() {
    if (busy || !$("zvWd")) return;
    const v = getVals(), btn = $("wdSubmit"); busy = true; btn.disabled = true;
    try {
      const msg = await ops().withdraw(cur, v.addr.trim(), parseFloat(v.amt));
      if (msg === "__blocked") return;
      if (msg) { say(msg); return; }
      clearDraft(); const ov = $("zvWd"); if (ov) ov.remove();
      if (typeof window.toast === "function") window.toast("Withdraw request sent");
    } catch (e) { say("Something went wrong. Please try again."); }
    finally { busy = false; const b = $("wdSubmit"); if (b) b.disabled = false; }
  }

  function init() {
    window.ZenvyroWithdraw = { open, close };
    Object.assign(window, {
      zvWdClose: close,
      zvWdToggle: () => { $("wdOpts").classList.toggle("on"); $("wdSel").classList.toggle("open"); },
      zvWdPick: k => { cur = k; $("wdOpts").classList.remove("on"); $("wdSel").classList.remove("open"); paint(); saveDraft(true); },
      zvWdOut: e => { const o = $("wdOpts"); if (o && o.classList.contains("on") && !o.contains(e.target) && !$("wdSel").contains(e.target)) { o.classList.remove("on"); $("wdSel").classList.remove("open"); } },
      zvWdIn: () => { breakdown(); saveDraft(true); },
      zvWdMax: () => { const a = asset(cur), av = window.ZenvyroWalletInfo.avail(cur); $("wdAmt").value = av > 0 ? av.toFixed(dp(a)) : ""; breakdown(); saveDraft(true); },
      zvWdScan: () => say("QR scanning is coming soon. Paste the address instead."),
      zvWdSubmit: submit
    });
    addEventListener("storage", () => { if ($("zvWd")) paint(); });
    document.addEventListener("visibilitychange", () => { if (!document.hidden && $("zvWd")) paint(); });
    addEventListener("pageshow", () => { if ($("zvWd")) paint(); });
    addEventListener("load", () => { const o = window.showSection; if (typeof o === "function") window.showSection = function () { close(); return o.apply(this, arguments); }; });
    const d = loadDraft();
    if (d && d.open) { let n = 0; const iv = setInterval(() => { n++; if (ops() && window.ZenvyroWalletInfo && W()) { clearInterval(iv); open(d.sym, true); } else if (n > 25) clearInterval(iv); }, 300); }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
