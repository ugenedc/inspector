-- Supabase Storage Setup for Photo Upload
-- This script creates the necessary storage bucket and policies for room photos

-- Note: Storage buckets must be created through the Supabase Dashboard
-- Go to Storage > Create Bucket > Name: 'room-photos' > Public: true

-- After creating the bucket, run these policies:

-- Enable RLS on the storage.objects table (this should already be enabled)
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to upload photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'room-photos', 
  'room-photos', 
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Policy: Allow authenticated users to upload photos to their inspection folders
CREATE POLICY "Users can upload photos to inspection folders" ON storage.objects
FOR INSERT 
TO authenticated
WITH CHECK (
  bucket_id = 'room-photos' 
  AND (storage.foldername(name))[1] = 'inspections'
);

-- Policy: Allow authenticated users to view photos from inspections they have access to
CREATE POLICY "Users can view inspection photos" ON storage.objects
FOR SELECT 
TO authenticated
USING (
  bucket_id = 'room-photos' 
  AND (
    -- Users can view photos from inspections they created
    EXISTS (
      SELECT 1 FROM inspections 
      WHERE inspections.id::text = (storage.foldername(name))[2]
      AND inspections.inspector_id = auth.uid()
    )
    OR
    -- Or from public access (if needed later)
    (storage.foldername(name))[1] = 'inspections'
  )
);

-- Policy: Allow authenticated users to delete photos from their inspections
CREATE POLICY "Users can delete their inspection photos" ON storage.objects
FOR DELETE 
TO authenticated
USING (
  bucket_id = 'room-photos' 
  AND EXISTS (
    SELECT 1 FROM inspections 
    WHERE inspections.id::text = (storage.foldername(name))[2]
    AND inspections.inspector_id = auth.uid()
  )
);

-- Policy: Allow authenticated users to update photo metadata
CREATE POLICY "Users can update their inspection photos" ON storage.objects
FOR UPDATE 
TO authenticated
USING (
  bucket_id = 'room-photos' 
  AND EXISTS (
    SELECT 1 FROM inspections 
    WHERE inspections.id::text = (storage.foldername(name))[2]
    AND inspections.inspector_id = auth.uid()
  )
);