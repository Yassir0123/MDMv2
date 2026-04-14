
"use client"

import { useEffect, useMemo, useState } from "react"
import api from "@/lib/api"
import { exportStyledWorkbook } from "@/lib/excel-export"
import {
  Users, UserCheck, UserX, Search, Filter, Plus, X, RotateCw,
  ChevronUp, ChevronDown, ArrowUpDown, Eye, ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight, ArrowRight, Smartphone, Wifi, CircuitBoard,
  History, Package, FileSpreadsheet
} from "lucide-react"

type FilterCondition = "contains" | "startsWith" | "endsWith" | "equals"
interface FilterRule {
  id: string
  attribute: string
  condition: FilterCondition
  term: string
}

interface UserEntity {
  id: number
  nom?: string
  prenom?: string
  matricule?: string
  cin?: string
  email?: string
  tel?: string
  status?: string
  isManager?: number
  departement?: { id: number; nom?: string }
  agence?: { id: number; nom?: string }
  entrepot?: { id: number; siteRef?: { libeller?: string } }
  fonctionRef?: { id: number; nom?: string; libeller?: string }
}

interface MaterielItem {
  id: number
  materielName?: string
  typeMateriel?: string
  statusAffectation?: string
  sn?: string
  numero?: string
}

interface HistoriqueAffectation {
  id: number
  statusEvent?: string
  motif?: string
  departmentNom?: string
  departement?: { nom?: string }
  agenceNom?: string
  agence?: { nom?: string }
  entrepotNom?: string
  entrepot?: { siteRef?: { libeller?: string } }
  dateEvent?: string
  managerId?: number
  manager?: { nom?: string; prenom?: string }
}

interface HistoriqueMateriel {
  id: number
  statusEvent?: string
  sn?: string
  numero?: string
  materielName?: string
  typeMateriel?: string
  dateEvent?: string
  departementNom?: string
  agenceNom?: string
  entrepotNom?: string
}

const normalizeStatus = (s?: string) => {
  const v = (s || "").toLowerCase()
  if (["detacher", "dettacher", "detached"].includes(v)) return "detacher"
  if (["desactiver", "desactive", "deactivated", "inactive"].includes(v)) return "desactiver"
  if (["archived", "archive", "archivé", "archiver"].includes(v)) return "archived"
  if (["active", "activated", "actif"].includes(v)) return "active"
  return v || "active"
}

const isActiveStatus = (s?: string) => normalizeStatus(s) === "active"
const isDesactiveStatus = (s?: string) => normalizeStatus(s) === "desactiver"

const statusBadge = (status?: string) => {
  if (isDesactiveStatus(status)) return "bg-red-50 text-red-600 border-red-200"
  if (normalizeStatus(status) === "detacher") return "bg-orange-50 text-orange-600 border-orange-200"
  if (normalizeStatus(status) === "archived") return "bg-slate-50 text-slate-600 border-slate-200"
  return "bg-emerald-50 text-emerald-600 border-emerald-200"
}

const statusLabel = (status?: string) => {
  if (isDesactiveStatus(status)) return "Désactivé"
  if (normalizeStatus(status) === "detacher") return "Détaché"
  if (normalizeStatus(status) === "archived") return "Archivé"
  return "Actif"
}

const materielActionLabel = (status?: string) => {
  const v = (status || "").toLowerCase()
  if (v.includes("affect")) return "Affectation"
  if (v.includes("restitu") || v.includes("retour")) return "Restitution"
  if (v.includes("annul")) return "Annulation"
  if (v.includes("recu")) return "Réception"
  return status || "—"
}

const TypeIcon = ({ type }: { type?: string }) => {
  if (type?.toLowerCase().includes("sim")) return <CircuitBoard className="w-4 h-4" />
  if (type?.toLowerCase().includes("internet") || type?.toLowerCase().includes("ligne")) return <Wifi className="w-4 h-4" />
  return <Smartphone className="w-4 h-4" />
}

const affectationBadge = (status?: string) => {
  const v = (status || "").toLowerCase()
  if (v === "recu") return "bg-emerald-100 text-emerald-700"
  if (v === "annuler") return "bg-red-100 text-red-700"
  if (v === "affecter") return "bg-amber-100 text-amber-700"
  return "bg-slate-100 text-slate-700"
}

const actionColor = (action?: string) => {
  if (!action) return "bg-slate-50 text-slate-600 border-slate-200"
  const v = action.toLowerCase()
  if (v.includes("desact")) return "bg-red-50 text-red-700 border-red-200"
  if (v.includes("detacher")) return "bg-orange-50 text-orange-700 border-orange-200"
  if (v.includes("reaffect") || v.includes("affect")) return "bg-amber-50 text-amber-700 border-amber-200"
  if (v.includes("creat")) return "bg-emerald-50 text-emerald-700 border-emerald-200"
  return "bg-blue-50 text-blue-700 border-blue-100"
}
// --- FILTER TOOLBAR ---
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
            className="w-full md:w-36 max-h-56 overflow-y-auto px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500">
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

// --- PAGINATION ---
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
        <button onClick={() => go("1")} disabled={current === 1} className="p-1 rounded hover:bg-slate-200 text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"><ChevronsLeft className="w-4 h-4" /></button>
        <button onClick={() => go(String(current - 1))} disabled={current === 1} className="p-1 rounded hover:bg-slate-200 text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"><ChevronLeft className="w-4 h-4" /></button>
        <div className="flex items-center gap-2 mx-2">
          <span className="text-xs font-bold text-slate-400 uppercase">Page</span>
          <input type="number" value={inputVal} onChange={e => setInputVal(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && go(inputVal)} onBlur={() => go(inputVal)}
            className="w-10 h-7 text-center text-xs font-bold bg-white border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" />
          <span className="text-xs font-bold text-slate-400">/ {total || 1}</span>
        </div>
        <button onClick={() => go(String(current + 1))} disabled={current === total || total === 0} className="p-1 rounded hover:bg-slate-200 text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"><ChevronRight className="w-4 h-4" /></button>
        <button onClick={() => go(String(total))} disabled={current === total || total === 0} className="p-1 rounded hover:bg-slate-200 text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"><ChevronsRight className="w-4 h-4" /></button>
      </div>
    </div>
  )
}

export default function EmployesPage() {
  const [users, setUsers] = useState<UserEntity[]>([])
  const [usersById, setUsersById] = useState<Record<number, UserEntity>>({})
  const [loading, setLoading] = useState(true)

  const [filters, setFilters] = useState<FilterRule[]>([{ id: "1", attribute: "nom", condition: "contains", term: "" }])
  const [sortBy, setSortBy] = useState("id")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 12

  const [viewMode, setViewMode] = useState<"list" | "detail">("list")
  const [selectedUser, setSelectedUser] = useState<UserEntity | null>(null)

  const [equipment, setEquipment] = useState<MaterielItem[]>([])
  const [loadingEquipment, setLoadingEquipment] = useState(false)

  const [histAffectation, setHistAffectation] = useState<HistoriqueAffectation[]>([])
  const [histMateriel, setHistMateriel] = useState<HistoriqueMateriel[]>([])
  const [histTab, setHistTab] = useState<"affectation" | "materiel">("affectation")
  const [loadingHist, setLoadingHist] = useState(false)
  const [histFiltersAffectation, setHistFiltersAffectation] = useState<FilterRule[]>([
    { id: "ha1", attribute: "action", condition: "contains", term: "" }
  ])
  const [histFiltersMateriel, setHistFiltersMateriel] = useState<FilterRule[]>([
    { id: "hm1", attribute: "materielName", condition: "contains", term: "" }
  ])
  const [isExportingHistory, setIsExportingHistory] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const res = await api.get("/users")
      const list = Array.isArray(res.data) ? res.data : []
      setUsers(list)
      const map: Record<number, UserEntity> = {}
      list.forEach(u => { if (u.id != null) map[u.id] = u })
      setUsersById(map)
    } catch (e) {
      console.error("Failed to fetch users", e)
      setUsers([])
      setUsersById({})
    } finally {
      setLoading(false)
    }
  }

  const fetchDetails = async (userId: number) => {
    setLoadingEquipment(true)
    setLoadingHist(true)
    try {
      const [equipRes, histAffRes, histMatRes] = await Promise.all([
        api.get(`/subordinates/${userId}/materiel/all`).catch(() => ({ data: [] })),
        api.get(`/historique-affectation/user/${userId}`).catch(() => ({ data: [] })),
        api.get(`/historique-materiel/user/${userId}`).catch(() => ({ data: [] })),
      ])
      const equip = Array.isArray(equipRes.data) ? equipRes.data : []
      const histAff = Array.isArray(histAffRes.data) ? histAffRes.data : []
      const histMat = Array.isArray(histMatRes.data) ? histMatRes.data : []
      setEquipment(equip)
      setHistAffectation(histAff.sort((a: HistoriqueAffectation, b: HistoriqueAffectation) => (b.id || 0) - (a.id || 0)))
      setHistMateriel(histMat.sort((a: HistoriqueMateriel, b: HistoriqueMateriel) => (b.id || 0) - (a.id || 0)))
    } catch (e) {
      console.error(e)
      setEquipment([])
      setHistAffectation([])
      setHistMateriel([])
    } finally {
      setLoadingEquipment(false)
      setLoadingHist(false)
    }
  }

  const openDetail = async (user: UserEntity) => {
    setSelectedUser(user)
    setHistTab("affectation")
    setViewMode("detail")
    await fetchDetails(user.id)
  }

  const handleResetFilters = () => {
    setFilters([{ id: "1", attribute: "nom", condition: "contains", term: "" }])
    setSortBy("id")
    setSortOrder("asc")
    setPage(1)
  }

  const getFieldValue = (u: UserEntity, attr: string): string => {
    switch (attr) {
      case "id": return String(u.id || "")
      case "nom": return `${u.nom || ""} ${u.prenom || ""}`.trim()
      case "matricule": return u.matricule || ""
      case "cin": return u.cin || ""
      case "departement": return u.departement?.nom || ""
      case "agence": return u.agence?.nom || ""
      case "entrepot": return u.entrepot?.siteRef?.libeller || ""
      case "fonction": return u.fonctionRef?.nom || u.fonctionRef?.libeller || ""
      case "status": return statusLabel(u.status)
      default: return ""
    }
  }

  const getHistAffValue = (h: HistoriqueAffectation, attr: string): string => {
    const manager = h.managerId ? usersById[h.managerId] : h.manager
    switch (attr) {
      case "action": return (h.statusEvent || h.motif || "").toLowerCase()
      case "departement": return (h.departmentNom || h.departement?.nom || "").toLowerCase()
      case "agence": return (h.agenceNom || h.agence?.nom || "").toLowerCase()
      case "entrepot": return (h.entrepotNom || h.entrepot?.siteRef?.libeller || "").toLowerCase()
      case "date": return (h.dateEvent || "").toLowerCase()
      case "manager": return `${manager?.nom || ""} ${manager?.prenom || ""}`.trim().toLowerCase()
      default: return ""
    }
  }

  const getHistMatValue = (h: HistoriqueMateriel, attr: string): string => {
    switch (attr) {
      case "action": return (h.statusEvent || "").toLowerCase()
      case "sn": return (h.sn || h.numero || "").toLowerCase()
      case "materielName": return (h.materielName || "").toLowerCase()
      case "type": return (h.typeMateriel || "").toLowerCase()
      case "date": return (h.dateEvent || "").toLowerCase()
      case "departement": return (h.departementNom || "").toLowerCase()
      case "agence": return (h.agenceNom || "").toLowerCase()
      case "entrepot": return (h.entrepotNom || "").toLowerCase()
      default: return ""
    }
  }

  const applyHistoryFilters = <T,>(data: T[], rules: FilterRule[], getter: (row: T, attr: string) => string) =>
    data.filter(item => rules.every(rule => {
      if (!rule.term) return true
      const val = getter(item, rule.attribute)
      const term = rule.term.toLowerCase()
      switch (rule.condition) {
        case "contains": return val.includes(term)
        case "startsWith": return val.startsWith(term)
        case "endsWith": return val.endsWith(term)
        case "equals": return val === term
        default: return true
      }
    }))

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

  const filtered = useMemo(() => applyFilters(users, filters), [users, filters])
  const histAffFiltered = useMemo(
    () => applyHistoryFilters(histAffectation, histFiltersAffectation, getHistAffValue),
    [histAffectation, histFiltersAffectation]
  )
  const histMatFiltered = useMemo(
    () => applyHistoryFilters(histMateriel, histFiltersMateriel, getHistMatValue),
    [histMateriel, histFiltersMateriel]
  )

  const sorted = useMemo(() => {
    const data = [...filtered]
    data.sort((a, b) => {
      if (sortBy === "id") {
        return sortOrder === "asc" ? (a.id - b.id) : (b.id - a.id)
      }
      const aVal = getFieldValue(a, sortBy)
      const bVal = getFieldValue(b, sortBy)
      return sortOrder === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
    })
    return data
  }, [filtered, sortBy, sortOrder])

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE)
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleSortClick = (attr: string) => {
    if (sortBy === attr) setSortOrder(o => (o === "asc" ? "desc" : "asc"))
    else { setSortBy(attr); setSortOrder("asc") }
  }

  const formatExportDate = (value?: string) => {
    if (!value) return "-"
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString("fr-FR")
  }

  const handleExportUserHistory = async () => {
    if (!selectedUser) return
    setIsExportingHistory(true)
    try {
      const managerName = (h: HistoriqueAffectation) => {
        const manager = h.managerId ? usersById[h.managerId] : h.manager
        return manager ? `${manager.nom || ""} ${manager.prenom || ""}`.trim() : "-"
      }

      await exportStyledWorkbook({
        fileName: `historique_employe_${selectedUser.nom || "user"}_${selectedUser.prenom || ""}`,
        subject: "Historique employe",
        sheets: [
          {
            name: "Affectations",
            title: `Historique affectations : ${`${selectedUser.nom || ""} ${selectedUser.prenom || ""}`.trim()}`,
            columns: [
              { header: "Action", key: "action", width: 18 },
              { header: "Departement", key: "departement", width: 22 },
              { header: "Agence", key: "agence", width: 20 },
              { header: "Entrepot", key: "entrepot", width: 22 },
              { header: "Date", key: "date", width: 22 },
              { header: "Manager", key: "manager", width: 24 },
            ],
            rows: histAffFiltered.map((h) => ({
              action: h.statusEvent || h.motif || "-",
              departement: h.departmentNom || h.departement?.nom || "-",
              agence: h.agenceNom || h.agence?.nom || "-",
              entrepot: h.entrepotNom || h.entrepot?.siteRef?.libeller || "-",
              date: formatExportDate(h.dateEvent),
              manager: managerName(h),
            })),
          },
          {
            name: "Materiel",
            title: `Historique materiel : ${`${selectedUser.nom || ""} ${selectedUser.prenom || ""}`.trim()}`,
            columns: [
              { header: "Action", key: "action", width: 18 },
              { header: "SN", key: "sn", width: 18 },
              { header: "Materiel", key: "materiel", width: 24 },
              { header: "Type", key: "type", width: 20 },
              { header: "Date", key: "date", width: 22 },
              { header: "Departement", key: "departement", width: 22 },
              { header: "Agence", key: "agence", width: 20 },
              { header: "Entrepot", key: "entrepot", width: 22 },
            ],
            rows: histMatFiltered.map((h) => ({
              action: materielActionLabel(h.statusEvent),
              sn: h.sn || h.numero || "-",
              materiel: h.materielName || "-",
              type: h.typeMateriel || "-",
              date: formatExportDate(h.dateEvent),
              departement: h.departementNom || "-",
              agence: h.agenceNom || "-",
              entrepot: h.entrepotNom || "-",
            })),
          },
        ],
      })
    } finally {
      setIsExportingHistory(false)
    }
  }

  const styles = {
    pageBg: "min-h-full bg-background font-sans text-foreground",
    card: "bg-card border border-border rounded-xl shadow-sm overflow-hidden",
    header: "bg-card border-b border-border sticky top-0 z-20 backdrop-blur-md bg-card/80",
    primaryBtn: "btn btn-primary text-xs",
    secondaryBtn: "btn btn-secondary text-xs",
    input: "mdm-input text-xs",
    label: "block text-[10px] font-bold uppercase text-muted-foreground mb-1 tracking-wide",
    th: "px-3 py-2.5 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider bg-secondary/50 border-b border-border select-none",
    td: "px-3 py-2.5 text-[12px] border-b border-border/50 last:border-0",
  }

  const SortIcon = ({ column, by, order }: { column: string, by: string, order: string }) => {
    if (by !== column) return <ArrowUpDown className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
    return order === "asc" ? <ChevronUp className="w-3 h-3 text-blue-600" /> : <ChevronDown className="w-3 h-3 text-blue-600" />
  }

  const SortableTh = ({ label, sortKey }: { label: string; sortKey: string }) => (
    <th onClick={() => handleSortClick(sortKey)} className={`${styles.th} cursor-pointer hover:bg-slate-100 hover:text-blue-600 transition-colors group`}>
      <div className="flex items-center gap-2">{label} <SortIcon column={sortKey} by={sortBy} order={sortOrder} /></div>
    </th>
  )

  const kpiTotal = users.length
  const kpiActifs = users.filter(u => isActiveStatus(u.status)).length
  const kpiDesactives = users.filter(u => isDesactiveStatus(u.status)).length

  const assignedEquipment = equipment.filter(m => m.statusAffectation && ["affecter", "recu", "annuler"].includes(m.statusAffectation))

  if (viewMode === "detail" && selectedUser) {
    return (
      <div className={styles.pageBg}>
        <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-200">
            <button onClick={() => setViewMode("list")} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors font-medium text-xs">
              <ArrowRight className="w-3 h-3 rotate-180" /> Retour à la liste
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT COLUMN */}
            <div className="lg:col-span-4 space-y-4">
              <div className={`${styles.card} relative overflow-hidden`}>
                <div className="h-16 bg-slate-900 relative">
                  <div className="absolute inset-0 bg-blue-600/10" />
                  <div className="absolute -bottom-6 left-4 p-2 bg-white rounded-xl shadow-lg border border-slate-100">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <div className="pt-8 px-4 pb-4">
                  <h1 className="text-lg font-bold text-slate-900 tracking-tight">{selectedUser.nom} {selectedUser.prenom}</h1>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] uppercase text-slate-400 font-bold">Statut</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${statusBadge(selectedUser.status)}`}>
                      {statusLabel(selectedUser.status)}
                    </span>
                  </div>
                  <div className="space-y-1.5 mt-3">
                    <div className="flex justify-between py-1.5 border-b border-slate-50">
                      <span className="text-xs font-medium text-slate-500">Rôle</span>
                      <span className="text-xs font-semibold text-slate-700">{selectedUser.isManager === 1 ? "Manager" : "Agent"}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-50">
                      <span className="text-xs font-medium text-slate-500">Matricule</span>
                      <span className="font-mono text-xs font-semibold text-slate-700">{selectedUser.matricule || "—"}</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-xs font-medium text-slate-500">CIN</span>
                      <span className="font-mono text-xs font-semibold text-slate-700">{selectedUser.cin || "—"}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className={`${styles.card} border-0 shadow-md overflow-hidden`}>
                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                  <h3 className="font-semibold text-slate-700 text-xs uppercase">Équipements Actuels</h3>
                  <Package className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <div className="p-4 space-y-3">
                  {loadingEquipment ? (
                    <div className="text-xs text-slate-400">Chargement...</div>
                  ) : assignedEquipment.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-4 text-center">
                      <div className="w-10 h-10 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-2">
                        <Package className="w-5 h-5" />
                      </div>
                      <p className="font-semibold text-sm text-slate-700">Aucun équipement</p>
                      <p className="text-[10px] text-slate-400">Aucun équipement assigné</p>
                    </div>
                  ) : assignedEquipment.map(item => (
                    <div key={item.id} className="p-3 bg-white border border-slate-200 rounded-xl shadow-sm flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 rounded-lg bg-slate-100 text-slate-600">
                          <TypeIcon type={item.typeMateriel} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">{item.materielName || "Équipement"}</p>
                          <p className="text-[10px] text-slate-400 uppercase tracking-wider">{item.typeMateriel || "—"}</p>
                          {(item.sn || item.numero) && (
                            <p className="text-[10px] font-mono text-slate-400 mt-0.5">SN: {item.sn || item.numero}</p>
                          )}
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${affectationBadge(item.statusAffectation)}`}>
                        {item.statusAffectation || "—"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="lg:col-span-8 space-y-4">
              <div>
                {histTab === "affectation" ? (
                  <FilterToolbar
                    filters={histFiltersAffectation}
                    setFilters={(r: FilterRule[]) => setHistFiltersAffectation(r)}
                    attributes={[
                      { value: "action", label: "Action" },
                      { value: "departement", label: "Département" },
                      { value: "agence", label: "Agence" },
                      { value: "entrepot", label: "Entrepôt" },
                      { value: "date", label: "Date" },
                      { value: "manager", label: "Manager" },
                    ]}
                  />
                ) : (
                  <FilterToolbar
                    filters={histFiltersMateriel}
                    setFilters={(r: FilterRule[]) => setHistFiltersMateriel(r)}
                    attributes={[
                      { value: "action", label: "Action" },
                      { value: "sn", label: "SN" },
                      { value: "materielName", label: "Nom Matériel" },
                      { value: "type", label: "Type Matériel" },
                      { value: "date", label: "Date" },
                      { value: "departement", label: "Département" },
                      { value: "agence", label: "Agence" },
                      { value: "entrepot", label: "Entrepôt" },
                    ]}
                  />
                )}
              </div>
              <div className={styles.card}>
                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-blue-600" />
                    <h3 className="font-semibold text-slate-700 text-xs uppercase">Historique</h3>
                  </div>
                <div className="flex items-center gap-2">
                    <button
                      onClick={handleExportUserHistory}
                      disabled={isExportingHistory || (histAffFiltered.length === 0 && histMatFiltered.length === 0)}
                      className="px-3 py-1.5 text-[10px] font-bold uppercase rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      {isExportingHistory ? "Export..." : "Exporter Excel"}
                    </button>
                    <button
                      onClick={() => setHistTab("affectation")}
                      className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded-lg border transition-all ${histTab === "affectation" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}
                    >
                      Affectations
                    </button>
                    <button
                      onClick={() => setHistTab("materiel")}
                      className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded-lg border transition-all ${histTab === "materiel" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}
                    >
                      Matériel
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                {histTab === "affectation" ? (
                  <table className="w-full text-left border-collapse min-w-[700px]">
                      <thead>
                        <tr>
                          <th className={styles.th}>Action</th>
                          <th className={styles.th}>Département</th>
                          <th className={styles.th}>Agence</th>
                          <th className={styles.th}>Entrepôt</th>
                          <th className={styles.th}>Date</th>
                          <th className={styles.th}>Manager</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {loadingHist ? (
                          <tr><td colSpan={6} className="p-8 text-center text-slate-400">Chargement...</td></tr>
                        ) : histAffFiltered.length === 0 ? (
                          <tr><td colSpan={6} className="p-8 text-center text-slate-400 italic">Aucun historique disponible</td></tr>
                        ) : histAffFiltered.map(h => {
                          const manager = h.managerId ? usersById[h.managerId] : h.manager
                          return (
                            <tr key={h.id} className="hover:bg-blue-50/30 transition-colors group">
                              <td className="px-3 py-2">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider ${actionColor(h.statusEvent || h.motif)}`}>
                                  {h.statusEvent || h.motif || "—"}
                                </span>
                              </td>
                              <td className={`${styles.td} font-medium text-slate-900`}>{h.departmentNom || h.departement?.nom || "—"}</td>
                              <td className={`${styles.td} text-slate-600`}>{h.agenceNom || h.agence?.nom || "—"}</td>
                              <td className={`${styles.td} text-slate-600`}>{h.entrepotNom || h.entrepot?.siteRef?.libeller || "—"}</td>
                              <td className={`${styles.td} text-right font-mono text-slate-500`}>{h.dateEvent ? new Date(h.dateEvent).toLocaleDateString("fr-FR") : "—"}</td>
                              <td className={`${styles.td} font-medium text-slate-700`}>{manager ? `${manager.nom || ""} ${manager.prenom || ""}`.trim() : "—"}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  ) : (
                    <table className="w-full text-left border-collapse min-w-[800px]">
                      <thead>
                        <tr>
                          <th className={styles.th}>Action</th>
                          <th className={styles.th}>SN</th>
                          <th className={styles.th}>Nom Matériel</th>
                          <th className={styles.th}>Type Matériel</th>
                          <th className={styles.th}>Date</th>
                          <th className={styles.th}>Département</th>
                          <th className={styles.th}>Agence</th>
                          <th className={styles.th}>Entrepôt</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {loadingHist ? (
                          <tr><td colSpan={8} className="p-8 text-center text-slate-400">Chargement...</td></tr>
                        ) : histMatFiltered.length === 0 ? (
                          <tr><td colSpan={8} className="p-8 text-center text-slate-400 italic">Aucun historique disponible</td></tr>
                        ) : histMatFiltered.map(h => (
                          <tr key={h.id} className="hover:bg-blue-50/30 transition-colors group">
                            <td className="px-3 py-2">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider ${actionColor(h.statusEvent)}`}>
                                {materielActionLabel(h.statusEvent)}
                              </span>
                            </td>
                            <td className={`${styles.td} font-mono text-slate-600`}>{h.sn || h.numero || "—"}</td>
                            <td className={`${styles.td} font-medium text-slate-800`}>{h.materielName || "—"}</td>
                            <td className={`${styles.td} text-slate-600`}>{h.typeMateriel || "—"}</td>
                            <td className={`${styles.td} text-right font-mono text-slate-500`}>{h.dateEvent ? new Date(h.dateEvent).toLocaleDateString("fr-FR") : "—"}</td>
                            <td className={`${styles.td} text-slate-600`}>{h.departementNom || "—"}</td>
                            <td className={`${styles.td} text-slate-600`}>{h.agenceNom || "—"}</td>
                            <td className={`${styles.td} text-slate-600`}>{h.entrepotNom || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

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
              <h1 className="text-lg font-black text-slate-900 leading-none">Gestion des Employés</h1>
              <p className="text-[10px] text-slate-400 font-medium uppercase">Administrator View</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 space-y-4">
        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-blue-200 transition-all">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
              <Users className="w-16 h-16 text-slate-900" />
            </div>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Total Employés</p>
            <p className="text-3xl font-black text-slate-900">{kpiTotal}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-emerald-200 transition-all">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
              <UserCheck className="w-16 h-16 text-emerald-600" />
            </div>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Total Actifs</p>
            <p className="text-3xl font-black text-emerald-600">{kpiActifs}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-red-200 transition-all">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
              <UserX className="w-16 h-16 text-red-600" />
            </div>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Total Désactivés</p>
            <p className="text-3xl font-black text-red-600">{kpiDesactives}</p>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-col lg:flex-row gap-3 items-start">
          <div className="flex-1 w-full">
            <FilterToolbar
              filters={filters}
              setFilters={(r: FilterRule[]) => { setFilters(r); setPage(1) }}
              attributes={[
                { value: "id", label: "ID" },
                { value: "matricule", label: "Matricule" },
                { value: "cin", label: "CIN" },
                { value: "nom", label: "Collaborateur" },
                { value: "departement", label: "Département" },
                { value: "agence", label: "Agence" },
                { value: "entrepot", label: "Entrepôt" },
                { value: "fonction", label: "Fonction" },
                { value: "status", label: "Statut" },
              ]}
            />
          </div>
        </div>

        {/* Main Table */}
        <div className={styles.card}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px]">
              <thead>
                <tr>
                  <SortableTh label="ID" sortKey="id" />
                  <SortableTh label="Matricule" sortKey="matricule" />
                  <SortableTh label="CIN" sortKey="cin" />
                  <SortableTh label="Collaborateur" sortKey="nom" />
                  <SortableTh label="Département" sortKey="departement" />
                  <th className={styles.th}>Agence</th>
                  <th className={styles.th}>Entrepôt</th>
                  <th className={styles.th}>Fonction</th>
                  <SortableTh label="Statut" sortKey="status" />
                  <th className={`${styles.th} text-right`}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {loading ? (
                  <tr><td colSpan={10} className="p-12 text-center text-slate-400">Chargement...</td></tr>
                ) : paginated.length === 0 ? (
                  <tr><td colSpan={10} className="p-12 text-center text-slate-400">
                    <Search className="w-10 h-10 mx-auto mb-2 opacity-20" />
                    <p>Aucun employé trouvé.</p>
                  </td></tr>
                ) : paginated.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className={styles.td}>{u.id}</td>
                    <td className={styles.td}>{u.matricule || "—"}</td>
                    <td className={styles.td}>{u.cin || "—"}</td>
                    <td className={styles.td}>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center font-bold text-[10px] uppercase">
                          {(u.nom || "?").charAt(0)}
                        </div>
                        <span className="font-semibold text-slate-700 text-xs">{u.nom} {u.prenom}</span>
                      </div>
                    </td>
                    <td className={styles.td}>{u.departement?.nom || "—"}</td>
                    <td className={styles.td}>{u.agence?.nom || "—"}</td>
                    <td className={styles.td}>{u.entrepot?.siteRef?.libeller || "—"}</td>
                    <td className={styles.td}>{u.fonctionRef?.nom || u.fonctionRef?.libeller || "—"}</td>
                    <td className={styles.td}>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${statusBadge(u.status)}`}>
                        {statusLabel(u.status)}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <button onClick={() => openDetail(u)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Voir détail">
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && <Pagination current={page} total={totalPages} setPage={setPage} />}
        </div>
      </div>
    </div>
  )
}
