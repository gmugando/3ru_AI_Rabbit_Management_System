-- Useful Queries for User Session Logging
-- Copy and paste these into your Supabase SQL Editor

-- ============================================
-- RECENT ACTIVITY
-- ============================================

-- View all recent sessions (last 24 hours)
SELECT 
  email,
  login_time,
  logout_time,
  ip_address,
  browser,
  os,
  device,
  city,
  country,
  is_active,
  CASE 
    WHEN logout_time IS NOT NULL THEN 
      EXTRACT(EPOCH FROM (logout_time - login_time))/60
    ELSE 
      EXTRACT(EPOCH FROM (NOW() - login_time))/60
  END as session_duration_minutes
FROM user_sessions
WHERE login_time > NOW() - INTERVAL '24 hours'
ORDER BY login_time DESC;

-- View currently active sessions
SELECT 
  email,
  login_time,
  ip_address,
  browser || ' on ' || os as platform,
  device,
  city || ', ' || country as location,
  EXTRACT(EPOCH FROM (NOW() - login_time))/60 as active_minutes
FROM user_sessions
WHERE is_active = true
ORDER BY login_time DESC;

-- ============================================
-- USER ACTIVITY
-- ============================================

-- Sessions for a specific user (replace email)
SELECT 
  login_time,
  logout_time,
  ip_address,
  browser,
  os,
  device,
  city || ', ' || country as location,
  is_active,
  CASE 
    WHEN logout_time IS NOT NULL THEN 
      ROUND(EXTRACT(EPOCH FROM (logout_time - login_time))/60::numeric, 2)
    ELSE NULL
  END as session_duration_minutes
FROM user_sessions
WHERE email = 'user@example.com'  -- Replace with actual email
ORDER BY login_time DESC
LIMIT 20;

-- Count logins per user
SELECT 
  email,
  COUNT(*) as total_logins,
  COUNT(CASE WHEN is_active THEN 1 END) as active_sessions,
  MAX(login_time) as last_login,
  MIN(login_time) as first_login
FROM user_sessions
GROUP BY email
ORDER BY total_logins DESC;

-- ============================================
-- STATISTICS
-- ============================================

-- Browser usage statistics
SELECT 
  browser,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM user_sessions
GROUP BY browser
ORDER BY count DESC;

-- Operating system statistics
SELECT 
  os,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM user_sessions
GROUP BY os
ORDER BY count DESC;

-- Device type statistics
SELECT 
  device,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM user_sessions
GROUP BY device
ORDER BY count DESC;

-- Login by country
SELECT 
  country,
  COUNT(*) as count
FROM user_sessions
WHERE country IS NOT NULL
GROUP BY country
ORDER BY count DESC;

-- Login by city (top 20)
SELECT 
  city || ', ' || country as location,
  COUNT(*) as count
FROM user_sessions
WHERE city IS NOT NULL
GROUP BY city, country
ORDER BY count DESC
LIMIT 20;

-- ============================================
-- TIME-BASED ANALYSIS
-- ============================================

-- Logins by hour of day
SELECT 
  EXTRACT(HOUR FROM login_time) as hour,
  COUNT(*) as login_count
FROM user_sessions
GROUP BY EXTRACT(HOUR FROM login_time)
ORDER BY hour;

-- Logins by day of week
SELECT 
  TO_CHAR(login_time, 'Day') as day_of_week,
  EXTRACT(DOW FROM login_time) as day_number,
  COUNT(*) as login_count
FROM user_sessions
GROUP BY TO_CHAR(login_time, 'Day'), EXTRACT(DOW FROM login_time)
ORDER BY day_number;

-- Daily login trends (last 30 days)
SELECT 
  DATE(login_time) as date,
  COUNT(*) as login_count,
  COUNT(DISTINCT email) as unique_users
FROM user_sessions
WHERE login_time > NOW() - INTERVAL '30 days'
GROUP BY DATE(login_time)
ORDER BY date DESC;

-- ============================================
-- SESSION DURATION ANALYSIS
-- ============================================

-- Average session duration by user
SELECT 
  email,
  COUNT(*) as total_sessions,
  ROUND(AVG(EXTRACT(EPOCH FROM (logout_time - login_time))/60)::numeric, 2) as avg_duration_minutes,
  ROUND(MIN(EXTRACT(EPOCH FROM (logout_time - login_time))/60)::numeric, 2) as min_duration_minutes,
  ROUND(MAX(EXTRACT(EPOCH FROM (logout_time - login_time))/60)::numeric, 2) as max_duration_minutes
FROM user_sessions
WHERE logout_time IS NOT NULL
GROUP BY email
ORDER BY avg_duration_minutes DESC;

-- Overall session duration stats
SELECT 
  COUNT(*) as total_completed_sessions,
  ROUND(AVG(EXTRACT(EPOCH FROM (logout_time - login_time))/60)::numeric, 2) as avg_minutes,
  ROUND(MIN(EXTRACT(EPOCH FROM (logout_time - login_time))/60)::numeric, 2) as min_minutes,
  ROUND(MAX(EXTRACT(EPOCH FROM (logout_time - login_time))/60)::numeric, 2) as max_minutes,
  ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (logout_time - login_time))/60)::numeric, 2) as median_minutes
FROM user_sessions
WHERE logout_time IS NOT NULL;

-- ============================================
-- SECURITY & ANOMALIES
-- ============================================

-- Users with multiple locations
SELECT 
  email,
  COUNT(DISTINCT ip_address) as unique_ips,
  COUNT(DISTINCT country) as unique_countries,
  STRING_AGG(DISTINCT country, ', ') as countries
FROM user_sessions
GROUP BY email
HAVING COUNT(DISTINCT country) > 1
ORDER BY unique_countries DESC;

-- Unusual login times (outside 6 AM - 11 PM)
SELECT 
  email,
  login_time,
  EXTRACT(HOUR FROM login_time) as hour,
  ip_address,
  city || ', ' || country as location
FROM user_sessions
WHERE EXTRACT(HOUR FROM login_time) NOT BETWEEN 6 AND 23
ORDER BY login_time DESC
LIMIT 50;

-- Very short sessions (less than 1 minute - possible issues)
SELECT 
  email,
  login_time,
  logout_time,
  ROUND(EXTRACT(EPOCH FROM (logout_time - login_time))::numeric, 2) as duration_seconds,
  browser,
  device
FROM user_sessions
WHERE logout_time IS NOT NULL
  AND EXTRACT(EPOCH FROM (logout_time - login_time)) < 60
ORDER BY login_time DESC
LIMIT 50;

-- Multiple logins from same IP
SELECT 
  ip_address,
  COUNT(DISTINCT email) as unique_users,
  COUNT(*) as total_logins,
  STRING_AGG(DISTINCT email, ', ') as users
FROM user_sessions
GROUP BY ip_address
HAVING COUNT(DISTINCT email) > 1
ORDER BY unique_users DESC;

-- ============================================
-- USER ENGAGEMENT
-- ============================================

-- Most active users (by login count)
SELECT 
  email,
  COUNT(*) as login_count,
  MAX(login_time) as last_login,
  ROUND(AVG(EXTRACT(EPOCH FROM (logout_time - login_time))/60)::numeric, 2) as avg_session_minutes
FROM user_sessions
GROUP BY email
ORDER BY login_count DESC
LIMIT 20;

-- User retention - users who logged in multiple times
SELECT 
  COUNT(DISTINCT email) as total_users,
  COUNT(DISTINCT CASE WHEN login_count > 1 THEN email END) as returning_users,
  ROUND(COUNT(DISTINCT CASE WHEN login_count > 1 THEN email END) * 100.0 / COUNT(DISTINCT email), 2) as retention_rate
FROM (
  SELECT email, COUNT(*) as login_count
  FROM user_sessions
  GROUP BY email
) subquery;

-- First-time vs returning users (last 7 days)
WITH user_first_login AS (
  SELECT email, MIN(login_time) as first_login
  FROM user_sessions
  GROUP BY email
)
SELECT 
  DATE(us.login_time) as date,
  COUNT(DISTINCT CASE WHEN ufl.first_login::date = us.login_time::date THEN us.email END) as new_users,
  COUNT(DISTINCT CASE WHEN ufl.first_login::date < us.login_time::date THEN us.email END) as returning_users
FROM user_sessions us
JOIN user_first_login ufl ON us.email = ufl.email
WHERE us.login_time > NOW() - INTERVAL '7 days'
GROUP BY DATE(us.login_time)
ORDER BY date DESC;

-- ============================================
-- MAINTENANCE
-- ============================================

-- Count sessions older than 90 days
SELECT COUNT(*) as old_sessions_count
FROM user_sessions
WHERE login_time < NOW() - INTERVAL '90 days';

-- View oldest and newest sessions
SELECT 
  'Oldest' as type,
  email,
  login_time,
  logout_time
FROM user_sessions
ORDER BY login_time ASC
LIMIT 1
UNION ALL
SELECT 
  'Newest' as type,
  email,
  login_time,
  logout_time
FROM user_sessions
ORDER BY login_time DESC
LIMIT 1;

-- Database size and row count
SELECT 
  COUNT(*) as total_records,
  COUNT(CASE WHEN is_active THEN 1 END) as active_sessions,
  MIN(login_time) as oldest_record,
  MAX(login_time) as newest_record,
  pg_size_pretty(pg_total_relation_size('user_sessions')) as table_size
FROM user_sessions;

-- ============================================
-- CLEANUP QUERIES (USE WITH CAUTION!)
-- ============================================

-- Archive sessions older than 90 days (UNCOMMENT TO USE)
-- CREATE TABLE user_sessions_archive AS
-- SELECT * FROM user_sessions
-- WHERE login_time < NOW() - INTERVAL '90 days';

-- Delete sessions older than 90 days (UNCOMMENT TO USE)
-- DELETE FROM user_sessions
-- WHERE login_time < NOW() - INTERVAL '90 days';

-- Mark stale active sessions as inactive (sessions active for more than 24 hours)
-- UPDATE user_sessions
-- SET is_active = false,
--     logout_time = login_time + INTERVAL '24 hours'
-- WHERE is_active = true
--   AND login_time < NOW() - INTERVAL '24 hours'
--   AND logout_time IS NULL;

