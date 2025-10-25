import 'dotenv/config';
import { Pool } from '@neondatabase/serverless';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  try {
    console.log('Connecting to database...');
    const countRes = await pool.query('SELECT COUNT(*)::int as count FROM sessions');
    const before = countRes?.rows?.[0]?.count ?? (countRes?.rowCount ?? 0);
    console.log(`Sessions before delete: ${before}`);

    if (!before || before === 0) {
      console.log('No sessions to delete.');
      await pool.end();
      process.exit(0);
    }

    const delRes = await pool.query('DELETE FROM sessions RETURNING 1');
    const deleted = Array.isArray(delRes?.rows) ? delRes.rows.length : (delRes?.rowCount ?? 0);
    console.log(`Deleted sessions: ${deleted}`);
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('Error clearing sessions:', err);
    try { await pool.end(); } catch (_) {}
    process.exit(1);
  }
})();
