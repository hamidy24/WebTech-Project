/* =====================================================================
   BRUTBOX & CO. — motion.js
   Subtle GPU-only scroll reveal, header scroll shadow, and reduced-motion
   respect across all storefront pages.
   ===================================================================== */
(function () {
  "use strict";

  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var root = document.documentElement;

  var selector = "[data-reveal], .section, .product-card, .category-tile, .kpi, .panel, .summary-card, .form-panel";
  var isAdminPage = document.body && document.body.classList.contains("admin-body");
  var targets = isAdminPage ? [] : Array.prototype.slice.call(document.querySelectorAll(selector));

  var seen = new Map();
  targets.forEach(function (el) {
    var parent = el.parentElement;
    var n = seen.get(parent) || 0;
    seen.set(parent, n + 1);
    el.classList.add("reveal");
    el.style.setProperty("--d", Math.min(n, 5) * 40 + "ms");
  });

  function show(el) {
    el.classList.add("is-visible");
    el.classList.add("is-revealed");
  }

  if (!reduce && targets.length && "IntersectionObserver" in window) {
    root.classList.add("js-motion");
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          show(entry.target);
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.01, rootMargin: "120px 0px 120px 0px" });
    targets.forEach(function (el) {
      var rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight + 120) {
        show(el);
      } else {
        io.observe(el);
      }
    });
  } else {
    targets.forEach(show);
  }

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
})();
