import AppLayout from '@/components/layout/AppLayout'
import { createServerSupabase } from '@/lib/supabase'
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

export default async function InspectionsPage() {
  const supabase = await createServerSupabase()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

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
        return 'bg-orange-100 text-orange-800'
      case 'draft':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getInspectionTypeIcon = (type: string) => {
    switch (type) {
      case 'entry':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
          </svg>
        )
      case 'exit':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        )
      case 'routine':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        )
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )
    }
  }

  const getNextAction = (inspection: Inspection) => {
    if (inspection.status === 'draft' || !inspection.rooms_count) {
      return {
        text: 'Select Rooms',
        href: `/inspections/${inspection.id}/rooms`,
        color: 'bg-blue-600 hover:bg-blue-700'
      }
    }
    if (inspection.status === 'in_progress') {
      return {
        text: 'Continue',
        href: `/inspections/${inspection.id}/wizard`,
        color: 'bg-orange-600 hover:bg-orange-700'
      }
    }
    return {
      text: 'View Report',
      href: `/inspections/${inspection.id}`,
      color: 'bg-green-600 hover:bg-green-700'
    }
  }

  return (
    <AppLayout>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl lg:text-3xl font-semibold text-gray-900 mb-2">
                Inspections
              </h1>
              <p className="text-gray-600">
                Manage and track all your property inspections
              </p>
            </div>
            <Link
              href="/inspections/new"
              className="inline-flex items-center px-4 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Inspection
            </Link>
          </div>
        </div>

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
          /* Inspections List */
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* Table Header - Hidden on mobile */}
            <div className="hidden lg:grid lg:grid-cols-12 gap-4 px-6 py-4 bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-600">
              <div className="col-span-3">Property</div>
              <div className="col-span-2">Type</div>
              <div className="col-span-2">Owner</div>
              <div className="col-span-2">Date</div>
              <div className="col-span-2">Progress</div>
              <div className="col-span-1">Actions</div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-gray-200">
              {inspectionsWithCounts.map((inspection) => {
                const nextAction = getNextAction(inspection)
                return (
                  <div key={inspection.id} className="lg:grid lg:grid-cols-12 gap-4 p-6 hover:bg-gray-50 transition-colors">
                    {/* Mobile Layout */}
                    <div className="lg:hidden space-y-4">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900 mb-1">
                            {inspection.address}
                          </h3>
                          <div className="flex items-center text-sm text-gray-600">
                            <div className="flex items-center mr-4">
                              {getInspectionTypeIcon(inspection.inspection_type)}
                              <span className="ml-1 capitalize">
                                {inspection.inspection_type.replace('_', ' ')}
                              </span>
                            </div>
                            <span>{new Date(inspection.inspection_date).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(inspection.status)}`}>
                          {inspection.status.replace('_', ' ')}
                        </span>
                      </div>

                      {/* Details */}
                      <div className="space-y-2">
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
                        <div>
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
                          className={`flex-1 inline-flex items-center justify-center px-4 py-2 text-white rounded-lg text-sm font-medium transition-colors ${nextAction.color}`}
                        >
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

                    {/* Desktop Layout */}
                    <div className="hidden lg:contents">
                      {/* Property */}
                      <div className="col-span-3">
                        <h3 className="font-medium text-gray-900 mb-1">
                          {inspection.address}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {inspection.owner_name}
                        </p>
                      </div>

                      {/* Type */}
                      <div className="col-span-2 flex items-center">
                        <div className="flex items-center text-sm text-gray-600">
                          {getInspectionTypeIcon(inspection.inspection_type)}
                          <span className="ml-2 capitalize">
                            {inspection.inspection_type.replace('_', ' ')}
                          </span>
                        </div>
                      </div>

                      {/* Owner */}
                      <div className="col-span-2">
                        <p className="text-sm text-gray-900">{inspection.owner_name}</p>
                        {inspection.tenant_name && (
                          <p className="text-xs text-gray-500">Tenant: {inspection.tenant_name}</p>
                        )}
                      </div>

                      {/* Date */}
                      <div className="col-span-2">
                        <p className="text-sm text-gray-900">
                          {new Date(inspection.inspection_date).toLocaleDateString()}
                        </p>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(inspection.status)}`}>
                          {inspection.status.replace('_', ' ')}
                        </span>
                      </div>

                      {/* Progress */}
                      <div className="col-span-2">
                        {inspection.rooms_count && inspection.rooms_count > 0 ? (
                          <div>
                            <p className="text-sm text-gray-900 mb-1">
                              {inspection.completed_rooms}/{inspection.rooms_count} rooms
                            </p>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-gray-900 h-2 rounded-full transition-all duration-300"
                                style={{ 
                                  width: `${((inspection.completed_rooms || 0) / inspection.rooms_count) * 100}%` 
                                }}
                              />
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">No rooms selected</p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="col-span-1 flex justify-end">
                        <div className="flex space-x-2">
                          <Link
                            href={nextAction.href}
                            className={`inline-flex items-center px-3 py-1.5 text-white rounded-md text-sm font-medium transition-colors ${nextAction.color}`}
                          >
                            {nextAction.text}
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}