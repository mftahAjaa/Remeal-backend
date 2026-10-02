import assert from 'node:assert/strict';
import { createHmac, randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { parse } from 'dotenv';
import { test } from 'node:test';
import { createClient } from '@supabase/supabase-js';

const localEnv = parse(readFileSync(new URL('../.env', import.meta.url)));
for (const key of ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY']) {
  if (!localEnv[key]) throw new Error(`Missing ${key} in local .env`);
}
Object.assign(process.env, localEnv);
process.env.PAYMENT_PROVIDER = 'mock';
process.env.WEBHOOK_SECRET = `integration-${randomUUID()}`;

const { supabaseAdmin } = await import('../src/config/supabase.js');
const app = (await import('../src/app.js')).default;

async function createTestUser(role, suffix) {
  const email = `remeal-${suffix}-${randomUUID()}@example.com`;
  const password = `ReMeal-${randomUUID()}-Aa9!`;
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: `ReMeal ${role} integration test`,
      role,
    },
  });

  if (error) throw new Error(`Unable to create integration user (${error.code}).`);

  const client = createClient(localEnv.SUPABASE_URL, localEnv.SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
  const { data: sessionData, error: signInError } = await client.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError || !sessionData.session) {
    throw new Error(`Unable to sign in integration user (${signInError?.code ?? 'no_session'}).`);
  }

  return { id: data.user.id, token: sessionData.session.access_token };
}

async function createTestProduct(storeId, categoryId, stock, suffix) {
  const now = Date.now();
  const { data, error } = await supabaseAdmin
    .from('products')
    .insert({
      store_id: storeId,
      category_id: categoryId,
      name: `Integration ${suffix} ${randomUUID()}`,
      description: 'Temporary automated integration fixture.',
      normal_price: 10000,
      discount_price: 5000,
      stock,
      sale_start_at: new Date(now - 60_000).toISOString(),
      order_deadline_at: new Date(now + 3 * 60 * 60_000).toISOString(),
      pickup_deadline_at: new Date(now + 5 * 60 * 60_000).toISOString(),
    })
    .select('id')
    .single();

  if (error) throw new Error(`Unable to create integration product (${error.code}).`);
  return data.id;
}

async function cleanFixture(fixture) {
  const failures = [];
  const deleteRows = async (table, column, ids) => {
    if (ids.length === 0) return;
    const { error } = await supabaseAdmin.from(table).delete().in(column, ids);
    if (error) failures.push(`${table}:${error.code}`);
  };

  await deleteRows('complaints', 'id', fixture.complaintIds);
  await deleteRows('reviews', 'id', fixture.reviewIds);
  await deleteRows('orders', 'id', fixture.orderIds);
  await deleteRows('products', 'id', fixture.productIds);
  await deleteRows('stores', 'id', fixture.storeIds);

  for (const userId of fixture.userIds.reverse()) {
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) failures.push(`auth.users:${error.code}`);
  }

  if (failures.length > 0) {
    throw new Error(`Integration fixture cleanup failed: ${failures.join(', ')}.`);
  }
}

async function apiRequest(baseUrl, method, route, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${baseUrl}${route}`, {
    method,
    headers,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  return { status: response.status, body: await response.json() };
}

async function payWithMockWebhook(baseUrl, consumerToken, orderId) {
  const payment = await apiRequest(
    baseUrl,
    'POST',
    `/orders/${orderId}/payment`,
    { method: 'qris' },
    consumerToken,
  );
  assert.equal(payment.status, 201);

  const { data, error } = await supabaseAdmin
    .from('payments')
    .select('external_id')
    .eq('order_id', orderId)
    .single();
  assert.ifError(error);

  const unsignedPayload = { external_id: data.external_id, status: 'paid' };
  const signature = createHmac('sha256', process.env.WEBHOOK_SECRET)
    .update(JSON.stringify(unsignedPayload))
    .digest('hex');
  const webhook = await apiRequest(
    baseUrl,
    'POST',
    '/payments/webhook',
    { ...unsignedPayload, signature },
  );
  assert.equal(webhook.status, 200);

  return { payment: payment.body, externalId: data.external_id };
}

async function expectRpcError(functionName, args, expectedMessage) {
  const { error } = await supabaseAdmin.rpc(functionName, args);
  assert.ok(error, `${functionName} unexpectedly succeeded`);
  assert.match(error.message, new RegExp(expectedMessage));
}

test('Supabase Orang A schema, public endpoints, and non-mutating RPC errors', async () => {
  const { data: settings, error: settingsError } = await supabaseAdmin
    .from('platform_settings')
    .select('id, review_edit_window_hours')
    .eq('id', 1)
    .maybeSingle();
  assert.ifError(settingsError);
  assert.equal(settings?.id, 1);

  const { count: categoryCount, error: categoriesError } = await supabaseAdmin
    .from('categories')
    .select('id', { count: 'exact', head: true });
  assert.ifError(categoriesError);
  assert.ok(categoryCount >= 0);

  const { error: storesRpcError } = await supabaseAdmin.rpc('nearby_stores', {
    p_lat: null,
    p_lng: null,
    p_radius_km: 5,
    p_page: 1,
    p_limit: 1,
  });
  assert.ifError(storesRpcError);

  const { error: productsRpcError } = await supabaseAdmin.rpc('search_products', {
    p_q: null,
    p_category_id: null,
    p_min_price: null,
    p_max_price: null,
    p_min_rating: null,
    p_lat: null,
    p_lng: null,
    p_radius_km: 5,
    p_sort: 'nearest',
    p_page: 1,
    p_limit: 1,
  });
  assert.ifError(productsRpcError);

  const unknownId = '00000000-0000-0000-0000-000000000000';
  const unknownKey = `integration-${randomUUID()}`;
  await expectRpcError('create_order', {
    p_consumer: unknownId,
    p_product: unknownId,
    p_quantity: 1,
    p_note: null,
  }, 'FORBIDDEN');
  await expectRpcError('cancel_order', {
    p_consumer: unknownId,
    p_order: unknownId,
  }, 'ORDER_NOT_FOUND');
  await expectRpcError('confirm_order', {
    p_seller: unknownId,
    p_order: unknownId,
  }, 'ORDER_NOT_FOUND');
  await expectRpcError('verify_qr', {
    p_seller: unknownId,
    p_qr: unknownKey,
  }, 'QR_INVALID');
  await expectRpcError('complete_order_manual', {
    p_seller: unknownId,
    p_order: unknownId,
  }, 'ORDER_NOT_FOUND');
  await expectRpcError('process_payment_webhook', {
    p_external_id: unknownKey,
    p_status: 'paid',
    p_payload: {},
  }, 'PAYMENT_NOT_FOUND');
  await expectRpcError('report_review', {
    p_user: unknownId,
    p_review: unknownId,
    p_reason: 'spam',
    p_description: null,
  }, 'REVIEW_NOT_FOUND');

  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}/api/v1`;
  try {
    const categories = await fetch(`${baseUrl}/categories`);
    assert.equal(categories.status, 200);
    assert.equal((await categories.json()).length, categoryCount);

    for (const endpoint of ['/stores', '/products']) {
      const response = await fetch(`${baseUrl}${endpoint}`);
      assert.equal(response.status, 200);
      const body = await response.json();
      assert.ok(Array.isArray(body.data));
      assert.ok(body.meta.total >= body.data.length);
    }

    const missingProduct = await fetch(`${baseUrl}/products/${unknownId}`);
    assert.equal(missingProduct.status, 404);
    assert.equal((await missingProduct.json()).code, 'PRODUCT_NOT_FOUND');
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  }
});

test('Supabase checkout concurrency, payment webhook, seller pickup, review, and complaint', {
  timeout: 120_000,
}, async () => {
  assert.equal(
    process.env.ALLOW_SUPABASE_TEST_WRITES,
    'true',
    'Set ALLOW_SUPABASE_TEST_WRITES=true only for a dedicated test database.',
  );

  const fixture = {
    userIds: [],
    storeIds: [],
    productIds: [],
    orderIds: [],
    reviewIds: [],
    complaintIds: [],
  };
  let server;

  try {
    const [{ data: category, error: categoryError }, settingsResult] = await Promise.all([
      supabaseAdmin.from('categories').select('id').limit(1).single(),
      supabaseAdmin.from('platform_settings').select('review_edit_window_hours').eq('id', 1).single(),
    ]);
    assert.ifError(categoryError);
    assert.ifError(settingsResult.error);

    const consumer = await createTestUser('consumer', 'consumer');
    fixture.userIds.push(consumer.id);
    const otherConsumer = await createTestUser('consumer', 'other');
    fixture.userIds.push(otherConsumer.id);
    const seller = await createTestUser('seller', 'seller');
    fixture.userIds.push(seller.id);

    const { data: store, error: storeError } = await supabaseAdmin
      .from('stores')
      .insert({
        owner_id: seller.id,
        name: `ReMeal Integration ${randomUUID()}`,
        business_type: 'other',
        address: 'Temporary integration fixture',
        latitude: -6.2,
        longitude: 106.8,
        contact_phone: '080000000000',
        verification_status: 'approved',
        verified_at: new Date().toISOString(),
      })
      .select('id')
      .single();
    assert.ifError(storeError);
    fixture.storeIds.push(store.id);

    const raceProductId = await createTestProduct(store.id, category.id, 1, 'race');
    fixture.productIds.push(raceProductId);
    const workflowProductId = await createTestProduct(store.id, category.id, 2, 'workflow');
    fixture.productIds.push(workflowProductId);

    const raceResults = await Promise.all([
      supabaseAdmin.rpc('create_order', {
        p_consumer: consumer.id,
        p_product: raceProductId,
        p_quantity: 1,
        p_note: null,
      }),
      supabaseAdmin.rpc('create_order', {
        p_consumer: consumer.id,
        p_product: raceProductId,
        p_quantity: 1,
        p_note: null,
      }),
    ]);
    const successfulRace = raceResults.filter((result) => !result.error);
    const rejectedRace = raceResults.filter((result) => result.error);
    assert.equal(successfulRace.length, 1);
    assert.equal(rejectedRace.length, 1);
    assert.match(rejectedRace[0].error.message, /INSUFFICIENT_STOCK/);
    const raceOrder = successfulRace[0].data;
    fixture.orderIds.push(raceOrder.id);

    const cancelRaceOrder = await supabaseAdmin.rpc('cancel_order', {
      p_consumer: consumer.id,
      p_order: raceOrder.id,
    });
    assert.ifError(cancelRaceOrder.error);
    assert.equal(cancelRaceOrder.data.status, 'cancelled');

    server = app.listen(0);
    await new Promise((resolve) => server.once('listening', resolve));
    const baseUrl = `http://127.0.0.1:${server.address().port}/api/v1`;

    const firstOrder = await apiRequest(baseUrl, 'POST', '/orders', {
      product_id: workflowProductId,
      quantity: 1,
      note: 'Integration workflow',
    }, consumer.token);
    assert.equal(firstOrder.status, 201);
    fixture.orderIds.push(firstOrder.body.id);

    const paidOrder = await payWithMockWebhook(baseUrl, consumer.token, firstOrder.body.id);
    const replay = await apiRequest(baseUrl, 'POST', '/payments/webhook', {
      external_id: paidOrder.externalId,
      status: 'paid',
      signature: createHmac('sha256', process.env.WEBHOOK_SECRET)
        .update(JSON.stringify({ external_id: paidOrder.externalId, status: 'paid' }))
        .digest('hex'),
    });
    assert.equal(replay.status, 200);

    const foreignOrder = await apiRequest(
      baseUrl,
      'GET',
      `/orders/${firstOrder.body.id}`,
      undefined,
      otherConsumer.token,
    );
    assert.equal(foreignOrder.status, 404);

    const sellerOrders = await apiRequest(baseUrl, 'GET', '/seller/orders', undefined, seller.token);
    assert.equal(sellerOrders.status, 200);
    assert.ok(sellerOrders.body.data.some((order) => order.id === firstOrder.body.id));

    const sellerOrderDetail = await apiRequest(
      baseUrl,
      'GET',
      `/seller/orders/${firstOrder.body.id}`,
      undefined,
      seller.token,
    );
    assert.equal(sellerOrderDetail.status, 200);
    assert.ok(sellerOrderDetail.body.order_code);
    assert.ok(sellerOrderDetail.body.qr_code);
    assert.equal(sellerOrderDetail.body.payment_status, 'paid');

    const confirmation = await apiRequest(
      baseUrl,
      'POST',
      `/seller/orders/${firstOrder.body.id}/confirm`,
      undefined,
      seller.token,
    );
    assert.equal(confirmation.status, 200);
    const verified = await apiRequest(baseUrl, 'POST', '/seller/orders/verify-qr', {
      qr_code: confirmation.body.qr_code,
    }, seller.token);
    assert.equal(verified.status, 200);
    assert.equal(verified.body.status, 'completed');
    const reusedQr = await apiRequest(baseUrl, 'POST', '/seller/orders/verify-qr', {
      qr_code: confirmation.body.qr_code,
    }, seller.token);
    assert.equal(reusedQr.status, 409);
    assert.equal(reusedQr.body.code, 'QR_ALREADY_USED');

    const review = await apiRequest(baseUrl, 'POST', `/orders/${firstOrder.body.id}/review`, {
      rating: 5,
      comment: 'Integration review',
    }, consumer.token);
    assert.equal(review.status, 201);
    fixture.reviewIds.push(review.body.id);
    assert.equal(review.body.store_id, store.id);
    assert.equal(review.body.product_id, workflowProductId);

    if (settingsResult.data.review_edit_window_hours > 0) {
      const editedReview = await apiRequest(baseUrl, 'PATCH', `/reviews/${review.body.id}`, {
        rating: 4,
      }, consumer.token);
      assert.equal(editedReview.status, 200);
    }

    const report = await apiRequest(baseUrl, 'POST', `/reviews/${review.body.id}/report`, {
      reason: 'other',
      description: 'Integration report',
    }, seller.token);
    assert.equal(report.status, 201);

    const complaint = await apiRequest(baseUrl, 'POST', '/complaints', {
      order_id: firstOrder.body.id,
      subject: 'Integration complaint',
      description: 'Temporary integration fixture complaint.',
    }, consumer.token);
    assert.equal(complaint.status, 201);
    fixture.complaintIds.push(complaint.body.id);

    const manualOrder = await apiRequest(baseUrl, 'POST', '/orders', {
      product_id: workflowProductId,
      quantity: 1,
    }, consumer.token);
    assert.equal(manualOrder.status, 201);
    fixture.orderIds.push(manualOrder.body.id);
    await payWithMockWebhook(baseUrl, consumer.token, manualOrder.body.id);
    const manuallyCompleted = await apiRequest(
      baseUrl,
      'POST',
      `/seller/orders/${manualOrder.body.id}/complete`,
      undefined,
      seller.token,
    );
    assert.equal(manuallyCompleted.status, 200);
    assert.equal(manuallyCompleted.body.status, 'completed');
  } finally {
    if (server) {
      await new Promise((resolve, reject) => {
        server.close((error) => error ? reject(error) : resolve());
      });
    }
    await cleanFixture(fixture);
  }
});