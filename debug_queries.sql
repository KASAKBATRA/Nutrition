-- Check all users and their IDs
SELECT id, email, "firstName", "lastName", role, "isVerified" FROM users ORDER BY "createdAt" DESC;

-- Check food logs with user associations
SELECT 
  fl.id,
  fl."userId",
  u.email,
  u."firstName",
  fl."mealName",
  fl.calories,
  fl."loggedAt"::date as log_date
FROM food_logs fl
LEFT JOIN users u ON fl."userId" = u.id
ORDER BY fl."loggedAt" DESC
LIMIT 20;

-- Check if there's any data without proper user association
SELECT 
  COUNT(*) as total_food_logs,
  COUNT(DISTINCT "userId") as unique_users_with_logs
FROM food_logs;

-- Check water logs
SELECT 
  wl.id,
  wl."userId", 
  u.email,
  wl.amount,
  wl.date::date as log_date
FROM water_logs wl
LEFT JOIN users u ON wl."userId" = u.id
ORDER BY wl.date DESC
LIMIT 10;