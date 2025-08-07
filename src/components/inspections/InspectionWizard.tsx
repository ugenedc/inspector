'use client'

import { useState, useEffect, useCallback } from 'react'
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
  inspectionType
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
  const [showNavigation, setShowNavigation] = useState(false)
  
  const router = useRouter()
  const supabase = createClientSupabase()

  const loadRooms = useCallback(async () => {
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
  }, [inspectionId, supabase])

  useEffect(() => {
    loadRooms()
  }, [loadRooms])

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
        const nextRoom = rooms[nextIndex]
        setComments(nextRoom.comments || '')
        setAnalysis(nextRoom.ai_analysis || '')
        setPhotoUrl(nextRoom.photo_url || '')
        setShowAnalysisReview(false)
        setRawAnalysisData(null)
      } else {
        handleInspectionComplete()
      }
    } catch {
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
      const prevRoom = rooms[prevIndex]
      setComments(prevRoom.comments || '')
      setAnalysis(prevRoom.ai_analysis || '')
      setPhotoUrl(prevRoom.photo_url || '')
      setShowAnalysisReview(false)
      setRawAnalysisData(null)
    }
  }

  const handleInspectionComplete = async () => {
    try {
      // Update inspection status to completed
      const { error } = await supabase
        .from('inspections')
        .update({ 
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', inspectionId)

      if (error) {
        console.error('Error updating inspection status:', error)
        setMessage({
          type: 'error',
          text: 'Failed to complete inspection. Please try again.'
        })
        return
      }

      // Redirect to the beautiful report page
      router.push(`/inspections/${inspectionId}/report`)
    } catch (error) {
      console.error('Error completing inspection:', error)
      setMessage({
        type: 'error',
        text: 'Failed to complete inspection. Please try again.'
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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-800 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading inspection...</p>
        </div>
      </div>
    )
  }

  if (rooms.length === 0) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-6">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No rooms selected</h3>
          <p className="text-gray-500">Please select rooms before starting the inspection.</p>
        </div>
      </div>
    )
  }

  const currentRoom = rooms[currentRoomIndex]

  return (
    <div className="min-h-screen bg-white">
      {/* Clean Focused Header */}
      <div className="border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-8">
          {/* Step Indicator */}
          <div className="flex items-center space-x-2 text-sm text-gray-500 mb-6">
            <span>Step 3 of 3</span>
            <span>•</span>
            <span>Room Inspection</span>
          </div>
          
          {/* Focused Room Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">{currentRoom.room_name}</h1>
              <p className="text-gray-600 mt-1 md:mt-2 capitalize text-sm md:text-base">{inspectionType} inspection</p>
            </div>
            
            {/* Compact Progress with Navigation Trigger */}
            <div className="text-right">
              <button
                onClick={() => setShowNavigation(!showNavigation)}
                className="group flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {currentRoomIndex + 1} of {rooms.length}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {rooms.filter(r => r.is_completed).length} completed
                  </div>
                </div>
                <div className="w-12 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gray-900 transition-all duration-500 ease-out"
                    style={{ width: `${((currentRoomIndex + 1) / rooms.length) * 100}%` }}
                  />
                </div>
                <svg className={`w-4 h-4 text-gray-400 transition-transform ${showNavigation ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Collapsible Room Navigation */}
          {showNavigation && (
            <div className="mb-8 p-6 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-900">All Rooms</h3>
                <button
                  onClick={() => setShowNavigation(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {rooms.map((room, index) => (
                  <button
                    key={room.id}
                    onClick={() => {
                      goToRoom(index)
                      setShowNavigation(false)
                    }}
                    className={`text-left p-4 rounded-lg transition-colors ${
                      index === currentRoomIndex
                        ? 'bg-white border-2 border-gray-900 shadow-sm'
                        : 'bg-white border border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-2 h-2 rounded-full ${
                          index === currentRoomIndex ? 'bg-gray-900' :
                          room.is_completed ? 'bg-green-500' : 'bg-gray-300'
                        }`} />
                        <span className={`font-medium ${
                          index === currentRoomIndex ? 'text-gray-900' : 'text-gray-700'
                        }`}>
                          {room.room_name}
                        </span>
                      </div>
                      {room.is_completed && (
                        <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className="max-w-2xl mx-auto px-6 pt-6">
          <div className={`p-4 rounded-lg ${
            message.type === 'error' 
              ? 'bg-red-50 text-red-800' 
              : 'bg-green-50 text-green-800'
          }`}>
            {message.text}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-8 md:space-y-12">
        {/* Photos */}
        <section>
          <h2 className="text-lg font-medium text-gray-900 mb-6">Photos</h2>
          <PhotoManager
            inspectionId={inspectionId}
            roomId={currentRoom.id}
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
        </section>

        {/* Comments */}
        <section>
          <h2 className="text-lg font-medium text-gray-900 mb-6">Notes</h2>
          <textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            rows={4}
            placeholder="Add observations, damage notes, or other comments..."
            className="w-full p-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-transparent resize-none text-gray-900 placeholder-gray-400"
          />
        </section>

        {/* AI Analysis */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-medium text-gray-900">Analysis</h2>
            {photoUrl && !showAnalysisReview && !analyzing && (
              <button
                onClick={() => analyzePhoto(photoUrl)}
                className="text-sm text-gray-600 hover:text-gray-900 underline"
              >
                Analyze photo
              </button>
            )}
          </div>
          
          {analyzing ? (
            <div className="flex items-center p-8 text-gray-500">
              <div className="w-4 h-4 border-2 border-gray-200 border-t-gray-500 rounded-full animate-spin mr-3"></div>
              Analyzing photo...
            </div>
          ) : showAnalysisReview && rawAnalysisData ? (
            <QuickAnalysisReview
              initialData={{
                description: rawAnalysisData.description,
                cleanliness_score: rawAnalysisData.cleanliness_score
              }}
              onApprove={(approvedData) => {
                const finalAnalysis = `${approvedData.description}\n\nCleanliness: ${approvedData.cleanliness_score}/10`
                setAnalysis(finalAnalysis)
                setShowAnalysisReview(false)
                setMessage({
                  type: 'success',
                  text: 'Analysis saved'
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
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="whitespace-pre-wrap text-gray-700">{analysis}</div>
              </div>
              <button
                onClick={() => analyzePhoto(photoUrl)}
                disabled={!photoUrl}
                className="text-sm text-gray-600 hover:text-gray-900 underline disabled:opacity-50"
              >
                Re-analyze
              </button>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              {photoUrl ? 'Click "Analyze photo" to get insights' : 'Upload a photo to enable analysis'}
            </div>
          )}
        </section>
      </div>

      {/* Enhanced Bottom Navigation */}
      <div className="border-t border-gray-100 bg-white">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-4 md:py-6">
          <div className="flex items-center justify-between">
            {/* Previous Button */}
            <button
              onClick={handlePrevious}
              disabled={currentRoomIndex === 0}
              className="group flex items-center space-x-2 px-3 md:px-4 py-2 md:py-3 rounded-lg border border-gray-200 hover:border-gray-300 disabled:opacity-50 disabled:hover:border-gray-200 transition-colors"
            >
              <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-gray-600 group-hover:text-gray-900 text-sm md:text-base">
                {currentRoomIndex > 0 ? rooms[currentRoomIndex - 1]?.room_name : 'Previous'}
              </span>
            </button>

            {/* Room Counter */}
            <div className="text-center">
              <div className="text-sm font-medium text-gray-900">
                {currentRoomIndex + 1} of {rooms.length}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {rooms.filter(r => r.is_completed).length} completed
              </div>
            </div>
            
            {/* Next/Complete Button */}
            <button
              onClick={handleNext}
              className="group flex items-center space-x-2 px-4 md:px-6 py-2 md:py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <span className="text-sm md:text-base">
                {currentRoomIndex === rooms.length - 1 ? 'Complete Inspection' : 
                 rooms[currentRoomIndex + 1] ? rooms[currentRoomIndex + 1].room_name : 'Next Room'}
              </span>
              {currentRoomIndex < rooms.length - 1 ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}