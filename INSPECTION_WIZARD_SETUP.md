# Inspection Wizard Setup Guide

The Inspection Wizard is a comprehensive room-by-room inspection interface with AI-powered photo analysis. This guide will help you set up all the required components.

## 🚀 Quick Setup Checklist

- [ ] Update database schema for room inspection data
- [ ] Set up Supabase Storage for photo uploads
- [ ] Configure OpenAI API for image analysis
- [ ] Test the complete workflow

## 📋 Detailed Setup Instructions

### 1. Database Schema Update

Run this SQL in your **Supabase SQL Editor** to add room inspection functionality:

```sql
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
```

### 2. Supabase Storage Setup

#### Create Storage Bucket:

1. **Go to Storage** in your Supabase dashboard
2. **Click "New Bucket"**
3. **Name:** `room-photos`
4. **Public bucket:** Yes (for direct image access)
5. **Click "Create bucket"**

#### Set Up Storage Policies:

```sql
-- Allow authenticated users to upload photos for their own inspections
CREATE POLICY "Users can upload room photos for their inspections" ON storage.objects
FOR INSERT WITH CHECK (
    auth.uid()::text = (storage.foldername(name))[1] OR
    EXISTS (
        SELECT 1 FROM inspections 
        WHERE inspections.id::text = (storage.foldername(name))[1]
        AND inspections.inspector_id = auth.uid()
    )
);

-- Allow users to view photos for their own inspections
CREATE POLICY "Users can view room photos for their inspections" ON storage.objects
FOR SELECT USING (
    auth.uid()::text = (storage.foldername(name))[1] OR
    EXISTS (
        SELECT 1 FROM inspections 
        WHERE inspections.id::text = (storage.foldername(name))[1]
        AND inspections.inspector_id = auth.uid()
    )
);
```

### 3. OpenAI API Configuration

#### Get Your OpenAI API Key:

1. **Go to:** [OpenAI API Keys](https://platform.openai.com/api-keys)
2. **Create a new API key**
3. **Copy the key**

#### Update Environment Variables:

Add to your `.env.local` file:

```env
# OpenAI Configuration
OPENAI_API_KEY=your_actual_openai_api_key_here
```

#### Test OpenAI Setup:

You can test if your API key works by visiting: `/api/analyze-photo` after setup.

### 4. Feature Overview

The Inspection Wizard provides:

#### 🧙‍♂️ **Wizard Interface:**
- Step-by-step room navigation
- Progress tracking with visual progress bar
- Room completion status indicators
- Back/Next navigation

#### 📸 **Photo Management:**
- Upload photos from device
- Take photos using device camera
- Automatic upload to Supabase Storage
- Image preview and management

#### 🤖 **AI Analysis:**
- Automatic OpenAI GPT-4 Vision analysis
- Room-specific inspection prompts
- Professional inspection reports
- Condition assessments and recommendations

#### 📝 **Data Collection:**
- Optional comments for each room
- Automatic progress tracking
- Completion timestamps
- Persistent data storage

### 5. Usage Workflow

1. **Create Inspection** → Basic inspection details
2. **Select Rooms** → Choose which rooms to inspect
3. **Start Wizard** → Begin room-by-room inspection
4. **For Each Room:**
   - Upload/take photo
   - Add optional comments
   - Get AI analysis
   - Mark room complete
5. **Complete Inspection** → All rooms finished

### 6. Access Points

- **Main Wizard:** `/inspections/[id]/wizard`
- **Embedded:** `/inspections/[id]/checklist` (includes wizard)
- **API Endpoint:** `/api/analyze-photo` (for AI analysis)

### 7. Room-Specific AI Prompts

The AI analysis is customized based on room type:

- **Kitchen:** Cabinets, appliances, plumbing, electrical
- **Bathroom:** Fixtures, tiles, ventilation, water damage
- **Bedroom:** Walls, floors, windows, electrical
- **Living Areas:** General condition, functionality
- **Custom Rooms:** Flexible analysis based on room name

### 8. Troubleshooting

#### Common Issues:

1. **Photos not uploading:**
   - Check Supabase Storage bucket exists
   - Verify storage policies are set correctly
   - Ensure user is authenticated

2. **AI analysis not working:**
   - Verify OpenAI API key is correct
   - Check API key has sufficient credits
   - Ensure image URL is publicly accessible

3. **Progress not updating:**
   - Check database triggers are installed
   - Verify room completion status is being saved

#### Testing Checklist:

- [ ] Can create an inspection
- [ ] Can select rooms  
- [ ] Can access wizard interface
- [ ] Can upload photos
- [ ] Can get AI analysis
- [ ] Can add comments
- [ ] Can navigate between rooms
- [ ] Progress tracking works
- [ ] Completion status saves

### 9. Customization Options

#### AI Prompts:
Edit `/src/app/api/analyze-photo/route.ts` to customize inspection prompts for different room types.

#### UI Components:
Modify `/src/components/inspections/InspectionWizard.tsx` to customize the interface layout and interactions.

#### Database Schema:
Add additional fields to the `rooms` table for custom data collection needs.

### 10. Production Considerations

1. **Storage Costs:** Monitor Supabase Storage usage
2. **OpenAI Costs:** Track API usage and implement rate limiting
3. **Image Optimization:** Consider image compression before upload
4. **Backup Strategy:** Regular backups of inspection data
5. **Performance:** Monitor database query performance with large datasets

The Inspection Wizard is now ready for use! 🎉