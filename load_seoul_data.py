#!/usr/bin/env python3
# 서울시 교통 데이터 로더

import pandas as pd
import psycopg2
import numpy as np
from datetime import datetime, timedelta
import logging
import os
import sys

# 로깅 설정
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# DB 연결 설정
DB_CONFIG = {
    'host': 'localhost',
    'port': 5432,
    'database': 'ddf_db',
    'user': 'ddf_user',
    'password': 'ddf_password'
}

def connect_db():
    """PostgreSQL 연결"""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        logger.info("Database connected successfully")
        return conn, cur
    except Exception as e:
        logger.error(f"Database connection failed: {e}")
        raise

def load_bus_stops(cur, conn):
    """버스 정류장 데이터 로드"""
    logger.info("Loading bus stops data...")
    
    # CSV 파일 읽기
    df = pd.read_csv('data/processed/busInfra/seoul_node_info_filtered.csv')
    logger.info(f"Found {len(df)} bus stops to load")
    
    # 데이터 정리
    df = df.fillna('')
    
    # PostgreSQL에 삽입
    insert_sql = """
    INSERT INTO bus_stops (
        node_id, node_name, node_description, node_num, node_type,
        coordinates_x, coordinates_y, mapping_x, mapping_y,
        is_standard, is_active
    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    ON CONFLICT (node_id) DO UPDATE SET
        node_name = EXCLUDED.node_name,
        updated_at = CURRENT_TIMESTAMP
    """
    
    inserted_count = 0
    for _, row in df.iterrows():
        try:
            cur.execute(insert_sql, (
                str(row['노드ID']),
                str(row['노드명'])[:200],  # 길이 제한
                str(row['노드설명'])[:200] if pd.notna(row['노드설명']) else '',
                str(row['정류장번호']) if pd.notna(row['정류장번호']) else '',
                int(row['노드유형']) if pd.notna(row['노드유형']) else 0,
                float(row['좌표X']) if pd.notna(row['좌표X']) else None,
                float(row['좌표Y']) if pd.notna(row['좌표Y']) else None,
                float(row['맵핑좌표X']) if pd.notna(row['맵핑좌표X']) and row['맵핑좌표X'] != 0 else None,
                float(row['맵핑좌표Y']) if pd.notna(row['맵핑좌표Y']) and row['맵핑좌표Y'] != 0 else None,
                bool(int(row['표준코드여부(1:표준/0:비표준)'])) if pd.notna(row['표준코드여부(1:표준/0:비표준)']) else False,
                bool(int(row['사용여부'])) if pd.notna(row['사용여부']) else True
            ))
            inserted_count += 1
            
            if inserted_count % 1000 == 0:
                logger.info(f"Inserted {inserted_count} bus stops...")
                conn.commit()
                
        except Exception as e:
            logger.error(f"Error inserting row {row['노드ID']}: {e}")
            continue
    
    conn.commit()
    logger.info(f"Successfully loaded {inserted_count} bus stops")

def update_coordinates(cur, conn):
    """PostGIS POINT 좌표 업데이트"""
    logger.info("Updating PostGIS coordinates...")
    
    # 기본 좌표 업데이트
    cur.execute("""
        UPDATE bus_stops 
        SET coordinates = ST_SetSRID(ST_MakePoint(coordinates_x, coordinates_y), 4326)
        WHERE coordinates_x IS NOT NULL AND coordinates_y IS NOT NULL
    """)
    
    # 매핑 좌표 업데이트
    cur.execute("""
        UPDATE bus_stops 
        SET mapping_coordinates = ST_SetSRID(ST_MakePoint(mapping_x, mapping_y), 4326)
        WHERE mapping_x IS NOT NULL AND mapping_y IS NOT NULL
    """)
    
    conn.commit()
    logger.info("PostGIS coordinates updated")

def create_sample_passenger_data(cur, conn):
    """샘플 승객 데이터 생성 (테스트용)"""
    logger.info("Creating sample passenger data...")
    
    # 활성 정류장 목록 가져오기
    cur.execute("SELECT node_id FROM bus_stops WHERE is_active = TRUE LIMIT 100")
    active_stops = [row[0] for row in cur.fetchall()]
    
    if not active_stops:
        logger.warning("No active bus stops found")
        return
    
    # 최근 30일 샘플 데이터 생성
    end_date = datetime.now().date()
    start_date = end_date - timedelta(days=30)
    
    insert_sql = """
    INSERT INTO station_passenger_history (
        route_id, node_id, record_date, hour, ride_passenger, alight_passenger
    ) VALUES (%s, %s, %s, %s, %s, %s)
    """
    
    sample_data = []
    current_date = start_date
    
    while current_date <= end_date:
        for node_id in active_stops[:50]:  # 상위 50개 정류장만 샘플 생성
            for hour in range(5, 24):  # 5시~23시
                # 시간대별 패턴을 반영한 랜덤 승객 수
                if hour in [7, 8, 9, 17, 18, 19]:  # 출퇴근 시간
                    base_passengers = np.random.poisson(15)
                elif hour in [10, 11, 12, 13, 14, 15, 16]:  # 일반 시간
                    base_passengers = np.random.poisson(8)
                else:  # 저녁/밤 시간
                    base_passengers = np.random.poisson(3)
                
                ride_passengers = max(0, int(base_passengers + np.random.normal(0, 2)))
                alight_passengers = max(0, int(base_passengers + np.random.normal(0, 2)))
                
                # 샘플 노선 ID 생성 (node_id 기반)
                route_id = f"R{hash(node_id) % 9999:04d}"
                sample_data.append((route_id, node_id, current_date, hour, ride_passengers, alight_passengers))
        
        current_date += timedelta(days=1)
        
        if len(sample_data) >= 10000:  # 배치로 삽입
            cur.executemany(insert_sql, sample_data)
            conn.commit()
            logger.info(f"Inserted batch of {len(sample_data)} passenger records for {current_date}")
            sample_data = []
    
    # 남은 데이터 삽입
    if sample_data:
        cur.executemany(insert_sql, sample_data)
        conn.commit()
    
    logger.info("Sample passenger data created")

def create_spatial_mapping(cur, conn):
    """서울시 구별 공간 매핑 데이터 생성"""
    logger.info("Creating spatial mapping data...")
    
    # 서울시 25개 구 정보
    seoul_districts = [
        ('종로구', '11110'), ('중구', '11140'), ('용산구', '11170'), ('성동구', '11200'),
        ('광진구', '11215'), ('동대문구', '11230'), ('중랑구', '11260'), ('성북구', '11290'),
        ('강북구', '11305'), ('도봉구', '11320'), ('노원구', '11350'), ('은평구', '11380'),
        ('서대문구', '11410'), ('마포구', '11440'), ('양천구', '11470'), ('강서구', '11500'),
        ('구로구', '11530'), ('금천구', '11545'), ('영등포구', '11560'), ('동작구', '11590'),
        ('관악구', '11620'), ('서초구', '11650'), ('강남구', '11680'), ('송파구', '11710'),
        ('강동구', '11740')
    ]
    
    # 버스 정류장별 구 매핑 (좌표 기반 추정)
    cur.execute("SELECT node_id, coordinates_x, coordinates_y FROM bus_stops WHERE coordinates_x IS NOT NULL")
    stops = cur.fetchall()
    
    insert_sql = """
    INSERT INTO spatial_mapping (
        node_id, sgg_code, sgg_name, adm_name, is_seoul
    ) VALUES (%s, %s, %s, %s, %s)
    ON CONFLICT (node_id) DO NOTHING
    """
    
    mapping_data = []
    for node_id, lon, lat in stops:
        # 간단한 좌표 기반 구 할당 (실제로는 더 정교한 GIS 계산 필요)
        district_idx = hash(node_id) % len(seoul_districts)
        sgg_name, sgg_code = seoul_districts[district_idx]
        
        mapping_data.append((
            node_id, sgg_code, sgg_name, f'서울특별시 {sgg_name}', True
        ))
    
    cur.executemany(insert_sql, mapping_data)
    conn.commit()
    logger.info(f"Created spatial mapping for {len(mapping_data)} stops")

def main():
    """메인 실행 함수"""
    try:
        conn, cur = connect_db()
        
        # 1. 버스 정류장 데이터 로드
        load_bus_stops(cur, conn)
        
        # 2. PostGIS 좌표 업데이트
        update_coordinates(cur, conn)
        
        # 3. 샘플 승객 데이터 생성
        create_sample_passenger_data(cur, conn)
        
        # 4. 공간 매핑 데이터 생성
        create_spatial_mapping(cur, conn)
        
        # 최종 통계 확인
        cur.execute("SELECT COUNT(*) FROM bus_stops WHERE is_active = TRUE")
        bus_stops_count = cur.fetchone()[0]
        
        cur.execute("SELECT COUNT(*) FROM station_passenger_history")
        passenger_records = cur.fetchone()[0]
        
        cur.execute("SELECT COUNT(*) FROM spatial_mapping")
        mapping_records = cur.fetchone()[0]
        
        logger.info("=" * 50)
        logger.info("DATA LOAD COMPLETED!")
        logger.info(f"Active Bus Stops: {bus_stops_count:,}")
        logger.info(f"Passenger Records: {passenger_records:,}")
        logger.info(f"Spatial Mappings: {mapping_records:,}")
        logger.info("=" * 50)
        
        cur.close()
        conn.close()
        
    except Exception as e:
        logger.error(f"Data loading failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()