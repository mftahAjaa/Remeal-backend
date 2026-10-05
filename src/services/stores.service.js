import { supabaseAdmin } from '../config/supabase.js';
import { AppError } from '../utils/errors.js';
import { buildMeta, parsePage } from '../utils/pagination.js';
import { mapDbError } from '../utils/dbError.js';

const storeFields = 'id, owner_id, name, business_type, address, latitude, longitude, contact_phone, photo_url, verification_status, rejection_reason, average_rating, review_count, created_at';
const storeQueryFields = `${storeFields},store_opening_hours(day,open_time,close_time)`;

function toStoreResponse(store) {
  const openingHours = store.opening_hours ?? store.store_opening_hours?.map((hours) => ({
    day: hours.day,
    open: hours.open_time.slice(0, 5),
    close: hours.close_time.slice(0, 5),
  })) ?? [];

  return {
    ...Object.fromEntries(storeFields.split(', ').map((field) => [field, store[field]])),
    opening_hours: openingHours,
  };
}

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
  const { data, error } = await supabaseAdmin
    .from('stores')
    .select(storeQueryFields)
    .eq('id', storeId)
    .eq('verification_status', 'approved')
    .maybeSingle();

  if (error) throw mapDbError(error);
  if (!data) throw new AppError(404, 'STORE_NOT_FOUND', 'Toko tidak ditemukan.');
  return toStoreResponse(data);
}

export async function createStore(ownerId, input) {
  // Check if store already exists
  const { data: existing, error: existError } = await supabaseAdmin
    .from('stores')
    .select('id')
    .eq('owner_id', ownerId)
    .maybeSingle();
  if (existError) throw mapDbError(existError);
  if (existing) {
    throw new AppError(409, 'STORE_ALREADY_EXISTS', 'Akun ini sudah memiliki toko.');
  }

  // Insert store
  const { opening_hours, ...storeData } = input;
  const { data: newStore, error: insertError } = await supabaseAdmin
    .from('stores')
    .insert({
      owner_id: ownerId,
      ...storeData,
      verification_status: 'pending' // default for new stores
    })
    .select()
    .single();

  if (insertError) {
    if (insertError.code === '23505') {
       throw new AppError(409, 'STORE_ALREADY_EXISTS', 'Akun ini sudah memiliki toko.');
    }
    throw mapDbError(insertError);
  }

  // Insert opening hours if provided
  if (opening_hours && opening_hours.length > 0) {
    const hoursToInsert = opening_hours.map(h => ({
      store_id: newStore.id,
      day: h.day,
      open_time: h.open,
      close_time: h.close
    }));
    const { error: hoursError } = await supabaseAdmin
      .from('store_opening_hours')
      .insert(hoursToInsert);
    
    if (hoursError) {
      console.error("Failed to insert opening hours", hoursError);
    }
  }

  return getMyStore(ownerId);
}

export async function getMyStore(ownerId) {
  const { data, error } = await supabaseAdmin
    .from('stores')
    .select(storeQueryFields)
    .eq('owner_id', ownerId)
    .maybeSingle();

  if (error) throw mapDbError(error);
  if (!data) throw new AppError(403, 'FORBIDDEN', 'Akun ini belum memiliki toko.');
  return toStoreResponse(data);
}

export async function updateMyStore(ownerId, input) {
  const { opening_hours, ...storeData } = input;
  
  // Find the store id
  const { data: existing, error: existError } = await supabaseAdmin
    .from('stores')
    .select('id')
    .eq('owner_id', ownerId)
    .maybeSingle();
  if (existError) throw mapDbError(existError);
  if (!existing) throw new AppError(404, 'STORE_NOT_FOUND', 'Toko tidak ditemukan.');
  
  // Update store
  const { error: updateError } = await supabaseAdmin
    .from('stores')
    .update(storeData)
    .eq('id', existing.id);
  if (updateError) throw mapDbError(updateError);

  // Update opening hours
  if (opening_hours) {
    await supabaseAdmin.from('store_opening_hours').delete().eq('store_id', existing.id);
    if (opening_hours.length > 0) {
      const hoursToInsert = opening_hours.map(h => ({
        store_id: existing.id,
        day: h.day,
        open_time: h.open,
        close_time: h.close
      }));
      await supabaseAdmin.from('store_opening_hours').insert(hoursToInsert);
    }
  }
  
  return getMyStore(ownerId);
}

export async function listAdminStores(filters) {
  const page = parsePage(filters);
  let query = supabaseAdmin.from('stores').select(storeQueryFields, { count: 'exact' });

  if (filters.verification_status) {
    query = query.eq('verification_status', filters.verification_status);
  }

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(page.from, page.to);

  if (error) throw mapDbError(error);
  return { data: data.map(toStoreResponse), meta: buildMeta(page.page, page.limit, count) };
}

export async function verifyStore(adminId, storeId, input) {
  const { error } = await supabaseAdmin
    .from('stores')
    .update({
      verification_status: input.status,
      rejection_reason: input.reason ?? null
    })
    .eq('id', storeId);

  if (error) throw mapDbError(error);
  const { data, error: storeError } = await supabaseAdmin
    .from('stores')
    .select(storeQueryFields)
    .eq('id', storeId)
    .maybeSingle();

  if (storeError) throw mapDbError(storeError);
  if (!data) throw new AppError(404, 'STORE_NOT_FOUND', 'Toko tidak ditemukan.');
  return toStoreResponse(data);
}
