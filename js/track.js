/* =====================================================================
   BRUTBOX & CO. — track.js
   Order tracking page: look up an order by order ID or tracking code,
   verify last 4 phone digits, and display the 6-step timeline.
   ===================================================================== */
(function () {
  "use strict";
  var form = document.getElementById("track-form");
  var result = document.getElementById("track-result");
  if (!form || !result || !window.BBOrders) return;
  if (window.Brutbox) window.Brutbox.seedData();

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
    var days = order.status === "out" ? 0 : order.status === "shipped" ? 1 : 3;
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
        "<div><strong>" + esc(s.label) + "</strong>" + (when ? "<small>" + esc(fmt(when.at)) + "</small>" : "<small class='muted'>Pending</small>") + "</div></li>";
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
          "<p>" + esc((BBOrders.STEPS[BBOrders.stepIndex(order.status)] || {}).desc || (cancelled ? "This order was cancelled and stock was restored." : "")) + "</p></div>" +
          "<div class='track-eta'><span>Estimated delivery</span><strong>" + esc(estimate(order)) + "</strong></div>" +
        "</header>" +
        "<dl class='track-facts'>" +
          "<div><dt>Tracking code</dt><dd class='num'>" + esc(order.tracking) + "</dd></div>" +
          "<div><dt>Assigned courier</dt><dd>" + esc(order.courier || "Awaiting dispatch") + "</dd></div>" +
          "<div><dt>Items</dt><dd class='num'>" + (order.items || []).reduce(function (s, i) { return s + Number(i.qty || 0); }, 0) + "</dd></div>" +
          "<div><dt>Order total</dt><dd class='num'>" + money(order.totals ? order.totals.total : order.total) + "</dd></div>" +
        "</dl>" +
        progress(order) +
        "<div class='track-history'><h3>Delivery activity</h3><ul>" + events + "</ul></div>" +
        "<div class='track-foot'><a class='btn btn-ghost btn-sm' href='receipt.html?order=" + encodeURIComponent(order.id) + "'>View printable receipt</a></div>" +
      "</article>";
  }

  function message(text, type) {
    result.innerHTML = "<div class='track-alert is-" + (type || "error") + "' role='alert'>" + esc(text) + "</div>";
  }

  function run(q, phone) {
    var out = BBOrders.lookup(q, phone);
    if (out.error === "empty") return message("Enter your order number or tracking code.");
    if (out.error === "notfound") return message("No order matched that number in this browser. Double-check your receipt or try demo order BB-1042 (phone 3344).");
    if (out.error === "phone") return message("The last 4 digits of the phone number did not match this order.");
    render(out.order);
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var q = document.getElementById("track-query").value;
    var phone = document.getElementById("track-phone").value;
    history.replaceState({}, "", "track.html?q=" + encodeURIComponent(q.trim()));
    run(q, phone);
  });

  var params = new URLSearchParams(location.search);
  var preset = params.get("q");
  var presetPhone = params.get("p");
  if (preset) document.getElementById("track-query").value = preset;
  if (presetPhone) document.getElementById("track-phone").value = presetPhone;
  if (preset && presetPhone) run(preset, presetPhone);
})();
