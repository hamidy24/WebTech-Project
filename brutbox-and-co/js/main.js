/* =====================================================================
   BRUTBOX & CO. — main.js
   Complete storefront client runtime stored in localStorage:
   - Global toast notifications & image-coming-soon fallback handler
   - Header user session state, bag badge & slide-out Wishlist drawer
   - Homepage New Arrivals, Best Sellers & live studio arrivals
   - Product Details Page (zoom, colour swatch photo switch, size guide,
     stock indicator, wishlist, customer reviews & form, recently viewed)
   - Cart (quantities, coupons from bb_coupons, 5% VAT, delivery, empty state)
   - Checkout (inline field errors, BD phone & districts, loading state,
     demo payment notice, stock deduction, redirect to receipt.html)
   - Receipt (dynamic 80mm printable receipt + order success banner)
   - Customer Accounts (signup, login, account order history & addresses)
   - Inventory live table & restock form; Contact form validation & FAQ
   ===================================================================== */
(function () {
  "use strict";

  var B = window.Brutbox;
  var L = window.BBLogic;
  if (B) B.seedData();

  var KEY = {
    cart: "brutbox_cart",
    coupon: "brutbox_coupon",
    lastOrder: "brutbox_last_order",
    wishlist: "bb_wishlist",
    recent: "bb_recently_viewed",
    users: "bb_users",
    userSession: "bb_user_session",
    reviews: "bb_reviews",
    coupons: "bb_coupons",
    products: "bb_products",
    activity: "bb_activity",
    messages: "bb_messages"
  };

  function read(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (e) { return fallback; }
  }
  function write(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch (e) { return false; }
  }
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function money(n) { return L ? L.money(n) : "৳" + Math.round(Number(n) || 0).toLocaleString("en-US"); }

  /* ---------- Global Toast Notifications ---------- */
  function ensureToastRoot() {
    var r = document.getElementById("store-toast-root");
    if (!r) {
      r = document.createElement("div");
      r.id = "store-toast-root";
      r.className = "toast-root";
      r.setAttribute("aria-live", "polite");
      document.body.appendChild(r);
    }
    return r;
  }
  function showToast(msg, type) {
    var root = ensureToastRoot();
    var kind = type === "error" || type === "danger" ? "danger" : type === "warning" ? "warning" : "success";
    var icon = kind === "danger" ? "\u00D7" : kind === "warning" ? "!" : "\u2713";
    var el = document.createElement("div");
    el.className = "toast toast-" + kind;
    el.setAttribute("role", kind === "danger" ? "alert" : "status");
    el.innerHTML =
      "<span class='toast-icon' aria-hidden='true'>" + icon + "</span>" +
      "<span class='toast-text'></span>" +
      "<button type='button' class='toast-x' aria-label='Dismiss notification'>&times;</button>";
    el.querySelector(".toast-text").textContent = msg;
    root.appendChild(el);
    while (root.children.length > 3) root.firstElementChild.remove();
    var timer;
    function dismiss() {
      clearTimeout(timer);
      if (!el.parentNode) return;
      el.classList.remove("is-in");
      el.classList.add("is-out");
      setTimeout(function () { if (el.parentNode) el.remove(); }, 220);
    }
    el.querySelector(".toast-x").addEventListener("click", dismiss);
    requestAnimationFrame(function () { el.classList.add("is-in"); });
    timer = setTimeout(dismiss, 3600);
  }
  window.BBToast = showToast;

  /* ---------- Image Missing Fallback ("Image coming soon" ONLY on broken image) ---------- */
  document.addEventListener("error", function (e) {
    var img = e.target;
    if (!img || img.tagName !== "IMG") return;
    if (img.dataset.fallbackApplied) return;
    img.dataset.fallbackApplied = "1";
    var host = img.parentElement;
    if (!host) return;
    var title = img.getAttribute("data-fallback-title") || img.alt || "BRUTBOX & CO.";
    var card = document.createElement("span");
    card.className = "img-fallback-card";
    card.innerHTML = "<strong>Image coming soon</strong><small>" + esc(title) + "</small>";
    img.style.display = "none";
    host.appendChild(card);
  }, true);

  /* ---------- Cart & Coupon Storage ---------- */
  function getCart() {
    var raw = read(KEY.cart, null);
    return Array.isArray(raw) ? raw : [];
  }
  function saveCart(cart) {
    write(KEY.cart, cart);
    window.dispatchEvent(new Event("cart:updated"));
  }
  function getCouponsPool() {
    return B ? B.getCoupons() : (L ? L.DEFAULT_COUPONS : []);
  }
  function activeCouponObj(subtotal) {
    var code = read(KEY.coupon, null);
    if (!code) return null;
    if (!L) return null;
    var check = L.validateCoupon(code, subtotal, getCouponsPool());
    return check.ok ? check.coupon : null;
  }
  function cartTotals(cart) {
    var sub = (cart || []).reduce(function (s, i) { return s + (Number(i.qty) || 0) * (Number(i.price) || 0); }, 0);
    var coupon = activeCouponObj(sub);
    return L ? L.computeCartTotals(cart, coupon) : { units: 0, subtotal: sub, discount: 0, delivery: 0, tax: 0, total: sub, coupon: null };
  }
  function stockFor(id, color, size) {
    var prod = B ? B.getProductById(id) : null;
    if (prod && L) return L.stockForVariant(prod, color, size);
    return 10;
  }
  function updateBagPill() {
    var pill = $(".cart-pill");
    if (!pill) return;
    var count = cartTotals(getCart()).units;
    var span = $("span", pill);
    if (span) span.textContent = String(count).padStart(2, "0");
    pill.setAttribute("aria-label", "View bag, " + count + " items");
  }

  /* ---------- Wishlist Drawer & Toggle ---------- */
  function getWishlist() {
    var list = read(KEY.wishlist, []);
    return Array.isArray(list) ? list : [];
  }
  function saveWishlist(list) {
    write(KEY.wishlist, list);
    updateWishlistBadge();
    window.dispatchEvent(new Event("wishlist:updated"));
  }
  function toggleWishlistItem(id) {
    if (!id) return false;
    var list = getWishlist();
    var idx = list.indexOf(id);
    var saved;
    if (idx > -1) {
      list.splice(idx, 1);
      saved = false;
      showToast("Removed from your wishlist.", "warning");
    } else {
      list.unshift(id);
      saved = true;
      showToast("Saved to your wishlist.", "success");
    }
    saveWishlist(list);
    return saved;
  }
  window.BBWishlist = {
    list: getWishlist,
    toggle: toggleWishlistItem,
    has: function (id) { return getWishlist().indexOf(id) > -1; }
  };

  function updateWishlistBadge() {
    var count = getWishlist().length;
    $$(".wish-header-count").forEach(function (el) {
      el.textContent = String(count);
      el.hidden = count === 0;
    });
  }

  var wishDrawerEl = null;
  function buildWishlistDrawer() {
    if (wishDrawerEl) return wishDrawerEl;
    wishDrawerEl = document.createElement("div");
    wishDrawerEl.className = "wl-overlay";
    wishDrawerEl.setAttribute("role", "dialog");
    wishDrawerEl.setAttribute("aria-modal", "true");
    wishDrawerEl.setAttribute("aria-label", "Saved wishlist");
    wishDrawerEl.innerHTML =
      '<aside class="wl-drawer">' +
        '<header class="wl-head"><div><p class="eyebrow dark">Saved items</p><h2>Your wishlist</h2></div>' +
        '<button type="button" class="wl-close" aria-label="Close wishlist">&times;</button></header>' +
        '<div class="wl-body"></div>' +
      "</aside>";
    document.body.appendChild(wishDrawerEl);
    wishDrawerEl.addEventListener("click", function (e) {
      if (e.target === wishDrawerEl || e.target.closest(".wl-close")) closeWishlistDrawer();
      var rem = e.target.closest("[data-wl-remove]");
      if (rem) {
        toggleWishlistItem(rem.getAttribute("data-wl-remove"));
        renderWishlistDrawer();
      }
      var add = e.target.closest("[data-wl-add]");
      if (add) {
        var pid = add.getAttribute("data-wl-add");
        var p = B ? B.getProductById(pid) : null;
        if (!p) return;
        var color = (p.colors && p.colors[0]) || "Black";
        var size = (p.sizes && p.sizes[0]) || "One Size";
        var left = stockFor(p.id, color, size);
        if (left <= 0) { showToast(p.name + " is currently sold out in " + color + ".", "error"); return; }
        var cart = getCart();
        var existing = cart.filter(function (i) { return i.id === p.id && i.color === color && i.size === size; })[0];
        if (existing) {
          if (existing.qty + 1 > left) { showToast("Maximum available stock reached for " + p.name + ".", "error"); return; }
          existing.qty += 1;
        } else {
          cart.push({ id: p.id, name: p.name, category: p.category, size: size, color: color, price: p.price, qty: 1, cat: B ? B.categoryName(p.category) : p.category, image: p.image || "" });
        }
        saveCart(cart);
        showToast("Added " + p.name + " to your bag.", "success");
      }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && wishDrawerEl && wishDrawerEl.classList.contains("is-open")) closeWishlistDrawer();
    });
    return wishDrawerEl;
  }

  function renderWishlistDrawer() {
    var overlay = buildWishlistDrawer();
    var body = overlay.querySelector(".wl-body");
    var ids = getWishlist();
    if (!ids.length) {
      body.innerHTML =
        "<div class='empty-state'>" +
          "<h3>Your wishlist is empty</h3>" +
          "<p>Tap the heart icon on any item to save favourites for later.</p>" +
          "<a class='btn btn-primary' href='products.html'>Browse shop</a>" +
        "</div>";
      return;
    }
    body.innerHTML = ids.map(function (id) {
      var p = B ? B.getProductById(id) : null;
      if (!p) return "";
      var total = B ? B.totalStock(p.stock) : 10;
      return "<article class='wl-item'>" +
        "<a class='wl-thumb' href='product-details.html?id=" + encodeURIComponent(p.id) + "'>" +
          "<img src='" + esc(p.image || "") + "' alt='" + esc(p.name) + "' loading='lazy' data-fallback-title='" + esc(p.name) + "' />" +
        "</a>" +
        "<div class='wl-meta'>" +
          "<span class='card-kicker'>" + esc(B ? B.categoryName(p.category) : p.category) + "</span>" +
          "<h4><a href='product-details.html?id=" + encodeURIComponent(p.id) + "'>" + esc(p.name) + "</a></h4>" +
          "<strong class='num'>" + money(p.price) + "</strong>" +
          "<div class='wl-actions'>" +
            "<button type='button' class='btn btn-primary btn-sm' data-wl-add='" + esc(p.id) + "'" + (total === 0 ? " disabled" : "") + ">" + (total === 0 ? "Sold out" : "Move to bag") + "</button>" +
            "<button type='button' class='link-btn' data-wl-remove='" + esc(p.id) + "'>Remove</button>" +
          "</div>" +
        "</div>" +
      "</article>";
    }).join("");
  }

  function openWishlistDrawer() {
    renderWishlistDrawer();
    wishDrawerEl.classList.add("is-open");
    document.body.classList.add("pv-lock");
    wishDrawerEl.querySelector(".wl-close").focus({ preventScroll: true });
  }
  function closeWishlistDrawer() {
    if (!wishDrawerEl) return;
    wishDrawerEl.classList.remove("is-open");
    document.body.classList.remove("pv-lock");
  }

  document.addEventListener("click", function (e) {
    var wishBtn = e.target.closest && e.target.closest("[data-wishlist-id]");
    if (wishBtn) {
      e.preventDefault();
      var saved = toggleWishlistItem(wishBtn.getAttribute("data-wishlist-id"));
      wishBtn.classList.toggle("is-active", saved);
      wishBtn.setAttribute("aria-pressed", String(saved));
      var svg = wishBtn.querySelector("svg");
      if (svg) svg.setAttribute("fill", saved ? "currentColor" : "none");
      return;
    }
    if (e.target.closest && e.target.closest(".wishlist-open-btn")) {
      e.preventDefault();
      openWishlistDrawer();
    }
  });

  /* ---------- Header Auth & Navigation State ---------- */
  function currentUser() {
    var sess = read(KEY.userSession, null);
    if (!sess || !sess.id) return null;
    var users = read(KEY.users, []);
    return users.filter(function (u) { return u.id === sess.id; })[0] || sess;
  }
  function initHeaderAuthAndWishlist() {
    var actions = $(".header-actions");
    if (actions && !actions.querySelector(".wishlist-open-btn")) {
      var wBtn = document.createElement("button");
      wBtn.type = "button";
      wBtn.className = "icon-btn wishlist-open-btn";
      wBtn.setAttribute("aria-label", "Open saved wishlist");
      wBtn.title = "Wishlist";
      wBtn.innerHTML =
        '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>' +
        '<span class="wish-header-count" hidden>0</span>';
      var anchor = actions.querySelector(".cart-pill");
      actions.insertBefore(wBtn, anchor || null);
    }
    updateWishlistBadge();

    var user = currentUser();
    var loginLinks = $$(".header-login");
    loginLinks.forEach(function (link) {
      if (user) {
        var firstName = String(user.name || "Account").trim().split(/\s+/)[0];
        link.href = "account.html";
        link.textContent = firstName;
        link.title = "Open account (" + user.email + ")";
        if (!link.parentNode.querySelector(".header-logout")) {
          var out = document.createElement("button");
          out.type = "button";
          out.className = "header-logout link-btn";
          out.textContent = "Logout";
          out.addEventListener("click", function () {
            localStorage.removeItem(KEY.userSession);
            showToast("Signed out of your account.", "success");
            setTimeout(function () { window.location.href = "index.html"; }, 350);
          });
          link.parentNode.insertBefore(out, link.nextSibling);
        }
      } else {
        link.href = "login.html";
        link.textContent = "Account";
      }
    });

    // Update mobile drawer account link too
    $$(".mobile-panel a[href='login.html']").forEach(function (a) {
      if (user) {
        a.href = "account.html";
        a.textContent = "My account (" + String(user.name || "").split(/\s+/)[0] + ")";
      }
    });

    // Wire ADMIN dropdown: red light glow effect + ID/password gate on all 3 functions
    function hasValidAdminSession() {
      if (window.AdminAuth && typeof window.AdminAuth.isValid === "function") return window.AdminAuth.isValid();
      try {
        var tok = sessionStorage.getItem("bb_admin_token");
        if (!tok) return false;
        var ttl = (B && B.CONFIG && B.CONFIG.sessionTtlMs) || 90000;
        var now = Date.now();
        var list = read("bb_admin_sessions", []);
        return list.some(function (s) { return s.token === tok && (now - s.lastSeen) < ttl; });
      } catch (e) { return false; }
    }

    $$(".admin-menu").forEach(function (menu) {
      menu.addEventListener("toggle", function () {
        if (menu.open) {
          menu.classList.remove("is-glow");
          void menu.offsetWidth;
          menu.classList.add("is-glow");
        } else {
          menu.classList.remove("is-glow");
        }
      });

      menu.addEventListener("click", function (e) {
        var link = e.target.closest(".admin-menu-panel a");
        if (!link) return;
        var action = link.getAttribute("data-admin-action") || "";
        var authed = hasValidAdminSession();
        if (!authed) {
          e.preventDefault();
          var targetNext = action === "inventory" ? "inventory.html" : action === "control" ? "admin.html#dashboard" : "";
          window.location.href = targetNext
            ? "admin-login.html?reason=auth&next=" + encodeURIComponent(targetNext)
            : "admin-login.html";
        }
      });
    });

    document.addEventListener("click", function (e) {
      $$(".admin-menu[open]").forEach(function (menu) {
        if (!menu.contains(e.target)) menu.open = false;
      });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        $$(".admin-menu[open]").forEach(function (menu) { menu.open = false; });
      }
    });
  }

  /* ---------- Storefront Product Card Builder (shared by index & related) ---------- */
  function buildProductCardHTML(p, wishedSet) {
    var imgs = B ? B.productImages(p) : (p.images || [p.image]);
    var total = B ? B.totalStock(p.stock) : 10;
    var badgeText = total === 0 ? "Sold out" : total <= 5 ? ("Only " + total + " left") : p.badge ? String(p.badge) : "";
    var badgeClass = total === 0 ? "is-out" : total <= 5 ? "is-low" : p.badge === "Sale" ? "is-sale" : "";
    var badge = badgeText ? "<span class='card-badge " + badgeClass + "'>" + esc(badgeText) + "</span>" : "";
    var wished = wishedSet && wishedSet[p.id];
    var catLabel = B ? B.categoryName(p.category) : p.category;
    var second = imgs.length > 1 ? "<img class='media-second' src='" + esc(imgs[1]) + "' alt='' loading='lazy' decoding='async' />" : "";
    var old = p.originalPrice ? " <s class='shop-old'>" + money(p.originalPrice) + "</s>" : "";
    return "<article class='product-card live-card" + (total === 0 ? " is-soldout" : "") + "'>" +
      "<div class='card-media-wrap'>" +
        "<a class='live-media' href='product-details.html?id=" + encodeURIComponent(p.id) + "' aria-label='View " + esc(p.name) + "'>" +
          "<span class='product-media'><img class='media-main' src='" + esc(imgs[0] || "") + "' alt='" + esc(p.name) + "' loading='lazy' decoding='async' data-fallback-title='" + esc(p.name) + "' />" + second + "</span>" +
          badge +
        "</a>" +
        "<button type='button' class='wish-btn" + (wished ? " is-active" : "") + "' data-wishlist-id='" + esc(p.id) + "' aria-pressed='" + Boolean(wished) + "' aria-label='Save " + esc(p.name) + " to wishlist'>" +
          "<svg width='16' height='16' viewBox='0 0 24 24' fill='" + (wished ? "currentColor" : "none") + "' stroke='currentColor' stroke-width='2' aria-hidden='true'><path d='M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z'/></svg>" +
        "</button>" +
        "<button type='button' class='quick-view-btn' data-preview-id='" + esc(p.id) + "'>Quick view</button>" +
      "</div>" +
      "<div class='product-card-info'>" +
        "<div class='card-kicker'>" + esc(catLabel) + " &middot; " + (p.colors ? p.colors.length : 3) + " colours</div>" +
        "<h3 class='shop-name'><a href='product-details.html?id=" + encodeURIComponent(p.id) + "'>" + esc(p.name) + "</a></h3>" +
        "<div class='product-card-bottom'><strong class='num'>" + money(p.price) + old + "</strong>" +
        (p.rating ? "<span class='shop-rating'>★ " + Number(p.rating).toFixed(1) + "</span>" : "") +
        "</div>" +
      "</div>" +
    "</article>";
  }

  /* ---------- Homepage Dynamic Grids (New Arrivals & Best Sellers) ---------- */
  function initHomePage() {
    var newHost = document.getElementById("home-new-arrivals");
    var bestHost = document.getElementById("home-best-sellers");
    if (!newHost && !bestHost) return;

    function renderHomeGrids() {
      var all = B ? B.getProducts(false) : [];
      var wishedSet = {};
      getWishlist().forEach(function (id) { wishedSet[id] = true; });

      if (newHost) {
        var arrivals = all.filter(function (p) { return p.source === "admin" || p.badge === "New"; });
        if (arrivals.length < 4) {
          arrivals = arrivals.concat(all.slice().sort(function (a, b) {
            return String(b.createdAt || "").localeCompare(String(a.createdAt || ""));
          }));
        }
        var pickedNew = [], seenNew = {};
        arrivals.forEach(function (p) {
          if (!seenNew[p.id] && pickedNew.length < 4) { seenNew[p.id] = true; pickedNew.push(p); }
        });
        newHost.innerHTML = pickedNew.map(function (p) { return buildProductCardHTML(p, wishedSet); }).join("");
      }

      if (bestHost) {
        var best = all.filter(function (p) { return p.badge === "Best seller"; }).slice(0, 4);
        bestHost.innerHTML = best.map(function (p) { return buildProductCardHTML(p, wishedSet); }).join("");
      }
    }
    renderHomeGrids();
    window.addEventListener("wishlist:updated", renderHomeGrids);
  }

  /* ---------- Product Details Page (product-details.html) ---------- */
  function initProductDetailsPage() {
    var mount = document.getElementById("pdp-mount");
    if (!mount || !B) return;

    var params = new URLSearchParams(location.search);
    var rawId = params.get("id") || (location.hash || "").slice(1) || "p-uw-01";
    var product = B.getProductById(rawId) || B.getProducts(false)[0];
    if (!product) {
      mount.innerHTML = "<div class='empty-state'><h1>Product not found</h1><p>This item may have been removed.</p><a class='btn btn-primary' href='products.html'>Back to shop</a></div>";
      return;
    }

    // Track recently viewed
    var recent = read(KEY.recent, []).filter(function (id) { return id !== product.id; });
    recent.unshift(product.id);
    write(KEY.recent, recent.slice(0, 6));

    document.title = product.name + " | BRUTBOX & CO.";
    var bcName = document.getElementById("pdp-bc-name");
    var bcCat = document.getElementById("pdp-bc-cat");
    if (bcName) bcName.textContent = product.name;
    if (bcCat) { bcCat.textContent = B.categoryName(product.category); bcCat.href = "products.html?cat=" + encodeURIComponent(product.category); }

    var imgs = B.productImages(product);
    var selectedColor = (product.colors && product.colors[0]) || "Default";
    var selectedSize = (product.sizes && product.sizes[0]) || "One Size";
    var activeImgIdx = 0;

    function approvedReviews() {
      return B.getReviews(product.id, false).slice().sort(function (a, b) {
        return String(b.createdAt || "").localeCompare(String(a.createdAt || ""));
      });
    }

    function avgRating(revs) {
      if (!revs.length) return Number(product.rating || 4.8);
      var sum = revs.reduce(function (s, r) { return s + (Number(r.rating) || 5); }, 0);
      return sum / revs.length;
    }

    function starsHTML(score) {
      var full = Math.round(score);
      var out = "";
      for (var i = 1; i <= 5; i++) out += i <= full ? "&#9733;" : "&#9734;";
      return "<span class='stars' aria-label='" + score.toFixed(1) + " out of 5 stars'>" + out + "</span>";
    }

    function renderPDP() {
      var revs = approvedReviews();
      var avg = avgRating(revs);
      var wished = getWishlist().indexOf(product.id) > -1;
      var totalStock = B.totalStock(product.stock);
      var colourHexMap = B.COLOR_HEX || {};
      var catName = B.categoryName(product.category);
      var mainSrc = imgs[activeImgIdx] || imgs[0] || "";

      var thumbsHTML = imgs.map(function (src, idx) {
        return "<button type='button' class='pdp-thumb" + (idx === activeImgIdx ? " is-active" : "") + "' data-img-idx='" + idx + "' aria-label='Photo " + (idx + 1) + "'>" +
          "<img src='" + esc(src) + "' alt='' loading='lazy' data-fallback-title='" + esc(product.name) + "' />" +
        "</button>";
      }).join("");

      var colorSwatchesHTML = (product.colors || []).map(function (c, idx) {
        var hex = colourHexMap[c] || "#667280";
        var active = c === selectedColor;
        return "<button type='button' class='swatch-btn" + (active ? " is-active" : "") + "' data-color-pick='" + esc(c) + "' data-color-idx='" + idx + "' aria-pressed='" + active + "'>" +
          "<i style='background:" + hex + "'></i><span>" + esc(c) + "</span>" +
        "</button>";
      }).join("");

      var sizesHTML = (product.sizes || ["One Size"]).map(function (s) {
        var left = stockFor(product.id, selectedColor, s);
        var soldOut = left === 0;
        var active = s === selectedSize && !soldOut;
        return "<button type='button' class='size-btn" + (active ? " is-active" : "") + (soldOut ? " is-soldout" : "") + "' data-size-pick='" + esc(s) + "'" + (soldOut ? " disabled title='Sold out in this colour'" : "") + ">" + esc(s) + "</button>";
      }).join("");

      var deliveryEst = (function () {
        var d1 = new Date(Date.now() + 2 * 864e5);
        var d2 = new Date(Date.now() + 4 * 864e5);
        return d1.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) + " – " + d2.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
      })();

      mount.innerHTML =
        "<div class='pdp-grid'>" +
          "<div class='pdp-gallery'>" +
            "<div class='pdp-stage' id='pdp-stage'>" +
              (mainSrc
                ? "<img id='pdp-main-img' src='" + esc(mainSrc) + "' alt='" + esc(product.name) + " in " + esc(selectedColor) + "' data-fallback-title='" + esc(product.name) + "' />"
                : "<span class='img-fallback-card'><strong>Image coming soon</strong><small>" + esc(product.name) + "</small></span>") +
              (totalStock === 0 ? "<span class='card-badge is-out'>Sold out</span>" : product.badge ? "<span class='card-badge'>" + esc(product.badge) + "</span>" : "") +
              "<span class='pdp-zoom-hint'>Hover or click to zoom</span>" +
            "</div>" +
            (imgs.length > 1 ? "<div class='pdp-thumbs'>" + thumbsHTML + "</div>" : "") +
          "</div>" +
          "<div class='pdp-info'>" +
            "<div class='pdp-kicker'>" + esc(catName) + " &middot; SKU " + esc(product.id.toUpperCase()) + "</div>" +
            "<h1>" + esc(product.name) + "</h1>" +
            "<div class='pdp-rating-row'>" + starsHTML(avg) + " <strong class='num'>" + avg.toFixed(1) + "</strong> <a href='#pdp-reviews' class='muted'>(" + revs.length + " verified reviews)</a></div>" +
            "<div class='pdp-price num'>" + money(product.price) + (product.originalPrice ? " <s class='shop-old'>" + money(product.originalPrice) + "</s>" : "") + " <small>incl. 5% VAT at checkout</small></div>" +
            "<p class='pdp-desc'>" + esc(product.description) + "</p>" +

            "<div class='pdp-control'>" +
              "<div class='pdp-label-row'><span>Colour: <strong id='pdp-color-name'>" + esc(selectedColor) + "</strong></span></div>" +
              "<div class='swatch-row'>" + colorSwatchesHTML + "</div>" +
            "</div>" +

            "<div class='pdp-control'>" +
              "<div class='pdp-label-row'>" +
                "<span>Size: <strong id='pdp-size-name'>" + esc(selectedSize) + "</strong></span>" +
                "<button type='button' class='link-btn' id='open-size-guide'>Size guide</button>" +
              "</div>" +
              "<div class='size-row' id='pdp-size-row'>" + sizesHTML + "</div>" +
            "</div>" +

            "<div class='pdp-buy-row'>" +
              "<div class='pdp-qty-wrap'>" +
                "<label for='pdp-qty' class='sr-only'>Quantity</label>" +
                "<button type='button' id='pdp-qty-dec' aria-label='Decrease quantity'>&minus;</button>" +
                "<input id='pdp-qty' type='number' min='1' max='10' value='1' class='num' />" +
                "<button type='button' id='pdp-qty-inc' aria-label='Increase quantity'>+</button>" +
              "</div>" +
              "<button type='button' id='pdp-add-btn' class='btn btn-primary pdp-add-cta'>Add to bag</button>" +
              "<button type='button' id='pdp-wish-btn' class='btn btn-ghost" + (wished ? " is-active" : "") + "' data-wishlist-id='" + esc(product.id) + "' aria-pressed='" + wished + "'>" + (wished ? "Saved" : "Save") + "</button>" +
            "</div>" +
            "<p id='pdp-stock-msg' class='stock-status' role='status'></p>" +

            "<div class='pdp-meta-list'>" +
              "<div><span>Estimated delivery</span><strong>" + esc(deliveryEst) + " (Dhaka 1–2 days, nationwide 3–4 days)</strong></div>" +
              "<div><span>Shipping fee</span><strong>৳120 flat &middot; Free over ৳3,000</strong></div>" +
              "<div><span>Returns</span><strong>14-day unworn exchange or refund (<a href='returns.html'>Read policy</a>)</strong></div>" +
            "</div>" +
          "</div>" +
        "</div>" +

        "<section class='pdp-reviews-sec' id='pdp-reviews'>" +
          "<div class='pdp-reviews-head'>" +
            "<div><p class='eyebrow dark'>Customer feedback</p><h2>Reviews (" + revs.length + ")</h2></div>" +
            "<div class='pdp-review-score'>" + starsHTML(avg) + " <strong class='num'>" + avg.toFixed(1) + " / 5.0</strong></div>" +
          "</div>" +
          "<div class='pdp-reviews-grid'>" +
            "<div class='reviews-list' id='pdp-reviews-list'>" +
              (revs.length
                ? revs.map(function (r) {
                    return "<article class='review-card'>" +
                      "<div class='review-top'>" + starsHTML(r.rating) + " <span class='muted'>" + esc(r.createdAt) + "</span></div>" +
                      "<h3>" + esc(r.title) + "</h3>" +
                      "<p>" + esc(r.body) + "</p>" +
                      "<small class='muted'>By " + esc(r.author) + "</small>" +
                    "</article>";
                  }).join("")
                : "<div class='empty-state'><p>No customer reviews yet. Be the first to review this piece.</p></div>") +
            "</div>" +
            "<form class='panel-card review-form' id='pdp-review-form' novalidate>" +
              "<h3>Write a review</h3>" +
              "<div class='field'><label for='rev-author'>Your name</label><input id='rev-author' type='text' required placeholder='e.g. Tariq Ahmed' /><small class='field-error' id='err-rev-author'></small></div>" +
              "<div class='field'><label for='rev-rating'>Rating</label><select id='rev-rating'><option value='5'>5 — Excellent</option><option value='4'>4 — Very good</option><option value='3'>3 — Good</option><option value='2'>2 — Fair</option><option value='1'>1 — Poor</option></select></div>" +
              "<div class='field'><label for='rev-title'>Headline</label><input id='rev-title' type='text' required placeholder='Sum up your experience' /><small class='field-error' id='err-rev-title'></small></div>" +
              "<div class='field'><label for='rev-body'>Review</label><textarea id='rev-body' rows='3' required placeholder='Share fit, fabric feel, or finish notes...'></textarea><small class='field-error' id='err-rev-body'></small></div>" +
              "<button type='submit' class='btn btn-primary'>Submit review</button>" +
            "</form>" +
          "</div>" +
        "</section>" +

        "<section class='pdp-recent-sec' id='pdp-recent-sec'></section>";

      refreshStockUI();
      renderRecentlyViewed();
      wirePDPInteractions();
    }

    function refreshStockUI() {
      // Ensure selectedSize is valid & available if possible
      var availSizes = (product.sizes || ["One Size"]);
      var currentLeft = stockFor(product.id, selectedColor, selectedSize);
      if (currentLeft === 0) {
        var firstInStock = availSizes.filter(function (s) { return stockFor(product.id, selectedColor, s) > 0; })[0];
        if (firstInStock) selectedSize = firstInStock;
      }
      var left = stockFor(product.id, selectedColor, selectedSize);
      var statusEl = document.getElementById("pdp-stock-msg");
      var addBtn = document.getElementById("pdp-add-btn");
      var qtyEl = document.getElementById("pdp-qty");
      var sizeNameEl = document.getElementById("pdp-size-name");
      if (sizeNameEl) sizeNameEl.textContent = selectedSize;

      $$("#pdp-size-row .size-btn").forEach(function (b) {
        var sz = b.getAttribute("data-size-pick");
        var st = stockFor(product.id, selectedColor, sz);
        b.disabled = st === 0;
        b.classList.toggle("is-soldout", st === 0);
        b.classList.toggle("is-active", sz === selectedSize && st > 0);
      });

      if (statusEl) {
        if (left === 0) {
          statusEl.className = "stock-status is-out";
          statusEl.textContent = "Sold out in " + selectedColor + " / " + selectedSize;
        } else if (left <= 5) {
          statusEl.className = "stock-status is-low";
          statusEl.textContent = "Only " + left + " left in " + selectedColor + " / " + selectedSize;
        } else {
          statusEl.className = "stock-status is-ok";
          statusEl.textContent = "In stock — " + left + " units ready to ship";
        }
      }
      if (addBtn) {
        addBtn.disabled = left === 0;
        addBtn.textContent = left === 0 ? "Sold out" : "Add to bag";
      }
      if (qtyEl) {
        var max = Math.max(1, Math.min(10, left));
        qtyEl.max = String(max);
        if (Number(qtyEl.value) > max) qtyEl.value = String(max);
      }
    }

    function renderRecentlyViewed() {
      var recHost = document.getElementById("pdp-recent-sec");
      if (!recHost) return;
      var ids = read(KEY.recent, []).filter(function (id) { return id !== product.id; }).slice(0, 4);
      if (!ids.length) { recHost.innerHTML = ""; return; }
      var wishedSet = {};
      getWishlist().forEach(function (id) { wishedSet[id] = true; });
      var cards = ids.map(function (id) { return B.getProductById(id); }).filter(Boolean);
      if (!cards.length) { recHost.innerHTML = ""; return; }
      recHost.innerHTML =
        "<div class='section-heading'><div><p class='eyebrow dark'>Continue browsing</p><h2>Recently viewed</h2></div><a class='text-arrow' href='products.html'>View all products &rarr;</a></div>" +
        "<div class='shop-grid'>" + cards.map(function (c) { return buildProductCardHTML(c, wishedSet); }).join("") + "</div>";
    }

    function wirePDPInteractions() {
      var stage = document.getElementById("pdp-stage");
      var mainImg = document.getElementById("pdp-main-img");
      if (stage && mainImg) {
        stage.addEventListener("mousemove", function (e) {
          if (!stage.classList.contains("is-zoomed")) return;
          var r = stage.getBoundingClientRect();
          var x = ((e.clientX - r.left) / r.width) * 100;
          var y = ((e.clientY - r.top) / r.height) * 100;
          mainImg.style.transformOrigin = x.toFixed(1) + "% " + y.toFixed(1) + "%";
        });
        stage.addEventListener("click", function () {
          stage.classList.toggle("is-zoomed");
        });
        stage.addEventListener("mouseleave", function () {
          stage.classList.remove("is-zoomed");
          mainImg.style.transformOrigin = "center center";
        });
      }

      $$("[data-img-idx]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          activeImgIdx = Number(btn.getAttribute("data-img-idx")) || 0;
          if (mainImg && imgs[activeImgIdx]) mainImg.src = imgs[activeImgIdx];
          $$("[data-img-idx]").forEach(function (t, i) { t.classList.toggle("is-active", i === activeImgIdx); });
        });
      });

      $$("[data-color-pick]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          selectedColor = btn.getAttribute("data-color-pick");
          var idx = Number(btn.getAttribute("data-color-idx")) || 0;
          if (imgs.length) {
            activeImgIdx = idx % imgs.length;
            if (mainImg && imgs[activeImgIdx]) {
              mainImg.src = imgs[activeImgIdx];
              mainImg.alt = product.name + " in " + selectedColor;
            }
            $$("[data-img-idx]").forEach(function (t, i) { t.classList.toggle("is-active", i === activeImgIdx); });
          }
          var cname = document.getElementById("pdp-color-name");
          if (cname) cname.textContent = selectedColor;
          $$("[data-color-pick]").forEach(function (b) {
            var on = b.getAttribute("data-color-pick") === selectedColor;
            b.classList.toggle("is-active", on);
            b.setAttribute("aria-pressed", String(on));
          });
          refreshStockUI();
        });
      });

      $$("[data-size-pick]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          selectedSize = btn.getAttribute("data-size-pick");
          refreshStockUI();
        });
      });

      var qtyEl = document.getElementById("pdp-qty");
      var decBtn = document.getElementById("pdp-qty-dec");
      var incBtn = document.getElementById("pdp-qty-inc");
      if (decBtn && qtyEl) decBtn.addEventListener("click", function () { qtyEl.value = String(Math.max(1, (Number(qtyEl.value) || 1) - 1)); });
      if (incBtn && qtyEl) incBtn.addEventListener("click", function () {
        var max = Number(qtyEl.max) || 10;
        qtyEl.value = String(Math.min(max, (Number(qtyEl.value) || 1) + 1));
      });

      var addBtn = document.getElementById("pdp-add-btn");
      if (addBtn) {
        addBtn.addEventListener("click", function () {
          var left = stockFor(product.id, selectedColor, selectedSize);
          var want = Math.max(1, Math.floor(Number(qtyEl.value) || 1));
          var cart = getCart();
          var existing = cart.filter(function (i) { return i.id === product.id && i.color === selectedColor && i.size === selectedSize; })[0];
          var inBag = existing ? existing.qty : 0;
          if (inBag + want > left) {
            showToast("Only " + Math.max(0, left - inBag) + " more units available in " + selectedColor + " / " + selectedSize + ".", "error");
            return;
          }
          if (existing) existing.qty += want;
          else cart.push({
            id: product.id, name: product.name, category: product.category,
            size: selectedSize, color: selectedColor, price: product.price, qty: want,
            cat: B.categoryName(product.category), image: imgs[activeImgIdx] || imgs[0] || ""
          });
          saveCart(cart);
          showToast("Added " + want + " × " + product.name + " to your bag.", "success");
        });
      }

      var sizeGuideBtn = document.getElementById("open-size-guide");
      if (sizeGuideBtn) {
        sizeGuideBtn.addEventListener("click", function () {
          var backdrop = document.createElement("div");
          backdrop.className = "js-modal-backdrop";
          backdrop.innerHTML =
            "<div class='js-modal' role='dialog' aria-modal='true' aria-labelledby='sg-title'>" +
              "<p class='eyebrow dark'>Fit &amp; Measurements</p>" +
              "<h2 id='sg-title'>Size guide</h2>" +
              "<table class='sg-table'><thead><tr><th>Size</th><th>Waist (in)</th><th>EU Shoe</th></tr></thead>" +
              "<tbody><tr><td>S</td><td>28–30</td><td>—</td></tr><tr><td>M</td><td>31–33</td><td>39–42</td></tr><tr><td>L</td><td>34–36</td><td>43–46</td></tr><tr><td>XL</td><td>37–39</td><td>—</td></tr><tr><td>XXL</td><td>40–42</td><td>—</td></tr></tbody></table>" +
              "<p class='fine-print'>Bow ties, pocket squares, wallets, and eyeglass cases come in standard universal proportions.</p>" +
              "<div class='js-modal-actions'><button type='button' class='btn btn-primary' data-close-sg>Close</button></div>" +
            "</div>";
          document.body.appendChild(backdrop);
          backdrop.querySelector("[data-close-sg]").focus();
          backdrop.addEventListener("click", function (ev) {
            if (ev.target === backdrop || ev.target.closest("[data-close-sg]")) backdrop.remove();
          });
        });
      }

      var revForm = document.getElementById("pdp-review-form");
      if (revForm) {
        var activeUser = currentUser();
        if (activeUser && document.getElementById("rev-author")) {
          document.getElementById("rev-author").value = activeUser.name || "";
        }
        revForm.addEventListener("submit", function (e) {
          e.preventDefault();
          var author = document.getElementById("rev-author");
          var rating = document.getElementById("rev-rating");
          var title = document.getElementById("rev-title");
          var body = document.getElementById("rev-body");
          var ok = true;
          function setErr(id, msg) {
            var el = document.getElementById("err-" + id);
            var inp = document.getElementById(id);
            if (el) el.textContent = msg || "";
            if (inp) inp.classList.toggle("is-invalid", Boolean(msg));
            if (msg) ok = false;
          }
          setErr("rev-author", author.value.trim().length < 2 ? "Enter your name (at least 2 characters)." : "");
          setErr("rev-title", title.value.trim().length < 3 ? "Enter a short headline." : "");
          setErr("rev-body", body.value.trim().length < 8 ? "Write at least 8 characters." : "");
          if (!ok) return;

          var allRevs = read(KEY.reviews, []);
          allRevs.unshift({
            id: "rev-" + Date.now().toString(36),
            productId: product.id,
            author: author.value.trim(),
            rating: Number(rating.value) || 5,
            title: title.value.trim(),
            body: body.value.trim(),
            createdAt: new Date().toISOString().slice(0, 10),
            status: "approved",
            source: "customer"
          });
          write(KEY.reviews, allRevs);
          showToast("Review published. Thank you!", "success");
          renderPDP();
        });
      }
    }

    renderPDP();
  }

  /* ---------- Cart Page (cart.html) ---------- */
  function renderCartPage() {
    var list = $(".cart-items");
    if (!list) return;
    var cart = getCart();
    var heading = $(".cart-heading span, .cart-heading p");
    $$(".cart-item, .cart-empty, .empty-state", list).forEach(function (n) { n.remove(); });

    var anchor = $(".cart-heading", list);
    var frag = document.createDocumentFragment();

    if (cart.length === 0) {
      var empty = document.createElement("div");
      empty.className = "empty-state";
      empty.innerHTML =
        "<h3>Your shopping bag is empty</h3>" +
        "<p>Explore our six essentials collections to add items to your bag.</p>" +
        "<a class='btn btn-primary' href='products.html'>Continue shopping</a>";
      frag.appendChild(empty);
    }

    cart.forEach(function (item, idx) {
      var left = stockFor(item.id, item.color, item.size);
      var art = document.createElement("article");
      art.className = "cart-item";
      art.innerHTML =
        "<div class='cart-thumbnail cart-thumbnail--photo'>" +
          "<img src='" + esc(item.image || "") + "' alt='" + esc(item.name) + " in " + esc(item.color || "") + "' loading='lazy' data-fallback-title='" + esc(item.name) + "' />" +
        "</div>" +
        "<div>" +
          "<p class='eyebrow dark'>" + esc(item.cat || "") + "</p>" +
          "<h3><a href='product-details.html?id=" + encodeURIComponent(item.id) + "'>" + esc(item.name) + "</a></h3>" +
          "<p>" + esc(item.size) + " &middot; " + esc(item.color) + "</p>" +
          (left <= 5 && left > 0 ? "<p class='stock-status is-low'>Only " + left + " left</p>" : left === 0 ? "<p class='stock-status is-out'>Currently out of stock</p>" : "") +
        "</div>" +
        "<div class='item-cost'>" +
          "<strong class='num'>" + money(item.price * item.qty) + "</strong>" +
          "<div class='qty-stepper' role='group' aria-label='Quantity for " + esc(item.name) + "'>" +
            "<button type='button' data-act='dec' data-i='" + idx + "' aria-label='Decrease quantity'>&minus;</button>" +
            "<span class='num'>" + item.qty + "</span>" +
            "<button type='button' data-act='inc' data-i='" + idx + "' aria-label='Increase quantity'" + (item.qty >= Math.min(10, left) ? " disabled" : "") + ">+</button>" +
          "</div>" +
          "<span class='num'>" + money(item.price) + " each</span>" +
          "<button type='button' class='subtle-link remove-item' data-act='remove' data-i='" + idx + "'>Remove</button>" +
        "</div>";
      frag.appendChild(art);
    });

    if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(frag, anchor.nextSibling);
    else list.appendChild(frag);

    var t = cartTotals(cart);
    if (heading) heading.textContent = t.units + " item" + (t.units === 1 ? "" : "s") + " · " + cart.length + " product" + (cart.length === 1 ? "" : "s");
    updateSummaryCard($(".summary-card"), t);
    renderCouponBox(t);

    var checkout = $(".summary-card a[href='checkout.html']");
    if (checkout) {
      checkout.classList.toggle("is-disabled", cart.length === 0);
      checkout.setAttribute("aria-disabled", String(cart.length === 0));
    }
    updateBagPill();
  }

  function updateSummaryCard(card, t) {
    if (!card) return;
    var box = card.querySelector("#summary-breakdown");
    if (box) {
      box.innerHTML =
        "<div class='summary-row'><span>Subtotal (" + t.units + " items)</span><strong class='num'>" + money(t.subtotal) + "</strong></div>" +
        (t.discount > 0 ? "<div class='summary-row is-discount'><span>Coupon discount (" + esc(t.coupon.code) + ")</span><strong class='num'>−" + money(t.discount) + "</strong></div>" : "") +
        "<div class='summary-row'><span>Delivery</span><strong class='num'>" + (t.subtotal === 0 ? money(0) : t.delivery === 0 ? "Free" : money(t.delivery)) + "</strong></div>" +
        "<div class='summary-row'><span>VAT (5%)</span><strong class='num'>" + money(t.tax) + "</strong></div>";
    }
    var totalEl = card.querySelector("#summary-total-amount");
    if (totalEl) totalEl.textContent = money(t.total);
    var fine = card.querySelector(".fine-print");
    if (fine) {
      fine.textContent = t.subtotal >= 3000
        ? "You qualify for free delivery across Bangladesh. 5% VAT is calculated on the discounted subtotal."
        : "Delivery is ৳120 (free on orders of ৳3,000 or more). Add " + money(Math.max(0, 3000 - t.subtotal)) + " more for free delivery.";
    }
  }

  function renderCouponBox(t) {
    var card = $(".summary-card");
    if (!card) return;
    var box = card.querySelector(".coupon-box");
    if (!box) {
      box = document.createElement("div");
      box.className = "coupon-box";
      box.innerHTML =
        "<label for='coupon-code'>Coupon code</label>" +
        "<div class='coupon-row'><input id='coupon-code' type='text' placeholder='WELCOME10, BRUT20, FREESHIP' autocomplete='off' />" +
        "<button type='button' id='coupon-apply' class='btn btn-ghost btn-sm'>Apply</button></div>" +
        "<p class='coupon-msg' role='status'></p>";
      var anchor = card.querySelector(".summary-total") || card.lastElementChild;
      card.insertBefore(box, anchor);

      box.querySelector("#coupon-apply").addEventListener("click", function () {
        var code = (box.querySelector("#coupon-code").value || "").trim().toUpperCase();
        var msg = box.querySelector(".coupon-msg");
        var sub = cartTotals(getCart()).subtotal;
        if (sub === 0) {
          msg.textContent = "Add items to your bag before applying a coupon.";
          msg.className = "coupon-msg is-error";
          return;
        }
        var res = L ? L.validateCoupon(code, sub, getCouponsPool()) : { ok: false, error: "Invalid coupon." };
        if (!res.ok) {
          msg.textContent = res.error;
          msg.className = "coupon-msg is-error";
          return;
        }
        write(KEY.coupon, res.coupon.code);
        msg.textContent = res.coupon.code + " applied: " + (res.coupon.description || "Discount active.");
        msg.className = "coupon-msg is-ok";
        showToast("Coupon " + res.coupon.code + " applied.", "success");
        renderCartPage();
      });
    }
    var current = read(KEY.coupon, null);
    var input = box.querySelector("#coupon-code");
    if (current && input && !input.value) input.value = current;
    var msg = box.querySelector(".coupon-msg");
    if (t && t.coupon && msg && !msg.textContent) {
      msg.textContent = t.coupon.code + " applied (" + (t.coupon.description || "active") + ").";
      msg.className = "coupon-msg is-ok";
    }
    var rem = box.querySelector(".coupon-remove");
    if (current && !rem) {
      rem = document.createElement("button");
      rem.type = "button";
      rem.className = "link-btn coupon-remove";
      rem.textContent = "Remove coupon";
      rem.addEventListener("click", function () {
        localStorage.removeItem(KEY.coupon);
        if (input) input.value = "";
        if (msg) { msg.textContent = ""; msg.className = "coupon-msg"; }
        renderCartPage();
      });
      box.appendChild(rem);
    }
    if (!current && rem) rem.remove();
  }

  function initCartControls() {
    var list = $(".cart-items");
    if (!list) return;
    list.addEventListener("click", function (e) {
      var btn = e.target.closest("button[data-act]");
      if (!btn) return;
      var cart = getCart();
      var i = Number(btn.getAttribute("data-i"));
      var item = cart[i];
      if (!item) return;
      var left = stockFor(item.id, item.color, item.size);
      if (btn.dataset.act === "inc" && item.qty < Math.min(10, left)) item.qty++;
      if (btn.dataset.act === "dec") item.qty--;
      if (btn.dataset.act === "remove" || item.qty <= 0) {
        cart.splice(i, 1);
        showToast("Removed " + item.name + " from bag.", "warning");
      }
      saveCart(cart);
      renderCartPage();
    });
  }

  /* ---------- Checkout Page (checkout.html) ---------- */
  var PAYMENT_NOTES = {
    COD: "Cash on delivery — pay the courier in cash upon parcel arrival. Demo payment, no real money is charged.",
    bKash: "bKash simulation — demo payment only, no real money is charged.",
    Nagad: "Nagad simulation — demo payment only, no real money is charged.",
    CARD: "Card simulation — demo payment only, do not enter real card credentials."
  };

  function initCheckoutPage() {
    var form = document.getElementById("checkout-form");
    var summary = $(".checkout-summary");
    if (!form || !summary) return;

    var cart = getCart();
    var t = cartTotals(cart);
    updateSummaryCard(summary, t);

    var itemsPreview = document.getElementById("checkout-items-list");
    if (itemsPreview) {
      itemsPreview.innerHTML = cart.length
        ? cart.map(function (i) {
            return "<div class='summary-item-line'><span>" + esc(i.name) + " (" + esc(i.color) + ", " + esc(i.size) + ") × " + i.qty + "</span><strong class='num'>" + money(i.price * i.qty) + "</strong></div>";
          }).join("")
        : "<p class='muted'>Your bag is empty. <a href='products.html'>Add items first</a>.</p>";
    }

    // Populate Bangladeshi districts
    var distSel = document.getElementById("ship-district");
    if (distSel && L && L.BD_DISTRICTS) {
      distSel.innerHTML = "<option value=''>Select a district</option>" +
        L.BD_DISTRICTS.map(function (d) { return "<option value='" + esc(d) + "'>" + esc(d) + "</option>"; }).join("");
    }

    // Prefill from logged-in user + default saved address
    var user = currentUser();
    if (user) {
      var nameInp = document.getElementById("ship-name");
      var emailInp = document.getElementById("ship-email");
      var phoneInp = document.getElementById("ship-phone");
      var addrInp = document.getElementById("ship-address");
      if (nameInp && !nameInp.value) nameInp.value = user.name || "";
      if (emailInp && !emailInp.value) emailInp.value = user.email || "";
      if (phoneInp && !phoneInp.value && user.phone) phoneInp.value = user.phone;
      var defAddr = (user.addresses || []).filter(function (a) { return a.isDefault; })[0] || (user.addresses || [])[0];
      if (defAddr) {
        if (distSel && defAddr.district) distSel.value = defAddr.district;
        if (addrInp && defAddr.street) addrInp.value = defAddr.street;
        if (phoneInp && !phoneInp.value && defAddr.phone) phoneInp.value = defAddr.phone;
      }
    }

    var noteEl = document.getElementById("payment-method-note");
    function selectedPayment() {
      var checked = $('input[name="payment-method"]:checked', form);
      return checked ? checked.value : "COD";
    }
    function refreshPaymentNote() {
      if (noteEl) noteEl.textContent = PAYMENT_NOTES[selectedPayment()] || PAYMENT_NOTES.COD;
    }
    $$('input[name="payment-method"]', form).forEach(function (r) {
      r.addEventListener("change", refreshPaymentNote);
    });
    refreshPaymentNote();

    function setFieldErr(id, msg) {
      var inp = document.getElementById(id);
      var err = document.getElementById("err-" + id);
      if (err) err.textContent = msg || "";
      if (inp) inp.classList.toggle("is-invalid", Boolean(msg));
      return !msg;
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var freshCart = getCart();
      if (!freshCart.length) {
        showToast("Your bag is empty. Add items before placing an order.", "error");
        return;
      }

      var nameEl = document.getElementById("ship-name");
      var emailEl = document.getElementById("ship-email");
      var phoneEl = document.getElementById("ship-phone");
      var distEl = document.getElementById("ship-district");
      var addrEl = document.getElementById("ship-address");

      var valid = true;
      valid = setFieldErr("ship-name", nameEl.value.trim().length < 2 ? "Enter your full name." : "") && valid;
      valid = setFieldErr("ship-email", !(L ? L.isValidEmail(emailEl.value) : emailEl.value.includes("@")) ? "Enter a valid email address." : "") && valid;
      valid = setFieldErr("ship-phone", !(L ? L.isValidBDPhone(phoneEl.value) : /^01\d{9}$/.test(phoneEl.value.trim())) ? "Use a valid Bangladeshi number (+8801XXXXXXXXX or 01XXXXXXXXX)." : "") && valid;
      valid = setFieldErr("ship-district", !distEl.value ? "Select your delivery district." : "") && valid;
      valid = setFieldErr("ship-address", addrEl.value.trim().length < 8 ? "Enter your full street address, house, and area." : "") && valid;

      if (!valid) {
        showToast("Please fix the highlighted delivery fields.", "error");
        return;
      }

      var submitBtn = document.getElementById("place-order-btn");
      submitBtn.disabled = true;
      submitBtn.textContent = "Placing order...";

      setTimeout(function () {
        var totals = cartTotals(freshCart);
        var cleanPhone = L ? L.normalizeBDPhone(phoneEl.value) : phoneEl.value.trim();
        var orderId = "BB-" + Date.now().toString(36).toUpperCase().slice(-6);
        var orderPayload = {
          id: orderId,
          at: new Date().toISOString(),
          userId: user ? user.id : null,
          customer: nameEl.value.trim(),
          email: emailEl.value.trim(),
          phone: cleanPhone,
          district: distEl.value,
          address: addrEl.value.trim() + ", " + distEl.value,
          method: selectedPayment(),
          items: freshCart.map(function (i) {
            return { productId: i.id, name: i.name, size: i.size, color: i.color, qty: i.qty, price: i.price };
          }),
          totals: totals,
          total: totals.total,
          paymentStatus: "DEMO · NOT CHARGED",
          source: "storefront"
        };

        // Deduct purchased stock from bb_products
        if (L && B) {
          var currentProds = read(KEY.products, []);
          var updatedProds = L.deductStockFromProducts(currentProds, freshCart);
          write(KEY.products, updatedProds);
        }

        var savedOrder = window.BBOrders ? window.BBOrders.save(window.BBOrders.create(orderPayload)) : orderPayload;
        write(KEY.lastOrder, savedOrder);

        // Save address on user profile if signed in and none exists yet
        if (user) {
          var users = read(KEY.users, []);
          var u = users.filter(function (x) { return x.id === user.id; })[0];
          if (u) {
            u.phone = u.phone || cleanPhone;
            u.addresses = u.addresses || [];
            if (!u.addresses.some(function (a) { return a.street === addrEl.value.trim(); })) {
              u.addresses.unshift({ id: "addr-" + Date.now().toString(36), label: distEl.value, district: distEl.value, street: addrEl.value.trim(), phone: cleanPhone, isDefault: u.addresses.length === 0 });
            }
            write(KEY.users, users);
          }
        }

        if (B) B.logActivity("order", "Storefront order " + savedOrder.id + " placed (" + money(totals.total) + ").");
        write(KEY.cart, []);
        localStorage.removeItem(KEY.coupon);
        window.location.href = "receipt.html?order=" + encodeURIComponent(savedOrder.id) + "&placed=1";
      }, 450);
    });
  }

  /* ---------- Receipt Page (receipt.html) ---------- */
  function initReceiptPage() {
    var paper = $(".receipt-paper");
    if (!paper) return;
    var params = new URLSearchParams(location.search);
    var orderId = params.get("order");
    var placed = params.get("placed") === "1";

    var order = (orderId && window.BBOrders) ? window.BBOrders.findById(orderId) : null;
    if (!order) order = read(KEY.lastOrder, null);
    if (!order && window.BBOrders) order = window.BBOrders.read()[0] || null;

    var banner = document.getElementById("receipt-placed-banner");
    if (banner && placed && order) {
      banner.hidden = false;
      banner.innerHTML = "<strong>Order " + esc(order.id) + " placed!</strong> Tracking code: <code class='num'>" + esc(order.tracking || "") + "</code>. A copy is ready to print below.";
      showToast("Order " + order.id + " placed successfully.", "success");
    }

    if (order) {
      var dateStr = "";
      try { dateStr = new Date(order.createdAt || order.at).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }); }
      catch (e) { dateStr = order.at || ""; }

      var totals = order.totals || { subtotal: order.total, discount: 0, delivery: 0, tax: 0, total: order.total };
      var itemsHTML = (order.items || []).map(function (it) {
        return "<div class='receipt-line'><span>" + esc(it.name) + " (" + esc(it.color || "") + ", " + esc(it.size || "") + ")</span><span>" + it.qty + "</span><strong class='num'>" + money((Number(it.price) || 0) * (Number(it.qty) || 0)) + "</strong></div>";
      }).join("");

      paper.innerHTML =
        "<div class='receipt-center'>" +
          "<h2>BRUTBOX &amp; CO.</h2>" +
          "<p>Men's Essentials &middot; Banani, Dhaka</p>" +
          "<p>Phone: +880 1711-000111</p>" +
          "<hr />" +
          "<strong>ORDER " + esc(order.id) + "</strong>" +
          "<p>" + esc(dateStr) + "</p>" +
        "</div><hr />" +
        "<div class='receipt-row'><span>Customer</span><strong>" + esc(order.customer || "Guest") + "</strong></div>" +
        (order.phone ? "<div class='receipt-row'><span>Phone</span><strong class='num'>" + esc(order.phone) + "</strong></div>" : "") +
        (order.address ? "<div class='receipt-row'><span>Address</span><strong>" + esc(order.address) + "</strong></div>" : "") +
        "<div class='receipt-row'><span>Payment</span><strong>" + esc(order.method || "COD") + "</strong></div>" +
        "<div class='receipt-row'><span>Status</span><strong>" + esc(order.paymentStatus || "DEMO · NOT PAID") + "</strong></div>" +
        "<hr />" +
        "<div class='receipt-items'>" +
          "<div class='receipt-head'><strong>Item</strong><strong>Qty</strong><strong>Amount</strong></div>" +
          itemsHTML +
        "</div><hr />" +
        "<div class='receipt-row'><span>Subtotal</span><strong class='num'>" + money(totals.subtotal) + "</strong></div>" +
        (totals.discount > 0 ? "<div class='receipt-row'><span>Discount</span><strong class='num'>−" + money(totals.discount) + "</strong></div>" : "") +
        "<div class='receipt-row'><span>Delivery</span><strong class='num'>" + (totals.delivery === 0 ? "Free" : money(totals.delivery)) + "</strong></div>" +
        "<div class='receipt-row'><span>VAT (5%)</span><strong class='num'>" + money(totals.tax || 0) + "</strong></div>" +
        "<div class='receipt-row receipt-grand'><span>TOTAL (BDT)</span><strong class='num'>" + money(totals.total) + "</strong></div>" +
        "<hr />" +
        (order.tracking ? "<p class='receipt-track'>Tracking code: <strong class='num'>" + esc(order.tracking) + "</strong><br/>Track at <a href='track.html?q=" + encodeURIComponent(order.id) + "&p=" + encodeURIComponent(String(order.phone || "").slice(-4)) + "'>track.html</a></p>" : "") +
        "<div class='receipt-center receipt-thanks'><p>Thank you for shopping with BRUTBOX &amp; CO.</p><p>Demo receipt — no real payment was processed.</p></div>";
    }

    var printBtn = document.getElementById("receipt-print-btn");
    if (printBtn) printBtn.addEventListener("click", function () { window.print(); });
    var trackLink = document.getElementById("receipt-track-link");
    if (trackLink && order) {
      trackLink.href = "track.html?q=" + encodeURIComponent(order.id) + "&p=" + encodeURIComponent(String(order.phone || "").slice(-4));
    }
  }

  /* ---------- Customer Signup, Login & Account Pages ---------- */
  function initAuthPages() {
    var loginForm = document.getElementById("customer-login-form");
    if (loginForm) {
      if (currentUser()) { window.location.replace("account.html"); return; }
      loginForm.addEventListener("submit", function (e) {
        e.preventDefault();
        var emailEl = document.getElementById("login-email");
        var passEl = document.getElementById("login-password");
        var errBox = document.getElementById("login-error");
        errBox.hidden = true;
        var email = emailEl.value.trim().toLowerCase();
        var pass = passEl.value;
        if (!(L ? L.isValidEmail(email) : email.includes("@"))) {
          errBox.textContent = "Enter a valid email address.";
          errBox.hidden = false;
          return;
        }
        var users = read(KEY.users, []);
        var match = users.filter(function (u) { return String(u.email || "").toLowerCase() === email; })[0];
        if (!match || match.password !== pass) {
          errBox.textContent = "Email or password did not match any account stored in this browser.";
          errBox.hidden = false;
          return;
        }
        write(KEY.userSession, { id: match.id, name: match.name, email: match.email });
        showToast("Welcome back, " + match.name + ".", "success");
        setTimeout(function () { window.location.href = "account.html"; }, 300);
      });
    }

    var signupForm = document.getElementById("customer-signup-form");
    if (signupForm) {
      if (currentUser()) { window.location.replace("account.html"); return; }
      var passInp = document.getElementById("reg-pass");
      var meter = document.getElementById("pw-strength");
      if (passInp && meter && L) {
        passInp.addEventListener("input", function () {
          var ev = L.evaluatePassword(passInp.value);
          meter.textContent = passInp.value ? ("Password strength: " + ev.label + " (8+ characters with a number or uppercase letter)") : "";
          meter.className = "pw-strength " + (ev.valid ? "is-ok" : "is-weak");
        });
      }
      signupForm.addEventListener("submit", function (e) {
        e.preventDefault();
        var nameEl = document.getElementById("reg-name");
        var emailEl = document.getElementById("reg-email");
        var passEl = document.getElementById("reg-pass");
        var confEl = document.getElementById("reg-confirm");
        var errBox = document.getElementById("signup-error");
        errBox.hidden = true;

        var email = emailEl.value.trim().toLowerCase();
        var users = read(KEY.users, []);
        var errs = [];
        if (nameEl.value.trim().length < 2) errs.push("Enter your full name.");
        if (!(L ? L.isValidEmail(email) : email.includes("@"))) errs.push("Enter a valid email address.");
        if (users.some(function (u) { return String(u.email || "").toLowerCase() === email; })) errs.push("An account with this email already exists.");
        var pwCheck = L ? L.evaluatePassword(passEl.value) : { valid: passEl.value.length >= 8 };
        if (!pwCheck.valid) errs.push("Password must be at least 8 characters and include a number, uppercase letter, or symbol.");
        if (passEl.value !== confEl.value) errs.push("Password confirmation does not match.");
        if (errs.length) {
          errBox.textContent = errs.join(" ");
          errBox.hidden = false;
          return;
        }
        var newUser = {
          id: "usr-" + Date.now().toString(36),
          name: nameEl.value.trim(),
          email: email,
          password: passEl.value,
          phone: "",
          addresses: [],
          createdAt: new Date().toISOString()
        };
        users.unshift(newUser);
        write(KEY.users, users);
        write(KEY.userSession, { id: newUser.id, name: newUser.name, email: newUser.email });
        showToast("Account created! Welcome to BRUTBOX & CO.", "success");
        setTimeout(function () { window.location.href = "account.html"; }, 350);
      });
    }
  }

  function initAccountPage() {
    var mount = document.getElementById("account-mount");
    if (!mount) return;
    var user = currentUser();
    if (!user) {
      mount.innerHTML =
        "<div class='empty-state'>" +
          "<h2>Sign in to view your account</h2>" +
          "<p>Access your saved delivery addresses, order history, and wishlist.</p>" +
          "<div class='empty-actions'><a class='btn btn-primary' href='login.html'>Sign in</a> <a class='btn btn-ghost' href='signup.html'>Create account</a></div>" +
        "</div>";
      return;
    }

    function renderAccount() {
      var users = read(KEY.users, []);
      var freshUser = users.filter(function (u) { return u.id === user.id; })[0] || user;
      var orders = (window.BBOrders ? window.BBOrders.read() : []).filter(function (o) {
        return o.userId === freshUser.id || (o.email && String(o.email).toLowerCase() === String(freshUser.email).toLowerCase());
      });
      var wishlistIds = getWishlist();

      mount.innerHTML =
        "<div class='account-head'>" +
          "<div><p class='eyebrow dark'>Member profile</p><h1>Welcome, " + esc(freshUser.name) + "</h1><p class='muted'>" + esc(freshUser.email) + "</p></div>" +
          "<button type='button' id='acc-logout-btn' class='btn btn-ghost'>Sign out</button>" +
        "</div>" +
        "<div class='account-grid'>" +
          "<section class='panel-card'>" +
            "<h2>Order history (" + orders.length + ")</h2>" +
            (orders.length
              ? "<div class='table-wrap'><table class='data-table'><thead><tr><th>Order</th><th>Date</th><th>Total</th><th>Status</th><th></th></tr></thead><tbody>" +
                orders.map(function (o) {
                  var tot = o.totals ? o.totals.total : o.total;
                  return "<tr><td class='num'><strong>" + esc(o.id) + "</strong><div class='muted small'>" + esc(o.tracking || "") + "</div></td>" +
                    "<td>" + esc(new Date(o.createdAt || o.at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })) + "</td>" +
                    "<td class='num'>" + money(tot) + "</td>" +
                    "<td>" + esc(window.BBOrders ? window.BBOrders.stepLabel(o.status) : o.status) + "</td>" +
                    "<td><a class='subtle-link' href='receipt.html?order=" + encodeURIComponent(o.id) + "'>Receipt</a> &middot; <a class='subtle-link' href='track.html?q=" + encodeURIComponent(o.id) + "&p=" + encodeURIComponent(String(o.phone || "").slice(-4)) + "'>Track</a></td></tr>";
                }).join("") +
                "</tbody></table></div>"
              : "<div class='empty-state'><p>You have not placed any orders yet.</p><a class='btn btn-primary btn-sm' href='products.html'>Start shopping</a></div>") +
          "</section>" +
          "<section class='panel-card'>" +
            "<h2>Saved addresses</h2>" +
            "<div class='address-list'>" +
              ((freshUser.addresses && freshUser.addresses.length)
                ? freshUser.addresses.map(function (a) {
                    return "<article class='address-card'><div><strong>" + esc(a.label || a.district) + (a.isDefault ? " (Default)" : "") + "</strong><p>" + esc(a.street) + ", " + esc(a.district) + "</p><small class='num'>" + esc(a.phone) + "</small></div>" +
                      "<div class='address-actions'>" +
                        (!a.isDefault ? "<button type='button' class='link-btn' data-addr-default='" + esc(a.id) + "'>Set default</button>" : "") +
                        "<button type='button' class='link-btn danger' data-addr-del='" + esc(a.id) + "'>Delete</button>" +
                      "</div></article>";
                  }).join("")
                : "<p class='muted'>No saved addresses yet.</p>") +
            "</div>" +
            "<form id='acc-addr-form' class='addr-form'>" +
              "<h3>Add new address</h3>" +
              "<div class='field-grid'>" +
                "<div class='field'><label for='addr-label'>Label</label><input id='addr-label' type='text' placeholder='Home / Office' required /></div>" +
                "<div class='field'><label for='addr-district'>District</label><select id='addr-district'>" + (L ? L.BD_DISTRICTS : ["Dhaka"]).map(function (d) { return "<option>" + esc(d) + "</option>"; }).join("") + "</select></div>" +
                "<div class='field full'><label for='addr-street'>Street address</label><input id='addr-street' type='text' placeholder='House, road, block' required /></div>" +
                "<div class='field full'><label for='addr-phone'>Phone</label><input id='addr-phone' type='tel' placeholder='01XXXXXXXXX' required /></div>" +
              "</div>" +
              "<button type='submit' class='btn btn-primary btn-sm'>Save address</button>" +
            "</form>" +
          "</section>" +
        "</div>" +
        "<section class='panel-card acc-wish-sec'>" +
          "<h2>Saved wishlist (" + wishlistIds.length + ")</h2>" +
          (wishlistIds.length
            ? "<div class='shop-grid'>" + wishlistIds.map(function (id) {
                var p = B ? B.getProductById(id) : null;
                return p ? buildProductCardHTML(p, (function () { var s = {}; s[id] = true; return s; })()) : "";
              }).join("") + "</div>"
            : "<div class='empty-state'><p>No saved items yet.</p><a class='btn btn-ghost btn-sm' href='products.html'>Explore catalogue</a></div>") +
        "</section>";

      $("#acc-logout-btn").addEventListener("click", function () {
        localStorage.removeItem(KEY.userSession);
        showToast("Signed out.", "success");
        window.location.href = "index.html";
      });

      mount.querySelectorAll("[data-addr-del]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          var id = btn.getAttribute("data-addr-del");
          var list = read(KEY.users, []);
          var target = list.filter(function (x) { return x.id === user.id; })[0];
          if (!target) return;
          target.addresses = (target.addresses || []).filter(function (a) { return a.id !== id; });
          write(KEY.users, list);
          showToast("Address removed.", "warning");
          renderAccount();
        });
      });

      mount.querySelectorAll("[data-addr-default]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          var id = btn.getAttribute("data-addr-default");
          var list = read(KEY.users, []);
          var target = list.filter(function (x) { return x.id === user.id; })[0];
          if (!target) return;
          (target.addresses || []).forEach(function (a) { a.isDefault = a.id === id; });
          write(KEY.users, list);
          showToast("Default address updated.", "success");
          renderAccount();
        });
      });

      var addrForm = document.getElementById("acc-addr-form");
      if (addrForm) {
        addrForm.addEventListener("submit", function (e) {
          e.preventDefault();
          var lbl = document.getElementById("addr-label").value.trim();
          var dist = document.getElementById("addr-district").value;
          var street = document.getElementById("addr-street").value.trim();
          var phone = document.getElementById("addr-phone").value.trim();
          if (!lbl || street.length < 5 || (L && !L.isValidBDPhone(phone))) {
            showToast("Enter label, street address, and a valid Bangladeshi phone number.", "error");
            return;
          }
          var list = read(KEY.users, []);
          var target = list.filter(function (x) { return x.id === user.id; })[0];
          if (!target) return;
          target.addresses = target.addresses || [];
          target.addresses.push({
            id: "addr-" + Date.now().toString(36),
            label: lbl, district: dist, street: street,
            phone: L ? L.normalizeBDPhone(phone) : phone,
            isDefault: target.addresses.length === 0
          });
          write(KEY.users, list);
          showToast("Address saved.", "success");
          renderAccount();
        });
      }
    }

    renderAccount();
    window.addEventListener("wishlist:updated", renderAccount);
  }

  /* ---------- Inventory Page (inventory.html) ---------- */
  function initInventoryPage() {
    var tableBody = document.getElementById("inv-table-body");
    var select = document.getElementById("sku-select");
    var qty = document.getElementById("stock-add");
    var reason = document.getElementById("stock-reason");
    var searchInp = document.getElementById("inv-search");
    var catSel = document.getElementById("inv-cat");
    var logList = document.getElementById("inv-activity-list");
    if (!tableBody || !select || !B) return;
    if (window.AdminAuth) {
      if (!window.AdminAuth.requireSession("inventory.html")) return;
      var mainEl = document.getElementById("main");
      if (mainEl) mainEl.hidden = false;
      setInterval(function () {
        if (!window.AdminAuth.heartbeat()) window.AdminAuth.requireSession("inventory.html");
      }, (B.CONFIG && B.CONFIG.heartbeatMs) || 20000);
    }

    function buildVariants() {
      var list = B.getProducts(true);
      var rows = [];
      list.forEach(function (p) {
        (p.colors || []).forEach(function (c) {
          (p.sizes || []).forEach(function (s) {
            var stock = stockFor(p.id, c, s);
            rows.push({
              key: p.id + "::" + c + "::" + s,
              sku: p.id.toUpperCase() + "-" + c.slice(0, 3).toUpperCase() + "-" + s.replace(/\s+/g, ""),
              id: p.id, name: p.name, category: p.category,
              color: c, size: s, stock: stock, price: p.price
            });
          });
        });
      });
      return rows;
    }

    function renderInventory() {
      var variants = buildVariants();
      var q = (searchInp && searchInp.value || "").trim().toLowerCase();
      var cat = (catSel && catSel.value) || "all";

      var totalUnits = variants.reduce(function (s, v) { return s + v.stock; }, 0);
      var lowCount = variants.filter(function (v) { return v.stock > 0 && v.stock <= 5; }).length;
      var outCount = variants.filter(function (v) { return v.stock === 0; }).length;
      if (document.getElementById("inv-kpi-total")) document.getElementById("inv-kpi-total").textContent = totalUnits.toLocaleString("en-US");
      if (document.getElementById("inv-kpi-low")) document.getElementById("inv-kpi-low").textContent = String(lowCount);
      if (document.getElementById("inv-kpi-out")) document.getElementById("inv-kpi-out").textContent = String(outCount);

      var filtered = variants.filter(function (v) {
        if (cat !== "all" && v.category !== cat) return false;
        if (q && [v.name, v.sku, v.color, v.size].join(" ").toLowerCase().indexOf(q) === -1) return false;
        return true;
      });

      tableBody.innerHTML = filtered.length
        ? filtered.slice(0, 120).map(function (v) {
            var st = v.stock === 0 ? "Sold out" : v.stock <= 5 ? "Low stock" : "Healthy";
            var cls = v.stock === 0 ? "is-out" : v.stock <= 5 ? "is-low" : "is-ok";
            return "<tr><td class='num'>" + esc(v.sku) + "</td><td>" + esc(v.name) + "</td><td>" + esc(v.color) + "</td><td>" + esc(v.size) + "</td><td class='num'>" + v.stock + " units</td><td><span class='inv-status " + cls + "'>" + st + "</span></td></tr>";
          }).join("")
        : "<tr><td colspan='6' class='muted'>No variants match your filter.</td></tr>";

      var curVal = select.value;
      select.innerHTML = variants.map(function (v) {
        return "<option value='" + esc(v.key) + "'>" + esc(v.sku + " — " + v.name + " (" + v.color + ", " + v.size + ": " + v.stock + ")") + "</option>";
      }).join("");
      if (curVal && variants.some(function (v) { return v.key === curVal; })) select.value = curVal;

      if (logList) {
        var logs = read(KEY.activity, []);
        logList.innerHTML = logs.length
          ? logs.slice(0, 25).map(function (l) {
              return "<li><strong>" + esc(l.type) + "</strong>: " + esc(l.message) + " <time class='muted small'>" + esc(new Date(l.at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })) + "</time></li>";
            }).join("")
          : "<li class='muted'>No stock updates recorded yet.</li>";
      }
    }

    var form = document.getElementById("inv-restock-form");
    if (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var parts = (select.value || "").split("::");
        var pid = parts[0], color = parts[1], size = parts[2];
        var add = Math.floor(Number(qty.value));
        if (!pid || !add || add < 1) {
          showToast("Enter a restock quantity of at least 1.", "error");
          return;
        }
        var prods = read(KEY.products, []);
        var target = prods.filter(function (p) { return p.id === pid; })[0];
        if (!target) return;
        target.stock[color] = target.stock[color] || {};
        target.stock[color][size] = (Number(target.stock[color][size]) || 0) + add;
        write(KEY.products, prods);
        B.logActivity("restock", "Restocked " + target.name + " (" + color + ", " + size + ") +" + add + " -> " + target.stock[color][size] + " (" + (reason ? reason.value : "Manual") + ").");
        showToast("Restocked " + target.name + " (" + color + ", " + size + "): +" + add + " units.", "success");
        renderInventory();
      });
    }

    if (searchInp) searchInp.addEventListener("input", renderInventory);
    if (catSel) catSel.addEventListener("change", renderInventory);
    renderInventory();
  }

  /* ---------- Contact Form (contact.html) ---------- */
  function initContactPage() {
    var form = document.getElementById("contact-form");
    if (!form) return;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = document.getElementById("ct-name");
      var email = document.getElementById("ct-email");
      var msg = document.getElementById("ct-message");
      var ok = true;
      function err(id, m) {
        var el = document.getElementById("err-" + id);
        var inp = document.getElementById(id);
        if (el) el.textContent = m || "";
        if (inp) inp.classList.toggle("is-invalid", Boolean(m));
        if (m) ok = false;
      }
      err("ct-name", name.value.trim().length < 2 ? "Enter your name." : "");
      err("ct-email", !(L ? L.isValidEmail(email.value) : email.value.includes("@")) ? "Enter a valid email address." : "");
      err("ct-message", msg.value.trim().length < 10 ? "Write at least 10 characters." : "");
      if (!ok) return;

      var list = read(KEY.messages, []);
      list.unshift({
        id: "msg-" + Date.now().toString(36),
        name: name.value.trim(),
        email: email.value.trim(),
        topic: (document.getElementById("ct-topic") || {}).value || "General",
        message: msg.value.trim(),
        at: new Date().toISOString()
      });
      write(KEY.messages, list.slice(0, 100));
      form.reset();
      var status = document.getElementById("ct-status");
      if (status) { status.hidden = false; status.textContent = "Message received. Our Dhaka care team replies within one business day."; }
      showToast("Inquiry submitted successfully.", "success");
    });
  }

  /* ---------- Boot ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    updateBagPill();
    initHeaderAuthAndWishlist();
    initHomePage();
    initProductDetailsPage();
    renderCartPage();
    initCartControls();
    initCheckoutPage();
    initReceiptPage();
    initAuthPages();
    initAccountPage();
    initInventoryPage();
    initContactPage();
    window.addEventListener("cart:updated", updateBagPill);
  });
})();
