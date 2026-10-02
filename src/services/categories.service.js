// src/services/categories.service.js
import { supabaseAdmin } from '../config/supabase.js';
import { AppError } from '../utils/errors.js';
import { mapDbError } from '../utils/dbError.js';

const categoryFields = 'id, name, icon';

export async function listCategories() {
  const { data, error } = await supabaseAdmin
    .from('categories')
    .select(categoryFields)
    .order('name', { ascending: true });

  if (error) throw mapDbError(error);
  return data;
}

export async function createCategory(input) {
  const { data, error } = await supabaseAdmin
    .from('categories')
    .insert(input)
    .select(categoryFields)
    .single();

  if (error) throw mapDbError(error);
  return data;
}

export async function updateCategory(categoryId, input) {
  const { data, error } = await supabaseAdmin
    .from('categories')
    .update(input)
    .eq('id', categoryId)
    .select(categoryFields)
    .maybeSingle();

  if (error) throw mapDbError(error);
  if (!data) throw new AppError(404, 'CATEGORY_NOT_FOUND', 'Kategori tidak ditemukan.');
  return data;
}

export async function deleteCategory(categoryId) {
  const { data, error } = await supabaseAdmin
    .from('categories')
    .delete()
    .eq('id', categoryId)
    .select('id')
    .maybeSingle();

  if (error?.code === '23503') {
    throw new AppError(409, 'CATEGORY_IN_USE', 'Kategori masih digunakan oleh produk.');
  }
  if (error) throw mapDbError(error);
  if (!data) throw new AppError(404, 'CATEGORY_NOT_FOUND', 'Kategori tidak ditemukan.');
}