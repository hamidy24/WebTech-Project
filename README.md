# BRUTBOX & CO. - Men's Essentials E-Commerce Website (Phase 01)

Academic project by a four-member team. Phase 01 is a front-end prototype built with
**HTML, CSS and JavaScript** only. Products, stock, cart, login, orders and receipts
work in the browser (localStorage). There is no real payment and no secure login yet.

## Live website
`https://hamidy24.github.io/brutbox-co/`  (see "Publish with GitHub Pages" below)

## Run on your computer
1. Open the `brutbox-co` folder in VS Code.
2. Install the **Live Server** extension, then right-click `index.html` -> *Open with Live Server*.
   (Do not double-click the HTML files: the browser blocks `data/products.json` that way.)

## Demo accounts
| Role | How to log in |
|---|---|
| Customer | any valid email + a password of 6 or more characters |
| Admin | `admin@brutbox.test` + any password of 6 or more characters |

## Folder structure
```
brutbox-co/
├── index.html  products.html  product-details.html  cart.html
├── login.html  signup.html  checkout.html  receipt.html
├── admin.html  inventory.html
├── css/   style.css  home.css  checkout.css  app.css  responsive.css
├── js/    main.js  stock.js  navbar.js  catalog.js  products.js
│          cart.js  auth.js  payment.js  receipt.js  admin.js  inventory.js
├── data/  products.json
└── assets/  logo/  icons/  products/<category>/
```

## Who owns what
| Member | Files |
|---|---|
| 01 Storefront & Navigation | index.html, products.html, home.css, navbar.js, catalog.js (and main.js core) |
| 02 Product Details & Inventory | product-details.html, inventory.html, products.js, stock.js, inventory.js, data/products.json |
| 03 Accounts & Cart | login.html, signup.html, cart.html, auth.js, cart.js |
| 04 Checkout, Receipts & Admin Orders | checkout.html, receipt.html, admin.html, checkout.css, payment.js, receipt.js, admin.js |

## Add your product photos
1. Copy each photo into `assets/products/<category>/` (underwear, bow-ties, pocket-squares, socks, eyeglass-cases, wallets).
2. Use lowercase names without spaces, e.g. `cotton-boxer-black-1.jpg`.
3. In `data/products.json` set the product's `"image"` path to that file. If a photo is missing, a coloured placeholder is shown.
4. After changing `products.json`, change `DATA_VERSION` in `js/main.js` (e.g. `"2026-10-v2"`) so browsers reload the new data.

## Publish with GitHub Pages
1. Create a GitHub repository named `brutbox-co` (Public).
2. Upload everything inside this folder (keep the folders). `index.html` must be at the top level.
3. Repository **Settings -> Pages -> Build and deployment -> Source: Deploy from a branch -> Branch: main, folder: / (root) -> Save**.
4. Wait 1-3 minutes. Your site is at `https://<username>.github.io/brutbox-co/`.
5. After any change: commit to `main` again and refresh the page after a minute.

## Known limitations (Phase 01)
- Login, admin access, stock and orders are stored in the browser only: not secure, not shared between devices.
- Payment methods (COD, bKash, Nagad, card) are demo choices; every order stays **Payment: Pending**.
- Secure backend, central database and a real payment gateway are Phase 02 and Phase 03.
