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
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Review Analysis</h3>
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-lg ${getScoreColor(cleanlinessScore)} flex items-center justify-center text-white font-semibold`}>
              {cleanlinessScore}
            </div>
            <span className="text-gray-600">{getScoreLabel(cleanlinessScore)}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-8">
        {/* Score Slider */}
        <div>
          <label className="block font-medium text-gray-900 mb-4">
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
          <div className="flex justify-between text-sm text-gray-500 mt-2">
            <span>Poor</span>
            <span>Fair</span>
            <span>Good</span>
            <span>Excellent</span>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block font-medium text-gray-900 mb-4">
            Analysis Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            className="w-full p-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-transparent resize-none text-gray-900 placeholder-gray-400"
            placeholder="Describe the room condition, any issues, and observations..."
          />
        </div>

        {/* Change Indicator */}
        {hasChanges && (
          <div className="p-4 bg-amber-50 text-amber-800 rounded-lg">
            Analysis has been modified from AI original
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-6 border-t border-gray-100 flex justify-end space-x-3">
        {onCancel && (
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-6 py-3 text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        )}
        <button
          onClick={handleApprove}
          disabled={loading || !description.trim()}
          className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          {loading ? (
            <div className="flex items-center">
              <div className="w-4 h-4 border-2 border-gray-300 border-t-white rounded-full animate-spin mr-2"></div>
              Saving...
            </div>
          ) : (
            'Approve & Save'
          )}
        </button>
      </div>
    </div>
  )
}