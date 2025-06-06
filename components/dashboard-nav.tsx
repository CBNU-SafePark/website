"use client"

import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Car, Camera, BarChart3, LogOut, Menu, X, Home, Thermometer, Activity, User } from "lucide-react"

const navigation = [
  { name: "대시보드", href: "/dashboard", icon: Home },
  { name: "카메라 모니터링", href: "/dashboard/camera", icon: Camera },
  { name: "초음파 센서", href: "/dashboard/ultrasonic", icon: Activity },
  { name: "통계 및 분석", href: "/dashboard/statistics", icon: BarChart3 },
  { name: "환경 모니터링", href: "/dashboard/environment", icon: Thermometer },
]

export function DashboardNav() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated")
    router.push("/")
  }

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Car className="h-6 w-6 text-blue-600" />
            <span className="font-semibold text-gray-900">스마트 주차장</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-gradient-to-b from-gray-50 to-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 shadow-md ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-2 px-6 py-5 border-b border-gray-200">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Car className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900">스마트 주차장</h1>
              <p className="text-xs text-gray-500">관리자 시스템 v1.0</p>
            </div>
          </div>

          {/* User info */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-full">
                <User className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="font-medium text-sm">관리자</p>
                <p className="text-xs text-gray-500">admin@smartparking.com</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-blue-50 text-blue-700 border border-blue-200 shadow-sm"
                      : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className={`h-5 w-5 ${isActive ? "text-blue-600" : "text-gray-500"}`} />
                  {item.name}
                  {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500"></div>}
                </Link>
              )
            })}
          </nav>

          {/* System status */}
          <div className="px-4 py-3 border-t border-gray-200">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-green-800">시스템 정상 작동 중</span>
              </div>
              <p className="text-xs text-green-600 mt-1">모든 센서가 연결되어 있습니다</p>
            </div>
          </div>

          {/* Logout button */}
          <div className="p-4 border-t border-gray-200">
            <Button
              variant="ghost"
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5 mr-3" />
              로그아웃
            </Button>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black bg-opacity-50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
    </>
  )
}
