"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { createPortal } from "react-dom"
import api from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { exportStyledWorkbook } from "@/lib/excel-export"
import { useVisiblePolling } from "@/lib/use-visible-polling"
import {
  Edit2, Trash2, Plus, X, Search, RotateCw, Eye,
  Link2, Unlink2, RefreshCw, Monitor, Printer,
  User, CheckCircle2, Package, ArrowUpDown,
  History, Building2, Layers, Filter, UserCheck,
  ChevronUp, ChevronDown, ArrowRight, Mouse, Keyboard, Laptop, UserMinus, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, FileSpreadsheet
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

// Backend Data Interface
interface Materiel {
  id: number
  sn: string
  designation: string
  marque: string
  typeMateriel: "Ordinateur portable" | "Ordinateur fixe" | "Imprimante" | "Souris" | "Clavier" | "Écrans"
  status: "Bon" | "A reviser" | "Moyen" | "Ne marche pas"
  statusAffectation: "non_affecter" | "en_attente" | "recu" | "affecter" | "annuler" | "creation"

  agenceId?: number
  agenceNom?: string
  entrepotId?: number
  entrepotNom?: string
  departementId?: number
  departementNom?: string
  userId?: number
  userNom?: string

  dateCreation?: string
  dateEnvoie?: string
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
interface UserEntity { id: number; nom: string; prenom: string; matricule?: string; status?: string; departement?: { id: number }; agence?: { id: number }; entrepot?: { id: number } }

// --- OPTIMIZED SEARCHABLE SELECT ---
interface SearchableSelectProps<T> {
  options: T[]
  value: string | number | undefined
  onChange: (value: string | number) => void
  getLabel: (item: T) => string
  placeholder?: string
  disabled?: boolean
  className?: string
  inputStyle?: React.CSSProperties
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

  const filteredOptions = useMemo(() => {
    return options.filter(item =>
      getLabel(item).toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 50)
  }, [options, searchTerm, getLabel])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      const spaceAbove = rect.top
      const dropdownHeight = 240 // max-h-[240px]

      const showAbove = preferTop ? spaceAbove > 0 : (spaceBelow < dropdownHeight && spaceAbove > spaceBelow)

      setDropdownStyles({
        position: 'fixed',
        top: showAbove ? 'auto' : `${rect.bottom + 4}px`,
        bottom: showAbove ? `${window.innerHeight - rect.top + 4}px` : 'auto',
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
          className={`mdm-input text-xs cursor-pointer ${disabled ? 'opacity-60 cursor-not-allowed' : ''} ${className}`}
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

      {isOpen && typeof document !== 'undefined' && createPortal(
        <>
          <div className="fixed inset-0 z-[9998]" onClick={() => { setIsOpen(false); setSearchTerm(""); }} />
          <ul style={dropdownStyles} className="fixed bg-white border border-slate-200 rounded-lg shadow-2xl max-h-[240px] overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
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
                  {item.id === value && <CheckCircle2 className="w-4 h-4" />}
                </li>
              ))
            ) : (
              <li className="px-3 py-4 text-xs text-center text-slate-400 italic">Aucun résultat trouvé</li>
            )}
          </ul>
        </>,
        document.body
      )}
    </div>
  )
}

export default function AssetsMaterielsPage() {
  const { user } = useAuth()

  // --- ROLE CHECK ---
  const isWritable = user?.role === "Administrateur"

  // --- STATE ---
  const [materiels, setMateriels] = useState<Materiel[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>("list")

  // Filtering & Sorting
  const [filters, setFilters] = useState<FilterRule[]>([{ id: "1", attribute: "designation", condition: "contains", term: "" }])
  const [sortBy, setSortBy] = useState("designation")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")

  // Forms & Selection
  const [formData, setFormData] = useState<Partial<Materiel>>({})
  const [selectedItem, setSelectedItem] = useState<Materiel | null>(null)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [historyFilters, setHistoryFilters] = useState<FilterRule[]>([{ id: "h1", attribute: "action", condition: "contains", term: "" }])
  const [historySortBy, setHistorySortBy] = useState("date")
  const [historySortOrder, setHistorySortOrder] = useState<"asc" | "desc">("desc")
  const [historyPage, setHistoryPage] = useState(1)
  const [page, setPage] = useState(1)
  const [isExportingHistory, setIsExportingHistory] = useState(false)
  const ITEMS_PER_PAGE = 5
  const LIST_ITEMS_PER_PAGE = 10


  // Cascading Dropdown State
  const [showAffectModal, setShowAffectModal] = useState(false)
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
    fetchMateriels()
    fetchDropdownData()
  }, [])

  useVisiblePolling(() => fetchMateriels(), 4000, [])

  useVisiblePolling(() => {
    if (viewMode === "view" && selectedItem?.id) {
      void fetchMaterielHistory(selectedItem.id)
    }
  }, 4000, [viewMode, selectedItem?.id])

  const fetchMateriels = async () => {
    try {
      if (materiels.length === 0) {
        setLoading(true)
      }
      const res = await api.get("/materiels")
      setMateriels(Array.isArray(res.data) ? res.data : [])
    } catch (e) { console.error(e); setMateriels([]) }
    finally { setLoading(false) }
  }

  const fetchDropdownData = async () => {
    try {
      const [resAgences, resEntrepots, resDepts, resUsers] = await Promise.all([
        api.get("/agences").catch(() => ({ data: [] })),
        api.get("/entrepots").catch(() => ({ data: [] })),
        api.get("/departements").catch(() => ({ data: [] })),
        api.get("/users").catch(() => ({ data: [] }))
      ])
      setAgences(Array.isArray(resAgences.data) ? resAgences.data : [])
      setEntrepots(Array.isArray(resEntrepots.data) ? resEntrepots.data : [])
      setDepartements(Array.isArray(resDepts.data) ? resDepts.data : [])
      setUsersList(Array.isArray(resUsers.data) ? resUsers.data : [])
    } catch (e) { console.error(e) }
  }

  const fetchMaterielHistory = async (materielId: number) => {
    try {
      const res = await api.get(`/historique-materiels/${materielId}`)
      const hist = Array.isArray(res.data) ? res.data.map((h: any) => ({
        id: h.id,
        action: h.statusEvent,
        utilisateur: (h.userNom && h.userPrenom)
          ? `${h.userNom} ${h.userPrenom}`
          : (h.userNom ? h.userNom : "Système / Stock"),
        entrepotNom: h.entrepotNom || (h.entrepot?.siteRef?.libeller) || "-",
        agenceNom: h.agenceNom || (h.agence?.nom) || "-",
        departementNom: h.departementNom || (h.departement?.nom) || "-",
        chefAgence: h.chefAgenceNom || "-",
        date: h.dateEvent
      })) : []
      setHistory(hist)
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

  // Is the selected item an Imprimante? (allows direct affectation without user)
  const isImprimante = selectedItem?.typeMateriel === "Imprimante"

  // Logic to determine if item is currently assigned
  const isAssigned = (item: Materiel) => !!(item.userId || item.departementId || item.agenceId || item.entrepotId);

  const getFieldValue = (item: Materiel, attribute: string): string => {
    switch (attribute) {
      case 'sn': return item.sn || "";
      case 'designation': return item.designation || "";
      case 'marque': return item.marque || "";
      case 'typeMateriel': return item.typeMateriel || "";
      case 'status': return item.status || "";
      case 'userNom': return item.userNom || item.departementNom || item.agenceNom || "";
      case 'entrepotNom': return item.entrepotNom || "";
      case 'agenceNom': return item.agenceNom || "";
      case 'departementNom': return item.departementNom || "";
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
  const filtered = applyFilters(materiels, filters)

  // Sorting
  const sorted = [...filtered].sort((a, b) => {
    // @ts-ignore
    const aVal = a[sortBy]?.toString() || ""
    // @ts-ignore
    const bVal = b[sortBy]?.toString() || ""
    const comparison = aVal.localeCompare(bVal)
    return sortOrder === "asc" ? comparison : -comparison
  })

  const getHistoryFieldValue = (item: any, attribute: string): string => {
    if (item[attribute] === null || item[attribute] === undefined) return "";
    return item[attribute].toString().toLowerCase();
  }

  const applyHistoryFilters = (data: any[], rules: FilterRule[]) => {
    return data.filter(item => {
      return rules.every(rule => {
        if (!rule.term) return true;
        const val = getHistoryFieldValue(item, rule.attribute);
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

  // --- HISTORY TABLE SORTING ---
  const filteredHistory = applyHistoryFilters(history, historyFilters);
  const sortedHistory = [...filteredHistory].sort((a, b) => {
    // @ts-ignore
    const aVal = a[historySortBy]
    // @ts-ignore
    const bVal = b[historySortBy]

    if (historySortBy === 'date') {
      const dateA = new Date(aVal).getTime()
      const dateB = new Date(bVal).getTime()
      return historySortOrder === 'asc' ? dateA - dateB : dateB - dateA
    }

    const comparison = String(aVal).localeCompare(String(bVal))
    return historySortOrder === 'asc' ? comparison : -comparison
  })

  const totalHistoryPages = Math.ceil(sortedHistory.length / ITEMS_PER_PAGE);
  const paginatedHistory = sortedHistory.slice((historyPage - 1) * ITEMS_PER_PAGE, historyPage * ITEMS_PER_PAGE);
  const totalPages = Math.max(1, Math.ceil(sorted.length / LIST_ITEMS_PER_PAGE))
  const paginatedMateriels = sorted.slice((page - 1) * LIST_ITEMS_PER_PAGE, page * LIST_ITEMS_PER_PAGE)

  useEffect(() => {
    setPage(1)
  }, [filters, sortBy, sortOrder])

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  // KPIs
  const kpiTotal = materiels.length
  const kpiActive = materiels.filter(m => m.status === "Bon" || m.status === "Moyen").length
  const kpiAffected = materiels.filter(m => isAssigned(m)).length

  // --- HANDLERS ---
  const handleHistorySortClick = (attr: string) => {
    if (historySortBy === attr) setHistorySortOrder(historySortOrder === "asc" ? "desc" : "asc")
    else { setHistorySortBy(attr); setHistorySortOrder("asc") }
  }

  const handleSortClick = (attr: string) => {
    if (sortBy === attr) setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    else { setSortBy(attr); setSortOrder("asc") }
  }

  const formatExportDate = (value?: string) => {
    if (!value) return "-"
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString("fr-FR")
  }

  const handleExportHistory = async () => {
    if (!selectedItem || !sortedHistory.length) return
    setIsExportingHistory(true)
    try {
      await exportStyledWorkbook({
        fileName: `historique_materiel_${selectedItem.designation || selectedItem.id}`,
        subject: "Historique materiel",
        sheets: [
          {
            name: "Historique materiel",
            title: `Materiel : ${selectedItem.designation || selectedItem.id}`,
            subtitle: `Type : ${selectedItem.typeMateriel || "-"} | SN : ${selectedItem.sn || "-"}`,
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
    if (!isWritable) return;
    setFormData({ status: "Bon", statusAffectation: "non_affecter", typeMateriel: "Ordinateur portable" })
    setViewMode("add")
  }

  const handleEdit = (item: Materiel) => {
    if (!isWritable) return;
    setFormData({ ...item })
    setViewMode("edit")
  }

  const handleView = async (item: Materiel) => {
    setSelectedItem(item)
    setViewMode("view")
    setHistoryPage(1)
    await fetchMaterielHistory(item.id)
  }

  const handleSave = async () => {
    if (!isWritable) return;
    try {
      const payload = {
        ...formData,
        statusAffectation: formData.statusAffectation || "non_affecter",
      }

      if (viewMode === "add") {
        await api.post("/materiels", payload)
      } else if (viewMode === "edit" && formData.id) {
        await api.put(`/materiels/${formData.id}`, payload)
      }
      fetchMateriels()
      setViewMode("list")
    } catch (e) { alert("Erreur lors de l'enregistrement.") }
  }

  const handleDelete = async (id: number) => {
    if (!isWritable) return;
    if (confirm("Confirmer la suppression ?")) {
      try { await api.delete(`/materiels/${id}`); fetchMateriels() }
      catch (e) { alert("Erreur lors de la suppression.") }
    }
  }

  const handleUnassign = async (id: number) => {
    if (!isWritable) return;
    if (confirm("Désaffecter ce matériel ?")) {
      try { await api.post(`/materiels/unassign/${id}`); fetchMateriels() }
      catch (e) { alert("Erreur lors de la désaffectation.") }
    }
  }

  const handleAffect = async () => {
    if (!isWritable) return;
    if (!selectedItem) return

    const isImprimanteLocal = selectedItem.typeMateriel === "Imprimante"

    // Validation
    if (affectTab === "agence" && !selectedAgenceId) { alert("Veuillez sélectionner une agence."); return }
    if (affectTab === "entrepot" && !selectedEntrepotId) { alert("Veuillez sélectionner un entrepôt."); return }
    if (affectTab === "departement" && !selectedDeptId) { alert("Veuillez sélectionner un département."); return }
    // Non-Imprimante require a user
    if (!isImprimanteLocal && !targetUserId) { alert("Veuillez sélectionner un utilisateur."); return }

    try {
      const payload: any = { materielId: selectedItem.id }

      if (affectTab === "agence") {
        payload.agenceId = parseInt(selectedAgenceId)
        if (targetUserId) payload.userId = parseInt(targetUserId)
      } else if (affectTab === "entrepot") {
        payload.entrepotId = parseInt(selectedEntrepotId)
        if (targetUserId) payload.userId = parseInt(targetUserId)
      } else {
        // departement
        payload.departementId = parseInt(selectedDeptId)
        if (targetUserId) payload.userId = parseInt(targetUserId)
      }

      await api.post("/materiels/assign", payload)
      fetchMateriels()
      setShowAffectModal(false)
      resetSelection()
    } catch (e: any) {
      alert(e?.response?.data || "Erreur lors de l'affectation.")
    }
  }

  const resetSelection = () => {
    setAffectTab("agence")
    setSelectedAgenceId("")
    setSelectedEntrepotId("")
    setSelectedDeptId("")
    setTargetUserId("")
  }

  // --- ICONS HELPER ---
  const getTypeIcon = (type: string, sizeClass = "w-8 h-8") => {
    switch (type) {
      case 'Ordinateur portable': return <Laptop className={`${sizeClass} text-blue-600`} />
      case 'Ordinateur fixe': return <Monitor className={`${sizeClass} text-blue-600`} />
      case 'Imprimante': return <Printer className={`${sizeClass} text-orange-600`} />
      case 'Souris': return <Mouse className={`${sizeClass} text-purple-600`} />
      case 'Clavier': return <Keyboard className={`${sizeClass} text-purple-600`} />
      case 'Écrans': return <Monitor className={`${sizeClass} text-indigo-600`} />
      default: return <Package className={`${sizeClass} text-slate-600`} />
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

  // Helper Icon
  const SortIcon = ({ column, sortByVal, sortOrderVal }: { column: string, sortByVal: string, sortOrderVal: string }) => {
    if (sortByVal !== column) return <ArrowUpDown className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
    return sortOrderVal === "asc" ? <ChevronUp className="w-3 h-3 text-blue-600" /> : <ChevronDown className="w-3 h-3 text-blue-600" />
  }

  const SortableTh = ({ label, sortKey, sortByVal, sortOrderVal, onClick }: { label: string, sortKey: string, sortByVal: string, sortOrderVal: string, onClick: (k: string) => void }) => (
    <th onClick={() => onClick(sortKey)} className={`${styles.th} cursor-pointer hover:bg-slate-100 hover:text-blue-600 transition-colors group`}>
      <div className="flex items-center gap-2">{label} <SortIcon column={sortKey} sortByVal={sortByVal} sortOrderVal={sortOrderVal} /></div>
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

  // 1. FORM VIEW (ADD / EDIT) has been converted to a modal below

  // 2. DETAILS VIEW
  if (viewMode === "view" && selectedItem) {
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
                <button onClick={() => handleEdit(selectedItem)} className={`px-3 py-1.5 flex items-center gap-2 text-xs ${styles.secondaryBtn}`}>
                  <Edit2 className="w-3 h-3" /> Modifier
                </button>
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
                    {getTypeIcon(selectedItem.typeMateriel, "w-6 h-6")}
                  </div>
                </div>
                <div className="pt-8 px-4 pb-4">
                  <h1 className="text-lg font-bold text-slate-900 tracking-tight">{selectedItem.designation}</h1>
                  <div className="flex gap-2 mt-1 mb-4">
                    <span className="text-xs text-slate-500 font-medium">{selectedItem.marque}</span>
                    <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-bold border">{selectedItem.typeMateriel}</span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between py-1.5 border-b border-slate-50">
                      <span className="text-xs font-medium text-slate-500">SN</span>
                      <span className="font-mono text-xs font-semibold text-slate-700">{selectedItem.sn || "N/A"}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-50">
                      <span className="text-xs font-medium text-slate-500">État</span>
                      <span className={`text-xs font-semibold ${selectedItem.status === 'Bon' ? 'text-emerald-600' : selectedItem.status === 'Ne marche pas' ? 'text-red-600' : 'text-orange-600'}`}>{selectedItem.status}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-50">
                      <span className="text-xs font-medium text-slate-500">Agence</span>
                      <span className="text-xs font-semibold text-slate-700">{selectedItem.agenceNom || "N/A"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Affectation Card */}
              <div className={styles.card}>
                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                  <h3 className="font-semibold text-slate-700 text-xs uppercase">Affectation Actuelle</h3>
                  <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <div className="p-4">
                  {selectedItem.userNom ? (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm border border-blue-200">
                        {selectedItem.userNom.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 text-sm leading-tight">{selectedItem.userNom}</p>
                        <p className="text-slate-500 text-[10px] mt-0.5 flex items-center gap-1">{selectedItem.departementNom}</p>
                        <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-emerald-600 font-mono font-medium bg-emerald-50 px-2 py-0.5 rounded w-fit">
                          <User className="w-3 h-3" /> {selectedItem.userId ? "Utilisateur" : selectedItem.departementNom ? "Département" : "Agence"}
                        </div>
                      </div>
                    </div>
                  ) : selectedItem.departementNom ? (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center border border-orange-200">
                        <Layers className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 text-sm leading-tight">{selectedItem.departementNom}</p>
                        <p className="text-slate-500 text-[10px] mt-0.5">Département</p>
                      </div>
                    </div>
                  ) : selectedItem.agenceNom ? (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center border border-purple-200">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 text-sm leading-tight">{selectedItem.agenceNom}</p>
                        <p className="text-slate-500 text-[10px] mt-0.5">Agence</p>
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
                <h2 className="text-base font-bold text-slate-800 flex items-center gap-2"><History className="w-4 h-4 text-blue-600" /> Historique</h2>
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
                    <thead><tr>
                      <SortableTh label="Action" sortKey="action" sortByVal={historySortBy} sortOrderVal={historySortOrder} onClick={handleHistorySortClick} />
                      <SortableTh label="Utilisateur/Entité" sortKey="utilisateur" sortByVal={historySortBy} sortOrderVal={historySortOrder} onClick={handleHistorySortClick} />
                      <SortableTh label="Entrepôt" sortKey="entrepotNom" sortByVal={historySortBy} sortOrderVal={historySortOrder} onClick={handleHistorySortClick} />
                      <SortableTh label="Agence" sortKey="agenceNom" sortByVal={historySortBy} sortOrderVal={historySortOrder} onClick={handleHistorySortClick} />
                      <SortableTh label="Département" sortKey="departementNom" sortByVal={historySortBy} sortOrderVal={historySortOrder} onClick={handleHistorySortClick} />
                      <SortableTh label="Chef Agence" sortKey="chefAgence" sortByVal={historySortBy} sortOrderVal={historySortOrder} onClick={handleHistorySortClick} />
                      <SortableTh label="Date" sortKey="date" sortByVal={historySortBy} sortOrderVal={historySortOrder} onClick={handleHistorySortClick} />
                    </tr></thead>
                    <tbody className="divide-y divide-slate-100">
                      {paginatedHistory.map(h => (
                        <tr key={h.id} className="hover:bg-blue-50/30 transition-colors group">
                          <td className="px-4 py-2"><span className={`inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider ${h.action === 'CREATION' ? 'bg-slate-50 text-slate-600 border-slate-200' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>{h.action}</span></td>
                          <td className={`${styles.td} font-medium text-slate-900`}>{h.utilisateur}</td>
                          <td className={`${styles.td} text-slate-600`}>{h.entrepotNom}</td>
                          <td className={`${styles.td} text-slate-600`}>{h.agenceNom}</td>
                          <td className={`${styles.td} text-slate-600`}>{h.departementNom}</td>
                          <td className={`${styles.td} text-slate-600`}>{h.chefAgence}</td>
                          <td className={`${styles.td} text-right font-mono text-slate-500`}>{new Date(h.date).toLocaleDateString("fr-FR")}</td>
                        </tr>
                      ))}
                      {paginatedHistory.length === 0 && <tr><td colSpan={7} className="p-12 text-center text-slate-400 italic">Aucun historique disponible</td></tr>}
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
      {/* --- Page Header --- */}
      <div className={styles.header}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 gradient-primary rounded-xl flex items-center justify-center text-white shadow-md shadow-primary/20"><Monitor className="w-5 h-5" /></div>
            <div>
              <h1 className="text-lg font-bold text-foreground leading-none tracking-tight">Parc Informatique</h1>
              <p className="text-[11px] text-muted-foreground mt-0.5">{kpiTotal} équipements au total • {kpiActive} opérationnels</p>
            </div>
          </div>
          {isWritable && <button onClick={handleAdd} className={`px-4 py-2.5 flex items-center gap-2 ${styles.primaryBtn}`}><Plus className="w-3.5 h-3.5" /> Nouveau Matériel</button>}
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 lg:p-5 space-y-5">
        {/* --- KPI Cards --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card p-4 rounded-xl border border-border shadow-sm relative overflow-hidden group hover:border-primary/30 hover:shadow-md transition-all card-hover">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary" />
            <div className="absolute top-0 right-0 p-3 opacity-[0.06] group-hover:opacity-[0.12] transition-opacity"><Package className="w-16 h-16 text-foreground" /></div>
            <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider mb-1">Total Matériel</p><p className="text-3xl font-black text-foreground tabular-nums">{kpiTotal}</p>
          </div>
          <div className="bg-card p-4 rounded-xl border border-border shadow-sm relative overflow-hidden group hover:border-emerald-400/30 hover:shadow-md transition-all card-hover">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-emerald-500" />
            <div className="absolute top-0 right-0 p-3 opacity-[0.06] group-hover:opacity-[0.12] transition-opacity"><CheckCircle2 className="w-16 h-16 text-emerald-600" /></div>
            <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider mb-1">Opérationnels</p><p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">{kpiActive}</p>
          </div>
          <div className="bg-card p-4 rounded-xl border border-border shadow-sm relative overflow-hidden group hover:border-blue-400/30 hover:shadow-md transition-all card-hover">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-500" />
            <div className="absolute top-0 right-0 p-3 opacity-[0.06] group-hover:opacity-[0.12] transition-opacity"><UserCheck className="w-16 h-16 text-blue-600" /></div>
            <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider mb-1">Affectés</p><p className="text-3xl font-black text-blue-600 dark:text-blue-400 tabular-nums">{kpiAffected}</p>
          </div>
        </div>

        {/* --- Section: Filtres --- */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">Filtres de recherche</h2>
            <span className="text-xs text-muted-foreground">— Affinez les résultats</span>
          </div>
          <FilterToolbar
            filters={filters}
            setFilters={setFilters}
            attributes={[
              { value: "designation", label: "Désignation" },
              { value: "sn", label: "Série (SN)" },
              { value: "typeMateriel", label: "Type" },
              { value: "status", label: "État" },
              { value: "userNom", label: "Affectation" },
              { value: "entrepotNom", label: "Entrepôt" },
              { value: "agenceNom", label: "Agence" },
              { value: "departementNom", label: "Département" }
            ]}
          />
        </div>

        {/* --- Section: Inventaire --- */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Monitor className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">Inventaire du Parc Informatique</h2>
              <span className="text-xs text-muted-foreground ml-1">{sorted.length} résultat{sorted.length !== 1 ? "s" : ""}</span>
            </div>
          </div>
          <div className={`${styles.card} card-hover`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[1000px]">
                <thead><tr><SortableTh label="Désignation" sortKey="designation" sortByVal={sortBy} sortOrderVal={sortOrder} onClick={handleSortClick} /><SortableTh label="Marque" sortKey="marque" sortByVal={sortBy} sortOrderVal={sortOrder} onClick={handleSortClick} /><SortableTh label="Type" sortKey="typeMateriel" sortByVal={sortBy} sortOrderVal={sortOrder} onClick={handleSortClick} /><SortableTh label="Entrepôt" sortKey="entrepotNom" sortByVal={sortBy} sortOrderVal={sortOrder} onClick={handleSortClick} /><SortableTh label="Agence" sortKey="agenceNom" sortByVal={sortBy} sortOrderVal={sortOrder} onClick={handleSortClick} /><SortableTh label="Département" sortKey="departementNom" sortByVal={sortBy} sortOrderVal={sortOrder} onClick={handleSortClick} /><SortableTh label="Affectation" sortKey="userNom" sortByVal={sortBy} sortOrderVal={sortOrder} onClick={handleSortClick} /><th className={styles.th}>État</th><th className={`${styles.th} text-right`}>Actions</th></tr></thead>
                <tbody className="divide-y divide-border/50">
                  {paginatedMateriels.map(item => (
                    <tr key={item.id} className="hover:bg-secondary/50 transition-colors group">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full bg-secondary text-muted-foreground flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                            {getTypeIcon(item.typeMateriel, "w-3 h-3")}
                          </div>
                          <div>
                            <p className="font-bold text-foreground text-xs">{item.designation}</p>
                            <p className="text-[10px] text-muted-foreground font-mono font-normal">{item.sn}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground">{item.marque}</td>
                      <td className="px-4 py-2.5"><span className="badge badge-neutral text-[10px]">{item.typeMateriel}</span></td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground">{item.entrepotNom || "-"}</td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground">{item.agenceNom || "-"}</td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground">{item.departementNom || "-"}</td>
                      <td className="px-4 py-2.5 text-xs">
                        {item.userNom ? <div className="flex items-center gap-1.5 font-medium text-foreground"><div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">{item.userNom.charAt(0)}</div>{item.userNom}</div> :
                          item.departementNom ? <div className="flex items-center gap-1.5 font-medium text-foreground"><div className="w-5 h-5 rounded-lg bg-orange-100 dark:bg-orange-500/15 text-orange-600 dark:text-orange-400 flex items-center justify-center text-[10px] font-bold"><Layers className="w-3 h-3" /></div>{item.departementNom}</div> :
                            item.agenceNom ? <div className="flex items-center gap-1.5 font-medium text-foreground"><div className="w-5 h-5 rounded-lg bg-purple-100 dark:bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center text-[10px] font-bold"><Building2 className="w-3 h-3" /></div>{item.agenceNom}</div> :
                              <span className="text-muted-foreground text-[10px] italic">Stock</span>}
                      </td>
                      <td className="px-4 py-2.5"><span className={`badge ${item.status === 'Bon' ? 'badge-success' : item.status === 'Ne marche pas' ? 'badge-danger' : 'badge-warning'}`}>{item.status === 'Bon' && <span className="w-1 h-1 rounded-full bg-emerald-600 dark:bg-emerald-400 animate-pulse"></span>}{item.status}</span></td>
                      <td className="px-4 py-2.5 text-right">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => handleView(item)} className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-all"><Eye className="w-3.5 h-3.5" /></button>
                          {isWritable && (
                            <>
                              <button onClick={() => { setSelectedItem(item); setShowAffectModal(true); }} className={`p-1.5 rounded-lg transition-all ${isAssigned(item) ? 'text-muted-foreground hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/10' : 'text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10'}`} title={isAssigned(item) ? "Réaffecter" : "Affecter"}>{isAssigned(item) ? <RefreshCw className="w-3.5 h-3.5" /> : <Link2 className="w-3.5 h-3.5" />}</button>
                              <button onClick={() => handleEdit(item)} className="p-1.5 text-muted-foreground hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-all" title="Modifier"><Edit2 className="w-3.5 h-3.5" /></button>
                              <button onClick={() => handleDelete(item.id)} className="p-1.5 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all" title="Supprimer"><Trash2 className="w-3.5 h-3.5" /></button>
                              {isAssigned(item) && <button onClick={() => handleUnassign(item.id)} className="p-1.5 text-muted-foreground hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-500/10 rounded-lg transition-all" title="Désaffecter"><Unlink2 className="w-3.5 h-3.5" /></button>}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && <Pagination current={page} total={totalPages} setPage={setPage} />}
          </div>
        </div>

        {/* AFFECTATION MODAL — Tab-based (like Mobile), Imprimante allows direct affectation) */}
        {showAffectModal && selectedItem && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md animate-in zoom-in-95 duration-200 flex flex-col max-h-[83vh] translate-x-35 translate-y-5">
              <div className="bg-white border-b border-slate-100 flex items-center justify-between px-5 py-3 shrink-0 rounded-t-2xl">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{isAssigned(selectedItem) ? "Réaffectation" : "Affectation"}</h2>
                  <p className="text-slate-500 text-xs">{selectedItem.designation}</p>
                </div>
                <button onClick={() => { setShowAffectModal(false); resetSelection(); }} className="bg-slate-50 p-2 rounded-full hover:bg-slate-100 transition-colors"><X className="w-4 h-4 text-slate-500" /></button>
              </div>

              <div className="p-5 overflow-y-auto translate-y-[-3]">
                {/* Current owner section */}
                {isAssigned(selectedItem) && (
                  <div className="mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <h3 className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">
                      <UserMinus className="w-4 h-4" /> Propriétaire Actuel
                    </h3>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Agence</label>
                          <input type="text" value={selectedItem.agenceNom || "-"} disabled className="w-full text-xs py-1 px-2 bg-slate-100 border border-slate-200 rounded text-slate-700" />
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Entrepôt</label>
                          <input type="text" value={selectedItem.entrepotNom || "-"} disabled className="w-full text-xs py-1 px-2 bg-slate-100 border border-slate-200 rounded text-slate-700" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Département</label>
                          <input type="text" value={selectedItem.departementNom || "-"} disabled className="w-full text-xs py-1 px-2 bg-slate-100 border border-slate-200 rounded text-slate-700" />
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Utilisateur</label>
                          <input type="text" value={selectedItem.userNom || (selectedItem.departementNom ? "Dép. Entier" : selectedItem.agenceNom ? "Agence Entière" : "-")} disabled className="w-full text-xs py-1 px-2 bg-slate-100 border border-slate-200 rounded text-slate-700 font-medium" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wide border-b border-slate-100 pb-1.5">
                    {isAssigned(selectedItem) ? "Nouveau Bénéficiaire" : "Sélection du bénéficiaire"}
                  </h3>
                  {/* Tabs */}
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

                  {/* Step 1: Organisation unit */}
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

                    {/* Step 2: User */}
                    <div className={(affectTab === "agence" ? !!selectedAgenceId : affectTab === "entrepot" ? !!selectedEntrepotId : !!selectedDeptId) ? "opacity-100 transition-opacity" : "opacity-40 pointer-events-none transition-opacity"}>
                      <label className="text-[10px] font-semibold text-slate-700 block mb-1">2. Utilisateur {isImprimante ? "(Optionnel)" : "(Obligatoire)"}</label>
                      <div className="relative">
                        <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 z-10" />
                        <SearchableSelect
                          options={availableUsers}
                          value={targetUserId}
                          onChange={(val) => setTargetUserId(String(val))}
                          getLabel={(u) => `${(u as any).matricule || '???'} - ${u.nom} ${u.prenom}`}
                          placeholder={isImprimante ? "Affecter sans utilisateur" : "Chercher par nom ou matricule..."}
                          inputStyle={{ paddingLeft: "2rem", fontSize: "0.75rem", height: "2rem" }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 px-4 py-3 border-t border-slate-100 flex gap-2 rounded-b-2xl shrink-0">
                <button onClick={() => { setShowAffectModal(false); resetSelection(); }} className="flex-1 py-1.5 text-xs font-bold bg-white text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                  Annuler
                </button>
                <button onClick={handleAffect} disabled={!isImprimante && !targetUserId} className="flex-1 py-1.5 text-xs font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:text-slate-500 transition-colors">
                  Confirmer
                </button>
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
              <h2 className="text-lg font-bold text-slate-900">{viewMode === "add" ? "Nouveau Matériel" : "Modification"}</h2>
              <button onClick={() => setViewMode("list")} className="p-1.5 hover:bg-slate-100 rounded-full transition-colors text-slate-500"><X className="w-4 h-4" /></button>
            </div>

            <div className="overflow-y-auto p-0">
              <div className="bg-gradient-to-r from-sidebar-primary to-accent text-sidebar-primary-foreground px-5 py-3 flex items-center gap-3">
                <div className="bg-white/10 p-1.5 rounded-lg backdrop-blur-sm"><Monitor className="w-4 h-4 text-blue-400" /></div>
                <div><h3 className="text-white font-bold text-sm">Détails du Matériel</h3><p className="text-slate-400 text-[10px]">Informations techniques</p></div>
              </div>

              <div className="p-5 space-y-4">
                <div className="space-y-4">
                  <div><label className={styles.label}>Désignation</label><input className={styles.input} value={formData.designation || ""} onChange={(e) => setFormData({ ...formData, designation: e.target.value })} placeholder="Ex: Dell Latitude 5420" /></div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className={styles.label}>Numéro Série (SN)</label><input className={styles.input} value={formData.sn || ""} onChange={(e) => setFormData({ ...formData, sn: e.target.value })} /></div>
                    <div><label className={styles.label}>Marque</label><input className={styles.input} value={formData.marque || ""} onChange={(e) => setFormData({ ...formData, marque: e.target.value })} /></div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={styles.label}>Type de Matériel</label>
                      <select className={styles.input} value={formData.typeMateriel || "Ordinateur portable"} onChange={(e) => setFormData({ ...formData, typeMateriel: e.target.value as any })}>
                        <option value="Ordinateur portable">Ordinateur portable</option>
                        <option value="Ordinateur fixe">Ordinateur fixe</option>
                        <option value="Imprimante">Imprimante</option>
                        <option value="Souris">Souris</option>
                        <option value="Clavier">Clavier</option>
                        <option value="Écrans">Écrans</option>
                      </select>
                    </div>
                    <div>
                      <label className={styles.label}>État</label>
                      <select className={styles.input} value={formData.status || "Bon"} onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}>
                        <option value="Bon">Bon</option>
                        <option value="A reviser">A réviser</option>
                        <option value="Moyen">Moyen</option>
                        <option value="Ne marche pas">Ne marche pas</option>
                      </select>
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
