import { createServerSupabase } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import PhotoAnalysisDemo from '@/components/analysis/PhotoAnalysisDemo'

export default async function AnalysisDemoPage() {
  const supabase = await createServerSupabase()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Setup Check */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex">
            <svg className="h-5 w-5 text-blue-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Setup Required</h3>
              <div className="mt-1 text-sm text-blue-700">
                <p>Make sure you have set your OpenAI API key in the environment variables:</p>
                <code className="mt-1 inline-block px-2 py-1 bg-blue-100 rounded">OPENAI_API_KEY=your_openai_api_key</code>
              </div>
            </div>
          </div>
        </div>

        <PhotoAnalysisDemo />
      </div>
    </div>
  )
}