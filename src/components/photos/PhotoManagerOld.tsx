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
  }, [inspectionId, roomId]) // eslint-disable-line react-hooks/exhaustive-deps

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
      
      // Switch to gallery if photos exist
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
  }

  const handleError = (errorMessage: string) => {
    setError(errorMessage)
    setTimeout(() => setError(null), 5000)
  }

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-3 text-gray-600">Loading photo manager...</span>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      {/* Header with tabs */}
      <div className="border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">
              Photos for {roomName}
            </h3>
            <span className="text-sm text-gray-500">
              {photos.length} of {maxFiles} photos
            </span>
          </div>
          
          {/* Tab navigation */}
          <div className="mt-4">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('upload')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'upload'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Upload Photos
                {photos.length < maxFiles && (
                  <span className="ml-2 bg-indigo-100 text-indigo-600 py-0.5 px-2 rounded-full text-xs">
                    {maxFiles - photos.length} remaining
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('gallery')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'gallery'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Photo Gallery
                {photos.length > 0 && (
                  <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                    {photos.length}
                  </span>
                )}
              </button>
            </nav>
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-400">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-6">
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

      {/* Footer with quick stats */}
      {photos.length > 0 && (
        <div className="border-t border-gray-200 px-6 py-3 bg-gray-50">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <div>
              <span className="font-medium">{photos.length}</span> photos uploaded
            </div>
            <div className="flex space-x-4">
              <span>
                <span className="font-medium">
                  {photos.filter(p => p.capture_method === 'camera').length}
                </span> camera
              </span>
              <span>
                <span className="font-medium">
                  {photos.filter(p => p.capture_method === 'upload').length}
                </span> uploaded
              </span>
              {photos.some(p => p.is_primary) && (
                <span className="text-yellow-600">
                  <span className="font-medium">1</span> primary
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Export the photo metadata interface for use in other components
export type { PhotoMetadata }