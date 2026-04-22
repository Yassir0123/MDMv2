"use client"

import { useAuth } from "@/lib/auth-context"
import { useState, useEffect, useMemo, useRef } from "react"
import { createPortal } from "react-dom"
import api from "@/lib/api"
import { formatDateTimeValue } from "@/lib/utils"
import {
   Search, RotateCw, Eye, Users, Plus,
   UserMinus, UserX, ArrowUpDown, X,
   Package, CheckCircle2, ShieldAlert,
   Smartphone, Wifi, CircuitBoard, ClipboardCheck,
   Filter, ChevronUp, ChevronDown, ChevronLeft, ChevronRight,
   ChevronsLeft, ChevronsRight, UserCircle2, Building2, Layers, MapPin
} from "lucide-react"

// ─── TYPES ─────────────────────────────────────────────────────────
type FilterCondition = "contains" | "startsWith" | "endsWith" | "equals"
interface FilterRule { id: string; attribute: string; condition: FilterCondition; term: string }

interface UserEntity {
   id: number
   nom?: string
   prenom?: string
   matricule?: string
   email?: string
   tel?: string
   cin?: string
   address?: string
   status?: string
   dateEmbauche?: string
   dateDetacher?: string
   dateDesactiver?: string
   managerId?: number
   agence?: { id: number; nom?: string; email?: string; tel?: string }
   departement?: { id: number; nom?: string }
   entrepot?: { id: number; siteRef?: { libeller?: string } }
   fonctionRef?: { id: string; nom?: string }
}

interface MaterielItem {
   id: number
   materielName?: string
   typeMateriel?: string
   statusAffectation?: string
   dateEnvoie?: string
   dateRecu?: string
   dateAnnuler?: string
   sn?: string
   numero?: string
}

const DEACTIVATION_REASONS = ["Démission", "Retraite", "Autre"]
const REFUS_MOTIFS = ["En panne", "N'est pas arrivé", "Mauvais équipement", "Autre"]

// Case-insensitive status helpers
const normalizeStatus = (s?: string) => {
   const v = (s || "").toLowerCase()
   if (["detacher", "dettacher", "detached"].includes(v)) return "detacher"
   if (["desactiver", "desactive", "deactivated", "inactive"].includes(v)) return "desactiver"
   if (["archived", "archive", "archivé", "archiver"].includes(v)) return "archived"
   if (["active", "activated", "actif"].includes(v)) return "active"
   return v || "active"
}
const isDetache = (s?: string) => normalizeStatus(s) === "detacher"
const isDesactive = (s?: string) => normalizeStatus(s) === "desactiver"
const isArchived = (s?: string) => normalizeStatus(s) === "archived"
const isActive = (s?: string) => normalizeStatus(s) === "active"

// ─── FILTER TOOLBAR ──────────────────────────────────────────────────
const FilterToolbar = ({ filters, setFilters, attributes }: {
   filters: FilterRule[], setFilters: any,
   attributes: { value: string, label: string }[]
}) => {
   const addFilter = () => setFilters([...filters, { id: Date.now().toString(), attribute: attributes[0].value, condition: "contains", term: "" }])
   const removeFilter = (id: string) => { if (filters.length === 1) return; setFilters(filters.filter((f: FilterRule) => f.id !== id)) }
   const updateFilter = (id: string, field: keyof FilterRule, value: string) =>
      setFilters(filters.map((f: FilterRule) => f.id === id ? { ...f, [field]: value } : f))

   return (
      <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-200 space-y-2">
         {filters.map((filter: FilterRule, index: number) => (
            <div key={filter.id} className="flex flex-col md:flex-row items-center gap-3 w-full">
               <div className="flex items-center gap-2 text-slate-400 px-2 min-w-[80px]">
                  <Filter className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase">{index === 0 ? "Filtrer" : "Et"}</span>
               </div>
               <select value={filter.attribute} onChange={(e) => updateFilter(filter.id, "attribute", e.target.value)}
                  className="w-full md:w-36 px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500">
                  {attributes.map(attr => <option key={attr.value} value={attr.value}>{attr.label}</option>)}
               </select>
               <select value={filter.condition} onChange={(e) => updateFilter(filter.id, "condition", e.target.value)}
                  className="w-full md:w-36 px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="contains">Contient</option>
                  <option value="startsWith">Commence par</option>
                  <option value="endsWith">Finit par</option>
                  <option value="equals">Est égal à</option>
               </select>
               <div className="relative flex-1 w-full">
                  <Search className="absolute left-3 top-2.5 w-3 h-3 text-slate-400" />
                  <input type="text" placeholder="Valeur..." value={filter.term}
                     onChange={(e) => updateFilter(filter.id, "term", e.target.value)}
                     className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none" />
                  {filters.length > 1 && (
                     <button onClick={() => removeFilter(filter.id)} className="absolute right-2 top-2 text-slate-400 hover:text-red-500">
                        <X className="w-4 h-4" />
                     </button>
                  )}
               </div>
            </div>
         ))}
         <div className="flex justify-start pl-2">
            <button onClick={addFilter} className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1">
               <Plus className="w-3 h-3" /> Ajouter un filtre
            </button>
         </div>
      </div>
   )
}

// ─── PAGINATION ───────────────────────────────────────────────────────
const Pagination = ({ current, total, setPage }: { current: number, total: number, setPage: (p: number) => void }) => {
   const [inputVal, setInputVal] = useState(current.toString())
   useEffect(() => { setInputVal(current.toString()) }, [current])
   const go = (val: string) => {
      let n = parseInt(val); if (isNaN(n) || n < 1) n = 1; if (n > total) n = total; setPage(n); setInputVal(n.toString())
   }
   return (
      <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-2 border-t border-slate-100 bg-slate-50/50 gap-4">
         <span className="text-xs font-medium text-slate-500">Page {current} sur {total || 1}</span>
         <div className="flex items-center gap-2">
            <button onClick={() => go("1")} disabled={current === 1} className="p-1 rounded hover:bg-slate-200 text-slate-600 disabled:opacity-50"><ChevronsLeft className="w-4 h-4" /></button>
            <button onClick={() => go(String(current - 1))} disabled={current === 1} className="p-1 rounded hover:bg-slate-200 text-slate-600 disabled:opacity-50"><ChevronLeft className="w-4 h-4" /></button>
            <div className="flex items-center gap-2 mx-2">
               <span className="text-xs font-bold text-slate-400 uppercase">Page</span>
               <input type="number" value={inputVal} onChange={e => setInputVal(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && go(inputVal)} onBlur={() => go(inputVal)}
                  className="w-10 h-7 text-center text-xs font-bold bg-white border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" />
               <span className="text-xs font-bold text-slate-400">/ {total || 1}</span>
            </div>
            <button onClick={() => go(String(current + 1))} disabled={current === total || total === 0} className="p-1 rounded hover:bg-slate-200 text-slate-600 disabled:opacity-50"><ChevronRight className="w-4 h-4" /></button>
            <button onClick={() => go(String(total))} disabled={current === total || total === 0} className="p-1 rounded hover:bg-slate-200 text-slate-600 disabled:opacity-50"><ChevronsRight className="w-4 h-4" /></button>
         </div>
      </div>
   )
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────
export default function UserSubordinatesPageV2() {
   const { user: currentUser } = useAuth()

   // Data state
   const [subordinates, setSubordinates] = useState<UserEntity[]>([])
   const [loading, setLoading] = useState(true)
   const hasLoadedSubordinatesRef = useRef(false)
   const [pendingByUser, setPendingByUser] = useState<Record<number, MaterielItem[]>>({})
   const [loadingPending, setLoadingPending] = useState<Record<number, boolean>>({})

   // Filter/Sort/Page state
   const [filters, setFilters] = useState<FilterRule[]>([{ id: "1", attribute: "nom", condition: "contains", term: "" }])
   const [sortBy, setSortBy] = useState("nom")
   const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
   const [page, setPage] = useState(1)
   const PAGE_SIZE = 10

   // Modal states
   const [viewingUser, setViewingUser] = useState<UserEntity | null>(null)
   const [viewingTab, setViewingTab] = useState<"details" | "equipment">("details")
   const [viewingEquipment, setViewingEquipment] = useState<MaterielItem[]>([])
   const [loadingEquipment, setLoadingEquipment] = useState(false)

   const [detachingUser, setDetachingUser] = useState<UserEntity | null>(null)
   const [deactivatingUser, setDeactivatingUser] = useState<UserEntity | null>(null)
   const [deactivationReason, setDeactivationReason] = useState("")

   // Sidebar state
   const [sidebarOpen, setSidebarOpen] = useState(false)
   const [sidebarUser, setSidebarUser] = useState<UserEntity | null>(null)
   const [sidebarItems, setSidebarItems] = useState<MaterielItem[]>([])

   // Pending item action modals
   const [confirmingItem, setConfirmingItem] = useState<MaterielItem | null>(null)
   const [cancelingItem, setCancelingItem] = useState<MaterielItem | null>(null)
   const [cancelReason, setCancelReason] = useState("")
   const [cancelCommentaire, setCancelCommentaire] = useState("")

   // ── INITIAL LOAD ────────────────────────────────────────────────
   useEffect(() => {
      const uid = currentUser?.userId ?? currentUser?.id
      if (uid) fetchSubordinates()
   }, [currentUser])

   const fetchSubordinates = async () => {
      const managerId = currentUser?.userId ?? currentUser?.id
      const shouldShowLoading = !hasLoadedSubordinatesRef.current
      try {
         if (shouldShowLoading) {
            setLoading(true)
         }
         const res = await api.get(`/subordinates?managerId=${managerId}`)
         const list: UserEntity[] = Array.isArray(res.data) ? res.data : []
         const filteredList = list.filter(u => !isArchived(u.status))
         setSubordinates(filteredList)
         // fetch pending for all subordinates
         fetchAllPending(filteredList)
         hasLoadedSubordinatesRef.current = true
      } catch (e) { console.error(e) } finally {
         if (shouldShowLoading) {
            setLoading(false)
         }
      }
   }

   const fetchAllPending = async (list: UserEntity[]) => {
      const newPending: Record<number, MaterielItem[]> = {}
      await Promise.all(list.map(async (sub) => {
         try {
            const res = await api.get(`/subordinates/${sub.id}/materiel/pending`)
            newPending[sub.id] = Array.isArray(res.data) ? res.data : []
         } catch { newPending[sub.id] = [] }
      }))
      setPendingByUser(newPending)
   }

   // ── KPIs ─────────────────────────────────────────────────────────
   const kpiTotal = subordinates.length
   const kpiDetached = subordinates.filter(u => isDetache(u.status)).length
   const kpiDeactivated = subordinates.filter(u => isDesactive(u.status)).length

   // ── FILTER/SORT ──────────────────────────────────────────────────
   const getFieldValue = (u: UserEntity, attr: string): string => {
      switch (attr) {
         case "nom": return `${u.nom || ""} ${u.prenom || ""}`.trim()
         case "email": return u.email || ""
         case "matricule": return u.matricule || ""
         case "status": return statusLabel(u.status)
         default: return ""
      }
   }

   const applyFilters = (data: UserEntity[], rules: FilterRule[]) =>
      data.filter(item => rules.every(rule => {
         if (!rule.term) return true
         const val = getFieldValue(item, rule.attribute).toLowerCase()
         const term = rule.term.toLowerCase()
         switch (rule.condition) {
            case "contains": return val.includes(term)
            case "startsWith": return val.startsWith(term)
            case "endsWith": return val.endsWith(term)
            case "equals": return val === term
            default: return true
         }
      }))

   const filtered = applyFilters(subordinates, filters)
   const sorted = [...filtered].sort((a, b) => {
      const aV = getFieldValue(a, sortBy), bV = getFieldValue(b, sortBy)
      return sortOrder === "asc" ? aV.localeCompare(bV) : bV.localeCompare(aV)
   })
   const totalPages = Math.ceil(sorted.length / PAGE_SIZE)
   const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

   const handleSortClick = (attr: string) => {
      if (sortBy === attr) setSortOrder(s => s === "asc" ? "desc" : "asc")
      else { setSortBy(attr); setSortOrder("asc") }
   }

   // ── ROW STATUS HELPERS ──────────────────────────────────────────
   const rowBg = (status?: string) => {
      if (isDesactive(status)) return "bg-red-50/40"
      if (isDetache(status)) return "bg-orange-50/40"
      if (isArchived(status)) return "bg-slate-50/70"
      return "hover:bg-slate-50/80"
   }
   const statusBadge = (status?: string) => {
      if (isDesactive(status)) return "bg-red-50 text-red-600 border-red-200"
      if (isDetache(status)) return "bg-orange-50 text-orange-600 border-orange-200"
      if (isArchived(status)) return "bg-slate-50 text-slate-600 border-slate-200"
      return "bg-emerald-50 text-emerald-600 border-emerald-200"
   }
   const statusLabel = (status?: string) => {
      if (isDesactive(status)) return "Désactivé"
      if (isDetache(status)) return "Détaché"
      if (isArchived(status)) return "ArchivÃ©"
      return "Actif"
   }

   // ── SIDEBAR ──────────────────────────────────────────────────────
   const openSidebar = async (sub: UserEntity) => {
      setSidebarUser(sub)
      setSidebarOpen(true)
      const items = pendingByUser[sub.id] || []
      setSidebarItems(items)
   }

   const refreshSidebar = async (userId: number) => {
      try {
         const res = await api.get(`/subordinates/${userId}/materiel/pending`)
         const items = Array.isArray(res.data) ? res.data : []
         setSidebarItems(items)
         setPendingByUser(prev => ({ ...prev, [userId]: items }))
         if (items.length === 0) setSidebarOpen(false)
      } catch { }
   }

   const refreshViewingEquipment = async (userId: number) => {
      try {
         const res = await api.get(`/subordinates/${userId}/materiel/all`)
         setViewingEquipment(Array.isArray(res.data) ? res.data : [])
      } catch { }
   }

   // ── ACCUSER ────────────────────────────────────────────────────
   const handleAccuser = async () => {
      if (!confirmingItem || !sidebarUser) return
      try {
         await api.put(`/subordinates/${sidebarUser.id}/materiel/${confirmingItem.id}/accuser`)
         setConfirmingItem(null)
         await refreshSidebar(sidebarUser.id)
      } catch { alert("Erreur lors de la confirmation") }
   }

   // ── ANNULER ────────────────────────────────────────────────────
   const handleAnnuler = async () => {
      if (!cancelingItem || !sidebarUser || !cancelReason) return
      try {
         await api.put(`/subordinates/${sidebarUser.id}/materiel/${cancelingItem.id}/annuler`, {
            motif: cancelReason,
            commentaire: cancelCommentaire.trim() || null
         })
         setCancelingItem(null)
         setCancelReason("")
         setCancelCommentaire("")
         await refreshSidebar(sidebarUser.id)
      } catch { alert("Erreur lors de l'annulation") }
   }

   // ── VOIR DETAIL ───────────────────────────────────────────────
   const openViewingUser = async (sub: UserEntity) => {
      setViewingUser(sub)
      setViewingTab("details")
      setViewingEquipment([])
   }

   const loadEquipment = async (sub: UserEntity) => {
      setViewingTab("equipment")
      if (viewingEquipment.length === 0) {
         setLoadingEquipment(true)
         try {
            const res = await api.get(`/subordinates/${sub.id}/materiel/all`)
            setViewingEquipment(Array.isArray(res.data) ? res.data : [])
         } catch { } finally { setLoadingEquipment(false) }
      }
   }

   useEffect(() => {
      const refreshVisibleSubordinates = () => {
         if (document.visibilityState !== "visible") return

         void fetchSubordinates()
         if (sidebarOpen && sidebarUser?.id) {
            void refreshSidebar(sidebarUser.id)
         }
         if (viewingUser?.id && viewingTab === "equipment") {
            void refreshViewingEquipment(viewingUser.id)
         }
      }

      const interval = window.setInterval(refreshVisibleSubordinates, 4000)
      window.addEventListener("focus", refreshVisibleSubordinates)
      document.addEventListener("visibilitychange", refreshVisibleSubordinates)

      return () => {
         window.clearInterval(interval)
         window.removeEventListener("focus", refreshVisibleSubordinates)
         document.removeEventListener("visibilitychange", refreshVisibleSubordinates)
      }
   }, [sidebarOpen, sidebarUser?.id, viewingTab, viewingUser?.id, currentUser?.id, currentUser?.userId])

   // ── DETACH ───────────────────────────────────────────────────
   const handleDetach = async () => {
      if (!detachingUser) return
      try {
         await api.post(`/subordinates/${detachingUser.id}/detach`, {
            managerId: currentUser?.userId ?? currentUser?.id,
            motif: "Changement de poste"
         })
         setDetachingUser(null)
         fetchSubordinates()
      } catch { alert("Erreur lors du détachement") }
   }

   // ── DESACTIVER ───────────────────────────────────────────────
   const handleDesactiver = async () => {
      if (!deactivatingUser || !deactivationReason) return
      try {
         await api.post(`/subordinates/${deactivatingUser.id}/desactiver`, {
            motif: deactivationReason,
            managerId: currentUser?.userId ?? currentUser?.id
         })
         setDeactivatingUser(null)
         setDeactivationReason("")
         fetchSubordinates()
      } catch { alert("Erreur lors de la désactivation") }
   }

   // ── TYPE ICON ─────────────────────────────────────────────────
   const TypeIcon = ({ type }: { type?: string }) => {
      if (type?.toLowerCase().includes("sim")) return <CircuitBoard className="w-4 h-4" />
      if (type?.toLowerCase().includes("internet") || type?.toLowerCase().includes("ligne")) return <Wifi className="w-4 h-4" />
      return <Smartphone className="w-4 h-4" />
   }
   const typeColor = (type?: string) => {
      if (type?.toLowerCase().includes("sim")) return "bg-orange-50 text-orange-600"
      if (type?.toLowerCase().includes("internet") || type?.toLowerCase().includes("ligne")) return "bg-blue-50 text-blue-600"
      return "bg-emerald-50 text-emerald-600"
   }
   const affectationBadge = (status?: string) => {
      if (status === "recu") return "bg-emerald-100 text-emerald-700"
      if (status === "annuler") return "bg-red-100 text-red-700"
      return "bg-amber-100 text-amber-700"
   }

   // ── STYLES ────────────────────────────────────────────────────
   const styles = {
      pageBg: "min-h-full bg-background font-sans text-foreground",
      card: "bg-card border border-border rounded-xl shadow-sm overflow-hidden",
      header: "bg-card border-b border-border sticky top-0 z-20 backdrop-blur-md bg-card/80",
      primaryBtn: "btn btn-primary text-xs",
      secondaryBtn: "btn btn-secondary text-xs",
      input: "mdm-input text-xs",
      label: "block text-[10px] font-bold uppercase text-muted-foreground mb-1 tracking-wide",
      th: "px-3 py-2.5 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider bg-secondary/50 border-b border-border select-none",
      td: "px-3 py-2.5 text-[12px] border-b border-border/50",
   }
   const inputStyle = "w-full px-3 py-2 bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
   const btnSecondary = "bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-lg transition-all shadow-sm"

   const SortIcon = ({ column }: { column: string }) => {
      if (sortBy !== column) return <ArrowUpDown className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
      return sortOrder === "asc" ? <ChevronUp className="w-3 h-3 text-blue-600" /> : <ChevronDown className="w-3 h-3 text-blue-600" />
   }
   const SortableTh = ({ label, sortKey }: { label: string; sortKey: string }) => (
      <th onClick={() => handleSortClick(sortKey)} className={`${styles.th} cursor-pointer hover:bg-slate-100 hover:text-blue-600 transition-colors group`}>
         <div className="flex items-center gap-2">{label} <SortIcon column={sortKey} /></div>
      </th>
   )

   // ════════════════════════════════════════════════════════════════
   // RENDER
   // ════════════════════════════════════════════════════════════════
   return (
      <div className={styles.pageBg}>
         {/* Header */}
         <div className={styles.header}>
            <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
               <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-sidebar-primary to-accent rounded-lg flex items-center justify-center text-sidebar-primary-foreground shadow-sm">
                     <Users className="w-5 h-5" />
                  </div>
                  <div>
                     <h1 className="text-lg font-black text-slate-900 leading-none">Mes Collaborateurs</h1>
                     <p className="text-[11px] text-muted-foreground mt-0.5">{kpiTotal} collaborateurs • {kpiDetached} détachés</p>
                  </div>
               </div>
            </div>
         </div>

         <div className="max-w-7xl mx-auto p-4 space-y-4">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <div className="bg-white rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-slate-300 transition-all">
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-slate-900" />
                  <div className="p-4">
                     <div className="absolute top-1 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity"><Users className="w-16 h-16 text-slate-900" /></div>
                     <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Total Collaborateurs</p>
                     <p className="text-3xl font-black text-slate-900">{kpiTotal}</p>
                  </div>
               </div>
               <div className="bg-white rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-orange-200 transition-all">
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-orange-500" />
                  <div className="p-4">
                     <div className="absolute top-1 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity"><UserMinus className="w-16 h-16 text-orange-600" /></div>
                     <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Détachés</p>
                     <p className="text-3xl font-black text-orange-600">{kpiDetached}</p>
                  </div>
               </div>
               <div className="bg-white rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-red-200 transition-all">
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-red-500" />
                  <div className="p-4">
                     <div className="absolute top-1 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity"><UserX className="w-16 h-16 text-red-600" /></div>
                     <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Désactivés</p>
                     <p className="text-3xl font-black text-red-600">{kpiDeactivated}</p>
                  </div>
               </div>
            </div>

            {/* Filter Toolbar */}
            <FilterToolbar
               filters={filters}
               setFilters={(r: FilterRule[]) => { setFilters(r); setPage(1) }}
               attributes={[
                  { value: "nom", label: "Nom" },
                  { value: "email", label: "Email" },
                  { value: "matricule", label: "Matricule" },
                  { value: "status", label: "Statut" },
               ]}
            />

            {/* Main Table */}
            <div className={styles.card}>
               <div className="overflow-x-auto">
                  <table className="w-full min-w-[860px]">
                     <thead>
                        <tr>
                           <SortableTh label="Collaborateur" sortKey="nom" />
                           <SortableTh label="Email" sortKey="email" />
                           <SortableTh label="Statut" sortKey="status" />
                           <th className={styles.th}>En Attente</th>
                           <th className={styles.th}>Date Entrée</th>
                           <th className={`${styles.th} text-right`}>Actions</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100 bg-white">
                        {loading ? (
                           <tr><td colSpan={6} className="p-12 text-center text-slate-400">Chargement...</td></tr>
                        ) : paginated.length === 0 ? (
                           <tr><td colSpan={6} className="p-12 text-center text-slate-400">
                              <Search className="w-10 h-10 mx-auto mb-2 opacity-20" />
                              <p>Aucun collaborateur trouvé.</p>
                           </td></tr>
                        ) : paginated.map((sub) => {
                           const pending = pendingByUser[sub.id] || []
                           const pendingCount = pending.length
                           return (
                              <tr key={sub.id} className={`transition-colors group ${rowBg(sub.status)}`}>
                                 <td className={styles.td}>
                                    <div className="flex items-center gap-3">
                                       <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${isDesactive(sub.status) ? "bg-red-100 text-red-500" : isDetache(sub.status) ? "bg-orange-100 text-orange-600" : "bg-blue-50 text-blue-600"}`}>
                                          {(sub.nom || "?").charAt(0).toUpperCase()}
                                       </div>
                                       <div>
                                          <p className={`font-bold text-xs ${isDesactive(sub.status) ? "text-red-900" : isDetache(sub.status) ? "text-orange-900" : "text-slate-800"}`}>
                                             {sub.nom} {sub.prenom}
                                          </p>
                                          <p className="text-[10px] text-slate-400 font-mono">{sub.matricule || "—"}</p>
                                       </div>
                                    </div>
                                 </td>
                                 <td className={`${styles.td} text-slate-500`}>{sub.email || "—"}</td>
                                 <td className={styles.td}>
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${statusBadge(sub.status)}`}>
                                       {statusLabel(sub.status)}
                                    </span>
                                 </td>
                                 <td className={styles.td}>
                                    {pendingCount > 0 && isActive(sub.status) ? (
                                       <button onClick={() => openSidebar(sub)}
                                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse hover:bg-amber-100 transition-colors cursor-pointer shadow-sm">
                                          <Package className="w-3.5 h-3.5" /> {pendingCount} élément(s)
                                       </button>
                                    ) : pendingCount > 0 ? (
                                       <span className="text-xs text-amber-600 italic">{pendingCount} (non traité)</span>
                                    ) : <span className="text-slate-400 text-xs italic">—</span>}
                                 </td>
                                 <td className={`${styles.td} font-mono text-slate-400 text-[11px]`}>
                                    {formatDateTimeValue(sub.dateEmbauche, "-")}
                                 </td>
                                 <td className="px-3 py-2.5 text-right">
                                    <div className="flex justify-end gap-1">
                                       <button onClick={() => openViewingUser(sub)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Voir détails"><Eye className="w-4 h-4" /></button>
                                       {isActive(sub.status) && (
                                          <>
                                             <button onClick={() => setDetachingUser(sub)} className="p-1.5 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all" title="Détacher"><UserMinus className="w-4 h-4" /></button>
                                             <button onClick={() => setDeactivatingUser(sub)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Désactiver"><UserX className="w-4 h-4" /></button>
                                          </>
                                       )}
                                    </div>
                                 </td>
                              </tr>
                           )
                        })}
                     </tbody>
                  </table>
               </div>
               {totalPages > 1 && <Pagination current={page} total={totalPages} setPage={setPage} />}
            </div>
         </div>

         {/* ── SIDEBAR: Pending Items ──────────────────────────────── */}
         {sidebarOpen && sidebarUser && (
            <div className="fixed inset-x-0 bottom-0 top-16 z-40 flex justify-end">
               <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
               <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                  <div className="bg-blue-900 px-5 py-4 flex items-center justify-between shrink-0">
                     <div>
                        <h2 className="text-base font-bold text-white flex items-center gap-2"><Package className="w-4 h-4 text-amber-400" /> Matériel en Attente</h2>
                        <p className="text-blue-200 text-xs mt-0.5">Collaborateur : <span className="text-white font-medium">{sidebarUser.nom} {sidebarUser.prenom}</span></p>
                     </div>
                     <button onClick={() => setSidebarOpen(false)} className="text-blue-300 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
                     {sidebarItems.length === 0 ? (
                        <div className="text-center py-12 text-slate-400">
                           <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
                           <p className="text-sm">Aucun matériel en attente</p>
                        </div>
                     ) : sidebarItems.map((item) => (
                        <div key={item.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm relative overflow-hidden">
                           <div className="absolute top-0 left-0 w-1 h-full bg-amber-400" />
                           <div className="flex justify-between items-start mb-3 pl-3">
                              <div>
                                 <p className="font-bold text-slate-800 text-sm">{item.materielName || "—"}</p>
                                 <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-600 border border-slate-200">
                                    {item.typeMateriel || "—"}
                                 </span>
                                 {(item.sn || item.numero) && (
                                    <p className="text-[10px] font-mono text-slate-400 mt-1">SN: {item.sn || item.numero}</p>
                                 )}
                              </div>
                              <span className="text-xs font-mono text-slate-400">
                                 {formatDateTimeValue(item.dateEnvoie, "-")}
                              </span>
                           </div>
                           <div className="flex gap-2 pl-3 pt-2 border-t border-slate-100">
                              <button onClick={() => setConfirmingItem(item)}
                                 className="flex-1 px-2 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase rounded-lg flex items-center justify-center gap-1.5 transition-all">
                                 <ClipboardCheck className="w-3.5 h-3.5" /> Accuser
                              </button>
                              <button onClick={() => setCancelingItem(item)}
                                 className="flex-1 px-2 py-1.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold uppercase rounded-lg transition-all flex items-center justify-center gap-1.5">
                                 <X className="w-3.5 h-3.5" /> Annuler
                              </button>
                           </div>
                        </div>
                     ))}
                  </div>
                  <div className="p-4 border-t border-slate-200 bg-white shrink-0">
                     <button onClick={() => setSidebarOpen(false)} className={`w-full py-2.5 text-xs uppercase ${btnSecondary}`}>Fermer le volet</button>
                  </div>
               </div>
            </div>
         )}

         {/* ── MODAL: Accuser Réception ─────────────────────────── */}
         {confirmingItem && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
               <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 translate-x-30">
                  <div className="bg-gradient-to-r from-sidebar-primary to-accent p-5 flex items-center justify-between">
                     <h2 className="text-base font-bold text-white flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Confirmation de Réception</h2>
                     <button onClick={() => setConfirmingItem(null)} className="text-slate-300 hover:text-white"><X className="w-4 h-4" /></button>
                  </div>
                  <div className="p-5 space-y-4">
                     <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 text-sm">
                        <p className="text-blue-700">Vous confirmez la réception de :</p>
                        <p className="font-bold text-blue-900 mt-1">{confirmingItem.materielName}</p>
                     </div>
                     <div className="flex gap-3 pt-1">
                        <button onClick={handleAccuser}
                           className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase rounded-lg transition-all">
                           Valider la réception
                        </button>
                        <button onClick={() => setConfirmingItem(null)} className={`flex-1 py-2.5 text-xs uppercase ${btnSecondary}`}>Annuler</button>
                     </div>
                  </div>
               </div>
            </div>
         )}

         {/* ── MODAL: Annuler Affectation (style chef-agence) ──────────── */}
         {cancelingItem && sidebarUser && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
               <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 translate-x-30">
                  <div className="bg-red-50 px-6 py-4 border-b border-red-100 flex items-center justify-between">
                     <h2 className="text-base font-bold text-red-900 flex items-center gap-2"><ShieldAlert className="w-5 h-5" /> Signaler un Incident</h2>
                     <button onClick={() => { setCancelingItem(null); setCancelReason(""); setCancelCommentaire("") }} className="text-red-400 hover:text-red-700"><X className="w-5 h-5" /></button>
                  </div>
                  <div className="p-6 space-y-5">
                     <p className="text-slate-600 text-xs font-medium">Précisez la nature de l'anomalie rencontrée pour procéder à l'annulation de l'affectation.</p>
                     <div>
                        <label className="block text-xs font-bold uppercase text-slate-500 mb-2 tracking-wide">Motif <span className="text-red-500">*</span></label>
                        <div className="relative">
                           <select value={cancelReason} onChange={e => setCancelReason(e.target.value)}
                              className={`w-full px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-lg focus:ring-2 focus:ring-red-500 outline-none appearance-none ${!cancelReason ? "text-slate-400" : "text-slate-900"}`}>
                              <option value="">Sélectionner un motif...</option>
                              {REFUS_MOTIFS.map(m => <option key={m} value={m}>{m}</option>)}
                           </select>
                        </div>
                        {!cancelReason && <p className="text-[10px] text-red-500 mt-1">Le motif est requis.</p>}
                     </div>
                     <div>
                        <label className="block text-xs font-bold uppercase text-slate-500 mb-2 tracking-wide">Commentaire <span className="text-slate-400 font-normal normal-case">(optionnel)</span></label>
                        <textarea rows={3} placeholder="Informations supplémentaires..." value={cancelCommentaire}
                           onChange={e => setCancelCommentaire(e.target.value)}
                           className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-lg focus:ring-2 focus:ring-red-500 outline-none resize-none" />
                     </div>
                     <button onClick={handleAnnuler} disabled={!cancelReason}
                        className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-widest rounded-xl shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                        Envoyer le Signalement
                     </button>
                  </div>
               </div>
            </div>
         )}

         {/* ── MODAL: Voir Détail ────────────────────────────────── */}
         {viewingUser && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
               <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 translate-x-30">
                  <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center">
                     <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <div className="p-1.5 bg-blue-50 rounded-lg"><UserCircle2 className="w-4 h-4 text-blue-600" /></div>
                        Fiche Collaborateur
                     </h2>
                     <button onClick={() => { setViewingUser(null); setViewingEquipment([]) }} className="text-slate-400 hover:text-slate-800"><X className="w-4 h-4" /></button>
                  </div>
                  {/* Tabs */}
                  <div className="flex border-b border-slate-200 bg-slate-50 px-5 pt-3 gap-4">
                     <button onClick={() => setViewingTab("details")}
                        className={`pb-2.5 text-xs font-bold uppercase transition-colors relative ${viewingTab === "details" ? "text-blue-600" : "text-slate-500 hover:text-slate-700"}`}>
                        Informations
                        {viewingTab === "details" && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full" />}
                     </button>
                     <button onClick={() => loadEquipment(viewingUser)}
                        className={`pb-2.5 text-xs font-bold uppercase transition-colors relative ${viewingTab === "equipment" ? "text-blue-600" : "text-slate-500 hover:text-slate-700"}`}>
                        Équipements
                        {viewingTab === "equipment" && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full" />}
                     </button>
                  </div>
                  <div className="p-5 overflow-y-auto flex-1">
                     {viewingTab === "details" && (
                        <div className="grid grid-cols-2 gap-4">
                           <div><label className={styles.label}>Nom Complet</label><p className="text-sm font-bold text-slate-800 mt-1">{viewingUser.nom} {viewingUser.prenom}</p></div>
                           <div><label className={styles.label}>Matricule</label><p className="text-sm font-mono font-bold text-slate-700 mt-1">{viewingUser.matricule || "—"}</p></div>
                           <div><label className={styles.label}>Email</label><p className="text-sm font-bold text-slate-800 mt-1">{viewingUser.email || "—"}</p></div>
                           <div><label className={styles.label}>Téléphone</label><p className="text-sm font-bold text-slate-800 mt-1">{viewingUser.tel || "—"}</p></div>
                           <div><label className={styles.label}>Statut</label>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${statusBadge(viewingUser.status)}`}>
                                 {statusLabel(viewingUser.status)}
                              </span>
                           </div>
                           <div><label className={styles.label}>Fonction</label><p className="text-sm font-bold text-slate-800 mt-1">{viewingUser.fonctionRef?.nom || "—"}</p></div>
                           <div className="col-span-2 border-t border-slate-100 pt-3 mt-1">
                              <p className="text-[10px] font-bold uppercase text-slate-400 mb-2">Affectations</p>
                              <div className="grid grid-cols-3 gap-3">
                                 <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                    <div className="flex items-center gap-1 mb-1"><Building2 className="w-3 h-3 text-blue-500" /><span className="text-[10px] font-bold text-slate-400 uppercase">Agence</span></div>
                                    <p className="text-xs font-bold text-slate-700">{viewingUser.agence?.nom || "—"}</p>
                                 </div>
                                 <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                    <div className="flex items-center gap-1 mb-1"><Layers className="w-3 h-3 text-purple-500" /><span className="text-[10px] font-bold text-slate-400 uppercase">Département</span></div>
                                    <p className="text-xs font-bold text-slate-700">{viewingUser.departement?.nom || "—"}</p>
                                 </div>
                                 <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                    <div className="flex items-center gap-1 mb-1"><MapPin className="w-3 h-3 text-emerald-500" /><span className="text-[10px] font-bold text-slate-400 uppercase">Entrepôt</span></div>
                                    <p className="text-xs font-bold text-slate-700">{viewingUser.entrepot?.siteRef?.libeller || "—"}</p>
                                 </div>
                              </div>
                           </div>
                        </div>
                     )}
                     {viewingTab === "equipment" && (
                        <div className="space-y-2">
                           {loadingEquipment ? (
                              <div className="p-8 text-center text-slate-400 text-sm">Chargement...</div>
                           ) : viewingEquipment.length === 0 ? (
                              <div className="text-center py-10 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                 <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                 <p>Aucun équipement assigné</p>
                              </div>
                           ) : viewingEquipment.map((item) => (
                              <div key={item.id} className="p-3 bg-white border border-slate-200 rounded-xl shadow-sm flex items-center justify-between">
                                 <div className="flex items-center gap-3">
                                    <div className={`p-1.5 rounded-lg ${typeColor(item.typeMateriel)}`}><TypeIcon type={item.typeMateriel} /></div>
                                    <div>
                                       <p className="text-xs font-bold text-slate-800">{item.materielName || "—"}</p>
                                       <p className="text-[10px] text-slate-400 uppercase tracking-wider">{item.typeMateriel || "—"}</p>
                                       {(item.sn || item.numero) && (
                                          <p className="text-[10px] font-mono text-slate-400">SN: {item.sn || item.numero}</p>
                                       )}
                                    </div>
                                 </div>
                                 <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${affectationBadge(item.statusAffectation)}`}>
                                    {item.statusAffectation || "—"}
                                 </span>
                              </div>
                           ))}
                        </div>
                     )}
                  </div>
                  <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
                     <button onClick={() => { setViewingUser(null); setViewingEquipment([]) }} className={`px-5 py-2 text-xs uppercase ${btnSecondary}`}>Fermer</button>
                  </div>
               </div>
            </div>
         )}

         {/* ── MODAL: Détacher ───────────────────────────────────── */}
         {detachingUser && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
               <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 translate-x-30">
                  <div className="bg-orange-50 px-5 py-4 flex items-center gap-3 border-b border-orange-100">
                     <div className="p-1.5 bg-white rounded-full text-orange-600 shadow-sm"><UserMinus className="w-4 h-4" /></div>
                     <h2 className="text-base font-bold text-orange-900">Détachement</h2>
                  </div>
                  <div className="p-5 space-y-4">
                     <p className="text-slate-600 text-sm">Vous êtes sur le point de détacher <strong>{detachingUser.nom} {detachingUser.prenom}</strong>.</p>
                     <p className="text-xs text-slate-400">Un historique sera automatiquement créé avec les informations de l'agence, du département et de l'entrepôt.</p>
                     <div className="flex gap-3 pt-1">
                        <button onClick={handleDetach} className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs uppercase rounded-lg transition-all">Confirmer</button>
                        <button onClick={() => setDetachingUser(null)} className={`flex-1 py-2.5 text-xs uppercase ${btnSecondary}`}>Annuler</button>
                     </div>
                  </div>
               </div>
            </div>
         )}

         {/* ── MODAL: Désactiver ─────────────────────────────────── */}
         {deactivatingUser && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
               <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 translate-x-30">
                  <div className="bg-red-50 px-5 py-4 flex items-center gap-3 border-b border-red-100">
                     <div className="p-1.5 bg-white rounded-full text-red-600 shadow-sm"><UserX className="w-4 h-4" /></div>
                     <h2 className="text-base font-bold text-red-900">Désactivation</h2>
                  </div>
                  <div className="p-5 space-y-4">
                     <p className="text-slate-600 text-sm">Vous êtes sur le point de désactiver <strong>{deactivatingUser.nom} {deactivatingUser.prenom}</strong>.</p>
                     <div>
                        <label className={styles.label}>Motif de désactivation</label>
                        <select value={deactivationReason} onChange={(e) => setDeactivationReason(e.target.value)} className={inputStyle}>
                           <option value="">-- Sélectionner --</option>
                           {DEACTIVATION_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                     </div>
                     <div className="flex gap-3 pt-1">
                        <button onClick={handleDesactiver} disabled={!deactivationReason}
                           className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase rounded-lg transition-all disabled:opacity-50">
                           Désactiver
                        </button>
                        <button onClick={() => { setDeactivatingUser(null); setDeactivationReason("") }} className={`flex-1 py-2.5 text-xs uppercase ${btnSecondary}`}>Annuler</button>
                     </div>
                  </div>
               </div>
            </div>
         )}
      </div>
   )
}
