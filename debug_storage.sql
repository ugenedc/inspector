-- Debug Supabase Storage Issues
-- Run this in your Supabase SQL Editor to check and fix storage access

-- 1. Check if the bucket exists and is public
SELECT id, name, public, file_size_limit, allowed_mime_types 
FROM storage.buckets 
WHERE name = 'room-photos';

-- 2. Check RLS policies on storage.objects
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage';

-- 3. Check if there are any photos in the bucket
SELECT name, bucket_id, owner, created_at 
FROM storage.objects 
WHERE bucket_id = 'room-photos' 
ORDER BY created_at DESC 
LIMIT 5;

-- 4. If bucket doesn't exist or isn't public, create/update it
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'room-photos', 
  'room-photos', 
  true,  -- Make sure this is true for public access
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
) 
ON CONFLICT (id) DO UPDATE SET 
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

-- 5. Create minimal RLS policy for public read access
DROP POLICY IF EXISTS "Public read access for room photos" ON storage.objects;
CREATE POLICY "Public read access for room photos" ON storage.objects
FOR SELECT 
USING (bucket_id = 'room-photos');