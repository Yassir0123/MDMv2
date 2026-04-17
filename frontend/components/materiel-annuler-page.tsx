"use client"

import { useState, useEffect } from "react"
import api from "@/lib/api"
import { useVisiblePolling } from "@/lib/use-visible-polling"
import {
   Search, RotateCw, Eye, Trash2,
   AlertTriangle, Archive, ArrowUpDown, X, FileWarning,
   Filter, ChevronUp, ChevronDown, Clock, CircuitBoard, Wifi, Smartphone, Package
} from "lucide-react"

// --- Types ---
type FilterCondition = "contains" | "startsWith" | "endsWith" | "equals"

// Interface mapped to the Unified Materiel Table
interface CancelledMaterial {
   id: number // Unified ID
   specificId: number
   type: string // "Mobile", "CarteSim", "LigneInternet", "Ordinateur portable"...
   name: string // materielName
   details: string // Constructed from SN/Numero
   assignedTo?: string // affectedUser.nom + prenom
   assignedUserAgence?: string
   assignedUserDepartement?: string
   assignedUserEntrepot?: string
   dateAssigned?: string // dateAnnuler (per prompt)
   reason?: string // Blank
   statusAffectation: string
}

export default function MaterielAnnulePage() {
   // --- Data & State ---
   const [materials, setMaterials] = useState<CancelledMaterial[]>([])
   const [loading, setLoading] = useState(true)

   const [searchTerm, setSearchTerm] = useState("")
   const [filterAttribute, setFilterAttribute] = useState("name")
   const [filterCondition, setFilterCondition] = useState<FilterCondition>("contains")
   const [sortBy, setSortBy] = useState("name")
   const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")

   const [selectedMaterial, setSelectedMaterial] = useState<CancelledMaterial | null>(null)
   const [showDetailModal, setShowDetailModal] = useState(false)

   // --- Initial Load ---
   useEffect(() => {
      fetchCancelled()
   }, [])

   useVisiblePolling(() => fetchCancelled(), 4000, [])

   const fetchCancelled = async () => {
      try {
         if (materials.length === 0) {
            setLoading(true)
         }
         const res = await api.get("/user-materiel/cancelled")
         if (Array.isArray(res.data)) {
            const mapped = res.data.map((m: any) => ({
               id: m.id,
               specificId: m.specificId,
               type: m.typeMateriel,
               name: m.materielName,
               details: `${m.sn || ""} ${m.numero || ""} ${m.operateur || ""}`.trim(),
               assignedTo: m.affectedUser ? `${m.affectedUser.nom} ${m.affectedUser.prenom}` : "Non Assigné",
               assignedUserAgence: m.affectedUser?.agence?.nom || null,
               assignedUserDepartement: m.affectedUser?.departement?.nom || null,
               assignedUserEntrepot: m.affectedUser?.entrepot?.siteRef?.libeller || null,
               dateAssigned: m.dateAnnuler, // "date tentative is date_annuler"
               reason: "", // "keep it as blank"
               statusAffectation: m.statusAffectation
            }))
            setMaterials(mapped)
         }
      } catch (e) { console.error(e) }
      finally {
         setLoading(false)
      }
   }

   // --- Logic ---
   const getFieldValue = (material: CancelledMaterial, attribute: string): string => {
      // @ts-ignore
      const val = material[attribute as keyof CancelledMaterial];
      return val ? val.toString().toLowerCase() : "";
   }

   const filtered = materials.filter((material) => {
      if (!searchTerm) return true
      const value = getFieldValue(material, filterAttribute)
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
      setSearchTerm(""); setFilterAttribute("name"); setFilterCondition("contains"); setSortBy("name");
   }

   // SUPPRIMER (Switch from 'annuler' to 'non_affecter' / Reset)
   const handleAnnuler = async (id: number) => {
      if (confirm("Confirmer la suppression définitive (Retour au stock) ?")) {
         try {
            await api.post(`/user-materiel/reset/${id}`)
            fetchCancelled()
            setShowDetailModal(false)
            setSelectedMaterial(null)
         } catch (e) { alert("Erreur lors de la suppression.") }
      }
   }

   // REAFFECTER (Switch from 'annuler' to 'affecter')
   const handleReaffecter = async (id: number) => {
      if (confirm("Confirmer la réaffectation (Nouvelle tentative) ?")) {
         try {
            await api.post(`/user-materiel/retry/${id}`)
            fetchCancelled()
            setShowDetailModal(false)
            setSelectedMaterial(null)
         } catch (e) { alert("Erreur lors de la réaffectation.") }
      }
   }

   const getIcon = (type: string) => {
      const t = type.toLowerCase()
      if (t.includes('sim')) return <CircuitBoard className="w-4 h-4" />
      if (t.includes('internet')) return <Wifi className="w-4 h-4" />
      if (t.includes('mobile')) return <Smartphone className="w-4 h-4" />
      return <Package className="w-4 h-4" />
   }

   const getAssetTypeStyle = (type: string) => {
      const t = type.toLowerCase()
      if (t.includes('sim')) return "bg-orange-50 text-orange-700 border-orange-200"
      if (t.includes('mobile')) return "bg-purple-50 text-purple-700 border-purple-200"
      if (t.includes('internet')) return "bg-cyan-50 text-cyan-700 border-cyan-200"
      return "bg-slate-50 text-slate-700 border-slate-200"
   }

   const SortIcon = ({ column }: { column: string }) => {
      if (sortBy !== column) return <ArrowUpDown className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
      return sortOrder === "asc" ? <ChevronUp className="w-3 h-3 text-blue-600" /> : <ChevronDown className="w-3 h-3 text-blue-600" />
   }

   // --- Design System ---
   const styles = {
      pageBg: "min-h-full bg-background font-sans text-foreground",
      card: "bg-card border border-border rounded-xl shadow-sm overflow-hidden",
      header: "bg-card border-b border-border sticky top-0 z-20 backdrop-blur-md bg-card/80",
      primaryBtn: "btn btn-primary text-xs",
      secondaryBtn: "btn btn-secondary text-xs",
      dangerBtn: "btn btn-danger text-xs",
      input: "mdm-input text-xs",
      label: "block text-[10px] font-bold uppercase text-muted-foreground mb-1 tracking-wider",
      th: "px-4 py-2.5 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider bg-secondary/50 border-b border-border select-none",
      td: "px-4 py-2.5 text-[12px] border-b border-border/50 last:border-0",
   }

   return (
      <div className={styles.pageBg}>

         {/* Navbar */}
         <div className={styles.header}>
            <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
               <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-sidebar-primary to-accent rounded-lg flex items-center justify-center text-sidebar-primary-foreground shadow-sm">
                     <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                     <h1 className="text-lg font-black text-slate-900 leading-none">Gestion des Rejets</h1>
                  </div>
               </div>
            </div>
         </div>

         <div className="max-w-7xl mx-auto p-4 space-y-4">

            {/* HERO BANNER */}
            <div className="relative overflow-hidden bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
               <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-emerald-50 rounded-full blur-3xl opacity-60"></div>
               <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-40 h-40 bg-blue-50 rounded-full blur-3xl opacity-60"></div>

               <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="flex items-start gap-4">
                     <div className="flex-shrink-0 w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center shadow-inner border border-red-100">
                        <Archive className="w-6 h-6 text-red-500" />
                     </div>
                     <div>
                        <h2 className="text-xl font-bold text-slate-900 mb-1">File d'attente des exceptions</h2>
                        <p className="text-slate-500 text-xs leading-relaxed max-w-xl">
                           Ces ressources ont été <span className="text-red-500 font-bold">refusées ou annulées</span> par les utilisateurs.
                           Veuillez <span className="text-emerald-600 font-semibold underline decoration-emerald-200 underline-offset-4 tracking-tight">réaffecter</span> ces éléments ou les
                           <span className="text-red-500 font-semibold underline decoration-red-200 underline-offset-4 ml-1 tracking-tight">retourner au stock</span>.
                        </p>
                     </div>
                  </div>

                  <div className="flex items-center gap-3">
                     <div className="bg-slate-50 border border-slate-100 px-4 py-3 rounded-xl flex flex-col items-center min-w-[100px]">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">En suspens</span>
                        <span className="text-2xl font-black text-slate-900">{materials.length}</span>
                     </div>
                     <div className="bg-gradient-to-br from-red-500 to-red-600 px-4 py-3 rounded-xl flex flex-col items-center min-w-[100px] shadow-lg shadow-red-200">
                        <Clock className="w-3 h-3 text-red-100 mb-0.5" />
                        <span className="text-[10px] font-bold text-red-100 uppercase tracking-widest">Action</span>
                        <span className="text-xs font-bold text-white uppercase">Requise</span>
                     </div>
                  </div>
               </div>
            </div>

            {/* FILTER TOOLBAR */}
            <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">

               <div className="flex flex-col md:flex-row items-center gap-3 w-full">
                  <div className="flex items-center gap-2 text-slate-400 px-2">
                     <Filter className="w-4 h-4" />
                     <span className="text-[10px] font-bold uppercase">Filtrer</span>
                  </div>

                  <div className="relative w-full md:w-auto">
                     <select value={filterAttribute} onChange={(e) => setFilterAttribute(e.target.value)} className="w-full md:w-36 px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
                        <option value="name">Nom</option>
                        <option value="type">Type</option>
                        <option value="details">Détails</option>
                        <option value="assignedTo">Utilisateur</option>
                     </select>
                  </div>

                  <div className="relative w-full md:w-auto">
                     <select value={filterCondition} onChange={(e) => setFilterCondition(e.target.value as FilterCondition)} className="w-full md:w-36 px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
                        <option value="contains">Contient</option>
                        <option value="startsWith">Commence par</option>
                        <option value="endsWith">Egal à</option>
                     </select>
                  </div>

                  <div className="relative flex-1 w-full">
                     <Search className="absolute left-3 top-2.5 w-3 h-3 text-slate-400" />
                     <input type="text" placeholder={`Rechercher dans ${filterAttribute}...`} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                  </div>
               </div>

               <button onClick={handleResetFilters} className="p-2 hover:bg-slate-100 text-slate-400 hover:text-blue-600 rounded-lg transition-all border border-transparent hover:border-slate-100" title="Réinitialiser les filtres"><RotateCw className="w-4 h-4" /></button>
            </div>

            {/* Table */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
               <div className="overflow-x-auto">
               <table className="w-full min-w-[860px]">
                  <thead>
                     <tr>
                        {[{ id: 'name', label: 'Nom' }, { id: 'type', label: 'Type' }, { id: 'details', label: 'Détails' }, { id: 'assignedTo', label: 'Utilisateur Rejeté' }].map((col) => (
                           <th key={col.id} className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50/50 border-b border-slate-200 select-none cursor-pointer hover:bg-slate-100 hover:text-blue-600 transition-colors group" onClick={() => handleSortClick(col.id)}>
                              <div className="flex items-center gap-2">{col.label} <SortIcon column={col.id} /></div>
                           </th>
                        ))}
                        <th className="px-4 py-3 text-right text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50/50 border-b border-slate-200 select-none">Actions</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                     {sorted.map((material) => (
                        <tr key={material.id} className="hover:bg-slate-50/80 transition-colors group">
                           <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                 <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                    {getIcon(material.type)}
                                 </div>
                                 <span className="font-bold text-slate-800 text-xs">{material.name}</span>
                              </div>
                           </td>
                           <td className="px-4 py-3">
                              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getAssetTypeStyle(material.type)}`}>
                                 {material.type}
                              </span>
                           </td>
                           <td className="px-4 py-3 text-xs text-slate-500 font-medium">{material.details}</td>
                           <td className="px-4 py-3">
                              <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                                 <div className="w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-[10px] font-bold border border-red-200">
                                    {material.assignedTo?.charAt(0) || "?"}
                                 </div>
                                 {material.assignedTo || "Inconnu"}
                              </div>
                           </td>
                           <td className="px-4 py-3 text-right">
                              <div className="flex justify-end gap-1 opacity-100">
                                 <button onClick={() => { setSelectedMaterial(material); setShowDetailModal(true); }} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Détails"><Eye className="w-4 h-4" /></button>
                                 <button onClick={() => handleReaffecter(material.id)} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all" title="Réaffecter"><RotateCw className="w-4 h-4" /></button>
                                 <button onClick={() => handleAnnuler(material.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Retour Stock"><Trash2 className="w-4 h-4" /></button>
                              </div>
                           </td>
                        </tr>
                     ))}
                     {sorted.length === 0 && (
                        <tr><td colSpan={5} className="p-12 text-center text-slate-400"><Search className="w-12 h-12 mx-auto mb-3 opacity-20" /><p>Aucun rejet trouvé.</p></td></tr>
                     )}
                  </tbody>
               </table>
               </div>
            </div>

            {/* DETAIL MODAL */}
            {showDetailModal && selectedMaterial && (
               <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                  <div className="bg-white rounded-xl shadow-2xl border border-slate-200 p-0 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                     <div className="bg-gradient-to-r from-red-600 to-orange-600 px-4 py-3 shadow-lg flex items-center justify-between">
                        <h2 className="text-xs font-bold text-white flex items-center gap-2"><FileWarning className="w-3 h-3 text-red-100" /> Détails de l'Annulation</h2>
                        <button onClick={() => { setShowDetailModal(false); setSelectedMaterial(null); }} className="text-red-100 hover:text-white transition-colors"><X className="w-4 h-4" /></button>
                     </div>

                     <div className="p-4 space-y-4">
                        <div className="space-y-2">
                           <h3 className="text-[10px] font-bold uppercase text-red-600 border-b border-red-100 pb-1">Information Matériel</h3>
                           <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                              <div><label className={styles.label}>Nom</label><p className="text-xs font-bold text-slate-800">{selectedMaterial.name}</p></div>
                              <div><label className={styles.label}>Type</label><p className="text-xs font-medium text-slate-800 capitalize">{selectedMaterial.type}</p></div>
                              <div className="col-span-2"><label className={styles.label}>Détails Techniques</label><p className="text-[11px] font-medium text-slate-600">{selectedMaterial.details}</p></div>
                              <div className="col-span-2 bg-red-50 px-3 py-2 rounded-lg border border-red-100 mt-1">
                                 <label className="text-[10px] font-bold text-red-500 uppercase flex items-center gap-1.5 mb-0.5"><AlertTriangle className="w-3 h-3" /> Raison (Signalement)</label>
                                 <p className="text-xs font-bold text-red-800">Voir l'historique pour le commentaire.</p>
                              </div>
                              <div><label className={styles.label}>Date Annulation</label><p className="text-[10px] font-mono text-slate-600">{selectedMaterial.dateAssigned ? new Date(selectedMaterial.dateAssigned).toLocaleDateString("fr-FR") : "N/A"}</p></div>
                           </div>
                        </div>

                        <div className="space-y-2">
                           <h3 className="text-[10px] font-bold uppercase text-blue-600 border-b border-blue-100 pb-1">Utilisateur Cible</h3>
                           <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2.5">
                              <div>
                                 <label className={styles.label}>Nom</label>
                                 <p className="text-xs font-bold text-slate-800 truncate">{selectedMaterial.assignedTo}</p>
                              </div>
                              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100">
                                 <div>
                                    <label className={styles.label}>Agence</label>
                                    <p className="text-xs font-medium text-slate-700">{selectedMaterial.assignedUserAgence || <span className="text-slate-400 italic">N/A</span>}</p>
                                 </div>
                                 <div>
                                    <label className={styles.label}>Département</label>
                                    <p className="text-xs font-medium text-slate-700">{selectedMaterial.assignedUserDepartement || <span className="text-slate-400 italic">N/A</span>}</p>
                                 </div>
                                 <div>
                                    <label className={styles.label}>Entrepôt</label>
                                    <p className="text-xs font-medium text-slate-700">{selectedMaterial.assignedUserEntrepot || <span className="text-slate-400 italic">N/A</span>}</p>
                                 </div>
                              </div>
                           </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                           <button onClick={() => handleAnnuler(selectedMaterial.id)} className={`px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 font-bold text-[10px] uppercase rounded-lg transition-all flex items-center gap-2`}>
                              <Trash2 className="w-3 h-3" /> Supprimer (Stock)
                           </button>
                           <button onClick={() => handleReaffecter(selectedMaterial.id)} className={`px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-xs flex items-center gap-2 shadow-sm`}>
                              <RotateCw className="w-3 h-3" /> Réaffecter
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
