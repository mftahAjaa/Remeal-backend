import { supabaseAdmin } from '../config/supabase.js';
import { AppError } from '../utils/errors.js';
import { mapDbError } from '../utils/dbError.js';
import { buildMeta, parsePage } from '../utils/pagination.js';

const userFields = 'id, full_name, email, phone, role, avatar_url, is_verified, is_active, created_at';
const orderResponseFields = [
  'id',
  'order_code',
  'status',
  'product',
  'store_id',
  'consumer_id',
  'quantity',
  'total_price',
  'note',
  'qr_code',
  'payment_status',
  'pickup_deadline_at',
  'completed_at',
  'has_review',
  'created_at',
];

export async function getDashboard() {
  const { data, error } = await supabaseAdmin.rpc('get_admin_dashboard');
  if (error) throw mapDbError(error);
  return data;
}

export async function listUsers(filters) {
  const page = parsePage(filters);
  let query = supabaseAdmin.from('profiles').select(userFields, { count: 'exact' });
  if (filters.role) query = query.eq('role', filters.role);

  const search = filters.q?.replace(/[\\%_,().]/g, '').trim();
  if (search) {
    const pattern = `*${search}*`;
    query = query.or(`full_name.ilike.${pattern},email.ilike.${pattern},phone.ilike.${pattern}`);
  }

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(page.from, page.to);

  if (error) throw mapDbError(error);
  return { data, meta: buildMeta(page.page, page.limit, count) };
}

export async function updateUser(userId, input) {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update({ is_active: input.is_active })
    .eq('id', userId)
    .select(userFields)
    .maybeSingle();

  if (error) throw mapDbError(error);
  if (!data) throw new AppError(404, 'USER_NOT_FOUND', 'Pengguna tidak ditemukan.');
  return data;
}

export async function deleteUser(userId) {
  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
  if (error?.status === 404 || error?.code === 'user_not_found') {
    throw new AppError(404, 'USER_NOT_FOUND', 'Pengguna tidak ditemukan.');
  }
  if (error) throw mapDbError(error);
}

export async function listOrders(filters) {
  const page = parsePage(filters);
  let query = supabaseAdmin.from('orders').select('*', { count: 'exact' });
  if (filters.status) query = query.eq('status', filters.status);
  if (filters.store_id) query = query.eq('store_id', filters.store_id);

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(page.from, page.to);

  if (error) throw mapDbError(error);
  const orderIds = data.map((order) => order.id);
  let paymentsByOrder = new Map();

  if (orderIds.length > 0) {
    const { data: payments, error: paymentsError } = await supabaseAdmin
      .from('payments')
      .select('order_id, status, created_at')
      .in('order_id', orderIds)
      .order('created_at', { ascending: false });

    if (paymentsError) throw mapDbError(paymentsError);
    paymentsByOrder = new Map();
    for (const payment of payments) {
      if (!paymentsByOrder.has(payment.order_id)) paymentsByOrder.set(payment.order_id, payment.status);
    }
  }

  return {
    data: data.map((order) => {
      const response = {
        ...order,
        payment_status: paymentsByOrder.get(order.id) ?? order.payment_status ?? 'unpaid',
      };
      return Object.fromEntries(
        orderResponseFields
          .filter((field) => Object.hasOwn(response, field))
          .map((field) => [field, response[field]]),
      );
    }),
    meta: buildMeta(page.page, page.limit, count),
  };
}

export async function getSettings() {
  const { data, error } = await supabaseAdmin
    .from('platform_settings')
    .select('platform_fee_percent, payment_expiry_minutes, review_edit_window_hours, max_search_radius_km')
    .eq('id', 1)
    .maybeSingle();

  if (error) throw mapDbError(error);
  if (!data) throw new AppError(500, 'INTERNAL_SERVER_ERROR', 'Pengaturan platform tidak tersedia.');
  return data;
}

export async function updateSettings(input) {
  const { data, error } = await supabaseAdmin
    .from('platform_settings')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', 1)
    .select('platform_fee_percent, payment_expiry_minutes, review_edit_window_hours, max_search_radius_km')
    .maybeSingle();

  if (error) throw mapDbError(error);
  if (!data) throw new AppError(500, 'INTERNAL_SERVER_ERROR', 'Pengaturan platform tidak tersedia.');
  return data;
}