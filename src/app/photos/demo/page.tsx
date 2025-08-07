import { createServerSupabase } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import PhotoManager from '@/components/photos/PhotoManager'

export default async function PhotoDemoPage() {
  const supabase = await createServerSupabase()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // For demo purposes, we'll use a dummy inspection and room ID
  // In a real app, these would come from URL params or be selected by the user
  const demoInspectionId = '00000000-0000-0000-0000-000000000000'
  const demoRoomId = '00000000-0000-0000-0000-000000000001'

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Photo Upload Demo</h1>
          <p className="mt-2 text-gray-600">
            Test the photo upload functionality with camera capture and file upload.
          </p>
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex">
              <svg className="h-5 w-5 text-yellow-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Demo Mode</h3>
                <p className="mt-1 text-sm text-yellow-700">
                  This is a demo page. In production, you&apos;ll need actual inspection and room IDs from your database.
                  Make sure you&apos;ve run the photos schema SQL and set up Supabase Storage.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Photo Manager Component */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Photo Manager</h2>
            <PhotoManager
              inspectionId={demoInspectionId}
              roomId={demoRoomId}
              roomName="Kitchen"
              maxFiles={10}
              allowCamera={true}
              allowFiles={true}
              showMetadata={true}
            />
          </div>

          <div className="space-y-6">
            {/* Features */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Features</h3>
              <ul className="space-y-3 text-sm text-gray-600">
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-green-500 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span><strong>Camera Capture:</strong> Take photos directly using device camera</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-green-500 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span><strong>File Upload:</strong> Select files from device storage</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-green-500 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span><strong>Drag & Drop:</strong> Drag files directly onto upload area</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-green-500 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span><strong>Structured Storage:</strong> Organized by inspection/room path</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-green-500 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span><strong>Metadata Tracking:</strong> File size, dimensions, capture method</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-green-500 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span><strong>Primary Photo:</strong> Mark one photo as primary per room</span>
                </li>
              </ul>
            </div>

            {/* Technical Details */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Technical Details</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Storage Path:</span>
                  <code className="ml-2 px-2 py-1 bg-gray-100 rounded text-xs">
                    /inspections/{'{inspectionId}'}/rooms/{'{roomId}'}/filename.jpg
                  </code>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Database Table:</span>
                  <code className="ml-2 px-2 py-1 bg-gray-100 rounded text-xs">photos</code>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Storage Bucket:</span>
                  <code className="ml-2 px-2 py-1 bg-gray-100 rounded text-xs">room-photos</code>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Max File Size:</span>
                  <span className="ml-2 text-gray-600">10MB</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Supported Formats:</span>
                  <span className="ml-2 text-gray-600">JPG, PNG, WebP</span>
                </div>
              </div>
            </div>

            {/* Setup Instructions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Setup Required</h3>
              <ol className="space-y-2 text-sm text-gray-600">
                <li className="flex">
                  <span className="bg-gray-100 text-gray-700 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium mr-3 mt-0.5">1</span>
                  <span>Run <code className="bg-gray-100 px-1 rounded">database/photos-schema.sql</code> in Supabase</span>
                </li>
                <li className="flex">
                  <span className="bg-gray-100 text-gray-700 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium mr-3 mt-0.5">2</span>
                  <span>Create <code className="bg-gray-100 px-1 rounded">room-photos</code> storage bucket</span>
                </li>
                <li className="flex">
                  <span className="bg-gray-100 text-gray-700 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium mr-3 mt-0.5">3</span>
                  <span>Set up storage policies for user access</span>
                </li>
                <li className="flex">
                  <span className="bg-gray-100 text-gray-700 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium mr-3 mt-0.5">4</span>
                  <span>Test with real inspection and room IDs</span>
                </li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}