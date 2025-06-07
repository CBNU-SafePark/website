# 라즈베리파이 스마트 주차장 추적 시스템

라즈베리파이에서 USB 웹캠과 색상 기반 객체 탐지를 활용한 실시간 주차장 추적 시스템이다.

## 주요 기능

### 🎥 카메라 스트리밍 서버
- USB 웹캠을 통한 실시간 비디오 스트리밍 (1280x720 고화질)
- Flask 웹서버 기반
- MJPEG 스트리밍 지원
- CORS 지원으로 Next.js와 호환

### 🚗 주차장 추적 시스템  
- 색상 기반 차량 탐지 (파랑, 노랑, 하양)
- 8개 주차구역 실시간 점유 상태 모니터링
- 차량 추적 및 ID 할당
- 센서와 차량 간 거리 경고 시스템
- 차량 간 충돌 경고 시스템
- GPIO를 통한 LED/부저 경고 알림

### 🌐 웹 인터페이스
- 실시간 객체 탐지 결과 웹 스트리밍
- 직관적인 상태 정보 대시보드
- REST API 제공
- 모바일 반응형 디자인

## 필요한 패키지

```bash
sudo apt update
sudo apt install python3-pip python3-opencv
pip3 install --break-system-packages flask flask-cors opencv-python RPi.GPIO numpy
```

## 사용 방법

### 1. 기본 카메라 서버만 실행
```bash
python3 camera_server.py
# 또는
./start_camera_server.sh
```

### 2. 주차장 추적 시스템 (GUI 모드)
```bash
python3 parking_tracker.py
```

### 3. 주차장 추적 웹서버 (추천)
```bash
python3 parking_web_server.py
# 또는  
./start_parking_web_server.sh
```

### 4. 웹 브라우저에서 접속
- http://라즈베리파이IP:5000 (외부 접속)
- http://localhost:5000 (로컬 접속)

## API 엔드포인트

### 기본 엔드포인트
- `/` - 메인 대시보드 페이지
- `/video_feed` - MJPEG 비디오 스트림
- `/status` - 시스템 상태 정보 (JSON)

### 추가 API (주차장 추적)
- `/api/parking_spots` - 주차구역 상세 정보
- `/api/warnings` - 현재 경고 상황

## 시스템 설정

### 카메라 설정
- 해상도: 1280x720 (고화질)
- FPS: 20
- 카메라 디바이스: /dev/video0

### GPIO 핀 설정 (라즈베리파이)
- LED: GPIO 18
- 부저: GPIO 19  
- 초음파 센서 TRIG: GPIO 24
- 초음파 센서 ECHO: GPIO 23

### 주차장 영역 설정
주차장 좌표는 `parking_web_server.py`에서 수정할 수 있다:
```python
self.parking_area = [
    (205, 17),   # 좌상단
    (997, 13),   # 우상단
    (1031, 695), # 우하단
    (209, 717)   # 좌하단
]
```

## 색상 탐지 설정

HSV 색상 범위 조정:
```python
self.color_ranges = {
    'blue': ([100, 100, 120], [130, 255, 255]),
    'yellow': ([25, 50, 50], [40, 255, 255]),
    'white': ([0, 0, 180], [180, 25, 255])
}
```

## 문제 해결

### 카메라가 인식되지 않는 경우
```bash
# 카메라 디바이스 확인
ls -la /dev/video*

# USB 카메라 재연결
sudo modprobe uvcvideo

# 권한 문제 해결
sudo usermod -a -G video $USER
```

### GPIO 권한 문제
```bash
# GPIO 그룹에 사용자 추가
sudo usermod -a -G gpio $USER

# 재부팅 또는 재로그인 필요
```

### 포트가 이미 사용 중인 경우
```bash
# 5000번 포트 사용 중인 프로세스 확인
sudo lsof -i :5000

# 프로세스 종료
sudo kill -9 <PID>
```

## 성능 최적화

- 해상도 조정: (1280, 720) → (640, 480) (성능 우선)
- FPS 조정: 20fps → 15fps (CPU 사용량 감소)
- JPEG 품질: 85 → 70 (대역폭 절약)
- 탐지 영역 제한으로 CPU 부하 감소

## 주요 특징

### 차량 추적
- 색상 기반 객체 탐지
- 실시간 차량 ID 할당 및 추적
- 이동 경로 표시

### 주차구역 관리
- 8개 주차구역 실시간 모니터링
- 점유/비어있음 상태 표시
- 구역별 차량 정보 표시

### 경고 시스템
- 센서와 차량 간 거리 경고
- 차량 간 충돌 경고
- LED/부저를 통한 물리적 알림
- 웹 인터페이스 시각적 경고

## 자동 시작 설정

시스템 부팅 시 자동으로 주차장 추적 서버를 시작하려면:

```bash
# systemd 서비스 파일 생성
sudo nano /etc/systemd/system/parking-tracker.service
```

서비스 파일 내용:
```ini
[Unit]
Description=Parking Tracker Web Server
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/var/www/website/scripts
ExecStart=/var/www/website/scripts/start_parking_web_server.sh
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

서비스 활성화:
```bash
sudo systemctl daemon-reload
sudo systemctl enable parking-tracker.service
sudo systemctl start parking-tracker.service

# 상태 확인
sudo systemctl status parking-tracker.service
```

## 보안 고려사항

- 외부에서 접속할 경우 보안에 주의하라
- 필요시 인증 기능을 추가하라
- 방화벽 설정을 확인하라

## 라이선스

MIT License 