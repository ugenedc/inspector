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
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-200 border-t-blue-600 mx-auto"></div>
          <p className="mt-3 text-gray-600 font-medium">Loading photos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="flex bg-gray-100 rounded-2xl p-1">
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-3 px-4 rounded-xl font-medium text-sm transition-all duration-200 ${
              activeTab === 'upload'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span>Upload</span>
              {photos.length < maxFiles && (
                <span className="bg-blue-100 text-blue-600 text-xs font-semibold px-2 py-1 rounded-full">
                  {maxFiles - photos.length}
                </span>
              )}
            </div>
          </button>
          <button
            onClick={() => setActiveTab('gallery')}
            className={`flex-1 py-3 px-4 rounded-xl font-medium text-sm transition-all duration-200 ${
              activeTab === 'gallery'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Gallery</span>
              {photos.length > 0 && (
                <span className="bg-green-100 text-green-600 text-xs font-semibold px-2 py-1 rounded-full">
                  {photos.length}
                </span>
              )}
            </div>
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 rounded-2xl">
          <div className="flex items-center">
            <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center mr-3">
              <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="space-y-6">
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

      {/* Stats Footer */}
      {photos.length > 0 && (
        <div className="mt-6 p-4 bg-gray-50 rounded-2xl">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-gray-600">
                  <span className="font-semibold text-gray-900">{photos.length}</span> Photos
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-gray-600">
                  <span className="font-semibold text-gray-900">
                    {photos.filter(p => p.capture_method === 'camera').length}
                  </span> Camera
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span className="text-gray-600">
                  <span className="font-semibold text-gray-900">
                    {photos.filter(p => p.capture_method === 'upload').length}
                  </span> Upload
                </span>
              </div>
            </div>
            {photos.some(p => p.is_primary) && (
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="text-yellow-600 font-semibold text-sm">Primary Set</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Export the photo metadata interface for use in other components
export type { PhotoMetadata }