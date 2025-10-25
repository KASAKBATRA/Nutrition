import 'dotenv/config';
import { pool } from '../server/db.ts';
import fs from 'fs';
import path from 'path';

async function main() {
  try {
    // Read all sessions first (backup)
    const res = await pool.query('SELECT * FROM sessions');
    const rows = res.rows || [];
    const backupDir = path.join(process.cwd(), 'scripts');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(backupDir, `sessions_backup_${timestamp}.json`);

    fs.writeFileSync(backupFile, JSON.stringify(rows, null, 2), 'utf-8');
    console.log(`Backed up ${rows.length} session rows to ${backupFile}`);

    // Delete all sessions
    const delRes = await pool.query('DELETE FROM sessions');
    console.log(`Deleted ${delRes.rowCount} session rows from database.`);
  } catch (err) {
    console.error('Error deleting sessions:', err);
  } finally {
    await pool.end();
  }
}

main();
