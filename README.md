# BRUTBOX & CO. — Men's Essentials

A responsive storefront and admin control centre for men's essentials, built with HTML, CSS and vanilla JavaScript. No server is needed to run it.

## Pages

| Page | What it does |
|---|---|
| `index.html` | Home: hero, six category tiles with photos, new arrivals |
| `products.html` | The shop: all six categories, filter bar, quick view on every product |
| `product-details.html` | Detailed product view (sample layout) |
| `cart.html` | Shopping bag: quantities, coupon code, VAT and delivery totals |
| `track.html` | Order tracking: look up an order by number or tracking code, with the phone's last 4 digits |
| `checkout.html` | Delivery details, payment method, dummy-payment warning |
| `receipt.html` | 80 mm printable receipt |
| `login.html`, `signup.html` | Account forms (layout and validation) |
| `inventory.html` | Stock table and restock form (sample) |
| `admin-login.html`, `admin.html` | Admin sign-in (max 3 sessions) and control centre, including Orders & delivery |

## Categories and products

Six categories with ten styles each, every style in three colours:
Underwear, Bow Ties, Pocket Squares, Men's Socks, Wallets, Eyeglass Cases.

- Product data: `js/catalog-data.js` (60 products: names, descriptions, prices, colours, sizes, stock)
- Pictures: this version has no product photos. Products show text placeholders. Only the brand logo (`images/brand/`) and the two banners (`images/banner/`) are included.

## Shop rules

- Delivery: ৳120, free on orders of ৳3,000 or more
- VAT: 5% on the discounted subtotal
- Coupons: `WELCOME10` (10% over ৳1,000), `BRUT20` (৳500 over ৳2,500), `FREESHIP` (৳120 off delivery over ৳500)

## Run it

Open `index.html` in a browser, or publish the folder with GitHub Pages or Firebase Hosting.

## Data storage (demo)

Products, orders and admin changes are saved in each browser's localStorage. Admin sign-in is a browser-only demo gate, not real security. For shared data and real accounts, connect a database such as Firestore and Firebase Authentication.

## Tests

The `tests` checks cover the admin panel, the bag, the quick view, and the motion scripts. They run in a headless DOM with Node.js and jsdom.

## Order tracking

Each order moves through the steps of a parcel delivery: placed, confirmed, packed, shipped, out for delivery, delivered (or cancelled before it ships). Staff move orders on in **Orders & delivery** in the admin. When an order is shipped, a courier is assigned. Customers see every change on `track.html`, using the order number or tracking code and the last four digits of their phone.

Orders are stored in the browser (`js/orders.js`). A real parcel system needs a shared database so that tracking works on any device.
