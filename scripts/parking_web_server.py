#!/usr/bin/env python3
"""
라즈베리파이 주차장 추적 웹서버
객체 탐지 결과를 실시간으로 웹페이지에 스트리밍
"""

import cv2
import time
import threading
import numpy as np
import os
import math
from collections import deque
from flask import Flask, Response, render_template_string, jsonify
from flask_cors import CORS
import logging

# RPi.GPIO 임포트 (라즈베리파이에서만 작동)
try:
    import RPi.GPIO as GPIO
    GPIO_AVAILABLE = True
except ImportError:
    print("RPi.GPIO를 사용할 수 없다. 시뮬레이션 모드로 실행한다.")
    GPIO_AVAILABLE = False

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
# CORS 설정 - 모든 origin에서 접근 허용
CORS(app, resources={
    r"/api/*": {
        "origins": "*",
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    },
    r"/status": {
        "origins": "*",
        "methods": ["GET", "OPTIONS"],
        "allow_headers": ["Content-Type"]
    }
})

class ParkingTrackerWebServer:
    def __init__(self, camera_index=0, resolution=(1280, 720), fps=20):
        self.camera_index = camera_index
        self.resolution = resolution
        self.fps = fps
        self.cap = None
        self.frame = None
        self.processed_frame = None
        self.last_frame_time = 0
        self.lock = threading.Lock()
        self.running = False
        
        # GPIO 설정 (라즈베리파이에서만)
        if GPIO_AVAILABLE:
            self.LED_PIN = 18
            self.BUZZER_PIN = 19
            self.TRIG_PIN = 24
            self.ECHO_PIN = 23
            
            GPIO.setmode(GPIO.BCM)
            GPIO.setup(self.LED_PIN, GPIO.OUT)
            GPIO.setup(self.BUZZER_PIN, GPIO.OUT)
            GPIO.setup(self.TRIG_PIN, GPIO.OUT)
            GPIO.setup(self.ECHO_PIN, GPIO.IN)
            GPIO.output(self.LED_PIN, GPIO.LOW)
            GPIO.output(self.BUZZER_PIN, GPIO.LOW)
            GPIO.output(self.TRIG_PIN, GPIO.LOW)
        
        # 주차장 영역 좌표 (1280x720 해상도에 맞게 조정)
        self.parking_area = [
            (205, 17),   # 좌상단
            (997, 13),   # 우상단
            (1031, 695), # 우하단
            (209, 717)   # 좌하단
        ]
        
        # 센서 위치
        self.ultrasonic_positions = [
            (237, 671),  # 1번 초음파
            (267, 60),   # 2번 초음파  
            (1025, 109), # 3번 초음파
            (940, 54)    # 4번 초음파
        ]
        
        self.barrier_positions = [
            (1062, 654), # 1번 차단기
            (959, 386)   # 2번 차단기
        ]
        
        # 색상 범위 설정 (HSV)
        self.color_ranges = {
            'blue': ([100, 100, 120], [130, 255, 255]),
            'yellow': ([25, 50, 50], [40, 255, 255]),
            'white': ([0, 0, 180], [180, 25, 255])
        }
        
        # 주차구역 8개 정의
        self.parking_spots = [
            {'id': 1, 'bbox': (366, 125, 114, 126), 'center': (423, 188), 'occupied': False, 'vehicle_id': None, 'vehicle_color': None},
            {'id': 2, 'bbox': (480, 125, 141, 126), 'center': (550, 188), 'occupied': False, 'vehicle_id': None, 'vehicle_color': None},
            {'id': 3, 'bbox': (621, 125, 112, 126), 'center': (677, 188), 'occupied': False, 'vehicle_id': None, 'vehicle_color': None},
            {'id': 4, 'bbox': (733, 125, 118, 126), 'center': (792, 188), 'occupied': False, 'vehicle_id': None, 'vehicle_color': None},
            {'id': 5, 'bbox': (372, 389, 121, 148), 'center': (432, 463), 'occupied': False, 'vehicle_id': None, 'vehicle_color': None},
            {'id': 6, 'bbox': (493, 389, 125, 148), 'center': (555, 463), 'occupied': False, 'vehicle_id': None, 'vehicle_color': None},
            {'id': 7, 'bbox': (618, 389, 115, 148), 'center': (675, 463), 'occupied': False, 'vehicle_id': None, 'vehicle_color': None},
            {'id': 8, 'bbox': (733, 389, 126, 148), 'center': (796, 463), 'occupied': False, 'vehicle_id': None, 'vehicle_color': None}
        ]
        
        # 탐지된 차량 추적
        self.tracked_cars = deque(maxlen=15)
        self.next_vehicle_id = 1
        self.previous_vehicles = []
        
        # 경고 설정
        self.warning_distance = 80
        self.vehicle_collision_distance = 100
        self.last_warning_time = 0
        self.warning_cooldown = 1.5
        
        # 통계 정보
        self.frame_count = 0
        self.detected_vehicles = []
        self.current_warnings = []
        
        logger.info("주차장 추적 웹서버 초기화 완료")
        
    def initialize_camera(self):
        """카메라 초기화"""
        try:
            self.cap = cv2.VideoCapture(self.camera_index)
            
            if not self.cap.isOpened():
                logger.error(f"카메라 {self.camera_index}를 열 수 없다")
                return False
            
            # 카메라 설정
            self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, self.resolution[0])
            self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, self.resolution[1])
            self.cap.set(cv2.CAP_PROP_FPS, self.fps)
            self.cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
            
            logger.info(f"카메라 초기화 완료 - 해상도: {self.resolution}, FPS: {self.fps}")
            return True
            
        except Exception as e:
            logger.error(f"카메라 초기화 실패: {e}")
            return False
    
    def start_processing(self):
        """처리 시작"""
        if not self.initialize_camera():
            return False
        
        self.running = True
        processing_thread = threading.Thread(target=self._process_frames)
        processing_thread.daemon = True
        processing_thread.start()
        
        return True
    
    def _process_frames(self):
        """프레임 처리 스레드"""
        while self.running and self.cap is not None:
            try:
                ret, frame = self.cap.read()
                
                if not ret:
                    logger.warning("프레임을 읽을 수 없다")
                    continue
                
                self.frame_count += 1
                
                # 차량 탐지 및 분석
                detected_cars = self.detect_cars_by_color(frame)
                self.check_spot_occupancy(detected_cars)
                
                # 경고 확인
                sensor_warnings = self.calculate_distance_to_sensors(detected_cars)
                collision_warnings = self.check_vehicle_collisions(detected_cars)
                all_warnings = sensor_warnings + collision_warnings
                
                # 처리된 프레임 생성
                processed_frame = self.draw_interface(frame.copy(), detected_cars, all_warnings)
                
                # 경고 처리
                if GPIO_AVAILABLE:
                    self.handle_warning(all_warnings)
                
                # 타임스탬프 추가
                timestamp = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime())
                cv2.putText(processed_frame, timestamp, (10, processed_frame.shape[0] - 30), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
                
                with self.lock:
                    self.frame = frame.copy()
                    self.processed_frame = processed_frame
                    self.detected_vehicles = detected_cars
                    self.current_warnings = all_warnings
                    self.last_frame_time = time.time()
                
                # FPS 제어
                time.sleep(1.0 / self.fps)
                
            except Exception as e:
                logger.error(f"프레임 처리 에러: {e}")
                break
    
    def detect_cars_by_color(self, frame):
        """색상 기반 차량 탐지"""
        hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
        detected_cars = []
        
        # 주차장 영역 마스크 생성
        if len(self.parking_area) == 4:
            mask_polygon = np.zeros(hsv.shape[:2], dtype=np.uint8)
            pts = np.array(self.parking_area, np.int32)
            cv2.fillPoly(mask_polygon, [pts], 255)
        else:
            mask_polygon = np.ones(hsv.shape[:2], dtype=np.uint8) * 255
        
        for color_name, (lower, upper) in self.color_ranges.items():
            lower = np.array(lower)
            upper = np.array(upper)
            
            mask = cv2.inRange(hsv, lower, upper)
            mask = cv2.bitwise_and(mask, mask_polygon)
            
            # 노이즈 제거
            kernel = np.ones((5,5), np.uint8)  
            mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)
            kernel = np.ones((8,8), np.uint8)
            mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
            
            # 컨투어 찾기
            contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            for contour in contours:
                area = cv2.contourArea(contour)
                
                if area < 1200:
                    continue
                    
                x, y, w, h = cv2.boundingRect(contour)
                aspect_ratio = w / float(h)
                
                if w < 50 or h < 30 or w > 300 or h > 200:
                    continue
                
                if aspect_ratio < 0.3 or aspect_ratio > 4.0:
                    continue
                
                rect_area = w * h
                extent = area / rect_area
                
                if extent < 0.3:
                    continue
                
                perimeter = cv2.arcLength(contour, True)
                if perimeter < 60:
                    continue
                
                center_x = x + w // 2
                center_y = y + h // 2
                
                if len(self.parking_area) == 4:
                    if not self.point_in_polygon((center_x, center_y), self.parking_area):
                        continue
                
                detected_cars.append({
                    'color': color_name,
                    'center': (center_x, center_y),
                    'bbox': (x, y, w, h),
                    'area': area,
                    'aspect_ratio': aspect_ratio,
                    'extent': extent,
                    'perimeter': perimeter
                })
        
        # 차량 추적 및 ID 할당
        detected_cars = self.track_vehicles(detected_cars)
        
        return detected_cars
    
    def track_vehicles(self, current_vehicles):
        """차량 추적 및 ID 할당"""
        tracking_distance = 100
        tracked = []
        
        for vehicle in current_vehicles:
            best_match = None
            min_distance = float('inf')
            
            for prev_vehicle in self.previous_vehicles:
                if vehicle['color'] == prev_vehicle['color']:
                    dist = self.calculate_distance(vehicle['center'], prev_vehicle['center'])
                    if dist < tracking_distance and dist < min_distance:
                        min_distance = dist
                        best_match = prev_vehicle
            
            if best_match:
                vehicle['id'] = best_match['id']
                vehicle['track_history'] = best_match.get('track_history', []) + [vehicle['center']]
                if len(vehicle['track_history']) > 10:
                    vehicle['track_history'] = vehicle['track_history'][-10:]
            else:
                vehicle['id'] = self.next_vehicle_id
                vehicle['track_history'] = [vehicle['center']]
                self.next_vehicle_id += 1
            
            tracked.append(vehicle)
        
        self.previous_vehicles = tracked.copy()
        return tracked
    
    def check_spot_occupancy(self, vehicles):
        """주차 구역 점유 상태 확인"""
        for spot in self.parking_spots:
            spot['occupied'] = False
            spot['vehicle_id'] = None
            spot['vehicle_color'] = None
        
        for vehicle in vehicles:
            vehicle_center = vehicle['center']
            
            for spot in self.parking_spots:
                spot_x, spot_y, spot_w, spot_h = spot['bbox']
                
                if (spot_x <= vehicle_center[0] <= spot_x + spot_w and
                    spot_y <= vehicle_center[1] <= spot_y + spot_h):
                    spot['occupied'] = True
                    spot['vehicle_id'] = vehicle.get('id', 'unknown')
                    spot['vehicle_color'] = vehicle.get('color', 'unknown')
                    break
    
    def calculate_distance_to_sensors(self, vehicles):
        """차량과 센서들 간의 거리 계산"""
        warnings = []
        
        for vehicle in vehicles:
            vehicle_pos = vehicle['center']
            vehicle_id = vehicle.get('id', 'unknown')
            vehicle_color = vehicle.get('color', 'unknown')
            
            for i, sensor_pos in enumerate(self.ultrasonic_positions):
                distance = self.calculate_distance(vehicle_pos, sensor_pos)
                
                if distance < self.warning_distance:
                    warnings.append({
                        'type': 'ultrasonic',
                        'sensor_id': i + 1,
                        'vehicle_id': vehicle_id,
                        'vehicle_color': vehicle_color,
                        'distance': distance,
                        'vehicle_pos': vehicle_pos,
                        'sensor_pos': sensor_pos
                    })
            
            for i, barrier_pos in enumerate(self.barrier_positions):
                distance = self.calculate_distance(vehicle_pos, barrier_pos)
                
                if distance < self.warning_distance:
                    warnings.append({
                        'type': 'barrier',
                        'barrier_id': i + 1,
                        'vehicle_id': vehicle_id,
                        'vehicle_color': vehicle_color,
                        'distance': distance,
                        'vehicle_pos': vehicle_pos,
                        'sensor_pos': barrier_pos
                    })
        return warnings
    
    def check_vehicle_collisions(self, vehicles):
        """차량 간 충돌 경고 확인"""
        collision_warnings = []
        
        for i, vehicle1 in enumerate(vehicles):
            for j, vehicle2 in enumerate(vehicles):
                if i >= j:
                    continue
                
                distance = self.calculate_distance(vehicle1['center'], vehicle2['center'])
                
                if distance < self.vehicle_collision_distance:
                    collision_warnings.append({
                        'type': 'collision',
                        'vehicle1_id': vehicle1.get('id', 'unknown'),
                        'vehicle1_color': vehicle1.get('color', 'unknown'),
                        'vehicle1_pos': vehicle1['center'],
                        'vehicle2_id': vehicle2.get('id', 'unknown'),
                        'vehicle2_color': vehicle2.get('color', 'unknown'),
                        'vehicle2_pos': vehicle2['center'],
                        'distance': distance
                    })
        
        return collision_warnings
    
    def calculate_distance(self, pos1, pos2):
        """두 점 사이의 유클리드 거리 계산"""
        return math.sqrt((pos1[0] - pos2[0])**2 + (pos1[1] - pos2[1])**2)
    
    def point_in_polygon(self, point, polygon):
        """점이 다각형 내부에 있는지 확인"""
        x, y = point
        n = len(polygon)
        inside = False
        
        p1x, p1y = polygon[0]
        for i in range(1, n + 1):
            p2x, p2y = polygon[i % n]
            if y > min(p1y, p2y):
                if y <= max(p1y, p2y):
                    if x <= max(p1x, p2x):
                        if p1y != p2y:
                            xinters = (y - p1y) * (p2x - p1x) / (p2y - p1y) + p1x
                        if p1x == p2x or x <= xinters:
                            inside = not inside
            p1x, p1y = p2x, p2y
        
        return inside
    
    def handle_warning(self, all_warnings):
        """경고 처리 (GPIO 사용)"""
        if not GPIO_AVAILABLE:
            return
            
        current_time = time.time()
        
        if all_warnings and (current_time - self.last_warning_time) > self.warning_cooldown:
            GPIO.output(self.LED_PIN, GPIO.HIGH)
            GPIO.output(self.BUZZER_PIN, GPIO.HIGH)
            self.last_warning_time = current_time
            
            # LED/부저를 0.8초 후 끄기
            threading.Timer(0.8, self.turn_off_warnings).start()
        
        elif not all_warnings:
            GPIO.output(self.LED_PIN, GPIO.LOW)
            GPIO.output(self.BUZZER_PIN, GPIO.LOW)
    
    def turn_off_warnings(self):
        """경고 LED/부저 끄기"""
        if GPIO_AVAILABLE:
            GPIO.output(self.LED_PIN, GPIO.LOW)
            GPIO.output(self.BUZZER_PIN, GPIO.LOW)
    
    def draw_interface(self, frame, detected_cars, all_warnings):
        """인터페이스 그리기"""
        # 주차장 영역 그리기
        if len(self.parking_area) == 4:
            pts = np.array(self.parking_area, np.int32)
            pts = pts.reshape((-1, 1, 2))
            cv2.polylines(frame, [pts], True, (255, 255, 0), 3)
            
            overlay = frame.copy()
            cv2.fillPoly(overlay, [pts], (255, 255, 0))
            cv2.addWeighted(overlay, 0.1, frame, 0.9, 0, frame)
        
        # 주차구역 그리기
        for spot in self.parking_spots:
            x, y, w, h = spot['bbox']
            color = (0, 255, 0) if not spot['occupied'] else (0, 0, 255)
            thickness = 2 if not spot['occupied'] else 4
            
            cv2.rectangle(frame, (x, y), (x + w, y + h), color, thickness)
            
            label_pos = (x + 5, y + 20)
            cv2.putText(frame, f"P{spot['id']}", label_pos, 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)
            
            if spot['occupied']:
                status_text = f"Occupied"
                if spot['vehicle_color']:
                    status_text += f" ({spot['vehicle_color']})"
                cv2.putText(frame, status_text, (x + 5, y + h - 10), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.4, color, 1)
        
        # 센서 위치 그리기
        for i, sensor_pos in enumerate(self.ultrasonic_positions):
            cv2.circle(frame, sensor_pos, 12, (0, 255, 255), 3)
            cv2.putText(frame, f"U{i+1}", (sensor_pos[0] - 12, sensor_pos[1] + 5), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 255, 255), 1)
        
        for i, barrier_pos in enumerate(self.barrier_positions):
            cv2.circle(frame, barrier_pos, 12, (255, 255, 0), 3)
            cv2.putText(frame, f"B{i+1}", (barrier_pos[0] - 12, barrier_pos[1] + 5), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.4, (255, 255, 0), 1)
        
        # 탐지된 차량 표시
        for car in detected_cars:
            center = car['center']
            bbox = car['bbox']
            color_name = car['color']
            vehicle_id = car.get('id', '?')
            
            x, y, w, h = bbox
            color_map = {
                'blue': (255, 0, 0), 
                'yellow': (0, 255, 255),
                'white': (200, 200, 200)
            }
            color = color_map.get(color_name, (0, 255, 0))
            
            cv2.rectangle(frame, (x, y), (x + w, y + h), color, 3)
            cv2.circle(frame, center, 8, color, -1)
            
            cv2.putText(frame, f"{color_name.upper()}", 
                    (x, y - 35), cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)
            cv2.putText(frame, f"ID:{vehicle_id}", 
                    (x, y - 15), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 1)
            cv2.putText(frame, f"({center[0]}, {center[1]})", 
                    (x, y + h + 15), cv2.FONT_HERSHEY_SIMPLEX, 0.4, color, 1)
            
            # 추적 히스토리 그리기
            if 'track_history' in car and len(car['track_history']) > 1:
                history = car['track_history']
                for i in range(1, len(history)):
                    cv2.line(frame, history[i-1], history[i], color, 2)
        
        # 경고 상황 표시
        for warning in all_warnings:
            if warning['type'] != 'collision':
                vehicle_pos = warning['vehicle_pos']
                sensor_pos = warning['sensor_pos']
                
                cv2.line(frame, vehicle_pos, sensor_pos, (0, 0, 255), 4)
                
                mid_point = ((vehicle_pos[0] + sensor_pos[0])//2, 
                            (vehicle_pos[1] + sensor_pos[1])//2)
                cv2.putText(frame, f"{warning['distance']:.0f}px", mid_point, 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 2)
        
        # 상태 정보 패널
        panel_height = 200
        cv2.rectangle(frame, (5, 5), (500, panel_height), (0, 0, 0), -1)
        cv2.rectangle(frame, (5, 5), (500, panel_height), (255, 255, 255), 2)
        
        # 색상별 차량 카운트
        blue_count = sum(1 for v in detected_cars if v['color'] == 'blue')
        yellow_count = sum(1 for v in detected_cars if v['color'] == 'yellow')
        white_count = sum(1 for v in detected_cars if v['color'] == 'white')
        
        occupied_spots = sum(1 for spot in self.parking_spots if spot['occupied'])
        
        info_lines = [
            "PARKING TRACKER WEB v1.0",
            f"Resolution: {self.resolution[0]}x{self.resolution[1]}",
            f"Total vehicles: {len(detected_cars)}",
            f"Blue: {blue_count}, Yellow: {yellow_count}, White: {white_count}",
            f"Parking spots: {occupied_spots}/8 occupied",
            f"Active warnings: {len(all_warnings)}",
            f"Frame: {self.frame_count}",
            f"FPS: {self.fps}"
        ]
        
        for i, line in enumerate(info_lines):
            color = (255, 255, 255) if i == 0 else (200, 200, 200)
            cv2.putText(frame, line, (10, 25 + i * 22), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 1)
        
        # 경고 상황이 있으면 화면 상단에 경고 메시지
        if all_warnings:
            cv2.rectangle(frame, (520, 5), (frame.shape[1] - 5, 60), (0, 0, 255), -1)
            cv2.putText(frame, "⚠️  WARNING ZONE  ⚠️", (530, 35), 
                    cv2.FONT_HERSHEY_SIMPLEX, 1.0, (255, 255, 255), 2)
        
        return frame
    
    def get_processed_frame(self):
        """처리된 프레임 반환"""
        with self.lock:
            if self.processed_frame is not None:
                return self.processed_frame.copy()
            return None
    
    def get_status(self):
        """현재 상태 정보 반환"""
        with self.lock:
            current_time = time.time()
            is_active = (self.last_frame_time > 0 and 
                        current_time - self.last_frame_time < 5)
            
            # 색상별 차량 수 계산
            vehicle_counts = {
                'blue': sum(1 for v in self.detected_vehicles if v['color'] == 'blue'),
                'yellow': sum(1 for v in self.detected_vehicles if v['color'] == 'yellow'),
                'white': sum(1 for v in self.detected_vehicles if v['color'] == 'white')
            }
            
            # 주차구역 점유 상태
            parking_status = []
            for spot in self.parking_spots:
                parking_status.append({
                    'id': spot['id'],
                    'occupied': spot['occupied'],
                    'vehicle_id': spot['vehicle_id'],
                    'vehicle_color': spot['vehicle_color']
                })
            
            return {
                'status': 'active' if is_active else 'inactive',
                'resolution': f"{self.resolution[0]}x{self.resolution[1]}",
                'fps': self.fps,
                'frame_count': self.frame_count,
                'total_vehicles': len(self.detected_vehicles),
                'vehicle_counts': vehicle_counts,
                'parking_status': parking_status,
                'active_warnings': len(self.current_warnings),
                'warnings': self.current_warnings,
                'current_time': time.strftime("%Y-%m-%d %H:%M:%S", time.localtime()),
                'gpio_available': GPIO_AVAILABLE
            }
    
    def stop(self):
        """처리 중지"""
        self.running = False
        if self.cap is not None:
            self.cap.release()
            self.cap = None
        
        if GPIO_AVAILABLE:
            GPIO.output(self.LED_PIN, GPIO.LOW)
            GPIO.output(self.BUZZER_PIN, GPIO.LOW)
            GPIO.cleanup()
        
        logger.info("주차장 추적 웹서버 중지")

# 전역 추적기 객체
parking_tracker = ParkingTrackerWebServer()

def generate_frames():
    """MJPEG 스트림용 프레임 생성기"""
    while True:
        frame = parking_tracker.get_processed_frame()
        
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
    frame = np.zeros((720, 1280, 3), dtype=np.uint8)
    
    cv2.putText(frame, "Camera not connected", (400, 300), 
               cv2.FONT_HERSHEY_SIMPLEX, 2, (0, 0, 255), 3)
    cv2.putText(frame, "Starting parking tracker...", (400, 400), 
               cv2.FONT_HERSHEY_SIMPLEX, 1.5, (0, 0, 255), 2)
    
    return frame

@app.route('/')
def index():
    """메인 페이지"""
    return """
    <!DOCTYPE html>
    <html>
    <head>
        <title>주차장 추적 시스템</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
            body { 
                font-family: 'Arial', sans-serif; 
                margin: 0; 
                padding: 20px; 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
            }
            .container { 
                max-width: 1400px; 
                margin: 0 auto; 
                background: rgba(255,255,255,0.1); 
                padding: 30px; 
                border-radius: 15px; 
                backdrop-filter: blur(10px);
            }
            h1 { 
                text-align: center; 
                color: #fff; 
                font-size: 2.5em; 
                margin-bottom: 30px;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
            }
            .video-container { 
                text-align: center; 
                margin-bottom: 30px; 
                background: rgba(0,0,0,0.3); 
                padding: 20px; 
                border-radius: 10px;
            }
            img { 
                max-width: 100%; 
                height: auto; 
                border: 3px solid #fff; 
                border-radius: 10px; 
                box-shadow: 0 8px 32px rgba(0,0,0,0.3);
            }
            .info-panel { 
                background: rgba(255,255,255,0.2); 
                padding: 20px; 
                border-radius: 10px; 
                margin-top: 20px;
            }
            .status { 
                display: grid; 
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); 
                gap: 20px; 
                margin-top: 20px;
            }
            .status-card { 
                background: rgba(255,255,255,0.15); 
                padding: 15px; 
                border-radius: 8px; 
                border-left: 4px solid #4CAF50;
            }
            .warning-card { 
                border-left-color: #f44336;
            }
            .refresh-btn {
                background: #4CAF50;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 5px;
                cursor: pointer;
                font-size: 1em;
                margin: 10px;
            }
            .refresh-btn:hover {
                background: #45a049;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🚗 스마트 주차장 추적 시스템</h1>
            
            <div class="video-container">
                <img src="/video_feed" alt="실시간 주차장 추적" id="video-stream">
                <p>실시간 객체 탐지 및 주차장 관리 시스템 (1280x720)</p>
                <button class="refresh-btn" onclick="refreshStream()">스트림 새로고침</button>
            </div>
            
            <div class="info-panel">
                <h3>📊 실시간 상태 정보</h3>
                <div id="status-info">로딩 중...</div>
                <button class="refresh-btn" onclick="updateStatus()">상태 업데이트</button>
            </div>
        </div>

        <script>
            function refreshStream() {
                const img = document.getElementById('video-stream');
                img.src = '/video_feed?' + new Date().getTime();
            }
            
            function updateStatus() {
                fetch('/status')
                    .then(response => response.json())
                    .then(data => {
                        const statusDiv = document.getElementById('status-info');
                        
                        let html = '<div class="status">';
                        
                        // 기본 정보
                        html += `
                            <div class="status-card">
                                <h4>🎥 카메라 정보</h4>
                                <p>상태: ${data.status === 'active' ? '✅ 활성' : '❌ 비활성'}</p>
                                <p>해상도: ${data.resolution}</p>
                                <p>FPS: ${data.fps}</p>
                                <p>프레임: ${data.frame_count}</p>
                            </div>
                        `;
                        
                        // 차량 정보
                        html += `
                            <div class="status-card">
                                <h4>🚗 탐지된 차량</h4>
                                <p>총 차량: ${data.total_vehicles}대</p>
                                <p>파랑: ${data.vehicle_counts.blue}대</p>
                                <p>노랑: ${data.vehicle_counts.yellow}대</p>
                                <p>하양: ${data.vehicle_counts.white}대</p>
                            </div>
                        `;
                        
                        // 주차구역 정보
                        const occupiedSpots = data.parking_status.filter(spot => spot.occupied).length;
                        html += `
                            <div class="status-card">
                                <h4>🅿️ 주차구역 현황</h4>
                                <p>점유된 구역: ${occupiedSpots}/8</p>
                                <p>빈 구역: ${8 - occupiedSpots}/8</p>
                            </div>
                        `;
                        
                        // 경고 정보
                        const warningClass = data.active_warnings > 0 ? 'status-card warning-card' : 'status-card';
                        html += `
                            <div class="${warningClass}">
                                <h4>⚠️ 경고 상황</h4>
                                <p>활성 경고: ${data.active_warnings}개</p>
                                <p>GPIO 사용 가능: ${data.gpio_available ? '✅' : '❌'}</p>
                            </div>
                        `;
                        
                        html += '</div>';
                        html += `<p style="text-align: center; margin-top: 15px;">최종 업데이트: ${data.current_time}</p>`;
                        
                        statusDiv.innerHTML = html;
                    })
                    .catch(error => {
                        console.error('상태 업데이트 실패:', error);
                    });
            }
            
            // 페이지 로드 시 상태 업데이트
            updateStatus();
            
            // 5초마다 자동 업데이트
            setInterval(updateStatus, 5000);
        </script>
    </body>
    </html>
    """

@app.route('/video_feed')
def video_feed():
    """비디오 스트리밍 엔드포인트"""
    return Response(generate_frames(),
                   mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/status')
def get_status():
    """상태 API"""
    return jsonify(parking_tracker.get_status())

@app.route('/api/parking_spots')
def get_parking_spots():
    """주차구역 상세 정보 API"""
    return jsonify(parking_tracker.parking_spots)

@app.route('/api/warnings')
def get_warnings():
    """현재 경고 상황 API"""
    return jsonify(parking_tracker.current_warnings)

if __name__ == '__main__':
    try:
        logger.info("주차장 추적 웹서버 시작 중...")
        
        # 추적 시스템 시작
        if parking_tracker.start_processing():
            logger.info("주차장 추적 시스템 시작됨")
        else:
            logger.warning("카메라를 찾을 수 없지만 서버는 시작함")
        
        # Flask 서버 시작
        app.run(host='0.0.0.0', port=5000, debug=False, threaded=True)
        
    except KeyboardInterrupt:
        logger.info("서버 종료 중...")
        parking_tracker.stop()
    except Exception as e:
        logger.error(f"서버 에러: {e}")
        parking_tracker.stop() 