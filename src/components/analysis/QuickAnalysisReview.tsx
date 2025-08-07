'use client'

import { useState } from 'react'

interface QuickAnalysisData {
  description: string
  cleanliness_score: number
}

interface QuickAnalysisReviewProps {
  initialData: QuickAnalysisData
  onApprove: (data: QuickAnalysisData) => void
  onCancel?: () => void
  loading?: boolean
  className?: string
}

export default function QuickAnalysisReview({
  initialData,
  onApprove,
  onCancel,
  loading = false,
  className = ''
}: QuickAnalysisReviewProps) {
  const [description, setDescription] = useState(initialData.description)
  const [cleanlinessScore, setCleanlinessScore] = useState(initialData.cleanliness_score)

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'bg-green-500'
    if (score >= 6) return 'bg-yellow-500'
    if (score >= 4) return 'bg-orange-500'
    return 'bg-red-500'
  }

  const getScoreLabel = (score: number) => {
    if (score >= 8) return 'Excellent'
    if (score >= 6) return 'Good'
    if (score >= 4) return 'Fair'
    return 'Poor'
  }

  const handleApprove = () => {
    onApprove({
      description: description.trim(),
      cleanliness_score: cleanlinessScore
    })
  }

  const hasChanges = 
    description !== initialData.description || 
    cleanlinessScore !== initialData.cleanliness_score

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b bg-blue-50">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-gray-900">AI Analysis</h4>
          <div className="flex items-center space-x-2">
            <div className={`w-8 h-8 rounded-full ${getScoreColor(cleanlinessScore)} flex items-center justify-center text-white text-sm font-bold`}>
              {cleanlinessScore}
            </div>
            <span className="text-sm text-gray-600">{getScoreLabel(cleanlinessScore)}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Score Slider */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cleanliness Score: {cleanlinessScore}/10
          </label>
          <input
            type="range"
            min="1"
            max="10"
            value={cleanlinessScore}
            onChange={(e) => setCleanlinessScore(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Poor</span>
            <span>Fair</span>
            <span>Good</span>
            <span>Excellent</span>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Analysis Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Describe the room condition, any issues, and observations..."
          />
        </div>

        {/* Change Indicator */}
        {hasChanges && (
          <div className="text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-md">
            ✏️ Analysis has been modified from AI original
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-4 py-3 bg-gray-50 border-t flex justify-end space-x-3">
        {onCancel && (
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
        )}
        <button
          onClick={handleApprove}
          disabled={loading || !description.trim()}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Saving...
            </>
          ) : (
            'Approve & Save'
          )}
        </button>
      </div>
    </div>
  )
}