"use client"

import { useAuth } from "@/lib/auth-context"
import api from "@/lib/api"
import { exportStyledWorkbook } from "@/lib/excel-export"
import { useState, useEffect, useMemo } from "react"
import {
   Package, CheckCircle2, AlertCircle, Users,
   Search, RotateCw, ArrowUpDown, X, ShieldAlert,
   Smartphone, Wifi, CircuitBoard, ClipboardCheck,
   Filter, ChevronUp, ChevronDown, Clock,
   ChevronDown as ChevronDownIcon, FileSpreadsheet
} from "lucide-react"

interface Subordinate {
   id: number
   nom?: string
   prenom?: string
   matricule?: string
}

interface MaterielItem {
   id: number
   materielName?: string
   sn?: string
   numero?: string
   typeMateriel?: string
   statusAffectation?: string
   dateEnvoie?: string
   affectedUser?: Subordinate
   __ownerId?: number
}

interface RowItem {
   id: number
   userId: number
   userNom: string
   userPrenom: string
   userMatricule: string
   materielName: string
   sn: string
   typeMateriel: string
   dateEnvoie: string
   statusAffectation: string
}

type FilterCondition = "contains" | "startsWith" | "endsWith" | "equals"

const MOTIF_OPTIONS = [
   "En panne",
   "N'est pas arrivé",
]

export default function ChefAgenceMaterielCollaborateurPage() {
   const { user } = useAuth()

   const managerId = useMemo(() => {
      const raw = user?.userId ?? user?.id
      if (raw === null || raw === undefined) return null
      const n = Number(raw)
      return Number.isFinite(n) ? n : null
   }, [user?.userId, user?.id])

   // --- State ---
   const [subordinates, setSubordinates] = useState<Subordinate[]>([])
   const [rows, setRows] = useState<RowItem[]>([])
   const [allMateriels, setAllMateriels] = useState<MaterielItem[]>([])
   const [loading, setLoading] = useState(true)
   const [error, setError] = useState<string | null>(null)

   // Advanced Filter State
   const [searchTerm, setSearchTerm] = useState("")
   const [filterAttribute, setFilterAttribute] = useState("userName")
   const [filterCondition, setFilterCondition] = useState<FilterCondition>("contains")

   // Sorting State
   const [sortBy, setSortBy] = useState("dateEnvoie")
   const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

   // Modals
   const [selectedRow, setSelectedRow] = useState<RowItem | null>(null)
   const [alertingRow, setAlertingRow] = useState<RowItem | null>(null)
   const [selectedMotif, setSelectedMotif] = useState("")
   const [commentaire, setCommentaire] = useState("")
   const [isExporting, setIsExporting] = useState(false)

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
            const subList: Subordinate[] = Array.isArray(subRes.data) ? subRes.data : []
            if (!mounted) return
            setSubordinates(subList)

            if (subList.length === 0) {
               setRows([])
               setAllMateriels([])
               return
            }

            const materielRes = await Promise.all(
               subList.map((s) => api.get(`/subordinates/${s.id}/materiel/all`).catch(() => ({ data: [] })))
            )

            const all: MaterielItem[] = materielRes.flatMap((res, index) => {
               const list: MaterielItem[] = Array.isArray(res.data) ? res.data : []
               return list.map((m) => ({ ...m, __ownerId: subList[index]?.id }))
            })

            const subById = new Map<number, Subordinate>()
            subList.forEach((s) => subById.set(s.id, s))

            const pendingRows: RowItem[] = all
               .filter((m) => (m.statusAffectation || "").toLowerCase() === "affecter")
               .map((m) => {
                  const owner = m.affectedUser || (m.__ownerId ? subById.get(m.__ownerId) : undefined)
                  const userId = owner?.id ?? m.__ownerId ?? 0
                  return {
                     id: m.id,
                     userId,
                     userNom: owner?.nom || "",
                     userPrenom: owner?.prenom || "",
                     userMatricule: owner?.matricule || "",
                     materielName: m.materielName || "",
                     sn: m.sn || m.numero || "",
                     typeMateriel: m.typeMateriel || "",
                     dateEnvoie: m.dateEnvoie || "",
                     statusAffectation: m.statusAffectation || "",
                  }
               })

            if (!mounted) return
            setAllMateriels(all)
            setRows(pendingRows)
         } catch (e) {
            console.error(e)
            if (!mounted) return
            setRows([])
            setAllMateriels([])
            setError("Impossible de charger les données.")
         } finally {
            if (mounted) setLoading(false)
         }
      }

      run()
      return () => { mounted = false }
   }, [managerId])

   const refresh = async () => {
      if (!managerId) return
      try {
         setLoading(true)
         setError(null)
         const subRes = await api.get("/subordinates", { params: { managerId } })
         const subList: Subordinate[] = Array.isArray(subRes.data) ? subRes.data : []
         setSubordinates(subList)

         const materielRes = await Promise.all(
            subList.map((s) => api.get(`/subordinates/${s.id}/materiel/all`).catch(() => ({ data: [] })))
         )

         const all: MaterielItem[] = materielRes.flatMap((res, index) => {
            const list: MaterielItem[] = Array.isArray(res.data) ? res.data : []
            return list.map((m) => ({ ...m, __ownerId: subList[index]?.id }))
         })

         const subById = new Map<number, Subordinate>()
         subList.forEach((s) => subById.set(s.id, s))

         const pendingRows: RowItem[] = all
            .filter((m) => (m.statusAffectation || "").toLowerCase() === "affecter")
            .map((m) => {
               const owner = m.affectedUser || (m.__ownerId ? subById.get(m.__ownerId) : undefined)
               const userId = owner?.id ?? m.__ownerId ?? 0
               return {
                  id: m.id,
                  userId,
                  userNom: owner?.nom || "",
                  userPrenom: owner?.prenom || "",
                  userMatricule: owner?.matricule || "",
                  materielName: m.materielName || "",
                  sn: m.sn || m.numero || "",
                  typeMateriel: m.typeMateriel || "",
                  dateEnvoie: m.dateEnvoie || "",
                  statusAffectation: m.statusAffectation || "",
               }
            })

         setAllMateriels(all)
         setRows(pendingRows)
      } catch (e) {
         console.error(e)
         setRows([])
         setAllMateriels([])
         setError("Impossible de charger les données.")
      } finally {
         setLoading(false)
      }
   }

   // --- Logic: Search & Sort ---
   const getFieldValue = (item: RowItem, attribute: string): string => {
      switch (attribute) {
         case "userName":
            return `${item.userNom} ${item.userPrenom}`.trim().toLowerCase()
         case "matricule":
            return (item.userMatricule || "").toLowerCase()
         case "materielName":
            return (item.materielName || "").toLowerCase()
         case "sn":
            return (item.sn || "").toLowerCase()
         case "typeMateriel":
            return (item.typeMateriel || "").toLowerCase()
         case "dateEnvoie":
            return (item.dateEnvoie || "").toLowerCase()
         default:
            // @ts-ignore
            return item[attribute] ? item[attribute].toString().toLowerCase() : ""
      }
   }

   const filtered = rows.filter((aff) => {
      if (!searchTerm) return true
      const value = getFieldValue(aff, filterAttribute)
      const term = searchTerm.toLowerCase()

      switch (filterCondition) {
         case "contains": return value.includes(term)
         case "startsWith": return value.startsWith(term)
         case "endsWith": return value.endsWith(term)
         case "equals": return value === term
         default: return true
      }
   })

   const sorted = [...filtered].sort((a, b) => {
      if (sortBy === "dateEnvoie") {
         const dateA = a.dateEnvoie ? new Date(a.dateEnvoie).getTime() : 0
         const dateB = b.dateEnvoie ? new Date(b.dateEnvoie).getTime() : 0
         return sortOrder === "asc" ? dateA - dateB : dateB - dateA
      }

      const aVal = getFieldValue(a, sortBy)
      const bVal = getFieldValue(b, sortBy)
      const comparison = aVal.localeCompare(bVal)
      return sortOrder === "asc" ? comparison : -comparison
   })

   // --- Handlers ---
   const handleSortClick = (attribute: string) => {
      if (sortBy === attribute) {
         setSortOrder(sortOrder === "asc" ? "desc" : "asc")
      } else {
         setSortBy(attribute)
         setSortOrder("asc")
      }
   }

   const handleResetFilters = () => {
      setSearchTerm("")
      setFilterAttribute("userName")
      setFilterCondition("contains")
      setSortBy("dateEnvoie")
      setSortOrder("desc")
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
            fileName: "manager_materiel_collaborateurs",
            subject: "Materiel collaborateurs manager",
            sheets: [
               {
                  name: "Materiel collaborateurs",
                  title: "Materiel collaborateurs",
                  columns: [
                     { header: "Collaborateur", key: "collaborateur", width: 24 },
                     { header: "Matricule", key: "matricule", width: 18 },
                     { header: "Materiel", key: "materiel", width: 22 },
                     { header: "SN", key: "sn", width: 18 },
                     { header: "Type", key: "type", width: 20 },
                     { header: "Date envoi", key: "dateEnvoie", width: 22 },
                     { header: "Statut", key: "statut", width: 18 },
                  ],
                  rows: sorted.map((row) => ({
                     collaborateur: `${row.userPrenom} ${row.userNom}`.trim() || "-",
                     matricule: row.userMatricule || "-",
                     materiel: row.materielName || "-",
                     sn: row.sn || "-",
                     type: row.typeMateriel || "-",
                     dateEnvoie: formatExportDate(row.dateEnvoie),
                     statut: row.statusAffectation || "-",
                  })),
               },
            ],
         })
      } finally {
         setIsExporting(false)
      }
   }

   const handleConfirmReception = async () => {
      if (!selectedRow) return
      try {
         await api.put(`/subordinates/${selectedRow.userId}/materiel/${selectedRow.id}/accuser`)
         setSelectedRow(null)
         await refresh()
      } catch (e) {
         alert("Erreur lors de la confirmation")
      }
   }

   const handleAlerte = async () => {
      if (!alertingRow || !selectedMotif) return
      try {
         await api.put(`/subordinates/${alertingRow.userId}/materiel/${alertingRow.id}/annuler`, {
            motif: selectedMotif,
            commentaire: commentaire.trim() || null
         })
         setSelectedMotif("")
         setCommentaire("")
         setAlertingRow(null)
         await refresh()
      } catch (e) { alert("Erreur lors du signalement") }
   }

   // --- Helpers Icons ---
   const getIcon = (type: string) => {
      const t = (type || "").toLowerCase()
      if (t.includes("sim")) return <CircuitBoard className="w-4 h-4" />
      if (t.includes("internet") || t.includes("ligne")) return <Wifi className="w-4 h-4" />
      if (t.includes("mobile") || t.includes("gsm")) return <Smartphone className="w-4 h-4" />
      return <Package className="w-4 h-4" />
   }

   // --- Design System ---
   const styles = {
      pageBg: "min-h-full bg-background font-sans text-foreground",
      card: "bg-card border border-border rounded-xl shadow-sm overflow-hidden",
      header: "bg-card border-b border-border sticky top-0 z-20 backdrop-blur-md bg-card/80",
      primaryBtn: "btn btn-primary text-xs",
      secondaryBtn: "btn btn-secondary text-xs",
      dangerBtn: "btn btn-danger text-xs",
      input: "mdm-input text-sm",
      label: "block text-xs font-semibold uppercase text-muted-foreground mb-1.5 tracking-wide",
      th: "px-4 py-2.5 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider bg-secondary/50 border-b border-border select-none",
      td: "px-4 py-2.5 text-[12px] border-b border-border/50 last:border-0",
   }

   const inputStyle = "w-full px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
   const labelStyle = "block text-xs font-bold uppercase text-slate-500 mb-2 tracking-wide"

   const SortIcon = ({ column }: { column: string }) => {
      if (sortBy !== column) return <ArrowUpDown className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
      return sortOrder === "asc" ? <ChevronUp className="w-3 h-3 text-blue-600" /> : <ChevronDown className="w-3 h-3 text-blue-600" />
   }

   const filterLabels: Record<string, string> = {
      userName: "Collaborateur",
      matricule: "Matricule",
      materielName: "Matériel",
      sn: "SN",
      typeMateriel: "Type",
      dateEnvoie: "Date Envoi",
   }

   const pendingCount = allMateriels.filter(m => (m.statusAffectation || "").toLowerCase() === "affecter").length
   const confirmedCount = allMateriels.filter(m => (m.statusAffectation || "").toLowerCase() === "recu").length

   return (
      <div className={styles.pageBg}>

         {/* Top Navbar */}
         <div className={styles.header}>
            <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
               <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-sidebar-primary to-accent rounded-lg flex items-center justify-center text-sidebar-primary-foreground shadow-sm">
                     <Users className="w-4 h-4" />
                  </div>
                  <div>
                     <h1 className="text-lg font-black text-slate-900 leading-none">Matériel Collaborateurs</h1>
                  </div>
               </div>
            </div>
         </div>

         <div className="max-w-7xl mx-auto p-4 space-y-6">

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-blue-200 transition-all">
                  <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                     <Users className="w-16 h-16 text-slate-900" />
                  </div>
                  <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Collaborateurs</p>
                  <p className="text-3xl font-black text-slate-900">{subordinates.length}</p>
               </div>

               <div className="bg-white p-4 rounded-xl border border-yellow-100 shadow-sm relative overflow-hidden group hover:border-yellow-200 transition-all">
                  <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                     <Clock className="w-16 h-16 text-yellow-600" />
                  </div>
                  <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">En Attente Validation</p>
                  <p className="text-3xl font-black text-yellow-600">{pendingCount}</p>
               </div>

               <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-sm relative overflow-hidden group hover:border-emerald-200 transition-all">
                  <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                     <CheckCircle2 className="w-16 h-16 text-emerald-600" />
                  </div>
                  <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Matériel Confirmé</p>
                  <p className="text-3xl font-black text-emerald-600">{confirmedCount}</p>
               </div>
            </div>

            {/* ----------------------------------------------------------------------- */}
            {/* ADVANCED FILTER TOOLBAR (UPDATED)                                       */}
            {/* ----------------------------------------------------------------------- */}
            <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">

               <div className="flex flex-col md:flex-row items-center gap-3 w-full">
                  <div className="flex items-center gap-2 text-slate-400 px-2">
                     <Filter className="w-4 h-4" />
                     <span className="text-[10px] font-bold uppercase">Filtrer</span>
                  </div>

                  {/* 1. Attribute Selector */}
                  <div className="relative w-full md:w-auto">
                     <select
                        value={filterAttribute}
                        onChange={(e) => setFilterAttribute(e.target.value)}
                        className="w-full md:w-40 px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                     >
                        <option value="userName">Collaborateur</option>
                        <option value="matricule">Matricule</option>
                        <option value="materielName">Matériel</option>
                        <option value="sn">SN</option>
                        <option value="typeMateriel">Type</option>
                        <option value="dateEnvoie">Date Envoi</option>
                     </select>
                  </div>

                  {/* 2. Condition Selector */}
                  <div className="relative w-full md:w-auto">
                     <select
                        value={filterCondition}
                        onChange={(e) => setFilterCondition(e.target.value as FilterCondition)}
                        className="w-full md:w-36 px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                     >
                        <option value="contains">Contient</option>
                        <option value="startsWith">Commence par</option>
                        <option value="endsWith">Finit par</option>
                        <option value="equals">Egal Ã </option>
                     </select>
                  </div>

                  {/* 3. Search Input */}
                  <div className="relative flex-1 w-full">
                     <Search className="absolute left-3 top-2.5 w-3 h-3 text-slate-400" />
                     <input
                        type="text"
                        placeholder={`Rechercher dans ${filterLabels[filterAttribute] || filterAttribute}...`}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                     />
                  </div>
               </div>

               <button
                  onClick={handleResetFilters}
                  className="p-2 hover:bg-slate-100 text-slate-400 hover:text-blue-600 rounded-lg transition-all border border-transparent hover:border-slate-100"
                  title="Réinitialiser les filtres"
               >
                  <RotateCw className="w-4 h-4" />
               </button>
               <button
                  onClick={handleExport}
                  disabled={isExporting || sorted.length === 0}
                  className="px-3 py-2 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-xs font-bold flex items-center gap-2"
               >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  {isExporting ? "Export..." : "Exporter Excel"}
               </button>
            </div>

            {/* Main Table */}
            <div className={styles.card}>
               <table className="w-full">
                  <thead>
                     <tr>
                        {[
                           { id: 'userName', label: 'Collaborateur' },
                           { id: 'materielName', label: 'Matériel' },
                           { id: 'sn', label: 'SN' },
                           { id: 'typeMateriel', label: 'Type' },
                           { id: 'dateEnvoie', label: 'Date Envoi' }
                        ].map((col) => (
                           <th key={col.id} className="px-4 py-2 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50/50 border-b border-slate-200 select-none cursor-pointer hover:bg-slate-100 hover:text-blue-600 transition-colors group" onClick={() => handleSortClick(col.id)}>
                              <div className="flex items-center gap-2">{col.label} <SortIcon column={col.id} /></div>
                           </th>
                        ))}
                        <th className="px-4 py-2 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50/50 border-b border-slate-200 select-none">Statut</th>
                        <th className="px-4 py-2 text-right text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50/50 border-b border-slate-200 select-none">Actions</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                     {loading ? (
                        <tr>
                           <td colSpan={7} className="px-4 py-12 text-center text-slate-400">Chargement...</td>
                        </tr>
                     ) : error ? (
                        <tr>
                           <td colSpan={7} className="px-4 py-12 text-center text-red-500">{error}</td>
                        </tr>
                     ) : sorted.length > 0 ? (
                        sorted.map((aff) => (
                           <tr key={aff.id} className="hover:bg-slate-50/80 transition-colors group">
                              <td className="px-4 py-2">
                                 <div className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-[10px]">
                                       {(aff.userNom || "?").charAt(0)}
                                    </div>
                                    <div>
                                       <div className="text-xs font-bold text-slate-800">{`${aff.userPrenom} ${aff.userNom}`.trim() || "Inconnu"}</div>
                                       <div className="text-[10px] text-slate-500">Mat: {aff.userMatricule || "N/A"}</div>
                                    </div>
                                 </div>
                              </td>
                              <td className="px-4 py-2">
                                 <span className="text-xs font-medium text-slate-700">{aff.materielName || "-"}</span>
                              </td>
                              <td className="px-4 py-2 text-xs text-slate-600 font-mono">
                                 {aff.sn || "-"}
                              </td>
                              <td className="px-4 py-2">
                                 <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-600 border border-slate-200">
                                    {getIcon(aff.typeMateriel)} {aff.typeMateriel || "-"}
                                 </span>
                              </td>
                              <td className="px-4 py-2 text-xs text-slate-600 font-mono">
                                 {aff.dateEnvoie || "-"}
                              </td>
                              <td className="px-4 py-2">
                                 <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-yellow-50 text-yellow-700 border border-yellow-200 animate-pulse">
                                    <AlertCircle className="w-3 h-3" /> En Attente
                                 </span>
                              </td>
                              <td className="px-4 py-2 text-right">
                                 <div className="flex justify-end gap-2 opacity-100">
                                    <button
                                       onClick={() => setSelectedRow(aff)}
                                       className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold uppercase transition-all flex items-center gap-1 shadow-sm"
                                    >
                                       <ClipboardCheck className="w-3 h-3" /> Confirmer
                                    </button>
                                    <button
                                       onClick={() => { setAlertingRow(aff); setSelectedMotif(""); setCommentaire(""); }}
                                       className="px-2 py-1 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-[10px] font-bold uppercase transition-all flex items-center gap-1"
                                    >
                                       <X className="w-3 h-3" /> Signaler
                                    </button>
                                 </div>
                              </td>
                           </tr>
                        ))
                     ) : (
                        <tr>
                           <td colSpan={7} className="px-4 py-12 text-center">
                              <div className="flex flex-col items-center justify-center text-slate-400">
                                 <div className="bg-slate-50 p-3 rounded-full mb-2">
                                    <CheckCircle2 className="w-6 h-6 text-emerald-500 opacity-50" />
                                 </div>
                                 <p className="font-medium text-slate-900 text-sm">Tout est à jour</p>
                                 <p className="text-xs text-slate-500 mt-1">Aucun matériel en attente de validation.</p>
                              </div>
                           </td>
                        </tr>
                     )}
                  </tbody>
               </table>
            </div>

            {/* Confirm Reception Modal (same design as chef-agence-materiel-affecte-page) */}
            {selectedRow && (
               <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                  <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 p-0 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                     <div className="bg-gradient-to-r from-emerald-800 to-emerald-600 p-6 shadow-lg flex items-center justify-between overflow-hidden relative ">
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                           <CheckCircle2 className="w-5 h-5 text-emerald-400" /> Validation Réception
                        </h2>
                        <button onClick={() => setSelectedRow(null)} className="text-emerald-200 hover:text-white transition-colors">
                           <X className="w-5 h-5" />
                        </button>
                     </div>

                     <div className="p-6 space-y-4">
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1">
                           <p className="text-[10px] font-bold text-slate-400 uppercase">Equipement à valider</p>
                           <p className="font-bold text-slate-800 text-base">{selectedRow.materielName || "-"}</p>
                           <p className="text-xs text-slate-500 font-mono">SN: {selectedRow.sn || "-"}</p>
                           <p className="text-[10px] text-emerald-600 font-bold mt-1">
                              Collaborateur: {`${selectedRow.userPrenom} ${selectedRow.userNom}`.trim() || "-"}
                           </p>
                        </div>

                        <p className="text-xs text-slate-500 italic leading-relaxed">
                           En cliquant sur Valider, vous confirmez avoir bien reçu et pris possession du matériel ci-dessus.
                        </p>

                        <button
                           onClick={handleConfirmReception}
                           className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-widest rounded-xl shadow-lg transition-all"
                        >
                           Valider la Réception
                        </button>
                     </div>
                  </div>
               </div>
            )}

            {/* Alert / Signaler Modal (same design as chef-agence-materiel-affecte-page) */}
            {alertingRow && (
               <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                  <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 p-0 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                     <div className="bg-red-50 px-6 py-4 border-b border-red-100 flex items-center justify-between">
                        <h2 className="text-lg font-bold text-red-900 flex items-center gap-2">
                           <ShieldAlert className="w-5 h-5" /> Signaler un Incident
                        </h2>
                        <button onClick={() => { setAlertingRow(null); setSelectedMotif(""); setCommentaire(""); }} className="text-red-400 hover:text-red-700 transition-colors">
                           <X className="w-5 h-5" />
                        </button>
                     </div>

                     <div className="p-6 space-y-5">
                        <p className="text-slate-600 text-xs font-medium">
                           Veuillez préciser la nature de l'anomalie rencontrée pour procéder Ã  l'annulation.
                        </p>

                        {/* Motif (required) */}
                        <div>
                           <label className={labelStyle}>
                              Motif <span className="text-red-500">*</span>
                           </label>
                           <div className="relative">
                              <select
                                 value={selectedMotif}
                                 onChange={(e) => setSelectedMotif(e.target.value)}
                                 className={`${inputStyle} appearance-none pr-10 ${!selectedMotif ? "text-slate-400" : "text-slate-900"}`}
                              >
                                 <option value="">Sélectionner un motif...</option>
                                 {MOTIF_OPTIONS.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                 ))}
                              </select>
                              <ChevronDownIcon className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                           </div>
                           {!selectedMotif && (
                              <p className="text-[10px] text-red-500 mt-1">Le motif est requis pour signaler.</p>
                           )}
                        </div>

                        {/* Commentaire (optional) */}
                        <div>
                           <label className={labelStyle}>
                              Commentaire <span className="text-slate-400 font-normal normal-case">(optionnel)</span>
                           </label>
                           <textarea
                              rows={3}
                              placeholder="Informations supplémentaires sur l'incident..."
                              value={commentaire}
                              onChange={(e) => setCommentaire(e.target.value)}
                              className={`${inputStyle} resize-none rounded-xl`}
                           />
                        </div>

                        <button
                           onClick={handleAlerte}
                           disabled={!selectedMotif}
                           className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-widest rounded-xl shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                           Envoyer le Signalement
                        </button>
                     </div>
                  </div>
               </div>
            )}

         </div>
      </div>
   )
}
