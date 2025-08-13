-- Add missing is_deleted column to rabbits table
-- This ensures proper soft delete functionality

-- Check if the column already exists and add it if missing
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'rabbits' 
        AND column_name = 'is_deleted'
        AND table_schema = 'public'
    ) THEN
        -- Add the is_deleted column
        ALTER TABLE public.rabbits 
        ADD COLUMN is_deleted BOOLEAN DEFAULT false;
        
        -- Add the deleted_at column if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'rabbits' 
            AND column_name = 'deleted_at'
            AND table_schema = 'public'
        ) THEN
            ALTER TABLE public.rabbits 
            ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
        END IF;
        
        -- Add the deleted_by column if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'rabbits' 
            AND column_name = 'deleted_by'
            AND table_schema = 'public'
        ) THEN
            ALTER TABLE public.rabbits 
            ADD COLUMN deleted_by UUID REFERENCES auth.users(id);
        END IF;
        
        -- Create index for better performance on soft delete queries
        CREATE INDEX IF NOT EXISTS idx_rabbits_is_deleted ON public.rabbits(is_deleted);
        
        -- Add comment to the new columns
        COMMENT ON COLUMN public.rabbits.is_deleted IS 'Soft delete flag - true if rabbit is deleted';
        COMMENT ON COLUMN public.rabbits.deleted_at IS 'Timestamp when rabbit was soft deleted';
        COMMENT ON COLUMN public.rabbits.deleted_by IS 'User who soft deleted the rabbit';
        
        RAISE NOTICE 'Added soft delete columns to rabbits table';
    ELSE
        RAISE NOTICE 'Soft delete columns already exist in rabbits table';
    END IF;
END $$;
