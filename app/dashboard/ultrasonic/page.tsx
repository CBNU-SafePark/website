"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Activity, Waves, AlertTriangle, CheckCircle, Settings, RefreshCw, Wifi, WifiOff } from "lucide-react"
import { fetchUltrasonicSensors, UltrasonicSensorData } from "@/lib/api"
import { PageHeader } from "@/components/page-header"

export default function UltrasonicPage() {
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleString("ko-KR"))
  const [refreshCount, setRefreshCount] = useState(0)
  const [ultrasonicSensors, setUltrasonicSensors] = useState<UltrasonicSensorData[]>([])
  const [isLiveData, setIsLiveData] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // 센서 데이터 가져오기 함수
  const loadSensorData = async () => {
    try {
      setIsLoading(true)
      const { sensors, isLiveData: live } = await fetchUltrasonicSensors()
      setUltrasonicSensors(sensors)
      setIsLiveData(live)
    } catch (error) {
      console.error('센서 데이터 로드 실패:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // 컴포넌트 마운트 시 초기 데이터 로드
  useEffect(() => {
    loadSensorData()
  }, [])

  // 자동 새로고침
  useEffect(() => {
    let timer: NodeJS.Timeout
    if (autoRefresh) {
      timer = setInterval(async () => {
        setCurrentTime(new Date().toLocaleString("ko-KR"))
        setRefreshCount((prev) => prev + 1)
        
        // 실시간 데이터 가져오기
        await loadSensorData()
      }, 3000)
    }

    return () => {
      if (timer) clearInterval(timer)
    }
  }, [autoRefresh])

  const getStatusInfo = (status: string, distance: number, threshold: number) => {
    switch (status) {
      case "occupied":
        return {
          color: "bg-red-500",
          textColor: "text-red-700",
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
          label: "차량 감지",
          description: `${Math.round(distance)}cm - 차량 감지`,
        }
      case "normal":
        return {
          color: "bg-green-500",
          textColor: "text-green-700",
          bgColor: "bg-green-50",
          borderColor: "border-green-200",
          label: "정상",
          description: `${Math.round(distance)}cm - 정상 범위`,
        }
      case "error":
        return {
          color: "bg-gray-500",
          textColor: "text-gray-700",
          bgColor: "bg-gray-50",
          borderColor: "border-gray-200",
          label: "오류",
          description: "센서 연결 오류",
        }
      default:
        return {
          color: "bg-gray-500",
          textColor: "text-gray-700",
          bgColor: "bg-gray-50",
          borderColor: "border-gray-200",
          label: "알 수 없음",
          description: "상태 확인 필요",
        }
    }
  }

  // 통계 계산
  const totalSensors = ultrasonicSensors.length
  const normalSensors = ultrasonicSensors.filter(s => s.status === 'normal').length
  const occupiedSensors = ultrasonicSensors.filter(s => s.status === 'occupied')
  const averageDistance = totalSensors > 0 
    ? Math.round(ultrasonicSensors.reduce((acc, sensor) => acc + sensor.distance, 0) / totalSensors)
    : 0

  return (
    <div className="p-6 pt-20 lg:pt-6 bg-gray-50">
      <PageHeader 
        title="초음파 센서 모니터링" 
        description="실시간 거리 측정 및 차량 감지 시스템" 
      />
      <div className="mb-8 lg:mb-0">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">초음파 센서 모니터링</h1>
            <p className="text-gray-600">실시간 거리 측정 및 차량 감지 시스템</p>
          </div>
          <div className="flex items-center gap-2 mt-4 md:mt-0">
            <div className="text-sm text-gray-500 bg-white px-3 py-1.5 rounded-md border shadow-sm flex items-center gap-2">
              {isLiveData ? (
                <><Wifi className="h-4 w-4 text-green-600" /> 실시간 연결</>
              ) : (
                <><WifiOff className="h-4 w-4 text-red-600" /> 더미 데이터</>
              )}
              • 마지막 업데이트: {currentTime}
            </div>
            <Button
              variant={autoRefresh ? "default" : "outline"}
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={autoRefresh ? "bg-blue-600 hover:bg-blue-700" : ""}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh || isLoading ? "animate-spin" : ""}`} />
              {autoRefresh ? "자동 새로고침 중" : "자동 새로고침"}
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              설정
            </Button>
          </div>
        </div>
      </div>

      {/* 센서 상태 요약 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="border-l-4 border-l-purple-500 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-purple-50 bg-opacity-50">
            <CardTitle className="text-sm font-medium">총 센서 수</CardTitle>
            <div className="p-2 bg-purple-100 rounded-md">
              <Waves className="h-4 w-4 text-purple-700" />
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold">{totalSensors}</div>
            <p className="text-xs text-muted-foreground mt-1">초음파 센서</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-green-50 bg-opacity-50">
            <CardTitle className="text-sm font-medium">정상 작동</CardTitle>
            <div className="p-2 bg-green-100 rounded-md">
              <CheckCircle className="h-4 w-4 text-green-700" />
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold text-green-600">{normalSensors}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {normalSensors === totalSensors ? "모든 센서 정상" : `${normalSensors}/${totalSensors} 정상`}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-red-50 bg-opacity-50">
            <CardTitle className="text-sm font-medium">차량 감지</CardTitle>
            <div className="p-2 bg-red-100 rounded-md">
              <Activity className="h-4 w-4 text-red-700" />
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold text-red-600">{occupiedSensors.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {occupiedSensors.length > 0 
                ? occupiedSensors.map(s => s.name).join(', ')
                : '감지된 차량 없음'
              }
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-blue-50 bg-opacity-50">
            <CardTitle className="text-sm font-medium">평균 거리</CardTitle>
            <div className="p-2 bg-blue-100 rounded-md">
              <Waves className="h-4 w-4 text-blue-700" />
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold text-blue-600">{averageDistance}cm</div>
            <p className="text-xs text-muted-foreground mt-1">전체 센서 평균</p>
          </CardContent>
        </Card>
      </div>

      {/* 센서별 상세 정보 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {ultrasonicSensors.map((sensor) => {
          const statusInfo = getStatusInfo(sensor.status, sensor.distance, sensor.threshold)
          const distancePercentage = Math.min((sensor.distance / (sensor.threshold * 2)) * 100, 100)

          return (
            <Card key={sensor.id} className={`border-2 ${statusInfo.borderColor} shadow-md`}>
              <CardHeader className={`${statusInfo.bgColor} border-b ${statusInfo.borderColor}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Waves className="h-5 w-5" />
                      {sensor.name}
                    </CardTitle>
                    <CardDescription>
                      {sensor.location} • {sensor.zone}
                    </CardDescription>
                  </div>
                  <Badge
                    variant={sensor.status === "occupied" ? "destructive" : "default"}
                    className="flex items-center gap-1 shadow-sm"
                  >
                    {sensor.status === "occupied" ? (
                      <AlertTriangle className="h-3 w-3" />
                    ) : (
                      <CheckCircle className="h-3 w-3" />
                    )}
                    {statusInfo.label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className={`p-4 rounded-lg ${statusInfo.bgColor} mb-4 border ${statusInfo.borderColor}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`font-medium ${statusInfo.textColor}`}>측정 거리</span>
                    <span className={`text-2xl font-bold ${statusInfo.textColor}`}>
                      {Math.round(sensor.distance)}cm
                    </span>
                  </div>
                  <p className={`text-sm ${statusInfo.textColor}`}>{statusInfo.description}</p>
                </div>

                {/* 거리 시각화 */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>거리 표시</span>
                    <span>임계값: {sensor.threshold}cm</span>
                  </div>
                  <div className="w-full h-6 bg-gray-100 rounded-lg border border-gray-200 overflow-hidden relative">
                    <div
                      className={`h-full transition-all duration-300 ${
                        sensor.distance < sensor.threshold
                          ? "bg-gradient-to-r from-red-400 to-red-600"
                          : "bg-gradient-to-r from-green-400 to-green-600"
                      }`}
                      style={{ width: `${distancePercentage}%` }}
                    />
                    {/* 임계값 표시선 */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-gray-800"
                      style={{ left: `${(sensor.threshold / (sensor.threshold * 2)) * 100}%` }}
                    >
                      <div className="w-2 h-2 bg-gray-800 rounded-full -ml-0.5 -mt-1"></div>
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>0cm</span>
                    <span className="relative">
                      <span className="absolute -top-4 -ml-2 text-xs font-medium">{sensor.threshold}cm</span>
                    </span>
                    <span>{sensor.threshold * 2}cm+</span>
                  </div>
                </div>

                {/* 센서 상태 정보 */}
                <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">상태:</span>
                    <span className={`ml-2 font-medium ${statusInfo.textColor}`}>{statusInfo.label}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">임계값:</span>
                    <span className="ml-2 font-medium">{sensor.threshold}cm</span>
                  </div>
                  <div>
                    <span className="text-gray-600">ID:</span>
                    <span className="ml-2 font-medium text-gray-500">{`SN-${sensor.id}${sensor.id}${sensor.id}${sensor.id}`}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* 실시간 차트 영역 */}
      <Card className="border shadow-md">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>실시간 거리 측정 그래프</CardTitle>
              <CardDescription>지난 1시간 동안의 센서별 거리 변화</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-white">
                새로고침 횟수: {refreshCount}
              </Badge>
              <Badge 
                variant={isLiveData ? "default" : "secondary"} 
                className={isLiveData ? "bg-green-600" : "bg-gray-600"}
              >
                {isLiveData ? "실시간" : "더미"}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="h-64 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-center p-4">
            <div className="text-center text-gray-500">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">실시간 차트</p>
              <p className="text-sm">센서 데이터 시각화 영역</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-4"
                onClick={loadSensorData}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                데이터 로드
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
