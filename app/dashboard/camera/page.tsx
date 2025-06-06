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
  const [cameraStatus, setCameraStatus] = useState('연결 중...')
  const [cameraOnline, setCameraOnline] = useState(false)
  const [cameraServerUrl, setCameraServerUrl] = useState('http://localhost:5000')
  const [cameraInfo, setCameraInfo] = useState({
    model: 'USB 웹캠',
    resolution: '640x480',
    fps: 30,
    installDate: new Date().toLocaleDateString('ko-KR'),
    lastCheckDate: new Date().toLocaleDateString('ko-KR')
  })

  // 카메라 서버 URL 설정
  useEffect(() => {
    // 브라우저 환경에서만 실행
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname
      setCameraServerUrl(`http://${hostname}:5000`)
    }
  }, [])

  // 시간 업데이트 및 카메라 상태 확인
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString("ko-KR"))
      // 노이즈 효과 랜덤 변경 (실제 CCTV처럼 약간의 노이즈 효과)
      setNoiseEffect(0.01 + Math.random() * 0.03)
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // 카메라 상태 확인
  useEffect(() => {
    const checkCameraStatus = async () => {
      try {
        const response = await fetch(`${cameraServerUrl}/status`)
        if (response.ok) {
          const data = await response.json()
          setCameraStatus(data.status === 'active' ? '온라인' : '오프라인')
          setCameraOnline(data.status === 'active')
          
          // 카메라 정보 업데이트
          if (data.status === 'active') {
            setCameraInfo(prev => ({
              ...prev,
              resolution: `${data.resolution[0]}x${data.resolution[1]}`,
              fps: data.fps,
              lastCheckDate: new Date().toLocaleDateString('ko-KR')
            }))
          }
        } else {
          setCameraStatus('서버 연결 실패')
          setCameraOnline(false)
        }
      } catch (error) {
        setCameraStatus('서버 연결 실패')
        setCameraOnline(false)
      }
    }

    // cameraServerUrl이 설정된 후에만 실행
    if (cameraServerUrl !== 'http://localhost:5000') {
      checkCameraStatus()
      
      // 5초마다 상태 확인
      const statusTimer = setInterval(checkCameraStatus, 5000)
      return () => clearInterval(statusTimer)
    }
  }, [cameraServerUrl])

  return (
    <div className="p-6 pt-20 lg:pt-6 bg-gray-50">
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">카메라 모니터링</h1>
            <p className="text-gray-600">USB 웹캠을 통한 실시간 영상 모니터링</p>
          </div>
          <div className="flex items-center gap-2 mt-4 md:mt-0">
            <Badge variant="outline" className="bg-white border shadow-sm px-3 py-1.5">
              <div className={`w-2 h-2 rounded-full animate-pulse mr-2 ${
                cameraOnline ? 'bg-green-500' : 'bg-yellow-500'
              }`}></div>
              카메라 {cameraStatus}
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
                  USB 웹캠
                </CardTitle>
                <CardDescription className="text-gray-300">
                  실시간 영상 스트리밍 • {cameraInfo.resolution} @ {cameraInfo.fps}fps
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="default" className={`text-white border-0 flex items-center gap-1 ${
                  cameraOnline ? 'bg-green-600' : 'bg-yellow-600'
                }`}>
                  <CheckCircle className="h-3 w-3" />
                  {cameraStatus}
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

              {/* 실제 웹캠 스트림 */}
              <img
                src={`${cameraServerUrl}/video_feed`}
                alt="실시간 웹캠 피드"
                className="absolute inset-0 w-full h-full object-cover"
                onError={(e) => {
                  // 스트림 연결 실패 시 폴백
                  (e.currentTarget as HTMLElement).style.display = 'none';
                  const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = 'flex';
                }}
                onLoad={(e) => {
                  // 스트림 연결 성공 시 폴백 숨기기
                  const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = 'none';
                }}
              />
              
              {/* 폴백 화면 (카메라 연결 안됨) */}
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
                <div className="text-center text-white">
                  <Camera className="h-20 w-20 mx-auto mb-4 opacity-30" />
                  <p className="text-xl font-medium opacity-70">카메라 연결 대기 중</p>
                  <p className="text-sm opacity-50">백엔드 서버를 시작해주세요</p>
                  <div className="mt-4 flex items-center justify-center gap-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse" />
                    <span className="text-sm">연결 중...</span>
                  </div>
                  <div className="mt-2 text-xs opacity-40">
                    scripts/start_camera_server.sh 실행
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



              {/* 카메라 ID 및 위치 */}
              <div className="absolute bottom-4 left-4 bg-black bg-opacity-75 text-white px-3 py-2 rounded-lg text-sm border border-gray-700">
                <div className="flex flex-col">
                  <span className="text-xs opacity-75">카메라: {cameraInfo.model}</span>
                  <span className="text-xs opacity-75">해상도: {cameraInfo.resolution}</span>
                  <span className="text-xs opacity-75">상태: {cameraStatus}</span>
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
                  onClick={() => {
                    // 이미지 새로고침
                    const imgElement = document.querySelector('img[alt="실시간 웹캠 피드"]') as HTMLImageElement;
                    if (imgElement) {
                      const currentSrc = imgElement.src;
                      imgElement.src = '';
                      setTimeout(() => {
                        imgElement.src = currentSrc + '?t=' + new Date().getTime();
                      }, 100);
                    }
                  }}
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
            <CardDescription>USB 웹캠 상세 정보</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">카메라 모델:</span>
                  <span className="font-medium">{cameraInfo.model}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">해상도:</span>
                  <span className="font-medium">{cameraInfo.resolution}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">프레임레이트:</span>
                  <span className="font-medium">{cameraInfo.fps}fps</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">설치일:</span>
                  <span className="font-medium">{cameraInfo.installDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">마지막 점검일:</span>
                  <span className="font-medium">{cameraInfo.lastCheckDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">상태:</span>
                  <span className={`font-medium ${
                    cameraOnline ? 'text-green-600' : 'text-yellow-600'
                  }`}>
                    {cameraOnline ? '정상 작동' : '연결 대기 중'}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
