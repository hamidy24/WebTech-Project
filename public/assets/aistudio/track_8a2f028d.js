/* =====================================================================
   BRUTBOX & CO. — track.js
   Order tracking page: look up an order by number or tracking code,
   confirm with the phone number, then show the delivery progress.
   ===================================================================== */
(function () {
  "use strict";
  var form = document.getElementById("track-form");
  var result = document.getElementById("track-result");
  if (!form || !result || !window.BBOrders) return;

  var esc = function (s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };
  var fmt = function (iso) {
    try { return new Date(iso).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }); }
    catch (e) { return iso; }
  };
  var money = function (n) { return "৳" + Math.round(Number(n) || 0).toLocaleString("en-US"); };

  function estimate(order) {
    if (order.status === "delivered") return "Delivered";
    if (order.status === BBOrders.CANCELLED) return "Cancelled";
    var created = new Date(order.createdAt || order.at);
    var days = order.status === "out" ? 0 : order.status === "shipped" ? 2 : 3;
    var d = new Date(created.getTime() + (days + 1) * 864e5);
    return d.toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short" });
  }

  function progress(order) {
    var cancelled = order.status === BBOrders.CANCELLED;
    var current = BBOrders.stepIndex(order.status);
    return "<ol class='track-steps" + (cancelled ? " is-cancelled" : "") + "'>" + BBOrders.STEPS.map(function (s, i) {
      var cls = cancelled ? "" : i < current ? "is-done" : i === current ? "is-current" : "";
      var when = (order.events || []).filter(function (e) { return e.status === s.key; })[0];
      return "<li class='" + cls + "'><span class='track-dot' aria-hidden='true'>" + (cls === "is-done" ? "&#10003;" : i + 1) + "</span>" +
        "<div><strong>" + esc(s.label) + "</strong>" + (when ? "<small>" + esc(fmt(when.at)) + "</small>" : "<small class='muted'>Waiting</small>") + "</div></li>";
    }).join("") + "</ol>";
  }

  function render(order) {
    var label = BBOrders.stepLabel(order.status);
    var cancelled = order.status === BBOrders.CANCELLED;
    var events = (order.events || []).slice().reverse().map(function (e) {
      return "<li><time>" + esc(fmt(e.at)) + "</time><span>" + esc(e.note || label) + "</span></li>";
    }).join("");
    result.innerHTML =
      "<article class='track-card panel-card" + (cancelled ? " is-cancelled" : "") + "'>" +
        "<header class='track-head'>" +
          "<div><span class='eyebrow dark'>Order " + esc(order.id) + "</span>" +
          "<h2>" + esc(label) + "</h2>" +
          "<p>" + esc((BBOrders.STEPS[BBOrders.stepIndex(order.status)] || {}).desc || (cancelled ? "This order was cancelled." : "")) + "</p></div>" +
          "<div class='track-eta'><span>Estimated delivery</span><strong>" + esc(estimate(order)) + "</strong></div>" +
        "</header>" +
        "<dl class='track-facts'>" +
          "<div><dt>Tracking code</dt><dd>" + esc(order.tracking) + "</dd></div>" +
          "<div><dt>Courier</dt><dd>" + esc(order.courier || "Not assigned yet") + "</dd></div>" +
          "<div><dt>Items</dt><dd>" + (order.items || []).reduce(function (s, i) { return s + i.qty; }, 0) + "</dd></div>" +
          "<div><dt>Total</dt><dd>" + money(order.totals ? order.totals.total : order.total) + "</dd></div>" +
        "</dl>" +
        progress(order) +
        "<div class='track-history'><h3>Delivery history</h3><ul>" + events + "</ul></div>" +
      "</article>";
  }

  function message(text, type) {
    result.innerHTML = "<div class='track-alert is-" + (type || "error") + "' role='alert'>" + esc(text) + "</div>";
  }

  function run(q, phone) {
    var out = BBOrders.lookup(q, phone);
    if (out.error === "empty") return message("Enter your order number or tracking code.");
    if (out.error === "notfound") return message("We couldn't find an order with that number on this device. Check the number on your receipt, or contact the store.");
    if (out.error === "phone") return message("The phone number doesn't match this order. Enter the last four digits of the mobile number used at checkout.");
    render(out.order);
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var q = document.getElementById("track-query").value;
    var phone = document.getElementById("track-phone").value;
    history.replaceState({}, "", "track.html?q=" + encodeURIComponent(q.trim()));
    run(q, phone);
  });

  // Open directly from a link, e.g. track.html?q=BB-XXXX
  var preset = new URLSearchParams(location.search).get("q");
  if (preset) document.getElementById("track-query").value = preset;
})();
