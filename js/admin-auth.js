/* =====================================================================
   BRUTBOX & CO. — admin-auth.js
   Fixed admin login + maximum 3 concurrent admin sessions.
   NOTE: GitHub Pages is static, so this is a demo gate, not real security.
   Sessions are tracked in localStorage, so they only count within one
   browser. Each open tab gets its own session (sessionStorage).
   ===================================================================== */
(function (global) {
  "use strict";
  var B = global.Brutbox;

  // Fixed demo credentials
  var CREDENTIALS = { id: "admin1", password: "brut1234" };
  var TOKEN_KEY = "bb_admin_token";

  function now() { return Date.now(); }

  function activeSessions() {
    var list = B.read(B.KEY.sessions, []).filter(function (s) {
      return now() - s.lastSeen < B.CONFIG.sessionTtlMs;
    });
    B.write(B.KEY.sessions, list);
    return list;
  }
  function currentToken() { return sessionStorage.getItem(TOKEN_KEY); }
  function isValid() {
    var tok = currentToken();
    return !!tok && activeSessions().some(function (s) { return s.token === tok; });
  }
  function requireSession() {
    if (!isValid()) {
      sessionStorage.removeItem(TOKEN_KEY);
      location.replace("admin-login.html?reason=expired");
      return false;
    }
    return true;
  }
  function heartbeat() {
    var tok = currentToken(), list = activeSessions();
    var mine = list.filter(function (s) { return s.token === tok; })[0];
    if (!mine) return false;
    mine.lastSeen = now();
    B.write(B.KEY.sessions, list);
    return true;
  }
  function logout() {
    var tok = currentToken();
    B.write(B.KEY.sessions, activeSessions().filter(function (s) { return s.token !== tok; }));
    sessionStorage.removeItem(TOKEN_KEY);
    location.replace("admin-login.html?reason=logout");
  }
  function login(id, password) {
    if (String(id).trim() !== CREDENTIALS.id || password !== CREDENTIALS.password) {
      return { ok: false, error: "Invalid admin ID or password." };
    }
    var list = activeSessions();
    if (list.length >= B.CONFIG.maxAdmins) {
      return { ok: false, blocked: true, error: "Access denied. 3 admins are already logged in." };
    }
    var token = Math.random().toString(36).slice(2) + now().toString(36);
    list.push({ token: token, started: now(), lastSeen: now() });
    B.write(B.KEY.sessions, list);
    sessionStorage.setItem(TOKEN_KEY, token);
    B.logActivity("login", "Admin signed in (" + list.length + " of " + B.CONFIG.maxAdmins + " seats in use).");
    return { ok: true };
  }

  global.AdminAuth = {
    isValid: isValid, requireSession: requireSession, heartbeat: heartbeat,
    logout: logout, login: login, activeCount: function () { return activeSessions().length; },
    maxAdmins: function () { return B.CONFIG.maxAdmins; }
  };

  /* ---------- Login page wiring (runs only on admin-login.html) ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    var form = document.getElementById("admin-login-form");
    if (!form) return;
    B.seedData();

    var alertBox = document.getElementById("login-alert");
    var seats = document.getElementById("seat-count");
    var reason = new URLSearchParams(location.search).get("reason");

    function showAlert(type, text) {
      alertBox.className = "alert alert-" + type;
      alertBox.textContent = text;
      alertBox.hidden = false;
    }
    function refreshSeats() {
      if (seats) seats.textContent = activeSessions().length + " of " + B.CONFIG.maxAdmins + " admin seats in use";
    }

    if (isValid()) { location.replace("admin.html"); return; }
    if (reason === "expired") showAlert("warning", "Your admin session ended. Please sign in again.");
    if (reason === "logout") showAlert("success", "You have signed out.");
    refreshSeats();

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var result = login(document.getElementById("admin-id").value, document.getElementById("admin-password").value);
      if (result.ok) { location.replace("admin.html"); return; }
      showAlert("danger", result.error);
      refreshSeats();
      if (result.blocked) form.querySelector("button[type=submit]").disabled = true;
    });
  });
})(window);
