/* =====================================================================
   BRUTBOX & CO. — preview.js
   Quick-view product preview. Any element with data-preview-id="<product id>"
   opens a popup that shows the product photos one at a time.
   Controls: arrows, thumbnails, dots, swipe on touch, keyboard (← → Esc).
   Animations use transform and opacity only, and are off when the user
   prefers reduced motion.
   ===================================================================== */
(function () {
  "use strict";

  var KEY = "bb_products";
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var esc = function (s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };
  var money = function (n) { return "৳" + Math.round(Number(n) || 0).toLocaleString("en-US"); };

  var overlay, box, track, thumbs, nameEl, priceEl, countEl, prevBtn, nextBtn, closeBtn;
  var state = { images: [], index: 0, name: "", price: 0, lastFocus: null, startX: null };

  function findProduct(id) {
    try {
      var list = JSON.parse(localStorage.getItem(KEY) || "[]");
      return list.filter(function (p) { return p.id === id; })[0] || null;
    } catch (e) { return null; }
  }
  function imagesOf(p) {
    if (p.images && p.images.length) return p.images;
    return p.image ? [p.image] : [];
  }

  function build() {
    overlay = document.createElement("div");
    overlay.className = "pv-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "Product photo preview");
    overlay.innerHTML =
      '<div class="pv-box">' +
        '<button type="button" class="pv-close" aria-label="Close preview">&times;</button>' +
        '<div class="pv-stage">' +
          '<button type="button" class="pv-nav pv-prev" aria-label="Previous photo">&lsaquo;</button>' +
          '<div class="pv-track" aria-live="polite"></div>' +
          '<button type="button" class="pv-nav pv-next" aria-label="Next photo">&rsaquo;</button>' +
        "</div>" +
        '<div class="pv-meta">' +
          '<div><div class="pv-name"></div><div class="pv-price"></div></div>' +
          '<div class="pv-count"></div>' +
        "</div>" +
        '<div class="pv-thumbs" role="tablist" aria-label="Choose a photo"></div>' +
      "</div>";
    document.body.appendChild(overlay);
    box = overlay.querySelector(".pv-box");
    track = overlay.querySelector(".pv-track");
    thumbs = overlay.querySelector(".pv-thumbs");
    nameEl = overlay.querySelector(".pv-name");
    priceEl = overlay.querySelector(".pv-price");
    countEl = overlay.querySelector(".pv-count");
    prevBtn = overlay.querySelector(".pv-prev");
    nextBtn = overlay.querySelector(".pv-next");
    closeBtn = overlay.querySelector(".pv-close");

    overlay.addEventListener("click", function (e) { if (e.target === overlay) close(); });
    closeBtn.addEventListener("click", close);
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
  }

  function render() {
    var n = state.images.length;
    track.innerHTML = state.images.map(function (src, i) {
      return '<img class="pv-img" src="' + esc(src) + '" alt="' + esc(state.name) + ", photo " + (i + 1) + ' of ' + n + '" draggable="false" />';
    }).join("");
    thumbs.innerHTML = state.images.map(function (src, i) {
      return '<button type="button" role="tab" data-i="' + i + '" aria-label="Photo ' + (i + 1) + '">' +
        '<img src="' + esc(src) + '" alt="" loading="lazy" /></button>';
    }).join("");
    nameEl.textContent = state.name;
    priceEl.textContent = money(state.price);
    var multi = n > 1;
    prevBtn.hidden = nextBtn.hidden = !multi;
    thumbs.hidden = !multi;
    layout(false);
  }

  // Position each photo relative to the current one (slides in/out)
  function layout(animate) {
    var imgs = track.querySelectorAll(".pv-img");
    imgs.forEach(function (img, i) {
      img.style.transition = animate && !reduce ? "transform 0.45s cubic-bezier(.2,.8,.2,1), opacity 0.45s ease" : "none";
      var offset = i - state.index;
      img.style.transform = "translate3d(" + (offset * 100) + "%,0,0)";
      img.style.opacity = offset === 0 ? "1" : "0";
      img.classList.toggle("is-current", offset === 0);
    });
    thumbs.querySelectorAll("button").forEach(function (b, i) {
      b.setAttribute("aria-selected", String(i === state.index));
      b.classList.toggle("is-active", i === state.index);
    });
    var n = state.images.length;
    countEl.textContent = n ? (state.index + 1) + " / " + n : "";
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
    if (!imgs.length) return;
    if (!overlay) build();
    state.images = imgs;
    state.index = 0;
    state.name = p.name;
    state.price = p.price;
    state.lastFocus = document.activeElement;
    render();
    overlay.classList.add("is-open");
    document.body.classList.add("pv-lock");
    closeBtn.focus({ preventScroll: true });
  }

  function close() {
    if (!overlay) return;
    overlay.classList.remove("is-open");
    document.body.classList.remove("pv-lock");
    if (state.lastFocus && state.lastFocus.focus) state.lastFocus.focus({ preventScroll: true });
  }

  document.addEventListener("click", function (e) {
    var t = e.target.closest && e.target.closest("[data-preview-id]");
    if (!t) return;
    e.preventDefault();
    open(t.getAttribute("data-preview-id"));
  });

  window.BBPreview = { open: open, close: close };
})();
