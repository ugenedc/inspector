import { createServerSupabase } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import InspectionWizard from '@/components/inspections/InspectionWizard'

interface ChecklistPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function ChecklistPage({ params }: ChecklistPageProps) {
  const { id } = await params
  const supabase = await createServerSupabase()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Fetch the inspection and rooms
  const [inspectionResult, roomsResult] = await Promise.all([
    supabase
      .from('inspections')
      .select('*')
      .eq('id', id)
      .single(),
    supabase
      .from('rooms')
      .select('*')
      .eq('inspection_id', id)
      .eq('is_selected', true)
      .order('room_name')
  ])

  const { data: inspection, error: inspectionError } = inspectionResult
  const { data: rooms } = roomsResult

  if (inspectionError || !inspection) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto p-6">
          <div className="bg-white shadow-lg rounded-lg p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Inspection Not Found
            </h1>
            <p className="text-gray-600 mb-6">
              The inspection you&apos;re looking for doesn&apos;t exist or you don&apos;t have permission to view it.
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Inspection Checklist
              </h1>
              <div className="text-sm text-gray-600">
                <p className="font-medium">{inspection.address}</p>
                <p>
                  {inspection.inspection_type.charAt(0).toUpperCase() + inspection.inspection_type.slice(1)} Inspection
                  • {new Date(inspection.inspection_date).toLocaleDateString()}
                </p>
              </div>
            </div>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              inspection.status === 'completed' ? 'bg-green-100 text-green-800' :
              inspection.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {inspection.status.charAt(0).toUpperCase() + inspection.status.slice(1)}
            </span>
          </div>
        </div>

        {/* Rooms Summary */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Selected Rooms ({rooms?.length || 0})
          </h2>
          
          {!rooms || rooms.length === 0 ? (
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900">No rooms selected</h3>
              <p className="mt-2 text-gray-500">
                You need to select rooms before starting the inspection checklist.
              </p>
              <Link
                href={`/inspections/${id}/rooms`}
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Select Rooms
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {rooms.map((room) => (
                <div
                  key={room.id}
                  className="flex items-center p-3 bg-indigo-50 border border-indigo-200 rounded-lg"
                >
                  <svg className="h-5 w-5 text-indigo-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{room.room_name}</p>
                    {room.room_type === 'custom' && (
                      <p className="text-xs text-indigo-600">Custom</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Inspection Wizard */}
        {rooms && rooms.length > 0 ? (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <InspectionWizard 
              inspectionId={id}
              inspectionType={inspection.inspection_type}
            />
          </div>
        ) : null}

        {/* Navigation */}
        <div className="flex justify-between">
          <Link
            href={`/inspections/${id}/rooms`}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Room Selection
          </Link>
          
          <Link
            href={`/inspections/${id}`}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Back to Inspection Details
          </Link>
        </div>
      </div>
    </div>
  )
}