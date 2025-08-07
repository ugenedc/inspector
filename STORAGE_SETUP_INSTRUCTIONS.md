# 🔧 Supabase Storage Setup Instructions

The photo upload feature is hanging because the required Supabase Storage bucket doesn't exist yet. Follow these steps to fix it:

## 🚀 Quick Fix Steps

### 1. Create Storage Bucket in Supabase Dashboard

1. Go to your **Supabase Dashboard**: https://supabase.com/dashboard
2. Select your project: `Inspector` 
3. Navigate to **Storage** in the left sidebar
4. Click **"Create Bucket"**
5. Configure the bucket:
   - **Name**: `room-photos`
   - **Public**: ✅ **Enabled** (so photos can be viewed via public URLs)
   - **File size limit**: `10 MB`
   - **Allowed MIME types**: `image/jpeg, image/jpg, image/png, image/webp`
6. Click **"Create Bucket"**

### 2. Set Up Storage Policies (Optional - for enhanced security)

If you want more granular access control, run the SQL from `database/storage-setup.sql` in your Supabase SQL Editor. This will:
- Allow authenticated users to upload photos to their inspection folders
- Restrict access to photos based on inspection ownership
- Enable proper deletion and update permissions

## 🎯 Expected Folder Structure

Once working, photos will be stored with this structure:
```
room-photos/
├── inspections/
│   ├── {inspection-id}/
│   │   ├── rooms/
│   │   │   ├── {room-id}/
│   │   │   │   ├── upload_1723056789_abc123_photo.jpg
│   │   │   │   ├── camera_1723056799_def456.jpg
│   │   │   │   └── ...
```

## 🔍 Verification

After creating the bucket:
1. Refresh your inspection page
2. Try uploading a photo
3. The upload should complete successfully
4. Check the Storage bucket in Supabase Dashboard to see the uploaded file

## 🛠️ Troubleshooting

If the upload still hangs:
1. **Check browser console** for JavaScript errors
2. **Verify environment variables** in `.env.local`
3. **Confirm authentication** - make sure you're logged in
4. **Check network tab** to see if the request is being made to Supabase

## 🎉 What Happens After Upload

Once a photo uploads successfully:
1. File is stored in Supabase Storage under the structured path
2. Metadata is saved to the `photos` table in your database
3. The photo becomes available for AI analysis
4. The wizard can proceed to the next step

The storage bucket is the missing piece that will make photo uploads work! 📸