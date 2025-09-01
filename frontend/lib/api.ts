// API 서비스 레이어
// DRT Dashboard API 통신을 위한 타입 정의 및 함수들

const API_BASE_URL = 'http://localhost:8000/api/v1';

// Traffic API 타입 정의
export interface HourlyPattern {
  hour: number;
  avg_ride_passengers: number;
  avg_alight_passengers: number;
  avg_total_passengers: number;
}

export interface PeakHour {
  hour: number;
  avg_total_passengers: number;
}

export interface TrafficResponse {
  analysis_month: string;
  region_type: 'seoul' | 'district';
  region_name: string;
  district_name?: string;
  weekday_patterns: HourlyPattern[];
  weekend_patterns: HourlyPattern[];
  peak_hours: {
    weekday_morning_peak: PeakHour;
    weekday_evening_peak: PeakHour;
    weekend_peak: PeakHour;
  };
  total_weekday_passengers: number;
  total_weekend_passengers: number;
  weekday_weekend_ratio: number;
}

// Heatmap API 타입 정의
export interface StationData {
  station_id: string;
  station_name: string;
  total_traffic: number;
  coordinate: {
    latitude: number;
    longitude: number;
  };
}

export interface DistrictData {
  district_name: string;
  sgg_code: string;
  total_traffic: number;
  avg_daily_traffic: number;
  traffic_rank: number;
  traffic_density_score: number;
  boundary?: {
    type: string;
    coordinates: number[][][];
  };
  stations: StationData[];
}

export interface HeatmapStatistics {
  total_seoul_traffic: number;
  total_stations: number;
  max_district_traffic: number;
  min_district_traffic: number;
  district_traffic_quartiles: number[];
  max_station_traffic: number;
  station_traffic_quartiles: number[];
}

export interface HeatmapResponse {
  analysis_month: string;
  seoul_boundary?: {
    type: string;
    coordinates: number[][][][];
  };
  districts: DistrictData[];
  statistics: HeatmapStatistics;
}

// DRT Score API 타입 정의
export interface DRTStationData {
  station_id: string;
  station_name: string;
  coordinate: {
    lat: number;
    lng: number;
  };
  drt_score: number;
  peak_hour: number;
}

export interface DRTTopStation {
  station_id: string;
  station_name: string;
  coordinate: {
    lat: number;
    lng: number;
  };
  drt_score: number;
  peak_hour: number;
}

export interface DRTScoreResponse {
  district_name: string;
  model_type: 'commuter' | 'tourism' | 'vulnerable';
  analysis_month: string;
  stations: DRTStationData[];
  top_stations: DRTTopStation[];
}

export type DRTModelType = 'commuter' | 'tourism' | 'vulnerable';

// API 함수들
class ApiService {
  private async fetchWithErrorHandling<T>(url: string): Promise<T> {
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // 시간대별 교통량 패턴 조회
  async getHourlyTraffic(
    analysisMonth: string,
    regionType: 'seoul' | 'district' = 'seoul',
    districtName?: string
  ): Promise<TrafficResponse> {
    const params = new URLSearchParams({
      analysis_month: analysisMonth,
      region_type: regionType,
    });
    
    if (regionType === 'district' && districtName) {
      params.append('district_name', districtName);
    }
    
    const url = `${API_BASE_URL}/traffic/hourly?${params.toString()}`;
    return this.fetchWithErrorHandling<TrafficResponse>(url);
  }

  // 서울시 히트맵 데이터 조회
  async getSeoulHeatmap(
    analysisMonth: string,
    includeStationDetails: boolean = true,
    minTrafficThreshold?: number
  ): Promise<HeatmapResponse> {
    const params = new URLSearchParams({
      analysis_month: analysisMonth,
      include_station_details: includeStationDetails.toString(),
    });
    
    if (minTrafficThreshold !== undefined) {
      params.append('min_traffic_threshold', minTrafficThreshold.toString());
    }
    
    const url = `${API_BASE_URL}/heatmap/seoul?${params.toString()}`;
    return this.fetchWithErrorHandling<HeatmapResponse>(url);
  }

  // 특정 구 히트맵 데이터 조회
  async getDistrictHeatmap(
    districtName: string,
    analysisMonth: string,
    minTrafficThreshold?: number
  ): Promise<DistrictData> {
    const params = new URLSearchParams({
      analysis_month: analysisMonth,
    });
    
    if (minTrafficThreshold !== undefined) {
      params.append('min_traffic_threshold', minTrafficThreshold.toString());
    }
    
    const url = `${API_BASE_URL}/heatmap/districts/${encodeURIComponent(districtName)}?${params.toString()}`;
    return this.fetchWithErrorHandling<DistrictData>(url);
  }

  // API 상태 확인
  async getTrafficHealth(): Promise<any> {
    const url = `${API_BASE_URL}/traffic/hourly/health`;
    return this.fetchWithErrorHandling(url);
  }

  async getHeatmapHealth(): Promise<any> {
    const url = `${API_BASE_URL}/heatmap/health`;
    return this.fetchWithErrorHandling(url);
  }

  // DRT Score 관련 API 함수들
  
  // 구별 DRT 점수 조회
  async getDRTScores(
    districtName: string,
    modelType: DRTModelType,
    analysisMonth: string = '2025-09-01'
  ): Promise<DRTScoreResponse> {
    const params = new URLSearchParams({
      model_type: modelType,
      analysis_month: analysisMonth,
    });
    
    const url = `${API_BASE_URL}/drt-score/districts/${encodeURIComponent(districtName)}?${params.toString()}`;
    return this.fetchWithErrorHandling<DRTScoreResponse>(url);
  }

  // 여러 구의 DRT 점수 조회 (대시보드용)
  async getMultipleDRTScores(
    districtNames: string[],
    modelType: DRTModelType,
    analysisMonth: string = '2025-09-01'
  ): Promise<DRTScoreResponse[]> {
    const promises = districtNames.map(districtName => 
      this.getDRTScores(districtName, modelType, analysisMonth)
    );
    
    return Promise.all(promises);
  }

  // 서울시 전체 DRT Top 정류장 조회 (여러 구 통합)
  async getSeoulTopDRTStations(
    modelType: DRTModelType,
    analysisMonth: string = '2025-09-01',
    topN: number = 10
  ): Promise<DRTTopStation[]> {
    // 주요 구들을 조회해서 Top 정류장들을 수집
    const majorDistricts = [
      '강남구', '강서구', '관악구', '광진구', '마포구', 
      '서초구', '성동구', '송파구', '영등포구', '용산구'
    ];
    
    try {
      const responses = await this.getMultipleDRTScores(majorDistricts, modelType, analysisMonth);
      
      // 모든 구의 top_stations를 수집하고 점수순으로 정렬
      const allTopStations = responses
        .flatMap(response => response.top_stations)
        .sort((a, b) => b.drt_score - a.drt_score)
        .slice(0, topN);
      
      return allTopStations;
    } catch (error) {
      console.error('Failed to fetch Seoul top DRT stations:', error);
      return [];
    }
  }
}

// 싱글톤 인스턴스 export
export const apiService = new ApiService();

// 유틸리티 함수들
export const utils = {
  // 날짜 포맷팅 (YYYY-MM-01 형식으로 변환)
  formatAnalysisMonth: (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}-01`;
  },

  // 시간 포맷팅 (24시간 -> 12시간 형식)
  formatHour: (hour: number): string => {
    if (hour === 0) return '12 AM';
    if (hour === 12) return '12 PM';
    if (hour < 12) return `${hour} AM`;
    return `${hour - 12} PM`;
  },

  // 숫자 포맷팅 (천 단위 콤마)
  formatNumber: (num: number): string => {
    return num.toLocaleString();
  },

  // 비율 포맷팅 (소수점 1자리)
  formatRatio: (ratio: number): string => {
    return `${(ratio * 100).toFixed(1)}%`;
  },

  // 서울시 25개 구 목록
  seoulDistricts: [
    '강남구', '강동구', '강북구', '강서구', '관악구', '광진구', '구로구', '금천구',
    '노원구', '도봉구', '동대문구', '동작구', '마포구', '서대문구', '서초구',
    '성동구', '성북구', '송파구', '양천구', '영등포구', '용산구', '은평구', '종로구', '중구', '중랑구'
  ]
};