# DRT Dashboard API 명세서
**서울시 수요응답형 교통(DRT) 대시보드 설계를 위한 완전한 API 가이드**

> 📅 **작성일**: 2025-09-01  
> 🚀 **Base URL**: `http://localhost:8000/api/v1`  
> 📊 **데이터 기간**: 2025-08 (실제 샘플 데이터 포함)  

---

## 🎯 대시보드 개요

### 주요 컴포넌트
1. **📈 시간대별 교통 패턴 차트** - 평일/주말 승하차 패턴 비교
2. **🗺️ 서울시 교통량 히트맵** - 구별/정류장별 교통량 시각화  
3. **🔍 이상 패턴 감지** - 교통량 급증/급감 지역 탐지
4. **🎯 DRT 스코어 분석** - 출퇴근/관광/교통약자 맞춤 분석

---

## 📊 1. 시간대별 교통 패턴 API

### 🎯 **용도**: 시간대별 승하차 패턴 차트 컴포넌트
- **라인 차트**: 0-23시 평일/주말 비교
- **피크 타임 하이라이트**: 출퇴근 시간 강조
- **드릴다운**: 서울시 전체 → 특정 구 상세

### 📍 **엔드포인트**
```http
GET /api/v1/traffic/hourly
```

### 📝 **파라미터**
| 파라미터 | 타입 | 필수 | 설명 | 예시 |
|----------|------|------|------|------|
| `analysis_month` | date | ✅ | 분석 월 (YYYY-MM-DD) | `2025-08-01` |
| `region_type` | enum | ✅ | `seoul` 또는 `district` | `seoul` |
| `district_name` | string | ❌ | 구명 (district일 때 필수) | `강남구` |

### 💾 **응답 구조**
```json
{
  "analysis_month": "2025-08",
  "region_type": "seoul",
  "region_name": "서울시 전체",
  "weekday_patterns": [
    {
      "hour": 6,
      "avg_ride_passengers": 10.0,
      "avg_alight_passengers": 8.2,
      "avg_total_passengers": 18.2
    }
    // ... 0-23시 총 24개 항목
  ],
  "weekend_patterns": [
    {
      "hour": 6,
      "avg_ride_passengers": 10.2,
      "avg_alight_passengers": 7.8,
      "avg_total_passengers": 18.0
    }
    // ... 0-23시 총 24개 항목
  ],
  "peak_hours": {
    "weekday_morning_peak": {"hour": 8, "avg_total_passengers": 18.3},
    "weekday_evening_peak": {"hour": 18, "avg_total_passengers": 18.3},
    "weekend_peak": {"hour": 14, "avg_total_passengers": 18.5}
  },
  "total_weekday_passengers": 162,
  "total_weekend_passengers": 160,
  "weekday_weekend_ratio": 1.01
}
```

### 🎨 **UI 컴포넌트 설계 가이드**
- **차트 타입**: Line Chart (Chart.js, Recharts)
- **X축**: 시간 (0-23시)
- **Y축**: 평균 승객 수
- **라인**: 평일(파란색), 주말(주황색)
- **하이라이트**: 피크 시간대 점으로 강조
- **인터랙션**: 시간대 호버 시 상세 수치 표시

---

## 🗺️ 2. 서울시 교통량 히트맵 API

### 🎯 **용도**: 지도 기반 교통량 시각화
- **서울시 전체 히트맵**: 25개 구별 교통량 비교
- **구별 상세 히트맵**: 선택한 구의 정류장별 상세 데이터
- **계층적 탐색**: 서울시 → 구 → 정류장 단계별 확대

### 📍 **엔드포인트**

#### 🌍 **서울시 전체 히트맵**
```http
GET /api/v1/heatmap/seoul
```

**파라미터:**
| 파라미터 | 타입 | 필수 | 설명 | 기본값 |
|----------|------|------|------|--------|
| `analysis_month` | date | ✅ | 분석 월 (YYYY-MM-DD) | - |
| `include_station_details` | boolean | ❌ | 정류장별 상세 포함 여부 | `true` |
| `min_traffic_threshold` | integer | ❌ | 최소 교통량 필터 | `null` |

#### 🏙️ **특정 구 상세 히트맵**
```http
GET /api/v1/heatmap/districts/{district_name}
```

**URL 예시:**
- `/api/v1/heatmap/districts/강남구`
- `/api/v1/heatmap/districts/마포구`

### 💾 **응답 구조**

#### 📋 **서울시 전체 응답**
```json
{
  "analysis_month": "2025-08",
  "seoul_boundary": {
    "type": "MultiPolygon",
    "coordinates": [/* GeoJSON 좌표 배열 */]
  },
  "districts": [
    {
      "district_name": "강남구",
      "sgg_code": "11680", 
      "total_traffic": 1248,
      "avg_daily_traffic": 156,
      "traffic_rank": 1,
      "traffic_density_score": 85.2,
      "boundary": {
        "type": "Polygon", 
        "coordinates": [/* 구 경계 좌표 */]
      },
      "stations": [
        {
          "station_id": "123456789",
          "station_name": "강남역",
          "total_traffic": 89,
          "coordinate": {"latitude": 37.497952, "longitude": 127.027619}
        }
        // ... 해당 구의 모든 정류장
      ]
    }
    // ... 서울시 25개 구 전체
  ],
  "statistics": {
    "total_seoul_traffic": 28960,
    "total_stations": 1838,
    "max_district_traffic": 1248,
    "min_district_traffic": 256,
    "district_traffic_quartiles": [512, 768, 1024],
    "max_station_traffic": 89,
    "station_traffic_quartiles": [12, 24, 38]
  }
}
```

### 🎨 **UI 컴포넌트 설계 가이드**

#### 🗺️ **지도 컴포넌트** (Leaflet 권장)
- **기본 지도**: OpenStreetMap 또는 Naver/Kakao Map
- **구별 경계**: GeoJSON으로 폴리곤 렌더링
- **색상 스케일**: 교통량 기준 5단계 히트맵
  - 최고: `#d73027` (빨간색)
  - 높음: `#fc8d59` (주황색) 
  - 보통: `#fee08b` (노란색)
  - 낮음: `#d9ef8b` (연두색)
  - 최소: `#91bfdb` (파란색)

#### 📊 **사이드 패널**
- **순위 리스트**: 교통량 TOP 10 구 표시
- **통계 카드**: 총 교통량, 평균, 최대/최소값
- **필터 옵션**: 교통량 임계값 슬라이더

#### 🔍 **인터랙션**
- **구 클릭**: 해당 구 상세 페이지로 이동
- **호버**: 구명과 교통량 툴팁 표시
- **정류장 모드**: 확대 시 정류장별 마커 표시

---

## 🚨 3. 이상 패턴 감지 API

### ⚠️ **현재 상태**: 개발 중 (404 에러 발생)
### 🎯 **용도**: 비정상적인 교통량 변화 탐지
- **급증 지역**: 전월 대비 교통량 크게 증가한 지역
- **급감 지역**: 전월 대비 교통량 크게 감소한 지역
- **시간대별 이상**: 특정 시간대 평소와 다른 패턴

### 📍 **엔드포인트** (예정)
```http
GET /api/v1/anomaly-pattern/detect
```

### 📝 **파라미터**
| 파라미터 | 타입 | 필수 | 설명 | 기본값 |
|----------|------|------|------|--------|
| `analysis_month` | date | ✅ | 분석 월 | - |
| `comparison_month` | date | ❌ | 비교 기준월 | 전월 |
| `anomaly_threshold` | float | ❌ | 이상 임계값 (%) | `20.0` |
| `region_scope` | enum | ❌ | `district` 또는 `station` | `district` |

### 💾 **응답 구조**
```json
{
  "analysis_period": "2025-08 vs 2025-07",
  "anomaly_threshold": 20.0,
  "summary": {
    "total_regions_analyzed": 25,
    "significant_increases": 3,
    "significant_decreases": 2,
    "stable_regions": 20
  },
  "traffic_increases": [
    {
      "region_name": "송파구",
      "region_type": "district",
      "current_traffic": 1150,
      "previous_traffic": 890,
      "change_percentage": 29.2,
      "severity": "HIGH",
      "possible_causes": ["신규 상업지구 개발", "지하철 연장 개통"]
    }
  ],
  "traffic_decreases": [
    {
      "region_name": "중구", 
      "region_type": "district",
      "current_traffic": 520,
      "previous_traffic": 780,
      "change_percentage": -33.3,
      "severity": "HIGH",
      "possible_causes": ["업무지구 재택근무 증가"]
    }
  ]
}
```

### 🎨 **UI 컴포넌트 설계 가이드**
- **알림 카드**: 급증/급감 지역 카드 형태로 표시
- **변화율 배지**: 증가(🔺빨강), 감소(🔻파랑)
- **트렌드 차트**: 선택된 지역의 월별 변화 추이
- **맵 오버레이**: 히트맵에 이상 지역 특별 표시

---

## 🎯 4. DRT 스코어 분석 API

### ⚠️ **현재 상태**: 데이터 없음 (빈 응답)
### 🎯 **용도**: 수요응답형 교통 최적화 분석
- **출퇴근족 DRT**: 직장인 대상 노선 효율성
- **관광객 DRT**: 관광지 접근성 및 편의성  
- **교통약자 DRT**: 고령자, 장애인 접근성

### 📍 **엔드포인트** (구현됨, 데이터 준비 중)

#### 👔 **출퇴근족 DRT 분석**
```http
GET /api/v1/drt-score/commuter
```

#### 🏖️ **관광객 DRT 분석**  
```http
GET /api/v1/drt-score/tourism
```

#### ♿ **교통약자 DRT 분석**
```http
GET /api/v1/drt-score/vulnerable
```

### 📝 **공통 파라미터**
| 파라미터 | 타입 | 필수 | 설명 | 기본값 |
|----------|------|------|------|--------|
| `analysis_month` | date | ✅ | 분석 월 | - |
| `district_name` | string | ❌ | 특정 구 필터 | 전체 |
| `score_threshold` | float | ❌ | 최소 스코어 (0-100) | `0` |
| `top_n` | integer | ❌ | 상위 N개 결과 | `10` |

### 💾 **응답 구조**

#### 👔 **출퇴근족 DRT 예시**
```json
{
  "analysis_type": "commuter",
  "analysis_month": "2025-08",
  "summary": {
    "total_stations_analyzed": 1838,
    "high_priority_stations": 156,
    "avg_commuter_score": 67.8,
    "coverage_districts": 25
  },
  "top_priority_stations": [
    {
      "station_id": "111001124",
      "station_name": "강남역",
      "district": "강남구",
      "commuter_score": 94.2,
      "sub_scores": {
        "morning_rush_demand": 89.5,
        "evening_rush_demand": 92.1, 
        "accessibility_score": 88.3,
        "transfer_convenience": 96.8
      },
      "coordinates": {"latitude": 37.497952, "longitude": 127.027619},
      "recommendations": [
        "출퇴근 시간대 증차 필요",
        "인근 지하철역 연계 강화"
      ]
    }
    // ... TOP N 정류장
  ],
  "district_rankings": [
    {
      "district": "강남구",
      "avg_score": 82.1,
      "station_count": 89,
      "rank": 1
    }
    // ... 25개 구 순위
  ]
}
```

### 🎨 **UI 컴포넌트 설계 가이드**

#### 📊 **대시보드 레이아웃**
- **탭 메뉴**: 출퇴근/관광/교통약자 3개 탭
- **스코어 히트맵**: 지도에 DRT 스코어 색상으로 표시
- **순위 테이블**: 상위 정류장/구 순위표
- **상세 분석**: 선택된 지역의 세부 스코어 레이더 차트

#### 🎯 **스코어 시각화**
- **종합 스코어**: 0-100점 게이지 차트
- **세부 스코어**: 레이더/별 형태 차트  
- **색상 구분**: 
  - 90-100: 🟢 최우수
  - 70-89: 🟡 우수
  - 50-69: 🟠 보통
  - 30-49: 🔴 개선필요
  - 0-29: ⚫ 시급

---

## 🔧 기술 사양 및 성능

### 📈 **응답 성능**
- **Traffic API**: ~100ms (캐싱 적용)
- **Heatmap API**: 
  - 구별 집계만: ~200ms (~50KB)
  - 정류장 상세 포함: ~800ms (~500KB)
- **Anomaly API**: ~150ms
- **DRT Score API**: ~300ms

### 🗄️ **실제 데이터 현황** (2025-09-01 확인)
- **버스 정류장**: 20,586개
- **승객 이력**: 3,600건 (1주일 샘플)
- **공간 매핑**: 20,586개 (서울시 25개 구)
- **집계 뷰**: 6개 Materialized Views
- **히트맵 데이터**: 18개 구에서 실제 교통량 집계됨

### 🔄 **실시간 업데이트**
```http
# 집계 데이터 새로고침 (필요시)
POST /api/v1/admin/refresh-views
```

---

## 🎨 프론트엔드 기술 스택 권장사항

### 📦 **핵심 라이브러리**
```json
{
  "지도": "react-leaflet 또는 @react-google-maps/api",
  "차트": "recharts 또는 chart.js",
  "UI": "antd 또는 mui",
  "상태관리": "zustand 또는 redux-toolkit",
  "HTTP": "axios 또는 fetch",
  "타입": "typescript"
}
```

### 🏗️ **컴포넌트 구조**
```
src/
├── components/
│   ├── TrafficPatternChart/
│   ├── SeoulHeatmap/
│   ├── AnomalyDetector/
│   └── DRTScoreAnalyzer/
├── services/
│   └── apiClient.ts
├── types/
│   └── api.types.ts
└── utils/
    └── mapUtils.ts
```

---

## 🧪 API 테스트 예시

### 🔍 **기본 테스트**
```bash
# 건강 상태 확인
curl http://localhost:8000/health

# 시간대별 교통량 (서울시 전체)
curl "http://localhost:8000/api/v1/traffic/hourly?analysis_month=2025-08-01&region_type=seoul"

# 히트맵 데이터 (구별 집계만)
curl "http://localhost:8000/api/v1/heatmap/seoul?analysis_month=2025-08-01&include_station_details=false"

# DRT 스코어 (출퇴근족)
curl "http://localhost:8000/api/v1/drt-score/commuter?analysis_month=2025-08-01&top_n=5"
```

---

## 📋 대시보드 와이어프레임 설계 가이드

### 🎯 **메인 대시보드 레이아웃**

#### 📱 **헤더 섹션**
- **제목**: "서울시 DRT 교통 분석 대시보드"
- **날짜 선택기**: 월별 데이터 선택 (현재: 2025-08 데이터 사용)
- **새로고침 버튼**: 데이터 업데이트

#### 🏠 **메인 콘텐츠 (우선순위별 구현 권장)**
```
┌─────────────────┬─────────────────┐
│ ✅ 시간대별       │ ✅ 서울시        │
│   교통 패턴       │   히트맵         │
│   (완전 구현됨)   │   (완전 구현됨)   │
├─────────────────┼─────────────────┤
│ ⚠️ 이상 패턴      │ ⚠️ DRT 스코어    │
│   감지           │   분석           │
│   (개발 중)       │   (데이터 준비중) │
└─────────────────┴─────────────────┘
```

**구현 우선순위:**
1. **1단계**: Traffic + Heatmap (완전 작동)
2. **2단계**: DRT Score (API 구현완료, 데이터 추가 필요)
3. **3단계**: Anomaly Pattern (개발 중)

#### 📊 **상세 페이지 구성**
1. **교통 패턴 상세**: 구별 드릴다운, 시간대별 필터
2. **히트맵 상세**: 정류장별 탐색, 레이어 토글
3. **이상 패턴 상세**: 원인 분석, 히스토리 추적
4. **DRT 분석 상세**: 3개 타입별 탭, 추천사항

---

## 💡 디자인 AI 프롬프트 제안

```
서울시 DRT(수요응답형 교통) 대시보드 와이어프레임을 디자인해주세요.

**요구사항:**
- 4개 주요 컴포넌트: 시간대별 교통 패턴 차트, 서울시 히트맵, 이상패턴 감지, DRT 스코어 분석
- 데스크톱 기준 1920x1080 해상도
- 현대적이고 깔끔한 UI (Material Design 스타일)
- 데이터 시각화 중심 설계
- 지도는 서울시 전체를 보여주며, 25개 구별 색상 구분
- 차트는 24시간 시간대별 라인 차트 (평일/주말 비교)
- 색상 스키마: 주 색상 파랑(#1976d2), 보조 색상 주황(#f57c00)

**데이터 특징:**
- 실시간 교통량 데이터 기반
- 20,586개 버스 정류장 포함
- 서울시 25개 구 행정구역 구분
- 시간대별(0-23시) 승하차 패턴 분석
- 출퇴근/관광/교통약자 3가지 DRT 타입 분석
```

이 명세서를 바탕으로 완성도 높은 DRT 대시보드를 설계하실 수 있을 것입니다! 🚀