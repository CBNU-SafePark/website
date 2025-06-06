#!/bin/bash

# 스크립트 디렉토리로 이동
cd "$(dirname "$0")"

echo "=== 라즈베리파이 웹캠 서버 시작 ==="

# 가상환경이 있는지 확인
if [ ! -d "venv" ]; then
    echo "가상환경 생성 중..."
    python3 -m venv venv
fi

# 가상환경 활성화
echo "가상환경 활성화 중..."
source venv/bin/activate

# 의존성 설치
echo "의존성 설치 중..."
pip install -r requirements.txt

# USB 카메라 권한 확인
echo "USB 카메라 장치 확인 중..."
if ls /dev/video* 1> /dev/null 2>&1; then
    echo "발견된 비디오 장치:"
    ls -la /dev/video*
    echo ""
else
    echo "⚠️  비디오 장치를 찾을 수 없습니다. USB 웹캠 연결을 확인하세요."
    echo ""
fi

# 현재 사용자가 video 그룹에 있는지 확인
if groups $USER | grep -q '\bvideo\b'; then
    echo "✅ 사용자 권한 확인됨 (video 그룹)"
else
    echo "⚠️  비디오 장치 접근 권한이 없을 수 있습니다."
    echo "다음 명령어로 권한을 추가할 수 있습니다:"
    echo "sudo usermod -a -G video $USER"
    echo "그 후 로그아웃하고 다시 로그인하세요."
    echo ""
fi

echo "카메라 서버 시작 중... (포트 5000)"
echo "종료하려면 Ctrl+C를 누르세요."
echo "브라우저에서 http://localhost:5000 에 접속해서 테스트할 수 있습니다."
echo ""

# Python 서버 실행
python3 camera_server.py 