
/* Zenvyro Dashboard Statistics
   Demo preview only — real statistics must come from your backend.
*/

(() => {
  "use strict";

  const API_URL = window.ZENVYRO_STATS_ENDPOINT || "";
  const REFRESH_INTERVAL = 4 * 60 * 60 * 1000;

  const demoStats = {
    totalIncome: 1250.75,
    totalWithdraw: 845.25,
    normalUsers: 1280,
    premiumMembers: 365
  };

  const formatMoney = value =>
    Number(value).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

  const formatNumber = value =>
    Number(value).toLocaleString("en-US");

  function updateElement(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
  }

  function renderStats(stats, isDemo = false) {
    updateElement(
      "totalIncome",
      formatMoney(stats.totalIncome) + " USDT"
    );

    updateElement(
      "totalWithdraw",
      formatMoney(stats.totalWithdraw) + " USDT"
    );

    updateElement(
      "normalUsers",
      formatNumber(stats.normalUsers)
    );

    updateElement(
      "premiumMembers",
      formatNumber(stats.premiumMembers)
    );

    updateElement(
      "statsStatus",
      isDemo ? "Demo Preview — Real Data Not Connected" : "Live Data"
    );

    updateElement(
      "statsUpdated",
      "Updated: " + new Date().toLocaleString()
    );
  }

  async function loadStats() {
    if (!API_URL) {
      renderStats(demoStats, true);
      return;
    }

    try {
      const response = await fetch(API_URL, {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store"
      });

      if (!response.ok) {
        throw new Error("Statistics API request failed");
      }

      const stats = await response.json();

      const fields = [
        "totalIncome",
        "totalWithdraw",
        "normalUsers",
        "premiumMembers"
      ];

      for (const field of fields) {
        if (
          stats[field] === undefined ||
          !Number.isFinite(Number(stats[field])) ||
          Number(stats[field]) < 0
        ) {
          throw new Error("Invalid statistics data");
        }
      }

      renderStats(stats, false);
    } catch (error) {
      console.error("Zenvyro stats error:", error);
      updateElement(
        "statsStatus",
        "Unable to load verified statistics"
      );
    }
  }

  function start() {
    loadStats();
    window.setInterval(loadStats, REFRESH_INTERVAL);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
