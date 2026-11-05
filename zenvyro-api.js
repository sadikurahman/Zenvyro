/* Zenvyro API layer (DEMO MODE).
   Every screen talks only to window.ZenvyroAPI. In demo mode the data lives in this browser (localStorage), so the
   admin page and the app work together on ONE device for testing. When Supabase is connected, only this file is
   replaced; the screens and the rules below stay the same. Demo data is NOT secure and must never hold real money. */
(() => {
  "use strict";
  const KEY = "zenvyro_demo_db_v1";
  const PACKS = { Standard: 10, Silver: 25, Gold: 50, Platinum: 100 };
  const ORDER = ["Free", "Standard", "Silver", "Gold", "Platinum"];
  const MAX_FAILS = 3, BAN_FIRST = 3 * 864e5, BAN_REPEAT = 365 * 864e5;          // 3 days, then 1 year
  const ALPHA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";                              // no I, O, 0, 1
  const ASSETS = [
    { id: "USDT_TRC20", asset: "USDT", network: "TRC20", kind: "hex" },
    { id: "BNB_BEP20", asset: "BNB", network: "BEP20", kind: "evm" },
    { id: "BTC", asset: "BTC", network: "Bitcoin", kind: "hex" },
    { id: "TON", asset: "TON", network: "TON", kind: "ton" },
    { id: "SOL", asset: "SOL", network: "Solana", kind: "sol" }
  ];
  const TX = { hex: /^[0-9a-f]{64}$/i, evm: /^0x[0-9a-f]{64}$/i, ton: /^([0-9a-f]{64}|[A-Za-z0-9+/_-]{43}=?)$/i, sol: /^[1-9A-HJ-NP-Za-km-z]{86,90}$/ };

  const rank = t => Math.max(0, ORDER.indexOf(String(t || "").replace(/ Pack$/, "")));
  const load = () => { try { const d = JSON.parse(localStorage.getItem(KEY) || "null"); if (d && typeof d === "object") return Object.assign(fresh(), d); } catch (e) {} return fresh(); };
  const fresh = () => ({ vouchers: [], users: {}, attempts: [], payments: [], usedTx: {}, purchases: [], addresses: {} });
  const save = db => { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) {} };
  const uid = () => (window.ZENVYRO_USER && window.ZENVYRO_USER.memberId) || "guest";
  const U = (db, id) => db.users[id] || (db.users[id] = { tier: "Free", fails: 0, banCount: 0, bannedUntil: 0, warn: false });
  const banned = u => u.bannedUntil > Date.now();
  const norm = c => String(c || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  const fmt = k => k.match(/.{1,4}/g).join("-");
  const mask = k => k.length > 4 ? k.slice(0, 2) + "..." + k.slice(-2) : "****";
  const rid = p => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const rnd = () => { const a = new Uint32Array(16); (window.crypto || {}).getRandomValues ? crypto.getRandomValues(a) : a.forEach((_, i) => a[i] = Math.random() * 4294967296); return Array.from(a, n => ALPHA[n % 32]).join(""); };
  const att = (db, user, pack, code, reason) => { db.attempts.unshift({ ts: Date.now(), user, pack, code: mask(norm(code)), reason }); db.attempts = db.attempts.slice(0, 300); };
  const fail = (db, u, id, pack, code, reason) => {
    att(db, id, pack, code, reason); u.fails++;
    if (u.fails >= MAX_FAILS) {
      u.banCount++; u.warn = true; u.fails = 0;
      u.bannedUntil = Date.now() + (u.banCount === 1 ? BAN_FIRST : BAN_REPEAT);
      save(db); return { ok: false, error: "banned", bannedUntil: u.bannedUntil, justBanned: true, longBan: u.banCount > 1 };
    }
    save(db); return { ok: false, error: "invalid", failsLeft: MAX_FAILS - u.fails };
  };
  const view = (db, id) => { const u = U(db, id); return { userId: id, tier: u.tier, banned: banned(u), bannedUntil: u.bannedUntil, warn: u.warn, fails: u.fails, failsLeft: MAX_FAILS - u.fails, banCount: u.banCount }; };

  const API = window.ZenvyroAPI = {
    mode: "demo", PACKS, ORDER, ASSETS, MAX_FAILS, rank,
    /* ---------- member side ---------- */
    async me() { const db = load(); const r = view(db, uid()); save(db); return r; },
    async payInfo() { const db = load(); return ASSETS.map(a => ({ ...a, address: db.addresses[a.id] || "" })); },
    async redeem(pack, code) {
      const db = load(), id = uid(), u = U(db, id);
      if (!(pack in PACKS)) return { ok: false, error: "invalid_pack" };
      if (banned(u)) return { ok: false, error: "banned", bannedUntil: u.bannedUntil };
      if (rank(u.tier) >= rank(pack)) return { ok: false, error: "already_have", tier: u.tier };   // double tap or lower pack: never a strike
      const k = norm(code), v = db.vouchers.find(x => x.key === k);
      if (!v) return fail(db, u, id, pack, k, "not_found");
      if (v.status === "disabled") return fail(db, u, id, pack, k, "disabled");
      if (v.status === "used") return fail(db, u, id, pack, k, "already_used");
      if (v.pack !== pack) return fail(db, u, id, pack, k, "wrong_pack");                          // the code is NOT consumed
      v.status = "used"; v.usedBy = id; v.usedAt = Date.now();
      u.tier = pack; u.fails = 0;
      db.purchases.push({ ts: Date.now(), user: id, pack, usd: PACKS[pack], via: "voucher" });
      save(db); return { ok: true, tier: pack };
    },
    async submitPayment({ pack, asset, txid }) {
      const db = load(), id = uid(), u = U(db, id), a = ASSETS.find(x => x.id === asset);
      if (!(pack in PACKS) || !a) return { ok: false, error: "invalid" };
      if (banned(u)) return { ok: false, error: "banned", bannedUntil: u.bannedUntil };
      if (rank(u.tier) >= rank(pack)) return { ok: false, error: "already_have", tier: u.tier };
      const t = String(txid || "").trim();
      if (!TX[a.kind].test(t)) return { ok: false, error: "bad_txid" };
      if (db.payments.filter(p => p.user === id && p.status === "pending").length >= 3) return { ok: false, error: "too_many" };
      const key = t.toLowerCase();
      if (db.usedTx[key]) { att(db, id, pack, t, "txid_reused"); save(db); return { ok: false, error: "txid_used" }; }
      const p = { id: rid("P"), user: id, pack, usd: PACKS[pack], asset, txid: t, status: "pending", createdAt: Date.now(), note: "" };
      db.payments.unshift(p); db.usedTx[key] = p.id; save(db); return { ok: true, payment: p };
    },
    async myPayments() { const db = load(), id = uid(); return db.payments.filter(p => p.user === id).slice(0, 10); },
    /* ---------- admin side ---------- */
    async adminGenerate(pack, qty, batch) {
      if (!(pack in PACKS)) return { ok: false, error: "invalid_pack" };
      qty = Math.floor(+qty); if (!(qty >= 1 && qty <= 200)) return { ok: false, error: "invalid_qty" };
      const db = load(), out = [], have = new Set(db.vouchers.map(v => v.key));
      while (out.length < qty) { const k = rnd(); if (have.has(k)) continue; have.add(k);
        db.vouchers.unshift({ id: rid("V"), key: k, code: fmt(k), pack, usd: PACKS[pack], status: "unused", createdAt: Date.now(), batch: batch || "", usedBy: "", usedAt: 0 }); out.push(fmt(k)); }
      save(db); return { ok: true, codes: out };
    },
    async adminVouchers() { return load().vouchers.slice(0, 500); },
    async adminDisable(id) { const db = load(), v = db.vouchers.find(x => x.id === id); if (!v || v.status !== "unused") return false; v.status = "disabled"; save(db); return true; },
    async adminAttempts() { return load().attempts.slice(0, 100); },
    async adminRestricted() { const db = load(); return Object.keys(db.users).filter(k => { const u = db.users[k]; return banned(u) || u.warn; }).map(k => ({ ...view(db, k) })); },
    async adminUnban(id) { const db = load(), u = db.users[id]; if (!u) return false; u.bannedUntil = 0; u.fails = 0; save(db); return true; },
    async adminPayments() { return load().payments.slice(0, 100); },
    async adminDecide(id, approve, note) {
      const db = load(), p = db.payments.find(x => x.id === id); if (!p || p.status !== "pending") return false;
      p.status = approve ? "approved" : "rejected"; p.decidedAt = Date.now(); p.note = note || "";   // a used TXID stays blocked forever
      if (approve) { const u = U(db, p.user); if (rank(p.pack) > rank(u.tier)) u.tier = p.pack; db.purchases.push({ ts: Date.now(), user: p.user, pack: p.pack, usd: p.usd, via: "crypto" }); }
      save(db); return true;
    },
    async adminSetAddress(id, address) { const db = load(); if (!ASSETS.some(a => a.id === id)) return false; db.addresses[id] = String(address || "").trim().slice(0, 120); save(db); return true; },
    async adminCounts() { const db = load(); return { unused: db.vouchers.filter(v => v.status === "unused").length, pending: db.payments.filter(p => p.status === "pending").length, restricted: Object.values(db.users).filter(banned).length }; }
  };
})();
