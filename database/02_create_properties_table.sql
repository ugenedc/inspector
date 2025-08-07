-- Create properties table to normalize address data
-- Run this after the initial setup to add property management

-- 1. Create the properties table
CREATE TABLE IF NOT EXISTS public.properties (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    address text NOT NULL,
    formatted_address text, -- The full formatted address from LocationIQ
    latitude decimal(10, 8), -- Store coordinates for map display
    longitude decimal(11, 8),
    place_id text, -- LocationIQ place_id for reference
    city text,
    state text,
    country text,
    postal_code text,
    created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Add property_id column to inspections table
ALTER TABLE public.inspections 
ADD COLUMN IF NOT EXISTS property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE;

-- 3. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_properties_created_by ON public.properties(created_by);
CREATE INDEX IF NOT EXISTS idx_properties_address ON public.properties(address);
CREATE INDEX IF NOT EXISTS idx_properties_place_id ON public.properties(place_id);
CREATE INDEX IF NOT EXISTS idx_inspections_property_id ON public.inspections(property_id);

-- 4. Enable RLS on properties table
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for properties
CREATE POLICY "Users can view their own properties" ON public.properties
    FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Users can insert their own properties" ON public.properties
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own properties" ON public.properties
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own properties" ON public.properties
    FOR DELETE USING (auth.uid() = created_by);

-- 6. Create a function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 7. Create trigger for properties table
CREATE TRIGGER update_properties_updated_at 
    BEFORE UPDATE ON public.properties 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8. Create a function to find or create a property
CREATE OR REPLACE FUNCTION find_or_create_property(
    p_address text,
    p_formatted_address text DEFAULT NULL,
    p_latitude decimal DEFAULT NULL,
    p_longitude decimal DEFAULT NULL,
    p_place_id text DEFAULT NULL,
    p_city text DEFAULT NULL,
    p_state text DEFAULT NULL,
    p_country text DEFAULT NULL,
    p_postal_code text DEFAULT NULL,
    p_user_id uuid DEFAULT auth.uid()
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    property_uuid uuid;
BEGIN
    -- Try to find existing property by address for this user
    SELECT id INTO property_uuid
    FROM public.properties
    WHERE created_by = p_user_id 
    AND (
        address = p_address 
        OR formatted_address = p_formatted_address
        OR (place_id = p_place_id AND place_id IS NOT NULL)
    )
    LIMIT 1;
    
    -- If property doesn't exist, create it
    IF property_uuid IS NULL THEN
        INSERT INTO public.properties (
            address,
            formatted_address,
            latitude,
            longitude,
            place_id,
            city,
            state,
            country,
            postal_code,
            created_by
        ) VALUES (
            p_address,
            COALESCE(p_formatted_address, p_address),
            p_latitude,
            p_longitude,
            p_place_id,
            p_city,
            p_state,
            p_country,
            p_postal_code,
            p_user_id
        )
        RETURNING id INTO property_uuid;
    END IF;
    
    RETURN property_uuid;
END;
$$;

-- 9. Migration script to move existing inspection addresses to properties
-- This will be run separately to avoid data loss
DO $$
DECLARE
    inspection_record RECORD;
    new_property_id uuid;
BEGIN
    -- Only run if there are inspections without property_id
    IF EXISTS (SELECT 1 FROM public.inspections WHERE property_id IS NULL LIMIT 1) THEN
        
        FOR inspection_record IN 
            SELECT DISTINCT address, inspector_id 
            FROM public.inspections 
            WHERE property_id IS NULL AND address IS NOT NULL
        LOOP
            -- Create property for each unique address/user combination
            new_property_id := find_or_create_property(
                inspection_record.address,
                inspection_record.address, -- Use address as formatted_address for existing data
                NULL, -- latitude
                NULL, -- longitude
                NULL, -- place_id
                NULL, -- city
                NULL, -- state
                NULL, -- country
                NULL, -- postal_code
                inspection_record.inspector_id
            );
            
            -- Update all inspections with this address/user to use the new property
            UPDATE public.inspections 
            SET property_id = new_property_id
            WHERE address = inspection_record.address 
            AND inspector_id = inspection_record.inspector_id
            AND property_id IS NULL;
        END LOOP;
        
        RAISE NOTICE 'Migration completed: Existing inspection addresses moved to properties table';
    END IF;
END;
$$;