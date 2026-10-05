import { supabaseAdmin } from '../config/supabase.js';
import { AppError } from '../utils/errors.js';
import crypto from 'crypto';

export async function uploadPhoto(file) {
  if (!file) {
    throw new AppError(400, 'BAD_REQUEST', 'File foto tidak ditemukan.');
  }

  // Validasi format file harus berupa gambar
  if (!file.mimetype.startsWith('image/')) {
    throw new AppError(400, 'BAD_REQUEST', 'Hanya menerima file gambar (image).');
  }

  // Generate nama unik untuk foto
  const fileExtension = file.originalname.split('.').pop();
  const randomName = crypto.randomUUID();
  const fileName = `${randomName}.${fileExtension}`;

  // Mengupload ke Storage Supabase di bucket bernama 'photos'
  // Pastikan Anda telah membuat Storage Bucket bernama 'photos' dan diset ke Public di Supabase Dashboard
  const { data, error } = await supabaseAdmin.storage
    .from('photos')
    .upload(fileName, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  if (error) {
    throw new AppError(500, 'INTERNAL_SERVER_ERROR', `Gagal mengupload foto ke Supabase: ${error.message}`);
  }

  // Mendapatkan URL publik gambar
  const { data: publicUrlData } = supabaseAdmin.storage
    .from('photos')
    .getPublicUrl(fileName);

  return {
    url: publicUrlData.publicUrl,
  };
}
