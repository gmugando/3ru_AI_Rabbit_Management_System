-- Create vision_events table for camera/computer-vision detections
CREATE TABLE IF NOT EXISTS public.vision_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,

    -- Multi-tenant and ownership fields
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID,
    farm_id UUID,

    -- Source and entity linkage
    source_camera_id TEXT,
    cage_id TEXT,
    rabbit_id UUID REFERENCES public.rabbits(id) ON DELETE SET NULL,

    -- Event classification
    event_type TEXT NOT NULL CHECK (
        event_type IN (
            'low_activity',
            'isolation_detected',
            'abnormal_posture',
            'fur_loss_pattern',
            'nest_risk',
            'kit_outside_nest',
            'aggression_detected',
            'overcrowding_detected',
            'no_feeder_approach',
            'custom'
        )
    ),
    severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    confidence NUMERIC(4,3) NOT NULL DEFAULT 0.750 CHECK (confidence >= 0 AND confidence <= 1),

    -- Event lifecycle
    event_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    ingested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'acknowledged', 'resolved')),

    -- Flexible model metadata (bbox, model version, clip URL, notes, etc.)
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- RLS and policies
ALTER TABLE public.vision_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own vision events" ON public.vision_events;
DROP POLICY IF EXISTS "Users can insert their own vision events" ON public.vision_events;
DROP POLICY IF EXISTS "Users can update their own vision events" ON public.vision_events;
DROP POLICY IF EXISTS "Users can delete their own vision events" ON public.vision_events;

CREATE POLICY "Users can view their own vision events"
ON public.vision_events
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own vision events"
ON public.vision_events
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own vision events"
ON public.vision_events
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own vision events"
ON public.vision_events
FOR DELETE
USING (user_id = auth.uid());

-- Performance indexes for event queries and dashboard aggregation
CREATE INDEX IF NOT EXISTS idx_vision_events_user_event_time
ON public.vision_events(user_id, event_time DESC);

CREATE INDEX IF NOT EXISTS idx_vision_events_tenant_farm_event_time
ON public.vision_events(tenant_id, farm_id, event_time DESC);

CREATE INDEX IF NOT EXISTS idx_vision_events_type_severity_event_time
ON public.vision_events(event_type, severity, event_time DESC);

CREATE INDEX IF NOT EXISTS idx_vision_events_rabbit_id
ON public.vision_events(rabbit_id);

CREATE INDEX IF NOT EXISTS idx_vision_events_cage_id
ON public.vision_events(cage_id);

CREATE INDEX IF NOT EXISTS idx_vision_events_status_event_time
ON public.vision_events(status, event_time DESC);

-- Keep updated_at in sync
CREATE OR REPLACE FUNCTION public.update_vision_events_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS vision_events_updated_at_trigger ON public.vision_events;
CREATE TRIGGER vision_events_updated_at_trigger
BEFORE UPDATE ON public.vision_events
FOR EACH ROW
EXECUTE FUNCTION public.update_vision_events_updated_at();

COMMENT ON TABLE public.vision_events IS 'Computer-vision events from cameras/edge AI for rabbit behavior and health monitoring';
COMMENT ON COLUMN public.vision_events.confidence IS 'Model confidence score from 0 to 1';
COMMENT ON COLUMN public.vision_events.metadata IS 'Flexible payload for model metadata (bbox, clip URL, model version, notes)';
