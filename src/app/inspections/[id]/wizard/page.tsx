import { createServerSupabase } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import AppLayout from '@/components/layout/AppLayout'
import InspectionWizard from '@/components/inspections/InspectionWizard'

interface WizardPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function WizardPage({ params }: WizardPageProps) {
  const { id } = await params
  const supabase = await createServerSupabase()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Fetch the inspection data to verify it exists and belongs to the user
  const { data: inspection, error } = await supabase
    .from('inspections')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !inspection) {
    return (
      <AppLayout>
        <div className="p-6 lg:p-8">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white shadow-lg rounded-lg p-8 text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                Inspection Not Found
              </h1>
              <p className="text-gray-600 mb-6">
                The inspection you&apos;re looking for doesn&apos;t exist or you don&apos;t have permission to view it.
              </p>
              <Link
                href="/dashboard"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-900 hover:bg-gray-800"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-4">
              <li>
                <Link href="/dashboard" className="text-gray-400 hover:text-gray-500">
                  Dashboard
                </Link>
              </li>
              <li>
                <div className="flex items-center">
                  <svg className="flex-shrink-0 h-5 w-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  <Link href={`/inspections/${id}`} className="ml-4 text-gray-400 hover:text-gray-500">
                    Inspection Details
                  </Link>
                </div>
              </li>
              <li>
                <div className="flex items-center">
                  <svg className="flex-shrink-0 h-5 w-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="ml-4 text-gray-500">Inspection Wizard</span>
                </div>
              </li>
            </ol>
          </nav>
          
          <div className="mt-4">
            <h1 className="text-3xl font-bold text-gray-900">Property Inspection</h1>
            <div className="mt-2 text-sm text-gray-600">
              <p className="font-medium">{inspection.address}</p>
              <p>
                {inspection.inspection_type.charAt(0).toUpperCase() + inspection.inspection_type.slice(1)} Inspection
                • {new Date(inspection.inspection_date).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Inspection Wizard */}
        <InspectionWizard 
          inspectionId={id}
          inspectionType={inspection.inspection_type}
          redirectOnComplete={true}
        />

        {/* Quick Actions */}
        <div className="mt-8 flex justify-center">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex space-x-4">
              <Link
                href={`/inspections/${id}`}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Details
              </Link>
              
              <Link
                href={`/inspections/${id}/rooms`}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                Modify Rooms
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}