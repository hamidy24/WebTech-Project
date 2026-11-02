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
  var SEED_VERSION = "admin-v3";

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

  /* ---------- Sample data: realistic stock, demand and sales ----------
     Stock is "units still on the shelf" after the sample sales, so
     selling a variant reduces the number that remains. Each browser
     gets slightly different numbers, so the demo never looks identical. */
  var RANDOM = Math.random;
  function randInt(min, max) { return Math.floor(RANDOM() * (max - min + 1)) + min; }
  function pick(list) { return list[Math.floor(RANDOM() * list.length)]; }

  // Demand weights: how often each product is bought in the sample sales
  var SAMPLE_PRODUCTS = [
    { id: "p-1001", name: "Cotton Trunk", category: "underwear", price: 1290, colors: ["Black", "Navy", "Grey"], hue: 215, weight: 4.0, created: "2026-08-01", stock: [220, 480] },
    { id: "p-1002", name: "Modal Boxer Brief", category: "underwear", price: 1490, colors: ["White", "Black"], hue: 210, weight: 3.0, created: "2026-08-10", stock: [90, 260] },
    { id: "p-2001", name: "Burgundy Silk Bow Tie", category: "bow-ties", price: 1850, colors: ["Burgundy", "Navy"], hue: 350, weight: 1.6, created: "2026-08-05", stock: [40, 140] },
    { id: "p-3001", name: "Emerald Pocket Square", category: "pocket-squares", price: 950, colors: ["Emerald", "Gold"], hue: 160, weight: 2.2, created: "2026-08-03", stock: [120, 300] },
    { id: "p-4001", name: "Merino Crew Socks", category: "socks", price: 720, colors: ["Grey", "Black", "Navy"], hue: 210, weight: 3.4, created: "2026-08-07", stock: [180, 420] },
    { id: "p-6001", name: "Full-Grain Bifold Wallet", category: "wallets", price: 2450, colors: ["Black", "Tan"], hue: 30, weight: 1.4, created: "2026-08-20", stock: [35, 150] }
  ];

  function buildSample() {
    var products = SAMPLE_PRODUCTS.map(function (d) {
      var sizes = CATEGORIES.filter(function (c) { return c.slug === d.category; })[0].sizes;
      var shots = ["Front", "Back", "Detail"].map(function (view, k) {
        return placeholder(d.name + " \u00B7 " + view, d.hue + k * 18);
      });
      return { id: d.id, name: d.name, category: d.category, price: d.price, colors: d.colors.slice(),
        sizes: sizes.slice(), stock: {}, image: shots[0], images: shots, hidden: false,
        source: "seed", createdAt: d.created, _weight: d.weight, _range: d.stock };
    });

    var totalWeight = products.reduce(function (s, p) { return s + p._weight; }, 0);
    var sold = {};   // productId -> color -> size -> units sold
    var orders = [], n = 0, now = Date.now(), DAY = 864e5;

    function chooseProduct() {
      var r = RANDOM() * totalWeight;
      for (var k = 0; k < products.length; k++) { r -= products[k]._weight; if (r <= 0) return products[k]; }
      return products[0];
    }
    function addOrder(atMs, qtyMax, lines) {
      var items = [], subtotal = 0;
      for (var l = 0; l < lines; l++) {
        var p = chooseProduct(), color = pick(p.colors), size = pick(p.sizes);
        var qty = randInt(1, qtyMax);
        sold[p.id] = sold[p.id] || {};
        sold[p.id][color] = sold[p.id][color] || {};
        sold[p.id][color][size] = (sold[p.id][color][size] || 0) + qty;
        items.push({ productId: p.id, name: p.name, size: size, color: color, qty: qty, price: p.price });
        subtotal += qty * p.price;
      }
      orders.push({
        id: "BB-S" + (++n).toString(36).toUpperCase(), at: new Date(atMs).toISOString(),
        customer: "Sample customer", method: pick(["COD", "bKash", "Nagad", "CARD"]),
        items: items, total: subtotal + (subtotal >= 3000 ? 0 : 70),
        status: "DEMO \u00B7 NOT PAID", source: "seed"
      });
    }

    // 21 days of normal trade: 6 to 14 orders a day
    for (var d = 20; d >= 1; d--) {
      var count = randInt(6, 14);
      for (var c = 0; c < count; c++) {
        addOrder(now - d * DAY - RANDOM() * DAY, 2, RANDOM() < 0.25 ? 2 : 1);
      }
    }
    // Today: normal morning trade plus a real-looking sudden spike in the last hour
    for (var t = 0; t < randInt(4, 7); t++) addOrder(now - RANDOM() * 5 * 3600e3, 2, 1);
    for (var sp = 0; sp < randInt(24, 30); sp++) addOrder(now - RANDOM() * 55 * 60e3, 3, RANDOM() < 0.5 ? 2 : 1);

    // Stock left on the shelf = units still available after the sales
    products.forEach(function (p) {
      p.colors.forEach(function (color) {
        p.stock[color] = {};
        p.sizes.forEach(function (size) {
          var remaining = RANDOM() < 0.12 ? randInt(0, 5) : randInt(p._range[0], p._range[1]);
          p.stock[color][size] = remaining;
        });
      });
    });
    // Make a few items visibly low or sold out so the alerts can be seen
    products.filter(function (p) { return p.id === "p-6001"; })[0].stock.Tan["Standard"] = 3;
    products.filter(function (p) { return p.id === "p-6001"; })[0].stock.Black["Standard"] = 2;
    products.filter(function (p) { return p.id === "p-2001"; })[0].stock.Navy["One Size"] = 0;

    products.forEach(function (p) { delete p._weight; delete p._range; });
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
    productImages: function (p) { return (p && p.images && p.images.length) ? p.images : (p && p.image ? [p.image] : []); },
    read: read, write: write, money: money, esc: esc, categoryName: categoryName,
    totalStock: totalStock, placeholder: placeholder, seedData: seedData,
    importStorefrontOrders: importStorefrontOrders, logActivity: logActivity
  };
})(window);
