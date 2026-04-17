"use client"

const NOTIFICATIONS_SYNC_EVENT = "mdm:notifications-sync"
const NOTIFICATIONS_CHANNEL_NAME = "mdm-notifications-sync"
const NOTIFICATIONS_SYNC_THROTTLE_MS = 300

type NotificationSyncPayload = {
  reason?: string
}

function openNotificationsChannel() {
  if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") {
    return null
  }
  return new BroadcastChannel(NOTIFICATIONS_CHANNEL_NAME)
}

export function emitNotificationsRefresh(reason = "manual") {
  if (typeof window !== "undefined") {
    const now = Date.now()
    const lastEmit = (window as typeof window & { __mdmNotificationsSyncAt?: number }).__mdmNotificationsSyncAt ?? 0
    if (now - lastEmit < NOTIFICATIONS_SYNC_THROTTLE_MS) {
      return
    }
    ;(window as typeof window & { __mdmNotificationsSyncAt?: number }).__mdmNotificationsSyncAt = now
    window.dispatchEvent(new CustomEvent<NotificationSyncPayload>(NOTIFICATIONS_SYNC_EVENT, { detail: { reason } }))
  }

  const channel = openNotificationsChannel()
  if (!channel) return

  try {
    channel.postMessage({ reason, timestamp: Date.now() })
  } finally {
    channel.close()
  }
}

export function subscribeNotificationsRefresh(callback: (payload: NotificationSyncPayload) => void) {
  if (typeof window === "undefined") {
    return () => undefined
  }

  const handleWindowEvent = (event: Event) => {
    const customEvent = event as CustomEvent<NotificationSyncPayload>
    callback(customEvent.detail || {})
  }

  window.addEventListener(NOTIFICATIONS_SYNC_EVENT, handleWindowEvent as EventListener)

  const channel = openNotificationsChannel()
  const handleChannelMessage = (event: MessageEvent<NotificationSyncPayload>) => {
    callback(event.data || {})
  }

  channel?.addEventListener("message", handleChannelMessage as EventListener)

  return () => {
    window.removeEventListener(NOTIFICATIONS_SYNC_EVENT, handleWindowEvent as EventListener)
    channel?.removeEventListener("message", handleChannelMessage as EventListener)
    channel?.close()
  }
}
