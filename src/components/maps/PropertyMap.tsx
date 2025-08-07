'use client'

import { useEffect, useRef } from 'react'

interface PropertyMapProps {
  latitude: number
  longitude: number
  address: string
}

export default function PropertyMap({ latitude, longitude, address }: PropertyMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)

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

        // Create map with higher zoom for better detail
        const map = L.map(mapRef.current).setView([latitude, longitude], 16)

        // Add beautiful tile layer with minimal style
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: 'abcd',
          maxZoom: 20
        }).addTo(map)

        // Create beautiful custom icon that matches our minimalist design
        const customIcon = L.divIcon({
          html: `
            <div style="
              position: relative;
              width: 40px;
              height: 50px;
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              <div style="
                width: 40px;
                height: 40px;
                background: linear-gradient(135deg, #1f2937 0%, #374151 100%);
                border: 4px solid white;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15), 0 4px 10px rgba(0, 0, 0, 0.1);
                position: relative;
                z-index: 2;
              ">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
              </div>
              <div style="
                position: absolute;
                bottom: 0;
                left: 50%;
                transform: translateX(-50%);
                width: 0;
                height: 0;
                border-left: 8px solid transparent;
                border-right: 8px solid transparent;
                border-top: 12px solid #1f2937;
                filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.15));
                z-index: 1;
              "></div>
            </div>
          `,
          className: 'custom-property-marker',
          iconSize: [40, 50],
          iconAnchor: [20, 50],
          popupAnchor: [0, -50]
        })

        // Add marker with beautiful popup
        L.marker([latitude, longitude], { icon: customIcon })
          .addTo(map)
          .bindPopup(`
            <div style="
              padding: 12px;
              border-radius: 8px;
              background: white;
              border: none;
              box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
              max-width: 250px;
            ">
              <div style="
                font-weight: 600;
                color: #1f2937;
                margin-bottom: 6px;
                font-size: 14px;
              ">Property Location</div>
              <div style="
                color: #6b7280;
                font-size: 12px;
                line-height: 1.4;
              ">${address}</div>
            </div>
          `, {
            closeButton: false,
            offset: [0, -15],
            className: 'custom-popup'
          })

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
        className="h-64 bg-gradient-to-br from-gray-50 to-gray-100 relative"
        style={{ minHeight: '256px' }}
      >
        {/* Loading state */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gray-400 rounded-full animate-pulse"></div>
            <div className="text-gray-500 text-sm font-medium">Loading beautiful map...</div>
          </div>
        </div>
      </div>
      <div className="p-3 bg-gray-50">
        <p className="text-xs text-gray-600 truncate">{address}</p>
      </div>
    </div>
  )
}