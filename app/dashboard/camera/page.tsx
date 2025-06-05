"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Camera, Play, Pause, RotateCcw, Maximize, Settings, CheckCircle } from "lucide-react"

export default function CameraPage() {
  const [selectedCamera, setSelectedCamera] = useState(0)
  const [isRecording, setIsRecording] = useState(true)

  const cameras = [{ id: 0, name: "Top-view 카메라", location: "주차장 전체 조망", status: "online", zone: "전체" }]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-green-500"
      case "offline":
        return "bg-red-500"
      case "maintenance":
        return "bg-yellow-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "online":
        return "온라인"
      case "offline":
        return "오프라인"
      case "maintenance":
        return "점검중"
      default:
        return "알 수 없음"
    }
  }

  // 카메라 목록 섹션을 간소화하고, 메인 화면을 더 크게 표시
  return (
    <div className="p-6 pt-20 lg:pt-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">카메라 모니터링</h1>
        <p className="text-gray-600 mt-2">Top-view 카메라로 주차장 전체 실시간 모니터링</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* 메인 카메라 뷰 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  Top-view 카메라
                </CardTitle>
                <CardDescription>주차장 전체 조망 • A구역 4개, B구역 4개 공간 모니터링</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="default" className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  온라인
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* 카메라 화면 */}
            <div className="relative bg-black rounded-lg overflow-hidden mb-4" style={{ aspectRatio: "16/9" }}>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-white">
                  <Camera className="h-20 w-20 mx-auto mb-4 opacity-50" />
                  <p className="text-xl font-medium">Top-view 실시간 피드</p>
                  <p className="text-sm opacity-75">주차장 전체 조망</p>
                  <div className="mt-4 flex items-center justify-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-sm">LIVE</span>
                  </div>
                </div>
              </div>

              {/* 주차공간 오버레이 표시 */}
              <div className="absolute inset-4">
                <div className="grid grid-cols-2 gap-8 h-full">
                  {/* A구역 */}
                  <div className="border-2 border-blue-400 border-dashed rounded-lg p-2 bg-blue-900 bg-opacity-20">
                    <div className="text-blue-300 text-sm font-medium mb-2">A구역</div>
                    <div className="grid grid-cols-2 gap-1 h-full">
                      {Array.from({ length: 4 }, (_, i) => (
                        <div
                          key={i}
                          className={`border rounded text-xs flex items-center justify-center ${
                            i < 3
                              ? "border-red-400 bg-red-500 bg-opacity-30 text-red-200"
                              : "border-green-400 bg-green-500 bg-opacity-30 text-green-200"
                          }`}
                        >
                          A{i + 1}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* B구역 */}
                  <div className="border-2 border-yellow-400 border-dashed rounded-lg p-2 bg-yellow-900 bg-opacity-20">
                    <div className="text-yellow-300 text-sm font-medium mb-2">B구역</div>
                    <div className="grid grid-cols-2 gap-1 h-full">
                      {Array.from({ length: 4 }, (_, i) => (
                        <div
                          key={i}
                          className={`border rounded text-xs flex items-center justify-center ${
                            i < 2
                              ? "border-red-400 bg-red-500 bg-opacity-30 text-red-200"
                              : "border-green-400 bg-green-500 bg-opacity-30 text-green-200"
                          }`}
                        >
                          B{i + 1}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* 카메라 정보 오버레이 */}
              <div className="absolute top-4 left-4 bg-black bg-opacity-75 text-white px-3 py-2 rounded-lg text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span>{new Date().toLocaleTimeString("ko-KR")}</span>
                </div>
              </div>

              {/* 주차 현황 정보 */}
              <div className="absolute top-4 right-4 bg-black bg-opacity-75 text-white px-3 py-2 rounded-lg text-sm">
                <div className="text-center">
                  <div className="text-xs opacity-75">현재 주차</div>
                  <div className="text-lg font-bold">5/8</div>
                </div>
              </div>
            </div>

            {/* 카메라 컨트롤 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant={isRecording ? "destructive" : "default"}
                  size="sm"
                  onClick={() => setIsRecording(!isRecording)}
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

                <Button variant="outline" size="sm">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  새로고침
                </Button>

                <Button variant="outline" size="sm">
                  <Maximize className="h-4 w-4 mr-2" />
                  전체화면
                </Button>
              </div>

              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                설정
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
