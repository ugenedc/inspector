-- Rooms table for property inspections
-- Run this SQL in your Supabase SQL editor (AFTER running the main schema.sql)

-- Create rooms table
CREATE TABLE IF NOT EXISTS rooms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    inspection_id UUID NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
    room_name VARCHAR(100) NOT NULL,
    room_type VARCHAR(50) DEFAULT 'custom', -- 'standard' for predefined rooms, 'custom' for user-added
    is_selected BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for rooms
CREATE INDEX IF NOT EXISTS idx_rooms_inspection_id ON rooms(inspection_id);
CREATE INDEX IF NOT EXISTS idx_rooms_type ON rooms(room_type);

-- Enable RLS for rooms
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

-- Create policies for rooms (users can manage rooms for their own inspections)
CREATE POLICY "Users can view rooms for their own inspections" ON rooms
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM inspections 
            WHERE inspections.id = rooms.inspection_id 
            AND inspections.inspector_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert rooms for their own inspections" ON rooms
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM inspections 
            WHERE inspections.id = rooms.inspection_id 
            AND inspections.inspector_id = auth.uid()
        )
    );

CREATE POLICY "Users can update rooms for their own inspections" ON rooms
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM inspections 
            WHERE inspections.id = rooms.inspection_id 
            AND inspections.inspector_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete rooms for their own inspections" ON rooms
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM inspections 
            WHERE inspections.id = rooms.inspection_id 
            AND inspections.inspector_id = auth.uid()
        )
    );

-- Add updated_at trigger for rooms
CREATE TRIGGER update_rooms_updated_at 
    BEFORE UPDATE ON rooms 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add unique constraint to prevent duplicate room names per inspection
CREATE UNIQUE INDEX IF NOT EXISTS idx_rooms_unique_per_inspection 
    ON rooms(inspection_id, LOWER(room_name));