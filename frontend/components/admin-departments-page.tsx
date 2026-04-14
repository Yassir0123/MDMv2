"use client"

import { useState } from "react"
import { FAKE_DEPARTMENTS, FAKE_USERS } from "@/lib/constants"
import { exportStyledWorkbook } from "@/lib/excel-export"
import {
   Search, ChevronDown, X, Eye, Trash2, Plus, Edit2,
   History, RotateCw, ArrowUpDown, Building, Users,
   CheckCircle2, XCircle, ArrowLeft, FileSpreadsheet
} from "lucide-react"

type ViewMode = "list" | "add" | "edit" | "history"

interface Department {
   id: string
   name: string
   chief: string
   memberCount: number
   status: "Active" | "Inactive"
   createdDate?: string
}

interface FormData {
   id: string
   name: string
   chief: string
   status: "Active" | "Inactive"
}

export default function AdminDepartmentsPage() {
   // --- State ---
   const [departments, setDepartments] = useState<Department[]>(FAKE_DEPARTMENTS || [])
   const [searchTerm, setSearchTerm] = useState("")
   const [viewMode, setViewMode] = useState<ViewMode>("list")

   // Sorting (Direct control)
   const [sortBy, setSortBy] = useState("name")
   const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")

   const [formData, setFormData] = useState<FormData>({
      id: "", name: "", chief: "", status: "Active",
   })
   const [selectedDept, setSelectedDept] = useState<Department | null>(null)
   const [showDetailModal, setShowDetailModal] = useState(false)

   // History State
   const [historySearchTerm, setHistorySearchTerm] = useState("")
   const [historySortOrder, setHistorySortOrder] = useState<"asc" | "desc">("desc")
   const [isExportingHistory, setIsExportingHistory] = useState(false)

   // --- Logic ---

   // Filtering
   const filtered = departments.filter((dept) => {
      if (!searchTerm) return true
      const searchValue = searchTerm.toLowerCase()
      return (
         dept.name.toLowerCase().includes(searchValue) ||
         dept.chief.toLowerCase().includes(searchValue)
      )
   })

   // Sorting
   const sorted = [...filtered].sort((a, b) => {
      // @ts-ignore
      const aVal = (a[sortBy] || "").toString()
      // @ts-ignore
      const bVal = (b[sortBy] || "").toString()
      const comparison = aVal.localeCompare(bVal)
      return sortOrder === "asc" ? comparison : -comparison
   })

   // History Logic
   const generateHistory = (dept: Department) => {
      const deptUsers = FAKE_USERS.filter((u) => u.department === dept.name)
      return deptUsers.map((user) => ({
         id: `${dept.id}-${user.id}`,
         user: user.name,
         action: "Ajouté au département",
         date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toLocaleDateString("fr-FR"),
      }))
   }

   const historyData = selectedDept ? generateHistory(selectedDept) : []

   const filteredHistory = historyData.filter((entry) => {
      if (!historySearchTerm) return true
      return (
         entry.user.toLowerCase().includes(historySearchTerm.toLowerCase()) ||
         entry.action.toLowerCase().includes(historySearchTerm.toLowerCase())
      )
   })

   const sortedHistory = [...filteredHistory].sort((a, b) => {
      // Simple date sort for history
      const dateA = new Date(a.date.split('/').reverse().join('-')).getTime();
      const dateB = new Date(b.date.split('/').reverse().join('-')).getTime();
      return historySortOrder === "asc" ? dateA - dateB : dateB - dateA;
   })

   // --- Handlers ---

   const handleAdd = () => {
      setFormData({ id: `DEPT${Date.now()}`, name: "", chief: "", status: "Active" })
      setViewMode("add")
   }

   const handleEdit = (dept: Department) => {
      setFormData({ id: dept.id, name: dept.name, chief: dept.chief, status: dept.status })
      setViewMode("edit")
   }

   const handleDelete = (id: string) => {
      if (confirm("Êtes-vous sûr de vouloir supprimer ce département ?")) {
         setDepartments(departments.filter((d) => d.id !== id))
      }
   }

   const handleSave = () => {
      if (viewMode === "add") {
         const newDept: Department = {
            ...formData,
            memberCount: 0,
            createdDate: new Date().toLocaleDateString("fr-FR"),
         }
         setDepartments([...departments, newDept])
      } else if (viewMode === "edit") {
         setDepartments(
            departments.map((d) =>
               d.id === formData.id ? { ...d, name: formData.name, chief: formData.chief, status: formData.status } : d
            )
         )
      }
      setViewMode("list")
      setFormData({ id: "", name: "", chief: "", status: "Active" })
   }

   const handleExportHistory = async () => {
      if (!selectedDept || !sortedHistory.length) return
      setIsExportingHistory(true)
      try {
         await exportStyledWorkbook({
            fileName: `historique_departement_${selectedDept.name || selectedDept.id}`,
            subject: "Historique departement",
            sheets: [
               {
                  name: "Historique departement",
                  title: `Historique departement : ${selectedDept.name || selectedDept.id}`,
                  columns: [
                     { header: "Date", key: "date", width: 22 },
                     { header: "Action", key: "action", width: 24 },
                     { header: "Utilisateur", key: "user", width: 24 },
                  ],
                  rows: sortedHistory.map((entry) => ({
                     date: entry.date || "-",
                     action: entry.action || "-",
                     user: entry.user || "-",
                  })),
               },
            ],
         })
      } finally {
         setIsExportingHistory(false)
      }
   }

   // --- Styles ---
   const inputStyle = "w-full px-3 py-2 bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
   const labelStyle = "block text-[10px] font-bold uppercase text-slate-500 mb-1 tracking-wide"
   const buttonPrimary = "bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-all shadow-md shadow-emerald-100"
   const buttonSecondary = "bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-lg transition-all"

   // 1. FORM VIEW
   if (viewMode === "add" || viewMode === "edit") {
      return (
         <div className="min-h-screen bg-slate-50 p-6 md:p-8 font-sans text-slate-900">
            <div className="max-w-4xl mx-auto space-y-5">
               <div className="flex justify-between items-center pb-4 border-b border-slate-200">
                  <div>
                     <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                        {viewMode === "add" ? "Nouveau Département" : "Modifier Département"}
                     </h1>
                     <p className="text-slate-500 mt-1 font-medium text-xs">Structure organisationnelle</p>
                  </div>
                  <button onClick={() => setViewMode("list")} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
                     <X className="w-5 h-5" />
                  </button>
               </div>

               <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                  <div className="bg-slate-900 px-4 py-3 flex items-center gap-3">
                     <Building className="w-4 h-4 text-emerald-400" />
                     <h3 className="text-white font-bold text-xs uppercase tracking-wider">Informations Générales</h3>
                  </div>

                  <div className="p-6 space-y-5">
                     <div className="space-y-4">
                        <div>
                           <label className={labelStyle}>Nom du Département</label>
                           <input
                              type="text"
                              value={formData.name}
                              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                              className={inputStyle}
                              placeholder="Ex: Informatique, Logistique..."
                           />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                           <div>
                              <label className={labelStyle}>Chef de Département</label>
                              <input
                                 type="text"
                                 value={formData.chief}
                                 onChange={(e) => setFormData({ ...formData, chief: e.target.value })}
                                 className={inputStyle}
                                 placeholder="Nom du responsable"
                              />
                           </div>

                           <div>
                              <label className={labelStyle}>Statut</label>
                              <select
                                 value={formData.status}
                                 onChange={(e) => setFormData({ ...formData, status: e.target.value as "Active" | "Inactive" })}
                                 className={inputStyle}
                              >
                                 <option value="Active">Actif</option>
                                 <option value="Inactive">Inactif</option>
                              </select>
                           </div>
                        </div>
                     </div>
                  </div>
                  <button
                     onClick={handleExportHistory}
                     disabled={isExportingHistory || sortedHistory.length === 0}
                     className="px-3 py-2 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-xs font-bold flex items-center gap-2"
                  >
                     <FileSpreadsheet className="w-3.5 h-3.5" />
                     {isExportingHistory ? "Export..." : "Exporter Excel"}
                  </button>
               </div>

               <div className="flex gap-3 pt-2">
                  <button onClick={handleSave} className={`flex-1 py-2.5 text-xs uppercase tracking-wide ${buttonPrimary}`}>
                     {viewMode === "add" ? "Créer" : "Sauvegarder"}
                  </button>
                  <button onClick={() => setViewMode("list")} className={`flex-1 py-2.5 text-xs uppercase tracking-wide ${buttonSecondary}`}>
                     Annuler
                  </button>
               </div>
            </div>
         </div>
      )
   }

   // 2. HISTORY VIEW
   if (viewMode === "history" && selectedDept) {
      return (
         <div className="min-h-screen bg-slate-50 p-6 md:p-8 font-sans text-slate-900">
            <div className="max-w-6xl mx-auto space-y-5">
               <div className="flex justify-between items-center pb-4 border-b border-slate-200">
                  <div className="flex items-center gap-3">
                     <button onClick={() => setViewMode("list")} className="p-2 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors text-slate-600">
                        <ArrowLeft className="w-4 h-4" />
                     </button>
                     <div>
                        <h1 className="text-xl font-extrabold text-slate-900">Historique - {selectedDept.name}</h1>
                        <p className="text-slate-500 mt-1 text-xs">{sortedHistory.length} mouvement(s) enregistré(s)</p>
                     </div>
                  </div>
               </div>

               {/* History Toolbar */}
               <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-1 items-center gap-4">
                     <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-2.5 w-3 h-3 text-slate-400" />
                        <input
                           type="text"
                           placeholder="Rechercher (Utilisateur, Action)..."
                           value={historySearchTerm}
                           onChange={(e) => setHistorySearchTerm(e.target.value)}
                           className={inputStyle}
                        />
                     </div>
                     <div className="flex items-center gap-2">
                        <button
                           onClick={() => setHistorySortOrder(historySortOrder === 'asc' ? 'desc' : 'asc')}
                           className="p-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors text-slate-600 flex items-center gap-2 font-bold text-[10px] uppercase"
                        >
                           <ArrowUpDown className="w-3 h-3" /> Trier par Date
                        </button>
                     </div>
                  </div>
               </div>

               <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  <table className="w-full">
                     <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                           <th className="px-4 py-2 text-left text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Date</th>
                           <th className="px-4 py-2 text-left text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Action</th>
                           <th className="px-4 py-2 text-left text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Utilisateur Concerné</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                        {sortedHistory.map((entry) => (
                           <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-4 py-2 text-xs font-mono text-slate-500">{entry.date}</td>
                              <td className="px-4 py-2">
                                 <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                                    {entry.action}
                                 </span>
                              </td>
                              <td className="px-4 py-2 text-xs font-bold text-slate-700">{entry.user}</td>
                           </tr>
                        ))}
                        {sortedHistory.length === 0 && (
                           <tr><td colSpan={3} className="p-8 text-center text-slate-400 italic">Aucun historique trouvé</td></tr>
                        )}
                     </tbody>
                  </table>
               </div>
            </div>
         </div>
      )
   }

   // 3. MAIN LIST VIEW
   return (
      <div className="min-h-screen bg-slate-50 font-sans text-slate-900">

         {/* Top Navbar */}
         <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
            <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
               <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-emerald-400">
                     <Building className="w-4 h-4" />
                  </div>
                  <div>
                     <h1 className="text-lg font-extrabold text-slate-900">Départements</h1>
                     <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Organisation</p>
                  </div>
               </div>
               <button onClick={handleAdd} className={`px-3 py-2 flex items-center gap-2 text-xs uppercase tracking-wide ${buttonPrimary}`}>
                  <Plus className="w-4 h-4" /> Ajouter
               </button>
            </div>
         </div>

         <div className="max-w-7xl mx-auto p-4 space-y-4">

            {/* Toolbar - Clean Design */}
            <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-4">
               <div className="flex flex-1 items-center gap-4">
                  {/* Search */}
                  <div className="relative flex-1 max-w-md">
                     <Search className="absolute left-3 top-2.5 w-3 h-3 text-slate-400" />
                     <input
                        type="text"
                        placeholder="Rechercher (Nom, Chef)..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={inputStyle}
                     />
                  </div>

                  {/* Sort */}
                  <div className="flex items-center gap-2">
                     <span className="text-[10px] font-bold uppercase text-slate-400">Trier par:</span>
                     <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500"
                     >
                        <option value="name">Nom</option>
                        <option value="chief">Chef</option>
                        <option value="memberCount">Membres</option>
                     </select>

                     <button
                        onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                        className="p-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors text-slate-600"
                     >
                        <ArrowUpDown className="w-3 h-3" />
                     </button>
                  </div>
               </div>

               <button
                  onClick={() => { setSearchTerm(""); setSortBy("name"); setSortOrder("asc"); }}
                  className="p-2 hover:bg-slate-50 text-slate-400 hover:text-emerald-600 rounded-lg transition-all"
                  title="Réinitialiser"
               >
                  <RotateCw className="w-4 h-4" />
               </button>
            </div>

            {/* Main Table */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
               <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                     <tr>
                        <th className="px-4 py-2 text-left text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Département</th>
                        <th className="px-4 py-2 text-left text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Chef</th>
                        <th className="px-4 py-2 text-left text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Effectif</th>
                        <th className="px-4 py-2 text-left text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Statut</th>
                        <th className="px-4 py-2 text-right text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Actions</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                     {sorted.map((dept) => (
                        <tr key={dept.id} className="hover:bg-slate-50/80 transition-colors group">
                           <td className="px-4 py-2">
                              <span className="font-bold text-xs text-slate-800">{dept.name}</span>
                           </td>
                           <td className="px-4 py-2">
                              <div className="flex items-center gap-2">
                                 <div className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-[10px] font-bold">
                                    {dept.chief.charAt(0)}
                                 </div>
                                 <span className="text-xs font-medium text-slate-600">{dept.chief}</span>
                              </div>
                           </td>
                           <td className="px-4 py-2">
                              <div className="flex items-center gap-1.5">
                                 <Users className="w-3 h-3 text-slate-400" />
                                 <span className="text-xs font-bold text-slate-700">{dept.memberCount}</span>
                              </div>
                           </td>
                           <td className="px-4 py-2">
                              {dept.status === "Active" ? (
                                 <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
                                    <CheckCircle2 className="w-3 h-3" /> Actif
                                 </span>
                              ) : (
                                 <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-600 border border-red-100">
                                    <XCircle className="w-3 h-3" /> Inactif
                                 </span>
                              )}
                           </td>
                           <td className="px-4 py-2 text-right">
                              <div className="flex justify-end gap-1">
                                 <button
                                    onClick={() => { setSelectedDept(dept); setShowDetailModal(true); }}
                                    className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-all"
                                    title="Voir Détail"
                                 >
                                    <Eye className="w-4 h-4" />
                                 </button>
                                 <button
                                    onClick={() => { setSelectedDept(dept); setViewMode("history"); }}
                                    className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all"
                                    title="Historique"
                                 >
                                    <History className="w-4 h-4" />
                                 </button>
                                 <button
                                    onClick={() => handleEdit(dept)}
                                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                    title="Modifier"
                                 >
                                    <Edit2 className="w-4 h-4" />
                                 </button>
                                 <button
                                    onClick={() => handleDelete(dept.id)}
                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                    title="Supprimer"
                                 >
                                    <Trash2 className="w-4 h-4" />
                                 </button>
                              </div>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
               {sorted.length === 0 && <div className="p-12 text-center text-slate-400">Aucun département trouvé</div>}
            </div>

            {/* DETAIL MODAL */}
            {showDetailModal && selectedDept && (
               <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                  <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-0 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                     <div className="bg-slate-900 px-4 py-3 flex justify-between items-center">
                        <h2 className="text-base font-bold text-white">Détails du Département</h2>
                        <button onClick={() => { setShowDetailModal(false); setSelectedDept(null); }} className="text-slate-400 hover:text-white transition-colors">
                           <X className="w-4 h-4" />
                        </button>
                     </div>

                     <div className="p-5 space-y-5">
                        <div className="space-y-3">
                           <h3 className="text-[10px] font-bold uppercase text-emerald-600 border-b border-emerald-100 pb-1">Informations</h3>
                           <div className="space-y-3">
                              <div className="flex justify-between items-center">
                                 <span className="text-xs font-medium text-slate-500">Nom</span>
                                 <span className="text-sm font-bold text-slate-800">{selectedDept.name}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                 <span className="text-xs font-medium text-slate-500">Chef</span>
                                 <span className="text-sm font-bold text-slate-800">{selectedDept.chief}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                 <span className="text-xs font-medium text-slate-500">Membres</span>
                                 <span className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                    <Users className="w-3 h-3 text-emerald-500" /> {selectedDept.memberCount}
                                 </span>
                              </div>
                              <div className="flex justify-between items-center">
                                 <span className="text-xs font-medium text-slate-500">Statut</span>
                                 <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${selectedDept.status === "Active" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                                    {selectedDept.status === "Active" ? "Actif" : "Inactif"}
                                 </span>
                              </div>
                           </div>
                        </div>
                        <div className="pt-3 border-t border-slate-100 flex justify-end">
                           <button
                              onClick={() => { setShowDetailModal(false); setSelectedDept(null); }}
                              className={`px-4 py-2 text-xs uppercase ${buttonSecondary}`}
                           >
                              Fermer
                           </button>
                        </div>
                     </div>
                  </div>
               </div>
            )}

         </div>
      </div>
   )
}
