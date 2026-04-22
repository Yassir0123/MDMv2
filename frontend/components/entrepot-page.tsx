"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { createPortal } from "react-dom"
import api from "@/lib/api"
import { exportStyledWorkbook } from "@/lib/excel-export"
import { formatDateTimeValue, getDateTimeSortValue } from "@/lib/utils"
import { useVisiblePolling } from "@/lib/use-visible-polling"
import {
  Search, Plus, Trash2, Edit2, Eye, Package, X,
  ArrowUpDown, MapPin, Phone, User,
  Filter, ChevronUp, ChevronDown, ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight, ArrowRight, History,
  Building2, Users, Globe, Mail, Printer, CheckCircle2, AlertCircle, FileSpreadsheet
} from "lucide-react"


// --- TYPES ---
type ViewMode = "list" | "detail"
type FilterCondition = "contains" | "startsWith" | "endsWith" | "equals"

interface FilterRule {
  id: string
  attribute: string
  condition: FilterCondition
  term: string
}

interface Entrepot {
  id: number
  siteId?: number
  nom?: string
  siteNom: string
  email?: string
  telephone?: string
  fax?: string
  chefEntrepotId?: number
  chefEntrepotNom?: string
  totalEffectif: number
  totalSites: number
}

interface HistoriqueEntry {
  id: number
  statusEvent?: string
  entrepotNom?: string
  user?: { id: number; nom?: string; prenom?: string }
  managerId?: number
  manager?: { id: number; nom?: string; prenom?: string }
  userNom?: string
  userPrenom?: string
  fonction?: string
  chefEntrepotId?: number
  dateEvent?: string
}

interface Site { id: number; libeller: string }
interface UserEntity { id: number; nom: string; prenom: string }

// --- SEARCHABLE SELECT ---
interface SearchableSelectProps<T> {
  options: T[]
  value: string | number | undefined
  onChange: (value: string | number) => void
  getLabel: (item: T) => string
  placeholder?: string
  disabled?: boolean
}
const SearchableSelect = <T extends { id: string | number }>({
  options, value, onChange, getLabel, placeholder = "Sélectionner...", disabled = false
}: SearchableSelectProps<T>) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const [dropdownStyles, setDropdownStyles] = useState<React.CSSProperties>({})

  const selectedItem = options.find(o => o.id.toString() === value?.toString())
  const filteredOptions = useMemo(() =>
    options.filter(item => getLabel(item).toLowerCase().includes(searchTerm.toLowerCase())).slice(0, 50),
    [options, searchTerm, getLabel]
  )

  useEffect(() => {
    if (isOpen && inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      const showAbove = spaceBelow < 240 && rect.top > spaceBelow
      setDropdownStyles({
        position: 'fixed',
        top: showAbove ? 'auto' : `${rect.bottom + 4}px`,
        bottom: showAbove ? `${window.innerHeight - rect.top + 4}px` : 'auto',
        left: `${rect.left}px`,
        width: `${rect.width}px`,
        zIndex: 9999
      })
    }
  }, [isOpen, filteredOptions.length])

  return (
    <div className="relative w-full">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          disabled={disabled}
          style={{ paddingRight: "2.5rem" }}
          className={`mdm-input text-xs cursor-pointer ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
          placeholder={selectedItem ? getLabel(selectedItem) : placeholder}
          value={isOpen ? searchTerm : (selectedItem ? getLabel(selectedItem) : "")}
          onChange={(e) => { if (!isOpen) setIsOpen(true); setSearchTerm(e.target.value) }}
          onClick={() => { if (!disabled) { setIsOpen(true); setSearchTerm("") } }}
          readOnly={!isOpen && !!selectedItem}
        />
        <ChevronDown className={`absolute right-3 top-3 w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>
      {isOpen && typeof document !== 'undefined' && createPortal(
        <>
          <div className="fixed inset-0 z-[9998]" onClick={() => { setIsOpen(false); setSearchTerm("") }} />
          <ul style={dropdownStyles} className="fixed bg-white border border-slate-200 rounded-lg shadow-2xl max-h-[240px] overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((item) => (
                <li key={item.id}
                  onClick={() => { onChange(item.id); setIsOpen(false); setSearchTerm("") }}
                  className={`px-3 py-2 text-xs cursor-pointer hover:bg-blue-50 transition-colors flex items-center justify-between ${item.id === value ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-700'}`}
                >
                  <span>{getLabel(item)}</span>
                  {item.id === value && <CheckCircle2 className="w-4 h-4" />}
                </li>
              ))
            ) : (
              <li className="px-3 py-4 text-xs text-center text-slate-400 italic">Aucun résultat</li>
            )}
          </ul>
        </>,
        document.body
      )}
    </div>
  )
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

// ===========================
// MAIN COMPONENT
// ===========================
export default function EntrepotPage() {
  // --- STATE ---
  const [entrepots, setEntrepots] = useState<Entrepot[]>([])
  const [loading, setLoading] = useState(true)
  const hasLoadedEntrepotsRef = useRef(false)
  const [viewMode, setViewMode] = useState<ViewMode>("list")
  const [selectedEntrepot, setSelectedEntrepot] = useState<Entrepot | null>(null)

  // Modal state
  const [showFormModal, setShowFormModal] = useState(false)
  const [formMode, setFormMode] = useState<"add" | "edit">("add")

  const [sites, setSites] = useState<Site[]>([])
  const [users, setUsers] = useState<UserEntity[]>([])
  const [totalSitesKPI, setTotalSitesKPI] = useState(0)

  const [historique, setHistorique] = useState<HistoriqueEntry[]>([])
  const [histFilters, setHistFilters] = useState<FilterRule[]>([{ id: "h1", attribute: "statusEvent", condition: "contains", term: "" }])
  const [histSortBy, setHistSortBy] = useState("dateEvent")
  const [histSortOrder, setHistSortOrder] = useState<"asc" | "desc">("desc")
  const [histPage, setHistPage] = useState(1)
  const [isExportingHistory, setIsExportingHistory] = useState(false)
  const HIST_PER_PAGE = 5

  const [filters, setFilters] = useState<FilterRule[]>([{ id: "1", attribute: "siteNom", condition: "contains", term: "" }])
  const [sortBy, setSortBy] = useState("siteNom")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 10

  const [formData, setFormData] = useState<Partial<Entrepot>>({})

  // --- INITIAL LOAD ---
  useEffect(() => {
    fetchEntrepots()
    fetchDropdowns()
  }, [])

  useVisiblePolling(() => fetchEntrepots(), 4000, [])

  useVisiblePolling(() => {
    if (viewMode === "detail" && selectedEntrepot?.id) {
      void fetchHistorique(selectedEntrepot.id)
    }
  }, 4000, [viewMode, selectedEntrepot?.id])

  const fetchEntrepots = async () => {
    const shouldShowLoading = !hasLoadedEntrepotsRef.current
    try {
      if (shouldShowLoading) {
        setLoading(true)
      }
      const res = await api.get("/entrepots")
      setEntrepots(Array.isArray(res.data) ? res.data : [])
      hasLoadedEntrepotsRef.current = true
    } catch (e) { console.error(e) }
    finally {
      if (shouldShowLoading) {
        setLoading(false)
      }
    }
  }

  const fetchDropdowns = async () => {
    try {
      const [resSites, resUsers] = await Promise.all([
        api.get("/sites").catch(() => ({ data: [] })),
        api.get("/users").catch(() => ({ data: [] }))
      ])
      const s = Array.isArray(resSites.data) ? resSites.data : []
      setSites(s)
      setTotalSitesKPI(s.length)
      setUsers(Array.isArray(resUsers.data) ? resUsers.data : [])
    } catch (e) { console.error(e) }
  }

  const fetchHistorique = async (entrepotId: number) => {
    try {
      const res = await api.get(`/historique-affectation/entrepot/${entrepotId}`)
      setHistorique(Array.isArray(res.data) ? res.data : [])
    } catch (e) { setHistorique([]) }
  }

  // --- KPIs ---
  const kpiTotal = entrepots.length
  const kpiEffectif = entrepots.reduce((acc, e) => acc + (e.totalEffectif || 0), 0)

  // --- FILTER/SORT LOGIC ---
  const getFieldValue = (entrepot: Entrepot, attribute: string): string => {
    switch (attribute) {
      case 'nom': return entrepot.nom || ""
      case 'siteNom': return entrepot.siteNom || ""
      case 'telephone': return entrepot.telephone || ""
      case 'fax': return entrepot.fax || ""
      case 'email': return entrepot.email || ""
      case 'chefEntrepotNom': return entrepot.chefEntrepotNom || ""
      default: return ""
    }
  }

  const applyFilters = (data: Entrepot[], rules: FilterRule[]) =>
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

  const filtered = applyFilters(entrepots, filters)
  const sorted = [...filtered].sort((a, b) => {
    const aVal = getFieldValue(a, sortBy)
    const bVal = getFieldValue(b, sortBy)
    const cmp = aVal.localeCompare(bVal)
    return sortOrder === "asc" ? cmp : -cmp
  })

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE)
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // --- HISTORIQUE FILTER/SORT ---
  const getHistValue = (item: HistoriqueEntry, attr: string): string => {
    switch (attr) {
      case 'statusEvent': return item.statusEvent || ""
      case 'entrepotNom': return item.entrepotNom || ""
      case 'employer': return item.user ? String(item.user.id) : ""
      case 'userNom': return item.user ? `${item.user.nom || ""} ${item.user.prenom || ""}` : (item.userNom || "")
      case 'managerId': return item.managerId ? String(item.managerId) : ""
      case 'manager': return item.manager ? `${item.manager.nom || ""} ${item.manager.prenom || ""}` : ""
      case 'dateEvent': return item.dateEvent || ""
      default: return ""
    }
  }

  const filteredHist = historique.filter(item =>
    histFilters.every(rule => {
      if (!rule.term) return true
      const val = getHistValue(item, rule.attribute).toLowerCase()
      const term = rule.term.toLowerCase()
      switch (rule.condition) {
        case "contains": return val.includes(term)
        case "startsWith": return val.startsWith(term)
        case "endsWith": return val.endsWith(term)
        case "equals": return val === term
        default: return true
      }
    })
  )

  const sortedHist = [...filteredHist].sort((a, b) => {
    const aVal = getHistValue(a, histSortBy)
    const bVal = getHistValue(b, histSortBy)
    if (histSortBy === 'dateEvent') {
      return histSortOrder === 'asc'
        ? getDateTimeSortValue(aVal) - getDateTimeSortValue(bVal)
        : getDateTimeSortValue(bVal) - getDateTimeSortValue(aVal)
    }
    const cmp = aVal.localeCompare(bVal)
    return histSortOrder === 'asc' ? cmp : -cmp
  })

  const totalHistPages = Math.ceil(sortedHist.length / HIST_PER_PAGE)
  const paginatedHist = sortedHist.slice((histPage - 1) * HIST_PER_PAGE, histPage * HIST_PER_PAGE)

  // --- HANDLERS ---
  const handleSortClick = (attr: string) => {
    if (sortBy === attr) setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    else { setSortBy(attr); setSortOrder("asc") }
  }

  const handleHistSortClick = (attr: string) => {
    if (histSortBy === attr) setHistSortOrder(histSortOrder === "asc" ? "desc" : "asc")
    else { setHistSortBy(attr); setHistSortOrder("asc") }
  }

  const formatExportDate = (value?: string) => {
    return formatDateTimeValue(value, "-")
  }

  const handleExportHistory = async () => {
    if (!selectedEntrepot || !sortedHist.length) return
    setIsExportingHistory(true)
    try {
      await exportStyledWorkbook({
        fileName: `historique_entrepot_${selectedEntrepot.siteNom || selectedEntrepot.id}`,
        subject: "Historique entrepot",
        sheets: [
          {
            name: "Historique entrepot",
            title: `Historique entrepot : ${selectedEntrepot.siteNom || selectedEntrepot.id}`,
            columns: [
              { header: "Action", key: "action", width: 18 },
              { header: "Entrepot", key: "entrepotNom", width: 24 },
              { header: "Employe", key: "userNom", width: 24 },
              { header: "Manager", key: "manager", width: 24 },
              { header: "Date", key: "dateEvent", width: 22 },
            ],
            rows: sortedHist.map((h) => ({
              action: h.statusEvent || "-",
              entrepotNom: h.entrepotNom || "-",
              userNom: h.user ? `${h.user.nom || ""} ${h.user.prenom || ""}`.trim() || "-" : h.userNom || "-",
              manager: h.manager ? `${h.manager.nom || ""} ${h.manager.prenom || ""}`.trim() || "-" : "-",
              dateEvent: formatExportDate(h.dateEvent),
            })),
          },
        ],
      })
    } finally {
      setIsExportingHistory(false)
    }
  }

  const handleAddClick = () => {
    setFormData({})
    setFormMode("add")
    setShowFormModal(true)
  }

  const handleEditClick = (entrepot: Entrepot) => {
    setFormData({ ...entrepot })
    setFormMode("edit")
    setShowFormModal(true)
  }

  const handleDetailClick = async (entrepot: Entrepot) => {
    setSelectedEntrepot(entrepot)
    setHistPage(1)
    setViewMode("detail")
    await fetchHistorique(entrepot.id)
  }

  const handleSave = async () => {
    try {
      const payload = {
        nom: formData.nom,
        siteId: formData.siteId,
        email: formData.email,
        telephone: formData.telephone,
        fax: formData.fax,
        chefEntrepotId: formData.chefEntrepotId
      }
      if (formMode === "add") {
        await api.post("/entrepots", payload)
      } else if (formMode === "edit" && formData.id) {
        await api.put(`/entrepots/${formData.id}`, payload)
      }
      fetchEntrepots()
      setShowFormModal(false)
    } catch (e) { alert("Erreur lors de l'enregistrement") }
  }

  const handleDelete = async (id: number) => {
    if (confirm("Supprimer cet entrepot ?")) {
      try { await api.delete(`/entrepots/${id}`); fetchEntrepots() }
      catch (e) { alert("Erreur suppression") }
    }
  }

  // --- STYLES ---
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

  const SortableTh = ({ label, sortKey, by, order, onClick }: { label: string; sortKey: string; by: string; order: string; onClick: (k: string) => void }) => (
    <th onClick={() => onClick(sortKey)} className={`${styles.th} cursor-pointer hover:bg-slate-100 hover:text-blue-600 transition-colors group`}>
      <div className="flex items-center gap-2">{label} <SortIcon column={sortKey} by={by} order={order} /></div>
    </th>
  )

  const actionColor = (action?: string) => {
    if (!action) return "bg-slate-50 text-slate-600 border-slate-200"
    if (action === "CHANGEMENT_RESPONSABLE") return "bg-amber-50 text-amber-700 border-amber-200"
    if (action === "CREATION") return "bg-emerald-50 text-emerald-700 border-emerald-200"
    return "bg-blue-50 text-blue-700 border-blue-100"
  }

  // ========================
  // DETAIL VIEW
  // ========================
  if (viewMode === "detail" && selectedEntrepot) {
    return (
      <div className={styles.pageBg}>
        <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-200">
            <button onClick={() => setViewMode("list")} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors font-medium text-xs">
              <ArrowRight className="w-3 h-3 rotate-180" /> Retour à la liste
            </button>
            <div className="flex gap-2">
              <button onClick={() => handleEditClick(selectedEntrepot)} className={`px-3 py-1.5 flex items-center gap-2 text-xs ${styles.secondaryBtn}`}>
                <Edit2 className="w-3 h-3" /> Modifier
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT COLUMN */}
            <div className="lg:col-span-4 space-y-4">
              <div className={`${styles.card} relative overflow-hidden`}>
                <div className="h-16 bg-slate-900 relative">
                  <div className="absolute inset-0 bg-blue-600/10" />
                  <div className="absolute -bottom-6 left-4 p-2 bg-white rounded-xl shadow-lg border border-slate-100">
                    <Package className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <div className="pt-8 px-4 pb-4">
                  <h1 className="text-lg font-bold text-slate-900 tracking-tight">{selectedEntrepot.nom || selectedEntrepot.siteNom || `Entrepot #${selectedEntrepot.id}`}</h1>
                  {selectedEntrepot.siteNom && (
                    <div className="flex items-center gap-1 mt-0.5 mb-4">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span className="text-xs text-slate-500">{selectedEntrepot.siteNom}</span>
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <div className="flex justify-between py-1.5 border-b border-slate-50">
                      <span className="text-xs font-medium text-slate-500 flex items-center gap-1"><Phone className="w-3 h-3" /> Téléphone</span>
                      <span className="font-mono text-xs font-semibold text-slate-700">{selectedEntrepot.telephone || "N/A"}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-50">
                      <span className="text-xs font-medium text-slate-500 flex items-center gap-1"><Printer className="w-3 h-3" /> Fax</span>
                      <span className="font-mono text-xs font-semibold text-slate-700">{selectedEntrepot.fax || "N/A"}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-50">
                      <span className="text-xs font-medium text-slate-500 flex items-center gap-1"><Mail className="w-3 h-3" /> Email</span>
                      <span className="text-xs font-semibold text-slate-700 truncate max-w-[150px]" title={selectedEntrepot.email}>{selectedEntrepot.email || "N/A"}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-50">
                      <span className="text-xs font-medium text-slate-500 flex items-center gap-1"><Users className="w-3 h-3" /> Effectif</span>
                      <span className="text-xs font-semibold text-blue-600">{selectedEntrepot.totalEffectif} employés</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-xs font-medium text-slate-500 flex items-center gap-1"><Globe className="w-3 h-3" /> Sites</span>
                      <span className="text-xs font-semibold text-emerald-600">{selectedEntrepot.totalSites} site{selectedEntrepot.totalSites > 1 ? "s" : ""}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.card}>
                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                  <h3 className="font-semibold text-slate-700 text-xs uppercase">Chef d'Entrepot</h3>
                  <User className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <div className="p-4">
                  {selectedEntrepot.chefEntrepotNom && selectedEntrepot.chefEntrepotNom !== "Non assigne" ? (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-sm border border-blue-200">
                        {selectedEntrepot.chefEntrepotNom.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 text-sm leading-tight">{selectedEntrepot.chefEntrepotNom}</p>
                        <p className="text-slate-500 text-[10px] mt-0.5 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-blue-500" /> Responsable d'entrepot
                        </p>
                        {selectedEntrepot.chefEntrepotId && (
                          <span className="mt-1.5 inline-flex items-center gap-1 text-[10px] text-slate-500 font-mono bg-slate-50 px-2 py-0.5 rounded w-fit border">
                            ID: {selectedEntrepot.chefEntrepotId}
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-4 text-center">
                      <div className="w-10 h-10 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-2">
                        <AlertCircle className="w-5 h-5" />
                      </div>
                      <p className="font-semibold text-sm text-slate-700">Non assigné</p>
                      <p className="text-[10px] text-slate-400">Aucun chef d'entrepot désigné</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN — Historique */}
            <div className="lg:col-span-8 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <History className="w-4 h-4 text-blue-600" /> Historique des Changements
                </h2>
                <button
                  onClick={handleExportHistory}
                  disabled={isExportingHistory || sortedHist.length === 0}
                  className="px-3 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-xs font-bold flex items-center gap-2"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  {isExportingHistory ? "Export..." : "Exporter Excel"}
                </button>
              </div>

              <FilterToolbar
                filters={histFilters}
                setFilters={setHistFilters}
                attributes={[
                  { value: "statusEvent", label: "Action" },
                  { value: "entrepotNom", label: "Entrepot" },
                  
                  
                  { value: "employer", label: "Employer (ID)" },
                  { value: "userNom", label: "Nom Employé" },
                  { value: "manager", label: "Manager" },
                  { value: "dateEvent", label: "Date" },
                ]}
              />

              <div className={`${styles.card} border-0 shadow-md overflow-hidden`}>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                      <tr>
                        <SortableTh label="Action" sortKey="statusEvent" by={histSortBy} order={histSortOrder} onClick={handleHistSortClick} />
                        <SortableTh label="Entrepot" sortKey="entrepotNom" by={histSortBy} order={histSortOrder} onClick={handleHistSortClick} />
                        
                        
                        <SortableTh label="Employer" sortKey="employer" by={histSortBy} order={histSortOrder} onClick={handleHistSortClick} />
                        <SortableTh label="Nom Employé" sortKey="userNom" by={histSortBy} order={histSortOrder} onClick={handleHistSortClick} />
                        <SortableTh label="Manager" sortKey="manager" by={histSortBy} order={histSortOrder} onClick={handleHistSortClick} />
                        <SortableTh label="Date" sortKey="dateEvent" by={histSortBy} order={histSortOrder} onClick={handleHistSortClick} />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {paginatedHist.map(h => (
                        <tr key={h.id} className="hover:bg-blue-50/30 transition-colors group">
                          <td className="px-3 py-2">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider ${actionColor(h.statusEvent)}`}>
                              {h.statusEvent || "—"}
                            </span>
                          </td>
                          <td className={`${styles.td} font-medium text-slate-900`}>{h.entrepotNom || "—"}</td>
                          
                          
                          <td className={`${styles.td} font-mono text-slate-500`}>
                            {h.user?.id ? <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] font-bold">#{h.user.id}</span> : "—"}
                          </td>
                          <td className={`${styles.td} font-medium text-slate-700`}>
                            {h.user ? `${h.user.nom || ""} ${h.user.prenom || ""}`.trim() || "—" : h.userNom || "—"}
                          </td>
                          <td className={`${styles.td} font-medium text-slate-700`}>
                            {h.manager ? `${h.manager.nom || ""} ${h.manager.prenom || ""}`.trim() || "—" : "—"}
                          </td>
                          <td className={`${styles.td} text-right font-mono text-slate-500`}>
                            {formatDateTimeValue(h.dateEvent, "-")}
                          </td>
                        </tr>
                      ))}
                      {paginatedHist.length === 0 && (
                        <tr><td colSpan={5} className="p-12 text-center text-slate-400 italic">Aucun historique disponible</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {totalHistPages > 1 && (
                  <Pagination current={histPage} total={totalHistPages} setPage={setHistPage} />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* FORM MODAL (also accessible from detail) */}
        {showFormModal && (
          <FormModal
            formMode={formMode}
            formData={formData}
            setFormData={setFormData}
            sites={sites}
            users={users}
            onSave={handleSave}
            onClose={() => setShowFormModal(false)}
            styles={styles}
          />
        )}
      </div>
    )
  }

  // ========================
  // LIST VIEW
  // ========================
  return (
    <div className={styles.pageBg}>
      {/* Header */}
      <div className={styles.header}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-sidebar-primary to-accent rounded-lg flex items-center justify-center text-sidebar-primary-foreground shadow-sm">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-900 leading-none">Entrepots</h1>
              <p className="text-[11px] text-muted-foreground mt-0.5">{kpiTotal} entrepots • {kpiEffectif} employés</p>
            </div>
          </div>
          <button onClick={handleAddClick} className={`px-3 py-2 flex items-center gap-2 text-xs ${styles.primaryBtn}`}>
            <Plus className="w-3 h-3" /> Nouvel Entrepot
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 space-y-4">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-slate-300 transition-all">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-slate-900" />
            <div className="p-4">
              <div className="absolute top-1 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity"><Package className="w-16 h-16 text-slate-900" /></div>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Total Entrepots</p>
              <p className="text-3xl font-black text-slate-900">{kpiTotal}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-emerald-200 transition-all">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-emerald-500" />
            <div className="p-4">
              <div className="absolute top-1 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity"><Users className="w-16 h-16 text-emerald-600" /></div>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Total Effectif</p>
              <p className="text-3xl font-black text-emerald-600">{kpiEffectif}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-blue-200 transition-all">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-500" />
            <div className="p-4">
              <div className="absolute top-1 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity"><Globe className="w-16 h-16 text-blue-600" /></div>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Total Sites</p>
              <p className="text-3xl font-black text-blue-600">{totalSitesKPI}</p>
            </div>
          </div>
        </div>

        {/* Filter Toolbar */}
        <FilterToolbar
          filters={filters}
          setFilters={(newFilters: FilterRule[]) => { setFilters(newFilters); setPage(1) }}
          attributes={[
            { value: "nom", label: "Nom" },
            { value: "siteNom", label: "Site" },
            { value: "telephone", label: "Téléphone" },
            { value: "fax", label: "Fax" },
            { value: "email", label: "Email" },
            { value: "chefEntrepotNom", label: "Responsable" },
          ]}
        />

        {/* Main Table */}
        <div className={styles.card}>
          <div className="overflow-x-auto">
          <table className="w-full min-w-[860px]">
            <thead>
              <tr>
                <th className={styles.th}>ID</th>
                <SortableTh label="Nom" sortKey="nom" by={sortBy} order={sortOrder} onClick={handleSortClick} />
                <SortableTh label="Site" sortKey="siteNom" by={sortBy} order={sortOrder} onClick={handleSortClick} />
                <SortableTh label="Téléphone" sortKey="telephone" by={sortBy} order={sortOrder} onClick={handleSortClick} />
                <SortableTh label="Fax" sortKey="fax" by={sortBy} order={sortOrder} onClick={handleSortClick} />
                <SortableTh label="Email" sortKey="email" by={sortBy} order={sortOrder} onClick={handleSortClick} />
                <SortableTh label="Responsable" sortKey="chefEntrepotNom" by={sortBy} order={sortOrder} onClick={handleSortClick} />
                <th className={`${styles.th} text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                <tr><td colSpan={8} className="p-12 text-center text-slate-400">Chargement...</td></tr>
              ) : paginated.length === 0 ? (
                <tr><td colSpan={8} className="p-12 text-center text-slate-400">Aucun entrepot trouvé</td></tr>
              ) : paginated.map((entrepot) => (
                <tr key={entrepot.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className={styles.td}>
                    <span className="font-mono text-xs text-slate-400">#{entrepot.id}</span>
                  </td>
                  <td className={styles.td}>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                        <Building2 className="w-3 h-3" />
                      </div>
                      <div>
                        <span className="font-bold text-slate-800 text-xs">{entrepot.nom || `Entrepot #${entrepot.id}`}</span>
                      </div>
                    </div>
                  </td>
                  <td className={`${styles.td} font-medium text-slate-700`}>{entrepot.siteNom || "—"}</td>
                  <td className={`${styles.td} font-mono text-slate-600`}>{entrepot.telephone || "—"}</td>
                  <td className={`${styles.td} font-mono text-slate-500`}>{entrepot.fax || "—"}</td>
                  <td className={`${styles.td} text-slate-600`}>{entrepot.email || "—"}</td>
                  <td className={styles.td}>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold">
                        {entrepot.chefEntrepotNom ? entrepot.chefEntrepotNom.charAt(0) : "?"}
                      </div>
                      <span className="text-xs font-medium text-slate-600">{entrepot.chefEntrepotNom || "Non assigné"}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => handleDetailClick(entrepot)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Voir détails">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleEditClick(entrepot)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="Modifier">
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button onClick={() => handleDelete(entrepot.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Supprimer">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          {totalPages > 1 && (
            <Pagination current={page} total={totalPages} setPage={setPage} />
          )}
        </div>
      </div>

      {/* ADD/EDIT FORM MODAL */}
      {showFormModal && (
        <FormModal
          formMode={formMode}
          formData={formData}
          setFormData={setFormData}
          sites={sites}
          users={users}
          onSave={handleSave}
          onClose={() => setShowFormModal(false)}
          styles={styles}
        />
      )}
    </div>
  )
}

// ========================
// FORM MODAL COMPONENT
// ========================
function FormModal({ formMode, formData, setFormData, sites, users, onSave, onClose, styles }: {
  formMode: "add" | "edit"
  formData: Partial<Entrepot>
  setFormData: (d: Partial<Entrepot>) => void
  sites: Site[]
  users: UserEntity[]
  onSave: () => void
  onClose: () => void
  styles: any
}) {
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[83vh] translate-x-35 translate-y-5">
        {/* Header */}
        <div className="flex justify-between items-center px-5 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">
            {formMode === "add" ? "Nouvel Entrepot" : `Modifier: ${formData.siteNom || formData.id || "Entrepot"}`}
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Banner */}
        <div className="overflow-y-auto">
          <div className="bg-gradient-to-r from-sidebar-primary to-accent text-sidebar-primary-foreground px-5 py-3 flex items-center gap-3">
            <div className="bg-white/10 p-1.5 rounded-lg backdrop-blur-sm"><Building2 className="w-4 h-4 text-blue-400" /></div>
            <div>
              <h3 className="text-white font-bold text-sm">Informations Générales</h3>
              <p className="text-slate-400 text-[10px]">Site et contacts de l'entrepot</p>
            </div>
          </div>

          <div className="p-5 space-y-4">
            {/* Nom */}
            <div>
              <label className={styles.label}>Nom de l'Entrepot</label>
              <input type="text" value={formData.nom || ""} onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                placeholder="Nom d'entrepot..." className={styles.input} />
            </div>

            {/* Site */}
            <div>
              <label className={styles.label}>Site de l'Entrepot</label>
              <SearchableSelect
                options={sites}
                value={formData.siteId}
                onChange={(v) => {
                  const siteId = Number(v)
                  const site = sites.find((item) => item.id === siteId)
                  setFormData({ ...formData, siteId, siteNom: site?.libeller })
                }}
                getLabel={(site) => site.libeller}
                placeholder="Sélectionner un site"
              />
            </div>

            {/* Chef d'Entrepot */}
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className={styles.label}>Chef d'Entrepot</label>
                <SearchableSelect
                  options={users}
                  value={formData.chefEntrepotId}
                  onChange={(v) => setFormData({ ...formData, chefEntrepotId: Number(v) })}
                  getLabel={(u) => `${u.nom} ${u.prenom}`}
                  placeholder="Sélectionner un responsable"
                />
              </div>
            </div>

            {/* Tel + Fax */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={styles.label}>Téléphone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input type="tel" value={formData.telephone || ""} onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                    placeholder="+212 5..." style={{ paddingLeft: "2.25rem" }} className={styles.input} />
                </div>
              </div>
              <div>
                <label className={styles.label}>Fax</label>
                <div className="relative">
                  <Printer className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input type="tel" value={formData.fax || ""} onChange={(e) => setFormData({ ...formData, fax: e.target.value })}
                    placeholder="+212 5..." style={{ paddingLeft: "2.25rem" }} className={styles.input} />
                </div>
              </div>
            </div>

            {/* Email */}
            <div>
              <label className={styles.label}>Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input type="email" value={formData.email || ""} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="entrepot@example.com" style={{ paddingLeft: "2.25rem" }} className={styles.input} />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-end gap-2">
          <button onClick={onClose} className={`px-4 py-2 ${styles.secondaryBtn}`}>Annuler</button>
          <button onClick={onSave} className={`px-5 py-2 ${styles.primaryBtn}`}>
            {formMode === "add" ? "Créer" : "Sauvegarder"}
          </button>
        </div>
      </div>
    </div>
  )
}







