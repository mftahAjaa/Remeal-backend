import assert from 'node:assert/strict';
import test from 'node:test';
import { replyReviewSchema } from '../src/validators/reviews.validator.js';
import { moderateReviewSchema } from '../src/validators/admin.validator.js';

test('seller review replies are capped at 500 characters', () => {
  assert.equal(replyReviewSchema.safeParse({ reply: 'Terima kasih.' }).success, true);
  assert.equal(replyReviewSchema.safeParse({ reply: 'x'.repeat(501) }).success, false);
});

test('moderation accepts only contract actions', () => {
  assert.equal(moderateReviewSchema.safeParse({ action: 'hide' }).success, true);
  assert.equal(moderateReviewSchema.safeParse({ action: 'remove' }).success, false);
});