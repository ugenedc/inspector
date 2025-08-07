'use client'

import { useState } from 'react'
import Image from 'next/image'
import { usePhotoAnalysis } from '@/hooks/usePhotoAnalysis'

export default function PhotoAnalysisDemo() {
  const [photoUrl, setPhotoUrl] = useState('')
  const [inspectionType, setInspectionType] = useState<'entry' | 'exit' | 'routine'>('entry')
  const [roomName, setRoomName] = useState('')
  
  const { analyzePhoto, loading, error, lastAnalysis } = usePhotoAnalysis()

  const handleAnalyze = async () => {
    if (!photoUrl.trim() || !roomName.trim()) {
      alert('Please enter both photo URL and room name')
      return
    }

    try {
      await analyzePhoto({
        photoUrl: photoUrl.trim(),
        inspectionType,
        roomName: roomName.trim()
      })
    } catch (err) {
      // Error is already handled by the hook
      console.error('Analysis failed:', err)
    }
  }

  const exampleUrls = [
    {
      name: 'Clean Kitchen',
      url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800',
      room: 'Kitchen'
    },
    {
      name: 'Bathroom',
      url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800',
      room: 'Bathroom'
    },
    {
      name: 'Living Room',
      url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800',
      room: 'Living Room'
    }
  ]

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Photo Analysis Demo
        </h1>
        <p className="text-gray-600">
          Test the OpenAI Vision API for property inspection photo analysis
        </p>
      </div>

      {/* Input Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Analyze Photo</h2>
        
        <div className="space-y-4">
          {/* Photo URL Input */}
          <div>
            <label htmlFor="photoUrl" className="block text-sm font-medium text-gray-700 mb-1">
              Photo URL
            </label>
            <input
              id="photoUrl"
              type="url"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              placeholder="https://example.com/photo.jpg"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Example URLs */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Or try an example:
            </label>
            <div className="flex flex-wrap gap-2">
              {exampleUrls.map((example, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setPhotoUrl(example.url)
                    setRoomName(example.room)
                  }}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                >
                  {example.name}
                </button>
              ))}
            </div>
          </div>

          {/* Room Name Input */}
          <div>
            <label htmlFor="roomName" className="block text-sm font-medium text-gray-700 mb-1">
              Room Name
            </label>
            <input
              id="roomName"
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="Kitchen, Bathroom, Living Room, etc."
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Inspection Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Inspection Type
            </label>
            <div className="flex space-x-4">
              {(['entry', 'exit', 'routine'] as const).map((type) => (
                <label key={type} className="flex items-center">
                  <input
                    type="radio"
                    name="inspectionType"
                    value={type}
                    checked={inspectionType === type}
                    onChange={(e) => setInspectionType(e.target.value as typeof type)}
                    className="mr-2 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700 capitalize">{type}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Analyze Button */}
          <button
            onClick={handleAnalyze}
            disabled={loading || !photoUrl.trim() || !roomName.trim()}
            className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Analyzing with OpenAI Vision...
              </>
            ) : (
              'Analyze Photo'
            )}
          </button>
        </div>
      </div>

      {/* Photo Preview */}
      {photoUrl && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Photo Preview</h3>
          <div className="max-w-md mx-auto">
            <div className="relative aspect-square">
              <Image
                src={photoUrl}
                alt="Photo to analyze"
                fill
                className="object-cover rounded-lg shadow-sm"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Analysis Error</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Results Display */}
      {lastAnalysis && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Analysis Results</h3>
          
          <div className="space-y-4">
            {/* Cleanliness Score */}
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl ${
                  lastAnalysis.cleanliness_score >= 8 ? 'bg-green-500' :
                  lastAnalysis.cleanliness_score >= 6 ? 'bg-yellow-500' :
                  lastAnalysis.cleanliness_score >= 4 ? 'bg-orange-500' : 'bg-red-500'
                }`}>
                  {lastAnalysis.cleanliness_score}
                </div>
              </div>
              <div>
                <h4 className="text-lg font-medium text-gray-900">Cleanliness Score</h4>
                <p className="text-sm text-gray-600">
                  {lastAnalysis.cleanliness_score}/10 - {
                    lastAnalysis.cleanliness_score >= 8 ? 'Excellent condition' :
                    lastAnalysis.cleanliness_score >= 6 ? 'Good condition' :
                    lastAnalysis.cleanliness_score >= 4 ? 'Fair condition' : 'Poor condition'
                  }
                </p>
              </div>
            </div>

            {/* Description */}
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">Detailed Analysis</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700 whitespace-pre-wrap">{lastAnalysis.description}</p>
              </div>
            </div>

            {/* Metadata */}
            {lastAnalysis.metadata && (
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Analysis Metadata</h4>
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">Inspection Type:</span>
                    <span className="ml-2 capitalize">{lastAnalysis.metadata.inspection_type}</span>
                  </div>
                  <div>
                    <span className="font-medium">Room:</span>
                    <span className="ml-2">{lastAnalysis.metadata.room_name}</span>
                  </div>
                  <div>
                    <span className="font-medium">Model:</span>
                    <span className="ml-2">{lastAnalysis.metadata.model_used}</span>
                  </div>
                  <div>
                    <span className="font-medium">Tokens Used:</span>
                    <span className="ml-2">{lastAnalysis.metadata.tokens_used}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="font-medium">Analyzed At:</span>
                    <span className="ml-2">{new Date(lastAnalysis.metadata.analyzed_at).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* API Documentation */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">API Usage</h3>
        <div className="space-y-3 text-sm">
          <div>
            <span className="font-medium text-gray-700">Endpoint:</span>
            <code className="ml-2 px-2 py-1 bg-gray-200 rounded">POST /api/analyze-inspection-photo</code>
          </div>
          <div>
            <span className="font-medium text-gray-700">Required Fields:</span>
            <ul className="ml-6 mt-1 list-disc text-gray-600">
              <li><code>photoUrl</code> - URL of the photo to analyze</li>
              <li><code>inspectionType</code> - entry, exit, or routine</li>
              <li><code>roomName</code> - name of the room being inspected</li>
            </ul>
          </div>
          <div>
            <span className="font-medium text-gray-700">Response:</span>
            <ul className="ml-6 mt-1 list-disc text-gray-600">
              <li><code>description</code> - detailed analysis of room condition</li>
              <li><code>cleanliness_score</code> - score from 1 (very dirty) to 10 (perfectly clean)</li>
              <li><code>metadata</code> - additional analysis information</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}