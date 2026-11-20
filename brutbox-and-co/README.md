# BRUTBOX & CO. — Men's Essentials

A complete, responsive, backend-free static e-commerce storefront and store administration suite built with plain HTML, CSS, and vanilla JavaScript. All data persists locally in browser `localStorage`.

## Project Structure

- **Storefront & Policy Pages (16 HTML pages)**
  - `index.html` — Hero banner, 6 category tiles, New Arrivals, Best Sellers, promo strip
  - `products.html` — Full 60-item catalogue with live search, category filter chips, sorting, and Quick View modal
  - `product-details.html` — Image gallery with click/hover zoom, colour swatches, size selector + size guide, live stock status, wishlist button, reviews + submission form, and recently viewed strip
  - `cart.html` — Quantity steppers, remove item, promo code input (`WELCOME10`, `BRUT20`, `FREESHIP`), 5% VAT, ৳120 delivery (free over ৳3,000)
  - `checkout.html` — Bangladeshi phone & 64-district validation, Cash on Delivery / bKash / Nagad / Card simulation (`Demo payment, no real money is charged.`)
  - `receipt.html` — 80 mm printable thermal receipt
  - `track.html` — Order ID / tracking code + last 4 digits of phone lookup (`BB-1042` / `BBX7K4M2P9Q` + `3344`), 6-step timeline & courier display
  - `login.html`, `signup.html`, `account.html` — Customer authentication, password strength meter, order history, saved addresses, and wishlist
  - `admin-login.html` — Browser-only demo gate (`admin1` / `brut1234`, max 3 concurrent sessions)
  - `admin.html` — Dashboard KPIs, localStorage quota meter, 14-day SVG chart, compressed 1000×1000 image upload, product/stock matrix editing, orders status pipeline + stock restoration on cancel, review moderation, coupon management, CSV exports, and activity log
  - `inventory.html` — Variant-level SKU stock table, quick restock form, and activity log
  - `returns.html`, `shipping.html`, `contact.html` — Policy pages, validated inquiry form, and FAQ accordion
- **`css/`** — Modular stylesheets (`style.css`, `home.css`, `shop.css`, `preview.css`, `checkout.css`, `receipt.css`, `auth.css`, `track.css`, `inventory.css`, `admin.css`, `dark.css`, `motion.css`)
- **`js/`** — Vanilla JavaScript modules (`store-logic.js`, `catalog-data.js`, `orders.js`, `admin-core.js`, `admin-auth.js`, `admin.js`, `catalog-shop.js`, `preview.js`, `track.js`, `theme-mode.js`, `motion.js`, `main.js`)
- **`images/`** — Brand assets, banners, and product photos across all 6 categories

## Demo Credentials & Promo Codes

- **Admin Portal (`admin-login.html`)**: ID `admin1`, Password `brut1234` (maximum 3 active sessions).
- **Sample Order Tracking (`track.html`)**: Order `BB-1042` (or `BBX7K4M2P9Q`) with last 4 digits `3344`.
- **Promo Codes (`cart.html`)**:
  - `WELCOME10` — 10% off orders over ৳1,000
  - `BRUT20` — ৳500 off orders over ৳2,500
  - `FREESHIP` — ৳120 off delivery over ৳500
