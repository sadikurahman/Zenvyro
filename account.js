/* Zenvyro — Step 4a: Account page (profile, Personal Info, Security & Privacy, Help & Support + Refer & Earn)
   JavaScript only; styles are scoped to #zvAccount.
   Password/2FA/KYC/login history and similar must really be done on a backend. Without one, these are
   not shown as working. Config: window.ZENVYRO_USER, ZENVYRO_AUTH, ZENVYRO_SUPPORT, ZENVYRO_PRIVACY_URL */
(() => {
  "use strict";

  const PKEY = "zenvyro_profile_v1", AKEY = "zenvyro_avatar_v1", NKEY = "zenvyro_notif_v1",
        LKEY = "zenvyro_logins_v1", IKEY = "zenvyro_memberid_v1";
  const $ = id => document.getElementById(id);
  const say = m => { if (typeof window.toast === "function") window.toast(m); };
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const jget = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k) || "null"); return v === null ? d : v; } catch (e) { return d; } };
  const jset = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  const M = () => window.ZenvyroMining && window.ZenvyroMining.getState();

  // ---- Profile ----
  const cfg = () => window.ZENVYRO_USER || {};
  function siteName() {
    const h = document.querySelector(".welcome h1");
    return h ? h.textContent.replace("✦", "").trim() : "Member";
  }
  function profile() {
    const p = jget(PKEY, {});
    return {
      name: String(p.name || cfg().name || siteName()).slice(0, 40),
      title: String(p.title || cfg().title || "Member").slice(0, 40),
      verified: !!cfg().verified
    };
  }
  function memberId() {
    if (cfg().memberId || window.ZENVYRO_MEMBER_ID) return cfg().memberId || window.ZENVYRO_MEMBER_ID;
    let id = null; try { id = localStorage.getItem(IKEY); } catch (e) {}
    if (!id) { id = "ZNV-" + String(Math.floor(100000 + Math.random() * 900000)); try { localStorage.setItem(IKEY, id); } catch (e) {} }
    return id;
  }
  function applyName() { const h = document.querySelector(".welcome h1"); if (h) h.textContent = profile().name + " ✦"; }

  // this device's login/visit record (local only)
  (function recordVisit() {
    const list = jget(LKEY, []), now = Date.now();
    if (!list.length || now - list[0].ts > 30 * 60 * 1000) {
      const ua = navigator.userAgent || "";
      const dev = /iPhone|iPad/.test(ua) ? "iPhone/iPad" : /Android/.test(ua) ? "Android" : /Windows/.test(ua) ? "Windows" : /Mac/.test(ua) ? "Mac" : "Device";
      const br = /CriOS|Chrome/.test(ua) ? "Chrome" : /Safari/.test(ua) ? "Safari" : /Firefox/.test(ua) ? "Firefox" : "Browser";
      list.unshift({ ts: now, dev: dev + " · " + br });
      jset(LKEY, list.slice(0, 10));
    }
  })();

  // ---- Icons (inline SVG, no emoji) ----
  const PATHS = {
    bell: '<path d="M6 17v-6a6 6 0 1 1 12 0v6l1.5 2h-15z"/><path d="M10 21a2 2 0 0 0 4 0"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4.5 21c0-4.2 3.3-6.8 7.5-6.8s7.5 2.6 7.5 6.8"/>',
    camera: '<path d="M4 8h3l2-2.5h6L17 8h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13.5" r="3.5"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6"/><circle cx="17" cy="9" r="2.6"/><path d="M17.5 14.2c2.4.2 4 2 4 4.8"/>',
    pick: '<path d="M5 20L14.5 10.5"/><path d="M4 10c2-3.6 6.2-5.4 10.5-4.4C15.6 10 14 14 10 16"/>',
    wallet: '<path d="M3 8a2.5 2.5 0 0 1 2.5-2.5H18V8"/><rect x="3" y="8" width="18" height="11.5" rx="2.5"/><path d="M16 13.8h2.6"/>',
    shield: '<path d="M12 3l7.5 3v5.5c0 4.5-3.1 8.2-7.5 9.5-4.4-1.3-7.5-5-7.5-9.5V6z"/>',
    shieldCheck: '<path d="M12 3l7.5 3v5.5c0 4.5-3.1 8.2-7.5 9.5-4.4-1.3-7.5-5-7.5-9.5V6z"/><path d="M8.7 12l2.3 2.3 4.3-4.6"/>',
    crown: '<path d="M3.5 8l4.5 4 4-7 4 7 4.5-4-1.8 10.5H5.3z"/><path d="M5.5 21h13"/>',
    gift: '<rect x="3.5" y="9" width="17" height="11" rx="1.5"/><path d="M12 9v11M3.5 13.5h17"/><path d="M12 9c-3 0-5-1-5-3a2 2 0 0 1 4-.5C11.7 7 12 9 12 9zm0 0c3 0 5-1 5-3a2 2 0 0 0-4-.5C12.3 7 12 9 12 9z"/>',
    lock: '<rect x="5" y="10.5" width="14" height="10" rx="2.2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
    doc: '<path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4M10 12h5M10 15.5h5"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.6a2.6 2.6 0 1 1 3.6 2.4c-.7.4-1.1 1-1.1 1.8M12 17h.01"/>',
    mail: '<rect x="3" y="5.5" width="18" height="13" rx="2.2"/><path d="M3.5 7.5l8.5 6 8.5-6"/>',
    logout: '<path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3"/><path d="M15 8l4 4-4 4M19 12H9"/>',
    chev: '<path d="M9 5l7 7-7 7"/>',
    headset: '<path d="M4.5 14v-2a7.5 7.5 0 0 1 15 0v2"/><rect x="3.5" y="13" width="4" height="6" rx="1.5"/><rect x="16.5" y="13" width="4" height="6" rx="1.5"/><path d="M18.5 19c0 1.5-2 2.5-5 2.5"/>',
    userShield: '<circle cx="10" cy="8" r="3.5"/><path d="M3.5 20c0-3.4 2.7-5.8 6.5-5.8"/><path d="M17 13l3.5 1.4v2.6c0 2-1.5 3.4-3.5 4-2-.6-3.5-2-3.5-4v-2.6z"/>',
    check: '<path d="M5 12.5l4.2 4.2L19 7"/>'
  };
  const ic = n => `<svg class="zi" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${PATHS[n]}</svg>`;
  const SVG_AVATAR = '<svg class="zi" viewBox="0 0 24 24" fill="#c9b8ff" aria-hidden="true"><circle cx="12" cy="8.4" r="4.3"/><path d="M3.6 21c.6-4.7 4.2-7.1 8.4-7.1s7.8 2.4 8.4 7.1z"/></svg>';
  const SVG_TICK = '<svg class="vf" viewBox="0 0 24 24" aria-label="Premium member"><path fill="#2f8bff" d="M12 1.8l2.5 1.9 3.1-.2 1 2.9 2.6 1.8-.9 3 .9 3-2.6 1.8-1 2.9-3.1-.2L12 22.2l-2.5-1.9-3.1.2-1-2.9-2.6-1.8.9-3-.9-3 2.6-1.8 1-2.9 3.1.2z"/><path d="M8 12.2l2.7 2.7 5-5.4" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const SVG_HEART = '<svg viewBox="0 0 24 24" width="15" height="15" fill="#a98bff" aria-hidden="true"><path d="M12 21s-8.5-5.2-8.5-11.2A4.6 4.6 0 0 1 12 7.4a4.6 4.6 0 0 1 8.5 2.4C20.5 15.8 12 21 12 21z"/></svg>';
  const SVG_SHIELD_BIG = '<svg viewBox="0 0 140 130" aria-hidden="true"><defs><linearGradient id="zvsg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#b98aff"/><stop offset="1" stop-color="#5a2fe0"/></linearGradient></defs><ellipse cx="70" cy="68" rx="64" ry="22" fill="none" stroke="#8a5cff" stroke-opacity=".45" transform="rotate(-18 70 68)"/><path d="M70 6l42 16v34c0 31-18 52-42 63-24-11-42-32-42-63V22z" fill="url(#zvsg)" stroke="#dcc0ff" stroke-width="2"/><rect x="52" y="52" width="36" height="29" rx="6" fill="#f3eaff"/><path d="M58 52v-7a12 12 0 0 1 24 0v7" fill="none" stroke="#f3eaff" stroke-width="6" stroke-linecap="round"/><circle cx="70" cy="66" r="4.2" fill="#5a2fe0"/></svg>';

  // ---- Membership packs (benefits shown when tapping the badge; commission rates are not shown) ----
  const PACKS = {
    Free: { rate: 0.001984, ben: ["Referral Commission Income", "Basic Mining Dashboard", "Hourly Coin Counter", "Referral Link & History"] },
    Standard: { rate: 0.002778, ben: ["Referral Commission Income", "Earning History", "Daily Reward Statistics", "Standard Support"] },
    Silver: { rate: 0.008681, ben: ["Referral Commission Income", "Advanced Earning Statistics", "Daily & Monthly Reward Reports", "Faster Support"] },
    Gold: { rate: 0.021701, ben: ["Referral Commission Income", "Detailed Mining & Reward Reports", "Withdrawal Status Alerts", "Priority Support"] },
    Platinum: { rate: 0.063131, ben: ["Referral Commission Income", "Advanced Analytics Dashboard", "Detailed Transaction & Reward History", "Premium Account Support", "Highest Reward Allocation"] }
  };

  // ---- CSS ----
  const css = `
#zvAccount{position:fixed;inset:0;z-index:4;overflow-y:auto;-webkit-overflow-scrolling:touch;display:none;padding:calc(14px + env(safe-area-inset-top,0px)) 14px 210px;background:radial-gradient(ellipse at 50% 0,#2b1475 0,#0a0720 46%,#04040e 100%);color:#fff}
#zvAccount.open{display:block}
#zvAccount .in{max-width:1000px;margin:auto}
#zvAccount .zi{width:1em;height:1em;display:block;flex-shrink:0}
#zvAccount .top{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px}
#zvAccount .logo{display:flex;gap:10px;align-items:center}
#zvAccount .z{font-size:40px;font-weight:900;font-style:italic;color:#cda5ff;text-shadow:0 0 18px #8a32ff;line-height:1}
#zvAccount .brand b{letter-spacing:5px;font-size:20px;display:block}
#zvAccount .brand small{color:#b7b5ec;font-size:11px;letter-spacing:1px}
#zvAccount .tools{display:flex;gap:4px}
#zvAccount .ic{width:44px;height:44px;border-radius:14px;border:0;background:none;display:grid;place-items:center;font-size:25px;color:#d9ceff;position:relative;padding:0}
#zvAccount .dot{position:absolute;top:7px;right:9px;width:10px;height:10px;border-radius:50%;background:#ff4466}
#zvAccount .card{border:1px solid #5a35d8;border-radius:22px;background:linear-gradient(135deg,#150c4ee6,#0b0830f2);box-shadow:0 0 28px #6b32ff2a,inset 0 0 0 1px #2e1d7a;margin-bottom:14px;overflow:hidden}
#zvAccount .prof{padding:12px 14px 0}
#zvAccount .pt{display:flex;justify-content:flex-end;margin-bottom:6px}
#zvAccount .prem{display:inline-flex;align-items:center;gap:5px;border:1px solid #d8a93a;border-radius:16px;background:#2a1d08;color:#ffd36b;padding:4px 9px 4px 8px;font-size:11px;font-weight:700;line-height:1.2}
#zvAccount .prem .zi{font-size:13px}
#zvAccount .prem .zi.ch2{font-size:11px;margin-left:-1px}
#zvAccount .pr{display:flex;gap:14px;align-items:center;padding:0 2px 14px}
#zvAccount .av{width:86px;height:86px;border-radius:50%;border:3px solid #9a5cff;box-shadow:0 0 22px #8a3dff80;background:#1a1058 center/cover;display:grid;place-items:center;font-size:52px;position:relative;flex-shrink:0}
#zvAccount .cam{position:absolute;right:-4px;bottom:-4px;width:32px;height:32px;border-radius:50%;background:#2a1a86;border:2px solid #9a5cff;display:grid;place-items:center;font-size:16px;color:#fff;padding:0}
#zvAccount .who{min-width:0;flex:1}
#zvAccount .nm{font-size:22px;font-weight:800;display:flex;align-items:center;gap:7px;line-height:1.2;overflow-wrap:anywhere}
#zvAccount .vf{width:22px;height:22px;flex-shrink:0}
#zvAccount .tt{color:#b7a8ff;font-size:15px;margin:2px 0 8px}
#zvAccount .mid{display:inline-block;border:1px solid #6b45d8;border-radius:18px;background:#1a1058;padding:5px 11px;font-size:12.5px;color:#cfc4ff;white-space:nowrap}
#zvAccount .stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));border-top:1px solid #2a2170;margin:0 -14px}
#zvAccount .stat{display:flex;flex-direction:column;align-items:flex-start;gap:6px;padding:12px 8px 12px 10px;background:none;border:0;border-radius:0;border-right:1px solid #2a2170;color:#fff;text-align:left;min-width:0}
#zvAccount .stat:last-child{border-right:0}
#zvAccount .stat .si{font-size:21px;color:#b28aff}
#zvAccount .stat small{display:block;color:#c8b8ff;font-size:10.5px;line-height:1.2}
#zvAccount .stat b{display:block;font-size:clamp(12px,3.6vw,17px);line-height:1.15;white-space:nowrap}
#zvAccount .stat b i{display:block;font-style:normal;font-size:9px;color:#c8b8ff;font-weight:700;letter-spacing:.5px}
#zvAccount .stat .ch{display:none}
#zvAccount .grn{color:#2bf0b0}
#zvAccount .grn:before{content:'';display:inline-block;width:7px;height:7px;border-radius:50%;background:#2bf0b0;margin-right:5px;vertical-align:1px;box-shadow:0 0 8px #2bf0b0}
@media(min-width:560px){
 #zvAccount .stat{flex-direction:row;align-items:center;gap:10px;padding:13px 14px}
 #zvAccount .stat .ch{display:block;margin-left:auto;font-size:16px;color:#a98bff}
 #zvAccount .stat b{font-size:17px}
 #zvAccount .stat b i{display:inline;margin-left:4px;font-size:12px}
 #zvAccount .stat small{font-size:12px}
}
#zvAccount .ban{display:flex;align-items:center;gap:12px;padding:14px 16px;background:linear-gradient(100deg,#3a1b9a,#150c4e 60%)}
#zvAccount .ban .cr{font-size:38px;color:#f3c969;filter:drop-shadow(0 0 10px #f3c96966)}
#zvAccount .ban .bt{flex:1;min-width:0}#zvAccount .ban b{font-size:17px;display:block}#zvAccount .ban small{color:#c8b8ff;font-size:12px}
#zvAccount .ban button{display:inline-flex;align-items:center;gap:4px;border:1px solid #9a6cff;border-radius:24px;background:linear-gradient(100deg,#8a33ff,#4a2bd0);color:#fff;font-weight:800;padding:11px 14px;font-size:14px;white-space:nowrap}
#zvAccount .ban button .zi{font-size:14px}
#zvAccount .grid{display:grid;grid-template-columns:1fr;gap:0}
@media(min-width:820px){#zvAccount .grid{grid-template-columns:1.6fr 1fr;gap:14px;align-items:start}}
#zvAccount .sh{display:flex;align-items:center;gap:10px;padding:12px 16px;font-weight:800;font-size:17px;background:#1b1160;border-bottom:1px solid #2a2170}
#zvAccount .sh .zi{font-size:20px;color:#c9b4ff}
#zvAccount .zr{display:flex;align-items:center;gap:12px;width:100%;padding:11px 16px;background:none;border:0;border-top:1px solid #231a66;color:#fff;text-align:left}
#zvAccount .sh+.zr{border-top:0}
#zvAccount .ri{width:44px;height:44px;border-radius:50%;border:1px solid #6b45d8;background:#1a1058;display:grid;place-items:center;font-size:20px;flex-shrink:0;color:#d6c8ff}
#zvAccount .rt{flex:1;min-width:0}#zvAccount .rt b{display:block;font-size:15px}#zvAccount .rt small{color:#b9b2ee;font-size:12px}
#zvAccount .zr>.ch{font-size:18px;color:#a98bff}
#zvAccount .lo{position:fixed;left:0;right:0;bottom:80px;z-index:4;padding:10px 14px 8px;display:flex;justify-content:center;pointer-events:none;background:linear-gradient(180deg,#04040e00,#04040ef2 38%)}
#zvAccount .lo button{pointer-events:auto;width:100%;max-width:972px;border:1px solid #d83a7a;border-radius:16px;background:#2a0c24;color:#ff6fa0;padding:13px 16px;display:flex;align-items:center;gap:12px;font-weight:700;font-size:15px}
#zvAccount .lo button .zi{font-size:22px}
#zvAccount .lo button .zi:last-child{font-size:18px}
#zvAccount .side{border:1px solid #5a35d8;border-radius:22px;background:linear-gradient(160deg,#1a0f5a,#0a0730);padding:18px 16px;margin-bottom:14px}
#zvAccount .shield{width:130px;margin:0 auto;filter:drop-shadow(0 0 22px #8a3dff99)}
#zvAccount .shield svg{display:block;width:100%;height:auto}
#zvAccount .side h3{margin:8px 0 6px;font-size:21px;line-height:1.2}
#zvAccount .side p{color:#c8b8ff;font-size:14px;margin:0 0 12px;line-height:1.5}
#zvAccount .chip{display:flex;align-items:center;gap:12px;border:1px solid #3a2a96;border-radius:16px;background:#120c40;padding:11px 12px;margin-bottom:9px}
#zvAccount .chip span.ci{width:40px;height:40px;border-radius:50%;background:#2a1a86;display:grid;place-items:center;font-size:19px;color:#d6c8ff;flex-shrink:0}
#zvAccount .chip b{font-size:14px;display:block}#zvAccount .chip small{color:#b9b2ee;font-size:12px}
#zvAccount .sig{font-family:'Brush Script MT','Snell Roundhand',cursive;font-style:italic;color:#a98bff;font-size:24px;text-align:center;margin-top:14px;display:flex;justify-content:center;align-items:center;gap:6px}
.zv-sw{position:relative;width:52px;height:30px;border-radius:20px;background:#2b2570;flex-shrink:0;border:0;padding:0}
.zv-sw:after{content:'';position:absolute;top:3px;left:3px;width:24px;height:24px;border-radius:50%;background:#fff;transition:.2s}
.zv-sw.on{background:#6a3dff}.zv-sw.on:after{left:25px}
.zv-ben{list-style:none;margin:14px 0 0;padding:0}
.zv-ben li{display:flex;align-items:center;gap:10px;padding:10px 0;border-top:1px solid #231a66;font-size:14px;color:#e6e0ff}
.zv-ben li svg{width:18px;height:18px;color:#2bf0b0;flex-shrink:0}`;
  const style = document.createElement("style"); style.textContent = css; document.head.appendChild(style);

  // ---- Page ----
  let root = null;
  const row = (icon, t, s, fn) => `<button class="zr" onclick="${fn}"><span class="ri">${ic(icon)}</span><span class="rt"><b>${t}</b><small>${s}</small></span><span class="ch">${ic("chev")}</span></button>`;

  // keep the fixed Log Out bar right above the bottom navigation, whatever its height
  function placeBar() {
    if (!root) return;
    const nav = document.querySelector(".bottom");
    const h = nav ? nav.offsetHeight : 80;
    const bar = root.querySelector(".lo");
    if (bar) bar.style.bottom = h + "px";
    root.style.paddingBottom = (h + 90) + "px";
  }

  function render() {
    if (!root || !root.classList.contains("open")) return;
    const p = profile(), st = M() || { tier: "Free", totalMined: 0 };
    const total = window.ZenvyroWallet ? window.ZenvyroWallet.total() : 0;
    const refs = window.ZenvyroReferral && window.ZenvyroReferral.count ? window.ZenvyroReferral.count() : 0;
    const av = (() => { try { return localStorage.getItem(AKEY); } catch (e) { return null; } })();
    const tier = PACKS[st.tier] ? st.tier : "Free";
    const premium = tier !== "Free"; // the blue tick appears only for premium pack holders
    root.innerHTML = `<div class="in">
      <div class="top"><div class="logo"><span class="z">Z</span><div class="brand"><b>ZENVYRO</b><small>Your Crypto Future</small></div></div>
        <div class="tools"><button class="ic" onclick="toast('No new notifications')" aria-label="Notifications">${ic("bell")}<span class="dot"></span></button><button class="ic" onclick="zvaNotif()" aria-label="Settings">${ic("gear")}</button></div></div>

      <div class="card prof">
        <div class="pt"><button class="prem" onclick="zvaPack()" aria-label="Membership benefits">${ic("crown")}<span>${esc(tier)} Pack</span><span class="ch2">${ic("chev")}</span></button></div>
        <div class="pr"><div class="av" ${av ? `style="background-image:url(${av})"` : ""}>${av ? "" : SVG_AVATAR}<button class="cam" onclick="zvaPick()" aria-label="Change photo">${ic("camera")}</button></div>
          <div class="who"><div class="nm"><span>${esc(p.name)}</span>${premium ? SVG_TICK : ""}</div><div class="tt">${esc(p.title)}</div><span class="mid">Member ID: ${esc(memberId())}</span></div></div>
        <div class="stats">
          <button class="stat" onclick="zvaRefer()"><span class="si">${ic("users")}</span><span><small>Referral</small><b>${refs}</b></span><span class="ch">${ic("chev")}</span></button>
          <button class="stat" onclick="showSection('mining')"><span class="si">${ic("pick")}</span><span><small>Total Mining</small><b>${(+st.totalMined || 0).toFixed(3)}<i>ZENY</i></b></span><span class="ch">${ic("chev")}</span></button>
          <button class="stat" onclick="showSection('wallet')"><span class="si">${ic("wallet")}</span><span><small>Wallet Balance</small><b>$${Number(total).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</b></span><span class="ch">${ic("chev")}</span></button>
          <button class="stat" onclick="toast('Account Active')"><span class="si">${ic("shieldCheck")}</span><span><small>Account Status</small><b class="grn">Active</b></span><span class="ch">${ic("chev")}</span></button>
        </div></div>

      <div class="card ban"><span class="cr">${ic("crown")}</span><div class="bt"><b>Upgrade Your Membership</b><small>Get higher mining rate &amp; more benefits</small></div><button onclick="showSection('membership')">View Plans ${ic("chev")}</button></div>

      <div class="grid"><div>
        <div class="card"><div class="sh">${ic("gift")}<span>Refer &amp; Earn</span></div>
          ${row("users", "Refer &amp; Earn", "Share your code and track referrals", "zvaRefer()")}</div>

        <div class="card"><div class="sh">${ic("user")}<span>Personal Information</span></div>
          ${row("user", "Edit Profile", "Update your personal details", "zvaEdit()")}
          ${row("lock", "Change Password", "Keep your account secure", "zvaPass()")}
          ${row("shieldCheck", "KYC Verification", "Verify your identity (Optional)", "zvaKyc()")}
          ${row("bell", "Notification Settings", "Manage your alerts and updates", "zvaNotif()")}</div>

        <div class="card"><div class="sh">${ic("shield")}<span>Security &amp; Privacy</span></div>
          <div class="zr"><span class="ri">${ic("userShield")}</span><span class="rt"><b>Two-Factor Authentication (2FA)</b><small>${window.ZENVYRO_2FA_ENABLED ? "Enabled" : "Not enabled"}</small></span><button class="zv-sw ${window.ZENVYRO_2FA_ENABLED ? "on" : ""}" onclick="zva2fa()" aria-label="2FA"></button></div>
          ${row("clock", "Login Activity", "View your recent login sessions", "zvaLogins()")}
          ${row("doc", "Privacy Policy", "How we protect your data", "zvaPrivacy()")}</div>

        <div class="card"><div class="sh">${ic("headset")}<span>Help &amp; Support</span></div>
          ${row("help", "FAQ", "Find answers to common questions", "zvaFaq()")}
          ${row("mail", "Contact Support", "Get help from our team", "zvaContact()")}</div>
      </div>

      <div class="side"><div class="shield">${SVG_SHIELD_BIG}</div><h3>Your Security<br>Our Priority</h3><p>We work to keep your account and assets safe.</p>
        <div class="chip"><span class="ci">${ic("shieldCheck")}</span><div><b>Secure Connection</b><small>Connected over HTTPS</small></div></div>
        <div class="chip"><span class="ci">${ic("userShield")}</span><div><b>2FA Protection</b><small>${window.ZENVYRO_2FA_ENABLED ? "Enabled" : "Not enabled yet"}</small></div></div>
        <div class="chip"><span class="ci">${ic("headset")}</span><div><b>Support</b><small>Reach us via Help &amp; Support</small></div></div>
        <div class="sig">Zenvyro Team ${SVG_HEART}</div></div></div></div>

      <div class="lo"><button onclick="zvaLogout()">${ic("logout")}<span style="flex:1;text-align:left">Log Out</span>${ic("chev")}</button></div>`;
    placeBar();
  }

  // Tapping the pack badge shows the benefits of the pack the member is on
  function packInfo() {
    const st = M() || { tier: "Free" };
    const tier = PACKS[st.tier] ? st.tier : "Free", pk = PACKS[tier];
    window.openModal(tier + " Pack",
      `<div class="modal-list"><div><strong>Mining rate</strong><span>${pk.rate.toFixed(6)} ZENY / hour</span></div><div><strong>Per day (24 h)</strong><span>${(pk.rate * 24).toFixed(4)} ZENY</span></div></div>
      <ul class="zv-ben">${pk.ben.map(b => `<li>${ic("check")}<span>${b}</span></li>`).join("")}</ul>
      <button class="btn" style="width:100%;margin-top:14px" onclick="showSection('membership')">${tier === "Platinum" ? "View Plans" : "Upgrade Membership"}</button>
      <div class="modal-note">Benefits are display settings and are not guaranteed earnings.</div>`);
  }

  const navBtn = () => Array.from(document.querySelectorAll(".nav button")).find(b => /Account/.test(b.textContent));
  function openAccount() {
    if (typeof window.zvwClose === "function") window.zvwClose();
    if (!root) { root = document.createElement("div"); root.id = "zvAccount"; document.body.appendChild(root); }
    root.classList.add("open"); root.scrollTop = 0;
    if (navBtn()) { document.querySelectorAll(".nav button").forEach(b => b.classList.remove("active")); navBtn().classList.add("active"); }
    render();
    if (window.ZenvyroReferral && window.ZenvyroReferral.refresh) window.ZenvyroReferral.refresh().then(render);
  }
  const closeAccount = () => { if (root) root.classList.remove("open"); };

  // ---- Forms / Modals ----
  const val = id => ($(id) ? $(id).value.trim() : "");
  const fld = (id, label, extra) => `<label class="modal-label" for="${id}">${label}</label><input class="modal-field" id="${id}" ${extra || ""}>`;

  function editProfile() {
    const p = profile();
    window.openModal("Edit Profile", fld("epName", "Name", `type="text" maxlength="40" value="${esc(p.name)}"`) + fld("epTitle", "Profession / Title", `type="text" maxlength="40" value="${esc(p.title)}"`) +
      `<button class="btn" style="width:100%;margin-top:14px" onclick="zvaSaveProfile()">Save</button><div class="modal-note">For now your details are saved on this device only. Once a backend is connected they will be stored with your account.</div>`);
  }
  function saveProfile() {
    const name = val("epName"), title = val("epTitle");
    if (name.length < 2) return say("Enter your name");
    jset(PKEY, { name: name.slice(0, 40), title: title.slice(0, 40) });
    applyName(); window.closeModal(); render(); say("Profile updated");
  }

  function changePass() {
    window.openModal("Change Password", fld("cpOld", "Current password", 'type="password" autocomplete="current-password"') + fld("cpNew", "New password", 'type="password" autocomplete="new-password"') + fld("cpNew2", "Confirm new password", 'type="password" autocomplete="new-password"') +
      `<button class="btn" style="width:100%;margin-top:14px" onclick="zvaSavePass()">Update password</button><div class="modal-note">Your password is never saved on this device. Use at least 8 characters.</div>`);
  }
  function savePass() {
    const o = $("cpOld").value, n = $("cpNew").value, n2 = $("cpNew2").value;
    if (!o) return say("Enter your current password");
    if (n.length < 8) return say("New password must be at least 8 characters");
    if (n !== n2) return say("New passwords don't match");
    const auth = window.ZENVYRO_AUTH;
    if (!auth || typeof auth.changePassword !== "function") return say("Password can't be changed because no login system is connected");
    Promise.resolve(auth.changePassword(o, n)).then(() => { window.closeModal(); say("Password changed"); }).catch(() => say("Could not change password"));
  }

  function kyc() {
    window.openModal("KYC Verification", `<div class="modal-list"><div><strong>Status</strong><span>${profile().verified ? "Verified" : "Not verified"}</span></div><div><strong>Requirement</strong><span>Optional</span></div></div>
      <button class="btn" style="width:100%;margin-top:14px;opacity:.5" disabled>Upload documents</button>
      <div class="modal-note">KYC document upload and verification will be available once a backend is connected. Do not submit any documents for now.</div>`);
  }

  function notif() {
    const n = Object.assign({ mining: true, referral: true, wallet: true, news: false }, jget(NKEY, {}));
    const items = [["mining", "Mining reward alerts"], ["referral", "Referral alerts"], ["wallet", "Deposit / Withdraw updates"], ["news", "News & offers"]];
    window.openModal("Notification Settings", `<div class="modal-list">${items.map(i => `<div><strong>${i[1]}</strong><button class="zv-sw ${n[i[0]] ? "on" : ""}" onclick="zvaNToggle('${i[0]}',this)" aria-label="${i[1]}"></button></div>`).join("")}</div>
      <div class="modal-note">Settings are saved on this device for now. Real push/email notifications will work once a backend is connected.</div>`);
  }
  function nToggle(k, el) {
    const n = Object.assign({ mining: true, referral: true, wallet: true, news: false }, jget(NKEY, {}));
    n[k] = !n[k]; jset(NKEY, n); el.classList.toggle("on", n[k]);
  }

  function twofa() {
    window.openModal("Two-Factor Authentication", `<div class="modal-note">Turning on 2FA requires a server-side login system. Until one is connected it cannot be enabled, and this page will not show "Enabled".</div>`);
  }

  function logins() {
    const l = jget(LKEY, []);
    window.openModal("Login Activity", `<div class="modal-list">${l.length ? l.map((x, i) => `<div><strong>${esc(x.dev)}${i === 0 ? " · This device" : ""}</strong><span>${new Date(x.ts).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: false })}</span></div>`).join("") : "<div><strong>No data</strong><span>—</span></div>"}</div>
      <div class="modal-note">Only records of opening the site from this device are shown here. Real login history from other devices will appear once a backend is connected.</div>`);
  }

  function privacy() {
    if (window.ZENVYRO_PRIVACY_URL) { window.open(window.ZENVYRO_PRIVACY_URL, "_blank", "noopener"); return; }
    if (window.ZENVYRO_LEGAL) { window.ZENVYRO_LEGAL.open("privacy"); return; }
    window.openModal("Privacy Policy", `<div class="modal-note">A Privacy Policy has not been added yet. Before launching to real users, publish your own Privacy Policy and Terms page and link it via <code>window.ZENVYRO_PRIVACY_URL</code>.</div>`);
  }

  function faq() {
    const q = [
      ["How does mining work?", "Tap Start Mining to begin a 1-hour session. When the hour ends, tap Claim Reward to add one hour of ZENY for your pack to your balance."],
      ["When do I get referral income?", "Referral Income Commission can be claimed every night at 10 PM (Bangladesh time) and is added to your Exchange balance as ZENY. Purchase Bonus goes straight to your Wallet."],
      ["How does Exchange work?", "Send a request to exchange ZENY into another asset. When an admin accepts, it is credited to your Wallet at the rate at acceptance after a total 10% fee; if rejected, your ZENY is refunded."],
      ["How do Deposit and Withdraw work?", "Both are requests that an admin verifies and then accepts or rejects. When you request a withdrawal, that amount is locked."],
      ["Can a Transfer be reversed?", "No. User-to-user transfers are instant, so double-check the recipient's ID before sending."],
      ["Are earnings guaranteed?", "No. Rewards and commissions follow platform rules and are not guaranteed income."]
    ];
    window.openModal("FAQ", q.map(x => `<details style="border:1px solid #2c265e;border-radius:14px;padding:12px;margin-bottom:9px;background:#0b0a23"><summary style="font-weight:700;font-size:14px">${x[0]}</summary><p style="color:#c4c5ed;font-size:13px;line-height:1.6;margin:8px 0 0">${x[1]}</p></details>`).join(""));
  }

  function contact() {
    const s = window.ZENVYRO_SUPPORT || {};
    const rows = [];
    if (s.email) rows.push(`<div><strong>Email</strong><span><a style="color:#c69aff" href="mailto:${esc(s.email)}">${esc(s.email)}</a></span></div>`);
    if (s.telegram) rows.push(`<div><strong>Telegram</strong><span><a style="color:#c69aff" target="_blank" rel="noopener" href="${esc(s.telegram)}">Open</a></span></div>`);
    window.openModal("Contact Support", rows.length ? `<div class="modal-list">${rows.join("")}</div>` :
      `<div class="modal-note">Support contact details are not set yet. Add your real contact channels with <code>window.ZENVYRO_SUPPORT = { email, telegram }</code>.</div>`);
  }

  function logout() {
    if (!window.confirm("Log out?")) return;
    const a = window.ZENVYRO_AUTH;
    if (a && typeof a.logout === "function") { Promise.resolve(a.logout()).then(() => say("Logged out")); return; }
    say("The login system isn't connected yet");
  }

  // ---- Profile photo ----
  function setupPicker() {
    const inp = document.createElement("input");
    inp.type = "file"; inp.accept = "image/*"; inp.style.display = "none"; inp.id = "zvaFile";
    document.body.appendChild(inp);
    inp.addEventListener("change", () => {
      const f = inp.files && inp.files[0]; inp.value = "";
      if (!f || !/^image\//.test(f.type)) return;
      const img = new Image(), url = URL.createObjectURL(f);
      img.onload = () => {
        const S = 240, c = document.createElement("canvas"); c.width = c.height = S;
        const r = Math.min(img.width, img.height), sx = (img.width - r) / 2, sy = (img.height - r) / 2;
        c.getContext("2d").drawImage(img, sx, sy, r, r, 0, 0, S, S);
        URL.revokeObjectURL(url);
        try { localStorage.setItem(AKEY, c.toDataURL("image/jpeg", 0.8)); say("Photo updated"); } catch (e) { say("Could not save photo"); }
        render();
      };
      img.onerror = () => { URL.revokeObjectURL(url); say("Could not read photo"); };
      img.src = url;
    });
    return inp;
  }

  function init() {
    applyName();
    const picker = setupPicker();
    Object.assign(window, {
      zvaPick: () => picker.click(),
      zvaRefer: () => { if (typeof window.openReferral === "function") window.openReferral(); },
      zvaEdit: editProfile, zvaSaveProfile: saveProfile,
      zvaPass: changePass, zvaSavePass: savePass,
      zvaKyc: kyc, zvaNotif: notif, zvaNToggle: nToggle, zva2fa: twofa,
      zvaLogins: logins, zvaPrivacy: privacy, zvaFaq: faq, zvaContact: contact, zvaLogout: logout, zvaPack: packInfo
    });

    // the Account icon at the top right of Home now opens the Account page
    const circ = document.querySelectorAll(".actions .circle")[1];
    if (circ) circ.onclick = () => window.showSection("account");

    const origShow = window.showSection;
    window.showSection = function (name) {
      if (name === "account") { openAccount(); return; }
      if (name !== "membership") closeAccount(); // the Membership modal opens above the page
      return origShow.apply(this, arguments);
    };
    const origNav = window.navActive;
    if (typeof origNav === "function") {
      window.navActive = function (el) {
        const r = origNav.apply(this, arguments);
        if (el && !/Account/.test(el.textContent || "")) closeAccount();
        return r;
      };
    }
    window.addEventListener("resize", placeBar);
    setInterval(render, 5000);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
