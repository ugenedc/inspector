import { createServerSupabase } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import AppLayout from '@/components/layout/AppLayout'

interface PropertyGroup {
  address: string
  inspections: Inspection[]
  lastInspection: string
  totalInspections: number
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

async function getPropertiesWithInspections(userId: string) {
  const supabase = await createServerSupabase()
  
  // Get all inspections for the user
  const { data: inspections, error } = await supabase
    .from('inspections')
    .select('*')
    .eq('created_by', userId)
    .order('inspection_date', { ascending: false })

  if (error) {
    console.error('Error fetching inspections:', error)
    return []
  }

  // Group inspections by address
  const propertyGroups: Record<string, PropertyGroup> = {}
  
  inspections?.forEach((inspection) => {
    const address = inspection.address.trim()
    
    if (!propertyGroups[address]) {
      propertyGroups[address] = {
        address,
        inspections: [],
        lastInspection: inspection.inspection_date,
        totalInspections: 0
      }
    }
    
    propertyGroups[address].inspections.push(inspection)
    propertyGroups[address].totalInspections += 1
    
    // Update last inspection date if this one is more recent
    if (new Date(inspection.inspection_date) > new Date(propertyGroups[address].lastInspection)) {
      propertyGroups[address].lastInspection = inspection.inspection_date
    }
  })

  // Convert to array and sort by last inspection date
  return Object.values(propertyGroups).sort((a, b) => 
    new Date(b.lastInspection).getTime() - new Date(a.lastInspection).getTime()
  )
}

function getInspectionTypeColor(type: string) {
  switch (type) {
    case 'entry':
      return 'bg-green-100 text-green-800'
    case 'exit':
      return 'bg-red-100 text-red-800'
    case 'routine':
      return 'bg-blue-100 text-blue-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

function getInspectionTypeLabel(type: string) {
  switch (type) {
    case 'entry':
      return 'Move-In'
    case 'exit':
      return 'Move-Out'
    case 'routine':
      return 'Routine'
    default:
      return 'Inspection'
  }
}

export default async function PropertiesPage() {
  const supabase = await createServerSupabase()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  const properties = await getPropertiesWithInspections(user.id)

  return (
    <AppLayout>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl lg:text-3xl font-semibold text-gray-900 mb-2">
              Properties
            </h1>
            <p className="text-gray-600">
              Manage all your properties and view their inspection history.
            </p>
          </div>
          <Link
            href="/inspections/new"
            className="inline-flex items-center px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Inspection
          </Link>
        </div>

        {/* Properties List */}
        {properties.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No properties yet</h3>
            <p className="text-gray-500 mb-6">
              Start by creating your first property inspection.
            </p>
            <Link
              href="/inspections/new"
              className="inline-flex items-center px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
            >
              Create First Inspection
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {properties.map((property, index) => (
              <div key={index} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {/* Property Header */}
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {property.address}
                          </h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                            <span>{property.totalInspections} inspection{property.totalInspections !== 1 ? 's' : ''}</span>
                            <span>•</span>
                            <span>Last: {new Date(property.lastInspection).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <Link
                      href="/inspections/new"
                      className="inline-flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      New Inspection
                    </Link>
                  </div>
                </div>

                {/* Inspections List */}
                <div className="divide-y divide-gray-100">
                  {property.inspections.slice(0, 5).map((inspection) => (
                    <div key={inspection.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getInspectionTypeColor(inspection.inspection_type)}`}>
                              {getInspectionTypeLabel(inspection.inspection_type)}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {new Date(inspection.inspection_date).toLocaleDateString()}
                            </div>
                            <div className="text-sm text-gray-500">
                              Owner: {inspection.owner_name}
                              {inspection.tenant_name && ` • Tenant: ${inspection.tenant_name}`}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Link
                            href={`/inspections/${inspection.id}`}
                            className="text-sm text-gray-600 hover:text-gray-900"
                          >
                            View Details
                          </Link>
                          <span className="text-gray-300">•</span>
                          <Link
                            href={`/inspections/${inspection.id}/report`}
                            className="text-sm text-gray-600 hover:text-gray-900"
                          >
                            Report
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Show More Link */}
                  {property.inspections.length > 5 && (
                    <div className="p-4 text-center">
                      <button className="text-sm text-gray-600 hover:text-gray-900">
                        View {property.inspections.length - 5} more inspection{property.inspections.length - 5 !== 1 ? 's' : ''}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}