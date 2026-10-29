# BRUTBOX & CO. — File Connection Map

```text
Any HTML page
  ├── css/style.css ───────────► layout, colors, fonts, forms, responsive design, print styles
  └── deferred scripts in this order
       js/data.js ─► js/store.js ─► js/app.js ─► page-specific module
                         │              │              │
                         │              ├──────────────┴─ shared header/footer, logo and cart bubble
                         │              └─ listens for bb:cartchange to refresh the item count
                         └─ browser-local demo state: products/variants, cart, wishlist, profiles, coupons, orders,
                            inventory/purchases, branding, admin sessions, security alerts and activity logs

Customer flow:
index/products → product-details.js → BBStore.addToCart() → cart.js → checkout.js
 → BBStore.validateCoupon() → BBStore.createOrder() → receipt.js

Admin flow:
admin-login.js → BBStore.startAdminSession() → admin.js / inventory.js
 → product/coupon/logo updates, stock purchases, CSV exports, orders, activity and security alerts
```

## Why the shared store matters
- A selected `sku` represents one specific size/color variant and is retained through cart and order.
- `js/store.js` is the single source of demo data; page modules should call it instead of maintaining private arrays.
- Cart changes emit `bb:cartchange`, which `js/app.js` listens for.
- Admin updates affect the public shop in the same browser because both use the same localStorage keys. They do not synchronize with other devices.
- The receipt uses a fixed order snapshot rather than recalculating with edited catalog data.
