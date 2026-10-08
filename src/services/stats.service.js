import { supabaseAdmin } from '../config/supabase.js';
import { mapDbError } from '../utils/dbError.js';

export async function getPublicStats() {
  try {
    // Note: This is an approximation for the public stats.
    const { count: usersCount } = await supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true });
    const { count: storesCount } = await supabaseAdmin.from('stores').select('*', { count: 'exact', head: true }).eq('verification_status', 'approved');
    const { count: ordersCount } = await supabaseAdmin.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'completed');
    const { data: reviews } = await supabaseAdmin.from('reviews').select('rating');

    // Calculate satisfaction rate
    let satisfaction = '0%';
    if (reviews && reviews.length > 0) {
      const avg = reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length;
      satisfaction = `${Math.round((avg / 5) * 100)}%`;
    }

    // Assume 1 order (porsi) = ~0.25 kg of food waste avoided
    const wasteKg = (ordersCount || 0) * 0.25;
    const wasteAvoided = wasteKg >= 1000 ? `${(wasteKg / 1000).toFixed(1)} ton` : `${wasteKg} kg`;

    return {
      food_rescued: String(ordersCount || 0),
      users_joined: String(usersCount || 0),
      active_partners: String(storesCount || 0),
      satisfaction_rate: satisfaction,
      waste_avoided: wasteAvoided,
    };
  } catch (error) {
    throw mapDbError(error);
  }
}
