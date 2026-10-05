import 'dotenv/config';
import pg from 'pg';

const { Client } = pg;
const client = new Client({
  connectionString: 'postgresql://postgres.pgpvmicrsnqwhgsvudbv:Remeal-2026!@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres'
});

async function run() {
  await client.connect();
  
  const res = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'stores';
  `);
  console.log("stores table columns:", res.rows);
  
  await client.end();
}
run();
