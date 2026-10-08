import { supabaseAdmin } from '../config/supabase.js';
import { AppError } from '../utils/errors.js';
import { buildMeta, parsePage } from '../utils/pagination.js';
import { mapDbError } from '../utils/dbError.js';

const reviewFields = ['rating', 'comment', 'photo_url'];
const reviewResponseFields = [
  'id',
  'rating',
  'comment',
  'photo_url',
  'order_id',
  'store_id',
  'product_id',
  'consumer_name',
  'seller_reply',
  'is_hidden',
  'created_at',
  'updated_at',
];
const reviewSelect = 'id, rating, comment, photo_url, order_id, store_id, product_id, seller_reply, is_hidden, created_at, updated_at, consumer:profiles!reviews_consumer_id_fkey(full_name)';

function toReviewResponse(review) {
  if (!review) return null;

  const response = Object.fromEntries(
    reviewResponseFields
      .filter((field) => field !== 'consumer_name')
      .filter((field) => Object.hasOwn(review, field))
      .map((field) => [field, review[field]]),
  );
  const consumerName = review.consumer_name ?? review.consumer?.full_name;
  if (consumerName !== undefined && consumerName !== null) response.consumer_name = consumerName;
  return response;
}

function getReviewUpdates(input) {
  return Object.fromEntries(
    reviewFields
      .filter((field) => Object.hasOwn(input, field))
      .map((field) => [field, input[field]]),
  );
}

export async function createReview(consumerId, orderId, input) {
  const { data: order, error: orderError } = await supabaseAdmin
    .from('orders')
    .select('id, store_id, product_id, status, consumer_id')
    .eq('id', orderId)
    .single();

  if (orderError) throw mapDbError(orderError);
  if (!order) throw new AppError(404, 'ORDER_NOT_FOUND', 'Pesanan tidak ditemukan.');
  if (order.consumer_id !== consumerId) throw new AppError(403, 'FORBIDDEN', 'Bukan pesanan Anda.');
  if (order.status !== 'completed') throw new AppError(400, 'BAD_REQUEST', 'Hanya pesanan selesai yang dapat diulas.');

  const { data, error } = await supabaseAdmin
    .from('reviews')
    .insert({
      order_id: orderId,
      consumer_id: consumerId,
      store_id: order.store_id,
      product_id: order.product_id,
      ...getReviewUpdates(input),
    })
    .select(reviewSelect)
    .single();

  if (error?.code === '23505') {
    throw new AppError(409, 'REVIEW_ALREADY_EXISTS', 'Pesanan ini sudah diulas.');
  }
  if (error) throw mapDbError(error);
  return toReviewResponse(data);
}

export async function updateReview(consumerId, reviewId, input) {
  const { data: existingReview, error: reviewError } = await supabaseAdmin
    .from('reviews')
    .select('id, consumer_id, created_at')
    .eq('id', reviewId)
    .maybeSingle();

  if (reviewError) throw mapDbError(reviewError);
  if (!existingReview) throw new AppError(404, 'REVIEW_NOT_FOUND', 'Ulasan tidak ditemukan.');
  if (existingReview.consumer_id !== consumerId) {
    throw new AppError(403, 'FORBIDDEN', 'Ulasan bukan milik akun ini.');
  }

  const { data: settings, error: settingsError } = await supabaseAdmin
    .from('platform_settings')
    .select('review_edit_window_hours')
    .eq('id', 1)
    .maybeSingle();

  if (settingsError) throw mapDbError(settingsError);
  if (!settings) {
    throw new AppError(500, 'INTERNAL_SERVER_ERROR', 'Pengaturan platform tidak tersedia.');
  }

  const editDeadline = Date.parse(existingReview.created_at)
    + Number(settings.review_edit_window_hours) * 60 * 60 * 1000;
  if (!Number.isFinite(editDeadline)) {
    throw new AppError(500, 'INTERNAL_SERVER_ERROR', 'Batas waktu edit ulasan tidak valid.');
  }
  if (Date.now() > editDeadline) {
    throw new AppError(409, 'REVIEW_EDIT_WINDOW_EXPIRED', 'Batas waktu edit ulasan telah lewat.');
  }

  const { data, error } = await supabaseAdmin
    .from('reviews')
    .update(getReviewUpdates(input))
    .eq('id', reviewId)
    .eq('consumer_id', consumerId)
    .select(reviewSelect)
    .maybeSingle();

  if (error) throw mapDbError(error);
  if (!data) throw new AppError(404, 'REVIEW_NOT_FOUND', 'Ulasan tidak ditemukan.');
  return toReviewResponse(data);
}

export async function reportReview(userId, reviewId, input) {
  const { error } = await supabaseAdmin.rpc('report_review', {
    p_user: userId,
    p_review: reviewId,
    p_reason: input.reason,
    p_description: input.description ?? null,
  });

  if (error) throw mapDbError(error);
  return { message: 'Laporan ulasan berhasil dikirim.' };
}

export async function listStoreReviews(storeId, filters) {
  const page = parsePage(filters);
  const { data: store, error: storeError } = await supabaseAdmin
    .from('stores')
    .select('id')
    .eq('id', storeId)
    .eq('verification_status', 'approved')
    .maybeSingle();

  if (storeError) throw mapDbError(storeError);
  if (!store) throw new AppError(404, 'STORE_NOT_FOUND', 'Toko tidak ditemukan.');

  const { data, count, error } = await supabaseAdmin
    .from('reviews')
    .select(reviewSelect, { count: 'exact' })
    .eq('store_id', storeId)
    .eq('is_hidden', false)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .range(page.from, page.to);

  if (error) throw mapDbError(error);
  return { data: data.map(toReviewResponse), meta: buildMeta(page.page, page.limit, count) };
}

async function getSellerStore(sellerId) {
  const { data, error } = await supabaseAdmin
    .from('stores')
    .select('id, average_rating')
    .eq('owner_id', sellerId)
    .maybeSingle();

  if (error) throw mapDbError(error);
  if (!data) throw new AppError(403, 'FORBIDDEN', 'Akun ini belum memiliki toko.');
  return data;
}

export async function listSellerReviews(sellerId) {
  const store = await getSellerStore(sellerId);
  const { data, count, error } = await supabaseAdmin
    .from('reviews')
    .select(reviewSelect, { count: 'exact' })
    .eq('store_id', store.id)
    .eq('is_hidden', false)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) throw mapDbError(error);
  return {
    average_rating: Number(store.average_rating || 0),
    total_reviews: count ?? 0,
    data: data.map(toReviewResponse),
  };
}

export async function replyToReview(sellerId, reviewId, reply) {
  const { data, error } = await supabaseAdmin.rpc('seller_reply_review', {
    p_seller: sellerId,
    p_review: reviewId,
    p_reply: reply,
  });

  if (error) throw mapDbError(error);
  if (!data) throw new AppError(404, 'REVIEW_NOT_FOUND', 'Ulasan tidak ditemukan.');
  const { data: review, error: reviewError } = await supabaseAdmin
    .from('reviews')
    .select(reviewSelect)
    .eq('id', reviewId)
    .maybeSingle();

  if (reviewError) throw mapDbError(reviewError);
  if (!review) throw new AppError(404, 'REVIEW_NOT_FOUND', 'Ulasan tidak ditemukan.');
  return toReviewResponse(review);
}

export async function listAdminReviewReports(filters) {
  const page = parsePage(filters);
  const { data, count, error } = await supabaseAdmin
    .from('review_reports')
    .select(`id, review_id, reported_by, reason, description, status, created_at, review:reviews(${reviewSelect})`, { count: 'exact' })
    .eq('status', filters.status)
    .order('created_at', { ascending: false })
    .range(page.from, page.to);

  if (error) throw mapDbError(error);
  return {
    data: data.map((report) => ({
      id: report.id,
      review: toReviewResponse(report.review),
      reported_by: report.reported_by,
      reason: report.reason,
      description: report.description,
      status: report.status,
      created_at: report.created_at,
    })),
    meta: buildMeta(page.page, page.limit, count),
  };
}

export async function moderateReview(adminId, reviewId, input) {
  const { data, error } = await supabaseAdmin.rpc('admin_moderate_review', {
    p_admin: adminId,
    p_review: reviewId,
    p_action: input.action,
    p_note: input.note ?? null,
  });

  if (error) throw mapDbError(error);
  if (!data) throw new AppError(404, 'REVIEW_NOT_FOUND', 'Ulasan tidak ditemukan.');
  return { message: 'Moderasi ulasan berhasil diterapkan.' };
}
