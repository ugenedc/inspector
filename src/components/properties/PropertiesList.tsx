'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'

interface PropertyGroup {
  address: string
  inspections: Inspection[]
  lastInspection: string
  totalInspections: number
}

interface Inspection {
  id: string
  address: string
  inspection_type: 'entry' | 'exit' | 'routine'
  owner_name: string
  tenant_name?: string
  inspection_date: string
  created_at: string
  updated_at: string
}

interface PropertiesListProps {
  properties: PropertyGroup[]
}

export default function PropertiesList({ properties }: PropertiesListProps) {
  const [searchTerm, setSearchTerm] = useState('')

  // Filter properties based on search term
  const filteredProperties = useMemo(() => {
    if (!searchTerm.trim()) return properties

    const term = searchTerm.toLowerCase().trim()
    return properties.filter(property => 
      property.address.toLowerCase().includes(term) ||
      property.inspections.some(inspection => 
        inspection.owner_name.toLowerCase().includes(term) ||
        (inspection.tenant_name && inspection.tenant_name.toLowerCase().includes(term)) ||
        inspection.inspection_type.toLowerCase().includes(term)
      )
    )
  }, [properties, searchTerm])

  const getInspectionTypeIcon = (type: string) => {
    switch (type) {
      case 'entry':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
          </svg>
        )
      case 'exit':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        )
      case 'routine':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        )
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          placeholder="Search properties, owners, or tenants..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-transparent text-gray-900 placeholder-gray-400"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Search Results Summary */}
      {searchTerm && (
        <div className="text-sm text-gray-600">
          Found {filteredProperties.length} propert{filteredProperties.length !== 1 ? 'ies' : 'y'} 
          {searchTerm && ` matching "${searchTerm}"`}
        </div>
      )}

      {/* Properties List */}
      {filteredProperties.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            {searchTerm ? (
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            )}
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? 'No properties found' : 'No properties yet'}
          </h3>
          <p className="text-gray-500 mb-6">
            {searchTerm 
              ? `No properties match "${searchTerm}". Try a different search term.`
              : 'Start by creating your first inspection to see properties here.'
            }
          </p>
          {!searchTerm && (
            <Link
              href="/inspections/new"
              className="inline-flex items-center px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
              </svg>
              Create First Inspection
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {filteredProperties.map((property, index) => (
            <div key={index} className="bg-white rounded-xl border border-gray-200 p-6">
              {/* Property Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gray-900 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div>
                    <Link 
                      href={`/properties/${encodeURIComponent(property.address)}`}
                      className="group"
                    >
                      <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-gray-700 transition-colors">
                        {property.address}
                        <svg className="inline w-4 h-4 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                        </svg>
                      </h3>
                    </Link>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>{property.totalInspections} inspection{property.totalInspections !== 1 ? 's' : ''}</span>
                      <span>•</span>
                      <span>Last: {new Date(property.lastInspection).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-3">
                  <Link
                    href={`/properties/${encodeURIComponent(property.address)}`}
                    className="inline-flex items-center px-4 py-2 text-gray-900 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 hover:border-gray-300 transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    View Property
                  </Link>
                  <Link
                    href="/inspections/new"
                    className="inline-flex items-center px-4 py-2 text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                    </svg>
                    New Inspection
                  </Link>
                </div>
              </div>

              {/* Inspections List */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Recent Inspections</h4>
                {property.inspections.slice(0, 3).map((inspection) => (
                  <div
                    key={inspection.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2 text-gray-600">
                        {getInspectionTypeIcon(inspection.inspection_type)}
                        <span className="text-sm capitalize">
                          {inspection.inspection_type}
                        </span>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium text-gray-900">{inspection.owner_name}</span>
                        {inspection.tenant_name && (
                          <span className="text-gray-500"> • Tenant: {inspection.tenant_name}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-gray-500">
                        {new Date(inspection.inspection_date).toLocaleDateString()}
                      </span>
                      <div className="flex space-x-2">
                        <Link
                          href={`/inspections/${inspection.id}`}
                          className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                        >
                          View Details
                        </Link>
                        <Link
                          href={`/inspections/${inspection.id}/report`}
                          className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                        >
                          Report
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
                
                {property.inspections.length > 3 && (
                  <div className="text-center pt-2">
                    <button className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                      View all {property.inspections.length} inspections
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}