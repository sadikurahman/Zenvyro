/* Zenvyro supported countries: used by the registration Country list and the Covered Countries box on Home.
   Edit the lists freely; the box label ("70+") follows the number of countries in the lists. */
(() => {
  "use strict";
  const R = {
    "South Asia": ["Afghanistan", "Bangladesh", "Bhutan", "India", "Maldives", "Nepal", "Pakistan", "Sri Lanka"],
    "Southeast Asia": ["Cambodia", "Indonesia", "Malaysia", "Philippines", "Singapore", "Thailand", "Vietnam"],
    "Middle East": ["Bahrain", "Jordan", "Kuwait", "Oman", "Qatar", "Saudi Arabia", "United Arab Emirates"],
    "Africa": ["Algeria", "Angola", "Benin", "Botswana", "Burkina Faso", "Cameroon", "Côte d'Ivoire", "DR Congo", "Egypt", "Ethiopia", "Gabon", "Ghana", "Kenya", "Liberia", "Madagascar", "Malawi", "Mauritius", "Morocco", "Mozambique", "Namibia", "Nigeria", "Rwanda", "Senegal", "Sierra Leone", "South Africa", "Tanzania", "Tunisia", "Uganda", "Zambia", "Zimbabwe"],
    "Europe": ["Albania", "Austria", "Belgium", "Bulgaria", "Croatia", "Cyprus", "Czechia", "Denmark", "Estonia", "Finland", "France", "Germany", "Greece", "Hungary", "Iceland", "Ireland", "Italy", "Latvia", "Lithuania", "Malta", "Netherlands", "North Macedonia", "Norway", "Poland", "Portugal", "Romania", "Serbia", "Slovakia", "Slovenia", "Spain", "Sweden", "Switzerland", "United Kingdom"]
  };
  const list = []; Object.keys(R).forEach(r => R[r].forEach(n => list.push({ name: n, region: r })));
  const esc = s => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
  const label = () => { let s = 0; [30, 50, 70, 100, 150, 200].forEach(x => { if (list.length >= x) s = x; }); return s ? s + "+" : String(list.length); };
  window.ZenvyroCountries = {
    regions: R, list, count: list.length, label,
    optionsHtml: ph => '<option value="">' + esc(ph || "Select country") + "</option>" + Object.keys(R).map(r => '<optgroup label="' + r + '">' + R[r].map(n => '<option value="' + esc(n) + '">' + esc(n) + "</option>").join("") + "</optgroup>").join("")
  };
  const set = () => { const el = document.getElementById("cdCountries"); if (el) el.textContent = label(); };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", set); else set();
})();
