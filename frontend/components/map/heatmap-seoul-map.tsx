"use client"

import { useEffect, useRef, useState, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { DistrictData, StationData } from '@/lib/api'

// Dynamically import Leaflet to avoid SSR issues
const L = typeof window !== 'undefined' ? require('leaflet') : null

// Fix for default markers in Leaflet - only on client side
if (typeof window !== 'undefined' && L) {
  delete (L.Icon.Default.prototype as any)._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  })
}

interface HeatmapSeoulMapProps {
  onDistrictClick?: (districtName: string, districtCode: string) => void
  selectedDistrict?: string
  districts: DistrictData[]
  viewMode: 'district' | 'station'
  loading?: boolean
}

function HeatmapSeoulMapComponent({ 
  onDistrictClick, 
  selectedDistrict, 
  districts = [],
  viewMode,
  loading = false
}: HeatmapSeoulMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const stationMarkersRef = useRef<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isClient, setIsClient] = useState(false)

  // Seoul bounds for initial view
  const seoulBounds: [number, number] = [37.5665, 126.9780]

  // Check if we're on client side
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Convert district data to lookup map
  const districtLookup = useMemo(() => {
    const lookup: Record<string, DistrictData> = {}
    districts.forEach(district => {
      lookup[district.district_name] = district
    })
    return lookup
  }, [districts])

  // Traffic colors based on volume
  const getTrafficColor = (traffic: number): string => {
    if (traffic > 3000000) return '#DC2626' // Red - Very High
    if (traffic > 2000000) return '#EA580C' // Orange - High
    if (traffic > 1500000) return '#EAB308' // Yellow - Medium-High
    if (traffic > 1000000) return '#16A34A' // Green - Medium
    if (traffic > 500000) return '#2563EB'  // Blue - Low
    return '#6B7280' // Gray - Very Low
  }

  // Style function for districts
  const getFeatureStyle = (feature: any) => {
    const districtName = feature.properties.sggnm
    const districtData = districtLookup[districtName]
    const traffic = districtData?.total_traffic || 0
    const isSelected = selectedDistrict === districtName

    return {
      fillColor: getTrafficColor(traffic),
      weight: isSelected ? 3 : 2,
      opacity: 1,
      color: isSelected ? '#2563EB' : '#ffffff',
      dashArray: '',
      fillOpacity: 0.7
    }
  }

  useEffect(() => {
    if (!isClient || !L || !mapRef.current || mapInstanceRef.current) {
      console.log('Map initialization skipped:', { isClient, hasL: !!L, hasMapRef: !!mapRef.current, hasMapInstance: !!mapInstanceRef.current })
      return
    }

    console.log('🗺️ Initializing heatmap map...')

    // Initialize map with CartoDB Positron style
    const map = L.map(mapRef.current, {
      center: seoulBounds,
      zoom: 11,
      zoomControl: true,
      attributionControl: true
    })

    // CartoDB Positron tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(map)

    mapInstanceRef.current = map

    // Load GeoJSON data
    const loadGeoJSON = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch('/seoul-districts-simple.geojson')
        if (!response.ok) {
          throw new Error(`Failed to load GeoJSON: ${response.status}`)
        }

        const geoJsonData = await response.json()
        
        // Add all district features to map
        const layer = L.geoJSON(geoJsonData, {
          style: getFeatureStyle,
          onEachFeature: (feature, layer) => {
            const districtName = feature.properties.sggnm
            const districtData = districtLookup[districtName]

            // Mouse events
            layer.on({
              mouseover: (e) => {
                const layer = e.target
                layer.setStyle({
                  weight: 3,
                  color: '#2563EB',
                  fillOpacity: 0.9
                })
                layer.bringToFront()
              },
              mouseout: (e) => {
                const layer = e.target
                layer.setStyle(getFeatureStyle(feature))
              },
              click: (e) => {
                const districtName = feature.properties.sggnm
                const districtCode = feature.properties.sgg
                
                // Zoom to district
                map.fitBounds(layer.getBounds())
                
                // Call callback
                if (onDistrictClick) {
                  onDistrictClick(districtName, districtCode)
                }
              }
            })

            // Tooltip - will be updated when data changes
            layer.bindTooltip(
              `<div>
                <strong>${districtName}</strong><br/>
                교통량: 로딩 중...
              </div>`,
              {
                permanent: false,
                direction: 'center',
                className: 'heatmap-tooltip'
              }
            )
          }
        }).addTo(map)

        setIsLoading(false)
      } catch (err) {
        console.error('Failed to load GeoJSON:', err)
        setError(err instanceof Error ? err.message : 'Failed to load map data')
        setIsLoading(false)
      }
    }

    loadGeoJSON()

    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [isClient])

  // Update styles and tooltips when district data changes
  useEffect(() => {
    if (!isClient || !L || !mapInstanceRef.current) return

    console.log('🔄 Updating heatmap styles and tooltips')

    // Clear existing station markers
    stationMarkersRef.current.forEach(marker => {
      if (mapInstanceRef.current && marker) {
        mapInstanceRef.current.removeLayer(marker)
      }
    })
    stationMarkersRef.current = []

    mapInstanceRef.current.eachLayer((layer: any) => {
      if (layer instanceof L.GeoJSON) {
        layer.eachLayer((featureLayer: any) => {
          if (featureLayer instanceof L.Path) {
            const feature = featureLayer.feature
            if (feature) {
              // Update style
              featureLayer.setStyle(getFeatureStyle(feature))
              
              // Update tooltip content
              const districtName = feature.properties.sggnm
              const districtData = districtLookup[districtName]
              const traffic = districtData?.total_traffic || 0
              const stationCount = districtData?.stations?.length || 0
              
              featureLayer.setTooltipContent(
                `<div>
                  <strong>${districtName}</strong><br/>
                  교통량: ${traffic.toLocaleString()}명<br/>
                  정류장: ${stationCount}개<br/>
                  밀도점수: ${districtData?.traffic_density_score?.toFixed(1) || 'N/A'}
                </div>`
              )
            }
          }
        })
      }
    })

    // Add station markers if in station mode and stations available
    if (viewMode === 'station' && districts.length > 0) {
      districts.forEach(district => {
        if (district.stations && district.stations.length > 0) {
          district.stations.forEach(station => {
            // Check if coordinates exist and are valid
            const lat = station.coordinate?.lat || station.coordinate?.latitude
            const lng = station.coordinate?.lng || station.coordinate?.longitude
            
            if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
              // Create custom icon based on traffic (adjust scale for Korean traffic data)
              const iconSize = Math.min(Math.max(station.total_traffic / 50000, 4), 15)
              const icon = L.circleMarker([lat, lng], {
                radius: iconSize,
                fillColor: getTrafficColor(station.total_traffic),
                color: '#ffffff',
                weight: 2,
                opacity: 1,
                fillOpacity: 0.8
              })
              
              // Add station popup
              icon.bindPopup(`
                <div>
                  <strong>${station.station_name}</strong><br/>
                  구: ${district.district_name}<br/>
                  교통량: ${station.total_traffic.toLocaleString()}명
                </div>
              `)
              
              icon.addTo(mapInstanceRef.current)
              stationMarkersRef.current.push(icon)
            } else {
              console.warn('Invalid coordinates for station:', station.station_name, { lat, lng })
            }
          })
        }
      })
    }
  }, [districtLookup, selectedDistrict, isClient, getFeatureStyle, viewMode, districts])

  if (loading) {
    return (
      <div className="h-[600px] bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">데이터 로딩 중...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-[600px] bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center text-red-500">
          <p className="font-medium">지도 로딩 실패</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    )
  }

  // Don't render anything on server side
  if (!isClient) {
    return (
      <div className="h-[600px] bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">지도 로딩 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      <div 
        ref={mapRef} 
        className="h-[600px] rounded-lg border"
        style={{ zIndex: 1 }}
      />
      
      {isLoading && (
        <div className="absolute inset-0 bg-gray-100 rounded-lg flex items-center justify-center z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-600">지도 로딩 중...</p>
          </div>
        </div>
      )}

      {/* Enhanced Legend for Heatmap */}
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg text-xs z-20">
        <div className="font-medium mb-2">교통량 히트맵 범례</div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-4 h-3 bg-[#DC2626] rounded-sm"></div>
            <span>300만명 이상</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-3 bg-[#EA580C] rounded-sm"></div>
            <span>200-300만명</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-3 bg-[#EAB308] rounded-sm"></div>
            <span>150-200만명</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-3 bg-[#16A34A] rounded-sm"></div>
            <span>100-150만명</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-3 bg-[#2563EB] rounded-sm"></div>
            <span>50-100만명</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-3 bg-[#6B7280] rounded-sm"></div>
            <span>50만명 미만</span>
          </div>
        </div>
      </div>

      {/* View mode indicator */}
      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-sm z-20">
        <div className="text-xs font-medium">
          {viewMode === 'district' ? '📍 구별 히트맵' : '🎯 정류장별 히트맵'}
        </div>
      </div>
    </div>
  )
}

// Export as dynamic component to prevent SSR issues
export const HeatmapSeoulMap = dynamic(() => Promise.resolve(HeatmapSeoulMapComponent), {
  ssr: false,
  loading: () => (
    <div className="h-[600px] bg-gray-100 rounded-lg flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
        <p className="text-gray-600">지도 로딩 중...</p>
      </div>
    </div>
  )
})