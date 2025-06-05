"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BarChart3, TrendingUp, TrendingDown, Clock, Car, Users, Calendar, Activity } from "lucide-react"

export default function StatisticsPage() {
  const hourlyData = [
    { hour: "00:00", count: 12 },
    { hour: "02:00", count: 8 },
    { hour: "04:00", count: 5 },
    { hour: "06:00", count: 15 },
    { hour: "08:00", count: 45 },
    { hour: "10:00", count: 67 },
    { hour: "12:00", count: 89 },
    { hour: "14:00", count: 78 },
    { hour: "16:00", count: 92 },
    { hour: "18:00", count: 85 },
    { hour: "20:00", count: 56 },
    { hour: "22:00", count: 34 },
  ]

  const weeklyData = [
    { day: "월", count: 18, entries: 18 },
    { day: "화", count: 22, entries: 22 },
    { day: "수", count: 25, entries: 25 },
    { day: "목", count: 20, entries: 20 },
    { day: "금", count: 28, entries: 28 },
    { day: "토", count: 35, entries: 35 },
    { day: "일", count: 30, entries: 30 },
  ]

  const maxHourlyCount = Math.max(...hourlyData.map((d) => d.count))
  const maxWeeklyCount = Math.max(...weeklyData.map((d) => d.count))

  return (
    <div className="p-6 pt-20 lg:pt-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">통계 및 분석</h1>
        <p className="text-gray-600 mt-2">주차장 이용 현황과 수익 분석 데이터</p>
      </div>

      {/* 주요 지표 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">오늘 총 진입</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              <span className="text-green-500">+12.5%</span>
              <span className="ml-1">어제 대비</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">차단기 개폐</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">46</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <span className="text-blue-500">진입 23회, 출차 23회</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">평균 주차 시간</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.4시간</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
              <span className="text-red-500">-5.2%</span>
              <span className="ml-1">지난주 대비</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">피크 시간대</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">16:00</div>
            <p className="text-xs text-muted-foreground">최대 이용 시간대</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* 시간대별 이용 현황 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              시간대별 이용 현황
            </CardTitle>
            <CardDescription>오늘 시간대별 주차장 이용량</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {hourlyData.map((data, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="w-12 text-sm font-medium">{data.hour}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(data.count / maxHourlyCount) * 100}%` }}
                        />
                      </div>
                      <div className="w-8 text-sm text-right">{data.count}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 요일별 통계 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              주간 이용 통계
            </CardTitle>
            <CardDescription>지난 7일간 이용량 및 수익</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {weeklyData.map((data, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{data.day}요일</span>
                    <div className="flex items-center gap-4">
                      <Badge variant="outline">{data.count}대</Badge>
                      <span className="text-sm font-medium">진입 {data.entries}회</span>
                    </div>
                  </div>
                  <div className="bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(data.count / maxWeeklyCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 구역별 통계 */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>구역별 이용 현황</CardTitle>
          <CardDescription>각 주차 구역의 상세 통계 (총 8개 공간)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { zone: "A구역", total: 4, occupied: 3, entries: 12, avgTime: "2.1시간" },
              { zone: "B구역", total: 4, occupied: 2, entries: 11, avgTime: "2.8시간" },
            ].map((zone, index) => {
              const utilization = Math.round((zone.occupied / zone.total) * 100)

              return (
                <div key={index} className="p-6 border rounded-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{zone.zone}</h3>
                    <Badge variant={utilization > 75 ? "destructive" : utilization > 50 ? "default" : "secondary"}>
                      {utilization}% 사용중
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">현재 주차</span>
                      <span className="font-medium">
                        {zone.occupied}/{zone.total}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">오늘 진입</span>
                      <span className="font-medium">{zone.entries}회</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">평균 주차시간</span>
                      <span className="font-medium">{zone.avgTime}</span>
                    </div>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        utilization > 75 ? "bg-red-500" : utilization > 50 ? "bg-yellow-500" : "bg-green-500"
                      }`}
                      style={{ width: `${utilization}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* 월간 요약 */}
      <Card>
        <CardHeader>
          <CardTitle>월간 요약 리포트</CardTitle>
          <CardDescription>이번 달 주요 지표 요약</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-600">687</div>
              <p className="text-sm text-blue-600">총 진입 차량</p>
            </div>

            <div className="text-center p-4 bg-green-50 rounded-lg">
              <Activity className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-600">1,374</div>
              <p className="text-sm text-green-600">차단기 개폐 횟수</p>
            </div>

            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <Clock className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-purple-600">2.3시간</div>
              <p className="text-sm text-purple-600">평균 주차시간</p>
            </div>

            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <BarChart3 className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-orange-600">62%</div>
              <p className="text-sm text-orange-600">평균 이용률</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
