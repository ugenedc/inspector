import { createServerSupabase } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import AnalysisReviewDemo from '@/components/analysis/AnalysisReviewDemo'

export default async function AnalysisReviewDemoPage() {
  const supabase = await createServerSupabase()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">AI Analysis Review Demo</h1>
          <p className="mt-2 text-gray-600">
            Test the AI analysis review components with editable results and approval workflow.
          </p>
        </div>

        <AnalysisReviewDemo />
      </div>
    </div>
  )
}