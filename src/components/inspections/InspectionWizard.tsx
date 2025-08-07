'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientSupabase } from '@/lib/supabase'
import PhotoManager from '@/components/photos/PhotoManager'
import QuickAnalysisReview from '@/components/analysis/QuickAnalysisReview'

interface Room {
  id: string
  room_name: string
  room_type: 'standard' | 'custom'
  is_completed: boolean
  photo_url?: string | null
  comments?: string | null
  ai_analysis?: string | null
  analysis_timestamp?: string | null
  completion_timestamp?: string | null
}

interface InspectionWizardProps {
  inspectionId: string
  inspectionType: 'entry' | 'exit' | 'routine'
  redirectOnComplete?: boolean
}

interface Message {
  type: 'success' | 'error'
  text: string
}

interface AIAnalysisData {
  description: string
  cleanliness_score: number
}

export default function InspectionWizard({
  inspectionId,
  inspectionType,
  redirectOnComplete = false
}: InspectionWizardProps) {
  const [rooms, setRooms] = useState<Room[]>([])
  const [currentRoomIndex, setCurrentRoomIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<Message | null>(null)
  const [comments, setComments] = useState('')
  const [analysis, setAnalysis] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [showAnalysisReview, setShowAnalysisReview] = useState(false)
  const [rawAnalysisData, setRawAnalysisData] = useState<AIAnalysisData | null>(null)
  const [photoUrl, setPhotoUrl] = useState('')
  
  const router = useRouter()
  const supabase = createClientSupabase()

  useEffect(() => {
    loadRooms()
  }, [inspectionId])

  const loadRooms = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('inspection_id', inspectionId)
        .eq('is_selected', true)
        .order('created_at')

      if (error) throw error
      setRooms(data || [])
    } catch (error) {
      console.error('Error loading rooms:', error)
      setMessage({
        type: 'error',
        text: 'Failed to load rooms. Please try again.'
      })
    } finally {
      setLoading(false)
    }
  }

  const analyzePhoto = async (imageUrl: string) => {
    if (!imageUrl) return

    try {
      setAnalyzing(true)
      setMessage(null)

      const response = await fetch('/api/analyze-inspection-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photoUrl: imageUrl,
          inspectionType,
          roomName: currentRoom.room_name
        })
      })

      if (!response.ok) throw new Error('Analysis failed')

      const data = await response.json()
      setRawAnalysisData(data)
      setShowAnalysisReview(true)

    } catch (error) {
      console.error('Error analyzing photo:', error)
      setMessage({
        type: 'error',
        text: 'Failed to analyze photo. Please try again.'
      })
    } finally {
      setAnalyzing(false)
    }
  }

  const saveProgress = async () => {
    try {
      const { error } = await supabase
        .from('rooms')
        .update({
          comments: comments || null,
          ai_analysis: analysis || null,
          photo_url: photoUrl || null,
          is_completed: !!(photoUrl && analysis),
          completion_timestamp: !!(photoUrl && analysis) ? new Date().toISOString() : null
        })
        .eq('id', currentRoom.id)

      if (error) throw error
      
      // Update local state
      setRooms(prev => prev.map(room => 
        room.id === currentRoom.id 
          ? { ...room, comments, ai_analysis: analysis, photo_url: photoUrl, is_completed: !!(photoUrl && analysis) }
          : room
      ))
    } catch (error) {
      console.error('Error saving progress:', error)
      throw error
    }
  }

  const handleNext = async () => {
    try {
      await saveProgress()
      
      if (currentRoomIndex < rooms.length - 1) {
        const nextIndex = currentRoomIndex + 1
        setCurrentRoomIndex(nextIndex)
        // Load data for next room
        const nextRoom = rooms[nextIndex]
        setComments(nextRoom.comments || '')
        setAnalysis(nextRoom.ai_analysis || '')
        setPhotoUrl(nextRoom.photo_url || '')
        setShowAnalysisReview(false)
        setRawAnalysisData(null)
      } else {
        // All rooms completed
        handleInspectionComplete()
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Failed to save progress. Please try again.'
      })
    }
  }

  const handlePrevious = () => {
    if (currentRoomIndex > 0) {
      const prevIndex = currentRoomIndex - 1
      setCurrentRoomIndex(prevIndex)
      // Load data for previous room
      const prevRoom = rooms[prevIndex]
      setComments(prevRoom.comments || '')
      setAnalysis(prevRoom.ai_analysis || '')
      setPhotoUrl(prevRoom.photo_url || '')
      setShowAnalysisReview(false)
      setRawAnalysisData(null)
    }
  }

  const handleInspectionComplete = () => {
    if (redirectOnComplete) {
      router.push(`/inspections/${inspectionId}`)
    } else {
      setMessage({
        type: 'success',
        text: 'Inspection completed successfully!'
      })
    }
  }

  const goToRoom = (index: number) => {
    setCurrentRoomIndex(index)
    const room = rooms[index]
    setComments(room.comments || '')
    setAnalysis(room.ai_analysis || '')
    setPhotoUrl(room.photo_url || '')
    setShowAnalysisReview(false)
    setRawAnalysisData(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading inspection...</p>
        </div>
      </div>
    )
  }

  if (rooms.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <div className="text-center bg-white rounded-3xl p-8 shadow-xl max-w-md w-full">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Rooms Selected</h3>
          <p className="text-gray-600">Please select rooms before starting the inspection.</p>
        </div>
      </div>
    )
  }

  const currentRoom = rooms[currentRoomIndex]
  const completedRooms = rooms.filter(r => r.is_completed)
  const progress = ((currentRoomIndex + 1) / rooms.length) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Beautiful Mobile Header */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-gray-100 shadow-sm">
        <div className="px-4 py-6">
          {/* Progress Ring & Title */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="relative w-16 h-16">
                <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    d="m18,2.0845 a 15.9155,15.9155 0 0,1 0,31.831 a 15.9155,15.9155 0 0,1 0,-31.831"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="3"
                  />
                  <path
                    d="m18,2.0845 a 15.9155,15.9155 0 0,1 0,31.831 a 15.9155,15.9155 0 0,1 0,-31.831"
                    fill="none"
                    stroke="url(#gradient)"
                    strokeWidth="3"
                    strokeDasharray={`${(completedRooms.length / rooms.length) * 100}, 100`}
                    className="transition-all duration-700 ease-out"
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#1d4ed8" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold text-blue-600">
                    {completedRooms.length}/{rooms.length}
                  </span>
                </div>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{currentRoom.room_name}</h1>
                <p className="text-sm text-gray-500 capitalize flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                  {inspectionType} Inspection
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {Math.round((completedRooms.length / rooms.length) * 100)}%
              </div>
              <div className="text-xs text-gray-500 font-medium">Complete</div>
            </div>
          </div>

          {/* Room Navigation - Horizontal Scroll */}
          <div className="overflow-x-auto pb-2 -mx-1">
            <div className="flex space-x-3 px-1">
              {rooms.map((room, index) => (
                <button
                  key={room.id}
                  onClick={() => goToRoom(index)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 transform ${
                    index === currentRoomIndex
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg scale-105 shadow-blue-200'
                      : room.is_completed
                      ? 'bg-green-100 text-green-700 border-2 border-green-200 hover:scale-105'
                      : 'bg-white text-gray-600 border-2 border-gray-200 hover:border-gray-300 hover:scale-105'
                  }`}
                >
                  {room.is_completed && '✨ '}{room.room_name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Message Display */}
      {message && (
        <div className="px-4 pt-4">
          <div className={`p-4 rounded-2xl shadow-sm border-l-4 ${
            message.type === 'error' 
              ? 'bg-red-50 text-red-700 border-red-400' 
              : 'bg-green-50 text-green-700 border-green-400'
          }`}>
            <div className="flex items-center">
              {message.type === 'error' ? (
                <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
              ) : (
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
              <span className="font-medium">{message.text}</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Content - Mobile First */}
      <div className="px-4 py-6 space-y-6">
        {/* Photo Section */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              Room Photos
            </h2>
          </div>
          <div className="p-6">
            <PhotoManager
              inspectionId={inspectionId}
              roomId={currentRoom.id}
              roomName={currentRoom.room_name}
              maxFiles={5}
              allowCamera={true}
              allowFiles={true}
              showMetadata={false}
              onPhotoUploaded={(photo) => {
                setPhotoUrl(photo.public_url)
                setTimeout(() => {
                  analyzePhoto(photo.public_url)
                }, 1000)
              }}
            />
          </div>
        </div>

        {/* Comments Section */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-amber-50 to-orange-50">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              Comments & Notes
            </h2>
          </div>
          <div className="p-6">
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={4}
              placeholder="Add observations, damage notes, or any other comments about this room..."
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-700 placeholder-gray-400"
            />
          </div>
        </div>

        {/* AI Analysis Section */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-pink-50">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <div className="w-8 h-8 bg-purple-100 rounded-xl flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                AI Analysis
              </h2>
              {photoUrl && !showAnalysisReview && !analyzing && (
                <button
                  onClick={() => analyzePhoto(photoUrl)}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl text-sm font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                >
                  ✨ Analyze
                </button>
              )}
            </div>
          </div>
          <div className="p-6">
            {analyzing ? (
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center space-x-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-purple-200 border-t-purple-600"></div>
                  <span className="text-purple-600 font-medium">AI is analyzing the photo...</span>
                </div>
              </div>
            ) : showAnalysisReview && rawAnalysisData ? (
              <QuickAnalysisReview
                initialData={{
                  description: rawAnalysisData.description,
                  cleanliness_score: rawAnalysisData.cleanliness_score
                }}
                onApprove={(approvedData) => {
                  const finalAnalysis = `**Condition Analysis:**\n${approvedData.description}\n\n**Cleanliness Score:** ${approvedData.cleanliness_score}/10`
                  setAnalysis(finalAnalysis)
                  setShowAnalysisReview(false)
                  setMessage({
                    type: 'success',
                    text: '✨ Analysis approved and saved!'
                  })
                  setTimeout(() => setMessage(null), 3000)
                }}
                onCancel={() => {
                  setShowAnalysisReview(false)
                  setRawAnalysisData(null)
                }}
              />
            ) : analysis ? (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-2xl p-4">
                  <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">{analysis}</div>
                </div>
                <button
                  onClick={() => analyzePhoto(photoUrl)}
                  disabled={!photoUrl}
                  className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  🔄 Re-analyze Photo
                </button>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-gray-500 font-medium">
                  {photoUrl ? 'Tap "Analyze" to get AI insights' : '📸 Upload a photo to get AI analysis'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fixed Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-gray-200 px-4 py-4 safe-area-pb">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <button
            onClick={handlePrevious}
            disabled={currentRoomIndex === 0}
            className="flex items-center px-6 py-3 rounded-2xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-gray-100 text-gray-600 hover:bg-gray-200 hover:scale-105"
          >
            <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Previous
          </button>

          <div className="text-center">
            <div className="text-sm text-gray-500 font-medium">
              {currentRoomIndex + 1} of {rooms.length}
            </div>
          </div>

          <button
            onClick={handleNext}
            className="flex items-center px-6 py-3 rounded-2xl font-medium transition-all duration-200 bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg hover:shadow-xl hover:scale-105"
          >
            {currentRoomIndex === rooms.length - 1 ? (
              <>
                Complete
                <svg className="ml-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </>
            ) : (
              <>
                Next Room
                <svg className="ml-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Bottom padding to account for fixed navigation */}
      <div className="h-24"></div>
    </div>
  )
}