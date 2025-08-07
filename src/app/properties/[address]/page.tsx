import { createServerSupabase } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import AppLayout from '@/components/layout/AppLayout'
import PropertyMap from '@/components/maps/PropertyMap'

interface PropertyPageProps {
  params: Promise<{
    address: string
  }>
}

interface PropertyData {
  address: string
  formatted_address?: string
  latitude?: number
  longitude?: number
  place_id?: string
  created_at: string
  inspections: Inspection[]
}

interface Inspection {
  id: string
  address: string
  inspection_type: 'entry' | 'exit' | 'routine'
  owner_name: string
  tenant_name?: string
  inspection_date: string
  status: string
  created_at: string
  updated_at: string
}

async function getPropertyData(address: string, userId: string): Promise<PropertyData | null> {
  const supabase = await createServerSupabase()
  
  // Decode the address from URL
  const decodedAddress = decodeURIComponent(address)
  
  // Get all inspections for this address
  const { data: inspections, error } = await supabase
    .from('inspections')
    .select('*')
    .eq('inspector_id', userId)
    .ilike('address', `%${decodedAddress}%`)
    .order('inspection_date', { ascending: false })

  if (error) {
    console.error('Error fetching inspections:', error)
    return null
  }

  if (!inspections || inspections.length === 0) {
    return null
  }

  // Try to get property data from the properties table if it exists
  const { data: property } = await supabase
    .from('properties')
    .select('*')
    .eq('created_by', userId)
    .or(`address.ilike.%${decodedAddress}%,formatted_address.ilike.%${decodedAddress}%`)
    .limit(1)
    .single()

  return {
    address: decodedAddress,
    formatted_address: property?.formatted_address,
    latitude: property?.latitude,
    longitude: property?.longitude,
    place_id: property?.place_id,
    created_at: inspections[0].created_at,
    inspections
  }
}

function getInspectionTypeIcon(type: string) {
  switch (type) {
    case 'entry':
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
        </svg>
      )
    case 'exit':
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      )
    case 'routine':
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      )
    default:
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800'
    case 'in_progress':
      return 'bg-blue-100 text-blue-800'
    case 'cancelled':
      return 'bg-red-100 text-red-800'
            case 'pending':
      return 'bg-gray-100 text-gray-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export default async function PropertyPage({ params }: PropertyPageProps) {
  const { address } = await params
  const supabase = await createServerSupabase()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  const propertyData = await getPropertyData(address, user.id)

  if (!propertyData) {
    return (
      <AppLayout>
        <div className="p-6 lg:p-8">
          <div className="max-w-2xl mx-auto text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Property Not Found
            </h1>
            <p className="text-gray-600 mb-6">
              The property you're looking for doesn't exist or you don't have permission to view it.
            </p>
            <Link
              href="/properties"
              className="inline-flex items-center px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
            >
              Back to Properties
            </Link>
          </div>
        </div>
      </AppLayout>
    )
  }

  const hasLocationData = propertyData.latitude && propertyData.longitude

  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                <Link
                  href="/properties"
                  className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to Properties
                </Link>
              </div>
              <Link
                href="/inspections/new"
                className="inline-flex items-center px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                </svg>
                New Inspection
              </Link>
            </div>
            
            <div className="mt-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {propertyData.address}
                  </h1>
                  <div className="flex items-center space-x-4 text-gray-600">
                    <span>{propertyData.inspections.length} inspection{propertyData.inspections.length !== 1 ? 's' : ''}</span>
                    <span>•</span>
                    <span>Added {new Date(propertyData.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Property Details */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Property Details</h2>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Address</span>
                    <span className="text-gray-900 font-medium">{propertyData.address}</span>
                  </div>
                  {propertyData.formatted_address && propertyData.formatted_address !== propertyData.address && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Full Address</span>
                      <span className="text-gray-900 text-right">{propertyData.formatted_address}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Inspections</span>
                    <span className="text-gray-900 font-medium">{propertyData.inspections.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Latest Inspection</span>
                    <span className="text-gray-900 font-medium">
                      {new Date(propertyData.inspections[0].inspection_date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Property Added</span>
                    <span className="text-gray-900 font-medium">
                      {new Date(propertyData.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Inspections List */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Inspection History</h2>
                  <span className="text-sm text-gray-500">
                    {propertyData.inspections.length} total
                  </span>
                </div>

                <div className="space-y-4">
                  {propertyData.inspections.map((inspection) => (
                    <div
                      key={inspection.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2 text-gray-600">
                            {getInspectionTypeIcon(inspection.inspection_type)}
                            <span className="text-sm font-medium capitalize">
                              {inspection.inspection_type} Inspection
                            </span>
                          </div>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(inspection.status)}`}>
                            {inspection.status.replace('_', ' ')}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          <span className="text-sm text-gray-500">
                            {new Date(inspection.inspection_date).toLocaleDateString()}
                          </span>
                          <div className="flex space-x-2">
                            {inspection.status === 'completed' && (
                              <Link
                                href={`/inspections/${inspection.id}/report`}
                                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                              >
                                Report
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-3 text-sm text-gray-600">
                        <div className="flex items-center justify-between">
                          <span>Owner: {inspection.owner_name}</span>
                          {inspection.tenant_name && (
                            <span>Tenant: {inspection.tenant_name}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-8">
              {/* Map */}
              {hasLocationData && (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-900">Location</h3>
                  </div>
                  <div className="h-64">
                    <PropertyMap
                      latitude={propertyData.latitude!}
                      longitude={propertyData.longitude!}
                      address={propertyData.formatted_address || propertyData.address}
                    />
                  </div>
                </div>
              )}

              {/* Quick Stats */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Quick Stats</h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Entry Inspections</span>
                    <span className="font-medium text-gray-900">
                      {propertyData.inspections.filter(i => i.inspection_type === 'entry').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Exit Inspections</span>
                    <span className="font-medium text-gray-900">
                      {propertyData.inspections.filter(i => i.inspection_type === 'exit').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Routine Inspections</span>
                    <span className="font-medium text-gray-900">
                      {propertyData.inspections.filter(i => i.inspection_type === 'routine').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Completed</span>
                    <span className="font-medium text-green-600">
                      {propertyData.inspections.filter(i => i.status === 'completed').length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}