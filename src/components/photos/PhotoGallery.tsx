'use client'

import { useState, useEffect } from 'react'
import { createClientSupabase } from '@/lib/supabase'
import Image from 'next/image'

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

interface PhotoGalleryProps {
  inspectionId?: string
  roomId?: string
  photos?: PhotoMetadata[]
  onPhotoSelect?: (photo: PhotoMetadata) => void
  onPhotoDelete?: (photoId: string) => void
  showMetadata?: boolean
  className?: string
}

export default function PhotoGallery({
  inspectionId,
  roomId,
  photos: externalPhotos,
  onPhotoSelect,
  onPhotoDelete,
  showMetadata = false,
  className = ''
}: PhotoGalleryProps) {
  const [photos, setPhotos] = useState<PhotoMetadata[]>(externalPhotos || [])
  const [loading, setLoading] = useState(!externalPhotos)
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoMetadata | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  
  const supabase = createClientSupabase()

  useEffect(() => {
    if (!externalPhotos && (inspectionId || roomId)) {
      loadPhotos()
    }
  }, [inspectionId, roomId, externalPhotos]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadPhotos = async () => {
    try {
      setLoading(true)
      
      let query = supabase
        .from('photos')
        .select('*')
        .order('created_at', { ascending: false })

      if (roomId) {
        query = query.eq('room_id', roomId)
      } else if (inspectionId) {
        query = query.eq('inspection_id', inspectionId)
      }

      const { data, error } = await query

      if (error) throw error

      setPhotos(data || [])
    } catch (error) {
      console.error('Error loading photos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePhotoClick = (photo: PhotoMetadata) => {
    setSelectedPhoto(photo)
    onPhotoSelect?.(photo)
  }

  const handleDeletePhoto = async (photoId: string) => {
    if (!confirm('Are you sure you want to delete this photo?')) return

    try {
      setDeleting(photoId)
      
      const photo = photos.find(p => p.id === photoId)
      if (!photo) return

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('room-photos')
        .remove([photo.storage_path])

      if (storageError) {
        console.warn('Storage deletion failed:', storageError)
        // Continue with database deletion even if storage fails
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('photos')
        .delete()
        .eq('id', photoId)

      if (dbError) throw dbError

      // Update local state
      setPhotos(prev => prev.filter(p => p.id !== photoId))
      onPhotoDelete?.(photoId)

      if (selectedPhoto?.id === photoId) {
        setSelectedPhoto(null)
      }

    } catch (error) {
      console.error('Error deleting photo:', error)
      alert('Failed to delete photo. Please try again.')
    } finally {
      setDeleting(null)
    }
  }

  const setPrimaryPhoto = async (photoId: string) => {
    try {
      const { error } = await supabase
        .from('photos')
        .update({ is_primary: true })
        .eq('id', photoId)

      if (error) throw error

      // Update local state
      setPhotos(prev => prev.map(photo => ({
        ...photo,
        is_primary: photo.id === photoId
      })))

    } catch (error) {
      console.error('Error setting primary photo:', error)
      alert('Failed to set primary photo. Please try again.')
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-3 text-gray-600">Loading photos...</span>
      </div>
    )
  }

  if (photos.length === 0) {
    return (
      <div className={`text-center p-8 ${className}`}>
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <h3 className="mt-4 text-lg font-medium text-gray-900">No photos yet</h3>
        <p className="mt-2 text-gray-500">Upload some photos to get started.</p>
      </div>
    )
  }

  return (
    <div className={className}>
      {/* Photo Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {photos.map((photo) => (
          <div
            key={photo.id}
            className="relative group cursor-pointer rounded-lg overflow-hidden bg-gray-100"
            onClick={() => handlePhotoClick(photo)}
          >
            {/* Primary badge */}
            {photo.is_primary && (
              <div className="absolute top-2 left-2 z-10">
                <span className="bg-yellow-400 text-yellow-900 text-xs font-medium px-2 py-1 rounded-full">
                  Primary
                </span>
              </div>
            )}

            {/* Photo */}
            <div className="aspect-[4/3] relative">
              <Image
                src={photo.public_url}
                alt={photo.original_filename}
                fill
                className="object-cover transition-transform group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
            </div>

            {/* Overlay with actions */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-2">
                {!photo.is_primary && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setPrimaryPhoto(photo.id)
                    }}
                    className="bg-white text-gray-900 px-2 py-1 rounded text-xs font-medium hover:bg-gray-100"
                  >
                    Set Primary
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeletePhoto(photo.id)
                  }}
                  disabled={deleting === photo.id}
                  className="bg-red-600 text-white px-2 py-1 rounded text-xs font-medium hover:bg-red-700 disabled:opacity-50"
                >
                  {deleting === photo.id ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>

            {/* Capture method indicator */}
            <div className="absolute bottom-2 right-2">
              {photo.capture_method === 'camera' ? (
                <svg className="h-4 w-4 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v6a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586l-.707-.707A1 1 0 0013 4H7a1 1 0 00-.707.293L5.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="h-4 w-4 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Photo Details Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl max-h-full overflow-auto">
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">
                {selectedPhoto.original_filename}
              </h3>
              <button
                onClick={() => setSelectedPhoto(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Photo */}
            <div className="relative max-h-96">
              <Image
                src={selectedPhoto.public_url}
                alt={selectedPhoto.original_filename}
                width={selectedPhoto.width || 800}
                height={selectedPhoto.height || 600}
                className="max-w-full h-auto"
              />
            </div>

            {/* Metadata */}
            {showMetadata && (
              <div className="p-4 border-t bg-gray-50">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Filename:</span>
                    <span className="ml-2 text-gray-600">{selectedPhoto.filename}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Size:</span>
                    <span className="ml-2 text-gray-600">{formatFileSize(selectedPhoto.file_size)}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Dimensions:</span>
                    <span className="ml-2 text-gray-600">
                      {selectedPhoto.width}×{selectedPhoto.height}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Method:</span>
                    <span className="ml-2 text-gray-600 capitalize">{selectedPhoto.capture_method}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Type:</span>
                    <span className="ml-2 text-gray-600">{selectedPhoto.mime_type}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Uploaded:</span>
                    <span className="ml-2 text-gray-600">
                      {new Date(selectedPhoto.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}