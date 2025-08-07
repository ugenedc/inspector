'use client'

import { useState, useEffect } from 'react'
import { createClientSupabase } from '@/lib/supabase'
import PhotoUpload from './PhotoUpload'
import PhotoGallery from './PhotoGallery'

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

interface PhotoManagerProps {
  inspectionId: string
  roomId: string
  roomName?: string
  maxFiles?: number
  allowCamera?: boolean
  allowFiles?: boolean
  showMetadata?: boolean
  onPhotoUploaded?: (photo: PhotoMetadata) => void
  className?: string
}

export default function PhotoManager({
  inspectionId,
  roomId,
  roomName = 'Room',
  maxFiles = 10,
  allowCamera = true,
  allowFiles = true,
  showMetadata = false,
  onPhotoUploaded,
  className = ''
}: PhotoManagerProps) {
  const [photos, setPhotos] = useState<PhotoMetadata[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'upload' | 'gallery'>('upload')
  
  const supabase = createClientSupabase()

  useEffect(() => {
    loadPhotos()
  }, [inspectionId, roomId])

  const loadPhotos = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error: fetchError } = await supabase
        .from('photos')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      setPhotos(data || [])
      
      if (data && data.length > 0) {
        setActiveTab('gallery')
      }

    } catch (error) {
      console.error('Error loading photos:', error)
      setError(error instanceof Error ? error.message : 'Failed to load photos')
    } finally {
      setLoading(false)
    }
  }

  const handlePhotoUploaded = (newPhoto: PhotoMetadata) => {
    setPhotos(prev => [newPhoto, ...prev])
    setActiveTab('gallery')
    setError(null)
    onPhotoUploaded?.(newPhoto)
  }

  const handlePhotoDeleted = (photoId: string) => {
    setPhotos(prev => prev.filter(p => p.id !== photoId))
    if (photos.length === 1) {
      setActiveTab('upload')
    }
  }

  const handleError = (errorMessage: string) => {
    setError(errorMessage)
    setTimeout(() => setError(null), 5000)
  }

  if (loading) {
    return (
      <div className={`py-8 ${className}`}>
        <div className="flex items-center text-gray-500">
          <div className="w-4 h-4 border-2 border-gray-200 border-t-gray-500 rounded-full animate-spin mr-3"></div>
          Loading photos...
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      {/* Simple Tab Navigation */}
      {photos.length > 0 && (
        <div className="flex space-x-6 mb-8">
          <button
            onClick={() => setActiveTab('gallery')}
            className={`text-sm font-medium ${
              activeTab === 'gallery'
                ? 'text-gray-900 border-b-2 border-gray-900 pb-2'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Photos ({photos.length})
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`text-sm font-medium ${
              activeTab === 'upload'
                ? 'text-gray-900 border-b-2 border-gray-900 pb-2'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Upload
          </button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 text-red-800 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Content */}
      {activeTab === 'upload' ? (
        <PhotoUpload
          inspectionId={inspectionId}
          roomId={roomId}
          roomName={roomName}
          onPhotoUploaded={handlePhotoUploaded}
          onError={handleError}
          maxFiles={maxFiles}
          allowCamera={allowCamera}
          allowFiles={allowFiles}
        />
      ) : (
        <PhotoGallery
          photos={photos}
          onPhotoDelete={handlePhotoDeleted}
          showMetadata={showMetadata}
        />
      )}
    </div>
  )
}

export type { PhotoMetadata }