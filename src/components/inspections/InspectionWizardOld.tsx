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
  inspectionType: string
  redirectOnComplete?: boolean
}

export default function InspectionWizard({ 
  inspectionId, 
  inspectionType,
  redirectOnComplete = true
}: InspectionWizardProps) {
  const [rooms, setRooms] = useState<Room[]>([])
  const [currentRoomIndex, setCurrentRoomIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoUrl, setPhotoUrl] = useState<string>('')
  const [comments, setComments] = useState('')
  const [analysis, setAnalysis] = useState('')
  const [rawAnalysisData, setRawAnalysisData] = useState<{
    description: string
    cleanliness_score: number
  } | null>(null)
  const [showAnalysisReview, setShowAnalysisReview] = useState(false)
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null)
  
  const router = useRouter()
  const supabase = createClientSupabase()

  useEffect(() => {
    loadRooms()
  }, [inspectionId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // Load current room data when switching rooms
    if (rooms.length > 0 && currentRoomIndex < rooms.length) {
      const currentRoom = rooms[currentRoomIndex]
          setPhotoUrl(currentRoom.photo_url || '')
    setComments(currentRoom.comments || '')
    setAnalysis(currentRoom.ai_analysis || '')
    setRawAnalysisData(null)
    setShowAnalysisReview(false)
    setPhoto(null)
    }
  }, [currentRoomIndex, rooms])

  const loadRooms = async () => {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('inspection_id', inspectionId)
        .eq('is_selected', true)
        .order('room_name')

      if (error) throw error

      setRooms(data || [])
      
      // If there are rooms, load the first one's data
      if (data && data.length > 0) {
        const firstRoom = data[0]
        setPhotoUrl(firstRoom.photo_url || '')
        setComments(firstRoom.comments || '')
        setAnalysis(firstRoom.ai_analysis || '')
      }
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



  const uploadPhoto = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${inspectionId}/${rooms[currentRoomIndex].id}-${Date.now()}.${fileExt}`
    
    const { error } = await supabase.storage
      .from('room-photos')
      .upload(fileName, file)

    if (error) throw error

    const { data: { publicUrl } } = supabase.storage
      .from('room-photos')
      .getPublicUrl(fileName)

    return publicUrl
  }

  const analyzePhoto = async (imageUrl: string) => {
    setAnalyzing(true)
    try {
      const response = await fetch('/api/analyze-inspection-photo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          photoUrl: imageUrl,
          roomName: rooms[currentRoomIndex].room_name,
          inspectionType: inspectionType as 'entry' | 'exit' | 'routine'
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to analyze photo')
      }

      const result = await response.json()
      
      // Store the raw data for the review component
      setRawAnalysisData(result)
      setShowAnalysisReview(true)
      
      // Also set the formatted text for backward compatibility
      const analysisText = `**Condition Analysis:**
${result.description}

**Cleanliness Score:** ${result.cleanliness_score}/10`
      
      setAnalysis(analysisText)
      
      return analysisText
    } catch (error) {
      console.error('Error analyzing photo:', error)
      throw error
    } finally {
      setAnalyzing(false)
    }
  }

  const saveRoomData = async (markComplete: boolean = false) => {
    const currentRoom = rooms[currentRoomIndex]
    let finalPhotoUrl = photoUrl

    try {
      // Upload photo if a new one was selected
      if (photo) {
        setUploading(true)
        finalPhotoUrl = await uploadPhoto(photo)
        setPhotoUrl(finalPhotoUrl)
      }

      // Analyze photo if we have one and no analysis yet
      let finalAnalysis = analysis
      if (finalPhotoUrl && !finalAnalysis) {
        finalAnalysis = await analyzePhoto(finalPhotoUrl)
      }

      // Update room in database
      const updateData = {
        photo_url: finalPhotoUrl || null,
        comments: comments || null,
        ai_analysis: finalAnalysis || null,
        analysis_timestamp: finalAnalysis ? new Date().toISOString() : null,
        is_completed: markComplete,
        completion_timestamp: markComplete ? new Date().toISOString() : null,
      }

      const { error } = await supabase
        .from('rooms')
        .update(updateData)
        .eq('id', currentRoom.id)

      if (error) throw error

      // Update local state
      setRooms(prev => prev.map(room => 
        room.id === currentRoom.id 
          ? { ...room, ...updateData }
          : room
      ))

      setMessage({
        type: 'success',
        text: markComplete ? 'Room inspection completed!' : 'Room data saved!'
      })

      setTimeout(() => setMessage(null), 3000)

    } catch (error) {
      console.error('Error saving room data:', error)
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to save room data'
      })
    } finally {
      setUploading(false)
    }
  }

  const handleNext = async () => {
    await saveRoomData(true)
    
    if (currentRoomIndex < rooms.length - 1) {
      setCurrentRoomIndex(prev => prev + 1)
    } else {
      // Last room completed - handle completion
      handleInspectionComplete()
    }
  }

  const handlePrevious = async () => {
    await saveRoomData(false)
    
    if (currentRoomIndex > 0) {
      setCurrentRoomIndex(prev => prev - 1)
    }
  }

  const goToRoom = async (index: number) => {
    await saveRoomData(false)
    setCurrentRoomIndex(index)
  }

  const handleInspectionComplete = () => {
    if (redirectOnComplete) {
      // Show success message first
      setMessage({
        type: 'success',
        text: 'Inspection completed! Redirecting to details...'
      })
      
      // Redirect after a short delay
      setTimeout(() => {
        router.push(`/inspections/${inspectionId}?completed=true`)
      }, 2000)
    } else {
      // Just show success message without redirect
      setMessage({
        type: 'success',
        text: 'Inspection completed successfully!'
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-3 text-gray-600">Loading inspection wizard...</span>
      </div>
    )
  }

  if (rooms.length === 0) {
    return (
      <div className="text-center p-8">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        <h3 className="mt-4 text-lg font-medium text-gray-900">No rooms selected</h3>
        <p className="mt-2 text-gray-500">Please select rooms before starting the inspection.</p>
      </div>
    )
  }

  const currentRoom = rooms[currentRoomIndex]
  const progress = ((currentRoomIndex + 1) / rooms.length) * 100

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-semibold text-gray-900">
            Room {currentRoomIndex + 1} of {rooms.length}: {currentRoom.room_name}
          </h2>
          <span className="text-sm text-gray-500">
            {Math.round(progress)}% Complete
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {/* Room Navigation */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          {rooms.map((room, index) => (
            <button
              key={room.id}
              onClick={() => goToRoom(index)}
              className={`px-3 py-1 text-sm rounded-full border ${
                index === currentRoomIndex
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : room.is_completed
                  ? 'bg-green-100 text-green-800 border-green-300'
                  : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
              }`}
            >
              {room.room_name}
              {room.is_completed && (
                <svg className="inline-block ml-1 h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Message Display */}
      {message && (
        <div
          className={`mb-6 p-4 rounded-md ${
            message.type === 'error'
              ? 'bg-red-50 text-red-700 border border-red-200'
              : 'bg-green-50 text-green-700 border border-green-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Photo Management Section */}
        <div>
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
              // Auto-trigger AI analysis after photo upload
              setTimeout(() => {
                analyzePhoto(photo.public_url)
              }, 1000)
            }}
          />
        </div>

        {/* Comments and Analysis Section */}
        <div className="space-y-6">
          {/* Comments */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Comments</h3>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={4}
              placeholder="Add any observations, notes, or comments about this room..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* AI Analysis */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">AI Analysis</h3>
              {photoUrl && !showAnalysisReview && !analyzing && (
                <button
                  onClick={() => analyzePhoto(photoUrl)}
                  className="px-3 py-1 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Analyze Photo
                </button>
              )}
            </div>
            
            {analyzing ? (
              <div className="flex items-center text-gray-500">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600 mr-2"></div>
                AI is analyzing the photo...
              </div>
            ) : showAnalysisReview && rawAnalysisData ? (
              <QuickAnalysisReview
                initialData={{
                  description: rawAnalysisData.description,
                  cleanliness_score: rawAnalysisData.cleanliness_score
                }}
                onApprove={(approvedData) => {
                  const finalAnalysis = `**Condition Analysis:**
${approvedData.description}

**Cleanliness Score:** ${approvedData.cleanliness_score}/10`
                  setAnalysis(finalAnalysis)
                  setShowAnalysisReview(false)
                  setMessage({
                    type: 'success',
                    text: 'Analysis approved and saved!'
                  })
                  setTimeout(() => setMessage(null), 3000)
                }}
                onCancel={() => {
                  setShowAnalysisReview(false)
                  setRawAnalysisData(null)
                }}
              />
            ) : analysis ? (
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap text-gray-700">{analysis}</div>
                <button
                  onClick={() => analyzePhoto(photoUrl)}
                  disabled={!photoUrl}
                  className="mt-3 px-3 py-1 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
                >
                  Re-analyze Photo
                </button>
              </div>
            ) : (
              <p className="text-gray-500 italic">
                {photoUrl ? 'Click "Analyze Photo" to get AI insights' : 'Upload a photo to get AI analysis'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="mt-8 flex justify-between">
        <button
          onClick={handlePrevious}
          disabled={currentRoomIndex === 0}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Previous Room
        </button>

        <button
          onClick={() => saveRoomData(false)}
          disabled={uploading || analyzing}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
        >
          Save Progress
        </button>

        <button
          onClick={handleNext}
          disabled={uploading || analyzing}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
        >
          {currentRoomIndex === rooms.length - 1 ? 'Complete Inspection' : 'Next Room'}
          <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  )
}