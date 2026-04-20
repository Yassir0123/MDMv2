import { formatDateTimeValue } from "@/lib/utils"

export type HelpdeskScope = "ALL" | "MYTICKETS" | "TAGGED" | "TARGETED"

export type HelpdeskSyncPayload = {
  ticketId?: number
  reason?: "claim" | "create" | "message" | "admin-save" | "refresh"
}

const HELPDESK_SYNC_EVENT = "mdm:helpdesk-sync"
const HELPDESK_CHANNEL_NAME = "mdm-helpdesk-sync"

function openHelpdeskChannel() {
  if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") {
    return null
  }
  return new BroadcastChannel(HELPDESK_CHANNEL_NAME)
}

export function emitHelpdeskSync(payload: HelpdeskSyncPayload = {}) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent<HelpdeskSyncPayload>(HELPDESK_SYNC_EVENT, { detail: payload }))
  }

  const channel = openHelpdeskChannel()
  if (!channel) return

  try {
    channel.postMessage({ ...payload, timestamp: Date.now() })
  } finally {
    channel.close()
  }
}

export function subscribeHelpdeskSync(
  callback: (payload: HelpdeskSyncPayload) => void
) {
  if (typeof window === "undefined") {
    return () => undefined
  }

  const handleWindowEvent = (event: Event) => {
    const customEvent = event as CustomEvent<HelpdeskSyncPayload>
    callback(customEvent.detail || {})
  }

  window.addEventListener(HELPDESK_SYNC_EVENT, handleWindowEvent as EventListener)

  const channel = openHelpdeskChannel()
  const handleChannelMessage = (event: MessageEvent<HelpdeskSyncPayload>) => {
    callback(event.data || {})
  }

  channel?.addEventListener("message", handleChannelMessage as EventListener)

  return () => {
    window.removeEventListener(HELPDESK_SYNC_EVENT, handleWindowEvent as EventListener)
    channel?.removeEventListener("message", handleChannelMessage as EventListener)
    channel?.close()
  }
}

export interface HelpdeskUserOption {
  id: number
  name: string
  login?: string | null
  role: string
  matricule?: string | null
  location?: string | null
}

export interface HelpdeskDeviceOption {
  id: number
  userId?: number | null
  userName?: string | null
  matricule?: string | null
  serialNumber?: string | null
  deviceName?: string | null
  type?: string | null
  location?: string | null
}

export interface HelpdeskFile {
  id: number
  filePath: string
  fileName: string
}

export interface HelpdeskMessage {
  id: number
  senderId?: number | null
  senderName?: string | null
  senderRole?: string | null
  receiverId?: number | null
  position: number
  statusSent?: string | null
  replied: number
  latestDate?: string | null
  body: string
}

export interface HelpdeskTicketSummary {
  id: number
  status: string
  subject: string
  importance?: string | null
  impact?: string | null
  flag?: string | null
  dateSent?: string | null
  sousCategoryId?: number | null
  category?: string | null
  localisation?: string | null
  type?: string | null
  senderId?: number | null
  senderName?: string | null
  applierId?: number | null
  applierName?: string | null
  applierMatricule?: string | null
  closeDelay?: number | null
  canReply: boolean
  observerOnly: boolean
  canClaim: boolean
  claimedByCurrentUser: boolean
}

export interface HelpdeskTicketDetail extends HelpdeskTicketSummary {
  viewerMode: "admin" | "requester" | "observer"
  canAdminManage: boolean
  body?: string | null
  demandeur: HelpdeskUserOption
  observers: HelpdeskUserOption[]
  targets: HelpdeskUserOption[]
  devices: HelpdeskDeviceOption[]
  messages: HelpdeskMessage[]
  files: HelpdeskFile[]
}

export interface HelpdeskBootstrap {
  canCreate: boolean
  role: string
  defaultLocation?: string | null
  currentUser: HelpdeskUserOption
  allowedScopes: HelpdeskScope[]
  observerOptions: HelpdeskUserOption[]
  targetOptions: HelpdeskUserOption[]
  myDevices: HelpdeskDeviceOption[]
  collaboratorDevices: HelpdeskDeviceOption[]
}

export interface HelpdeskCreatePayload {
  subject: string
  body: string
  type: "incident" | "demande"
  flag: "NONE" | "MID" | "HIGH"
  sousCategoryId: number
  localisation: string
  deviceIds: number[]
  observerIds: number[]
}

export const HELPDESK_CATEGORY_OPTIONS = [
  { id: 1, label: "Hardware", value: "hardware" },
  { id: 2, label: "Software", value: "software" },
  { id: 3, label: "Account", value: "account" },
  { id: 4, label: "Network", value: "network" },
] as const

export const HELPDESK_FLAG_OPTIONS = [
  { value: "NONE", label: "NONE" },
  { value: "MID", label: "MID" },
  { value: "HIGH", label: "HIGH" },
] as const

export const HELPDESK_STATUS_LABELS: Record<string, string> = {
  nouveau: "Nouveau",
  en_attente: "En attente",
  en_progress: "En progress",
  resolu: "Résolu",
  clos: "Clos",
}

export const HELPDESK_LEVEL_LABELS: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
}

export const HELPDESK_SCOPE_LABELS: Record<HelpdeskScope, string> = {
  ALL: "All",
  MYTICKETS: "MyTickets",
  TAGGED: "Tagged",
  TARGETED: "Assigned",
}

export function getHelpdeskStatusTone(status?: string | null) {
  switch (status) {
    case "nouveau":
      return "bg-sky-100 text-sky-700"
    case "en_attente":
      return "bg-amber-100 text-amber-700"
    case "en_progress":
      return "bg-indigo-100 text-indigo-700"
    case "resolu":
      return "bg-emerald-100 text-emerald-700"
    case "clos":
      return "bg-slate-200 text-slate-700"
    default:
      return "bg-secondary text-muted-foreground"
  }
}

export function getHelpdeskFlagTone(flag?: string | null) {
  switch (flag) {
    case "HIGH":
      return "bg-rose-100 text-rose-700"
    case "MID":
      return "bg-amber-100 text-amber-700"
    default:
      return "bg-slate-100 text-slate-700"
  }
}

export function formatHelpdeskDate(value?: string | null) {
  return formatDateTimeValue(value, "-")
}
