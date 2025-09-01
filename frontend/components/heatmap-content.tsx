"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MapPin, TrendingUp, Users, Navigation } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { useState, useEffect } from "react"
import { apiService, HeatmapResponse, DistrictData, StationData } from "@/lib/api"
import { HeatmapSeoulMap } from "@/components/map/heatmap-seoul-map"

// Month names in Korean
const monthNames = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"]

interface HeatmapContentProps {
  selectedMonth: string
  selectedRegion: string
}

export function HeatmapContent({ selectedMonth, selectedRegion }: HeatmapContentProps) {
  const [viewMode, setViewMode] = useState<"district" | "station">("district")
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null)
  const [heatmapData, setHeatmapData] = useState<HeatmapResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // API 데이터 로드
  useEffect(() => {
    const loadHeatmapData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        console.log('🗺️ Loading heatmap data for month:', selectedMonth)
        
        const response = await apiService.getSeoulHeatmap(
          "2025-07-01", // 교통분석 탭과 동일한 날짜 사용
          true // 항상 정류장 상세 정보 포함 (정류장별 모드에서 필요)
        )
        
        console.log('🗺️ Heatmap API response:', response)
        setHeatmapData(response)
      } catch (err) {
        console.error('🚨 Heatmap API error:', err)
        setError(err instanceof Error ? err.message : 'Failed to load heatmap data')
      } finally {
        setLoading(false)
      }
    }

    loadHeatmapData()
  }, [selectedMonth]) // viewMode 제거 - API는 한 번만 호출하고 클라이언트에서 필터링

  // 선택된 지역에 따른 데이터 필터링
  const filteredDistricts = heatmapData?.districts.filter(d => 
    selectedRegion === "전체" ? true : d.district_name === selectedRegion
  ) || []
  
  // 랭킹을 위한 정렬된 구 데이터
  const rankedDistricts = [...filteredDistricts]
    .sort((a, b) => b.total_traffic - a.total_traffic)
    .map((district, index) => ({ ...district, rank: index + 1 }))
  
  // 상위 정류장 데이터 (모든 구의 정류장 중 상위 5개)
  const topStations = heatmapData?.districts
    .flatMap(d => d.stations || [])
    .sort((a, b) => b.total_traffic - a.total_traffic)
    .slice(0, 5) || []
  
  // 지도에서 구 클릭 시 호출
  const handleDistrictClick = (districtName: string, districtCode: string) => {
    console.log(`District clicked: ${districtName} (${districtCode})`)
    setSelectedDistrict(districtName)
  }

  // 로딩 상태 표시
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-600">히트맵 데이터 로딩 중...</p>
          </div>
        </div>
      </div>
    )
  }

  // 에러 상태 표시
  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-500">
              <p className="font-medium">데이터 로드 실패</p>
              <p className="text-sm mt-2">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 컨트롤 패널 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            서울시 교통량 히트맵 제어판
          </CardTitle>
          <CardDescription>지도 시각화 옵션 및 필터 설정</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">보기 모드:</label>
              <Select value={viewMode} onValueChange={(value: "district" | "station") => setViewMode(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="district">구별 집계</SelectItem>
                  <SelectItem value="station">정류장별</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" size="sm">
              <Navigation className="h-4 w-4 mr-2" />
              지도 중심 이동
            </Button>
            <Button variant="outline" size="sm">
              전체 화면
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 메인 히트맵 */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>서울시 교통량 히트맵</CardTitle>
              <CardDescription>{viewMode === "district" ? "25개 자치구별" : "정류장별"} 교통량 시각화</CardDescription>
            </CardHeader>
            <CardContent>
              <HeatmapSeoulMap
                onDistrictClick={handleDistrictClick}
                selectedDistrict={selectedDistrict}
                districts={filteredDistricts}
                viewMode={viewMode}
                loading={loading}
              />
              <CardDescription>
                {monthNames[Number.parseInt(selectedMonth) - 1]} 데이터 (최종 업데이트: 2024-01-30 14:30)
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* 사이드 패널 */}
        <div className="space-y-6">
          {/* 교통량 순위 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                교통량 TOP 10
              </CardTitle>
              <CardDescription>구별 교통량 순위</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {rankedDistricts.slice(0, 10).map((district, index) => (
                  <div
                    key={`${district.sgg_code}-${district.district_name}-${index}`}
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedDistrict === district.district_name
                        ? "bg-blue-50 border border-blue-200"
                        : "bg-gray-50 hover:bg-gray-100"
                    }`}
                    onClick={() => setSelectedDistrict(district.district_name)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-center">
                        <div className="text-lg font-bold">#{district.rank}</div>
                      </div>
                      <div>
                        <h4 className="font-medium">{district.district_name}</h4>
                        <p className="text-sm text-muted-foreground">정류장 {district.stations?.length || 0}개</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-blue-600">{district.total_traffic.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">일평균 {Math.round(district.avg_daily_traffic).toLocaleString()}명</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 상위 정류장 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                주요 정류장
              </CardTitle>
              <CardDescription>교통량 상위 정류장</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topStations.length > 0 ? (
                  topStations.map((station, index) => (
                    <div key={station.station_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="text-center">
                          <div className="text-lg font-bold">#{index + 1}</div>
                        </div>
                        <div>
                          <h4 className="font-medium">{station.station_name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {heatmapData?.districts.find(d => 
                              d.stations?.some(s => s.station_id === station.station_id)
                            )?.district_name}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-600">{station.total_traffic.toLocaleString()}</div>
                        <div className="text-sm text-muted-foreground">명/월</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    {viewMode === 'station' ? '정류장 데이터를 로딩 중입니다...' : '정류장별 모드를 선택하세요'}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 통계 요약 */}
          <Card>
            <CardHeader>
              <CardTitle>통계 요약</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">📊 전체 현황</h4>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span>총 교통량:</span>
                      <span className="font-medium">
                        {heatmapData?.statistics.total_seoul_traffic.toLocaleString()}명
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>총 정류장:</span>
                      <span className="font-medium">
                        {heatmapData?.statistics.total_stations.toLocaleString()}개
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>총 자치구:</span>
                      <span className="font-medium">{filteredDistricts.length}개</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-green-800 mb-2">📈 분포 현황</h4>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span>최대:</span>
                      <span className="font-medium">
                        {heatmapData?.statistics.max_district_traffic.toLocaleString()}명
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>최소:</span>
                      <span className="font-medium">
                        {heatmapData?.statistics.min_district_traffic.toLocaleString()}명
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>3분위값:</span>
                      <span className="font-medium">
                        {heatmapData?.statistics.district_traffic_quartiles[2]?.toLocaleString()}명
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 구별 상세 차트 */}
      <Card>
        <CardHeader>
          <CardTitle>구별 교통량 상세 분석</CardTitle>
          <CardDescription>25개 자치구 교통량 및 밀도 점수 비교</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={rankedDistricts.map(d => ({
              district: d.district_name,
              totalTraffic: Math.round(d.total_traffic / 1000), // 천 단위로 변환 
              densityScore: d.traffic_density_score,
              avgDaily: Math.round(d.avg_daily_traffic / 1000) // 천 단위로 변환
            }))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="district" angle={-45} textAnchor="end" height={100} />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip 
                formatter={(value: any, name: string) => [
                  name === "totalTraffic" || name === "avgDaily" ? `${value}천명` : value,
                  name === "totalTraffic" ? "총 교통량" : 
                  name === "avgDaily" ? "일평균 교통량" : "밀도 점수"
                ]}
                labelFormatter={(label) => `${label}`}
              />
              <Legend />
              <Bar yAxisId="left" dataKey="totalTraffic" fill="#3b82f6" name="총 교통량 (천명)" />
              <Bar yAxisId="right" dataKey="densityScore" fill="#10b981" name="밀도 점수" />
            </BarChart>
          </ResponsiveContainer>
          <CardDescription>
            {monthNames[Number.parseInt(selectedMonth) - 1]} 데이터 (최종 업데이트: 2024-01-30 14:30)
          </CardDescription>
        </CardContent>
      </Card>
    </div>
  )
}
