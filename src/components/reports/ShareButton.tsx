'use client'

import { useState, useEffect, useCallback } from 'react'
// import { createClientSupabase } from '@/lib/supabase' // Unused for now

interface ShareButtonProps {
  inspectionId: string
}

interface ShareState {
  shareEnabled: boolean
  shareUrl: string | null
  loading: boolean
  copying: boolean
}

export default function ShareButton({ inspectionId }: ShareButtonProps) {
  const [state, setState] = useState<ShareState>({
    shareEnabled: false,
    shareUrl: null,
    loading: true,
    copying: false
  })
  
  const [showModal, setShowModal] = useState(false)
  // const supabase = createClientSupabase() // Unused for now

  // Load current share status
  const loadShareStatus = useCallback(async () => {
    try {
      const response = await fetch(`/api/inspections/${inspectionId}/share`)
      if (response.ok) {
        const data = await response.json()
        setState(prev => ({
          ...prev,
          shareEnabled: data.shareEnabled || false,
          shareUrl: data.shareUrl || null,
          loading: false
        }))
      }
    } catch (error) {
      console.error('Error loading share status:', error)
      setState(prev => ({ ...prev, loading: false }))
    }
  }, [inspectionId])

  useEffect(() => {
    loadShareStatus()
  }, [loadShareStatus])

  const generateShareLink = async () => {
    setState(prev => ({ ...prev, loading: true }))
    
    try {
      const response = await fetch(`/api/inspections/${inspectionId}/share`, {
        method: 'POST'
      })
      
      if (response.ok) {
        const data = await response.json()
        setState(prev => ({
          ...prev,
          shareEnabled: true,
          shareUrl: data.shareUrl,
          loading: false
        }))
      } else {
        throw new Error('Failed to generate share link')
      }
    } catch (error) {
      console.error('Error generating share link:', error)
      setState(prev => ({ ...prev, loading: false }))
      alert('Failed to generate share link. Please try again.')
    }
  }

  const disableSharing = async () => {
    setState(prev => ({ ...prev, loading: true }))
    
    try {
      const response = await fetch(`/api/inspections/${inspectionId}/share`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setState(prev => ({
          ...prev,
          shareEnabled: false,
          shareUrl: null,
          loading: false
        }))
        setShowModal(false)
      } else {
        throw new Error('Failed to disable sharing')
      }
    } catch (error) {
      console.error('Error disabling sharing:', error)
      setState(prev => ({ ...prev, loading: false }))
      alert('Failed to disable sharing. Please try again.')
    }
  }

  const copyToClipboard = async () => {
    if (!state.shareUrl) return
    
    setState(prev => ({ ...prev, copying: true }))
    
    try {
      await navigator.clipboard.writeText(state.shareUrl)
      setTimeout(() => {
        setState(prev => ({ ...prev, copying: false }))
      }, 1000)
    } catch (error) {
      console.error('Error copying to clipboard:', error)
      setState(prev => ({ ...prev, copying: false }))
    }
  }

  if (state.loading) {
    return (
      <button
        disabled
        className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-400 rounded-lg cursor-not-allowed"
      >
        <svg className="w-4 h-4 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Loading...
      </button>
    )
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
        </svg>
        Share Report
      </button>

      {/* Share Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Share Inspection Report</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {!state.shareEnabled ? (
              <div className="space-y-4">
                <p className="text-gray-600">
                  Generate a public link to share this inspection report with clients, property managers, or other stakeholders.
                </p>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex">
                    <svg className="w-5 h-5 text-yellow-400 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <div className="text-sm">
                      <p className="font-medium text-yellow-800">Security Notice</p>
                      <p className="text-yellow-700 mt-1">
                        Anyone with this link will be able to view the full inspection report, including all photos and comments.
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={generateShareLink}
                  disabled={state.loading}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {state.loading ? 'Generating...' : 'Generate Share Link'}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-gray-600">
                  Your inspection report is publicly accessible via the link below:
                </p>
                
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <code className="text-sm text-gray-800 break-all mr-2">{state.shareUrl}</code>
                    <button
                      onClick={copyToClipboard}
                      className="flex-shrink-0 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                    >
                      {state.copying ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        'Copy'
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => state.shareUrl && window.open(state.shareUrl, '_blank')}
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                  >
                    Preview
                  </button>
                  <button
                    onClick={disableSharing}
                    disabled={state.loading}
                    className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    {state.loading ? 'Disabling...' : 'Disable Sharing'}
                  </button>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex">
                    <svg className="w-5 h-5 text-green-400 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="text-sm">
                      <p className="font-medium text-green-800">Link Active</p>
                      <p className="text-green-700 mt-1">
                        The report can be accessed by anyone with this link. You can disable sharing at any time.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}