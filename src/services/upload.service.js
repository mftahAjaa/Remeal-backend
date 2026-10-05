import { supabaseAdmin } from '../config/supabase.js';
import { AppError } from '../utils/errors.js';
import crypto from 'crypto';

export async function uploadPhoto(file, bucket) {
  if (!file) {
    throw new AppError(400, 'BAD_REQUEST', 'File foto tidak ditemukan.');
  }

  // Validasi format file harus berupa gambar
  if (!file.mimetype.startsWith('image/')) {
    throw new AppError(400, 'BAD_REQUEST', 'Hanya menerima file gambar (image).');
  }

  // Validasi bucket yang diizinkan
  const allowedBuckets = ['avatars', 'store-photos', 'product-photos', 'review-photos'];
  if (!allowedBuckets.includes(bucket)) {
    throw new AppError(400, 'BAD_REQUEST', 'Tipe upload (bucket) tidak valid.');
  }

  // Generate nama unik untuk foto
  const fileExtension = file.originalname.split('.').pop();
  const randomName = crypto.randomUUID();
  const fileName = `${randomName}.${fileExtension}`;

  // Mengupload ke Storage Supabase di bucket yang dipilih
  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .upload(fileName, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  if (error) {
    throw new AppError(500, 'INTERNAL_SERVER_ERROR', `Gagal mengupload foto ke Supabase: ${error.message}`);
  }

  // Mendapatkan URL publik gambar
  const { data: publicUrlData } = supabaseAdmin.storage
    .from(bucket)
    .getPublicUrl(fileName);

  return {
    url: publicUrlData.publicUrl,
  };
}
