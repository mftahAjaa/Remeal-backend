import assert from 'node:assert/strict';
import test from 'node:test';
import { productInputSchema } from '../src/validators/products.validator.js';

const validProduct = {
  name: 'Roti Sore',
  category_id: '124e4567-e89b-12d3-a456-426614174000',
  normal_price: 20000,
  discount_price: 15000,
  stock: 8,
  sale_start_at: '2030-01-01T15:00:00Z',
  order_deadline_at: '2030-01-01T18:00:00Z',
  pickup_deadline_at: '2030-01-01T19:00:00Z',
};

test('product input accepts valid contract data', () => {
  assert.equal(productInputSchema.safeParse(validProduct).success, true);
});

test('product input rejects invalid price and deadline order', () => {
  assert.equal(productInputSchema.safeParse({ ...validProduct, discount_price: 21000 }).success, false);
  assert.equal(productInputSchema.safeParse({
    ...validProduct,
    order_deadline_at: '2030-01-01T14:00:00Z',
  }).success, false);
  assert.equal(productInputSchema.safeParse({
    ...validProduct,
    pickup_deadline_at: '2030-01-01T17:00:00Z',
  }).success, false);
});