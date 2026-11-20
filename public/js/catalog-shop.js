/* =====================================================================
   BRUTBOX & CO. — catalog-shop.js
   Renders products.html with live search (name + description), category
   filter tabs, sort dropdown, wishlist hearts, quick view, and links
   to product-details.html?id=<id>.
   ===================================================================== */
(function () {
  "use strict";

  var root = document.getElementById("shop-root");
  var chips = document.getElementById("shop-chips");
  var searchEl = document.getElementById("shop-search");
  var sortEl = document.getElementById("shop-sort");
  var countEl = document.getElementById("shop-count");
  var CAT = window.BRUTBOX_CATALOG;
  var B = window.Brutbox;
  var L = window.BBLogic;
  if (!root || !CAT) return;

  if (B) B.seedData();

  var esc = function (s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };
  var money = function (n) { return "৳" + Math.round(Number(n) || 0).toLocaleString("en-US"); };
  var totalStock = function (stock) {
    return Object.keys(stock || {}).reduce(function (sum, c) {
      return sum + Object.keys(stock[c] || {}).reduce(function (s, z) { return s + Number(stock[c][z] || 0); }, 0);
    }, 0);
  };

  function getProducts() {
    return B ? B.getProducts(false) : CAT.products;
  }

  function wishlistIds() {
    try { return JSON.parse(localStorage.getItem("bb_wishlist") || "[]"); }
    catch (e) { return []; }
  }

  function currentCategory() {
    var q = new URLSearchParams(location.search).get("cat");
    var hash = (location.hash || "").slice(1);
    var pick = q || hash;
    return CAT.categories.some(function (c) { return c.slug === pick; }) ? pick : "all";
  }

  function card(p, wishedSet) {
    var imgs = (p.images && p.images.length) ? p.images : (p.image ? [p.image] : []);
    var t = totalStock(p.stock);
    var badgeText = t === 0 ? "Sold out"
      : t <= 5 ? ("Only " + t + " left")
      : p.badge ? String(p.badge) : "";
    var badgeClass = t === 0 ? "is-out" : t <= 5 ? "is-low" : p.badge === "Sale" ? "is-sale" : "";
    var badge = badgeText ? "<span class='card-badge " + badgeClass + "'>" + esc(badgeText) + "</span>" : "";
    var dots = (p.colors || []).slice(0, 3).map(function (c) {
      var hex = (CAT.colourHex && CAT.colourHex[c]) || "#9aa0a6";
      return "<i title='" + esc(c) + "' style='background:" + hex + "'></i>";
    }).join("");
    var old = p.originalPrice ? " <s class='shop-old'>" + money(p.originalPrice) + "</s>" : "";
    var rating = p.rating ? "<span class='shop-rating'>★ " + Number(p.rating).toFixed(1) + (p.reviewCount ? " (" + p.reviewCount + ")" : "") + "</span>" : "";
    var second = imgs.length > 1 ? "<img class='media-second' src='" + esc(imgs[1]) + "' alt='' loading='lazy' decoding='async' />" : "";
    var wished = wishedSet[p.id] === true;
    var catLabel = (B ? B.categoryName(p.category) : p.category);

    return "<article class='product-card live-card" + (t === 0 ? " is-soldout" : "") + "'>" +
      "<div class='card-media-wrap'>" +
        "<a class='live-media' href='product-details.html?id=" + encodeURIComponent(p.id) + "' aria-label='View " + esc(p.name) + "'>" +
          (imgs[0]
            ? "<span class='product-media'><img class='media-main' src='" + esc(imgs[0]) + "' alt='" + esc(p.name) + "' loading='lazy' decoding='async' data-fallback-title='" + esc(p.name) + "' />" + second + "</span>"
            : "<span class='product-media noimg'><span>Image coming soon</span><small>" + esc(catLabel) + "</small></span>") +
          badge +
        "</a>" +
        "<button type='button' class='wish-btn" + (wished ? " is-active" : "") + "' data-wishlist-id='" + esc(p.id) + "' aria-pressed='" + wished + "' aria-label='" + (wished ? "Remove " : "Save ") + esc(p.name) + " to wishlist'>" +
          "<svg width='16' height='16' viewBox='0 0 24 24' fill='" + (wished ? "currentColor" : "none") + "' stroke='currentColor' stroke-width='2' aria-hidden='true'><path d='M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z'/></svg>" +
        "</button>" +
        "<button type='button' class='quick-view-btn' data-preview-id='" + esc(p.id) + "'>Quick view</button>" +
      "</div>" +
      "<div class='product-card-info'>" +
        "<div class='card-kicker'>" + esc(catLabel) + " &middot; " + (p.colors ? p.colors.length : 1) + " colours</div>" +
        "<h3 class='shop-name'><a href='product-details.html?id=" + encodeURIComponent(p.id) + "'>" + esc(p.name) + "</a></h3>" +
        "<div class='shop-dots' aria-label='Available colours'>" + dots + "</div>" +
        "<div class='product-card-bottom'><strong class='num'>" + money(p.price) + old + "</strong>" + rating + "</div>" +
      "</div>" +
    "</article>";
  }

  function render() {
    var active = currentCategory();
    var query = searchEl ? searchEl.value.trim() : "";
    var sort = sortEl ? sortEl.value : "featured";
    var all = getProducts();
    var wishedArr = wishlistIds();
    var wishedSet = {};
    wishedArr.forEach(function (id) { wishedSet[id] = true; });

    if (chips) {
      chips.innerHTML = [{ slug: "all", name: "All (" + all.length + ")" }].concat(CAT.categories).map(function (c) {
        var on = c.slug === active;
        return "<button type='button' class='chip" + (on ? " active" : "") + "' data-cat='" + c.slug + "' aria-pressed='" + on + "'>" + esc(c.name) + "</button>";
      }).join("");
    }

    var filtered = L
      ? L.filterAndSortProducts(all, { query: query, category: active, sort: sort })
      : all.filter(function (p) { return active === "all" || p.category === active; });

    if (countEl) {
      countEl.textContent = "Showing " + filtered.length + " style" + (filtered.length === 1 ? "" : "s");
    }

    if (!filtered.length) {
      root.innerHTML =
        "<div class='empty-state'>" +
          "<h2>No products match your search</h2>" +
          "<p>Try another keyword or clear your category filter to view all 60 styles.</p>" +
          "<button type='button' class='btn btn-primary' id='shop-reset-filters'>Reset filters</button>" +
        "</div>";
      var resetBtn = document.getElementById("shop-reset-filters");
      if (resetBtn) {
        resetBtn.addEventListener("click", function () {
          if (searchEl) searchEl.value = "";
          if (sortEl) sortEl.value = "featured";
          var url = new URL(location.href);
          url.searchParams.delete("cat");
          url.hash = "";
          history.replaceState({}, "", url);
          render();
        });
      }
      return;
    }

    // Group by category when viewing All + default featured sort without search; otherwise show clean flat sorted grid
    if (active === "all" && !query && sort === "featured") {
      root.innerHTML = CAT.categories.map(function (c) {
        var list = filtered.filter(function (p) { return p.category === c.slug; });
        if (!list.length) return "";
        return "<section class='shop-cat' id='" + c.slug + "'>" +
          "<header class='shop-cat-head'><div><span class='eyebrow dark'>" + list.length + " styles</span>" +
          "<h2>" + esc(c.name) + "</h2><p>" + esc(c.description || "") + "</p></div></header>" +
          "<div class='shop-grid'>" + list.map(function (p) { return card(p, wishedSet); }).join("") + "</div>" +
        "</section>";
      }).join("");
    } else {
      var title = active === "all" ? "Filtered collection" : (B ? B.categoryName(active) : active);
      root.innerHTML = "<section class='shop-cat'>" +
        "<header class='shop-cat-head'><div><span class='eyebrow dark'>" + filtered.length + " results</span>" +
        "<h2>" + esc(title) + "</h2></div></header>" +
        "<div class='shop-grid'>" + filtered.map(function (p) { return card(p, wishedSet); }).join("") + "</div>" +
      "</section>";
    }
  }

  if (chips) {
    chips.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-cat]");
      if (!b) return;
      var slug = b.getAttribute("data-cat");
      var url = new URL(location.href);
      if (slug === "all") url.searchParams.delete("cat");
      else url.searchParams.set("cat", slug);
      url.hash = "";
      history.replaceState({}, "", url);
      render();
    });
  }
  if (searchEl) {
    var qParam = new URLSearchParams(location.search).get("q");
    if (qParam) searchEl.value = qParam;
    searchEl.addEventListener("input", render);
  }
  if (sortEl) sortEl.addEventListener("change", render);

  window.addEventListener("wishlist:updated", render);
  window.addEventListener("storage", function (e) {
    if (e.key === "bb_products" || e.key === "bb_wishlist") render();
  });
  window.addEventListener("hashchange", render);
  render();
})();
