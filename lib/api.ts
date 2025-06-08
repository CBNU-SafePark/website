// API 클라이언트 - FastAPI 서버에서 초음파 센서 데이터를 가져온다
// 임시로 localhost로 고정 (io_server가 127.0.0.1:8000에서만 listen하고 있음)
const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    // 브라우저 환경에서는 현재 호스트를 사용
    const hostname = window.location.hostname
    return `http://${hostname}:8000`
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
}

const API_BASE_URL = getApiBaseUrl()

// parking_web_server API URL (포트 5000) - 브라우저 환경에서 동적으로 설정
const getParkingApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    // 브라우저 환경에서는 현재 호스트를 사용
    const hostname = window.location.hostname
    return `http://${hostname}:5000`
  }
  // 서버 환경에서는 환경변수 또는 기본값 사용
  return process.env.NEXT_PUBLIC_PARKING_API_URL || 'http://localhost:5000'
}

export interface UltrasonicSensorData {
  id: number
  name: string
  location: string
  distance: number
  status: 'normal' | 'occupied' | 'error'
  zone: string
  threshold: number
  battery: number
}

// 주차구역 데이터 타입
export interface ParkingSpotData {
  id: number
  occupied: boolean
  vehicle_id: string | null
  vehicle_color: string | null
}

// parking_web_server에서 받는 상태 데이터 타입
export interface ParkingSystemStatus {
  status: 'active' | 'inactive'
  resolution: string
  fps: number
  frame_count: number
  total_vehicles: number
  vehicle_counts: {
    blue: number
    yellow: number
    white: number
  }
  parking_status: ParkingSpotData[]
  active_warnings: number
  warnings: any[]
  current_time: string
  gpio_available: boolean
}

// 더미 데이터 - API 호출 실패시 사용
const dummyData: UltrasonicSensorData[] = [
  {
    id: 1,
    name: "US-01",
    location: "A구역 입구",
    distance: 45,
    status: "normal",
    zone: "A구역",
    threshold: 50,
    battery: 92,
  },
  {
    id: 2,
    name: "US-02",
    location: "A구역 내부",
    distance: 12,
    status: "occupied",
    zone: "A구역",
    threshold: 50,
    battery: 87,
  },
  {
    id: 3,
    name: "US-03",
    location: "B구역 입구",
    distance: 78,
    status: "normal",
    zone: "B구역",
    threshold: 50,
    battery: 76,
  },
  {
    id: 4,
    name: "US-04",
    location: "B구역 내부",
    distance: 8,
    status: "occupied",
    zone: "B구역",
    threshold: 50,
    battery: 65,
  },
]

// 더미 주차 데이터 - parking API 호출 실패시 사용
const dummyParkingData = {
  zoneA: {
    total: 4,
    occupied: 3,
    spaces: [true, true, true, false], // true = 주차됨, false = 비어있음
  },
  zoneB: {
    total: 4,
    occupied: 2,
    spaces: [true, false, true, false],
  },
}

// 개별 센서 데이터 가져오기
async function fetchSensorData(sensorIndex: number): Promise<{ distance: number } | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/sensor/${sensorIndex}/distance`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // 타임아웃 설정
      signal: AbortSignal.timeout(5000),
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    return data
  } catch (error) {
    console.warn(`센서 ${sensorIndex} 데이터 조회 실패:`, error)
    return null
  }
}

// 전체 시스템 상태 가져오기
async function fetchSystemStatus(): Promise<any | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(5000),
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    return data
  } catch (error) {
    console.warn('시스템 상태 조회 실패:', error)
    return null
  }
}

// parking_web_server에서 주차 시스템 상태 가져오기
async function fetchParkingSystemStatus(): Promise<ParkingSystemStatus | null> {
  try {
    const response = await fetch(`${getParkingApiBaseUrl()}/status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(5000),
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    return data
  } catch (error) {
    console.warn('주차 시스템 상태 조회 실패:', error)
    return null
  }
}

// parking_web_server에서 주차구역 데이터 가져오기
async function fetchParkingSpots(): Promise<ParkingSpotData[] | null> {
  try {
    const response = await fetch(`${getParkingApiBaseUrl()}/api/parking_spots`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(5000),
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    return data
  } catch (error) {
    console.warn('주차구역 데이터 조회 실패:', error)
    return null
  }
}

// 초음파 센서 데이터 가져오기 (메인 함수)
export async function fetchUltrasonicSensors(): Promise<{ 
  sensors: UltrasonicSensorData[], 
  isLiveData: boolean 
}> {
  const sensorPromises = []
  const SENSOR_COUNT = 4 // 센서 개수를 4개로 변경
  
  // 모든 센서 데이터를 병렬로 요청
  for (let i = 0; i < SENSOR_COUNT; i++) {
    sensorPromises.push(fetchSensorData(i))
  }
  
  try {
    const sensorResults = await Promise.all(sensorPromises)
    
    // API에서 가져온 데이터가 있는지 확인
    const hasLiveData = sensorResults.some(result => result !== null)
    
    if (hasLiveData) {
      // 실시간 데이터가 있는 경우 더미 데이터와 병합
      const updatedSensors = dummyData.map((sensor, index) => {
        const liveData = sensorResults[index]
        if (liveData) {
          const distance = liveData.distance
          const status: 'normal' | 'occupied' | 'error' = distance < sensor.threshold ? 'occupied' : 'normal'
          return {
            ...sensor,
            distance,
            status,
          }
        }
        return sensor
      })
      
      return {
        sensors: updatedSensors,
        isLiveData: true
      }
    } else {
      // 모든 API 호출이 실패한 경우 더미 데이터 반환
      return {
        sensors: dummyData,
        isLiveData: false
      }
    }
  } catch (error) {
    console.error('센서 데이터 조회 중 오류:', error)
    return {
      sensors: dummyData,
      isLiveData: false
    }
  }
}

// 주차장 데이터 가져오기 (메인 함수)
export async function fetchParkingData(): Promise<{
  parkingData: any,
  isLiveData: boolean,
  systemStatus?: ParkingSystemStatus
}> {
  try {
    // parking_web_server에서 데이터 가져오기
    const [systemStatus, parkingSpots] = await Promise.all([
      fetchParkingSystemStatus(),
      fetchParkingSpots()
    ])
    
    if (systemStatus && parkingSpots) {
      // 실시간 데이터를 변환해서 기존 형식에 맞게 가공
      const zoneA = {
        total: 4,
        occupied: 0,
        spaces: [false, false, false, false]
      }
      
      const zoneB = {
        total: 4,
        occupied: 0,
        spaces: [false, false, false, false]
      }
      
      // 주차구역 1-4는 A구역, 5-8은 B구역으로 매핑
      parkingSpots.forEach((spot) => {
        if (spot.id >= 1 && spot.id <= 4) {
          // A구역
          zoneA.spaces[spot.id - 1] = spot.occupied
          if (spot.occupied) zoneA.occupied++
        } else if (spot.id >= 5 && spot.id <= 8) {
          // B구역
          zoneB.spaces[spot.id - 5] = spot.occupied
          if (spot.occupied) zoneB.occupied++
        }
      })
      
      return {
        parkingData: { zoneA, zoneB },
        isLiveData: true,
        systemStatus
      }
    } else {
      // API 호출 실패시 더미 데이터 반환
      return {
        parkingData: dummyParkingData,
        isLiveData: false
      }
    }
  } catch (error) {
    console.error('주차장 데이터 조회 중 오류:', error)
    return {
      parkingData: dummyParkingData,
      isLiveData: false
    }
  }
}

// LED 제어
export async function controlLed(ledIndex: number, action: 'on' | 'off'): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/led/${ledIndex}/${action}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(5000),
    })
    
    return response.ok
  } catch (error) {
    console.error('LED 제어 실패:', error)
    return false
  }
}

// 게이트 제어
export async function controlGate(action: 'open' | 'close'): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/gate/${action}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(5000),
    })
    
    return response.ok
  } catch (error) {
    console.error('게이트 제어 실패:', error)
    return false
  }
}

// 벨 제어
export async function controlBell(action: 'ring' | 'stop'): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/bell/${action}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(5000),
    })
    
    return response.ok
  } catch (error) {
    console.error('벨 제어 실패:', error)
    return false
  }
} 