"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Camera, Play, Pause, RotateCcw, Maximize, Settings, CheckCircle } from "lucide-react"

export default function CameraPage() {
  const [isRecording, setIsRecording] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString("ko-KR"))
  const [noiseEffect, setNoiseEffect] = useState(0.02) // 노이즈 효과 강도

  // 시간 업데이트 시뮬레이션
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString("ko-KR"))
      // 노이즈 효과 랜덤 변경 (실제 CCTV처럼 약간의 노이즈 효과)
      setNoiseEffect(0.01 + Math.random() * 0.03)
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  return (
    <div className="p-6 pt-20 lg:pt-6 bg-gray-50">
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">카메라 모니터링</h1>
            <p className="text-gray-600">Top-view 카메라로 주차장 전체 실시간 모니터링</p>
          </div>
          <div className="flex items-center gap-2 mt-4 md:mt-0">
            <Badge variant="outline" className="bg-white border shadow-sm px-3 py-1.5">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
              실시간 모니터링 중
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* 메인 카메라 뷰 */}
        <Card className="border shadow-lg overflow-hidden">
          <CardHeader className="border-b bg-gradient-to-r from-gray-800 to-gray-900 text-white">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  Top-view 카메라
                </CardTitle>
                <CardDescription className="text-gray-300">
                  주차장 전체 조망 • A구역 4개, B구역 4개 공간 모니터링
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="default" className="bg-green-600 text-white border-0 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  온라인
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {/* 카메라 화면 - 실제 CCTV 느낌을 위한 스타일링 */}
            <div className="relative bg-black overflow-hidden" style={{ aspectRatio: "16/9" }}>
              {/* 노이즈 효과 오버레이 */}
              <div
                className="absolute inset-0 z-10 pointer-events-none"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                  opacity: noiseEffect,
                  mixBlendMode: "overlay",
                }}
              />

              {/* 스캔라인 효과 */}
              <div
                className="absolute inset-0 z-10 pointer-events-none"
                style={{
                  background: "linear-gradient(transparent 50%, rgba(0, 0, 0, 0.05) 50%)",
                  backgroundSize: "100% 4px",
                  opacity: 0.3,
                }}
              />

              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
                <div className="text-center text-white">
                  <Camera className="h-20 w-20 mx-auto mb-4 opacity-30" />
                  <p className="text-xl font-medium opacity-70">Top-view 실시간 피드</p>
                  <p className="text-sm opacity-50">주차장 전체 조망</p>
                  <div className="mt-4 flex items-center justify-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-sm">LIVE</span>
                  </div>
                </div>
              </div>

              {/* 주차공간 오버레이 표시 - 더 실제 CCTV 느낌으로 */}
              <div className="absolute inset-4">
                <div className="grid grid-cols-2 gap-8 h-full">
                  {/* A구역 */}
                  <div className="border-2 border-blue-400 border-dashed rounded-lg p-2 bg-blue-900 bg-opacity-10">
                    <div className="text-blue-300 text-sm font-medium mb-2 flex items-center">
                      <div className="w-2 h-2 bg-blue-400 rounded-full mr-1"></div>
                      A구역
                    </div>
                    <div className="grid grid-cols-2 gap-1 h-full">
                      {[true, true, true, false].map((isOccupied, i) => (
                        <div
                          key={i}
                          className={`border rounded text-xs flex items-center justify-center ${
                            isOccupied
                              ? "border-red-400 bg-red-500 bg-opacity-30 text-red-200"
                              : "border-green-400 bg-green-500 bg-opacity-30 text-green-200"
                          }`}
                        >
                          A{i + 1}
                          {isOccupied && <div className="ml-1 w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse"></div>}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* B구역 */}
                  <div className="border-2 border-yellow-400 border-dashed rounded-lg p-2 bg-yellow-900 bg-opacity-10">
                    <div className="text-yellow-300 text-sm font-medium mb-2 flex items-center">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full mr-1"></div>
                      B구역
                    </div>
                    <div className="grid grid-cols-2 gap-1 h-full">
                      {[true, false, true, false].map((isOccupied, i) => (
                        <div
                          key={i}
                          className={`border rounded text-xs flex items-center justify-center ${
                            isOccupied
                              ? "border-red-400 bg-red-500 bg-opacity-30 text-red-200"
                              : "border-green-400 bg-green-500 bg-opacity-30 text-green-200"
                          }`}
                        >
                          B{i + 1}
                          {isOccupied && <div className="ml-1 w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse"></div>}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* 카메라 정보 오버레이 */}
              <div className="absolute top-4 left-4 bg-black bg-opacity-75 text-white px-3 py-2 rounded-lg text-sm border border-gray-700">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="font-mono">{currentTime}</span>
                </div>
              </div>

              {/* 주차 현황 정보 */}
              <div className="absolute top-4 right-4 bg-black bg-opacity-75 text-white px-3 py-2 rounded-lg text-sm border border-gray-700">
                <div className="text-center">
                  <div className="text-xs opacity-75">현재 주차</div>
                  <div className="text-lg font-bold font-mono">5/8</div>
                </div>
              </div>

              {/* 카메라 ID 및 위치 */}
              <div className="absolute bottom-4 left-4 bg-black bg-opacity-75 text-white px-3 py-2 rounded-lg text-sm border border-gray-700">
                <div className="flex flex-col">
                  <span className="text-xs opacity-75">카메라 ID: CAM-001</span>
                  <span className="text-xs opacity-75">위치: 주차장 천장</span>
                </div>
              </div>
            </div>

            {/* 카메라 컨트롤 */}
            <div className="flex items-center justify-between p-4 bg-gray-900">
              <div className="flex items-center gap-2">
                <Button
                  variant={isRecording ? "destructive" : "default"}
                  size="sm"
                  onClick={() => setIsRecording(!isRecording)}
                  className="shadow-md"
                >
                  {isRecording ? (
                    <>
                      <Pause className="h-4 w-4 mr-2" />
                      녹화 중지
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      녹화 시작
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="bg-gray-800 text-gray-200 border-gray-700 hover:bg-gray-700"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  새로고침
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="bg-gray-800 text-gray-200 border-gray-700 hover:bg-gray-700"
                >
                  <Maximize className="h-4 w-4 mr-2" />
                  전체화면
                </Button>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="bg-gray-800 text-gray-200 border-gray-700 hover:bg-gray-700"
              >
                <Settings className="h-4 w-4 mr-2" />
                설정
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 카메라 정보 카드 */}
        <Card className="border shadow-md">
          <CardHeader>
            <CardTitle>카메라 정보</CardTitle>
            <CardDescription>Top-view 카메라 상세 정보</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">카메라 모델:</span>
                  <span className="font-medium">HD-IP-2000</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">해상도:</span>
                  <span className="font-medium">1080p</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">프레임레이트:</span>
                  <span className="font-medium">30fps</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">설치일:</span>
                  <span className="font-medium">2023-05-15</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">마지막 점검일:</span>
                  <span className="font-medium">2023-11-20</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">상태:</span>
                  <span className="font-medium text-green-600">정상 작동</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
