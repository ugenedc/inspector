'use client'

import { useState } from 'react'
import AIAnalysisReview from './AIAnalysisReview'
import QuickAnalysisReview from './QuickAnalysisReview'

const sampleAnalyses = [
  {
    description: "The kitchen appears to be in excellent condition with clean, well-maintained surfaces. The stainless steel appliances are spotless, and the granite countertops show no signs of staining or damage. The backsplash tiles are clean and the grout lines appear to be in good condition. All visible cabinet doors and drawers are properly aligned and functional. The sink is clean with no visible water stains or mineral buildup.",
    cleanliness_score: 9,
    metadata: {
      inspection_type: "entry",
      room_name: "Kitchen",
      tokens_used: 245,
      model_used: "gpt-4o",
      analyzed_at: new Date().toISOString()
    }
  },
  {
    description: "The bathroom shows moderate wear with some areas requiring attention. The toilet and sink appear clean, but there are visible soap scum deposits on the shower door and some minor grout discoloration in the shower area. The mirror has water spots and the faucet shows some mineral buildup. The floor tiles are generally clean but could benefit from a deep cleaning, particularly around the base of the toilet.",
    cleanliness_score: 6,
    metadata: {
      inspection_type: "exit",
      room_name: "Bathroom",
      tokens_used: 198,
      model_used: "gpt-4o",
      analyzed_at: new Date().toISOString()
    }
  },
  {
    description: "The living room is in poor condition with significant cleaning required. There are visible stains on the carpet in multiple areas, and the coffee table has ring marks from beverages. The couch cushions appear to be stained and may need professional cleaning. Dust is visible on surfaces including the TV stand and end tables. The windows are dirty with streaks and smudges, reducing natural light. Overall, this room requires extensive cleaning before it can be considered acceptable.",
    cleanliness_score: 3,
    metadata: {
      inspection_type: "routine",
      room_name: "Living Room",
      tokens_used: 187,
      model_used: "gpt-4o",
      analyzed_at: new Date().toISOString()
    }
  }
]

export default function AnalysisReviewDemo() {
  const [selectedAnalysis, setSelectedAnalysis] = useState(0)
  const [showQuickVersion, setShowQuickVersion] = useState(false)
  const [savedResults, setSavedResults] = useState<Array<{
    description: string
    cleanliness_score: number
    saved_at: string
    room: string
  }>>([])

  const currentAnalysis = sampleAnalyses[selectedAnalysis]

  const handleSave = (data: { description: string; cleanliness_score: number }) => {
    setSavedResults(prev => [...prev, {
      ...data,
      saved_at: new Date().toISOString(),
      room: currentAnalysis.metadata.room_name
    }])
    alert('Analysis saved successfully!')
  }

  return (
    <div className="space-y-8">
      {/* Controls */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Demo Controls</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Sample Analysis Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sample Analysis
            </label>
            <select
              value={selectedAnalysis}
              onChange={(e) => setSelectedAnalysis(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              {sampleAnalyses.map((analysis, index) => (
                <option key={index} value={index}>
                  {analysis.metadata.room_name} - Score {analysis.cleanliness_score}/10 ({analysis.metadata.inspection_type})
                </option>
              ))}
            </select>
          </div>

          {/* Component Version Toggle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Component Version
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="version"
                  checked={!showQuickVersion}
                  onChange={() => setShowQuickVersion(false)}
                  className="mr-2"
                />
                <span className="text-sm">Full Version</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="version"
                  checked={showQuickVersion}
                  onChange={() => setShowQuickVersion(true)}
                  className="mr-2"
                />
                <span className="text-sm">Quick Version</span>
              </label>
            </div>
          </div>
        </div>

        {/* Current Analysis Info */}
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium text-gray-900">Current Analysis Overview</h3>
          <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium">Room:</span>
              <span className="ml-2">{currentAnalysis.metadata.room_name}</span>
            </div>
            <div>
              <span className="font-medium">Type:</span>
              <span className="ml-2 capitalize">{currentAnalysis.metadata.inspection_type}</span>
            </div>
            <div>
              <span className="font-medium">Score:</span>
              <span className="ml-2">{currentAnalysis.cleanliness_score}/10</span>
            </div>
          </div>
        </div>
      </div>

      {/* Demo Component */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          {showQuickVersion ? 'Quick' : 'Full'} Analysis Review Component
        </h2>
        
        {showQuickVersion ? (
          <QuickAnalysisReview
            initialData={{
              description: currentAnalysis.description,
              cleanliness_score: currentAnalysis.cleanliness_score
            }}
            onApprove={handleSave}
            onCancel={() => alert('Analysis cancelled')}
          />
        ) : (
          <AIAnalysisReview
            analysisData={currentAnalysis}
            onSave={handleSave}
            onCancel={() => alert('Analysis cancelled')}
          />
        )}
      </div>

      {/* Features Overview */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Component Features</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Full Version Features */}
          <div>
            <h3 className="font-medium text-gray-900 mb-3">Full AIAnalysisReview</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start">
                <svg className="h-4 w-4 text-green-500 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Rich score visualization with color coding</span>
              </li>
              <li className="flex items-start">
                <svg className="h-4 w-4 text-green-500 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Interactive slider with numeric input</span>
              </li>
              <li className="flex items-start">
                <svg className="h-4 w-4 text-green-500 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Metadata display and token usage tracking</span>
              </li>
              <li className="flex items-start">
                <svg className="h-4 w-4 text-green-500 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Change tracking and reset functionality</span>
              </li>
              <li className="flex items-start">
                <svg className="h-4 w-4 text-green-500 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Automatic Supabase integration for photos/rooms</span>
              </li>
            </ul>
          </div>

          {/* Quick Version Features */}
          <div>
            <h3 className="font-medium text-gray-900 mb-3">Quick AnalysisReview</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start">
                <svg className="h-4 w-4 text-blue-500 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Compact design for embedded use</span>
              </li>
              <li className="flex items-start">
                <svg className="h-4 w-4 text-blue-500 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Simple slider interface</span>
              </li>
              <li className="flex items-start">
                <svg className="h-4 w-4 text-blue-500 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Essential editing functionality</span>
              </li>
              <li className="flex items-start">
                <svg className="h-4 w-4 text-blue-500 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Change indicators</span>
              </li>
              <li className="flex items-start">
                <svg className="h-4 w-4 text-blue-500 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Perfect for wizard workflows</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Saved Results */}
      {savedResults.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Saved Results</h2>
          <div className="space-y-3">
            {savedResults.map((result, index) => (
              <div key={index} className="p-3 bg-green-50 border border-green-200 rounded-md">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium text-green-900">
                      {result.room} - Score: {result.cleanliness_score}/10
                    </div>
                    <div className="text-sm text-green-700 mt-1">
                      {result.description.substring(0, 100)}...
                    </div>
                  </div>
                  <div className="text-xs text-green-600">
                    {new Date(result.saved_at).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Usage Examples */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Usage Examples</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-gray-900">Basic Usage</h3>
            <pre className="mt-2 p-3 bg-gray-100 rounded-md text-sm overflow-x-auto">
{`<QuickAnalysisReview
  initialData={{
    description: "Room analysis text...",
    cleanliness_score: 8
  }}
  onApprove={(data) => saveToDatabase(data)}
  onCancel={() => setShowReview(false)}
/>`}
            </pre>
          </div>

          <div>
            <h3 className="font-medium text-gray-900">With Supabase Integration</h3>
            <pre className="mt-2 p-3 bg-gray-100 rounded-md text-sm overflow-x-auto">
{`<AIAnalysisReview
  analysisData={aiResult}
  photoId="photo-uuid"
  roomId="room-uuid"
  onSave={(data) => updateInspection(data)}
/>`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}