"use client"

import { useState, useEffect } from "react"
import api from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { exportStyledWorkbook } from "@/lib/excel-export"
import { formatDateTimeValue } from "@/lib/utils"
import { useVisiblePolling } from "@/lib/use-visible-polling"
import {
  Edit2, Trash2, Plus, X, Search, RotateCw,
  Eye, Link2, Unlink2, RefreshCw, ShieldCheck,
  User, History, Signal, UserCheck, Layers,
  ChevronUp, ChevronDown, ArrowUpDown,
  Cpu, Smartphone, Calendar, ArrowRight, Filter, Building2, Package, CheckCircle2, FileSpreadsheet
} from "lucide-react"

// --- TYPES ---
type ViewMode = "list" | "add" | "edit" | "view"
type FilterCondition = "contains" | "startsWith" | "endsWith" | "equals"

// Matches Java CarteSimDto
interface CarteSim {
  id: number
  sn: string
  numero: string
  operateur: string
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
  département: string
  date: string
}

interface Agence { id: number; nom: string }
interface Departement { id: number; nom: string }
interface UserEntity { id: number; nom: string; prenom: string; departement?: { id: number } }

export default function ManagerAssetsSIMPage() {
  const { user } = useAuth()

  // --- ROLE CHECKS ---
  const isAdmin = user?.role === "Administrateur"
  const isManager = user?.role === "Manager"
  // Assuming 'user' object from context contains the manager's agenceId if they are a manager.
  // If not, it will default to empty and require selection (or backend enforcement).
  const managerAgenceId = isManager ? (user as any).agenceId : null

  // --- STATE ---
  const [sims, setSims] = useState<CarteSim[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>("list")

  // Filtering & Sorting
  const [searchTerm, setSearchTerm] = useState("")
  const [filterAttribute, setFilterAttribute] = useState("numero")
  const [filterCondition, setFilterCondition] = useState<FilterCondition>("contains")
  const [sortBy, setSortBy] = useState("numero")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")

  // Forms & Selection
  const [formData, setFormData] = useState<Partial<CarteSim>>({})
  const [selectedSim, setSelectedSim] = useState<CarteSim | null>(null)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [historySearchTerm, setHistorySearchTerm] = useState("")
  const [isExportingHistory, setIsExportingHistory] = useState(false)

  // Cascading Dropdown State
  const [showAffectModal, setShowAffectModal] = useState(false)
  const [agences, setAgences] = useState<Agence[]>([])
  const [departements, setDepartements] = useState<Departement[]>([])
  const [usersList, setUsersList] = useState<UserEntity[]>([])

  const [selectedAgenceId, setSelectedAgenceId] = useState<string>("")
  const [selectedDeptId, setSelectedDeptId] = useState<string>("")
  const [targetUserId, setTargetUserId] = useState<string>("")

  // --- INITIAL LOAD ---
  useEffect(() => {
    fetchSims()
    fetchDropdownData()
  }, [])

  useVisiblePolling(() => fetchSims(), 4000, [])

  const fetchSims = async () => {
    try {
      if (sims.length === 0) {
        setLoading(true)
      }
      const res = await api.get("/cartesims")
      setSims(Array.isArray(res.data) ? res.data : [])
    } catch (e) {
      console.error("Fetch SIMs Error", e)
      setSims([])
    } finally {
      setLoading(false)
    }
  }

  const fetchDropdownData = async () => {
    try {
      const [resAgences, resDepts, resUsers] = await Promise.all([
        api.get("/agences").catch(() => ({ data: [] })),
        api.get("/departements").catch(() => ({ data: [] })),
        api.get("/users").catch(() => ({ data: [] }))
      ])

      let loadedAgences = Array.isArray(resAgences.data) ? resAgences.data : [];

      // MANAGER LOGIC: Only show their agence in dropdowns
      if (isManager && managerAgenceId) {
        loadedAgences = loadedAgences.filter((a: Agence) => a.id === managerAgenceId);
      }

      setAgences(loadedAgences)
      setDepartements(Array.isArray(resDepts.data) ? resDepts.data : [])
      setUsersList(Array.isArray(resUsers.data) ? resUsers.data : [])
    } catch (e) {
      console.error("Global Dropdown Error", e)
    }
  }

  // --- LOGIC ---

  // Cascading Logic
  const availableDepts = Array.isArray(departements) ? departements : []

  const availableUsers = Array.isArray(usersList) ? usersList.filter(u =>
    u.departement?.id?.toString() === selectedDeptId
  ) : []

  // Helper for filtering keys
  const getFieldValue = (sim: CarteSim, attribute: string): string => {
    switch (attribute) {
      case 'numero': return sim.numero || "";
      case 'operateur': return sim.operateur || "";
      case 'userNom': return sim.userNom || "";
      case 'status': return sim.status || "";
      default: return "";
    }
  }

  // Filtering
  const filtered = sims.filter((sim) => {
    if (!searchTerm) return true
    const value = getFieldValue(sim, filterAttribute).toLowerCase()
    const term = searchTerm.toLowerCase()

    switch (filterCondition) {
      case "contains": return value.includes(term)
      case "startsWith": return value.startsWith(term)
      case "endsWith": return value.endsWith(term)
      case "equals": return value === term
      default: return true
    }
  })

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
  const filteredHistory = history.filter(entry =>
    !historySearchTerm ||
    Object.values(entry).some(val => val && val.toString().toLowerCase().includes(historySearchTerm.toLowerCase()))
  )

  // KPIs
  const kpiTotal = sims.length
  const kpiActive = sims.filter(s => s.status === "active").length
  const kpiAffected = sims.filter(s => s.userId).length

  // --- HANDLERS ---

  const handleSortClick = (attr: string) => {
    if (sortBy === attr) setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    else { setSortBy(attr); setSortOrder("asc") }
  }

  const handleResetFilters = () => {
    setSearchTerm(""); setFilterAttribute("numero"); setFilterCondition("contains");
    setSortBy("numero"); setSortOrder("asc")
  }

  const handleAdd = () => {
    // MANAGER LOGIC: Auto-select Agence
    setFormData({
      status: "active",
      statusAffectation: "non_affecter",
      agenceId: isManager && managerAgenceId ? managerAgenceId : undefined
    })
    setViewMode("add")
  }

  const handleEdit = (sim: CarteSim) => {
    setFormData({ ...sim, agenceId: sim.agenceId })
    setViewMode("edit")
  }

  const handleView = async (sim: CarteSim) => {
    setSelectedSim(sim)
    setViewMode("view")
    try {
      const res = await api.get("/historique-cartesim")
      const simHistory = Array.isArray(res.data) ? res.data
        .filter((h: any) => h.materiel?.id === sim.id)
        .map((h: any) => ({
          id: h.id,
          action: h.statusEvent,
          utilisateur: h.userNom && h.userPrenom
            ? `${h.userNom} ${h.userPrenom}`
            : (h.userNom || "Système"),
          département: h.userFonction || "-",
          date: h.dateEvent
        })) : []
      setHistory(simHistory)
    } catch (e) { setHistory([]) }
  }

  const handleSave = async () => {
    try {
      const payload = {
        ...formData,
        statusAffectation: formData.statusAffectation || "non_affecter",
        // Ensure ID is integer
        agenceId: formData.agenceId ? parseInt(formData.agenceId.toString()) : null
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
      alert("Erreur lors de l'enregistrement.")
    }
  }

  const handleDelete = async (id: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cet élément?")) {
      try {
        await api.delete(`/cartesims/${id}`)
        fetchSims()
      } catch (e) { alert("Erreur lors de la suppression.") }
    }
  }

  const handleAffect = async () => {
    if (!selectedSim || !targetUserId) return
    try {
      const payload: any = { materielId: selectedSim.id, userId: parseInt(targetUserId) }
      if (selectedDeptId) payload.departementId = parseInt(selectedDeptId)
      else if (selectedAgenceId) payload.agenceId = parseInt(selectedAgenceId)

      await api.post("/cartesims/assign", payload)
      fetchSims()
      setShowAffectModal(false)
      resetSelection()
    } catch (e) { alert("Erreur lors de l'affectation.") }
  }

  const handleUnassign = async (id: number) => {
    if (confirm("Désaffecter cette carte de l'utilisateur ?")) {
      try {
        await api.post(`/cartesims/unassign/${id}`)
        fetchSims()
      } catch (e) { alert("Erreur lors de la désaffectation.") }
    }
  }

  const formatExportDate = (value?: string) => {
    return formatDateTimeValue(value, "-")
  }

  const handleExportHistory = async () => {
    if (!selectedSim || !filteredHistory.length) return
    setIsExportingHistory(true)
    try {
      await exportStyledWorkbook({
        fileName: `manager_historique_sim_${selectedSim.numero || selectedSim.id}`,
        subject: "Historique SIM manager",
        sheets: [
          {
            name: "Historique SIM",
            title: `Carte SIM : ${selectedSim.numero || selectedSim.id}`,
            subtitle: `Operateur : ${selectedSim.operateur || "-"} | SN : ${selectedSim.sn || "-"}`,
            columns: [
              { header: "Action", key: "action", width: 18 },
              { header: "Utilisateur", key: "utilisateur", width: 24 },
              { header: "Departement", key: "departement", width: 22 },
              { header: "Date", key: "date", width: 22 },
            ],
            rows: filteredHistory.map((entry) => ({
              action: entry.action || "-",
              utilisateur: entry.utilisateur || "-",
              departement: entry.département || "-",
              date: formatExportDate(entry.date),
            })),
          },
        ],
      })
    } finally {
      setIsExportingHistory(false)
    }
  }

  const resetSelection = () => {
    // MANAGER LOGIC: If Manager, keep agence selected
    if (isManager && managerAgenceId) {
      setSelectedAgenceId(managerAgenceId.toString())
    } else {
      setSelectedAgenceId("")
    }
    setSelectedDeptId("")
    setTargetUserId("")
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
    th: "px-4 py-2.5 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider bg-secondary/50 border-b border-border select-none",
    td: "px-4 py-2.5 text-[12px] border-b border-border/50 last:border-0",
  }

  // Helper Icon
  const SortIcon = ({ column }: { column: string }) => {
    if (sortBy !== column) return <ArrowUpDown className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
    return sortOrder === "asc" ? <ChevronUp className="w-3 h-3 text-blue-600" /> : <ChevronDown className="w-3 h-3 text-blue-600" />
  }

  // On accepte des props supplémentaires (currentSort, setSort, styles, SortIcon) pour
  // rester compatible avec les appels existants.
  const SortableTh = ({ label, sortKey }: { label: string; sortKey: string;[key: string]: any }) => (
    <th onClick={() => handleSortClick(sortKey)} className={`${styles.th} cursor-pointer hover:bg-slate-100 hover:text-blue-600 transition-colors group`}>
      <div className="flex items-center gap-2">{label} <SortIcon column={sortKey} /></div>
    </th>
  )

  // --- 1. FORM VIEW (ADD / EDIT) logic has been moved to a modal below ---

  // --- 2. VIEW DETAILS VIEW ---
  if (viewMode === "view" && selectedSim) {
    return (
      <div className={styles.pageBg}>
        <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-4">
          <div className="flex justify-between pb-4 border-b border-slate-200">
            <button onClick={() => setViewMode("list")} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors font-medium text-sm">
              <ArrowRight className="w-4 h-4 rotate-180" /> Retour à la liste
            </button>
            {(isAdmin || isManager) && (
              <div className="flex gap-2">
                <button onClick={() => { setShowAffectModal(true); resetSelection(); }} className={`px-4 py-2 flex items-center gap-2 text-sm ${styles.primaryBtn}`}>
                  <RefreshCw className="w-4 h-4" /> Gérer l'affectation
                </button>
                <button onClick={() => handleEdit(selectedSim)} className={`px-4 py-2 flex items-center gap-2 text-sm ${styles.secondaryBtn}`}>
                  <Edit2 className="w-4 h-4" /> Modifier
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4 space-y-6">
              <div className={`${styles.card} relative overflow-hidden group`}>
                <div className="h-20 bg-slate-900 relative">
                  <div className="absolute inset-0 bg-blue-600/10" />
                  <div className="absolute -bottom-8 left-4 p-3 bg-white rounded-xl shadow-lg border border-slate-100">
                    <Cpu className="w-8 h-8 text-blue-600" />
                  </div>
                </div>
                <div className="pt-10 px-4 pb-4">
                  <h1 className="text-xl font-black text-slate-900 tracking-tight">{selectedSim.numero}</h1>
                  <p className="text-slate-500 font-medium mb-4 text-xs">{selectedSim.operateur}</p>

                  <div className="space-y-3">
                    <div className="flex justify-between py-2 border-b border-slate-100"><span className="text-xs text-slate-500">Statut</span><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${selectedSim.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>{selectedSim.status}</span></div>
                    <div className="flex justify-between py-2 border-b border-slate-100"><span className="text-xs text-slate-500">PIN</span><span className="font-mono font-bold text-slate-700 text-xs">{selectedSim.pin || "N/A"}</span></div>
                    <div className="flex justify-between py-2 border-b border-slate-100"><span className="text-xs text-slate-500">PUK</span><span className="font-mono font-bold text-slate-700 text-xs">{selectedSim.puk || "N/A"}</span></div>
                    <div className="flex justify-between py-2 border-b border-slate-100"><span className="text-xs text-slate-500">Agence</span><span className="font-bold text-slate-700 text-xs">{selectedSim.agenceNom || "N/A"}</span></div>
                  </div>
                </div>
              </div>

              {/* AFFECTATION CARD */}
              <div className={styles.card}>
                <div className="p-3 border-b bg-slate-50/50 font-bold text-[10px] uppercase text-slate-500">Affectation Actuelle</div>
                <div className="p-6">
                  {selectedSim.userId ? (
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-base border border-blue-200">
                        {selectedSim.userNom?.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{selectedSim.userNom}</p>
                        <p className="text-[10px] text-slate-500 flex items-center gap-1"><User className="w-3 h-3" /> Utilisateur</p>
                        {selectedSim.departementNom && <p className="text-xs text-slate-400">{selectedSim.departementNom}</p>}
                        <div className="mt-2 flex items-center gap-2 text-xs text-slate-400 font-mono"><Calendar className="w-3 h-3" /> Assigné le {formatDateTimeValue(selectedSim.dateEnvoie, "N/A")}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-2 text-center">
                      <div className="w-10 h-10 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-1">
                        <Package className="w-5 h-5" />
                      </div>
                      <p className="font-bold text-slate-700 text-sm">En Stock</p>
                      <p className="text-[10px] text-slate-400">Disponible pour affectation</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="lg:col-span-8 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-800 flex items-center gap-2"><History className="w-4 h-4 text-blue-600" /> Historique des mouvements</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportHistory}
                    disabled={isExportingHistory || filteredHistory.length === 0}
                    className="px-3 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-xs font-bold flex items-center gap-2"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    {isExportingHistory ? "Export..." : "Exporter Excel"}
                  </button>
                  <div className="relative w-56">
                    <input type="text" placeholder="Rechercher..." value={historySearchTerm} onChange={(e) => setHistorySearchTerm(e.target.value)} className={`${styles.input} py-1.5 text-xs`} />
                    <Search className="absolute right-3 top-2 w-3 h-3 text-slate-400" />
                  </div>
                </div>
              </div>

              <div className={`${styles.card} border-0 shadow-md`}>
                <table className="w-full text-left border-collapse">
                  <thead><tr><th className={styles.th}>Action</th><th className={styles.th}>Utilisateur</th><th className={styles.th}>Département</th><th className={`${styles.th} text-right`}>Date</th></tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredHistory.map((entry) => (
                      <tr key={entry.id} className="hover:bg-blue-50/30 transition-colors group">
                        <td className="px-4 py-3"><span className={`inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider ${entry.action === 'CREATION' ? 'bg-slate-50 text-slate-600' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>{entry.action}</span></td>
                        <td className={`${styles.td} font-medium text-slate-900`}>{entry.utilisateur}</td>
                        <td className={styles.td}>{entry.département}</td>
                        <td className={`${styles.td} text-right font-mono text-slate-500`}>{formatDateTimeValue(entry.date, "-")}</td>
                      </tr>
                    ))}
                    {filteredHistory.length === 0 && <tr><td colSpan={4} className="p-12 text-center text-slate-400 italic">Aucun historique disponible</td></tr>}
                  </tbody>
                </table>
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
      <div className={styles.header}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-sidebar-primary to-accent rounded-lg flex items-center justify-center text-sidebar-primary-foreground shadow-sm"><Cpu className="w-5 h-5" /></div>
            <div><h1 className="text-lg font-black text-slate-900 leading-none">Cartes Sim</h1></div>
          </div>
          {(isAdmin || isManager) && <button onClick={handleAdd} className={`px-3 py-2 flex items-center gap-2 text-xs ${styles.primaryBtn}`}><Plus className="w-3 h-3" /> Nouvelle Carte</button>}
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 space-y-4">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-blue-200 transition-all">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity"><Layers className="w-16 h-16 text-slate-900" /></div>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Total Cartes</p><p className="text-3xl font-black text-slate-900">{kpiTotal}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-emerald-200 transition-all">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity"><Signal className="w-16 h-16 text-emerald-600" /></div>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Lignes Actives</p><p className="text-3xl font-black text-emerald-600">{kpiActive}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-blue-200 transition-all">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity"><UserCheck className="w-16 h-16 text-blue-600" /></div>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Affectées</p><p className="text-3xl font-black text-blue-600">{kpiAffected}</p>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col md:flex-row items-center gap-3 w-full">
            <div className="flex items-center gap-2 text-slate-400 px-2"><Filter className="w-5 h-5" /><span className="text-xs font-bold uppercase">Filtrer</span></div>

            <div className="relative w-full md:w-auto">
              <select value={filterAttribute} onChange={(e) => setFilterAttribute(e.target.value)} className="w-full md:w-36 px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
                <option value="numero">Numéro</option><option value="operateur">Opérateur</option><option value="userNom">Utilisateur</option><option value="status">Statut</option>
              </select>
            </div>

            <div className="relative w-full md:w-auto">
              <select value={filterCondition} onChange={(e) => setFilterCondition(e.target.value as FilterCondition)} className="w-full md:w-36 px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
                <option value="contains">Contient</option><option value="startsWith">Commence par</option><option value="endsWith">Finit par</option><option value="equals">Est égal à</option>
              </select>
            </div>

            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input type="text" placeholder={`Rechercher dans ${filterAttribute}...`} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
            </div>
          </div>
          <button onClick={handleResetFilters} className="p-2 hover:bg-slate-100 text-slate-400 hover:text-blue-600 rounded-lg transition-all border border-transparent hover:border-slate-100"><RotateCw className="w-4 h-4" /></button>
        </div>

        {/* Table */}
        <div className={styles.card}>
          <table className="w-full">
            <thead>
              <tr>
                <SortableTh label="Numéro" sortKey="numero" currentSort={sortBy} setSort={setSortBy} styles={styles} SortIcon={SortIcon} />
                <SortableTh label="Opérateur" sortKey="operateur" currentSort={sortBy} setSort={setSortBy} styles={styles} SortIcon={SortIcon} />
                <SortableTh label="Agence" sortKey="agenceNom" currentSort={sortBy} setSort={setSortBy} styles={styles} SortIcon={SortIcon} />
                <SortableTh label="Affecté à" sortKey="userNom" currentSort={sortBy} setSort={setSortBy} styles={styles} SortIcon={SortIcon} />
                <SortableTh label="Statut" sortKey="status" currentSort={sortBy} setSort={setSortBy} styles={styles} SortIcon={SortIcon} />
                <th className={`${styles.th} text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {sorted.map((sim) => (
                <tr key={sim.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-4 py-3"><div className="flex items-center gap-3"><div className="w-6 h-6 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors"><Cpu className="w-3 h-3" /></div><span className="font-bold text-slate-700 font-mono text-xs">{sim.numero}</span></div></td>
                  <td className="px-4 py-3"><span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-600 border border-slate-200">{sim.operateur}</span></td>
                  <td className="px-4 py-3 text-xs text-slate-600">{sim.agenceNom || "-"}</td>
                  <td className="px-4 py-3">{sim.userId ? <div className="flex items-center gap-2 text-xs font-medium text-slate-700"><div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold">{sim.userNom?.charAt(0)}</div>{sim.userNom}</div> : <span className="text-slate-400 text-[10px] italic">Stock</span>}</td>
                  <td className="px-4 py-3">{sim.status === "active" ? <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100"><span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span> Actif</span> : <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-600 border border-red-100">Inactif</span>}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1 opacity-100 ">
                      <button onClick={() => handleView(sim)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"><Eye className="w-4 h-4" /></button>
                      {(isAdmin || isManager) && (
                        <>
                          <button onClick={() => { setSelectedSim(sim); setShowAffectModal(true); resetSelection(); }} className={`p-1.5 rounded-lg transition-all ${sim.userId ? 'text-slate-400 hover:text-orange-500 hover:bg-orange-50' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'}`}>{sim.userId ? <RefreshCw className="w-3 h-3" /> : <Link2 className="w-3 h-3" />}</button>
                          <button onClick={() => handleEdit(sim)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"><Edit2 className="w-3 h-3" /></button>
                          <button onClick={() => handleDelete(sim.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><Trash2 className="w-3 h-3" /></button>
                          {sim.userId && <button onClick={() => handleUnassign(sim.id)} className="p-1.5 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all"><Unlink2 className="w-3 h-3" /></button>}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {sorted.length === 0 && <tr><td colSpan={6} className="p-12 text-center text-slate-400"><Search className="w-12 h-12 mx-auto mb-3 opacity-20" /><p>Aucun résultat.</p></td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Cascading Affectation */}
      {showAffectModal && selectedSim && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-white border-b border-slate-100 px-5 py-4 flex items-center justify-between">
              <div><h2 className="text-lg font-bold text-slate-900">{selectedSim.userId ? "Réaffectation" : "Affectation"}</h2><p className="text-slate-500 text-xs">Ligne <span className="font-mono text-blue-600 font-bold">{selectedSim.numero}</span></p></div>
              <button onClick={() => { setShowAffectModal(false); resetSelection(); }} className="bg-slate-50 p-2 rounded-full hover:bg-slate-100 transition-colors"><X className="w-4 h-4 text-slate-500" /></button>
            </div>
            <div className="p-5 space-y-6">
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-blue-600 uppercase tracking-wide border-b border-slate-100 pb-2">Sélection du bénéficiaire</h3>

                {/* Step 1: Agence (Auto-selected & Disabled for Manager) */}
                <div>
                  <label className={styles.label}>1. Agence</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <select
                      style={{ paddingLeft: "2.5rem" }} className={`${styles.input}`}
                      value={selectedAgenceId}
                      disabled={isManager} // Manager cannot change agence
                      onChange={(e) => { setSelectedAgenceId(e.target.value); setSelectedDeptId(""); setTargetUserId(""); }}
                    >
                      <option value="">Choisir l'agence...</option>
                      {Array.isArray(agences) && agences.map(a => (
                        <option key={a.id} value={a.id}>{a.nom}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Step 2: Departement */}
                <div className={selectedAgenceId ? "opacity-100" : "opacity-50 pointer-events-none"}>
                  <label className={styles.label}>2. Département</label>
                  <div className="relative">
                    <Layers className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <select style={{ paddingLeft: "2.5rem" }} className={`${styles.input}`} value={selectedDeptId} onChange={(e) => { setSelectedDeptId(e.target.value); setTargetUserId(""); }}>
                      <option value="">Choisir le département...</option>
                      {availableDepts.map(d => <option key={d.id} value={d.id}>{d.nom}</option>)}
                    </select>
                  </div>
                </div>

                {/* Step 3: User */}
                <div className={selectedDeptId ? "opacity-100" : "opacity-50 pointer-events-none"}>
                  <label className={styles.label}>3. Collaborateur</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <select style={{ paddingLeft: "2.5rem" }} className={`${styles.input}`} value={targetUserId} onChange={(e) => setTargetUserId(e.target.value)}>
                      <option value="">Choisir le collaborateur...</option>
                      {availableUsers.map(u => <option key={u.id} value={u.id}>{u.nom} {u.prenom}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-slate-50 px-5 py-3 border-t border-slate-100 flex gap-3">
              <button onClick={() => { setShowAffectModal(false); resetSelection(); }} className={`flex-1 py-2 ${styles.secondaryBtn}`}>Annuler</button>
              <button onClick={handleAffect} disabled={!targetUserId} className={`flex-1 py-2 ${styles.primaryBtn}`}>Confirmer</button>
            </div>
          </div>
        </div>
      )}

      {/* ADD/EDIT FORM MODAL */}
      {(viewMode === "add" || viewMode === "edit") && (isAdmin || isManager) && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
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

                  {/* AGENCE SELECTION */}
                  <div>
                    <label className={styles.label}>Agence Propriétaire</label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <select
                        style={{ paddingLeft: "2.5rem" }} className={`${styles.input}`}
                        value={formData.agenceId || ""}
                        // MANAGER LOGIC: Disable if Manager
                        disabled={isManager}
                        onChange={(e) => setFormData({ ...formData, agenceId: parseInt(e.target.value) })}
                      >
                        <option value="">Choisir l'agence...</option>
                        {Array.isArray(agences) && agences.map(a => (
                          <option key={a.id} value={a.id}>{a.nom}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={styles.label}>Numéro de Ligne</label>
                      <div className="relative">
                        <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input type="text" value={formData.numero || ""} onChange={(e) => setFormData({ ...formData, numero: e.target.value })} style={{ paddingLeft: "2.25rem" }} className={`${styles.input} font-mono`} placeholder="06..." />
                      </div>
                    </div>
                    <div>
                      <label className={styles.label}>Numéro Série (SN)</label>
                      <input type="text" value={formData.sn || ""} onChange={(e) => setFormData({ ...formData, sn: e.target.value })} className={styles.input} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={styles.label}>Opérateur</label>
                      <select value={formData.operateur || ""} onChange={(e) => setFormData({ ...formData, operateur: e.target.value })} className={styles.input}>
                        <option value="">Choisir...</option><option value="Orange">Orange</option><option value="IAM">IAM</option><option value="Inwi">Inwi</option>
                      </select>
                    </div>
                    <div>
                      <label className={styles.label}>Statut Actuel</label>
                      <select value={formData.status || "active"} onChange={(e) => setFormData({ ...formData, status: e.target.value as any })} className={styles.input}>
                        <option value="active">Actif (En service)</option><option value="inactive">Inactif (Stock)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-slate-100" />

                <div>
                  <h4 className="flex items-center gap-2 font-bold text-slate-900 mb-4 text-xs"><ShieldCheck className="w-4 h-4 text-blue-600" /> Codes de Sécurité</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
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

// Helpers
const SortIcon = ({ column, sortBy, sortOrder }: any) => {
  if (sortBy !== column) return <ArrowUpDown className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
  return sortOrder === "asc" ? <ChevronUp className="w-3 h-3 text-blue-600" /> : <ChevronDown className="w-3 h-3 text-blue-600" />
}

const SortableTh = ({ label, sortKey, currentSort, setSort, styles, SortIcon }: any) => (
  <th onClick={() => { if (currentSort === sortKey) setSort(""); else setSort(sortKey); }} className={`${styles.th} cursor-pointer hover:bg-slate-100 hover:text-blue-600 transition-colors group`}>
    <div className="flex items-center gap-2">{label} <SortIcon column={sortKey} sortBy={currentSort} sortOrder="asc" /></div>
  </th>
)
