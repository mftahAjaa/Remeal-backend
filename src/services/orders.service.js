// src/services/orders.service.js
import { supabaseAdmin } from '../config/supabase.js';
import { AppError } from '../utils/errors.js';
import { buildMeta, parsePage } from '../utils/pagination.js';
import { mapDbError } from '../utils/dbError.js';

export async function createOrder(consumerId, input) {
  const { data, error } = await supabaseAdmin.rpc('create_order', {
    p_consumer: consumerId,
    p_product: input.product_id,
    p_quantity: input.quantity,
    p_note: input.note ?? null,
  });

  if (error) throw mapDbError(error);
  return data;
}

export async function listOrders(consumerId, filters) {
  const page = parsePage(filters);
  let query = supabaseAdmin
    .from('orders')
    .select('*', { count: 'exact' })
    .eq('consumer_id', consumerId);

  if (filters.status) query = query.eq('status', filters.status);

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(page.from, page.to);

  if (error) throw mapDbError(error);
  return { data, meta: buildMeta(page.page, page.limit, count) };
}

export async function getOrder(consumerId, orderId) {
  const { data, error } = await supabaseAdmin
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .eq('consumer_id', consumerId)
    .maybeSingle();

  if (error) throw mapDbError(error);
  if (!data) throw new AppError(404, 'ORDER_NOT_FOUND', 'Pesanan tidak ditemukan.');
  return data;
}

export async function cancelOrder(consumerId, orderId) {
  const { data, error } = await supabaseAdmin.rpc('cancel_order', {
    p_consumer: consumerId,
    p_order: orderId,
  });

  if (error) throw mapDbError(error);
  return data;
}