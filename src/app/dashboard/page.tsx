import { createServerSupabase } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import Link from 'next/link'

interface Inspection {
  id: string
  address: string
  inspection_type: 'entry' | 'exit' | 'routine'
  owner_name: string
  tenant_name?: string
  inspection_date: string
  status: 'draft' | 'in_progress' | 'completed'
  created_at: string
  updated_at: string
  rooms_count?: number
  completed_rooms?: number
}

export default async function DashboardPage() {
  const supabase = await createServerSupabase()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch user's inspections with room counts
  const { data: inspections, error } = await supabase
    .from('inspections')
    .select(`
      *,
      rooms!inner(
        id,
        is_completed
      )
    `)
    .eq('created_by', user.id)
    .order('created_at', { ascending: false })

  const inspectionsWithCounts: Inspection[] = (inspections || []).map(inspection => {
    const rooms = inspection.rooms || []
    const completedRooms = rooms.filter((room: any) => room.is_completed).length
    const totalRooms = rooms.length
    
    // Determine status based on room completion
    let status: 'draft' | 'in_progress' | 'completed' = 'draft'
    if (totalRooms > 0) {
      if (completedRooms === totalRooms) {
        status = 'completed'
      } else if (completedRooms > 0) {
        status = 'in_progress'
      } else {
        status = 'in_progress' // Has rooms but none completed yet
      }
    }

    return {
      id: inspection.id,
      address: inspection.address,
      inspection_type: inspection.inspection_type,
      owner_name: inspection.owner_name,
      tenant_name: inspection.tenant_name,
      inspection_date: inspection.inspection_date,
      status,
      created_at: inspection.created_at,
      updated_at: inspection.updated_at,
      rooms_count: totalRooms,
      completed_rooms: completedRooms
    }
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800'
      case 'draft':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getInspectionTypeIcon = (type: string) => {
    switch (type) {
      case 'entry':
        return '🚪'
      case 'exit':
        return '🚶‍♂️'
      case 'routine':
        return '🔍'
      default:
        return '📋'
    }
  }

  const getNextAction = (inspection: Inspection) => {
    if (inspection.status === 'draft' || !inspection.rooms_count) {
      return {
        text: 'Select Rooms',
        href: `/inspections/${inspection.id}/rooms`,
        icon: '🏠'
      }
    }
    if (inspection.status === 'in_progress') {
      return {
        text: 'Continue Inspection',
        href: `/inspections/${inspection.id}/wizard`,
        icon: '▶️'
      }
    }
    return {
      text: 'View Report',
      href: `/inspections/${inspection.id}`,
      icon: '📄'
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900 mb-2">
              Property Inspections
            </h1>
            <p className="text-gray-600">
              Manage and track all your property inspections
            </p>
          </div>
          <Link
            href="/inspections/new"
            className="inline-flex items-center px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Inspection
          </Link>
        </div>

        {/* Stats Cards */}
        {inspectionsWithCounts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="text-2xl font-semibold text-gray-900 mb-1">
                {inspectionsWithCounts.length}
              </div>
              <div className="text-sm text-gray-600">Total Inspections</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="text-2xl font-semibold text-blue-600 mb-1">
                {inspectionsWithCounts.filter(i => i.status === 'in_progress').length}
              </div>
              <div className="text-sm text-gray-600">In Progress</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="text-2xl font-semibold text-green-600 mb-1">
                {inspectionsWithCounts.filter(i => i.status === 'completed').length}
              </div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="text-2xl font-semibold text-gray-600 mb-1">
                {inspectionsWithCounts.filter(i => i.status === 'draft').length}
              </div>
              <div className="text-sm text-gray-600">Drafts</div>
            </div>
          </div>
        )}

        {/* Inspections List */}
        {inspectionsWithCounts.length === 0 ? (
          /* Empty State */
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No inspections yet
            </h3>
            <p className="text-gray-600 mb-8">
              Get started by creating your first property inspection
            </p>
            <Link
              href="/inspections/new"
              className="inline-flex items-center px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
            >
              Create Your First Inspection
            </Link>
          </div>
        ) : (
          /* Inspections Grid */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {inspectionsWithCounts.map((inspection) => {
              const nextAction = getNextAction(inspection)
              return (
                <div key={inspection.id} className="border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-colors">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-3">
                      <div className="text-2xl">
                        {getInspectionTypeIcon(inspection.inspection_type)}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 mb-1">
                          {inspection.address}
                        </h3>
                        <p className="text-sm text-gray-600 capitalize">
                          {inspection.inspection_type.replace('_', ' ')} inspection
                        </p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(inspection.status)}`}>
                      {inspection.status.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="space-y-2 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Owner:</span>
                      <span className="text-gray-900">{inspection.owner_name}</span>
                    </div>
                    {inspection.tenant_name && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Tenant:</span>
                        <span className="text-gray-900">{inspection.tenant_name}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Date:</span>
                      <span className="text-gray-900">
                        {new Date(inspection.inspection_date).toLocaleDateString()}
                      </span>
                    </div>
                    {inspection.rooms_count !== undefined && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Progress:</span>
                        <span className="text-gray-900">
                          {inspection.completed_rooms}/{inspection.rooms_count} rooms
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Progress Bar */}
                  {inspection.rooms_count && inspection.rooms_count > 0 && (
                    <div className="mb-6">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gray-900 h-2 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${((inspection.completed_rooms || 0) / inspection.rooms_count) * 100}%` 
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex space-x-3">
                    <Link
                      href={nextAction.href}
                      className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
                    >
                      <span className="mr-2">{nextAction.icon}</span>
                      {nextAction.text}
                    </Link>
                    <Link
                      href={`/inspections/${inspection.id}`}
                      className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                    >
                      Details
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}