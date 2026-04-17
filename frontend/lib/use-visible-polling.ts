"use client"

import { useEffect } from "react"

export function useVisiblePolling(
  callback: () => void | Promise<void>,
  intervalMs = 4000,
  deps: readonly unknown[] = []
) {
  useEffect(() => {
    const run = () => {
      if (document.visibilityState === "visible") {
        void callback()
      }
    }

    const interval = window.setInterval(run, intervalMs)
    window.addEventListener("focus", run)
    document.addEventListener("visibilitychange", run)

    return () => {
      window.clearInterval(interval)
      window.removeEventListener("focus", run)
      document.removeEventListener("visibilitychange", run)
    }
  }, deps)
}
