/* =====================================================================
   BRUTBOX & CO. — theme-mode.js
   Light / dark theme toggle persisted in localStorage ("bb_theme").
   Early <head> script sets data-theme="dark" before first paint.
   ===================================================================== */
(function () {
  "use strict";
  var KEY = "bb_theme";
  var root = document.documentElement;

  function current() {
    return root.getAttribute("data-theme") === "dark" ? "dark" : "light";
  }

  function apply(mode) {
    root.setAttribute("data-theme", mode);
    document.querySelectorAll(".theme-toggle").forEach(function (btn) {
      var dark = mode === "dark";
      btn.setAttribute("aria-pressed", String(dark));
      btn.setAttribute("aria-label", dark ? "Switch to light theme" : "Switch to dark theme");
      btn.title = dark ? "Light mode" : "Dark mode";
      btn.innerHTML = dark
        ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>'
        : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';
    });
  }

  function save(mode) {
    try { localStorage.setItem(KEY, mode); } catch (e) { /* private mode */ }
  }

  function mountButtons() {
    document.querySelectorAll(".header-actions, .admin-topbar, .admin-side-theme").forEach(function (bar) {
      if (bar.querySelector(".theme-toggle")) return;
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "icon-btn theme-toggle";
      var anchor = bar.querySelector(".cart-pill") || bar.querySelector(".admin-menu");
      bar.insertBefore(btn, anchor || null);
    });
    apply(current());
  }

  document.addEventListener("click", function (e) {
    var btn = e.target.closest && e.target.closest(".theme-toggle");
    if (!btn) return;
    var next = current() === "dark" ? "light" : "dark";
    save(next);
    apply(next);
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountButtons);
  } else {
    mountButtons();
  }
})();
