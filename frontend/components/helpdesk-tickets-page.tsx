"use client"

import type { Dispatch, SetStateAction } from "react"
import { useEffect, useMemo, useRef, useState } from "react"
import api from "@/lib/api"
import {
  HelpdeskBootstrap,
  HelpdeskCreatePayload,
  HelpdeskDeviceOption,
  HelpdeskScope,
  HelpdeskTicketDetail,
  HelpdeskTicketSummary,
  HelpdeskUserOption,
  HELPDESK_CATEGORY_OPTIONS,
  HELPDESK_FLAG_OPTIONS,
  HELPDESK_LEVEL_LABELS,
  HELPDESK_SCOPE_LABELS,
  HELPDESK_STATUS_LABELS,
  formatHelpdeskDate,
  getHelpdeskFlagTone,
  getHelpdeskStatusTone,
} from "@/lib/helpdesk"
import {
  ArrowLeft,
  Bold,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  CircleAlert,
  Filter,
  Italic,
  LifeBuoy,
  Link2,
  List,
  ListOrdered,
  Paperclip,
  Plus,
  Quote,
  RefreshCw,
  Save,
  Search,
  Send,
  ShieldCheck,
  Trash2,
  Underline,
  X,
} from "lucide-react"

type ViewMode = "list" | "create" | "detail"
type DeviceFilter = "all" | "user" | "matricule" | "serial" | "device"
type CreateDraft = HelpdeskCreatePayload & { mode: "self" | "collaborator" }
type FilterCondition = "contains" | "startsWith" | "endsWith" | "equals"
type HelpdeskFilterRule = {
  id: string
  attribute: "id" | "subject" | "status" | "type" | "category" | "localisation" | "senderName"
  condition: FilterCondition
  term: string
}

const emptyDraft = (bootstrap?: HelpdeskBootstrap | null): CreateDraft => ({
  subject: "",
  body: "<p>Décrivez votre besoin...</p>",
  type: "incident",
  flag: "NONE",
  sousCategoryId: 1,
  localisation: bootstrap?.defaultLocation || "",
  deviceIds: [],
  observerIds: [],
  mode: "self",
})

function matchFilterCondition(value: string, term: string, condition: FilterCondition) {
  const source = value.toLowerCase()
  const query = term.toLowerCase()
  switch (condition) {
    case "startsWith":
      return source.startsWith(query)
    case "endsWith":
      return source.endsWith(query)
    case "equals":
      return source === query
    default:
      return source.includes(query)
  }
}

function HelpdeskFilterToolbar({
  filters,
  setFilters,
}: {
  filters: HelpdeskFilterRule[]
  setFilters: Dispatch<SetStateAction<HelpdeskFilterRule[]>>
}) {
  const attributes = [
    { value: "id", label: "ID" },
    { value: "subject", label: "Sujet" },
    { value: "status", label: "Statut" },
    { value: "type", label: "Type" },
    { value: "category", label: "Catégorie" },
    { value: "localisation", label: "Localisation" },
    { value: "senderName", label: "Demandeur" },
  ] as const

  const addFilter = () =>
    setFilters((current) => [
      ...current,
      { id: Date.now().toString(), attribute: "subject", condition: "contains", term: "" },
    ])

  const removeFilter = (id: string) =>
    setFilters((current) => (current.length === 1 ? current : current.filter((filter) => filter.id !== id)))

  const updateFilter = (id: string, field: keyof HelpdeskFilterRule, value: string) =>
    setFilters((current) =>
      current.map((filter) => (filter.id === id ? { ...filter, [field]: value } : filter))
    )

  return (
    <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-200 space-y-2">
      {filters.map((filter, index) => (
        <div key={filter.id} className="flex flex-col md:flex-row items-center gap-3 w-full">
          <div className="flex items-center gap-2 text-slate-400 px-2 min-w-[80px]">
            <Filter className="w-4 h-4" />
            <span className="text-xs font-bold uppercase">{index === 0 ? "Filtrer" : "Et"}</span>
          </div>
          <select
            value={filter.attribute}
            onChange={(event) => updateFilter(filter.id, "attribute", event.target.value)}
            className="w-full md:w-36 px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
          >
            {attributes.map((attribute) => (
              <option key={attribute.value} value={attribute.value}>
                {attribute.label}
              </option>
            ))}
          </select>
          <select
            value={filter.condition}
            onChange={(event) => updateFilter(filter.id, "condition", event.target.value)}
            className="w-full md:w-36 px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="contains">Contient</option>
            <option value="startsWith">Commence par</option>
            <option value="endsWith">Finit par</option>
            <option value="equals">Est égal à</option>
          </select>
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-2.5 w-3 h-3 text-slate-400" />
            <input
              type="text"
              placeholder="Valeur..."
              value={filter.term}
              onChange={(event) => updateFilter(filter.id, "term", event.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
            />
            {filters.length > 1 && (
              <button
                type="button"
                onClick={() => removeFilter(filter.id)}
                className="absolute right-2 top-2 text-slate-400 hover:text-red-500"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      ))}
      <div className="flex justify-start pl-2">
        <button
          type="button"
          onClick={addFilter}
          className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
        >
          <Plus className="w-3 h-3" /> Ajouter un filtre
        </button>
      </div>
    </div>
  )
}

function Pagination({
  current,
  total,
  setPage,
}: {
  current: number
  total: number
  setPage: (page: number) => void
}) {
  const [inputVal, setInputVal] = useState(current.toString())

  useEffect(() => {
    setInputVal(current.toString())
  }, [current])

  const go = (value: string) => {
    let next = Number.parseInt(value, 10)
    if (Number.isNaN(next) || next < 1) next = 1
    if (next > total) next = total
    setPage(next)
    setInputVal(next.toString())
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-2 border-t border-slate-100 bg-slate-50/50 gap-4">
      <span className="text-xs font-medium text-slate-500">Page {current} sur {total || 1}</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => go("1")}
          disabled={current === 1}
          className="p-1 rounded hover:bg-slate-200 text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => go(String(current - 1))}
          disabled={current === 1}
          className="p-1 rounded hover:bg-slate-200 text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2 mx-2">
          <span className="text-xs font-bold text-slate-400 uppercase">Page</span>
          <input
            type="number"
            value={inputVal}
            onChange={(event) => setInputVal(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && go(inputVal)}
            onBlur={() => go(inputVal)}
            className="w-10 h-7 text-center text-xs font-bold bg-white border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <span className="text-xs font-bold text-slate-400">/ {total || 1}</span>
        </div>
        <button
          type="button"
          onClick={() => go(String(current + 1))}
          disabled={current === total || total === 0}
          className="p-1 rounded hover:bg-slate-200 text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => go(String(total))}
          disabled={current === total || total === 0}
          className="p-1 rounded hover:bg-slate-200 text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

function RichEditor({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  const editorRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value
    }
  }, [value])

  const applyCommand = (command: string, commandValue?: string) => {
    document.execCommand(command, false, commandValue)
    onChange(editorRef.current?.innerHTML || "")
    editorRef.current?.focus()
  }

  const askLink = () => {
    const href = window.prompt("Lien à insérer")
    if (href) applyCommand("createLink", href)
  }

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-3 bg-secondary/40">
        {[
          { icon: Bold, action: () => applyCommand("bold"), label: "Bold" },
          { icon: Italic, action: () => applyCommand("italic"), label: "Italic" },
          { icon: Underline, action: () => applyCommand("underline"), label: "Underline" },
          { icon: List, action: () => applyCommand("insertUnorderedList"), label: "List" },
          { icon: ListOrdered, action: () => applyCommand("insertOrderedList"), label: "Numbered" },
          { icon: Quote, action: () => applyCommand("formatBlock", "blockquote"), label: "Quote" },
          { icon: Link2, action: askLink, label: "Link" },
        ].map(({ icon: Icon, action, label }) => (
          <button
            key={label}
            type="button"
            onClick={action}
            className="h-9 w-9 rounded-xl border border-border bg-card hover:bg-secondary transition-colors inline-flex items-center justify-center"
            title={label}
          >
            <Icon className="w-4 h-4 text-muted-foreground" />
          </button>
        ))}
      </div>

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={(event) => onChange((event.currentTarget as HTMLDivElement).innerHTML)}
        className="min-h-[260px] px-4 py-4 text-sm leading-6 outline-none prose prose-sm max-w-none"
      />
    </div>
  )
}

function ToggleList({
  options,
  selectedIds,
  onChange,
  title,
}: {
  options: HelpdeskUserOption[]
  selectedIds: number[]
  onChange: (value: number[]) => void
  title: string
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <span className="text-[11px] text-muted-foreground">{selectedIds.length} sélectionné(s)</span>
      </div>
      <div className="max-h-52 overflow-auto space-y-2 pr-1">
        {options.map((option) => {
          const active = selectedIds.includes(option.id)
          return (
            <label
              key={option.id}
              className={`flex items-start gap-3 rounded-xl border px-3 py-2 cursor-pointer transition-colors ${
                active ? "border-primary bg-primary/5" : "border-border hover:bg-secondary/50"
              }`}
            >
              <input
                type="checkbox"
                checked={active}
                onChange={() =>
                  onChange(
                    active
                      ? selectedIds.filter((id) => id !== option.id)
                      : [...selectedIds, option.id]
                  )
                }
                className="mt-1"
              />
              <div>
                <p className="text-sm font-medium text-foreground">{option.name}</p>
                <p className="text-[11px] text-muted-foreground">
                  {option.role}
                  {option.matricule ? ` • ${option.matricule}` : ""}
                </p>
              </div>
            </label>
          )
        })}
      </div>
    </div>
  )
}

function SearchableUserPicker({
  title,
  options,
  selectedIds,
  onChange,
  placeholder,
  emptyText,
}: {
  title: string
  options: HelpdeskUserOption[]
  selectedIds: number[]
  onChange: (value: number[]) => void
  placeholder: string
  emptyText: string
}) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener("mousedown", handlePointerDown)
    return () => document.removeEventListener("mousedown", handlePointerDown)
  }, [])

  const selectedUsers = useMemo(
    () =>
      selectedIds
        .map((id) => options.find((option) => option.id === id))
        .filter((user): user is HelpdeskUserOption => Boolean(user)),
    [options, selectedIds]
  )

  const filteredOptions = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return options.filter((option) => {
      if (selectedIds.includes(option.id)) return false
      if (!normalized) return true
      return [option.name, option.matricule, option.login, option.role]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalized)
    })
  }, [options, query, selectedIds])

  const addUser = (userId: number) => {
    onChange([...selectedIds, userId])
    setQuery("")
    setOpen(false)
  }

  const removeUser = (userId: number) => {
    onChange(selectedIds.filter((id) => id !== userId))
  }

  return (
    <div className="relative z-20 rounded-2xl border border-border bg-card p-4 space-y-4 overflow-visible">
      <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {title}
      </label>

      <div className="min-h-[52px] rounded-2xl border border-border bg-secondary/20 p-3">
        {selectedUsers.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {selectedUsers.map((user) => (
              <div
                key={user.id}
                className="inline-flex max-w-full items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-sm text-foreground"
              >
                <span className="truncate">
                  {user.name}
                  {user.matricule ? ` (${user.matricule})` : ""}
                </span>
                <button
                  type="button"
                  onClick={() => removeUser(user.id)}
                  className="text-muted-foreground transition-colors hover:text-destructive"
                  aria-label={`Retirer ${user.name}`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{emptyText}</p>
        )}
      </div>

      <div ref={containerRef} className="relative z-20 space-y-3 overflow-visible">
        <div className="relative">
          <Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
          <input
            value={query}
            onFocus={() => setOpen(true)}
            onChange={(event) => {
              setQuery(event.target.value)
              setOpen(true)
            }}
            placeholder={placeholder}
            className="mdm-input h-11 pl-10"
          />
          {open && (
            <div className="absolute inset-x-0 bottom-[calc(100%+8px)] z-[80] max-h-[260px] overflow-auto rounded-2xl border border-border bg-card shadow-xl">
              {filteredOptions.length > 0 ? (
                <div className="divide-y divide-border">
                  {filteredOptions.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => addUser(option.id)}
                      className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-secondary/50"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{option.name}</p>
                        <p className="truncate text-[11px] text-muted-foreground">
                          {[option.matricule, option.login, option.role].filter(Boolean).join(" • ") || "Utilisateur"}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-4 text-sm text-muted-foreground">
                  Aucun utilisateur ne correspond à cette recherche.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function HelpdeskTicketsPage() {
  const PAGE_SIZE = 10
  const [bootstrap, setBootstrap] = useState<HelpdeskBootstrap | null>(null)
  const [tickets, setTickets] = useState<HelpdeskTicketSummary[]>([])
  const [view, setView] = useState<ViewMode>("list")
  const [loading, setLoading] = useState(true)
  const [ticketsLoading, setTicketsLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detail, setDetail] = useState<HelpdeskTicketDetail | null>(null)
  const [scope, setScope] = useState<HelpdeskScope>("ALL")
  const [filters, setFilters] = useState<HelpdeskFilterRule[]>([
    { id: "1", attribute: "subject", condition: "contains", term: "" },
  ])
  const [page, setPage] = useState(1)
  const [draft, setDraft] = useState<CreateDraft>(emptyDraft(null))
  const [deviceFilter, setDeviceFilter] = useState<DeviceFilter>("all")
  const [deviceQuery, setDeviceQuery] = useState("")
  const [files, setFiles] = useState<File[]>([])
  const [adminState, setAdminState] = useState({
    status: "nouveau",
    importance: "",
    impact: "",
    observerIds: [] as number[],
    targetIds: [] as number[],
  })
  const [replyOpen, setReplyOpen] = useState(false)
  const [replyBody, setReplyBody] = useState("")
  const [saving, setSaving] = useState(false)
  const [adminDirty, setAdminDirty] = useState(false)

  const syncAdminStateFromDetail = (ticketDetail: HelpdeskTicketDetail) => {
    setAdminState({
      status: ticketDetail.status,
      importance: ticketDetail.importance || "",
      impact: ticketDetail.impact || "",
      observerIds: ticketDetail.observers.map((item) => item.id),
      targetIds: ticketDetail.targets.map((item) => item.id),
    })
    setAdminDirty(false)
  }

  const updateAdminState = (patch: Partial<typeof adminState>) => {
    setAdminDirty(true)
    setAdminState((current) => ({ ...current, ...patch }))
  }

  const loadBootstrap = async () => {
    const response = await api.get<HelpdeskBootstrap>("/helpdesk/bootstrap")
    setBootstrap(response.data)
    setDraft((current) => ({
      ...emptyDraft(response.data),
      mode: current.mode,
    }))
    setScope(response.data.allowedScopes[0] || "ALL")
  }

  const loadTickets = async () => {
    setTicketsLoading(true)
    try {
      const response = await api.get<HelpdeskTicketSummary[]>("/helpdesk/tickets")
      setTickets(response.data)
    } finally {
      setTicketsLoading(false)
    }
  }

  const refreshBase = async () => {
    setLoading(true)
    try {
      void loadTickets().catch((error) => {
        console.error(error)
        alert("Impossible de charger les tickets helpdesk.")
      })
      await loadBootstrap()
    } catch (error) {
      console.error(error)
      alert("Impossible de charger le helpdesk.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void refreshBase()
  }, [])

  useEffect(() => {
    setPage(1)
  }, [scope, filters])

  useEffect(() => {
    if (!bootstrap) return
    const interval = window.setInterval(() => {
      void loadTickets().catch(() => undefined)
    }, 10000)
    return () => window.clearInterval(interval)
  }, [bootstrap])

  useEffect(() => {
    if (view !== "detail" || !detail) return
    const interval = window.setInterval(() => {
      void api
        .get<HelpdeskTicketDetail>(`/helpdesk/tickets/${detail.id}`)
        .then((response) => {
          setDetail(response.data)
          if (!adminDirty) {
            syncAdminStateFromDetail(response.data)
          }
        })
        .catch(() => undefined)
    }, 8000)
    return () => window.clearInterval(interval)
  }, [adminDirty, detail?.id, view])

  const openTicket = async (ticketId: number, ticketSummary?: HelpdeskTicketSummary) => {
    if (bootstrap?.role === "Administrateur" && ticketSummary) {
      console.log("[helpdesk-open-ticket]", {
        actionTicketId: ticketSummary.id,
        user_id: Number(bootstrap.currentUser.id),
        applier_id: ticketSummary.applierId != null ? Number(ticketSummary.applierId) : null,
        claimedByCurrentUser: ticketSummary.claimedByCurrentUser,
        canClaim: ticketSummary.canClaim,
        status: ticketSummary.status,
      })
    }
    setDetailLoading(true)
    try {
      const response = await api.get<HelpdeskTicketDetail>(`/helpdesk/tickets/${ticketId}`)
      setDetail(response.data)
      syncAdminStateFromDetail(response.data)
      setView("detail")
    } catch (error) {
      console.error(error)
      alert("Impossible d'ouvrir ce ticket.")
    } finally {
      setDetailLoading(false)
    }
  }

  const visibleTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      const scopeMatch =
        scope === "ALL"
          ? true
          : scope === "TARGETED"
            ? true
            : scope === "MYTICKETS"
              ? ticket.observerOnly === false
              : ticket.observerOnly
      if (!scopeMatch) return false
      return filters.every((filter) => {
        const term = filter.term.trim()
        if (!term) return true
        const rawValue =
          filter.attribute === "id"
            ? String(ticket.id)
            : filter.attribute === "subject"
              ? ticket.subject
              : filter.attribute === "status"
                ? HELPDESK_STATUS_LABELS[ticket.status] || ticket.status
                : filter.attribute === "type"
                  ? ticket.type
                  : filter.attribute === "category"
                    ? ticket.category
                    : filter.attribute === "localisation"
                      ? ticket.localisation
                      : ticket.senderName

        return matchFilterCondition(rawValue || "", term, filter.condition)
      })
    })
  }, [filters, scope, tickets])

  const totalPages = useMemo(() => Math.max(1, Math.ceil(visibleTickets.length / PAGE_SIZE)), [visibleTickets.length])

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages)
    }
  }, [page, totalPages])

  const paginatedTickets = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return visibleTickets.slice(start, start + PAGE_SIZE)
  }, [page, visibleTickets])

  const kpis = useMemo(() => {
    const pending = tickets.filter((item) => ["en_attente", "en_progress"].includes(item.status)).length
    const resolved = tickets.filter((item) => ["resolu", "clos"].includes(item.status)).length
    const action = tickets.filter((item) => item.status === "nouveau").length
    return [
      { label: "Tickets visibles", value: tickets.length, tone: "slate", icon: LifeBuoy, hint: "Tous statuts confondus" },
      { label: "En cours", value: pending, tone: "amber", icon: RefreshCw, hint: "En attente + En progress" },
      { label: "Résolus", value: resolved, tone: "emerald", icon: ShieldCheck },
      { label: "À traiter", value: action, tone: "blue", icon: CircleAlert },
    ]
  }, [tickets])

  const headerSummary = useMemo(() => {
    const pending = tickets.filter((item) => ["en_attente", "en_progress"].includes(item.status)).length
    const resolved = tickets.filter((item) => ["resolu", "clos"].includes(item.status)).length
    return `${tickets.length} tickets au total • ${pending} en cours • ${resolved} résolus`
  }, [tickets])

  const headerSummaryText = useMemo(() => {
    const pending = tickets.filter((item) => ["en_attente", "en_progress"].includes(item.status)).length
    const resolved = tickets.filter((item) => ["resolu", "clos"].includes(item.status)).length
    return `${tickets.length} tickets au total | ${pending} en cours | ${resolved} rÃ©solus`
  }, [tickets])

  const displayKpis = useMemo(
    () =>
      kpis.map((card) => ({
        ...card,
        hint:
          card.label === "En cours"
            ? "En attente + En progress"
            : card.label === "RÃ©solus"
              ? "RÃ©solu + Clos"
              : card.label === "Ã€ traiter"
                ? "Statut Nouveau"
                : "Tous statuts confondus",
      })),
    [kpis]
  )

  const devicePool = useMemo(() => {
    if (!bootstrap) return []
    return draft.mode === "collaborator" ? bootstrap.collaboratorDevices : bootstrap.myDevices
  }, [bootstrap, draft.mode])

  const selectedDevices = useMemo(
    () => devicePool.filter((device) => draft.deviceIds.includes(device.id)),
    [devicePool, draft.deviceIds]
  )

  const filteredDevices = useMemo(() => {
    const query = deviceQuery.trim().toLowerCase()
    return devicePool.filter((device) => {
      if (draft.deviceIds.includes(device.id)) return false
      if (!query) return true
      const haystack =
        deviceFilter === "user"
          ? device.userName
          : deviceFilter === "matricule"
            ? device.matricule
            : deviceFilter === "serial"
              ? device.serialNumber
              : deviceFilter === "device"
                ? device.deviceName
                : [device.userName, device.matricule, device.serialNumber, device.deviceName].join(" ")
      return (haystack || "").toLowerCase().includes(query)
    })
  }, [deviceFilter, devicePool, deviceQuery, draft.deviceIds])

  const submitCreate = async () => {
    if (!bootstrap?.canCreate) return
    if (!draft.subject.trim()) return alert("Le sujet est requis.")
    if (!draft.body.trim()) return alert("Le message est requis.")

    setSaving(true)
    try {
      const formData = new FormData()
      const payload: HelpdeskCreatePayload = {
        subject: draft.subject,
        body: draft.body,
        type: draft.type,
        flag: draft.flag,
        sousCategoryId: draft.sousCategoryId,
        localisation: draft.localisation,
        deviceIds: draft.deviceIds,
        observerIds: draft.observerIds,
      }
      formData.append("payload", new Blob([JSON.stringify(payload)], { type: "application/json" }))
      files.forEach((file) => formData.append("files", file))
      const response = await api.post<HelpdeskTicketDetail>("/helpdesk/tickets", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      setDetail(response.data)
      setFiles([])
      await loadTickets()
      await loadBootstrap()
      setView("detail")
    } catch (error) {
      console.error(error)
      alert("La création du ticket a échoué.")
    } finally {
      setSaving(false)
    }
  }

  const submitReply = async () => {
    if (!detail || !replyBody.trim()) return
    setSaving(true)
    try {
      const response = await api.post<HelpdeskTicketDetail>(`/helpdesk/tickets/${detail.id}/messages`, {
        body: replyBody,
      })
      setDetail(response.data)
      syncAdminStateFromDetail(response.data)
      setReplyBody("")
      setReplyOpen(false)
      await loadTickets()
    } catch (error) {
      console.error(error)
      const message = (error as any)?.response?.data?.message || "L'envoi du message a échoué."
      alert(message)
    } finally {
      setSaving(false)
    }
  }

  const saveAdminChanges = async () => {
    if (!detail || !detail.canAdminManage) return
    if (detail.status !== "resolu" && adminState.status === "resolu") {
      const confirmed = window.confirm(
        "Marquer ce ticket comme résolu ? Après cette sauvegarde, le ticket sera verrouillé et ne pourra plus être modifié ni recevoir de nouveaux messages."
      )
      if (!confirmed) return
    }
    setSaving(true)
    try {
      const response = await api.put<HelpdeskTicketDetail>(`/helpdesk/tickets/${detail.id}/admin`, adminState)
      setDetail(response.data)
      syncAdminStateFromDetail(response.data)
      await loadTickets()
    } catch (error) {
      console.error(error)
      const message = (error as any)?.response?.data?.message || "La sauvegarde a échoué."
      alert(message)
    } finally {
      setSaving(false)
    }
  }

  const downloadFile = async (fileId: number, fileName: string) => {
    try {
      const response = await api.get(`/helpdesk/files/${fileId}/download`, { responseType: "blob" })
      const url = window.URL.createObjectURL(response.data)
      const link = document.createElement("a")
      link.href = url
      link.download = fileName
      link.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error(error)
      alert("Impossible de télécharger ce fichier.")
    }
  }

  const claimTicket = async (ticketId: number) => {
    const response = await api.post<HelpdeskTicketDetail>(`/helpdesk/tickets/${ticketId}/claim`)
    setDetail((current) => (current?.id === ticketId ? response.data : current))
    if (detail?.id === ticketId) {
      syncAdminStateFromDetail(response.data)
    }
    await loadTickets()
    return response.data
  }

  const fetchFreshTicketDetail = async (ticketId: number) => {
    const response = await api.get<HelpdeskTicketDetail>(`/helpdesk/tickets/${ticketId}`)
    setDetail((current) => (current?.id === ticketId ? response.data : current))
    if (detail?.id === ticketId && !adminDirty) {
      syncAdminStateFromDetail(response.data)
    }
    return response.data
  }

  const ensureAdminClaimBeforeAction = async (ticket: HelpdeskTicketSummary | HelpdeskTicketDetail) => {
    if (bootstrap?.role !== "Administrateur") return true
    const freshTicket = await fetchFreshTicketDetail(ticket.id)
    console.log("ticket: ", freshTicket);
    const currentUserId = Number(bootstrap.currentUser.id)
    const applierId = freshTicket.applierId != null ? Number(freshTicket.applierId) : null

    console.log("[helpdesk-claim-check]", {
      actionTicketId: ticket.id,
      user_id: currentUserId,
      applier_id: applierId,
      claimedByCurrentUser: freshTicket.claimedByCurrentUser,
      canClaim: freshTicket.canClaim,
      status: freshTicket.status,
    })

    if (freshTicket.status === "resolu" || freshTicket.status === "clos") {
      alert("Ce ticket est déjà verrouillé.")
      return false
    }
    if (freshTicket.claimedByCurrentUser || (applierId !== null && applierId === currentUserId)) {
      return true
    }
    if (!freshTicket.canClaim) {
      alert(`Ce ticket est déjà pris en charge par ${freshTicket.applierName || "un autre administrateur"}.`)
      return false
    }

    const confirmClaim = window.confirm("Ce ticket n'est pas encore claimé. Voulez-vous le claim maintenant ?")
    if (!confirmClaim) return false

    try {
      const recheckedTicket = await fetchFreshTicketDetail(ticket.id)
      const recheckedApplierId = recheckedTicket.applierId != null ? Number(recheckedTicket.applierId) : null

      console.log("[helpdesk-claim-recheck]", {
        actionTicketId: ticket.id,
        user_id: currentUserId,
        applier_id: recheckedApplierId,
        claimedByCurrentUser: recheckedTicket.claimedByCurrentUser,
        canClaim: recheckedTicket.canClaim,
        status: recheckedTicket.status,
      })

      if (recheckedTicket.claimedByCurrentUser || (recheckedApplierId !== null && recheckedApplierId === currentUserId)) {
        return true
      }
      if (!recheckedTicket.canClaim) {
        alert(`Ce ticket est déjà pris en charge par ${recheckedTicket.applierName || "un autre administrateur"}.`)
        return false
      }

      await claimTicket(ticket.id)
      return true
    } catch (error: any) {
      console.error(error)
      const message = error?.response?.data?.message || "Ce ticket a déjà été claimé par quelqu'un d'autre."
      alert(message)
      await loadTickets().catch(() => undefined)
      if (detail?.id === ticket.id || "viewerMode" in ticket) {
        try {
          await fetchFreshTicketDetail(ticket.id)
        } catch {
          return false
        }
      }
      return false
    }
  }

  const handleAdminReplyClick = async () => {
    if (!detail) return
    const allowed = await ensureAdminClaimBeforeAction(detail)
    if (!allowed) return
    setReplyOpen(true)
  }

  const handleAdminSaveClick = async () => {
    if (!detail) return
    const allowed = await ensureAdminClaimBeforeAction(detail)
    if (!allowed) return
    await saveAdminChanges()
  }

  if (!bootstrap) {
    return (
      <div className="min-h-full bg-background">
        <div className="bg-card border-b border-border sticky top-0 z-20 backdrop-blur-md bg-card/80">
          <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 gradient-primary rounded-xl flex items-center justify-center text-white shadow-md shadow-primary/20">
                <LifeBuoy className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground leading-none tracking-tight">Helpdesk</h1>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {loading ? "Chargement des tickets et de vos droits..." : "Centre helpdesk"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-4 lg:p-5 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="h-0.5 bg-slate-200" />
                <div className="p-4 space-y-3">
                  <div className="h-3 w-24 rounded bg-slate-100" />
                  <div className="h-8 w-16 rounded bg-slate-200" />
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-200 space-y-3">
            <div className="h-10 rounded-lg bg-slate-100" />
            <div className="h-24 rounded-lg bg-slate-50" />
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px]">
                <thead className="bg-slate-50">
                  <tr>
                    {["ID", "Statut", "Sujet", "Assignation", "Type", "Catégorie", "Flag", "Date", "Demandeur"].map((label) => (
                      <th
                        key={label}
                        className="px-3 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200"
                      >
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 5 }).map((_, index) => (
                    <tr key={index} className="border-b border-slate-100">
                      <td colSpan={9} className="px-3 py-4">
                        <div className="h-5 rounded bg-slate-100" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    )
  }
  const ticketLocked = detail ? ["resolu", "clos"].includes(detail.status) : false

  const listView = (
    <>
      <div className="hidden flex-wrap justify-end gap-3">
        <button onClick={() => void refreshBase()} className="btn btn-secondary">
          <RefreshCw className="w-4 h-4" />
          Actualiser
        </button>
        {bootstrap!.canCreate ? (
          <button
            onClick={() => {
              setDraft(emptyDraft(bootstrap!))
              setFiles([])
              setView("create")
            }}
            className="btn btn-primary"
          >
            <Plus className="w-4 h-4" />
            Créer un ticket
          </button>
        ) : (
          <button disabled className="btn btn-secondary opacity-60 cursor-not-allowed">
            <ShieldCheck className="w-4 h-4" />
            Consultation uniquement
          </button>
        )}
      </div>

      <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-200 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {bootstrap.allowedScopes.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setScope(item)}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                scope === item
                  ? "bg-slate-900 text-white"
                  : "bg-slate-50 border border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900"
              }`}
            >
              {HELPDESK_SCOPE_LABELS[item]}
            </button>
          ))}
          <div className="ml-auto inline-flex items-center gap-2 rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-xs font-bold text-slate-500">
            <Filter className="w-4 h-4" />
            {visibleTickets.length}
          </div>
        </div>
        <HelpdeskFilterToolbar filters={filters} setFilters={setFilters} />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-auto scrollbar-thin max-h-[68vh]">
          <table className="w-full min-w-[980px]">
            <thead className="bg-slate-50">
              <tr>
                {["ID", "Statut", "Sujet", "Assignation", "Type", "Catégorie", "Flag", "Date", "Demandeur"].map((label) => (
                  <th key={label} className="px-3 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {paginatedTickets.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-slate-50/80 transition-colors group cursor-pointer" onClick={() => void openTicket(ticket.id, ticket)}>
                  <td className="px-3 py-3">
                    <span className="font-mono text-xs text-slate-400">#{ticket.id}</span>
                  </td>
                  <td className="px-3 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${getHelpdeskStatusTone(ticket.status)}`}>
                      {HELPDESK_STATUS_LABELS[ticket.status] || ticket.status}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="space-y-1">
                      <p className="font-bold text-slate-800 text-xs">{ticket.subject}</p>
                      {ticket.observerOnly && (
                        <p className="text-[11px] text-slate-400">Lecture seule en tant qu'observateur</p>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    {bootstrap.role === "Administrateur" && ticket.canClaim ? (
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation()
                          void claimTicket(ticket.id).catch((error: any) => {
                            console.error(error)
                            alert(error?.response?.data?.message || "Ce ticket est déjà claimé.")
                          })
                        }}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-bold border border-slate-200 text-slate-700 bg-slate-50 hover:bg-slate-100"
                      >
                        Claim
                      </button>
                    ) : ticket.applierName ? (
                      <span className="text-xs font-medium text-slate-600">
                        {ticket.applierName}
                        {ticket.applierMatricule ? ` (${ticket.applierMatricule})` : ""}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">Non claimé</span>
                    )}
                  </td>
                  <td className="px-3 py-3 uppercase text-xs font-medium text-slate-600">{ticket.type || "—"}</td>
                  <td className="px-3 py-3 text-xs font-medium text-slate-600">{ticket.category || "—"}</td>
                  <td className="px-3 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${getHelpdeskFlagTone(ticket.flag)}`}>
                      {ticket.flag || "NONE"}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-xs font-medium text-slate-500">{formatHelpdeskDate(ticket.dateSent)}</td>
                  <td className="px-3 py-3 text-xs font-medium text-slate-600">{ticket.senderName || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {ticketsLoading ? (
          <div className="px-6 py-12 text-center text-sm text-slate-400">Chargement des tickets...</div>
        ) : visibleTickets.length === 0 && (
          <div className="px-6 py-12 text-center text-sm text-slate-400">Aucun ticket trouvé pour ce filtre.</div>
        )}
        {!ticketsLoading && totalPages > 1 && <Pagination current={page} total={totalPages} setPage={setPage} />}
      </div>
    </>
  )

  const createView = (
    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.8fr)_minmax(360px,1fr)] gap-6 overflow-visible">
      <div className="space-y-6">
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Nouveau ticket</h2>
              <p className="text-sm text-muted-foreground">Sujet, message enrichi et pièces jointes</p>
            </div>
            <button onClick={() => setView("list")} className="btn btn-secondary">
              <ArrowLeft className="w-4 h-4" />
              Retour
            </button>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Sujet
            </label>
            <input
              value={draft.subject}
              onChange={(event) => setDraft((current) => ({ ...current, subject: event.target.value }))}
              placeholder="Sujet du ticket"
              className="mdm-input h-11"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Type
            </label>
            <div className="flex flex-wrap gap-2">
              {(["incident", "demande"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setDraft((current) => ({ ...current, type }))}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold ${
                    draft.type === type ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Message
            </label>
            <RichEditor value={draft.body} onChange={(body) => setDraft((current) => ({ ...current, body }))} />
          </div>

          <div className="rounded-2xl border border-dashed border-border p-4">
            <div className="flex items-center gap-3 mb-3">
              <Paperclip className="w-4 h-4 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">Pièces jointes</p>
            </div>
            <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground block mb-3">
              Fichiers
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <label
                htmlFor="helpdesk-file-input"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm cursor-pointer hover:bg-primary/90 transition-colors"
              >
                <Paperclip className="w-4 h-4" />
                Choisir des fichiers
              </label>
              <span className="text-sm text-muted-foreground">
                {files.length > 0 ? `${files.length} fichier(s) sélectionné(s)` : "Aucun fichier sélectionné"}
              </span>
            </div>
            <input
              id="helpdesk-file-input"
              type="file"
              multiple
              onChange={(event) => setFiles(Array.from(event.target.files || []))}
              className="sr-only"
            />
            {files.length > 0 && (
              <div className="mt-4 space-y-2">
                {files.map((file) => (
                  <div key={file.name} className="flex items-center justify-between rounded-xl bg-secondary/50 px-3 py-2">
                    <span className="text-sm text-foreground truncate">{file.name}</span>
                    <button
                      onClick={() => setFiles((current) => current.filter((item) => item !== file))}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <h3 className="text-base font-semibold text-foreground">Métadonnées</h3>

          {bootstrap!.role === "Manager" && (
            <div className="space-y-2">
              <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Mode de création
              </label>
              <div className="flex gap-2">
              {(["self", "collaborator"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setDraft((current) => ({ ...current, mode, deviceIds: [] }))}
                  className={`flex-1 rounded-xl px-3 py-2 text-sm font-semibold ${
                    draft.mode === mode ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {mode === "self" ? "Mes tickets" : "Collaborateurs"}
                </button>
              ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Catégorie
            </label>
            <select
              value={draft.sousCategoryId}
              onChange={(event) => setDraft((current) => ({ ...current, sousCategoryId: Number(event.target.value) }))}
              className="mdm-select h-11"
            >
              {HELPDESK_CATEGORY_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Niveau d'escalade
            </label>
            <select
              value={draft.flag}
              onChange={(event) => setDraft((current) => ({ ...current, flag: event.target.value as CreateDraft["flag"] }))}
              className="mdm-select h-11"
            >
              {HELPDESK_FLAG_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Localisation
            </label>
            <input
              value={draft.localisation}
              onChange={(event) => setDraft((current) => ({ ...current, localisation: event.target.value }))}
              placeholder="Localisation"
              className="mdm-input h-11"
            />
          </div>

          {bootstrap!.role === "Manager" ? (
            <SearchableUserPicker
              title="Observateurs"
              options={bootstrap!.observerOptions}
              selectedIds={draft.observerIds}
              onChange={(observerIds) => setDraft((current) => ({ ...current, observerIds }))}
              placeholder="Rechercher par nom, matricule ou login"
              emptyText="Aucun observateur sélectionné."
            />
          ) : (
            <div className="rounded-2xl border border-border bg-secondary/30 p-4 text-sm text-muted-foreground">
              L'observateur est attribué automatiquement au manager du demandeur.
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-foreground">Matériel concerné</h3>
            <span className="text-xs text-muted-foreground">{draft.deviceIds.length} ajouté(s)</span>
          </div>

          <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Recherche matériel
          </label>
          <div className="grid grid-cols-[140px_minmax(0,1fr)] gap-3">
            <select value={deviceFilter} onChange={(event) => setDeviceFilter(event.target.value as DeviceFilter)} className="mdm-select h-11">
              <option value="all">Tous</option>
              <option value="user">Utilisateur</option>
              <option value="matricule">Matricule</option>
              <option value="serial">Série</option>
              <option value="device">Appareil</option>
            </select>
            <input
              value={deviceQuery}
              onChange={(event) => setDeviceQuery(event.target.value)}
              placeholder="Filtrer le matériel"
              className="mdm-input h-11"
            />
          </div>

          <div className="max-h-72 overflow-auto space-y-2 pr-1">
            {filteredDevices.map((device) => (
              <div key={device.id} className="rounded-xl border border-border px-3 py-3 flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">{device.deviceName || "Matériel"}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {(device.userName || "Utilisateur")} • {device.matricule || "Sans matricule"} • {device.serialNumber || "Sans série"}
                  </p>
                </div>
                <button
                  onClick={() =>
                    setDraft((current) => ({ ...current, deviceIds: [...current.deviceIds, device.id] }))
                  }
                  className="btn btn-secondary btn-sm"
                >
                  <Plus className="w-4 h-4" />
                  Ajouter
                </button>
              </div>
            ))}
          </div>

          {selectedDevices.length > 0 && (
            <div className="space-y-2">
              {selectedDevices.map((device) => (
                <div key={device.id} className="rounded-xl bg-secondary/40 px-3 py-2 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{device.deviceName}</p>
                    <p className="text-[11px] text-muted-foreground">{device.userName || "—"} • {device.serialNumber || "—"}</p>
                  </div>
                  <button
                    onClick={() =>
                      setDraft((current) => ({ ...current, deviceIds: current.deviceIds.filter((id) => id !== device.id) }))
                    }
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <button onClick={() => void submitCreate()} disabled={saving} className="btn btn-primary w-full">
            <Send className="w-4 h-4" />
            {saving ? "Création..." : "Créer le ticket"}
          </button>
        </div>
      </div>
    </div>
  )

  const detailView = detail && (
    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.75fr)_minmax(340px,1fr)] gap-6 overflow-visible">
      <div className="space-y-6">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-2">
              <button onClick={() => setView("list")} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-4 h-4" />
                Retour à la liste
              </button>
              <h2 className="text-xl font-semibold text-foreground">#{detail.id} • {detail.subject}</h2>
              <div className="flex flex-wrap gap-2">
                <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${getHelpdeskStatusTone(detail.status)}`}>
                  {HELPDESK_STATUS_LABELS[detail.status] || detail.status}
                </span>
                <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${getHelpdeskFlagTone(detail.flag)}`}>
                  {detail.flag || "NONE"}
                </span>
                {ticketLocked && (
                  <span className="inline-flex rounded-full bg-slate-200 px-2.5 py-1 text-[10px] font-bold uppercase text-slate-700">
                    Ticket verrouillé
                  </span>
                )}
              </div>
            </div>

            {(detail.canAdminManage || detail.canReply) && (
              <button
                onClick={() => {
                  if (bootstrap.role === "Administrateur") {
                    void handleAdminReplyClick()
                    return
                  }
                  setReplyOpen(true)
                }}
                className="btn btn-primary"
              >
                <Send className="w-4 h-4" />
                Répondre
              </button>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 space-y-4 overflow-visible">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-foreground">Conversation</h3>
            {detail.observerOnly && (
              <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 text-amber-700 px-3 py-1 text-[11px] font-bold">
                <CircleAlert className="w-3.5 h-3.5" />
                Accès lecture seule
              </div>
            )}
          </div>

          <div className="space-y-4">
            {detail.messages.map((message) => {
              const mine = message.senderId === bootstrap!.currentUser.id
              return (
                <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[90%] rounded-2xl px-4 py-3 ${mine ? "bg-primary text-primary-foreground" : "bg-secondary/60"}`}>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] mb-2 opacity-80">
                      <span className="font-bold">{message.senderName}</span>
                      <span>{message.senderRole}</span>
                      <span>•</span>
                      <span>{formatHelpdeskDate(message.latestDate)}</span>
                      {message.statusSent && <span>• {message.statusSent}</span>}
                    </div>
                    <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: message.body }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {detail.files.length > 0 && (
          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="text-base font-semibold text-foreground mb-4">Pièces jointes</h3>
            <div className="space-y-2">
              {detail.files.map((file) => (
                <button
                  key={file.id}
                  onClick={() => void downloadFile(file.id, file.fileName)}
                  className="w-full rounded-xl border border-border px-4 py-3 flex items-center justify-between hover:bg-secondary/40 transition-colors"
                >
                  <span className="flex items-center gap-3 text-sm text-foreground">
                    <Paperclip className="w-4 h-4 text-muted-foreground" />
                    {file.fileName}
                  </span>
                  <span className="text-xs text-muted-foreground">Télécharger</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-6">
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <h3 className="text-base font-semibold text-foreground">Panneau ticket</h3>

          <div className="grid gap-4 rounded-2xl border border-border bg-secondary/20 p-4 text-sm">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Demandeur</p>
              <p className="mt-1 font-medium text-foreground">
                {detail.demandeur.name}
                {detail.demandeur.matricule ? ` (${detail.demandeur.matricule})` : ""}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Date</p>
              <p className="mt-1 font-medium text-foreground">{formatHelpdeskDate(detail.dateSent)}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Assignation</p>
              <div className="mt-2">
                {detail.applierName ? (
                  <p className="font-medium text-foreground">
                    {detail.applierName}
                    {detail.applierMatricule ? ` (${detail.applierMatricule})` : ""}
                  </p>
                ) : bootstrap.role === "Administrateur" && detail.canClaim ? (
                  <button
                    type="button"
                    onClick={() => {
                      void claimTicket(detail.id).catch((error: any) => {
                        console.error(error)
                        alert(error?.response?.data?.message || "Ce ticket est déjà claimé.")
                      })
                    }}
                    className="btn btn-secondary btn-sm"
                  >
                    Claim
                  </button>
                ) : (
                  <p className="font-medium text-muted-foreground">Non claimé</p>
                )}
              </div>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Type</p>
              <p className="mt-1 font-medium text-foreground">{detail.type || "—"}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Catégorie</p>
              <p className="mt-1 font-medium text-foreground">{detail.category || "—"}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Localisation</p>
              <p className="mt-1 font-medium text-foreground">{detail.localisation || "—"}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Matériel</p>
              <div className="mt-2 space-y-2">
                {detail.devices.length > 0 ? (
                  detail.devices.map((device) => (
                    <div key={device.id} className="rounded-xl bg-card px-3 py-2">
                      <p className="font-medium text-foreground">{device.deviceName || "Matériel"}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {[device.userName, device.matricule, device.serialNumber].filter(Boolean).join(" • ") || "—"}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground">Aucun matériel lié.</p>
                )}
              </div>
            </div>
          </div>

          {detail.canAdminManage ? (
            <>
              <div className="space-y-2">
                <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Statut
                </label>
                <select
                  value={adminState.status}
                  onChange={(event) => updateAdminState({ status: event.target.value })}
                  className="mdm-select h-11"
                >
                  {Object.keys(HELPDESK_STATUS_LABELS).map((status) => (
                    <option key={status} value={status}>
                      {HELPDESK_STATUS_LABELS[status]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Importance
                </label>
                <select
                  value={adminState.importance}
                  onChange={(event) => updateAdminState({ importance: event.target.value })}
                  className="mdm-select h-11"
                >
                  <option value="">Non défini</option>
                  {Object.entries(HELPDESK_LEVEL_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Impact
                </label>
                <select
                  value={adminState.impact}
                  onChange={(event) => updateAdminState({ impact: event.target.value })}
                  className="mdm-select h-11"
                >
                  <option value="">Non défini</option>
                  {Object.entries(HELPDESK_LEVEL_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              <SearchableUserPicker
                title="Observateurs"
                options={bootstrap!.observerOptions}
                selectedIds={adminState.observerIds}
                onChange={(observerIds) => updateAdminState({ observerIds })}
                placeholder="Ajouter par nom, matricule ou login"
                emptyText="Aucun observateur sélectionné."
              />

              <button onClick={() => void handleAdminSaveClick()} disabled={saving} className="btn btn-primary w-full">
                <Save className="w-4 h-4" />
                {saving ? "Sauvegarde..." : "Sauvegarder"}
              </button>
            </>
          ) : (
            <div className="space-y-4 text-sm">
              {detail.viewerMode === "admin" && ticketLocked && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800">
                  Ce ticket est {detail.status === "clos" ? "clos" : "résolu"} et ne peut plus être modifié ni recevoir de nouveaux messages.
                </div>
              )}
              <div>
                <p className="text-[11px] uppercase font-semibold tracking-[0.16em] text-muted-foreground">Demandeur</p>
                <p className="text-foreground font-medium mt-1">{detail.demandeur.name}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase font-semibold tracking-[0.16em] text-muted-foreground">Date</p>
                <p className="text-foreground font-medium mt-1">{formatHelpdeskDate(detail.dateSent)}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase font-semibold tracking-[0.16em] text-muted-foreground">Type / Catégorie</p>
                <p className="text-foreground font-medium mt-1">{detail.type} • {detail.category}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase font-semibold tracking-[0.16em] text-muted-foreground">Localisation</p>
                <p className="text-foreground font-medium mt-1">{detail.localisation || "—"}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase font-semibold tracking-[0.16em] text-muted-foreground">Devices</p>
                <div className="mt-2 space-y-2">
                  {detail.devices.map((device) => (
                    <div key={device.id} className="rounded-xl bg-secondary/50 px-3 py-2">
                      <p className="font-medium text-foreground">{device.deviceName || "Matériel"}</p>
                      <p className="text-[11px] text-muted-foreground">{device.userName || "—"} • {device.serialNumber || "—"}</p>
                    </div>
                  ))}
                </div>
              </div>
              {!detail.canReply && detail.viewerMode === "requester" && (
                <div className="rounded-xl bg-secondary/50 px-4 py-3 text-muted-foreground">
                  Vous pourrez répondre uniquement quand le dernier message administrateur sera en statut pending.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-full bg-background">
      <div className="bg-card border-b border-border sticky top-0 z-20 backdrop-blur-md bg-card/80">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 gradient-primary rounded-xl flex items-center justify-center text-white shadow-md shadow-primary/20">
              <LifeBuoy className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground leading-none tracking-tight">Helpdesk</h1>
              <p className="text-[11px] text-muted-foreground mt-0.5">{headerSummary}</p>
            </div>
          </div>
          <div className="flex flex-wrap justify-end gap-3">
            <button onClick={() => void refreshBase()} className="btn btn-secondary">
              <RefreshCw className="w-4 h-4" />
              Actualiser
            </button>
            {bootstrap.canCreate ? (
              <button
                onClick={() => {
                  setDraft(emptyDraft(bootstrap))
                  setFiles([])
                  setView("create")
                }}
                className="btn btn-primary"
              >
                <Plus className="w-4 h-4" />
                CrÃ©er un ticket
              </button>
            ) : (
              <button disabled className="btn btn-secondary opacity-60 cursor-not-allowed">
                <ShieldCheck className="w-4 h-4" />
                Consultation uniquement
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 lg:p-5 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {displayKpis.map((card) => {
            const Icon = card.icon
            const toneClasses =
              card.tone === "emerald"
                ? { border: "hover:border-emerald-200", bar: "bg-emerald-500", text: "text-emerald-600", icon: "text-emerald-600" }
                : card.tone === "amber"
                  ? { border: "hover:border-amber-200", bar: "bg-amber-500", text: "text-amber-600", icon: "text-amber-600" }
                  : card.tone === "blue"
                    ? { border: "hover:border-blue-200", bar: "bg-blue-500", text: "text-blue-600", icon: "text-blue-600" }
                    : { border: "hover:border-slate-300", bar: "bg-slate-900", text: "text-slate-900", icon: "text-slate-900" }

            return (
              <div key={card.label} className={`bg-white rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group transition-all ${toneClasses.border}`}>
                <div className={`absolute top-0 left-0 right-0 h-0.5 ${toneClasses.bar}`} />
                <div className="p-4">
                  <div className={`absolute top-1 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity ${toneClasses.icon}`}>
                    <Icon className="w-16 h-16" />
                  </div>
                  <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">{card.label}</p>
                  <p className={`text-3xl font-black ${toneClasses.text}`}>{card.value}</p>
                  <p className="mt-1 text-[11px] font-medium text-slate-400">{card.hint}</p>
                </div>
              </div>
            )
          })}
        </div>

        {view === "list" && listView}
        {view === "create" && createView}
        {view === "detail" && detailView}
      </div>

      {replyOpen && detail && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl rounded-3xl border border-border bg-card shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold text-foreground">Répondre au ticket #{detail.id}</p>
                <p className="text-sm text-muted-foreground mt-1">L'envoi du message ne modifie pas le statut automatiquement.</p>
              </div>
              <button onClick={() => setReplyOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <textarea
                rows={8}
                value={replyBody}
                onChange={(event) => setReplyBody(event.target.value)}
                placeholder="Saisissez votre réponse..."
                className="mdm-input min-h-[220px]"
              />
              <div className="flex items-center justify-end gap-3">
                <button onClick={() => setReplyOpen(false)} className="btn btn-secondary">Annuler</button>
                <button onClick={() => void submitReply()} disabled={saving || !replyBody.trim()} className="btn btn-primary">
                  <Send className="w-4 h-4" />
                  {saving ? "Envoi..." : "Envoyer"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {detailLoading && (
        <div className="fixed bottom-4 right-4 rounded-xl bg-card border border-border px-4 py-3 shadow-xl text-sm text-muted-foreground">
          Chargement du ticket...
        </div>
      )}
    </div>
  )
}
