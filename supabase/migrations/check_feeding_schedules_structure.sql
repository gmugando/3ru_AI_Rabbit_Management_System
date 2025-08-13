-- Check the current structure of feeding_schedules table
-- This will help us see what columns actually exist

SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'feeding_schedules' 
  AND table_schema = 'public'
ORDER BY ordinal_position;
