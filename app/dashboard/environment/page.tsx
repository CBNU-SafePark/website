"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Thermometer, Droplets, Wind, Sun, TrendingUp, TrendingDown, Activity, AlertTriangle } from "lucide-react"

export default function EnvironmentPage() {
  const currentTime = new Date().toLocaleString("ko-KR")

  const temperatureData = [
    { time: "00:00", temp: 18.5 },
    { time: "04:00", temp: 16.2 },
    { time: "08:00", temp: 20.1 },
    { time: "12:00", temp: 25.3 },
    { time: "16:00", temp: 27.8 },
    { time: "20:00", temp: 23.5 },
  ]

  const humidityData = [
    { time: "00:00", humidity: 72 },
    { time: "04:00", humidity: 78 },
    { time: "08:00", humidity: 65 },
    { time: "12:00", humidity: 58 },
    { time: "16:00", humidity: 55 },
    { time: "20:00", humidity: 65 },
  ]

  const maxTemp = Math.max(...temperatureData.map((d) => d.temp))
  const minTemp = Math.min(...temperatureData.map((d) => d.temp))
  const maxHumidity = Math.max(...humidityData.map((d) => d.humidity))

  return (
    <div className="p-6 pt-20 lg:pt-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">환경 모니터링</h1>
        <p className="text-gray-600 mt-2">주차장 내 환경 상태 실시간 모니터링</p>
        <p className="text-sm text-gray-500 mt-2">마지막 업데이트: {currentTime}</p>
      </div>

      {/* 현재 환경 상태 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">현재 온도</CardTitle>
            <Thermometer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">23.5°C</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              <span className="text-green-500">+1.2°C</span>
              <span className="ml-1">1시간 전 대비</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">현재 습도</CardTitle>
            <Droplets className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">65%</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
              <span className="text-red-500">-3%</span>
              <span className="ml-1">1시간 전 대비</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">공기 질</CardTitle>
            <Wind className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">좋음</div>
            <p className="text-xs text-muted-foreground">PM2.5: 15 μg/m³</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">조도</CardTitle>
            <Sun className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">850 lux</div>
            <p className="text-xs text-muted-foreground">적정 조도 유지</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">IR 센서</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">정상</div>
            <p className="text-xs text-muted-foreground">움직임 감지 활성</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">화재 감지</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">안전</div>
            <p className="text-xs text-muted-foreground">화재 위험 없음</p>
          </CardContent>
        </Card>
      </div>

      {/* 환경 알림 */}
      <div className="mb-8">
        <Alert className="border-green-200 bg-green-50">
          <Activity className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            모든 환경 지표가 정상 범위 내에 있습니다. 주차장 환경이 양호합니다.
          </AlertDescription>
        </Alert>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* 온도 추이 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Thermometer className="h-5 w-5" />
              온도 추이
            </CardTitle>
            <CardDescription>오늘 온도 변화 그래프</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between text-sm text-gray-600">
                <span>최저: {minTemp}°C</span>
                <span>최고: {maxTemp}°C</span>
              </div>

              <div className="space-y-3">
                {temperatureData.map((data, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className="w-12 text-sm font-medium">{data.time}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-blue-400 to-red-400 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${((data.temp - minTemp) / (maxTemp - minTemp)) * 100}%` }}
                          />
                        </div>
                        <div className="w-12 text-sm text-right font-medium">{data.temp}°C</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 습도 추이 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Droplets className="h-5 w-5" />
              습도 추이
            </CardTitle>
            <CardDescription>오늘 습도 변화 그래프</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between text-sm text-gray-600">
                <span>적정 범위: 40-70%</span>
                <span>현재: 65%</span>
              </div>

              <div className="space-y-3">
                {humidityData.map((data, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className="w-12 text-sm font-medium">{data.time}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${
                              data.humidity >= 40 && data.humidity <= 70 ? "bg-green-500" : "bg-yellow-500"
                            }`}
                            style={{ width: `${(data.humidity / maxHumidity) * 100}%` }}
                          />
                        </div>
                        <div className="w-12 text-sm text-right font-medium">{data.humidity}%</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 구역별 환경 상태 */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>구역별 환경 상태</CardTitle>
          <CardDescription>각 주차 구역의 환경 센서 데이터</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { zone: "A구역", temp: 23.2, humidity: 64, airQuality: "좋음", light: 820, ir: "정상", fire: "안전" },
              { zone: "B구역", temp: 23.8, humidity: 66, airQuality: "좋음", light: 890, ir: "정상", fire: "안전" },
              { zone: "C구역", temp: 23.5, humidity: 65, airQuality: "보통", light: 780, ir: "정상", fire: "안전" },
            ].map((zone, index) => (
              <div key={index} className="p-6 border rounded-lg space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{zone.zone}</h3>
                  <Badge variant="secondary">정상</Badge>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Thermometer className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">온도</span>
                    </div>
                    <span className="font-medium">{zone.temp}°C</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Droplets className="h-4 w-4 text-green-500" />
                      <span className="text-sm">습도</span>
                    </div>
                    <span className="font-medium">{zone.humidity}%</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wind className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">공기질</span>
                    </div>
                    <Badge variant={zone.airQuality === "좋음" ? "default" : "secondary"}>{zone.airQuality}</Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sun className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm">조도</span>
                    </div>
                    <span className="font-medium">{zone.light} lux</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-purple-500" />
                      <span className="text-sm">IR센서</span>
                    </div>
                    <Badge variant="secondary">{zone.ir}</Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      <span className="text-sm">화재감지</span>
                    </div>
                    <Badge variant="default" className="bg-green-500">
                      {zone.fire}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 환경 설정 및 임계값 */}
      <Card>
        <CardHeader>
          <CardTitle>환경 임계값 설정</CardTitle>
          <CardDescription>알림이 발생하는 환경 기준값</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Thermometer className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-blue-800">온도 범위</span>
              </div>
              <p className="text-sm text-blue-600">최적: 20-26°C</p>
              <p className="text-sm text-blue-600">경고: 15°C 이하, 30°C 이상</p>
            </div>

            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Droplets className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-800">습도 범위</span>
              </div>
              <p className="text-sm text-green-600">최적: 40-70%</p>
              <p className="text-sm text-green-600">경고: 30% 이하, 80% 이상</p>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Wind className="h-5 w-5 text-gray-600" />
                <span className="font-medium text-gray-800">공기질</span>
              </div>
              <p className="text-sm text-gray-600">좋음: PM2.5 &lt; 25 μg/m³</p>
              <p className="text-sm text-gray-600">경고: PM2.5 &gt; 50 μg/m³</p>
            </div>

            <div className="p-4 bg-yellow-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Sun className="h-5 w-5 text-yellow-600" />
                <span className="font-medium text-yellow-800">조도</span>
              </div>
              <p className="text-sm text-yellow-600">최적: 500-1000 lux</p>
              <p className="text-sm text-yellow-600">경고: 200 lux 이하</p>
            </div>

            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-5 w-5 text-purple-600" />
                <span className="font-medium text-purple-800">IR 센서</span>
              </div>
              <p className="text-sm text-purple-600">정상: 움직임 감지 활성</p>
              <p className="text-sm text-purple-600">경고: 센서 연결 오류</p>
            </div>

            <div className="p-4 bg-red-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <span className="font-medium text-red-800">화재 감지</span>
              </div>
              <p className="text-sm text-red-600">안전: 화재 위험 없음</p>
              <p className="text-sm text-red-600">위험: 연기/열 감지 시 즉시 알림</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
