"use client"

import { Bell, Package, AlertCircle, CheckCircle, Trash2, Eye, RefreshCcw } from "lucide-react"
import { useMemo, useState } from "react"
import { NotificationItem, buildNotificationDescription, formatNotificationTimestamp } from "@/lib/notifications"

interface NotificationsPageProps {
  notifications: NotificationItem[]
  isLoading?: boolean
  isMutating?: boolean
  onMarkAsRead: (id: number) => void | Promise<void>
  onMarkAllAsRead: () => void | Promise<void>
  onDeleteNotification: (id: number) => void | Promise<void>
  onRefresh?: () => void | Promise<void>
}

export default function NotificationsPage({
  notifications,
  isLoading = false,
  isMutating = false,
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
  onRefresh,
}: NotificationsPageProps) {
  const [filterType, setFilterType] = useState<"all" | "unread" | "read">("all")
  const [selectedNotif, setSelectedNotif] = useState<number | null>(null)

  const getIcon = (message: string) => {
    const normalized = message.toLowerCase()
    if (normalized.includes("signal")) return <AlertCircle className="w-5 h-5" />
    if (normalized.includes("reception")) return <CheckCircle className="w-5 h-5" />
    if (normalized.includes("affect")) return <Package className="w-5 h-5" />
    return <Bell className="w-5 h-5" />
  }

  const filteredNotifications = useMemo(() => {
    return notifications.filter((notification) => {
      if (filterType === "unread") return !notification.lu
      if (filterType === "read") return notification.lu
      return true
    })
  }, [filterType, notifications])

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.lu).length,
    [notifications]
  )

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-blue-500/5 via-purple-500/5 to-transparent pointer-events-none -mr-[20vw] -ml-[20vw] rounded-[100%]" />

      <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 relative z-10">
        
        {/* Header section */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 ring-1 ring-white/10 shadow-lg">
              <div className="absolute inset-0 bg-blue-500/10 blur-xl rounded-full" />
              <Bell className="w-6 h-6 text-blue-600 dark:text-blue-400 relative z-10" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-foreground tracking-tight">Centre de Notifications</h1>
              <p className="text-sm text-muted-foreground mt-1 font-medium">Suivi temps réel des activités, validations et alertes système</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => void onRefresh?.()}
              className="px-4 py-2 bg-card/80 backdrop-blur-sm border border-border/50 text-foreground hover:bg-secondary/80 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-2 hover:shadow-md"
              disabled={isLoading}
            >
              <RefreshCcw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
              Actualiser
            </button>
            {unreadCount > 0 && (
              <button
                onClick={() => void onMarkAllAsRead()}
                className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-xl text-xs font-bold transition-all duration-300 disabled:opacity-60 shadow-[0_0_15px_rgba(37,99,235,0.3)] hover:shadow-[0_0_20px_rgba(37,99,235,0.5)]"
                disabled={isMutating}
              >
                Tout marquer comme lu
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 bg-card/40 backdrop-blur-xl p-1.5 rounded-2xl border border-border/50 shadow-sm w-fit">
          <button
            onClick={() => setFilterType("all")}
            className={`px-4 py-2 rounded-xl font-bold text-xs transition-all duration-300 ${filterType === "all"
              ? "bg-foreground text-background shadow-md transform scale-[1.02]"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              }`}
          >
            Toutes <span className="ml-1.5 opacity-70">({notifications.length})</span>
          </button>
          <button
            onClick={() => setFilterType("unread")}
            className={`px-4 py-2 rounded-xl font-bold text-xs transition-all duration-300 ${filterType === "unread"
              ? "bg-blue-600 text-white shadow-[0_0_10px_rgba(37,99,235,0.4)] transform scale-[1.02]"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              }`}
          >
            Non lues <span className="ml-1.5 opacity-90 font-black">({unreadCount})</span>
          </button>
          <button
            onClick={() => setFilterType("read")}
            className={`px-4 py-2 rounded-xl font-bold text-xs transition-all duration-300 ${filterType === "read"
              ? "bg-foreground text-background shadow-md transform scale-[1.02]"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              }`}
          >
            Lues <span className="ml-1.5 opacity-70">({notifications.length - unreadCount})</span>
          </button>
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {isLoading && notifications.length === 0 ? (
            <div className="bg-card/40 backdrop-blur-md border border-border/50 rounded-3xl p-12 text-center shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-muted/30 flex items-center justify-center mx-auto mb-4 animate-pulse">
                <Bell className="w-8 h-8 text-muted-foreground/40" />
              </div>
              <h3 className="text-sm font-bold text-foreground">Actualisation en cours</h3>
              <p className="text-muted-foreground font-medium text-xs mt-2">Nous préparons vos notifications...</p>
            </div>
          ) : filteredNotifications.length > 0 ? (
            <div className="grid gap-3">
              {filteredNotifications.map((notification) => {
                const description = buildNotificationDescription(notification)
                return (
                  <div
                    key={notification.id}
                    className={`group p-4 sm:p-5 rounded-2xl border transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 ${notification.lu
                      ? "bg-card/60 backdrop-blur-sm border-border/40 hover:border-border"
                      : "bg-blue-50/50 dark:bg-blue-900/10 backdrop-blur-md border-blue-200 dark:border-blue-800/30 shadow-[0_4px_20px_-10px_rgba(59,130,246,0.15)]"
                      }`}
                  >
                    <div className="flex gap-4 sm:gap-5">
                      <div
                        className={`flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-2xl transition-colors duration-300 ${notification.lu 
                          ? "bg-muted text-muted-foreground" 
                          : "bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400"
                          }`}
                      >
                        {getIcon(notification.nom)}
                      </div>

                      <div className="flex-1 min-w-0 pt-0.5">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div className="flex-1">
                            <button
                              onClick={() => setSelectedNotif((prev) => (prev === notification.id ? null : notification.id))}
                              className="text-left w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded flex items-center justify-between"
                            >
                              <p className={`font-semibold sm:text-sm text-xs truncate pr-4 ${notification.lu ? "text-foreground/80" : "text-foreground font-bold"}`}>
                                {notification.nom}
                              </p>
                              {!notification.lu && <div className="sm:hidden w-2 h-2 rounded-full bg-blue-600 flex-shrink-0 shadow-[0_0_8px_rgba(37,99,235,0.6)]" />}
                            </button>
                            <div className="flex items-center gap-2 mt-1.5">
                              <p className="text-[10px] text-muted-foreground font-medium bg-muted/50 px-2 py-0.5 rounded-md inline-flex">
                                {formatNotificationTimestamp(notification.createdAt)}
                              </p>
                            </div>
                          </div>
                          {!notification.lu && <div className="hidden sm:block w-2.5 h-2.5 rounded-full bg-blue-600 flex-shrink-0 mt-1 shadow-[0_0_8px_rgba(37,99,235,0.6)]" />}
                        </div>

                        <div className={`grid transition-all duration-300 ease-in-out ${selectedNotif === notification.id ? 'grid-rows-[1fr] mt-4 opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                          <div className="overflow-hidden">
                            <div className="p-4 rounded-xl bg-secondary/30 border border-border/50 text-xs text-foreground/80 leading-relaxed font-medium">
                              {description || "Aucun détail complémentaire pour cette notification."}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex-shrink-0 flex flex-col sm:flex-row gap-1.5 pt-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        {!notification.lu && (
                          <button
                            onClick={() => void onMarkAsRead(notification.id)}
                            className="p-2 hover:bg-blue-100 hover:text-blue-600 dark:hover:bg-blue-900/30 rounded-xl transition-all duration-200 text-muted-foreground"
                            title="Marquer comme lu"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => void onDeleteNotification(notification.id)}
                          className="p-2 hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-900/30 rounded-xl transition-all duration-200 text-muted-foreground"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="bg-card/40 backdrop-blur-md border border-border/50 rounded-3xl p-16 flex flex-col items-center justify-center text-center shadow-sm">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full" />
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-card to-muted flex items-center justify-center mb-6 relative z-10 ring-1 ring-white/10 shadow-xl">
                  <Bell className="w-10 h-10 text-muted-foreground/40" />
                </div>
              </div>
              <h3 className="text-lg font-black text-foreground tracking-tight">
                {filterType === "unread" && "Aucune notification non lue"}
                {filterType === "read" && "Aucune notification lue"}
                {filterType === "all" && "Votre boîte de réception est vide"}
              </h3>
              <p className="text-muted-foreground font-medium text-sm mt-2 max-w-[250px]">
                Vous êtes à jour ! Profitez de ce moment de tranquillité.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
