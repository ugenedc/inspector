-- Room inspection data for wizard interface
-- Run this SQL in your Supabase SQL editor (AFTER running the main schema.sql and rooms-schema.sql)

-- Update rooms table to include inspection data
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT false;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS comments TEXT;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS ai_analysis TEXT;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS analysis_timestamp TIMESTAMP WITH TIME ZONE;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS completion_timestamp TIMESTAMP WITH TIME ZONE;

-- Create index for completion tracking
CREATE INDEX IF NOT EXISTS idx_rooms_completion ON rooms(inspection_id, is_completed);

-- Add inspection progress tracking to inspections table
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS total_rooms INTEGER DEFAULT 0;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS completed_rooms INTEGER DEFAULT 0;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS progress_percentage DECIMAL(5,2) DEFAULT 0.00;

-- Function to update inspection progress
CREATE OR REPLACE FUNCTION update_inspection_progress()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the inspection progress when room completion status changes
    UPDATE inspections 
    SET 
        total_rooms = (
            SELECT COUNT(*) 
            FROM rooms 
            WHERE inspection_id = COALESCE(NEW.inspection_id, OLD.inspection_id)
            AND is_selected = true
        ),
        completed_rooms = (
            SELECT COUNT(*) 
            FROM rooms 
            WHERE inspection_id = COALESCE(NEW.inspection_id, OLD.inspection_id)
            AND is_selected = true 
            AND is_completed = true
        )
    WHERE id = COALESCE(NEW.inspection_id, OLD.inspection_id);
    
    -- Update progress percentage
    UPDATE inspections 
    SET progress_percentage = CASE 
        WHEN total_rooms > 0 THEN (completed_rooms::DECIMAL / total_rooms::DECIMAL) * 100
        ELSE 0 
    END
    WHERE id = COALESCE(NEW.inspection_id, OLD.inspection_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update progress
DROP TRIGGER IF EXISTS update_inspection_progress_trigger ON rooms;
CREATE TRIGGER update_inspection_progress_trigger
    AFTER INSERT OR UPDATE OR DELETE ON rooms
    FOR EACH ROW
    EXECUTE FUNCTION update_inspection_progress();

-- Create storage bucket for room photos (run this in Supabase dashboard if using Supabase Storage)
-- This is a comment as it needs to be done through the Supabase dashboard
/*
1. Go to Storage in your Supabase dashboard
2. Create a new bucket called 'room-photos'
3. Set it to public if you want direct access to images
4. Configure RLS policies for the bucket to match user access
*/