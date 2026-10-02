// src/services/complaints.service.js
import { supabaseAdmin } from '../config/supabase.js';
import { AppError } from '../utils/errors.js';
import { mapDbError } from '../utils/dbError.js';

async function ensureOrderBelongsToUser(userId, role, orderId) {
  const { data: order, error: orderError } = await supabaseAdmin
    .from('orders')
    .select('id, consumer_id, store_id')
    .eq('id', orderId)
    .maybeSingle();

  if (orderError) throw mapDbError(orderError);
  if (!order) throw new AppError(404, 'ORDER_NOT_FOUND', 'Pesanan tidak ditemukan.');
  if (order.consumer_id === userId) return;

  if (role === 'seller') {
    const { data: store, error: storeError } = await supabaseAdmin
      .from('stores')
      .select('id')
      .eq('id', order.store_id)
      .eq('owner_id', userId)
      .maybeSingle();

    if (storeError) throw mapDbError(storeError);
    if (store) return;
  }

  throw new AppError(403, 'FORBIDDEN', 'Pesanan tidak terkait dengan akun ini.');
}

export async function createComplaint(userId, role, input) {
  if (input.order_id) {
    await ensureOrderBelongsToUser(userId, role, input.order_id);
  }

  const { data, error } = await supabaseAdmin
    .from('complaints')
    .insert({
      order_id: input.order_id ?? null,
      user_id: userId,
      subject: input.subject,
      description: input.description,
    })
    .select('*')
    .single();

  if (error) throw mapDbError(error);
  return data;
}