/* Zenvyro — Deposit screen. Networks: TRX (TRON, default), Solana, BNB Chain.
   The member says how many TRX to add; for Solana/BNB the coin amount to send is worked out from live prices.
   The admin sets the address and QR per network (admin.html > Menu > Deposits). Requests always arrive in TRX.
   Demo: admin settings and requests live in this browser (localStorage). A server must hold them in the real system. */
(() => {
  "use strict";
  const CFG_KEY = "zenvyro_deposit_cfg_v1", TXKEY = "zenvyro_tx_v1", DKEY = "zenvyro_dp_draft_v1", TTL = 30 * 60 * 1000;
  const NETS = [
    { k: "TRX", coin: "TRX", name: "TRON", icon: "trx" },
    { k: "SOL", coin: "SOL", name: "Solana", icon: "sol" },
    { k: "BNB", coin: "BNB", name: "BNB Chain", icon: "bnb" }
  ];
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const say = m => { if (typeof window.toast === "function") window.toast(m); };
  const net = k => NETS.find(n => n.k === k) || NETS[0];
  const cfgAll = () => { try { const o = JSON.parse(localStorage.getItem(CFG_KEY) || "{}"); return o && typeof o === "object" ? o : {}; } catch (e) { return {}; } };
  const cfgOf = k => { const c = cfgAll()[k] || {}; const address = String(c.address || "").trim(); return { address, qr: c.qr || "", on: c.on !== false && !!address }; };
  const txList = () => { try { const a = JSON.parse(localStorage.getItem(TXKEY) || "[]"); return Array.isArray(a) ? a : []; } catch (e) { return []; } };
  const newId = () => "DP" + Date.now().toString(36).toUpperCase() + Math.floor(Math.random() * 1296).toString(36).toUpperCase();
  const u = n => `calc(${n} * var(--u))`;
  const ART = {"W":480,"H":250,"p":{"hero":[0,0,184,140],"layers":[186,0,52,52],"trx":[240,0,66,68],"link":[308,0,48,50],"coins":[358,0,52,56],"shield":[412,0,46,50],"plane":[0,142,62,64],"empty":[64,142,220,108],"sol":[286,142,68,60],"bnb":[356,142,66,66]}}, AV = "20261114r";
  (window.ZV_ART = window.ZV_ART || []).push("deposit-art.webp?v=" + AV);
  const SV = {
    x: '<svg viewBox="0 0 32 32" fill="none" stroke="#fff" stroke-width="4.200" stroke-linecap="round"><path d="M5 5l22 22M27 5L5 27"/></svg>',
    chvd: '<svg viewBox="0 0 24 14" fill="none" stroke="#fff" stroke-width="3.400" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2l9 9 9-9"/></svg>',
    chv: '<svg viewBox="0 0 14 24" fill="none" stroke="currentColor" stroke-width="3.400" stroke-linecap="round" stroke-linejoin="round"><path d="M2 2l10 10L2 22"/></svg>',
    head: '<svg viewBox="0 0 36 36" fill="none" stroke="#fff" stroke-width="2.800" stroke-linecap="round" stroke-linejoin="round"><path d="M6 21v-3a12 12 0 0 1 24 0v3"/><rect x="3.500" y="19" width="6" height="10" rx="3" fill="#fff"/><rect x="26.500" y="19" width="6" height="10" rx="3" fill="#fff"/><path d="M29.500 29c0 3-3 4-7 4"/></svg>',
    copy: '<svg viewBox="0 0 26 28" fill="none" stroke="#fff" stroke-width="2.600" stroke-linejoin="round"><rect x="9" y="2" width="15" height="18" rx="3.500" fill="#ffffff22"/><path d="M17 25H7a4 4 0 0 1-4-4V9"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="#8a6aff" stroke-width="2.200" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 11v6M12 7.200v.1"/></svg>',
    chk: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.400" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.500l4.500 4.500L19 7.500"/></svg>',
    clock: '<svg viewBox="0 0 32 32" fill="none" stroke="#c4a6ff" stroke-width="2.800" stroke-linecap="round" stroke-linejoin="round"><circle cx="16" cy="16" r="12.500"/><path d="M16 8.500V16l5 3"/></svg>',
    down: '<svg viewBox="0 0 38 38" fill="none" stroke="#fff" stroke-width="3.600" stroke-linecap="round" stroke-linejoin="round"><path d="M19 5v27M8 21l11 11 11-11"/></svg>'
  };
  let cur = "TRX", showAll = false, pollTimer = 0;
  /* Sensitive page: it stays as it is when the app is minimised. The chosen network, TRX amount and TXID are kept in sessionStorage for 30 minutes
     (this tab only), so if the phone reloads the page the sheet opens again with the same values. Cleared after a request is sent. */
  const saveDraft = (open, a, t) => { try { sessionStorage.setItem(DKEY, JSON.stringify({ net: cur, amt: a !== undefined ? a : ($("dpAmt") ? $("dpAmt").value : ""), tx: t !== undefined ? t : ($("dpTx") ? $("dpTx").value : ""), open: !!open, ts: Date.now() })); } catch (e) {} };
  const clearDraft = () => { try { sessionStorage.removeItem(DKEY); } catch (e) {} };
  const loadDraft = () => { try { const d = JSON.parse(sessionStorage.getItem(DKEY) || "null"); if (d && typeof d === "object" && Date.now() - (+d.ts || 0) < TTL) return d; } catch (e) {} return null; };

  function injectCss() {
    if ($("dpCss")) return;
    const spr = Object.keys(ART.p).map(k => { const q = ART.p[k]; return `#zvDp .ds-${k}{display:block;flex-shrink:0;width:${u(q[2])};height:${u(q[3])};background:url(deposit-art.webp?v=${AV}) no-repeat;background-size:${u(ART.W)} ${u(ART.H)};background-position:calc(${-q[0]} * var(--u)) calc(${-q[1]} * var(--u))}`; }).join("\n");
    const st = document.createElement("style"); st.id = "dpCss";
    st.textContent = `
#zvDp{--u:calc(min(100vw,560px)/1024);position:fixed;inset:0;z-index:4;overflow-y:auto;overflow-x:hidden;-webkit-overflow-scrolling:touch;padding:calc(${u(30)} + env(safe-area-inset-top,0px)) 0 calc(130px + env(safe-area-inset-bottom,0px));color:#fff;font-family:Inter,system-ui,-apple-system,"Segoe UI",sans-serif;
background:radial-gradient(ellipse ${u(560)} ${u(360)} at 100% 0,#4a1fb0aa,transparent 70%),radial-gradient(ellipse ${u(520)} ${u(420)} at 0 100%,#3a14a099,transparent 70%),#05031a;background-attachment:local}
#zvDp *{box-sizing:border-box}
#zvDp button{font-family:inherit;color:inherit;cursor:pointer;-webkit-tap-highlight-color:transparent;appearance:none;-webkit-appearance:none}
#zvDp .dp{width:${u(1024)};max-width:100%;margin:0 auto;padding:0 ${u(30)}}
#zvDp .bd{position:relative}
#zvDp .bd:before{content:"";position:absolute;inset:0;border-radius:inherit;padding:${u(2.4)};background:var(--bd,linear-gradient(135deg,#9a7aff,#3a2aa0 50%,#7a4aff));-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);mask-composite:exclude;pointer-events:none;z-index:3}
#zvDp .dh{height:${u(140)};border-radius:${u(45)};overflow:hidden;background:linear-gradient(100deg,#1c0e70 0%,#0c0648 48%,#16085f 100%);--bd:linear-gradient(135deg,#a48aff,#3a2aa0 45%,#7a4aff 80%,#c88aff)}
#zvDp .dh .ds-hero{position:absolute;left:${u(18)};top:0}
#zvDp .dh .ti{position:absolute;left:${u(222)};top:${u(20)};white-space:nowrap}
#zvDp .dh h2{margin:0;font-size:${u(48)};line-height:${u(56)};font-weight:700}
#zvDp .dh p{margin:${u(4)} 0 0;font-size:${u(26)};line-height:${u(32)};color:#c4bcf2}
#zvDp .xc{position:absolute;right:${u(24)};top:${u(30)};width:${u(65)};height:${u(65)};border-radius:${u(20)};border:${u(2.5)} solid #8a6aff;background:#1a1070;display:grid;place-items:center;padding:0;z-index:6;box-shadow:0 0 ${u(16)} #7a4aff55}
#zvDp .xc svg{width:${u(28)};height:${u(28)}}
#zvDp .hp{position:absolute;right:${u(105)};top:${u(30)};width:${u(235)};height:${u(65)};border-radius:${u(33)};border:${u(2.5)} solid #7a5aff;background:#1a1070;display:flex;align-items:center;justify-content:center;gap:${u(12)};padding:0;font-size:${u(24)};font-weight:600;white-space:nowrap}
#zvDp .hp svg.h{width:${u(38)};height:${u(38)}}#zvDp .hp svg.c{width:${u(13)};height:${u(22)}}
#zvDp .dl{display:flex;align-items:center;gap:${u(22)};height:${u(50)};margin:${u(24)} 0 0 ${u(20)};font-size:${u(26)};font-weight:700}
#zvDp .dl .qm{width:${u(34)};height:${u(34)};border-radius:50%;border:0;background:#7a5aff;color:#fff;font-size:${u(22)};font-weight:700;padding:0;margin-left:${u(-8)}}
#zvDp .sel{position:relative;height:${u(81)};margin:${u(4)} ${u(8)} 0 ${u(12)};border-radius:${u(41)};display:flex;align-items:center;gap:${u(34)};padding:0 ${u(42)} 0 ${u(48)};background:#0a0636;--bd:linear-gradient(135deg,#8a5aff,#3a2aa0 50%,#6a3aff);font-size:${u(28)};cursor:pointer}
#zvDp .sel svg{margin-left:auto;width:${u(26)};height:${u(16)}}
#zvDp .sel .ic{display:grid;place-items:center;width:${u(70)};height:${u(70)}}
#zvDp .opts{display:none;margin:${u(8)} ${u(8)} 0 ${u(12)};border-radius:${u(32)};border:${u(2)} solid #4a3aa8;background:#0b0740;overflow:hidden}
#zvDp .opts.on{display:block}
#zvDp .opts button{display:flex;align-items:center;gap:${u(34)};width:100%;height:${u(76)};padding:0 ${u(48)};border:0;border-top:1px solid #4a3ac844;background:transparent;font-size:${u(27)};text-align:left}
#zvDp .opts button:first-child{border-top:0}
#zvDp .opts button.on{background:#2a1a8a88}
#zvDp .opts .ic{display:grid;place-items:center;width:${u(70)};height:${u(60)}}
#zvDp .wn{display:none;align-items:center;gap:${u(28)};height:${u(93)};margin-top:${u(22)};border-radius:${u(30)};border:${u(2.5)} solid #f5b800;padding:0 ${u(30)} 0 ${u(45)};background:linear-gradient(90deg,#4a3000,#7a4a00);box-shadow:0 0 ${u(26)} #f5b80055}
#zvDp .wn.on{display:flex}
#zvDp .wn i{width:${u(56)};height:${u(56)};border-radius:50%;background:#f5c400;color:#3a2600;display:grid;place-items:center;font-style:normal;font-size:${u(38)};font-weight:800;flex-shrink:0}
#zvDp .wn b{display:block;font-size:${u(25)};line-height:${u(32)};color:#ffd21a}
#zvDp .wn small{display:block;font-size:${u(22)};line-height:${u(28)};color:#fff}
#zvDp .qr{height:${u(300)};margin-top:${u(20)};border-radius:${u(45)};background:linear-gradient(120deg,#1a0f6acc,#100a52cc,#220a7a);--bd:linear-gradient(135deg,#a48aff,#4a2ac8 50%,#a46aff);box-shadow:0 0 ${u(30)} #6b32ff44}
#zvDp .qf{position:absolute;left:${u(30)};top:${u(22)};width:${u(252)};height:${u(252)};border-radius:${u(30)};background:#fff;display:grid;place-items:center;overflow:hidden;z-index:2}
#zvDp .qf img{width:100%;height:100%;object-fit:contain;padding:${u(10)};display:block}
#zvDp .qf span{color:#6a6a8a;font-size:${u(22)};text-align:center;padding:0 ${u(20)};line-height:${u(28)}}
#zvDp .vs{position:absolute;left:${u(307)};top:${u(24)};width:1px;height:${u(252)};background:linear-gradient(transparent,#ffffff33,transparent)}
#zvDp .rt{position:absolute;left:${u(332)};right:${u(24)};top:0;bottom:0;z-index:2}
#zvDp .r1{position:absolute;left:0;right:0;top:${u(25)};height:${u(57)};display:flex;align-items:center;gap:${u(22)}}
#zvDp .r1 .ds-link{margin-left:${u(4)}}
#zvDp .r1 b{font-size:${u(27)};font-weight:700;white-space:nowrap}
#zvDp .ac{margin-left:auto;display:flex;align-items:center;gap:${u(12)};height:${u(57)};padding:0 ${u(20)} 0 ${u(12)};border-radius:${u(29)};border:${u(2.5)} solid #1fbf6a;background:#0a3a2a;font-size:${u(22)};font-weight:700;color:#7dff9a}
#zvDp .ac i{width:${u(34)};height:${u(34)};border-radius:50%;background:#1fbf6a;display:grid;place-items:center}
#zvDp .ac i svg{width:${u(20)};height:${u(20)}}
#zvDp .ac.off{border-color:#a8791b;background:#2d2208;color:#ffc24a}#zvDp .ac.off i{background:#a8791b}
#zvDp .ad{position:absolute;left:0;right:0;top:${u(98)};height:${u(77)};border-radius:${u(38)};display:flex;align-items:center;padding-left:${u(26)};background:#070430;--bd:linear-gradient(135deg,#4a3ac8,#2a1a80 50%,#5a3ad0);font-size:${u(29)};white-space:nowrap;overflow:hidden}
#zvDp .ad span.nv{color:#8f86c8;font-size:${u(26)}}
#zvDp .cp{position:absolute;right:0;top:${u(1)};height:${u(75)};width:${u(179)};border-radius:${u(38)};border:0;background:linear-gradient(135deg,#8a4aff,#4a22e0);display:flex;align-items:center;justify-content:center;gap:${u(12)};font-size:${u(28)};font-weight:700;color:#fff;z-index:4;padding:0}
#zvDp .cp svg{width:${u(30)};height:${u(32)}}
#zvDp .r3{position:absolute;left:${u(6)};top:${u(197)};right:0;display:flex;gap:${u(22)}}
#zvDp .r3 svg{width:${u(40)};height:${u(40)};flex-shrink:0}
#zvDp .r3 p{margin:${u(-2)} 0 0;font-size:${u(22)};line-height:${u(27)};color:#e8e2ff}
#zvDp .r3 p b{color:#ffd21a}
#zvDp .af{display:flex;align-items:center;height:${u(82)};margin:${u(6)} ${u(2)} 0;border-radius:${u(41)};padding-left:${u(33)};gap:${u(24)};background:#0a0636;--bd:linear-gradient(135deg,#6a4aff,#2a1a80 50%,#5a3ad0)}
#zvDp .af input{flex:1;min-width:0;border:0;outline:0;background:transparent;color:#fff;font-family:inherit;font-weight:500;font-size:max(16px,${u(27)});padding:0}
#zvDp .af input::placeholder{color:#9a90d0}
#zvDp .af .v{flex:1;min-width:0;font-size:${u(28)};font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#zvDp .af .v.ph{color:#9a90d0;font-weight:500;font-size:${u(25)}}
#zvDp .af .pl{height:${u(82)};min-width:${u(154)};padding:0 ${u(26)};border-radius:${u(41)};background:linear-gradient(135deg,#8a4aff,#4a22e0);display:grid;place-items:center;font-size:${u(28)};font-weight:700;z-index:4}
#zvDp .af .ic{display:grid;place-items:center;width:${u(66)};height:${u(66)}}
#zvDp .pn{margin:${u(8)} ${u(24)} 0;font-size:${u(21)};line-height:${u(28)};color:#a89ce8}
#zvDp .tx{display:block;width:calc(100% - ${u(4)});margin:${u(8)} ${u(2)} 0;height:${u(68)};border-radius:${u(34)};border:${u(2)} solid #4a3aa8;background:#06042a;color:#fff;padding:0 ${u(22)};font-family:inherit;font-size:max(16px,${u(24)});outline:0}
#zvDp .tx::placeholder{color:#9a90d0}
#zvDp .sb{display:flex;align-items:center;justify-content:center;gap:${u(34)};width:calc(100% - ${u(4)});height:${u(106)};margin:${u(28)} ${u(2)} 0;border-radius:${u(53)};border:${u(2)} solid #ffffff66;background:linear-gradient(90deg,#e04fd8 0%,#8a3dff 48%,#4a8aff 100%);box-shadow:0 0 ${u(36)} #8a3dff77;text-align:left;padding:0}
#zvDp .sb b{display:block;font-size:${u(31)};line-height:${u(38)};font-weight:700}
#zvDp .sb small{display:block;font-size:${u(22)};line-height:${u(28)};color:#f3eeff}
#zvDp .hs{margin-top:${u(33)};min-height:${u(271)};padding-bottom:${u(20)};border-radius:${u(45)};background:linear-gradient(135deg,#150a5acc,#0c0844cc);--bd:linear-gradient(135deg,#a48aff,#3a2aa0 50%,#7a4aff)}
#zvDp .hh{display:flex;align-items:center;height:${u(80)};padding:0 ${u(22)} 0 ${u(27)}}
#zvDp .hh svg{width:${u(44)};height:${u(44)}}
#zvDp .hh b{margin-left:${u(23)};font-size:${u(25)};font-weight:700}
#zvDp .hh button{margin-left:auto;display:flex;align-items:center;gap:${u(10)};height:${u(52)};padding:0 ${u(22)};border-radius:${u(26)};border:${u(2)} solid #6a4aff;background:transparent;font-size:${u(22)};font-weight:600;z-index:4;position:relative}
#zvDp .hh button svg{width:${u(11)};height:${u(18)}}
#zvDp .em{text-align:center;padding-top:${u(6)}}
#zvDp .em .ds-empty{margin:0 auto}
#zvDp .em b{display:block;margin-top:${u(6)};font-size:${u(27)};line-height:${u(34)};font-weight:700}
#zvDp .em small{display:block;font-size:${u(22)};line-height:${u(30)};color:#c4bcf2}
#zvDp .hr{display:flex;align-items:center;min-height:${u(88)};margin:0 ${u(20)};padding:0 ${u(10)};border-top:1px solid #4a3ac844}
#zvDp .hr .ti{width:${u(56)};height:${u(56)};border-radius:50%;background:linear-gradient(160deg,#35d0a0,#16856a);display:grid;place-items:center;flex-shrink:0}
#zvDp .hr .ti svg{width:${u(28)};height:${u(28)}}
#zvDp .hr .md{margin-left:${u(26)};min-width:0;flex:1}
#zvDp .hr .md b{display:block;font-size:${u(26)};line-height:${u(32)};font-weight:700}
#zvDp .hr .md small{display:block;font-size:${u(20)};line-height:${u(28)};color:#a89ce8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#zvDp .hr .rs{font-size:${u(22)};font-weight:700;white-space:nowrap;margin-left:${u(10)};color:#7dff9a}
#zvDp .hr .rs.pe{color:#ffc24a}#zvDp .hr .rs.ac{color:#6ab8ff}#zvDp .hr .rs.rj{color:#ff7a90}
#zvDp .nt{margin:${u(24)} ${u(20)} 0;font-size:${u(21)};line-height:${u(30)};color:#8f86c8}
${spr}`;
    document.head.appendChild(st);
  }

  const icon = k => `<i class="ds-${net(k).icon}"></i>`;
  const short = a => a.length > 22 ? a.slice(0, 10) + "..." + a.slice(-8) : a;
  const fmtCoin = n => { let s = (Math.ceil(n * 1e6 - 1e-9) / 1e6).toFixed(6).replace(/0+$/, ""); if (s.endsWith(".")) s = s.slice(0, -1); return s; };
  const prices = () => (window.ZenvyroWallet && window.ZenvyroWallet.prices ? window.ZenvyroWallet.prices() : {});

  function html() {
    const opts = NETS.map(n => `<button data-n="${n.k}" onclick="zvDpPick('${n.k}')"><span class="ic"><i class="ds-${n.icon}"></i></span>${n.coin} · ${n.name}</button>`).join("");
    return `<div class="dp">
      <div class="dh bd"><i class="ds-hero"></i><div class="ti"><h2>Deposit</h2><p>Add funds to your account</p></div><button class="hp" onclick="zvDpHelp()">${SV.head.replace("<svg", '<svg class="h"')}Need Help?${SV.chv.replace("<svg", '<svg class="c"').replace("currentColor", "#fff")}</button><button class="xc" aria-label="Close" onclick="zvDpClose()">${SV.x}</button></div>
      <div class="dl"><i class="ds-layers"></i>Select Asset</div>
      <div class="sel bd" id="dpSel" onclick="zvDpToggle()"><span class="ic" id="dpSelIc"></span><span id="dpSelTx"></span>${SV.chvd}</div>
      <div class="opts" id="dpOpts">${opts}</div>
      <div class="wn" id="dpWarn"></div>
      <div class="qr bd"><div class="qf" id="dpQr"></div><span class="vs"></span>
        <div class="rt"><div class="r1"><i class="ds-link"></i><b>Your Deposit Address</b><span class="ac" id="dpAct"></span></div>
          <div class="ad bd"><span id="dpAddr"></span><button class="cp" onclick="zvDpCopy()">${SV.copy}Copy</button></div>
          <div class="r3">${SV.info}<p id="dpNote"></p></div></div></div>
      <div class="dl"><i class="ds-layers"></i>TRX to Add to Your Wallet</div>
      <div class="af bd"><span class="ic"><i class="ds-trx"></i></span><input id="dpAmt" type="number" inputmode="decimal" step="any" min="0" placeholder="Enter TRX amount (e.g. 100)" oninput="zvDpCalc()"><span class="pl">TRX</span></div>
      <div class="dl"><i class="ds-coins"></i>Amount You Will Send</div>
      <div class="af bd"><span class="ic" id="dpSendIc"></span><span class="v ph" id="dpSendVal">Enter the TRX amount first</span><span class="pl" id="dpSendCoin">TRX</span></div>
      <div class="pn" id="dpPn"></div>
      <div class="dl"><i class="ds-shield"></i>Transaction ID (TXID)<button class="qm" aria-label="What is a TXID" onclick="zvDpQ()">?</button></div>
      <input class="tx" id="dpTx" oninput="zvDpSave()" type="text" placeholder="Enter Transaction ID (TXID) from blockchain..." autocomplete="off" autocapitalize="off" spellcheck="false">
      <button class="sb" id="dpSubmit" onclick="zvDpSubmit()"><i class="ds-plane"></i><span><b>Submit Deposit Request</b><small>Confirm your deposit details</small></span></button>
      <div class="hs bd"><div class="hh">${SV.clock}<b>Deposit History</b><button id="dpVA" onclick="zvDpAll()">View All${SV.chv}</button></div><div id="dpHist"></div></div>
      <div class="nt">Once an admin checks your transaction and accepts it, the TRX amount is added to your Wallet. If it is rejected, nothing is added. Send only the coin and network shown above.</div>
    </div>`;
  }

  function calc() {
    const el = $("dpAmt"), T = el ? Math.max(0, parseFloat(el.value) || 0) : 0, n = net(cur), p = prices();
    if (!(T > 0)) return { T, ok: false, msg: "empty" };
    if (n.k === "TRX") return { T, ok: true, coinAmt: T, pTrx: p.TRX || 0 };
    if (!(p.TRX > 0) || !(p[n.coin] > 0)) return { T, ok: false, msg: "price" };
    return { T, ok: true, coinAmt: T * p.TRX / p[n.coin], pTrx: p.TRX, perTrx: p.TRX / p[n.coin] };
  }
  function paintSend() {
    if (!$("dpSendVal")) return;
    const n = net(cur), c = calc(), v = $("dpSendVal"), pn = $("dpPn");
    $("dpSendIc").innerHTML = icon(cur); $("dpSendCoin").textContent = n.coin;
    if (c.ok) { v.className = "v"; v.textContent = (n.k === "TRX" ? "" : "≈ ") + fmtCoin(c.coinAmt) + " " + n.coin; }
    else { v.className = "v ph"; v.textContent = c.msg === "price" ? (window.__dpPriceFail ? "Live price unavailable" : "Loading live price…") : "Enter the TRX amount first"; }
    pn.textContent = n.k === "TRX" ? "Send exactly this amount of TRX on the TRON network." : (c.perTrx ? `Live price: 1 TRX ≈ ${fmtCoin(c.perTrx)} ${n.coin}. The admin checks the real value when accepting.` : (c.msg === "price" ? "Working out the amount from live prices…" : `The ${n.coin} amount is worked out from live prices.`));
  }
  function paintNet() {
    const n = net(cur), c = cfgOf(cur);
    $("dpSelIc").innerHTML = icon(cur); $("dpSelTx").textContent = n.coin + " · " + n.name;
    document.querySelectorAll("#dpOpts button").forEach(b => b.classList.toggle("on", b.dataset.n === cur));
    const w = $("dpWarn");
    if (!c.address) { w.className = "wn on"; w.innerHTML = '<i>!</i><div><b>The deposit address is not set yet (demo).</b><small>Do not send any funds until a real address is shown.</small></div>'; }
    else if (cfgAll()[cur] && cfgAll()[cur].on === false) { w.className = "wn on"; w.innerHTML = `<i>!</i><div><b>Deposits on ${esc(n.name)} are paused right now.</b><small>Please choose another network or try later.</small></div>`; }
    else w.className = "wn";
    $("dpQr").innerHTML = c.qr ? `<img src="${esc(c.qr)}" alt="QR code">` : '<span>QR code not set yet</span>';
    $("dpAddr").innerHTML = c.address ? esc(short(c.address)) : '<span class="nv">Not set yet</span>';
    const act = $("dpAct"); act.className = "ac" + (c.on ? "" : " off"); act.innerHTML = `<i>${SV.chk}</i>${c.on ? "Active" : "Inactive"}`;
    $("dpNote").innerHTML = (n.k === "TRX" ? "Send only <b>TRX</b> to this address." : `Send only <b>${n.coin}</b> on the ${esc(n.name)} network to this address.`) + "<br>Sending other assets may result in permanent loss of funds.";
    paintSend();
  }
  function statusOf(t) { return t.status === "pending" ? ["Pending", "pe"] : t.status === "accepted" ? ["Accepted", "ac"] : t.status === "rejected" ? ["Rejected", "rj"] : ["Completed", ""]; }
  function paintHist() {
    const el = $("dpHist"); if (!el) return;
    const list = txList().filter(t => t && t.kind === "deposit").sort((a, b) => (b.ts || 0) - (a.ts || 0));
    const va = $("dpVA"); if (va) va.style.display = list.length > 3 ? "flex" : "none";
    if (!list.length) { el.innerHTML = '<div class="em"><i class="ds-empty"></i><b>No deposit history yet</b><small>Your deposit transactions will appear here.</small></div>'; return; }
    el.innerHTML = list.slice(0, showAll ? 20 : 3).map(t => {
      const s = statusOf(t), d = new Date(t.ts || Date.now()).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
      const amt = (+t.credit || +t.amount || 0), sub = t.sendAmount ? `Sent ${fmtCoin(+t.sendAmount)} ${esc(t.sendCoin || "")} · ${d}` : `${esc(t.sub || "")} · ${d}`;
      return `<div class="hr"><span class="ti">${SV.down}</span><div class="md"><b>${fmtCoin(amt)} ${esc(t.sym || "TRX")}</b><small>${sub}</small></div><span class="rs ${s[1]}">${s[0]}</span></div>`;
    }).join("");
    if (va) va.firstChild.textContent = showAll ? "Show Less" : "View All";
  }

  function open(sym, restore) {
    if (window.ZenvyroSettings && window.ZenvyroSettings.block("deposit")) return;
    injectCss(); const old = $("zvDp"); if (old) old.remove();
    const d = loadDraft(), keep = d && NETS.some(n => n.k === d.net) && (restore || !sym || sym === d.net);
    cur = keep ? d.net : (NETS.some(n => n.k === sym) ? sym : "TRX"); showAll = false;
    const ov = document.createElement("div"); ov.id = "zvDp"; ov.innerHTML = html(); document.body.appendChild(ov);
    paintNet(); paintHist();
    if (keep) { $("dpAmt").value = d.amt || ""; $("dpTx").value = d.tx || ""; paintSend(); }
    saveDraft(true);
    window.__dpPriceFail = false;
    try { if (window.ZenvyroWallet && window.ZenvyroWallet.ensurePrices) window.ZenvyroWallet.ensurePrices(); } catch (e) {}
    let tries = 0; clearInterval(pollTimer);
    pollTimer = setInterval(() => { tries++; if ((prices().TRX > 0) || tries > 14 || !$("zvDp")) { clearInterval(pollTimer); if (!(prices().TRX > 0)) window.__dpPriceFail = true; } paintSend(); }, 700);
  }
  function close() {
    const ov = $("zvDp");
    if (ov) { const a = $("dpAmt") ? $("dpAmt").value : "", t = $("dpTx") ? $("dpTx").value : ""; ov.remove(); if (a || t) saveDraft(false, a, t); else clearDraft(); }
    clearInterval(pollTimer);
  }

  function submit() {
    if (window.ZenvyroSettings && window.ZenvyroSettings.block("deposit")) return;
    const n = net(cur), c = cfgOf(cur), all = cfgAll()[cur] || {}, k = calc(), txid = ($("dpTx").value || "").trim();
    if (!c.address || all.on === false) return say("The deposit address is not available yet");
    if (!(k.T > 0)) return say("Enter how many TRX you want to add");
    if (!k.ok) return say("Live price is not ready yet. Try again in a moment");
    if (txid.length < 16 || /\s/.test(txid)) return say("Enter the full transaction ID (TXID)");
    if (txList().some(t => t && t.kind === "deposit" && String(t.txid || "").toLowerCase() === txid.toLowerCase())) return say("This TXID was already submitted");
    window.ZenvyroTx.log({ id: newId(), kind: "deposit", sym: "TRX", amount: k.T, status: "pending", sub: n.coin + " (" + n.name + ")", txid, net: n.k, netName: n.name, sendCoin: n.coin, sendAmount: k.coinAmt, usdt: k.pTrx > 0 ? Math.round(k.T * k.pTrx * 100) / 100 : 0 });
    $("dpAmt").value = ""; $("dpTx").value = ""; saveDraft(true); paintSend(); showAll = false; paintHist();
    say("Deposit request sent. You will see it in Deposit History");
  }

  function init() {
    window.ZenvyroDeposit = { open, close };
    Object.assign(window, {
      zvDpToggle: () => $("dpOpts").classList.toggle("on"),
      zvDpPick: k => { cur = k; $("dpOpts").classList.remove("on"); paintNet(); saveDraft(true); },
      zvDpClose: close, zvDpSave: () => saveDraft(true),
      zvDpCalc: () => { paintSend(); saveDraft(true); }, zvDpSubmit: submit, zvDpAll: () => { showAll = !showAll; paintHist(); },
      zvDpQ: () => say("The TXID (hash) is shown in your wallet or exchange after you send the coins"),
      zvDpCopy: () => { const a = cfgOf(cur).address; if (!a) return say("The deposit address is not set yet"); if (navigator.clipboard) navigator.clipboard.writeText(a).then(() => say("Address copied")).catch(() => say(a)); else say(a); },
      zvDpHelp: () => window.openModal("Deposit Help", '<div class="modal-list"><div><strong>1. Choose</strong><span>TRX, Solana or BNB</span></div><div><strong>2. Enter</strong><span>how many TRX to add</span></div><div><strong>3. Send</strong><span>the amount shown, to the address shown</span></div><div><strong>4. Paste</strong><span>the TXID and submit</span></div></div><div class="modal-note">An admin checks your transaction. After it is accepted, the TRX amount is added to your Wallet.</div>')
    });
    addEventListener("storage", e => { if (e.key === TXKEY || e.key === CFG_KEY) { if ($("zvDp")) { paintNet(); paintHist(); } } });
    document.addEventListener("visibilitychange", () => { if (!document.hidden && $("zvDp")) { paintNet(); paintHist(); } });
    addEventListener("pageshow", () => { if ($("zvDp")) { paintNet(); paintHist(); } });
    const dr = loadDraft();
    if (dr && dr.open) { let n = 0; const iv = setInterval(() => { n++; if (window.ZenvyroWallet && window.ZenvyroTx) { clearInterval(iv); open(dr.net, true); } else if (n > 25) clearInterval(iv); }, 300); }
    addEventListener("load", () => { const o = window.showSection; if (typeof o === "function") window.showSection = function () { close(); return o.apply(this, arguments); }; });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
