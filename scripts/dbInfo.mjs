import 'dotenv/config';
import { Pool } from '@neondatabase/serverless';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  try {
    const r = await pool.query(`SELECT current_database() as db, current_user as user, version() as version, current_schema() as schema, current_setting('search_path') as search_path;`);
    console.log(r.rows[0]);
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error(err);
    try { await pool.end(); } catch (_) {}
    process.exit(1);
  }
})();
