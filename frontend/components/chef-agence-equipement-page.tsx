"use client"

import { useState } from "react"
import { FAKE_SIMS, FAKE_MOBILE_DEVICES, FAKE_INTERNET_LINES, FAKE_AFFECTATIONS, FAKE_USERS } from "@/lib/constants"
import { exportStyledWorkbook } from "@/lib/excel-export"
import {
   Search, RotateCw, History, ArrowLeft,
   Smartphone, Wifi, CircuitBoard, Package,
   ArrowUpDown, User, Calendar, CheckCircle2,
   Activity, Radio, FileSpreadsheet
} from "lucide-react"

type EquipmentType = "all" | "sim" | "mobile" | "internet"

interface EquipmentItem {
   id: string
   type: "Sim" | "Mobile" | "Internet"
   name: string
   number?: string
   serialNumber?: string
   status: string
   assignedTo?: string
   dateAssigned?: string
   provider?: string
   brand?: string
   model?: string
   speed?: string
   imei?: string
}

export default function ChefAgenceEquipementPage() {
   // --- State ---
   const [showHistorique, setShowHistorique] = useState(false)
   const [searchTerm, setSearchTerm] = useState("")
   const [equipmentType, setEquipmentType] = useState<EquipmentType>("all")
   const [sortBy, setSortBy] = useState("name")
   const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
   const [isExportingHistory, setIsExportingHistory] = useState(false)

   // --- Helper: Resolve Names ---
   const resolveName = (id?: string) => {
      if (!id) return null
      if (id === "AUTO") return "Service"
      // Direct check if it's a known service name (from context logic)
      if (["Logistique", "IT", "RH", "Administration"].includes(id)) return id

      const user = FAKE_USERS.find(u => u.id === id)
      return user ? user.name : id
   }

   // --- Data Consolidation ---
   const allEquipment: EquipmentItem[] = [
      ...FAKE_SIMS.map((sim) => ({
         id: sim.id,
         type: "Sim" as const,
         name: sim.number,
         number: sim.number,
         status: sim.status,
         assignedTo: resolveName(sim.assignedTo) || undefined,
         dateAssigned: sim.dateAssigned,
         provider: sim.provider,
      })),
      ...FAKE_MOBILE_DEVICES.map((device) => ({
         id: device.id,
         type: "Mobile" as const,
         name: `${device.brand} ${device.model}`,
         serialNumber: device.serialNumber,
         status: device.status,
         assignedTo: resolveName(device.assignedTo) || undefined,
         dateAssigned: device.dateAssigned,
         brand: device.brand,
         model: device.model,
         imei: device.imei,
      })),
      ...FAKE_INTERNET_LINES.map((line) => ({
         id: line.id,
         type: "Internet" as const,
         name: line.number,
         number: line.number,
         status: line.status,
         assignedTo: resolveName(line.assignedTo) || undefined,
         dateAssigned: line.dateAssigned,
         provider: line.provider,
         speed: line.speed,
      })),
   ]

   // --- Logic: Equipment List ---
   const filteredEquipment = allEquipment
      .filter((item) => {
         if (equipmentType !== "all" && item.type.toLowerCase() !== equipmentType) return false

         if (searchTerm) {
            const lowerSearch = searchTerm.toLowerCase()
            return (
               item.name.toLowerCase().includes(lowerSearch) ||
               (item.assignedTo && item.assignedTo.toLowerCase().includes(lowerSearch)) ||
               (item.provider && item.provider.toLowerCase().includes(lowerSearch))
            )
         }
         return true
      })
      .sort((a, b) => {
         let aVal = "", bVal = ""

         switch (sortBy) {
            case "name": aVal = a.name; bVal = b.name; break;
            case "status": aVal = a.status; bVal = b.status; break;
            case "date": aVal = a.dateAssigned || ""; bVal = b.dateAssigned || ""; break;
            default: aVal = a.name; bVal = b.name;
         }

         const comparison = aVal.localeCompare(bVal)
         return sortOrder === "asc" ? comparison : -comparison
      })

   // --- Logic: History List ---
   const assetIds = allEquipment.map(e => e.id)
   const affectationHistory = FAKE_AFFECTATIONS.filter((a) => assetIds.includes(a.assetId))
      .filter(aff => {
         if (!searchTerm) return true
         const lowerSearch = searchTerm.toLowerCase()
         return (
            aff.assetName.toLowerCase().includes(lowerSearch) ||
            aff.targetName.toLowerCase().includes(lowerSearch) ||
            aff.action.toLowerCase().includes(lowerSearch)
         )
      })
      .sort((a, b) => {
         const dateA = new Date(a.date).getTime()
         const dateB = new Date(b.date).getTime()
         return sortOrder === "asc" ? dateA - dateB : dateB - dateA
      })

   // --- Helpers ---
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

   // --- Styles ---
   const inputStyle = "w-full px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
   const buttonSecondary = "bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-lg transition-all"

   const handleExportHistory = async () => {
      if (!affectationHistory.length) return
      setIsExportingHistory(true)
      try {
         await exportStyledWorkbook({
            fileName: "historique_agence_equipements",
            subject: "Historique affectations agence",
            sheets: [
               {
                  name: "Historique agence",
                  title: "Historique affectations agence",
                  columns: [
                     { header: "Date", key: "date", width: 22 },
                     { header: "Equipement", key: "assetName", width: 24 },
                     { header: "Type", key: "assetType", width: 16 },
                     { header: "Action", key: "action", width: 18 },
                     { header: "Beneficiaire", key: "targetName", width: 24 },
                  ],
                  rows: affectationHistory.map((aff) => ({
                     date: new Date(aff.date).toLocaleString("fr-FR"),
                     assetName: aff.assetName || "-",
                     assetType: aff.assetType?.toUpperCase() || "-",
                     action: aff.action || "-",
                     targetName: aff.targetName || "-",
                  })),
               },
            ],
         })
      } finally {
         setIsExportingHistory(false)
      }
   }

   // --- View: History ---
   if (showHistorique) {
      return (
         <div className="min-h-screen bg-slate-50 p-6 md:p-8 font-sans text-slate-900">
            <div className="max-w-7xl mx-auto space-y-6">

               <div className="flex justify-between items-center pb-6 border-b border-slate-200">
                  <div className="flex items-center gap-4">
                     <button onClick={() => setShowHistorique(false)} className="p-2 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors text-slate-600">
                        <ArrowLeft className="w-5 h-5" />
                     </button>
                     <div>
                        <h1 className="text-xl font-extrabold text-slate-900">Historique Affectations</h1>
                        <p className="text-slate-500 mt-1 text-xs">{affectationHistory.length} mouvements enregistrés</p>
                     </div>
                  </div>
                  <button
                     onClick={handleExportHistory}
                     disabled={isExportingHistory || affectationHistory.length === 0}
                     className="px-3 py-2 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-xs font-bold flex items-center gap-2"
                  >
                     <FileSpreadsheet className="w-3.5 h-3.5" />
                     {isExportingHistory ? "Export..." : "Exporter Excel"}
                  </button>
               </div>

               <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-1 items-center gap-4">
                     <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-2.5 w-3 h-3 text-slate-400" />
                        <input
                           type="text"
                           placeholder="Rechercher (Nom, Action, Utilisateur)..."
                           value={searchTerm}
                           onChange={(e) => setSearchTerm(e.target.value)}
                           className="w-full px-3 py-2 pl-9 bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                        />
                     </div>
                     <button
                        onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                        className="p-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors text-slate-600 flex items-center gap-2 font-bold text-[10px] uppercase"
                     >
                        <ArrowUpDown className="w-3 h-3" /> Date
                     </button>
                  </div>
                  <button
                     onClick={() => { setSearchTerm(""); setSortOrder("desc"); }}
                     className="p-2 hover:bg-slate-50 text-slate-400 hover:text-emerald-600 rounded-lg transition-all"
                     title="Réinitialiser"
                  >
                     <RotateCw className="w-4 h-4" />
                  </button>
               </div>

               <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                     <table className="w-full whitespace-nowrap">
                        <thead className="bg-slate-50 border-b border-slate-200">
                           <tr>
                              <th className="px-4 py-2 text-left text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Date</th>
                              <th className="px-4 py-2 text-left text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Équipement</th>
                              <th className="px-4 py-2 text-left text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Type</th>
                              <th className="px-4 py-2 text-left text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Action</th>
                              <th className="px-4 py-2 text-left text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Bénéficiaire</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                           {affectationHistory.map((aff) => (
                              <tr key={aff.id} className="hover:bg-slate-50 transition-colors">
                                 <td className="px-4 py-2 text-xs font-mono text-slate-500">
                                    <div className="flex items-center gap-2">
                                       <Calendar className="w-3 h-3 opacity-50" />
                                       {new Date(aff.date).toLocaleDateString("fr-FR")}
                                    </div>
                                 </td>
                                 <td className="px-4 py-2 text-xs font-bold text-slate-800">{aff.assetName}</td>
                                 <td className="px-4 py-2">
                                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium border ${aff.assetType === "sim" ? "bg-orange-100 text-orange-700 border-orange-200" :
                                          aff.assetType === "mobile" ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
                                             "bg-blue-100 text-blue-700 border-blue-200"
                                       }`}>
                                       {aff.assetType === 'sim' ? <CircuitBoard className="w-3 h-3" /> : aff.assetType === 'mobile' ? <Smartphone className="w-3 h-3" /> : <Wifi className="w-3 h-3" />}
                                       {aff.assetType.toUpperCase()}
                                    </span>
                                 </td>
                                 <td className="px-4 py-2 text-xs text-slate-600">{aff.action}</td>
                                 <td className="px-4 py-2 text-xs font-medium text-slate-700">{aff.targetName}</td>
                              </tr>
                           ))}
                           {affectationHistory.length === 0 && (
                              <tr><td colSpan={5} className="p-8 text-center text-slate-400 italic">Aucun historique trouvé</td></tr>
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
                     <Activity className="w-4 h-4" />
                  </div>
                  <div>
                     <h1 className="text-lg font-extrabold text-slate-900">Parc Équipements</h1>
                     <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Agence Locale</p>
                  </div>
               </div>

               <button
                  onClick={() => setShowHistorique(true)}
                  className={`px-3 py-2 flex items-center gap-2 text-xs uppercase tracking-wide ${buttonSecondary}`}
               >
                  <History className="w-4 h-4" /> Historique
               </button>
            </div>
         </div>

         <div className="max-w-7xl mx-auto p-4 space-y-4">

            {/* Toolbar */}
            <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-4">

               <div className="flex flex-1 items-center gap-4">
                  {/* Search */}
                  <div className="relative flex-1 max-w-md">
                     <Search className="absolute left-3 top-2.5 w-3 h-3 text-slate-400" />
                     <input
                        type="text"
                        placeholder="Rechercher (Nom, Affectation)..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-3 py-2 pl-9 bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                     />
                  </div>

                  {/* Type Filter */}
                  <div className="hidden md:block">
                     <select
                        value={equipmentType}
                        onChange={(e) => setEquipmentType(e.target.value as EquipmentType)}
                        className="px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 outline-none focus:ring-2 focus:ring-emerald-500"
                     >
                        <option value="all">Tous Types</option>
                        <option value="sim">SIM</option>
                        <option value="mobile">Mobile</option>
                        <option value="internet">Internet</option>
                     </select>
                  </div>

                  {/* Sort */}
                  <div className="flex items-center gap-2">
                     <span className="text-[10px] font-bold uppercase text-slate-400 hidden md:block">Trier:</span>
                     <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500"
                     >
                        <option value="name">Identifiant</option>
                        <option value="status">Statut</option>
                        <option value="date">Date</option>
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
                  onClick={() => { setSearchTerm(""); setSortBy("name"); setSortOrder("asc"); setEquipmentType("all"); }}
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
                           <th className="px-4 py-2 text-left text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Statut</th>
                           <th className="px-4 py-2 text-left text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Affecté à</th>
                           <th className="px-4 py-2 text-left text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Détails</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                        {filteredEquipment.map((item) => (
                           <tr key={`${item.type}-${item.id}`} className="hover:bg-slate-50/80 transition-colors group">
                              <td className="px-4 py-2">
                                 <span className={`inline-flex items-center gap-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getTypeStyle(item.type)}`}>
                                    {getTypeIcon(item.type)} {item.type}
                                 </span>
                              </td>
                              <td className="px-4 py-2">
                                 <p className="text-xs font-bold text-slate-800">{item.name}</p>
                              </td>
                              <td className="px-4 py-2">
                                 <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${item.status === "Active" || item.status === "Assigned"
                                       ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                                       : "bg-slate-100 text-slate-500 border border-slate-200"
                                    }`}>
                                    {item.status}
                                 </span>
                              </td>
                              <td className="px-4 py-2">
                                 {item.assignedTo ? (
                                    <span className="text-xs text-blue-700 font-medium flex items-center gap-1.5">
                                       <User className="w-3 h-3" /> {item.assignedTo}
                                    </span>
                                 ) : <span className="text-slate-300 italic text-xs">-</span>}
                              </td>
                              <td className="px-4 py-2">
                                 <div className="flex flex-col text-[10px] text-slate-500">
                                    <span>{item.provider || item.brand || "-"}</span>
                                    <span className="opacity-70">{item.imei || item.speed || ""}</span>
                                 </div>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
               {filteredEquipment.length === 0 && (
                  <div className="p-8 text-center text-slate-400">Aucun équipement trouvé</div>
               )}
            </div>
         </div>
      </div>
   )
}
