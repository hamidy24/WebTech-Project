/* =====================================================================
   BRUTBOX & CO. — preview.js
   Quick-view product popup. Any element with data-preview-id="<product id>"
   opens it. Shows the product photo by photo (one photo per colour),
   lets the shopper pick colour, size and quantity, and add to bag.
   Reads admin-edited products when present, otherwise the catalogue.
   ===================================================================== */
(function () {
  "use strict";

  var KEY_PRODUCTS = "bb_products";
  var KEY_CART = "brutbox_cart";
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var esc = function (s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };
  var money = function (n) { return "৳" + Math.round(Number(n) || 0).toLocaleString("en-US"); };
  var catName = function (slug) {
    var c = ((window.BRUTBOX_CATALOG && window.BRUTBOX_CATALOG.categories) || []).filter(function (x) { return x.slug === slug; })[0];
    return c ? c.name : slug;
  };

  var overlay, track, thumbs, nameEl, priceEl, countEl, prevBtn, nextBtn, optionsEl, msgEl, lastFocus;
  var state = { product: null, images: [], index: 0, startX: null, colour: null };

  function findProduct(id) {
    try {
      var saved = JSON.parse(localStorage.getItem(KEY_PRODUCTS) || "[]").filter(function (p) { return p.id === id; })[0];
      if (saved) return saved;
    } catch (e) { /* fall through to the catalogue */ }
    var list = (window.BRUTBOX_CATALOG && window.BRUTBOX_CATALOG.products) || [];
    return list.filter(function (p) { return p.id === id; })[0] || null;
  }
  function imagesOf(p) {
    if (p.images && p.images.length) return p.images;
    return p.image ? [p.image] : [];
  }
  function stockOf(p, color, size) {
    return p.stock && p.stock[color] && typeof p.stock[color][size] === "number" ? p.stock[color][size] : 0;
  }

  function build() {
    overlay = document.createElement("div");
    overlay.className = "pv-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "Product preview");
    overlay.innerHTML =
      '<div class="pv-box">' +
        '<button type="button" class="pv-close" aria-label="Close preview">&times;</button>' +
        '<div class="pv-stage">' +
          '<button type="button" class="pv-nav pv-prev" aria-label="Previous photo">&lsaquo;</button>' +
          '<div class="pv-track" aria-live="polite"></div>' +
          '<button type="button" class="pv-nav pv-next" aria-label="Next photo">&rsaquo;</button>' +
        "</div>" +
        '<div class="pv-thumbs" role="tablist" aria-label="Choose a photo"></div>' +
        '<div class="pv-meta"><div><div class="pv-name"></div><div class="pv-price"></div></div><div class="pv-count"></div></div>' +
        '<div class="pv-options"></div>' +
        '<p class="pv-msg" role="status"></p>' +
      "</div>";
    document.body.appendChild(overlay);
    track = overlay.querySelector(".pv-track");
    thumbs = overlay.querySelector(".pv-thumbs");
    nameEl = overlay.querySelector(".pv-name");
    priceEl = overlay.querySelector(".pv-price");
    countEl = overlay.querySelector(".pv-count");
    prevBtn = overlay.querySelector(".pv-prev");
    nextBtn = overlay.querySelector(".pv-next");
    optionsEl = overlay.querySelector(".pv-options");
    msgEl = overlay.querySelector(".pv-msg");

    overlay.addEventListener("click", function (e) { if (e.target === overlay) close(); });
    overlay.querySelector(".pv-close").addEventListener("click", close);
    prevBtn.addEventListener("click", function () { go(-1); });
    nextBtn.addEventListener("click", function () { go(1); });
    thumbs.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-i]");
      if (b) show(Number(b.getAttribute("data-i")));
    });
    var stage = overlay.querySelector(".pv-stage");
    stage.addEventListener("pointerdown", function (e) { state.startX = e.clientX; }, { passive: true });
    stage.addEventListener("pointerup", function (e) {
      if (state.startX === null) return;
      var dx = e.clientX - state.startX;
      state.startX = null;
      if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
    }, { passive: true });
    document.addEventListener("keydown", function (e) {
      if (!overlay || !overlay.classList.contains("is-open")) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    });
    optionsEl.addEventListener("click", function (e) {
      var colour = e.target.closest("button[data-colour]");
      if (colour) {
        var idx = state.product.colors.indexOf(colour.getAttribute("data-colour"));
        if (idx > -1) { state.colour = colour.getAttribute("data-colour"); show(photoCountOf(state.product) + idx); }
        return;
      }
      if (e.target.closest(".pv-add")) addToBag();
      if (e.target.closest(".pv-qty-inc")) stepQty(1);
      if (e.target.closest(".pv-qty-dec")) stepQty(-1);
    });
    optionsEl.addEventListener("change", function (e) {
      if (e.target.matches("select[name='pv-size']")) refreshStock();
    });
  }

  function photoCountOf(p) { return p.photoCount || 0; }
  // Photo slots come first in the list; colour pictures follow in colour order
  function currentColour() {
    var p = state.product, offset = photoCountOf(p);
    if (state.index >= offset && p.colors[state.index - offset]) state.colour = p.colors[state.index - offset];
    return state.colour || p.colors[0];
  }
  function currentSize() {
    var sel = optionsEl.querySelector("select[name='pv-size']");
    return sel ? sel.value : (state.product.sizes && state.product.sizes[0]) || "One Size";
  }

  function render() {
    var p = state.product, n = state.images.length;
    track.innerHTML = state.images.map(function (src, i) {
      var off = photoCountOf(p), label = i < off ? "photo " + (i + 1) : (p.colors[i - off] || "colour");
      if (!src) return '<div class="pv-img pv-noimg" aria-label="' + esc(p.name) + '"><span>' + esc(p.name) + '</span><small>' + esc(catName(p.category)) + '</small></div>';
      return '<img class="pv-img" src="' + esc(src) + '" alt="' + esc(p.name) + " - " + esc(label) + '" draggable="false" />';
    }).join("");
    thumbs.innerHTML = state.images.map(function (src, i) {
      var off2 = photoCountOf(p);
      var tl = i < off2 ? "Photo " + (i + 1) : (p.colors[i - off2] || "Colour");
      return '<button type="button" role="tab" data-i="' + i + '" aria-label="' + esc(tl) + '">' +
        (src ? '<img src="' + esc(src) + '" alt="" loading="lazy" />' : '<span class="pv-thumb-empty"></span>') + '</button>';
    }).join("");
    nameEl.innerHTML = esc(p.name) + '<span class="pv-cat">' + esc(catName(p.category)) + "</span>";
    priceEl.innerHTML = money(p.price) + (p.originalPrice ? ' <s class="pv-old">' + money(p.originalPrice) + "</s>" : "");
    prevBtn.hidden = nextBtn.hidden = n < 2;
    thumbs.hidden = n < 2;
    renderOptions();
    layout(false);
  }

  function renderOptions() {
    var p = state.product;
    var sizes = (p.sizes && p.sizes.length) ? p.sizes : ["One Size"];
    var colourChips = (p.colors || []).map(function (c) {
      return '<button type="button" class="pv-chip" data-colour="' + esc(c) + '" aria-pressed="false">' +
        '<i style="background:' + colourHex(c) + '"></i>' + esc(c) + "</button>";
    }).join("");
    var sizeOpts = sizes.map(function (s) { return "<option value='" + esc(s) + "'>" + esc(s) + "</option>"; }).join("");
    optionsEl.innerHTML =
      '<div class="pv-row"><span class="pv-label">Colour</span><div class="pv-chips">' + colourChips + "</div></div>" +
      '<div class="pv-row"><label class="pv-label" for="pv-size">Size</label><select id="pv-size" name="pv-size" class="pv-select">' + sizeOpts + "</select></div>" +
      '<div class="pv-row"><span class="pv-label">Quantity</span><div class="pv-qty">' +
        '<button type="button" class="pv-qty-dec" aria-label="Fewer">&minus;</button><span class="pv-qty-n">1</span>' +
        '<button type="button" class="pv-qty-inc" aria-label="More">+</button></div></div>' +
      '<p class="pv-stock"></p>' +
      '<button type="button" class="pv-add btn btn-primary">Add to bag</button>' +
      (p.description ? '<p class="pv-desc">' + esc(p.description) + "</p>" : "");
    refreshStock();
  }

  function colourHex(name) {
    if (window.BRUTBOX_CATALOG && window.BRUTBOX_CATALOG.colourHex && window.BRUTBOX_CATALOG.colourHex[name]) return window.BRUTBOX_CATALOG.colourHex[name];
    var map = (window.Brutbox && window.Brutbox.COLOR_HEX) || {};
    return map[name] || "#9aa0a6";
  }

  function refreshStock() {
    var p = state.product;
    var left = stockOf(p, currentColour(), currentSize());
    var stockEl = optionsEl.querySelector(".pv-stock");
    var addBtn = optionsEl.querySelector(".pv-add");
    stockEl.className = "pv-stock" + (left === 0 ? " is-out" : left <= 5 ? " is-low" : "");
    stockEl.textContent = left === 0 ? "Sold out in this colour and size" : left <= 5 ? "Only " + left + " left" : "In stock";
    addBtn.disabled = left === 0;
    var qty = optionsEl.querySelector(".pv-qty-n");
    if (Number(qty.textContent) > left) qty.textContent = String(Math.max(1, left));
    optionsEl.querySelectorAll(".pv-chip").forEach(function (c) {
      var on = c.getAttribute("data-colour") === currentColour();
      c.setAttribute("aria-pressed", String(on));
      c.classList.toggle("is-active", on);
    });
  }

  function stepQty(step) {
    var p = state.product, qty = optionsEl.querySelector(".pv-qty-n");
    var left = stockOf(p, currentColour(), currentSize());
    var next = Math.min(Math.max(1, Math.min(10, left)), Math.max(1, Number(qty.textContent) + step));
    qty.textContent = String(next);
  }

  function addToBag() {
    var p = state.product, colour = currentColour(), size = currentSize();
    var qty = Number(optionsEl.querySelector(".pv-qty-n").textContent) || 1;
    var left = stockOf(p, colour, size);
    var cart = [];
    try { cart = JSON.parse(localStorage.getItem(KEY_CART) || "[]"); } catch (e) { cart = []; }
    var line = cart.filter(function (i) { return i.id === p.id && i.color === colour && i.size === size; })[0];
    var inBag = line ? line.qty : 0;
    if (inBag + qty > left) {
      msgEl.textContent = "Only " + Math.max(0, left - inBag) + " more available in " + colour + ", " + size + ".";
      msgEl.className = "pv-msg is-error";
      return;
    }
    if (line) line.qty += qty;
    else cart.push({ id: p.id, name: p.name, category: p.category, size: size, color: colour, price: p.price, qty: qty, tone: "tone-slate", cat: catName(p.category), image: state.images[state.index] });
    localStorage.setItem(KEY_CART, JSON.stringify(cart));
    window.dispatchEvent(new Event("cart:updated"));
    msgEl.textContent = "Added " + qty + " × " + p.name + " (" + colour + ", " + size + ") to your bag.";
    msgEl.className = "pv-msg is-ok";
  }

  function layout(animate) {
    var imgs = track.querySelectorAll(".pv-img");
    imgs.forEach(function (img, i) {
      img.style.transition = animate && !reduce ? "transform 0.45s cubic-bezier(.2,.8,.2,1), opacity 0.45s ease" : "none";
      var offset = i - state.index;
      img.style.transform = "translate3d(" + (offset * 100) + "%,0,0)";
      img.style.opacity = offset === 0 ? "1" : "0";
    });
    thumbs.querySelectorAll("button").forEach(function (b, i) {
      b.setAttribute("aria-selected", String(i === state.index));
      b.classList.toggle("is-active", i === state.index);
    });
    var n = state.images.length;
    countEl.textContent = n ? (state.index + 1) + " / " + n : "";
    if (state.product) refreshStock();
  }

  function show(i) {
    var n = state.images.length;
    if (!n) return;
    state.index = (i + n) % n;
    layout(true);
  }
  function go(step) { show(state.index + step); }

  function open(id) {
    var p = findProduct(id);
    if (!p) return;
    var imgs = imagesOf(p);
    if (!imgs.length) imgs = [""];          // no picture: show a text panel instead
    if (!overlay) build();
    state.product = p;
    state.images = imgs;
    state.index = 0;
    state.colour = null;
    msgEl.textContent = "";
    msgEl.className = "pv-msg";
    lastFocus = document.activeElement;
    render();
    overlay.classList.add("is-open");
    document.body.classList.add("pv-lock");
    overlay.querySelector(".pv-close").focus({ preventScroll: true });
  }

  function close() {
    if (!overlay) return;
    overlay.classList.remove("is-open");
    document.body.classList.remove("pv-lock");
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }

  document.addEventListener("click", function (e) {
    var t = e.target.closest && e.target.closest("[data-preview-id]");
    if (!t) return;
    e.preventDefault();
    open(t.getAttribute("data-preview-id"));
  });

  window.BBPreview = { open: open, close: close };
})();
