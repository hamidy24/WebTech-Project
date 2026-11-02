/* =====================================================================
   BRUTBOX & CO. — live-products.js
   Shows products uploaded through the admin panel (source: "admin") on any
   page with an element id="live-products". Each card shows the main photo,
   swaps to the second photo on hover, and opens the quick-view preview.
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
  function images(p) {
    if (p.images && p.images.length) return p.images;
    return p.image ? [p.image] : [];
  }
  function read() {
    try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch (e) { return []; }
  }

  function render() {
    var list = read().filter(function (p) { return p.source === "admin" && !p.hidden; });
    if (!list.length) { host.innerHTML = ""; host.hidden = true; return; }
    host.hidden = false;
    host.innerHTML = list.map(function (p) {
      var t = total(p.stock);
      var imgs = images(p);
      var badge = t === 0 ? "<span class='live-badge out'>Sold out</span>"
        : t <= CONFIG.lowStock ? "<span class='live-badge low'>Only " + t + " left</span>"
        : "<span class='live-badge new'>New</span>";
      var second = imgs.length > 1 ? "<img class='media-second' src='" + esc(imgs[1]) + "' alt='' loading='lazy' decoding='async' />" : "";
      var count = imgs.length > 1 ? "<span class='photo-count' aria-hidden='true'>" + imgs.length + " photos</span>" : "";
      return '<article class="product-card live-card' + (t === 0 ? " is-soldout" : "") + '" data-cat="' + esc(p.category) + '">' +
        '<button type="button" class="live-media" data-preview-id="' + esc(p.id) + '" aria-label="Preview ' + esc(p.name) + ' photos">' +
          '<span class="product-media"><img class="media-main" src="' + esc(imgs[0] || "") + '" alt="' + esc(p.name) + '" loading="lazy" decoding="async" />' + second + "</span>" +
          badge + count +
          '<span class="quick-view-hint">Quick view</span>' +
        "</button>" +
        '<div class="product-card-info"><div class="product-card-meta"><span class="eyebrow dark">' + esc(catName(p.category)) + "</span></div>" +
        "<h3>" + esc(p.name) + "</h3>" +
        '<div class="product-card-bottom"><strong>' + money(p.price) + "</strong><span>" + esc((p.sizes || []).join(" · ")) + "</span></div>" +
        "</div></article>";
    }).join("");
  }

  window.addEventListener("storage", function (e) { if (e.key === KEY) render(); });
  render();
})();
