"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Activity, Waves, AlertTriangle, CheckCircle, Settings, RefreshCw } from "lucide-react"

export default function UltrasonicPage() {
  const [autoRefresh, setAutoRefresh] = useState(true)

  const ultrasonicSensors = [
    { id: 1, name: "US-01", location: "A구역 입구", distance: 45, status: "normal", zone: "A구역", threshold: 50 },
    { id: 2, name: "US-02", location: "A구역 내부", distance: 12, status: "occupied", zone: "A구역", threshold: 50 },
    { id: 3, name: "US-03", location: "B구역 입구", distance: 78, status: "normal", zone: "B구역", threshold: 50 },
    { id: 4, name: "US-04", location: "B구역 내부", distance: 8, status: "occupied", zone: "B구역", threshold: 50 },
    { id: 5, name: "US-05", location: "메인 게이트", distance: 156, status: "normal", zone: "입구", threshold: 100 },
  ]

  const getStatusInfo = (status: string, distance: number, threshold: number) => {
    switch (status) {
      case "occupied":
        return {
          color: "bg-red-500",
          textColor: "text-red-700",
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
          label: "차량 감지",
          description: `${distance}cm - 차량이 감지되었습니다`,
        }
      case "normal":
        return {
          color: "bg-green-500",
          textColor: "text-green-700",
          bgColor: "bg-green-50",
          borderColor: "border-green-200",
          label: "정상",
          description: `${distance}cm - 정상 범위`,
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

  const currentTime = new Date().toLocaleString("ko-KR")

  return (
    <div className="p-6 pt-20 lg:pt-6">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">초음파 센서 모니터링</h1>
            <p className="text-gray-600 mt-2">실시간 거리 측정 및 차량 감지 시스템</p>
            <p className="text-sm text-gray-500 mt-1">마지막 업데이트: {currentTime}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={autoRefresh ? "default" : "outline"}
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? "animate-spin" : ""}`} />
              자동 새로고침
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              설정
            </Button>
          </div>
        </div>
      </div>

      {/* 센서 상태 요약 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 센서 수</CardTitle>
            <Waves className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">초음파 센서</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">정상 작동</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">5</div>
            <p className="text-xs text-muted-foreground">모든 센서 정상</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">차량 감지</CardTitle>
            <Activity className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">2</div>
            <p className="text-xs text-muted-foreground">US-02, US-04</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">평균 거리</CardTitle>
            <Waves className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">59.8cm</div>
            <p className="text-xs text-muted-foreground">전체 센서 평균</p>
          </CardContent>
        </Card>
      </div>

      {/* 센서별 상세 정보 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {ultrasonicSensors.map((sensor) => {
          const statusInfo = getStatusInfo(sensor.status, sensor.distance, sensor.threshold)
          const distancePercentage = Math.min((sensor.distance / (sensor.threshold * 2)) * 100, 100)

          return (
            <Card key={sensor.id} className={`${statusInfo.borderColor} border-2`}>
              <CardHeader>
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
                    className="flex items-center gap-1"
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
              <CardContent>
                <div className={`p-4 rounded-lg ${statusInfo.bgColor} mb-4`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`font-medium ${statusInfo.textColor}`}>측정 거리</span>
                    <span className={`text-2xl font-bold ${statusInfo.textColor}`}>{sensor.distance}cm</span>
                  </div>
                  <p className={`text-sm ${statusInfo.textColor}`}>{statusInfo.description}</p>
                </div>

                {/* 거리 시각화 */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>거리 표시</span>
                    <span>임계값: {sensor.threshold}cm</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all duration-300 ${
                        sensor.distance < sensor.threshold ? "bg-red-500" : "bg-green-500"
                      }`}
                      style={{ width: `${distancePercentage}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>0cm</span>
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
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* 실시간 차트 영역 */}
      <Card>
        <CardHeader>
          <CardTitle>실시간 거리 측정 그래프</CardTitle>
          <CardDescription>지난 1시간 동안의 센서별 거리 변화</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
            <div className="text-center text-gray-500">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">실시간 차트</p>
              <p className="text-sm">센서 데이터 시각화 영역</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
