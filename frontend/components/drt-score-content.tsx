"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Briefcase, Camera, Heart, Target } from "lucide-react"
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts"

// Month names in Korean
const monthNames = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"]

// 출퇴근족 DRT 분석 데이터
const commuterDRTData = {
  analysisType: "commuter",
  summary: {
    totalStationsAnalyzed: 1838,
    highPriorityStations: 156,
    avgCommuterScore: 67.8,
    coverageDistricts: 25,
  },
  topPriorityStations: [
    {
      stationId: "111001124",
      stationName: "강남역",
      district: "강남구",
      commuterScore: 94.2,
      subScores: {
        morningRushDemand: 89.5,
        eveningRushDemand: 92.1,
        accessibilityScore: 88.3,
        transferConvenience: 96.8,
      },
      recommendations: ["출퇴근 시간대 증차 필요", "인근 지하철역 연계 강화"],
    },
    {
      stationId: "111001125",
      stationName: "여의도역",
      district: "영등포구",
      commuterScore: 91.8,
      subScores: {
        morningRushDemand: 94.2,
        eveningRushDemand: 89.5,
        accessibilityScore: 85.7,
        transferConvenience: 92.3,
      },
      recommendations: ["금융가 연결 노선 확대", "퇴근시간 대기시간 단축"],
    },
    {
      stationId: "111001126",
      stationName: "삼성역",
      district: "강남구",
      commuterScore: 89.4,
      subScores: {
        morningRushDemand: 87.3,
        eveningRushDemand: 91.2,
        accessibilityScore: 86.8,
        transferConvenience: 89.5,
      },
      recommendations: ["IT 단지 연결 강화", "심야 운행 확대"],
    },
  ],
}

// 관광객 DRT 분석 데이터
const tourismDRTData = {
  analysisType: "tourism",
  summary: {
    totalStationsAnalyzed: 1838,
    highPriorityStations: 89,
    avgTourismScore: 58.3,
    coverageDistricts: 25,
  },
  topPriorityStations: [
    {
      stationId: "111001127",
      stationName: "명동역",
      district: "중구",
      tourismScore: 92.7,
      subScores: {
        touristAttraction: 95.8,
        accessibilityScore: 89.2,
        culturalSites: 94.5,
        shoppingConvenience: 91.3,
      },
      recommendations: ["다국어 안내 서비스", "관광지 연계 패키지"],
    },
    {
      stationId: "111001128",
      stationName: "홍대입구역",
      district: "마포구",
      tourismScore: 88.9,
      subScores: {
        touristAttraction: 91.2,
        accessibilityScore: 86.7,
        culturalSites: 89.4,
        shoppingConvenience: 88.3,
      },
      recommendations: ["야간 관광 노선", "클럽가 연결 강화"],
    },
    {
      stationId: "111001129",
      stationName: "경복궁역",
      district: "종로구",
      tourismScore: 85.6,
      subScores: {
        touristAttraction: 94.7,
        accessibilityScore: 78.2,
        culturalSites: 96.8,
        shoppingConvenience: 72.8,
      },
      recommendations: ["고궁 투어 연계", "전통문화 체험 노선"],
    },
  ],
}

// 교통약자 DRT 분석 데이터
const vulnerableDRTData = {
  analysisType: "vulnerable",
  summary: {
    totalStationsAnalyzed: 1838,
    highPriorityStations: 234,
    avgVulnerableScore: 72.1,
    coverageDistricts: 25,
  },
  topPriorityStations: [
    {
      stationId: "111001130",
      stationName: "서울대병원",
      district: "종로구",
      vulnerableScore: 96.8,
      subScores: {
        medicalAccess: 98.5,
        elderlyFriendly: 95.2,
        disabilityAccess: 94.7,
        safetyScore: 97.8,
      },
      recommendations: ["의료진 동행 서비스", "휠체어 접근성 강화"],
    },
    {
      stationId: "111001131",
      stationName: "노원구청",
      district: "노원구",
      vulnerableScore: 93.4,
      subScores: {
        medicalAccess: 89.7,
        elderlyFriendly: 96.8,
        disabilityAccess: 91.2,
        safetyScore: 95.9,
      },
      recommendations: ["복지시설 연계", "저상버스 우선 배치"],
    },
    {
      stationId: "111001132",
      stationName: "보라매병원",
      district: "동작구",
      vulnerableScore: 91.7,
      subScores: {
        medicalAccess: 95.3,
        elderlyFriendly: 88.9,
        disabilityAccess: 89.4,
        safetyScore: 93.2,
      },
      recommendations: ["병원 셔틀 연계", "보호자 동반 할인"],
    },
  ],
}

// 구별 DRT 스코어 순위
const districtRankings = {
  commuter: [
    { district: "강남구", avgScore: 82.1, stationCount: 89, rank: 1 },
    { district: "서초구", avgScore: 79.8, stationCount: 68, rank: 2 },
    { district: "영등포구", avgScore: 76.5, stationCount: 72, rank: 3 },
    { district: "마포구", avgScore: 74.2, stationCount: 65, rank: 4 },
    { district: "용산구", avgScore: 71.8, stationCount: 48, rank: 5 },
  ],
  tourism: [
    { district: "중구", avgScore: 78.9, stationCount: 52, rank: 1 },
    { district: "종로구", avgScore: 76.3, stationCount: 58, rank: 2 },
    { district: "마포구", avgScore: 72.1, stationCount: 65, rank: 3 },
    { district: "용산구", avgScore: 68.7, stationCount: 48, rank: 4 },
    { district: "강남구", avgScore: 65.4, stationCount: 89, rank: 5 },
  ],
  vulnerable: [
    { district: "종로구", avgScore: 84.2, stationCount: 58, rank: 1 },
    { district: "중구", avgScore: 81.7, stationCount: 52, rank: 2 },
    { district: "노원구", avgScore: 79.3, stationCount: 56, rank: 3 },
    { district: "동작구", avgScore: 76.8, stationCount: 42, rank: 4 },
    { district: "서대문구", avgScore: 74.5, stationCount: 38, rank: 5 },
  ],
}

interface DRTScoreContentProps {
  selectedMonth: string
  selectedRegion: string
}

export function DRTScoreContent({ selectedMonth, selectedRegion }: DRTScoreContentProps) {
  return (
    <div className="space-y-6">
      {/* DRT 스코어 개요 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            DRT 스코어 분석 개요
          </CardTitle>
          <CardDescription>수요응답형 교통 최적화를 위한 3가지 유형별 분석</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-blue-50 rounded-lg text-center">
              <Briefcase className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <h3 className="font-medium text-blue-800">출퇴근족 DRT</h3>
              <div className="text-2xl font-bold text-blue-600 mt-2">67.8점</div>
              <p className="text-sm text-blue-600 mt-1">평균 스코어</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg text-center">
              <Camera className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <h3 className="font-medium text-green-800">관광객 DRT</h3>
              <div className="text-2xl font-bold text-green-600 mt-2">58.3점</div>
              <p className="text-sm text-green-600 mt-1">평균 스코어</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg text-center">
              <Heart className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <h3 className="font-medium text-purple-800">교통약자 DRT</h3>
              <div className="text-2xl font-bold text-purple-600 mt-2">72.1점</div>
              <p className="text-sm text-purple-600 mt-1">평균 스코어</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 탭별 상세 분석 */}
      <Tabs defaultValue="commuter" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="commuter" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            출퇴근족
          </TabsTrigger>
          <TabsTrigger value="tourism" className="flex items-center gap-2">
            <Camera className="h-4 w-4" />
            관광객
          </TabsTrigger>
          <TabsTrigger value="vulnerable" className="flex items-center gap-2">
            <Heart className="h-4 w-4" />
            교통약자
          </TabsTrigger>
        </TabsList>

        {/* 출퇴근족 DRT 탭 */}
        <TabsContent value="commuter" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 상위 정류장 */}
            <Card>
              <CardHeader>
                <CardTitle>출퇴근족 DRT 우선 정류장</CardTitle>
                <CardDescription>출퇴근 수요가 높은 상위 정류장</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {commuterDRTData.topPriorityStations.map((station, index) => (
                    <div key={station.stationId} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-medium">{station.stationName}</h4>
                          <p className="text-sm text-muted-foreground">{station.district}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-blue-600">{station.commuterScore}점</div>
                          <Badge variant={index === 0 ? "default" : "secondary"}>
                            {index === 0 ? "최우수" : index === 1 ? "우수" : "양호"}
                          </Badge>
                        </div>
                      </div>

                      {/* 세부 스코어 */}
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>오전 출근 수요</span>
                            <span>{station.subScores.morningRushDemand}점</span>
                          </div>
                          <Progress value={station.subScores.morningRushDemand} className="h-2" />
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>오후 퇴근 수요</span>
                            <span>{station.subScores.eveningRushDemand}점</span>
                          </div>
                          <Progress value={station.subScores.eveningRushDemand} className="h-2" />
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>접근성</span>
                            <span>{station.subScores.accessibilityScore}점</span>
                          </div>
                          <Progress value={station.subScores.accessibilityScore} className="h-2" />
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>환승 편의성</span>
                            <span>{station.subScores.transferConvenience}점</span>
                          </div>
                          <Progress value={station.subScores.transferConvenience} className="h-2" />
                        </div>
                      </div>

                      {/* 추천사항 */}
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <h5 className="font-medium text-blue-800 mb-2">💡 개선 제안</h5>
                        <ul className="text-sm space-y-1">
                          {station.recommendations.map((rec, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-blue-600">•</span>
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 구별 순위 */}
            <Card>
              <CardHeader>
                <CardTitle>구별 출퇴근 DRT 순위</CardTitle>
                <CardDescription>자치구별 출퇴근 DRT 적합성 순위</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={districtRankings.commuter}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="district" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="avgScore" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  {districtRankings.commuter.map((district, index) => (
                    <div key={district.district} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center gap-3">
                        <span className="font-bold">#{district.rank}</span>
                        <span>{district.district}</span>
                        <span className="text-sm text-muted-foreground">({district.stationCount}개 정류장)</span>
                      </div>
                      <span className="font-medium">{district.avgScore}점</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 관광객 DRT 탭 */}
        <TabsContent value="tourism" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 상위 정류장 */}
            <Card>
              <CardHeader>
                <CardTitle>관광객 DRT 우선 정류장</CardTitle>
                <CardDescription>관광 수요가 높은 상위 정류장</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tourismDRTData.topPriorityStations.map((station, index) => (
                    <div key={station.stationId} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-medium">{station.stationName}</h4>
                          <p className="text-sm text-muted-foreground">{station.district}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-600">{station.tourismScore}점</div>
                          <Badge variant={index === 0 ? "default" : "secondary"}>
                            {index === 0 ? "최우수" : index === 1 ? "우수" : "양호"}
                          </Badge>
                        </div>
                      </div>

                      {/* 레이더 차트 */}
                      <div className="h-48 mb-3">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart
                            data={[
                              { subject: "관광명소", score: station.subScores.touristAttraction },
                              { subject: "접근성", score: station.subScores.accessibilityScore },
                              { subject: "문화시설", score: station.subScores.culturalSites },
                              { subject: "쇼핑편의", score: station.subScores.shoppingConvenience },
                            ]}
                          >
                            <PolarGrid />
                            <PolarAngleAxis dataKey="subject" />
                            <PolarRadiusAxis angle={90} domain={[0, 100]} />
                            <Radar dataKey="score" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>

                      {/* 추천사항 */}
                      <div className="p-3 bg-green-50 rounded-lg">
                        <h5 className="font-medium text-green-800 mb-2">💡 개선 제안</h5>
                        <ul className="text-sm space-y-1">
                          {station.recommendations.map((rec, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-green-600">•</span>
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 구별 순위 */}
            <Card>
              <CardHeader>
                <CardTitle>구별 관광 DRT 순위</CardTitle>
                <CardDescription>자치구별 관광 DRT 적합성 순위</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={districtRankings.tourism}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="district" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="avgScore" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  {districtRankings.tourism.map((district, index) => (
                    <div key={district.district} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center gap-3">
                        <span className="font-bold">#{district.rank}</span>
                        <span>{district.district}</span>
                        <span className="text-sm text-muted-foreground">({district.stationCount}개 정류장)</span>
                      </div>
                      <span className="font-medium">{district.avgScore}점</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 교통약자 DRT 탭 */}
        <TabsContent value="vulnerable" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 상위 정류장 */}
            <Card>
              <CardHeader>
                <CardTitle>교통약자 DRT 우선 정류장</CardTitle>
                <CardDescription>교통약자 접근성이 높은 상위 정류장</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {vulnerableDRTData.topPriorityStations.map((station, index) => (
                    <div key={station.stationId} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-medium">{station.stationName}</h4>
                          <p className="text-sm text-muted-foreground">{station.district}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-purple-600">{station.vulnerableScore}점</div>
                          <Badge variant={index === 0 ? "default" : "secondary"}>
                            {index === 0 ? "최우수" : index === 1 ? "우수" : "양호"}
                          </Badge>
                        </div>
                      </div>

                      {/* 세부 스코어 */}
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>의료 접근성</span>
                            <span>{station.subScores.medicalAccess}점</span>
                          </div>
                          <Progress value={station.subScores.medicalAccess} className="h-2" />
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>고령자 친화</span>
                            <span>{station.subScores.elderlyFriendly}점</span>
                          </div>
                          <Progress value={station.subScores.elderlyFriendly} className="h-2" />
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>장애인 접근성</span>
                            <span>{station.subScores.disabilityAccess}점</span>
                          </div>
                          <Progress value={station.subScores.disabilityAccess} className="h-2" />
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>안전성</span>
                            <span>{station.subScores.safetyScore}점</span>
                          </div>
                          <Progress value={station.subScores.safetyScore} className="h-2" />
                        </div>
                      </div>

                      {/* 추천사항 */}
                      <div className="p-3 bg-purple-50 rounded-lg">
                        <h5 className="font-medium text-purple-800 mb-2">💡 개선 제안</h5>
                        <ul className="text-sm space-y-1">
                          {station.recommendations.map((rec, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-purple-600">•</span>
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 구별 순위 */}
            <Card>
              <CardHeader>
                <CardTitle>구별 교통약자 DRT 순위</CardTitle>
                <CardDescription>자치구별 교통약자 DRT 적합성 순위</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={districtRankings.vulnerable}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="district" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="avgScore" fill="#8b5cf6" />
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  {districtRankings.vulnerable.map((district, index) => (
                    <div key={district.district} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center gap-3">
                        <span className="font-bold">#{district.rank}</span>
                        <span>{district.district}</span>
                        <span className="text-sm text-muted-foreground">({district.stationCount}개 정류장)</span>
                      </div>
                      <span className="font-medium">{district.avgScore}점</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* 종합 분석 */}
      <Card>
        <CardHeader>
          <CardTitle>DRT 스코어 종합 분석</CardTitle>
          <CardDescription>3가지 유형별 DRT 적합성 종합 평가</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-3 flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                출퇴근족 DRT 결론
              </h4>
              <div className="text-sm space-y-2">
                <div>
                  • <strong>최적 지역:</strong> 강남구, 서초구, 영등포구
                </div>
                <div>
                  • <strong>핵심 시간:</strong> 오전 7-9시, 오후 6-8시
                </div>
                <div>
                  • <strong>주요 노선:</strong> 업무지구 ↔ 주거지역
                </div>
                <div>
                  • <strong>개선점:</strong> 환승 연계 강화, 증차 필요
                </div>
              </div>
            </div>

            <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
              <h4 className="font-medium text-green-800 mb-3 flex items-center gap-2">
                <Camera className="h-5 w-5" />
                관광객 DRT 결론
              </h4>
              <div className="text-sm space-y-2">
                <div>
                  • <strong>최적 지역:</strong> 중구, 종로구, 마포구
                </div>
                <div>
                  • <strong>핵심 시간:</strong> 오전 10시-오후 6시
                </div>
                <div>
                  • <strong>주요 노선:</strong> 관광지 순환, 문화시설 연계
                </div>
                <div>
                  • <strong>개선점:</strong> 다국어 서비스, 관광패키지
                </div>
              </div>
            </div>

            <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
              <h4 className="font-medium text-purple-800 mb-3 flex items-center gap-2">
                <Heart className="h-5 w-5" />
                교통약자 DRT 결론
              </h4>
              <div className="text-sm space-y-2">
                <div>
                  • <strong>최적 지역:</strong> 종로구, 중구, 노원구
                </div>
                <div>
                  • <strong>핵심 시간:</strong> 오전 9-11시, 오후 2-4시
                </div>
                <div>
                  • <strong>주요 노선:</strong> 병원, 복지시설 연계
                </div>
                <div>
                  • <strong>개선점:</strong> 저상버스, 동행 서비스
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
            <h5 className="font-medium text-yellow-800 mb-3">📋 통합 정책 제언</h5>
            <div className="text-sm space-y-2">
              <div>
                • <strong>지역별 특화:</strong> 각 구의 특성에 맞는 DRT 모델 적용
              </div>
              <div>
                • <strong>시간대별 운영:</strong> 수요 패턴에 따른 탄력적 운영
              </div>
              <div>
                • <strong>연계 교통:</strong> 지하철, 버스와의 환승 할인 확대
              </div>
              <div>
                • <strong>기술 도입:</strong> AI 기반 실시간 배차 시스템 구축
              </div>
              <div>
                • <strong>사회적 가치:</strong> 교통약자 우선 정책 강화
              </div>
            </div>
          </div>

          <CardDescription>
            {monthNames[Number.parseInt(selectedMonth) - 1]} 데이터 (최종 업데이트: 2024-01-30 14:30)
          </CardDescription>
        </CardContent>
      </Card>
    </div>
  )
}
