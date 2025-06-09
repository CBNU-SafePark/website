import { NotificationBell } from "@/components/notification-bell"

interface PageHeaderProps {
  title: string
  description?: string
}

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <div className="hidden lg:flex items-center justify-between mb-6 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {description && (
          <p className="text-gray-600 mt-1">{description}</p>
        )}
      </div>
      <div className="flex items-center gap-3">
        <NotificationBell />
      </div>
    </div>
  )
} 