/* Zenvyro — Transfer screen (full-screen sheet #zvTr), built same-to-same from the member's mockup.
   Logic is unchanged and lives in wallet.js (ZenvyroWalletOps.transfer): member to member, instant, no admin, minimum $5 value,
   recipient ID lookup with a masked name (member-id.js), admin can cancel later from Transfers History.
   Sensitive form: the sheet is never closed by the app going to the background, and the typed values (asset, recipient ID, amount) are kept in
   sessionStorage for 30 minutes, so if the phone reloads the page after a long minimise the sheet opens again with the same values.
   "Clear Form" empties the fields. Demo: balances and transfers live in this browser (localStorage). A server must enforce everything. */
(() => {
  "use strict";
  const DKEY = "zenvyro_tr_draft_v1", TTL = 30 * 60 * 1000, OY = 80, DY = 102;
  const ART = {"W":480,"H":258,"p":{"hero":[0,0,178,172],"layers":[180,0,64,62],"trx":[246,0,94,86],"plane":[342,0,66,60],"person":[410,0,60,60],"db":[0,174,58,58],"dollar":[60,174,70,68],"warn":[132,174,94,84],"shield":[228,174,70,84],"sol":[300,174,68,60],"bnb":[370,174,66,66]},"o":{"hero":[66,140],"layers":[62,338],"trx":[92,408],"plane":[62,612],"person":[86,696],"db":[64,802],"dollar":[84,884],"warn":[90,1030],"shield":[86,1340],"sol":[0,0],"bnb":[0,0]}}, AV = "20261114s";
  (window.ZV_ART = window.ZV_ART || []).push("transfer-art.webp?v=" + AV);
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const r2 = n => Math.round(n * 100) / 100;
  const u = n => `calc(${r2(n)} * var(--u))`;
  /* y values below are the mockup's own; OY lifts the card to the top, DY pushes the lower part down when the recipient card shows. */
  const Y = y => y - OY, ud = y => `calc((${r2(Y(y))} + var(--dy)) * var(--u))`;
  const T = (x, cy, s, w, dyn) => `left:${u(x)};top:${dyn ? ud(cy - s * 0.62) : u(Y(cy - s * 0.62))};font-size:${u(s)};line-height:${u(s * 1.24)};font-weight:${w}`;
  const ops = () => window.ZenvyroWalletOps;
  const W = () => window.ZenvyroWallet;
  const asset = s => ops().assets.find(a => a.sym === s) || ops().assets[0];
  const dp = a => (a.dec > 6 ? 8 : 6);
  let cur = "TRX", busy = false, tmr = 0, obs = null;

  const SV = {
    x: '<svg viewBox="0 0 32 32" fill="none" stroke="#fff" stroke-width="4.200" stroke-linecap="round"><path d="M5 5l22 22M27 5L5 27"/></svg>',
    chv: '<svg viewBox="0 0 28 18" fill="none" stroke="#fff" stroke-width="4.400" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3l11 11L25 3"/></svg>',
    bin: '<svg viewBox="0 0 28 30" fill="none" stroke="#fff" stroke-width="2.800" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7h22M10 7V3.500h8V7M5.500 7l1.300 18.500a2.500 2.500 0 0 0 2.500 2.300h9.400a2.500 2.500 0 0 0 2.500-2.300L22.500 7M11.500 12.500v10M16.500 12.500v10"/></svg>',
    plane: '<svg viewBox="0 0 52 50" fill="#fff"><path d="M49 2L3 21.500c-1.600.7-1.500 3 .2 3.500l12.800 4 5 15c.5 1.500 2.400 1.800 3.400.6l7-8.300 11.800 8.700c1.400 1 3.400.2 3.700-1.500L52 5c.3-2.400-1.800-4.100-3-3zM20 28L42.500 9.500 24 31.500z"/></svg>'
  };

  function injectCss() {
    if ($("trCss")) return;
    const spr = Object.keys(ART.p).map(k => {
      const q = ART.p[k], o = ART.o[k];
      return `#zvTr .i-${k}{display:block;flex-shrink:0;width:${u(q[2])};height:${u(q[3])};background:url(transfer-art.webp?v=${AV}) no-repeat;background-size:${u(ART.W)} ${u(ART.H)};background-position:calc(${-q[0]} * var(--u)) calc(${-q[1]} * var(--u))}\n#zvTr .s-${k}{position:absolute;left:${u(o[0])};top:${u(Y(o[1]))};pointer-events:none}`;
    }).join("\n");
    const lw = ["db", "dollar", "warn", "shield"].map(k => `#zvTr .s-${k}{top:${ud(ART.o[k][1])}}`).join("\n");
    const st = document.createElement("style"); st.id = "trCss";
    st.textContent = `
#zvTr{--u:calc(min(100vw,560px)/1024);--dy:0;position:fixed;inset:0;z-index:25;overflow-y:auto;overflow-x:hidden;-webkit-overflow-scrolling:touch;padding:env(safe-area-inset-top,0px) 0 calc(20px + env(safe-area-inset-bottom,0px));color:#fff;font-family:Inter,system-ui,-apple-system,"Segoe UI",sans-serif;
background:radial-gradient(ellipse ${u(700)} ${u(500)} at 0 0,#3a14a0aa,transparent 70%),radial-gradient(ellipse ${u(640)} ${u(520)} at 100% 100%,#2a0e80aa,transparent 70%),#06011f;background-attachment:local}
#zvTr.has{--dy:${DY}}
#zvTr *{box-sizing:border-box}
#zvTr button{font-family:inherit;color:inherit;cursor:pointer;-webkit-tap-highlight-color:transparent;appearance:none;-webkit-appearance:none;padding:0}
#zvTr .wd{position:relative;width:${u(1024)};height:calc((${1416} + var(--dy)) * var(--u));margin:0 auto}
#zvTr .a{position:absolute}
#zvTr .bd:before{content:"";position:absolute;inset:0;border-radius:inherit;padding:${u(3)};background:var(--bd,linear-gradient(135deg,#9a7aff,#3a2aa0 50%,#7a4aff));-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);mask-composite:exclude;pointer-events:none;z-index:3}
#zvTr .card{left:${u(24)};top:${u(Y(118))};width:${u(976)};height:calc((${1340} + var(--dy)) * var(--u));border-radius:${u(70)};background:linear-gradient(165deg,#1c0a6a 0%,#10043e 28%,#0b0334 62%,#150550 100%);box-shadow:0 0 ${u(50)} #7a2cff66,inset 0 0 ${u(70)} #3a14a055;--bd:linear-gradient(135deg,#8a5aff 0%,#4a1ab8 28%,#2a0a8e 50%,#8a2ee8 78%,#c83cf0 100%)}
#zvTr .hd{left:${u(24)};top:${u(Y(118))};width:${u(976)};height:${u(212)};border-radius:${u(70)} ${u(70)} 0 0;overflow:hidden;background:linear-gradient(100deg,#150652 0%,#10044a 50%,#1c0a64 100%)}
#zvTr .hd:after{content:"";position:absolute;right:${u(-30)};top:${u(-60)};width:${u(520)};height:${u(320)};background:linear-gradient(118deg,transparent 34%,#9a6aff2e 44%,#d2b4ff36 47%,transparent 54%)}
#zvTr .dv{left:${u(27)};top:${u(Y(330))};width:${u(970)};height:${u(2)};background:linear-gradient(90deg,#2a1088,#6a3ae0aa 50%,#2a1088)}
#zvTr .t{white-space:nowrap;pointer-events:none}
#zvTr .t b{font-weight:700}#zvTr .t b.g{color:#1ff27c}#zvTr .t b.y{color:#ffd21a}
#zvTr .xb{left:${u(904)};top:${u(Y(124))};width:${u(82)};height:${u(78)};border-radius:${u(20)};border:${u(2.5)} solid #a07aff;background:#150a6e;display:grid;place-items:center;box-shadow:0 0 ${u(18)} #7a4aff66;z-index:6}
#zvTr .xb svg{width:${u(31)};height:${u(31)}}
#zvTr .cl{left:${u(896)};top:${u(Y(206))};width:${u(98)};height:${u(40)};border-radius:${u(14)};border:${u(2)} solid #7a52ee;background:#1c0f7a;font-size:${u(20)};font-weight:500;z-index:6}
#zvTr .cl:before{content:"";position:absolute;left:50%;top:${u(-9)};width:${u(14)};height:${u(14)};background:#1c0f7a;border-left:${u(2)} solid #7a52ee;border-top:${u(2)} solid #7a52ee;transform:translateX(-50%) rotate(45deg)}
#zvTr .cf{left:${u(796)};top:${u(Y(248))};width:${u(202)};height:${u(66)};border-radius:${u(22)};border:${u(2.5)} solid #8a5cff;background:#1a0b66;display:flex;align-items:center;justify-content:center;gap:${u(16)};font-size:${u(21)};font-weight:500;z-index:6}
#zvTr .cf svg{width:${u(28)};height:${u(30)}}
#zvTr .sel{left:${u(58)};top:${u(Y(412))};width:${u(909)};height:${u(76)};border-radius:${u(38)};background:linear-gradient(90deg,#10033a,#0b012b 60%,#12044a);--bd:linear-gradient(90deg,#c418f2,#6a22d8 35%,#5a2ad0 65%,#b030ee);cursor:pointer;z-index:2}
#zvTr .selic{left:${u(92)};top:${u(Y(408))};width:${u(94)};height:${u(86)};display:grid;place-items:center;pointer-events:none;z-index:4}
#zvTr .chv{left:${u(910)};top:${u(Y(441))};width:${u(28)};height:${u(18)};pointer-events:none;z-index:4;transition:transform .2s}
#zvTr .sel.open~.chv{transform:rotate(180deg)}
#zvTr .cb{display:grid;place-items:center;width:${u(62)};height:${u(62)};border-radius:50%;background:var(--c,#7a4aff);color:#fff;font-weight:800;font-size:${u(34)};line-height:1}
#zvTr .opts{left:${u(58)};top:${u(Y(416))};width:${u(909)};border-radius:${u(34)};border:${u(2.5)} solid #6a3ae0;background:#0b0540;overflow:hidden;display:none;z-index:9;box-shadow:0 ${u(18)} ${u(40)} #000a}
#zvTr .opts.on{display:block}
#zvTr .opts button{display:flex;align-items:center;gap:${u(28)};width:100%;height:${u(84)};padding:0 ${u(40)};border:0;border-top:1px solid #4a3ac844;background:transparent;font-size:${u(31)};font-weight:500;text-align:left}
#zvTr .opts button:first-child{border-top:0}#zvTr .opts button.on{background:#3a1aa388}
#zvTr .ri{display:grid;place-items:center;width:${u(80)};height:${u(70)}}#zvTr .ri>i{transform:scale(.66)}#zvTr .ri .cb{width:${u(54)};height:${u(54)};font-size:${u(29)}}
#zvTr .av{left:${u(58)};top:${u(Y(510))};width:${u(909)};height:${u(78)};border-radius:${u(30)};background:linear-gradient(90deg,#220a62,#1b074a 60%,#210a5e);--bd:linear-gradient(135deg,#7a46ff,#3a1aa8 50%,#6a38e8)}
#zvTr .ii{position:absolute;display:grid;place-items:center;border-radius:50%;background:radial-gradient(circle at 35% 30%,#4a3ae8,#1f1294 70%);border:${u(4)} solid #6a52ff;color:#fff;font-weight:800;font-style:normal;z-index:2;pointer-events:none}
#zvTr .fl{left:${u(58)};width:${u(909)};background:#07011f;--bd:linear-gradient(135deg,#7a46ff,#3a1aa8 50%,#6a38e8)}
#zvTr .fl.f1{top:${u(Y(681))};height:${u(92)};border-radius:${u(46)}}
#zvTr .fl.f2{top:${ud(871)};height:${u(96)};border-radius:${u(48)}}
#zvTr .in{border:0;outline:0;background:transparent;color:#fff;font-family:inherit;font-weight:500;font-size:max(16px,${u(30)});caret-color:#c9a8ff;z-index:4;padding:0;margin:0;-moz-appearance:textfield}
#zvTr .in::placeholder{color:#8d84c2;font-weight:400;font-size:${u(30)};opacity:1}
#zvTr #trAmt::placeholder{font-size:${u(28)}}
#zvTr .in::-webkit-outer-spin-button,#zvTr .in::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}
#zvTr .mx{left:${u(818)};top:${ud(886)};width:${u(142)};height:${u(66)};border-radius:${u(33)};border:${u(2.5)} solid #b48aff;background:linear-gradient(135deg,#b008fa 0%,#6a02f6 50%,#3a04d8 100%);font-size:${u(26)};font-weight:700;z-index:5;box-shadow:0 0 ${u(18)} #8a3dff66}
#zvTr .wn{left:${u(58)};top:${ud(994)};width:${u(909)};height:${u(160)};border-radius:${u(36)};background:linear-gradient(90deg,#68244a,#4a1f2e 50%,#58283c);box-shadow:0 0 ${u(30)} #f5a02330;--bd:linear-gradient(135deg,#f6b83a,#b8682a 50%,#f0b040)}
#zvTr .sb{left:${u(58)};top:${ud(1184)};width:${u(909)};height:${u(116)};border-radius:${u(58)};border:${u(2)} solid #ffffff66;background:linear-gradient(90deg,#f637fe 0%,#962efc 35%,#5d0af6 70%,#4a76fc 100%);box-shadow:0 0 ${u(40)} #8a3dff77;display:flex;align-items:center;justify-content:center;gap:${u(26)};font-size:${u(38)};font-weight:700;z-index:5;transition:transform .12s,opacity .2s}
#zvTr .sb:active{transform:scale(.985)}#zvTr .sb[disabled]{opacity:.6;pointer-events:none}
#zvTr .sb svg{width:${u(52)};height:${u(50)};flex-shrink:0}
#zvTr .nt{left:${u(58)};top:${ud(1328)};width:${u(909)};height:${u(108)};border-radius:${u(30)};background:linear-gradient(90deg,#21124f,#1b0a48);--bd:linear-gradient(135deg,#6a3ae0,#2a1590 50%,#5a2ed0)}
#zvTr .zid-card{position:absolute;left:${u(58)};top:${u(Y(783))};width:${u(909)};height:${u(86)};margin:0;min-height:0;border-radius:${u(30)};padding:0 ${u(26)};gap:${u(20)};z-index:5}
#zvTr .zid-card .ck{width:${u(44)};height:${u(44)}}#zvTr .zid-card .ck svg{width:${u(22)};height:${u(22)}}
#zvTr .zid-card small{font-size:${u(19)};line-height:${u(22)}}
#zvTr .zid-card b{font-size:${u(24)};line-height:${u(27)};letter-spacing:.04em;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
#zvTr .zt{position:fixed;left:50%;bottom:calc(36px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);max-width:88vw;background:#211747;border:1px solid #6e42cc;color:#fff;padding:12px 18px;border-radius:14px;font-size:14px;line-height:1.4;text-align:center;z-index:20;display:none}
#zvTr .zt.show{display:block}
${spr}
${lw}`;
    document.head.appendChild(st);
  }

  const aic = s => s === "TRX" ? '<i class="i-trx"></i>' : s === "SOL" ? '<i class="i-sol"></i>' : s === "BNB" ? '<i class="i-bnb"></i>' : `<span class="cb" style="--c:${asset(s).bg}">${esc(asset(s).ch)}</span>`;
  const ii = (cx, cy, d) => `<i class="ii" style="left:${u(cx - d / 2)};top:${u(Y(cy - d / 2))};width:${u(d)};height:${u(d)};font-size:${u(d * 0.56)}">i</i>`;

  function html() {
    const rows = ops().assets.map(a => `<button type="button" data-s="${a.sym}" onclick="zvTrPick('${a.sym}')"><span class="ri">${aic(a.sym)}</span>${a.sym} · ${esc(a.name)}</button>`).join("");
    return `<div class="wd" onpointerdown="zvTrOut(event)">
      <div class="a card bd"></div><div class="a hd"></div><div class="a dv"></div>
      <i class="s-hero i-hero"></i>
      <div class="a t" style="${T(289, 197, 49, 700)}">Transfer</div>
      <div class="a t" style="${T(289, 256, 27, 400)};color:#c9c1f5">Send your assets securely</div>
      <button class="a xb" aria-label="Close" onclick="zvTrClose()">${SV.x}</button>
      <button class="a cl" onclick="zvTrClose()">Close</button>
      <button class="a cf" onclick="zvTrClear()">${SV.bin}Clear Form</button>
      <i class="s-layers i-layers"></i><div class="a t" style="${T(155, 368, 28, 600)}">Asset</div>
      <div class="a sel bd" id="trSel" onclick="zvTrToggle()"></div>
      <div class="a selic" id="trSelIc"></div><div class="a t" id="trSelTx" style="${T(209, 448, 34, 500)};z-index:4"></div>
      <div class="a chv">${SV.chv}</div>
      <div class="a opts" id="trOpts">${rows}</div>
      <div class="a av bd"></div>${ii(121, 549, 44)}
      <div class="a t" id="trAv" style="${T(187, 548, 25, 400)}"></div>
      <i class="s-plane i-plane"></i><div class="a t" style="${T(156, 643, 29, 600)}">Recipient ID</div>
      <div class="a fl f1 bd"></div><i class="s-person i-person"></i>
      <input class="a in" id="trTo" type="text" placeholder="Recipient's user ID (e.g. ZNV-7K4M9XQ)" autocomplete="off" autocapitalize="characters" autocorrect="off" spellcheck="false" maxlength="14" oninput="zvwTrTo(this);zvTrIn()" style="left:${u(189)};top:${u(Y(681))};width:${u(760)};height:${u(92)}">
      <div class="zid-card" id="trCard" aria-live="polite"></div>
      <i class="s-db i-db"></i><div class="a t" style="${T(155, 831, 27, 600, 1)}">Amount</div>
      <div class="a fl f2 bd"></div><i class="s-dollar i-dollar"></i>
      <input class="a in" id="trAmt" type="number" inputmode="decimal" step="any" min="0" placeholder="Enter amount (e.g. 100)" oninput="zvTrIn()" style="left:${u(194)};top:${ud(871)};width:${u(600)};height:${u(96)}">
      <button class="a mx" onclick="zvTrMax()">MAX</button>
      <div class="a wn bd"></div><i class="s-warn i-warn"></i>
      <div class="a t" style="${T(211, 1044, 24, 400, 1)}">Minimum transfer: <b class="y">$<span id="trMin">5</span></b> (value). Transfers happen instantly</div>
      <div class="a t" style="${T(211, 1079, 24, 400, 1)}">and do not go through an admin, so they are final once sent,</div>
      <div class="a t" style="${T(211, 1113, 23, 400, 1)}">except in cases of error or fraud. Double-check the recipient's ID.</div>
      <button class="a sb" id="trSubmit" onclick="zvTrSubmit()">${SV.plane}<span>Send Transfer</span></button>
      <div class="a nt bd"></div><i class="s-shield i-shield"></i>
      <div class="a t" style="${T(190, 1366, 24, 400, 1)}"><b>Note:</b> Make sure the recipient ID is correct. Incorrect ID may</div>
      <div class="a t" style="${T(190, 1400, 23, 400, 1)}">result in permanent loss of funds.</div>
    </div><div class="zt" id="trToast" role="status"></div>`;
  }

  const say = m => { const el = $("trToast"); if (!el) { if (typeof window.toast === "function") window.toast(m); return; } el.textContent = m; el.classList.add("show"); clearTimeout(tmr); tmr = setTimeout(() => el.classList.remove("show"), 2600); };
  const getVals = () => ({ to: $("trTo") ? $("trTo").value : "", amt: $("trAmt") ? $("trAmt").value : "" });
  const saveDraft = open => { try { const v = getVals(); sessionStorage.setItem(DKEY, JSON.stringify({ sym: cur, to: v.to, amt: v.amt, open: !!open, ts: Date.now() })); } catch (e) {} };
  const clearDraft = () => { try { sessionStorage.removeItem(DKEY); } catch (e) {} };
  const loadDraft = () => { try { const d = JSON.parse(sessionStorage.getItem(DKEY) || "null"); if (d && typeof d === "object" && Date.now() - (+d.ts || 0) < TTL) return d; } catch (e) {} return null; };

  function paint() {
    if (!$("trSel")) return;
    const a = asset(cur), d = dp(a), av = window.ZenvyroWalletInfo ? window.ZenvyroWalletInfo.avail(cur) : 0;
    $("trSelIc").innerHTML = aic(cur); $("trSelTx").textContent = a.sym + " · " + a.name;
    document.querySelectorAll("#trOpts button").forEach(b => b.classList.toggle("on", b.dataset.s === cur));
    $("trAv").innerHTML = `Available Balance: <b class="g">${av.toFixed(d)} ${a.sym}</b>`;
    $("trMin").textContent = ops().minTrUsd;
  }
  function watchCard() {
    const card = $("trCard"), sheet = $("zvTr"); if (!card || !sheet) return;
    if (obs) obs.disconnect();
    const sync = () => sheet.classList.toggle("has", card.classList.contains("on"));
    obs = new MutationObserver(sync); obs.observe(card, { attributes: true, attributeFilter: ["class"] }); sync();
  }

  function open(sym, restore) {
    if (!ops() || !window.ZenvyroWalletInfo) return;
    if (window.ZenvyroSettings && window.ZenvyroSettings.block("transfer")) return;
    try { if (typeof window.closeModal === "function") window.closeModal(); } catch (e) {}
    injectCss(); const old = $("zvTr"); if (old) old.remove();
    const d = loadDraft(), keep = d && (restore || !sym || sym === d.sym);
    cur = keep ? d.sym : (sym && ops().assets.some(a => a.sym === sym) ? sym : "TRX");
    if (!ops().assets.some(a => a.sym === cur)) cur = "TRX";
    const ov = document.createElement("div"); ov.id = "zvTr"; ov.setAttribute("role", "dialog"); ov.setAttribute("aria-label", "Transfer"); ov.innerHTML = html(); document.body.appendChild(ov);
    watchCard();
    if (keep) { $("trTo").value = d.to || ""; $("trAmt").value = d.amt || ""; if (d.to && typeof window.zvwTrTo === "function") window.zvwTrTo($("trTo")); }
    paint(); saveDraft(true);
    try { if (W() && W().ensurePrices) W().ensurePrices().catch(() => {}); } catch (e) {}
  }
  function close() {
    const ov = $("zvTr"); if (!ov) return;
    const v = getVals(); if (obs) { obs.disconnect(); obs = null; } ov.remove();
    if (v.to || v.amt) saveDraft(false); else clearDraft();
  }

  async function submit() {
    if (busy || !$("zvTr")) return;
    const v = getVals(), btn = $("trSubmit"); busy = true; btn.disabled = true;
    try {
      const msg = await ops().transfer(cur, v.to.trim(), parseFloat(v.amt));
      if (msg === "__blocked" || msg === "__cancel") return;
      if (msg) { say(msg); return; }
      clearDraft(); if (obs) { obs.disconnect(); obs = null; } const ov = $("zvTr"); if (ov) ov.remove();
      if (typeof window.toast === "function") window.toast("Transfer completed");
    } catch (e) { say("Something went wrong. Please try again."); }
    finally { busy = false; const b = $("trSubmit"); if (b) b.disabled = false; }
  }

  function init() {
    window.ZenvyroTransfer = { open, close };
    Object.assign(window, {
      zvTrClose: close,
      zvTrToggle: () => { $("trOpts").classList.toggle("on"); $("trSel").classList.toggle("open"); },
      zvTrPick: k => { cur = k; $("trOpts").classList.remove("on"); $("trSel").classList.remove("open"); paint(); saveDraft(true); },
      zvTrOut: e => { const o = $("trOpts"); if (o && o.classList.contains("on") && !o.contains(e.target) && !$("trSel").contains(e.target)) { o.classList.remove("on"); $("trSel").classList.remove("open"); } },
      zvTrIn: () => saveDraft(true),
      zvTrMax: () => { const a = asset(cur), av = window.ZenvyroWalletInfo.avail(cur); $("trAmt").value = av > 0 ? av.toFixed(dp(a)) : ""; saveDraft(true); },
      zvTrClear: () => { $("trTo").value = ""; $("trAmt").value = ""; const c = $("trCard"); if (c) { c.className = "zid-card"; c.innerHTML = ""; } if (window.ZenvyroId && window.ZenvyroId.lookup) window.ZenvyroId.lookup($("trTo"), $("trCard")); clearDraft(); saveDraft(true); say("Form cleared"); },
      zvTrSubmit: submit
    });
    addEventListener("storage", () => { if ($("zvTr")) paint(); });
    document.addEventListener("visibilitychange", () => { if (!document.hidden && $("zvTr")) paint(); });
    addEventListener("pageshow", () => { if ($("zvTr")) paint(); });
    addEventListener("load", () => { const o = window.showSection; if (typeof o === "function") window.showSection = function () { close(); return o.apply(this, arguments); }; });
    const d = loadDraft();
    if (d && d.open) { let n = 0; const iv = setInterval(() => { n++; if (ops() && window.ZenvyroWalletInfo && W()) { clearInterval(iv); open(d.sym, true); } else if (n > 25) clearInterval(iv); }, 300); }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
