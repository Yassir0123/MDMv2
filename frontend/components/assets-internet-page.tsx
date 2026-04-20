"use client"

import { useState, useEffect } from "react"
import api from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { exportStyledWorkbook } from "@/lib/excel-export"
import { formatDateTimeValue, getDateTimeSortValue } from "@/lib/utils"
import { useVisiblePolling } from "@/lib/use-visible-polling"
import {
  Edit2, Trash2, Plus, X, Search, RotateCw, Eye,
  Power, AlertCircle, Globe, Activity, ArrowUpDown,
  CheckCircle2, XCircle, Router, MapPin, Building2, Server, Wifi,
  ChevronUp, ChevronDown, Filter, ArrowRight, ShieldAlert, Layers,
  RefreshCw, Check, UserCheck, ChevronLeft, ChevronsLeft, ChevronRight, ChevronsRight, History, FileSpreadsheet
} from "lucide-react"

// --- TYPES ---
type ViewMode = "list" | "add" | "edit" | "view"
type FilterCondition = "contains" | "startsWith" | "endsWith" | "equals"

// Backend Data Interface
interface LigneInternet {
  id: number
  sn: string
  operateur: string
  vitesse: string
  status: "active" | "inactive" | "resilier"
  statusAffectation: "non_affecter" | "affecter" | "en_attente" | "recu" | "annuler"
  agenceId?: number
  agenceNom?: string
  entrepotId?: number
  entrepotNom?: string
  departementId?: number
  departementNom?: string
  chefAgenceNom?: string
  dateEnvoie?: string
  dateCreation?: string
}

interface FilterRule {
  id: string
  attribute: string
  condition: string
  term: string
}

interface HistoryEntry {
  id: number
  action: string
  utilisateur: string
  entrepotNom: string
  agenceNom: string
  departementNom: string
  chefAgence: string
  date: string
}

interface Agence { id: number; nom: string }
interface Entrepot { id: number; siteRef?: { id: number; libeller: string } }
interface Departement { id: number; nom: string }

export default function AssetsInternetPage() {
  const { user } = useAuth()

  // --- ROLE CHECK: Only Admins can write ---
  const isWritable = user?.role === "Administrateur"

  // --- STATE ---
  const [lines, setLines] = useState<LigneInternet[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>("list")

  // Filtering & Sorting
  const [filters, setFilters] = useState<FilterRule[]>([{ id: "1", attribute: "number", condition: "contains", term: "" }])
  const [sortBy, setSortBy] = useState("number")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")

  // Forms & Selection
  const [formData, setFormData] = useState<Partial<LigneInternet>>({})
  const [affectTarget, setAffectTarget] = useState<"none" | "agence" | "entrepot" | "departement">("none")
  const [selectedLine, setSelectedLine] = useState<LigneInternet | null>(null)
  const [showResignModal, setShowResignModal] = useState(false)
  const [history, setHistory] = useState<HistoryEntry[]>([])

  // History Filtering & Sorting state
  const [historyFilters, setHistoryFilters] = useState<FilterRule[]>([
    { id: "h1", attribute: "action", condition: "contains", term: "" }
  ])
  const [historySortBy, setHistorySortBy] = useState("date")
  const [historySortOrder, setHistorySortOrder] = useState<"asc" | "desc">("desc")
  const [historyPage, setHistoryPage] = useState(1)
  const [page, setPage] = useState(1)
  const [isExportingHistory, setIsExportingHistory] = useState(false)
  const ITEMS_PER_PAGE = 5
  const LIST_ITEMS_PER_PAGE = 10

  const [showAffectModal, setShowAffectModal] = useState(false)

  // Dropdown Data
  const [agences, setAgences] = useState<Agence[]>([])
  const [entrepots, setEntrepots] = useState<Entrepot[]>([])
  const [departements, setDepartements] = useState<Departement[]>([])

  // --- INITIAL LOAD ---
  useEffect(() => {
    fetchLines()
    fetchDropdownData()
  }, [])

  useVisiblePolling(() => fetchLines(), 4000, [])

  useVisiblePolling(() => {
    if (viewMode === "view" && selectedLine?.id) {
      void fetchLineHistory(selectedLine.id)
    }
  }, 4000, [viewMode, selectedLine?.id])

  const fetchLines = async () => {
    try {
      if (lines.length === 0) {
        setLoading(true)
      }
      const res = await api.get("/lignes-internet")
      setLines(Array.isArray(res.data) ? res.data : [])
    } catch (e) { console.error(e); setLines([]) }
    finally { setLoading(false) }
  }

  const fetchLineHistory = async (lineId: number) => {
    try {
      const res = await api.get("/historique-ligne-internet")
      const lineHistory = Array.isArray(res.data) ? res.data
        .filter((h: any) => h.materiel && h.materiel.id === lineId)
        .map((h: any) => ({
          id: h.id,
          action: h.statusEvent || "-",
          utilisateur: h.userNom || "-",
          entrepotNom: h.entrepotNom || "-",
          agenceNom: h.agenceNom || "-",
          departementNom: h.departementNom || "-",
          chefAgence: h.chefAgenceNom || "-",
          date: h.dateEvent || "-"
        })) : []
      setHistory(lineHistory)
    } catch (e) { setHistory([]) }
  }

  const fetchDropdownData = async () => {
    try {
      const [resAgences, resEntrepots, resDepts] = await Promise.all([
        api.get("/agences").catch(() => ({ data: [] })),
        api.get("/entrepots").catch(() => ({ data: [] })),
        api.get("/departements").catch(() => ({ data: [] }))
      ])
      setAgences(Array.isArray(resAgences.data) ? resAgences.data : [])
      setEntrepots(Array.isArray(resEntrepots.data) ? resEntrepots.data : [])
      setDepartements(Array.isArray(resDepts.data) ? resDepts.data : [])
    } catch (e) { console.error(e) }
  }

  // --- LOGIC ---
  const inferAffectTarget = (fd: Partial<LigneInternet>) => {
    if (fd.entrepotId) return "entrepot" as const
    if (fd.departementId) return "departement" as const
    if (fd.agenceId) return "agence" as const
    return "none" as const
  }

  const getFieldValue = (line: LigneInternet, attribute: string): string => {
    switch (attribute) {
      case 'number': return line.sn || "";
      case 'provider': return line.operateur || "";
      case 'site': return line.agenceNom || line.entrepotNom || "";
      case 'status': return line.status || "";
      case 'speed': return line.vitesse || "";
      default: return "";
    }
  }

  const applyFilters = (data: any[], rules: FilterRule[]) => {
    return data.filter(item => {
      return rules.every(rule => {
        if (!rule.term) return true;
        const val = getFieldValue(item, rule.attribute);
        const term = rule.term.toLowerCase();

        switch (rule.condition) {
          case "contains": return val.includes(term);
          case "startsWith": return val.startsWith(term);
          case "endsWith": return val.endsWith(term);
          case "equals": return val === term;
          default: return true;
        }
      })
    })
  }

  // Filtering
  const filtered = applyFilters(lines, filters)

  // Sorting
  const sorted = [...filtered].sort((a, b) => {
    // @ts-ignore
    const aVal = a[sortBy]?.toString() || ""
    // @ts-ignore
    const bVal = b[sortBy]?.toString() || ""
    const comparison = aVal.localeCompare(bVal)
    return sortOrder === "asc" ? comparison : -comparison
  })

  // History Filtering
  const filteredHistory = history.filter(entry => {
    return historyFilters.every(filter => {
      if (!filter.term) return true
      // @ts-ignore
      const val = (entry[filter.attribute]?.toString() || "").toLowerCase()
      const term = filter.term.toLowerCase()
      switch (filter.condition) {
        case "contains": return val.includes(term)
        case "startsWith": return val.startsWith(term)
        case "endsWith": return val.endsWith(term)
        case "equals": return val === term
        default: return true
      }
    })
  })

  // History Sorting
  const sortedHistory = [...filteredHistory].sort((a, b) => {
    // @ts-ignore
    const aVal = a[historySortBy]
    // @ts-ignore
    const bVal = b[historySortBy]

    if (historySortBy === "date") {
      const dateA = getDateTimeSortValue(aVal)
      const dateB = getDateTimeSortValue(bVal)
      return historySortOrder === "asc" ? dateA - dateB : dateB - dateA
    }

    const comparison = String(aVal || "").localeCompare(String(bVal || ""))
    return historySortOrder === "asc" ? comparison : -comparison
  })

  // History Pagination
  const totalHistoryPages = Math.ceil(sortedHistory.length / ITEMS_PER_PAGE)
  const paginatedHistory = sortedHistory.slice(
    (historyPage - 1) * ITEMS_PER_PAGE,
    historyPage * ITEMS_PER_PAGE
  )
  const totalPages = Math.max(1, Math.ceil(sorted.length / LIST_ITEMS_PER_PAGE))
  const paginatedLines = sorted.slice((page - 1) * LIST_ITEMS_PER_PAGE, page * LIST_ITEMS_PER_PAGE)

  useEffect(() => {
    setPage(1)
  }, [filters, sortBy, sortOrder])

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  // KPIs
  const kpiTotal = lines.length
  const kpiActive = lines.filter(l => l.status === "active").length
  const kpiResigned = lines.filter(l => l.status === "resilier").length

  // --- HANDLERS ---
  const handleSortClick = (attr: string) => {
    if (sortBy === attr) setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    else { setSortBy(attr); setSortOrder("asc") }
  }

  const handleAdd = () => {
    setFormData({ status: "active", statusAffectation: "non_affecter" })
    setAffectTarget("none")
    setViewMode("add")
  }

  const handleEdit = (line: LigneInternet) => {
    setFormData({ ...line })
    setAffectTarget(inferAffectTarget(line))
    setViewMode("edit")
  }

  const handleView = async (line: LigneInternet) => {
    setSelectedLine(line)
    setViewMode("view")
    setHistoryPage(1)
    await fetchLineHistory(line.id)
  }

  const handleSave = async () => {
    try {
      const payload: any = {
        ...formData,
        agenceId: null,
        entrepotId: null,
        departementId: null
      }

      if (affectTarget === "agence" && formData.agenceId) payload.agenceId = parseInt(formData.agenceId.toString())
      if (affectTarget === "entrepot" && formData.entrepotId) payload.entrepotId = parseInt(formData.entrepotId.toString())
      if (affectTarget === "departement" && formData.departementId) payload.departementId = parseInt(formData.departementId.toString())

      if (viewMode === "add") await api.post("/lignes-internet", payload)
      else if (viewMode === "edit" && formData.id) await api.put(`/lignes-internet/${formData.id}`, payload)
      fetchLines()
      setViewMode("list")
    } catch (e) { alert("Erreur lors de l'enregistrement.") }
  }

  const handleDelete = async (id: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette ligne ?")) {
      try { await api.delete(`/lignes-internet/${id}`); fetchLines() }
      catch (e) { alert("Erreur lors de la suppression.") }
    }
  }

  const handleActivate = async (id: number) => {
    try { await api.post(`/lignes-internet/activate/${id}`); fetchLines() }
    catch (e) { alert("Erreur activation.") }
  }

  const formatExportDate = (value?: string) => {
    return formatDateTimeValue(value, "-")
  }

  const handleExportHistory = async () => {
    if (!selectedLine || !sortedHistory.length) return
    setIsExportingHistory(true)
    try {
      await exportStyledWorkbook({
        fileName: `historique_internet_${selectedLine.sn || selectedLine.id}`,
        subject: "Historique ligne internet",
        sheets: [
          {
            name: "Historique internet",
            title: `Ligne Internet : ${selectedLine.sn || selectedLine.id}`,
            subtitle: `Operateur : ${selectedLine.operateur || "-"} | Debit : ${selectedLine.vitesse || "-"}`,
            columns: [
              { header: "Action", key: "action", width: 18 },
              { header: "Utilisateur", key: "utilisateur", width: 24 },
              { header: "Entrepot", key: "entrepotNom", width: 20 },
              { header: "Agence", key: "agenceNom", width: 20 },
              { header: "Departement", key: "departementNom", width: 22 },
              { header: "Chef agence", key: "chefAgence", width: 22 },
              { header: "Date", key: "date", width: 22 },
            ],
            rows: sortedHistory.map((entry) => ({
              action: entry.action || "-",
              utilisateur: entry.utilisateur || "-",
              entrepotNom: entry.entrepotNom || "-",
              agenceNom: entry.agenceNom || "-",
              departementNom: entry.departementNom || "-",
              chefAgence: entry.chefAgence || "-",
              date: formatExportDate(entry.date),
            })),
          },
        ],
      })
    } finally {
      setIsExportingHistory(false)
    }
  }

  const handleResign = async (id: number) => {
    try { await api.post(`/lignes-internet/resilier/${id}`); fetchLines(); setShowResignModal(false) }
    catch (e) { alert("Erreur résiliation.") }
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

  const SortIcon = ({ column }: { column: string }) => {
    if (sortBy !== column) return <ArrowUpDown className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
    return sortOrder === "asc" ? <ChevronUp className="w-3 h-3 text-blue-600" /> : <ChevronDown className="w-3 h-3 text-blue-600" />
  }

  // Accepte des props supplémentaires (currentSort, setSort, styles, SortIcon) pour
  // rester compatible avec les appels existants tout en n'utilisant que label/sortKey.
  const SortableTh = ({ label, sortKey, currentSort, setSort }: { label: string; sortKey: string; currentSort: string; setSort: (k: string) => void;[key: string]: any }) => {
    const isCurrentSort = currentSort === sortKey
    return (
      <th
        onClick={() => {
          if (setSort === setHistorySortBy) {
            if (historySortBy === sortKey) setHistorySortOrder(historySortOrder === "asc" ? "desc" : "asc")
            else { setHistorySortBy(sortKey); setHistorySortOrder("asc") }
          } else {
            handleSortClick(sortKey)
          }
        }}
        className={`${styles.th} cursor-pointer hover:bg-slate-100 hover:text-blue-600 transition-colors group`}
      >
        <div className="flex items-center gap-2">
          {label}
          {!isCurrentSort ? (
            <ArrowUpDown className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
          ) : (setSort === setHistorySortBy ? historySortOrder : sortOrder) === "asc" ? (
            <ChevronUp className="w-3 h-3 text-blue-600" />
          ) : (
            <ChevronDown className="w-3 h-3 text-blue-600" />
          )}
        </div>
      </th>
    )
  }

  // --- REUSABLE COMPONENTS ---
  const FilterToolbar = ({ filters, setFilters, attributes }: { filters: FilterRule[], setFilters: any, attributes: { value: string, label: string }[] }) => {
    const addFilter = () => setFilters([...filters, { id: Date.now().toString(), attribute: attributes[0].value, condition: "contains", term: "" }])
    const removeFilter = (id: string) => { if (filters.length === 1) return; setFilters(filters.filter(f => f.id !== id)) }
    const updateFilter = (id: string, field: keyof FilterRule, value: string) => setFilters(filters.map(f => f.id === id ? { ...f, [field]: value } : f))

    return (
      <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-200 space-y-2 mb-4">
        {filters.map((filter, index) => (
          <div key={filter.id} className="flex flex-col md:flex-row items-center gap-3 w-full">
            <div className="flex items-center gap-2 text-slate-400 px-2 min-w-[80px]">
              <Filter className="w-4 h-4" />
              <span className="text-xs font-bold uppercase">{index === 0 ? "Filtrer" : "Et"}</span>
            </div>
            <select value={filter.attribute} onChange={(e) => updateFilter(filter.id, "attribute", e.target.value)} className="w-full md:w-36 px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500">
              {attributes.map(attr => <option key={attr.value} value={attr.value}>{attr.label}</option>)}
            </select>
            <select value={filter.condition} onChange={(e) => updateFilter(filter.id, "condition", e.target.value)} className="w-full md:w-36 px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 outline-none focus:ring-2 focus:ring-blue-500">
              <option value="contains">Contient</option><option value="startsWith">Commence par</option><option value="endsWith">Finit par</option><option value="equals">Est égal à</option>
            </select>
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-2.5 w-3 h-3 text-slate-400" />
              <input type="text" placeholder="Valeur..." value={filter.term} onChange={(e) => updateFilter(filter.id, "term", e.target.value)} className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none" />
              {filters.length > 1 && (<button onClick={() => removeFilter(filter.id)} className="absolute right-2 top-2 text-slate-400 hover:text-red-500"><X className="w-4 h-4" /></button>)}
            </div>
          </div>
        ))}
        <div className="flex justify-start pl-2">
          <button onClick={addFilter} className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"><Plus className="w-3 h-3" /> Ajouter un filtre</button>
        </div>
      </div>
    )
  }

  const Pagination = ({ current, total, setPage }: { current: number, total: number, setPage: (p: number) => void }) => {
    const [inputVal, setInputVal] = useState(current.toString())

    useEffect(() => { setInputVal(current.toString()) }, [current])

    const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
      setInputVal(e.target.value)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        let val = parseInt(inputVal)
        if (isNaN(val) || val < 1) val = 1
        if (val > total) val = total
        setPage(val)
      }
    }

    const handleBlur = () => {
      let val = parseInt(inputVal)
      if (isNaN(val) || val < 1) val = 1
      if (val > total) val = total
      setPage(val)
      setInputVal(val.toString())
    }

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-2 border-t border-slate-100 bg-slate-50/50 gap-4">
        <span className="text-xs font-medium text-slate-500">
          Affichage {current} sur {total || 1}
        </span>
        <div className="flex items-center gap-2">
          <button onClick={() => setPage(1)} disabled={current === 1} className="p-1 rounded hover:bg-slate-200 text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"><ChevronsLeft className="w-4 h-4" /></button>
          <button onClick={() => setPage(current - 1)} disabled={current === 1} className="p-1 rounded hover:bg-slate-200 text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"><ChevronLeft className="w-4 h-4" /></button>

          <div className="flex items-center gap-2 mx-2">
            <span className="text-xs font-bold text-slate-400 uppercase">Page</span>
            <input
              type="number"
              value={inputVal}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              className="w-10 h-7 text-center text-xs font-bold bg-white border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <span className="text-xs font-bold text-slate-400">/ {total || 1}</span>
          </div>

          <button onClick={() => setPage(current + 1)} disabled={current === total || total === 0} className="p-1 rounded hover:bg-slate-200 text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"><ChevronRight className="w-4 h-4" /></button>
          <button onClick={() => setPage(total)} disabled={current === total || total === 0} className="p-1 rounded hover:bg-slate-200 text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"><ChevronsRight className="w-4 h-4" /></button>
        </div>
      </div>
    )
  }

  // 1. FORM VIEW (Add/Edit) has been converted to a modal below

  // 2. VIEW DETAILS
  if (viewMode === "view" && selectedLine) {
    return (
      <div className={styles.pageBg}>
        <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-200">
            <button onClick={() => setViewMode("list")} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors font-medium text-xs">
              <ArrowRight className="w-3 h-3 rotate-180" /> Retour à la liste
            </button>
            {isWritable && (
              <div className="flex gap-2">
                <button onClick={() => setShowAffectModal(true)} className={`px-3 py-1.5 flex items-center gap-2 text-xs ${styles.primaryBtn}`}>
                  <RefreshCw className="w-3 h-3" /> Gérer l'affectation
                </button>
                <button onClick={() => handleEdit(selectedLine)} className={`px-3 py-1.5 flex items-center gap-2 text-xs ${styles.secondaryBtn}`}>
                  <Edit2 className="w-3 h-3" /> Modifier
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column */}
            <div className="lg:col-span-4 space-y-4">
              {/* Asset Info Card */}
              <div className={`${styles.card} relative overflow-hidden group`}>
                <div className="h-16 bg-slate-900 relative">
                  <div className="absolute inset-0 bg-blue-600/10" />
                  <div className="absolute -bottom-6 left-4 p-2 bg-white rounded-xl shadow-lg border border-slate-100">
                    <Globe className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <div className="pt-8 px-4 pb-4">
                  <h1 className="text-lg font-bold text-slate-900 tracking-tight">{selectedLine.sn}</h1>
                  <p className="text-xs text-slate-500 font-medium mb-4">{selectedLine.operateur}</p>
                  <div className="space-y-1.5">
                    <div className="flex justify-between py-1.5 border-b border-slate-50">
                      <span className="text-xs font-medium text-slate-500">Statut</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${selectedLine.status === "active" ? "bg-emerald-100 text-emerald-700" : selectedLine.status === "resilier" ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"}`}>
                        {selectedLine.status === "active" ? "Actif" : selectedLine.status === "resilier" ? "Résilié" : "Inactif"}
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-50">
                      <span className="text-xs font-medium text-slate-500">Débit</span>
                      <span className="text-xs font-semibold text-slate-700">{selectedLine.vitesse || "N/A"}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-50">
                      <span className="text-xs font-medium text-slate-500">Agence</span>
                      <span className="text-xs font-semibold text-slate-700">{selectedLine.agenceNom || "N/A"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Affectation Card */}
              <div className={styles.card}>
                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                  <h3 className="font-semibold text-slate-700 text-xs uppercase">Site Actuel</h3>
                  <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <div className="p-4">
                  {selectedLine.agenceNom || selectedLine.departementNom ? (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center font-bold text-sm border border-blue-200">
                        {selectedLine.agenceNom ? <Building2 className="w-4 h-4" /> : <Layers className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 text-sm leading-tight">{selectedLine.agenceNom || selectedLine.departementNom}</p>
                        <p className="text-slate-500 text-[10px] mt-0.5">{selectedLine.agenceNom ? "Agence Principale" : "Département"}</p>
                        <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-emerald-600 font-mono font-medium bg-emerald-50 px-2 py-0.5 rounded w-fit">
                          <CheckCircle2 className="w-3 h-3" /> Affecté
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-2 text-center">
                      <div className="w-10 h-10 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-2">
                        <Server className="w-5 h-5" />
                      </div>
                      <p className="font-semibold text-sm text-slate-700">En Attente / Stock</p>
                      <p className="text-[10px] text-slate-400">Disponible pour affectation géographique</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: History */}
            <div className="lg:col-span-8 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2"><History className="w-5 h-5 text-blue-600" /> Historique</h2>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-bold">{filteredHistory.length} entrées</span>
                  <button
                    onClick={handleExportHistory}
                    disabled={isExportingHistory || sortedHistory.length === 0}
                    className="px-3 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-xs font-bold flex items-center gap-2"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    {isExportingHistory ? "Export..." : "Exporter Excel"}
                  </button>
                </div>
              </div>

              <FilterToolbar
                filters={historyFilters}
                setFilters={setHistoryFilters}
                attributes={[
                  { value: "action", label: "Action" },
                  { value: "utilisateur", label: "Utilisateur" },
                  { value: "entrepotNom", label: "Entrepôt" },
                  { value: "agenceNom", label: "Agence" },
                  { value: "departementNom", label: "Département" },
                  { value: "chefAgence", label: "Chef d'Agence" }
                ]}
              />

              <div className={`${styles.card} border-0 shadow-md`}>
                <div className="overflow-x-auto min-h-[300px]">
                  <table className="w-full text-left whitespace-nowrap">
                    <thead>
                      <tr>
                        <SortableTh label="Action" sortKey="action" currentSort={historySortBy} setSort={setHistorySortBy} />
                        <SortableTh label="Utilisateur" sortKey="utilisateur" currentSort={historySortBy} setSort={setHistorySortBy} />
                        <SortableTh label="Entrepôt" sortKey="entrepotNom" currentSort={historySortBy} setSort={setHistorySortBy} />
                        <SortableTh label="Agence" sortKey="agenceNom" currentSort={historySortBy} setSort={setHistorySortBy} />
                        <SortableTh label="Département" sortKey="departementNom" currentSort={historySortBy} setSort={setHistorySortBy} />
                        <SortableTh label="Chef d'Agence" sortKey="chefAgence" currentSort={historySortBy} setSort={setHistorySortBy} />
                        <SortableTh label="Date" sortKey="date" currentSort={historySortBy} setSort={setHistorySortBy} />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {paginatedHistory.map((entry) => (
                        <tr key={entry.id} className="hover:bg-blue-50/30 transition-colors group">
                          <td className="px-4 py-2">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider ${entry.action === 'CREATION' ? 'bg-slate-50 text-slate-600 border-slate-200' :
                              entry.action === 'RESILIATION' ? 'bg-red-50 text-red-700 border-red-100' :
                                'bg-emerald-50 text-emerald-700 border-emerald-100'
                              }`}>
                              {entry.action}
                            </span>
                          </td>
                          <td className={`${styles.td} font-medium text-slate-900`}>{entry.utilisateur}</td>
                          <td className={styles.td}>{entry.entrepotNom}</td>
                          <td className={styles.td}>{entry.agenceNom}</td>
                          <td className={styles.td}>{entry.departementNom}</td>
                          <td className={styles.td}>{entry.chefAgence}</td>
                          <td className={`${styles.td} text-right font-mono text-slate-500`}>
                            {formatDateTimeValue(entry.date, "-")}
                          </td>
                        </tr>
                      ))}
                      {paginatedHistory.length === 0 && (
                        <tr><td colSpan={7} className="p-12 text-center text-slate-400 italic">Aucun historique trouvé</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {totalHistoryPages > 1 && (
                  <Pagination current={historyPage} total={totalHistoryPages} setPage={setHistoryPage} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 3. LIST VIEW
  return (
    <div className={styles.pageBg}>
      {/* ─── Page Header ─── */}
      <div className={styles.header}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 gradient-primary rounded-xl flex items-center justify-center text-white shadow-md shadow-primary/20"><Globe className="w-5 h-5" /></div>
            <div>
              <h1 className="text-lg font-bold text-foreground leading-none tracking-tight">Lignes Internet & WAN</h1>
              <p className="text-[11px] text-muted-foreground mt-0.5">{kpiTotal} lignes au total • {kpiActive} actives</p>
            </div>
          </div>
          {isWritable && <button onClick={handleAdd} className={`px-4 py-2.5 flex items-center gap-2 ${styles.primaryBtn}`}><Plus className="w-3.5 h-3.5" /> Nouvelle Ligne</button>}
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 lg:p-5 space-y-5">
        {/* ─── KPI Cards ─── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card p-4 rounded-xl border border-border shadow-sm relative overflow-hidden group hover:border-primary/30 hover:shadow-md transition-all card-hover">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary" />
            <div className="absolute top-0 right-0 p-3 opacity-[0.06] group-hover:opacity-[0.12] transition-opacity"><Globe className="w-16 h-16 text-foreground" /></div>
            <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider mb-1">Total Lignes</p><p className="text-3xl font-black text-foreground tabular-nums">{kpiTotal}</p>
          </div>
          <div className="bg-card p-4 rounded-xl border border-border shadow-sm relative overflow-hidden group hover:border-emerald-400/30 hover:shadow-md transition-all card-hover">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-emerald-500" />
            <div className="absolute top-0 right-0 p-3 opacity-[0.06] group-hover:opacity-[0.12] transition-opacity"><Check className="w-16 h-16 text-emerald-600" /></div>
            <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider mb-1">Actives</p><p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">{kpiActive}</p>
          </div>
          <div className="bg-card p-4 rounded-xl border border-border shadow-sm relative overflow-hidden group hover:border-blue-400/30 hover:shadow-md transition-all card-hover">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-500" />
            <div className="absolute top-0 right-0 p-3 opacity-[0.06] group-hover:opacity-[0.12] transition-opacity"><UserCheck className="w-16 h-16 text-blue-600" /></div>
            <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider mb-1">Affectées</p><p className="text-3xl font-black text-blue-600 dark:text-blue-400 tabular-nums">{kpiTotal - kpiResigned}</p>
          </div>
        </div>

        {/* ─── Section: Filtres ─── */}
        <div>
          <FilterToolbar
            filters={filters}
            setFilters={setFilters}
            attributes={[
              { value: "number", label: "Numéro" },
              { value: "provider", label: "Opérateur / F.A.I" },
              { value: "site", label: "Agence/Entrepôt" },
              { value: "speed", label: "Débit" },
              { value: "status", label: "Statut" }
            ]}
          />
        </div>

        {/* ─── Section: Inventaire ─── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Wifi className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">Inventaire des Lignes Internet</h2>
              <span className="text-xs text-muted-foreground ml-1">{sorted.length} résultat{sorted.length !== 1 ? "s" : ""}</span>
            </div>
          </div>
          <div className={`${styles.card} card-hover`}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px]">
                <thead>
                  <tr>
                    <SortableTh label="Numéro" sortKey="number" currentSort={sortBy} setSort={setSortBy} styles={styles} SortIcon={SortIcon} />
                    <SortableTh label="F.A.I" sortKey="provider" currentSort={sortBy} setSort={setSortBy} styles={styles} SortIcon={SortIcon} />
                    <th className={styles.th}>Entrepôt</th>
                    <SortableTh label="Agence" sortKey="site" currentSort={sortBy} setSort={setSortBy} styles={styles} SortIcon={SortIcon} />
                    <SortableTh label="Débit" sortKey="speed" currentSort={sortBy} setSort={setSortBy} styles={styles} SortIcon={SortIcon} />
                    <th className={styles.th}>Statut</th>
                    <th className={`${styles.th} text-right`}>Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50 bg-card">
                  {paginatedLines.map((line) => (
                    <tr key={line.id} className="hover:bg-secondary/50 transition-colors group">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full bg-secondary text-muted-foreground flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-colors"><Globe className="w-3 h-3" /></div>
                          <div><p className="font-bold text-foreground text-xs">{line.sn}</p><p className="text-[10px] text-muted-foreground font-mono font-normal">ID: {line.id}</p></div>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground">{line.operateur}</td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground">{line.entrepotNom || "-"}</td>
                      <td className="px-4 py-2.5">
                        {line.agenceNom ? (
                          <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                            <div className="w-5 h-5 rounded-lg bg-purple-100 dark:bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center text-[10px] font-bold"><Building2 className="w-3 h-3" /></div>
                            {line.agenceNom}
                          </div>
                        ) : line.departementNom ? (
                          <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                            <div className="w-5 h-5 rounded-lg bg-orange-100 dark:bg-orange-500/15 text-orange-600 dark:text-orange-400 flex items-center justify-center text-[10px] font-bold"><Layers className="w-3 h-3" /></div>
                            {line.departementNom}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-[10px] italic">Stock / Non assignée</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground font-medium font-mono">{line.vitesse || "-"}</td>
                      <td className="px-4 py-2.5"><span className={`badge ${line.status === "active" ? "badge-success" : line.status === "resilier" ? "badge-danger" : "badge-warning"}`}>{line.status === 'active' ? 'Actif' : line.status === 'resilier' ? 'Résilié' : 'Inactif'}</span></td>
                      <td className="px-4 py-2.5 text-right">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => handleView(line)} className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-all"><Eye className="w-3.5 h-3.5" /></button>
                          {isWritable && (
                            <>
                              {(line.status === "inactive" || line.status === "resilier") && (
                                <button onClick={() => handleActivate(line.id)} className="p-1.5 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg transition-all" title="Activer/Réactiver"><Power className="w-3.5 h-3.5" /></button>
                              )}
                              {line.status === "active" && (
                                <button onClick={() => { setSelectedLine(line); setShowResignModal(true); }} className="p-1.5 text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all" title="Résilier"><AlertCircle className="w-3.5 h-3.5" /></button>
                              )}
                              <button onClick={() => handleEdit(line)} className="p-1.5 text-muted-foreground hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-all"><Edit2 className="w-3.5 h-3.5" /></button>
                              <button onClick={() => handleDelete(line.id)} className="p-1.5 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {sorted.length === 0 && <tr><td colSpan={7} className="p-12 text-center text-muted-foreground"><Search className="w-12 h-12 mx-auto mb-3 opacity-20" /><p>Aucun résultat trouvé.</p></td></tr>}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && <Pagination current={page} total={totalPages} setPage={setPage} />}
          </div>
        </div>

        {/* Resign Modal */}
        {showResignModal && selectedLine && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl border border-red-100 w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="bg-red-50 px-5 py-3 border-b border-red-100 flex items-center gap-3"><div className="bg-white p-2 rounded-full text-red-600 shadow-sm"><ShieldAlert className="w-5 h-5" /></div><h2 className="text-base font-bold text-red-900">Confirmation de Résiliation</h2></div>
              <div className="p-5 space-y-3">
                <div className="bg-red-50/50 p-4 rounded-xl border border-red-100"><p className="text-slate-700 text-xs leading-relaxed">Vous êtes sur le point de résilier définitivement la ligne :</p><div className="mt-2 flex items-center gap-2 font-mono font-bold text-base text-slate-900"><Globe className="w-4 h-4 text-slate-400" />{selectedLine.sn}</div><p className="text-[10px] text-red-600 font-bold mt-2 uppercase tracking-wide">Action Irréversible</p></div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => { setShowResignModal(false); setSelectedLine(null); }} className="flex-1 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs uppercase rounded-lg transition-all">Annuler</button>
                  <button onClick={() => handleResign(selectedLine.id)} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase rounded-lg shadow-md shadow-red-100 transition-all">Confirmer</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ADD/EDIT FORM MODAL */}
      {(viewMode === "add" || viewMode === "edit") && isWritable && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center px-5 py-3 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">{viewMode === "add" ? "Nouvelle Ligne" : "Modifier la Ligne"}</h2>
              <button onClick={() => setViewMode("list")} className="p-1.5 hover:bg-slate-100 rounded-full transition-colors text-slate-500"><X className="w-4 h-4" /></button>
            </div>

            <div className="overflow-y-auto p-0">
              <div className="bg-gradient-to-r from-sidebar-primary to-accent text-sidebar-primary-foreground px-5 py-3 flex items-center gap-3">
                <div className="bg-white/10 p-1.5 rounded-lg backdrop-blur-sm"><Globe className="w-4 h-4 text-blue-400" /></div>
                <div><h3 className="text-white font-bold text-sm">Informations Ligne</h3><p className="text-slate-400 text-[10px]">Détails de connexion</p></div>
              </div>

              <div className="p-5 space-y-4">
                <div className="space-y-4">

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={styles.label}>Fournisseur (ISP)</label>
                      <select value={formData.operateur || ""} onChange={(e) => setFormData({ ...formData, operateur: e.target.value })} className={styles.input}>
                        <option value="">Sélectionner...</option>
                        <option value="Orange Entreprise">Orange Entreprise</option>
                        <option value="IAM">Maroc Telecom (IAM)</option>
                        <option value="Inwi Business">Inwi Business</option>
                        <option value="Starlink">Starlink</option>
                      </select>
                    </div>

                    <div>
                      <label className={styles.label}>Statut</label>
                      <select value={formData.status || "active"} onChange={(e) => setFormData({ ...formData, status: e.target.value as any })} className={styles.input}>
                        <option value="active">Actif</option>
                        <option value="inactive">Inactif</option>
                        <option value="resilier">Résilié</option>
                      </select>
                    </div>

                    <div>
                      <label className={styles.label}>Débit (Vitesse)</label>
                      <div className="relative">
                        <input type="text" value={formData.vitesse || ""} onChange={(e) => setFormData({ ...formData, vitesse: e.target.value })} style={{ paddingRight: "2.5rem" }} className={`${styles.input}`} placeholder="Ex: 100 Mbps" />
                        <Activity className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      </div>
                    </div>
                  </div>

                  <div className="h-px bg-slate-100" />

                  <div>
                    <h3 className="text-blue-600 font-bold text-xs uppercase tracking-wider mb-4 flex items-center gap-2"><MapPin className="w-4 h-4" /> Affectation Géographique</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className={styles.label}>Type d'affectation</label>
                        <select
                          className={styles.input}
                          value={affectTarget}
                          onChange={(e) => {
                            const next = e.target.value as any
                            setAffectTarget(next)
                            setFormData({
                              ...formData,
                              agenceId: next === "agence" ? formData.agenceId : undefined,
                              entrepotId: next === "entrepot" ? (formData as any).entrepotId : undefined,
                              departementId: next === "departement" ? formData.departementId : undefined,
                            } as any)
                          }}
                        >
                          <option value="none">Aucune</option>
                          <option value="agence">Agence</option>
                          <option value="entrepot">Entrepôt</option>
                          <option value="departement">Département</option>
                        </select>
                      </div>

                      {affectTarget === "agence" && (
                        <div className="md:col-span-2">
                          <label className={styles.label}>Agence</label>
                          <select className={styles.input} value={formData.agenceId || ""} onChange={(e) => setFormData({ ...formData, agenceId: parseInt(e.target.value) })}>
                            <option value="">Sélectionner...</option>
                            {agences.map(a => <option key={a.id} value={a.id}>{a.nom}</option>)}
                          </select>
                        </div>
                      )}

                      {affectTarget === "entrepot" && (
                        <div className="md:col-span-2">
                          <label className={styles.label}>Entrepôt</label>
                          <select className={styles.input} value={(formData as any).entrepotId || ""} onChange={(e) => setFormData({ ...formData, entrepotId: parseInt(e.target.value) } as any)}>
                            <option value="">Sélectionner...</option>
                            {entrepots.map(en => <option key={en.id} value={en.id}>{en.siteRef?.libeller || `Entrepôt #${en.id}`}</option>)}
                          </select>
                        </div>
                      )}

                      {affectTarget === "departement" && (
                        <div className="md:col-span-2">
                          <label className={styles.label}>Département</label>
                          <select className={styles.input} value={formData.departementId || ""} onChange={(e) => setFormData({ ...formData, departementId: parseInt(e.target.value) })}>
                            <option value="">Sélectionner...</option>
                            {departements.map(d => <option key={d.id} value={d.id}>{d.nom}</option>)}
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-end gap-2">
              <button onClick={() => setViewMode("list")} className={`px-4 py-2 ${styles.secondaryBtn}`}>Annuler</button>
              <button onClick={handleSave} className={`px-5 py-2 ${styles.primaryBtn}`}>{viewMode === "add" ? "Créer" : "Enregistrer"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const KpiCard = ({ label, value, icon: Icon, color }: any) => (<div className={`bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden`}><div className={`absolute top-0 right-0 p-4 opacity-10 text-${color}-600`}><Icon className="w-20 h-20" /></div><p className="text-slate-500 text-xs font-bold uppercase mb-2">{label}</p><p className={`text-4xl font-black text-${color}-600`}>{value}</p></div>)
