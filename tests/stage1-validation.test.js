import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createCategorySchema,
  updateCategorySchema,
  verificationSchema,
} from '../src/validators/admin.validator.js';
import { storeInputSchema } from '../src/validators/stores.validator.js';

test('store input accepts contract fields and rejects verification fields', () => {
  const store = {
    name: 'Roti Pagi',
    business_type: 'bakery',
    address: 'Jl. Melati 1',
    latitude: -7.8,
    longitude: 110.3,
    contact_phone: '08123456789',
  };

  assert.equal(storeInputSchema.safeParse(store).success, true);
  assert.equal(storeInputSchema.safeParse({ ...store, verification_status: 'approved' }).success, false);
  assert.equal(storeInputSchema.safeParse({
    ...store,
    opening_hours: [{ day: 'mon', open: '08:00', close: '17:00' }],
  }).success, true);
  assert.equal(storeInputSchema.safeParse({
    ...store,
    opening_hours: [{ day: 'mon', open: '08:00' }],
  }).success, false);
});

test('rejected and suspended stores require a reason', () => {
  assert.equal(verificationSchema.safeParse({ status: 'approved' }).success, true);
  assert.equal(verificationSchema.safeParse({ status: 'rejected' }).success, false);
  assert.equal(verificationSchema.safeParse({ status: 'suspended', reason: 'Dokumen tidak valid' }).success, true);
});

test('category creation requires a name and category updates cannot be empty', () => {
  assert.equal(createCategorySchema.safeParse({ name: 'Roti' }).success, true);
  assert.equal(createCategorySchema.safeParse({ name: 'Roti', id: 'untrusted' }).success, false);
  assert.equal(updateCategorySchema.safeParse({}).success, false);
  assert.equal(updateCategorySchema.safeParse({ icon: 'bread' }).success, true);
});