"use client"

import { useEffect, useState, useRef } from "react"
import { Bell } from "lucide-react"
import { cn } from "@/lib/utils"
import SockJS from "sockjs-client"
import { Client, IMessage } from "@stomp/stompjs"
import { notificationsApi } from "@/lib/api"

interface NotificationDto {
  id: string
  title: string
  message: string
  read: boolean
}

export function NotificationBadge({ className }: { className?: string }) {
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState<NotificationDto[]>([])
  const [open, setOpen] = useState(false)
  const [connected, setConnected] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const stompClientRef = useRef<Client | null>(null)

  useEffect(() => {
    const token = localStorage.getItem("token")

    const fetchUnreadCount = async () => {
      try {
        const res = await notificationsApi.getUnreadCount()
        setUnreadCount(res.data.unreadNotifications || 0)
      } catch (err) {
        console.error("❌ Failed to fetch unread count", err)
      }
    }

    const connectWebSocket = () => {
      const socket = new SockJS("/ws")

      const client = new Client({
        webSocketFactory: () => socket,
        reconnectDelay: 5000, // Retry every 5s
        connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      })

      client.onConnect = () => {
        console.log("✅ WebSocket connected")
        setConnected(true)
        client.subscribe("/user/queue/notifications", (message: IMessage) => {
          const notification: NotificationDto = JSON.parse(message.body)
          setNotifications((prev) => [notification, ...prev])
          if (!notification.read) setUnreadCount((prev) => prev + 1)
        })
      }

      client.onDisconnect = () => {
        console.warn("⚠️ WebSocket disconnected")
        setConnected(false)
      }

      client.onStompError = (err) => {
        console.error("❌ STOMP error:", err)
        setConnected(false)
      }

      client.activate()
      stompClientRef.current = client
    }

    fetchUnreadCount()
    connectWebSocket()

    return () => {
      console.log("🧹 Cleaning up WebSocket")
      if (stompClientRef.current?.active) {
        stompClientRef.current.deactivate()
      }
    }
  }, [])

  const handleToggleDropdown = async () => {
    setOpen((prev) => !prev)
    if (!open && unreadCount > 0) {
      try {
        await notificationsApi.markAllAsRead()
        setUnreadCount(0)
      } catch (err) {
        console.error("Failed to mark notifications as read", err)
      }
    }
  }

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
        {/* Live connection indicator */}
        <span
          className={cn(
            "absolute -left-2 -bottom-1 h-2 w-2 rounded-full",
            connected ? "bg-green-500" : "bg-gray-400"
          )}
          title={connected ? "Connected to server" : "Disconnected"}
        />
        {/* Unread badge */}
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
                className={cn(
                  "p-3 border-b last:border-b-0 cursor-pointer hover:bg-accent/20",
                  !n.read && "bg-accent/10"
                )}
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
