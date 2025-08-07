-- Add share_token field to inspections table for public sharing
ALTER TABLE public.inspections 
ADD COLUMN share_token text UNIQUE,
ADD COLUMN share_enabled boolean DEFAULT false,
ADD COLUMN shared_at timestamp with time zone;

-- Create index for faster share token lookups
CREATE INDEX idx_inspections_share_token ON public.inspections(share_token) WHERE share_token IS NOT NULL;

-- Add RLS policy for public access via share token
CREATE POLICY "Allow public access with valid share token" ON public.inspections
FOR SELECT USING (share_enabled = true AND share_token IS NOT NULL);

-- Allow public access to rooms and photos for shared inspections
CREATE POLICY "Allow public room access for shared inspections" ON public.rooms
FOR SELECT USING (
  inspection_id IN (
    SELECT id FROM public.inspections 
    WHERE share_enabled = true AND share_token IS NOT NULL
  )
);

CREATE POLICY "Allow public photo access for shared inspections" ON public.photos
FOR SELECT USING (
  inspection_id IN (
    SELECT id FROM public.inspections 
    WHERE share_enabled = true AND share_token IS NOT NULL
  )
);