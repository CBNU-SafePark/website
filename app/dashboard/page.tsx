"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Car, Users, AlertTriangle, CheckCircle, Thermometer, Droplets, Activity, Clock, Wifi, WifiOff } from "lucide-react"
import { useState, useEffect } from "react"
import { fetchParkingData, ParkingSystemStatus } from "@/lib/api"
import { PageHeader } from "@/components/page-header"

export default function DashboardPage() {
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleString("ko-KR"))
  const [isLoading, setIsLoading] = useState(true)
  const [isLiveData, setIsLiveData] = useState(false)
  const [systemStatus, setSystemStatus] = useState<ParkingSystemStatus | null>(null)

  // 주차 데이터 상태
  const [parkingData, setParkingData] = useState({
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
  })

  // 주차 데이터 가져오기 함수
  const loadParkingData = async () => {
    try {
      setIsLoading(true)
      const { parkingData: data, isLiveData: live, systemStatus: status } = await fetchParkingData()
      setParkingData(data)
      setIsLiveData(live)
      setSystemStatus(status || null)
    } catch (error) {
      console.error('주차 데이터 로드 실패:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // 컴포넌트 마운트 시 초기 데이터 로드
  useEffect(() => {
    loadParkingData()
  }, [])

  // 시간 업데이트 및 자동 새로고침
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleString("ko-KR"))
      // 주차 데이터도 자동으로 새로고침 (5초마다)
      loadParkingData()
    }, 5000)

    return () => clearInterval(timer)
  }, [])

  // 통계 계산
  const totalSpaces = parkingData.zoneA.total + parkingData.zoneB.total
  const totalOccupied = parkingData.zoneA.occupied + parkingData.zoneB.occupied
  const totalVehicles = systemStatus?.total_vehicles || totalOccupied
  const todayEntries = 23 // 이건 아직 API에서 제공하지 않음

  return (
    <div className="p-6 pt-20 lg:pt-6 bg-gray-50">
      <PageHeader 
        title="안녕하세요, 관리자님!" 
        description="스마트 안전 주차장 현황을 확인하세요" 
      />
      <div className="mb-8 lg:mb-0">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">안녕하세요, 관리자님!</h1>
            <p className="text-gray-600">스마트 안전 주차장 현황을 확인하세요</p>
          </div>
          <div className="flex items-center gap-2 mt-4 md:mt-0">
            <div className="text-sm text-gray-500 bg-white px-3 py-1.5 rounded-md border shadow-sm flex items-center gap-2">
              {isLiveData ? (
                <><Wifi className="h-4 w-4 text-green-600" /> 실시간 연결</>
              ) : (
                <><WifiOff className="h-4 w-4 text-red-600" /> 더미 데이터</>
              )}
              • <Clock className="h-4 w-4" />
              <span>{currentTime}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 주요 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
        <Card className="overflow-hidden border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-blue-50 bg-opacity-30">
            <CardTitle className="text-sm font-medium">총 주차 공간</CardTitle>
            <div className="p-2 bg-blue-100 rounded-md">
              <Car className="h-4 w-4 text-blue-700" />
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold">{totalSpaces}</div>
            <p className="text-xs text-muted-foreground mt-1">A구역 4개, B구역 4개</p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-l-4 border-l-indigo-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-indigo-50 bg-opacity-30">
            <CardTitle className="text-sm font-medium">현재 주차량</CardTitle>
            <div className="p-2 bg-indigo-100 rounded-md">
              <Users className="h-4 w-4 text-indigo-700" />
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold text-indigo-600">{totalVehicles}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {systemStatus?.vehicle_counts ? (
                <>
                  파랑 {systemStatus.vehicle_counts.blue}, 노랑 {systemStatus.vehicle_counts.yellow}, 하양 {systemStatus.vehicle_counts.white}
                </>
                             ) : (
                 <><span className="text-green-600 font-medium">+2</span> 지난 시간 대비</>
               )}
            </p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-l-4 border-l-emerald-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-emerald-50 bg-opacity-30">
            <CardTitle className="text-sm font-medium">오늘 진입 차량</CardTitle>
            <div className="p-2 bg-emerald-100 rounded-md">
              <Activity className="h-4 w-4 text-emerald-700" />
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold text-emerald-600">{todayEntries}</div>
            <p className="text-xs text-muted-foreground mt-1">차단기 개폐 횟수</p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-green-50 bg-opacity-30">
            <CardTitle className="text-sm font-medium">시스템 상태</CardTitle>
            <div className="p-2 bg-green-100 rounded-md">
              <CheckCircle className="h-4 w-4 text-green-700" />
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className={`text-3xl font-bold ${
              systemStatus?.status === 'active' ? 'text-green-600' : 'text-yellow-600'
            }`}>
              {systemStatus?.status === 'active' ? '정상' : '대기중'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {systemStatus ? `${systemStatus.frame_count}프레임 처리됨` : '모든 센서 가동 중'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* 환경 정보 */}
        <Card className="border shadow-md">
          <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-blue-100">
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Thermometer className="h-5 w-5" />
              환경 모니터링
            </CardTitle>
            <CardDescription>실시간 온도 및 습도 정보</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-full shadow-sm">
                  <Thermometer className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-sm text-blue-800">온도</p>
                  <p className="text-2xl font-bold text-blue-600">23.5°C</p>
                </div>
              </div>
              <Badge variant="outline" className="bg-white border-blue-200 text-blue-700">
                정상
              </Badge>
            </div>

            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border border-green-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-full shadow-sm">
                  <Droplets className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-sm text-green-800">습도</p>
                  <p className="text-2xl font-bold text-green-600">65%</p>
                </div>
              </div>
              <Badge variant="outline" className="bg-white border-green-200 text-green-700">
                정상
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* 알림 및 경고 */}
        <Card className="border shadow-md">
          <CardHeader className="border-b bg-gradient-to-r from-amber-50 to-amber-100">
            <CardTitle className="flex items-center gap-2 text-amber-800">
              <AlertTriangle className="h-5 w-5" />
              시스템 알림
            </CardTitle>
            <CardDescription>최근 알림 및 경고 사항</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-6">
            <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200 shadow-sm">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-green-800">
                  {systemStatus?.status === 'active' ? '카메라 시스템 정상 가동' : '시스템 정상 가동'}
                </p>
                <p className="text-sm text-green-600">
                  {systemStatus 
                    ? `카메라 해상도 ${systemStatus.resolution}, ${systemStatus.fps}fps로 모니터링 중`
                    : '모든 카메라와 센서가 정상 작동 중이다.'
                  }
                </p>
                <p className="text-xs text-green-500 mt-1">5분 전</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200 shadow-sm">
              <Activity className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-blue-800">주차 공간 확보</p>
                <p className="text-sm text-blue-600">
                  {parkingData.zoneA.total - parkingData.zoneA.occupied > 0 
                    ? `A구역에 ${parkingData.zoneA.total - parkingData.zoneA.occupied}개의 주차 공간이 확보되었다.`
                    : 'A구역이 모두 차있다.'
                  }
                </p>
                <p className="text-xs text-blue-500 mt-1">15분 전</p>
              </div>
            </div>

            {systemStatus?.active_warnings && systemStatus.active_warnings > 0 ? (
              <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-200 shadow-sm">
                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <p className="font-medium text-red-800">경고 상황 발생</p>
                  <p className="text-sm text-red-600">
                    {systemStatus.active_warnings}개의 경고 상황이 감지되었다.
                  </p>
                  <p className="text-xs text-red-500 mt-1">방금 전</p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg border border-amber-200 shadow-sm">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-800">정기 점검 예정</p>
                  <p className="text-sm text-amber-600">내일 오전 2시 시스템 정기 점검이 예정되어 있다.</p>
                  <p className="text-xs text-amber-500 mt-1">1시간 전</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 주차 구역 현황 */}
      <Card className="border shadow-md overflow-hidden">
        <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>주차 구역별 현황</CardTitle>
              <CardDescription>각 구역별 실시간 주차 현황 (총 8개 공간)</CardDescription>
            </div>
            <Badge 
              variant={isLiveData ? "default" : "secondary"} 
              className={`${isLiveData ? "bg-green-600" : "bg-gray-600"} text-white`}
            >
              {isLiveData ? "실시간" : "더미"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x">
            {/* A구역 */}
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <h3 className="text-lg font-medium">A구역</h3>
                </div>
                <Badge
                  variant={
                    parkingData.zoneA.occupied > 3
                      ? "destructive"
                      : parkingData.zoneA.occupied > 2
                        ? "default"
                        : "secondary"
                  }
                >
                  {Math.round((parkingData.zoneA.occupied / parkingData.zoneA.total) * 100)}%
                </Badge>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>사용 중: {parkingData.zoneA.occupied}대</span>
                  <span>전체: {parkingData.zoneA.total}대</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-3 bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-300"
                    style={{ width: `${(parkingData.zoneA.occupied / parkingData.zoneA.total) * 100}%` }}
                  />
                </div>

                {/* 개별 주차공간 표시 */}
                <div className="grid grid-cols-2 gap-3 mt-4">
                  {parkingData.zoneA.spaces.map((isOccupied, i) => (
                    <div
                      key={i}
                      className={`h-16 rounded-lg border-2 flex flex-col items-center justify-center relative ${
                        isOccupied ? "bg-red-50 border-red-300" : "bg-green-50 border-green-300"
                      } ${i === 0 ? "col-span-2" : ""}`}
                    >
                      <span className={`text-lg font-bold ${isOccupied ? "text-red-700" : "text-green-700"}`}>
                        A{i + 1}
                      </span>
                      <span className="text-xs">{isOccupied ? "주차됨" : "비어있음"}</span>
                      {isOccupied && (
                        <div className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* B구역 */}
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                  <h3 className="text-lg font-medium">B구역</h3>
                </div>
                <Badge
                  variant={
                    parkingData.zoneB.occupied > 3
                      ? "destructive"
                      : parkingData.zoneB.occupied > 2
                        ? "default"
                        : "secondary"
                  }
                >
                  {Math.round((parkingData.zoneB.occupied / parkingData.zoneB.total) * 100)}%
                </Badge>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>사용 중: {parkingData.zoneB.occupied}대</span>
                  <span>전체: {parkingData.zoneB.total}대</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-3 bg-gradient-to-r from-amber-400 to-amber-600 transition-all duration-300"
                    style={{ width: `${(parkingData.zoneB.occupied / parkingData.zoneB.total) * 100}%` }}
                  />
                </div>

                {/* 개별 주차공간 표시 */}
                <div className="grid grid-cols-2 gap-3 mt-4">
                  {parkingData.zoneB.spaces.map((isOccupied, i) => (
                    <div
                      key={i}
                      className={`h-16 rounded-lg border-2 flex flex-col items-center justify-center relative ${
                        isOccupied ? "bg-red-50 border-red-300" : "bg-green-50 border-green-300"
                      } ${i === 3 ? "col-span-2" : ""}`}
                    >
                      <span className={`text-lg font-bold ${isOccupied ? "text-red-700" : "text-green-700"}`}>
                        B{i + 1}
                      </span>
                      <span className="text-xs">{isOccupied ? "주차됨" : "비어있음"}</span>
                      {isOccupied && (
                        <div className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
