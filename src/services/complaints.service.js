// src/services/complaints.service.js
import { supabaseAdmin } from '../config/supabase.js';
import { AppError } from '../utils/errors.js';
import { mapDbError } from '../utils/dbError.js';
import { buildMeta, parsePage } from '../utils/pagination.js';

const complaintFields = 'id, order_id, user_id, subject, description, status, resolution_note, created_at';

function toComplaintResponse(complaint) {
  return Object.fromEntries(
    complaintFields
      .split(', ')
      .filter((field) => Object.hasOwn(complaint, field))
      .map((field) => [field, complaint[field]]),
  );
}

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
    .select(complaintFields)
    .single();

  if (error) throw mapDbError(error);
  return toComplaintResponse(data);
}

export async function listAdminComplaints(filters) {
  const page = parsePage(filters);
  let query = supabaseAdmin.from('complaints').select(complaintFields, { count: 'exact' });
  if (filters.status) query = query.eq('status', filters.status);

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(page.from, page.to);

  if (error) throw mapDbError(error);
  return { data: data.map(toComplaintResponse), meta: buildMeta(page.page, page.limit, count) };
}

export async function updateAdminComplaint(adminId, complaintId, input) {
  const { data, error } = await supabaseAdmin.rpc('admin_handle_complaint', {
    p_admin: adminId,
    p_complaint: complaintId,
    p_status: input.status,
    p_note: input.resolution_note ?? null,
  });

  if (error) throw mapDbError(error);
  if (!data) throw new AppError(404, 'COMPLAINT_NOT_FOUND', 'Keluhan tidak ditemukan.');
  return toComplaintResponse(data);
}