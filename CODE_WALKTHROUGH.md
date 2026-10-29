# BRUTBOX & CO. — Beginner Code Walkthrough

This guide explains what the code comments mean and how HTML, CSS and JavaScript connect. Read it with `README.md` open in another window.

## 1. The three technologies

- **HTML** is the page structure: headings, product cards, forms, buttons, tables and links.
- **CSS (`css/style.css`)** controls appearance: colors, font choices, spacing, responsive layouts, hover states, banners (none are used in this version), and print formatting for the receipt.
- **JavaScript (`js/`)** makes the page interactive: product filtering, selected sizes/colors, cart totals, coupons, customer demo profiles, checkout, receipts and admin controls.

Most pages contain these shared elements:

```html
<link rel="stylesheet" href="css/style.css">
<script src="js/data.js" defer></script>
<script src="js/store.js" defer></script>
<script src="js/app.js" defer></script>
<!-- This next script is different depending on the current page. -->
<script src="js/catalog.js" defer></script>
```

The first line attaches CSS to the HTML. The script order is significant: `data.js` creates the starter data; `store.js` exposes the shared `BBStore` functions; `app.js` creates the common header/footer; the last script handles page-specific controls. `defer` asks the browser to execute scripts after the HTML is parsed, in their listed order.

## 2. How the product-to-receipt flow connects

```text
index.html / products.html
      │  catalog.js displays product cards and filters them
      ▼
product-details.html?id=P001
      │  product-details.js reads P001 from the URL
      │  customer chooses size + color, which identifies one SKU
      ▼
BBStore.addToCart(productId, sku, quantity)
      │  store.js validates the selected SKU and available stock
      │  then saves the cart in localStorage
      ▼
app.js listens for the "bb:cartchange" event
      │  refreshes the small number under the bag icon
      ▼
cart.html  ── cart.js updates quantities, removes lines and totals
      ▼
login.html / signup.html
      │  auth.js demonstrates returning-customer lookup and profile creation
      ▼
checkout.html  ── checkout.js checks login, validates delivery data and coupon
      │              store.js rechecks all SKUs before changing stock
      │              the order is stored as a fixed order snapshot
      ▼
receipt.html?orderId=...
             receipt.js finds that order snapshot and renders the print receipt
```

### Key idea: `SKU`
A product can have several variants. For example, Black / M boxer briefs may have SKU `BX-BLK-M`, while Navy / M has a different SKU. The cart and inventory use this exact SKU so that changing one size does not incorrectly change another size's stock.

### Key idea: the cart event
When `store.js` saves the cart, it dispatches `bb:cartchange`. `app.js` listens to that event and updates the header badge. `cart.js` also listens to it and redraws the cart. This is how the counter and cart contents stay consistent inside the current browser.

### Key idea: order snapshot
At checkout, the program copies the product names, SKU, chosen size/color, quantity, prices, shipping, discount and statuses into an order record. `receipt.js` reads that saved record. If a product price is edited afterward, an older receipt still displays the price from the saved order.

## 3. File-by-file map

| File | What it means / connects to |
|---|---|
| `js/data.js` | Initial demo products, exact size/color SKUs, coupons and public demo admin credentials. `store.js` uses it to seed storage on first run. |
| `js/store.js` | Shared data layer. Every page uses `BBStore` for products, cart, wishlist, profile, coupons, order snapshots, stock, admin sessions and CSV export. |
| `js/app.js` | Shared website shell. Inserts header and footer, reads the stored logo, displays the live cart count and shows toast messages. |
| `js/catalog.js` | Renders product cards on the home/shop/wishlist pages; searches, filters, sorts, and reacts to wishlist clicks. |
| `js/product-details.js` | Reads a product ID from the URL, makes size/color choices, shows the exact variant stock, then calls `BBStore.addToCart()`. |
| `js/cart.js` | Uses `BBStore.cartDetails()` to show cart rows; quantity and remove buttons call store functions. |
| `js/auth.js` | Demonstrates customer profile creation and returning-profile login. It intentionally does not save or verify passwords. |
| `js/checkout.js` | Connects saved customer details, coupon validation, delivery charge, demo payment choice, order creation and redirect to receipt. |
| `js/receipt.js` | Reads `orderId` from the URL, displays the matching saved order and runs the browser print dialog. |
| `js/admin-login.js` | Checks the public demo allow-list and asks `store.js` to enforce the three-session demo limit. |
| `js/admin.js` | Product management, coupon management, branding preview, activity/security lists, inventory restocking and CSV exports. |
| `js/contact.js` | Validates the contact form and saves the message only to this browser; it does not send email. |
| `css/style.css` | Shared design system for every HTML page, including mobile layouts and receipt print rules. |
| `assets/images/products/` | Sample SVG product illustrations used by the starter catalog. Replace them with your own prepared images when ready. |
| `assets/images/logo/` | Default logo image referenced by the shared header and footer. |

## 4. How the Admin Control Center connects to the shop

```text
admin-login.html → admin-login.js → store.js session check
                                      │
                  ┌───────────────────┼────────────────────┐
                  ▼                   ▼                    ▼
             admin.html          inventory.html      Website Settings
             add/edit/archive    restock exact SKU   store name/logo
             products/coupons    purchase records    saved demo settings
                  │                   │                    │
                  └──────────────┬────┴────────────────────┘
                                 ▼
                            BBStore data
                                 │
                  public catalog reads same data
```

A product created through the admin form gets variants built from the entered size and color lists. The initial quantity is applied to each generated variant. Restocking selects one SKU and only increases that SKU. A demo order also decrements only the purchased SKU after all order lines pass stock validation.

The Admin Control Center also provides CSV export buttons for opening data in Excel. CSV files are exports; they are not a live Excel database connection.

## 5. Important comments in the code

- `// ...` and `/* ... */` are comments for people reading the source; the browser ignores them.
- A comment saying **demo** means that behavior is only simulated and must not be described as real payment/authentication/storage.
- `BBStore` functions are shared helpers. A page-specific file should call them instead of inventing a separate private cart or product array.
- `data-*` attributes such as `data-product-list` and `data-sku` are hooks used by JavaScript to find the right HTML elements.
- CSS class names such as `.product-card` link HTML elements to their visual styles.
- `id` values such as `cart-count` identify one element for JavaScript updates.

## 6. Run and verify

1. Extract the ZIP file into a folder.
2. Open the folder in VS Code.
3. Start **Live Server**, or run `python -m http.server 5500` in this folder.
4. Open `http://localhost:5500/`.
5. Follow the test checklist in `README.md` from product selection through the receipt.

Do not double-click the HTML file and use `file://` when testing the complete site; use an HTTP local server so page navigation and asset paths behave like a hosted website.

## 7. Do not treat the demo as a production store

The credentials are inside public JavaScript; the demo customer login is not secure; localStorage is not shared across unrelated browsers or devices; admin uploads do not upload to a cloud service; the three-session counter only works within the same browser profile/origin; contact messages do not send email; and no payment provider is connected. A production release needs a backend, database, secure server-checked sessions and permissions, secure file storage, and verified payment integration.
