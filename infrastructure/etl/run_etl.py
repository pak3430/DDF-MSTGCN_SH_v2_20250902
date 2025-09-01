#!/usr/bin/env python3
"""
DRT Dashboard ETL Pipeline
작성일: 2025-09-01
목적: Materialized Views 갱신 및 데이터 집계 자동화

실행 방법:
python3 run_etl.py

환경변수:
- DATABASE_URL: PostgreSQL 연결 문자열
- ETL_LOG_LEVEL: 로그 레벨 (DEBUG, INFO, WARNING, ERROR)
"""

import os
import sys
import logging
import asyncio
import asyncpg
from datetime import datetime, timedelta
from typing import Optional

# 로깅 설정
logging.basicConfig(
    level=getattr(logging, os.getenv('ETL_LOG_LEVEL', 'INFO')),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler(f'/tmp/etl_{datetime.now().strftime("%Y%m%d")}.log')
    ]
)
logger = logging.getLogger(__name__)

class DRTETLPipeline:
    """DRT Dashboard ETL 파이프라인"""
    
    def __init__(self):
        self.db_url = os.getenv('DATABASE_URL', 'postgresql://postgres@localhost:5432/ddf_mstgcn')
        self.connection: Optional[asyncpg.Connection] = None
        
    async def connect(self):
        """데이터베이스 연결"""
        try:
            self.connection = await asyncpg.connect(self.db_url)
            logger.info("데이터베이스 연결 성공")
        except Exception as e:
            logger.error(f"데이터베이스 연결 실패: {e}")
            raise
    
    async def disconnect(self):
        """데이터베이스 연결 해제"""
        if self.connection:
            await self.connection.close()
            logger.info("데이터베이스 연결 해제")
    
    async def check_source_data(self) -> dict:
        """소스 데이터 상태 확인"""
        logger.info("소스 데이터 상태 확인 중...")
        
        stats = {}
        
        # 1. station_passenger_history 테이블 확인
        query = """
        SELECT 
            COUNT(*) as total_records,
            COUNT(DISTINCT node_id) as unique_stations,
            COUNT(DISTINCT record_date) as unique_dates,
            MIN(record_date) as earliest_date,
            MAX(record_date) as latest_date
        FROM station_passenger_history;
        """
        result = await self.connection.fetchrow(query)
        stats['passenger_history'] = dict(result)
        
        # 2. spatial_mapping 테이블 확인
        query = """
        SELECT 
            COUNT(*) as total_mappings,
            COUNT(*) FILTER (WHERE is_seoul = TRUE) as seoul_stations,
            COUNT(DISTINCT sgg_name) as unique_districts
        FROM spatial_mapping;
        """
        result = await self.connection.fetchrow(query)
        stats['spatial_mapping'] = dict(result)
        
        # 3. bus_stops 테이블 확인
        query = """
        SELECT 
            COUNT(*) as total_bus_stops,
            COUNT(*) FILTER (WHERE coordinates_x IS NOT NULL AND coordinates_y IS NOT NULL) as with_coordinates
        FROM bus_stops;
        """
        result = await self.connection.fetchrow(query)
        stats['bus_stops'] = dict(result)
        
        logger.info(f"소스 데이터 상태: {stats}")
        return stats
    
    async def refresh_materialized_views(self):
        """Materialized Views 갱신"""
        logger.info("Materialized Views 갱신 시작...")
        
        try:
            # 1. 기본 교통 패턴 갱신
            logger.info("1/4: 시간대별 교통 패턴 갱신...")
            await self.connection.execute("REFRESH MATERIALIZED VIEW mv_hourly_traffic_patterns;")
            
            # 2. 구별 월간 교통량 갱신
            logger.info("2/4: 구별 월간 교통량 갱신...")
            await self.connection.execute("REFRESH MATERIALIZED VIEW mv_district_monthly_traffic;")
            
            # 3. 정류장별 월간 교통량 갱신
            logger.info("3/4: 정류장별 월간 교통량 갱신...")
            await self.connection.execute("REFRESH MATERIALIZED VIEW mv_station_monthly_traffic;")
            
            # 4. 서울시 전체 시간대별 패턴 갱신 (의존성 있음)
            logger.info("4/4: 서울시 전체 시간대별 패턴 갱신...")
            await self.connection.execute("REFRESH MATERIALIZED VIEW mv_seoul_hourly_patterns;")
            
            logger.info("✅ 모든 Materialized Views 갱신 완료")
            
        except Exception as e:
            logger.error(f"❌ Materialized Views 갱신 실패: {e}")
            raise
    
    async def refresh_station_hourly_patterns(self):
        """정류장별 시간대별 패턴 갱신 (추가 MV)"""
        logger.info("정류장별 시간대별 패턴 갱신...")
        
        try:
            await self.connection.execute("SELECT refresh_station_hourly_patterns();")
            logger.info("✅ 정류장별 시간대별 패턴 갱신 완료")
        except Exception as e:
            logger.error(f"❌ 정류장별 시간대별 패턴 갱신 실패: {e}")
            raise
    
    async def verify_results(self) -> dict:
        """결과 검증"""
        logger.info("결과 검증 중...")
        
        verification = {}
        
        try:
            # 1. 각 MV의 레코드 수 확인
            mvs = [
                'mv_hourly_traffic_patterns',
                'mv_district_monthly_traffic', 
                'mv_station_monthly_traffic',
                'mv_seoul_hourly_patterns',
                'mv_station_hourly_patterns'
            ]
            
            for mv in mvs:
                try:
                    count = await self.connection.fetchval(f"SELECT COUNT(*) FROM {mv};")
                    verification[mv] = {'record_count': count, 'status': 'OK' if count > 0 else 'EMPTY'}
                except Exception as e:
                    verification[mv] = {'record_count': 0, 'status': f'ERROR: {e}'}
            
            # 2. 구별 데이터 확인 (문제가 되었던 부분)
            query = """
            SELECT 
                COUNT(DISTINCT sgg_name) as district_count,
                COUNT(*) as total_records
            FROM mv_hourly_traffic_patterns 
            WHERE month_date = '2025-07-01';
            """
            result = await self.connection.fetchrow(query)
            verification['district_coverage'] = dict(result)
            
            # 3. 샘플 구별 데이터 확인
            query = """
            SELECT sgg_name, COUNT(*) as record_count
            FROM mv_hourly_traffic_patterns 
            WHERE month_date = '2025-07-01'
            GROUP BY sgg_name
            ORDER BY record_count DESC
            LIMIT 5;
            """
            results = await self.connection.fetch(query)
            verification['top_districts'] = [dict(r) for r in results]
            
            logger.info(f"결과 검증: {verification}")
            return verification
            
        except Exception as e:
            logger.error(f"❌ 결과 검증 실패: {e}")
            raise
    
    async def run_etl(self):
        """전체 ETL 파이프라인 실행"""
        start_time = datetime.now()
        logger.info(f"🚀 ETL 파이프라인 시작: {start_time}")
        
        try:
            # 1. 데이터베이스 연결
            await self.connect()
            
            # 2. 소스 데이터 상태 확인
            source_stats = await self.check_source_data()
            
            # 3. Materialized Views 갱신
            await self.refresh_materialized_views()
            
            # 4. 정류장별 시간대별 패턴 갱신
            await self.refresh_station_hourly_patterns()
            
            # 5. 결과 검증
            verification = await self.verify_results()
            
            end_time = datetime.now()
            duration = end_time - start_time
            
            logger.info(f"✅ ETL 파이프라인 완료: {end_time}")
            logger.info(f"⏱️ 소요 시간: {duration}")
            
            # 6. 요약 출력
            print("\n" + "="*60)
            print("🎉 DRT Dashboard ETL 파이프라인 완료!")
            print("="*60)
            print(f"📊 소스 데이터: {source_stats['passenger_history']['total_records']:,}개 레코드")
            print(f"🏢 서울시 정류장: {source_stats['spatial_mapping']['seoul_stations']:,}개")
            print(f"🗺️ 자치구 수: {source_stats['spatial_mapping']['unique_districts']}개")
            print(f"📅 데이터 기간: {source_stats['passenger_history']['earliest_date']} ~ {source_stats['passenger_history']['latest_date']}")
            print(f"⏱️ 처리 시간: {duration}")
            print("\n📈 Materialized Views 상태:")
            for mv, stats in verification.items():
                if isinstance(stats, dict) and 'record_count' in stats:
                    status_icon = "✅" if stats['status'] == 'OK' else "❌"
                    print(f"  {status_icon} {mv}: {stats['record_count']:,}개 레코드")
            print("="*60)
            
        except Exception as e:
            logger.error(f"❌ ETL 파이프라인 실패: {e}")
            raise
        finally:
            await self.disconnect()

async def main():
    """메인 실행 함수"""
    try:
        etl = DRTETLPipeline()
        await etl.run_etl()
    except KeyboardInterrupt:
        logger.info("❌ 사용자에 의해 중단됨")
        sys.exit(1)
    except Exception as e:
        logger.error(f"❌ ETL 실행 실패: {e}")
        sys.exit(1)

if __name__ == "__main__":
    print("🚀 DRT Dashboard ETL Pipeline Starting...")
    asyncio.run(main())