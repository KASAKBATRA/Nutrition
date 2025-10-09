import 'dotenv/config';
import { pool } from './server/db.ts';

async function debugDatabase() {
  try {
    console.log('🔍 Debugging Database User Isolation...\n');
    
    // Check all users
    const usersResult = await pool.query(
      'SELECT id, email, first_name, last_name, role, is_verified FROM users ORDER BY created_at DESC'
    );
    console.log('👥 All Users:');
    console.table(usersResult.rows);
    
    // Check food logs with user associations
    const foodLogsResult = await pool.query(`
      SELECT 
        fl.id,
        fl.user_id,
        u.email,
        u.first_name,
        fl.meal_name,
        fl.calories,
        fl.logged_at::date as log_date
      FROM food_logs fl
      LEFT JOIN users u ON fl.user_id = u.id
      ORDER BY fl.logged_at DESC
      LIMIT 20
    `);
    console.log('\n🍽️ Recent Food Logs:');
    console.table(foodLogsResult.rows);
    
    // Check data distribution
    const statsResult = await pool.query(`
      SELECT 
        COUNT(*) as total_food_logs,
        COUNT(DISTINCT user_id) as unique_users_with_logs
      FROM food_logs
    `);
    console.log('\n📊 Food Logs Statistics:');
    console.table(statsResult.rows);
    
    // Check water logs
    const waterLogsResult = await pool.query(`
      SELECT 
        wl.id,
        wl.user_id, 
        u.email,
        wl.amount,
        wl.date::date as log_date
      FROM water_logs wl
      LEFT JOIN users u ON wl.user_id = u.id
      ORDER BY wl.date DESC
      LIMIT 10
    `);
    console.log('\n💧 Recent Water Logs:');
    console.table(waterLogsResult.rows);
    
    // Check for any orphaned data
    const orphanedFoodLogs = await pool.query(`
      SELECT COUNT(*) as orphaned_count
      FROM food_logs fl
      LEFT JOIN users u ON fl.user_id = u.id
      WHERE u.id IS NULL
    `);
    console.log('\n⚠️ Orphaned Food Logs (no user association):');
    console.table(orphanedFoodLogs.rows);
    
  } catch (error) {
    console.error('❌ Database debug error:', error);
  } finally {
    await pool.end();
  }
}

debugDatabase();