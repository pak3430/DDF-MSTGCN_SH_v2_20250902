"use client"

import { useEffect, useRef, useState, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { apiService, DRTModelType } from '@/lib/api'

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

// 모델 매핑
const modelTypeMapping: Record<string, DRTModelType> = {
  "교통취약지": "vulnerable",
  "출퇴근": "commuter", 
  "관광형": "tourism"
}

// 적합성 점수별 색상
const getSuitabilityColor = (score: number): string => {
  if (score >= 80) return '#22C55E' // Green - Very Suitable
  if (score >= 60) return '#EAB308' // Yellow - Suitable
  if (score >= 40) return '#F97316' // Orange - Fair
  return '#EF4444' // Red - Unsuitable
}

// 적합성 레벨 텍스트
const getSuitabilityLevel = (score: number): string => {
  if (score >= 80) return '매우 적합'
  if (score >= 60) return '적합'
  if (score >= 40) return '보통'
  return '부적합'
}

interface ModelSuitabilityMapProps {
  selectedModel: string
  onDistrictAnalysis?: (districtName: string, analysis: any) => void
}

interface DistrictAnalysis {
  districtName: string
  selectedModelScore: number
  allModelScores: Record<string, number>
  bestModel: string
  bestScore: number
  suitabilityLevel: string
  suitabilityColor: string
}

function ModelSuitabilityMapComponent({ 
  selectedModel, 
  onDistrictAnalysis 
}: ModelSuitabilityMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const [isClient, setIsClient] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null)
  const [districtScores, setDistrictScores] = useState<Record<string, Record<string, number>>>({})

  // Seoul bounds for initial view
  const seoulBounds: [number, number] = [37.5665, 126.9780]

  // Check if we're on client side
  useEffect(() => {
    setIsClient(true)
  }, [])

  // 선택된 모델에 따른 구별 색상 계산
  const getDistrictColor = (districtName: string) => {
    const modelType = modelTypeMapping[selectedModel]
    const score = districtScores[districtName]?.[modelType] || 0
    return getSuitabilityColor(score)
  }

  // Style function for districts
  const getFeatureStyle = (feature: any) => {
    const districtName = feature.properties.sggnm
    const isSelected = selectedDistrict === districtName
    const fillColor = getDistrictColor(districtName)

    return {
      fillColor: fillColor,
      weight: isSelected ? 3 : 2,
      opacity: 1,
      color: isSelected ? '#2563EB' : '#ffffff',
      dashArray: '',
      fillOpacity: 0.7
    }
  }

  // 구 클릭 시 모든 모델의 점수 가져오기
  const analyzeDistrict = async (districtName: string) => {
    try {
      console.log('🔍 Analyzing district:', districtName)
      
      // 3개 모델 모두에 대해 점수 가져오기
      const modelPromises = Object.entries(modelTypeMapping).map(async ([modelName, modelType]) => {
        try {
          const response = await apiService.getDRTScores(districtName, modelType, "2025-09-01")
          const avgScore = response.top_stations.length > 0 
            ? response.top_stations.reduce((sum, station) => sum + station.drt_score, 0) / response.top_stations.length
            : 0
          return { modelName, modelType, score: avgScore }
        } catch (err) {
          console.warn(`Failed to get score for ${districtName} - ${modelType}:`, err)
          return { modelName, modelType, score: 0 }
        }
      })

      const results = await Promise.all(modelPromises)
      
      // 결과 정리
      const allScores: Record<string, number> = {}
      results.forEach(({ modelName, score }) => {
        allScores[modelName] = score
      })

      // 최고 점수 모델 찾기
      const bestModel = Object.entries(allScores).reduce((best, [model, score]) => 
        score > best.score ? { model, score } : best, 
        { model: '교통취약지', score: 0 }
      )

      const selectedModelScore = allScores[selectedModel] || 0

      const analysis: DistrictAnalysis = {
        districtName,
        selectedModelScore,
        allModelScores: allScores,
        bestModel: bestModel.model,
        bestScore: bestModel.score,
        suitabilityLevel: getSuitabilityLevel(selectedModelScore),
        suitabilityColor: getSuitabilityColor(selectedModelScore)
      }

      console.log('📊 District analysis result:', analysis)

      // 점수 캐시 업데이트
      setDistrictScores(prev => ({
        ...prev,
        [districtName]: Object.fromEntries(
          results.map(({ modelType, score }) => [modelType, score])
        )
      }))

      // 분석 결과 콜백 호출
      if (onDistrictAnalysis) {
        onDistrictAnalysis(districtName, analysis)
      }

    } catch (err) {
      console.error('🚨 District analysis error:', err)
    }
  }

  useEffect(() => {
    if (!isClient || !L || !mapRef.current || mapInstanceRef.current) return

    console.log('🗺️ Initializing model suitability map...')

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
                
                // Update selected district
                setSelectedDistrict(districtName)
                
                // Zoom to district
                map.fitBounds(layer.getBounds())
                
                // Analyze district for all models
                analyzeDistrict(districtName)
              }
            })

            // Initial tooltip
            layer.bindTooltip(
              `<div>
                <strong>${districtName}</strong><br/>
                클릭하여 ${selectedModel} 모델 적합성 분석
              </div>`,
              {
                permanent: false,
                direction: 'center',
                className: 'district-tooltip'
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

  // Update styles when model changes
  useEffect(() => {
    if (!isClient || !L || !mapInstanceRef.current) return

    console.log('🔄 Updating map styles for model:', selectedModel)

    mapInstanceRef.current.eachLayer((layer: any) => {
      if (layer instanceof L.GeoJSON) {
        layer.eachLayer((featureLayer: any) => {
          if (featureLayer instanceof L.Path) {
            const feature = featureLayer.feature
            if (feature) {
              // Update style
              featureLayer.setStyle(getFeatureStyle(feature))
              
              // Update tooltip
              const districtName = feature.properties.sggnm
              featureLayer.setTooltipContent(
                `<div>
                  <strong>${districtName}</strong><br/>
                  클릭하여 ${selectedModel} 모델 적합성 분석
                </div>`
              )
            }
          }
        })
      }
    })
  }, [selectedModel, districtScores, selectedDistrict, isClient])

  if (error) {
    return (
      <div className="h-[400px] bg-gray-100 rounded-lg flex items-center justify-center">
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
      <div className="h-[400px] bg-gray-100 rounded-lg flex items-center justify-center">
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
        className="h-[400px] rounded-lg border"
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

      {/* Model Suitability Legend */}
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg text-xs z-20">
        <div className="font-medium mb-2">{selectedModel} 모델 적합성</div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-4 h-3 bg-[#22C55E] rounded-sm"></div>
            <span>매우 적합 (80점 이상)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-3 bg-[#EAB308] rounded-sm"></div>
            <span>적합 (60-80점)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-3 bg-[#F97316] rounded-sm"></div>
            <span>보통 (40-60점)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-3 bg-[#EF4444] rounded-sm"></div>
            <span>부적합 (40점 미만)</span>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-sm z-20">
        <div className="text-xs">
          <div className="font-medium text-blue-600">💡 사용법</div>
          <div className="text-gray-600">구를 클릭하여</div>
          <div className="text-gray-600">모델 적합성 분석</div>
        </div>
      </div>

      {/* Selected District Info */}
      {selectedDistrict && (
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-sm z-20">
          <div className="text-xs">
            <div className="font-medium">📍 선택된 구</div>
            <div className="text-blue-600 font-bold">{selectedDistrict}</div>
            <div className="text-gray-500">분석 중...</div>
          </div>
        </div>
      )}
    </div>
  )
}

// Export as dynamic component to prevent SSR issues
export const ModelSuitabilityMap = dynamic(() => Promise.resolve(ModelSuitabilityMapComponent), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] bg-gray-100 rounded-lg flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
        <p className="text-gray-600">모델 적합성 지도 로딩 중...</p>
      </div>
    </div>
  )
})