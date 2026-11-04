/* Zenvyro Tokenomics chart: self-contained SVG donut (no external library, works offline).
   Hover, tap, or keyboard focus a slice or a legend row to see its label, share and amount. */
(() => {
  "use strict";
  const TOTAL = 75000000;
  const DATA = [
    { name: "Community Mining & Airdrop", short: "COMMUNITY MINING", pct: 40, c: "#8d42ff" },
    { name: "Future Launches & Ecosystem", short: "FUTURE LAUNCHES", pct: 30, c: "#d24bff" },
    { name: "Liquidity Pool", short: "LIQUIDITY POOL", pct: 10, c: "#4be0b2" },
    { name: "Marketing & Partnerships", short: "MARKETING", pct: 10, c: "#e5c16c" },
    { name: "Team & Future Development", short: "TEAM & DEVELOPMENT", pct: 10, c: "#4a7bff" }
  ];
  const fmt = n => n.toLocaleString("en-US");
  const NS = "http://www.w3.org/2000/svg", R = 86, C = 2 * Math.PI * R, GAP = 3;

  function init() {
    const box = document.getElementById("tk"); if (!box) return;
    const g = document.getElementById("tkSlices"), leg = document.getElementById("tkLeg");
    const lbl = document.getElementById("tkLbl"), big = document.getElementById("tkBig"), sub = document.getElementById("tkSub");
    const slices = [], rows = [];
    let acc = 0;

    DATA.forEach((d, i) => {
      d.amt = TOTAL * d.pct / 100;
      const len = d.pct / 100 * C - GAP;
      const s = document.createElementNS(NS, "circle");
      s.setAttribute("class", "tk-s");
      s.setAttribute("cx", 130); s.setAttribute("cy", 130); s.setAttribute("r", R);
      s.setAttribute("stroke", d.c);
      s.setAttribute("transform", `rotate(${acc * 3.6 - 90} 130 130)`);
      s.setAttribute("tabindex", "0"); s.setAttribute("role", "img");
      s.setAttribute("aria-label", `${d.name}: ${d.pct}%, ${fmt(d.amt)} ZENY`);
      s.style.setProperty("--c", d.c); s.style.setProperty("--g", d.c + "88");
      s.style.strokeDasharray = `0 ${C}`;
      s.dataset.len = len; s.dataset.i = i;
      g.appendChild(s); slices.push(s);
      acc += d.pct;

      const r = document.createElement("button");
      r.type = "button"; r.className = "tk-row"; r.dataset.i = i;
      r.style.setProperty("--c", d.c); r.style.setProperty("--g", d.c + "66");
      r.innerHTML = `<i></i><div><b>${d.name}</b><small>${fmt(d.amt)} ZENY</small></div><strong>${d.pct}%</strong>`;
      leg.appendChild(r); rows.push(r);
    });

    function set(i) {
      slices.forEach((s, k) => s.classList.toggle("on", k === i));
      rows.forEach((r, k) => r.classList.toggle("on", k === i));
      box.classList.toggle("has", i >= 0);
      if (i < 0) { lbl.textContent = "TOTAL SUPPLY"; big.textContent = fmt(TOTAL); big.className = "sm"; sub.textContent = "ZENY"; }
      else { const d = DATA[i]; lbl.textContent = d.short; big.textContent = d.pct + "%"; big.className = ""; sub.textContent = fmt(d.amt) + " ZENY"; }
    }
    set(-1);

    const idx = e => { const t = e.target.closest("[data-i]"); return t && box.contains(t) ? +t.dataset.i : -1; };
    box.addEventListener("pointerover", e => { if (e.pointerType === "mouse") { const i = idx(e); if (i >= 0) set(i); } });
    box.addEventListener("pointerleave", e => { if (e.pointerType === "mouse") set(-1); });
    box.addEventListener("click", e => { const i = idx(e); if (i >= 0) set(i); });
    box.addEventListener("focusin", e => { const i = idx(e); if (i >= 0) set(i); });
    box.addEventListener("focusout", () => set(-1));
    document.addEventListener("pointerdown", e => { if (!box.contains(e.target)) set(-1); });

    let shown = false;
    function reveal() {
      if (shown) return; shown = true;
      slices.forEach((s, i) => setTimeout(() => { s.style.strokeDasharray = `${s.dataset.len} ${C - s.dataset.len}`; }, 120 + i * 160));
    }
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(es => { if (es.some(x => x.isIntersecting)) { reveal(); io.disconnect(); } }, { threshold: .25 });
      io.observe(box);
    } else reveal();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
