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

  // ---- CSS ----
  const css = `
#zvAccount{position:fixed;inset:0;z-index:4;overflow-y:auto;-webkit-overflow-scrolling:touch;display:none;padding:calc(14px + env(safe-area-inset-top,0px)) 14px 130px;background:radial-gradient(ellipse at 50% 0,#2b1475 0,#0a0720 46%,#04040e 100%);color:#fff}
#zvAccount.open{display:block}
#zvAccount .in{max-width:1000px;margin:auto}
#zvAccount .top{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px}
#zvAccount .logo{display:flex;gap:10px;align-items:center}
#zvAccount .z{font-size:40px;font-weight:900;font-style:italic;color:#cda5ff;text-shadow:0 0 18px #8a32ff;line-height:1}
#zvAccount .brand b{letter-spacing:5px;font-size:20px;display:block}
#zvAccount .brand small{color:#b7b5ec;font-size:11px;letter-spacing:1px}
#zvAccount .ic{width:44px;height:44px;border-radius:14px;border:0;background:none;display:grid;place-items:center;font-size:24px;color:#cfc4ff;position:relative}
#zvAccount .dot{position:absolute;top:6px;right:8px;width:10px;height:10px;border-radius:50%;background:#ff4466}
#zvAccount .card{border:1px solid #5a35d8;border-radius:22px;background:linear-gradient(135deg,#150c4ee6,#0b0830f2);box-shadow:0 0 28px #6b32ff2a,inset 0 0 0 1px #2e1d7a;margin-bottom:14px;overflow:hidden}
#zvAccount .prof{padding:16px 16px 0;position:relative}
#zvAccount .pr{display:flex;gap:14px;align-items:center}
#zvAccount .av{width:92px;height:92px;border-radius:50%;border:3px solid #9a5cff;box-shadow:0 0 22px #8a3dff80;background:#1a1058 center/cover;display:grid;place-items:center;font-size:44px;position:relative;flex-shrink:0}
#zvAccount .cam{position:absolute;right:-2px;bottom:-2px;width:32px;height:32px;border-radius:50%;background:#2a1a86;border:2px solid #9a5cff;display:grid;place-items:center;font-size:15px;color:#fff;padding:0}
#zvAccount .nm{font-size:23px;font-weight:800;display:flex;align-items:center;gap:7px;flex-wrap:wrap}
#zvAccount .vf{width:22px;height:22px;border-radius:50%;background:#7a4dff;display:inline-grid;place-items:center;font-size:13px}
#zvAccount .tt{color:#b7a8ff;font-size:16px;margin:2px 0 8px}
#zvAccount .mid{display:inline-block;border:1px solid #6b45d8;border-radius:18px;background:#1a1058;padding:5px 12px;font-size:13px;color:#cfc4ff}
#zvAccount .prem{position:absolute;top:14px;right:14px;border:1px solid #d8a93a;border-radius:20px;background:#2a1d08;color:#ffd36b;padding:6px 11px;font-size:12px;font-weight:700}
#zvAccount .stats{display:grid;grid-template-columns:1fr 1fr;margin-top:14px;border-top:1px solid #2a2170}
#zvAccount .stat{display:flex;align-items:center;gap:10px;padding:13px 14px;background:none;border:0;color:#fff;text-align:left;border-bottom:1px solid #2a2170}
#zvAccount .stat:nth-child(odd){border-right:1px solid #2a2170}
#zvAccount .stat .si{font-size:22px;color:#b28aff}
#zvAccount .stat small{display:block;color:#c8b8ff;font-size:12px}
#zvAccount .stat b{font-size:17px}
#zvAccount .stat .ch{margin-left:auto;color:#a98bff}
#zvAccount .grn{color:#2bf0b0}
#zvAccount .ban{display:flex;align-items:center;gap:12px;padding:14px 16px;background:linear-gradient(100deg,#3a1b9a,#150c4e 60%)}
#zvAccount .ban .cr{font-size:40px}
#zvAccount .ban .bt{flex:1;min-width:0}#zvAccount .ban b{font-size:17px;display:block}#zvAccount .ban small{color:#c8b8ff;font-size:12px}
#zvAccount .ban button{border:1px solid #9a6cff;border-radius:24px;background:linear-gradient(100deg,#8a33ff,#4a2bd0);color:#fff;font-weight:800;padding:11px 14px;font-size:14px;white-space:nowrap}
#zvAccount .grid{display:grid;grid-template-columns:1fr;gap:0}
@media(min-width:820px){#zvAccount .grid{grid-template-columns:1.6fr 1fr;gap:14px;align-items:start}}
#zvAccount .sh{display:flex;align-items:center;gap:10px;padding:12px 16px;font-weight:800;font-size:17px;background:#1b1160;border-bottom:1px solid #2a2170}
#zvAccount .zr{display:flex;align-items:center;gap:12px;width:100%;padding:11px 16px;background:none;border:0;border-top:1px solid #231a66;color:#fff;text-align:left}
#zvAccount .sh+.zr{border-top:0}
#zvAccount .ri{width:44px;height:44px;border-radius:50%;border:1px solid #6b45d8;background:#1a1058;display:grid;place-items:center;font-size:19px;flex-shrink:0;color:#d6c8ff}
#zvAccount .rt{flex:1;min-width:0}#zvAccount .rt b{display:block;font-size:15px}#zvAccount .rt small{color:#b9b2ee;font-size:12px}
#zvAccount .ch{color:#a98bff;font-size:20px}
#zvAccount .out{margin:10px 14px 14px;width:calc(100% - 28px);border:1px solid #d83a7a;border-radius:16px;background:#2a0c24;color:#ff6fa0;padding:13px 14px;display:flex;align-items:center;gap:12px;font-weight:700;font-size:15px}
#zvAccount .side{border:1px solid #5a35d8;border-radius:22px;background:linear-gradient(160deg,#1a0f5a,#0a0730);padding:18px 16px;margin-bottom:14px}
#zvAccount .shield{font-size:92px;text-align:center;filter:drop-shadow(0 0 22px #8a3dff);line-height:1.1}
#zvAccount .side h3{margin:8px 0 6px;font-size:21px;line-height:1.2}
#zvAccount .side p{color:#c8b8ff;font-size:14px;margin:0 0 12px}
#zvAccount .chip{display:flex;align-items:center;gap:12px;border:1px solid #3a2a96;border-radius:16px;background:#120c40;padding:11px 12px;margin-bottom:9px}
#zvAccount .chip span.ci{width:40px;height:40px;border-radius:50%;background:#2a1a86;display:grid;place-items:center;font-size:18px}
#zvAccount .chip b{font-size:14px;display:block}#zvAccount .chip small{color:#b9b2ee;font-size:12px}
#zvAccount .sig{font-family:'Brush Script MT',cursive;font-style:italic;color:#a98bff;font-size:24px;text-align:center;margin-top:14px}
.zv-sw{position:relative;width:52px;height:30px;border-radius:20px;background:#2b2570;flex-shrink:0;border:0;padding:0}
.zv-sw:after{content:'';position:absolute;top:3px;left:3px;width:24px;height:24px;border-radius:50%;background:#fff;transition:.2s}
.zv-sw.on{background:#6a3dff}.zv-sw.on:after{left:25px}`;
  const style = document.createElement("style"); style.textContent = css; document.head.appendChild(style);

  // ---- Page ----
  let root = null;
  const row = (ic, t, s, fn) => `<button class="zr" onclick="${fn}"><span class="ri">${ic}</span><span class="rt"><b>${t}</b><small>${s}</small></span><span class="ch">›</span></button>`;

  function render() {
    if (!root || !root.classList.contains("open")) return;
    const p = profile(), st = M() || { tier: "Free", totalMined: 0 };
    const total = window.ZenvyroWallet ? window.ZenvyroWallet.total() : 0;
    const refs = window.ZenvyroReferral && window.ZenvyroReferral.count ? window.ZenvyroReferral.count() : 0;
    const av = (() => { try { return localStorage.getItem(AKEY); } catch (e) { return null; } })();
    const premium = st.tier !== "Free";
    root.innerHTML = `<div class="in">
      <div class="top"><div class="logo"><span class="z">Z</span><div class="brand"><b>ZENVYRO</b><small>Your Crypto Future</small></div></div>
        <div><button class="ic" onclick="toast('No new notifications')">🔔<span class="dot"></span></button><button class="ic" onclick="zvaNotif()">⚙</button></div></div>

      <div class="card prof"><button class="prem" onclick="showSection('membership')">♛ ${premium ? esc(st.tier) + " Member" : "Free Member"} ›</button>
        <div class="pr"><div class="av" ${av ? `style="background-image:url(${av})"` : ""}>${av ? "" : "👤"}<button class="cam" onclick="zvaPick()">📷</button></div>
          <div><div class="nm">${esc(p.name)}${p.verified ? '<span class="vf">✓</span>' : ""}</div><div class="tt">${esc(p.title)}</div><span class="mid">Member ID: ${esc(memberId())}</span></div></div>
        <div class="stats">
          <button class="stat" onclick="zvaRefer()"><span class="si">👥</span><span><small>Referral</small><b>${refs}</b></span><span class="ch">›</span></button>
          <button class="stat" onclick="showSection('mining')"><span class="si">⛏</span><span><small>Total Mining</small><b>${(+st.totalMined || 0).toFixed(3)} <span style="font-size:12px;color:#c8b8ff">ZENY</span></b></span><span class="ch">›</span></button>
          <button class="stat" onclick="showSection('wallet')"><span class="si">👛</span><span><small>Wallet Balance</small><b>$${Number(total).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</b></span><span class="ch">›</span></button>
          <button class="stat" onclick="toast('Account Active')"><span class="si">🛡</span><span><small>Account Status</small><b class="grn">● Active</b></span><span class="ch">›</span></button>
        </div></div>

      <div class="card ban"><span class="cr">👑</span><div class="bt"><b>Upgrade Your Membership</b><small>Get higher mining rate &amp; more benefits</small></div><button onclick="showSection('membership')">View Plans ›</button></div>

      <div class="grid"><div>
        <div class="card"><div class="sh">🎁 &nbsp;Refer &amp; Earn</div>
          ${row("👥", "Refer &amp; Earn", "Share your code and track referrals", "zvaRefer()")}</div>

        <div class="card"><div class="sh">👤 &nbsp;Personal Information</div>
          ${row("👤", "Edit Profile", "Update your personal details", "zvaEdit()")}
          ${row("🔒", "Change Password", "Keep your account secure", "zvaPass()")}
          ${row("🛡", "KYC Verification", "Verify your identity (Optional)", "zvaKyc()")}
          ${row("🔔", "Notification Settings", "Manage your alerts and updates", "zvaNotif()")}</div>

        <div class="card"><div class="sh">🛡 &nbsp;Security &amp; Privacy</div>
          <div class="zr"><span class="ri">🧑‍💻</span><span class="rt"><b>Two-Factor Authentication (2FA)</b><small>${window.ZENVYRO_2FA_ENABLED ? "Enabled" : "Not enabled"}</small></span><button class="zv-sw ${window.ZENVYRO_2FA_ENABLED ? "on" : ""}" onclick="zva2fa()" aria-label="2FA"></button></div>
          ${row("🕒", "Login Activity", "View your recent login sessions", "zvaLogins()")}
          ${row("📄", "Privacy Policy", "How we protect your data", "zvaPrivacy()")}</div>

        <div class="card"><div class="sh">🎧 &nbsp;Help &amp; Support</div>
          ${row("❓", "FAQ", "Find answers to common questions", "zvaFaq()")}
          ${row("✉", "Contact Support", "Get help from our team", "zvaContact()")}
          <button class="out" onclick="zvaLogout()"><span>⎋</span><span style="flex:1;text-align:left">Log Out</span><span>›</span></button></div>
      </div>

      <div class="side"><div class="shield">🛡</div><h3>Your Security<br>Our Priority</h3><p>We work to keep your account and assets safe.</p>
        <div class="chip"><span class="ci">🔐</span><div><b>Secure Connection</b><small>Connected over HTTPS</small></div></div>
        <div class="chip"><span class="ci">✅</span><div><b>2FA Protection</b><small>${window.ZENVYRO_2FA_ENABLED ? "Enabled" : "Not enabled yet"}</small></div></div>
        <div class="chip"><span class="ci">🎧</span><div><b>Support</b><small>Reach us via Help &amp; Support</small></div></div>
        <div class="sig">Zenvyro Team ♥</div></div></div></div>`;
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
      zvaLogins: logins, zvaPrivacy: privacy, zvaFaq: faq, zvaContact: contact, zvaLogout: logout
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
    setInterval(render, 5000);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
