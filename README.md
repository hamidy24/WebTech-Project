# BRUTBOX & CO. — Phase 01 (HTML + CSS Only)

A responsive, modern academic concept for a men's essentials e-commerce storefront.

## Scope (IMPORTANT)
- **Included:** 10 standalone HTML pages, 7 CSS stylesheets, linked navigation, visually selectable size/color radio inputs, a static checkout/payment selection UI, an example receipt, and a sample admin/inventory dashboard.
- **Not included:** JavaScript, a functional shopping cart, search/filter calculations, authentication, persistent stock, order confirmation, payment processing, or a database.
- Do not enter real passwords or payment data. All form fields are for demonstration only.

## Open locally
Open `index.html` with a browser, or start a local HTTP server:

```powershell
cd C:\path\to\brutbox-co
py -m http.server 5500
```

Then visit `http://localhost:5500/`.

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
| `cart.html` | Fixed example cart and totals |
| `login.html` / `signup.html` | Account interface only |
| `checkout.html` | Static delivery details and selectable COD/bKash/Nagad/Card options |
| `receipt.html` | Sample 80 mm printable receipt (Ctrl+P) |
| `admin.html` | Static dashboard and example orders |
| `inventory.html` | Twelve sample SKUs and nonfunctional restock form |

## Stylesheet order
- All pages load `css/style.css` first.
- `index.html` also loads `css/home.css`.
- `login.html` and `signup.html` also load `css/auth.css`.
- `checkout.html` also loads `css/checkout.css`.
- `admin.html` and `inventory.html` also load `css/inventory.css`.
- `receipt.html` also loads `css/receipt.css`.
- Every page loads `css/responsive.css` **last**.

## Future phases
Add JavaScript for interactive cart and variant calculations, then a secure backend/database and verified payment integration. Do not describe this HTML/CSS prototype as a production-ready store.
