"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { notificationsApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Bell, Check, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface Notification {
  id: string
  title: string
  message: string
  read: boolean
  createdAt: string
  senderName?: string
}

export function NotificationList() {
  const { toast } = useToast()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<{ role?: string; fullName?: string }>({})

  useEffect(() => {
    try {
      const stored = localStorage.getItem("user")
      if (stored) {
        const parsed = JSON.parse(stored)
        setUser({
          role: parsed.role,
          fullName: `${parsed.firstName || ""} ${parsed.lastName || ""}`.trim(),
        })
      }
    } catch (err) {
      console.warn("Failed to load user info from localStorage", err)
    }
  }, [])

  const fetchNotifications = async () => {
    try {
      const response = await notificationsApi.getAll()
      const data = response.data.content || response.data || []

      const normalized = (Array.isArray(data) ? data : []).map((n: any) => ({
        ...n,
        read: n.read ?? n.readStatus ?? false,
      }))

      setNotifications(normalized)
    } catch (error: any) {
      toast({
        title: "Failed to load notifications",
        description: error.response?.data?.message || "Please try again",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [])

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationsApi.markAsRead(notificationId)
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      )
    } catch (error: any) {
      toast({
        title: "Failed to mark as read",
        description: error.response?.data?.message || "Please try again",
        variant: "destructive",
      })
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      toast({ title: "All notifications marked as read" })
    } catch (error: any) {
      toast({
        title: "Failed to mark all as read",
        description: error.response?.data?.message || "Please try again",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (notifications.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        <Bell className="mx-auto mb-2 h-12 w-12 opacity-20" />
        <p>No notifications yet</p>
        <p className="text-sm">You'll be notified when there are updates</p>
      </div>
    )
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div className="space-y-4">
      {unreadCount > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
          </p>
          <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead}>
            <Check className="mr-2 h-4 w-4" />
            Mark all as read
          </Button>
        </div>
      )}

      <div className="space-y-3">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={cn(
              "rounded-lg border border-border p-4 transition-colors",
              !notification.read && "bg-accent/50"
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{notification.title}</h3>
                  {!notification.read && (
                    <span
                      className="h-2 w-2 rounded-full bg-primary"
                      title="Unread"
                    />
                  )}
                </div>

                <p className="mt-1 text-sm text-muted-foreground">
                  {notification.message}
                </p>

                {user.role !== "STUDENT" && notification.senderName && (
                  <p className="mt-2 text-xs text-muted-foreground italic">
                    Sent by{" "}
                    {notification.senderName === user.fullName
                      ? "you"
                      : notification.senderName}
                  </p>
                )}

                <p className="mt-2 text-xs text-muted-foreground">
                  {format(new Date(notification.createdAt), "MMM d, yyyy 'at' h:mm a")}
                </p>
              </div>
              {!notification.read && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleMarkAsRead(notification.id)}
                  className="shrink-0"
                >
                  <Check className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
