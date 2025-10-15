"use client"

import { useState, useRef, useEffect } from "react"
import { Bell } from "lucide-react"
import { cn } from "@/lib/utils"
import { notificationsApi } from "@/lib/api"
import { useNotificationContext } from "@/app/context/NotificationContext"

export function NotificationBadge({ className }: { className?: string }) {
  const { unreadCount, refreshUnreadCount, resetUnread } = useNotificationContext()
  const [notifications, setNotifications] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const fetchNotifications = async () => {
    try {
      const response = await notificationsApi.getAll()
      const data = response.data.content || response.data || []
      setNotifications(data)
    } catch (err) {
      console.error("Failed to fetch notifications", err)
    }
  }

  const handleToggleDropdown = async () => {
    const newOpen = !open
    setOpen(newOpen)

    if (newOpen) {
      await fetchNotifications()
    } else {
      // When dropdown closes and there are unread notifications, mark all read
      if (unreadCount > 0) {
        try {
          await notificationsApi.markAllAsRead()
          resetUnread()
          await refreshUnreadCount()
        } catch (err) {
          console.error("Failed to mark notifications as read", err)
        }
      }
    }
  }

  // Optional: click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div ref={containerRef} className={cn("relative inline-flex", className)}>
      <div
        className="relative cursor-pointer flex items-center justify-center"
        onClick={handleToggleDropdown}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </div>

      {open && (
        <div className="absolute right-0 mt-2 w-64 max-h-80 overflow-y-auto rounded-lg border border-border bg-card shadow-lg z-50">
          {notifications.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">No notifications</p>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className="p-3 border-b last:border-b-0 cursor-pointer hover:bg-accent/20"
              >
                <p className="font-medium">{n.title}</p>
                <p className="text-sm text-muted-foreground">{n.message}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
