import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';

process.env.SUPABASE_URL = 'https://test-project.supabase.co';
process.env.SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';

const { default: app } = await import('../src/app.js');
let server;
let baseUrl;

before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
});

test('all 28 PRD operations reject requests without a bearer token', async () => {
  const operations = [
    ['POST', '/api/v1/stores'],
    ['GET', '/api/v1/stores/me'],
    ['PATCH', '/api/v1/stores/me'],
    ['GET', '/api/v1/admin/stores'],
    ['PATCH', '/api/v1/admin/stores/124e4567-e89b-12d3-a456-426614174000/verification'],
    ['POST', '/api/v1/admin/categories'],
    ['PATCH', '/api/v1/admin/categories/124e4567-e89b-12d3-a456-426614174000'],
    ['DELETE', '/api/v1/admin/categories/124e4567-e89b-12d3-a456-426614174000'],
    ['GET', '/api/v1/seller/products'],
    ['POST', '/api/v1/seller/products'],
    ['PATCH', '/api/v1/seller/products/124e4567-e89b-12d3-a456-426614174000'],
    ['DELETE', '/api/v1/seller/products/124e4567-e89b-12d3-a456-426614174000'],
    ['POST', '/api/v1/seller/products/124e4567-e89b-12d3-a456-426614174000/close'],
    ['GET', '/api/v1/seller/dashboard'],
    ['GET', '/api/v1/seller/stock-reminders'],
    ['GET', '/api/v1/admin/dashboard'],
    ['GET', '/api/v1/admin/users'],
    ['PATCH', '/api/v1/admin/users/124e4567-e89b-12d3-a456-426614174000'],
    ['DELETE', '/api/v1/admin/users/124e4567-e89b-12d3-a456-426614174000'],
    ['GET', '/api/v1/admin/orders'],
    ['GET', '/api/v1/admin/complaints'],
    ['PATCH', '/api/v1/admin/complaints/124e4567-e89b-12d3-a456-426614174000'],
    ['GET', '/api/v1/admin/settings'],
    ['PATCH', '/api/v1/admin/settings'],
    ['GET', '/api/v1/seller/reviews'],
    ['POST', '/api/v1/seller/reviews/124e4567-e89b-12d3-a456-426614174000/reply'],
    ['GET', '/api/v1/admin/review-reports'],
    ['PATCH', '/api/v1/admin/reviews/124e4567-e89b-12d3-a456-426614174000/moderation'],
  ];

  assert.equal(operations.length, 28);
  for (const [method, path] of operations) {
    const response = await fetch(`${baseUrl}${path}`, { method });
    const body = await response.json();
    assert.equal(response.status, 401, `${method} ${path} should require authentication`);
    assert.deepEqual(Object.keys(body).sort(), ['code', 'details', 'message']);
  }
});