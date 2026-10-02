process.env.SUPABASE_URL ??= 'http://127.0.0.1:54321';
process.env.SUPABASE_ANON_KEY ??= 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY ??= 'test-service-role-key';

import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { supabaseAdmin } = await import('../src/config/supabase.js');
const { createOrder, cancelOrder } = await import('../src/services/orders.service.js');
const { getOrder } = await import('../src/services/orders.service.js');
const { searchProducts } = await import('../src/services/products.service.js');
const { storesQuerySchema } = await import('../src/validators/stores.validator.js');
const { productsQuerySchema } = await import('../src/validators/products.validator.js');
const { createOrderSchema } = await import('../src/validators/orders.validator.js');
const app = (await import('../src/app.js')).default;

test('catalog and order query schemas reject invalid filters', () => {
  assert.equal(storesQuerySchema.safeParse({ latitude: '1' }).success, false);
  assert.equal(productsQuerySchema.safeParse({ min_price: '20', max_price: '10' }).success, false);
  assert.equal(productsQuerySchema.safeParse({ latitude: '1', longitude: '2' }).success, true);
  assert.equal(createOrderSchema.safeParse({
    product_id: '00000000-0000-0000-0000-000000000001',
    quantity: 1.5,
  }).success, false);
});

test('createOrder forwards verified consumer ID and fields to the SQL function', async () => {
  const originalRpc = supabaseAdmin.rpc;
  let invocation;
  supabaseAdmin.rpc = async (name, args) => {
    invocation = { name, args };
    return { data: { id: 'order-id' }, error: null };
  };

  try {
    const result = await createOrder('consumer-id', {
      product_id: 'product-id',
      quantity: 2,
      note: 'Catatan',
    });
    assert.equal(result.id, 'order-id');
    assert.deepEqual(invocation, {
      name: 'create_order',
      args: {
        p_consumer: 'consumer-id',
        p_product: 'product-id',
        p_quantity: 2,
        p_note: 'Catatan',
      },
    });
  } finally {
    supabaseAdmin.rpc = originalRpc;
  }
});

test('cancelOrder forwards owner and order IDs to the SQL function', async () => {
  const originalRpc = supabaseAdmin.rpc;
  let invocation;
  supabaseAdmin.rpc = async (name, args) => {
    invocation = { name, args };
    return { data: { id: 'order-id', status: 'cancelled' }, error: null };
  };

  try {
    await cancelOrder('consumer-id', 'order-id');
    assert.deepEqual(invocation, {
      name: 'cancel_order',
      args: { p_consumer: 'consumer-id', p_order: 'order-id' },
    });
  } finally {
    supabaseAdmin.rpc = originalRpc;
  }
});

test('route index includes 29 Orang A operations and QR route precedes order ID route', () => {
  const routesDirectory = path.join(projectRoot, 'src', 'routes');
  const routeFiles = readdirSync(routesDirectory).filter((file) => file.endsWith('.routes.js'));
  const routeCount = routeFiles.reduce((count, file) => {
    const source = readFileSync(path.join(routesDirectory, file), 'utf8');
    return count + (source.match(/\brouter\.(get|post|patch|put|delete)\s*\(/g) ?? []).length;
  }, 0);
  const sellerOrdersRoutes = readFileSync(path.join(routesDirectory, 'seller-orders.routes.js'), 'utf8');

  assert.equal(routeCount, 29);
  assert.ok(sellerOrdersRoutes.indexOf("'/seller/orders/verify-qr'") < sellerOrdersRoutes.indexOf("'/seller/orders/:orderId'"));
});

test('searchProducts uses the public search RPC and returns pagination metadata', async () => {
  const originalRpc = supabaseAdmin.rpc;
  let invocation;
  supabaseAdmin.rpc = async (name, args) => {
    invocation = { name, args };
    return {
      data: [{ id: 'product-id', total_count: 3, distance_km: 1.2 }],
      error: null,
    };
  };

  try {
    const result = await searchProducts({ page: 2, limit: 1, sort: 'nearest' });
    assert.deepEqual(invocation, {
      name: 'search_products',
      args: {
        p_q: null,
        p_category_id: null,
        p_min_price: null,
        p_max_price: null,
        p_min_rating: null,
        p_lat: null,
        p_lng: null,
        p_radius_km: 5,
        p_sort: 'nearest',
        p_page: 2,
        p_limit: 1,
      },
    });
    assert.deepEqual(result, {
      data: [{ id: 'product-id', distance_km: 1.2 }],
      meta: { page: 2, limit: 1, total: 3 },
    });
  } finally {
    supabaseAdmin.rpc = originalRpc;
  }
});

test('getOrder scopes reads to the authenticated consumer', async () => {
  const originalFrom = supabaseAdmin.from;
  const filters = [];
  const query = {
    select() { return this; },
    eq(field, value) { filters.push([field, value]); return this; },
    maybeSingle() { return Promise.resolve({ data: null, error: null }); },
  };
  supabaseAdmin.from = (table) => {
    assert.equal(table, 'orders');
    return query;
  };

  try {
    await assert.rejects(getOrder('consumer-a', 'order-b'), (error) => error.status === 404);
    assert.deepEqual(filters, [['id', 'order-b'], ['consumer_id', 'consumer-a']]);
  } finally {
    supabaseAdmin.from = originalFrom;
  }
});

test('public catalog validation and protected order routes are wired through the app', async () => {
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}/api/v1`;

  try {
    const invalidCatalog = await fetch(`${baseUrl}/stores?latitude=1`);
    assert.equal(invalidCatalog.status, 422);

    const protectedOrders = await fetch(`${baseUrl}/orders`, { method: 'GET' });
    assert.equal(protectedOrders.status, 401);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});