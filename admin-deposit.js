/* Zenvyro Admin — Deposits (address + QR per network, and the deposit requests list). Demo: saved in this browser.
   The member app (wallet.js) adds the TRX to the member's Wallet once a request is set to "approved". */
(() => {
  "use strict";
  const CFG = "zenvyro_deposit_cfg_v1", TX = "zenvyro_tx_v1";
  const NETS = [["TRX", "TRX", "TRON"], ["SOL", "SOL", "Solana"], ["BNB", "BNB", "BNB Chain"]];
  const $ = s => document.querySelector(s);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const toast = m => { const t = $("#toast"); if (!t) return; t.textContent = m; t.classList.add("on"); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove("on"), 2800); };
  const jg = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } };
  const when = ts => new Date(ts).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: false });
  const num = n => { const s = (+n).toFixed(6).replace(/0+$/, ""); return s.endsWith(".") ? s.slice(0, -1) : s; };
  const paint = (t, h) => { $("#shT").textContent = t; $("#shB").innerHTML = h; $("#sheet").dataset.k = "dep"; };
  let tab = "req", qrTmp = {};

  const head = () => `<div class="bg" style="grid-template-columns:1fr 1fr"><button class="sm${tab === "req" ? " ap" : ""}" data-dp="tab" data-t="req">Requests</button><button class="sm${tab === "set" ? " ap" : ""}" data-dp="tab" data-t="set">Settings</button></div>`;

  function reqHtml() {
    const all = jg(TX, []).filter(t => t && t.kind === "deposit").sort((a, b) => (b.ts || 0) - (a.ts || 0));
    const pend = all.filter(t => t.status === "pending"), done = all.filter(t => t.status !== "pending").slice(0, 10);
    const row = (t, act) => {
      const via = t.net ? `${esc(t.netName || t.net)} · sent ${num(t.sendAmount)} ${esc(t.sendCoin || "")}` : esc(t.sub || "");
      const st = t.status === "rejected" ? ["Rejected", "bad"] : t.status === "pending" ? ["Pending", ""] : ["Approved", "ok"];
      return `<div class="li" style="display:block"><div><b>+${num(t.credit || t.amount)} ${esc(t.sym || "TRX")}</b> <span class="tag ${st[1]}">${st[0]}</span><small>${via}<br>${when(t.ts || Date.now())} · ${esc(t.id)}</small>` +
        `<small style="word-break:break-all;color:#cfc4ff">TXID: ${esc(t.txid || "—")}</small></div>` +
        (act ? `<div class="bg" style="grid-template-columns:1fr 1fr;margin-top:8px"><button class="sm ap" data-dp="ok" data-id="${esc(t.id)}">Approve</button><button class="sm red" data-dp="no" data-id="${esc(t.id)}">Reject</button></div>` : "") + "</div>";
    };
    return head() + `<p class="sub">Pending (${pend.length})</p>` + (pend.length ? pend.map(t => row(t, true)).join("") : '<div class="li">No pending deposit requests</div>') +
      (done.length ? '<p class="sub">Recent decisions</p>' + done.map(t => row(t, false)).join("") : "") +
      '<p class="note">Check the TXID on the blockchain before you approve. Approve adds the TRX to the member\'s Wallet (you can change the amount). Requests and decisions are saved on this device for now. They reach real members once the backend is connected.</p>';
  }

  function setHtml() {
    const c = jg(CFG, {});
    return head() + NETS.map(([k, coin, name]) => {
      const o = c[k] || {}, qr = qrTmp[k] !== undefined ? qrTmp[k] : (o.qr || "");
      return `<p class="sub">${coin} · ${name}</p><input class="in" id="dpA_${k}" value="${esc(o.address || "")}" placeholder="${name} deposit address" autocomplete="off" autocapitalize="off" spellcheck="false">` +
        `<div style="display:flex;align-items:center;gap:10px;margin-top:8px">${qr ? `<img src="${esc(qr)}" alt="" style="width:72px;height:72px;border-radius:10px;background:#fff;object-fit:contain">` : '<div style="width:72px;height:72px;border-radius:10px;background:#1a0f55;display:grid;place-items:center;font-size:11px;color:#b9b2f5">No QR</div>'}` +
        `<div style="flex:1"><input id="dpQ_${k}" data-net="${k}" type="file" accept="image/*" style="color:#fff;font-size:13px;max-width:100%">${qr ? `<button class="sm red" style="margin-top:6px" data-dp="rmqr" data-net="${k}">Remove QR</button>` : ""}</div></div>` +
        `<label style="display:flex;align-items:center;gap:8px;margin-top:8px;font-size:14px"><input type="checkbox" id="dpO_${k}" ${o.on === false ? "" : "checked"}> Active (members can deposit on ${name})</label>`;
    }).join("") + '<button class="pr" data-dp="save">Save deposit settings</button><p class="note">The address and QR are shown to members on the Deposit page. Check each address twice, because members will send real coins to it. Saved on this device for now.</p>';
  }

  const page = () => ["Deposits", tab === "req" ? reqHtml() : setHtml()];

  function readInputs() { // keep what was typed when the page re-draws
    const c = jg(CFG, {});
    NETS.forEach(([k]) => { const a = $("#dpA_" + k), o = $("#dpO_" + k); if (!a) return; c[k] = Object.assign({}, c[k], { address: a.value.trim(), on: o ? o.checked : true }); if (qrTmp[k] !== undefined) c[k].qr = qrTmp[k]; });
    return c;
  }
  function save() {
    const c = readInputs();
    try { localStorage.setItem(CFG, JSON.stringify(c)); } catch (e) { return toast("Could not save (storage full). Use a smaller QR image"); }
    qrTmp = {}; toast("Deposit settings saved"); paint("Deposits", page()[1]);
  }
  function pick(file, k) {
    const r = new FileReader();
    r.onload = () => { const im = new Image(); im.onload = () => {
      const s = Math.min(1, 600 / Math.max(im.width, im.height)), cv = document.createElement("canvas"); cv.width = Math.round(im.width * s); cv.height = Math.round(im.height * s);
      const g = cv.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, cv.width, cv.height); g.drawImage(im, 0, 0, cv.width, cv.height);
      const c = readInputs(); try { localStorage.setItem(CFG, JSON.stringify(c)); } catch (e) {}
      qrTmp[k] = cv.toDataURL("image/png"); paint("Deposits", setHtml()); toast("QR ready. Press Save to keep it");
    }; im.onerror = () => toast("Could not read that image"); im.src = r.result; };
    r.readAsDataURL(file);
  }
  function decide(id, ok) {
    const list = jg(TX, []), t = list.find(x => x && x.id === id && x.kind === "deposit" && x.status === "pending"); if (!t) return toast("Already decided");
    if (ok) {
      const v = prompt("TRX to add to the member's Wallet", num(t.amount)); if (v === null) return;
      const amt = parseFloat(v); if (!(amt > 0) || amt > 1e9) return toast("Enter a valid amount");
      t.credit = amt; t.creditUsdt = t.usdt && t.amount > 0 ? Math.round(t.usdt * amt / t.amount * 100) / 100 : 0; t.status = "approved";
    } else { if (!confirm("Reject this deposit request?")) return; t.status = "rejected"; }
    t.reviewed = Date.now();
    try { localStorage.setItem(TX, JSON.stringify(list)); } catch (e) { return toast("Could not save"); }
    toast(ok ? "Approved. The TRX is added when the member opens the app" : "Rejected"); paint("Deposits", reqHtml());
  }

  document.addEventListener("click", e => {
    const b = e.target.closest("[data-dp]"); if (!b) return; const a = b.dataset.dp;
    if (a === "tab") { if (tab === "set") { const c = readInputs(); try { localStorage.setItem(CFG, JSON.stringify(c)); } catch (x) {} } tab = b.dataset.t; paint("Deposits", page()[1]); }
    else if (a === "save") save(); else if (a === "ok") decide(b.dataset.id, true); else if (a === "no") decide(b.dataset.id, false);
    else if (a === "rmqr") { qrTmp[b.dataset.net] = ""; const c = readInputs(); try { localStorage.setItem(CFG, JSON.stringify(c)); } catch (x) {} paint("Deposits", setHtml()); toast("QR removed. Press Save to keep this"); }
  });
  document.addEventListener("change", e => { const t = e.target; if (t.id && t.id.startsWith("dpQ_") && t.files[0]) pick(t.files[0], t.dataset.net); });
  window.ZVAdminDeposit = { page };
})();
