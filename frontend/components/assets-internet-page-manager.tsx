"use client"

import { useState, useEffect } from "react"
import api from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { exportStyledWorkbook } from "@/lib/excel-export"
import { formatDateTimeValue } from "@/lib/utils"
import { useVisiblePolling } from "@/lib/use-visible-polling"
import {
  Edit2, Trash2, Plus, X, Search, RotateCw, Eye,
  Power, AlertCircle, Globe, Activity, ArrowUpDown,
  CheckCircle2, XCircle, Router, MapPin, Building2, Server, Wifi,
  ChevronUp, ChevronDown, Filter, ArrowRight, ShieldAlert, Layers, FileSpreadsheet
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
  departementId?: number
  departementNom?: string
  dateEnvoie?: string
  dateCreation?: string
}

interface HistoryEntry {
  id: number
  action: string
  date: string
  site: string
  departement: string
}

interface Agence { id: number; nom: string }
interface Departement { id: number; nom: string }

export default function ManagerAssetsInternetPage() {
  const { user } = useAuth()
  const isWritable = user?.role === "Administrateur"

  // --- STATE ---
  const [lines, setLines] = useState<LigneInternet[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>("list")

  // Filtering & Sorting
  const [searchTerm, setSearchTerm] = useState("")
  const [filterAttribute, setFilterAttribute] = useState("number")
  const [filterCondition, setFilterCondition] = useState<FilterCondition>("contains")
  const [sortBy, setSortBy] = useState("number")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")

  // Forms & Selection
  const [formData, setFormData] = useState<Partial<LigneInternet>>({})
  const [selectedLine, setSelectedLine] = useState<LigneInternet | null>(null)
  const [showResignModal, setShowResignModal] = useState(false)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [historySearchTerm, setHistorySearchTerm] = useState("")
  const [isExportingHistory, setIsExportingHistory] = useState(false)

  // Dropdown Data
  const [agences, setAgences] = useState<Agence[]>([])
  const [departements, setDepartements] = useState<Departement[]>([])

  // --- INITIAL LOAD ---
  useEffect(() => {
    fetchLines()
    fetchDropdownData()
  }, [])

  useVisiblePolling(() => fetchLines(), 4000, [])

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

  const fetchDropdownData = async () => {
    try {
      const [resAgences, resDepts] = await Promise.all([
        api.get("/agences").catch(() => ({ data: [] })),
        api.get("/departements").catch(() => ({ data: [] }))
      ])
      setAgences(Array.isArray(resAgences.data) ? resAgences.data : [])
      setDepartements(Array.isArray(resDepts.data) ? resDepts.data : [])
    } catch (e) { console.error(e) }
  }

  // --- LOGIC ---
  const availableDepts = Array.isArray(departements) ? departements : []

  const getFieldValue = (line: LigneInternet, attribute: string): string => {
    switch (attribute) {
      case 'number': return line.sn || "";
      case 'provider': return line.operateur || "";
      case 'site': return line.agenceNom || "";
      case 'status': return line.status || "";
      case 'speed': return line.vitesse || "";
      default: return "";
    }
  }

  // Filtering
  const filtered = lines.filter((line) => {
    if (!searchTerm) return true
    const value = getFieldValue(line, filterAttribute).toLowerCase()
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
  const kpiTotal = lines.length
  const kpiActive = lines.filter(l => l.status === "active").length
  const kpiResigned = lines.filter(l => l.status === "resilier").length

  // --- HANDLERS ---

  const handleSortClick = (attr: string) => {
    if (sortBy === attr) setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    else { setSortBy(attr); setSortOrder("asc") }
  }

  const handleResetFilters = () => {
    setSearchTerm(""); setFilterAttribute("number"); setFilterCondition("contains"); setSortBy("number");
  }

  const handleAdd = () => {
    setFormData({ status: "active", statusAffectation: "non_affecter" })
    setViewMode("add")
  }

  const handleEdit = (line: LigneInternet) => {
    setFormData({ ...line })
    setViewMode("edit")
  }

  const handleView = async (line: LigneInternet) => {
    setSelectedLine(line)
    setViewMode("view")
    try {
      const res = await api.get("/historique-ligne-internet")
      const lineHistory = Array.isArray(res.data) ? res.data
        .filter((h: any) => h.materiel && h.materiel.id === line.id)
        .map((h: any) => ({
          id: h.id,
          action: h.statusEvent,
          date: h.dateEvent,
          site: h.agence ? h.agence.nom : (h.site || "-"),
          departement: h.departement ? h.departement.nom : "-"
        })) : []
      setHistory(lineHistory)
    } catch (e) { setHistory([]) }
  }

  const handleSave = async () => {
    try {
      const payload = {
        ...formData,
        agenceId: formData.agenceId ? parseInt(formData.agenceId.toString()) : null,
        departementId: formData.departementId ? parseInt(formData.departementId.toString()) : null
      }
      if (viewMode === "add") await api.post("/lignes-internet", payload)
      else if (viewMode === "edit" && formData.id) await api.put(`/lignes-internet/${formData.id}`, payload)
      fetchLines()
      setViewMode("list")
    } catch (e) { alert("Erreur lors de l'enregistrement.") }
  }

  const handleDelete = async (id: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette ligne ?")) {
      try { await api.delete(`/lignes-internet/${id}`); fetchLines() }
      catch (e) { alert("Erreur suppression.") }
    }
  }

  const handleActivate = async (id: number) => {
    try { await api.post(`/lignes-internet/activate/${id}`); fetchLines() }
    catch (e) { alert("Erreur activation.") }
  }

  const handleResign = async (id: number) => {
    try { await api.post(`/lignes-internet/resilier/${id}`); fetchLines(); setShowResignModal(false) }
    catch (e) { alert("Erreur résiliation.") }
  }

  const formatExportDate = (value?: string) => {
    return formatDateTimeValue(value, "-")
  }

  const handleExportHistory = async () => {
    if (!selectedLine || !filteredHistory.length) return
    setIsExportingHistory(true)
    try {
      await exportStyledWorkbook({
        fileName: `manager_historique_internet_${selectedLine.sn || selectedLine.id}`,
        subject: "Historique internet manager",
        sheets: [
          {
            name: "Historique internet",
            title: `Ligne Internet : ${selectedLine.sn || selectedLine.id}`,
            subtitle: `Operateur : ${selectedLine.operateur || "-"} | Debit : ${selectedLine.vitesse || "-"}`,
            columns: [
              { header: "Action", key: "action", width: 18 },
              { header: "Site", key: "site", width: 24 },
              { header: "Departement", key: "departement", width: 22 },
              { header: "Date", key: "date", width: 22 },
            ],
            rows: filteredHistory.map((entry) => ({
              action: entry.action || "-",
              site: entry.site || "-",
              departement: entry.departement || "-",
              date: formatExportDate(entry.date),
            })),
          },
        ],
      })
    } finally {
      setIsExportingHistory(false)
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
    th: "px-4 py-2.5 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider bg-secondary/50 border-b border-border select-none",
    td: "px-4 py-2.5 text-[12px] border-b border-border/50 last:border-0",
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

  // 1. FORM VIEW logic has been moved to a modal below

  // 2. VIEW DETAILS
  if (viewMode === "view" && selectedLine) {
    return (
      <div className={styles.pageBg}>
        <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-4">
          <div className="flex justify-between pb-4 border-b border-slate-200">
            <button onClick={() => setViewMode("list")} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors font-medium text-sm"><ArrowRight className="w-4 h-4 rotate-180" /> Retour</button>
            <div className="flex gap-2">
              {isWritable && selectedLine.status !== "resilier" && (
                <button onClick={() => setShowResignModal(true)} className="px-4 py-2 flex items-center gap-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"><AlertCircle className="w-4 h-4" /> Résilier la ligne</button>
              )}
              {isWritable && (
                <button onClick={() => handleEdit(selectedLine)} className={`px-4 py-2 flex items-center gap-2 text-sm ${styles.primaryBtn}`}><Edit2 className="w-4 h-4" /> Modifier</button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="space-y-6">
              <div className={`${styles.card} relative overflow-hidden`}>
                <div className="h-24 bg-slate-900 relative">
                  <div className="absolute inset-0 bg-blue-600/10" />
                  <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.1) 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
                  <div className="absolute -bottom-8 left-6 p-3 bg-white rounded-xl shadow-lg border border-slate-100"><Router className="w-8 h-8 text-blue-600" /></div>
                </div>
                <div className="pt-8 px-4 pb-4">
                  <h1 className="text-xl font-black text-slate-900 tracking-tight">{selectedLine.sn}</h1>
                  <p className="text-slate-500 font-medium mb-4 text-xs">{selectedLine.operateur}</p>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b border-slate-100"><span className="text-sm text-slate-500 font-medium">Débit</span><span className="font-mono font-bold text-slate-900 flex items-center gap-2"><Activity className="w-4 h-4 text-emerald-500" /> {selectedLine.vitesse || "N/A"}</span></div>
                    <div className="flex justify-between items-center py-2 border-b border-slate-100">
                      <span className="text-xs text-slate-500 font-medium">Statut</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${selectedLine.status === "active" ? "bg-emerald-100 text-emerald-700" : selectedLine.status === "resilier" ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"}`}>
                        {selectedLine.status === "active" ? "Actif" : selectedLine.status === "resilier" ? "Résilié" : "Inactif"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-slate-900 text-white rounded-xl p-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5"><Building2 className="w-24 h-24" /></div>
                <div className="relative z-10">
                  <h4 className="text-blue-400 text-[10px] font-bold uppercase tracking-widest mb-3 flex items-center gap-2"><MapPin className="w-3 h-3" /> Localisation</h4>
                  <div><p className="text-slate-400 text-[10px] uppercase font-bold">Site Affecté</p><p className="text-lg font-bold">{selectedLine.agenceNom || "Non assigné"}</p>
                    {selectedLine.departementNom && <p className="text-xs text-blue-200 mt-1 flex items-center gap-2"><Layers className="w-3 h-3" /> {selectedLine.departementNom}</p>}
                  </div>
                  <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-3"><div className="bg-white/10 p-2 rounded-lg"><Server className="w-4 h-4 text-blue-400" /></div><div><p className="text-slate-400 text-[10px] font-medium">Type d'emplacement</p><p className="text-xs font-bold">Infrastructure Physique</p></div></div>
                </div>
              </div>
            </div>
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-800 flex items-center gap-2"><RotateCw className="w-4 h-4 text-blue-600" /> Historique</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportHistory}
                    disabled={isExportingHistory || filteredHistory.length === 0}
                    className="px-3 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-xs font-bold flex items-center gap-2"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    {isExportingHistory ? "Export..." : "Exporter Excel"}
                  </button>
                  <div className="relative w-56"><input type="text" placeholder="Rechercher..." value={historySearchTerm} onChange={(e) => setHistorySearchTerm(e.target.value)} className={`${styles.input} py-1.5 text-xs`} /><Search className="w-3 h-3 text-slate-400 absolute right-3 top-2" /></div>
                </div>
              </div>
              <div className={`${styles.card} border-0 shadow-md`}>
                <table className="w-full text-left">
                  <thead><tr><th className={styles.th}>Action</th><th className={styles.th}>Site</th><th className={styles.th}>Département</th><th className={`${styles.th} text-right`}>Date</th></tr></thead>
                  <tbody>
                    {filteredHistory.map((entry) => (
                      <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3"><span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${entry.action === 'CREATION' ? 'bg-blue-50 text-blue-700' : entry.action === 'RESILIATION' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>{entry.action}</span></td>
                        <td className={`${styles.td} font-medium text-slate-700`}>{entry.site}</td>
                        <td className={`${styles.td} font-medium text-slate-500`}>{entry.departement}</td>
                        <td className={`${styles.td} text-right font-mono text-slate-500`}>{formatDateTimeValue(entry.date, "-")}</td>
                      </tr>
                    ))}
                    {filteredHistory.length === 0 && <tr><td colSpan={4} className="p-12 text-center text-slate-400 italic bg-slate-50/30">Aucun historique disponible</td></tr>}
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
          <div className="flex items-center gap-3"><div className="w-8 h-8 bg-gradient-to-r from-sidebar-primary to-accent rounded-lg flex items-center justify-center text-sidebar-primary-foreground shadow-sm"><Globe className="w-5 h-5" /></div><h1 className="text-lg font-black text-slate-900 leading-none">Internet & WAN</h1></div>
          {isWritable && <button onClick={handleAdd} className={`px-3 py-2 flex items-center gap-2 text-xs ${styles.primaryBtn}`}><Plus className="w-3 h-3" /> Nouvelle Ligne</button>}
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KpiCard label="Total Lignes" value={kpiTotal} icon={Router} color="slate" />
          <KpiCard label="Actives" value={kpiActive} icon={Wifi} color="emerald" />
          <KpiCard label="Résiliées" value={kpiResigned} icon={XCircle} color="red" />
        </div>

        {/* FILTER TOOLBAR */}
        <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col md:flex-row items-center gap-3 w-full">
            <div className="flex items-center gap-2 text-slate-400 px-2"><Filter className="w-5 h-5" /><span className="text-xs font-bold uppercase">Filtrer</span></div>
            <div className="relative w-full md:w-auto">
              <select value={filterAttribute} onChange={(e) => setFilterAttribute(e.target.value)} className="w-full md:w-36 px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
                <option value="number">Numéro</option><option value="provider">Fournisseur</option><option value="site">Site</option><option value="status">Statut</option>
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

        {/* TABLE */}
        <div className={styles.card}>
          <table className="w-full">
            <thead>
              <tr>
                {[{ id: 'number', label: 'Numéro / ID' }, { id: 'provider', label: 'Fournisseur' }, { id: 'site', label: 'Site Affecté' }, { id: 'speed', label: 'Débit' }, { id: 'status', label: 'Statut' }].map((col) => (
                  <th key={col.id} className={`${styles.th} cursor-pointer hover:bg-slate-100 hover:text-blue-600 transition-colors group`} onClick={() => handleSortClick(col.id)}>
                    <div className="flex items-center gap-2">{col.label} <SortIcon column={col.id} /></div>
                  </th>
                ))}
                <th className={`${styles.th} text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {sorted.map((line) => (
                <tr key={line.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-4 py-3"><div className="flex items-center gap-3"><div className="w-6 h-6 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors"><Globe className="w-3 h-3" /></div><span className="font-bold text-slate-700 font-mono text-xs">{line.sn}</span></div></td>
                  <td className="px-4 py-3"><span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-600 border border-slate-200">{line.operateur}</span></td>
                  <td className="px-4 py-3">{line.agenceNom ? <div className="flex items-center gap-2 text-slate-700 font-medium text-xs"><div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center"><Building2 className="w-3 h-3" /></div>{line.agenceNom}</div> : <span className="text-slate-400 italic text-xs">Non assignée</span>}</td>
                  <td className="px-4 py-3 text-xs text-slate-600 font-medium font-mono">{line.vitesse || "-"}</td>
                  <td className="px-4 py-3"><span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${line.status === "active" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : line.status === "resilier" ? "bg-red-50 text-red-600 border border-red-100" : "bg-orange-50 text-orange-600 border border-orange-100"}`}>{line.status === 'active' ? 'Actif' : line.status === 'resilier' ? 'Résilié' : 'Inactif'}</span></td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1 opacity-100">
                      <button onClick={() => handleView(line)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"><Eye className="w-4 h-4" /></button>
                      {isWritable && (
                        <>
                          {/* --- NEW LOGIC: Activate if Inactive OR Resigned --- */}
                          {(line.status === "inactive" || line.status === "resilier") && (
                            <button onClick={() => handleActivate(line.id)} className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-all" title="Activer/Réactiver"><Power className="w-4 h-4" /></button>
                          )}

                          {/* --- NEW LOGIC: Resign if Active --- */}
                          {line.status === "active" && (
                            <button onClick={() => { setSelectedLine(line); setShowResignModal(true); }} className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-all" title="Résilier"><AlertCircle className="w-4 h-4" /></button>
                          )}

                          <button onClick={() => handleEdit(line)} className="p-1.5 text-indigo-400 hover:bg-indigo-50 rounded-lg transition-all"><Edit2 className="w-3 h-3" /></button>
                          <button onClick={() => handleDelete(line.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><Trash2 className="w-3 h-3" /></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {sorted.length === 0 && <tr><td colSpan={6} className="p-12 text-center text-slate-400"><Search className="w-12 h-12 mx-auto mb-3 opacity-20" /><p>Aucun résultat trouvé.</p></td></tr>}
            </tbody>
          </table>
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

        {/* ADD/EDIT FORM MODAL */}
        {(viewMode === "add" || viewMode === "edit") && isWritable && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
              <div className="flex justify-between items-center px-5 py-3 border-b border-slate-100">
                <h2 className="text-lg font-bold text-slate-900">{viewMode === "add" ? "Ajouter une ligne" : "Modifier la ligne"}</h2>
                <button onClick={() => setViewMode("list")} className="p-1.5 hover:bg-slate-100 rounded-full transition-colors text-slate-500"><X className="w-4 h-4" /></button>
              </div>

              <div className="overflow-y-auto p-0">
                <div className="bg-gradient-to-r from-sidebar-primary to-accent text-sidebar-primary-foreground px-5 py-3 flex items-center gap-3 overflow-hidden relative">
                  <div className="bg-white/10 p-1.5 rounded-lg backdrop-blur-sm"><Router className="w-4 h-4 text-blue-400" /></div>
                  <div><h3 className="text-white font-bold text-sm">Configuration Technique</h3><p className="text-slate-400 text-[10px]">Paramètres de la connexion internet</p></div>
                </div>

                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="col-span-1 md:col-span-2">
                      <label className={styles.label}>Numéro de Ligne / Identifiant</label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input type="text" value={formData.sn || ""} onChange={(e) => setFormData({ ...formData, sn: e.target.value })} style={{ paddingLeft: "2.5rem" }} className={`${styles.input} text-base font-mono`} placeholder="Ex: 05 22 00 00 00" />
                      </div>
                    </div>
                    <div><label className={styles.label}>Fournisseur</label><select value={formData.operateur || ""} onChange={(e) => setFormData({ ...formData, operateur: e.target.value })} className={styles.input}><option value="">-</option><option>Orange Entreprise</option><option>IAM</option><option>Inwi Business</option><option>Starlink</option></select></div>
                    <div><label className={styles.label}>Statut</label><select value={formData.status || "active"} onChange={(e) => setFormData({ ...formData, status: e.target.value as any })} className={styles.input}><option value="active">Actif</option><option value="inactive">Inactif</option><option value="resilier">Résilié</option></select></div>
                    <div><label className={styles.label}>Débit</label><div className="relative"><input type="text" value={formData.vitesse || ""} onChange={(e) => setFormData({ ...formData, vitesse: e.target.value })} style={{ paddingRight: "2.5rem" }} className={`${styles.input}`} /><Activity className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /></div></div>
                  </div>
                  <div className="h-px bg-slate-100" />
                  <div>
                    <h3 className="text-blue-600 font-bold text-[10px] uppercase mb-4 flex items-center gap-2"><MapPin className="w-4 h-4" /> Affectation Géographique</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className={styles.label}>Site (Agence)</label><select className={styles.input} value={formData.agenceId || ""} onChange={(e) => setFormData({ ...formData, agenceId: parseInt(e.target.value), departementId: undefined })}><option value="">-</option>{agences.map(a => <option key={a.id} value={a.id}>{a.nom}</option>)}</select></div>
                      <div className={formData.agenceId ? "" : "opacity-50"}><label className={styles.label}>Département</label><select className={styles.input} value={formData.departementId || ""} onChange={(e) => setFormData({ ...formData, departementId: parseInt(e.target.value) })}><option value="">Tout le site</option>{availableDepts.map(d => <option key={d.id} value={d.id}>{d.nom}</option>)}</select></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button onClick={() => setViewMode("list")} className={`px-4 py-2 ${styles.secondaryBtn}`}>Annuler</button>
                <button onClick={handleSave} className={`px-5 py-2 ${styles.primaryBtn}`}>{viewMode === "add" ? "Ajouter la Ligne" : "Enregistrer"}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const KpiCard = ({ label, value, icon: Icon, color }: any) => (<div className={`bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden`}><div className={`absolute top-0 right-0 p-3 opacity-10 text-${color}-600`}><Icon className="w-16 h-16" /></div><p className="text-slate-500 text-[10px] font-bold uppercase mb-1">{label}</p><p className={`text-3xl font-black text-${color}-600`}>{value}</p></div>)
