/* =====================================================================
   BRUTBOX & CO. — admin.js
   Admin control center: dashboard, upload, products & stock, reports.
   Requires admin-core.js and admin-auth.js to be loaded first.
   ===================================================================== */
(function () {
  "use strict";

  var B = window.Brutbox;
  var A = window.AdminAuth;
  var DAY = 864e5;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = B.esc, money = B.money;

  /* ---------- Guard ---------- */
  if (!A.requireSession()) return;
  B.seedData();
  B.importStorefrontOrders();

  /* ---------- Data access ---------- */
  function products() { return B.read(B.KEY.products, []); }
  function orders() { return B.read(B.KEY.orders, []); }
  function saveProducts(list) { return B.write(B.KEY.products, list); }
  function startOfDay(t) { var d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); }
  function orderUnits(o) { return (o.items || []).reduce(function (s, i) { return s + Number(i.qty || 0); }, 0); }
  function fmtDay(t) { return new Date(t).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }); }

  /* ---------- Alerts ---------- */
  function alertBox(type, text, persist) {
    var box = document.createElement("div");
    box.className = "alert alert-" + type;
    box.setAttribute("role", type === "danger" ? "alert" : "status");
    if (persist) box.setAttribute("data-persist", "1");
    box.textContent = text;
    $("#alerts").appendChild(box);
    if (!persist) setTimeout(function () { box.remove(); }, 7000);
    return box;
  }
  function setPersistent(list) {
    $$("#alerts [data-persist]").forEach(function (n) { n.remove(); });
    list.forEach(function (a) {
      var box = alertBox(a.type, a.text, true);
      $("#alerts").insertBefore(box, $("#alerts").firstChild);
    });
  }

  /* ---------- Sales analytics ---------- */
  function dailySeries(days) {
    var today = startOfDay(Date.now()), out = [];
    for (var i = days - 1; i >= 0; i--) {
      var start = today - i * DAY;
      out.push({ start: start, label: fmtDay(start), revenue: 0, orders: 0, units: 0 });
    }
    orders().forEach(function (o) {
      var t = Date.parse(o.at);
      out.forEach(function (b) {
        if (t >= b.start && t < b.start + DAY) {
          b.revenue += Number(o.total) || 0; b.orders++; b.units += orderUnits(o);
        }
      });
    });
    return out;
  }

  function spikeAlerts() {
    var series = dailySeries(21);
    var last = series[series.length - 1];
    var base = series.slice(-8, -1);
    var avg = base.reduce(function (s, b) { return s + b.revenue; }, 0) / 7;
    var found = [];

    if (last.revenue >= B.CONFIG.spikeMinRevenue && last.revenue >= avg * B.CONFIG.spikeMultiple) {
      found.push({ type: "danger", kind: "Spike", text: "Sudden sales spike today: " + money(last.revenue) + " so far, about " + (avg ? (last.revenue / avg).toFixed(1) : "many") + "× the 7-day average of " + money(avg) + "." });
    } else if (avg >= B.CONFIG.spikeMinRevenue && last.revenue < avg * 0.5) {
      found.push({ type: "warning", kind: "Drop", text: "Sales are unusually low today: " + money(last.revenue) + " so far versus a 7-day average of " + money(avg) + "." });
    }

    // Product-level spikes: last 2 days vs the 14 days before that
    var yStart = startOfDay(Date.now()) - DAY;
    var priorStart = yStart - 14 * DAY;
    products().forEach(function (p) {
      var recent = 0, prior = 0;
      orders().forEach(function (o) {
        var t = Date.parse(o.at);
        (o.items || []).forEach(function (i) {
          if (i.productId !== p.id) return;
          if (t >= yStart) recent += Number(i.qty) || 0;
          else if (t >= priorStart) prior += Number(i.qty) || 0;
        });
      });
      var priorAvg = prior / 7; // average units per 2-day window
      if (recent >= 5 && recent >= 3 * Math.max(priorAvg, 1)) {
        found.push({ type: "warning", kind: "Demand", text: p.name + " is selling fast: " + recent + " units in the last 2 days (usual about " + Math.round(priorAvg) + ")." });
      }
    });
    return { list: found, series: series, avg: avg, last: last };
  }

  function lowStockList() {
    return products().filter(function (p) {
      var t = B.totalStock(p.stock);
      return !p.hidden && t <= B.CONFIG.lowStock;
    });
  }

  /* ---------- Dashboard ---------- */
  function renderDashboard() {
    var all = orders();
    var totalRev = all.reduce(function (s, o) { return s + (Number(o.total) || 0); }, 0);
    var units = all.reduce(function (s, o) { return s + orderUnits(o); }, 0);
    var week = dailySeries(7).reduce(function (s, b) { return s + b.revenue; }, 0);
    var spike = spikeAlerts();

    $("#kpis").innerHTML = [
      kpi("Today so far", money(spike.last.revenue), spike.last.orders + " orders"),
      kpi("Last 7 days", money(week), ""),
      kpi("All-time revenue", money(totalRev), all.length + " orders"),
      kpi("Units sold", units.toLocaleString("en-US"), "all time"),
      kpi("Avg order value", money(all.length ? totalRev / all.length : 0), ""),
      kpi("Active admins", A.activeCount() + " / " + A.maxAdmins(), "sessions in use")
    ].join("");

    drawChart($("#revenue-chart"), spike.series.slice(-14));

    var low = lowStockList();
    $("#low-stock").innerHTML = low.length
      ? "<ul class='plain-list'>" + low.map(function (p) {
          var t = B.totalStock(p.stock);
          return "<li><span>" + esc(p.name) + "</span><strong class='" + (t === 0 ? "text-danger" : "text-warning") + "'>" + (t === 0 ? "Sold out" : "Only " + t + " left") + "</strong></li>";
        }).join("") + "</ul>"
      : "<p class='muted'>All products are above the low-stock level.</p>";

    var sales = {};
    all.forEach(function (o) {
      (o.items || []).forEach(function (i) {
        var key = i.name;
        sales[key] = sales[key] || { units: 0, revenue: 0 };
        sales[key].units += Number(i.qty) || 0;
        sales[key].revenue += (Number(i.qty) || 0) * (Number(i.price) || 0);
      });
    });
    var top = Object.keys(sales).map(function (k) { return { name: k, units: sales[k].units, revenue: sales[k].revenue }; })
      .sort(function (a, b) { return b.units - a.units; }).slice(0, 5);
    $("#best-sellers").innerHTML = top.length
      ? "<ol class='plain-list'>" + top.map(function (t) {
          return "<li><span>" + esc(t.name) + "</span><strong>" + t.units + " sold · " + money(t.revenue) + "</strong></li>";
        }).join("") + "</ol>"
      : "<p class='muted'>No sales yet.</p>";

    var persist = [];
    if (low.some(function (p) { return B.totalStock(p.stock) === 0; }) || low.length) {
      persist.push({ type: "danger", text: "Low stock: " + low.length + " product" + (low.length === 1 ? "" : "s") + " at " + B.CONFIG.lowStock + " or fewer units." });
    }
    spike.list.forEach(function (a) { persist.push({ type: a.type, text: a.text }); });
    setPersistent(persist);
  }

  function kpi(label, value, sub) {
    return '<div class="kpi"><span class="kpi-label">' + esc(label) + '</span><strong class="kpi-value">' + esc(value) + '</strong><span class="kpi-sub">' + esc(sub) + "</span></div>";
  }

  function drawChart(host, series) {
    var W = 600, H = 220, pad = 28;
    var max = Math.max.apply(null, series.map(function (s) { return s.revenue; }).concat([1]));
    var bw = (W - pad * 2) / series.length;
    var bars = series.map(function (s, i) {
      var h = (s.revenue / max) * (H - pad * 2);
      var x = pad + i * bw + bw * 0.15;
      var y = H - pad - h;
      var cls = i === series.length - 1 ? "bar bar-today" : "bar";
      return '<g><title>' + esc(s.label) + ": " + money(s.revenue) + " · " + s.orders + " orders</title>" +
        '<rect class="' + cls + '" x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + (bw * 0.7).toFixed(1) + '" height="' + Math.max(h, 1).toFixed(1) + '" rx="3"/>' +
        (i % 2 === 0 || series.length <= 8 ? '<text class="axis" x="' + (x + bw * 0.35).toFixed(1) + '" y="' + (H - 8) + '" text-anchor="middle">' + esc(s.label) + "</text>" : "") + "</g>";
    }).join("");
    host.innerHTML = '<svg viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="Revenue per day"><line class="grid" x1="' + pad + '" x2="' + (W - pad) + '" y1="' + (H - pad) + '" y2="' + (H - pad) + '"/>' + bars + "</svg>";
  }

  /* ---------- Upload ---------- */
  var pendingImage = null;
  var fileInput = $("#file-input");
  var dropZone = $("#drop-zone");

  function processImage(file) {
    return new Promise(function (resolve, reject) {
      if (!file || !/^image\//.test(file.type)) return reject(new Error("Please choose an image file (JPG, PNG or WebP)."));
      if (file.size > 15 * 1024 * 1024) return reject(new Error("That image is larger than 15 MB."));
      var reader = new FileReader();
      reader.onerror = function () { reject(new Error("The file could not be read.")); };
      reader.onload = function () {
        var img = new Image();
        img.onerror = function () { reject(new Error("That file could not be read as an image.")); };
        img.onload = function () {
          var size = 1000, c = document.createElement("canvas");
          c.width = c.height = size;
          var ctx = c.getContext("2d");
          var s = Math.min(img.width, img.height);
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, size, size);
          ctx.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, size, size);
          var url = c.toDataURL("image/webp", 0.85);
          if (url.indexOf("data:image/webp") !== 0) url = c.toDataURL("image/jpeg", 0.88); // older browsers
          resolve(url);
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function setPendingImage(file) {
    processImage(file).then(function (url) {
      pendingImage = url;
      $("#preview-img").src = url;
      $("#preview-meta").textContent = "1000 × 1000 px · " + (url.indexOf("webp") > -1 ? "WebP" : "JPEG") + " · " + Math.round(url.length * 0.75 / 1024) + " KB";
      $("#upload-preview").hidden = false;
      dropZone.classList.add("has-file");
      updatePreviewCard();
    }).catch(function (err) { alertBox("danger", err.message); });
  }

  dropZone.addEventListener("click", function () { fileInput.click(); });
  dropZone.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fileInput.click(); } });
  fileInput.addEventListener("change", function () { if (fileInput.files[0]) setPendingImage(fileInput.files[0]); });
  ["dragenter", "dragover"].forEach(function (ev) {
    dropZone.addEventListener(ev, function (e) { e.preventDefault(); dropZone.classList.add("is-over"); });
  });
  ["dragleave", "drop"].forEach(function (ev) {
    dropZone.addEventListener(ev, function (e) { e.preventDefault(); dropZone.classList.remove("is-over"); });
  });
  dropZone.addEventListener("drop", function (e) {
    var f = e.dataTransfer && e.dataTransfer.files[0];
    if (f) setPendingImage(f);
  });
  // Dropping outside the zone should not open the image in the browser
  window.addEventListener("dragover", function (e) { e.preventDefault(); });
  window.addEventListener("drop", function (e) { e.preventDefault(); });

  function fillCategories(select, includeAll) {
    var html = includeAll ? "<option value='all'>All categories</option>" : "";
    html += B.CATEGORIES.map(function (c) { return "<option value='" + c.slug + "'>" + esc(c.name) + "</option>"; }).join("");
    select.innerHTML = html;
  }

  function listFrom(input) {
    return String(input.value || "").split(",").map(function (s) { return s.trim(); }).filter(Boolean)
      .filter(function (v, i, arr) { return arr.indexOf(v) === i; });
  }

  function buildMatrix(keepValues) {
    var colors = listFrom($("#up-colors"));
    var sizes = listFrom($("#up-sizes"));
    var table = $("#stock-matrix");
    if (!colors.length || !sizes.length) {
      table.innerHTML = "<tr><td class='muted'>Add at least one color and one size to set stock.</td></tr>";
      return;
    }
    var head = "<tr><th>Color</th>" + sizes.map(function (s) { return "<th>" + esc(s) + "</th>"; }).join("") + "</tr>";
    var rows = colors.map(function (c) {
      return "<tr><th scope='row'>" + esc(c) + "</th>" + sizes.map(function (s) {
        var prev = keepValues && keepValues[c] && keepValues[c][s] != null ? keepValues[c][s] : 10;
        return "<td><input class='input stock-input' type='number' min='0' value='" + prev + "' data-c='" + esc(c) + "' data-s='" + esc(s) + "' aria-label='" + esc(c + " " + s) + " stock'/></td>";
      }).join("") + "</tr>";
    }).join("");
    table.innerHTML = head + rows;
  }

  function currentMatrixValues() {
    var out = {};
    $$("#stock-matrix .stock-input").forEach(function (inp) {
      var c = inp.getAttribute("data-c"), s = inp.getAttribute("data-s");
      out[c] = out[c] || {};
      out[c][s] = Math.max(0, Math.floor(Number(inp.value) || 0));
    });
    return out;
  }

  function updatePreviewCard() { /* live preview is the uploaded photo + name; kept minimal */ }

  $("#up-category").addEventListener("change", function () {
    var cat = B.CATEGORIES.filter(function (c) { return c.slug === $("#up-category").value; })[0];
    if (cat) $("#up-sizes").value = cat.sizes.join(", ");
    buildMatrix(currentMatrixValues());
  });
  $("#up-colors").addEventListener("input", function () { buildMatrix(currentMatrixValues()); });
  $("#up-sizes").addEventListener("input", function () { buildMatrix(currentMatrixValues()); });

  function resetUpload() {
    $("#upload-form").reset();
    pendingImage = null;
    fileInput.value = "";
    $("#upload-preview").hidden = true;
    dropZone.classList.remove("has-file");
    fillCategories($("#up-category"));
    $("#up-colors").value = "Black";
    $("#up-sizes").value = B.CATEGORIES[0].sizes.join(", ");
    buildMatrix();
  }

  $("#up-reset").addEventListener("click", resetUpload);

  $("#upload-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var name = $("#up-name").value.trim();
    var price = Math.floor(Number($("#up-price").value));
    var category = $("#up-category").value;
    var colors = listFrom($("#up-colors"));
    var sizes = listFrom($("#up-sizes"));
    var errors = [];
    if (!pendingImage) errors.push("Add a product photo.");
    if (!name) errors.push("Enter a product name.");
    if (!(price > 0)) errors.push("Enter a price above 0.");
    if (!colors.length) errors.push("Add at least one color.");
    if (!sizes.length) errors.push("Add at least one size.");
    if (errors.length) return alertBox("danger", errors.join(" "));

    var values = currentMatrixValues(), stock = {};
    colors.forEach(function (c) {
      stock[c] = {};
      sizes.forEach(function (s) { stock[c][s] = (values[c] && values[c][s] != null) ? values[c][s] : 0; });
    });
    var product = {
      id: "p-" + Date.now().toString(36), name: name, category: category, price: price,
      colors: colors, sizes: sizes, stock: stock, image: pendingImage, hidden: false,
      source: "admin", createdAt: new Date().toISOString().slice(0, 10)
    };
    var list = products();
    list.unshift(product);
    if (!saveProducts(list)) return alertBox("danger", "Storage is full. Delete or hide older products with photos, then try again.");
    B.logActivity("upload", "Published " + name + " (" + B.categoryName(category) + ", " + money(price) + ", " + B.totalStock(stock) + " units).");
    alertBox("success", name + " is live on the storefront.");
    resetUpload();
    renderProducts();
    renderDashboard();
    renderActivity();
  });

  /* ---------- Products & stock ---------- */
  var replaceInput = document.createElement("input");
  replaceInput.type = "file";
  replaceInput.accept = "image/*";
  replaceInput.hidden = true;
  document.body.appendChild(replaceInput);
  var replaceTarget = null;

  replaceInput.addEventListener("change", function () {
    var file = replaceInput.files[0];
    if (!file || !replaceTarget) return;
    processImage(file).then(function (url) {
      var list = products();
      var p = list.filter(function (x) { return x.id === replaceTarget; })[0];
      if (!p) return;
      p.image = url;
      if (!saveProducts(list)) return alertBox("danger", "Storage is full. The new photo was not saved.");
      B.logActivity("photo", "Replaced photo of " + p.name + ".");
      alertBox("success", "Photo replaced for " + p.name + ".");
      renderProducts();
    }).catch(function (err) { alertBox("danger", err.message); })
      .finally(function () { replaceInput.value = ""; replaceTarget = null; });
  });

  function renderProducts() {
    var list = products();
    var tbody = $("#product-rows");
    if (!list.length) {
      tbody.innerHTML = "<tr><td colspan='7' class='muted'>No products yet. Upload one to get started.</td></tr>";
    } else {
      tbody.innerHTML = list.map(function (p) {
        var t = B.totalStock(p.stock);
        var stockCls = t === 0 ? "text-danger" : t <= B.CONFIG.lowStock ? "text-warning" : "";
        return "<tr>" +
          "<td><img class='thumb' src='" + p.image + "' alt='' loading='lazy'/></td>" +
          "<td><strong>" + esc(p.name) + "</strong><div class='muted small'>" + esc(p.id) + (p.source === "seed" ? " · sample" : "") + "</div></td>" +
          "<td>" + esc(B.categoryName(p.category)) + "</td>" +
          "<td><input class='input price-input' type='number' min='1' value='" + p.price + "' data-act='price' data-id='" + esc(p.id) + "' aria-label='Price for " + esc(p.name) + "'/></td>" +
          "<td class='" + stockCls + "'>" + t + " units</td>" +
          "<td>" + (p.hidden ? "<span class='pill pill-muted'>Hidden</span>" : "<span class='pill pill-ok'>Live</span>") + "</td>" +
          "<td class='row-actions'>" +
            "<button class='link-btn' data-act='toggle' data-id='" + esc(p.id) + "'>" + (p.hidden ? "Show" : "Hide") + "</button>" +
            "<button class='link-btn' data-act='photo' data-id='" + esc(p.id) + "'>Replace photo</button>" +
            "<button class='link-btn danger' data-act='delete' data-id='" + esc(p.id) + "'>Delete</button>" +
          "</td></tr>";
      }).join("");
    }
    fillRestockSelectors();
  }

  function updateProduct(id, fn) {
    var list = products();
    var p = list.filter(function (x) { return x.id === id; })[0];
    if (!p) return null;
    var result = fn(p);
    return saveProducts(list) ? p : null;
  }

  $("#product-rows").addEventListener("click", function (e) {
    var btn = e.target.closest("button[data-act]");
    if (!btn) return;
    var id = btn.getAttribute("data-id"), act = btn.getAttribute("data-act");
    if (act === "toggle") {
      var p = updateProduct(id, function (x) { x.hidden = !x.hidden; });
      if (p) { B.logActivity("visibility", (p.hidden ? "Hid " : "Showed ") + p.name + "."); alertBox("success", p.name + (p.hidden ? " hidden from the store." : " is visible again.")); }
    }
    if (act === "photo") { replaceTarget = id; replaceInput.click(); }
    if (act === "delete") {
      var target = products().filter(function (x) { return x.id === id; })[0];
      if (!target || !window.confirm("Delete " + target.name + " permanently? This cannot be undone.")) return;
      saveProducts(products().filter(function (x) { return x.id !== id; }));
      B.logActivity("delete", "Deleted " + target.name + ".");
      alertBox("warning", target.name + " was deleted.");
    }
    renderProducts(); renderDashboard(); renderActivity();
  });

  $("#product-rows").addEventListener("change", function (e) {
    var inp = e.target;
    if (inp.getAttribute("data-act") !== "price") return;
    var id = inp.getAttribute("data-id");
    var value = Math.floor(Number(inp.value));
    if (!(value > 0)) { alertBox("danger", "Price must be above 0."); renderProducts(); return; }
    var before = products().filter(function (x) { return x.id === id; })[0];
    var p = updateProduct(id, function (x) { x.price = value; });
    if (p) { B.logActivity("price", p.name + ": " + money(before.price) + " → " + money(value) + "."); alertBox("success", "Price updated for " + p.name + "."); }
    renderProducts(); renderDashboard(); renderActivity();
  });

  function fillRestockSelectors() {
    var list = products();
    var sel = $("#rs-product");
    var current = sel.value;
    sel.innerHTML = list.map(function (p) { return "<option value='" + esc(p.id) + "'>" + esc(p.name) + "</option>"; }).join("");
    if (list.some(function (p) { return p.id === current; })) sel.value = current;
    refreshRestockVariants();
  }

  function refreshRestockVariants() {
    var p = products().filter(function (x) { return x.id === $("#rs-product").value; })[0];
    var colorSel = $("#rs-color"), sizeSel = $("#rs-size");
    if (!p) { colorSel.innerHTML = ""; sizeSel.innerHTML = ""; return; }
    colorSel.innerHTML = p.colors.map(function (c) { return "<option>" + esc(c) + "</option>"; }).join("");
    sizeSel.innerHTML = p.sizes.map(function (s) { return "<option>" + esc(s) + "</option>"; }).join("");
  }
  $("#rs-product").addEventListener("change", refreshRestockVariants);

  $("#rs-apply").addEventListener("click", function () {
    var amount = Math.floor(Number($("#rs-amount").value));
    if (!(amount > 0)) return alertBox("danger", "Enter an amount of at least 1.");
    var id = $("#rs-product").value, color = $("#rs-color").value, size = $("#rs-size").value;
    var p = updateProduct(id, function (x) {
      x.stock[color] = x.stock[color] || {};
      x.stock[color][size] = (Number(x.stock[color][size]) || 0) + amount;
    });
    if (!p) return alertBox("danger", "Could not save the restock.");
    B.logActivity("restock", "Restocked " + p.name + " (" + color + ", " + size + ") by +" + amount + " → " + p.stock[color][size] + ".");
    alertBox("success", "Added " + amount + " to " + p.name + " (" + color + ", " + size + ").");
    renderProducts(); renderDashboard(); renderActivity();
  });

  $$("[data-bulk]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var pct = Number($("#bp-percent").value);
      if (!(pct > 0 && pct < 91)) return alertBox("danger", "Enter a percentage between 1 and 90.");
      var cat = $("#bp-category").value, dir = btn.getAttribute("data-bulk"), count = 0;
      var list = products();
      list.forEach(function (p) {
        if (cat !== "all" && p.category !== cat) return;
        var next = Math.max(1, Math.round(p.price * (dir === "up" ? 1 + pct / 100 : 1 - pct / 100)));
        if (next !== p.price) { p.price = next; count++; }
      });
      if (!count) return alertBox("warning", "No products matched.");
      saveProducts(list);
      B.logActivity("bulk-price", (dir === "up" ? "Increased" : "Decreased") + " prices by " + pct + "% for " + (cat === "all" ? "all categories" : B.categoryName(cat)) + " (" + count + " products).");
      alertBox("success", "Prices updated for " + count + " products.");
      renderProducts(); renderDashboard(); renderActivity();
    });
  });

  /* ---------- Reports ---------- */
  function reportRange() {
    var v = $("#report-range").value;
    if (v !== "all") return Number(v);
    var all = orders();
    if (!all.length) return 14;
    var oldest = Math.min.apply(null, all.map(function (o) { return Date.parse(o.at); }));
    return Math.min(365, Math.max(14, Math.ceil((Date.now() - oldest) / DAY) + 1));
  }

  function renderReports() {
    var days = reportRange();
    var series = dailySeries(days);
    var from = startOfDay(Date.now()) - (days - 1) * DAY;
    var inRange = orders().filter(function (o) { return Date.parse(o.at) >= from; });
    var rev = series.reduce(function (s, b) { return s + b.revenue; }, 0);
    var units = series.reduce(function (s, b) { return s + b.units; }, 0);
    var count = series.reduce(function (s, b) { return s + b.orders; }, 0);

    $("#report-kpis").innerHTML = [
      kpi("Revenue", money(rev), "last " + days + " days"),
      kpi("Orders", String(count), ""),
      kpi("Units sold", String(units), ""),
      kpi("Avg order value", money(count ? rev / count : 0), "")
    ].join("");

    var byCat = {};
    inRange.forEach(function (o) {
      (o.items || []).forEach(function (i) {
        var p = products().filter(function (x) { return x.id === i.productId; })[0];
        var cat = p ? B.categoryName(p.category) : "Other";
        byCat[cat] = byCat[cat] || { units: 0, revenue: 0 };
        byCat[cat].units += Number(i.qty) || 0;
        byCat[cat].revenue += (Number(i.qty) || 0) * (Number(i.price) || 0);
      });
    });
    var cats = Object.keys(byCat).sort(function (a, b) { return byCat[b].revenue - byCat[a].revenue; });
    var maxRev = Math.max.apply(null, cats.map(function (c) { return byCat[c].revenue; }).concat([1]));
    $("#category-sales").innerHTML = cats.length
      ? cats.map(function (c) {
          return "<div class='bar-row'><span>" + esc(c) + "</span><div class='bar-track'><div style='width:" + ((byCat[c].revenue / maxRev) * 100).toFixed(1) + "%'></div></div><strong>" + money(byCat[c].revenue) + "</strong></div>";
        }).join("")
      : "<p class='muted'>No sales in this period.</p>";

    var spike = spikeAlerts();
    $("#spike-list").innerHTML = spike.list.length
      ? "<ul class='plain-list'>" + spike.list.map(function (a) { return "<li class='" + (a.type === "danger" ? "text-danger" : "text-warning") + "'>" + esc(a.text) + "</li>"; }).join("") + "</ul>"
      : "<p class='muted'>No unusual sales activity right now.</p>";

    $("#daily-rows").innerHTML = series.slice().reverse().map(function (b) {
      return "<tr><td>" + esc(new Date(b.start).toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short", year: "numeric" })) + "</td><td>" + b.orders + "</td><td>" + b.units + "</td><td>" + money(b.revenue) + "</td></tr>";
    }).join("");
  }

  function csvCell(v) { var s = String(v == null ? "" : v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }
  function download(name, rows) {
    var csv = rows.map(function (r) { return r.map(csvCell).join(","); }).join("\n");
    var blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  }

  $("#export-orders").addEventListener("click", function () {
    var rows = [["Order ID", "Date", "Customer", "Product", "Size", "Color", "Qty", "Unit price", "Line total", "Payment", "Source", "Status"]];
    orders().forEach(function (o) {
      (o.items || []).forEach(function (i) {
        rows.push([o.id, o.at, o.customer, i.name, i.size, i.color, i.qty, i.price, (Number(i.qty) || 0) * (Number(i.price) || 0), o.method, o.source, o.status]);
      });
    });
    download("brutbox-orders.csv", rows);
    B.logActivity("export", "Exported order history (" + (rows.length - 1) + " lines).");
    renderActivity();
  });

  $("#export-stock").addEventListener("click", function () {
    var rows = [["Product", "Product ID", "Category", "Color", "Size", "Stock", "Unit price", "Visibility"]];
    products().forEach(function (p) {
      Object.keys(p.stock).forEach(function (c) {
        Object.keys(p.stock[c]).forEach(function (s) {
          rows.push([p.name, p.id, B.categoryName(p.category), c, s, p.stock[c][s], p.price, p.hidden ? "Hidden" : "Live"]);
        });
      });
    });
    download("brutbox-stock.csv", rows);
    B.logActivity("export", "Exported stock report (" + (rows.length - 1) + " variants).");
    renderActivity();
  });

  $("#report-range").addEventListener("change", renderReports);

  /* ---------- Activity ---------- */
  function renderActivity() {
    var log = B.read(B.KEY.activity, []);
    $("#activity-list").innerHTML = log.length
      ? log.slice(0, 100).map(function (l) {
          return "<li><span class='pill pill-muted'>" + esc(l.type) + "</span> " + esc(l.message) +
            " <time class='muted small'>" + new Date(l.at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }) + "</time></li>";
        }).join("")
      : "<li class='muted'>No activity yet.</li>";
  }

  /* ---------- Navigation, session, refresh ---------- */
  function show(view) {
    $$(".admin-tabs button").forEach(function (b) { b.classList.toggle("is-active", b.getAttribute("data-view") === view); });
    $$("[data-section]").forEach(function (s) { s.classList.toggle("is-visible", s.getAttribute("data-section") === view); });
    if (view === "dashboard") renderDashboard();
    if (view === "products") renderProducts();
    if (view === "reports") renderReports();
    if (view === "activity") renderActivity();
    if (view === "upload" && !$("#up-colors").value) resetUpload();
    history.replaceState(null, "", "#" + view);
  }
  $$(".admin-tabs button").forEach(function (b) {
    b.addEventListener("click", function () { show(b.getAttribute("data-view")); });
  });

  function renderSeats() {
    $("#seat-badge").textContent = "Admins: " + A.activeCount() + " / " + A.maxAdmins();
  }

  $("#logout-btn").addEventListener("click", function () {
    if (window.confirm("Sign out of the admin panel?")) A.logout();
  });

  // Keep this session alive; leave if the session was removed
  setInterval(function () {
    if (!A.heartbeat()) {
      alertBox("danger", "Your admin session has ended. Redirecting to sign in…");
      setTimeout(function () { location.replace("admin-login.html?reason=expired"); }, 1500);
    }
    renderSeats();
    renderDashboard();
  }, B.CONFIG.heartbeatMs);

  // Refresh when another tab changes the data
  window.addEventListener("storage", function (e) {
    if (e.key === B.KEY.products || e.key === B.KEY.orders || e.key === B.KEY.activity || e.key === B.KEY.sessions) {
      renderSeats(); renderDashboard(); renderProducts(); renderReports(); renderActivity();
    }
  });

  /* ---------- Init ---------- */
  fillCategories($("#up-category"));
  fillCategories($("#bp-category"), true);
  resetUpload();
  renderSeats();
  renderDashboard();
  renderProducts();
  renderReports();
  renderActivity();
  var start = (location.hash || "#dashboard").slice(1);
  show(["dashboard", "upload", "products", "reports", "activity"].indexOf(start) > -1 ? start : "dashboard");
})();
