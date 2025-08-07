import { createServerSupabase } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import AppLayout from '@/components/layout/AppLayout'

interface InspectionReportPageProps {
  params: Promise<{
    id: string
  }>
}

interface Room {
  id: string
  room_name: string
  room_type: 'standard' | 'custom'
  is_completed: boolean
  comments?: string
  created_at: string
}

interface Photo {
  id: string
  filename: string
  original_filename: string
  public_url: string
  capture_method: 'camera' | 'upload'
  description?: string
  created_at: string
  room_id: string
}

interface Inspection {
  id: string
  address: string
  inspection_type: 'entry' | 'exit' | 'routine'
  owner_name: string
  tenant_name?: string
  inspection_date: string
  created_at: string
  updated_at: string
}

export default async function InspectionReportPage({ params }: InspectionReportPageProps) {
  const { id } = await params
  const supabase = await createServerSupabase()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Fetch inspection data
  const { data: inspection, error: inspectionError } = await supabase
    .from('inspections')
    .select('*')
    .eq('id', id)
    .eq('created_by', user.id)
    .single()

  if (inspectionError || !inspection) {
    return (
      <AppLayout>
        <div className="p-6 lg:p-8">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Inspection Not Found
            </h1>
            <p className="text-gray-600 mb-6">
              The inspection report you're looking for doesn't exist or you don't have permission to view it.
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </AppLayout>
    )
  }

  // Fetch rooms with photos
  const { data: rooms } = await supabase
    .from('rooms')
    .select('*')
    .eq('inspection_id', id)
    .eq('is_selected', true)
    .order('created_at')

  // Fetch all photos for this inspection
  const { data: photos } = await supabase
    .from('photos')
    .select('*')
    .eq('inspection_id', id)
    .order('created_at')

  const roomsWithPhotos = (rooms || []).map(room => ({
    ...room,
    photos: (photos || []).filter(photo => photo.room_id === room.id)
  }))

  const totalPhotos = photos?.length || 0
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

  return (
    <>
      <style jsx global>{`
        @media print {
          @page {
            margin: 1in;
            size: A4;
          }
          
          body {
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
          }
          
          nav, .no-print {
            display: none !important;
          }
          
          .print-container {
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          
          h1 { font-size: 24px !important; }
          h2 { font-size: 20px !important; }
          h3 { font-size: 18px !important; }
          
          img {
            max-width: 100% !important;
            height: auto !important;
          }
          
          .avoid-break {
            page-break-inside: avoid;
          }
        }
      `}</style>
      <AppLayout>
        <div className="min-h-screen bg-gray-50 print-container">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-6 py-8">
            <div className="flex items-center justify-between mb-6">
              <Link
                href={`/inspections/${id}`}
                className="inline-flex items-center text-gray-600 hover:text-gray-900"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Inspection
              </Link>
              <button
                onClick={() => window.print()}
                className="inline-flex items-center px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Export PDF
              </button>
            </div>
            
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Inspection Report
              </h1>
              <p className="text-lg text-gray-600">
                {getInspectionTypeLabel(inspection.inspection_type)}
              </p>
            </div>
          </div>
        </div>

        {/* Report Content */}
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Property Information */}
            <div className="p-8 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Property Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Property Address</label>
                  <p className="text-gray-900">{inspection.address}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Inspection Date</label>
                  <p className="text-gray-900">{new Date(inspection.inspection_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Property Owner</label>
                  <p className="text-gray-900">{inspection.owner_name}</p>
                </div>
                {inspection.tenant_name && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Tenant</label>
                    <p className="text-gray-900">{inspection.tenant_name}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Summary Statistics */}
            <div className="p-8 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Inspection Summary</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{roomsWithPhotos.length}</div>
                  <div className="text-sm text-gray-600">Total Rooms</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{completedRooms}</div>
                  <div className="text-sm text-gray-600">Rooms Completed</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{totalPhotos}</div>
                  <div className="text-sm text-gray-600">Photos Captured</div>
                </div>
              </div>
            </div>

            {/* Room by Room Details */}
            <div className="p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-8">Room Details</h2>
              
              {roomsWithPhotos.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <p className="text-gray-500">No rooms were selected for this inspection.</p>
                </div>
              ) : (
                <div className="space-y-12">
                  {roomsWithPhotos.map((room, index) => (
                    <div key={room.id} className={`${index !== 0 ? 'border-t border-gray-200 pt-12' : ''}`}>
                      {/* Room Header */}
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-medium text-gray-900">{room.room_name}</h3>
                        <div className="flex items-center">
                          {room.is_completed ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              Completed
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                              Pending
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Photos */}
                      {room.photos.length > 0 && (
                        <div className="mb-6">
                          <h4 className="text-sm font-medium text-gray-700 mb-4">Photos ({room.photos.length})</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {room.photos.map((photo) => (
                              <div key={photo.id} className="space-y-3">
                                <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
                                  <Image
                                    src={photo.public_url}
                                    alt={photo.original_filename}
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                                {photo.description && (
                                  <div className="p-3 bg-gray-50 rounded-lg">
                                    <p className="text-sm text-gray-700">{photo.description}</p>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Room Comments */}
                      {room.comments && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-3">Notes</h4>
                          <div className="p-4 bg-gray-50 rounded-lg">
                            <p className="text-gray-700 whitespace-pre-wrap">{room.comments}</p>
                          </div>
                        </div>
                      )}

                      {/* Empty State */}
                      {room.photos.length === 0 && !room.comments && (
                        <div className="text-center py-8 bg-gray-50 rounded-lg">
                          <p className="text-gray-500">No photos or notes for this room.</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-8 border-t border-gray-200 bg-gray-50">
              <div className="text-center text-sm text-gray-500">
                <p>Report generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</p>
                <p className="mt-1">Inspector - Property Management System</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      </AppLayout>
    </>
  )
}