'use client'

import { useState, useEffect, useRef } from 'react'

interface AddressSuggestion {
  place_id: string
  display_name: string
  lat: string
  lon: string
  type: string
  class: string
}

interface SelectedLocation {
  address: string
  lat: number
  lon: number
  place_id: string
}

interface AddressAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onLocationSelect?: (location: SelectedLocation | null) => void
  placeholder?: string
  className?: string
  name?: string
  required?: boolean
}

export default function AddressAutocomplete({
  value,
  onChange,
  onLocationSelect,
  placeholder = "Start typing an address...",
  className = "",
  name,
  required = false
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const [isAddressSelected, setIsAddressSelected] = useState(false)
  const debounceTimeout = useRef<NodeJS.Timeout>()
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionRefs = useRef<(HTMLButtonElement | null)[]>([])

  // Debounced search function
  const searchAddresses = async (query: string) => {
    if (query.length < 3) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    setLoading(true)
    try {
      // Using LocationIQ free tier (2000 requests/day)
      // You'll need to set NEXT_PUBLIC_LOCATIONIQ_API_KEY in your .env.local
      const apiKey = process.env.NEXT_PUBLIC_LOCATIONIQ_API_KEY
      
      if (!apiKey) {
        console.warn('LocationIQ API key not found. Address autocomplete will not work.')
        setSuggestions([])
        setShowSuggestions(false)
        setLoading(false)
        return
      }

      const response = await fetch(
        `https://us1.locationiq.com/v1/autocomplete?key=${apiKey}&q=${encodeURIComponent(query)}&format=json&limit=5&countrycodes=us,ca,gb,au`
      )

      if (!response.ok) {
        throw new Error('Failed to fetch suggestions')
      }

      const data: AddressSuggestion[] = await response.json()
      setSuggestions(data)
      setShowSuggestions(true)
      setHighlightedIndex(-1)
    } catch (error) {
      console.error('Address autocomplete error:', error)
      setSuggestions([])
      setShowSuggestions(false)
    } finally {
      setLoading(false)
    }
  }

  // Handle input change with debouncing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    onChange(newValue)
    setIsAddressSelected(false) // User is typing, not selected anymore

    // Clear existing timeout
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current)
    }

    // Set new timeout for debounced search
    debounceTimeout.current = setTimeout(() => {
      searchAddresses(newValue)
    }, 300) // 300ms delay
  }

  // Handle suggestion selection
  const handleSuggestionClick = (suggestion: AddressSuggestion) => {
    const selectedLocation: SelectedLocation = {
      address: suggestion.display_name,
      lat: parseFloat(suggestion.lat),
      lon: parseFloat(suggestion.lon),
      place_id: suggestion.place_id
    }
    
    onChange(suggestion.display_name)
    setSuggestions([])
    setShowSuggestions(false)
    setHighlightedIndex(-1)
    setIsAddressSelected(true) // Mark as selected
    
    // Notify parent component about the location selection
    if (onLocationSelect) {
      onLocationSelect(selectedLocation)
    }
    
    // Show success feedback animation
    if (inputRef.current) {
      inputRef.current.style.borderColor = '#10b981'
      inputRef.current.style.backgroundColor = '#f0fdf4'
      
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.style.borderColor = ''
          inputRef.current.style.backgroundColor = ''
        }
      }, 1000)
    }
  }

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1)
        break
      case 'Enter':
        e.preventDefault()
        if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
          handleSuggestionClick(suggestions[highlightedIndex])
        }
        break
      case 'Escape':
        setSuggestions([])
        setShowSuggestions(false)
        setHighlightedIndex(-1)
        break
    }
  }

  // Scroll highlighted suggestion into view
  useEffect(() => {
    if (highlightedIndex >= 0 && suggestionRefs.current[highlightedIndex]) {
      suggestionRefs.current[highlightedIndex]?.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth'
      })
    }
  }, [highlightedIndex])

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current)
      }
    }
  }, [])

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          name={name}
          required={required}
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true)
            }
          }}
          className={`w-full p-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-transparent text-gray-900 placeholder-gray-400 transition-all duration-200 ${
            isAddressSelected 
              ? 'bg-green-50 border-green-200 text-green-900' 
              : ''
          } ${className}`}
          placeholder={placeholder}
        />
        
        {/* Selected indicator */}
        {isAddressSelected && (
          <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
            <div className="flex items-center text-green-600">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        )}
        
        {/* Loading indicator */}
        {loading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-gray-200 border-t-gray-500 rounded-full animate-spin"></div>
          </div>
        )}
        
        {/* Clear button when address is selected */}
        {isAddressSelected && !loading && (
          <button
            type="button"
            onClick={() => {
              onChange('')
              setIsAddressSelected(false)
              setSuggestions([])
              setShowSuggestions(false)
              if (onLocationSelect) {
                onLocationSelect(null)
              }
              inputRef.current?.focus()
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && !isAddressSelected && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.place_id}
              ref={el => suggestionRefs.current[index] = el}
              type="button"
              onClick={() => handleSuggestionClick(suggestion)}
              className={`w-full text-left px-4 py-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors ${
                index === highlightedIndex ? 'bg-gray-50' : ''
              }`}
            >
              <div className="flex items-start space-x-3">
                {/* Icon based on place type */}
                <div className="flex-shrink-0 mt-1">
                  {suggestion.class === 'place' ? (
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  ) : suggestion.class === 'highway' ? (
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {suggestion.display_name.split(',')[0]}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {suggestion.display_name}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No API key warning */}
      {!process.env.NEXT_PUBLIC_LOCATIONIQ_API_KEY && (
        <div className="mt-2 text-xs text-amber-600">
          <strong>Note:</strong> Address autocomplete requires a LocationIQ API key. 
          Add NEXT_PUBLIC_LOCATIONIQ_API_KEY to your .env.local file.
        </div>
      )}
    </div>
  )
}