#!/bin/bash

# DRT Dashboard ETL Pipeline Runner
# 사용법: ./run.sh [옵션]

set -e

# 색상 코드
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 로그 함수
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# ETL 디렉토리로 이동
cd "$(dirname "$0")"
ETL_DIR=$(pwd)

log_info "DRT Dashboard ETL Pipeline 시작..."
log_info "작업 디렉토리: $ETL_DIR"

# Python 가상환경 확인 및 생성
if [ ! -d "venv" ]; then
    log_info "Python 가상환경 생성 중..."
    python3 -m venv venv
fi

# 가상환경 활성화
source venv/bin/activate

# 의존성 설치
log_info "의존성 패키지 설치 중..."
pip install -q -r requirements.txt

# 환경 변수 로드
if [ -f ".env" ]; then
    log_info ".env 파일에서 환경변수 로드"
    export $(cat .env | grep -v '^#' | xargs)
else
    log_warning ".env 파일이 없습니다. .env.example을 참고하여 생성하세요."
fi

# 데이터베이스 연결 확인
log_info "데이터베이스 연결 확인 중..."
if ! python3 -c "
import asyncio
import asyncpg
import os
async def test_connection():
    conn = await asyncpg.connect(os.getenv('DATABASE_URL', 'postgresql://postgres@localhost:5432/ddf_mstgcn'))
    await conn.close()
    print('Connection OK')
asyncio.run(test_connection())
" 2>/dev/null; then
    log_error "데이터베이스 연결 실패. DATABASE_URL을 확인하세요."
    exit 1
fi

log_success "데이터베이스 연결 성공"

# ETL 실행
log_info "ETL 파이프라인 실행 중..."
python3 run_etl.py

# 결과 확인
if [ $? -eq 0 ]; then
    log_success "🎉 ETL 파이프라인이 성공적으로 완료되었습니다!"
    log_info "로그 파일: /tmp/etl_$(date +%Y%m%d).log"
else
    log_error "❌ ETL 파이프라인 실행 중 오류가 발생했습니다."
    exit 1
fi