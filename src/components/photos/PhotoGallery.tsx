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

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('room-photos')
        .remove([photo.storage_path])

      if (storageError) {
        console.warn('Storage deletion failed:', storageError)
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
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-200 border-t-blue-600 mx-auto"></div>
          <p className="mt-3 text-gray-600 font-medium">Loading photos...</p>
        </div>
      </div>
    )
  }

  if (photos.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Photos Yet</h3>
        <p className="text-gray-500">Upload some photos to get started with your inspection.</p>
      </div>
    )
  }

  return (
    <div className={className}>
      {/* Photo Grid - Mobile First */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {photos.map((photo) => {
          console.log('Rendering photo:', photo.id, photo.public_url)
          return (
          <div
            key={photo.id}
            className="relative group cursor-pointer rounded-2xl overflow-hidden bg-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02]"
            onClick={() => handlePhotoClick(photo)}
          >
            {/* Primary badge */}
            {photo.is_primary && (
              <div className="absolute top-3 left-3 z-20">
                <div className="bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  Primary
                </div>
              </div>
            )}

            {/* Photo */}
            <div className="relative h-48 w-full">
              <img
                src={photo.public_url}
                alt={photo.original_filename}
                className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500"
                onError={(e) => {
                  console.error('Image load error:', photo.public_url)
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                  target.nextElementSibling?.classList.remove('hidden')
                }}
              />
              <div className="hidden absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 rounded-2xl flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <svg className="mx-auto h-12 w-12 mb-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                  </svg>
                  <p className="font-medium">Image not available</p>
                </div>
              </div>
            </div>

            {/* Overlay with actions */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end justify-between p-4">
              <div className="flex space-x-2">
                {!photo.is_primary && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setPrimaryPhoto(photo.id)
                    }}
                    className="bg-white/90 backdrop-blur-sm text-gray-900 px-3 py-2 rounded-xl text-sm font-medium hover:bg-white transition-colors shadow-lg"
                  >
                    ⭐ Set Primary
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeletePhoto(photo.id)
                  }}
                  disabled={deleting === photo.id}
                  className="bg-red-500/90 backdrop-blur-sm text-white px-3 py-2 rounded-xl text-sm font-medium hover:bg-red-600 disabled:opacity-50 transition-colors shadow-lg"
                >
                  {deleting === photo.id ? '🗑️ Deleting...' : '🗑️ Delete'}
                </button>
              </div>
              
              {/* Capture method indicator */}
              <div className="bg-white/90 backdrop-blur-sm rounded-xl p-2">
                {photo.capture_method === 'camera' ? (
                  <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v6a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586l-.707-.707A1 1 0 0013 4H7a1 1 0 00-.707.293L5.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            </div>

            {/* Bottom info */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <p className="text-sm font-medium truncate">{photo.original_filename}</p>
              <p className="text-xs text-gray-300">{formatFileSize(photo.file_size)}</p>
            </div>
          </div>
        )
        })}
      </div>

      {/* Photo Details Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-4xl max-h-[90vh] overflow-auto w-full">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  {selectedPhoto.original_filename}
                </h3>
                <p className="text-gray-500 text-sm mt-1">
                  {new Date(selectedPhoto.created_at).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedPhoto(null)}
                className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-2xl flex items-center justify-center transition-colors"
              >
                <svg className="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Photo */}
            <div className="relative max-h-96 bg-gray-50">
              <img
                src={selectedPhoto.public_url}
                alt={selectedPhoto.original_filename}
                className="w-full h-auto max-h-96 object-contain"
              />
            </div>

            {/* Metadata */}
            {showMetadata && (
              <div className="p-6 border-t border-gray-100 bg-gray-50">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-3">
                    <div>
                      <span className="font-semibold text-gray-700">Filename:</span>
                      <p className="text-gray-600 mt-1">{selectedPhoto.filename}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Size:</span>
                      <p className="text-gray-600 mt-1">{formatFileSize(selectedPhoto.file_size)}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Dimensions:</span>
                      <p className="text-gray-600 mt-1">
                        {selectedPhoto.width}×{selectedPhoto.height}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <span className="font-semibold text-gray-700">Method:</span>
                      <p className="text-gray-600 mt-1 capitalize">{selectedPhoto.capture_method}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Type:</span>
                      <p className="text-gray-600 mt-1">{selectedPhoto.mime_type}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Uploaded:</span>
                      <p className="text-gray-600 mt-1">
                        {new Date(selectedPhoto.created_at).toLocaleString()}
                      </p>
                    </div>
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