# BRUTBOX & CO. — Complete Phase 1 Frontend Demo

A connected, commented HTML/CSS/JavaScript project based on your project idea. The homepage is banner-free and immediately shows categories and products.

## Important limits

This is a **frontend coursework demonstration**, not a production e-commerce system.

- Customer profiles and demo records are saved in the browser's `localStorage`/`sessionStorage`.
- Customer password fields are demonstration-only. Passwords are not saved or verified; login accepts a saved email and any non-empty demo password.
- Admin IDs/password are public values in `js/data.js` for coursework demonstration. Anyone can inspect frontend JavaScript. Never use them as real credentials.
- The three-admin-session counter and red fourth-login alert coordinate among tabs sharing the same browser profile and site origin only. They cannot coordinate between devices or different browsers. A backend is required for a real global limit.
- Images uploaded in Admin Control Center are converted to data URLs and stored in this browser only. They do not upload to GitHub/cloud and other visitors will not see them. Use files under 1 MB.
- Payment choices are simulated. No money is transferred and no provider is connected. Never enter payment PINs, card data or real credentials.
- Browser-local storage is not a central database and cannot reliably prevent overselling between devices.
- Contact form submissions are stored locally and no email is sent.

## Run locally

Recommended: open this folder in VS Code and use Live Server. Or run:

```bash
python -m http.server 5500
```

Then visit `http://localhost:5500/`. Using a local HTTP server is preferable to opening files directly with `file://`.

## Demo administrator accounts

IDs: `admin01`, `admin02`, `admin03`, `admin04`

Password for all: `Demo@123`

These are sample credentials. The browser-only session limit can be demonstrated by logging in to admin01, admin02 and admin03 in three separate tabs, then attempting admin04 in a fourth tab. The fourth attempt should be blocked and logged as a red alert in active admin dashboards.

## Page map

| Page | Function | Controller / connection |
|---|---|---|
| `index.html` | Banner-free homepage, category links, featured products | `js/catalog.js` |
| `products.html` | Search, category and stock filter, sorting | `js/catalog.js` |
| `product-details.html?id=P001` | Variant (size/color/SKU) selection and Add to Cart | `js/product-details.js` |
| `wishlist.html` | Saved products | `js/catalog.js` |
| `cart.html` | Quantity change, remove item and subtotal | `js/cart.js` |
| `signup.html` / `login.html` | Demo profile creation and returning customer sign-in | `js/auth.js` |
| `checkout.html` | Login gate, saved delivery info, coupons, demo payment and order snapshot | `js/checkout.js` |
| `receipt.html?orderId=...` | Print-friendly POS-style receipt | `js/receipt.js` |
| `admin-login.html` | Demo fixed admin list and concurrent-session limit | `js/admin-login.js` |
| `admin.html` | Product manager, coupons, branding, orders, activity, alerts and CSV export | `js/admin.js` |
| `inventory.html` | SKU stock, purchase/restock log, CSV export | `js/admin.js` |
| `about.html`, `contact.html`, `faq.html`, `shipping-policy.html`, `returns.html`, `privacy.html` | Essential business pages | `js/contact.js` for demo contact form |

## How HTML, CSS and JavaScript connect

1. Each HTML page links `css/style.css`, which controls fonts, colors, layout, responsive pages, forms and receipt printing.
2. Each page loads deferred scripts in order: `js/data.js` → `js/store.js` → `js/app.js` → that page's controller. Order matters because later scripts use variables and functions created earlier.
3. `js/data.js` defines the initial sample catalog, variant SKUs, coupons and demo admin accounts.
4. `js/store.js` defines `BBStore`, the single browser-local state layer. It handles products, variant stock, cart, wishlist, profiles, coupons, orders, branding, admin sessions, purchase records and CSV export.
5. `js/app.js` inserts the same header/footer throughout the site, displays the logo and cart count bubble, and listens for `bb:cartchange` to update the count.
6. Page-specific scripts handle page controls but call `BBStore` for shared data, keeping cart and stock consistent in this browser.

## Shared logic contracts

- Every size/color combination has its own SKU. The selected SKU follows the item from detail page to cart and order.
- Cart line structure: `{ productId, sku, qty }`.
- Checkout creates a saved order snapshot containing the selected product name, SKU, size/color, quantities, prices, discount, delivery and payment/order statuses.
- `BBStore.createOrder()` checks all SKUs before decrementing any stock. The receipt reads the saved snapshot so catalog price changes do not rewrite past demo receipts.
- Cart changes dispatch a `bb:cartchange` event; `app.js` listens for that event and refreshes the badge in the shared header.

## Coupon samples

- `WELCOME10`: 10% off orders of ৳500 or more.
- `ESSENTIALS100`: ৳100 off orders of ৳1,200 or more.

## Quick test plan

1. Shop page → search “socks” → change category and sort.
2. Open `P001`, choose Black/M, add 2, and check the header count and cart.
3. Update quantity and remove an item; verify the count updates.
4. Save a favorite and open Wishlist.
5. Create a demo customer account; continue to checkout and see saved delivery details prefilled on a returning sign-in.
6. Apply one sample coupon.
7. Complete demo checkout; confirm the notice says no real payment happened; print/save receipt.
8. Log in to Admin Control Center, create a product with multiple sizes/colors, then view it in the shop in the same browser.
9. Restock one SKU in Inventory & Purchases and verify only that SKU changes.
10. Export inventory/orders as CSV and open the files in Excel.
11. Test the three-session limit in separate tabs on the same browser profile.
12. Test on mobile width and test receipt printing.

## GitHub Pages

Commit the complete folder with `css/`, `js/`, `assets/`, all HTML files, and `README.md`. In GitHub use **Settings → Pages** and publish the repository root from the main branch. Keep relative asset paths and exact filename letter casing. GitHub Pages can serve static files; real authentication, shared stock, cloud image uploads, shared admin session limits and actual payment processing need backend/cloud services.
