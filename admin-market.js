/* Zenvyro Admin — Market Place page (add / edit / hide NFTs, categories). Demo: saves to this browser. */
(() => {
  "use strict";
  const C = window.ZenvyroNftCatalog; if (!C) return;
  const $ = s => document.querySelector(s), DAY = C.DAY;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const toast = m => { const t = $("#toast"); if (!t) return; t.textContent = m; t.classList.add("on"); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove("on"), 2600); };
  const HINT = { mining: "% of the member's own mining claim, paid as extra ZENY", trx: "TRX paid every day (new day = 10 PM Bangladesh time)", comm: "% of the TRX price paid, paid every day as TRX" };
  let cat = null, editId = null, imgData = null;
  const paint = (t, h) => { $("#shT").textContent = t; $("#shB").innerHTML = h; $("#sheet").dataset.k = "mkt"; };
  const status = (i, t) => i.hidden ? ["Hidden", "bad"] : C.left(i) <= 0 ? ["Sold out", "bad"] : !C.saleOpen(i, t) ? ["Sale ended", "bad"] : ["Live", "ok"];

  function list() {
    cat = C.get(); const t = Date.now();
    return `<div class="bg"><button class="sm ap" data-mk="new">+ Add NFT</button><button class="sm" data-mk="cats">Categories</button></div>` +
      (cat.items.map(i => { const s = status(i, t), d = C.discPct(i, t);
        return `<div class="li u" data-mk="edit" data-id="${esc(i.id)}"><div>${esc(i.name)}<small>${i.price} TRX${d ? " (-" + d + "%)" : ""} · ${esc(i.cats.join(", ") || "No category")} · ${esc(C.benefitText(i.btype, i.bval))} · ${i.durDays ? i.durDays + " days" : "Permanent"} · Sold ${i.sold || 0}/${i.stock == null ? "no limit" : i.stock}</small></div><span class="tag ${s[1]}">${s[0]}</span></div>`; }).join("") || '<div class="li">No NFT yet</div>') +
      '<p class="note">Changes apply to new buyers only. NFTs people already own keep the terms they were bought with. Hide an NFT instead of deleting it.</p>';
  }
  function cats() {
    cat = C.get();
    return `<div class="bg"><button class="sm" data-mk="list">Back</button></div>` +
      cat.cats.map(c => `<div class="li"><span>${esc(c)}</span><button class="sm red" data-mk="catdel" data-c="${esc(c)}">Remove</button></div>`).join("") +
      '<p class="sub">New category</p><input class="in" id="mkCat" maxlength="16" placeholder="Letters, numbers and spaces"><button class="pr" data-mk="catadd">Add category</button>';
  }
  function addCat() {
    const v = $("#mkCat").value.trim();
    if (!/^[A-Za-z0-9 &-]{1,16}$/.test(v) || /^(all nfts|my nfts)$/i.test(v)) return toast("Use 1-16 letters or numbers");
    if (cat.cats.some(c => c.toLowerCase() === v.toLowerCase())) return toast("Category already exists");
    cat.cats.push(v); C.save(cat); paint("Categories", cats());
  }
  function delCat(c) {
    if (!confirm("Remove category " + c + "? NFTs in it stay, only the tag is removed.")) return;
    cat.cats = cat.cats.filter(x => x !== c); cat.items.forEach(i => { i.cats = i.cats.filter(x => x !== c); }); C.save(cat); paint("Categories", cats());
  }
  function form(id) {
    cat = C.get(); const t = Date.now();
    const i = id ? cat.items.find(x => x.id === id) : { id: "", name: "", img: "", price: "", disc: 0, discEnd: null, cats: [], badge: "", stock: null, sold: 0, saleDays: null, saleStart: t, durDays: 30, btype: "mining", bval: "", hidden: false };
    editId = id || null; imgData = String(i.img).startsWith("data:") ? i.img : null;
    const dRem = i.discEnd ? Math.max(1, Math.ceil((i.discEnd - t) / DAY)) : "";
    const sLeft = i.saleDays ? Math.max(0, Math.ceil((i.saleStart + i.saleDays * DAY - t) / DAY)) : null;
    const num = (idn, v, ph, st) => `<input class="in" id="${idn}" type="number" inputmode="decimal" min="0" step="${st || "any"}" value="${v == null ? "" : v}" placeholder="${ph || ""}">`;
    return `<div class="bg"><button class="sm" data-mk="list">Back</button></div>
<p class="sub">Name</p><input class="in" id="mkName" maxlength="40" value="${esc(i.name)}" placeholder="e.g. Cyber Knight #001">
<p class="sub">Image</p>${i.img ? `<img id="mkPrev" src="${esc(i.img)}" alt="" style="width:96px;height:72px;object-fit:cover;border-radius:12px;display:block;margin-bottom:8px">` : '<img id="mkPrev" alt="" style="display:none">'}<input id="mkFile" type="file" accept="image/*" style="color:#fff;margin-bottom:8px"><input class="in" id="mkImg" value="${imgData ? "" : esc(i.img)}" placeholder="or an image file name / link">
<p class="sub">Price (TRX)</p>${num("mkPrice", i.price, "TRX")}
<p class="sub">Discount % (0 = none)</p>${num("mkDisc", i.disc || "", "0 to 90")}
<p class="sub">Discount lasts (days, empty = no end)</p>${num("mkDiscD", dRem, "empty = until you remove it", "1")}
<p class="sub">Categories (where it shows)</p>${cat.cats.map(c => `<label class="li"><span>${esc(c)}</span><input type="checkbox" class="mkc" value="${esc(c)}" ${i.cats.includes(c) ? "checked" : ""}></label>`).join("") || '<div class="li">No category yet (add one in Categories)</div>'}
<p class="sub">Badge</p><select class="in" id="mkBadge">${["", "Hot", "Premium", "Popular", "New"].map(b => `<option value="${b}" ${i.badge === b ? "selected" : ""}>${b || "None"}</option>`).join("")}</select>
<p class="sub">Stock (how many can be sold${id ? "; sold so far " + i.sold : ""})</p>${num("mkStock", i.stock, "e.g. 100", "1")}<label class="li"><span>Unlimited stock</span><input type="checkbox" id="mkUnl" ${i.stock == null ? "checked" : ""}></label>
<p class="sub">Sale open for (days, empty = unlimited)</p>${num("mkSale", i.saleDays, "empty = always for sale", "1")}${sLeft !== null ? `<p class="note">${sLeft} day(s) left. Changing this number restarts the count from today.</p>` : ""}
<p class="sub">Active period after purchase (days)</p>${num("mkDur", i.durDays, "e.g. 30", "1")}<label class="li"><span>Permanent (lifetime benefit)</span><input type="checkbox" id="mkPerm" ${i.durDays == null ? "checked" : ""}></label>
<p class="sub">Benefit</p><select class="in" id="mkType">${[["mining", "Mining speed (extra ZENY)"], ["trx", "Fixed TRX per day"], ["comm", "Commission rate (% of price, TRX per day)"]].map(b => `<option value="${b[0]}" ${i.btype === b[0] ? "selected" : ""}>${b[1]}</option>`).join("")}</select>
<p class="sub" id="mkHint">${HINT[i.btype]}</p>${num("mkVal", i.bval, "value")}
<label class="li"><span>Hide from the marketplace</span><input type="checkbox" id="mkHide" ${i.hidden ? "checked" : ""}></label>
<button class="pr" data-mk="save">Save NFT</button>`;
  }
  const nextId = () => { let m = 0; cat.items.forEach(i => { const r = /^N(\d+)$/.exec(i.id); if (r) m = Math.max(m, +r[1]); }); return "N" + String(m + 1).padStart(3, "0"); };
  function save() {
    const g = id => $("#" + id), t = Date.now(), old = editId ? cat.items.find(x => x.id === editId) : null;
    const name = g("mkName").value.trim(); if (!name) return toast("Enter a name");
    const img = imgData || g("mkImg").value.trim(); if (!img) return toast("Add an image");
    const price = +g("mkPrice").value; if (!(price > 0)) return toast("Enter a valid price");
    const disc = +g("mkDisc").value || 0; if (disc < 0 || disc > 90) return toast("Discount must be 0 to 90");
    const sold = old ? (old.sold || 0) : 0;
    let stock = null;
    if (!g("mkUnl").checked) { stock = Math.floor(+g("mkStock").value); if (!(stock >= 1)) return toast("Enter the stock"); if (stock < sold) return toast("Stock cannot be below sold (" + sold + ")"); }
    const sv = g("mkSale").value.trim(), saleDays = sv === "" ? null : Math.floor(+sv);
    if (saleDays !== null && !(saleDays >= 1)) return toast("Sale days must be 1 or more");
    let durDays = null;
    if (!g("mkPerm").checked) { durDays = Math.floor(+g("mkDur").value); if (!(durDays >= 1)) return toast("Enter the active days"); }
    const btype = g("mkType").value, bval = +g("mkVal").value; if (!(bval > 0)) return toast("Enter the benefit value");
    if (btype === "comm" && bval > 100) return toast("Commission rate cannot be over 100%");
    if (btype === "mining" && bval > 1000) return toast("Mining boost cannot be over 1000%");
    let discEnd = null;
    if (disc > 0) {
      const dv = g("mkDiscD").value.trim();
      if (dv !== "") { const d = Math.floor(+dv); if (!(d >= 1)) return toast("Discount days must be 1 or more"); const o = old && old.discEnd ? Math.max(1, Math.ceil((old.discEnd - t) / DAY)) : null; discEnd = o === d ? old.discEnd : t + d * DAY; }
    }
    const rec = { id: old ? old.id : nextId(), name, img, price, disc, discEnd, cats: [...document.querySelectorAll(".mkc:checked")].map(x => x.value), badge: g("mkBadge").value, stock, sold, saleDays,
      saleStart: old && String(old.saleDays || "") === String(saleDays || "") ? old.saleStart : t, durDays, btype, bval, hidden: g("mkHide").checked };
    if (old) Object.assign(old, rec); else cat.items.push(rec);
    if (!C.save(cat)) return toast("Could not save (storage full). Use a smaller image");
    toast("NFT saved"); paint("Market Place", list());
  }
  function pick(file) {
    const r = new FileReader();
    r.onload = () => { const im = new Image(); im.onload = () => { const s = Math.min(1, 480 / Math.max(im.width, im.height)), c = document.createElement("canvas"); c.width = Math.round(im.width * s); c.height = Math.round(im.height * s); c.getContext("2d").drawImage(im, 0, 0, c.width, c.height); imgData = c.toDataURL("image/jpeg", .82); const p = $("#mkPrev"); if (p) { p.src = imgData; p.style.cssText = "width:96px;height:72px;object-fit:cover;border-radius:12px;display:block;margin-bottom:8px"; } }; im.src = r.result; };
    r.readAsDataURL(file);
  }
  document.addEventListener("click", e => {
    const b = e.target.closest("[data-mk]"); if (!b) return; const a = b.dataset.mk;
    if (a === "list") paint("Market Place", list()); else if (a === "new") paint("New NFT", form(null)); else if (a === "edit") paint("Edit NFT", form(b.dataset.id));
    else if (a === "cats") paint("Categories", cats()); else if (a === "catadd") addCat(); else if (a === "catdel") delCat(b.dataset.c); else if (a === "save") save();
  });
  document.addEventListener("change", e => {
    if (e.target.id === "mkFile" && e.target.files[0]) pick(e.target.files[0]);
    if (e.target.id === "mkType") $("#mkHint").textContent = HINT[e.target.value];
  });
  window.ZVAdminMarket = { page: () => ["Market Place", list()] };
})();
