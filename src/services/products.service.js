// src/services/products.service.js
import { supabaseAdmin } from '../config/supabase.js';
import { AppError } from '../utils/errors.js';
import { buildMeta, parsePage } from '../utils/pagination.js';
import { mapDbError } from '../utils/dbError.js';

const productResponseFields = [
  'id', 'name', 'description', 'category_id', 'photo_url', 'normal_price',
  'discount_price', 'stock', 'sale_start_at', 'order_deadline_at',
  'pickup_deadline_at', 'status', 'seconds_to_order_deadline',
  'average_rating', 'review_count', 'distance_km', 'store',
];

export function toProductResponse(product) {
  return Object.fromEntries(
    productResponseFields
      .filter((field) => Object.hasOwn(product, field))
      .map((field) => [field, product[field]]),
  );
}

async function getSellerStore(sellerId, requireApproved = false) {
  const { data, error } = await supabaseAdmin
    .from('stores')
    .select('id, verification_status')
    .eq('owner_id', sellerId)
    .maybeSingle();

  if (error) throw mapDbError(error);
  if (!data || (requireApproved && data.verification_status !== 'approved')) {
    throw new AppError(403, 'FORBIDDEN', 'Toko harus disetujui sebelum dapat berjualan.');
  }
  return data;
}

function attachCountdown(product) {
  return {
    ...product,
    seconds_to_order_deadline: Math.max(
      0,
      Math.floor((Date.parse(product.order_deadline_at) - Date.now()) / 1000),
    ),
  };
}

export async function searchProducts(filters) {
  const page = parsePage(filters);
  const { data, error } = await supabaseAdmin.rpc('search_products', {
    p_q: filters.q || null,
    p_category_id: filters.category_id ?? null,
    p_min_price: filters.min_price ?? null,
    p_max_price: filters.max_price ?? null,
    p_min_rating: filters.min_rating ?? null,
    p_lat: filters.latitude ?? null,
    p_lng: filters.longitude ?? null,
    p_radius_km: filters.radius_km ?? 5,
    p_sort: filters.sort ?? 'nearest',
    p_page: page.page,
    p_limit: page.limit,
  });

  if (error) throw mapDbError(error);

  const total = data?.[0]?.total_count ?? 0;
  return {
    data: (data ?? []).map(({ total_count, ...product }) => product),
    meta: buildMeta(page.page, page.limit, total),
  };
}

export async function getCurrentProducts(storeId) {
  const { data, error } = await supabaseAdmin
    .from('products')
    .select('*')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false });

  if (error) throw mapDbError(error);
  return data.map(attachCountdown);
}

export async function listSellerProducts(sellerId, filters) {
  const store = await getSellerStore(sellerId);
  let products = await getCurrentProducts(store.id);
  if (filters.status) products = products.filter((product) => product.status === filters.status);

  const page = parsePage(filters);
  const total = products.length;
  return {
    data: products.slice(page.from, page.to + 1),
    meta: buildMeta(page.page, page.limit, total),
  };
}

export async function getProduct(productId) {
  const { data: product, error } = await supabaseAdmin
    .from('products_public')
    .select('*')
    .eq('id', productId)
    .maybeSingle();

  if (error) throw mapDbError(error);
  if (!product) throw new AppError(404, 'PRODUCT_NOT_FOUND', 'Produk tidak ditemukan.');

  const { data: store, error: storeError } = await supabaseAdmin
    .from('stores')
    .select('id, owner_id, name, business_type, address, latitude, longitude, contact_phone, photo_url, verification_status, average_rating, review_count')
    .eq('id', product.store_id)
    .eq('verification_status', 'approved')
    .maybeSingle();

  if (storeError) throw mapDbError(storeError);
  if (!store) throw new AppError(404, 'PRODUCT_NOT_FOUND', 'Produk tidak ditemukan.');

  return { ...product, store };
}

export async function createSellerProduct(sellerId, input) {
  const store = await getSellerStore(sellerId, true);
  const { data, error } = await supabaseAdmin
    .from('products')
    .insert({ ...input, store_id: store.id, status: 'available' })
    .select('*')
    .single();

  if (error) throw mapDbError(error);
  return attachCountdown(data);
}

export async function updateSellerProduct(sellerId, productId, input) {
  const store = await getSellerStore(sellerId);
  const { data, error } = await supabaseAdmin
    .from('products')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', productId)
    .eq('store_id', store.id)
    .select('*')
    .maybeSingle();

  if (error) throw mapDbError(error);
  if (!data) throw new AppError(404, 'PRODUCT_NOT_FOUND', 'Produk tidak ditemukan.');
  return attachCountdown(data);
}

export async function deleteSellerProduct(sellerId, productId) {
  const store = await getSellerStore(sellerId);
  const { data, error } = await supabaseAdmin
    .from('products')
    .delete()
    .eq('id', productId)
    .eq('store_id', store.id)
    .select('id')
    .maybeSingle();

  if (error?.code === '23503') {
    throw new AppError(409, 'PRODUCT_HAS_ORDERS', 'Produk yang memiliki riwayat pesanan tidak dapat dihapus.');
  }
  if (error) throw mapDbError(error);
  if (!data) throw new AppError(404, 'PRODUCT_NOT_FOUND', 'Produk tidak ditemukan.');
}

export async function closeSellerProduct(sellerId, productId) {
  const { data, error } = await supabaseAdmin.rpc('close_product', {
    p_seller: sellerId,
    p_product: productId,
  });

  if (error) throw mapDbError(error);
  if (!data) throw new AppError(404, 'PRODUCT_NOT_FOUND', 'Produk tidak ditemukan.');
  return attachCountdown(data);
}