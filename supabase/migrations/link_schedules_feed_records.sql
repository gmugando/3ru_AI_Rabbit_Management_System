-- Create relationship between feeding schedules and feed records
-- This migration adds a foreign key relationship and creates helper views/functions

-- Add optional schedule_id to feed_records table to link manual records to schedules
ALTER TABLE public.feed_records 
ADD COLUMN IF NOT EXISTS schedule_id UUID;

-- Add foreign key constraint safely
DO $$
BEGIN
    -- Add foreign key to feeding_schedules if types are compatible
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'feed_records_schedule_id_fkey'
        AND table_name = 'feed_records'
    ) THEN
        IF (
            SELECT data_type FROM information_schema.columns 
            WHERE table_name = 'feeding_schedules' AND column_name = 'id'
        ) = (
            SELECT data_type FROM information_schema.columns 
            WHERE table_name = 'feed_records' AND column_name = 'schedule_id'
        ) THEN
            ALTER TABLE public.feed_records 
            ADD CONSTRAINT feed_records_schedule_id_fkey 
            FOREIGN KEY (schedule_id) REFERENCES public.feeding_schedules(id);
        END IF;
    END IF;
END $$;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS feed_records_schedule_id_idx ON public.feed_records(schedule_id);

-- Add comment
COMMENT ON COLUMN public.feed_records.schedule_id IS 'Optional reference to the feeding schedule that generated this record';

-- Create a view that shows schedule performance and compliance
CREATE OR REPLACE VIEW public.feeding_schedule_performance AS
WITH schedule_stats AS (
  SELECT 
    fs.id,
    fs.name,
    fs.user_id,
    fs.feed_type,
    fs.frequency,
    fs.amount as expected_amount,
    fs.amount_unit,
    fs.execution_count,
    fs.created_at as schedule_created,
    fs.is_active,
    fs.next_due_at,
    fs.last_executed_at,
    
    -- Count related feed records (with safe type casting)
    COUNT(fr.id) as total_feed_records,
    COUNT(CASE WHEN fr.record_type = 'consumption' THEN 1 END) as consumption_records,
    
    -- Calculate total amounts
    SUM(CASE WHEN fr.record_type = 'consumption' THEN fr.amount ELSE 0 END) as total_consumed,
    AVG(CASE WHEN fr.record_type = 'consumption' THEN fr.amount ELSE NULL END) as avg_consumption,
    
    -- Calculate compliance (executions vs expected executions)
    CASE 
      WHEN fs.frequency = 'daily' THEN 
        EXTRACT(DAY FROM NOW() - fs.created_at) 
      WHEN fs.frequency = 'weekly' THEN 
        EXTRACT(DAY FROM NOW() - fs.created_at) / 7
      WHEN fs.frequency = 'biweekly' THEN 
        EXTRACT(DAY FROM NOW() - fs.created_at) / 14
      WHEN fs.frequency = 'monthly' THEN 
        EXTRACT(DAY FROM NOW() - fs.created_at) / 30
      ELSE 0
    END as expected_executions,
    
    -- Latest feed record
    MAX(fr.date) as last_feed_date,
    
    -- Schedule age in days
    EXTRACT(DAY FROM NOW() - fs.created_at) as schedule_age_days
    
  FROM public.feeding_schedules fs
  LEFT JOIN public.feed_records fr ON fs.id::text = fr.schedule_id::text
  WHERE fs.is_deleted = false
  GROUP BY fs.id, fs.name, fs.user_id, fs.feed_type, fs.frequency, 
           fs.amount, fs.amount_unit, fs.execution_count, fs.created_at,
           fs.is_active, fs.next_due_at, fs.last_executed_at
)
SELECT 
  *,
  CASE 
    WHEN expected_executions > 0 THEN 
      ROUND((execution_count::decimal / expected_executions) * 100, 2)
    ELSE 0 
  END as compliance_percentage,
  
  CASE 
    WHEN expected_amount IS NOT NULL AND total_consumed > 0 THEN
      ROUND(total_consumed / execution_count, 2)
    ELSE NULL
  END as avg_amount_per_execution,
  
  CASE 
    WHEN is_active AND next_due_at < NOW() THEN 'overdue'
    WHEN is_active AND next_due_at BETWEEN NOW() AND NOW() + INTERVAL '24 hours' THEN 'due_soon'
    WHEN is_active THEN 'active'
    ELSE 'inactive'
  END as status
FROM schedule_stats;

-- Grant access to the view
GRANT SELECT ON public.feeding_schedule_performance TO authenticated;

-- Create a function to get feeding schedule summary for a user
CREATE OR REPLACE FUNCTION public.get_feeding_schedule_summary(user_id_param UUID)
RETURNS TABLE (
  total_schedules INTEGER,
  active_schedules INTEGER,
  overdue_schedules INTEGER,
  due_today INTEGER,
  total_executions INTEGER,
  avg_compliance DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_schedules,
    COUNT(CASE WHEN is_active = true THEN 1 END)::INTEGER as active_schedules,
    COUNT(CASE WHEN status = 'overdue' THEN 1 END)::INTEGER as overdue_schedules,
    COUNT(CASE WHEN status = 'due_soon' THEN 1 END)::INTEGER as due_today,
    SUM(execution_count)::INTEGER as total_executions,
    ROUND(AVG(compliance_percentage), 2) as avg_compliance
  FROM public.feeding_schedule_performance
  WHERE user_id = user_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_feeding_schedule_summary TO authenticated;

-- Create a function to get schedule history with feed records
CREATE OR REPLACE FUNCTION public.get_schedule_history(
  schedule_id_param UUID,
  days_back INTEGER DEFAULT 30
)
RETURNS TABLE (
  execution_date DATE,
  execution_time TIMESTAMP WITH TIME ZONE,
  amount_fed DECIMAL,
  notes TEXT,
  feed_record_id UUID,
  execution_status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    fse.executed_at::DATE as execution_date,
    fse.executed_at as execution_time,
    fse.amount_fed,
    fse.notes,
    fse.feed_record_id,
    fse.execution_status
  FROM public.feeding_schedule_executions fse
  WHERE fse.schedule_id = schedule_id_param
    AND fse.executed_at >= NOW() - INTERVAL '1 day' * days_back
  ORDER BY fse.executed_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_schedule_history TO authenticated;

-- Create a function to bulk update schedule status
CREATE OR REPLACE FUNCTION public.bulk_update_schedule_status(
  schedule_ids UUID[],
  new_status BOOLEAN,
  user_id_param UUID
)
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE public.feeding_schedules
  SET 
    is_active = new_status,
    updated_at = NOW()
  WHERE 
    id = ANY(schedule_ids)
    AND user_id = user_id_param
    AND is_deleted = false;
    
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.bulk_update_schedule_status TO authenticated;

-- Create a function to get upcoming schedules for a user
CREATE OR REPLACE FUNCTION public.get_upcoming_schedules(
  user_id_param UUID,
  hours_ahead INTEGER DEFAULT 24
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  "time" TIME,
  feed_type TEXT,
  amount DECIMAL,
  amount_unit TEXT,
  sections TEXT,
  priority TEXT,
  next_due_at TIMESTAMP WITH TIME ZONE,
  hours_until_due DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    fs.id,
    fs.name,
    fs.description,
    fs."time",
    fs.feed_type,
    fs.amount,
    fs.amount_unit,
    fs.sections,
    fs.priority,
    fs.next_due_at,
    ROUND(EXTRACT(EPOCH FROM (fs.next_due_at - NOW())) / 3600, 2) as hours_until_due
  FROM public.feeding_schedules fs
  WHERE 
    fs.user_id = user_id_param
    AND fs.is_active = true
    AND fs.is_deleted = false
    AND fs.next_due_at IS NOT NULL
    AND fs.next_due_at BETWEEN NOW() AND NOW() + INTERVAL '1 hour' * hours_ahead
    AND (fs.end_date IS NULL OR fs.end_date >= CURRENT_DATE)
  ORDER BY fs.next_due_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_upcoming_schedules TO authenticated;

-- Create a function to create a feed record from a template/schedule
CREATE OR REPLACE FUNCTION public.create_feed_record_from_schedule(
  schedule_id_param UUID,
  amount_override DECIMAL DEFAULT NULL,
  feed_brand_override TEXT DEFAULT NULL,
  notes_override TEXT DEFAULT NULL,
  sections_override TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  schedule_record RECORD;
  feed_record_id UUID;
  current_user_id UUID;
BEGIN
  -- Get current user
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- Get schedule details
  SELECT * INTO schedule_record
  FROM public.feeding_schedules
  WHERE id = schedule_id_param 
    AND user_id = current_user_id 
    AND is_deleted = false;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Schedule not found or access denied';
  END IF;
  
  -- Create feed record
  INSERT INTO public.feed_records (
    user_id,
    feed_type,
    feed_brand,
    record_type,
    amount,
    date,
    sections,
    notes,
    schedule_id
  ) VALUES (
    current_user_id,
    schedule_record.feed_type,
    COALESCE(feed_brand_override, 'From Schedule: ' || schedule_record.name),
    'consumption',
    COALESCE(amount_override, schedule_record.amount, 0),
    CURRENT_DATE,
    COALESCE(sections_override, schedule_record.sections),
    COALESCE(notes_override, 'Auto-generated from schedule: ' || schedule_record.name),
    schedule_id_param
  ) RETURNING id INTO feed_record_id;
  
  RETURN feed_record_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.create_feed_record_from_schedule TO authenticated;

-- Create a trigger to update feed_records when a schedule is deleted
CREATE OR REPLACE FUNCTION public.handle_schedule_deletion()
RETURNS TRIGGER AS $$
BEGIN
  -- When a schedule is soft deleted, optionally mark related feed records
  IF NEW.is_deleted = true AND OLD.is_deleted = false THEN
    -- Just add a note to related feed records that the schedule was deleted
    UPDATE public.feed_records
    SET 
      notes = COALESCE(notes || ' ', '') || '[Schedule deleted: ' || NEW.name || ']',
      updated_at = NOW()
    WHERE schedule_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for schedule deletion
DROP TRIGGER IF EXISTS handle_feeding_schedule_deletion ON public.feeding_schedules;
CREATE TRIGGER handle_feeding_schedule_deletion
  AFTER UPDATE ON public.feeding_schedules
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_schedule_deletion();

-- Create indexes for better performance on new queries
CREATE INDEX IF NOT EXISTS feeding_schedule_executions_executed_at_idx 
  ON public.feeding_schedule_executions(executed_at);
CREATE INDEX IF NOT EXISTS feeding_schedules_user_active_idx 
  ON public.feeding_schedules(user_id, is_active) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS feeding_schedules_next_due_idx 
  ON public.feeding_schedules(next_due_at) WHERE is_active = true AND is_deleted = false;

-- Add some helpful comments
COMMENT ON VIEW public.feeding_schedule_performance IS 'Comprehensive view of feeding schedule performance and compliance metrics';
COMMENT ON FUNCTION public.get_feeding_schedule_summary IS 'Get summary statistics for a user''s feeding schedules';
COMMENT ON FUNCTION public.get_schedule_history IS 'Get execution history for a specific schedule';
COMMENT ON FUNCTION public.bulk_update_schedule_status IS 'Bulk activate/deactivate multiple schedules';
COMMENT ON FUNCTION public.get_upcoming_schedules IS 'Get schedules due within specified hours';
COMMENT ON FUNCTION public.create_feed_record_from_schedule IS 'Create a feed record based on a schedule template';
