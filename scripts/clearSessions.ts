import 'dotenv/config';
import { pool } from '../server/db';

(async () => {
  try {
    console.log('Connecting to database...');
    // Count existing sessions
    const countRes: any = await pool.query('SELECT COUNT(*)::int as count FROM sessions');
    const before = countRes?.rows?.[0]?.count ?? (countRes?.rowCount ?? 0);
    console.log(`Sessions before delete: ${before}`);

    if (!before || before === 0) {
      console.log('No sessions to delete.');
      process.exit(0);
    }

    // Delete all sessions and try to get number deleted
    // Using RETURNING to get precise number of deleted rows if supported
    const delRes: any = await pool.query('DELETE FROM sessions RETURNING 1');
    const deleted = Array.isArray(delRes?.rows) ? delRes.rows.length : (delRes?.rowCount ?? 0);
    console.log(`Deleted sessions: ${deleted}`);
  } catch (err) {
    console.error('Error clearing sessions:', err);
    process.exit(1);
  } finally {
    // pool.end may or may not be required for this Pool implementation; attempt to close if available
    try {
      if (typeof (pool as any).end === 'function') await (pool as any).end();
    } catch (_) {}
    process.exit(0);
  }
})();
