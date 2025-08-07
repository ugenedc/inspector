-- Fix the incomplete update policy for inspections table
-- This is required to allow users to update their inspection status

-- Drop the incomplete policy
DROP POLICY IF EXISTS "Users can update their own inspections" ON inspections;

-- Create the correct update policy
CREATE POLICY "Users can update their own inspections" ON inspections
    FOR UPDATE USING (auth.uid() = inspector_id);

-- Also fix any other incomplete policies

-- Fix inspection_items policy if incomplete
DROP POLICY IF EXISTS "Users can insert items for their own inspections" ON inspection_items;
CREATE POLICY "Users can insert items for their own inspections" ON inspection_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM inspections 
            WHERE inspections.id = inspection_items.inspection_id 
            AND inspections.inspector_id = auth.uid()
        )
    );

-- Fix properties policy if incomplete  
DROP POLICY IF EXISTS "Users can delete their own properties" ON public.properties;
CREATE POLICY "Users can delete their own properties" ON public.properties
    FOR DELETE USING (auth.uid() = created_by);

-- Fix rooms policy if incomplete
DROP POLICY IF EXISTS "Users can delete rooms for their own inspections" ON rooms;
CREATE POLICY "Users can delete rooms for their own inspections" ON rooms
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM inspections 
            WHERE inspections.id = rooms.inspection_id 
            AND inspections.inspector_id = auth.uid()
        )
    );