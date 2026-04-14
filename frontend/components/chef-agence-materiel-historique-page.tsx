"use client"

import { useEffect, useMemo, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import api from "@/lib/api"
import { exportStyledWorkbook } from "@/lib/excel-export"
import {
   Search, RotateCw, History,
   Smartphone, Wifi, CircuitBoard, Package,
   ArrowUpDown, Calendar, CheckCircle2,
   Trash2, ArrowRightLeft, FileText,
   Filter, ChevronUp, ChevronDown, Clock, Plus, X, FileSpreadsheet
} from "lucide-react"

type FilterCondition = "contains" | "startsWith" | "endsWith" | "equals"
interface FilterRule {
   id: string
   attribute: string
   condition: FilterCondition
   term: string
}

interface HistoriqueMaterielRow {
   id: number
   materielId?: number
   typeMateriel?: string
   sn?: string
   numero?: string
   operateur?: string
   materielName?: string
   statusEvent?: string
   dateEvent?: string
   userNom?: string
   userPrenom?: string
   affectedUser?: { id: number; nom?: string; prenom?: string }
}

interface Subordinate {
   id: number
}

// --- FILTER TOOLBAR (Agence style) ---
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
                  className="w-full md:w-40 max-h-56 overflow-y-auto px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500">
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
            <button onClick={() => go("1")} disabled={current === 1} className="p-1 rounded hover:bg-slate-200 text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed">&lt;&lt;</button>
            <button onClick={() => go(String(current - 1))} disabled={current === 1} className="p-1 rounded hover:bg-slate-200 text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed">&lt;</button>
            <div className="flex items-center gap-2 mx-2">
               <span className="text-xs font-bold text-slate-400 uppercase">Page</span>
               <input type="number" value={inputVal} onChange={e => setInputVal(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && go(inputVal)} onBlur={() => go(inputVal)}
                  className="w-10 h-7 text-center text-xs font-bold bg-white border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" />
               <span className="text-xs font-bold text-slate-400">/ {total || 1}</span>
            </div>
            <button onClick={() => go(String(current + 1))} disabled={current === total || total === 0} className="p-1 rounded hover:bg-slate-200 text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed">&gt;</button>
            <button onClick={() => go(String(total))} disabled={current === total || total === 0} className="p-1 rounded hover:bg-slate-200 text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed">&gt;&gt;</button>
         </div>
      </div>
   )
}

export default function ChefAgenceMaterielHistoriquePage() {
   const { user } = useAuth()

   const managerId = useMemo(() => {
      const raw = user?.userId ?? user?.id
      if (raw === null || raw === undefined) return null
      const n = Number(raw)
      return Number.isFinite(n) ? n : null
   }, [user?.userId, user?.id])

   const [rows, setRows] = useState<HistoriqueMaterielRow[]>([])
   const [loading, setLoading] = useState(true)
   const [error, setError] = useState<string | null>(null)

   const [filters, setFilters] = useState<FilterRule[]>([
      { id: "1", attribute: "materielName", condition: "contains", term: "" }
   ])

   // Sorting State
   const [sortBy, setSortBy] = useState("dateEvent")
   const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
   const [page, setPage] = useState(1)
   const [isExporting, setIsExporting] = useState(false)
   const PAGE_SIZE = 12

   useEffect(() => {
      let mounted = true
      const run = async () => {
         if (!managerId) {
            setLoading(false)
            setError("Identifiant manager introuvable.")
            return
         }
         try {
            setLoading(true)
            setError(null)

            const subRes = await api.get("/subordinates", { params: { managerId } })
            const subordinates: Subordinate[] = Array.isArray(subRes.data) ? subRes.data : []

            if (subordinates.length === 0) {
               if (!mounted) return
               setRows([])
               return
            }

            const historyRes = await Promise.all(
               subordinates.map((s) => api.get(`/historique-materiel/user/${s.id}`).catch(() => ({ data: [] })))
            )

            const allRows = historyRes.flatMap((res) => Array.isArray(res.data) ? res.data : [])

            if (!mounted) return
            setRows(allRows)
         } catch (e) {
            console.error(e)
            if (!mounted) return
            setRows([])
            setError("Impossible de charger l'historique.")
         } finally {
            if (mounted) setLoading(false)
         }
      }

      run()
      return () => { mounted = false }
   }, [managerId])

   const handleResetFilters = () => {
      setFilters([{ id: "1", attribute: "materielName", condition: "contains", term: "" }])
      setSortBy("dateEvent")
      setSortOrder("desc")
      setPage(1)
   }

   const getUserName = (row: HistoriqueMaterielRow) => {
      if (row.userNom || row.userPrenom) return `${row.userNom || ""} ${row.userPrenom || ""}`.trim()
      if (row.affectedUser) return `${row.affectedUser.nom || ""} ${row.affectedUser.prenom || ""}`.trim()
      return ""
   }

   const getFieldValue = (row: HistoriqueMaterielRow, attribute: string): string => {
      switch (attribute) {
         case "userName": return getUserName(row).toLowerCase()
         case "materielName": return (row.materielName || "").toLowerCase()
         case "sn": return (row.sn || row.numero || "").toLowerCase()
         case "typeMateriel": return (row.typeMateriel || "").toLowerCase()
         case "statusEvent": return (row.statusEvent || "").toLowerCase()
         case "dateEvent": return (row.dateEvent || "").toLowerCase()
         default:
            // @ts-ignore
            return row[attribute] ? row[attribute].toString().toLowerCase() : ""
      }
   }

   const applyFilters = (data: HistoriqueMaterielRow[], rules: FilterRule[]) =>
      data.filter(item => rules.every(rule => {
         if (!rule.term) return true
         const val = getFieldValue(item, rule.attribute)
         const term = rule.term.toLowerCase()
         switch (rule.condition) {
            case "contains": return val.includes(term)
            case "startsWith": return val.startsWith(term)
            case "endsWith": return val.endsWith(term)
            case "equals": return val === term
            default: return true
         }
      }))

   const filtered = useMemo(() => applyFilters(rows, filters), [rows, filters])

   const sorted = useMemo(() => {
      const data = [...filtered]
      data.sort((a, b) => {
         if (sortBy === "dateEvent") {
            const dateA = a.dateEvent ? new Date(a.dateEvent).getTime() : 0
            const dateB = b.dateEvent ? new Date(b.dateEvent).getTime() : 0
            return sortOrder === "asc" ? dateA - dateB : dateB - dateA
         }
         const aVal = getFieldValue(a, sortBy)
         const bVal = getFieldValue(b, sortBy)
         return sortOrder === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      })
      return data
   }, [filtered, sortBy, sortOrder])

   const totalPages = Math.ceil(sorted.length / PAGE_SIZE)
   const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

   const handleSortClick = (attribute: string) => {
      if (sortBy === attribute) setSortOrder(sortOrder === "asc" ? "desc" : "asc")
      else { setSortBy(attribute); setSortOrder("asc") }
   }

   const getActionStyle = (action: string) => {
      switch (action) {
         case "AFFECTATION": return "bg-emerald-100 text-emerald-800 border-emerald-200"
         case "REAFFECTATION": return "bg-blue-100 text-blue-800 border-blue-200"
         case "RECEPTION": return "bg-sky-100 text-sky-800 border-sky-200"
         case "ANNULATION": return "bg-red-100 text-red-800 border-red-200"
         case "DESAFFECTATION": return "bg-amber-100 text-amber-800 border-amber-200"
         default: return "bg-slate-100 text-slate-800 border-slate-200"
      }
   }

   const getActionIcon = (action: string) => {
      switch (action) {
         case "AFFECTATION": return <ArrowRightLeft className="w-3 h-3" />
         case "REAFFECTATION": return <ArrowRightLeft className="w-3 h-3" />
         case "RECEPTION": return <CheckCircle2 className="w-3 h-3" />
         case "ANNULATION": return <Trash2 className="w-3 h-3" />
         case "DESAFFECTATION": return <FileText className="w-3 h-3" />
         default: return <FileText className="w-3 h-3" />
      }
   }

   const getAssetTypeIcon = (type: string) => {
      const t = (type || "").toLowerCase()
      if (t.includes("sim")) return <CircuitBoard className="w-4 h-4" />
      if (t.includes("mobile") || t.includes("gsm")) return <Smartphone className="w-4 h-4" />
      if (t.includes("internet") || t.includes("ligne")) return <Wifi className="w-4 h-4" />
      return <Package className="w-4 h-4" />
   }

   const getAssetTypeStyle = (type: string) => {
      const t = (type || "").toLowerCase()
      if (t.includes("sim")) return "bg-orange-50 text-orange-700 border-orange-200"
      if (t.includes("mobile") || t.includes("gsm")) return "bg-purple-50 text-purple-700 border-purple-200"
      if (t.includes("internet") || t.includes("ligne")) return "bg-cyan-50 text-cyan-700 border-cyan-200"
      return "bg-slate-50 text-slate-700 border-slate-200"
   }

   const formatExportDate = (value?: string) => {
      if (!value) return "-"
      const date = new Date(value)
      return Number.isNaN(date.getTime()) ? value : date.toLocaleString("fr-FR")
   }

   const handleExport = async () => {
      if (!sorted.length) return
      setIsExporting(true)
      try {
         await exportStyledWorkbook({
            fileName: "manager_historique_materiel",
            subject: "Historique materiel manager",
            sheets: [
               {
                  name: "Historique materiel",
                  title: "Historique materiel manager",
                  columns: [
                     { header: "Equipement", key: "materielName", width: 22 },
                     { header: "SN", key: "sn", width: 18 },
                     { header: "Type", key: "typeMateriel", width: 20 },
                     { header: "Action", key: "statusEvent", width: 18 },
                     { header: "Affecte a", key: "userName", width: 24 },
                     { header: "Date", key: "dateEvent", width: 22 },
                  ],
                  rows: sorted.map((row) => ({
                     materielName: row.materielName || "-",
                     sn: row.sn || row.numero || "-",
                     typeMateriel: row.typeMateriel || "-",
                     statusEvent: row.statusEvent || "-",
                     userName: getUserName(row) || "-",
                     dateEvent: formatExportDate(row.dateEvent),
                  })),
               },
            ],
         })
      } finally {
         setIsExporting(false)
      }
   }

   const SortIcon = ({ column }: { column: string }) => {
      if (sortBy !== column) return <ArrowUpDown className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
      return sortOrder === "asc" ? <ChevronUp className="w-3 h-3 text-blue-600" /> : <ChevronDown className="w-3 h-3 text-blue-600" />
   }

   const styles = {
      pageBg: "min-h-full bg-background font-sans text-foreground",
      card: "bg-card border border-border rounded-xl shadow-sm overflow-hidden",
      header: "bg-card border-b border-border sticky top-0 z-20 backdrop-blur-md bg-card/80",
      th: "px-4 py-2.5 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider bg-secondary/50 border-b border-border select-none",
      td: "px-4 py-2.5 text-[12px] border-b border-border/50 last:border-0",
   }

   return (
      <div className={styles.pageBg}>
         {/* Top Navbar */}
         <div className={styles.header}>
            <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
               <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-sidebar-primary to-accent rounded-lg flex items-center justify-center text-sidebar-primary-foreground shadow-sm">
                     <History className="w-4 h-4" />
                  </div>
                  <div>
                     <h1 className="text-lg font-black text-slate-900 leading-none">Historique du Matériel</h1>
                  </div>
               </div>
               <button
                  onClick={handleExport}
                  disabled={isExporting || sorted.length === 0}
                  className="px-3 py-2 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-xs font-bold flex items-center gap-2"
               >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  {isExporting ? "Export..." : "Exporter Excel"}
               </button>
            </div>
         </div>

         <div className="max-w-7xl mx-auto p-4 space-y-6">

            {/* FILTER TOOLBAR */}
            <div className="flex items-start gap-3">
               <div className="flex-1 w-full">
                  <FilterToolbar
                     filters={filters}
                     setFilters={(r: FilterRule[]) => { setFilters(r); setPage(1) }}
                     attributes={[
                        { value: "materielName", label: "Équipement" },
                        { value: "sn", label: "SN" },
                        { value: "typeMateriel", label: "Type" },
                        { value: "statusEvent", label: "Action" },
                        { value: "userName", label: "Affecté à" },
                        { value: "dateEvent", label: "Date" },
                     ]}
                  />
               </div>
            </div>

            {/* History Table */}
            <div className={styles.card}>
               <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px]">
                     <thead>
                        <tr>
                           {[
                              { id: 'dateEvent', label: 'Date' },
                              { id: 'materielName', label: 'Équipement' },
                              { id: 'typeMateriel', label: 'Type' },
                              { id: 'statusEvent', label: 'Action' },
                              { id: 'userName', label: 'Affecté à' }
                           ].map((col) => (
                              <th
                                 key={col.id}
                                 className={`${styles.th} cursor-pointer hover:bg-slate-100 hover:text-blue-600 transition-colors group`}
                                 onClick={() => handleSortClick(col.id)}
                              >
                                 <div className="flex items-center gap-2">
                                    {col.label} <SortIcon column={col.id} />
                                 </div>
                              </th>
                           ))}
                           <th className={`${styles.th} text-right`}>Heure</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100 bg-white">
                        {loading ? (
                           <tr>
                              <td colSpan={6} className="px-4 py-12 text-center text-slate-400">Chargement...</td>
                           </tr>
                        ) : error ? (
                           <tr>
                              <td colSpan={6} className="px-4 py-12 text-center text-red-500">{error}</td>
                           </tr>
                        ) : paginated.map((hist) => (
                           <tr key={hist.id} className="hover:bg-slate-50/80 transition-colors group">
                              <td className="px-4 py-2">
                                 <div className="flex items-center gap-2 text-xs font-mono font-medium text-slate-600">
                                    <Calendar className="w-3 h-3 text-slate-400" />
                                    {hist.dateEvent ? new Date(hist.dateEvent).toLocaleDateString("fr-FR") : "-"}
                                 </div>
                              </td>
                              <td className="px-4 py-2">
                                 <div className="text-xs font-bold text-slate-800">{hist.materielName || "-"}</div>
                                 <div className="text-[10px] text-slate-400 font-mono">SN: {hist.sn || hist.numero || "-"}</div>
                              </td>
                              <td className="px-4 py-2">
                                 <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getAssetTypeStyle(hist.typeMateriel || "")}`}>
                                    {getAssetTypeIcon(hist.typeMateriel || "")}
                                    {hist.typeMateriel || "-"}
                                 </span>
                              </td>
                              <td className="px-4 py-2">
                                 <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getActionStyle(hist.statusEvent || "")}`}>
                                    {getActionIcon(hist.statusEvent || "")}
                                    {hist.statusEvent || "-"}
                                 </span>
                              </td>
                              <td className="px-4 py-2">
                                 {getUserName(hist) ? (
                                    <span className="text-xs font-medium text-slate-700 flex items-center gap-2">
                                       <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-[10px] font-bold">
                                          {getUserName(hist).charAt(0)}
                                       </span>
                                       {getUserName(hist)}
                                    </span>
                                 ) : <span className="text-slate-400 italic text-xs">-</span>}
                              </td>
                              <td className="px-4 py-2 text-right">
                                 <div className="flex items-center justify-end gap-1 text-xs text-slate-400 font-mono">
                                    <Clock className="w-3 h-3 opacity-50" />
                                    {hist.dateEvent ? new Date(hist.dateEvent).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "-"}
                                 </div>
                              </td>
                           </tr>
                        ))}
                        {!loading && !error && sorted.length === 0 && (
                           <tr>
                              <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                                 <Search className="w-10 h-10 mx-auto mb-2 opacity-20" />
                                 <p className="text-xs">Aucun historique trouvé pour les critères sélectionnés.</p>
                              </td>
                           </tr>
                        )}
                     </tbody>
                  </table>
               </div>
               {totalPages > 1 && <Pagination current={page} total={totalPages} setPage={setPage} />}
            </div>
         </div>
      </div>
   )
}
