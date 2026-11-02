/* =====================================================================
   BRUTBOX & CO. — motion.js
   Small, fast enhancements: scroll reveal, header shadow on scroll,
   press ripple on buttons, and a quick fade between storefront pages.
   Uses passive listeners and requestAnimationFrame so it never blocks
   scrolling. Does nothing if the user prefers reduced motion.
   ===================================================================== */
(function () {
  "use strict";

  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var root = document.documentElement;

  /* ---------- 1. Scroll reveal ---------- */
  var selector = ".section, .product-card, .category-tile, .kpi, .panel, .product-card-item, .live-card, .cart-item, .summary-card, .form-panel";
  var targets = Array.prototype.slice.call(document.querySelectorAll(selector));
  // Stagger siblings slightly so grids cascade in
  var seen = new Map();
  targets.forEach(function (el) {
    var parent = el.parentElement;
    var n = seen.get(parent) || 0;
    seen.set(parent, n + 1);
    el.classList.add("reveal");
    el.style.setProperty("--d", Math.min(n, 8) * 60 + "ms");
  });

  if (!reduce && targets.length) {
    root.classList.add("js-motion");
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1, rootMargin: "0px 0px -30px 0px" });
      targets.forEach(function (el) { io.observe(el); });
    } else {
      targets.forEach(function (el) { el.classList.add("is-visible"); });
    }
  } else {
    targets.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ---------- 2. Header shadow when scrolled (rAF-throttled) ---------- */
  var header = document.querySelector(".site-header");
  if (header) {
    var ticking = false;
    window.addEventListener("scroll", function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        header.classList.toggle("is-scrolled", window.scrollY > 8);
        ticking = false;
      });
    }, { passive: true });
  }

  /* ---------- 3. Press ripple on buttons ---------- */
  if (!reduce) {
    document.addEventListener("pointerdown", function (e) {
      var btn = e.target.closest && e.target.closest(".btn, .chip, .cart-pill");
      if (!btn || btn.disabled) return;
      var rect = btn.getBoundingClientRect();
      var size = Math.max(rect.width, rect.height);
      var dot = document.createElement("span");
      dot.className = "ripple";
      dot.style.width = dot.style.height = size + "px";
      dot.style.left = (e.clientX - rect.left - size / 2) + "px";
      dot.style.top = (e.clientY - rect.top - size / 2) + "px";
      btn.appendChild(dot);
      dot.addEventListener("animationend", function () { dot.remove(); });
    }, { passive: true });
  }

  /* ---------- 4. Quick fade between storefront pages ---------- */
  var isAdmin = !!document.querySelector(".admin-body");
  if (!reduce && !isAdmin) {
    document.addEventListener("click", function (e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var link = e.target.closest && e.target.closest("a[href]");
      if (!link || link.target === "_blank" || link.hasAttribute("download")) return;
      var url;
      try { url = new URL(link.href, location.href); } catch (err) { return; }
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname) return;          // same page, or a #hash on this page
      if (!/\.html$/i.test(url.pathname) && url.pathname !== "/") return;
      e.preventDefault();
      document.body.classList.add("is-leaving");
      window.setTimeout(function () { location.href = url.href; }, 170);
    });
  }
})();
