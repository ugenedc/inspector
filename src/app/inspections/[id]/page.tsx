import { createServerSupabase } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import AppLayout from '@/components/layout/AppLayout'

interface InspectionPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function InspectionPage({ params }: InspectionPageProps) {
  const { id } = await params
  const supabase = await createServerSupabase()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Fetch the inspection data
  const { data: inspection, error } = await supabase
    .from('inspections')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !inspection) {
    return (
      <AppLayout>
        <div className="p-6 lg:p-8">
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
    <AppLayout>
      <div className="p-6 lg:p-8">
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <div className="flex justify-between items-start mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              Inspection Details
            </h1>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              inspection.status === 'completed' ? 'bg-green-100 text-green-800' :
              inspection.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {inspection.status.charAt(0).toUpperCase() + inspection.status.slice(1)}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Property Address</h3>
                <p className="mt-1 text-sm text-gray-900 whitespace-pre-line">{inspection.address}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Inspection Type</h3>
                <p className="mt-1 text-sm text-gray-900 capitalize">{inspection.inspection_type}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Property Owner</h3>
                <p className="mt-1 text-sm text-gray-900">{inspection.owner_name}</p>
              </div>
              
              {inspection.tenant_name && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Tenant</h3>
                  <p className="mt-1 text-sm text-gray-900">{inspection.tenant_name}</p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Inspection Date</h3>
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(inspection.inspection_date).toLocaleDateString()}
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Created</h3>
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(inspection.created_at).toLocaleDateString()} at{' '}
                  {new Date(inspection.created_at).toLocaleTimeString()}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">Inspection ID</h3>
                <p className="mt-1 text-sm text-gray-900 font-mono">{inspection.id}</p>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-between">
            <Link
              href="/dashboard"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Back to Dashboard
            </Link>
            
            <div className="space-x-3">
              <Link
                href={`/inspections/${id}/rooms`}
                className="inline-flex items-center px-4 py-2 border border-indigo-600 text-sm font-medium rounded-md text-indigo-600 bg-white hover:bg-indigo-50"
              >
                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                Select Rooms
              </Link>
              <Link
                href={`/inspections/${id}/wizard`}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Start Inspection
                <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}