-- Property Inspections Database Schema
-- Run this SQL in your Supabase SQL editor

-- Create inspections table
CREATE TABLE IF NOT EXISTS inspections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    address TEXT NOT NULL,
    inspection_type VARCHAR(20) NOT NULL CHECK (inspection_type IN ('entry', 'exit', 'routine')),
    owner_name VARCHAR(255) NOT NULL,
    tenant_name VARCHAR(255),
    inspection_date DATE NOT NULL,
    inspector_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_inspections_inspector_id ON inspections(inspector_id);
CREATE INDEX IF NOT EXISTS idx_inspections_date ON inspections(inspection_date);
CREATE INDEX IF NOT EXISTS idx_inspections_status ON inspections(status);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_inspections_updated_at 
    BEFORE UPDATE ON inspections 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to see only their own inspections
CREATE POLICY "Users can view their own inspections" ON inspections
    FOR SELECT USING (auth.uid() = inspector_id);

-- Create policy to allow users to insert their own inspections
CREATE POLICY "Users can insert their own inspections" ON inspections
    FOR INSERT WITH CHECK (auth.uid() = inspector_id);

-- Create policy to allow users to update their own inspections
CREATE POLICY "Users can update their own inspections" ON inspections
    FOR UPDATE USING (auth.uid() = inspector_id);

-- Create policy to allow users to delete their own inspections
CREATE POLICY "Users can delete their own inspections" ON inspections
    FOR DELETE USING (auth.uid() = inspector_id);

-- Create inspection_items table for detailed inspection checklist items
CREATE TABLE IF NOT EXISTS inspection_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    inspection_id UUID NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL, -- e.g., 'kitchen', 'bathroom', 'living_room', 'exterior'
    item_name VARCHAR(255) NOT NULL, -- e.g., 'Faucet condition', 'Wall damage'
    condition VARCHAR(20) CHECK (condition IN ('good', 'fair', 'poor', 'damaged', 'not_applicable')),
    notes TEXT,
    photo_urls TEXT[], -- Array of photo URLs
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for inspection items
CREATE INDEX IF NOT EXISTS idx_inspection_items_inspection_id ON inspection_items(inspection_id);
CREATE INDEX IF NOT EXISTS idx_inspection_items_category ON inspection_items(category);

-- Enable RLS for inspection_items
ALTER TABLE inspection_items ENABLE ROW LEVEL SECURITY;

-- Create policies for inspection_items (users can manage items for their own inspections)
CREATE POLICY "Users can view items for their own inspections" ON inspection_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM inspections 
            WHERE inspections.id = inspection_items.inspection_id 
            AND inspections.inspector_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert items for their own inspections" ON inspection_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM inspections 
            WHERE inspections.id = inspection_items.inspection_id 
            AND inspections.inspector_id = auth.uid()
        )
    );

CREATE POLICY "Users can update items for their own inspections" ON inspection_items
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM inspections 
            WHERE inspections.id = inspection_items.inspection_id 
            AND inspections.inspector_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete items for their own inspections" ON inspection_items
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM inspections 
            WHERE inspections.id = inspection_items.inspection_id 
            AND inspections.inspector_id = auth.uid()
        )
    );

-- Add updated_at trigger for inspection_items
CREATE TRIGGER update_inspection_items_updated_at 
    BEFORE UPDATE ON inspection_items 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create rooms table for property inspection room selection
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

-- Insert some sample inspection categories and items (optional)
-- You can uncomment and run this if you want default inspection items

/*
INSERT INTO inspection_items (inspection_id, category, item_name, condition) VALUES
-- These would be inserted when creating a new inspection
-- Kitchen items
('SAMPLE_INSPECTION_ID', 'kitchen', 'Sink condition', 'good'),
('SAMPLE_INSPECTION_ID', 'kitchen', 'Faucet operation', 'good'),
('SAMPLE_INSPECTION_ID', 'kitchen', 'Countertop condition', 'good'),
('SAMPLE_INSPECTION_ID', 'kitchen', 'Cabinet doors and drawers', 'good'),
('SAMPLE_INSPECTION_ID', 'kitchen', 'Appliances condition', 'good'),
-- Bathroom items
('SAMPLE_INSPECTION_ID', 'bathroom', 'Toilet condition', 'good'),
('SAMPLE_INSPECTION_ID', 'bathroom', 'Shower/tub condition', 'good'),
('SAMPLE_INSPECTION_ID', 'bathroom', 'Ventilation fan', 'good'),
('SAMPLE_INSPECTION_ID', 'bathroom', 'Water pressure', 'good'),
-- Living areas
('SAMPLE_INSPECTION_ID', 'living_room', 'Wall condition', 'good'),
('SAMPLE_INSPECTION_ID', 'living_room', 'Flooring condition', 'good'),
('SAMPLE_INSPECTION_ID', 'living_room', 'Windows operation', 'good'),
('SAMPLE_INSPECTION_ID', 'living_room', 'Light fixtures', 'good'),
-- Exterior
('SAMPLE_INSPECTION_ID', 'exterior', 'Roof condition', 'good'),
('SAMPLE_INSPECTION_ID', 'exterior', 'Gutter condition', 'good'),
('SAMPLE_INSPECTION_ID', 'exterior', 'Exterior paint', 'good'),
('SAMPLE_INSPECTION_ID', 'exterior', 'Driveway condition', 'good');
*/