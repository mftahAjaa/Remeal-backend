// src/services/reviews.service.js
import { supabaseAdmin } from '../config/supabase.js';
import { AppError } from '../utils/errors.js';
import { mapDbError } from '../utils/dbError.js';

const reviewFields = ['rating', 'comment', 'photo_url'];

function getReviewUpdates(input) {
  return Object.fromEntries(
    reviewFields
      .filter((field) => Object.hasOwn(input, field))
      .map((field) => [field, input[field]]),
  );
}

export async function createReview(consumerId, orderId, input) {
  const review = {
    order_id: orderId,
    consumer_id: consumerId,
    ...getReviewUpdates(input),
  };
  const { data, error } = await supabaseAdmin
    .from('reviews')
    .insert(review)
    .select('*')
    .single();

  if (error?.code === '23505') {
    throw new AppError(409, 'REVIEW_ALREADY_EXISTS', 'Pesanan ini sudah diulas.');
  }
  if (error) throw mapDbError(error);

  return data;
}

export async function updateReview(consumerId, reviewId, input) {
  const { data: existingReview, error: reviewError } = await supabaseAdmin
    .from('reviews')
    .select('id, consumer_id, created_at')
    .eq('id', reviewId)
    .maybeSingle();

  if (reviewError) throw mapDbError(reviewError);
  if (!existingReview) {
    throw new AppError(404, 'REVIEW_NOT_FOUND', 'Ulasan tidak ditemukan.');
  }
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

  const createdAt = Date.parse(existingReview.created_at);
  const editWindowHours = Number(settings.review_edit_window_hours);
  const editDeadline = createdAt + editWindowHours * 60 * 60 * 1000;
  if (!Number.isFinite(editDeadline)) {
    throw new AppError(500, 'INTERNAL_SERVER_ERROR', 'Batas waktu edit ulasan tidak valid.');
  }
  if (Date.now() > editDeadline) {
    throw new AppError(409, 'REVIEW_EDIT_WINDOW_EXPIRED', 'Batas waktu edit ulasan telah lewat.');
  }

  const updates = getReviewUpdates(input);
  const { data, error } = await supabaseAdmin
    .from('reviews')
    .update(updates)
    .eq('id', reviewId)
    .eq('consumer_id', consumerId)
    .select('*')
    .maybeSingle();

  if (error) throw mapDbError(error);
  if (!data) throw new AppError(404, 'REVIEW_NOT_FOUND', 'Ulasan tidak ditemukan.');

  return data;
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