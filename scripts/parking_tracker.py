#!/usr/bin/env python3
import cv2
import numpy as np
import os
try:
    import RPi.GPIO as GPIO
except ImportError:
    print("RPi.GPIO를 설치해라: pip3 install --break-system-packages RPi.GPIO")
    exit(1)
import time
import threading
from collections import deque
import math

class ParkingTracker:
    def __init__(self, headless=False):
        self.headless = headless  # 헤드리스 모드 설정
        
        # GPIO 설정
        self.LED_PIN = 18
        self.BUZZER_PIN = 19  # 부저 핀 추가
        self.TRIG_PIN = 24
        self.ECHO_PIN = 23
        
        # GPIO 초기화
        GPIO.setmode(GPIO.BCM)
        GPIO.setup(self.LED_PIN, GPIO.OUT)
        GPIO.setup(self.BUZZER_PIN, GPIO.OUT)
        GPIO.setup(self.TRIG_PIN, GPIO.OUT)
        GPIO.setup(self.ECHO_PIN, GPIO.IN)
        GPIO.output(self.LED_PIN, GPIO.LOW)
        GPIO.output(self.BUZZER_PIN, GPIO.LOW)
        GPIO.output(self.TRIG_PIN, GPIO.LOW)
        
        # 카메라 설정
        self.cap = None
        self.initialize_camera()
        
        # 주차장 영역 좌표 (기본값 설정)
        self.parking_area = [
            (205, 17),   # 좌상단
            (997, 13),   # 우상단
            (1031, 695), # 우하단
            (209, 717)   # 좌하단
        ]
        self.setting_area = False
        
        # 센서 위치 (좌표)
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
        
        # 색상 범위 설정 (HSV) - Blue, Yellow, White만, 파란색 필터링 개선
        self.color_ranges = {
            'blue': ([100, 100, 120], [130, 255, 255]),  # S와 V 최소값 상향 조정
            'yellow': ([25, 50, 50], [40, 255, 255]),
            'white': ([0, 0, 180], [180, 25, 255])
        }
        
        # 주차구역 8개 정의 (정확한 좌표)
        self.parking_spots = [
            {'id': 1, 'bbox': (366, 125, 114, 126), 'center': (423, 188), 'occupied': False, 'vehicle_id': None, 'vehicle_color': None},  # 366~480, 125~251
            {'id': 2, 'bbox': (480, 125, 141, 126), 'center': (550, 188), 'occupied': False, 'vehicle_id': None, 'vehicle_color': None},  # 480~621, 125~251
            {'id': 3, 'bbox': (621, 125, 112, 126), 'center': (677, 188), 'occupied': False, 'vehicle_id': None, 'vehicle_color': None},  # 621~733, 125~251
            {'id': 4, 'bbox': (733, 125, 118, 126), 'center': (792, 188), 'occupied': False, 'vehicle_id': None, 'vehicle_color': None},  # 733~851, 125~251
            {'id': 5, 'bbox': (372, 389, 121, 148), 'center': (432, 463), 'occupied': False, 'vehicle_id': None, 'vehicle_color': None},  # 372~493, 389~537
            {'id': 6, 'bbox': (493, 389, 125, 148), 'center': (555, 463), 'occupied': False, 'vehicle_id': None, 'vehicle_color': None},  # 493~618, 389~537
            {'id': 7, 'bbox': (618, 389, 115, 148), 'center': (675, 463), 'occupied': False, 'vehicle_id': None, 'vehicle_color': None},  # 618~733, 389~537
            {'id': 8, 'bbox': (733, 389, 126, 148), 'center': (796, 463), 'occupied': False, 'vehicle_id': None, 'vehicle_color': None}   # 733~859, 389~537
        ]
        
        # 탐지된 차량 추적
        self.tracked_cars = deque(maxlen=15)  # 추적 히스토리 증가
        self.next_vehicle_id = 1
        self.previous_vehicles = []
        
        # 경고 설정
        self.warning_distance = 80  # 센서와의 경고 거리 (픽셀)
        self.vehicle_collision_distance = 100  # 차량 간 충돌 경고 거리 (픽셀)
        self.last_warning_time = 0
        self.warning_cooldown = 1.5  # 1.5초 쿨다운
        
        # 헤드리스 모드용 설정
        self.frame_count = 0
        self.save_interval = 30  # 30프레임마다 이미지 저장
        
        print(f"주차장 영역 기본값 설정 완료: {self.parking_area}")
        print("센서 위치 설정 완료")
        print("주차구역 8개 설정 완료 (정확한 좌표)")
        print("색상 인식: 파랑, 노랑, 하양 (3색)")
        print("차량 충돌 경고 시스템 활성화")
    
    def initialize_camera(self):
        """카메라 초기화 with 디버깅"""
        print("카메라 초기화 중...")
        
        # 여러 백엔드 시도
        backends = [
            (cv2.CAP_V4L2, "V4L2"),
            (cv2.CAP_GSTREAMER, "GStreamer"), 
            (cv2.CAP_ANY, "Any")
        ]
        
        # 여러 디바이스 번호 시도
        device_ids = [0, 1, 2]
        
        for device_id in device_ids:
            print(f"디바이스 {device_id} 시도 중...")
            
            for backend, backend_name in backends:
                print(f"  {backend_name} 백엔드로 시도 중...")
                
                try:
                    self.cap = cv2.VideoCapture(device_id, backend)
                    
                    if self.cap.isOpened():
                        # 테스트 프레임 읽기
                        ret, frame = self.cap.read()
                        if ret and frame is not None:
                            print(f"성공! 디바이스 {device_id}, {backend_name} 백엔드")
                            
                            # 해상도 설정
                            self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
                            self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
                            self.cap.set(cv2.CAP_PROP_FPS, 20)
                            
                            # 실제 설정된 값 확인
                            width = int(self.cap.get(cv2.CAP_PROP_FRAME_WIDTH))
                            height = int(self.cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
                            fps = self.cap.get(cv2.CAP_PROP_FPS)
                            
                            print(f"해상도: {width}x{height}, FPS: {fps}")
                            return
                        else:
                            print(f"  프레임을 읽을 수 없음")
                            self.cap.release()
                    else:
                        print(f"  카메라를 열 수 없음")
                        
                except Exception as e:
                    print(f"  오류: {e}")
                    if self.cap:
                        self.cap.release()
        
        print("사용 가능한 카메라를 찾을 수 없다!")
        print("해결방법:")
        print("1. USB 카메라가 제대로 연결되었는지 확인")
        print("2. 'ls /dev/video*' 명령어로 디바이스 확인") 
        print("3. 다른 프로그램에서 카메라를 사용 중인지 확인")
        self.cap = None
        
    def mouse_callback(self, event, x, y, flags, param):
        """마우스 콜백으로 주차장 영역 설정"""
        if self.setting_area and event == cv2.EVENT_LBUTTONDOWN:
            self.parking_area.append((x, y))
            print(f"좌표 설정: ({x}, {y})")
            
            if len(self.parking_area) == 4:
                self.setting_area = False
                print("주차장 영역 설정 완료!")
    
    def setup_parking_area(self, frame):
        """주차장 영역 설정"""
        if self.headless:
            print("헤드리스 모드: 주차장 영역을 수동으로 설정한다.")
            print("4개 모서리 좌표를 순서대로 입력해라 (좌상단 -> 우상단 -> 우하단 -> 좌하단)")
            print(f"이미지 크기: {frame.shape[1]}x{frame.shape[0]} (가로x세로)")
            
            # 현재 프레임을 파일로 저장
            cv2.imwrite('current_frame.jpg', frame)
            print("현재 화면을 'current_frame.jpg'로 저장했다. 이를 참고해서 좌표를 입력해라.")
            
            try:
                for i in range(4):
                    corner_names = ["좌상단", "우상단", "우하단", "좌하단"]
                    print(f"{corner_names[i]} 좌표를 입력해라 (x,y 형식, 예: 100,50):")
                    coord_input = input().strip()
                    x, y = map(int, coord_input.split(','))
                    self.parking_area.append((x, y))
                    print(f"{corner_names[i]} 설정: ({x}, {y})")
                
                print("주차장 영역 설정 완료!")
                return
                
            except (ValueError, KeyboardInterrupt):
                print("좌표 입력이 취소되었거나 잘못되었다.")
                self.parking_area = []
                return
        
        # GUI 모드
        print("주차장 영역을 설정한다. 검은색 주차장의 4개 모서리를 순서대로 클릭해라.")
        print("순서: 좌상단 -> 우상단 -> 우하단 -> 좌하단")
        print("잘못 클릭했으면 'r'키로 리셋, 완료되면 자동으로 닫힌다.")
        
        self.setting_area = True
        self.parking_area = []  # 기존 좌표 클리어
        cv2.namedWindow('Setup', cv2.WINDOW_NORMAL)
        cv2.setMouseCallback('Setup', self.mouse_callback)
        
        while self.setting_area:
            display_frame = frame.copy()
            
            # 설정된 점들 표시
            for i, point in enumerate(self.parking_area):
                cv2.circle(display_frame, point, 8, (0, 255, 0), -1)
                cv2.putText(display_frame, str(i+1), 
                           (point[0]+15, point[1]-10), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)
            
            # 선분 연결
            if len(self.parking_area) > 1:
                for i in range(len(self.parking_area)-1):
                    cv2.line(display_frame, self.parking_area[i], 
                            self.parking_area[i+1], (0, 255, 0), 3)
                
                # 마지막 점과 첫 번째 점 연결 (4개 점이 모두 설정되었을 때)
                if len(self.parking_area) == 4:
                    cv2.line(display_frame, self.parking_area[3], 
                            self.parking_area[0], (0, 255, 0), 3)
                    # 반투명 영역 표시
                    pts = np.array(self.parking_area, np.int32)
                    overlay = display_frame.copy()
                    cv2.fillPoly(overlay, [pts], (0, 255, 0))
                    cv2.addWeighted(overlay, 0.2, display_frame, 0.8, 0, display_frame)
            
            # 안내 메시지
            cv2.rectangle(display_frame, (5, 5), (500, 80), (0, 0, 0), -1)
            cv2.putText(display_frame, f"Click point {len(self.parking_area)+1}/4", 
                       (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
            cv2.putText(display_frame, "Press 'r' to reset, 'q' to quit", 
                       (10, 55), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1)
            
            cv2.imshow('Setup', display_frame)
            key = cv2.waitKey(1) & 0xFF
            if key == ord('q'):
                break
            elif key == ord('r'):
                self.parking_area = []
                print("영역 설정 리셋!")
        
        if not self.headless:
            cv2.destroyWindow('Setup')
    
    def detect_cars_by_color(self, frame):
        """색상 기반 차량 탐지 (주차장 영역 내에서만)"""
        hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
        detected_cars = []
        
        # 주차장 영역이 설정되지 않았으면 전체 화면에서 탐지
        if len(self.parking_area) == 4:
            # 주차장 영역 마스크 생성
            mask_polygon = np.zeros(hsv.shape[:2], dtype=np.uint8)
            pts = np.array(self.parking_area, np.int32)
            cv2.fillPoly(mask_polygon, [pts], 255)
        else:
            mask_polygon = np.ones(hsv.shape[:2], dtype=np.uint8) * 255
        
        for color_name, (lower, upper) in self.color_ranges.items():
            lower = np.array(lower)
            upper = np.array(upper)
            
            mask = cv2.inRange(hsv, lower, upper)
            
            # 주차장 영역과 교집합
            mask = cv2.bitwise_and(mask, mask_polygon)
            
            # 노이즈 제거 강화 (LED 필터링)
            kernel = np.ones((5,5), np.uint8)  
            mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)
            kernel = np.ones((8,8), np.uint8)
            mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
            
            # 컨투어 찾기
            contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            for contour in contours:
                area = cv2.contourArea(contour)
                
                # 면적 필터링 강화 (LED 제외)
                if area < 1200:  # 최소 면적 증가 (LED 완전 제외)
                    continue
                    
                # 형태 필터링 추가
                x, y, w, h = cv2.boundingRect(contour)
                aspect_ratio = w / float(h)
                
                # 크기 필터링 (LED 제외)
                if w < 50 or h < 30 or w > 300 or h > 200:
                    continue
                
                # 너무 가늘거나 긴 형태 제외
                if aspect_ratio < 0.3 or aspect_ratio > 4.0:
                    continue
                
                # 컨투어의 면적과 바운딩 박스 면적 비율
                rect_area = w * h
                extent = area / rect_area
                
                # 너무 불규칙한 형태 제외 (LED 같은 점 형태)
                if extent < 0.3:
                    continue
                
                # 둘레 확인 (LED는 보통 작은 둘레)
                perimeter = cv2.arcLength(contour, True)
                if perimeter < 60:
                    continue
                
                center_x = x + w // 2
                center_y = y + h // 2
                
                # 중심점이 주차장 영역 내부에 있는지 확인
                if len(self.parking_area) == 4:
                    if not self.point_in_polygon((center_x, center_y), self.parking_area):
                        continue
                
                # 실제 HSV 색상 값 추출
                roi_hsv = hsv[y:y+h, x:x+w]
                mean_hsv = cv2.mean(roi_hsv, mask[y:y+h, x:x+w])
                
                detected_cars.append({
                    'color': color_name,
                    'center': (center_x, center_y),
                    'bbox': (x, y, w, h),
                    'area': area,
                    'aspect_ratio': aspect_ratio,
                    'extent': extent,
                    'perimeter': perimeter,
                    'hsv_values': {
                        'h': round(mean_hsv[0], 1),
                        's': round(mean_hsv[1], 1), 
                        'v': round(mean_hsv[2], 1)
                    }
                })
        
        # 가까운 객체들 병합
        detected_cars = self.merge_nearby_vehicles(detected_cars)
        
        # 차량 추적 및 ID 할당
        detected_cars = self.track_vehicles(detected_cars)
        
        return detected_cars
    
    def merge_nearby_vehicles(self, vehicles):
        """가까운 차량 객체들을 병합"""
        if len(vehicles) <= 1:
            return vehicles
        
        merge_distance = 70
        merged = []
        used = set()
        
        for i, vehicle1 in enumerate(vehicles):
            if i in used:
                continue
            
            group = [vehicle1]
            used.add(i)
            
            for j, vehicle2 in enumerate(vehicles):
                if j in used or i == j:
                    continue
                
                # 같은 색상이고 가까우면 병합
                if (vehicle1['color'] == vehicle2['color'] and 
                    self.calculate_distance(vehicle1['center'], vehicle2['center']) < merge_distance):
                    group.append(vehicle2)
                    used.add(j)
            
            if len(group) == 1:
                merged.append(vehicle1)
            else:
                merged_vehicle = self.create_merged_vehicle(group)
                merged.append(merged_vehicle)
        
        return merged
    
    def create_merged_vehicle(self, vehicle_group):
        """여러 차량 객체를 하나로 병합"""
        min_x = min(v['bbox'][0] for v in vehicle_group)
        min_y = min(v['bbox'][1] for v in vehicle_group)
        max_x = max(v['bbox'][0] + v['bbox'][2] for v in vehicle_group)
        max_y = max(v['bbox'][1] + v['bbox'][3] for v in vehicle_group)
        
        w = max_x - min_x
        h = max_y - min_y
        center = (min_x + w//2, min_y + h//2)
        area = sum(v['area'] for v in vehicle_group)
        
        return {
            'color': vehicle_group[0]['color'],
            'center': center,
            'bbox': (min_x, min_y, w, h),
            'area': area,
            'aspect_ratio': w / float(h),
            'extent': area / (w * h),
            'merged_count': len(vehicle_group)
        }
    
    def track_vehicles(self, current_vehicles):
        """차량 추적 및 ID 할당"""
        tracking_distance = 100
        tracked = []
        
        for vehicle in current_vehicles:
            best_match = None
            min_distance = float('inf')
            
            # 이전 프레임의 차량과 매칭
            for prev_vehicle in self.previous_vehicles:
                # 같은 색상이면서 가까운 거리
                if vehicle['color'] == prev_vehicle['color']:
                    dist = self.calculate_distance(vehicle['center'], prev_vehicle['center'])
                    if dist < tracking_distance and dist < min_distance:
                        min_distance = dist
                        best_match = prev_vehicle
            
            if best_match:
                # 기존 차량으로 인식
                vehicle['id'] = best_match['id']
                vehicle['track_history'] = best_match.get('track_history', []) + [vehicle['center']]
                if len(vehicle['track_history']) > 10:
                    vehicle['track_history'] = vehicle['track_history'][-10:]
            else:
                # 새로운 차량
                vehicle['id'] = self.next_vehicle_id
                vehicle['track_history'] = [vehicle['center']]
                self.next_vehicle_id += 1
                print(f"새 {vehicle['color']} 차량 감지: ID {vehicle['id']}")
            
            tracked.append(vehicle)
        
        self.previous_vehicles = tracked.copy()
        return tracked
    
    def calculate_distance_to_sensors(self, vehicles):
        """차량과 센서들 간의 거리 계산 및 경고 생성"""
        warnings = []
        
        for vehicle in vehicles:
            vehicle_pos = vehicle['center']
            vehicle_id = vehicle.get('id', 'unknown')
            vehicle_color = vehicle.get('color', 'unknown')
            
            # 각 초음파 센서와의 거리 확인
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
            
            # 각 차단기와의 거리 확인
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
        
    def check_spot_occupancy(self, vehicles):
        """주차 구역 점유 상태 확인"""
        # 모든 구역을 일단 비어있다고 설정
        for spot in self.parking_spots:
            spot['occupied'] = False
            spot['vehicle_id'] = None
            spot['vehicle_color'] = None
        
        # 각 차량에 대해 어느 구역에 있는지 확인
        for vehicle in vehicles:
            vehicle_center = vehicle['center']
            
            for spot in self.parking_spots:
                spot_x, spot_y, spot_w, spot_h = spot['bbox']
                
                # 차량이 주차 구역 내부에 있는지 확인
                if (spot_x <= vehicle_center[0] <= spot_x + spot_w and
                    spot_y <= vehicle_center[1] <= spot_y + spot_h):
                    spot['occupied'] = True
                    spot['vehicle_id'] = vehicle.get('id', 'unknown')
                    spot['vehicle_color'] = vehicle.get('color', 'unknown')
                    break
    
    def check_vehicle_collisions(self, vehicles):
        """차량 간 충돌 경고 확인"""
        collision_warnings = []
        
        for i, vehicle1 in enumerate(vehicles):
            for j, vehicle2 in enumerate(vehicles):
                if i >= j:  # 중복 체크 방지
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
    
    def calculate_distance_to_boundary(self, point):
        """주차장 경계까지의 최단 거리 계산"""
        if len(self.parking_area) < 4:
            return float('inf')
        
        x, y = point
        min_distance = float('inf')
        
        # 각 변까지의 거리 계산
        for i in range(len(self.parking_area)):
            p1 = self.parking_area[i]
            p2 = self.parking_area[(i + 1) % len(self.parking_area)]
            
            # 점과 직선 사이의 거리 계산
            A = p2[1] - p1[1]
            B = p1[0] - p2[0]
            C = p2[0] * p1[1] - p1[0] * p2[1]
            
            distance = abs(A * x + B * y + C) / math.sqrt(A * A + B * B)
            min_distance = min(min_distance, distance)
        
        return min_distance
    
    def trigger_ultrasonic(self):
        """초음파 센서 트리거"""
        GPIO.output(self.TRIG_PIN, True)
        time.sleep(0.00001)
        GPIO.output(self.TRIG_PIN, False)
        
        pulse_start = time.time()
        pulse_end = time.time()
        
        # Echo 신호 대기
        timeout = time.time() + 0.1  # 100ms 타임아웃
        while GPIO.input(self.ECHO_PIN) == 0 and time.time() < timeout:
            pulse_start = time.time()
        
        while GPIO.input(self.ECHO_PIN) == 1 and time.time() < timeout:
            pulse_end = time.time()
        
        if pulse_end > pulse_start:
            pulse_duration = pulse_end - pulse_start
            distance = pulse_duration * 17150  # cm 단위
            return round(distance, 2)
        else:
            return None
    
    def handle_warning(self, all_warnings):
        """경고 처리 (센서 경고 + 충돌 경고)"""
        # all_warnings 안전 처리
        if all_warnings is None:
            all_warnings = []
            
        current_time = time.time()
        
        if all_warnings and (current_time - self.last_warning_time) > self.warning_cooldown:
            # LED 및 부저 켜기
            GPIO.output(self.LED_PIN, GPIO.HIGH)
            GPIO.output(self.BUZZER_PIN, GPIO.HIGH)
            
            # 초음파 센서 측정
            distance = self.trigger_ultrasonic()
            
            sensor_warnings = [w for w in all_warnings if w.get('type') != 'collision']
            collision_warnings = [w for w in all_warnings if w.get('type') == 'collision']
            
            print(f"⚠️  경고! 총 {len(all_warnings)}개 경고 상황 발생:")
            
            # 센서 경고 출력
            for warning in sensor_warnings:
                color = warning.get('vehicle_color', 'unknown')
                if warning.get('type') == 'ultrasonic':
                    print(f"   초음파 센서 {warning.get('sensor_id')}번 ↔ {color} 차량(ID:{warning.get('vehicle_id')}) 거리: {warning.get('distance', 0):.1f}px")
                elif warning.get('type') == 'barrier':
                    print(f"   차단기 {warning.get('barrier_id')}번 ↔ {color} 차량(ID:{warning.get('vehicle_id')}) 거리: {warning.get('distance', 0):.1f}px")
            
            # 충돌 경고 출력
            for warning in collision_warnings:
                print(f"   차량 충돌 경고: {warning.get('vehicle1_color', 'unknown')}(ID:{warning.get('vehicle1_id')}) ↔ {warning.get('vehicle2_color', 'unknown')}(ID:{warning.get('vehicle2_id')}) 거리: {warning.get('distance', 0):.1f}px")
            
            if distance:
                print(f"   초음파 센서 물리적 거리: {distance}cm")
            
            self.last_warning_time = current_time
            
            # LED/부저를 0.8초 후 끄기
            threading.Timer(0.8, self.turn_off_warnings).start()
        
        elif not all_warnings:
            # 경고 상황이 없으면 끄기
            GPIO.output(self.LED_PIN, GPIO.LOW)
            GPIO.output(self.BUZZER_PIN, GPIO.LOW)
    
    def turn_off_warnings(self):
        """경고 LED/부저 끄기"""
        GPIO.output(self.LED_PIN, GPIO.LOW)
        GPIO.output(self.BUZZER_PIN, GPIO.LOW)
    
    def draw_interface(self, frame, detected_cars):
        """인터페이스 그리기"""
        # 주차장 영역 그리기
        if len(self.parking_area) == 4:
            pts = np.array(self.parking_area, np.int32)
            pts = pts.reshape((-1, 1, 2))
            cv2.polylines(frame, [pts], True, (255, 255, 0), 3)  # 두꺼운 노란색 선
            
            # 반투명 오버레이 추가
            overlay = frame.copy()
            cv2.fillPoly(overlay, [pts], (255, 255, 0))
            cv2.addWeighted(overlay, 0.1, frame, 0.9, 0, frame)
        
        # 주차구역 그리기
        for spot in self.parking_spots:
            x, y, w, h = spot['bbox']
            color = (0, 255, 0) if not spot['occupied'] else (0, 0, 255)  # 비어있으면 초록, 점유되면 빨강
            thickness = 2 if not spot['occupied'] else 4
            
            cv2.rectangle(frame, (x, y), (x + w, y + h), color, thickness)
            
            # 주차구역 번호 표시
            label_pos = (x + 5, y + 20)
            cv2.putText(frame, f"P{spot['id']}", label_pos, 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)
            
            # 점유 상태 표시
            if spot['occupied']:
                status_text = f"Occupied"
                if spot['vehicle_color']:
                    status_text += f" ({spot['vehicle_color']})"
                cv2.putText(frame, status_text, (x + 5, y + h - 10), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.4, color, 1)
        
        # 센서 위치 그리기
        for i, sensor_pos in enumerate(self.ultrasonic_positions):
            cv2.circle(frame, sensor_pos, 12, (0, 255, 255), 3)  # 노란색 원
            cv2.putText(frame, f"U{i+1}", (sensor_pos[0] - 12, sensor_pos[1] + 5), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 255, 255), 1)
        
        for i, barrier_pos in enumerate(self.barrier_positions):
            cv2.circle(frame, barrier_pos, 12, (255, 255, 0), 3)  # 시안색 원
            cv2.putText(frame, f"B{i+1}", (barrier_pos[0] - 12, barrier_pos[1] + 5), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.4, (255, 255, 0), 1)
        
        # 센서 경고와 충돌 경고를 모두 가져온다
        sensor_warnings = self.calculate_distance_to_sensors(detected_cars)
        collision_warnings = self.check_vehicle_collisions(detected_cars)
        all_warnings = sensor_warnings + collision_warnings
        
        # 탐지된 차량 표시
        for car in detected_cars:
            center = car['center']
            bbox = car['bbox']
            color_name = car['color']
            area = car['area']
            vehicle_id = car.get('id', '?')
            
            # 바운딩 박스 그리기
            x, y, w, h = bbox
            color_map = {
                'blue': (255, 0, 0), 
                'orange': (0, 165, 255),  # 주황색
                'yellow': (0, 255, 255),
                'white': (200, 200, 200)   # 하얀색 (회색으로 표시)
            }
            color = color_map.get(color_name, (0, 255, 0))
            
            cv2.rectangle(frame, (x, y), (x + w, y + h), color, 3)
            cv2.circle(frame, center, 8, color, -1)
            
            # 차량 정보 표시
            cv2.putText(frame, f"{color_name.upper()}", 
                    (x, y - 35), cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)
            
            # 차량 ID 표시
            cv2.putText(frame, f"ID:{vehicle_id}", 
                    (x, y - 15), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 1)
            
            # 좌표 표시
            cv2.putText(frame, f"({center[0]}, {center[1]})", 
                    (x, y + h + 15), cv2.FONT_HERSHEY_SIMPLEX, 0.4, color, 1)
            
            # HSV 값 표시
            if 'hsv_values' in car:
                hsv_text = f"H:{car['hsv_values']['h']} S:{car['hsv_values']['s']} V:{car['hsv_values']['v']}"
                cv2.putText(frame, hsv_text, (x, y + h + 30), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.3, color, 1)
            
            # 병합된 객체 표시
            if 'merged_count' in car and car['merged_count'] > 1:
                cv2.putText(frame, f"MERGED({car['merged_count']})", 
                        (x, y - 50), cv2.FONT_HERSHEY_SIMPLEX, 0.4, color, 1)
            
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
                
                # 경고 선 그리기 (빨간색, 굵게)
                cv2.line(frame, vehicle_pos, sensor_pos, (0, 0, 255), 4)
                
                # 거리 표시
                mid_point = ((vehicle_pos[0] + sensor_pos[0])//2, 
                            (vehicle_pos[1] + sensor_pos[1])//2)
                cv2.putText(frame, f"{warning['distance']:.0f}px", mid_point, 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 2)
        
        # 상태 정보 표시 (배경 추가)
        panel_height = 180
        cv2.rectangle(frame, (5, 5), (450, panel_height), (0, 0, 0), -1)  # 검은 배경
        cv2.rectangle(frame, (5, 5), (450, panel_height), (255, 255, 255), 2)  # 흰 테두리
        
        # 색상별 차량 카운트
        blue_count = sum(1 for v in detected_cars if v['color'] == 'blue')
        orange_count = sum(1 for v in detected_cars if v['color'] == 'orange')
        yellow_count = sum(1 for v in detected_cars if v['color'] == 'yellow')
        white_count = sum(1 for v in detected_cars if v['color'] == 'white')
        
        # 주차구역 점유 정보
        occupied_spots = sum(1 for spot in self.parking_spots if spot['occupied'])
        
        info_lines = [
            "PARKING TRACKER v2.0 (Enhanced)",
            f"Total vehicles: {len(detected_cars)}",
            f"Blue: {blue_count}, Orange: {orange_count}",
            f"Yellow: {yellow_count}, White: {white_count}",
            f"Parking spots: {occupied_spots}/8 occupied",
            f"Active warnings: {len(all_warnings)}",
            f"Frame: {self.frame_count}"
        ]
        
        for i, line in enumerate(info_lines):
            color = (255, 255, 255) if i == 0 else (200, 200, 200)
            cv2.putText(frame, line, (10, 25 + i * 20), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 1)
        
        # 경고 상황이 있으면 화면 상단에 큰 경고 메시지
        if all_warnings:
            cv2.rectangle(frame, (500, 5), (frame.shape[1] - 5, 60), (0, 0, 255), -1)
            cv2.putText(frame, "⚠️  WARNING ZONE  ⚠️", (510, 35), 
                    cv2.FONT_HERSHEY_SIMPLEX, 1.0, (255, 255, 255), 2)
        
        return all_warnings

    def run(self):
        """메인 실행 루프"""
        print("🚗 미니카 주차장 추적 시스템 v2.0 시작")
        print("📍 주차장 좌표 기본값 적용됨")
        print("🅿️  주차구역 8개 설정 완료")
        print("📊 색상 탐지: 파랑, 노랑, 하양 (3색)")
        print("⚠️  센서 경고 + 차량 충돌 경고 활성화")
        
        if self.cap is None:
            print("❌ 카메라 초기화 실패. 프로그램을 종료한다.")
            return
            
        if self.headless:
            print("💻 헤드리스 모드로 실행 중...")
            print("Ctrl+C로 종료")
            print("이미지는 30프레임마다 'output_XXXX.jpg'로 저장된다.")
        else:
            print("🖥️  GUI 모드로 실행 중...")
            print("⌨️  키 명령어:")
            print("   's' - 주차장 영역 재설정 (기본값 사용 중)")
            print("   'r' - 주차장 영역 기본값으로 리셋")
            print("   'c' - 색상 범위 및 주차구역 정보 표시")
            print("   'q' - 종료")
        
        try:
            while True:
                ret, frame = self.cap.read()
                if not ret:
                    print("❌ 카메라에서 프레임을 읽을 수 없다")
                    break
                
                self.frame_count += 1
                
                # 차량 탐지
                detected_cars = self.detect_cars_by_color(frame)
                
                # 주차구역 점유 상태 확인 (이 부분이 누락되어 있었다!)
                self.check_spot_occupancy(detected_cars)
                
                # 인터페이스 그리기 및 경고 확인
                all_warnings = self.draw_interface(frame, detected_cars)
                
                # 경고 처리
                self.handle_warning(all_warnings)
                
                # 콘솔 출력 (상태 정보)
                if self.frame_count % 60 == 0:  # 60프레임마다 출력
                    occupied_spots = sum(1 for spot in self.parking_spots if spot['occupied'])
                    sensor_warnings = [w for w in all_warnings if w['type'] != 'collision']
                    collision_warnings = [w for w in all_warnings if w['type'] == 'collision']
                    
                    print(f"📊 프레임 {self.frame_count}: "
                        f"탐지된 차량 {len(detected_cars)}대 "
                        f"(파랑:{sum(1 for v in detected_cars if v['color'] == 'blue')}, "
                        f"노랑:{sum(1 for v in detected_cars if v['color'] == 'yellow')}, "
                        f"하양:{sum(1 for v in detected_cars if v['color'] == 'white')}), "
                        f"주차구역 {occupied_spots}/8 점유, "
                        f"센서경고 {len(sensor_warnings)}개, 충돌경고 {len(collision_warnings)}개")
                
                if self.headless:
                    # 헤드리스 모드: 주기적으로 이미지 저장
                    if self.frame_count % self.save_interval == 0:
                        filename = f"output_{self.frame_count:04d}.jpg"
                        cv2.imwrite(filename, frame)
                        print(f"💾 이미지 저장: {filename}")
                    
                    # 짧은 딜레이
                    time.sleep(0.05)
                    
                else:
                    # GUI 모드: 화면 표시
                    cv2.imshow('Parking Tracker v2.0', frame)
                    
                    # 키 입력 처리
                    key = cv2.waitKey(1) & 0xFF
                    if key == ord('q'):
                        break
                    elif key == ord('s'):
                        self.setup_parking_area(frame)
                    elif key == ord('r'):
                        # 기본값으로 리셋
                        self.parking_area = [
                            (205, 17), (997, 13), (1031, 695), (209, 717)
                        ]
                        # 주차구역도 리셋 (점유 상태만)
                        for spot in self.parking_spots:
                            spot['occupied'] = False
                            spot['vehicle_id'] = None
                            spot['vehicle_color'] = None
                        print("🔄 주차장 영역을 기본값으로 리셋! 주차구역 점유 상태 초기화!")
                    elif key == ord('c'):
                        # 색상 범위 정보 및 감지된 차량의 실제 HSV 값 표시
                        print("🎨 현재 색상 범위 (HSV):")
                        for color, (lower, upper) in self.color_ranges.items():
                            print(f"   {color}: H({lower[0]}-{upper[0]}) S({lower[1]}-{upper[1]}) V({lower[2]}-{upper[2]})")
                        
                        print("🚗 감지된 차량의 실제 HSV 값:")
                        for i, car in enumerate(detected_cars):
                            if 'hsv_values' in car:
                                hsv = car['hsv_values']
                                print(f"   차량 {i+1} ({car['color']} ID:{car.get('id', '?')}): H={hsv['h']}, S={hsv['s']}, V={hsv['v']}")
                        
                        print("🅿️  주차구역 8개:")
                        for spot in self.parking_spots:
                            x, y, w, h = spot['bbox']
                            status = "점유됨" if spot['occupied'] else "비어있음"
                            vehicle_info = ""
                            if spot['occupied'] and spot['vehicle_color']:
                                vehicle_info = f" ({spot['vehicle_color']} 차량 ID:{spot['vehicle_id']})"
                            print(f"   구역 {spot['id']}: ({x},{y})~({x+w},{y+h}) - {status}{vehicle_info}")
                
        except KeyboardInterrupt:
            print("🛑 프로그램 종료")
        
        finally:
            self.cleanup()

if __name__ == "__main__":
    import sys
    
    # GUI 모드로 실행 (사용자가 GUI로 하겠다고 했으므로)
    headless = False
    if len(sys.argv) > 1 and sys.argv[1] == '--headless':
        headless = True
    
    tracker = ParkingTracker(headless=headless)
    tracker.run()