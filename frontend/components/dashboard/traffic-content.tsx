"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Map, Clock } from "lucide-react"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { memo, useState, useEffect, useMemo } from "react"
import { apiService, TrafficResponse, HeatmapResponse } from "@/lib/api"
import { SeoulMap } from "@/components/map/seoul-map"

// Month names in Korean
const monthNames = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"]

// 지역별 상세 분석 데이터
const detailedRegionData = {
  강남구: {
    peakHourPassengers: 15420,
    boardingAlighting: {
      totalBoarding: 8950,
      totalAlighting: 8670,
      netFlow: 280,
    },
    hourlyPattern: [
      { hour: "06", boarding: 245, alighting: 123 },
      { hour: "07", boarding: 1250, alighting: 456 },
      { hour: "08", boarding: 2100, alighting: 890 },
      { hour: "09", boarding: 1680, alighting: 1340 },
      { hour: "10", boarding: 890, alighting: 950 },
      { hour: "11", boarding: 750, alighting: 820 },
      { hour: "12", boarding: 980, alighting: 1100 },
      { hour: "13", boarding: 850, alighting: 780 },
      { hour: "14", boarding: 720, alighting: 690 },
      { hour: "15", boarding: 950, alighting: 880 },
      { hour: "16", boarding: 1200, alighting: 1050 },
      { hour: "17", boarding: 1450, alighting: 1890 },
      { hour: "18", boarding: 1680, alighting: 2340 },
      { hour: "19", boarding: 1200, alighting: 1560 },
      { hour: "20", boarding: 680, alighting: 750 },
      { hour: "21", boarding: 450, alighting: 520 },
    ],
  },
  마포구: {
    peakHourPassengers: 12850,
    boardingAlighting: {
      totalBoarding: 7420,
      totalAlighting: 7180,
      netFlow: 240,
    },
    hourlyPattern: [
      { hour: "06", boarding: 180, alighting: 95 },
      { hour: "07", boarding: 980, alighting: 340 },
      { hour: "08", boarding: 1650, alighting: 720 },
      { hour: "09", boarding: 1320, alighting: 1080 },
      { hour: "10", boarding: 720, alighting: 780 },
      { hour: "11", boarding: 620, alighting: 680 },
      { hour: "12", boarding: 820, alighting: 920 },
      { hour: "13", boarding: 710, alighting: 650 },
      { hour: "14", boarding: 590, alighting: 560 },
      { hour: "15", boarding: 780, alighting: 720 },
      { hour: "16", boarding: 980, alighting: 850 },
      { hour: "17", boarding: 1180, alighting: 1520 },
      { hour: "18", boarding: 1350, alighting: 1890 },
      { hour: "19", boarding: 980, alighting: 1280 },
      { hour: "20", boarding: 560, alighting: 620 },
      { hour: "21", boarding: 380, alighting: 420 },
    ],
  },
  // 기본값 (전체 또는 다른 지역)
  default: {
    peakHourPassengers: 18500,
    boardingAlighting: {
      totalBoarding: 10500,
      totalAlighting: 10200,
      netFlow: 300,
    },
    hourlyPattern: [
      { hour: "06", boarding: 320, alighting: 180 },
      { hour: "07", boarding: 1580, alighting: 650 },
      { hour: "08", boarding: 2650, alighting: 1200 },
      { hour: "09", boarding: 2100, alighting: 1680 },
      { hour: "10", boarding: 1150, alighting: 1250 },
      { hour: "11", boarding: 980, alighting: 1080 },
      { hour: "12", boarding: 1280, alighting: 1450 },
      { hour: "13", boarding: 1120, alighting: 1020 },
      { hour: "14", boarding: 950, alighting: 890 },
      { hour: "15", boarding: 1250, alighting: 1150 },
      { hour: "16", boarding: 1580, alighting: 1380 },
      { hour: "17", boarding: 1890, alighting: 2450 },
      { hour: "18", boarding: 2180, alighting: 3050 },
      { hour: "19", boarding: 1580, alighting: 2050 },
      { hour: "20", boarding: 890, alighting: 980 },
      { hour: "21", boarding: 580, alighting: 680 },
    ],
  },
}

interface TrafficContentProps {
  selectedMonth: string
  selectedRegion: string
}

export const TrafficContent = memo(function TrafficContent({ selectedMonth, selectedRegion }: TrafficContentProps) {
  console.log('🚀 TrafficContent initialized with:', { selectedMonth, selectedRegion });
  
  const [apiData, setApiData] = useState<TrafficResponse | null>(null);
  const [heatmapData, setHeatmapData] = useState<HeatmapResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDistrictFromMap, setSelectedDistrictFromMap] = useState<string>(selectedRegion);
  const [chartDataType, setChartDataType] = useState<'weekday' | 'weekend'>('weekday'); // 평일/주말 전환

  // 실제 API 데이터 로드
  useEffect(() => {
    const loadApiData = async () => {
      try {
        setLoading(true);
        const currentRegion = selectedDistrictFromMap || selectedRegion;
        const regionType = currentRegion === "전체" ? "seoul" : "district";
        const districtName = currentRegion !== "전체" ? currentRegion : undefined;
        
        console.log('🔍 API 호출 파라미터:', {
          currentRegion,
          regionType,
          districtName,
          selectedDistrictFromMap,
          selectedRegion
        });
        
        // 병렬로 두 API 호출
        const [trafficResponse, heatmapResponse] = await Promise.all([
          apiService.getHourlyTraffic("2025-07-01", regionType, districtName),
          apiService.getSeoulHeatmap("2025-07-01", false) // 히트맵 데이터도 가져오기
        ]);
        
        console.log('🔍 API 응답 확인:', {
          trafficResponse: trafficResponse ? 'OK' : 'NULL',
          hasWeekdayPatterns: !!trafficResponse?.weekday_patterns,
          weekdayPatternsLength: trafficResponse?.weekday_patterns?.length,
          regionName: trafficResponse?.region_name
        });

        // 🔍 실제 API 데이터 값 확인 (상세)
        if (trafficResponse?.weekday_patterns) {
          console.log('🔍 실제 API 데이터 샘플 (첫 5개 시간대):', 
            trafficResponse.weekday_patterns.slice(0, 5).map(p => ({
              hour: p.hour,
              ride: p.avg_ride_passengers,
              alight: p.avg_alight_passengers,
              total: p.avg_total_passengers
            }))
          );
          
          // 8시와 18시 데이터 특별 확인
          const hour8 = trafficResponse.weekday_patterns.find(p => p.hour === 8);
          const hour18 = trafficResponse.weekday_patterns.find(p => p.hour === 18);
          console.log('🔍 피크시간 실제 값:', { hour8, hour18 });
          
          // 전체 데이터 총합 확인
          const totalRide = trafficResponse.weekday_patterns.reduce((sum, p) => sum + (p.avg_ride_passengers || 0), 0);
          const totalAlight = trafficResponse.weekday_patterns.reduce((sum, p) => sum + (p.avg_alight_passengers || 0), 0);
          console.log('🔍 전체 데이터 총합:', { totalRide, totalAlight, total: totalRide + totalAlight });
        }
        
        setApiData(trafficResponse);
        setHeatmapData(heatmapResponse);
      } catch (error) {
        console.error("🚨 API 데이터 로드 실패:", {
          error,
          message: error instanceof Error ? error.message : 'Unknown error',
          currentRegion,
          regionType,
          districtName
        });
      } finally {
        setLoading(false);
      }
    };

    loadApiData();
  }, [selectedRegion, selectedDistrictFromMap]);

  // API 데이터를 Area Chart 형식으로 변환 (useMemo로 최적화)
  const regionData = useMemo(() => {
    console.log('🚀 Chart Data Debug:', {
      hasApiData: !!apiData,
      selectedRegion: selectedDistrictFromMap || selectedRegion,
      apiDataKeys: apiData ? Object.keys(apiData) : 'No API data'
    });

    if (!apiData) {
      console.log('⚠️ Using Mock Data (API data not available)');
      return detailedRegionData.default.hourlyPattern;
    }

    console.log('✅ API Data Available:', {
      weekdayPatterns: apiData.weekday_patterns?.length || 0,
      weekendPatterns: apiData.weekend_patterns?.length || 0,
      sampleWeekday: apiData.weekday_patterns?.[0],
      allHours: apiData.weekday_patterns?.map(p => p.hour) || []
    });

    // 🔍 실제 API 숫자값 확인 (8시, 18시 피크시간)
    const peak8am = apiData.weekday_patterns?.find(p => p.hour === 8);
    const peak6pm = apiData.weekday_patterns?.find(p => p.hour === 18);
    console.log('🔍 API Raw Data Check:', {
      '8시_평일': peak8am,
      '18시_평일': peak6pm,
      '8시_승차': peak8am?.avg_ride_passengers,
      '8시_하차': peak8am?.avg_alight_passengers,
      '18시_승차': peak6pm?.avg_ride_passengers,
      '18시_하차': peak6pm?.avg_alight_passengers
    });

    // 🔍 홀수 시간대 0명 문제 분석 - 모든 시간대 데이터 확인
    console.log('🔍 전체 시간대 데이터 확인 (홀수시간 0명 문제):');
    const weekdayByHour = apiData.weekday_patterns.reduce((acc, p) => {
      acc[p.hour] = { boarding: p.avg_ride_passengers, alighting: p.avg_alight_passengers };
      return acc;
    }, {} as Record<number, { boarding: number, alighting: number }>);
    
    console.table(weekdayByHour);
    
    // 특히 홀수 시간대 확인
    const oddHours = [7, 9, 11, 13, 15, 17, 19, 21];
    console.log('🔍 홀수 시간대 상세 확인:', 
      oddHours.map(h => ({
        hour: h,
        hasData: !!apiData.weekday_patterns.find(p => p.hour === h),
        data: apiData.weekday_patterns.find(p => p.hour === h)
      }))
    );

    const chartData = [];
    
    // 실제 API 데이터가 0-23시 전체를 포함하고 있는지 확인하기 위해 전체 범위로 확장
    const availableHours = apiData.weekday_patterns?.map(p => p.hour).sort((a, b) => a - b) || [];
    console.log('📊 Available hours in API:', availableHours);
    
    // 차트에는 주요 교통시간대만 표시 (6시-22시)
    // 0-5시와 23시는 교통량이 적어 제외하여 차트 가독성 향상
    const startHour = 6;  // 6시부터 (출근 교통 시작)
    const endHour = 22;   // 22시까지 (야간 교통 포함)
    
    console.log(`🕐 Chart range (filtered): ${startHour}시 - ${endHour}시 (의미있는 교통시간대)`);

    for (let hour = startHour; hour <= endHour; hour++) {
      // 선택된 데이터 타입(평일/주말)에 따라 패턴 선택
      const selectedPattern = chartDataType === 'weekday' 
        ? apiData.weekday_patterns.find(p => p.hour === hour)
        : apiData.weekend_patterns.find(p => p.hour === hour);
      
      const rawBoarding = selectedPattern?.avg_ride_passengers || 0;
      const rawAlighting = selectedPattern?.avg_alight_passengers || 0;
      
      // 데이터 스케일링: 소수점 평균을 차트에 적합한 단위로 변환
      // API 데이터가 평균 승객수(소수점)이므로, 시각적 가독성을 위해 적절히 스케일링
      const scalingFactor = 10; // 10배 스케일링으로 적절한 차트 크기 확보
      const scaledBoarding = Math.round(rawBoarding * scalingFactor);
      const scaledAlighting = Math.round(rawAlighting * scalingFactor);
      
      // 🔍 특정 시간대 상세 로그 (8시, 18시만)
      if (hour === 8 || hour === 18) {
        console.log(`🔍 ${hour}시 변환 과정:`, {
          selectedPattern,
          rawBoarding,
          rawAlighting,
          scaledBoarding,
          scaledAlighting,
          hasData: !!selectedPattern
        });
      }
      
      chartData.push({
        hour: hour.toString().padStart(2, '0'),
        boarding: scaledBoarding,
        alighting: scaledAlighting
      });
    }
    
    console.log('📈 Final chart data:', chartData.slice(0, 3), '... (showing first 3)');
    
    // 🔍 모든 데이터가 0인지 확인 (데이터 부재 감지)
    const totalTraffic = chartData.reduce((sum, item) => sum + item.boarding + item.alighting, 0);
    if (totalTraffic === 0) {
      console.log('⚠️ 데이터 부재 감지:', { 
        region: selectedDistrictFromMap || selectedRegion,
        totalTraffic,
        message: '해당 지역의 교통 데이터가 없습니다'
      });
    }
    
    return chartData;
  }, [apiData, chartDataType, selectedDistrictFromMap, selectedRegion]); // 모든 의존성 포함

  // 통계 데이터 계산
  const getRegionStats = () => {
    if (!apiData) {
      return {
        peakHourPassengers: 18500,
        totalBoarding: 10500,
        totalAlighting: 10200,
        netFlow: 300
      };
    }

    const totalWeekday = apiData.total_weekday_passengers;
    const ratio = 0.6; // 승차 비율 추정
    
    return {
      peakHourPassengers: Math.round(totalWeekday * 0.15), // 피크 시간 비율
      totalBoarding: Math.round(totalWeekday * ratio),
      totalAlighting: Math.round(totalWeekday * (1 - ratio)),
      netFlow: Math.round(totalWeekday * (ratio * 2 - 1))
    };
  };

  const stats = getRegionStats();

  // 지도에 표시할 교통량 데이터 생성 (API 데이터 배열을 직접 전달)
  const getMapTrafficData = () => {
    if (!heatmapData) {
      console.log('🚨 No heatmapData available for map')
      return [];
    }
    
    console.log('📍 Generating map traffic data from', heatmapData.districts.length, 'districts')
    const mapData = heatmapData.districts.map(district => ({
      district_name: district.district_name,
      total_traffic: district.total_traffic
    }));
    console.log('📍 Sample map data:', mapData.slice(0, 3))
    return mapData;
  };

  // 지도에서 구 클릭 시 호출
  const handleDistrictClick = (districtName: string, districtCode: string) => {
    console.log(`District clicked: ${districtName} (${districtCode})`);
    setSelectedDistrictFromMap(districtName);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Map className="h-5 w-5" />
              교통 현황 지도
            </CardTitle>
            <CardDescription>서울시 전체 교통량 및 혼잡도</CardDescription>
          </CardHeader>
          <CardContent>
            <SeoulMap
              onDistrictClick={handleDistrictClick}
              selectedDistrict={selectedDistrictFromMap}
              trafficData={getMapTrafficData()}
            />
            <CardDescription className="mt-4">
              {monthNames[Number.parseInt(selectedMonth) - 1]} 데이터 (최종 업데이트: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()})
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>지역별 상세 분석</CardTitle>
            <CardDescription>선택된 지역의 교통 패턴 상세 정보</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                <h4 className="font-medium text-blue-800 flex items-center gap-2">📍 분석 대상 지역</h4>
                <div className="text-lg font-bold text-blue-600 mt-1">
                  {apiData?.region_name || (selectedDistrictFromMap === "전체" ? "서울시 전체" : selectedDistrictFromMap)}
                </div>
                {selectedDistrictFromMap !== selectedRegion && (
                  <div className="text-xs text-blue-600 mt-1">
                    (지도에서 선택: {selectedDistrictFromMap})
                  </div>
                )}
              </div>

              <div className="space-y-4 mt-6">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">⏰ 첨두시간 탑승자</h4>
                  <div className="text-2xl font-bold text-blue-600">
                    {stats.peakHourPassengers.toLocaleString()}명
                  </div>
                  <div className="text-sm text-blue-600 mt-1">
                    {apiData ? 
                      `${apiData.peak_hours.weekday_morning_peak.hour}시, ${apiData.peak_hours.weekday_evening_peak.hour}시 집중` :
                      "오전 8-9시, 오후 6-7시 집중"
                    }
                  </div>
                </div>

                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-green-800 mb-3 flex items-center gap-2">🚌 승하차 통합 데이터</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600">
                        {stats.totalBoarding.toLocaleString()}
                      </div>
                      <div className="text-sm text-green-600">총 승차</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600">
                        {stats.totalAlighting.toLocaleString()}
                      </div>
                      <div className="text-sm text-blue-600">총 하차</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-lg font-bold ${stats.netFlow > 0 ? "text-green-600" : "text-red-600"}`}>
                        {stats.netFlow > 0 ? "+" : ""}{stats.netFlow}
                      </div>
                      <div className="text-sm text-gray-600">순 유입</div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2">📊 지역 특성</h4>
                  <div className="text-sm space-y-1">
                    <div>
                      • 주요 교통 허브:{" "}
                      {selectedDistrictFromMap === "강남구"
                        ? "강남역, 역삼역"
                        : selectedDistrictFromMap === "마포구"
                          ? "홍대입구역, 합정역"
                          : selectedDistrictFromMap === "종로구"
                            ? "종로3가역, 을지로3가역"
                            : selectedDistrictFromMap === "중구"
                              ? "명동역, 서울역"
                              : "주요역 2-3개"}
                    </div>
                    <div>
                      • 주요 시설:{" "}
                      {selectedDistrictFromMap === "강남구"
                        ? "업무지구, 상업시설"
                        : selectedDistrictFromMap === "마포구"
                          ? "대학가, 문화시설"
                          : selectedDistrictFromMap === "종로구"
                            ? "관광지, 전통시장"
                            : selectedDistrictFromMap === "중구"
                              ? "상업지구, 금융센터"
                              : "복합시설"}
                    </div>
                    <div>
                      • 교통 특성:{" "}
                      {selectedDistrictFromMap === "강남구"
                        ? "출퇴근 집중형"
                        : selectedDistrictFromMap === "마포구"
                          ? "문화·여가형"
                          : selectedDistrictFromMap === "종로구"
                            ? "관광·전통형"
                            : selectedDistrictFromMap === "중구"
                              ? "상업·업무형"
                              : "복합형"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <CardDescription className="mt-4">
              {monthNames[Number.parseInt(selectedMonth) - 1]} 데이터 (최종 업데이트: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()})
            </CardDescription>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                시간대별 승하차 패턴
                {selectedDistrictFromMap !== "전체" && (
                  <span className="text-sm font-normal text-blue-600 bg-blue-50 px-2 py-1 rounded">
                    서울시 전체 기준
                  </span>
                )}
              </CardTitle>
              <CardDescription>
                {selectedDistrictFromMap !== "전체" && (
                  <>
                    <span className="text-orange-600 font-medium">
                      📍 {selectedDistrictFromMap} 선택됨 - 
                    </span>{" "}
                  </>
                )}
                {chartDataType === 'weekday' ? '평일' : '주말'} 6시-22시 승차/하차 변화 추이 
                {selectedDistrictFromMap !== "전체" && (
                  <span className="text-gray-600">
                    (구별 상세 데이터 준비 중, 서울시 전체 패턴 표시)
                  </span>
                )}
                {loading && " (데이터 로딩 중...)"}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant={chartDataType === 'weekday' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setChartDataType('weekday')}
                disabled={loading}
              >
                평일
              </Button>
              <Button
                variant={chartDataType === 'weekend' ? 'default' : 'outline'}
                size="sm" 
                onClick={() => setChartDataType('weekend')}
                disabled={loading}
              >
                주말
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {(() => {
            const totalTraffic = regionData.reduce((sum, item) => sum + item.boarding + item.alighting, 0);
            const hasData = totalTraffic > 0;
            
            if (!hasData) {
              return (
                <div className="h-[400px] flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <div className="text-center space-y-3">
                    <div className="text-4xl">📊</div>
                    <div className="space-y-1">
                      <h3 className="font-medium text-gray-900">
                        {selectedDistrictFromMap || selectedRegion} 데이터 준비 중
                      </h3>
                      <p className="text-sm text-gray-600">
                        해당 지역의 2025년 7월 교통 데이터가 아직 준비되지 않았습니다.
                      </p>
                      <p className="text-xs text-gray-500">
                        다른 지역을 선택하거나 잠시 후 다시 시도해주세요.
                      </p>
                    </div>
                  </div>
                </div>
              );
            }
            
            return (
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={regionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis label={{ value: '승객 수 (x10)', angle: -90, position: 'insideLeft' }} />
                  <Tooltip 
                    formatter={(value: number, name: string) => [
                      `${value}명 (평균 ${(value / 10).toFixed(1)}명)`, 
                      name
                    ]}
                    labelFormatter={(hour: string) => `${hour}시`}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="boarding"
                    stackId="1"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.6}
                    name="승차"
                  />
                  <Area
                    type="monotone"
                    dataKey="alighting"
                    stackId="2"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.6}
                    name="하차"
                  />
                </AreaChart>
              </ResponsiveContainer>
            );
          })()}
          <div className="mt-4 space-y-2">
            <CardDescription>
              {monthNames[Number.parseInt(selectedMonth) - 1]} 데이터 (최종 업데이트: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()})
            </CardDescription>
            <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
              💡 <strong>데이터 안내:</strong> 차트는 시각적 가독성을 위해 평균 승객수를 10배 스케일링하여 표시합니다. 
              실제 평균값은 마우스 호버 시 툴팁에서 확인할 수 있습니다.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
})
