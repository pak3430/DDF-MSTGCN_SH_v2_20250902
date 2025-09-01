"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Target } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Legend,
} from "recharts";
import { memo, useState, useEffect } from "react";
import { apiService, DRTScoreResponse, DRTModelType } from "@/lib/api";
import { ModelSuitabilityMap } from "@/components/map/model-suitability-map";
import { DistrictAnalysisPanel } from "@/components/dashboard/district-analysis-panel";

// Month names in Korean
const monthNames = [
  "1월",
  "2월",
  "3월",
  "4월",
  "5월",
  "6월",
  "7월",
  "8월",
  "9월",
  "10월",
  "11월",
  "12월",
];

// UI 모델명을 API 모델 타입으로 매핑
const modelTypeMapping: Record<string, DRTModelType> = {
  교통취약지: "vulnerable",
  출퇴근: "commuter",
  관광형: "tourism",
};

// API 모델 타입을 UI 모델명으로 역매핑
const reverseModelMapping: Record<DRTModelType, string> = {
  vulnerable: "교통취약지",
  commuter: "출퇴근",
  tourism: "관광형",
};

const mstGcnModels = [
  { model: "교통취약지", accuracy: 97.2, prediction: 18500, confidence: 95 },
  { model: "출퇴근", accuracy: 94.8, prediction: 22300, confidence: 92 },
  { model: "관광형", accuracy: 91.5, prediction: 15800, confidence: 88 },
];

// 모델별 시간대별 수요 패턴 데이터
const demandPatterns = {
  교통취약지: [
    { hour: "06", time: "06시", demand: 800, medical: 200 },
    { hour: "07", time: "07시", demand: 1200, medical: 400 },
    { hour: "08", time: "08시", demand: 1800, medical: 600 },
    { hour: "09", time: "09시", demand: 2800, medical: 1200 }, // 의료시간 피크
    { hour: "10", time: "10시", demand: 3200, medical: 1500 },
    { hour: "11", time: "11시", demand: 2900, medical: 1300 },
    { hour: "12", time: "12시", demand: 2200, medical: 800 },
    { hour: "13", time: "13시", demand: 2000, medical: 600 },
    { hour: "14", time: "14시", demand: 2800, medical: 1000 }, // 복지시간 피크
    { hour: "15", time: "15시", demand: 3000, medical: 1100 },
    { hour: "16", time: "16시", demand: 2600, medical: 900 },
    { hour: "17", time: "17시", demand: 2200, medical: 700 },
    { hour: "18", time: "18시", demand: 2600, medical: 800 }, // 저녁시간
    { hour: "19", time: "19시", demand: 2400, medical: 700 },
    { hour: "20", time: "20시", demand: 1800, medical: 500 },
    { hour: "21", time: "21시", demand: 1200, medical: 300 },
  ],
  출퇴근: [
    { hour: "06", time: "06시", demand: 1200, commute: 800 },
    { hour: "07", time: "07시", demand: 2800, commute: 2400 }, // 출근 피크 시작
    { hour: "08", time: "08시", demand: 3200, commute: 2900 }, // 출근 피크
    { hour: "09", time: "09시", demand: 2600, commute: 2200 },
    { hour: "10", time: "10시", demand: 1400, commute: 800 },
    { hour: "11", time: "11시", demand: 1200, commute: 600 },
    { hour: "12", time: "12시", demand: 1600, commute: 800 }, // 점심시간
    { hour: "13", time: "13시", demand: 1400, commute: 700 },
    { hour: "14", time: "14시", demand: 1000, commute: 400 },
    { hour: "15", time: "15시", demand: 1200, commute: 500 },
    { hour: "16", time: "16시", demand: 1800, commute: 1000 },
    { hour: "17", time: "17시", demand: 3000, commute: 2600 }, // 퇴근 피크 시작
    { hour: "18", time: "18시", demand: 3200, commute: 2800 }, // 퇴근 피크
    { hour: "19", time: "19시", demand: 2400, commute: 1800 },
    { hour: "20", time: "20시", demand: 1600, commute: 900 },
    { hour: "21", time: "21시", demand: 1000, commute: 400 },
  ],
  관광형: [
    { hour: "06", time: "06시", demand: 400, tourism: 100 },
    { hour: "07", time: "07시", demand: 600, tourism: 200 },
    { hour: "08", time: "08시", demand: 1000, tourism: 400 },
    { hour: "09", time: "09시", demand: 1400, tourism: 800 },
    { hour: "10", time: "10시", demand: 2200, tourism: 1600 }, // 관광 시작
    { hour: "11", time: "11시", demand: 2800, tourism: 2200 },
    { hour: "12", time: "12시", demand: 2600, tourism: 2000 },
    { hour: "13", time: "13시", demand: 2400, tourism: 1800 },
    { hour: "14", time: "14시", demand: 3000, tourism: 2400 }, // 관광 피크
    { hour: "15", time: "15시", demand: 3200, tourism: 2600 }, // 관광 피크
    { hour: "16", time: "16시", demand: 2800, tourism: 2200 },
    { hour: "17", time: "17시", demand: 2200, tourism: 1600 },
    { hour: "18", time: "18시", demand: 1800, tourism: 1200 },
    { hour: "19", time: "19시", demand: 1400, tourism: 800 },
    { hour: "20", time: "20시", demand: 1000, tourism: 500 },
    { hour: "21", time: "21시", demand: 600, tourism: 200 },
  ],
};

interface DemandContentProps {
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  selectedMonth: string;
  selectedRegion: string;
}

export const DemandContent = memo(function DemandContent({
  selectedModel,
  setSelectedModel,
  selectedMonth,
  selectedRegion,
}: DemandContentProps) {
  const [drtData, setDrtData] = useState<DRTScoreResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [districtAnalysis, setDistrictAnalysis] = useState<any>(null);
  const [selectedDistrictName, setSelectedDistrictName] = useState<string>("");

  // 선택된 구에 따른 동적 수요 패턴 생성
  const generateDistrictPatterns = (
    districtName: string,
    modelType: string,
    baseData?: DRTScoreResponse
  ) => {
    // 구별 기본 특성 계수 (실제 DRT 데이터 기반으로 조정)
    const districtCharacteristics: Record<
      string,
      {
        trafficMultiplier: number;
        peakShift: number;
        modelBoost: Record<string, number>;
      }
    > = {
      강남구: {
        trafficMultiplier: 1.4,
        peakShift: 0,
        modelBoost: { 출퇴근: 1.3, 관광형: 1.2, 교통취약지: 0.9 },
      },
      서초구: {
        trafficMultiplier: 1.3,
        peakShift: 0,
        modelBoost: { 출퇴근: 1.3, 관광형: 1.1, 교통취약지: 0.9 },
      },
      송파구: {
        trafficMultiplier: 1.2,
        peakShift: 1,
        modelBoost: { 출퇴근: 1.1, 관광형: 1.3, 교통취약지: 1.0 },
      },
      마포구: {
        trafficMultiplier: 1.1,
        peakShift: 0,
        modelBoost: { 관광형: 1.4, 출퇴근: 1.0, 교통취약지: 1.1 },
      },
      중구: {
        trafficMultiplier: 1.0,
        peakShift: -1,
        modelBoost: { 관광형: 1.5, 출퇴근: 0.9, 교통취약지: 1.2 },
      },
      종로구: {
        trafficMultiplier: 1.0,
        peakShift: -1,
        modelBoost: { 관광형: 1.4, 출퇴근: 0.9, 교통취약지: 1.3 },
      },
      영등포구: {
        trafficMultiplier: 1.2,
        peakShift: 0,
        modelBoost: { 출퇴근: 1.2, 관광형: 0.9, 교통취약지: 1.1 },
      },
      용산구: {
        trafficMultiplier: 1.1,
        peakShift: 0,
        modelBoost: { 관광형: 1.2, 출퇴근: 1.1, 교통취약지: 1.0 },
      },
      // 기타 구는 기본값 사용
      default: {
        trafficMultiplier: 1.0,
        peakShift: 0,
        modelBoost: { 교통취약지: 1.0, 출퇴근: 1.0, 관광형: 1.0 },
      },
    };

    const characteristics =
      districtCharacteristics[districtName] ||
      districtCharacteristics["default"];
    const modelBoost = characteristics.modelBoost[modelType] || 1.0;
    const trafficMult = characteristics.trafficMultiplier;
    const peakShift = characteristics.peakShift;

    // 실제 DRT 데이터가 있으면 활용
    const avgDRTScore =
      baseData?.stations.reduce((sum, station) => sum + station.drt_score, 0) /
        (baseData?.stations.length || 1) || 50;
    const drtMultiplier = Math.max(avgDRTScore / 50, 0.3); // 0.3 ~ 2.0 범위

    return demandPatterns[modelType as keyof typeof demandPatterns].map(
      (item, index) => ({
        ...item,
        demand: Math.round(
          item.demand * trafficMult * modelBoost * drtMultiplier
        ),
        [modelType === "교통취약지"
          ? "medical"
          : modelType === "출퇴근"
          ? "commute"
          : "tourism"]: Math.round(
          item[
            modelType === "교통취약지"
              ? "medical"
              : modelType === "출퇴근"
              ? "commute"
              : "tourism"
          ] *
            trafficMult *
            modelBoost *
            drtMultiplier
        ),
      })
    );
  };

  // 선택된 구에 따른 동적 모델 특성 데이터 생성
  const generateDistrictCharacteristics = (
    districtName: string,
    modelType: string,
    analysisData?: any
  ) => {
    console.log("🔍 generateDistrictCharacteristics called:", {
      districtName,
      modelType,
      analysisData,
    });

    // 기본값 (구가 선택되지 않았거나 분석 데이터가 없을 때)
    const defaultCharacteristics = {
      vulnerability: {
        score: 73,
        level: "높음",
        variant: "destructive" as const,
      },
      demographics: { score: 68, level: "보통", variant: "secondary" as const },
      mobility: {
        score: 82,
        level: "매우 어려움",
        variant: "destructive" as const,
      },
      overall: { score: 75, level: "⭐⭐⭐⭐☆" },
    };

    // 분석 데이터가 없거나 구가 선택되지 않은 경우
    if (!analysisData || !districtName) {
      console.log("📋 Using default characteristics");
      return defaultCharacteristics;
    }

    const baseScore = analysisData.selectedModelScore || 50;
    const districtScore = analysisData.allModelScores?.[modelType] || baseScore;

    console.log("📊 Score calculation:", {
      baseScore,
      districtScore,
      modelType,
    });

    // DRT 점수를 기반으로 특성 점수 계산 (역산 로직 - DRT 점수가 높으면 취약성은 낮음)
    const vulnerability = Math.min(Math.max(100 - districtScore * 0.8, 20), 95);
    const demographics = Math.min(Math.max(districtScore * 0.7 + 25, 30), 90);
    const mobility = Math.min(Math.max(100 - districtScore * 0.9, 25), 95);
    const overall = Math.min(Math.max(districtScore * 0.8 + 20, 40), 95);

    const getLevel = (score: number) => ({
      score: Math.round(score),
      level:
        score >= 80
          ? "매우 어려움"
          : score >= 60
          ? "어려움"
          : score >= 40
          ? "보통"
          : "낮음",
      variant: (score >= 80
        ? "destructive"
        : score >= 60
        ? "outline"
        : "secondary") as const,
    });

    const result = {
      vulnerability: getLevel(vulnerability),
      demographics: getLevel(demographics),
      mobility: getLevel(mobility),
      overall: {
        score: Math.round(overall),
        level:
          "⭐".repeat(Math.min(Math.max(Math.floor(overall / 20), 1), 5)) +
          "☆".repeat(5 - Math.min(Math.max(Math.floor(overall / 20), 1), 5)),
      },
    };

    console.log("✅ Generated characteristics:", result);
    return result;
  };

  // 출퇴근 모델 특성 데이터 생성
  const generateCommuterCharacteristics = (
    districtName: string,
    analysisData?: any
  ) => {
    const defaultCharacteristics = {
      concentration: {
        score: 89,
        level: "매우 집중",
        variant: "destructive" as const,
      },
      peakDemand: { score: 94, level: "극심", variant: "destructive" as const },
      routeUtilization: {
        score: 76,
        level: "보통",
        variant: "secondary" as const,
      },
      businessDensity: {
        score: 85,
        level: "높음",
        variant: "outline" as const,
      },
    };

    if (!analysisData || !districtName) {
      return defaultCharacteristics;
    }

    const districtScore =
      analysisData.allModelScores?.["출퇴근"] ||
      analysisData.selectedModelScore ||
      50;
    console.log(
      "🚌 Commuter characteristics for:",
      districtName,
      districtScore
    );

    // 출퇴근 점수가 높으면 출퇴근 집중도도 높음 (양의 상관관계)
    const concentration = Math.min(Math.max(districtScore * 1.2, 30), 95);
    const peakDemand = Math.min(Math.max(districtScore * 1.3, 35), 98);
    const routeUtilization = Math.min(
      Math.max(districtScore * 0.9 + 20, 40),
      90
    );
    const businessDensity = Math.min(
      Math.max(districtScore * 1.1 + 10, 45),
      95
    );

    const getLevel = (score: number) => ({
      score: Math.round(score),
      level:
        score >= 85
          ? "매우 집중"
          : score >= 70
          ? "집중"
          : score >= 50
          ? "보통"
          : "낮음",
      variant: (score >= 85
        ? "destructive"
        : score >= 70
        ? "outline"
        : "secondary") as const,
    });

    return {
      concentration: getLevel(concentration),
      peakDemand: {
        ...getLevel(peakDemand),
        level: peakDemand >= 90 ? "극심" : peakDemand >= 70 ? "높음" : "보통",
      },
      routeUtilization: getLevel(routeUtilization),
      businessDensity: {
        ...getLevel(businessDensity),
        level:
          businessDensity >= 80
            ? "높음"
            : businessDensity >= 60
            ? "보통"
            : "낮음",
      },
    };
  };

  // 관광형 모델 특성 데이터 생성
  const generateTourismCharacteristics = (
    districtName: string,
    analysisData?: any
  ) => {
    const defaultCharacteristics = {
      touristConcentration: {
        score: 67,
        level: "보통",
        variant: "secondary" as const,
      },
      touristRatio: { score: 71, level: "보통", variant: "secondary" as const },
      routeConnection: {
        score: 58,
        level: "개선여지",
        variant: "outline" as const,
      },
      attractionDensity: {
        score: 88,
        level: "매우 높음",
        variant: "destructive" as const,
      },
    };

    if (!analysisData || !districtName) {
      return defaultCharacteristics;
    }

    const districtScore =
      analysisData.allModelScores?.["관광형"] ||
      analysisData.selectedModelScore ||
      50;
    console.log("🗽 Tourism characteristics for:", districtName, districtScore);

    // 관광 점수가 높으면 관광 특성들도 높음
    const touristConcentration = Math.min(
      Math.max(districtScore * 0.9 + 15, 25),
      85
    );
    const touristRatio = Math.min(Math.max(districtScore * 1.0 + 20, 30), 90);
    const routeConnection = Math.min(
      Math.max(districtScore * 0.7 + 25, 35),
      80
    );
    const attractionDensity = Math.min(
      Math.max(districtScore * 1.2 + 10, 40),
      95
    );

    const getLevel = (score: number) => ({
      score: Math.round(score),
      level: score >= 80 ? "매우 높음" : score >= 60 ? "보통" : "개선여지",
      variant: (score >= 80
        ? "destructive"
        : score >= 60
        ? "secondary"
        : "outline") as const,
    });

    return {
      touristConcentration: getLevel(touristConcentration),
      touristRatio: getLevel(touristRatio),
      routeConnection: getLevel(routeConnection),
      attractionDensity: getLevel(attractionDensity),
    };
  };

  // API에서 DRT 데이터 로드
  useEffect(() => {
    const loadDRTData = async () => {
      try {
        setLoading(true);
        setError(null);

        const apiModelType = modelTypeMapping[selectedModel] || "vulnerable";
        // 전체 지역 선택 시 서울시 대표 구(강남구) 사용
        const targetRegion =
          selectedRegion === "전체" ? "강남구" : selectedRegion;

        console.log("🔍 Loading DRT data:", {
          selectedRegion,
          targetRegion,
          selectedModel,
          apiModelType,
        });

        const response = await apiService.getDRTScores(
          targetRegion,
          apiModelType,
          "2025-09-01"
        );

        console.log("📊 DRT API response:", response);
        setDrtData(response);
      } catch (err) {
        console.error("🚨 DRT API error:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load DRT data"
        );
      } finally {
        setLoading(false);
      }
    };

    loadDRTData();
  }, [selectedModel, selectedRegion]);

  // 선택된 모델의 시간대별 패턴 데이터 가져오기 (구별 맞춤형)
  const selectedPatternData = selectedDistrictName
    ? generateDistrictPatterns(selectedDistrictName, selectedModel, drtData)
    : demandPatterns[selectedModel as keyof typeof demandPatterns] ||
      demandPatterns["교통취약지"];

  // 실제 DRT 데이터로 모델 정보 업데이트
  const getUpdatedModelData = () => {
    const baseModel =
      mstGcnModels.find((m) => m.model === selectedModel) || mstGcnModels[0];

    if (!drtData || drtData.top_stations.length === 0) {
      return baseModel;
    }

    // DRT 점수를 기반으로 정확도와 예측값 계산
    const avgScore =
      drtData.top_stations.reduce(
        (sum, station) => sum + station.drt_score,
        0
      ) / drtData.top_stations.length;
    const maxScore = Math.max(...drtData.top_stations.map((s) => s.drt_score));

    return {
      ...baseModel,
      accuracy: Math.min(85 + (avgScore / 100) * 15, 99), // 85-99% 범위로 매핑
      prediction: Math.round(drtData.stations.length * avgScore * 100), // 정류장 수 * 평균점수 * 100
      confidence: Math.min(80 + (maxScore / 100) * 20, 98), // 80-98% 범위로 매핑
    };
  };

  const updatedModelData = getUpdatedModelData();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-6 gap-6">
        {/* 모델 선택 버튼 (1/6) */}
        <div className="col-span-1">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">모델 선택</CardTitle>
              <CardDescription className="text-xs">
                상황별 최적 모델
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {mstGcnModels.map((model) => {
                  const isSelected = selectedModel === model.model;
                  return (
                    <button
                      key={model.model}
                      onClick={() => setSelectedModel(model.model)}
                      className={`w-full p-3 text-sm font-medium rounded-lg transition-all ${
                        isSelected
                          ? "bg-blue-600 text-white shadow-md"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-lg">
                          {model.model === "교통취약지"
                            ? "🏘️"
                            : model.model === "출퇴근"
                            ? "🏢"
                            : "🗽"}
                        </span>
                        <span>{model.model}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
              {selectedDistrictName && (
                <div className="mt-3 p-2 bg-blue-50 rounded-lg">
                  <div className="text-xs font-medium text-blue-800">
                    선택된 구
                  </div>
                  <div className="text-xs text-blue-600">
                    {selectedDistrictName}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 지도 (3/6) */}
        <div className="col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>모델 적합성 분석 지도</CardTitle>
              <CardDescription>
                구를 클릭하여 {selectedModel} 모델의 적합성을 분석하세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ModelSuitabilityMap
                selectedModel={selectedModel}
                onDistrictAnalysis={(districtName, analysis) => {
                  console.log(
                    "District analysis received:",
                    districtName,
                    analysis
                  );
                  setDistrictAnalysis(analysis);
                  setSelectedDistrictName(districtName);
                }}
              />
              <CardDescription className="mt-4">
                {monthNames[Number.parseInt(selectedMonth) - 1]} 데이터 기반
                모델 적합성 분석
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* 구 분석 패널 (2/6) */}
        <div className="col-span-2">
          {districtAnalysis ? (
            <DistrictAnalysisPanel
              analysisData={districtAnalysis}
              selectedModel={selectedModel}
              onClose={() => setDistrictAnalysis(null)}
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>구 분석 결과</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center text-gray-500">
                  <div className="text-4xl mb-3">🗺️</div>
                  <div className="text-sm">지도에서 구를 클릭하여</div>
                  <div className="text-sm">모델 적합성을 분석하세요</div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* 하단 컴포넌트들 1:1 그리드 배치 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 모델별 특성 분석 */}
        <Card>
          <CardHeader>
            <CardTitle>모델별 특성 분석</CardTitle>
            <CardDescription>선택된 모델의 주요 지표 및 특성</CardDescription>
          </CardHeader>
          <CardContent>
            {selectedModel === "교통취약지" && (
              <div className="space-y-6">
                <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border">
                  <h4 className="font-medium mb-4 flex items-center gap-2">
                    🏘️{" "}
                    <span>
                      {selectedDistrictName ||
                        (selectedRegion === "전체"
                          ? "서울시"
                          : selectedRegion)}{" "}
                      취약지역 진단
                    </span>
                    {selectedDistrictName && (
                      <Badge variant="outline" className="text-xs">
                        실시간 분석
                      </Badge>
                    )}
                  </h4>
                  {(() => {
                    const characteristics = generateDistrictCharacteristics(
                      selectedDistrictName || "",
                      selectedModel,
                      districtAnalysis
                    );
                    return (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">🚌❌</span>
                            <div>
                              <h5 className="font-medium">
                                교통 접근성 부족도
                              </h5>
                              <p className="text-sm text-muted-foreground">
                                이 지역 교통이 얼마나 불편한가요?
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-red-600">
                              {characteristics.vulnerability.score}점
                            </div>
                            <Badge
                              variant={characteristics.vulnerability.variant}
                            >
                              {characteristics.vulnerability.level}
                            </Badge>
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">👴👵♿</span>
                            <div>
                              <h5 className="font-medium">
                                취약계층 이용 필요도
                              </h5>
                              <p className="text-sm text-muted-foreground">
                                고령자, 장애인 등이 얼마나 필요로 하나요?
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-yellow-600">
                              {characteristics.demographics.score}점
                            </div>
                            <Badge
                              variant={characteristics.demographics.variant}
                            >
                              {characteristics.demographics.level}
                            </Badge>
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">🚶‍♂️💸</span>
                            <div>
                              <h5 className="font-medium">이동 어려움 지수</h5>
                              <p className="text-sm text-muted-foreground">
                                여기서 다른 곳 가기 얼마나 힘든가요?
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-red-600">
                              {characteristics.mobility.score}점
                            </div>
                            <Badge variant={characteristics.mobility.variant}>
                              {characteristics.mobility.level}
                            </Badge>
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">📊</span>
                            <div>
                              <h5 className="font-medium">종합 취약 점수</h5>
                              <p className="text-sm text-muted-foreground">
                                전체적으로 이 지역이 얼마나 취약한가요?
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-blue-600">
                              {characteristics.overall.score}점
                            </div>
                            <div className="text-sm">
                              {characteristics.overall.level}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  <div className="mt-6 p-4 bg-blue-100 rounded-lg">
                    <h5 className="font-medium mb-3">🕐 취약 시간대 분석</h5>
                    <div className="grid grid-cols-3 gap-3 text-sm">
                      <div className="text-center p-2 bg-white rounded">
                        <div className="font-medium">의료 시간</div>
                        <div className="text-blue-600">09-11시</div>
                        <div className="text-xs text-muted-foreground">
                          가중치 1.5
                        </div>
                      </div>
                      <div className="text-center p-2 bg-white rounded">
                        <div className="font-medium">복지 시간</div>
                        <div className="text-green-600">14-16시</div>
                        <div className="text-xs text-muted-foreground">
                          가중치 1.3
                        </div>
                      </div>
                      <div className="text-center p-2 bg-white rounded">
                        <div className="font-medium">저녁 시간</div>
                        <div className="text-orange-600">18-20시</div>
                        <div className="text-xs text-muted-foreground">
                          가중치 1.2
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-green-100 rounded-lg text-center">
                    <span className="text-green-800 font-medium">
                      💡 결론: DRT 도입 우선지역입니다!
                    </span>
                  </div>
                </div>
              </div>
            )}

            {selectedModel === "출퇴근" && (
              <div className="space-y-6">
                <div className="p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border">
                  <h4 className="font-medium mb-4 flex items-center gap-2">
                    🏢{" "}
                    <span>
                      {selectedDistrictName ||
                        (selectedRegion === "전체"
                          ? "서울시"
                          : selectedRegion)}{" "}
                      출퇴근 패턴 분석
                    </span>
                    {selectedDistrictName && (
                      <Badge variant="outline" className="text-xs">
                        실시간 분석
                      </Badge>
                    )}
                  </h4>
                  {(() => {
                    const characteristics = generateCommuterCharacteristics(
                      selectedDistrictName || "",
                      districtAnalysis
                    );
                    return (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">📈</span>
                            <div>
                              <h5 className="font-medium">출퇴근 집중도</h5>
                              <p className="text-sm text-muted-foreground">
                                특정 시간에 사람들이 얼마나 몰리나요?
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-red-600">
                              {characteristics.concentration.score}점
                            </div>
                            <Badge
                              variant={characteristics.concentration.variant}
                            >
                              {characteristics.concentration.level}
                            </Badge>
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">⏰</span>
                            <div>
                              <h5 className="font-medium">피크시간 수요율</h5>
                              <p className="text-sm text-muted-foreground">
                                하루 중 가장 바쁜 시간 비중
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-red-600">
                              {characteristics.peakDemand.score}점
                            </div>
                            <Badge variant={characteristics.peakDemand.variant}>
                              {characteristics.peakDemand.level}
                            </Badge>
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">🚌</span>
                            <div>
                              <h5 className="font-medium">노선 활용도</h5>
                              <p className="text-sm text-muted-foreground">
                                기존 버스노선이 얼마나 잘 쓰이고 있나요?
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-yellow-600">
                              {characteristics.routeUtilization.score}점
                            </div>
                            <Badge
                              variant={characteristics.routeUtilization.variant}
                            >
                              {characteristics.routeUtilization.level}
                            </Badge>
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">🏢</span>
                            <div>
                              <h5 className="font-medium">직장가 중요도</h5>
                              <p className="text-sm text-muted-foreground">
                                회사, 상업지구 밀집도
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-orange-600">
                              {characteristics.businessDensity.score}점
                            </div>
                            <Badge
                              variant={characteristics.businessDensity.variant}
                            >
                              {characteristics.businessDensity.level}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  <div className="mt-6 p-4 bg-orange-100 rounded-lg">
                    <h5 className="font-medium mb-3">
                      📊 출퇴근 시간대별 수요
                    </h5>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart
                        data={[
                          {
                            time: "07-09시",
                            demand: 95,
                            type: "출근",
                            color: "#ef4444",
                          },
                          {
                            time: "09-12시",
                            demand: 45,
                            type: "일반",
                            color: "#94a3b8",
                          },
                          {
                            time: "12-14시",
                            demand: 60,
                            type: "점심",
                            color: "#f59e0b",
                          },
                          {
                            time: "17-19시",
                            demand: 92,
                            type: "퇴근",
                            color: "#ef4444",
                          },
                          {
                            time: "19-22시",
                            demand: 35,
                            type: "일반",
                            color: "#94a3b8",
                          },
                        ]}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="time" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="demand" fill="#3b82f6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="mt-4 p-3 bg-orange-100 rounded-lg text-center">
                    <span className="text-orange-800 font-medium">
                      💡 결론: 출퇴근 전용 DRT 필요!
                    </span>
                  </div>
                </div>
              </div>
            )}

            {selectedModel === "관광형" && (
              <div className="space-y-6">
                <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border">
                  <h4 className="font-medium mb-4 flex items-center gap-2">
                    🗽{" "}
                    <span>
                      {selectedDistrictName ||
                        (selectedRegion === "전체"
                          ? "서울시"
                          : selectedRegion)}{" "}
                      관광지 수요 분석
                    </span>
                    {selectedDistrictName && (
                      <Badge variant="outline" className="text-xs">
                        실시간 분석
                      </Badge>
                    )}
                  </h4>
                  {(() => {
                    const characteristics = generateTourismCharacteristics(
                      selectedDistrictName || "",
                      districtAnalysis
                    );
                    return (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">🎯</span>
                            <div>
                              <h5 className="font-medium">관광객 집중도</h5>
                              <p className="text-sm text-muted-foreground">
                                관광객들이 특정 장소에 얼마나 몰리나요?
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-yellow-600">
                              {characteristics.touristConcentration.score}점
                            </div>
                            <Badge
                              variant={
                                characteristics.touristConcentration.variant
                              }
                            >
                              {characteristics.touristConcentration.level}
                            </Badge>
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">👥</span>
                            <div>
                              <h5 className="font-medium">관광 수요 비중</h5>
                              <p className="text-sm text-muted-foreground">
                                전체 이용객 중 관광객 비율
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-yellow-600">
                              {characteristics.touristRatio.score}점
                            </div>
                            <Badge
                              variant={characteristics.touristRatio.variant}
                            >
                              {characteristics.touristRatio.level}
                            </Badge>
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">🔗</span>
                            <div>
                              <h5 className="font-medium">관광코스 연결도</h5>
                              <p className="text-sm text-muted-foreground">
                                관광지들이 얼마나 잘 연결되어 있나요?
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-green-600">
                              {characteristics.routeConnection.score}점
                            </div>
                            <Badge
                              variant={characteristics.routeConnection.variant}
                            >
                              {characteristics.routeConnection.level}
                            </Badge>
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">🏛️</span>
                            <div>
                              <h5 className="font-medium">관광명소 밀집도</h5>
                              <p className="text-sm text-muted-foreground">
                                주요 관광지 분포
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-red-600">
                              {characteristics.attractionDensity.score}점
                            </div>
                            <Badge
                              variant={
                                characteristics.attractionDensity.variant
                              }
                            >
                              {characteristics.attractionDensity.level}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  <div className="mt-6 p-4 bg-green-100 rounded-lg">
                    <h5 className="font-medium mb-3">🏛️ 주요 관광명소 분포</h5>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span>관광특구:</span>
                          <div className="flex items-center gap-1">
                            <span className="font-medium">1.0</span>
                            <span>⭐⭐⭐⭐⭐</span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>고궁·문화유산:</span>
                          <div className="flex items-center gap-1">
                            <span className="font-medium">0.9</span>
                            <span>⭐⭐⭐⭐☆</span>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span>발달상권:</span>
                          <div className="flex items-center gap-1">
                            <span className="font-medium">0.8</span>
                            <span>⭐⭐⭐⭐☆</span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>공원:</span>
                          <div className="flex items-center gap-1">
                            <span className="font-medium">0.7</span>
                            <span>⭐⭐⭐☆☆</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-blue-100 rounded-lg">
                    <h5 className="font-medium mb-3">👥 방문객 구성 분석</h5>
                    <ResponsiveContainer width="100%" height={150}>
                      <BarChart
                        data={[
                          {
                            category: "관광객",
                            percentage: 71,
                            color: "#3b82f6",
                          },
                          {
                            category: "지역민",
                            percentage: 29,
                            color: "#94a3b8",
                          },
                        ]}
                        layout="horizontal"
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="category" type="category" width={60} />
                        <Tooltip />
                        <Bar dataKey="percentage" fill="#3b82f6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="mt-4 p-3 bg-green-100 rounded-lg text-center">
                    <span className="text-green-800 font-medium">
                      💡 결론: 관광지 연결 DRT 노선 추천!
                    </span>
                  </div>
                </div>
              </div>
            )}
            <CardDescription>
              {monthNames[Number.parseInt(selectedMonth) - 1]} 데이터
            </CardDescription>
          </CardContent>
        </Card>

        {/* 시간대별 수요 패턴 차트 */}
        <Card>
          <CardHeader>
            <CardTitle>시간대별 수요 패턴</CardTitle>
            <CardDescription>
              {selectedModel} 모델의 24시간 수요 예측 패턴 (
              {selectedDistrictName ||
                (selectedRegion === "전체" ? "서울시" : selectedRegion)}
              )
              {selectedDistrictName && (
                <Badge variant="outline" className="ml-2 text-xs">
                  구별 맞춤 분석
                </Badge>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={selectedPatternData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 12 }}
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  label={{
                    value: "예상 이용객 (명)",
                    angle: -90,
                    position: "insideLeft",
                  }}
                />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    `${value.toLocaleString()}명`,
                    name === "demand"
                      ? "전체 수요"
                      : name === "medical"
                      ? "의료/복지 수요"
                      : name === "commute"
                      ? "출퇴근 수요"
                      : name === "tourism"
                      ? "관광 수요"
                      : name,
                  ]}
                  labelFormatter={(label) => `${label}`}
                />
                <Legend />

                {/* 전체 수요 영역 */}
                <Area
                  type="monotone"
                  dataKey="demand"
                  stackId="1"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.6}
                  name="전체 수요"
                />

                {/* 모델별 특화 수요 영역 */}
                {selectedModel === "교통취약지" && (
                  <Area
                    type="monotone"
                    dataKey="medical"
                    stackId="2"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.8}
                    name="의료/복지 수요"
                  />
                )}

                {selectedModel === "출퇴근" && (
                  <Area
                    type="monotone"
                    dataKey="commute"
                    stackId="2"
                    stroke="#f59e0b"
                    fill="#f59e0b"
                    fillOpacity={0.8}
                    name="출퇴근 수요"
                  />
                )}

                {selectedModel === "관광형" && (
                  <Area
                    type="monotone"
                    dataKey="tourism"
                    stackId="2"
                    stroke="#8b5cf6"
                    fill="#8b5cf6"
                    fillOpacity={0.8}
                    name="관광 수요"
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>

            {/* 패턴 분석 요약 */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              {selectedModel === "교통취약지" && (
                <>
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-lg font-bold text-blue-600">
                      09-11시
                    </div>
                    <div className="text-sm text-blue-700">의료 피크시간</div>
                    <div className="text-xs text-muted-foreground">
                      최대{" "}
                      {Math.max(
                        ...selectedPatternData.slice(3, 5).map((d) => d.demand)
                      ).toLocaleString()}
                      명 예상
                    </div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-lg font-bold text-green-600">
                      14-16시
                    </div>
                    <div className="text-sm text-green-700">복지 이용시간</div>
                    <div className="text-xs text-muted-foreground">
                      최대{" "}
                      {Math.max(
                        ...selectedPatternData.slice(8, 10).map((d) => d.demand)
                      ).toLocaleString()}
                      명 예상
                    </div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <div className="text-lg font-bold text-purple-600">
                      18-19시
                    </div>
                    <div className="text-sm text-purple-700">저녁 귀가시간</div>
                    <div className="text-xs text-muted-foreground">
                      최대{" "}
                      {Math.max(
                        ...selectedPatternData
                          .slice(12, 13)
                          .map((d) => d.demand)
                      ).toLocaleString()}
                      명 예상
                    </div>
                  </div>
                </>
              )}

              {selectedModel === "출퇴근" && (
                <>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <div className="text-lg font-bold text-red-600">
                      07-09시
                    </div>
                    <div className="text-sm text-red-700">출근 러시아워</div>
                    <div className="text-xs text-muted-foreground">
                      최대{" "}
                      {Math.max(
                        ...selectedPatternData.slice(1, 3).map((d) => d.demand)
                      ).toLocaleString()}
                      명 예상
                    </div>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <div className="text-lg font-bold text-orange-600">
                      17-19시
                    </div>
                    <div className="text-sm text-orange-700">퇴근 러시아워</div>
                    <div className="text-xs text-muted-foreground">
                      최대{" "}
                      {Math.max(
                        ...selectedPatternData
                          .slice(11, 13)
                          .map((d) => d.demand)
                      ).toLocaleString()}
                      명 예상
                    </div>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 rounded-lg">
                    <div className="text-lg font-bold text-yellow-600">
                      12-13시
                    </div>
                    <div className="text-sm text-yellow-700">점심시간대</div>
                    <div className="text-xs text-muted-foreground">
                      최대{" "}
                      {selectedPatternData[6]?.demand?.toLocaleString() || "0"}
                      명 예상
                    </div>
                  </div>
                </>
              )}

              {selectedModel === "관광형" && (
                <>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-lg font-bold text-green-600">
                      10-12시
                    </div>
                    <div className="text-sm text-green-700">관광 시작시간</div>
                    <div className="text-xs text-muted-foreground">
                      최대{" "}
                      {Math.max(
                        ...selectedPatternData.slice(4, 6).map((d) => d.demand)
                      ).toLocaleString()}
                      명 예상
                    </div>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-lg font-bold text-blue-600">
                      14-16시
                    </div>
                    <div className="text-sm text-blue-700">관광 피크시간</div>
                    <div className="text-xs text-muted-foreground">
                      최대{" "}
                      {Math.max(
                        ...selectedPatternData.slice(8, 10).map((d) => d.demand)
                      ).toLocaleString()}
                      명 예상
                    </div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <div className="text-lg font-bold text-purple-600">
                      주중 vs 주말
                    </div>
                    <div className="text-sm text-purple-700">
                      주말 +40% 증가
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {selectedDistrictName
                        ? `${selectedDistrictName} 관광 특성`
                        : "관광 특성 반영"}
                    </div>
                  </div>
                </>
              )}
            </div>

            <CardDescription className="mt-4">
              {monthNames[Number.parseInt(selectedMonth) - 1]} 데이터 기반
              MST-GCN 모델 예측
            </CardDescription>
          </CardContent>
        </Card>
      </div>
    </div>
  );
});
