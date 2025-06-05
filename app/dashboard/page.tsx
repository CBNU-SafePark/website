"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Car, Users, AlertTriangle, CheckCircle, Thermometer, Droplets, Activity, Clock } from "lucide-react"

export default function DashboardPage() {
  const currentTime = new Date().toLocaleString("ko-KR")

  return (
    <div className="p-6 pt-20 lg:pt-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">대시보드</h1>
        <p className="text-gray-600 mt-2">스마트 안전 주차장 현황을 한눈에 확인하세요</p>
        <div className="flex items-center gap-2 mt-4 text-sm text-gray-500">
          <Clock className="h-4 w-4" />
          <span>마지막 업데이트: {currentTime}</span>
        </div>
      </div>

      {/* 주요 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 주차 공간</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">A구역 4개, B구역 4개</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">현재 주차량</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">5</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+2</span> 지난 시간 대비
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">오늘 진입 차량</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">23</div>
            <p className="text-xs text-muted-foreground">차단기 개폐 횟수</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">시스템 상태</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">정상</div>
            <p className="text-xs text-muted-foreground">모든 센서 가동 중</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* 환경 정보 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Thermometer className="h-5 w-5" />
              환경 모니터링
            </CardTitle>
            <CardDescription>실시간 온도 및 습도 정보</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Thermometer className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="font-medium">온도</p>
                  <p className="text-2xl font-bold text-blue-600">23.5°C</p>
                </div>
              </div>
              <Badge variant="secondary">정상</Badge>
            </div>

            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Droplets className="h-8 w-8 text-green-600" />
                <div>
                  <p className="font-medium">습도</p>
                  <p className="text-2xl font-bold text-green-600">65%</p>
                </div>
              </div>
              <Badge variant="secondary">정상</Badge>
            </div>
          </CardContent>
        </Card>

        {/* 알림 및 경고 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              시스템 알림
            </CardTitle>
            <CardDescription>최근 알림 및 경고 사항</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-green-800">시스템 정상 가동</p>
                <p className="text-sm text-green-600">모든 카메라와 센서가 정상 작동 중입니다.</p>
                <p className="text-xs text-green-500 mt-1">5분 전</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <Activity className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-blue-800">주차 공간 확보</p>
                <p className="text-sm text-blue-600">A구역에 15개의 주차 공간이 확보되었습니다.</p>
                <p className="text-xs text-blue-500 mt-1">15분 전</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-800">정기 점검 예정</p>
                <p className="text-sm text-yellow-600">내일 오전 2시 시스템 정기 점검이 예정되어 있습니다.</p>
                <p className="text-xs text-yellow-500 mt-1">1시간 전</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 주차 구역 현황 */}
      <Card>
        <CardHeader>
          <CardTitle>주차 구역별 현황</CardTitle>
          <CardDescription>각 구역별 실시간 주차 현황 (총 8개 공간)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {["A구역", "B구역"].map((zone, index) => {
              const occupied = [3, 2][index]
              const total = 4
              const percentage = Math.round((occupied / total) * 100)

              return (
                <div key={zone} className="p-6 border rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium">{zone}</h3>
                    <Badge variant={percentage > 75 ? "destructive" : percentage > 50 ? "default" : "secondary"}>
                      {percentage}%
                    </Badge>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>사용 중: {occupied}대</span>
                      <span>전체: {total}대</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full ${
                          percentage > 75 ? "bg-red-500" : percentage > 50 ? "bg-yellow-500" : "bg-green-500"
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>

                    {/* 개별 주차공간 표시 */}
                    <div className="grid grid-cols-4 gap-2 mt-4">
                      {Array.from({ length: total }, (_, i) => (
                        <div
                          key={i}
                          className={`h-8 rounded border-2 flex items-center justify-center text-xs font-medium ${
                            i < occupied
                              ? "bg-red-100 border-red-300 text-red-700"
                              : "bg-green-100 border-green-300 text-green-700"
                          }`}
                        >
                          {zone.charAt(0)}
                          {i + 1}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
