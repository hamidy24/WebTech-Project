/* =====================================================================
   BRUTBOX & CO. — store-logic.js
   Pure, testable business logic shared by storefront, checkout,
   accounts, admin coupons, and Node.js unit tests (UMD export).
   ===================================================================== */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.BBLogic = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var DELIVERY_FEE = 120;
  var FREE_DELIVERY_OVER = 3000;
  var VAT_RATE = 0.05;
  var LOW_STOCK_THRESHOLD = 5;
  var STORAGE_QUOTA_BYTES = 5 * 1024 * 1024; // ~5 MB standard browser localStorage quota

  var DEFAULT_COUPONS = [
    {
      code: "WELCOME10",
      type: "percent",
      value: 10,
      minSpend: 1000,
      enabled: true,
      description: "10% off orders over ৳1,000"
    },
    {
      code: "BRUT20",
      type: "fixed",
      value: 500,
      minSpend: 2500,
      enabled: true,
      description: "৳500 off orders over ৳2,500"
    },
    {
      code: "FREESHIP",
      type: "delivery",
      value: 120,
      minSpend: 500,
      enabled: true,
      description: "৳120 off delivery on orders over ৳500"
    }
  ];

  var BD_DISTRICTS = [
    "Dhaka", "Chattogram", "Sylhet", "Rajshahi", "Khulna", "Barishal",
    "Rangpur", "Mymensingh", "Gazipur", "Narayanganj", "Cumilla", "Bogura",
    "Cox's Bazar", "Jashore", "Savars / Keraniganj"
  ];

  function money(n) {
    var val = Math.round(Number(n) || 0);
    return "৳" + val.toLocaleString("en-US");
  }

  function normalizeBDPhone(phone) {
    var raw = String(phone || "").replace(/[\s\-()]/g, "");
    if (/^\+8801[3-9]\d{8}$/.test(raw)) return raw;
    if (/^8801[3-9]\d{8}$/.test(raw)) return "+" + raw;
    if (/^01[3-9]\d{8}$/.test(raw)) return raw;
    return raw;
  }

  function isValidBDPhone(phone) {
    var raw = String(phone || "").replace(/[\s\-()]/g, "");
    return /^(?:\+?88)?01[3-9]\d{8}$/.test(raw);
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(email || "").trim());
  }

  function evaluatePassword(pw) {
    var s = String(pw || "");
    var lenOk = s.length >= 8;
    var hasUpper = /[A-Z]/.test(s);
    var hasLower = /[a-z]/.test(s);
    var hasDigit = /\d/.test(s);
    var hasSymbol = /[^A-Za-z0-9]/.test(s);
    var checks = [lenOk, hasUpper && hasLower, hasDigit, hasSymbol].filter(Boolean).length;
    var label = !s.length ? "Empty" : !lenOk ? "Too short" : checks <= 1 ? "Weak" : checks === 2 ? "Fair" : checks === 3 ? "Good" : "Strong";
    return {
      valid: lenOk && (hasDigit || hasUpper || hasSymbol),
      lengthOk: lenOk,
      score: lenOk ? checks : 0,
      label: label
    };
  }

  function normalizeCoupons(list) {
    if (!Array.isArray(list) || !list.length) {
      return DEFAULT_COUPONS.map(function (c) { return Object.assign({}, c); });
    }
    return list.map(function (c) {
      return {
        code: String(c.code || "").trim().toUpperCase(),
        type: c.type === "percent" || c.type === "delivery" ? c.type : "fixed",
        value: Math.max(0, Number(c.value) || 0),
        minSpend: Math.max(0, Number(c.minSpend) || 0),
        enabled: c.enabled !== false,
        description: String(c.description || "")
      };
    }).filter(function (c) { return !!c.code; });
  }

  function validateCoupon(code, subtotal, couponsList) {
    var clean = String(code || "").trim().toUpperCase();
    if (!clean) return { ok: false, error: "Enter a coupon code first." };
    var pool = normalizeCoupons(couponsList);
    var found = null;
    for (var i = 0; i < pool.length; i++) {
      if (pool[i].code === clean) { found = pool[i]; break; }
    }
    if (!found) return { ok: false, error: "Coupon \"" + clean + "\" is not valid." };
    if (!found.enabled) return { ok: false, error: "Coupon \"" + clean + "\" is currently disabled." };
    var sub = Math.max(0, Number(subtotal) || 0);
    if (sub < found.minSpend) {
      return {
        ok: false,
        error: "Add " + money(found.minSpend - sub) + " more to unlock " + found.code + " (minimum " + money(found.minSpend) + ")."
      };
    }
    return { ok: true, coupon: found };
  }

  function computeCartTotals(cart, couponObj) {
    var items = Array.isArray(cart) ? cart : [];
    var units = 0;
    var subtotal = 0;
    for (var i = 0; i < items.length; i++) {
      var qty = Math.max(0, Math.floor(Number(items[i].qty) || 0));
      var price = Math.max(0, Number(items[i].price) || 0);
      units += qty;
      subtotal += qty * price;
    }

    var appliedCoupon = null;
    var discount = 0;
    var deliveryDiscount = 0;

    if (couponObj && couponObj.enabled !== false && subtotal > 0 && subtotal >= (Number(couponObj.minSpend) || 0)) {
      appliedCoupon = couponObj;
      if (couponObj.type === "percent") {
        discount = Math.round(subtotal * (Number(couponObj.value) || 0) / 100);
      } else if (couponObj.type === "fixed") {
        discount = Math.min(subtotal, Math.round(Number(couponObj.value) || 0));
      } else if (couponObj.type === "delivery") {
        deliveryDiscount = Math.round(Number(couponObj.value) || 0);
      }
    }

    var baseDelivery = subtotal === 0 ? 0 : (subtotal >= FREE_DELIVERY_OVER ? 0 : DELIVERY_FEE);
    var delivery = Math.max(0, baseDelivery - deliveryDiscount);
    var taxable = Math.max(0, subtotal - discount);
    var tax = Math.round(taxable * VAT_RATE);
    var total = taxable + delivery + tax;

    return {
      units: units,
      subtotal: subtotal,
      discount: discount,
      deliveryDiscount: Math.min(baseDelivery, deliveryDiscount),
      baseDelivery: baseDelivery,
      delivery: delivery,
      taxable: taxable,
      tax: tax,
      total: total,
      coupon: appliedCoupon
    };
  }

  function stockForVariant(product, color, size) {
    if (!product || !product.stock) return 0;
    var cMap = product.stock[color];
    if (!cMap) return 0;
    if (typeof cMap[size] === "number") return Math.max(0, cMap[size]);
    var keys = Object.keys(cMap);
    return keys.length ? Math.max(0, Number(cMap[keys[0]]) || 0) : 0;
  }

  function totalProductStock(product) {
    if (!product || !product.stock) return 0;
    var sum = 0;
    var colors = Object.keys(product.stock);
    for (var i = 0; i < colors.length; i++) {
      var sizes = product.stock[colors[i]] || {};
      var sk = Object.keys(sizes);
      for (var j = 0; j < sk.length; j++) {
        sum += Math.max(0, Number(sizes[sk[j]]) || 0);
      }
    }
    return sum;
  }

  function stockStatusLabel(units) {
    var u = Math.max(0, Math.floor(Number(units) || 0));
    if (u === 0) return { state: "out", text: "Sold out" };
    if (u <= LOW_STOCK_THRESHOLD) return { state: "low", text: "Only " + u + " left" };
    return { state: "ok", text: "In stock (" + u + " available)" };
  }

  function filterAndSortProducts(list, opts) {
    var items = Array.isArray(list) ? list.slice() : [];
    var o = opts || {};
    var q = String(o.query || "").trim().toLowerCase();
    var cat = String(o.category || "all");
    var sort = String(o.sort || "featured");

    var filtered = items.filter(function (p) {
      if (p.hidden) return false;
      if (cat && cat !== "all" && p.category !== cat) return false;
      if (q) {
        var hay = [p.name, p.description, p.category].join(" ").toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    });

    if (sort === "price-asc") {
      filtered.sort(function (a, b) { return Number(a.price) - Number(b.price); });
    } else if (sort === "price-desc") {
      filtered.sort(function (a, b) { return Number(b.price) - Number(a.price); });
    } else if (sort === "newest") {
      filtered.sort(function (a, b) { return String(b.createdAt || "").localeCompare(String(a.createdAt || "")); });
    } else if (sort === "top-rated") {
      filtered.sort(function (a, b) {
        var diff = (Number(b.rating) || 0) - (Number(a.rating) || 0);
        return diff !== 0 ? diff : (Number(b.reviewCount) || 0) - (Number(a.reviewCount) || 0);
      });
    }
    return filtered;
  }

  function deductStockFromProducts(productsList, cartItems) {
    var updated = (productsList || []).map(function (p) {
      var copy = Object.assign({}, p, { stock: {} });
      Object.keys(p.stock || {}).forEach(function (c) {
        copy.stock[c] = Object.assign({}, p.stock[c]);
      });
      return copy;
    });
    (cartItems || []).forEach(function (item) {
      for (var i = 0; i < updated.length; i++) {
        var p = updated[i];
        if (p.id === item.id || p.id === item.productId || p.name === item.name) {
          if (p.stock && p.stock[item.color] && typeof p.stock[item.color][item.size] === "number") {
            p.stock[item.color][item.size] = Math.max(0, p.stock[item.color][item.size] - (Number(item.qty) || 0));
          }
          break;
        }
      }
    });
    return updated;
  }

  function restoreStockToProducts(productsList, orderItems) {
    var updated = (productsList || []).map(function (p) {
      var copy = Object.assign({}, p, { stock: {} });
      Object.keys(p.stock || {}).forEach(function (c) {
        copy.stock[c] = Object.assign({}, p.stock[c]);
      });
      return copy;
    });
    (orderItems || []).forEach(function (item) {
      for (var i = 0; i < updated.length; i++) {
        var p = updated[i];
        if (p.id === item.id || p.id === item.productId || p.name === item.name) {
          if (p.stock && p.stock[item.color] && typeof p.stock[item.color][item.size] === "number") {
            p.stock[item.color][item.size] += Math.max(0, Number(item.qty) || 0);
          }
          break;
        }
      }
    });
    return updated;
  }

  function estimateStorageUsage(storageObj) {
    var store = storageObj || (typeof localStorage !== "undefined" ? localStorage : null);
    if (!store) return { usedBytes: 0, quotaBytes: STORAGE_QUOTA_BYTES, percent: 0, nearFull: false };
    var bytes = 0;
    try {
      for (var i = 0; i < store.length; i++) {
        var k = store.key(i);
        var v = store.getItem(k) || "";
        bytes += (k.length + v.length) * 2; // UTF-16 code units in Web Storage
      }
    } catch (e) { /* ignore */ }
    var pct = Math.min(100, Math.round((bytes / STORAGE_QUOTA_BYTES) * 100));
    return {
      usedBytes: bytes,
      quotaBytes: STORAGE_QUOTA_BYTES,
      percent: pct,
      nearFull: pct >= 75
    };
  }

  return {
    DELIVERY_FEE: DELIVERY_FEE,
    FREE_DELIVERY_OVER: FREE_DELIVERY_OVER,
    VAT_RATE: VAT_RATE,
    LOW_STOCK_THRESHOLD: LOW_STOCK_THRESHOLD,
    DEFAULT_COUPONS: DEFAULT_COUPONS,
    BD_DISTRICTS: BD_DISTRICTS,
    money: money,
    normalizeBDPhone: normalizeBDPhone,
    isValidBDPhone: isValidBDPhone,
    isValidEmail: isValidEmail,
    evaluatePassword: evaluatePassword,
    normalizeCoupons: normalizeCoupons,
    validateCoupon: validateCoupon,
    computeCartTotals: computeCartTotals,
    stockForVariant: stockForVariant,
    totalProductStock: totalProductStock,
    stockStatusLabel: stockStatusLabel,
    filterAndSortProducts: filterAndSortProducts,
    deductStockFromProducts: deductStockFromProducts,
    restoreStockToProducts: restoreStockToProducts,
    estimateStorageUsage: estimateStorageUsage
  };
});
