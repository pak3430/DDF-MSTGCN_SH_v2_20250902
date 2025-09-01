"use client"

import { useState, lazy, Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import {
  RefreshCw,
  Settings,
  FileText,
  BarChart3,
  Map,
  Home,
  Activity,
  Brain,
  ChevronRight,
  Bell,
  Target,
  AlertTriangle,
} from "lucide-react"

// Lazy load components for better performance
const DashboardContent = lazy(() =>
  import("./dashboard/dashboard-content").then((m) => ({ default: m.DashboardContent })),
)
const TrafficContent = lazy(() => import("./dashboard/traffic-content").then((m) => ({ default: m.TrafficContent })))
const DemandContent = lazy(() => import("./dashboard/demand-content").then((m) => ({ default: m.DemandContent })))
const HeatmapContent = lazy(() => import("./heatmap-content").then((m) => ({ default: m.HeatmapContent })))
const AnomalyContent = lazy(() => import("./anomaly-content").then((m) => ({ default: m.AnomalyContent })))
const DRTScoreContent = lazy(() => import("./drt-score-content").then((m) => ({ default: m.DRTScoreContent })))
const RouteAnalysisContent = lazy(() =>
  import("./route-analysis-content").then((m) => ({ default: m.RouteAnalysisContent })),
)

type ActivePage =
  | "dashboard"
  | "traffic"
  | "heatmap"
  | "anomaly"
  | "drt-score"
  | "demand"
  | "routes"
  | "reports"
  | "settings"

// Month names in Korean
const monthNames = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"]

// Seoul Districts Data
const seoulDistricts = [
  "강남구",
  "강동구",
  "강북구",
  "강서구",
  "관악구",
  "광진구",
  "구로구",
  "금천구",
  "노원구",
  "도봉구",
  "동대문구",
  "동작구",
  "마포구",
  "서대문구",
  "서초구",
  "성동구",
  "성북구",
  "송파구",
  "양천구",
  "영등포구",
  "용산구",
  "은평구",
  "종로구",
  "중구",
  "중랑구",
]

const vulnerableAreas = [
  { rank: 1, area: "금천구 시흥동", score: 92, population: 15000, accessibility: "매우낮음", priority: "최우선" },
  { rank: 2, area: "강서구 가양동", score: 88, population: 22000, accessibility: "낮음", priority: "최우선" },
  { rank: 3, area: "구로구 항동", score: 85, population: 18000, accessibility: "낮음", priority: "우선" },
  { rank: 4, area: "영등포구 신길동", score: 82, population: 25000, accessibility: "보통", priority: "우선" },
  { rank: 5, area: "동작구 상도동", score: 78, population: 20000, accessibility: "보통", priority: "검토" },
]

// Loading component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
)

export function DDFDashboard() {
  const [activePage, setActivePage] = useState<ActivePage>("dashboard")
  const [selectedRegion, setSelectedRegion] = useState("전체")
  const [selectedModel, setSelectedModel] = useState("교통취약지")
  const [isRealTimeMode, setIsRealTimeMode] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState<string>("1")

  // Navigation items
  const navigationItems = [
    { id: "dashboard", label: "대시보드 개요", icon: Home },
    { id: "traffic", label: "교통 분석", icon: Activity },
    { id: "heatmap", label: "교통량 히트맵", icon: Map },
    { id: "anomaly", label: "이상 패턴 감지", icon: AlertTriangle },
    { id: "drt-score", label: "DRT 스코어 분석", icon: Target },
    { id: "demand", label: "수요 예측", icon: Brain },
    { id: "routes", label: "노선 분석", icon: Map },
    { id: "reports", label: "리포트", icon: FileText },
    { id: "settings", label: "설정", icon: Settings },
  ]

  // Render different page content based on active page
  const renderPageContent = () => {
    switch (activePage) {
      case "dashboard":
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <DashboardContent selectedMonth={selectedMonth} />
          </Suspense>
        )
      case "traffic":
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <TrafficContent selectedMonth={selectedMonth} selectedRegion={selectedRegion} />
          </Suspense>
        )
      case "heatmap":
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <HeatmapContent selectedMonth={selectedMonth} selectedRegion={selectedRegion} />
          </Suspense>
        )
      case "anomaly":
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <AnomalyContent selectedMonth={selectedMonth} selectedRegion={selectedRegion} />
          </Suspense>
        )
      case "drt-score":
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <DRTScoreContent selectedMonth={selectedMonth} selectedRegion={selectedRegion} />
          </Suspense>
        )
      case "demand":
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <DemandContent
              selectedModel={selectedModel}
              setSelectedModel={setSelectedModel}
              selectedMonth={selectedMonth}
              selectedRegion={selectedRegion}
            />
          </Suspense>
        )
      case "routes":
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <RouteAnalysisContent selectedMonth={selectedMonth} selectedRegion={selectedRegion} />
          </Suspense>
        )
      case "reports":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>월간 성과 리포트</CardTitle>
                  <CardDescription>주요 성과 지표 요약</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">📈 교통량 분석</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-lg font-bold text-blue-600">64.2%</div>
                          <div className="text-sm text-blue-600">평균 교통량 지수</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-green-600">+5.8%</div>
                          <div className="text-sm text-green-600">전월 대비 증가</div>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-green-50 rounded-lg">
                      <h4 className="font-medium text-green-800 mb-2 flex items-center gap-2">🎯 수요 예측 정확도</h4>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="text-center">
                          <div className="text-lg font-bold text-green-600">97.2%</div>
                          <div className="text-xs text-green-600">교통취약지</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-blue-600">94.8%</div>
                          <div className="text-xs text-blue-600">출퇴근</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-yellow-600">91.5%</div>
                          <div className="text-xs text-yellow-600">관광형</div>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-purple-50 rounded-lg">
                      <h4 className="font-medium text-purple-800 mb-2 flex items-center gap-2">🚌 서비스 품질</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>평균 대기시간:</span>
                          <span className="font-medium">6.2분</span>
                        </div>
                        <div className="flex justify-between">
                          <span>서비스 범위:</span>
                          <span className="font-medium">95%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>고객 만족도:</span>
                          <span className="font-medium">4.2/5.0</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <CardDescription>
                    {monthNames[Number.parseInt(selectedMonth) - 1]} 데이터 (최종 업데이트: 2024-01-30 14:30)
                  </CardDescription>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>취약지역 개선 현황</CardTitle>
                  <CardDescription>교통취약지역 접근성 개선 효과</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {vulnerableAreas.slice(0, 5).map((area) => (
                      <div key={area.rank} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="text-center">
                            <div className="text-lg font-bold">#{area.rank}</div>
                          </div>
                          <div>
                            <h4 className="font-medium">{area.area}</h4>
                            <p className="text-sm text-muted-foreground">인구 {area.population.toLocaleString()}명</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-blue-600">{area.score}점</div>
                          <Badge
                            variant={
                              area.priority === "최우선"
                                ? "destructive"
                                : area.priority === "우선"
                                  ? "secondary"
                                  : "outline"
                            }
                          >
                            {area.priority}
                          </Badge>
                        </div>
                      </div>
                    ))}
                    <div className="mt-4 p-4 bg-green-50 rounded-lg">
                      <h5 className="font-medium text-green-800 mb-2">📊 개선 효과</h5>
                      <div className="text-sm space-y-1">
                        <div>• 접근성 개선: 평균 25% 향상</div>
                        <div>• 이동시간 단축: 평균 12분 감소</div>
                        <div>• 교통비 절약: 월 평균 4.8만원</div>
                      </div>
                    </div>
                  </div>
                  <CardDescription>
                    {monthNames[Number.parseInt(selectedMonth) - 1]} 데이터 (최종 업데이트: 2024-01-30 14:30)
                  </CardDescription>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>경제성 종합 평가</CardTitle>
                <CardDescription>DRT 시스템의 종합적 경제성 평가</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-4 bg-red-50 rounded-lg text-center">
                    <h5 className="font-medium text-red-800 mb-2">💸 재정적 ROI</h5>
                    <div className="text-3xl font-bold text-red-600">-61.0%</div>
                    <div className="text-sm text-red-600 mt-1">5년 기준</div>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg text-center">
                    <h5 className="font-medium text-green-800 mb-2">🌱 사회적 ROI</h5>
                    <div className="text-3xl font-bold text-green-600">+12.8%</div>
                    <div className="text-sm text-green-600 mt-1">사회적 편익 포함</div>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg text-center">
                    <h5 className="font-medium text-blue-800 mb-2">⚖️ 종합 평가</h5>
                    <div className="text-3xl font-bold text-blue-600">B+</div>
                    <div className="text-sm text-blue-600 mt-1">도입 권장</div>
                  </div>
                </div>
                <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
                  <h5 className="font-medium text-yellow-800 mb-3">📋 정책 제언</h5>
                  <div className="text-sm space-y-2">
                    <div>• 초기 3년간 정부 보조금 확대 필요</div>
                    <div>• 타 교통수단과의 연계 할인 도입</div>
                    <div>• 취약계층 대상 요금 할인 정책 검토</div>
                    <div>• 단계적 서비스 지역 확대 전략 수립</div>
                  </div>
                </div>
                <CardDescription>
                  {monthNames[Number.parseInt(selectedMonth) - 1]} 데이터 (최종 업데이트: 2024-01-30 14:30)
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        )
      case "settings":
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>설정</CardTitle>
                <CardDescription>시스템 설정</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">⚙️ 자동 업데이트 설정</h4>
                    <div className="flex items-center gap-2">
                      <Switch checked={isRealTimeMode} onCheckedChange={setIsRealTimeMode} />
                      <span className="text-sm">자동 업데이트 활성화</span>
                    </div>
                  </div>

                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-medium text-green-800 mb-3 flex items-center gap-2">📈 데이터 범위 설정</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <Label>지역 선택</Label>
                        <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="전체">전체 지역</SelectItem>
                            {seoulDistricts.map((district) => (
                              <SelectItem key={district} value={district}>
                                {district}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="text-center">
                        <Label>월 선택</Label>
                        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {monthNames.map((month, index) => (
                              <SelectItem key={index + 1} value={(index + 1).toString()}>
                                {month}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
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
      default:
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <DashboardContent selectedMonth={selectedMonth} />
          </Suspense>
        )
    }
  }

  return (
    <SidebarProvider>
      <Sidebar className="border-r">
        <SidebarHeader className="border-b px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <BarChart3 className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">DDF 대시보드</h2>
              <p className="text-xs text-muted-foreground">DRT 수요예측 시스템</p>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent className="px-4 py-4">
          {/* Navigation Menu */}
          <SidebarGroup>
            <SidebarGroupLabel>메뉴</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navigationItems.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      onClick={() => setActivePage(item.id as ActivePage)}
                      isActive={activePage === item.id}
                      className="w-full justify-start"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                      {activePage === item.id && <ChevronRight className="ml-auto h-4 w-4" />}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Quick Stats */}
          <SidebarGroup>
            <SidebarGroupLabel>최신 현황</SidebarGroupLabel>
            <SidebarGroupContent>
              <div className="space-y-3 px-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">교통량</span>
                  <span className="font-medium">64.2%</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">평균속도</span>
                  <span className="font-medium">36.8km/h</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">수요예측</span>
                  <span className="font-medium">18,500</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">취약지</span>
                  <span className="font-medium">10개 지역</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">시스템</span>
                  <Badge variant="default" className="text-xs">
                    정상
                  </Badge>
                </div>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarRail />
      </Sidebar>

      <SidebarInset>
        {/* Header */}
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-6">
          <SidebarTrigger className="-ml-1" />
          <div className="flex flex-1 items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold">
                {navigationItems.find((item) => item.id === activePage)?.label || "대시보드"}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="전체">전체 지역</SelectItem>
                  {seoulDistricts.map((district) => (
                    <SelectItem key={district} value={district}>
                      {district}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {monthNames.map((month, index) => (
                    <SelectItem key={index + 1} value={(index + 1).toString()}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <Switch checked={isRealTimeMode} onCheckedChange={setIsRealTimeMode} />
                <span className="text-sm">자동 업데이트</span>
              </div>
              <Button variant="outline" size="icon">
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon">
                <Bell className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-6">{renderPageContent()}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
