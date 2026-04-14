"use client"

import { Bell, Package, AlertCircle, CheckCircle, ArrowRight } from "lucide-react"
import { useMemo, useState, useRef, useEffect } from "react"
import { NotificationItem, formatNotificationTimestamp } from "@/lib/notifications"

interface NotificationsButtonProps {
  onClick: () => void
  unreadCount?: number
  notifications?: NotificationItem[]
  isLoading?: boolean
}

export default function NotificationsButton({
  onClick,
  unreadCount = 0,
  notifications = [],
  isLoading = false,
}: NotificationsButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const displayNotifications = useMemo(() => notifications.slice(0, 4), [notifications])

  const getIcon = (message: string) => {
    const normalized = message.toLowerCase()
    if (normalized.includes("signal")) return <AlertCircle className="w-4 h-4" />
    if (normalized.includes("reception")) return <CheckCircle className="w-4 h-4" />
    if (normalized.includes("affect")) return <Package className="w-4 h-4" />
    return <Bell className="w-4 h-4" />
  }

  // Handle outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isOpen])

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-white/10 rounded-xl transition-all duration-300 outline-none focus:ring-2 focus:ring-white/30 group"
        title="Notifications"
      >
        <Bell className={`w-5 h-5 text-white/90 group-hover:text-white transition-all duration-300 ${isLoading ? "animate-pulse" : ""} ${isOpen ? "fill-white/20" : ""}`} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center ring-2 ring-sidebar-primary shadow-[0_0_8px_rgba(244,63,94,0.6)] animate-in zoom-in">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-[calc(100%+0.5rem)] w-[22rem] bg-card/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl z-50 animate-in slide-in-from-top-2 fade-in duration-300 overflow-hidden ring-1 ring-black/5">
          <div className="px-5 py-4 border-b border-border/50 bg-gradient-to-b from-card to-card/50 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-foreground text-sm tracking-tight">Notifications</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">Vous avez {unreadCount} message(s) non lu(s)</p>
            </div>
            {unreadCount > 0 && (
              <span className="bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 px-2 py-0.5 rounded-full text-[10px] font-bold">
                +{unreadCount} Nouveaux
              </span>
            )}
          </div>

          <div className="max-h-[22rem] overflow-y-auto overscroll-contain scrollbar-thin scrollbar-thumb-muted-foreground/20">
            {displayNotifications.length > 0 ? (
              <div className="flex flex-col py-1">
                {displayNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="group relative px-5 py-3 hover:bg-secondary/40 transition-all duration-200 cursor-pointer flex gap-3 items-start"
                  >
                    <div className={`flex-shrink-0 p-2 rounded-xl transition-colors duration-200 ${notification.lu ? "bg-muted text-muted-foreground" : "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"}`}>
                      {getIcon(notification.nom)}
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-xs ${notification.lu ? "font-medium text-foreground/80" : "font-semibold text-foreground"} pr-4 truncate`}>
                          {notification.nom}
                        </p>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1 font-medium bg-secondary/50 inline-block px-1.5 py-0.5 rounded-md">
                        {formatNotificationTimestamp(notification.createdAt)}
                      </p>
                    </div>
                    {!notification.lu && (
                      <div className="absolute right-5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.6)]" />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                  <Bell className="w-6 h-6 text-muted-foreground/40" />
                </div>
                <p className="text-sm font-medium text-foreground">Vous êtes à jour !</p>
                <p className="text-[11px] text-muted-foreground mt-1">Aucune nouvelle notification pour le moment.</p>
              </div>
            )}
          </div>

          <div className="p-3 border-t border-border/50 bg-card/50">
            <button
              onClick={() => {
                setIsOpen(false)
                onClick()
              }}
              className="w-full px-4 py-2 bg-foreground text-background hover:bg-foreground/90 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all duration-200 group"
            >
              Afficher le centre de notifications
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
