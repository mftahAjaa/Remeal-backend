// src/services/payments.service.js
import { supabaseAdmin } from '../config/supabase.js';
import { AppError } from '../utils/errors.js';
import { mapDbError } from '../utils/dbError.js';
import { createCharge, verifySignature } from './paymentGateway.js';

export async function createOrderPayment(consumerId, orderId, method) {
  const { data: order, error: orderError } = await supabaseAdmin
    .from('orders')
    .select('id, consumer_id, total_price, status, payment_expires_at')
    .eq('id', orderId)
    .maybeSingle();

  if (orderError) throw mapDbError(orderError);
  if (!order) throw new AppError(404, 'ORDER_NOT_FOUND', 'Pesanan tidak ditemukan.');
  if (order.consumer_id !== consumerId) {
    throw new AppError(403, 'FORBIDDEN', 'Pesanan bukan milik akun ini.');
  }

  const paymentDeadline = Date.parse(order.payment_expires_at);
  if (order.status !== 'pending_payment' || !Number.isFinite(paymentDeadline) || paymentDeadline <= Date.now()) {
    throw new AppError(409, 'ORDER_NOT_PAYABLE', 'Pesanan tidak dapat dibayar.');
  }

  const { data: pendingPayments, error: pendingError } = await supabaseAdmin
    .from('payments')
    .select('id')
    .eq('order_id', orderId)
    .eq('status', 'pending');

  if (pendingError) throw mapDbError(pendingError);

  if (pendingPayments.length > 0) {
    const pendingIds = pendingPayments.map((payment) => payment.id);
    const { error: expireError } = await supabaseAdmin
      .from('payments')
      .update({ status: 'expired' })
      .in('id', pendingIds)
      .eq('status', 'pending');

    if (expireError) throw mapDbError(expireError);
  }

  const charge = await createCharge({
    orderId,
    amount: order.total_price,
    method,
  });

  const { data: payment, error: insertError } = await supabaseAdmin
    .from('payments')
    .insert({
      order_id: orderId,
      method,
      amount: order.total_price,
      status: 'pending',
      external_id: charge.externalId,
      payment_url: charge.paymentUrl,
      qris_payload: charge.qrisPayload,
      expires_at: charge.expiresAt,
    })
    .select('id, order_id, method, amount, status, payment_url, qris_payload, expires_at')
    .single();

  if (insertError) throw mapDbError(insertError);
  return payment;
}

export async function processPaymentWebhook(body, rawBody) {
  let signatureIsValid = false;
  try {
    signatureIsValid = await verifySignature({ body, rawBody });
  } catch {
    signatureIsValid = false;
  }

  if (!signatureIsValid) {
    throw new AppError(401, 'UNAUTHORIZED', 'Signature webhook tidak valid.');
  }

  try {
    const { error } = await supabaseAdmin.rpc('process_payment_webhook', {
      p_external_id: body.external_id,
      p_status: body.status,
      p_payload: body,
    });

    if (error) console.error('Payment webhook RPC failed after valid signature.', error);
  } catch (error) {
    console.error('Payment webhook RPC failed after valid signature.', error);
  }

  return { message: 'Webhook diterima.' };
}