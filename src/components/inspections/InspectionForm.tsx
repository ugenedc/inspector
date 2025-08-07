'use client'

import { useState } from 'react'
import { createClientSupabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

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
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null)
  
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

      // Prepare data for insertion
      const inspectionData = {
        address: formData.address.trim(),
        inspection_type: formData.inspection_type,
        owner_name: formData.owner_name.trim(),
        tenant_name: formData.tenant_name?.trim() || null,
        inspection_date: formData.inspection_date,
        inspector_id: user.id,
        status: 'pending',
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

      setMessage({
        type: 'success',
        text: 'Inspection created successfully!'
      })

      // Reset form
      setFormData({
        address: '',
        inspection_type: 'routine',
        owner_name: '',
        tenant_name: '',
        inspection_date: new Date().toISOString().split('T')[0],
      })

      // Redirect to inspection details or list after a short delay
      setTimeout(() => {
        router.push(`/inspections/${data[0].id}`)
      }, 1500)

    } catch (error) {
      console.error('Error creating inspection:', error)
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to create inspection. Please try again.'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white shadow-lg rounded-lg p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Start New Property Inspection
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Address */}
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
              Property Address *
            </label>
            <textarea
              id="address"
              name="address"
              required
              rows={3}
              value={formData.address}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter the complete property address"
            />
          </div>

          {/* Inspection Type */}
          <div>
            <label htmlFor="inspection_type" className="block text-sm font-medium text-gray-700 mb-2">
              Inspection Type *
            </label>
            <select
              id="inspection_type"
              name="inspection_type"
              required
              value={formData.inspection_type}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="routine">Routine Inspection</option>
              <option value="entry">Entry Inspection</option>
              <option value="exit">Exit Inspection</option>
            </select>
          </div>

          {/* Owner Name */}
          <div>
            <label htmlFor="owner_name" className="block text-sm font-medium text-gray-700 mb-2">
              Property Owner Name *
            </label>
            <input
              type="text"
              id="owner_name"
              name="owner_name"
              required
              value={formData.owner_name}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter property owner's full name"
            />
          </div>

          {/* Tenant Name */}
          <div>
            <label htmlFor="tenant_name" className="block text-sm font-medium text-gray-700 mb-2">
              Tenant Name <span className="text-gray-500">(Optional)</span>
            </label>
            <input
              type="text"
              id="tenant_name"
              name="tenant_name"
              value={formData.tenant_name}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter tenant's full name (if applicable)"
            />
          </div>

          {/* Inspection Date */}
          <div>
            <label htmlFor="inspection_date" className="block text-sm font-medium text-gray-700 mb-2">
              Inspection Date *
            </label>
            <input
              type="date"
              id="inspection_date"
              name="inspection_date"
              required
              value={formData.inspection_date}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Message Display */}
          {message && (
            <div
              className={`p-4 rounded-md ${
                message.type === 'error'
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : 'bg-green-50 text-green-700 border border-green-200'
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Creating...
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