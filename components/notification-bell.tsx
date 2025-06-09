import { useState, useEffect } from "react"
import { Bell, AlertTriangle, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { fetchUltrasonicSensors } from "@/lib/api"

interface Alert {
  id: string
  timestamp: Date
  sensorId: number
  sensorName: string
  previousDistance: number
  currentDistance: number
  change: number
  message: string
}

export function NotificationBell() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [previousDistances, setPreviousDistances] = useState<{[key: number]: number}>({})
  const [isOpen, setIsOpen] = useState(false)

  // 테스트용 더미 알림 추가 (개발 환경에서만)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const testAlert: Alert = {
        id: 'test-1',
        timestamp: new Date(),
        sensorId: 1,
        sensorName: 'US-01',
        previousDistance: 85,
        currentDistance: 45,
        change: 40,
        message: 'US-01에서 급격한 거리 변화 감지! 85cm → 45cm (40cm 감소)'
      }
      setAlerts([testAlert])
    }
  }, [])

  // 초음파 센서 데이터를 실시간으로 모니터링
  useEffect(() => {
    const checkForAlerts = async () => {
      try {
        const { sensors } = await fetchUltrasonicSensors()
        
        sensors.forEach(sensor => {
          const prevDistance = previousDistances[sensor.id]
          
          if (prevDistance !== undefined) {
            const distanceChange = prevDistance - sensor.distance
            
            // 30cm 이상 줄어든 경우 경고 알림 생성
            if (distanceChange >= 30) {
              const newAlert: Alert = {
                id: `${sensor.id}-${Date.now()}`,
                timestamp: new Date(),
                sensorId: sensor.id,
                sensorName: sensor.name,
                previousDistance: prevDistance,
                currentDistance: sensor.distance,
                change: distanceChange,
                message: `${sensor.name}에서 급격한 거리 변화 감지! ${Math.round(prevDistance)}cm → ${Math.round(sensor.distance)}cm (${Math.round(distanceChange)}cm 감소)`
              }
              
              setAlerts(prev => [newAlert, ...prev].slice(0, 20)) // 최대 20개 알림 유지
            }
          }
          
          // 현재 거리를 이전 거리로 저장
          setPreviousDistances(prev => ({
            ...prev,
            [sensor.id]: sensor.distance
          }))
        })
      } catch (error) {
        console.error('알림 확인 중 오류:', error)
      }
    }

    // 초기 데이터 로드
    checkForAlerts()
    
    // 3초마다 데이터 확인
    const interval = setInterval(checkForAlerts, 3000)
    
    return () => clearInterval(interval)
  }, [previousDistances])

  const removeAlert = (alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId))
  }

  const clearAllAlerts = () => {
    setAlerts([])
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ko-KR', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    })
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative hover:bg-gray-100 p-2"
        >
          <Bell className={`h-5 w-5 ${alerts.length > 0 ? 'text-orange-500' : 'text-gray-600'} ${alerts.length > 0 ? 'animate-pulse' : ''}`} />
          {alerts.length > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs animate-pulse"
            >
              {alerts.length > 9 ? '9+' : alerts.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        align="end" 
        className="w-96 p-0 max-h-96 overflow-hidden"
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-gray-900">알림</h3>
          {alerts.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllAlerts}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              모두 지우기
            </Button>
          )}
        </div>
        
        <div className="max-h-80 overflow-y-auto">
          {alerts.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">새로운 알림이 없다</p>
            </div>
          ) : (
            <div className="space-y-0">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="p-4 border-b last:border-b-0 hover:bg-gray-50 group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
                        <span className="text-sm font-medium text-gray-900">
                          급격한 거리 변화
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {alert.message}
                      </p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{alert.sensorName}</span>
                        <span>{formatTime(alert.timestamp)}</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAlert(alert.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {alerts.length > 0 && (
          <div className="p-3 border-t bg-gray-50">
            <p className="text-xs text-gray-500 text-center">
              총 {alerts.length}개의 경고 알림
            </p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
} 