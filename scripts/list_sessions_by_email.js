import 'dotenv/config';
import { pool } from '../server/db.ts';

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error('Usage: npx tsx scripts/list_sessions_by_email.js <email>');
    process.exit(1);
  }

  try {
    const userRes = await pool.query('SELECT id, email, first_name, last_name FROM users WHERE email = $1', [email]);
    if (userRes.rowCount === 0) {
      console.log(`No user found with email: ${email}`);
      return;
    }
    const user = userRes.rows[0];
    console.log('Found user:', user);

    const sessionsRes = await pool.query("SELECT sid, sess, expire FROM sessions WHERE sess->>'userId' = $1", [user.id]);
    console.log(`\nSessions for user id ${user.id}: (${sessionsRes.rowCount})`);
    sessionsRes.rows.forEach((r, idx) => {
      console.log(`\n#${idx + 1}`);
      console.log('sid:', r.sid);
      console.log('expire:', r.expire);
      console.log('sess JSON:', JSON.stringify(r.sess));
    });

    if (sessionsRes.rowCount === 0) {
      console.log('\nNo sessions found for this user.');
    } else {
      console.log('\nTo force-logout this user, you can run the delete script or run:');
      console.log(`DELETE FROM sessions WHERE sess->>'userId' = '${user.id}';`);
    }
  } catch (err) {
    console.error('Error querying database:', err);
  } finally {
    await pool.end();
  }
}

main();
