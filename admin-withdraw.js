/* Zenvyro Admin — Withdrawal Requests.
   Steps a request goes through:  Pending  ->  Accepted  ->  Completed   (or Rejected from Pending / Accepted).
     Accept   : the member sees "Accepted". The amount stays locked.
     Confirm  : the admin confirms the payment was sent. The member sees "Completed", the app takes the amount from the balance, puts the 30%
                in Airdrop Hold as ZNV (wallet.js does that part), and a message goes to the member's notifications at once.
     Reject   : the member sees "Rejected" and the lock is released.
   Demo: requests live in this browser's localStorage ("zenvyro_tx_v1") and notifications in "zenvyro_notifs_v1", shared with the member app on this device.
   With the backend connected, these become database rows and the member app reads them there (same fields). */
(() => {
  "use strict";
  const TX = "zenvyro_tx_v1", NK = "zenvyro_notifs_v1", HOLD = 30;
  const $ = s => document.querySelector(s);
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const toast = m => { const t = $("#toast"); if (!t) return; t.textContent = m; t.classList.add("on"); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove("on"), 2800); };
  const jg = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } };
  const when = ts => new Date(ts).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: false });
  const num = n => { const s = (+n).toFixed(8).replace(/0+$/, ""); return s.endsWith(".") ? s.slice(0, -1) : s; };
  const short = a => (a && a.length > 16 ? a.slice(0, 7) + "…" + a.slice(-5) : (a || ""));
  const log = m => { if (typeof window.ZVAdminLog === "function") window.ZVAdminLog(m); };
  let tab = "pend";

  const all = () => jg(TX, []).filter(t => t && t.kind === "withdraw").sort((a, b) => (b.ts || 0) - (a.ts || 0));
  const lists = () => { const l = all(); return { pend: l.filter(t => t.status === "pending"), acc: l.filter(t => t.status === "accepted"), done: l.filter(t => ["completed", "confirmed", "rejected"].includes(t.status)).slice(0, 15) }; };
  const count = () => { const L = lists(); return L.pend.length + L.acc.length; };
  const recv = t => (t.holdIn ? (+t.amount || 0) - (+t.hold || 0) : (+t.amount || 0));

  const ST = { pending: ["Pending", ""], accepted: ["Accepted", "ok"], confirmed: ["Completed", "ok"], completed: ["Completed", "ok"], rejected: ["Rejected", "bad"] };
  function row(t) {
    const s = ST[t.status] || [t.status, ""], hold = +t.hold || 0;
    const act = t.status === "pending"
      ? `<div class="bg" style="grid-template-columns:1fr 1fr;margin-top:8px"><button class="sm ap" data-wd="accept" data-id="${esc(t.id)}">Accept</button><button class="sm red" data-wd="reject" data-id="${esc(t.id)}">Reject</button></div>`
      : t.status === "accepted"
        ? `<div class="bg" style="grid-template-columns:1fr 1fr;margin-top:8px"><button class="sm ap" data-wd="confirm" data-id="${esc(t.id)}">Confirm (Completed)</button><button class="sm red" data-wd="reject" data-id="${esc(t.id)}">Reject</button></div>` : "";
    return `<div class="li" style="display:block"><div><b>${num(t.amount)} ${esc(t.sym)}</b> <span class="tag ${s[1]}">${s[0]}</span>` +
      `<small>${esc(t.sub || "")} · ${when(t.ts || Date.now())} · ${esc(t.id)}</small>` +
      `<small style="word-break:break-all;color:#cfc4ff">To: ${esc(t.addr || "—")}</small>` +
      `<small>Member gets ${num(recv(t))} ${esc(t.sym)}${hold > 0 ? ` · Airdrop Hold ${num(hold)} ${esc(t.sym)} (${HOLD}%)` : ""}${t.reason ? ` · ${esc(t.reason)}` : ""}</small></div>${act}</div>`;
  }

  function html() {
    const L = lists(), cur = L[tab] || [];
    const tabs = [["pend", "Pending", L.pend.length], ["acc", "Accepted", L.acc.length], ["done", "Done", 0]];
    const head = `<div class="bg" style="grid-template-columns:repeat(3,1fr)">${tabs.map(([k, n, c]) => `<button class="sm${tab === k ? " ap" : ""}" data-wd="tab" data-t="${k}">${n}${c ? " (" + c + ")" : ""}</button>`).join("")}</div>`;
    const empty = { pend: "No pending withdrawal requests", acc: "No accepted requests waiting for confirmation", done: "Nothing finished yet" }[tab];
    return head + (cur.length ? cur.map(row).join("") : `<div class="li">${empty}</div>`) +
      '<p class="note">Accept shows "Accepted" to the member. After you have sent the payment, press Confirm: the member then sees "Completed" and gets a notification message. Requests are saved on this device for now. They reach real members once the backend is connected.</p>';
  }
  const page = () => ["Withdrawals", html()];
  const paint = () => { const t = $("#shT"), b = $("#shB"); if (!t || !b) return; t.textContent = "Withdrawals"; b.innerHTML = html(); $("#sheet").dataset.k = "wd"; if (typeof window.ZVAdminRenderReq === "function") window.ZVAdminRenderReq(); };

  function notice(t) {
    const hold = +t.hold || 0, n = jg(NK, []);
    n.unshift({ id: "N" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), ts: Date.now(), read: false, kind: "withdraw", ref: t.id,
      title: "Withdrawal completed",
      text: "Your withdrawal " + t.id + " is completed. " + num(recv(t)) + " " + t.sym + " was sent to " + short(t.addr) + "." + (hold > 0 ? " " + num(hold) + " " + t.sym + " (" + HOLD + "%) was added to your Airdrop Hold as ZNV." : "") });
    try { localStorage.setItem(NK, JSON.stringify(n.slice(0, 100))); return true; } catch (e) { return false; }
  }

  function decide(id, act) {
    const list = jg(TX, []), t = list.find(x => x && x.id === id && x.kind === "withdraw");
    if (!t) return toast("Request not found");
    if (act === "accept") {
      if (t.status !== "pending") return toast("Already decided");
      if (!confirm("Accept this withdrawal request?\nThe member will see Accepted.")) return;
      t.status = "accepted"; t.acceptedAt = Date.now();
    } else if (act === "confirm") {
      if (t.status !== "accepted") return toast("Accept it first");
      if (!confirm("Confirm that the payment was sent?\nThe member will see Completed and will get a notification message.")) return;
      t.status = "confirmed"; t.confirmedAt = Date.now();
    } else if (act === "reject") {
      if (t.status !== "pending" && t.status !== "accepted") return toast("Already decided");
      const r = prompt("Reason for rejecting (optional)"); if (r === null) return;
      t.status = "rejected"; t.reason = String(r).slice(0, 80); t.rejectedAt = Date.now();
    } else return;
    t.reviewed = Date.now();
    try { localStorage.setItem(TX, JSON.stringify(list)); } catch (e) { return toast("Could not save"); }
    if (act === "confirm") notice(t);   // the message reaches the member at the same moment
    log("Withdrawal " + (act === "accept" ? "accepted" : act === "confirm" ? "confirmed" : "rejected") + ": " + t.id);
    toast(act === "accept" ? "Accepted. The member sees Accepted" : act === "confirm" ? "Confirmed. The member sees Completed and got a message" : "Rejected. The lock is released");
    if (act === "accept") tab = "acc"; paint();
  }

  const mini = () => { const L = lists(), o = L.pend.concat(L.acc).slice(0, 8);
    return o.length ? o.map(t => `<div class="li"><div>${esc(t.id)}<small>Withdrawal · ${num(t.amount)} ${esc(t.sym)} · ${(ST[t.status] || [t.status])[0]}</small></div><button class="sm ap" data-appr2="wd">Open</button></div>`).join("") : '<div class="li">No pending requests</div>'; };

  document.addEventListener("click", e => {
    const b = e.target.closest("[data-wd]"); if (!b) return; const a = b.dataset.wd;
    if (a === "tab") { tab = b.dataset.t; paint(); } else decide(b.dataset.id, a);
  });
  const refresh = () => { if (typeof window.ZVAdminRenderReq === "function") window.ZVAdminRenderReq(); };
  addEventListener("load", refresh);
  addEventListener("storage", e => { if (e.key === TX) { refresh(); const sh = $("#sheet"); if (sh && sh.classList.contains("on") && sh.dataset.k === "wd") paint(); } });
  window.ZVAdminWithdraw = { page, count, mini };
})();
