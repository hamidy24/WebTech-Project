/* =====================================================================
   BRUTBOX & CO. — admin-core.js
   Shared data layer used by the storefront AND the admin panel.
   Everything is stored in this browser's localStorage (no server).
   ===================================================================== */
(function (global) {
  "use strict";

  var KEY = {
    products: "bb_products",
    orders: "bb_orders",
    sessions: "bb_admin_sessions",
    activity: "bb_activity",
    lastOrder: "brutbox_last_order",   // written by checkout (main.js)
    seed: "bb_seed_version"
  };
  var SEED_VERSION = "admin-v6";

  var CONFIG = {
    maxAdmins: 3,             // concurrent admin sessions allowed
    sessionTtlMs: 90 * 1000,  // a session expires if no heartbeat for 90 s
    heartbeatMs: 20 * 1000,   // admin page pings every 20 s
    spikeMultiple: 2,         // today >= 2x the 7-day average = spike
    spikeMinRevenue: 1000,    // ignore spikes below this (BDT)
    lowStock: 5               // "Only N left" threshold
  };

  var CATEGORIES = (window.BRUTBOX_CATALOG && window.BRUTBOX_CATALOG.categories || []).map(function (c) {
    return { slug: c.slug, name: c.name, sizes: c.sizes.slice(), image: c.image };
  });

  var COLOR_HEX = {
    "Obsidian Black": "#111111", "Royal Navy": "#1f2d4d", "Classic Ivory": "#f2efe6",
    "Crimson Burgundy": "#6d1f2b", "Cognac Tan": "#9a6a3a", "Forest Emerald": "#1e6b52",
    "Champagne Silk": "#e8d8b5", "Charcoal Slate": "#4a4f57", "Cobalt Sapphire": "#1f4fa0",
    "Imperial Gold": "#c89c3a", "Plum Aubergine": "#5b2a52", "Espresso Brown": "#3b2a1f",
    "Heather Grey": "#9aa0a6", "Olive Moss": "#6b6b3a", "Terracotta Rust": "#b5532f",
    "Titanium Silver": "#a7adb3", "Black": "#111111", "Navy": "#1f2d4d", "Grey": "#7c8087",
    "White": "#f2f2f2", "Burgundy": "#6d1f2b", "Gold": "#c89c3a", "Emerald": "#1e6b52", "Tan": "#9a6a3a"
  };

  function read(k, fallback) {
    try { var r = localStorage.getItem(k); return r === null ? fallback : JSON.parse(r); }
    catch (e) { return fallback; }
  }
  function write(k, v) {
    try { localStorage.setItem(k, JSON.stringify(v)); return true; }
    catch (e) { return false; } // quota exceeded (large photos)
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
      return sum + Object.keys(stock[color]).reduce(function (s, size) { return s + Number(stock[color][size] || 0); }, 0);
    }, 0);
  }
  function placeholder(label, hue) {
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(' + hue + ',45%,38%)"/><stop offset="1" stop-color="#0b1220"/></linearGradient></defs><rect width="1000" height="1000" fill="url(#g)"/><text x="500" y="520" font-family="Georgia,serif" font-size="64" fill="#f0d08a" text-anchor="middle">' + esc(label) + "</text></svg>";
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }
  // Small seeded random generator so sample data is the same every time
  function prng(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  /* ---------- Sample data from the Brutbox & Co. catalogue ----------
     Products, colours, sizes, prices and stock come from the catalogue
     file. Sample orders are generated over those products so the reports
     and alerts have real-looking history. */
  var RANDOM = Math.random;
  function randInt(min, max) { return Math.floor(RANDOM() * (max - min + 1)) + min; }
  function pick(list) { return list[Math.floor(RANDOM() * list.length)]; }

  function buildSample() {
    var catalog = (window.BRUTBOX_CATALOG && window.BRUTBOX_CATALOG.products) || [];
    var products = catalog.map(function (d) {
      var stock = {};
      Object.keys(d.stock).forEach(function (color) {
        stock[color] = {};
        Object.keys(d.stock[color]).forEach(function (size) { stock[color][size] = d.stock[color][size]; });
      });
      return { id: d.id, name: d.name, category: d.category, price: d.price, colors: d.colors.slice(),
        sizes: d.sizes.slice(), stock: stock, image: d.image, images: d.images.slice(), photoCount: d.photoCount || 0, hidden: false,
        source: "seed", createdAt: d.createdAt, badge: d.badge || null };
    });
    // A few variants are set low on purpose so the low-stock alert can be seen
    function setAll(product, qty) {
      product.colors.forEach(function (c) { product.sizes.forEach(function (z) { product.stock[c][z] = qty; }); });
    }
    var low = products.filter(function (p) { return p.id === "p-wl-03"; })[0];
    if (low) setAll(low, 1);          // total 3 units: shows "Only 3 left"
    var soldOut = products.filter(function (p) { return p.id === "p-bt-02"; })[0];
    if (soldOut) setAll(soldOut, 0);  // shows "Sold out"

    var orders = [], n = 0, now = Date.now(), DAY = 864e5;
    function addOrder(atMs, qtyMax, lines) {
      var items = [], subtotal = 0;
      for (var l = 0; l < lines; l++) {
        var p = pick(products), color = pick(p.colors), size = pick(p.sizes);
        var qty = randInt(1, qtyMax);
        items.push({ productId: p.id, name: p.name, size: size, color: color, qty: qty, price: p.price });
        subtotal += qty * p.price;
      }
      var order = {
        id: "BB-S" + (++n).toString(36).toUpperCase(), at: new Date(atMs).toISOString(),
        customer: "Sample customer", phone: "01" + String(randInt(300000000, 999999999)),
        method: pick(["COD", "bKash", "Nagad", "CARD"]),
        items: items, totals: { subtotal: subtotal, total: subtotal + (subtotal >= 3000 ? 0 : 120) },
        total: subtotal + (subtotal >= 3000 ? 0 : 120), paymentStatus: "DEMO \u00B7 NOT PAID", source: "seed"
      };
      var ageDays = (now - atMs) / DAY;
      var st = ageDays > 3 ? "delivered" : ageDays > 1 ? pick(["delivered", "out", "shipped"]) : pick(["placed", "confirmed", "packed", "shipped", "out"]);
      if (window.BBOrders) order = BBOrders.sampleHistory(BBOrders.ensure(order), st, atMs);
      orders.push(order);
    }
    // 21 days of normal trade, placed on full 24-hour windows
    for (var d = 20; d >= 1; d--) {
      var count = randInt(4, 10);
      for (var c = 0; c < count; c++) addOrder(now - d * DAY - RANDOM() * DAY, 2, RANDOM() < 0.25 ? 2 : 1);
    }
    // Today: normal morning trade plus a burst in the last hour
    for (var t = 0; t < randInt(3, 6); t++) addOrder(now - RANDOM() * 5 * 3600e3, 2, 1);
    for (var sp = 0; sp < randInt(16, 22); sp++) addOrder(now - RANDOM() * 55 * 60e3, 3, RANDOM() < 0.5 ? 2 : 1);
    return { products: products, orders: orders };
  }

  function seedData() {
    if (read(KEY.seed, null) === SEED_VERSION) return;
    // Keep anything the admin uploaded and any real storefront orders;
    // replace only the sample products and sample orders.
    var kept = read(KEY.products, []).filter(function (p) { return p.source === "admin"; });
    var keptOrders = read(KEY.orders, []).filter(function (o) { return o.source !== "seed"; });
    var fresh = buildSample();
    write(KEY.products, fresh.products.concat(kept));
    write(KEY.orders, fresh.orders.concat(keptOrders));
    if (!read(KEY.sessions, null)) write(KEY.sessions, []);
    if (!read(KEY.activity, null)) write(KEY.activity, []);
    write(KEY.seed, SEED_VERSION);
  }

  /* Pull orders placed through the storefront checkout into the order list */
  function importStorefrontOrders() {
    var last = read(KEY.lastOrder, null);
    if (!last || !last.id) return;
    var orders = read(KEY.orders, []);
    if (orders.some(function (o) { return o.id === last.id; })) return;
    var products = read(KEY.products, []);
    var base = window.BBOrders ? BBOrders.ensure(last) : last;
    orders.push({
      id: last.id, at: last.at, customer: last.customer || "Storefront customer", method: last.method,
      phone: last.phone || "", tracking: base.tracking, status: base.status, courier: base.courier,
      events: base.events, createdAt: base.createdAt,
      items: (last.items || []).map(function (i) {
        var match = products.filter(function (p) { return p.name === i.name; })[0];
        return { productId: match ? match.id : "", name: i.name, size: i.size, color: i.color, qty: i.qty, price: i.price };
      }),
      total: last.totals ? last.totals.total : 0, status: base.status, paymentStatus: last.paymentStatus || "DEMO", source: "storefront"
    });
    write(KEY.orders, orders);
  }

  function logActivity(type, message) {
    var log = read(KEY.activity, []);
    log.unshift({ type: type, message: message, at: new Date().toISOString() });
    write(KEY.activity, log.slice(0, 300));
  }

  global.Brutbox = {
    KEY: KEY, CONFIG: CONFIG, CATEGORIES: CATEGORIES, COLOR_HEX: COLOR_HEX,
    productImages: function (p) { return (p && p.images && p.images.length) ? p.images : (p && p.image ? [p.image] : []); },
    read: read, write: write, money: money, esc: esc, categoryName: categoryName,
    totalStock: totalStock, placeholder: placeholder, seedData: seedData,
    importStorefrontOrders: importStorefrontOrders, logActivity: logActivity
  };
})(window);
