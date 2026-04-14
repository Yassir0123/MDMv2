"use client"

import { useState } from "react"
import { FAKE_SIMS, FAKE_MOBILE_DEVICES, FAKE_INTERNET_LINES, FAKE_USERS } from "@/lib/constants"
import {
   Search, RotateCw, History, ArrowLeft,
   Smartphone, Wifi, CircuitBoard, Package,
   Edit2, Trash2, ArrowUpDown, Building, User,
   Calendar, CheckCircle2, RefreshCw, XCircle, AlertTriangle
} from "lucide-react"

// --- Types ---
type EquipmentType = "all" | "sim" | "mobile" | "internet"

interface EquipmentItem {
   id: string
   type: "Sim" | "Mobile" | "Internet"
   name: string
   status: string
   assignedTo?: string
   dateAssigned?: string
   agency?: string
   chefAgence?: string
   details?: string
   provider?: string
}

interface GlobalHistoryEntry {
   id: string
   date: string
   action: "Affectation" | "Restitution" | "Maintenance" | "Création" | "Suppression"
   equipmentName: string
   equipmentType: "Sim" | "Mobile" | "Internet"
   userOrAgency: string
   details: string
}

export default function AdminEquipementPage() {
   // --- State ---
   const [showHistorique, setShowHistorique] = useState(false)
   const [searchTerm, setSearchTerm] = useState("")

   // Main List Sorting
   const [sortBy, setSortBy] = useState("number")
   const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")

   // History Sorting
   const [historySortBy, setHistorySortBy] = useState("date")
   const [historySortOrder, setHistorySortOrder] = useState<"asc" | "desc">("desc")

   // Helper to resolve User Names
   const resolveUserName = (id?: string) => {
      if (!id) return null
      if (id === "AUTO") return "Service TSP"
      if (["Logistique", "IT", "RH"].includes(id)) return id
      const user = FAKE_USERS.find(u => u.id === id)
      return user ? user.name : id
   }

   // --- Mock Agencies ---
   const agencies = [
      { id: "A001", name: "Agence Nord" },
      { id: "A002", name: "Agence Sud" },
      { id: "A003", name: "Agence Est" },
      { id: "A004", name: "Agence Ouest" },
   ]

   // --- Data Consolidation ---
   const allEquipment: EquipmentItem[] = [
      ...FAKE_SIMS.map((sim, idx) => ({
         id: sim.id,
         type: "Sim" as const,
         name: sim.number,
         status: sim.status,
         assignedTo: resolveUserName(sim.assignedTo) || undefined,
         dateAssigned: sim.dateAssigned,
         agency: agencies[idx % agencies.length].name,
         chefAgence: "Thomas Angelo",
         details: sim.provider,
         provider: sim.provider
      })),
      ...FAKE_MOBILE_DEVICES.map((device, idx) => ({
         id: device.id,
         type: "Mobile" as const,
         name: `${device.brand} ${device.model}`,
         status: device.status,
         assignedTo: resolveUserName(device.assignedTo) || undefined,
         dateAssigned: device.dateAssigned,
         agency: agencies[(idx + 1) % agencies.length].name,
         chefAgence: "Thomas Angelo",
         details: `IMEI: ${device.imei}`,
         provider: device.brand
      })),
      ...FAKE_INTERNET_LINES.map((line, idx) => ({
         id: line.id,
         type: "Internet" as const,
         name: line.number,
         status: line.status,
         assignedTo: resolveUserName(line.assignedTo) || undefined,
         dateAssigned: line.dateAssigned,
         agency: agencies[(idx + 2) % agencies.length].name,
         chefAgence: "Thomas Angelo",
         details: `${line.provider} (${line.speed})`,
         provider: line.provider
      })),
   ]

   // --- Generate Realistic History Data ---
   const globalHistory: GlobalHistoryEntry[] = allEquipment.flatMap((item, index) => {
      const entries: GlobalHistoryEntry[] = [
         {
            id: `hist-${item.id}-create`,
            date: "2023-01-10",
            action: "Création",
            equipmentName: item.name,
            equipmentType: item.type,
            userOrAgency: "Système",
            details: "Ajout au stock"
         }
      ]

      if (item.assignedTo) {
         entries.push({
            id: `hist-${item.id}-assign`,
            date: item.dateAssigned || "2023-06-15",
            action: "Affectation",
            equipmentName: item.name,
            equipmentType: item.type,
            userOrAgency: item.assignedTo,
            details: `Affecté à ${item.agency}`
         })
      }

      // Add random maintenance/restitutions for realism
      if (index % 3 === 0) {
         entries.push({
            id: `hist-${item.id}-maint`,
            date: "2023-11-05",
            action: "Maintenance",
            equipmentName: item.name,
            equipmentType: item.type,
            userOrAgency: "Support IT",
            details: "Réparation écran / Mise à jour"
         })
      }

      if (index % 7 === 0) {
         entries.push({
            id: `hist-${item.id}-return`,
            date: "2023-09-20",
            action: "Restitution",
            equipmentName: item.name,
            equipmentType: item.type,
            userOrAgency: "Stock",
            details: "Retour agence"
         })
      }

      return entries
   }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

   // --- Logic: Equipment List ---
   const sorted = allEquipment
      .filter((item) => {
         if (searchTerm) {
            const lowerSearch = searchTerm.toLowerCase()
            return (
               item.name.toLowerCase().includes(lowerSearch) ||
               (item.assignedTo && item.assignedTo.toLowerCase().includes(lowerSearch)) ||
               (item.agency && item.agency.toLowerCase().includes(lowerSearch)) ||
               (item.provider && item.provider.toLowerCase().includes(lowerSearch))
            )
         }
         return true
      })
      .sort((a, b) => {
         let aVal = "", bVal = ""
         switch (sortBy) {
            case "number": aVal = a.name; bVal = b.name; break;
            case "provider": aVal = a.provider || ""; bVal = b.provider || ""; break;
            case "site": aVal = a.agency || ""; bVal = b.agency || ""; break;
            case "status": aVal = a.status; bVal = b.status; break;
            default: aVal = a.name; bVal = b.name;
         }
         const comparison = aVal.localeCompare(bVal)
         return sortOrder === "asc" ? comparison : -comparison
      })

   // --- Logic: History List ---
   const sortedHistory = globalHistory
      .filter(entry => {
         if (!searchTerm) return true
         const lowerSearch = searchTerm.toLowerCase()
         return (
            entry.equipmentName.toLowerCase().includes(lowerSearch) ||
            entry.userOrAgency.toLowerCase().includes(lowerSearch) ||
            entry.action.toLowerCase().includes(lowerSearch)
         )
      })
      .sort((a, b) => {
         let aVal: any, bVal: any

         if (historySortBy === "date") {
            aVal = new Date(a.date).getTime()
            bVal = new Date(b.date).getTime()
         } else if (historySortBy === "action") {
            aVal = a.action
            bVal = b.action
         } else {
            aVal = a.equipmentName
            bVal = b.equipmentName
         }

         if (aVal > bVal) return historySortOrder === "asc" ? 1 : -1
         if (aVal < bVal) return historySortOrder === "asc" ? -1 : 1
         return 0
      })

   // --- Helper Icons & Styles ---
   const getTypeIcon = (type: string) => {
      switch (type) {
         case "Sim": return <CircuitBoard className="w-4 h-4" />
         case "Mobile": return <Smartphone className="w-4 h-4" />
         case "Internet": return <Wifi className="w-4 h-4" />
         default: return <Package className="w-4 h-4" />
      }
   }

   const getTypeStyle = (type: string) => {
      switch (type) {
         case "Sim": return "bg-orange-100 text-orange-700 border-orange-200"
         case "Mobile": return "bg-emerald-100 text-emerald-700 border-emerald-200"
         case "Internet": return "bg-blue-100 text-blue-700 border-blue-200"
         default: return "bg-slate-100 text-slate-700 border-slate-200"
      }
   }

   const getActionStyle = (action: string) => {
      switch (action) {
         case "Affectation": return "bg-green-100 text-green-700 border-green-200"
         case "Restitution": return "bg-orange-100 text-orange-700 border-orange-200"
         case "Maintenance": return "bg-blue-100 text-blue-700 border-blue-200"
         case "Création": return "bg-slate-100 text-slate-700 border-slate-200"
         case "Suppression": return "bg-red-100 text-red-700 border-red-200"
         default: return "bg-gray-100 text-gray-700"
      }
   }

   const buttonSecondary = "bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-lg transition-all"

   // --- View: History ---
   if (showHistorique) {
      return (
         <div className="min-h-screen bg-slate-50 p-6 md:p-8 font-sans text-slate-900">
            <div className="max-w-7xl mx-auto space-y-5">

               {/* Header */}
               <div className="flex justify-between items-center pb-4 border-b border-slate-200">
                  <div className="flex items-center gap-3">
                     <button onClick={() => { setShowHistorique(false); setSearchTerm(""); }} className="p-2 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors text-slate-600">
                        <ArrowLeft className="w-4 h-4" />
                     </button>
                     <div>
                        <h1 className="text-xl font-extrabold text-slate-900">Historique Global</h1>
                        <p className="text-slate-500 mt-1 text-xs">{sortedHistory.length} événements enregistrés</p>
                     </div>
                  </div>
               </div>

               {/* History Toolbar */}
               <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-1 items-center gap-4">
                     {/* Search */}
                     <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-2.5 w-3 h-3 text-slate-400" />
                        <input
                           type="text"
                           placeholder="Rechercher (Nom, Action, Utilisateur)..."
                           value={searchTerm}
                           onChange={(e) => setSearchTerm(e.target.value)}
                           className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                        />
                     </div>

                     {/* History Sort */}
                     <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase text-slate-400">Trier par:</span>
                        <select
                           value={historySortBy}
                           onChange={(e) => setHistorySortBy(e.target.value)}
                           className="px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                           <option value="date">Date</option>
                           <option value="action">Action</option>
                           <option value="equipment">Équipement</option>
                        </select>
                        <button
                           onClick={() => setHistorySortOrder(historySortOrder === 'asc' ? 'desc' : 'asc')}
                           className="p-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors text-slate-600"
                        >
                           <ArrowUpDown className="w-3 h-3" />
                        </button>
                     </div>
                  </div>

                  <button
                     onClick={() => { setSearchTerm(""); setHistorySortBy("date"); setHistorySortOrder("desc"); }}
                     className="p-2 hover:bg-slate-50 text-slate-400 hover:text-emerald-600 rounded-lg transition-all"
                     title="Réinitialiser"
                  >
                     <RotateCw className="w-4 h-4" />
                  </button>
               </div>

               {/* History Table */}
               <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                     <table className="w-full whitespace-nowrap">
                        <thead className="bg-slate-50 border-b border-slate-200">
                           <tr>
                              <th className="px-4 py-2 text-left text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Date</th>
                              <th className="px-4 py-2 text-left text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Action</th>
                              <th className="px-4 py-2 text-left text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Équipement</th>
                              <th className="px-4 py-2 text-left text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Type</th>
                              <th className="px-4 py-2 text-left text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Utilisateur / Entité</th>
                              <th className="px-4 py-2 text-left text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Détails</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                           {sortedHistory.map((entry) => (
                              <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                                 <td className="px-4 py-2 text-xs font-mono text-slate-500">
                                    <div className="flex items-center gap-2">
                                       <Calendar className="w-3 h-3 opacity-50" />
                                       {new Date(entry.date).toLocaleDateString("fr-FR")}
                                    </div>
                                 </td>
                                 <td className="px-4 py-2">
                                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getActionStyle(entry.action)}`}>
                                       {entry.action === 'Affectation' && <CheckCircle2 className="w-3 h-3" />}
                                       {entry.action === 'Restitution' && <RotateCw className="w-3 h-3" />}
                                       {entry.action === 'Maintenance' && <AlertTriangle className="w-3 h-3" />}
                                       {entry.action}
                                    </span>
                                 </td>
                                 <td className="px-4 py-2 text-xs font-bold text-slate-800">{entry.equipmentName}</td>
                                 <td className="px-4 py-2">
                                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium border ${getTypeStyle(entry.equipmentType)}`}>
                                       {getTypeIcon(entry.equipmentType)} {entry.equipmentType}
                                    </span>
                                 </td>
                                 <td className="px-4 py-2 text-xs font-medium text-slate-600">{entry.userOrAgency}</td>
                                 <td className="px-4 py-2 text-[10px] text-slate-400 italic max-w-xs truncate">{entry.details}</td>
                              </tr>
                           ))}
                           {sortedHistory.length === 0 && (
                              <tr><td colSpan={6} className="p-8 text-center text-slate-400 italic">Aucun historique trouvé</td></tr>
                           )}
                        </tbody>
                     </table>
                  </div>
               </div>
            </div>
         </div>
      )
   }

   // --- View: Main List ---
   return (
      <div className="min-h-screen bg-slate-50 font-sans text-slate-900">

         {/* Top Navbar */}
         <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
            <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
               <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-emerald-400">
                     <Package className="w-4 h-4" />
                  </div>
                  <div>
                     <h1 className="text-lg font-extrabold text-slate-900">Tous les Équipements</h1>
                     <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Vue d'ensemble</p>
                  </div>
               </div>

               <button
                  onClick={() => { setShowHistorique(true); setSearchTerm(""); }}
                  className={`px-3 py-2 flex items-center gap-2 text-xs uppercase tracking-wide ${buttonSecondary}`}
               >
                  <History className="w-4 h-4" /> Historique
               </button>
            </div>
         </div>

         <div className="max-w-7xl mx-auto p-4 space-y-4">

            {/* EXACT TOOLBAR REQUESTED */}
            <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-4">

               <div className="flex flex-1 items-center gap-4">
                  {/* Direct Search Input */}
                  <div className="relative flex-1 max-w-md">
                     <Search className="absolute left-3 top-2.5 w-3 h-3 text-slate-400" />
                     <input
                        type="text"
                        placeholder="Rechercher par numéro, site..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                     />
                  </div>

                  {/* Direct Sort Select */}
                  <div className="flex items-center gap-2">
                     <span className="text-[10px] font-bold uppercase text-slate-400">Trier par:</span>
                     <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500"
                     >
                        <option value="number">Identifiant</option>
                        <option value="provider">Fournisseur</option>
                        <option value="site">Site</option>
                        <option value="status">Statut</option>
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
                  onClick={() => { setSearchTerm(""); setSortBy("number"); setSortOrder("asc"); }}
                  className="p-2 hover:bg-slate-50 text-slate-400 hover:text-emerald-600 rounded-lg transition-all"
                  title="Réinitialiser"
               >
                  <RotateCw className="w-4 h-4" />
               </button>
            </div>

            {/* Equipment Table */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
               <div className="overflow-x-auto">
                  <table className="w-full whitespace-nowrap">
                     <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                           <th className="px-4 py-2 text-left text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Type</th>
                           <th className="px-4 py-2 text-left text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Identifiant / Nom</th>
                           <th className="px-4 py-2 text-left text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Agence</th>
                           <th className="px-4 py-2 text-left text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Affectation</th>
                           <th className="px-4 py-2 text-left text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Statut</th>
                           <th className="px-4 py-2 text-right text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Actions</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                        {sorted.map((item) => (
                           <tr key={`${item.type}-${item.id}`} className="hover:bg-slate-50/80 transition-colors group">
                              <td className="px-4 py-2">
                                 <span className={`inline-flex items-center gap-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getTypeStyle(item.type)}`}>
                                    {getTypeIcon(item.type)} {item.type}
                                 </span>
                              </td>
                              <td className="px-4 py-2">
                                 <p className="text-xs font-bold text-slate-800">{item.name}</p>
                                 <p className="text-[10px] text-slate-500">{item.details}</p>
                              </td>
                              <td className="px-4 py-2">
                                 <div className="flex flex-col">
                                    <span className="text-xs font-medium text-slate-700 flex items-center gap-1.5">
                                       <Building className="w-3 h-3 text-slate-400" /> {item.agency}
                                    </span>
                                    <span className="text-[10px] text-slate-400 pl-4.5">{item.chefAgence}</span>
                                 </div>
                              </td>
                              <td className="px-4 py-2">
                                 {item.assignedTo ? (
                                    <span className="text-xs text-blue-700 font-medium flex items-center gap-1.5">
                                       <User className="w-3 h-3" /> {item.assignedTo}
                                    </span>
                                 ) : <span className="text-slate-300 italic text-xs">-</span>}
                              </td>
                              <td className="px-4 py-2">
                                 <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${item.status === "Active" || item.status === "Assigned" || item.status === "Available"
                                       ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                                       : "bg-slate-100 text-slate-500 border border-slate-200"
                                    }`}>
                                    {item.status}
                                 </span>
                              </td>
                              <td className="px-4 py-2 text-right">
                                 <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Modifier"><Edit2 className="w-4 h-4" /></button>
                                    <button className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Supprimer"><Trash2 className="w-4 h-4" /></button>
                                 </div>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
               {sorted.length === 0 && (
                  <div className="p-12 text-center text-slate-400">Aucun équipement trouvé</div>
               )}
            </div>
         </div>
      </div>
   )
}