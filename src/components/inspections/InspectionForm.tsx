'use client'

import { useState } from 'react'
import { createClientSupabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import AddressAutocomplete from '@/components/forms/AddressAutocomplete'
import PropertyMap from '@/components/maps/PropertyMap'

interface SelectedLocation {
  address: string
  lat: number
  lon: number
  place_id: string
}

interface InspectionFormData {
  address: string
  inspection_type: 'entry' | 'exit' | 'routine'
  owner_name: string
  tenant_name?: string
  inspection_date: string
}

export default function InspectionForm() {
  const [formData, setFormData] = useState<InspectionFormData>({
    address: '',
    inspection_type: 'routine',
    owner_name: '',
    tenant_name: '',
    inspection_date: new Date().toISOString().split('T')[0], // Today's date
  })
  const [loading, setLoading] = useState(false)
  const [redirecting, setRedirecting] = useState(false)
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null)
  const [selectedLocation, setSelectedLocation] = useState<SelectedLocation | null>(null)
  
  const handleLocationSelect = (location: SelectedLocation | null) => {
    setSelectedLocation(location)
  }
  
  const router = useRouter()
  const supabase = createClientSupabase()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('You must be logged in to create an inspection')
      }

      // Find or create property if we have location data
      let propertyId = null
      
      if (selectedLocation) {
        try {
          const { data: propertyData, error: propertyError } = await supabase
            .rpc('find_or_create_property', {
              p_address: formData.address.trim(),
              p_formatted_address: selectedLocation.address,
              p_latitude: selectedLocation.lat,
              p_longitude: selectedLocation.lon,
              p_place_id: selectedLocation.place_id,
              p_user_id: user.id
            })

          if (propertyError) {
            console.error('Property creation error:', propertyError)
            // Continue without property linkage if creation fails
          } else {
            propertyId = propertyData
            console.log('Property created/found:', propertyId)
          }
        } catch (propertyErr) {
          console.error('Property creation failed:', propertyErr)
          // Continue without property linkage if creation fails
        }
      }

      // Prepare data for insertion
      const inspectionData = {
        address: formData.address.trim(),
        property_id: propertyId,
        inspection_type: formData.inspection_type,
        owner_name: formData.owner_name.trim(),
        tenant_name: formData.tenant_name?.trim() || null,
        inspection_date: formData.inspection_date,
        inspector_id: user.id,
        status: 'pending', // Fixed: use 'pending' instead of 'draft' to match DB constraint
        created_at: new Date().toISOString(),
      }

      // Insert into Supabase
      const { data, error } = await supabase
        .from('inspections')
        .insert([inspectionData])
        .select()

      if (error) {
        throw error
      }

      // Show success message and start redirect process
      setLoading(false)
      setRedirecting(true)
      setMessage({
        type: 'success',
        text: 'Inspection created! Redirecting to room selection...'
      })

      // Reset form
      setFormData({
        address: '',
        inspection_type: 'routine',
        owner_name: '',
        tenant_name: '',
        inspection_date: new Date().toISOString().split('T')[0],
      })

      // Redirect to room selection for step 2 of inspection setup
      setTimeout(() => {
        router.push(`/inspections/${data[0].id}/rooms`)
      }, 1500)

    } catch (error) {
      console.error('Error creating inspection:', error)
      
      // Handle different types of errors
      let errorMessage = 'Failed to create inspection. Please try again.'
      
      if (error && typeof error === 'object') {
        if ('message' in error && error.message) {
          errorMessage = error.message
        } else if ('error' in error && error.error) {
          errorMessage = error.error
        } else if ('details' in error && error.details) {
          errorMessage = error.details
        } else {
          errorMessage = `Database error: ${JSON.stringify(error)}`
        }
      } else if (typeof error === 'string') {
        errorMessage = error
      }
      
      setMessage({
        type: 'error',
        text: errorMessage
      })
      setLoading(false)
      setRedirecting(false)
    }
  }

  return (
    <div className="min-h-screen bg-white relative">
      {/* Elegant Loading Overlay */}
      {redirecting && (
        <div className="fixed inset-0 bg-white bg-opacity-95 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <div className="w-6 h-6 border-2 border-gray-300 border-t-white rounded-full animate-spin"></div>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Inspection Created Successfully
            </h3>
            <p className="text-gray-600">
              Taking you to room selection...
            </p>
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="mb-8">
          <div className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
            <span>Step 1 of 3</span>
            <span>•</span>
            <span>Inspection Details</span>
          </div>
          <h1 className="text-2xl font-medium text-gray-900 mb-2">
            Start New Property Inspection
          </h1>
          <p className="text-gray-500">
            Create a new inspection to document property condition and issues.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Address */}
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-900 mb-3">
              Property Address *
            </label>
            <AddressAutocomplete
              value={formData.address}
              onChange={(value) => setFormData(prev => ({ ...prev, address: value }))}
              onLocationSelect={handleLocationSelect}
              placeholder="Start typing an address (e.g., '123 Main St, New York')"
              name="address"
              required
            />
            
            {/* Show map when location is selected */}
            {selectedLocation && (
              <div className="mt-4">
                <PropertyMap
                  latitude={selectedLocation.lat}
                  longitude={selectedLocation.lon}
                  address={selectedLocation.address}
                />
              </div>
            )}
          </div>

          {/* Inspection Type */}
          <div>
            <label htmlFor="inspection_type" className="block text-sm font-medium text-gray-900 mb-3">
              Inspection Type *
            </label>
            <select
              id="inspection_type"
              name="inspection_type"
              required
              value={formData.inspection_type}
              onChange={handleInputChange}
              className="w-full p-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-transparent text-gray-900"
            >
              <option value="routine">Routine Inspection</option>
              <option value="entry">Entry Inspection</option>
              <option value="exit">Exit Inspection</option>
            </select>
          </div>

          {/* Owner Name */}
          <div>
            <label htmlFor="owner_name" className="block text-sm font-medium text-gray-900 mb-3">
              Property Owner Name *
            </label>
            <input
              type="text"
              id="owner_name"
              name="owner_name"
              required
              value={formData.owner_name}
              onChange={handleInputChange}
              className="w-full p-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-transparent text-gray-900 placeholder-gray-400"
              placeholder="Enter property owner's full name"
            />
          </div>

          {/* Tenant Name */}
          <div>
            <label htmlFor="tenant_name" className="block text-sm font-medium text-gray-900 mb-3">
              Tenant Name <span className="text-gray-500">(Optional)</span>
            </label>
            <input
              type="text"
              id="tenant_name"
              name="tenant_name"
              value={formData.tenant_name}
              onChange={handleInputChange}
              className="w-full p-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-transparent text-gray-900 placeholder-gray-400"
              placeholder="Enter tenant's full name (if applicable)"
            />
          </div>

          {/* Inspection Date */}
          <div>
            <label htmlFor="inspection_date" className="block text-sm font-medium text-gray-900 mb-3">
              Inspection Date *
            </label>
            <input
              type="date"
              id="inspection_date"
              name="inspection_date"
              required
              value={formData.inspection_date}
              onChange={handleInputChange}
              className="w-full p-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-transparent text-gray-900"
            />
          </div>

          {/* Message Display */}
          {message && (
            <div className={`p-4 rounded-lg ${
              message.type === 'error'
                ? 'bg-red-50 text-red-800'
                : 'bg-green-50 text-green-800'
            }`}>
              {message.text}
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end space-x-3 pt-6">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 text-gray-600 hover:text-gray-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || redirecting}
              className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-white rounded-full animate-spin mr-2" />
                  Creating...
                </div>
              ) : redirecting ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-white rounded-full animate-spin mr-2" />
                  Redirecting...
                </div>
              ) : (
                'Create Inspection'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}