// @ts-nocheck
"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { createPortal } from "react-dom"
import api from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { exportStyledWorkbook } from "@/lib/excel-export"
import { formatDateTimeValue } from "@/lib/utils"
import { useVisiblePolling } from "@/lib/use-visible-polling"
import {
  Edit2, Trash2, Plus, X, Search, RotateCw,
  Eye, Link2, Unlink2, RefreshCw, ShieldCheck,
  User, Signal, UserCheck, Layers,
  ChevronUp, ChevronDown, ArrowUpDown,
  Cpu, Calendar, ArrowRight, Filter, Building2, Package,
  History, UserMinus, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, AlertTriangle, Check, CreditCard, Tag, FileSpreadsheet
} from "lucide-react"

// --- TYPES ---
type ViewMode = "list" | "add" | "edit" | "view"
type FilterCondition = "contains" | "startsWith" | "endsWith" | "equals"

interface FilterRule {
  id: string
  attribute: string
  condition: FilterCondition
  term: string
}

interface CarteSim {
  id: number
  sn: string
  numero: string
  operateur: string
  // --- NEW FIELDS ---
  tarif?: string
  typeForfait?: string
  // ------------------
  pin?: string
  pin2?: string
  puk?: string
  puk2?: string
  status: "active" | "inactive"
  statusAffectation: "non_affecter" | "en_attente" | "recu" | "annuler" | "affecter"
  agenceId?: number
  agenceNom?: string
  entrepotId?: number
  entrepotNom?: string
  departementId?: number
  userId?: number
  userNom?: string
  departementNom?: string
  dateEnvoie?: string
  dateCreation?: string
}

interface HistoryEntry {
  id: number
  action: string
  utilisateur: string
  agenceDepartement: string
  chefAgence: string
  date: string
}

interface Agence { id: number; nom: string }
interface Entrepot { id: number; siteRef?: { id: number; libeller: string } }
interface Departement { id: number; nom: string }
interface UserEntity { id: number; nom: string; prenom: string; matricule?: string; status?: string; departement?: { id: number }; agence?: { id: number }; entrepot?: { id: number } }

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
  paginationBtn: "p-1.5 rounded-lg border border-border hover:bg-secondary text-muted-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-all"
}

// --- OPTIMIZED SEARCHABLE SELECT ---
interface SearchableSelectProps<T> {
  options: T[]
  value: string | number | undefined
  onChange: (value: string | number) => void
  getLabel: (item: T) => string
  placeholder?: string
  disabled?: boolean
  className?: string // Added to allow padding for icons
  inputStyle?: React.CSSProperties // For inline style overrides like paddingLeft
  preferTop?: boolean
}

const SearchableSelect = <T extends { id: string | number }>({
  options, value, onChange, getLabel, placeholder = "Sélectionner...", disabled = false, className = "", inputStyle, preferTop = true
}: SearchableSelectProps<T>) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const [dropdownStyles, setDropdownStyles] = useState<React.CSSProperties>({})

  const selectedItem = options.find(o => o.id.toString() === value?.toString())

  // Performance: Memoize filter and limit results to 50 to prevent UI lag on huge lists
  const filteredOptions = useMemo(() => {
    return options.filter(item =>
      getLabel(item).toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 50) // LIMIT RENDER TO 50 ITEMS FOR SPEED
  }, [options, searchTerm, getLabel])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect()
      const dropdownHeight = 240
      const spaceBelow = window.innerHeight - rect.bottom
      const spaceAbove = rect.top
      const showAbove = preferTop ? spaceAbove > 0 : (spaceBelow < dropdownHeight && spaceAbove > spaceBelow)

      setDropdownStyles({
        position: "fixed",
        top: showAbove ? "auto" : `${rect.bottom + 4}px`,
        bottom: showAbove ? `${window.innerHeight - rect.top + 4}px` : "auto",
        left: `${rect.left}px`,
        width: `${rect.width}px`,
        zIndex: 9999
      })
    }
  }, [isOpen, filteredOptions.length, preferTop])

  return (
    <div className="relative w-full">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          disabled={disabled}
          style={{ paddingRight: "2.5rem", ...inputStyle }}
          className={`${styles.input} cursor-pointer ${disabled ? 'opacity-60 cursor-not-allowed' : ''} ${className}`}
          placeholder={selectedItem ? getLabel(selectedItem) : placeholder}
          value={isOpen ? searchTerm : (selectedItem ? getLabel(selectedItem) : "")}
          onChange={(e) => {
            if (!isOpen) setIsOpen(true)
            setSearchTerm(e.target.value)
          }}
          onClick={() => {
            if (!disabled) {
              setIsOpen(true)
              setSearchTerm("")
            }
          }}
          readOnly={!isOpen && !!selectedItem}
        />
        <ChevronDown className={`absolute right-3 top-3 w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && typeof document !== "undefined" && createPortal(
        <>
          <div className="fixed inset-0 z-[9998]" onClick={() => { setIsOpen(false); setSearchTerm(""); }} />
          <ul style={dropdownStyles} className="fixed bg-white border border-slate-200 rounded-lg shadow-xl max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((item) => (
                <li
                  key={item.id}
                  onClick={() => {
                    onChange(item.id)
                    setIsOpen(false)
                    setSearchTerm("")
                  }}
                  className={`px-3 py-2 text-xs cursor-pointer hover:bg-blue-50 transition-colors flex items-center justify-between ${item.id === value ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-700'}`}
                >
                  <span>{getLabel(item)}</span>
                  {item.id === value && <Check className="w-4 h-4" />}
                </li>
              ))
            ) : (
              <li className="px-4 py-3 text-sm text-slate-400 italic text-center">
                Aucun résultat trouvé
              </li>
            )}
          </ul>
        </>,
        document.body
      )}
    </div>
  )
}

// --- SUB-COMPONENTS ---

const SortIcon = ({ column, sortBy, sortOrder }: { column: string, sortBy: string, sortOrder: string }) => {
  // Always show the icon, just change color
  if (sortBy !== column) return <ArrowUpDown className="w-3 h-3 text-slate-300" />
  return sortOrder === "asc" ? <ChevronUp className="w-3 h-3 text-blue-600" /> : <ChevronDown className="w-3 h-3 text-blue-600" />
}

const SortableTh = ({ label, sortKey, sortBy, sortOrder, onClick }: { label: string, sortKey: string, sortBy: string, sortOrder: string, onClick: (k: string) => void }) => (
  <th onClick={() => onClick(sortKey)} className={`${styles.th} cursor-pointer hover:bg-slate-100 hover:text-blue-600 transition-colors group`}>
    <div className="flex items-center gap-2">{label} <SortIcon column={sortKey} sortBy={sortBy} sortOrder={sortOrder} /></div>
  </th>
)

const FilterToolbar = ({ filters, setFilters, attributes }: { filters: FilterRule[], setFilters: any, attributes: { value: string, label: string }[] }) => {
  const addFilter = () => setFilters([...filters, { id: Date.now().toString(), attribute: attributes[0].value, condition: "contains", term: "" }])
  const removeFilter = (id: string) => { if (filters.length === 1) return; setFilters(filters.filter(f => f.id !== id)) }
  const updateFilter = (id: string, field: keyof FilterRule, value: string) => setFilters(filters.map(f => f.id === id ? { ...f, [field]: value } : f))

  return (
    <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-200 space-y-2">
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
            <option value="contains">Contient</option><option value="startsWith">Commence par</option><option value="endsWith">Finit par</option><option value="equals">Est égal à </option>
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

// --- OPTIMIZED PAGINATION WITH INPUT ---
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
        <button onClick={() => setPage(1)} disabled={current === 1} className={styles.paginationBtn}><ChevronsLeft className="w-4 h-4" /></button>
        <button onClick={() => setPage(current - 1)} disabled={current === 1} className={styles.paginationBtn}><ChevronLeft className="w-4 h-4" /></button>

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

        <button onClick={() => setPage(current + 1)} disabled={current === total || total === 0} className={styles.paginationBtn}><ChevronRight className="w-4 h-4" /></button>
        <button onClick={() => setPage(total)} disabled={current === total || total === 0} className={styles.paginationBtn}><ChevronsRight className="w-4 h-4" /></button>
      </div>
    </div>
  )
}

// --- MAIN COMPONENT ---

export default function AssetsSIMPage() {
  const { user } = useAuth()
  const isWritable = user?.role === "Administrateur"

  // --- STATE ---
  const [sims, setSims] = useState<CarteSim[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>("list")

  // Filters & Sorting (Main Table)
  const [filters, setFilters] = useState<FilterRule[]>([{ id: "1", attribute: "numero", condition: "contains", term: "" }])
  const [sortBy, setSortBy] = useState("numero")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // History & Detail View
  const [selectedSim, setSelectedSim] = useState<CarteSim | null>(null)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [historyFilters, setHistoryFilters] = useState<FilterRule[]>([{ id: "h1", attribute: "action", condition: "contains", term: "" }])
  const [historyPage, setHistoryPage] = useState(1)
  const [isExportingHistory, setIsExportingHistory] = useState(false)

  // History Sorting (NEW)
  const [historySortBy, setHistorySortBy] = useState("date")
  const [historySortOrder, setHistorySortOrder] = useState<"asc" | "desc">("desc") // Default newest first

  // Forms & Errors
  const [formData, setFormData] = useState<Partial<CarteSim>>({})
  const [showAffectModal, setShowAffectModal] = useState(false)
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [affectMode, setAffectMode] = useState<string>("user_agence")
  // Dropdowns
  const [agences, setAgences] = useState<Agence[]>([])
  const [entrepots, setEntrepots] = useState<Entrepot[]>([])
  const [departements, setDepartements] = useState<Departement[]>([])
  const [usersList, setUsersList] = useState<UserEntity[]>([])
  const [affectTab, setAffectTab] = useState<"agence" | "entrepot" | "departement">("agence")
  const [selectedAgenceId, setSelectedAgenceId] = useState<string>("")
  const [selectedEntrepotId, setSelectedEntrepotId] = useState<string>("")
  const [selectedDeptId, setSelectedDeptId] = useState<string>("")
  const [targetUserId, setTargetUserId] = useState<string>("")

  // --- INITIAL LOAD ---
  useEffect(() => {
    fetchSims()
    fetchDropdownData()
  }, [])

  useVisiblePolling(() => fetchSims(), 4000, [])

  useVisiblePolling(() => {
    if (viewMode === "view" && selectedSim?.id) {
      void fetchSimHistory(selectedSim.id)
    }
  }, 4000, [viewMode, selectedSim?.id])

  const fetchSims = async () => {
    try {
      if (sims.length === 0) {
        setLoading(true)
      }
      const res = await api.get("/cartesims")
      setSims(Array.isArray(res.data) ? res.data : [])
    } catch (e) { console.error(e); setSims([]) }
    finally { setLoading(false) }
  }

  const fetchDropdownData = async () => {
    try {
      const resAgences = await api.get("/agences").catch(() => ({ data: [] }))
      setAgences(Array.isArray(resAgences.data) ? resAgences.data : [])

      const resEntrepots = await api.get("/entrepots").catch(() => ({ data: [] }))
      setEntrepots(Array.isArray(resEntrepots.data) ? resEntrepots.data : [])

      const resDepts = await api.get("/departements").catch(err => ({ data: [] }))
      setDepartements(Array.isArray(resDepts.data) ? resDepts.data : [])

      const resUsers = await api.get("/users").catch(() => ({ data: [] }))
      setUsersList(Array.isArray(resUsers.data) ? resUsers.data : [])
    } catch (e) { console.error(e) }
  }

  const fetchSimHistory = async (simId: number) => {
    try {
      const res = await api.get("/historique-cartesim")
      const simHistory = Array.isArray(res.data) ? res.data
        .filter((h: any) => h.materiel?.id === simId)
        .map((h: any) => ({
          id: h.id,
          action: h.statusEvent,
          utilisateur: (h.userNom && h.userPrenom)
            ? `${h.userNom} ${h.userPrenom}`
            : (h.user ? `${h.user.nom} ${h.user.prenom}` : "Systéme / Stock"),
          entrepotNom: h.entrepotNom || (h.entrepot?.siteRef?.libeller) || null,
          agenceNom: h.agenceNom || h.agence?.nom || null,
          departementNom: h.departementNom || h.departement?.nom || null,
          chefAgence: h.chefAgenceNom || "-",
          date: h.dateEvent
        })) : []
      setHistory(simHistory)
    } catch (e) { setHistory([]) }
  }

  // --- LOGIC ---
  const availableUsers = useMemo(() => {
    if (!Array.isArray(usersList)) return []
    const eligibleUsers = usersList.filter(u => (u.status || "").toLowerCase() !== "archived")

    if (affectTab === "agence") {
      if (!selectedAgenceId) return []
      return eligibleUsers.filter(u => {
        const userAgenceId = typeof u.agence === "object" ? u.agence?.id : (u as any).agence
        return userAgenceId?.toString() === selectedAgenceId
      })
    }

    if (affectTab === "entrepot") {
      if (!selectedEntrepotId) return []
      return eligibleUsers.filter(u => {
        const userEntrepotId = typeof u.entrepot === "object" ? u.entrepot?.id : (u as any).entrepot
        return userEntrepotId?.toString() === selectedEntrepotId
      })
    }

    // departement
    if (!selectedDeptId) return []
    return eligibleUsers.filter(u => {
      const userDeptId = typeof u.departement === "object" ? u.departement?.id : (u as any).departement
      return userDeptId?.toString() === selectedDeptId
    })
  }, [usersList, affectTab, selectedAgenceId, selectedEntrepotId, selectedDeptId])

  const getFieldValue = (item: any, attribute: string): string => {
    if (attribute === 'agenceDepartement') {
      return `${item.entrepotNom || ''} ${item.agenceNom || ''} ${item.departementNom || ''}`.toLowerCase();
    }
    if (item[attribute] === null || item[attribute] === undefined) return "";
    return item[attribute].toString().toLowerCase();
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

  // --- MAIN TABLE SORTING ---
  const filteredSims = applyFilters(sims, filters);
  const sortedSims = [...filteredSims].sort((a, b) => {
    // @ts-ignore
    const aVal = getFieldValue(a, sortBy)
    // @ts-ignore
    const bVal = getFieldValue(b, sortBy)
    const comparison = aVal.localeCompare(bVal)
    return sortOrder === "asc" ? comparison : -comparison
  })

  const totalPages = Math.ceil(sortedSims.length / itemsPerPage);
  const paginatedSims = sortedSims.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // --- HISTORY TABLE SORTING (NEW) ---
  const filteredHistory = applyFilters(history, historyFilters);
  const sortedHistory = [...filteredHistory].sort((a, b) => {
    // @ts-ignore
    const aVal = a[historySortBy]
    // @ts-ignore
    const bVal = b[historySortBy]

    // Handle Dates specially
    if (historySortBy === 'date') {
      const dateA = new Date(aVal).getTime()
      const dateB = new Date(bVal).getTime()
      return historySortOrder === 'asc' ? dateA - dateB : dateB - dateA
    }

    // Handle strings
    const comparison = String(aVal).localeCompare(String(bVal))
    return historySortOrder === 'asc' ? comparison : -comparison
  })

  const totalHistoryPages = Math.ceil(sortedHistory.length / itemsPerPage);
  const paginatedHistory = sortedHistory.slice((historyPage - 1) * itemsPerPage, historyPage * itemsPerPage);

  const kpiTotal = sims.length;
  const kpiActive = sims.filter(s => s.status === "active").length;
  const kpiAffected = sims.filter(s => s.userId).length;
  const isAssigned = (sim: CarteSim | null) => !!(sim?.userId || sim?.departementId);
  // --- HANDLERS ---
  const handleSortClick = (attr: string) => {
    if (sortBy === attr) setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    else { setSortBy(attr); setSortOrder("asc") }
  }

  // New handler for History sorting
  const handleHistorySortClick = (attr: string) => {
    if (historySortBy === attr) setHistorySortOrder(historySortOrder === "asc" ? "desc" : "asc")
    else { setHistorySortBy(attr); setHistorySortOrder("asc") }
  }

  const formatExportDate = (value?: string) => {
    return formatDateTimeValue(value, "-")
  }

  const handleExportHistory = async () => {
    if (!selectedSim || !sortedHistory.length) return
    setIsExportingHistory(true)
    try {
      await exportStyledWorkbook({
        fileName: `historique_sim_${selectedSim.numero || selectedSim.id}`,
        subject: "Historique SIM",
        sheets: [
          {
            name: "Historique SIM",
            title: `Carte SIM : ${selectedSim.numero || selectedSim.id}`,
            subtitle: `Operateur : ${selectedSim.operateur || "-"} | SN : ${selectedSim.sn || "-"}`,
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

  const handleAdd = () => {
    setFormData({ status: "active", statusAffectation: "non_affecter" })
    setViewMode("add")
  }

  const handleEdit = (sim: CarteSim) => {
    setFormData({ ...sim })
    setViewMode("edit")
  }

  const handleView = async (sim: CarteSim) => {
    setSelectedSim(sim)
    setViewMode("view")
    setHistoryPage(1)
    await fetchSimHistory(sim.id)
  }

  const handleSave = async () => {
    try {
      const payload = {
        ...formData,
        statusAffectation: formData.statusAffectation || "non_affecter"
      }
      if (viewMode === "add") {
        await api.post("/cartesims", payload)
      } else if (viewMode === "edit" && formData.id) {
        await api.put(`/cartesims/${formData.id}`, payload)
      }
      fetchSims()
      setViewMode("list")
    } catch (e) {
      console.error(e)
      setErrorMessage("Erreur lors de l'enregistrement de la Carte SIM.")
      setShowErrorModal(true)
    }
  }

  const handleDelete = async (id: number) => {
    if (confirm("êtes-vous sûr de vouloir supprimer cet élément?")) {
      try {
        await api.delete(`/cartesims/${id}`)
        fetchSims()
      } catch (e) {
        setErrorMessage("Impossible de supprimer cet élément.")
        setShowErrorModal(true)
      }
    }
  }

  const handleAffect = async () => {
    if (!selectedSim || !targetUserId) return
    try {
      const payload: any = {
        materielId: selectedSim.id,
        userId: parseInt(targetUserId)
      }
      if (affectTab === "agence" && selectedAgenceId) payload.agenceId = parseInt(selectedAgenceId)
      if (affectTab === "entrepot" && selectedEntrepotId) payload.entrepotId = parseInt(selectedEntrepotId)
      if (affectTab === "departement" && selectedDeptId) payload.departementId = parseInt(selectedDeptId)

      await api.post("/cartesims/assign", {
        ...payload
      })
      fetchSims()
      setShowAffectModal(false)
      resetSelection()
    } catch (e: any) {
      if (e.response && (e.response.status === 500 || e.response.status === 400 || e.response.status === 409) &&
        (typeof e.response.data === 'string' ||
          typeof e.response.data.message === 'string' && e.response.data.message.includes("posséde déjà "))) {
        setErrorMessage(e.response.data.message || "Cet utilisateur posséde déjà  une Carte SIM active. Affectation impossible.");
      } else {
        setErrorMessage("Une erreur est survenue lors de l'affectation de la carte.");
      }
      setShowErrorModal(true);
    }
  }

  const handleUnassign = async (id: number) => {
    if (confirm("Désaffecter cette carte de l'utilisateur ?")) {
      try {
        await api.post(`/cartesims/unassign/${id}`)
        fetchSims()
      } catch (e) {
        setErrorMessage("Erreur lors de la désaffectation de la carte.");
        setShowErrorModal(true);
      }
    }
  }

  const resetSelection = () => {
    setAffectTab("agence")
    setSelectedAgenceId("")
    setSelectedEntrepotId("")
    setSelectedDeptId("")
    setTargetUserId("")
  }

  // 1. FORM VIEW (ADD / EDIT) logic has been moved to a modal below

  // --- 2. VIEW DETAILS VIEW ---
  if (viewMode === "view" && selectedSim) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans text-slate-600">
        <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-4">
          <div className="flex justify-between items-center pb-4 border-b border-slate-200">
            <button onClick={() => setViewMode("list")} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors font-medium text-sm">
              <ArrowRight className="w-4 h-4 rotate-180" /> Retour à la liste
            </button>
            {isWritable && (
              <div className="flex gap-2">
                {/* <button onClick={() => setShowAffectModal(true)} className={`px-4 py-2 flex items-center gap-2 text-sm ${styles.primaryBtn}`}>
                        <RefreshCw className="w-4 h-4" /> Gérer l'affectation
                     </button>
                     <button onClick={() => handleEdit(selectedSim)} className={`px-4 py-2 flex items-center gap-2 text-sm ${styles.secondaryBtn}`}>
                        <Edit2 className="w-4 h-4" /> Modifier
                     </button> */}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4 space-y-4">
              {/* Asset Info Card */}
              <div className={`${styles.card} relative overflow-hidden group`}>
                <div className="h-16 bg-slate-900 relative">
                  <div className="absolute inset-0 bg-blue-600/10" />
                  <div className="absolute -bottom-6 left-4 p-2 bg-white rounded-xl shadow-lg border border-slate-100">
                    <Cpu className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <div className="pt-8 px-4 pb-4">
                  <h1 className="text-lg font-bold text-slate-900 tracking-tight">{selectedSim.numero}</h1>
                  <p className="text-xs text-slate-500 font-medium mb-4">{selectedSim.operateur}</p>

                  <div className="space-y-1.5">
                    <div className="flex justify-between py-1.5 border-b border-slate-50">
                      <span className="text-xs font-medium text-slate-500">Statut</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${selectedSim.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                        {selectedSim.status}
                      </span>
                    </div>

                    {/* --- NEW DETAILS DISPLAY --- */}
                    <div className="flex justify-between py-1.5 border-b border-slate-50">
                      <span className="text-xs font-medium text-slate-500">Type Forfait</span>
                      <span className="text-xs font-semibold text-slate-700">{selectedSim.typeForfait || "-"}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-50">
                      <span className="text-xs font-medium text-slate-500">Tarif</span>
                      <span className="text-xs font-semibold text-slate-700">{selectedSim.tarif ? `${selectedSim.tarif}` : "-"}</span>
                    </div>
                    {/* --------------------------- */}

                    <div className="flex justify-between py-1.5 border-b border-slate-50">
                      <span className="text-xs font-medium text-slate-500">PIN</span>
                      <span className="font-mono text-xs font-semibold text-slate-700">{selectedSim.pin || "N/A"}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-50">
                      <span className="text-xs font-medium text-slate-500">PUK</span>
                      <span className="font-mono text-xs font-semibold text-slate-700">{selectedSim.puk || "N/A"}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-50">
                      <span className="text-xs font-medium text-slate-500">Agence</span>
                      <span className="text-xs font-semibold text-slate-700">{selectedSim.agenceNom || "N/A"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Affectation Card */}
              <div className={styles.card}>
                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                  <h3 className="font-semibold text-slate-700 text-xs uppercase">Utilisateur Actuel</h3>
                  <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <div className="p-4">
                  {selectedSim.userId ? (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm border border-blue-200">
                        {selectedSim.userNom?.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 text-sm leading-tight">{selectedSim.userNom}</p>
                        <p className="text-slate-500 text-[10px] mt-0.5">{selectedSim.departementNom}</p>
                        <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-emerald-600 font-mono font-medium bg-emerald-50 px-2 py-0.5 rounded w-fit">
                          <Calendar className="w-3 h-3" /> Depuis {formatDateTimeValue(selectedSim.dateEnvoie, "N/A")}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-2 text-center">
                      <div className="w-10 h-10 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-2">
                        <Package className="w-5 h-5" />
                      </div>
                      <p className="font-semibold text-sm text-slate-700">En Stock</p>
                      <p className="text-[10px] text-slate-400">Disponible pour affectation</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="lg:col-span-8 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2"><History className="w-5 h-5 text-blue-600" /> Historique des mouvements</h2>
                <button
                  onClick={handleExportHistory}
                  disabled={isExportingHistory || sortedHistory.length === 0}
                  className="px-3 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-xs font-bold flex items-center gap-2"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  {isExportingHistory ? "Export..." : "Exporter Excel"}
                </button>
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
                  { value: "chefAgence", label: "Chef Agence" }
                ]}
              />

              <div className={`${styles.card} border-0 shadow-md overflow-hidden`}>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead>
                      {/* UPDATED HISTORY HEADERS WITH SORTING */}
                      <tr>
                        <SortableTh label="Action" sortKey="action" sortBy={historySortBy} sortOrder={historySortOrder} onClick={handleHistorySortClick} />
                        <SortableTh label="Utilisateur" sortKey="utilisateur" sortBy={historySortBy} sortOrder={historySortOrder} onClick={handleHistorySortClick} />
                        <SortableTh label="Entrepôt" sortKey="entrepotNom" sortBy={historySortBy} sortOrder={historySortOrder} onClick={handleHistorySortClick} />
                        <SortableTh label="Agence" sortKey="agenceNom" sortBy={historySortBy} sortOrder={historySortOrder} onClick={handleHistorySortClick} />
                        <SortableTh label="Département" sortKey="departementNom" sortBy={historySortBy} sortOrder={historySortOrder} onClick={handleHistorySortClick} />
                        <SortableTh label="Chef Agence" sortKey="chefAgence" sortBy={historySortBy} sortOrder={historySortOrder} onClick={handleHistorySortClick} />
                        <SortableTh label="Date" sortKey="date" sortBy={historySortBy} sortOrder={historySortOrder} onClick={handleHistorySortClick} />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {paginatedHistory.map((entry) => (
                        <tr key={entry.id} className="hover:bg-blue-50/30 transition-colors group">
                          <td className="px-4 py-2"><span className={`inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider ${entry.action === 'CREATION' ? 'bg-slate-50 text-slate-600 border-slate-200' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>{entry.action}</span></td>
                          <td className={`${styles.td} font-medium text-slate-900`}>{entry.utilisateur}</td>
                          <td className={styles.td}>{entry.entrepotNom || "-"}</td>
                          <td className={styles.td}>{entry.agenceNom || "-"}</td>
                          <td className={styles.td}>{entry.departementNom || "-"}</td>
                          <td className={styles.td}>{entry.chefAgence}</td>
                          <td className={`${styles.td} text-right font-mono text-slate-500`}>{formatDateTimeValue(entry.date, "-")}</td>
                        </tr>
                      ))}
                      {paginatedHistory.length === 0 && <tr><td colSpan={7} className="p-12 text-center text-slate-400 italic">Aucun historique disponible</td></tr>}
                    </tbody>
                  </table>
                </div>
                <Pagination current={historyPage} total={totalHistoryPages} setPage={setHistoryPage} />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // --- 3. LIST VIEW (Default Dashboard) ---
  return (
    <div className={styles.pageBg}>
      {/* â”€â”€â”€ Page Header â”€â”€â”€ */}
      <div className={styles.header}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 gradient-primary rounded-xl flex items-center justify-center text-white shadow-md shadow-primary/20"><Cpu className="w-5 h-5" /></div>
            <div>
              <h1 className="text-lg font-bold text-foreground leading-none tracking-tight">Cartes Sim</h1>
              <p className="text-[11px] text-muted-foreground mt-0.5">{kpiTotal} cartes au total {kpiActive} actives</p>
            </div>
          </div>
          {isWritable && <button onClick={handleAdd} className={`px-4 py-2.5 flex items-center gap-2 ${styles.primaryBtn}`}><Plus className="w-3.5 h-3.5" /> Nouvelle Carte</button>}
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 lg:p-5 space-y-5">
        {/* â”€â”€â”€ KPI Cards â”€â”€â”€ */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card p-4 rounded-xl border border-border shadow-sm relative overflow-hidden group hover:border-primary/30 hover:shadow-md transition-all card-hover">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary" />
            <div className="absolute top-0 right-0 p-3 opacity-[0.06] group-hover:opacity-[0.12] transition-opacity"><Layers className="w-16 h-16 text-foreground" /></div>
            <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider mb-1">Total Cartes</p><p className="text-3xl font-black text-foreground tabular-nums">{kpiTotal}</p>
          </div>
          <div className="bg-card p-4 rounded-xl border border-border shadow-sm relative overflow-hidden group hover:border-emerald-400/30 hover:shadow-md transition-all card-hover">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-emerald-500" />
            <div className="absolute top-0 right-0 p-3 opacity-[0.06] group-hover:opacity-[0.12] transition-opacity"><Signal className="w-16 h-16 text-emerald-600" /></div>
            <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider mb-1">Lignes Actives</p><p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">{kpiActive}</p>
          </div>
          <div className="bg-card p-4 rounded-xl border border-border shadow-sm relative overflow-hidden group hover:border-blue-400/30 hover:shadow-md transition-all card-hover">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-500" />
            <div className="absolute top-0 right-0 p-3 opacity-[0.06] group-hover:opacity-[0.12] transition-opacity"><UserCheck className="w-16 h-16 text-blue-600" /></div>
            <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider mb-1">Affectées</p><p className="text-3xl font-black text-blue-600 dark:text-blue-400 tabular-nums">{kpiAffected}</p>
          </div>
        </div>

        {/* â”€â”€â”€ Section: Filtres â”€â”€â”€ */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">Filtres de recherche</h2>
            <span className="text-xs text-muted-foreground">Affinez les résultats</span>
          </div>
          <FilterToolbar
            filters={filters}
            setFilters={setFilters}
            attributes={[
              { value: "numero", label: "Numéro" },
              { value: "operateur", label: "Opérateur" },
              { value: "userNom", label: "Utilisateur" },
              { value: "status", label: "Statut" },
              { value: "entrepotNom", label: "Entrepôt" },
              { value: "agenceNom", label: "Agence" },
              { value: "departementNom", label: "Département" }
            ]}
          />
        </div>

        {/* â”€â”€â”€ Section: Inventaire â”€â”€â”€ */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">Inventaire des Cartes SIM</h2>
              <span className="text-xs text-muted-foreground ml-1">{sortedSims.length} résultat{sortedSims.length !== 1 ? "s" : ""}</span>
            </div>
            <button onClick={() => fetchSims()} className="btn btn-ghost btn-sm text-muted-foreground hover:text-foreground"><RotateCw className="w-3.5 h-3.5" /> Actualiser</button>
          </div>
          <div className={`${styles.card} card-hover`}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px]">
                <thead>
                  <tr>
                    <SortableTh label="Numéro" sortKey="numero" sortBy={sortBy} sortOrder={sortOrder} onClick={handleSortClick} />
                    <SortableTh label="Opérateur" sortKey="operateur" sortBy={sortBy} sortOrder={sortOrder} onClick={handleSortClick} />
                    <SortableTh label="Entrepôt" sortKey="entrepotNom" sortBy={sortBy} sortOrder={sortOrder} onClick={handleSortClick} />
                    <SortableTh label="Agence" sortKey="agenceNom" sortBy={sortBy} sortOrder={sortOrder} onClick={handleSortClick} />
                    <SortableTh label="Département" sortKey="departementNom" sortBy={sortBy} sortOrder={sortOrder} onClick={handleSortClick} />
                    <SortableTh label="Affecté à " sortKey="userNom" sortBy={sortBy} sortOrder={sortOrder} onClick={handleSortClick} />
                    <SortableTh label="Statut" sortKey="status" sortBy={sortBy} sortOrder={sortOrder} onClick={handleSortClick} />
                    <th className={`${styles.th} text-right`}>Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50 bg-card">
                  {paginatedSims.map((sim) => (
                    <tr key={sim.id} className="hover:bg-secondary/50 transition-colors group">
                      <td className="px-4 py-2.5"><div className="flex items-center gap-3"><div className="w-6 h-6 rounded-full bg-secondary text-muted-foreground flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-colors"><Cpu className="w-3 h-3" /></div><span className="font-bold text-foreground font-mono text-xs">{sim.numero}</span></div></td>
                      <td className="px-4 py-2.5"><span className="badge badge-neutral text-[10px] uppercase">{sim.operateur}</span></td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground">{sim.entrepotNom || "-"}</td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground">{sim.agenceNom || "-"}</td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground">{sim.departementNom || "-"}</td>
                      <td className="px-4 py-2.5">{sim.userId ? <div className="flex items-center gap-2 text-xs font-medium text-foreground"><div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">{sim.userNom?.charAt(0)}</div>{sim.userNom}</div> : <span className="text-muted-foreground text-[10px] italic">Stock</span>}</td>
                      <td className="px-4 py-2.5">{sim.status === "active" ? <span className="badge badge-success gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400 animate-pulse"></span> Actif</span> : <span className="badge badge-danger">Inactif</span>}</td>
                      <td className="px-4 py-2.5 text-right">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => handleView(sim)} className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-all" title="Voir"><Eye className="w-3.5 h-3.5" /></button>
                          {isWritable && (
                            <>
                              <button onClick={() => { setSelectedSim(sim); setShowAffectModal(true); }} className={`p-1.5 rounded-lg transition-all ${sim.userId ? 'text-muted-foreground hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/10' : 'text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10'}`} title={sim.userId ? "Réaffecter" : "Affecter"}>{sim.userId ? <RefreshCw className="w-3.5 h-3.5" /> : <Link2 className="w-3.5 h-3.5" />}</button>
                              <button onClick={() => handleEdit(sim)} className="p-1.5 text-muted-foreground hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-all" title="Modifier"><Edit2 className="w-3.5 h-3.5" /></button>
                              <button onClick={() => handleDelete(sim.id)} className="p-1.5 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all" title="Supprimer"><Trash2 className="w-3.5 h-3.5" /></button>
                              {sim.userId && <button onClick={() => handleUnassign(sim.id)} className="p-1.5 text-muted-foreground hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-500/10 rounded-lg transition-all" title="Désaffecter"><Unlink2 className="w-3.5 h-3.5" /></button>}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {paginatedSims.length === 0 && <tr><td colSpan={8} className="p-12 text-center text-muted-foreground"><Search className="w-12 h-12 mx-auto mb-3 opacity-20" /><p>Aucun résultat.</p></td></tr>}
                </tbody>
              </table>
              {totalPages > 1 && <Pagination current={currentPage} total={totalPages} setPage={setCurrentPage} />}
            </div>
          </div>
        </div>
      </div>

      {showAffectModal && selectedSim && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 translate-x-30">
            <div className="bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 leading-tight">{selectedSim.userId ? "Réaffectation" : "Affectation"}</h2>
                <p className="text-slate-500 text-[10px]">Ligne <span className="font-mono text-blue-600 font-bold">{selectedSim.numero}</span></p>
              </div>
              <button onClick={() => { setShowAffectModal(false); resetSelection(); }} className="bg-slate-50 p-1.5 rounded-full hover:bg-slate-100 transition-colors">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto max-h-[75vh]">
              {selectedSim.userId && (
                <div className="mb-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <h3 className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-2">
                    <UserMinus className="w-3.5 h-3.5" /> Propriétaire Actuel
                  </h3>
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Agence</label>
                        <input type="text" value={selectedSim.agenceNom || "-"} disabled className="w-full text-xs py-1 px-2 bg-slate-100 border border-slate-200 rounded text-slate-700" />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Entrepôt</label>
                        <input type="text" value={selectedSim.entrepotNom || "-"} disabled className="w-full text-xs py-1 px-2 bg-slate-100 border border-slate-200 rounded text-slate-700" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Département</label>
                        <input type="text" value={selectedSim.departementNom || "-"} disabled className="w-full text-xs py-1 px-2 bg-slate-100 border border-slate-200 rounded text-slate-700" />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Utilisateur</label>
                        <input type="text" value={selectedSim.userNom || "-"} disabled className="w-full text-xs py-1 px-2 bg-slate-100 border border-slate-200 rounded text-slate-700 font-medium" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wide border-b border-slate-100 pb-1.5">
                  {selectedSim.userId ? "Nouveau Bénéficiaire" : "Sélection du bénéficiaire"}
                </h3>

                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    onClick={() => { setAffectTab("agence"); setSelectedEntrepotId(""); setSelectedDeptId(""); setTargetUserId(""); }}
                    className={`py-1.5 rounded-lg text-[10px] font-bold border transition-all ${affectTab === "agence" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"}`}
                  >
                    Par agence
                  </button>
                  <button
                    onClick={() => { setAffectTab("entrepot"); setSelectedAgenceId(""); setSelectedDeptId(""); setTargetUserId(""); }}
                    className={`py-1.5 rounded-lg text-[10px] font-bold border transition-all ${affectTab === "entrepot" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"}`}
                  >
                    Par entrepôt
                  </button>
                  <button
                    onClick={() => { setAffectTab("departement"); setSelectedAgenceId(""); setSelectedEntrepotId(""); setTargetUserId(""); }}
                    className={`py-1.5 rounded-lg text-[10px] font-bold border transition-all ${affectTab === "departement" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"}`}
                  >
                    Par département
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-700 block mb-1">
                      {affectTab === "agence" ? "1. Agence" : affectTab === "entrepot" ? "1. Entrepôt" : "1. Département"}
                    </label>

                    {affectTab === "agence" && (
                      <div className="relative">
                        <Building2 className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 z-10" />
                        <SearchableSelect
                          options={agences}
                          value={selectedAgenceId}
                          onChange={(val) => { setSelectedAgenceId(String(val)); setTargetUserId(""); }}
                          getLabel={(a) => a.nom}
                          placeholder="Choisir l'agence..."
                          inputStyle={{ paddingLeft: "2rem", fontSize: "0.75rem", height: "2rem" }}
                        />
                      </div>
                    )}

                    {affectTab === "entrepot" && (
                      <div className="relative">
                        <Package className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 z-10" />
                        <SearchableSelect
                          options={entrepots}
                          value={selectedEntrepotId}
                          onChange={(val) => { setSelectedEntrepotId(String(val)); setTargetUserId(""); }}
                          getLabel={(e) => e.siteRef?.libeller || `Entrepôt #${e.id}`}
                          placeholder="Choisir l'entrepôt..."
                          inputStyle={{ paddingLeft: "2rem", fontSize: "0.75rem", height: "2rem" }}
                        />
                      </div>
                    )}

                    {affectTab === "departement" && (
                      <div className="relative">
                        <Layers className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 z-10" />
                        <SearchableSelect
                          options={departements}
                          value={selectedDeptId}
                          onChange={(val) => { setSelectedDeptId(String(val)); setTargetUserId(""); }}
                          getLabel={(d) => d.nom}
                          placeholder="Choisir le département..."
                          inputStyle={{ paddingLeft: "2rem", fontSize: "0.75rem", height: "2rem" }}
                        />
                      </div>
                    )}
                  </div>

                  <div className={(affectTab === "agence" ? !!selectedAgenceId : affectTab === "entrepot" ? !!selectedEntrepotId : !!selectedDeptId) ? "opacity-100 transition-opacity" : "opacity-40 pointer-events-none transition-opacity"}>
                    <label className="text-[10px] font-semibold text-slate-700 block mb-1">2. Collaborateur</label>
                    <div className="relative">
                      <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 z-10" />
                      <SearchableSelect
                        options={availableUsers}
                        value={targetUserId}
                        onChange={(val) => setTargetUserId(String(val))}
                        getLabel={(u) => `${(u as any).matricule || '???'} - ${u.nom} ${u.prenom}`}
                        placeholder="Chercher par nom ou matricule..."
                        inputStyle={{ paddingLeft: "2rem", fontSize: "0.75rem", height: "2rem" }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 px-4 py-3 border-t border-slate-100 flex gap-2">
              <button onClick={() => { setShowAffectModal(false); resetSelection(); }} className="flex-1 py-1.5 text-xs font-bold bg-white text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                Annuler
              </button>
              <button onClick={handleAffect} disabled={!targetUserId} className="flex-1 py-1.5 text-xs font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:text-slate-500 transition-colors">
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      {showErrorModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-red-200 w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"><AlertTriangle className="w-8 h-8 text-red-600" /></div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Erreur</h3>
              <p className="text-slate-500 mb-2 font-medium">{errorMessage}</p>
              <p className="text-xs text-slate-400">Veuillez vérifier les informations avant de réessayer.</p>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-center"><button onClick={() => setShowErrorModal(false)} className="px-6 py-2 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 transition-colors w-full">Compris</button></div>
          </div>
        </div>
      )}

      {/* ADD/EDIT FORM MODAL */}
      {
        (viewMode === "add" || viewMode === "edit") && isWritable && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 translate-x-30">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[80vh] translate-x-[8vw] translate-y-[vh]">
              <div className="flex justify-between items-center px-5 py-3 border-b border-slate-100">
                <h2 className="text-lg font-bold text-slate-900">{viewMode === "add" ? "Nouvelle Carte SIM" : "Modifier la Carte"}</h2>
                <button onClick={() => setViewMode("list")} className="p-1.5 hover:bg-slate-100 rounded-full transition-colors text-slate-500"><X className="w-4 h-4" /></button>
              </div>

              <div className="overflow-y-auto p-0">
                <div className="bg-gradient-to-r from-sidebar-primary to-accent text-sidebar-primary-foreground px-5 py-3 flex items-center gap-3">
                  <div className="bg-white/10 p-1.5 rounded-lg backdrop-blur-sm"><Cpu className="w-4 h-4 text-blue-400" /></div>
                  <div><h3 className="text-white font-bold text-sm">Informations Techniques</h3><p className="text-slate-400 text-[10px]">Saisissez les détails de l'actif</p></div>
                </div>

                <div className="p-5 space-y-4">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className={styles.label}>Numéro de Ligne</label>
                        <div className="relative">
                          <Cpu className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input type="text" value={formData.numero || ""} onChange={(e) => setFormData({ ...formData, numero: e.target.value })} style={{ paddingLeft: "2.5rem" }} className={`${styles.input} font-mono`} placeholder="06..." />
                        </div>
                      </div>
                      <div><label className={styles.label}>Numéro Série (SN)</label><input type="text" value={formData.sn || ""} onChange={(e) => setFormData({ ...formData, sn: e.target.value })} className={styles.input} /></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className={styles.label}>Opérateur</label>
                        <SearchableSelect
                          options={[{ id: 'Orange', nom: 'Orange' }, { id: 'IAM', nom: 'IAM' }, { id: 'Inwi', nom: 'Inwi' }]}
                          value={formData.operateur}
                          onChange={(val) => setFormData({ ...formData, operateur: String(val) })}
                          getLabel={(o) => o.nom}
                          placeholder="Choisir..."
                        />
                      </div>
                      <div>
                        <label className={styles.label}>Statut Actuel</label>
                        <SearchableSelect
                          options={[{ id: 'active', nom: 'Actif (En service)' }, { id: 'inactive', nom: 'Inactif (Stock)' }]}
                          value={formData.status}
                          onChange={(val) => setFormData({ ...formData, status: val as any })}
                          getLabel={(s) => s.nom}
                          placeholder="Choisir..."
                        />
                      </div>
                    </div>

                    {/* --- NEW INPUTS FOR TARIF & TYPE FORFAIT --- */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className={styles.label}>Type Forfait</label>
                        <div className="relative">
                          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="text"
                            value={formData.typeForfait || ""}
                            onChange={(e) => setFormData({ ...formData, typeForfait: e.target.value })}
                            style={{ paddingLeft: "2.5rem" }} className={`${styles.input}`}
                            placeholder="Ex: Forfait Entreprise 30Go"
                          />
                        </div>
                      </div>
                      <div>
                        <label className={styles.label}>Tarif</label>
                        <div className="relative">
                          <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="text"
                            value={formData.tarif || ""}
                            onChange={(e) => setFormData({ ...formData, tarif: e.target.value })}
                            style={{ paddingLeft: "2.5rem" }} className={`${styles.input}`}
                            placeholder="-"
                          />
                        </div>
                      </div>
                    </div>
                    {/* ------------------------------------------- */}

                  </div>

                  <div className="h-px bg-slate-100" />

                  <div>
                    <h4 className="flex items-center gap-2 font-bold text-slate-900 mb-4 text-sm"><ShieldCheck className="w-4 h-4 text-blue-600" /> Codes de Sécurité</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 bg-slate-50 rounded-xl border border-slate-100">
                      <div><label className={styles.label}>Code PIN</label><input type="text" value={formData.pin || ""} onChange={(e) => setFormData({ ...formData, pin: e.target.value })} className={`${styles.input} font-mono text-center`} maxLength={4} /></div>
                      <div><label className={styles.label}>Code PUK</label><input type="text" value={formData.puk || ""} onChange={(e) => setFormData({ ...formData, puk: e.target.value })} className={`${styles.input} font-mono text-center`} /></div>
                      <div><label className={styles.label}>Code PIN 2</label><input type="text" value={formData.pin2 || ""} onChange={(e) => setFormData({ ...formData, pin2: e.target.value })} className={`${styles.input} font-mono text-center`} maxLength={4} /></div>
                      <div><label className={styles.label}>Code PUK 2</label><input type="text" value={formData.puk2 || ""} onChange={(e) => setFormData({ ...formData, puk2: e.target.value })} className={`${styles.input} font-mono text-center`} /></div>
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
