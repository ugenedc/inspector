'use client'

import { useState, useRef, useCallback } from 'react'
import { createClientSupabase } from '@/lib/supabase'

interface PhotoMetadata {
  id: string
  filename: string
  original_filename: string
  storage_path: string
  public_url: string
  file_size: number
  mime_type: string
  width?: number
  height?: number
  capture_method: 'camera' | 'upload'
  description?: string
  is_primary: boolean
  created_at: string
}

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

export default function PhotoUpload({
  inspectionId,
  roomId,
  roomName = 'Room',
  onPhotoUploaded,
  onError,
  maxFiles = 10,
  allowCamera = true,
  allowFiles = true,
  className = ''
}: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [photos, setPhotos] = useState<PhotoMetadata[]>([])
  const [dragOver, setDragOver] = useState(false)
  const [showCamera, setShowCamera] = useState(false)
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const supabase = createClientSupabase()

  // Generate structured storage path
  const generateStoragePath = (filename: string) => {
    return `inspections/${inspectionId}/rooms/${roomId}/${filename}`
  }

  // Generate unique filename
  const generateFilename = (originalFile: File | string) => {
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(2, 8)
    
    if (typeof originalFile === 'string') {
      // Camera capture
      return `camera_${timestamp}_${randomId}.jpg`
    } else {
      // File upload
      const sanitizedName = originalFile.name
        .replace(/[^a-zA-Z0-9.-]/g, '_')
        .replace(/_{2,}/g, '_')
        .toLowerCase()
      return `upload_${timestamp}_${randomId}_${sanitizedName}`
    }
  }

  // Get image dimensions
  const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve) => {
      const img = new window.Image()
      img.onload = () => {
        resolve({ width: img.width, height: img.height })
        URL.revokeObjectURL(img.src)
      }
      img.src = URL.createObjectURL(file)
    })
  }

  // Upload photo to Supabase Storage and save metadata
  const uploadPhoto = async (file: File, captureMethod: 'camera' | 'upload') => {
    try {
      setUploading(true)

      const filename = generateFilename(file)
      const storagePath = generateStoragePath(filename)

      // Get image dimensions
      const dimensions = await getImageDimensions(file)

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('room-photos')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`)
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('room-photos')
        .getPublicUrl(storagePath)

      // Save metadata to photos table
      const photoMetadata = {
        inspection_id: inspectionId,
        room_id: roomId,
        filename,
        original_filename: file.name,
        storage_path: storagePath,
        public_url: publicUrl,
        file_size: file.size,
        mime_type: file.type,
        width: dimensions.width,
        height: dimensions.height,
        capture_method: captureMethod,
        uploaded_by: (await supabase.auth.getUser()).data.user?.id
      }

      const { data: photoData, error: dbError } = await supabase
        .from('photos')
        .insert([photoMetadata])
        .select()
        .single()

      if (dbError) {
        // If database save fails, try to clean up uploaded file
        await supabase.storage.from('room-photos').remove([storagePath])
        throw new Error(`Database save failed: ${dbError.message}`)
      }

      const newPhoto: PhotoMetadata = {
        id: photoData.id,
        filename: photoData.filename,
        original_filename: photoData.original_filename,
        storage_path: photoData.storage_path,
        public_url: photoData.public_url,
        file_size: photoData.file_size,
        mime_type: photoData.mime_type,
        width: photoData.width,
        height: photoData.height,
        capture_method: photoData.capture_method,
        description: photoData.description,
        is_primary: photoData.is_primary,
        created_at: photoData.created_at
      }

      setPhotos(prev => [...prev, newPhoto])
      onPhotoUploaded?.(newPhoto)

      return newPhoto

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed'
      onError?.(errorMessage)
      throw error
    } finally {
      setUploading(false)
    }
  }

  // Handle file selection
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    
    if (files.length === 0) return
    if (photos.length + files.length > maxFiles) {
      onError?.(`Maximum ${maxFiles} photos allowed`)
      return
    }

    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        onError?.(`${file.name} is not an image file`)
        continue
      }

      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        onError?.(`${file.name} is too large (max 10MB)`)
        continue
      }

      try {
        await uploadPhoto(file, 'upload')
      } catch (error) {
        console.error('Error uploading file:', error)
      }
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Handle drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }, [])

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)

    const files = Array.from(e.dataTransfer.files)
    
    if (files.length === 0) return
    if (photos.length + files.length > maxFiles) {
      onError?.(`Maximum ${maxFiles} photos allowed`)
      return
    }

    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        onError?.(`${file.name} is not an image file`)
        continue
      }

      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        onError?.(`${file.name} is too large (max 10MB)`)
        continue
      }

      try {
        await uploadPhoto(file, 'upload')
      } catch (error) {
        console.error('Error uploading file:', error)
      }
    }
  }, [photos.length, maxFiles, onError, uploadPhoto])

  // Camera functions
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      })
      setCameraStream(stream)
      setShowCamera(true)
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (error) {
      onError?.('Camera access denied or not available')
      console.error('Camera error:', error)
    }
  }

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop())
      setCameraStream(null)
    }
    setShowCamera(false)
  }

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')

    if (!context) return

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Draw current video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Convert canvas to blob
    canvas.toBlob(async (blob) => {
      if (!blob) return

      const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' })
      
      try {
        await uploadPhoto(file, 'camera')
        stopCamera()
      } catch (error) {
        console.error('Error uploading camera capture:', error)
      }
    }, 'image/jpeg', 0.9)
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragOver
            ? 'border-indigo-500 bg-indigo-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="space-y-4">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              Upload photos for {roomName}
            </h3>
            <p className="text-sm text-gray-500">
              Drag and drop images here, or use the buttons below
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Max {maxFiles} photos • Up to 10MB each • JPG, PNG, WebP
            </p>
          </div>

          <div className="flex justify-center space-x-4">
            {allowFiles && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading || photos.length >= maxFiles}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  {uploading ? 'Uploading...' : 'Choose Files'}
                </button>
              </>
            )}

            {allowCamera && (
              <button
                onClick={showCamera ? stopCamera : startCamera}
                disabled={uploading || photos.length >= maxFiles}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {showCamera ? 'Cancel Camera' : 'Take Photo'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Camera Interface */}
      {showCamera && (
        <div className="bg-black rounded-lg overflow-hidden">
          <div className="relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-auto"
            />
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
              <button
                onClick={capturePhoto}
                disabled={uploading}
                className="w-16 h-16 bg-white rounded-full border-4 border-gray-300 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50"
              >
                <div className="w-8 h-8 bg-gray-600 rounded-full"></div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden canvas for photo capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Upload Progress */}
      {uploading && (
        <div className="flex items-center justify-center p-4 bg-blue-50 rounded-lg">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600 mr-3"></div>
          <span className="text-sm text-indigo-600">Uploading photo...</span>
        </div>
      )}

      {/* Photo Count */}
      {photos.length > 0 && (
        <div className="text-sm text-gray-500 text-center">
          {photos.length} of {maxFiles} photos uploaded
        </div>
      )}
    </div>
  )
}