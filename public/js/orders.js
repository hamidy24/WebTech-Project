/* =====================================================================
   BRUTBOX & CO. — orders.js
   Shared order model for checkout, order tracking, account history,
   and the admin panel. Stored in localStorage key "bb_orders".
   ===================================================================== */
(function (global) {
  "use strict";

  var KEY = "bb_orders";
  var STEPS = [
    { key: "placed",    label: "Order placed",     desc: "We have received your order." },
    { key: "confirmed", label: "Confirmed",        desc: "Your order and payment details are confirmed." },
    { key: "packed",    label: "Packed",           desc: "Your items are packed and quality checked." },
    { key: "shipped",   label: "Shipped",          desc: "Your parcel has been handed to the courier." },
    { key: "out",       label: "Out for delivery", desc: "The courier is on the way to you." },
    { key: "delivered", label: "Delivered",        desc: "Delivered. Thank you for shopping with BRUTBOX & CO." }
  ];
  var COURIERS = ["Pathao Courier", "RedX", "Paperfly", "Sundarban Courier"];
  var CANCELLED = "cancelled";

  function read() {
    try { return JSON.parse(localStorage.getItem(KEY) || "[]"); }
    catch (e) { return []; }
  }
  function write(list) {
    try { localStorage.setItem(KEY, JSON.stringify(list)); return true; }
    catch (e) { return false; }
  }

  function stepIndex(status) {
    for (var i = 0; i < STEPS.length; i++) if (STEPS[i].key === status) return i;
    return -1;
  }
  function stepLabel(status) {
    if (status === CANCELLED) return "Cancelled";
    var s = STEPS[stepIndex(status)];
    return s ? s.label : status;
  }
  function trackingCode() {
    var chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789", out = "BBX";
    for (var i = 0; i < 9; i++) out += chars.charAt(Math.floor(Math.random() * chars.length));
    return out;
  }
  function event(status, at, note) {
    return { status: status, at: at, note: note || (STEPS[stepIndex(status)] || {}).desc || "" };
  }

  function ensure(order) {
    var o = Object.assign({}, order);
    o.tracking = o.tracking || trackingCode();
    o.status = o.status && (o.status === CANCELLED || stepIndex(o.status) > -1) ? o.status : "placed";
    o.courier = o.courier || null;
    o.createdAt = o.createdAt || o.at || new Date().toISOString();
    if (!o.events || !o.events.length) o.events = [event("placed", o.createdAt)];
    return o;
  }

  function create(order) { return ensure(order); }

  function save(order) {
    var savedOrder = ensure(order);
    var list = read().filter(function (x) { return x.id !== savedOrder.id; });
    list.unshift(savedOrder);
    write(list.slice(0, 500));
    return savedOrder;
  }

  function findById(id) {
    var clean = String(id || "").trim().toUpperCase();
    return read().filter(function (o) { return String(o.id || "").toUpperCase() === clean; })[0] || null;
  }

  function advance(order, status, opts) {
    opts = opts || {};
    if (order.status === CANCELLED) return order;
    var now = new Date().toISOString();
    order.status = status;
    if (status === "shipped") order.courier = opts.courier || order.courier || COURIERS[0];
    order.events = (order.events || []).concat([event(status, now, opts.note)]);
    return order;
  }

  function cancel(order) {
    if (order.status === CANCELLED || stepIndex(order.status) >= stepIndex("shipped")) return order;
    order.status = CANCELLED;
    order.events = (order.events || []).concat([event(CANCELLED, new Date().toISOString(), "Order cancelled. Items returned to stock.")]);
    return order;
  }

  function nextStatus(order) {
    if (order.status === CANCELLED) return null;
    var i = stepIndex(order.status);
    return i > -1 && i < STEPS.length - 1 ? STEPS[i + 1].key : null;
  }

  function lookup(query, phoneLast4) {
    var q = String(query || "").trim().toUpperCase();
    if (!q) return { error: "empty" };
    var order = read().filter(function (o) {
      return String(o.id || "").toUpperCase() === q || String(o.tracking || "").toUpperCase() === q;
    })[0];
    if (!order) return { error: "notfound" };
    var last4 = String(phoneLast4 || "").replace(/\D/g, "").slice(-4);
    var digits = String(order.phone || "").replace(/\D/g, "");
    if (last4.length !== 4 || digits.slice(-4) !== last4) return { error: "phone" };
    return { order: order };
  }

  function sampleHistory(order, status, createdMs) {
    var events = [], upto = stepIndex(status), t = createdMs;
    for (var i = 0; i <= upto; i++) {
      events.push(event(STEPS[i].key, new Date(t).toISOString()));
      t += (20 + Math.floor(Math.random() * 90)) * 60e3;
    }
    order.status = status;
    order.events = events;
    order.courier = upto >= stepIndex("shipped") ? COURIERS[Math.floor(Math.random() * COURIERS.length)] : null;
    return order;
  }

  global.BBOrders = {
    KEY: KEY, STEPS: STEPS, COURIERS: COURIERS, CANCELLED: CANCELLED,
    read: read, write: write, create: create, save: save, ensure: ensure,
    findById: findById, advance: advance, cancel: cancel, nextStatus: nextStatus,
    lookup: lookup, stepIndex: stepIndex, stepLabel: stepLabel,
    sampleHistory: sampleHistory, trackingCode: trackingCode
  };
})(window);
