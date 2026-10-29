/* =====================================================================
   BRUTBOX & CO. — main.js
   Browser-only behaviour. No backend. Data persists in localStorage.
   Each module runs only when its page elements exist.
   ===================================================================== */
(function () {
  "use strict";

  /* ---------- Storage keys & helpers ---------- */
  var KEY = {
    cart: "brutbox_cart",
    lastOrder: "brutbox_last_order",
    stock: "brutbox_stock",           // restock overrides: { "CB-BLK-M": 50 }
    activity: "brutbox_activity"      // admin-style log of restocks
  };

  function read(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (e) { return fallback; }
  }
  function write(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* storage full or blocked */ }
  }
  function money(n) { return "৳" + Number(n).toLocaleString("en-US"); }
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function toast(el, msg, type) {
    if (!el) return;
    el.className = "js-message js-message-" + (type || "error");
    el.textContent = msg;
    el.hidden = false;
  }
  function clearToast(el) { if (el) { el.hidden = true; el.textContent = ""; } }
  function createMessage(anchor) {
    var el = document.createElement("p");
    el.className = "js-message"; el.hidden = true; el.setAttribute("role", "status");
    anchor.parentNode.insertBefore(el, anchor.nextSibling);
    return el;
  }

  /* ---------- Sample data (mirrors the static HTML) ---------- */
  // Stock by product panel id -> color -> size -> units.
  // Any combination not listed defaults to DEFAULT_STOCK.
  var DEFAULT_STOCK = 10;
  var STOCK = {
    "p-001": { Black: { S: 6, M: 30, L: 12, XL: 4 }, Navy: { S: 8, M: 20, L: 0, XL: 9 } },
    "p-003": { Black: { "One Size": 3 }, Navy: { "One Size": 0 } }
  };
  var SAMPLE_CART = [
    { id: "p-001", name: "Cotton Boxer", size: "M", color: "Black", price: 450, qty: 2, tone: "tone-slate", cat: "UNDERWEAR" },
    { id: "p-003", name: "Silk Bow Tie", size: "One Size", color: "Black", price: 650, qty: 1, tone: "tone-rose", cat: "BOW TIES" }
  ];
  var FREE_DELIVERY_OVER = 3000;
  var DELIVERY_FEE = 70;

  function stockFor(id, color, size) {
    var p = STOCK[id];
    if (p && p[color] && typeof p[color][size] === "number") return p[color][size];
    return DEFAULT_STOCK;
  }
  function getCart() { return read(KEY.cart, null) || SAMPLE_CART.map(function (i) { return Object.assign({}, i); }); }
  function saveCart(cart) { write(KEY.cart, cart); }
  function cartTotals(cart) {
    var units = 0, subtotal = 0;
    cart.forEach(function (i) { units += i.qty; subtotal += i.qty * i.price; });
    var delivery = subtotal === 0 ? 0 : (subtotal >= FREE_DELIVERY_OVER ? 0 : DELIVERY_FEE);
    return { units: units, subtotal: subtotal, delivery: delivery, total: subtotal + delivery };
  }

  /* ---------- Header bag counter ---------- */
  function updateBagPill() {
    var pill = $(".cart-pill");
    if (!pill) return;
    var count = cartTotals(getCart()).units;
    var span = $("span", pill);
    if (span) span.textContent = String(count).padStart(2, "0");
    pill.setAttribute("aria-label", "View bag, " + count + " items");
  }

  /* ---------- Product details: stock-aware selection + add to bag ---------- */
  function initProductDetails() {
    $$(".detail-panel").forEach(function (panel) {
      var id = panel.id;
      var sizeInputs = $$('input[name="size-' + id + '"]', panel);
      var colorInputs = $$('input[name="color-' + id + '"]', panel);
      var qty = $(".qty-preview", panel);
      var priceEl = $(".detail-price", panel);
      var title = $("h1", panel);
      if (!sizeInputs.length || !colorInputs.length || !qty || !priceEl) return;

      var price = parseInt(priceEl.textContent.replace(/[^\d]/g, ""), 10) || 0;
      var name = title ? title.textContent.trim() : id;
      var colorName = function (inp) { return inp.parentNode.textContent.trim(); };
      var sizeName = function (inp) { return inp.parentNode.textContent.trim(); };

      // Message line for low-stock / sold-out status
      var status = document.createElement("p");
      status.className = "stock-status";
      var qtyLabel = $('label[for="' + qty.id + '"]', panel);
      if (qtyLabel) qtyLabel.parentNode.insertBefore(status, qtyLabel);

      // Add-to-bag button, placed in the actions row
      var actions = $(".detail-actions", panel);
      var addBtn = document.createElement("button");
      addBtn.type = "button";
      addBtn.className = "btn btn-dark add-to-bag";
      addBtn.textContent = "Add to bag";
      if (actions) actions.insertBefore(addBtn, actions.firstChild);
      var addMsg = actions ? createMessage(actions) : null;

      function selectedColor() { var c = colorInputs.filter(function (i) { return i.checked; })[0]; return c ? colorName(c) : null; }
      function selectedSize() { var s = sizeInputs.filter(function (i) { return i.checked; })[0]; return s ? sizeName(s) : null; }

      // Crossed-out sold-out sizes for the chosen color
      function refreshSizes() {
        var color = selectedColor();
        var firstAvailable = null;
        sizeInputs.forEach(function (inp) {
          var label = inp.closest(".option-chip");
          var left = stockFor(id, color, sizeName(inp));
          var soldOut = left === 0;
          inp.disabled = soldOut;
          if (label) {
            label.classList.toggle("is-soldout", soldOut);
            label.setAttribute("title", soldOut ? "Sold out in this color" : "");
          }
          if (!soldOut && firstAvailable === null) firstAvailable = inp;
        });
        var current = sizeInputs.filter(function (i) { return i.checked; })[0];
        if ((!current || current.disabled) && firstAvailable) firstAvailable.checked = true;
        refreshStatus();
      }

      function refreshStatus() {
        var color = selectedColor(), size = selectedSize();
        var left = stockFor(id, color, size);
        if (left === 0) {
          status.textContent = "Sold out";
          status.className = "stock-status is-out";
        } else if (left <= 5) {
          status.textContent = "Only " + left + " left";
          status.className = "stock-status is-low";
        } else {
          status.textContent = "";
          status.className = "stock-status";
        }
        var max = Math.min(10, left);
        qty.max = String(max);
        if (Number(qty.value) > max) qty.value = String(Math.max(1, max));
        addBtn.disabled = left === 0;
      }

      sizeInputs.concat(colorInputs).forEach(function (inp) {
        inp.addEventListener("change", function () {
          if (inp.name.indexOf("color-") === 0) refreshSizes();
          else refreshStatus();
        });
      });
      qty.addEventListener("change", function () {
        var max = Number(qty.max) || 10;
        var v = Math.floor(Number(qty.value));
        qty.value = String(Math.min(max, Math.max(1, isNaN(v) ? 1 : v)));
      });

      addBtn.addEventListener("click", function () {
        var color = selectedColor(), size = selectedSize();
        var left = stockFor(id, color, size);
        var want = Math.floor(Number(qty.value)) || 1;
        var cart = getCart();
        var line = cart.filter(function (i) { return i.id === id && i.color === color && i.size === size; })[0];
        var inBag = line ? line.qty : 0;
        if (inBag + want > left) {
          toast(addMsg, "Only " + (left - inBag) + " more available in " + color + " / " + size + ".", "error");
          return;
        }
        if (line) line.qty += want;
        else cart.push({ id: id, name: name, size: size, color: color, price: price, qty: want, tone: "tone-slate", cat: "" });
        saveCart(cart);
        updateBagPill();
        toast(addMsg, "Added " + want + " × " + name + " (" + color + ", " + size + ") to your bag.", "success");
      });

      refreshSizes();
    });
  }

  /* ---------- Cart page ---------- */
  function renderCart() {
    var list = $(".cart-items");
    if (!list) return;
    var cart = getCart();
    var heading = $(".cart-heading span, .cart-heading p");

    // Remove the static sample articles and the "coming soon" note
    $$(".cart-item", list).forEach(function (n) { n.remove(); });
    $$(".notice-soft", list).forEach(function (n) { n.remove(); });
    var anchor = $(".cart-heading", list);
    var frag = document.createDocumentFragment();

    if (cart.length === 0) {
      var empty = document.createElement("p");
      empty.className = "cart-empty";
      empty.innerHTML = "Your bag is empty. <a href='products.html'>Continue browsing</a>.";
      frag.appendChild(empty);
    }

    cart.forEach(function (item, idx) {
      var left = stockFor(item.id, item.color, item.size);
      var art = document.createElement("article");
      art.className = "cart-item";
      art.innerHTML =
        '<div aria-hidden="true" class="cart-thumbnail ' + esc(item.tone || "tone-slate") + '">' + esc(item.name.split(" ").map(function (w) { return w[0]; }).join("").slice(0, 2).toUpperCase()) + "</div>" +
        "<div>" +
          '<p class="eyebrow dark">' + esc(item.cat || "") + "</p>" +
          "<h3>" + esc(item.name) + "</h3>" +
          "<p>" + esc(item.size) + " &middot; " + esc(item.color) + "</p>" +
          '<a class="subtle-link" href="product-details.html#' + esc(item.id) + '">View details &nearrow;</a>' +
          (left <= 5 && left > 0 ? '<p class="stock-status is-low">Only ' + left + " left</p>" : "") +
        "</div>" +
        '<div class="item-cost">' +
          "<strong>" + money(item.price * item.qty) + "</strong>" +
          '<div class="qty-stepper" role="group" aria-label="Quantity">' +
            '<button type="button" data-act="dec" data-i="' + idx + '" aria-label="Decrease">−</button>' +
            "<span>" + item.qty + "</span>" +
            '<button type="button" data-act="inc" data-i="' + idx + '" aria-label="Increase"' + (item.qty >= Math.min(10, left) ? " disabled" : "") + ">+</button>" +
          "</div>" +
          '<span>' + money(item.price) + " each</span>" +
          '<button type="button" class="subtle-link remove-item" data-act="remove" data-i="' + idx + '">Remove</button>' +
        "</div>";
      frag.appendChild(art);
    });

    if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(frag, anchor.nextSibling);
    else list.appendChild(frag);

    var t = cartTotals(cart);
    if (heading) heading.textContent = t.units + " pieces / " + cart.length + " products";
    setSummary($(".summary-card"), t, "Subtotal (" + t.units + " items)");
    var fine = $(".summary-card .fine-print");
    if (fine) fine.textContent = "Delivery is free on orders above " + money(FREE_DELIVERY_OVER) + ".";
    var total = $(".summary-card .summary-total span");
    if (total) total.textContent = "Total";
    var checkout = $(".summary-card a[href='checkout.html']");
    if (checkout && cart.length === 0) { checkout.classList.add("is-disabled"); checkout.setAttribute("aria-disabled", "true"); }
    updateBagPill();
  }

  function setSummary(scope, t, subtotalLabel) {
    if (!scope) return;
    var rows = $$(".summary-row", scope);
    if (rows[0]) { rows[0].querySelector("span").textContent = subtotalLabel; rows[0].querySelector("strong").textContent = money(t.subtotal); }
    if (rows[1]) { rows[1].querySelector("span").textContent = "Delivery"; rows[1].querySelector("strong").textContent = t.delivery === 0 && t.subtotal > 0 ? "Free" : money(t.delivery); }
    if (rows[2]) { rows[2].querySelector("strong").textContent = money(t.total); }
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
      if (btn.dataset.act === "remove" || item.qty <= 0) cart.splice(i, 1);
      saveCart(cart);
      renderCart();
    });
  }

  /* ---------- Checkout ---------- */
  var PAYMENT_NOTES = {
    COD: "Cash on delivery. Pay the courier when your parcel arrives.",
    bKash: "bKash demo. Use a sample number only; no money is sent.",
    Nagad: "Nagad demo. Use a sample number only; no money is sent.",
    CARD: "Card demo. Do not enter real card details."
  };

  function selectedPayment() {
    var input = $('input[name="payment-preview"]:checked');
    if (!input) return "COD";
    var label = input.closest("label");
    var name = label ? label.querySelector("b") : null;
    return name ? name.textContent.trim() : "COD";
  }

  function initCheckout() {
    var summary = $(".checkout-summary");
    var payBtn = $(".checkout-bottom a[href='receipt.html']");
    if (!payBtn) return;

    setSummary(summary, cartTotals(getCart()), "Subtotal");

    // Payment method note
    var group = $(".payment-group");
    var note = document.createElement("p");
    note.className = "payment-note";
    if (group) group.parentNode.insertBefore(note, group.nextSibling);
    function showNote() { note.textContent = PAYMENT_NOTES[selectedPayment()] || ""; }
    $$('input[name="payment-preview"]').forEach(function (r) { r.addEventListener("change", showNote); });
    showNote();

    payBtn.textContent = "Payment Done \u2197";
    payBtn.removeAttribute("href");
    payBtn.setAttribute("role", "button");
    payBtn.setAttribute("tabindex", "0");

    var msg = createMessage($(".checkout-bottom"));

    function validate() {
      var errors = [];
      var name = $("#ship-name"), phone = $("#ship-phone"), addr = $("#ship-address"), city = $("#ship-city"), postal = $("#ship-postal");
      if (!name.value.trim()) errors.push("Enter your full name.");
      if (!/^01[3-9]\d{8}$/.test(phone.value.trim())) errors.push("Enter a valid 11-digit Bangladeshi mobile number (e.g. 01XXXXXXXXX).");
      if (!addr.value.trim()) errors.push("Enter your street address.");
      if (!city.value.trim()) errors.push("Enter your city.");
      if (postal.value.trim() && !/^\d{4}$/.test(postal.value.trim())) errors.push("Postal code should be 4 digits.");
      var t = cartTotals(getCart());
      if (t.units === 0) errors.push("Your bag is empty.");
      return errors;
    }

    function showWarning(onContinue) {
      var overlay = document.createElement("div");
      overlay.className = "js-modal-backdrop";
      overlay.innerHTML =
        '<div class="js-modal" role="alertdialog" aria-modal="true" aria-labelledby="js-modal-title">' +
          '<p class="eyebrow dark">DEMO NOTICE</p>' +
          '<h2 id="js-modal-title">Dummy payment only</h2>' +
          '<p class="js-modal-warning"><strong>This is a dummy e-commerce system, not a real store. No real payment was made.</strong></p>' +
          '<div class="js-modal-actions">' +
            '<button type="button" class="btn btn-ghost" data-cancel>Cancel</button>' +
            '<button type="button" class="btn btn-dark" data-ok>I understand, continue</button>' +
          "</div>" +
        "</div>";
      document.body.appendChild(overlay);
      overlay.querySelector("[data-ok]").focus();
      function close() { overlay.remove(); }
      overlay.querySelector("[data-cancel]").addEventListener("click", close);
      overlay.addEventListener("click", function (e) { if (e.target === overlay) close(); });
      overlay.querySelector("[data-ok]").addEventListener("click", function () { close(); onContinue(); });
    }

    function pay() {
      clearToast(msg);
      var errors = validate();
      if (errors.length) { toast(msg, errors.join(" "), "error"); return; }
      showWarning(function () {
        var cart = getCart();
        var t = cartTotals(cart);
        write(KEY.lastOrder, {
          id: "BB-" + Date.now().toString(36).toUpperCase(),
          at: new Date().toISOString(),
          customer: $("#ship-name").value.trim(),
          phone: $("#ship-phone").value.trim(),
          address: [$("#ship-address").value.trim(), $("#ship-city").value.trim(), $("#ship-postal").value.trim()].filter(Boolean).join(", "),
          method: selectedPayment(),
          items: cart.map(function (i) { return { name: i.name, size: i.size, color: i.color, qty: i.qty, price: i.price }; }),
          totals: t,
          status: "DEMO \u00B7 NOT PAID"
        });
        window.location.href = "receipt.html";
      });
    }

    payBtn.addEventListener("click", function (e) { e.preventDefault(); pay(); });
    payBtn.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pay(); } });
  }

  /* ---------- Receipt ---------- */
  function initReceipt() {
    var order = read(KEY.lastOrder, null);
    var paper = $(".receipt-paper");
    if (!paper) return;

    if (order) {
      var rows = $$(".receipt-row", paper);
      function setRow(label, value) {
        rows.forEach(function (r) {
          var s = r.querySelector("span"), v = r.querySelector("strong");
          if (s && v && s.textContent.trim().toLowerCase() === label.toLowerCase()) v.textContent = value;
        });
      }
      setRow("Payment method", order.method);
      setRow("Payment status", order.status);
      var grand = $(".receipt-grand strong");
      if (grand) grand.textContent = "BDT " + Number(order.totals.total).toLocaleString("en-US");
      var center = $(".receipt-center strong", paper);
      if (center && order.id) center.textContent = "ORDER " + order.id;
      var items = $(".receipt-items", paper);
      if (items) {
        $$(".receipt-line", items).forEach(function (n) { n.remove(); });
        order.items.forEach(function (it) {
          var line = document.createElement("div");
          line.className = "receipt-row receipt-line";
          line.innerHTML = "<span>" + esc(it.name) + " (" + esc(it.size) + ", " + esc(it.color) + ") × " + it.qty + "</span><strong>" + Number(it.price * it.qty).toLocaleString("en-US") + "</strong>";
          items.appendChild(line);
        });
      }
    }

    var actions = $(".receipt-explainer");
    if (actions && !$(".receipt-print")) {
      var printBtn = document.createElement("button");
      printBtn.type = "button";
      printBtn.className = "btn btn-dark receipt-print";
      printBtn.textContent = "Print / save as PDF";
      printBtn.addEventListener("click", function () { window.print(); });
      actions.appendChild(printBtn);
    }
  }

  /* ---------- Login & signup (UI validation only; nothing stored) ---------- */
  var DEMO_NOTE = "Demo only: nothing is checked, sent or saved.";

  function initLogin() {
    var email = $("#login-email"), pass = $("#login-password");
    if (!email || !pass) return;
    var btn = email.closest(".auth-card, form, div").querySelector("button[disabled]") || $("button[disabled]");
    if (!btn) return;
    btn.disabled = false;
    btn.textContent = "Sign in";
    var msg = createMessage(btn);
    btn.addEventListener("click", function () {
      clearToast(msg);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) return toast(msg, "Enter a valid email address.", "error");
      if (pass.value.length < 1) return toast(msg, "Enter your password.", "error");
      toast(msg, "Looks good. " + DEMO_NOTE, "success");
    });
  }

  function initSignup() {
    var name = $("#reg-name"), email = $("#reg-email"), pass = $("#reg-pass"), confirm = $("#reg-confirm");
    if (!name || !email || !pass || !confirm) return;
    var btn = $("button[disabled]");
    if (!btn) return;
    btn.disabled = false;
    btn.textContent = "Create account";
    var msg = createMessage(btn);
    btn.addEventListener("click", function () {
      clearToast(msg);
      var errs = [];
      if (!name.value.trim()) errs.push("Enter your name.");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) errs.push("Enter a valid email address.");
      if (pass.value.length < 8) errs.push("Password must be at least 8 characters.");
      if (pass.value !== confirm.value) errs.push("Passwords do not match.");
      if (errs.length) return toast(msg, errs.join(" "), "error");
      toast(msg, "Looks good. " + DEMO_NOTE, "success");
    });
  }

  /* ---------- Inventory restock (saved in this browser only) ---------- */
  function initInventory() {
    var select = $("#sku-select"), qty = $("#stock-add"), reason = $("#stock-reason");
    if (!select || !qty) return;
    var btn = $(".inventory-form-preview button");
    if (!btn) return;

    var overrides = read(KEY.stock, {});
    var rowFor = function (sku) {
      return $$("table tbody tr").filter(function (tr) {
        var first = tr.cells[0];
        return first && first.textContent.trim() === sku;
      })[0];
    };
    function applyStock(sku, units) {
      var tr = rowFor(sku);
      if (!tr || !tr.cells[4]) return;
      tr.cells[4].textContent = units + " units";
    }
    Object.keys(overrides).forEach(function (sku) { applyStock(sku, overrides[sku]); });

    var skuOf = function (opt) { return opt.textContent.split("\u2014")[0].trim(); };
    var msg = createMessage(btn);

    btn.disabled = false;
    btn.textContent = "Apply restock";
    var notice = $(".inventory-form-preview .fine-print");
    if (notice) notice.textContent = "Changes are saved in this browser only and are not shared with other devices.";

    btn.addEventListener("click", function () {
      clearToast(msg);
      var sku = skuOf(select.options[select.selectedIndex]);
      var add = Math.floor(Number(qty.value));
      if (!add || add < 1) return toast(msg, "Enter a restock quantity of at least 1.", "error");
      var tr = rowFor(sku);
      var current = tr && tr.cells[4] ? parseInt(tr.cells[4].textContent, 10) || 0 : 0;
      var next = current + add;
      overrides[sku] = next;
      write(KEY.stock, overrides);
      applyStock(sku, next);
      var log = read(KEY.activity, []);
      log.unshift({ type: "restock", sku: sku, qty: add, reason: reason ? reason.value : "", at: new Date().toISOString() });
      write(KEY.activity, log.slice(0, 200));
      toast(msg, "Restocked " + sku + ": +" + add + " (now " + next + " units).", "success");
    });
  }

  /* ---------- Boot ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    updateBagPill();
    initProductDetails();
    renderCart();
    initCartControls();
    initCheckout();
    initReceipt();
    initLogin();
    initSignup();
    initInventory();
  });
})();
