"use client"

import { createContext, useContext, useState, useEffect, useRef } from "react"
import SockJS from "sockjs-client"
import { Client, IMessage } from "@stomp/stompjs"
import { notificationsApi } from "@/lib/api"

interface NotificationContextType {
    unreadCount: number
    refreshUnreadCount: () => Promise<void>
    incrementUnread: () => void
    resetUnread: () => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
    const [unreadCount, setUnreadCount] = useState(0)
    const stompClientRef = useRef<Client | null>(null)

    const refreshUnreadCount = async () => {
        try {
            const res = await notificationsApi.getUnreadCount()
            setUnreadCount(res.data.unreadNotifications || 0)
        } catch (err) {
            console.error("Failed to refresh unread count", err)
        }
    }

    const incrementUnread = () => setUnreadCount((prev) => prev + 1)
    const resetUnread = () => setUnreadCount(0)

    useEffect(() => {
        if (stompClientRef.current?.connected) return

        const sock = new SockJS(`${process.env.NEXT_PUBLIC_API_BASE_URL}/ws`)
        const client = new Client({
            webSocketFactory: () => sock as any,
            reconnectDelay: 5000,
        })

        client.onConnect = () => {
            console.log("✅ Connected to notification socket")

            client.subscribe("/topic/notifications", async (message: IMessage) => {
                try {
                    const notification = JSON.parse(message.body)
                    console.log("📩 New notification:", notification)

                    if (!notification.read) incrementUnread()
                    await refreshUnreadCount()
                } catch (err) {
                    console.error("Failed to parse notification:", err)
                }
            })
        }

        client.onStompError = (frame) => {
            console.error("STOMP error:", frame.headers["message"])
        }

        client.activate()
        stompClientRef.current = client

        return () => {
            client.deactivate()
        }
    }, [])

    useEffect(() => {
        refreshUnreadCount()
    }, [])

    return (
        <NotificationContext.Provider
            value={{ unreadCount, refreshUnreadCount, incrementUnread, resetUnread }}
        >
            {children}
        </NotificationContext.Provider>
    )
}

export const useNotificationContext = () => {
    const context = useContext(NotificationContext)
    if (!context) throw new Error("useNotificationContext must be used within NotificationProvider")
    return context
}
