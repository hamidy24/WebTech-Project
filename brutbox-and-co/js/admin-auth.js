/* =====================================================================
   BRUTBOX & CO. — admin-auth.js
   Browser-only demo gate enforcing up to 3 concurrent admin sessions
   in localStorage ("bb_admin_sessions") + tab sessionStorage token.
   ===================================================================== */
(function (global) {
  "use strict";
  var B = global.Brutbox;

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
  var ALLOWED_NEXT = {
    "admin.html": "admin.html",
    "admin.html#dashboard": "admin.html#dashboard",
    "inventory.html": "inventory.html"
  };
  function sanitizeNext(raw) {
    var clean = String(raw || "").trim();
    return ALLOWED_NEXT[clean] || "";
  }
  function requireSession(nextTarget) {
    if (!isValid()) {
      var hadToken = Boolean(currentToken());
      sessionStorage.removeItem(TOKEN_KEY);
      var reason = hadToken ? "expired" : "auth";
      var next = sanitizeNext(nextTarget);
      location.replace("admin-login.html?reason=" + reason + (next ? "&next=" + encodeURIComponent(next) : ""));
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
      return { ok: false, blocked: true, error: "Session limit reached (3 of 3 active admins). Close an existing session or wait 90 seconds." };
    }
    var token = Math.random().toString(36).slice(2) + now().toString(36);
    list.push({ token: token, started: now(), lastSeen: now() });
    B.write(B.KEY.sessions, list);
    sessionStorage.setItem(TOKEN_KEY, token);
    B.logActivity("login", "Admin signed in (" + list.length + " of " + B.CONFIG.maxAdmins + " seats active).");
    return { ok: true };
  }

  global.AdminAuth = {
    isValid: isValid, requireSession: requireSession, heartbeat: heartbeat,
    logout: logout, login: login,
    activeCount: function () { return activeSessions().length; },
    maxAdmins: function () { return B.CONFIG.maxAdmins; }
  };

  document.addEventListener("DOMContentLoaded", function () {
    var form = document.getElementById("admin-login-form");
    if (!form) return;
    B.seedData();

    var alertBox = document.getElementById("login-alert");
    var seats = document.getElementById("seat-count");
    var params = new URLSearchParams(location.search);
    var reason = params.get("reason");
    var nextTarget = sanitizeNext(params.get("next"));

    function showAlert(type, text) {
      alertBox.className = "alert alert-" + type;
      alertBox.textContent = text;
      alertBox.hidden = false;
    }
    function refreshSeats() {
      if (seats) seats.textContent = activeSessions().length + " of " + B.CONFIG.maxAdmins + " active sessions";
    }

    if (isValid()) { location.replace(nextTarget || "admin.html"); return; }
    if (reason === "expired") showAlert("warning", "Your admin session ended. Sign in again with Admin ID and password.");
    if (reason === "auth") {
      var destLabel = nextTarget === "inventory.html" ? "Live Inventory" : "Control Center";
      showAlert("warning", "Admin ID and password required to open " + destLabel + ".");
    }
    if (reason === "logout") showAlert("success", "Signed out cleanly.");
    refreshSeats();

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var result = login(document.getElementById("admin-id").value, document.getElementById("admin-password").value);
      if (result.ok) { location.replace(nextTarget || "admin.html"); return; }
      showAlert("danger", result.error);
      refreshSeats();
      if (result.blocked) form.querySelector("button[type=submit]").disabled = true;
    });
  });
})(window);
