// src/utils/dbError.js
import { AppError } from './errors.js';

const databaseErrors = {
  INSUFFICIENT_STOCK: [409, 'Stok produk tidak mencukupi.'],
  ORDER_DEADLINE_PASSED: [409, 'Batas waktu pemesanan telah lewat.'],
  SALE_NOT_STARTED: [409, 'Masa penjualan belum dimulai.'],
  ORDER_NOT_CANCELLABLE: [409, 'Pesanan tidak dapat dibatalkan.'],
  ORDER_NOT_PAYABLE: [409, 'Pesanan tidak dapat dibayar.'],
  ORDER_NOT_PAID: [409, 'Pesanan belum dibayar.'],
  ORDER_NOT_COMPLETED: [403, 'Pesanan belum selesai.'],
  NOT_ORDER_OWNER: [403, 'Pesanan bukan milik akun ini.'],
  QR_ALREADY_USED: [409, 'Kode QR sudah digunakan.'],
  QR_INVALID: [400, 'Kode QR tidak valid.'],
  PICKUP_DEADLINE_PASSED: [400, 'Batas waktu pengambilan telah lewat.'],
  INVALID_QUANTITY: [400, 'Jumlah produk tidak valid.'],
  FORBIDDEN: [403, 'Anda tidak memiliki izin untuk melakukan tindakan ini.'],
  QR_NOT_FOR_THIS_STORE: [403, 'Kode QR bukan untuk toko ini.'],
  STORE_NOT_AVAILABLE: [403, 'Toko tidak tersedia.'],
  STORE_NOT_FOUND: [404, 'Toko tidak ditemukan.'],
  COMPLAINT_NOT_FOUND: [404, 'Keluhan tidak ditemukan.'],
  CATEGORY_NOT_FOUND: [404, 'Kategori tidak ditemukan.'],
  USER_NOT_FOUND: [404, 'Pengguna tidak ditemukan.'],
  PRODUCT_NOT_FOUND: [404, 'Produk tidak ditemukan.'],
  ORDER_NOT_FOUND: [404, 'Pesanan tidak ditemukan.'],
  STORE_NOT_FOUND: [404, 'Toko tidak ditemukan.'],
  REVIEW_NOT_FOUND: [404, 'Ulasan tidak ditemukan.'],
};

export function mapDbError(err) {
  if (err instanceof AppError) return err;

  if (err?.code === '23505') {
    return new AppError(409, 'CONFLICT', 'Data dengan nilai yang sama sudah ada.');
  }

  const message = typeof err?.message === 'string' ? err.message.trim() : '';
  const code = message.toUpperCase();
  const mappedError = databaseErrors[code];

  if (mappedError) {
    return new AppError(mappedError[0], code, mappedError[1]);
  }

  console.error('Unhandled Database Error:', err);
  return new AppError(500, 'INTERNAL_SERVER_ERROR', 'Terjadi kesalahan pada server.', { original_message: err?.message });
}