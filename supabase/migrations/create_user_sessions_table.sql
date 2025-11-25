-- Drop existing table if it exists (for clean recreation)
-- WARNING: This will delete all existing session data
-- Comment out this line if you want to keep existing data
DROP TABLE IF EXISTS public.user_sessions CASCADE;

-- Create user_sessions table for tracking login activity
CREATE TABLE public.user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    
    -- User information
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    
    -- Session details
    session_id TEXT,
    login_time TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    logout_time TIMESTAMP WITH TIME ZONE,
    
    -- Request information
    ip_address TEXT,
    user_agent TEXT,
    browser TEXT,
    os TEXT,
    device TEXT,
    
    -- Location information (if available)
    country TEXT,
    city TEXT,
    region TEXT,
    timezone TEXT,
    
    -- Additional metadata
    login_method TEXT DEFAULT 'password',
    is_active BOOLEAN DEFAULT true,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RLS (Row Level Security) policies
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Policy for users to view their own sessions
CREATE POLICY "Users can view their own sessions" 
ON public.user_sessions
FOR SELECT
USING (user_id = auth.uid());

-- Policy for super admins to view all sessions
CREATE POLICY "Super admins can view all sessions" 
ON public.user_sessions
FOR SELECT
USING (
    EXISTS (
        SELECT 1 
        FROM public.profiles p
        INNER JOIN public.roles r ON r.id = p.role_id
        WHERE p.user_id = auth.uid()
        AND r.name = 'SUPER_ADMIN'
    )
);

-- Policy for system to insert sessions (anyone authenticated can insert their own)
CREATE POLICY "Users can insert their own sessions" 
ON public.user_sessions
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Policy for users to update their own sessions (for logout)
CREATE POLICY "Users can update their own sessions" 
ON public.user_sessions
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX idx_user_sessions_login_time ON public.user_sessions(login_time DESC);
CREATE INDEX idx_user_sessions_is_active ON public.user_sessions(is_active);
CREATE INDEX idx_user_sessions_ip_address ON public.user_sessions(ip_address);
CREATE INDEX idx_user_sessions_session_id ON public.user_sessions(session_id);

-- Create composite index for active sessions by user
CREATE INDEX idx_user_sessions_user_active ON public.user_sessions(user_id, is_active) 
WHERE is_active = true;

-- Add comment to the table
COMMENT ON TABLE public.user_sessions IS 'User login session tracking and audit log';

-- Create a function to automatically update last_activity
CREATE OR REPLACE FUNCTION public.update_session_activity()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_activity = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop trigger if exists before creating
DROP TRIGGER IF EXISTS update_user_sessions_activity ON public.user_sessions;

CREATE TRIGGER update_user_sessions_activity
BEFORE UPDATE ON public.user_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_session_activity();

-- Create a function to deactivate old sessions on new login
CREATE OR REPLACE FUNCTION public.deactivate_old_sessions()
RETURNS TRIGGER AS $$
BEGIN
    -- Mark all previous active sessions for this user as inactive
    UPDATE public.user_sessions
    SET is_active = false,
        logout_time = now()
    WHERE user_id = NEW.user_id
    AND is_active = true
    AND id != NEW.id;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop trigger if exists before creating
DROP TRIGGER IF EXISTS deactivate_old_user_sessions ON public.user_sessions;

CREATE TRIGGER deactivate_old_user_sessions
AFTER INSERT ON public.user_sessions
FOR EACH ROW
EXECUTE FUNCTION public.deactivate_old_sessions();

