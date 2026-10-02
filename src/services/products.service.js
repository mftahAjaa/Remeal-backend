// src/services/products.service.js
import { supabaseAdmin } from '../config/supabase.js';
import { AppError } from '../utils/errors.js';
import { buildMeta, parsePage } from '../utils/pagination.js';
import { mapDbError } from '../utils/dbError.js';

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