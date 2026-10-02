import { supabaseAdmin } from '../config/supabase.js';
import { mapDbError } from '../utils/dbError.js';

export async function getSellerDashboard(sellerId) {
  const { data, error } = await supabaseAdmin.rpc('get_seller_dashboard', { p_owner: sellerId });
  if (error) throw mapDbError(error);
  return data;
}

export async function getSellerStockReminders(sellerId) {
  const { data, error } = await supabaseAdmin.rpc('get_stock_reminders', { p_owner: sellerId });
  if (error) throw mapDbError(error);
  return data;
}