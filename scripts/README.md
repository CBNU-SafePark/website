# 라즈베리파이 USB 웹캠 스트리밍

이 스크립트들은 라즈베리파이4에 연결된 USB 웹캠을 웹브라우저에서 실시간으로 볼 수 있게 해준다.

## 필요한 것들

- 라즈베리파이 4
- USB 웹캠
- Python 3.7+
- 인터넷 연결

## 설치 및 사용법

### 1. USB 웹캠 연결 확인

```bash
# 연결된 비디오 장치 확인
ls /dev/video*

# 웹캠 정보 확인 (v4l-utils 설치 필요)
v4l2-ctl --list-devices
```

### 2. 사용자 권한 설정

```bash
# 현재 사용자를 video 그룹에 추가
sudo usermod -a -G video $USER

# 로그아웃 후 다시 로그인
# 또는 새 터미널 세션 시작
```

### 3. 카메라 서버 시작

```bash
# 자동 설치 및 실행
./start_camera_server.sh

# 또는 수동으로
cd scripts
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python3 camera_server.py
```

### 4. 웹사이트에서 확인

1. Next.js 개발 서버 시작: `npm run dev`
2. 브라우저에서 `/dashboard/camera` 페이지 방문
3. 실시간 웹캠 피드 확인

## API 엔드포인트

### 웹캠 스트림
- **URL**: `http://localhost:5000/video_feed`
- **타입**: MJPEG 스트림
- **설명**: 실시간 웹캠 영상

### 카메라 상태
- **URL**: `http://localhost:5000/status`
- **메소드**: GET
- **응답**: 
```json
{
  "status": "active|inactive",
  "last_frame_time": 1234567890,
  "camera_index": 0,
  "resolution": [640, 480],
  "fps": 30
}
```

### 테스트 페이지
- **URL**: `http://localhost:5000/`
- **설명**: 간단한 HTML 테스트 페이지

## 문제 해결

### 카메라를 찾을 수 없음
```bash
# USB 장치 확인
lsusb

# 비디오 장치 확인
ls -la /dev/video*

# 권한 확인
groups $USER
```

### 권한 오류
```bash
# video 그룹 추가
sudo usermod -a -G video $USER

# 재부팅 또는 로그아웃/로그인
```

### 포트 충돌
```bash
# 포트 5000이 사용 중인지 확인
sudo netstat -tlnp | grep :5000

# 다른 포트 사용하려면 camera_server.py의 마지막 라인 수정
app.run(host='0.0.0.0', port=5001, debug=False, threaded=True)
```

### 성능 최적화

1. **해상도 조정**: `camera_server.py`에서 `resolution=(640, 480)` 변경
2. **FPS 조정**: `fps=30` 값 변경 (낮추면 CPU 사용량 감소)
3. **JPEG 품질 조정**: `cv2.IMWRITE_JPEG_QUALITY, 85` 값 변경

## 자동 시작 설정

시스템 부팅 시 자동으로 카메라 서버를 시작하려면:

```bash
# systemd 서비스 파일 생성
sudo nano /etc/systemd/system/camera-stream.service
```

서비스 파일 내용:
```ini
[Unit]
Description=Camera Stream Server
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/var/www/website/scripts
ExecStart=/var/www/website/scripts/start_camera_server.sh
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

서비스 활성화:
```bash
sudo systemctl daemon-reload
sudo systemctl enable camera-stream.service
sudo systemctl start camera-stream.service

# 상태 확인
sudo systemctl status camera-stream.service
```

## 보안 고려사항

- 프로덕션 환경에서는 인증 및 HTTPS 사용 고려
- 방화벽 설정으로 포트 5000 접근 제한
- 카메라 스트림 암호화 고려 