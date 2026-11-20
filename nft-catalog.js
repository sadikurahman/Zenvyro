/* Zenvyro — NFT catalog shared by the app and the Admin panel.
   DEMO: stored in this browser (localStorage). In the real system this lives on the server and only the admin can change it. */
(() => {
  "use strict";
  const KEY = "zenvyro_nft_catalog_v1", DAY = 864e5, OFF = 16 * 36e5; // a new "day" starts at 10 PM Asia/Dhaka (UTC+6) = 16:00 UTC
  const r2 = x => Math.round(x * 100) / 100;
  const BADGES = { Hot: ["Hot", "hot"], Premium: ["Premium", "pre"], Popular: ["Popular", "pop"], New: ["New", "new"] };
  const mk = (id, name, img, price, cats, badge, stock, bt, bv, dur) => ({ id, name, img, price, disc: 0, discEnd: null, cats, badge, stock, sold: 0, saleDays: null, saleStart: Date.now(), created: null, durDays: dur, btype: bt, bval: bv, hidden: false });
  // Sample NFTs only: the admin edits or hides them in Market Place.
  const seed = () => ({ v: 1, cats: ["Limited", "Legendary", "Trending"], items: [
    mk("N001", "Cyber Knight #001", "nft-knight.jpg", 160, ["Trending"], "Hot", 100, "mining", 50, 30),
    mk("N009", "Royal Lion #009", "nft-lion.jpg", 240, ["Legendary", "Limited"], "Premium", 50, "trx", 1.5, 30),
    mk("N023", "Crypto Ape #023", "nft-ape.jpg", 315, ["Trending", "Limited"], "Popular", 30, "comm", 0.5, 60),
    mk("N017", "Space Explorer #017", "nft-astro.jpg", 200, ["Limited"], "New", null, "mining", 100, null)] });
  // Badges are automatic: "New" for NEW_DAYS after the admin adds an NFT, "Hot" for the best seller (at least one sale). Hot wins if both apply.
  const NEW_DAYS = 7;
  const autoBadge = (i, items, t) => {
    const vis = items.filter(x => !x.hidden), top = Math.max(0, ...vis.map(x => +x.sold || 0));
    if (top > 0 && (+i.sold || 0) === top) return "Hot";
    return i.created && t - i.created <= NEW_DAYS * DAY ? "New" : "";
  };
  function save(c) { try { localStorage.setItem(KEY, JSON.stringify(c)); } catch (e) { return false; } return true; }
  function get() {
    let c = null; try { c = JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) {}
    if (!c || !Array.isArray(c.items) || !Array.isArray(c.cats)) { c = seed(); save(c); }
    c.items.forEach(i => { if (!Array.isArray(i.cats)) i.cats = []; });
    return c;
  }
  const discPct = (i, t) => (+i.disc > 0 && (!i.discEnd || t <= i.discEnd)) ? +i.disc : 0;
  const priceNow = (i, t) => Math.max(0.01, r2(i.price * (1 - discPct(i, t) / 100)));
  const saleEnd = i => i.saleDays ? i.saleStart + i.saleDays * DAY : null;
  const saleOpen = (i, t) => { const e = saleEnd(i); return !i.hidden && (!e || t <= e); };
  const left = i => i.stock == null ? Infinity : Math.max(0, i.stock - (i.sold || 0));
  const benefitText = (bt, bv) => bt === "mining" ? "+" + bv + "% extra ZENY on every mining claim" : bt === "trx" ? bv + " TRX every day" : bv + "% of the price paid, in TRX every day";
  window.ZenvyroNftCatalog = { KEY, DAY, OFF, slotOf: ts => Math.floor((ts - OFF) / DAY), BADGES, NEW_DAYS, autoBadge, get, save, discPct, priceNow, saleEnd, saleOpen, left, benefitText, r2 };
})();
