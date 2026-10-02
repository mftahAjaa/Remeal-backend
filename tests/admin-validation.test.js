import assert from 'node:assert/strict';
import test from 'node:test';
import {
  listUsersQuerySchema,
  platformSettingsSchema,
  updateComplaintSchema,
  updateUserSchema,
} from '../src/validators/admin.validator.js';

test('admin filters accept supported roles and reject unsupported values', () => {
  assert.equal(listUsersQuerySchema.safeParse({ role: 'seller', page: '2' }).success, true);
  assert.equal(listUsersQuerySchema.safeParse({ role: 'owner' }).success, false);
});

test('admin updates are limited to contract fields', () => {
  assert.equal(updateUserSchema.safeParse({ is_active: false }).success, true);
  assert.equal(updateUserSchema.safeParse({ role: 'super_admin' }).success, false);
  assert.equal(platformSettingsSchema.safeParse({ payment_expiry_minutes: 20 }).success, true);
  assert.equal(platformSettingsSchema.safeParse({ platform_fee_percent: 101 }).success, false);
});

test('complaint status update matches the contract', () => {
  assert.equal(updateComplaintSchema.safeParse({ status: 'resolved' }).success, true);
  assert.equal(updateComplaintSchema.safeParse({ status: 'open' }).success, false);
});