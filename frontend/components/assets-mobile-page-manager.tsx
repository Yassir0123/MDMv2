"use client"

import { useState, useEffect } from "react"
import api from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { useVisiblePolling } from "@/lib/use-visible-polling"
import { exportStyledWorkbook } from "@/lib/excel-export"
import {
  Edit2, Trash2, Plus, X, Search, RotateCw, Eye,
  Link2, Unlink2, RefreshCw, Smartphone, Tablet,
  User, CheckCircle2, Package, ArrowUpDown,
  History, Building2, UserCheck, Layers, Filter,
  ChevronUp, ChevronDown, ArrowRight, ShieldCheck, Cpu, Router, FileSpreadsheet
} from "lucide-react"

// --- TYPES ---
type ViewMode = "list" | "add" | "edit" | "view"
type FilterCondition = "contains" | "startsWith" | "endsWith" | "equals"

// Backend Data Interface
interface Mobile {
  id: number
  sn: string
  imei: string
  nom: string
  marque: string
  model: string
  type: "GSM" | "PDA" | "TSP"
  status: "active" | "inactive"
  statusAffectation: "non_affecter" | "en_attente" | "recu" | "annuler" | "affecter"
  agenceId?: number
  agenceNom?: string
  departementId?: number
  departementNom?: string
  userId?: number
  userNom?: string
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
interface UserEntity { id: number; nom: string; prenom: string; departement: { id: number } }

export default function ManagerAssetsMobilePage() {
  const { user } = useAuth()
  const isWritable = user?.role === "Administrateur"

  // --- STATE ---
  const [devices, setDevices] = useState<Mobile[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>("list")

  // Filtering & Sorting
  const [searchTerm, setSearchTerm] = useState("")
  const [filterAttribute, setFilterAttribute] = useState("nom")
  const [filterCondition, setFilterCondition] = useState<FilterCondition>("contains")
  const [sortBy, setSortBy] = useState("nom")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")

  // Forms & Selection
  const [formData, setFormData] = useState<Partial<Mobile>>({})
  const [selectedDevice, setSelectedDevice] = useState<Mobile | null>(null)
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
    fetchDevices()
    fetchDropdownData()
  }, [])

  useVisiblePolling(() => fetchDevices(), 4000, [])

  const fetchDevices = async () => {
    try {
      if (devices.length === 0) {
        setLoading(true)
      }
      const res = await api.get("/mobiles")
      setDevices(Array.isArray(res.data) ? res.data : [])
    } catch (e) { console.error(e); setDevices([]) }
    finally { setLoading(false) }
  }

  const fetchDropdownData = async () => {
    try {
      const [resAgences, resDepts, resUsers] = await Promise.all([
        api.get("/agences").catch(() => ({ data: [] })),
        api.get("/departements").catch(() => ({ data: [] })),
        api.get("/users").catch(() => ({ data: [] }))
      ])
      setAgences(Array.isArray(resAgences.data) ? resAgences.data : [])
      setDepartements(Array.isArray(resDepts.data) ? resDepts.data : [])
      setUsersList(Array.isArray(resUsers.data) ? resUsers.data : [])
    } catch (e) { console.error(e) }
  }

  // --- LOGIC ---
  const availableDepts = Array.isArray(departements) ? departements : []
  const availableUsers = Array.isArray(usersList) ? usersList.filter(u => u.departement?.id?.toString() === selectedDeptId) : []

  // Helper to map UI filter keys to Backend Data keys
  const getFieldValue = (dev: Mobile, attribute: string): string => {
    switch (attribute) {
      case 'nom': return dev.nom || "";
      case 'marque': return dev.marque || "";
      case 'model': return dev.model || "";
      case 'type': return dev.type || "";
      case 'imei': return dev.imei || "";
      case 'sn': return dev.sn || "";
      case 'userNom': return dev.userNom || dev.departementNom || "";
      default: return "";
    }
  }

  // Filtering
  const filtered = devices.filter((dev) => {
    if (!searchTerm) return true
    const value = getFieldValue(dev, filterAttribute).toLowerCase()
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
  const kpiTotal = devices.length
  const kpiAssigned = devices.filter(d => d.statusAffectation === "affecter").length
  const kpiStock = devices.filter(d => d.statusAffectation === "non_affecter").length

  // --- HANDLERS ---
  const handleSortClick = (attr: string) => {
    if (sortBy === attr) setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    else { setSortBy(attr); setSortOrder("asc") }
  }

  const handleResetFilters = () => {
    setSearchTerm(""); setFilterAttribute("nom"); setFilterCondition("contains"); setSortBy("nom");
  }

  const handleAdd = () => {
    setFormData({ status: "active", statusAffectation: "non_affecter", type: "GSM" })
    setViewMode("add")
  }

  const handleEdit = (dev: Mobile) => {
    setFormData({ ...dev, agenceId: dev.agenceId })
    setViewMode("edit")
  }

  const handleView = async (dev: Mobile) => {
    setSelectedDevice(dev)
    setViewMode("view")
    try {
      const res = await api.get("/historique-mobile")
      const devHistory = Array.isArray(res.data) ? res.data
        .filter((h: any) => h.materiel?.id === dev.id)
        .map((h: any) => ({
          id: h.id,
          action: h.statusEvent,
          utilisateur: (h.userNom === "STOCK") ? "STOCK" :
            (h.userNom && h.userPrenom) ? `${h.userNom} ${h.userPrenom}` : (h.userNom || "-"),
          département: h.departmentNom || "-",
          date: h.dateEvent
        })) : []
      setHistory(devHistory)
    } catch (e) { setHistory([]) }
  }

  const handleSave = async () => {
    try {
      const payload = {
        ...formData,
        statusAffectation: formData.statusAffectation || "non_affecter",
        agenceId: formData.agenceId
      }

      if (viewMode === "add") {
        await api.post("/mobiles", payload)
      } else if (viewMode === "edit" && formData.id) {
        await api.put(`/mobiles/${formData.id}`, payload)
      }
      fetchDevices()
      setViewMode("list")
    } catch (e) {
      console.error(e)
      alert("Erreur lors de l'enregistrement.")
    }
  }

  const handleDelete = async (id: number) => {
    if (confirm("Confirmer la suppression ?")) {
      try { await api.delete(`/mobiles/${id}`); fetchDevices() }
      catch (e) { alert("Erreur lors de la suppression.") }
    }
  }

  const handleUnassign = async (id: number) => {
    if (confirm("Désaffecter cet appareil ?")) {
      try { await api.post(`/mobiles/unassign/${id}`); fetchDevices() }
      catch (e) { alert("Erreur lors de la désaffectation.") }
    }
  }

  const formatExportDate = (value?: string) => {
    if (!value) return "-"
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString("fr-FR")
  }

  const handleExportHistory = async () => {
    if (!selectedDevice || !filteredHistory.length) return
    setIsExportingHistory(true)
    try {
      await exportStyledWorkbook({
        fileName: `manager_historique_mobile_${selectedDevice.nom || selectedDevice.id}`,
        subject: "Historique mobile manager",
        sheets: [
          {
            name: "Historique mobile",
            title: `Mobile : ${selectedDevice.nom || selectedDevice.id}`,
            subtitle: `SN : ${selectedDevice.sn || "-"} | IMEI : ${selectedDevice.imei || "-"}`,
            columns: [
              { header: "Action", key: "action", width: 18 },
              { header: "Utilisateur", key: "utilisateur", width: 24 },
              { header: "Details", key: "details", width: 28 },
              { header: "Date", key: "date", width: 22 },
            ],
            rows: filteredHistory.map((entry) => ({
              action: entry.action || "-",
              utilisateur: entry.utilisateur || "-",
              details: entry.département || "-",
              date: formatExportDate(entry.date),
            })),
          },
        ],
      })
    } finally {
      setIsExportingHistory(false)
    }
  }

  const handleAffect = async () => {
    if (!selectedDevice) return

    if (selectedDevice.type !== "TSP" && !targetUserId) {
      alert("Pour ce type d'appareil, un utilisateur est obligatoire.")
      return
    }

    if (selectedDevice.type === "TSP" && !targetUserId && !selectedDeptId) {
      alert("Veuillez sélectionner au moins un département.")
      return
    }

    try {
      const payload: any = { materielId: selectedDevice.id }

      if (targetUserId) {
        payload.userId = parseInt(targetUserId)
      } else if (selectedDevice.type === "TSP" && selectedDeptId) {
        payload.departementId = parseInt(selectedDeptId)
      }

      await api.post("/mobiles/assign", payload)
      fetchDevices()
      setShowAffectModal(false)
      resetSelection()
    } catch (e) { alert("Erreur lors de l'affectation.") }
  }

  const resetSelection = () => {
    setSelectedAgenceId(""); setSelectedDeptId(""); setTargetUserId("")
  }

  // --- STYLES ---
  const styles = {
    pageBg: "min-h-full bg-background font-sans text-foreground",
    card: "bg-card border border-border rounded-xl shadow-sm overflow-hidden",
    header: "bg-card border-b border-border sticky top-0 z-20 backdrop-blur-md bg-card/80",
    primaryBtn: "btn btn-primary text-xs",
    secondaryBtn: "btn btn-secondary text-xs",
    input: "mdm-input text-xs",
    label: "block text-[10px] font-bold uppercase text-muted-foreground mb-1",
    th: "px-3 py-2.5 text-left text-[10px] font-semibold text-muted-foreground uppercase bg-secondary/50 border-b border-border select-none",
    td: "px-3 py-2.5 text-[12px] border-b border-border/50 last:border-0",
  }

  const SortIcon = ({ column }: { column: string }) => {
    if (sortBy !== column) return <ArrowUpDown className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
    return sortOrder === "asc" ? <ChevronUp className="w-3 h-3 text-blue-600" /> : <ChevronDown className="w-3 h-3 text-blue-600" />
  }

  const SortableTh = ({ label, sortKey }: { label: string, sortKey: string }) => (
    <th onClick={() => handleSortClick(sortKey)} className={`${styles.th} cursor-pointer hover:bg-slate-100 hover:text-blue-600 transition-colors group`}>
      <div className="flex items-center gap-2">{label} <SortIcon column={sortKey} /></div>
    </th>
  )

  // 1. FORM VIEW logic has been merged into a modal below

  // 2. DETAILS VIEW
  if (viewMode === "view" && selectedDevice) {
    return (
      <div className={styles.pageBg}>
        <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-4">
          <div className="flex justify-between pb-4 border-b border-slate-200">
            <button onClick={() => setViewMode("list")} className="flex items-center gap-2 text-slate-500 font-bold text-sm"><ArrowRight className="w-4 h-4 rotate-180" /> Retour</button>
            {isWritable && (
              <button onClick={() => setShowAffectModal(true)} className={`px-4 py-2 flex items-center gap-2 text-sm ${styles.primaryBtn}`}>
                <RefreshCw className="w-4 h-4" /> Gérer l'affectation
              </button>
            )}
          </div>

          <div className="grid grid-cols-12 gap-8">
            <div className="col-span-4 space-y-6">
              <div className={`${styles.card} relative overflow-hidden`}>
                <div className="h-20 bg-slate-900 relative">
                  <div className="absolute inset-0 bg-blue-600/10" />
                  <div className="absolute -bottom-8 left-4 p-3 bg-white rounded-xl shadow-lg border border-slate-100">
                    {selectedDevice.type === 'PDA' ? <Tablet className="w-8 h-8 text-blue-600" /> : selectedDevice.type === 'TSP' ? <Router className="w-8 h-8 text-orange-600" /> : <Smartphone className="w-8 h-8 text-blue-600" />}
                  </div>
                </div>
                <div className="pt-10 px-4 pb-4">
                  <h1 className="text-xl font-black text-slate-900">{selectedDevice.nom}</h1>
                  <div className="flex gap-2 mt-1 mb-4"><span className="text-slate-500 font-medium">{selectedDevice.marque} {selectedDevice.model}</span><span className="bg-slate-100 px-2 py-0.5 rounded text-xs font-bold border">{selectedDevice.type}</span></div>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between"><span className="text-slate-500">IMEI</span><span className="font-mono">{selectedDevice.imei}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">SN</span><span className="font-mono">{selectedDevice.sn}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Agence</span><span>{selectedDevice.agenceNom}</span></div>
                  </div>
                </div>
              </div>

              {/* AFFECTATION CARD (Carte Sim Style) */}
              <div className={styles.card}>
                <div className="p-3 border-b bg-slate-50/50 font-bold text-[10px] uppercase text-slate-500">Affectation Actuelle</div>
                <div className="p-4">
                  {selectedDevice.userNom ? (
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-base border border-blue-200">
                        {selectedDevice.userNom.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{selectedDevice.userNom}</p>
                        <p className="text-[10px] text-slate-500 flex items-center gap-1"><User className="w-3 h-3" /> Utilisateur</p>
                        {selectedDevice.departementNom && <p className="text-xs text-slate-400">{selectedDevice.departementNom}</p>}
                      </div>
                    </div>
                  ) : selectedDevice.departementNom ? (
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center border border-orange-200">
                        <Building2 className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{selectedDevice.departementNom}</p>
                        <p className="text-xs text-slate-500">Service / Département</p>
                        <p className="text-xs text-slate-400 italic">Aucun utilisateur assigné</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-4 text-center">
                      <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-2">
                        <Package className="w-6 h-6" />
                      </div>
                      <p className="font-bold text-slate-700">En Stock</p>
                      <p className="text-xs text-slate-400">Disponible pour affectation</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="col-span-8">
              <div className={styles.card}>
                <div className="p-3 border-b bg-slate-50/50 font-bold text-slate-700 flex justify-between text-xs">
                  <span>Historique</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleExportHistory}
                      disabled={isExportingHistory || filteredHistory.length === 0}
                      className="px-3 py-1 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-[11px] font-bold flex items-center gap-2"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      {isExportingHistory ? "Export..." : "Exporter Excel"}
                    </button>
                    <input placeholder="Rechercher..." className="bg-white border rounded px-2 py-1 text-xs font-normal" value={historySearchTerm} onChange={e => setHistorySearchTerm(e.target.value)} />
                  </div>
                </div>
                <table className="w-full text-left">
                  <thead><tr><th className={styles.th}>Action</th><th className={styles.th}>Utilisateur/Entité</th><th className={styles.th}>Détails</th><th className={styles.th}>Date</th></tr></thead>
                  <tbody>
                    {filteredHistory.map(h => (
                      <tr key={h.id} className="border-b hover:bg-slate-50">
                        <td className="px-4 py-2"><span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${h.action === 'CREATION' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-700'}`}>{h.action}</span></td>
                        <td className="px-4 py-2 text-xs font-medium">{h.utilisateur}</td>
                        <td className="px-4 py-2 text-xs text-slate-500">{h.département}</td>
                        <td className="px-4 py-2 text-xs font-mono text-slate-500">{new Date(h.date).toLocaleDateString("fr-FR")}</td>
                      </tr>
                    ))}
                    {filteredHistory.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-slate-400">Vide</td></tr>}
                  </tbody>
                </table>
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
      <div className={styles.header}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3"><div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white"><Smartphone className="w-5 h-5" /></div><h1 className="text-lg font-black">Flotte Mobile</h1></div>
          {isWritable && <button onClick={handleAdd} className={`px-3 py-2 flex items-center gap-2 text-xs ${styles.primaryBtn}`}><Plus className="w-3 h-3" /> Nouvel Appareil</button>}
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden"><div className="absolute top-0 right-0 p-3 opacity-10 text-slate-900"><Smartphone className="w-16 h-16" /></div><p className="text-slate-500 text-[10px] font-bold uppercase mb-1">Total Parc</p><p className="text-3xl font-black">{kpiTotal}</p></div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden"><div className="absolute top-0 right-0 p-3 opacity-10 text-blue-600"><CheckCircle2 className="w-16 h-16" /></div><p className="text-slate-500 text-[10px] font-bold uppercase mb-1">Affectés</p><p className="text-3xl font-black text-blue-600">{kpiAssigned}</p></div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden"><div className="absolute top-0 right-0 p-3 opacity-10 text-emerald-600"><Package className="w-16 h-16" /></div><p className="text-slate-500 text-[10px] font-bold uppercase mb-1">En Stock</p><p className="text-3xl font-black text-emerald-600">{kpiStock}</p></div>
        </div>

        {/* FILTER TOOLBAR (UPDATED) */}
        <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col md:flex-row items-center gap-3 w-full">
            <div className="flex items-center gap-2 text-slate-400 px-2">
              <Filter className="w-5 h-5" />
              <span className="text-xs font-bold uppercase">Filtrer</span>
            </div>

            {/* Attribute Selector */}
            <div className="relative w-full md:w-auto">
              <select
                value={filterAttribute}
                onChange={(e) => setFilterAttribute(e.target.value)}
                className="w-full md:w-36 px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="nom">Nom</option>
                <option value="model">Modèle</option>
                <option value="type">Type</option>
                <option value="imei">IMEI</option>
                <option value="sn">Série (SN)</option>
                <option value="userNom">Utilisateur</option>
              </select>
            </div>

            {/* Condition Selector */}
            <div className="relative w-full md:w-auto">
              <select
                value={filterCondition}
                onChange={(e) => setFilterCondition(e.target.value as FilterCondition)}
                className="w-full md:w-36 px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="contains">Contient</option>
                <option value="startsWith">Commence par</option>
                <option value="endsWith">Finit par</option>
                <option value="equals">Est égal à</option>
              </select>
            </div>

            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder={`Rechercher dans ${filterAttribute}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>
          </div>

          <button
            onClick={handleResetFilters}
            className="p-2.5 hover:bg-slate-100 text-slate-400 hover:text-blue-600 rounded-lg transition-all border border-transparent hover:border-slate-100"
            title="Réinitialiser les filtres"
          >
            <RotateCw className="w-5 h-5" />
          </button>
        </div>

        <div className={styles.card}>
          <table className="w-full text-left">
            <thead><tr><SortableTh label="Nom" sortKey="nom" /><SortableTh label="Modèle" sortKey="model" /><SortableTh label="Type" sortKey="type" /><SortableTh label="Affectation" sortKey="userNom" /><th className={styles.th}>Statut</th><th className={`${styles.th} text-right`}>Actions</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {sorted.map(dev => (
                <tr key={dev.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2 font-bold text-xs">{dev.nom}</td>
                  <td className="px-4 py-2 text-xs text-slate-600">{dev.marque} {dev.model}</td>
                  <td className="px-4 py-2"><span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${dev.type === 'GSM' ? 'bg-blue-50 text-blue-600' : dev.type === 'PDA' ? 'bg-purple-50 text-purple-600' : 'bg-orange-50 text-orange-600'}`}>{dev.type}</span></td>
                  <td className="px-4 py-2 text-xs">
                    {dev.userNom ? <div className="flex items-center gap-2"><User className="w-3 h-3 text-blue-500" /> {dev.userNom}</div> :
                      dev.departementNom ? <div className="flex items-center gap-2"><Building2 className="w-3 h-3 text-orange-500" /> {dev.departementNom}</div> :
                        <span className="text-slate-400 italic">Stock</span>}
                  </td>
                  <td className="px-4 py-2"><span className={`px-2 py-1 rounded-full text-[10px] font-bold ${dev.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{dev.status}</span></td>
                  <td className="px-4 py-2 text-right flex justify-end gap-1">
                    <button onClick={() => handleView(dev)} className="p-1.5 text-slate-400 hover:text-blue-600 rounded"><Eye className="w-3 h-3" /></button>
                    {isWritable && (
                      <>
                        <button onClick={() => { setSelectedDevice(dev); setShowAffectModal(true); }} className={`p-1.5 rounded ${dev.statusAffectation === 'affecter' ? 'text-orange-400 hover:bg-orange-50' : 'text-emerald-500 hover:bg-emerald-50'}`}>{dev.statusAffectation === 'affecter' ? <RefreshCw className="w-3 h-3" /> : <Link2 className="w-3 h-3" />}</button>
                        <button onClick={() => handleEdit(dev)} className="p-1.5 text-indigo-400 hover:bg-indigo-50 rounded"><Edit2 className="w-3 h-3" /></button>
                        <button onClick={() => handleDelete(dev.id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded"><Trash2 className="w-3 h-3" /></button>
                        {dev.statusAffectation === 'affecter' && <button onClick={() => handleUnassign(dev.id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded"><Unlink2 className="w-3 h-3" /></button>}
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* AFFECTATION MODAL (TSP LOGIC) */}
      {showAffectModal && selectedDevice && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="px-5 py-3 border-b flex justify-between items-center"><div><h2 className="text-lg font-bold">Affectation</h2><p className="text-xs text-slate-500">{selectedDevice.nom}</p></div><button onClick={() => setShowAffectModal(false)} className="text-slate-500 hover:bg-slate-100 p-1.5 rounded-full"><X className="w-4 h-4" /></button></div>
            <div className="p-5 space-y-4">
              <div className="bg-blue-50 p-3 rounded text-xs text-blue-700 mb-4 border border-blue-100">
                {selectedDevice.type === "TSP" ? "ℹ️ Ce dispositif TSP peut être affecté à un Département entier OU à un Utilisateur." : "ℹ️ Ce dispositif doit être affecté à un Utilisateur précis."}
              </div>

              {/* 1. Agence */}
              <div>
                <label className={styles.label}>1. Agence</label>
                <div className="relative"><Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><select style={{ paddingLeft: "2.5rem" }} className={`${styles.input}`} value={selectedAgenceId} onChange={e => { setSelectedAgenceId(e.target.value); setSelectedDeptId(""); setTargetUserId(""); }}><option value="">-</option>{agences.map(a => <option key={a.id} value={a.id}>{a.nom}</option>)}</select></div>
              </div>

              {/* 2. Department */}
              <div className={selectedAgenceId ? "" : "opacity-50"}>
                <label className={styles.label}>2. Département</label>
                <div className="relative"><Layers className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><select style={{ paddingLeft: "2.5rem" }} className={`${styles.input}`} value={selectedDeptId} onChange={e => { setSelectedDeptId(e.target.value); setTargetUserId(""); }}><option value="">-</option>{availableDepts.map(d => <option key={d.id} value={d.id}>{d.nom}</option>)}</select></div>
              </div>

              {/* 3. User (Optional only for TSP) */}
              <div className={selectedDeptId ? "" : "opacity-50"}>
                <label className={styles.label}>3. Utilisateur {selectedDevice.type === "TSP" ? "(Optionnel)" : "(Obligatoire)"}</label>
                <div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><select style={{ paddingLeft: "2.5rem" }} className={`${styles.input}`} value={targetUserId} onChange={e => setTargetUserId(e.target.value)}><option value="">{selectedDevice.type === "TSP" ? "Affecter au département (Aucun user)" : "Choisir l'utilisateur..."}</option>{availableUsers.map(u => <option key={u.id} value={u.id}>{u.nom} {u.prenom}</option>)}</select></div>
              </div>
            </div>

            <div className="bg-slate-50 px-5 py-3 border-t flex gap-3">
              <button onClick={() => setShowAffectModal(false)} className={`flex-1 py-2 ${styles.secondaryBtn}`}>Annuler</button>
              <button onClick={handleAffect} className={`flex-1 py-2 ${styles.primaryBtn}`}>Confirmer</button>
            </div>
          </div>
        </div>
      )}

      {/* ADD/EDIT FORM MODAL */}
      {(viewMode === "add" || viewMode === "edit") && isWritable && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center px-5 py-3 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">{viewMode === "add" ? "Nouvel Appareil" : "Modification"}</h2>
              <button onClick={() => setViewMode("list")} className="p-1.5 hover:bg-slate-100 rounded-full transition-colors text-slate-500"><X className="w-4 h-4" /></button>
            </div>

            <div className="overflow-y-auto p-0">
              <div className="bg-gradient-to-r from-sidebar-primary to-accent text-sidebar-primary-foreground px-5 py-3 flex items-center gap-3">
                <div className="bg-white/10 p-1.5 rounded-lg backdrop-blur-sm"><Smartphone className="w-4 h-4 text-blue-400" /></div>
                <div><h3 className="text-white font-bold text-sm">Détails Techniques</h3></div>
              </div>

              <div className="p-5 space-y-4">
                <div className="space-y-4">
                  <div>
                    <label className={styles.label}>Agence Propriétaire</label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <select style={{ paddingLeft: "2.5rem" }} className={`${styles.input}`} value={formData.agenceId || ""} onChange={(e) => setFormData({ ...formData, agenceId: parseInt(e.target.value) })}>
                        <option value="">Choisir l'agence...</option>
                        {agences.map(a => <option key={a.id} value={a.id}>{a.nom}</option>)}
                      </select>
                    </div>
                  </div>

                  <div><label className={styles.label}>Nom de l'appareil</label><input className={styles.input} value={formData.nom || ""} onChange={(e) => setFormData({ ...formData, nom: e.target.value })} placeholder="Ex: Samsung S21 Flotte 1" /></div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className={styles.label}>Marque</label><input className={styles.input} value={formData.marque || ""} onChange={(e) => setFormData({ ...formData, marque: e.target.value })} /></div>
                    <div><label className={styles.label}>Modèle</label><input className={styles.input} value={formData.model || ""} onChange={(e) => setFormData({ ...formData, model: e.target.value })} /></div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={styles.label}>Type</label>
                      <select className={styles.input} value={formData.type || "GSM"} onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}>
                        <option value="GSM">GSM</option><option value="PDA">PDA</option><option value="TSP">TSP</option>
                      </select>
                    </div>
                    <div>
                      <label className={styles.label}>Statut</label>
                      <select className={styles.input} value={formData.status || "active"} onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}>
                        <option value="active">Actif</option><option value="inactive">Inactif</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className={styles.label}>IMEI</label><input className={styles.input} value={formData.imei || ""} onChange={(e) => setFormData({ ...formData, imei: e.target.value })} /></div>
                    <div><label className={styles.label}>Série (SN)</label><input className={styles.input} value={formData.sn || ""} onChange={(e) => setFormData({ ...formData, sn: e.target.value })} /></div>
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
