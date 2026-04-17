"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import api from "@/lib/api"
import { emitNotificationsRefresh, subscribeNotificationsRefresh } from "@/lib/notification-sync"

export interface NotificationItem {
  id: number
  nom: string
  userId: number | null
  targetId: number | null
  managerId: number | null
  targetUser: number | null
  lu: boolean
  createdAt: string
  actorName?: string | null
  targetName?: string | null
  managerName?: string | null
  targetUserName?: string | null
}

interface UseNotificationsOptions {
  pollMs?: number
}

export function useNotifications(options: UseNotificationsOptions = {}) {
  const pollMs = options.pollMs ?? 4000
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isMutating, setIsMutating] = useState(false)

  const refresh = useCallback(async () => {
    try {
      const response = await api.get<NotificationItem[]>("/notifications")
      setNotifications(Array.isArray(response.data) ? response.data : [])
    } catch (error) {
      console.error("Failed to load notifications:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    let mounted = true

    const runRefresh = async () => {
      if (!mounted || document.visibilityState === "hidden") {
        return
      }
      await refresh()
    }

    void runRefresh()
    const intervalId = window.setInterval(() => {
      void runRefresh()
    }, pollMs)

    const handleFocus = () => {
      void runRefresh()
    }

    const handleSync = () => {
      void runRefresh()
    }

    window.addEventListener("focus", handleFocus)
    document.addEventListener("visibilitychange", handleFocus)
    const unsubscribeSync = subscribeNotificationsRefresh(handleSync)

    return () => {
      mounted = false
      window.clearInterval(intervalId)
      window.removeEventListener("focus", handleFocus)
      document.removeEventListener("visibilitychange", handleFocus)
      unsubscribeSync()
    }
  }, [pollMs, refresh])

  const markAsRead = useCallback(async (id: number) => {
    setNotifications((prev) => prev.map((item) => (item.id === id ? { ...item, lu: true } : item)))
    try {
      setIsMutating(true)
      await api.put(`/notifications/${id}/read`)
      emitNotificationsRefresh("read-one")
    } catch (error) {
      console.error("Failed to mark notification as read:", error)
      await refresh()
    } finally {
      setIsMutating(false)
    }
  }, [refresh])

  const markAllAsRead = useCallback(async () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, lu: true })))
    try {
      setIsMutating(true)
      await api.put("/notifications/read-all")
      emitNotificationsRefresh("read-all")
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error)
      await refresh()
    } finally {
      setIsMutating(false)
    }
  }, [refresh])

  const deleteNotification = useCallback(async (id: number) => {
    const previous = notifications
    setNotifications((prev) => prev.filter((item) => item.id !== id))
    try {
      setIsMutating(true)
      await api.delete(`/notifications/${id}`)
      emitNotificationsRefresh("delete-one")
    } catch (error) {
      console.error("Failed to delete notification:", error)
      setNotifications(previous)
    } finally {
      setIsMutating(false)
    }
  }, [notifications])

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.lu).length,
    [notifications]
  )

  return {
    notifications,
    unreadCount,
    isLoading,
    isMutating,
    refresh,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  }
}

export function formatNotificationTimestamp(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return date.toLocaleString("fr-FR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function buildNotificationDescription(notification: NotificationItem) {
  const actor = notification.actorName ? `Par ${notification.actorName}` : null
  const target = notification.targetName ? `Cible ${notification.targetName}` : null
  const collaborateur = notification.targetUserName ? `Collaborateur ${notification.targetUserName}` : null
  const manager = notification.managerName ? `Manager ${notification.managerName}` : null
  return [actor, target, collaborateur, manager].filter(Boolean).join(" | ")
}
