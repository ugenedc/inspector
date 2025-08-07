'use client'

import { useState, useEffect } from 'react'
import { createClientSupabase } from '@/lib/supabase'

interface AIAnalysisData {
  description: string
  cleanliness_score: number
  metadata?: {
    inspection_type: string
    room_name: string
    tokens_used: number
    model_used: string
    analyzed_at: string
    reviewed_at?: string
    has_manual_edits?: boolean
  }
}

interface AIAnalysisReviewProps {
  analysisData: AIAnalysisData
  photoId?: string
  roomId?: string
  onSave?: (finalData: AIAnalysisData) => void
  onCancel?: () => void
  className?: string
}

export default function AIAnalysisReview({
  analysisData,
  photoId,
  roomId,
  onSave,
  onCancel,
  className = ''
}: AIAnalysisReviewProps) {
  const [description, setDescription] = useState(analysisData.description)
  const [cleanlinessScore, setCleanlinessScore] = useState(analysisData.cleanliness_score)
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const supabase = createClientSupabase()

  // Track changes
  useEffect(() => {
    const changed = 
      description !== analysisData.description || 
      cleanlinessScore !== analysisData.cleanliness_score
    setHasChanges(changed)
  }, [description, cleanlinessScore, analysisData])

  // Score color helper
  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600 bg-green-50 border-green-200'
    if (score >= 6) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    if (score >= 4) return 'text-orange-600 bg-orange-50 border-orange-200'
    return 'text-red-600 bg-red-50 border-red-200'
  }

  // Score description helper
  const getScoreDescription = (score: number) => {
    if (score >= 9) return 'Excellent - Pristine condition'
    if (score >= 8) return 'Very Good - Clean and well-maintained'
    if (score >= 7) return 'Good - Generally clean'
    if (score >= 6) return 'Fair - Acceptable with minor issues'
    if (score >= 5) return 'Average - Needs attention'
    if (score >= 4) return 'Below Average - Noticeable problems'
    if (score >= 3) return 'Poor - Significant cleaning needed'
    if (score >= 2) return 'Very Poor - Major issues'
    return 'Unacceptable - Extreme problems'
  }

  const handleApprove = async () => {
    const finalData: AIAnalysisData = {
      description,
      cleanliness_score: cleanlinessScore,
      metadata: {
        ...analysisData.metadata!,
        reviewed_at: new Date().toISOString(),
        has_manual_edits: hasChanges
      }
    }

    try {
      setSaving(true)
      setError(null)

      // Save to database if we have the necessary IDs
      if (photoId) {
        await saveToPhoto(finalData)
      } else if (roomId) {
        await saveToRoom(finalData)
      }

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)

      // Call the onSave callback
      onSave?.(finalData)

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save analysis'
      setError(errorMessage)
      console.error('Error saving analysis:', err)
    } finally {
      setSaving(false)
    }
  }

  const saveToPhoto = async (data: AIAnalysisData) => {
    const { error } = await supabase
      .from('photos')
      .update({
        description: data.description,
        ai_analysis: JSON.stringify(data),
        analysis_timestamp: new Date().toISOString()
      })
      .eq('id', photoId)

    if (error) throw error
  }

  const saveToRoom = async (data: AIAnalysisData) => {
    const { error } = await supabase
      .from('rooms')
      .update({
        ai_analysis: JSON.stringify(data),
        analysis_timestamp: new Date().toISOString()
      })
      .eq('id', roomId)

    if (error) throw error
  }

  const handleReset = () => {
    setDescription(analysisData.description)
    setCleanlinessScore(analysisData.cleanliness_score)
    setError(null)
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg border ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">AI Analysis Review</h3>
            <p className="text-sm text-gray-600 mt-1">
              Review and edit the AI analysis before saving
              {hasChanges && <span className="text-amber-600 font-medium"> • Modified</span>}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {analysisData.metadata && (
              <div className="text-xs text-gray-500 text-right">
                <div>{analysisData.metadata.model_used}</div>
                <div>{analysisData.metadata.tokens_used} tokens</div>
              </div>
            )}
            <div className="w-2 h-2 rounded-full bg-green-400" title="AI Analysis Complete"></div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Cleanliness Score Section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Cleanliness Score
          </label>
          
          {/* Score Display */}
          <div className={`inline-flex items-center px-4 py-2 rounded-lg border-2 ${getScoreColor(cleanlinessScore)} mb-4`}>
            <div className="text-2xl font-bold mr-3">{cleanlinessScore}</div>
            <div>
              <div className="text-sm font-medium">out of 10</div>
              <div className="text-xs">{getScoreDescription(cleanlinessScore)}</div>
            </div>
          </div>

          {/* Score Input Methods */}
          <div className="space-y-4">
            {/* Slider */}
            <div>
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Very Dirty</span>
                <span>Average</span>
                <span>Perfectly Clean</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={cleanlinessScore}
                onChange={(e) => setCleanlinessScore(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, #ef4444 0%, #f59e0b 40%, #eab308 60%, #22c55e 80%, #16a34a 100%)`
                }}
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                  <span key={num} className={cleanlinessScore === num ? 'font-bold text-gray-900' : ''}>
                    {num}
                  </span>
                ))}
              </div>
            </div>

            {/* Numeric Input */}
            <div className="flex items-center space-x-3">
              <label className="text-sm text-gray-600">Direct input:</label>
              <input
                type="number"
                min="1"
                max="10"
                value={cleanlinessScore}
                onChange={(e) => setCleanlinessScore(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                className="w-20 px-3 py-1 border border-gray-300 rounded-md text-center focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <span className="text-sm text-gray-500">/ 10</span>
            </div>
          </div>
        </div>

        {/* Description Section */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Analysis Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={6}
            placeholder="Detailed description of the room condition, visible damage, and observations..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-vertical"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{description.length} characters</span>
            {description !== analysisData.description && (
              <span className="text-amber-600 font-medium">Modified from AI original</span>
            )}
          </div>
        </div>

        {/* Metadata Display */}
        {analysisData.metadata && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Analysis Details</h4>
            <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
              <div>
                <span className="font-medium">Room:</span>
                <span className="ml-2">{analysisData.metadata.room_name}</span>
              </div>
              <div>
                <span className="font-medium">Inspection:</span>
                <span className="ml-2 capitalize">{analysisData.metadata.inspection_type}</span>
              </div>
              <div>
                <span className="font-medium">Model:</span>
                <span className="ml-2">{analysisData.metadata.model_used}</span>
              </div>
              <div>
                <span className="font-medium">Generated:</span>
                <span className="ml-2">{new Date(analysisData.metadata.analyzed_at).toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <svg className="h-5 w-5 text-red-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Save Error</h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Success Display */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex">
              <svg className="h-5 w-5 text-green-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">Analysis Saved</h3>
                <p className="mt-1 text-sm text-green-700">The analysis has been saved successfully.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="px-6 py-4 bg-gray-50 border-t flex justify-between">
        <div className="flex space-x-3">
          {hasChanges && (
            <button
              onClick={handleReset}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              Reset Changes
            </button>
          )}
          {onCancel && (
            <button
              onClick={onCancel}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
          )}
        </div>

        <div className="flex space-x-3">
          <button
            onClick={handleApprove}
            disabled={saving || (!description.trim())}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {hasChanges ? 'Save Changes' : 'Approve & Save'}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Custom CSS for slider */}
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #4f46e5;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #4f46e5;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
      `}</style>
    </div>
  )
}