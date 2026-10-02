// src/services/profile.service.js
import { supabaseAdmin } from '../config/supabase.js';
import { AppError } from '../utils/errors.js';
import { mapDbError } from '../utils/dbError.js';

export async function getMyProfile(userId) {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw mapDbError(error);
  if (!data) throw new AppError(404, 'NOT_FOUND', 'Profil pengguna tidak ditemukan.');

  return data;
}

export async function updateMyProfile(userId, input) {
  const updates = Object.fromEntries(
    ['full_name', 'phone', 'avatar_url']
      .filter((field) => Object.hasOwn(input, field))
      .map((field) => [field, input[field]]),
  );

  if (Object.keys(updates).length === 0) return getMyProfile(userId);

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select('*')
    .maybeSingle();

  if (error) throw mapDbError(error);
  if (!data) throw new AppError(404, 'NOT_FOUND', 'Profil pengguna tidak ditemukan.');

  return data;
}