-- Photos table for detailed photo metadata tracking
-- Run this SQL in your Supabase SQL editor

-- Create photos table
CREATE TABLE IF NOT EXISTS photos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    inspection_id UUID NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255),
    storage_path TEXT NOT NULL,
    public_url TEXT NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100),
    width INTEGER,
    height INTEGER,
    capture_method VARCHAR(20) CHECK (capture_method IN ('camera', 'upload', 'unknown')) DEFAULT 'unknown',
    description TEXT,
    tags TEXT[], -- Array of tags for categorization
    is_primary BOOLEAN DEFAULT false, -- Mark one photo as primary for the room
    uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure filename is unique within the room
    UNIQUE(room_id, filename)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_photos_inspection_id ON photos(inspection_id);
CREATE INDEX IF NOT EXISTS idx_photos_room_id ON photos(room_id);
CREATE INDEX IF NOT EXISTS idx_photos_uploaded_by ON photos(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_photos_is_primary ON photos(room_id, is_primary);
CREATE INDEX IF NOT EXISTS idx_photos_created_at ON photos(created_at);

-- Add updated_at trigger
CREATE TRIGGER update_photos_updated_at
    BEFORE UPDATE ON photos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS)
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access photos for their own inspections
CREATE POLICY "Users can view photos for their inspections" ON photos
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM inspections 
            WHERE inspections.id = photos.inspection_id 
            AND inspections.inspector_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert photos for their inspections" ON photos
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM inspections 
            WHERE inspections.id = photos.inspection_id 
            AND inspections.inspector_id = auth.uid()
        )
    );

CREATE POLICY "Users can update photos for their inspections" ON photos
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM inspections 
            WHERE inspections.id = photos.inspection_id 
            AND inspections.inspector_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete photos for their inspections" ON photos
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM inspections 
            WHERE inspections.id = photos.inspection_id 
            AND inspections.inspector_id = auth.uid()
        )
    );

-- Function to automatically set primary photo if none exists
CREATE OR REPLACE FUNCTION set_primary_photo_if_none()
RETURNS TRIGGER AS $$
BEGIN
    -- If this is the first photo for the room, make it primary
    IF NOT EXISTS (
        SELECT 1 FROM photos 
        WHERE room_id = NEW.room_id 
        AND is_primary = true 
        AND id != NEW.id
    ) THEN
        NEW.is_primary = true;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically set primary photo
CREATE TRIGGER set_primary_photo_trigger
    BEFORE INSERT ON photos
    FOR EACH ROW
    EXECUTE FUNCTION set_primary_photo_if_none();

-- Function to ensure only one primary photo per room
CREATE OR REPLACE FUNCTION ensure_single_primary_photo()
RETURNS TRIGGER AS $$
BEGIN
    -- If setting a photo as primary, unset all others in the same room
    IF NEW.is_primary = true AND OLD.is_primary = false THEN
        UPDATE photos 
        SET is_primary = false 
        WHERE room_id = NEW.room_id 
        AND id != NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to ensure only one primary photo per room
CREATE TRIGGER ensure_single_primary_photo_trigger
    BEFORE UPDATE ON photos
    FOR EACH ROW
    EXECUTE FUNCTION ensure_single_primary_photo();

-- Add photo count to rooms table for quick reference
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS photo_count INTEGER DEFAULT 0;

-- Function to update room photo count
CREATE OR REPLACE FUNCTION update_room_photo_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Update photo count for the affected room(s)
    IF TG_OP = 'DELETE' THEN
        UPDATE rooms 
        SET photo_count = (
            SELECT COUNT(*) FROM photos WHERE room_id = OLD.room_id
        )
        WHERE id = OLD.room_id;
        RETURN OLD;
    ELSE
        UPDATE rooms 
        SET photo_count = (
            SELECT COUNT(*) FROM photos WHERE room_id = NEW.room_id
        )
        WHERE id = NEW.room_id;
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update room photo count
CREATE TRIGGER update_room_photo_count_trigger
    AFTER INSERT OR DELETE ON photos
    FOR EACH ROW
    EXECUTE FUNCTION update_room_photo_count();