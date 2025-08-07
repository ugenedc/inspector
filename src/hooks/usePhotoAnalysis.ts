import { useState } from 'react'

interface AnalysisRequest {
  photoUrl: string
  inspectionType: 'entry' | 'exit' | 'routine'
  roomName: string
}

interface AnalysisResponse {
  description: string
  cleanliness_score: number
  metadata?: {
    inspection_type: string
    room_name: string
    tokens_used: number
    model_used: string
    analyzed_at: string
  }
}

interface UsePhotoAnalysisReturn {
  analyzePhoto: (request: AnalysisRequest) => Promise<AnalysisResponse>
  loading: boolean
  error: string | null
  lastAnalysis: AnalysisResponse | null
}

export function usePhotoAnalysis(): UsePhotoAnalysisReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastAnalysis, setLastAnalysis] = useState<AnalysisResponse | null>(null)

  const analyzePhoto = async (request: AnalysisRequest): Promise<AnalysisResponse> => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/analyze-inspection-photo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      const result: AnalysisResponse = await response.json()
      setLastAnalysis(result)
      return result

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze photo'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return {
    analyzePhoto,
    loading,
    error,
    lastAnalysis
  }
}

export type { AnalysisRequest, AnalysisResponse }