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
  var SEED_VERSION = "admin-v1";

  var CONFIG = {
    maxAdmins: 3,             // concurrent admin sessions allowed
    sessionTtlMs: 90 * 1000,  // a session expires if no heartbeat for 90 s
    heartbeatMs: 20 * 1000,   // admin page pings every 20 s
    spikeMultiple: 2,         // today >= 2x the 7-day average = spike
    spikeMinRevenue: 1000,    // ignore spikes below this (BDT)
    lowStock: 5               // "Only N left" threshold
  };

  var CATEGORIES = [
    { slug: "underwear", name: "Underwear", sizes: ["S", "M", "L", "XL", "XXL"] },
    { slug: "bow-ties", name: "Bow Ties", sizes: ["One Size"] },
    { slug: "pocket-squares", name: "Pocket Squares", sizes: ["One Size"] },
    { slug: "socks", name: "Socks", sizes: ["One Size"] },
    { slug: "eyeglass-covers", name: "Eyeglass Covers", sizes: ["One Size"] },
    { slug: "wallets", name: "Wallets", sizes: ["Standard"] }
  ];

  var COLOR_HEX = {
    Black: "#111111", Navy: "#1f2d4d", Grey: "#7c8087", White: "#f2f2f2",
    Burgundy: "#6d1f2b", Gold: "#d4a24c", Emerald: "#1e6b52", Tan: "#b08968"
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

  /* ---------- Sample data (matches the storefront product list) ---------- */
  function mkProduct(id, name, cat, price, colors, qty, hue, createdAt) {
    var sizes = CATEGORIES.filter(function (c) { return c.slug === cat; })[0].sizes;
    var stock = {};
    colors.forEach(function (c) {
      stock[c] = {};
      sizes.forEach(function (s) { stock[c][s] = typeof qty === "function" ? qty(c, s) : qty; });
    });
    return {
      id: id, name: name, category: cat, price: price, colors: colors, sizes: sizes,
      stock: stock, image: placeholder(name, hue), hidden: false, source: "seed",
      createdAt: createdAt
    };
  }

  function seedProducts() {
    return [
      mkProduct("p-1001", "Cotton Trunk", "underwear", 1290, ["Black", "Navy", "Grey"], 12, 215, "2026-08-01"),
      mkProduct("p-1002", "Modal Boxer Brief", "underwear", 1490, ["White", "Black"], function (c, s) { return s === "XL" ? 0 : 4; }, 210, "2026-08-10"),
      mkProduct("p-2001", "Burgundy Silk Bow Tie", "bow-ties", 1850, ["Burgundy", "Navy"], function (c) { return c === "Navy" ? 0 : 2; }, 350, "2026-08-05"),
      mkProduct("p-3001", "Emerald Pocket Square", "pocket-squares", 950, ["Emerald", "Gold"], 15, 160, "2026-08-03"),
      mkProduct("p-4001", "Merino Crew Socks", "socks", 720, ["Grey", "Black", "Navy"], 20, 210, "2026-08-07"),
      mkProduct("p-6001", "Full-Grain Bifold Wallet", "wallets", 2450, ["Black", "Tan"], 9, 30, "2026-08-20")
    ];
  }

  function makeSampleOrders(products) {
    var rand = prng(42), orders = [], now = Date.now(), DAY = 864e5, n = 0;
    function addOrder(daysAgo, spread, extra) {
      var count = Math.floor(rand() * 4) + 1;
      for (var k = 0; k < count + (extra || 0); k++) {
        var p = products[Math.floor(rand() * products.length)];
        var size = p.sizes[0], color = p.colors[0];
        var qty = Math.floor(rand() * 2) + 1;
        var at = new Date(now - daysAgo * DAY - rand() * spread).toISOString();
        orders.push({
          id: "BB-S" + (++n).toString(36).toUpperCase(), at: at, customer: "Sample customer",
          method: ["COD", "bKash", "Nagad", "CARD"][Math.floor(rand() * 4)],
          items: [{ productId: p.id, name: p.name, size: size, color: color, qty: qty, price: p.price }],
          total: qty * p.price, status: "DEMO \u00B7 NOT PAID", source: "seed"
        });
      }
    }
    for (var d = 20; d >= 1; d--) addOrder(d, DAY, 0);
    // A sudden spike today, so the dashboard alert can be seen
    addOrder(0, 30 * 60e3, 0);
    for (var s = 0; s < 6; s++) {
      var p = products[0], at = new Date(now - rand() * 25 * 60e3).toISOString();
      orders.push({
        id: "BB-S" + (++n).toString(36).toUpperCase(), at: at, customer: "Sample customer", method: "bKash",
        items: [{ productId: p.id, name: p.name, size: p.sizes[0], color: p.colors[0], qty: 3, price: p.price }],
        total: 3 * p.price, status: "DEMO \u00B7 NOT PAID", source: "seed"
      });
    }
    return orders;
  }

  function seedData() {
    if (read(KEY.seed, null) === SEED_VERSION) return;
    var products = read(KEY.products, null) || seedProducts();
    write(KEY.products, products);
    if (!read(KEY.orders, null)) write(KEY.orders, makeSampleOrders(products));
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
    orders.push({
      id: last.id, at: last.at, customer: last.customer || "Storefront customer", method: last.method,
      items: (last.items || []).map(function (i) {
        var match = products.filter(function (p) { return p.name === i.name; })[0];
        return { productId: match ? match.id : "", name: i.name, size: i.size, color: i.color, qty: i.qty, price: i.price };
      }),
      total: last.totals ? last.totals.total : 0, status: last.status || "DEMO", source: "storefront"
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
    read: read, write: write, money: money, esc: esc, categoryName: categoryName,
    totalStock: totalStock, placeholder: placeholder, seedData: seedData,
    importStorefrontOrders: importStorefrontOrders, logActivity: logActivity
  };
})(window);
