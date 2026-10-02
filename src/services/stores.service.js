// src/services/stores.service.js
import { supabaseAdmin } from '../config/supabase.js';
import { AppError } from '../utils/errors.js';
import { buildMeta, parsePage } from '../utils/pagination.js';
import { mapDbError } from '../utils/dbError.js';

export async function listStores(filters) {
  const page = parsePage(filters);
  const { data, error } = await supabaseAdmin.rpc('nearby_stores', {
    p_lat: filters.latitude ?? null,
    p_lng: filters.longitude ?? null,
    p_radius_km: filters.radius_km ?? 5,
    p_page: page.page,
    p_limit: page.limit,
  });

  if (error) throw mapDbError(error);

  const total = data?.[0]?.total_count ?? 0;
  return {
    data: (data ?? []).map(({ total_count, ...store }) => store),
    meta: buildMeta(page.page, page.limit, total),
  };
}

export async function getStore(storeId) {
  const { data: store, error } = await supabaseAdmin
    .from('stores')
    .select('id, owner_id, name, business_type, address, latitude, longitude, contact_phone, photo_url, verification_status, rejection_reason, average_rating, review_count, created_at')
    .eq('id', storeId)
    .eq('verification_status', 'approved')
    .maybeSingle();

  if (error) throw mapDbError(error);
  if (!store) throw new AppError(404, 'STORE_NOT_FOUND', 'Toko tidak ditemukan.');

  const { data: openingHours, error: hoursError } = await supabaseAdmin
    .from('store_opening_hours')
    .select('day, open_time, close_time')
    .eq('store_id', storeId)
    .order('day');

  if (hoursError) throw mapDbError(hoursError);

  return {
    ...store,
    opening_hours: openingHours.map(({ day, open_time, close_time }) => ({
      day,
      open: open_time,
      close: close_time,
    })),
  };
}