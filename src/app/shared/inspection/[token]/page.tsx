import { createServerSupabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import Image from 'next/image'

interface SharedInspectionPageProps {
  params: Promise<{
    token: string
  }>
}

// Interfaces commented to avoid unused variable warnings
// interface Room {
//   id: string
//   room_name: string
//   room_type: string
//   is_completed: boolean
//   comments: string | null
//   ai_analysis: string | null
//   photos: Photo[]
// }

// interface Photo {
//   id: string
//   public_url: string
//   description: string | null
//   capture_method: string
//   created_at: string
// }

// interface Inspection {
//   id: string
//   address: string
//   inspection_type: 'entry' | 'exit' | 'routine'
//   owner_name: string
//   tenant_name: string | null
//   inspection_date: string
//   status: string
//   notes: string | null
//   created_at: string
//   updated_at: string
// }

export default async function SharedInspectionPage({ params }: SharedInspectionPageProps) {
  const { token } = await params
  
  // Use createServerSupabase without auth for public access
  const supabase = await createServerSupabase()

  // Find inspection by share token
  const { data: inspection, error: inspectionError } = await supabase
    .from('inspections')
    .select('*')
    .eq('share_token', token)
    .eq('share_enabled', true)
    .single()

  if (inspectionError || !inspection) {
    notFound()
  }

  // Fetch rooms with photos for this shared inspection
  const { data: rooms } = await supabase
    .from('rooms')
    .select('*')
    .eq('inspection_id', inspection.id)
    .eq('is_selected', true)
    .order('created_at')

  // Fetch all photos for this inspection
  const { data: photos } = await supabase
    .from('photos')
    .select('*')
    .eq('inspection_id', inspection.id)
    .order('created_at')

  const roomsWithPhotos = (rooms || []).map(room => ({
    ...room,
    photos: (photos || []).filter(photo => photo.room_id === room.id)
  }))

  const completedRooms = roomsWithPhotos.filter(room => room.is_completed).length

  const getInspectionTypeLabel = (type: string) => {
    switch (type) {
      case 'entry':
        return 'Move-In Inspection'
      case 'exit':
        return 'Move-Out Inspection'
      case 'routine':
        return 'Routine Inspection'
      default:
        return 'Property Inspection'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Shared Inspection Report
            </h1>
            <p className="text-lg text-gray-600">
              {getInspectionTypeLabel(inspection.inspection_type)}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              This is a publicly shared inspection report
            </p>
          </div>
        </div>
      </div>

      {/* Report Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Inspection Summary */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Inspection Summary</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Property Address</h3>
                <p className="mt-1 text-gray-900">{inspection.address}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Inspection Type</h3>
                <p className="mt-1 text-gray-900">{getInspectionTypeLabel(inspection.inspection_type)}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Property Owner</h3>
                <p className="mt-1 text-gray-900">{inspection.owner_name}</p>
              </div>
              
              {inspection.tenant_name && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Tenant</h3>
                  <p className="mt-1 text-gray-900">{inspection.tenant_name}</p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Inspection Date</h3>
                <p className="mt-1 text-gray-900">{formatDate(inspection.inspection_date)}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Status</h3>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  inspection.status === 'completed' ? 'bg-green-100 text-green-800' :
                  inspection.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {inspection.status.charAt(0).toUpperCase() + inspection.status.slice(1)}
                </span>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Rooms Completed</h3>
                <p className="mt-1 text-gray-900">{completedRooms} of {roomsWithPhotos.length}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Generated</h3>
                <p className="mt-1 text-gray-900">{formatDate(inspection.created_at)}</p>
              </div>
            </div>
          </div>

          {inspection.notes && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Inspector Notes</h3>
              <p className="text-gray-900 whitespace-pre-wrap">{inspection.notes}</p>
            </div>
          )}
        </div>

        {/* Rooms Section */}
        {roomsWithPhotos.length > 0 && (
          <div className="space-y-8">
            <h2 className="text-xl font-semibold text-gray-900">Room Details</h2>
            
            {roomsWithPhotos.map((room) => (
              <div key={room.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">{room.room_name}</h3>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    room.is_completed ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {room.is_completed ? 'Completed' : 'Pending'}
                  </span>
                </div>

                {/* Room Photos */}
                {room.photos.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-500 mb-3">Photos ({room.photos.length})</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {room.photos.map((photo) => (
                        <div key={photo.id} className="group relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
                          <Image
                            src={photo.public_url}
                            alt={photo.description || `Photo in ${room.room_name}`}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                          {photo.description && (
                            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2">
                              <p className="text-xs">{photo.description}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Room Comments */}
                {room.comments && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Inspector Comments</h4>
                    <p className="text-gray-900 whitespace-pre-wrap bg-gray-50 rounded-lg p-3">{room.comments}</p>
                  </div>
                )}

                {/* AI Analysis */}
                {room.ai_analysis && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">AI Analysis</h4>
                    <p className="text-gray-900 whitespace-pre-wrap bg-blue-50 rounded-lg p-3">{room.ai_analysis}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-500">
            This inspection report was generated by HayStack Inspector
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Shared on {formatDate(new Date().toISOString())}
          </p>
        </div>
      </div>
    </div>
  )
}

// Generate metadata for SEO
export async function generateMetadata({ params }: SharedInspectionPageProps) {
  const { token } = await params
  
  const supabase = await createServerSupabase()
  
  const { data: inspection } = await supabase
    .from('inspections')
    .select('address, inspection_type')
    .eq('share_token', token)
    .eq('share_enabled', true)
    .single()

  if (!inspection) {
    return {
      title: 'Shared Inspection Report - Not Found'
    }
  }

  return {
    title: `Inspection Report - ${inspection.address}`,
    description: `Shared inspection report for property at ${inspection.address}`,
  }
}