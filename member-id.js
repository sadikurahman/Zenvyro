/* Zenvyro Member ID: ZNV + 7 characters (6 random + 1 check character) = 10 characters, alphabet of 32 symbols without 0, 1, I, O.
   32^6 = over 1 billion IDs, enough for 10 million+ members. Uniqueness is guaranteed by the DATABASE (UNIQUE column + retry), never by chance.
   The check character catches a mistyped ID before a transfer. Also: copy button and the masked-name lookup animation on Transfer. */
(() => {
  "use strict";
  const A = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ", PRE = "ZNV", STRICT = () => !!window.ZENVYRO_LOOKUP_ENDPOINT;
  const check = b => { let s = 0; for (let i = 0; i < b.length; i++) s += A.indexOf(b[i]) * (i + 1); return A[s % 32]; };
  const rnd6 = () => { const a = new Uint32Array(6); (window.crypto || window.msCrypto).getRandomValues(a); return Array.from(a, v => A[v % 32]).join(""); };
  const make = exists => { for (let i = 0; i < 50; i++) { const b = rnd6(), id = PRE + "-" + b + check(b); if (!exists || !exists(id)) return id; } throw new Error("id"); };
  const norm = s => { const t = String(s || "").toUpperCase().replace(/[^A-Z0-9]/g, ""); return t.length === 10 && t.startsWith(PRE) ? PRE + "-" + t.slice(3) : ""; };
  const valid = id => { const n = norm(id); if (!n) return false; const b = n.slice(4, 10); return [...n.slice(4)].every(c => A.includes(c)) && check(b) === n[10]; };
  const mask = name => String(name || "").trim().split(/\s+/).slice(0, 3).map(w => w[0] + "*".repeat(Math.min(Math.max(w.length - 1, 1), 8))).join(" ");
  const DEMO = [["7K4M9X", "Rohan Ahmed"], ["B3N8QW", "Tanvir Islam"], ["H2R5TD", "Hasan Mahmud"]].map(([b, n]) => ({ id: PRE + "-" + b + check(b), name: n }));
  const jget = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k) || "null"); return v == null ? d : v; } catch (e) { return d; } };
  const COPY = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2.5"/><path d="M5 15V6.5A2.5 2.5 0 0 1 7.5 4H15"/></svg>';
  const TICK = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.2 4.2L19 7"/></svg>';
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const say = m => { if (typeof window.toast === "function") window.toast(m); };
  const css = `
.zid-card{display:none;align-items:center;gap:12px;margin-top:10px;border:1px solid #5a35d8;border-radius:14px;background:#120c40;padding:12px;color:#fff;min-height:58px}
.zid-card.on{display:flex;animation:zidIn .35s ease both}
.zid-card .ck{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;flex-shrink:0;background:#14513f;color:#2bf0b0;animation:zidPop .5s cubic-bezier(.2,1.5,.4,1) both}
.zid-card .ck svg{width:18px;height:18px}
.zid-card .tx{min-width:0;flex:1}.zid-card small{display:block;color:#aeb9ff;font-size:11.5px}
.zid-card b{display:block;font-size:17px;letter-spacing:.06em;overflow-wrap:anywhere;font-variant-numeric:tabular-nums}
.zid-card.ok{border-color:#1fbf8f}.zid-card.bad{border-color:#e0455a;background:#2a0c24}.zid-card.bad .ck{background:#5a1630;color:#ff6fa0}
.zid-card.bad.shake{animation:zidShake .45s ease both}.zid-card.load .ck{background:#1a1058;color:#b28aff;animation:zidSpin 1s linear infinite}
.zid-card.neutral .ck{background:#1a1058;color:#b28aff}
#zvAccount .prof .mid{display:inline-flex;align-items:center;gap:6px;max-width:100%;padding:3px 4px 3px 10px;font-variant-numeric:tabular-nums;letter-spacing:.02em}
#zvAccount .mcp{width:26px;height:26px;border-radius:50%;border:1px solid #6b45d8;background:#2a1475;color:#e0d2ff;display:grid;place-items:center;padding:0;flex-shrink:0;transition:transform .15s,background .2s}
#zvAccount .mcp:active{transform:scale(.88)}#zvAccount .mcp.done{background:#14513f;border-color:#1fbf8f;color:#2bf0b0}
@keyframes zidIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
@keyframes zidPop{from{transform:scale(.3);opacity:0}to{transform:scale(1);opacity:1}}
@keyframes zidShake{0%,100%{transform:translateX(0)}20%{transform:translateX(-7px)}40%{transform:translateX(6px)}60%{transform:translateX(-4px)}80%{transform:translateX(3px)}}
@keyframes zidSpin{to{transform:rotate(360deg)}}
@media(prefers-reduced-motion:reduce){.zid-card.on,.zid-card .ck,.zid-card.bad.shake,.zid-card.load .ck{animation:none}}`;
  const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

  let tok = 0, timer = 0, found = "";
  const show = (card, cls, label, text, icon) => { card.className = "zid-card on " + cls; card.innerHTML = '<span class="ck">' + (icon || TICK) + '</span><div class="tx"><small>' + esc(label) + "</small><b>" + esc(text) + "</b></div>"; if (cls === "bad") { card.classList.remove("shake"); void card.offsetWidth; card.classList.add("shake"); } return card.querySelector("b"); };
  async function findName(id) {
    const d = DEMO.find(x => x.id === id); if (d) return d.name;
    const u = Object.values(jget("zenvyro_auth_users_v1", {}) || {}).find(x => x && x.memberId === id); if (u) return u.name;
    const ep = window.ZENVYRO_LOOKUP_ENDPOINT; if (!ep) return "";
    try { const r = await fetch(ep + (ep.includes("?") ? "&" : "?") + "id=" + encodeURIComponent(id), { cache: "no-store", headers: { Accept: "application/json" } }); if (!r.ok) return r.status === 404 ? "" : null; const j = await r.json(); return j && j.name ? String(j.name) : ""; } catch (e) { return null; }
  }
  async function lookup(el, card) {
    if (!el || !card) return; const my = ++tok; clearInterval(timer); found = "";
    const raw = el.value, alnum = raw.replace(/[^A-Za-z0-9]/g, ""), id = norm(raw);
    if (!alnum) { card.className = "zid-card"; return; }
    if (id && raw !== id) el.value = id;
    if (!id) { if (alnum.length > 10) show(card, "bad", "Recipient ID", "ID is not valid", TICK); else card.className = "zid-card"; return; }
    if (!valid(id)) { show(card, "bad", "Recipient ID", "ID is not valid. Check each character."); return; }
    const me = (window.ZENVYRO_USER && window.ZENVYRO_USER.memberId) || ""; if (id === me) { show(card, "neutral", "Recipient ID", "This is your own ID."); return; }
    show(card, "load", "Checking ID", id);
    const name = await findName(id); if (my !== tok) return;
    if (name === null) { show(card, "bad", "Recipient ID", "Could not check the ID. Try again."); return; }
    if (!name) { if (STRICT()) show(card, "bad", "Recipient ID", "ID not found"); else show(card, "neutral", "Valid ID", "Recipient name is shown once the server is connected."); return; }
    found = id; const fin = mask(name), nm = show(card, "ok", "Recipient", ""), reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { nm.textContent = fin; return; }
    const S = "abcdefghkmnpqrstuvwxyz*#%@", N = 24; let i = 0;
    timer = setInterval(() => { if (my !== tok) { clearInterval(timer); return; } i++; const fix = Math.floor(fin.length * i / N); nm.textContent = fin.split("").map((c, k) => c === " " ? " " : k < fix ? c : S[Math.floor(Math.random() * S.length)]).join(""); if (i >= N) { clearInterval(timer); nm.textContent = fin; } }, 45);
  }
  async function copyText(t) { try { if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(t); return true; } } catch (e) {} try { const a = document.createElement("textarea"); a.value = t; a.style.cssText = "position:fixed;opacity:0"; document.body.appendChild(a); a.select(); const ok = document.execCommand("copy"); a.remove(); return ok; } catch (e) { return false; } }
  window.zvaCopyId = async btn => { const ok = await copyText(btn.dataset.id || ""); if (!ok) return say("Could not copy"); btn.innerHTML = TICK; btn.classList.add("done"); say("ID copied"); setTimeout(() => { btn.innerHTML = COPY; btn.classList.remove("done"); }, 1400); };
  window.zvwTrTo = el => lookup(el, document.getElementById("trCard"));
  window.ZenvyroId = { make, norm, valid, mask, check, copyIcon: COPY, demoMembers: DEMO, lastFound: id => found === id, lookup };
})();
