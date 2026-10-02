// src/services/categories.service.js
import { supabaseAdmin } from '../config/supabase.js';
import { mapDbError } from '../utils/dbError.js';

export async function listCategories() {
  const { data, error } = await supabaseAdmin
    .from('categories')
    .select('id, name, icon')
    .order('name', { ascending: true });

  if (error) throw mapDbError(error);
  return data;
}