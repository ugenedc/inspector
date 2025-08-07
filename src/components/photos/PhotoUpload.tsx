'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
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

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop())
      }
    }
  }, [cameraStream])

  // Generate structured storage path
  const generateStoragePath = useCallback((filename: string) => {
    return `inspections/${inspectionId}/rooms/${roomId}/${filename}`
  }, [inspectionId, roomId])

  // Generate unique filename
  const generateFilename = useCallback((originalFile: File | string) => {
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
  }, [])

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
  const uploadPhoto = useCallback(async (file: File, captureMethod: 'camera' | 'upload') => {
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
  }, [inspectionId, roomId, onPhotoUploaded, onError, generateStoragePath, generateFilename, supabase])

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
      console.log('Starting camera...')
      
      // Try different camera configurations for better compatibility
      let stream: MediaStream | null = null
      
      try {
        // First try with back camera (environment)
        stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: 'environment',
            width: { ideal: 1920, min: 640 },
            height: { ideal: 1080, min: 480 }
          }
        })
        console.log('Back camera initialized')
      } catch (error) {
        console.log('Back camera failed, trying front camera:', error)
        // Fallback to front camera
        stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: 'user',
            width: { ideal: 1920, min: 640 },
            height: { ideal: 1080, min: 480 }
          }
        })
        console.log('Front camera initialized')
      }
      
      if (!stream) {
        throw new Error('No camera stream available')
      }

      setCameraStream(stream)
      setShowCamera(true)
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        
        // Wait for video to be ready and then play
        const video = videoRef.current
        video.onloadedmetadata = async () => {
          try {
            await video.play()
            console.log('Video is playing')
          } catch (playError) {
            console.error('Error playing video:', playError)
            onError?.('Camera preview failed to start')
          }
        }
      }
    } catch (error) {
      console.error('Camera error:', error)
      onError?.('Camera access denied or not available')
      setShowCamera(false)
      setCameraStream(null)
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
    <div className={`space-y-6 ${className}`}>
      {/* Clean Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragOver
            ? 'border-gray-400 bg-gray-50'
            : 'border-gray-200 hover:border-gray-300'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="space-y-4">
          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          
          <div>
            <p className="font-medium text-gray-900 mb-1">
              Upload photos
            </p>
            <p className="text-sm text-gray-500">
              Drag and drop images here or use the buttons below
            </p>
          </div>

          <div className="flex justify-center space-x-3">
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
                  className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? 'Uploading...' : 'Choose files'}
                </button>
              </>
            )}

            {allowCamera && (
              <button
                onClick={showCamera ? stopCamera : startCamera}
                disabled={uploading || photos.length >= maxFiles}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {showCamera ? 'Cancel' : 'Take photo'}
              </button>
            )}
          </div>
          
          <p className="text-xs text-gray-400">
            Up to {maxFiles} photos • Max 10MB each
          </p>
        </div>
      </div>

      {/* Clean Camera Interface */}
      {showCamera && (
        <div className="rounded-lg overflow-hidden bg-black">
          <div className="relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-auto min-h-64"
              onError={(e) => {
                console.error('Video error:', e)
                onError?.('Camera preview error')
              }}
              onLoadedData={() => {
                console.log('Video loaded successfully')
              }}
            />
            {!cameraStream && (
              <div className="absolute inset-0 flex items-center justify-center text-white">
                <div className="text-center">
                  <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-sm">Initializing camera...</p>
                </div>
              </div>
            )}
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
              <button
                onClick={capturePhoto}
                disabled={uploading || !cameraStream}
                className="w-16 h-16 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 shadow-lg"
              >
                <div className="w-6 h-6 bg-gray-600 rounded-full"></div>
              </button>
            </div>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />

      {/* Simple Upload Progress */}
      {uploading && (
        <div className="flex items-center justify-center p-4 bg-gray-50 rounded-lg">
          <div className="w-4 h-4 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin mr-3"></div>
          <span className="text-sm text-gray-600">Uploading...</span>
        </div>
      )}
    </div>
  )
}