const test = require('node:test');
const assert = require('node:assert/strict');

const { normalizeProductRow } = require('../lib/product-utils');

test('normalizeProductRow keeps required fields and derives safe links', () => {
  const product = normalizeProductRow({
    name: 'Example TV',
    category: 'TV',
    retailer: 'Amazon UK',
    price: '199.99',
    wasPrice: '249.99',
    image: 'https://example.com/tv.jpg',
    affiliateUrl: 'https://www.amazon.co.uk/dp/B123456789',
    asin: 'B123456789'
  }, 1, 'test-tag');

  assert.equal(product.name, 'Example TV');
  assert.equal(product.category, 'TV');
  assert.equal(product.price, 199.99);
  assert.equal(product.wasPrice, 249.99);
  assert.equal(product.affiliateUrl, 'https://www.amazon.co.uk/dp/B123456789?tag=test-tag');
  assert.equal(product.asin, 'B123456789');
});

test('normalizeProductRow prefers an ASIN product link when no affiliate URL exists', () => {
  const product = normalizeProductRow({
    name: 'Air fryer',
    price: '89.95',
    asin: 'B222222222'
  }, 2, 'test-tag');

  assert.match(product.affiliateUrl, /amazon\.co\.uk\/dp\/B222222222/);
  assert.match(product.affiliateUrl, /tag=test-tag/);
});

test('normalizeProductRow falls back to Amazon search when ASIN is missing', () => {
  const product = normalizeProductRow({
    name: 'Air fryer',
    price: '89.95'
  }, 3, 'test-tag');

  assert.match(product.affiliateUrl, /amazon\.co\.uk\/s\?k=Air\+fryer/);
  assert.match(product.affiliateUrl, /tag=test-tag/);
});
