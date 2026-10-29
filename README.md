# BRUTBOX & CO. — Phase 01 Browser Demo

A responsive academic prototype for a men's essentials e-commerce storefront. The pages use HTML, CSS and JavaScript; demo data is stored in the current browser's `localStorage`.

## Prototype scope and limitations
- **Included:** 10 HTML pages, 8 CSS stylesheets and shared JavaScript for SKU-level product stock, cart and coupon totals, demo sign-in, checkout validation, order snapshots, printable receipts, admin inventory/coupon/order tools, CSV export and product image uploads.
- **Browser-only:** data is local to one browser profile and is not shared across devices. Clearing site storage removes it.
- **Not production-ready:** admin access is simulated, the three-session limit is only a browser demo, and no payment gateway or real authentication exists. Do not enter real credentials or payment details.
- Product and price values, shipping fee (BDT 70), and coupons are sample values.

## Open locally
Open `index.html` with a browser, or start a local HTTP server:

```powershell
cd C:\path\to\brutbox-co
py -m http.server 5500
```

Then visit `http://localhost:5500/`. JavaScript modules use browser storage and work best from a local HTTP server rather than opening files directly.

## Publish on GitHub Pages
1. Place all files in the **repository root** with the `css` directory intact.
2. GitHub repository **Settings → Pages → Deploy from a branch**.
3. Choose **main** and **/(root)**, then save.
4. Expected site: `https://hamidy24.github.io/WebTech-Project/` after deployment.

## Page map
| HTML | UI purpose |
|---|---|
| `index.html` | Home, hero, categories, featured items |
| `products.html` | Catalog with anchored categories |
| `product-details.html` | Seven URL-anchor-selectable product panels and example variants |
| `cart.html` | Browser-persisted cart, SKU quantities, coupon and calculated totals |
| `login.html` / `signup.html` | Account interface only |
| `checkout.html` | Demo sign-in, validated delivery details and COD/bKash/Nagad/Card selection |
| `receipt.html` | Saved order snapshot and 80 mm printable receipt (Ctrl+P) |
| `admin.html` | Simulated three-session admin with Orders, Inventory, Coupons and Database tabs |
| `inventory.html` | Twelve sample SKUs with browser-only restocking |

## Stylesheet order
- All pages load `css/style.css` first and `css/app.css` before `css/responsive.css`.
- `index.html` also loads `css/home.css`.
- `login.html` and `signup.html` also load `css/auth.css`.
- `checkout.html` also loads `css/checkout.css`.
- `admin.html` and `inventory.html` also load `css/inventory.css`.
- `receipt.html` also loads `css/receipt.css`.
- Every page loads `css/responsive.css` **last**, followed by `js/data.js` and `js/app.js` before the closing body tag.

## Future phases
Phase 02 can replace browser storage and simulated sign-in with a secure API and database. Phase 03 can integrate and verify a real payment gateway. The current prototype must not be described as a production-ready store.
