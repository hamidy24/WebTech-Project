import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const logic = require('../public/js/store-logic.js');

test('delivery is 120 under 3000, free at 3000+, and 5% VAT applies to discounted subtotal', () => {
  const under = logic.computeCartTotals([{ id: 'p-uw-01', price: 1000, qty: 2 }], null);
  assert.equal(under.subtotal, 2000);
  assert.equal(under.delivery, 120);
  assert.equal(under.tax, 100); // 5% of 2000
  assert.equal(under.total, 2220);

  const free = logic.computeCartTotals([{ id: 'p-wl-01', price: 3200, qty: 1 }], null);
  assert.equal(free.subtotal, 3200);
  assert.equal(free.delivery, 0);
  assert.equal(free.tax, 160); // 5% of 3200
  assert.equal(free.total, 3360);
});

test('coupon rules: WELCOME10, BRUT20, FREESHIP, minimum spend errors, disabled coupons', () => {
  const welcomeOk = logic.validateCoupon('welcome10', 1200);
  assert.equal(welcomeOk.ok, true);
  const t1 = logic.computeCartTotals([{ price: 1200, qty: 1 }], welcomeOk.coupon);
  assert.equal(t1.discount, 120); // 10% off 1200
  assert.equal(t1.taxable, 1080);
  assert.equal(t1.tax, 54); // 5% of 1080
  assert.equal(t1.delivery, 120);
  assert.equal(t1.total, 1254);

  const brutFail = logic.validateCoupon('BRUT20', 2000);
  assert.equal(brutFail.ok, false);
  assert.match(brutFail.error, /500/);

  const brutOk = logic.validateCoupon('BRUT20', 2500);
  assert.equal(brutOk.ok, true);
  const t2 = logic.computeCartTotals([{ price: 2500, qty: 1 }], brutOk.coupon);
  assert.equal(t2.discount, 500);
  assert.equal(t2.taxable, 2000);
  assert.equal(t2.tax, 100);
  assert.equal(t2.delivery, 120);
  assert.equal(t2.total, 2220);

  const shipOk = logic.validateCoupon('FREESHIP', 800);
  assert.equal(shipOk.ok, true);
  const t3 = logic.computeCartTotals([{ price: 800, qty: 1 }], shipOk.coupon);
  assert.equal(t3.discount, 0);
  assert.equal(t3.delivery, 0);
  assert.equal(t3.tax, 40);
  assert.equal(t3.total, 840);

  const disabled = logic.validateCoupon('VIP20', 5000, [
    { code: 'VIP20', type: 'percent', value: 20, minSpend: 1000, enabled: false }
  ]);
  assert.equal(disabled.ok, false);
  assert.match(disabled.error, /disabled/i);

  const invalid = logic.validateCoupon('NOPE', 5000);
  assert.equal(invalid.ok, false);
});

test('Bangladeshi mobile validation accepts 01XXXXXXXXX and +8801XXXXXXXXX', () => {
  assert.equal(logic.isValidBDPhone('01711223344'), true);
  assert.equal(logic.isValidBDPhone('+8801812345678'), true);
  assert.equal(logic.isValidBDPhone('+88 01911-223344'), true);
  assert.equal(logic.isValidBDPhone('01112345678'), false);
  assert.equal(logic.isValidBDPhone('12345'), false);
});

test('password strength evaluator requires 8+ chars and character variety', () => {
  assert.equal(logic.evaluatePassword('abc').valid, false);
  assert.equal(logic.evaluatePassword('abcdefgh').valid, false);
  assert.equal(logic.evaluatePassword('Brutbox1').valid, true);
  assert.equal(logic.evaluatePassword('Brutbox#2026').label, 'Strong');
});

test('product filtering, sorting, and stock deduction/restoration work accurately', () => {
  const sample = [
    {
      id: 'p-1', name: 'Silk Bow Tie', category: 'bow-ties', description: 'Hand-rolled silk tie',
      price: 2100, rating: 4.9, reviewCount: 20, createdAt: '2026-10-12', hidden: false,
      stock: { Black: { 'One Size': 10 } }
    },
    {
      id: 'p-2', name: 'Cotton Briefs', category: 'underwear', description: 'Combed cotton briefs',
      price: 1200, rating: 4.6, reviewCount: 40, createdAt: '2026-10-18', hidden: false,
      stock: { Black: { M: 5 } }
    },
    {
      id: 'p-3', name: 'Hidden Item', category: 'underwear', description: 'Hidden',
      price: 500, rating: 5, reviewCount: 1, createdAt: '2026-10-20', hidden: true,
      stock: { Black: { M: 10 } }
    }
  ];

  const bySearch = logic.filterAndSortProducts(sample, { query: 'hand-rolled' });
  assert.equal(bySearch.length, 1);
  assert.equal(bySearch[0].id, 'p-1');

  const sortedLow = logic.filterAndSortProducts(sample, { sort: 'price-asc' });
  assert.deepEqual(sortedLow.map((p: { id: string }) => p.id), ['p-2', 'p-1']);

  const deducted = logic.deductStockFromProducts(sample, [{ id: 'p-2', color: 'Black', size: 'M', qty: 2 }]);
  assert.equal(logic.stockForVariant(deducted[1], 'Black', 'M'), 3);

  const restored = logic.restoreStockToProducts(deducted, [{ id: 'p-2', color: 'Black', size: 'M', qty: 2 }]);
  assert.equal(logic.stockForVariant(restored[1], 'Black', 'M'), 5);
});
