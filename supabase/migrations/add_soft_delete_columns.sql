-- Add soft delete columns to all tables for multi-tenancy support
-- This migration must be run before fix_multi_tenancy_rls.sql

-- Add soft delete columns to breeding_plans table
ALTER TABLE public.breeding_plans 
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

-- Add soft delete columns to transactions table
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

-- Add soft delete columns to health_records table
ALTER TABLE public.health_records 
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

-- Add soft delete columns to weight_records table
ALTER TABLE public.weight_records 
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

-- Add soft delete columns to schedule_events table
ALTER TABLE public.schedule_events 
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

-- Add soft delete columns to kit_records table
ALTER TABLE public.kit_records 
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

-- Add soft delete columns to kit_health_records table
ALTER TABLE public.kit_health_records 
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

-- Create indexes for better performance on soft delete queries
CREATE INDEX IF NOT EXISTS idx_breeding_plans_is_deleted ON public.breeding_plans(is_deleted);
CREATE INDEX IF NOT EXISTS idx_transactions_is_deleted ON public.transactions(is_deleted);
CREATE INDEX IF NOT EXISTS idx_health_records_is_deleted ON public.health_records(is_deleted);
CREATE INDEX IF NOT EXISTS idx_weight_records_is_deleted ON public.weight_records(is_deleted);
CREATE INDEX IF NOT EXISTS idx_schedule_events_is_deleted ON public.schedule_events(is_deleted);
CREATE INDEX IF NOT EXISTS idx_kit_records_is_deleted ON public.kit_records(is_deleted);
CREATE INDEX IF NOT EXISTS idx_kit_health_records_is_deleted ON public.kit_health_records(is_deleted);

-- Add comments for documentation
COMMENT ON COLUMN public.breeding_plans.is_deleted IS 'Soft delete flag - records are marked as deleted instead of being physically removed';
COMMENT ON COLUMN public.breeding_plans.deleted_at IS 'Timestamp when the record was soft deleted';
COMMENT ON COLUMN public.breeding_plans.deleted_by IS 'User ID who performed the soft delete';

COMMENT ON COLUMN public.transactions.is_deleted IS 'Soft delete flag - records are marked as deleted instead of being physically removed';
COMMENT ON COLUMN public.transactions.deleted_at IS 'Timestamp when the record was soft deleted';
COMMENT ON COLUMN public.transactions.deleted_by IS 'User ID who performed the soft delete';

COMMENT ON COLUMN public.health_records.is_deleted IS 'Soft delete flag - records are marked as deleted instead of being physically removed';
COMMENT ON COLUMN public.health_records.deleted_at IS 'Timestamp when the record was soft deleted';
COMMENT ON COLUMN public.health_records.deleted_by IS 'User ID who performed the soft delete';

COMMENT ON COLUMN public.weight_records.is_deleted IS 'Soft delete flag - records are marked as deleted instead of being physically removed';
COMMENT ON COLUMN public.weight_records.deleted_at IS 'Timestamp when the record was soft deleted';
COMMENT ON COLUMN public.weight_records.deleted_by IS 'User ID who performed the soft delete';

COMMENT ON COLUMN public.schedule_events.is_deleted IS 'Soft delete flag - records are marked as deleted instead of being physically removed';
COMMENT ON COLUMN public.schedule_events.deleted_at IS 'Timestamp when the record was soft deleted';
COMMENT ON COLUMN public.schedule_events.deleted_by IS 'User ID who performed the soft delete';

COMMENT ON COLUMN public.kit_records.is_deleted IS 'Soft delete flag - records are marked as deleted instead of being physically removed';
COMMENT ON COLUMN public.kit_records.deleted_at IS 'Timestamp when the record was soft deleted';
COMMENT ON COLUMN public.kit_records.deleted_by IS 'User ID who performed the soft delete';

COMMENT ON COLUMN public.kit_health_records.is_deleted IS 'Soft delete flag - records are marked as deleted instead of being physically removed';
COMMENT ON COLUMN public.kit_health_records.deleted_at IS 'Timestamp when the record was soft deleted';
COMMENT ON COLUMN public.kit_health_records.deleted_by IS 'User ID who performed the soft delete';
