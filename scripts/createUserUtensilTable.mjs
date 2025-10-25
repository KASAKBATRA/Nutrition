import 'dotenv/config';
import { Pool } from '@neondatabase/serverless';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const createSql = `
CREATE TABLE IF NOT EXISTS user_utensil_mapping (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id varchar NOT NULL REFERENCES users(id),
  utensil_type varchar NOT NULL,
  grams_per_unit numeric(8,2) NOT NULL,
  created_at timestamp DEFAULT now()
);
`;

(async () => {
  try {
    console.log('Creating user_utensil_mapping table if not exists...');
    await pool.query(createSql);
    console.log('Done.');
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('Error creating table:', err);
    try { await pool.end(); } catch (_) {}
    process.exit(1);
  }
})();
