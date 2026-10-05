import 'dotenv/config';
import { supabaseAdmin } from './src/config/supabase.js';

async function run() {
  const { data, error } = await supabaseAdmin.rpc('get_seller_dashboard');
  console.log("RPC Error:", error);
}
run();
