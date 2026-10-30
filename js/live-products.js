/* =====================================================================
   BRUTBOX & CO. — live-products.js
   Shows products that the admin uploaded (source: "admin") on any page
   that contains an element with id="live-products".
   Reads the same localStorage data the admin panel writes.
   ===================================================================== */
(function () {
  "use strict";
  var host = document.getElementById("live-products");
  if (!host) return;

  var KEY = "bb_products";
  var CONFIG = { lowStock: 5 };
  var esc = function (s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };
  var money = function (n) { return "৳" + Math.round(Number(n) || 0).toLocaleString("en-US"); };
  var total = function (stock) {
    return Object.keys(stock || {}).reduce(function (sum, c) {
      return sum + Object.keys(stock[c]).reduce(function (s, z) { return s + Number(stock[c][z] || 0); }, 0);
    }, 0);
  };
  var catName = function (slug) {
    var names = { underwear: "Underwear", "bow-ties": "Bow Ties", "pocket-squares": "Pocket Squares", socks: "Socks", "eyeglass-covers": "Eyeglass Covers", wallets: "Wallets" };
    return names[slug] || slug;
  };

  function read() {
    try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch (e) { return []; }
  }

  function render() {
    var list = read().filter(function (p) { return p.source === "admin" && !p.hidden; });
    if (!list.length) { host.innerHTML = ""; host.hidden = true; return; }
    host.hidden = false;
    host.innerHTML = list.map(function (p) {
      var t = total(p.stock);
      var badge = t === 0 ? "<span class='live-badge out'>Sold out</span>"
        : t <= CONFIG.lowStock ? "<span class='live-badge low'>Only " + t + " left</span>"
        : "<span class='live-badge new'>New</span>";
      return '<article class="product-card live-card' + (t === 0 ? " is-soldout" : "") + '" data-cat="' + esc(p.category) + '">' +
        '<div class="product-media-link"><div class="product-media"><img src="' + esc(p.image) + '" alt="' + esc(p.name) + '" loading="lazy" decoding="async" /></div>' + badge + "</div>" +
        '<div class="product-card-info"><div class="product-card-meta"><span class="eyebrow dark">' + esc(catName(p.category)) + "</span></div>" +
        "<h3>" + esc(p.name) + "</h3>" +
        '<div class="product-card-bottom"><strong>' + money(p.price) + "</strong><span>" + esc((p.sizes || []).join(" · ")) + "</span></div>" +
        "</div></article>";
    }).join("");
  }

  window.addEventListener("storage", function (e) { if (e.key === KEY) render(); });
  render();
})();
