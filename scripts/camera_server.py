#!/usr/bin/env python3
"""
라즈베리파이 USB 웹캠 스트리밍 서버
"""

import cv2
import time
import threading
from flask import Flask, Response, render_template_string
from flask_cors import CORS
import logging

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Next.js와의 CORS 문제 해결

class CameraStream:
    def __init__(self, camera_index=0, resolution=(1280, 720), fps=30):
        self.camera_index = camera_index
        self.resolution = resolution
        self.fps = fps
        self.cap = None
        self.frame = None
        self.last_frame_time = 0
        self.lock = threading.Lock()
        self.running = False
        
    def initialize_camera(self):
        """카메라 초기화"""
        try:
            # USB 웹캠 연결 시도
            self.cap = cv2.VideoCapture(self.camera_index)
            
            if not self.cap.isOpened():
                logger.error(f"카메라 {self.camera_index}를 열 수 없다")
                return False
            
            # 카메라 설정
            self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, self.resolution[0])
            self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, self.resolution[1])
            self.cap.set(cv2.CAP_PROP_FPS, self.fps)
            
            # 버퍼 크기 줄이기 (지연 감소)
            self.cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
            
            logger.info(f"카메라 {self.camera_index} 초기화 완료")
            logger.info(f"해상도: {self.resolution}, FPS: {self.fps}")
            
            return True
            
        except Exception as e:
            logger.error(f"카메라 초기화 실패: {e}")
            return False
    
    def start_capture(self):
        """카메라 캡처 시작"""
        if not self.initialize_camera():
            return False
        
        self.running = True
        capture_thread = threading.Thread(target=self._capture_frames)
        capture_thread.daemon = True
        capture_thread.start()
        
        return True
    
    def _capture_frames(self):
        """프레임 캡처 스레드"""
        while self.running and self.cap is not None:
            try:
                ret, frame = self.cap.read()
                
                if not ret:
                    logger.warning("프레임을 읽을 수 없다")
                    continue
                
                # 프레임에 타임스탬프 추가
                timestamp = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime())
                cv2.putText(frame, timestamp, (10, 30), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
                
                # 카메라 ID 추가
                cv2.putText(frame, "CAM-001 (USB)", (10, frame.shape[0] - 10), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
                
                with self.lock:
                    self.frame = frame.copy()
                    self.last_frame_time = time.time()
                
                # FPS 제어
                time.sleep(1.0 / self.fps)
                
            except Exception as e:
                logger.error(f"프레임 캡처 에러: {e}")
                break
    
    def get_frame(self):
        """현재 프레임 반환"""
        with self.lock:
            if self.frame is not None:
                return self.frame.copy()
            return None
    
    def stop(self):
        """카메라 중지"""
        self.running = False
        if self.cap is not None:
            self.cap.release()
            self.cap = None
        logger.info("카메라 스트리밍 중지")

# 전역 카메라 스트림 객체
camera_stream = CameraStream()

def generate_frames():
    """MJPEG 스트림용 프레임 생성기"""
    while True:
        frame = camera_stream.get_frame()
        
        if frame is None:
            # 카메라가 없을 때 기본 이미지 생성
            frame = create_no_camera_frame()
        
        # JPEG로 인코딩
        ret, buffer = cv2.imencode('.jpg', frame, 
                                 [cv2.IMWRITE_JPEG_QUALITY, 85])
        
        if ret:
            frame_data = buffer.tobytes()
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_data + b'\r\n')
        
        time.sleep(0.033)  # ~30 FPS

def create_no_camera_frame():
    """카메라가 연결되지 않았을 때 표시할 프레임"""
    frame = cv2.imread('/dev/null', cv2.IMREAD_COLOR)
    if frame is None:
        # 검은 화면 생성
        frame = cv2.zeros((720, 1280, 3), dtype=cv2.uint8)
    
    # 메시지 추가
    cv2.putText(frame, "Camera not connected", (150, 200), 
               cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
    cv2.putText(frame, "Check USB connection", (150, 250), 
               cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 255), 2)
    
    return frame

@app.route('/')
def index():
    """테스트용 인덱스 페이지"""
    return """
    <!DOCTYPE html>
    <html>
    <head>
        <title>라즈베리파이 웹캠 스트리밍</title>
        <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 20px; }
            img { border: 2px solid #333; border-radius: 10px; }
        </style>
    </head>
    <body>
        <h1>라즈베리파이 USB 웹캠 스트리밍</h1>
        <img src="/video_feed" alt="Live Camera Feed" style="max-width: 100%; height: auto;">
        <p>스트리밍 상태: <span id="status">연결 중...</span></p>
    </body>
    </html>
    """

@app.route('/video_feed')
def video_feed():
    """비디오 스트리밍 엔드포인트"""
    return Response(generate_frames(),
                   mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/status')
def camera_status():
    """카메라 상태 API"""
    current_time = time.time()
    is_active = (camera_stream.last_frame_time > 0 and 
                 current_time - camera_stream.last_frame_time < 5)
    
    return {
        'status': 'active' if is_active else 'inactive',
        'last_frame_time': camera_stream.last_frame_time,
        'camera_index': camera_stream.camera_index,
        'resolution': camera_stream.resolution,
        'fps': camera_stream.fps,
        'model': 'USB 웹캠',
        'uptime': current_time - camera_stream.last_frame_time if camera_stream.last_frame_time > 0 else 0,
        'current_time': time.strftime("%Y-%m-%d %H:%M:%S", time.localtime())
    }

if __name__ == '__main__':
    try:
        logger.info("카메라 서버 시작 중...")
        
        # 카메라 스트림 시작
        if camera_stream.start_capture():
            logger.info("카메라 스트리밍 시작됨")
        else:
            logger.warning("카메라를 찾을 수 없지만 서버는 시작함")
        
        # Flask 서버 시작
        app.run(host='0.0.0.0', port=5000, debug=False, threaded=True)
        
    except KeyboardInterrupt:
        logger.info("서버 종료 중...")
        camera_stream.stop()
    except Exception as e:
        logger.error(f"서버 에러: {e}")
        camera_stream.stop() 