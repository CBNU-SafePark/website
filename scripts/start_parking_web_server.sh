#!/bin/bash

# 주차장 추적 웹서버 시작 스크립트

echo "🚗 주차장 추적 웹서버 시작 중..."

# 현재 스크립트의 디렉토리로 이동
cd "$(dirname "$0")"

# 가상환경 활성화 (있는 경우)
if [ -d "venv" ]; then
    echo "가상환경 활성화 중..."
    source venv/bin/activate
fi

# Python 경로 확인
echo "Python 버전:"
python3 --version

# 필요한 패키지 설치 확인
echo "필요한 패키지들 확인 중..."
pip3 install --break-system-packages -r requirements.txt

# 카메라 디바이스 확인
echo "카메라 디바이스 확인:"
ls -la /dev/video* 2>/dev/null || echo "카메라 디바이스를 찾을 수 없음"

# GPIO 권한 확인 (라즈베리파이에서)
if [ -e /dev/gpiomem ]; then
    echo "GPIO 디바이스 확인됨"
else
    echo "GPIO 디바이스를 찾을 수 없음 (라즈베리파이가 아닐 수 있음)"
fi

echo ""
echo "🌐 웹서버 시작..."
echo "브라우저에서 http://라즈베리파이IP:5000 으로 접속하세요"
echo "로컬에서는 http://localhost:5000 으로 접속하세요"
echo ""
echo "종료하려면 Ctrl+C를 누르세요"
echo ""

# 웹서버 실행
python3 parking_web_server.py

echo "서버가 종료되었습니다." 