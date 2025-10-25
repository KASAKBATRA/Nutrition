import 'dotenv/config';
import { Pool } from '@neondatabase/serverless';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  try {
    const res = await pool.query("SELECT to_regclass('public.user_utensil_mapping') as exists;");
    console.log('to_regclass result:', res.rows[0]);
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('Error checking table:', err);
    try { await pool.end(); } catch (_) {}
    process.exit(1);
  }
})();
