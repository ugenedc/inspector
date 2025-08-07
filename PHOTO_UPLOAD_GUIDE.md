# Photo Upload System Guide

A comprehensive photo upload system with camera capture, file uploads, and metadata tracking. Features structured storage paths and seamless integration with property inspections.

## 🎯 **System Overview**

The photo upload system provides:

### **📸 Upload Methods:**
- **Camera Capture** - Take photos directly using device camera
- **File Upload** - Select images from device storage  
- **Drag & Drop** - Drag files onto upload area

### **🗂️ Structured Storage:**
- **Path Format:** `/inspections/{inspectionId}/rooms/{roomId}/filename.jpg`
- **Organized** by inspection and room for easy management
- **Unique Filenames** to prevent conflicts

### **📊 Metadata Tracking:**
- **Database Storage** in dedicated `photos` table
- **File Properties** - size, dimensions, MIME type
- **Capture Method** - camera vs upload tracking
- **Primary Photo** designation per room

## 🚀 **Quick Start**

### **1. Database Setup**

Run this SQL in your **Supabase SQL Editor**:

```sql
-- Run the complete photos schema
-- File: database/photos-schema.sql
```

This creates:
- `photos` table with full metadata
- Automatic triggers for photo counts
- Primary photo management
- Row Level Security policies

### **2. Storage Setup**

In your **Supabase Dashboard**:

1. **Go to Storage**
2. **Create bucket:** `room-photos`
3. **Set public:** Yes (for image access)
4. **Add policies** (included in schema SQL)

### **3. Component Usage**

```tsx
import PhotoManager from '@/components/photos/PhotoManager'

<PhotoManager
  inspectionId="your-inspection-id"
  roomId="your-room-id"
  roomName="Kitchen"
  maxFiles={10}
  allowCamera={true}
  allowFiles={true}
  showMetadata={false}
/>
```

## 📋 **Component Architecture**

### **PhotoManager** - Main Component
- **Purpose:** Complete photo management interface
- **Features:** Upload tabs, gallery view, progress tracking
- **Best for:** Full-featured photo management

### **PhotoUpload** - Upload Only
- **Purpose:** Photo upload functionality
- **Features:** Camera, file upload, drag & drop
- **Best for:** Simple upload interface

### **PhotoGallery** - Display Only  
- **Purpose:** Display and manage existing photos
- **Features:** Grid view, metadata, delete/primary actions
- **Best for:** Viewing uploaded photos

## 🛠️ **Technical Implementation**

### **Storage Path Structure**

```
room-photos/
├── inspections/
│   ├── {inspectionId}/
│   │   ├── rooms/
│   │   │   ├── {roomId}/
│   │   │   │   ├── camera_1234567890_abc123.jpg
│   │   │   │   ├── upload_1234567890_def456_original_name.jpg
│   │   │   │   └── ...
```

### **Database Schema**

```sql
CREATE TABLE photos (
    id UUID PRIMARY KEY,
    inspection_id UUID NOT NULL,
    room_id UUID NOT NULL,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255),
    storage_path TEXT NOT NULL,
    public_url TEXT NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100),
    width INTEGER,
    height INTEGER,
    capture_method VARCHAR(20), -- 'camera' | 'upload'
    description TEXT,
    tags TEXT[],
    is_primary BOOLEAN DEFAULT false,
    uploaded_by UUID,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
);
```

### **Filename Generation**

```typescript
// Camera captures
camera_1234567890_abc123.jpg

// File uploads  
upload_1234567890_def456_sanitized_filename.jpg

// Format: method_timestamp_randomId_originalName
```

## 🔧 **Component Configuration**

### **PhotoManager Props**

```typescript
interface PhotoManagerProps {
  inspectionId: string          // Required: Inspection ID
  roomId: string               // Required: Room ID  
  roomName?: string            // Display name for room
  maxFiles?: number            // Max photos (default: 10)
  allowCamera?: boolean        // Enable camera (default: true)
  allowFiles?: boolean         // Enable file upload (default: true)
  showMetadata?: boolean       // Show file details (default: false)
  className?: string           // Custom CSS classes
}
```

### **PhotoUpload Props**

```typescript
interface PhotoUploadProps {
  inspectionId: string
  roomId: string
  roomName?: string
  onPhotoUploaded?: (photo: PhotoMetadata) => void
  onError?: (error: string) => void
  maxFiles?: number
  allowCamera?: boolean
  allowFiles?: boolean
  className?: string
}
```

### **PhotoGallery Props**

```typescript
interface PhotoGalleryProps {
  inspectionId?: string        // Load all photos for inspection
  roomId?: string             // Load photos for specific room
  photos?: PhotoMetadata[]    // External photo data
  onPhotoSelect?: (photo: PhotoMetadata) => void
  onPhotoDelete?: (photoId: string) => void
  showMetadata?: boolean
  className?: string
}
```

## 🎨 **UI Features**

### **Upload Interface**
- **Drag & Drop Zone** with visual feedback
- **File/Camera Buttons** for different input methods
- **Progress Indicators** during upload
- **Error Handling** with user-friendly messages

### **Camera Interface**
- **Live Video Preview** from device camera
- **Capture Button** with visual feedback
- **Mobile Optimized** with back camera preference
- **Auto-cleanup** of camera resources

### **Gallery Interface**
- **Grid Layout** with responsive design
- **Photo Thumbnails** with hover actions
- **Primary Badge** for designated photos
- **Metadata Modal** with detailed information
- **Delete Confirmation** for safety

### **Progress Tracking**
- **Photo Counts** (X of Y uploaded)
- **Capture Method** indicators (camera/upload)
- **Primary Photo** status
- **File Size Totals** and statistics

## ⚙️ **Advanced Features**

### **Primary Photo Management**

```typescript
// Automatically set first photo as primary
// Allow user to change primary designation
// Only one primary photo per room
```

### **Metadata Extraction**

```typescript
// Image dimensions (width x height)
// File size and MIME type
// Capture method tracking
// Upload timestamps
// Original filename preservation
```

### **Error Handling**

```typescript
// File type validation (images only)
// File size limits (10MB default)
// Upload failure recovery
// Storage cleanup on errors
// User-friendly error messages
```

### **Performance Optimization**

```typescript
// Image dimension calculation
// Efficient file upload with progress
// Lazy loading for large galleries
// Proper cleanup of object URLs
// Optimized database queries
```

## 🔒 **Security & Access Control**

### **Row Level Security (RLS)**

```sql
-- Users can only access photos for their own inspections
CREATE POLICY "Users can view photos for their inspections" ON photos
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM inspections 
            WHERE inspections.id = photos.inspection_id 
            AND inspections.inspector_id = auth.uid()
        )
    );
```

### **Storage Policies**

```sql
-- Users can upload photos for their inspections
CREATE POLICY "Users can upload room photos for their inspections" 
ON storage.objects FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM inspections 
        WHERE inspections.id::text = (storage.foldername(name))[1]
        AND inspections.inspector_id = auth.uid()
    )
);
```

## 📱 **Mobile Optimization**

### **Camera Features**
- **Back Camera** preference on mobile devices
- **High Resolution** capture (1920x1080 ideal)
- **Touch-Friendly** capture button
- **Orientation** handling

### **Upload Experience**
- **Large Touch Targets** for mobile interaction
- **Responsive Grid** layout
- **Optimized File Picker** for mobile browsers
- **Drag & Drop** support on supported devices

## 🧪 **Testing & Demo**

### **Demo Page**
Visit `/photos/demo` to test the complete system:

- **Interactive Demo** with all features
- **Setup Instructions** and requirements  
- **Feature Overview** and capabilities
- **Technical Details** for implementation

### **Testing Checklist**

- [ ] **Camera Access** - Can access device camera
- [ ] **File Upload** - Can select and upload files
- [ ] **Drag & Drop** - Can drag files to upload area
- [ ] **Photo Gallery** - Can view uploaded photos
- [ ] **Primary Setting** - Can set/change primary photo
- [ ] **Metadata Display** - Shows correct file information
- [ ] **Delete Function** - Can delete photos safely
- [ ] **Error Handling** - Shows appropriate error messages

## 🔧 **Troubleshooting**

### **Common Issues**

#### **"Camera access denied"**
- **Check browser permissions** for camera access
- **HTTPS required** for camera API
- **Test on different devices** (some browsers limit camera)

#### **"Upload failed"**
- **Check Supabase Storage** bucket exists (`room-photos`)
- **Verify storage policies** are correctly set
- **Check file size** (10MB limit by default)
- **Ensure user authentication** is working

#### **"Photos not displaying"**
- **Check storage bucket** is public
- **Verify public URL** generation
- **Check RLS policies** for photo access
- **Ensure inspection/room IDs** are correct

#### **"Database errors"**
- **Run photos schema SQL** if not already done
- **Check foreign key constraints** (inspection_id, room_id)
- **Verify user permissions** for inserting photos

### **Debug Tips**

1. **Check Browser Console** for JavaScript errors
2. **Verify Network Tab** for failed requests  
3. **Test with Demo Page** first (`/photos/demo`)
4. **Check Supabase Logs** for database/storage errors
5. **Validate Environment** setup and permissions

## 🚀 **Production Deployment**

### **Performance Considerations**

1. **Image Optimization**
   - Consider compression before upload
   - Implement thumbnail generation
   - Use CDN for image delivery

2. **Storage Management**
   - Monitor storage usage and costs
   - Implement cleanup for deleted inspections
   - Set up backup strategies

3. **Database Optimization**
   - Index frequently queried columns
   - Monitor query performance
   - Consider archiving old photos

### **Monitoring & Analytics**

- **Upload Success Rates** and failure patterns
- **Storage Usage** trends and growth
- **User Behavior** analysis (camera vs upload)
- **Performance Metrics** for large uploads

The photo upload system is now **fully functional** and ready for production use! 📸✨