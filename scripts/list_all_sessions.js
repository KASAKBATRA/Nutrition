import 'dotenv/config';
import { pool } from '../server/db.ts';

async function main() {
  try {
    const res = await pool.query("SELECT sid, sess->>'userId' as userId, expire FROM sessions ORDER BY expire DESC LIMIT 100");
    if (res.rowCount === 0) {
      console.log('No sessions found');
      return;
    }
    console.log(`Found ${res.rowCount} sessions (showing up to 100):`);
    res.rows.forEach((r, i) => {
      console.log(`#${i+1}`);
      console.log('sid:', r.sid);
      console.log("userId:", r.userid || r.userId || null);
      console.log('expire:', r.expire);
      console.log('---');
    });
  } catch (err) {
    console.error('Error listing sessions:', err);
  } finally {
    await pool.end();
  }
}

main();
