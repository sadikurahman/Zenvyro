/* Zenvyro — warms the picture cache so Wallet, Exchange, Deposit, Withdraw and Transfer open without waiting for their images.
   Runs once the Home has finished loading, one picture at a time, so the Home itself is never slowed down.
   Each page file lists its own sprite in window.ZV_ART (with its exact versioned URL), so nothing has to be kept in sync here. */
(() => {
  "use strict";
  const keep = (window.ZV_WARM = window.ZV_WARM || []);
  function go() {
    const list = (window.ZV_ART || []).slice(), seen = {};
    const next = () => {
      const u = list.shift(); if (!u) return;
      if (seen[u]) return next(); seen[u] = 1;
      const im = new Image(); im.decoding = "async"; im.src = u; keep.push(im);   // kept in memory so the decoded picture is not thrown away
      const done = () => setTimeout(next, 120);
      (im.decode ? im.decode() : Promise.resolve()).then(done, done);
    };
    next();
  }
  const idle = window.requestIdleCallback ? f => window.requestIdleCallback(f, { timeout: 3000 }) : f => setTimeout(f, 1200);
  if (document.readyState === "complete") idle(go); else addEventListener("load", () => idle(go));
})();
