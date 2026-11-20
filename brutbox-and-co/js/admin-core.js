/* =====================================================================
   BRUTBOX & CO. — admin-core.js
   Shared data layer used by the storefront, accounts, and admin panel.
   Seeds 60 products, sample orders, 150 reviews, and default coupons
   into browser localStorage when not already initialized.
   ===================================================================== */
(function (global) {
  "use strict";

  var KEY = {
    products: "bb_products",
    orders: "bb_orders",
    reviews: "bb_reviews",
    coupons: "bb_coupons",
    users: "bb_users",
    userSession: "bb_user_session",
    wishlist: "bb_wishlist",
    recent: "bb_recently_viewed",
    messages: "bb_messages",
    sessions: "bb_admin_sessions",
    activity: "bb_activity",
    lastOrder: "brutbox_last_order",
    seed: "bb_seed_version"
  };
  var SEED_VERSION = "bb-v11";

  var CONFIG = {
    maxAdmins: 3,
    sessionTtlMs: 90 * 1000,
    heartbeatMs: 20 * 1000,
    spikeMultiple: 2,
    spikeMinRevenue: 1000,
    lowStock: 5
  };

  var CATEGORIES = (global.BRUTBOX_CATALOG && global.BRUTBOX_CATALOG.categories || []).map(function (c) {
    return { slug: c.slug, name: c.name, sizes: c.sizes.slice(), image: c.image, description: c.description || "" };
  });

  var COLOR_HEX = (global.BRUTBOX_CATALOG && global.BRUTBOX_CATALOG.colourHex) || {
    "Obsidian Black": "#16191f", "Royal Navy": "#1f2d4d", "Classic Ivory": "#f2efe6",
    "Crimson Burgundy": "#6d1f2b", "Cognac Tan": "#9a6a3a", "Forest Emerald": "#1e6b52",
    "Champagne Silk": "#e8d8b5", "Charcoal Slate": "#4a4f57", "Cobalt Sapphire": "#1f4fa0",
    "Imperial Gold": "#c89c3a", "Plum Aubergine": "#5b2a52", "Espresso Brown": "#3b2a1f",
    "Heather Grey": "#9aa0a6", "Olive Moss": "#6b6b3a", "Terracotta Rust": "#b5532f",
    "Titanium Silver": "#a7adb3", "Black": "#16191f", "Navy": "#1f2d4d"
  };

  function read(k, fallback) {
    try {
      var r = localStorage.getItem(k);
      return r === null ? fallback : JSON.parse(r);
    } catch (e) {
      return fallback;
    }
  }
  function write(k, v) {
    try {
      localStorage.setItem(k, JSON.stringify(v));
      return true;
    } catch (e) {
      return false;
    }
  }
  function money(n) { return "৳" + Math.round(Number(n) || 0).toLocaleString("en-US"); }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function categoryName(slug) {
    var c = CATEGORIES.filter(function (x) { return x.slug === slug; })[0];
    return c ? c.name : slug;
  }
  function totalStock(stock) {
    return Object.keys(stock || {}).reduce(function (sum, color) {
      return sum + Object.keys(stock[color] || {}).reduce(function (s, size) {
        return s + Number(stock[color][size] || 0);
      }, 0);
    }, 0);
  }
  function productImages(p) {
    if (p && Array.isArray(p.images) && p.images.length) return p.images;
    if (p && p.image) return [p.image];
    return [];
  }

  function buildSample() {
    var catalog = (global.BRUTBOX_CATALOG && global.BRUTBOX_CATALOG.products) || [];
    var products = catalog.map(function (d) {
      var stock = {};
      Object.keys(d.stock || {}).forEach(function (color) {
        stock[color] = Object.assign({}, d.stock[color]);
      });
      return {
        id: d.id,
        name: d.name,
        category: d.category,
        description: d.description || "",
        price: d.price,
        originalPrice: d.originalPrice || null,
        colors: d.colors.slice(),
        sizes: d.sizes.slice(),
        stock: stock,
        image: d.image,
        images: (d.images || [d.image]).slice(),
        photoCount: d.photoCount || 0,
        rating: d.rating || 4.8,
        reviewCount: d.reviewCount || 0,
        hidden: false,
        source: "seed",
        createdAt: d.createdAt,
        badge: d.badge || null
      };
    });

    var orders = [], n = 0, now = Date.now(), DAY = 864e5;
    function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
    function pick(list) { return list[Math.floor(Math.random() * list.length)]; }

    function addOrder(atMs, qtyMax, lines, fixedInfo) {
      var items = [], subtotal = 0;
      for (var l = 0; l < lines; l++) {
        var p = pick(products), color = pick(p.colors), size = pick(p.sizes);
        var qty = randInt(1, qtyMax);
        items.push({ productId: p.id, name: p.name, size: size, color: color, qty: qty, price: p.price });
        subtotal += qty * p.price;
      }
      var delivery = subtotal >= 3000 ? 0 : 120;
      var tax = Math.round(subtotal * 0.05);
      var total = subtotal + delivery + tax;
      var order = {
        id: fixedInfo && fixedInfo.id ? fixedInfo.id : "BB-S" + (++n).toString(36).toUpperCase(),
        at: new Date(atMs).toISOString(),
        customer: fixedInfo && fixedInfo.customer ? fixedInfo.customer : pick(["Tanvir Rahman", "Nabil Chowdhury", "Farhan Ahmed", "Rafiul Karim", "Arifur Islam"]),
        email: fixedInfo && fixedInfo.email ? fixedInfo.email : "customer@example.com",
        phone: fixedInfo && fixedInfo.phone ? fixedInfo.phone : "017" + String(randInt(10000000, 99999999)),
        district: fixedInfo && fixedInfo.district ? fixedInfo.district : "Dhaka",
        address: fixedInfo && fixedInfo.address ? fixedInfo.address : "House 14, Road 6, Dhanmondi, Dhaka",
        method: pick(["COD", "bKash", "Nagad", "CARD"]),
        items: items,
        totals: { subtotal: subtotal, discount: 0, delivery: delivery, tax: tax, total: total },
        total: total,
        paymentStatus: "DEMO · NOT PAID",
        source: "seed"
      };
      var ageDays = (now - atMs) / DAY;
      var st = fixedInfo && fixedInfo.status
        ? fixedInfo.status
        : ageDays > 3 ? "delivered" : ageDays > 1 ? pick(["delivered", "out", "shipped"]) : pick(["placed", "confirmed", "packed", "shipped", "out"]);
      if (global.BBOrders) order = global.BBOrders.sampleHistory(global.BBOrders.ensure(order), st, atMs);
      if (fixedInfo && fixedInfo.tracking) order.tracking = fixedInfo.tracking;
      orders.push(order);
    }

    // Deterministic demo order so tracking lookup can always be demonstrated cleanly
    addOrder(now - 2 * DAY, 1, 2, {
      id: "BB-1042",
      tracking: "BBX7K4M2P9Q",
      customer: "Tanvir Rahman",
      email: "tanvir@brutbox-demo.bd",
      phone: "01711223344",
      district: "Dhaka",
      address: "Road 11, Banani, Dhaka",
      status: "shipped"
    });

    for (var d = 20; d >= 1; d--) {
      var count = randInt(3, 7);
      for (var c = 0; c < count; c++) addOrder(now - d * DAY - Math.random() * DAY, 2, Math.random() < 0.3 ? 2 : 1);
    }
    for (var t = 0; t < randInt(3, 5); t++) addOrder(now - Math.random() * 5 * 3600e3, 2, 1);
    for (var sp = 0; sp < randInt(12, 16); sp++) addOrder(now - Math.random() * 55 * 60e3, 3, Math.random() < 0.45 ? 2 : 1);

    var reviews = ((global.BRUTBOX_CATALOG && global.BRUTBOX_CATALOG.reviews) || []).map(function (r) {
      return Object.assign({}, r);
    });
    var coupons = (global.BBLogic && global.BBLogic.DEFAULT_COUPONS)
      ? global.BBLogic.DEFAULT_COUPONS.map(function (c) { return Object.assign({}, c); })
      : [];

    return { products: products, orders: orders, reviews: reviews, coupons: coupons };
  }

  function seedData() {
    if (read(KEY.seed, null) === SEED_VERSION) return;
    var keptProducts = read(KEY.products, []).filter(function (p) { return p.source === "admin"; });
    var keptOrders = read(KEY.orders, []).filter(function (o) { return o.source !== "seed"; });
    var keptReviews = read(KEY.reviews, []).filter(function (r) { return r.source === "customer"; });
    var keptCoupons = read(KEY.coupons, null);

    var fresh = buildSample();
    write(KEY.products, fresh.products.concat(keptProducts));
    write(KEY.orders, keptOrders.concat(fresh.orders));
    write(KEY.reviews, keptReviews.concat(fresh.reviews));
    if (!Array.isArray(keptCoupons) || !keptCoupons.length) write(KEY.coupons, fresh.coupons);
    if (!read(KEY.users, null)) write(KEY.users, []);
    if (!read(KEY.wishlist, null)) write(KEY.wishlist, []);
    if (!read(KEY.recent, null)) write(KEY.recent, []);
    if (!read(KEY.sessions, null)) write(KEY.sessions, []);
    if (!read(KEY.activity, null)) write(KEY.activity, []);
    write(KEY.seed, SEED_VERSION);
  }

  function getProducts(includeHidden) {
    seedData();
    var list = read(KEY.products, []);
    return includeHidden ? list : list.filter(function (p) { return !p.hidden; });
  }

  function getProductById(id) {
    seedData();
    var clean = String(id || "").trim();
    var legacy = (global.BRUTBOX_CATALOG && global.BRUTBOX_CATALOG.legacyIds) || {};
    var mapped = legacy[clean] || clean;
    var list = read(KEY.products, []);
    return list.filter(function (p) { return p.id === mapped; })[0] || null;
  }

  function getCoupons() {
    seedData();
    return read(KEY.coupons, []);
  }

  function getReviews(productId, includeHidden) {
    seedData();
    var all = read(KEY.reviews, []);
    return all.filter(function (r) {
      if (productId && r.productId !== productId) return false;
      if (!includeHidden && r.status !== "approved") return false;
      return true;
    });
  }

  function importStorefrontOrders() {
    var last = read(KEY.lastOrder, null);
    if (!last || !last.id) return;
    var orders = read(KEY.orders, []);
    if (orders.some(function (o) { return o.id === last.id; })) return;
    var base = global.BBOrders ? global.BBOrders.ensure(last) : last;
    orders.unshift(base);
    write(KEY.orders, orders.slice(0, 500));
  }

  function logActivity(type, message) {
    var log = read(KEY.activity, []);
    log.unshift({ type: type, message: message, at: new Date().toISOString() });
    write(KEY.activity, log.slice(0, 300));
  }

  global.Brutbox = {
    KEY: KEY,
    CONFIG: CONFIG,
    CATEGORIES: CATEGORIES,
    COLOR_HEX: COLOR_HEX,
    productImages: productImages,
    read: read,
    write: write,
    money: money,
    esc: esc,
    categoryName: categoryName,
    totalStock: totalStock,
    seedData: seedData,
    getProducts: getProducts,
    getProductById: getProductById,
    getCoupons: getCoupons,
    getReviews: getReviews,
    importStorefrontOrders: importStorefrontOrders,
    logActivity: logActivity
  };
})(window);
