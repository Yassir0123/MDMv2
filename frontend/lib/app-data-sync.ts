"use client"

const APP_DATA_SYNC_EVENT = "mdm:app-data-sync"
const APP_DATA_SYNC_CHANNEL_NAME = "mdm-app-data-sync"
const APP_DATA_SYNC_THROTTLE_MS = 250

export type AppDataSyncPayload = {
  reason?: string
}

function openAppDataChannel() {
  if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") {
    return null
  }
  return new BroadcastChannel(APP_DATA_SYNC_CHANNEL_NAME)
}

export function emitAppDataSync(reason = "manual") {
  if (typeof window !== "undefined") {
    const now = Date.now()
    const win = window as typeof window & { __mdmAppDataSyncAt?: number }
    const lastEmit = win.__mdmAppDataSyncAt ?? 0

    if (now - lastEmit < APP_DATA_SYNC_THROTTLE_MS) {
      return
    }

    win.__mdmAppDataSyncAt = now
    window.dispatchEvent(new CustomEvent<AppDataSyncPayload>(APP_DATA_SYNC_EVENT, { detail: { reason } }))
  }

  const channel = openAppDataChannel()
  if (!channel) return

  try {
    channel.postMessage({ reason, timestamp: Date.now() })
  } finally {
    channel.close()
  }
}

export function subscribeAppDataSync(callback: (payload: AppDataSyncPayload) => void) {
  if (typeof window === "undefined") {
    return () => undefined
  }

  const handleWindowEvent = (event: Event) => {
    const customEvent = event as CustomEvent<AppDataSyncPayload>
    callback(customEvent.detail || {})
  }

  window.addEventListener(APP_DATA_SYNC_EVENT, handleWindowEvent as EventListener)

  const channel = openAppDataChannel()
  const handleChannelMessage = (event: MessageEvent<AppDataSyncPayload>) => {
    callback(event.data || {})
  }

  channel?.addEventListener("message", handleChannelMessage as EventListener)

  return () => {
    window.removeEventListener(APP_DATA_SYNC_EVENT, handleWindowEvent as EventListener)
    channel?.removeEventListener("message", handleChannelMessage as EventListener)
    channel?.close()
  }
}
