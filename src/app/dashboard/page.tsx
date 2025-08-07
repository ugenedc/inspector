import AppLayout from '@/components/layout/AppLayout'
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
  status: 'pending' | 'in_progress' | 'completed'
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
  const { data: inspections } = await supabase
    .from('inspections')
    .select(`
      *,
      rooms!inner(
        id,
        is_completed
      )
    `)
    .eq('inspector_id', user.id)
    .order('created_at', { ascending: false })

  const inspectionsWithCounts: Inspection[] = (inspections || []).map(inspection => {
    const rooms = inspection.rooms || []
    const completedRooms = rooms.filter((room: { is_completed: boolean }) => room.is_completed).length
    const totalRooms = rooms.length
    
    // Determine status based on room completion
    let status: 'pending' | 'in_progress' | 'completed' = 'pending'
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

  // Calculate statistics
  const totalInspections = inspectionsWithCounts.length
  const inProgressCount = inspectionsWithCounts.filter(i => i.status === 'in_progress').length
  const completedCount = inspectionsWithCounts.filter(i => i.status === 'completed').length
  const pendingCount = inspectionsWithCounts.filter(i => i.status === 'pending').length
  
  // This week's inspections
  const thisWeek = new Date()
  thisWeek.setDate(thisWeek.getDate() - 7)
  const thisWeekCount = inspectionsWithCounts.filter(i => 
    new Date(i.created_at) >= thisWeek
  ).length

  // Average completion rate
  const inspectionsWithRooms = inspectionsWithCounts.filter(i => i.rooms_count && i.rooms_count > 0)
  const avgCompletionRate = inspectionsWithRooms.length > 0 
    ? Math.round(
        inspectionsWithRooms.reduce((acc, i) => 
          acc + ((i.completed_rooms || 0) / (i.rooms_count || 1)), 0
        ) / inspectionsWithRooms.length * 100
      )
    : 0

  return (
    <AppLayout>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl lg:text-3xl font-semibold text-gray-900 mb-2">
            Dashboard
          </h1>
          <p className="text-gray-600">
            Welcome back! Here&apos;s what&apos;s happening with your inspections.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Inspections */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Inspections</p>
                <p className="text-3xl font-semibold text-gray-900">{totalInspections}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-green-600 font-medium">+{thisWeekCount}</span>
              <span className="text-gray-500 ml-1">this week</span>
            </div>
          </div>

          {/* In Progress */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-3xl font-semibold text-gray-900">{inProgressCount}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-gray-500">Need attention</span>
            </div>
          </div>

          {/* Completed */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-3xl font-semibold text-gray-900">{completedCount}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-green-600 font-medium">{avgCompletionRate}%</span>
              <span className="text-gray-500 ml-1">avg completion</span>
            </div>
          </div>

          {/* Pending */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-3xl font-semibold text-gray-900">{pendingCount}</p>
              </div>
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-gray-500">Needs setup</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Quick Start */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Start</h3>
            <div className="space-y-3">
              <Link
                href="/inspections/new"
                className="flex items-center p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
              >
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">New Inspection</p>
                  <p className="text-sm text-gray-500">Start a fresh property inspection</p>
                </div>
              </Link>
              
              <Link
                href="/inspections"
                className="flex items-center p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
              >
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">View All Inspections</p>
                  <p className="text-sm text-gray-500">Manage your inspection portfolio</p>
                </div>
              </Link>
              
              <Link
                href="/properties"
                className="flex items-center p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
              >
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Properties</p>
                  <p className="text-sm text-gray-500">Browse by address & history</p>
                </div>
              </Link>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
            {inspectionsWithCounts.length > 0 ? (
              <div className="space-y-3">
                {inspectionsWithCounts.slice(0, 3).map((inspection) => (
                  <div key={inspection.id} className="flex items-center justify-between py-2">
                    <div className="flex items-center">
                      <div className={`w-2 h-2 rounded-full mr-3 ${
                        inspection.status === 'completed' ? 'bg-green-500' :
                        inspection.status === 'in_progress' ? 'bg-orange-500' :
                        'bg-gray-300'
                      }`} />
                      <div>
                        <p className="text-sm font-medium text-gray-900 truncate max-w-48">
                          {inspection.address}
                        </p>
                        <p className="text-xs text-gray-500 capitalize">
                          {inspection.inspection_type} • {new Date(inspection.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      inspection.status === 'completed' ? 'bg-green-100 text-green-800' :
                      inspection.status === 'in_progress' ? 'bg-orange-100 text-orange-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {inspection.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-sm text-gray-500">No inspections yet</p>
                <Link
                  href="/inspections/new"
                  className="inline-flex items-center mt-3 text-sm text-blue-600 hover:text-blue-700"
                >
                  Create your first inspection →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}