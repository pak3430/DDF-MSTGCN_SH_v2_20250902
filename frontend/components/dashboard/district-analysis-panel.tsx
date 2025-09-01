"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface DistrictAnalysisData {
  districtName: string
  selectedModelScore: number
  allModelScores: Record<string, number>
  bestModel: string
  bestScore: number
  suitabilityLevel: string
  suitabilityColor: string
}

interface DistrictAnalysisPanelProps {
  analysisData: DistrictAnalysisData | null
  selectedModel: string
  onClose?: () => void
}

const getSuitabilityBadgeVariant = (level: string) => {
  switch (level) {
    case '매우 적합': return 'default'
    case '적합': return 'secondary' 
    case '보통': return 'outline'
    case '부적합': return 'destructive'
    default: return 'outline'
  }
}

export function DistrictAnalysisPanel({ 
  analysisData, 
  selectedModel,
  onClose 
}: DistrictAnalysisPanelProps) {
  if (!analysisData) return null

  const { 
    districtName, 
    selectedModelScore, 
    allModelScores, 
    bestModel, 
    bestScore,
    suitabilityLevel,
    suitabilityColor
  } = analysisData

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{districtName} 분석 결과</CardTitle>
          {onClose && (
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-xl"
            >
              ×
            </button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Current Model Analysis */}
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-900">
              현재 선택 모델: {selectedModel}
            </span>
            <Badge variant={getSuitabilityBadgeVariant(suitabilityLevel)}>
              {suitabilityLevel}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <div 
              className="w-4 h-4 rounded"
              style={{ backgroundColor: suitabilityColor }}
            />
            <span className="font-bold text-lg">
              {selectedModelScore.toFixed(1)}점
            </span>
          </div>
        </div>

        {/* Best Model Recommendation */}
        <div className="bg-green-50 p-3 rounded-lg">
          <div className="text-sm font-medium text-green-900 mb-2">
            🏆 최적 모델 추천
          </div>
          <div className="flex items-center justify-between">
            <span className="font-medium">{bestModel}</span>
            <span className="font-bold text-green-600">
              {bestScore.toFixed(1)}점
            </span>
          </div>
        </div>

        {/* All Models Comparison */}
        <div>
          <div className="text-sm font-medium mb-3">📊 전체 모델 비교</div>
          <div className="space-y-2">
            {Object.entries(allModelScores)
              .sort(([,a], [,b]) => b - a)
              .map(([model, score], index) => {
                const isSelected = model === selectedModel
                const isBest = model === bestModel
                const suitabilityLevel = score >= 80 ? '매우 적합' : 
                                       score >= 60 ? '적합' : 
                                       score >= 40 ? '보통' : '부적합'
                
                return (
                  <div 
                    key={model}
                    className={`flex items-center justify-between p-2 rounded ${
                      isSelected ? 'bg-blue-100 border border-blue-300' : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">#{index + 1}</span>
                      <div className="flex flex-col">
                        <span className={`text-sm ${isSelected ? 'font-semibold text-blue-700' : ''}`}>
                          {model} {isBest && <span className="text-xs">🏆</span>}
                        </span>
                        <span className="text-xs text-gray-500">{suitabilityLevel}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded"
                        style={{ 
                          backgroundColor: score >= 80 ? '#22C55E' : 
                                         score >= 60 ? '#EAB308' : 
                                         score >= 40 ? '#F97316' : '#EF4444'
                        }}
                      />
                      <span className={`text-sm ${isSelected ? 'font-semibold' : ''}`}>
                        {score.toFixed(1)}
                      </span>
                    </div>
                  </div>
                )
              })
            }
          </div>
          
          {/* Quick Comparison Chart */}
          <div className="mt-3 p-2 bg-gray-50 rounded-lg">
            <div className="text-xs font-medium mb-2">모델 점수 비교</div>
            <div className="space-y-1">
              {Object.entries(allModelScores)
                .sort(([,a], [,b]) => b - a)
                .map(([model, score]) => (
                  <div key={model} className="flex items-center gap-2">
                    <span className="text-xs w-12 truncate">{model}</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                      <div 
                        className="h-1.5 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${Math.max((score / 100) * 100, 5)}%`,
                          backgroundColor: score >= 80 ? '#22C55E' : 
                                         score >= 60 ? '#EAB308' : 
                                         score >= 40 ? '#F97316' : '#EF4444'
                        }}
                      />
                    </div>
                    <span className="text-xs w-8">{score.toFixed(0)}</span>
                  </div>
                ))
              }
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="bg-yellow-50 p-3 rounded-lg">
          <div className="text-sm font-medium text-yellow-900 mb-2">
            💡 권장사항
          </div>
          <div className="text-xs text-yellow-800">
            {bestModel === selectedModel 
              ? `현재 선택된 ${selectedModel} 모델이 이 지역에 가장 적합합니다.`
              : `${bestModel} 모델이 이 지역에 더 적합할 수 있습니다. (${(bestScore - selectedModelScore).toFixed(1)}점 높음)`
            }
          </div>
        </div>
      </CardContent>
    </Card>
  )
}