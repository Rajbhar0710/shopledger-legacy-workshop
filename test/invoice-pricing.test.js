'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const pricing = require('../lib/pricing');
const tax = require('../lib/tax');
const invoice = require('../lib/invoice');

function item(overrides = {}) {
  return {
    id: 1,
    name: 'Rice',
    sku: 'RICE-1',
    hsn: '1006',
    price: 1000,
    qty: 1,
    ...overrides
  };
}

function order(overrides = {}) {
  return {
    id: 17,
    date: '22/11/2026',
    customer: 'Test customer',
    paymentMode: 'cash',
    status: 'completed',
    items: [item()],
    coupon: '',
    total: 1050,
    ...overrides
  };
}

test('CURRENT BEHAVIOUR: pricing applies the HSN slab and discounts before calculating GST', () => {
  const result = pricing.computeTotals([item()], 'SAVE10');

  assert.deepEqual(
    {
      subtotal: result.subtotal,
      discount: result.discount,
      taxable: result.taxable,
      tax: result.tax,
      cgst: result.cgst,
      sgst: result.sgst,
      total: result.total,
      line: result.lines[0]
    },
    {
      subtotal: 1000,
      discount: 100,
      taxable: 900,
      tax: 45,
      cgst: 22.5,
      sgst: 22.5,
      total: 945,
      line: {
        id: 1,
        name: 'Rice',
        hsn: '1006',
        gstPercent: 5,
        gross: 1000,
        discount: 100,
        taxable: 900,
        tax: 45,
        net: 945
      }
    }
  );
});

test('CURRENT BEHAVIOUR: tax uses an explicit gstRate before the HSN slab and otherwise falls back to 18%', () => {
  assert.equal(tax.getRateForItem(item()), 0.05);
  assert.equal(tax.getRateForItem(item({ gstRate: 12 })), 0.12);
  assert.equal(tax.getRateForItem(item({ gstRate: 0.12 })), 0.12);
  assert.equal(tax.getRateForItem(item({ hsn: '9999' })), 0.18);
});

test('invoice reproduces the billed total and GST breakdown for an HSN-rated WELCOME order', () => {
  const placed = item({ price: 640 });
  const billed = pricing.computeTotals([placed], 'WELCOME');
  const invoiceFigures = invoice.computeInvoiceFigures({
    items: [placed],
    coupon: 'WELCOME'
  });

  assert.deepEqual(billed, {
    subtotal: 640,
    discount: 32,
    taxable: 608,
    tax: 30.4,
    cgst: 15.2,
    sgst: 15.2,
    total: 638.4,
    lines: [{
      id: 1,
      name: 'Rice',
      hsn: '1006',
      gstPercent: 5,
      gross: 640,
      discount: 32,
      taxable: 608,
      tax: 30.4,
      net: 638.4
    }]
  });
  assert.deepEqual(invoiceFigures, {
    subtotal: billed.subtotal,
    discount: billed.discount,
    tax: billed.tax,
    cgst: billed.cgst,
    sgst: billed.sgst,
    total: billed.total,
    rows: [{
      name: 'Rice',
      sku: 'RICE-1',
      hsn: '1006',
      qty: 1,
      price: 640,
      gstPercent: 5,
      line: 640,
      lineTax: 30.4
    }]
  });
});

test('invoice applies the same capped coupon discount and GST as the billed pricing calculation', () => {
  const orderItems = [item({ price: 3000 })];
  const billed = pricing.computeTotals(orderItems, 'SAVE10');
  const figures = invoice.computeInvoiceFigures({
    items: orderItems,
    coupon: 'SAVE10'
  });

  assert.equal(billed.discount, 150);
  assert.equal(figures.tax, billed.tax);
  assert.equal(figures.discount, billed.discount);
  assert.equal(figures.total, billed.total);
});

test('rendered invoice does not show a reconciliation warning when its stored billed figures match pricing', () => {
  const pricedOrder = order({
    items: [item({ price: 640 })],
    coupon: 'WELCOME',
    subtotal: 640,
    discount: 32,
    tax: 30.4,
    total: 638.4
  });
  const html = invoice.render(pricedOrder);

  assert.match(html, /5%/);
  assert.match(html, /₹30\.40/);
  assert.match(html, /₹638\.40/);
  assert.doesNotMatch(html, /differs from Order Ledger recorded total/);
});
