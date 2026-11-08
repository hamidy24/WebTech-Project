/* =====================================================================
   BRUTBOX & CO. — catalog-shop.js
   Renders the shop: category sections, filter bar, product cards.
   Uses the products saved by the admin when present, otherwise the
   catalogue file. Clicking a card opens the quick-view popup.
   ===================================================================== */
(function () {
  "use strict";
  var root = document.getElementById("shop-root");
  var chips = document.getElementById("shop-chips");
  var CAT = window.BRUTBOX_CATALOG;
  if (!root || !CAT) return;

  var esc = function (s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };
  var money = function (n) { return "৳" + Math.round(Number(n) || 0).toLocaleString("en-US"); };
  var totalStock = function (stock) {
    return Object.keys(stock || {}).reduce(function (sum, c) {
      return sum + Object.keys(stock[c]).reduce(function (s, z) { return s + Number(stock[c][z] || 0); }, 0);
    }, 0);
  };

  function products() {
    try {
      var saved = JSON.parse(localStorage.getItem("bb_products") || "[]");
      if (saved.length) return saved.filter(function (p) { return !p.hidden; });
    } catch (e) { /* use the catalogue */ }
    return CAT.products;
  }

  function currentCategory() {
    var q = new URLSearchParams(location.search).get("cat");
    var hash = (location.hash || "").slice(1);
    var pick = q || hash;
    return CAT.categories.some(function (c) { return c.slug === pick; }) ? pick : "all";
  }

  function card(p) {
    var imgs = (p.images && p.images.length) ? p.images : [p.image];
    var t = totalStock(p.stock);
    var badge = t === 0 ? "<span class='live-badge out'>Sold out</span>"
      : p.badge ? "<span class='live-badge new'>" + esc(String(p.badge).replace(/_/g, " ")) + "</span>" : "";
    var dots = (p.colors || []).slice(0, 4).map(function (c) {
      var hex = (CAT.colourHex && CAT.colourHex[c]) || "#9aa0a6";
      return "<i title='" + esc(c) + "' style='background:" + hex + "'></i>";
    }).join("");
    var old = p.originalPrice ? " <s class='shop-old'>" + money(p.originalPrice) + "</s>" : "";
    var rating = p.rating ? "<span class='shop-rating'>★ " + Number(p.rating).toFixed(1) + (p.reviewCount ? " (" + p.reviewCount + ")" : "") + "</span>" : "";
    var hoverIdx = p.photoCount ? p.photoCount : 1;   // hover shows the first colour picture
    var second = imgs.length > hoverIdx ? "<img class='media-second' src='" + esc(imgs[hoverIdx]) + "' alt='' loading='lazy' decoding='async' />" : "";
    return "<article class='product-card live-card" + (t === 0 ? " is-soldout" : "") + "'>" +
      "<button type='button' class='live-media' data-preview-id='" + esc(p.id) + "' aria-label='Preview " + esc(p.name) + "'>" +
        (imgs[0]
          ? "<span class='product-media'><img class='media-main' src='" + esc(imgs[0]) + "' alt='" + esc(p.name) + "' loading='lazy' decoding='async' />" + second + "</span>"
          : "<span class='product-media noimg' aria-hidden='true'><span>" + esc(String(p.name).charAt(0)) + "</span><small>" + esc(String(p.category).replace(/-/g, " ")) + "</small></span>") +
        badge + "<span class='quick-view-hint'>Quick view</span>" +
      "</button>" +
      "<div class='product-card-info'>" +
        "<h3 class='shop-name'>" + esc(p.name) + "</h3>" +
        "<div class='shop-dots'>" + dots + "</div>" +
        "<div class='product-card-bottom'><strong>" + money(p.price) + old + "</strong>" + rating + "</div>" +
      "</div></article>";
  }

  function render() {
    var active = currentCategory();
    var all = products();
    var cats = active === "all" ? CAT.categories : CAT.categories.filter(function (c) { return c.slug === active; });
    if (chips) {
      chips.innerHTML = [{ slug: "all", name: "All" }].concat(CAT.categories).map(function (c) {
        var on = c.slug === active;
        return "<button type='button' class='chip" + (on ? " active" : "") + "' data-cat='" + c.slug + "' aria-pressed='" + on + "'>" + esc(c.name) + "</button>";
      }).join("");
    }
    root.innerHTML = cats.map(function (c) {
      var list = all.filter(function (p) { return p.category === c.slug; });
      return "<section class='shop-cat' id='" + c.slug + "'>" +
        "<header class='shop-cat-head'><div><span class='eyebrow dark'>" + list.length + " styles</span>" +
        "<h2>" + esc(c.name) + "</h2><p>" + esc(c.description || "") + "</p></div></header>" +
        "<div class='shop-grid'>" + (list.length ? list.map(card).join("") : "<p class='muted'>No styles in this category yet.</p>") + "</div>" +
        "</section>";
    }).join("");
  }

  if (chips) {
    chips.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-cat]");
      if (!b) return;
      var slug = b.getAttribute("data-cat");
      var url = new URL(location.href);
      if (slug === "all") url.searchParams.delete("cat"); else url.searchParams.set("cat", slug);
      url.hash = "";
      history.replaceState({}, "", url);
      render();
    });
  }
  window.addEventListener("storage", function (e) { if (e.key === "bb_products") render(); });
  window.addEventListener("hashchange", render);
  render();
})();
