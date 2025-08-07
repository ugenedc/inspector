'use client'

import { useEffect, useRef } from 'react'

interface PropertyMapProps {
  latitude: number
  longitude: number
  address: string
}

export default function PropertyMap({ latitude, longitude, address }: PropertyMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)

  useEffect(() => {
    // Dynamically import Leaflet to avoid SSR issues
    const initMap = async () => {
      if (typeof window === 'undefined' || !mapRef.current) return

      try {
        const L = await import('leaflet')
        
        // Import Leaflet CSS
        const style = document.createElement('link')
        style.rel = 'stylesheet'
        style.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
        document.head.appendChild(style)

        // Clean up previous map instance
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove()
        }

        // Create map
        const map = L.map(mapRef.current).setView([latitude, longitude], 15)

        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(map)

        // Create custom icon
        const customIcon = L.divIcon({
          html: `
            <div class="flex items-center justify-center w-8 h-8 bg-red-500 rounded-full border-2 border-white shadow-lg">
              <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
              </svg>
            </div>
          `,
          className: 'custom-div-icon',
          iconSize: [32, 32],
          iconAnchor: [16, 32],
          popupAnchor: [0, -32]
        })

        // Add marker
        L.marker([latitude, longitude], { icon: customIcon })
          .addTo(map)
          .bindPopup(`
            <div class="font-medium text-gray-900 mb-1">Property Location</div>
            <div class="text-sm text-gray-600">${address}</div>
          `)
          .openPopup()

        mapInstanceRef.current = map

        // Disable interactions to make it more of a preview
        map.dragging.disable()
        map.touchZoom.disable()
        map.doubleClickZoom.disable()
        map.scrollWheelZoom.disable()
        map.boxZoom.disable()
        map.keyboard.disable()

      } catch (error) {
        console.error('Error initializing map:', error)
      }
    }

    initMap()

    // Cleanup on unmount
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
      }
    }
  }, [latitude, longitude, address])

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center space-x-2">
          <div className="w-5 h-5 bg-gray-900 rounded-full flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="font-medium text-gray-900">Property Location</h3>
        </div>
      </div>
      <div 
        ref={mapRef} 
        className="h-48 bg-gray-100 relative"
        style={{ minHeight: '192px' }}
      >
        {/* Loading state */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-gray-500 text-sm">Loading map...</div>
        </div>
      </div>
      <div className="p-3 bg-gray-50">
        <p className="text-xs text-gray-600 truncate">{address}</p>
      </div>
    </div>
  )
}