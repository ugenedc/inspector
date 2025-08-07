-- Safe migration: Add share_token fields only if they don't exist
-- Check if columns exist before adding them

-- Add share_token column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'inspections' 
                   AND column_name = 'share_token') THEN
        ALTER TABLE public.inspections ADD COLUMN share_token text UNIQUE;
    END IF;
END $$;

-- Add share_enabled column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'inspections' 
                   AND column_name = 'share_enabled') THEN
        ALTER TABLE public.inspections ADD COLUMN share_enabled boolean DEFAULT false;
    END IF;
END $$;

-- Add shared_at column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'inspections' 
                   AND column_name = 'shared_at') THEN
        ALTER TABLE public.inspections ADD COLUMN shared_at timestamp with time zone;
    END IF;
END $$;

-- Create index if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_inspections_share_token 
ON public.inspections(share_token) WHERE share_token IS NOT NULL;

-- Create RLS policies if they don't exist
DO $$ 
BEGIN
    -- Check if policy exists before creating
    IF NOT EXISTS (SELECT 1 FROM pg_policies 
                   WHERE schemaname = 'public' 
                   AND tablename = 'inspections' 
                   AND policyname = 'Allow public access with valid share token') THEN
        CREATE POLICY "Allow public access with valid share token" ON public.inspections
        FOR SELECT USING (share_enabled = true AND share_token IS NOT NULL);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies 
                   WHERE schemaname = 'public' 
                   AND tablename = 'rooms' 
                   AND policyname = 'Allow public room access for shared inspections') THEN
        CREATE POLICY "Allow public room access for shared inspections" ON public.rooms
        FOR SELECT USING (
          inspection_id IN (
            SELECT id FROM public.inspections 
            WHERE share_enabled = true AND share_token IS NOT NULL
          )
        );
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies 
                   WHERE schemaname = 'public' 
                   AND tablename = 'photos' 
                   AND policyname = 'Allow public photo access for shared inspections') THEN
        CREATE POLICY "Allow public photo access for shared inspections" ON public.photos
        FOR SELECT USING (
          inspection_id IN (
            SELECT id FROM public.inspections 
            WHERE share_enabled = true AND share_token IS NOT NULL
          )
        );
    END IF;
END $$;