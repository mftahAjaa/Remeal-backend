// src/services/seller-orders.service.js
import { supabaseAdmin } from '../config/supabase.js';
import { AppError } from '../utils/errors.js';
import { mapDbError } from '../utils/dbError.js';
import { buildMeta, parsePage } from '../utils/pagination.js';

async function getSellerStoreIds(sellerId) {
  const { data, error } = await supabaseAdmin
    .from('stores')
    .select('id')
    .eq('owner_id', sellerId);

  if (error) throw mapDbError(error);
  return data.map((store) => store.id);
}

function dateRange(date) {
  const start = new Date(`${date}T00:00:00.000Z`);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start: start.toISOString(), end: end.toISOString() };
}

export async function listSellerOrders(sellerId, filters) {
  const page = parsePage(filters);
  const storeIds = await getSellerStoreIds(sellerId);
  if (storeIds.length === 0) {
    return { data: [], meta: buildMeta(page.page, page.limit, 0) };
  }

  let query = supabaseAdmin
    .from('orders')
    .select('*', { count: 'exact' })
    .in('store_id', storeIds);

  if (filters.status) query = query.eq('status', filters.status);
  if (filters.date) {
    const range = dateRange(filters.date);
    query = query.gte('created_at', range.start).lt('created_at', range.end);
  }

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(page.from, page.to);

  if (error) throw mapDbError(error);

  return {
    data,
    meta: buildMeta(page.page, page.limit, count),
  };
}

export async function getSellerOrder(sellerId, orderId) {
  const storeIds = await getSellerStoreIds(sellerId);
  if (storeIds.length === 0) {
    throw new AppError(404, 'ORDER_NOT_FOUND', 'Pesanan tidak ditemukan.');
  }

  const { data, error } = await supabaseAdmin
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .in('store_id', storeIds)
    .maybeSingle();

  if (error) throw mapDbError(error);
  if (!data) throw new AppError(404, 'ORDER_NOT_FOUND', 'Pesanan tidak ditemukan.');

  return data;
}

async function runSellerOrderRpc(functionName, sellerId, argumentName, argumentValue) {
  const { data, error } = await supabaseAdmin.rpc(functionName, {
    p_seller: sellerId,
    [argumentName]: argumentValue,
  });

  if (error) throw mapDbError(error);
  return data;
}

export function confirmSellerOrder(sellerId, orderId) {
  return runSellerOrderRpc('confirm_order', sellerId, 'p_order', orderId);
}

export function verifyPickupQr(sellerId, qrCode) {
  return runSellerOrderRpc('verify_qr', sellerId, 'p_qr', qrCode);
}

export function completeSellerOrder(sellerId, orderId) {
  return runSellerOrderRpc('complete_order_manual', sellerId, 'p_order', orderId);
}