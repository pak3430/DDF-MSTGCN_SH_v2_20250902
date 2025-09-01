# DRT Dashboard ETL Pipeline

DRT Dashboard의 Materialized Views를 갱신하는 ETL 파이프라인입니다.

## 📁 파일 구조

```
infrastructure/etl/
├── run_etl.py       # ETL 파이프라인 메인 스크립트
├── run.sh           # 실행 스크립트 (권장)
├── requirements.txt # Python 의존성
├── .env.example     # 환경 변수 예시
└── README.md        # 이 문서
```

## 🚀 실행 방법

### 1. 환경 설정

```bash
# .env 파일 생성
cp .env.example .env

# 데이터베이스 정보 수정
vim .env
```

### 2. ETL 실행

```bash
# 추천: 자동 설정 스크립트 사용
./run.sh

# 또는 직접 실행
python3 run_etl.py
```

## 🔧 환경 변수

| 변수명 | 설명 | 기본값 |
|--------|------|--------|
| `DATABASE_URL` | PostgreSQL 연결 문자열 | `postgresql://postgres@localhost:5432/ddf_mstgcn` |
| `ETL_LOG_LEVEL` | 로그 레벨 | `INFO` |

## 📊 처리하는 Materialized Views

1. **mv_hourly_traffic_patterns** - 구별 시간대별 교통 패턴
2. **mv_district_monthly_traffic** - 구별 월간 교통량 집계
3. **mv_station_monthly_traffic** - 정류장별 월간 교통량
4. **mv_seoul_hourly_patterns** - 서울시 전체 시간대별 패턴
5. **mv_station_hourly_patterns** - 정류장별 시간대별 패턴

## 🔍 문제 해결

### 구별 데이터가 0으로 나오는 경우

이 ETL 파이프라인을 실행하면 해결됩니다:

```bash
./run.sh
```

**원인**: Materialized Views가 갱신되지 않아 구별 데이터가 없었음  
**해결**: ETL 실행으로 모든 구별 데이터 집계 및 갱신

### 데이터베이스 연결 오류

```bash
# 연결 문자열 확인
echo $DATABASE_URL

# PostgreSQL 서비스 상태 확인
sudo systemctl status postgresql

# 수동 연결 테스트
psql postgresql://postgres@localhost:5432/ddf_mstgcn
```

## 📈 실행 결과 확인

ETL 완료 후 다음 명령어로 확인:

```sql
-- 구별 데이터 확인
SELECT sgg_name, COUNT(*) 
FROM mv_hourly_traffic_patterns 
WHERE month_date = '2025-07-01' 
GROUP BY sgg_name 
ORDER BY COUNT(*) DESC;

-- 전체 통계 확인
SELECT * FROM check_mv_statistics();
```

## ⏰ 자동화

cron을 사용한 일일 자동 실행:

```bash
# crontab 편집
crontab -e

# 매일 오전 3시 실행
0 3 * * * cd /path/to/infrastructure/etl && ./run.sh >> /var/log/drt_etl.log 2>&1
```

## 🔧 개발자 참고

### 의존성 패키지

- `asyncpg`: PostgreSQL 비동기 드라이버
- `python-dotenv`: 환경 변수 관리

### 로그 파일

- 위치: `/tmp/etl_YYYYMMDD.log`
- 레벨: INFO, DEBUG, WARNING, ERROR

### 성능 최적화

- Materialized Views 갱신 순서 최적화
- 인덱스 활용한 빠른 집계
- 병렬 처리 가능한 독립적 뷰들 구분

## 📞 문의

ETL 관련 문제 발생 시:

1. 로그 파일 확인: `/tmp/etl_YYYYMMDD.log`
2. 데이터베이스 연결 상태 확인
3. Materialized Views 상태 점검: `SELECT * FROM check_mv_statistics();`