'use client'

import { useState, useEffect } from 'react'
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
  }, [inspectionId, roomId, externalPhotos])

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
    if (!confirm('Delete this photo? This action cannot be undone.')) return

    try {
      setDeleting(photoId)
      
      const photo = photos.find(p => p.id === photoId)
      if (!photo) return

      const { error: storageError } = await supabase.storage
        .from('room-photos')
        .remove([photo.storage_path])

      if (storageError) {
        console.warn('Storage deletion failed:', storageError)
      }

      const { error: dbError } = await supabase
        .from('photos')
        .delete()
        .eq('id', photoId)

      if (dbError) throw dbError

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
      await supabase
        .from('photos')
        .update({ is_primary: false })
        .neq('id', photoId)

      const { error } = await supabase
        .from('photos')
        .update({ is_primary: true })
        .eq('id', photoId)

      if (error) throw error

      setPhotos(prev => prev.map(photo => ({
        ...photo,
        is_primary: photo.id === photoId
      })))

    } catch (error) {
      console.error('Error setting primary photo:', error)
      alert('Failed to set primary photo. Please try again.')
    }
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

  if (photos.length === 0) {
    return (
      <div className={`py-12 text-center ${className}`}>
        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <p className="text-gray-500">No photos yet</p>
      </div>
    )
  }

  return (
    <div className={className}>
      {/* Clean Photo Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {photos.map((photo) => (
          <div
            key={photo.id}
            className="group relative aspect-[4/3] bg-gray-50 rounded-lg overflow-hidden cursor-pointer"
            onClick={() => handlePhotoClick(photo)}
          >
            {/* Primary indicator */}
            {photo.is_primary && (
              <div className="absolute top-3 left-3 z-10">
                <div className="bg-white px-2 py-1 rounded text-xs font-medium text-gray-700 shadow-sm">
                  Primary
                </div>
              </div>
            )}

            {/* Photo */}
            <img
              src={photo.public_url}
              alt={photo.original_filename}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
                target.nextElementSibling?.classList.remove('hidden')
              }}
            />
            
            {/* Error fallback */}
            <div className="hidden absolute inset-0 bg-gray-100 flex items-center justify-center">
              <div className="text-center text-gray-400">
                <svg className="w-8 h-8 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                </svg>
                <p className="text-sm">Image unavailable</p>
              </div>
            </div>

            {/* Hover actions */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
              <div className="flex space-x-3">
                {!photo.is_primary && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setPrimaryPhoto(photo.id)
                    }}
                    className="bg-white text-gray-900 px-3 py-1 rounded text-sm font-medium hover:bg-gray-100"
                  >
                    Set primary
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeletePhoto(photo.id)
                  }}
                  disabled={deleting === photo.id}
                  className="bg-red-600 text-white px-3 py-1 rounded text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                >
                  {deleting === photo.id ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-auto w-full">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h3 className="font-medium text-gray-900">
                {selectedPhoto.original_filename}
              </h3>
              <button
                onClick={() => setSelectedPhoto(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Photo */}
            <div className="p-6">
              <img
                src={selectedPhoto.public_url}
                alt={selectedPhoto.original_filename}
                className="w-full h-auto max-h-96 object-contain rounded-lg"
              />
            </div>

            {/* Metadata */}
            {showMetadata && (
              <div className="px-6 pb-6 text-sm text-gray-600">
                <div className="grid grid-cols-2 gap-4">
                  <div>Size: {Math.round(selectedPhoto.file_size / 1024)} KB</div>
                  <div>Method: {selectedPhoto.capture_method}</div>
                  <div>Dimensions: {selectedPhoto.width}×{selectedPhoto.height}</div>
                  <div>Date: {new Date(selectedPhoto.created_at).toLocaleDateString()}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}