import { createServerSupabase } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import AppLayout from '@/components/layout/AppLayout'
import RoomSelection from '@/components/inspections/RoomSelection'

interface RoomSelectionPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function RoomSelectionPage({ params }: RoomSelectionPageProps) {
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

  return <RoomSelection inspectionId={id} />
}