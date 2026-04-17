"use client"

import { useAuth } from "@/lib/auth-context"
import { useState, useEffect } from "react"
import api from "@/lib/api"
import {
   Package, CheckCircle, AlertCircle,
   Smartphone, Wifi, CircuitBoard, Monitor,
   X, CheckCircle2, ShieldAlert, Clock, ChevronDown
} from "lucide-react"

// --- TYPES ---
interface MyAsset {
   id: number
   typeMateriel: string // "Mobile", "CarteSim", "LigneInternet", "Ordinateur portable"...
   sn?: string
   numero?: string
   operateur?: string
   materielName: string
   statusAffectation: string // "affecter", "recu", "annuler"
   dateEnvoie?: string
   dateRecu?: string
   specificId: number
}

const MOTIF_OPTIONS = [
   "En panne",
   "N'est pas arrivé",
]

export default function ChefAgenceMaterielAffectePage() {
   const { user } = useAuth()

   // --- State ---
   const [assets, setAssets] = useState<MyAsset[]>([])
   const [loading, setLoading] = useState(true)

   // Modals
   const [selectedAssetId, setSelectedAssetId] = useState<number | null>(null)
   const [alertingAssetId, setAlertingAssetId] = useState<number | null>(null)

   // Signaler form fields
   const [selectedMotif, setSelectedMotif] = useState("")
   const [commentaire, setCommentaire] = useState("")

   useEffect(() => {
      fetchMyAssets()
   }, [])

   useEffect(() => {
      const refreshVisibleAssets = () => {
         if (document.visibilityState === "visible") {
            void fetchMyAssets()
         }
      }

      const interval = window.setInterval(refreshVisibleAssets, 4000)
      window.addEventListener("focus", refreshVisibleAssets)
      document.addEventListener("visibilitychange", refreshVisibleAssets)

      return () => {
         window.clearInterval(interval)
         window.removeEventListener("focus", refreshVisibleAssets)
         document.removeEventListener("visibilitychange", refreshVisibleAssets)
      }
   }, [])

   const fetchMyAssets = async () => {
      try {
         setLoading(true)
         const res = await api.get("/user-materiel/my-assets")
         setAssets(Array.isArray(res.data) ? res.data : [])
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
   }

   // --- Handlers ---
   const handleConfirmReception = async (assetId: number) => {
      try {
         await api.post(`/user-materiel/confirm/${assetId}`)
         fetchMyAssets()
         setSelectedAssetId(null)
      } catch (e) { alert("Erreur lors de la confirmation") }
   }

   const handleAlerte = async (assetId: number) => {
      if (!selectedMotif) return
      try {
         await api.post(`/user-materiel/report/${assetId}`, {
            motif: selectedMotif,
            commentaire: commentaire.trim() || null
         })
         fetchMyAssets()
         setSelectedMotif("")
         setCommentaire("")
         setAlertingAssetId(null)
      } catch (e) { alert("Erreur lors du signalement") }
   }

   // --- Helpers ---
   const getAssetIcon = (type: string) => {
      const t = type.toLowerCase()
      if (t.includes('mobile') || t.includes('gsm')) return <Smartphone className="w-5 h-5" />
      if (t.includes('sim')) return <CircuitBoard className="w-5 h-5" />
      if (t.includes('internet')) return <Wifi className="w-5 h-5" />
      if (t.includes('ordinateur') || t.includes('ecran')) return <Monitor className="w-5 h-5" />
      return <Package className="w-5 h-5" />
   }

   const getAssetColor = (type: string) => {
      const t = type.toLowerCase()
      if (t.includes('mobile')) return "bg-emerald-100 text-emerald-600"
      if (t.includes('sim')) return "bg-orange-100 text-orange-600"
      if (t.includes('internet')) return "bg-blue-100 text-blue-600"
      return "bg-purple-100 text-purple-600"
   }

   // Filter out "Deleted" or irrelevant statuses if API returns them
   const displayedAssets = assets.filter(a => ['affecter', 'recu', 'annuler'].includes(a.statusAffectation.toLowerCase()))

   // KPI
   const countPending = displayedAssets.filter(a => a.statusAffectation.toLowerCase() === 'affecter').length

   // --- Styles ---
   const inputStyle = "w-full px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
   const labelStyle = "block text-xs font-bold uppercase text-slate-500 mb-2 tracking-wide"

   return (
      <div className="min-h-screen bg-[#f8fafc] font-sans text-slate-900">

         {/* Top Navbar */}
         <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
            <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
               <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-sidebar-primary to-accent rounded-lg flex items-center justify-center text-sidebar-primary-foreground shadow-sm">
                     <Package className="w-4 h-4" />
                  </div>
                  <div><h1 className="text-lg font-bold text-slate-900 tracking-tight">Mon Matériel</h1></div>
               </div>
            </div>
         </div>

         <div className="max-w-7xl mx-auto p-4 space-y-6">

            {/* HERO BANNER */}
            <div className="relative overflow-hidden bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
               <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-emerald-50 rounded-full blur-3xl opacity-60"></div>
               <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-40 h-40 bg-blue-50 rounded-full blur-3xl opacity-60"></div>

               <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="flex items-start gap-4">
                     <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center shadow-inner">
                        <Package className="w-6 h-6 text-blue-600" />
                     </div>
                     <div>
                        <h2 className="text-xl font-bold text-slate-900 mb-1">Bienvenue, {user?.name || "Collaborateur"}</h2>
                        <p className="text-slate-500 text-xs leading-relaxed max-w-xl">
                           Consultez et validez les équipements qui vous sont <span className="text-emerald-600 font-semibold underline decoration-emerald-200 underline-offset-4 tracking-tight">affectés</span>.
                           En cas de problème, utilisez l'option <span className="text-red-500 font-semibold underline decoration-red-200 underline-offset-4 tracking-tight">Signaler</span>.
                        </p>
                     </div>
                  </div>

                  <div className="flex items-center gap-3">
                     <div className="bg-slate-50 border border-slate-100 px-4 py-3 rounded-xl flex flex-col items-center min-w-[100px]">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Assets</span>
                        <span className="text-2xl font-black text-slate-900">{displayedAssets.length}</span>
                     </div>
                     <div className="bg-emerald-600 px-4 py-3 rounded-xl flex flex-col items-center min-w-[100px] shadow-lg shadow-emerald-100">
                        <Clock className="w-3.5 h-3.5 text-emerald-100 mb-1" />
                        <span className="text-[10px] font-bold text-emerald-100 uppercase tracking-widest">En attente</span>
                        <span className="text-lg font-bold text-white uppercase leading-none mt-1">{countPending}</span>
                     </div>
                  </div>
               </div>
            </div>

            {/* Equipment Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
               {displayedAssets.length > 0 ? (
                  displayedAssets.map((aff) => {
                     const isReceived = aff.statusAffectation.toLowerCase() === "recu"
                     const isAnnule = aff.statusAffectation.toLowerCase() === "annuler"

                     return (
                        <div
                           key={aff.id}
                           className={`bg-white border rounded-2xl p-5 shadow-sm transition-all hover:shadow-md flex flex-col justify-between 
                            ${isReceived ? 'border-emerald-100 bg-emerald-50/10' :
                                 isAnnule ? 'border-red-200 bg-red-50/10' :
                                    'border-orange-200 relative overflow-hidden'}`}
                        >
                           {!isReceived && !isAnnule && <div className="absolute top-0 right-0 w-16 h-16 bg-orange-400 opacity-10 rounded-bl-full -mr-8 -mt-8"></div>}

                           <div className="space-y-3">
                              <div className="flex items-start justify-between">
                                 <div className={`p-2.5 rounded-xl ${getAssetColor(aff.typeMateriel)} shadow-sm`}>
                                    {getAssetIcon(aff.typeMateriel)}
                                 </div>
                                 <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase flex items-center gap-1 
                                  ${isReceived ? 'bg-emerald-100 text-emerald-700' :
                                       isAnnule ? 'bg-red-100 text-red-700' :
                                          'bg-orange-100 text-orange-700'}`}>
                                    {isReceived ? <CheckCircle className="w-3 h-3" /> :
                                       isAnnule ? <ShieldAlert className="w-3 h-3" /> :
                                          <AlertCircle className="w-3 h-3" />}
                                    {isReceived ? "Reçu" : isAnnule ? "Signalé" : "En Attente"}
                                 </div>
                              </div>

                              <div>
                                 <h3 className="font-bold text-slate-800 text-base leading-tight tracking-tight">{aff.materielName}</h3>
                                 <p className="text-[10px] font-semibold text-slate-400 mt-0.5 capitalize">{aff.typeMateriel}</p>

                                 <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-3">
                                    <div>
                                       <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Identifiant (SN)</span>
                                       <span className="text-[10px] font-mono text-slate-600">{aff.sn || aff.numero || "-"}</span>
                                    </div>
                                    <div>
                                       <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                          {isReceived ? "Reçu le" : isAnnule ? "Signalé le" : "Envoyé le"}
                                       </span>
                                       <span className="text-[10px] text-slate-600">
                                          {isReceived ? aff.dateRecu : aff.dateEnvoie || "-"}
                                       </span>
                                    </div>
                                 </div>
                              </div>
                           </div>

                           {/* Actions only if not processed (not recu and not annuler) */}
                           {!isReceived && !isAnnule && (
                              <div className="flex gap-2 mt-4">
                                 <button
                                    onClick={() => setSelectedAssetId(aff.id)}
                                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold uppercase tracking-widest rounded-lg transition-colors shadow-sm"
                                 >
                                    Accuser Réception
                                 </button>
                                 <button
                                    onClick={() => setAlertingAssetId(aff.id)}
                                    className="flex-1 py-2 bg-white border border-red-200 text-red-600 hover:bg-red-50 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-colors"
                                 >
                                    Signaler
                                 </button>
                              </div>
                           )}
                        </div>
                     )
                  })
               ) : (
                  <div className="col-span-full p-12 text-center bg-white border border-slate-200 rounded-[2rem]">
                     <Package className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                     <p className="text-slate-500 font-medium italic text-sm">Aucun équipement affecté pour le moment.</p>
                  </div>
               )}
            </div>

            {/* ─── Confirm Reception Modal (Simplified - no signature) ─── */}
            {selectedAssetId && (
               <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                  <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 p-0 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                     <div className="bg-gradient-to-r from-emerald-800 to-emerald-600 p-6 shadow-lg flex items-center justify-between overflow-hidden relative ">
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                           <CheckCircle2 className="w-5 h-5 text-emerald-400" /> Validation Réception
                        </h2>
                        <button onClick={() => setSelectedAssetId(null)} className="text-emerald-200 hover:text-white transition-colors">
                           <X className="w-5 h-5" />
                        </button>
                     </div>

                     <div className="p-6 space-y-4">
                        {assets.filter(a => a.id === selectedAssetId).map(aff => (
                           <div key={aff.id} className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1">
                              <p className="text-[10px] font-bold text-slate-400 uppercase">Équipement à valider</p>
                              <p className="font-bold text-slate-800 text-base">{aff.materielName}</p>
                              <p className="text-xs text-slate-500 font-mono">SN: {aff.sn || aff.numero}</p>
                           </div>
                        ))}

                        <p className="text-xs text-slate-500 italic leading-relaxed">
                           En cliquant sur Valider, vous confirmez avoir bien reçu et pris possession du matériel ci-dessus.
                        </p>

                        <button
                           onClick={() => handleConfirmReception(selectedAssetId)}
                           className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-widest rounded-xl shadow-lg transition-all"
                        >
                           Valider la Réception
                        </button>
                     </div>
                  </div>
               </div>
            )}

            {/* ─── Alert / Signaler Modal (with Motif + Commentaire) ─── */}
            {alertingAssetId && (
               <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                  <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 p-0 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                     <div className="bg-red-50 px-6 py-4 border-b border-red-100 flex items-center justify-between">
                        <h2 className="text-lg font-bold text-red-900 flex items-center gap-2">
                           <ShieldAlert className="w-5 h-5" /> Signaler un Incident
                        </h2>
                        <button onClick={() => { setAlertingAssetId(null); setSelectedMotif(""); setCommentaire(""); }} className="text-red-400 hover:text-red-700 transition-colors">
                           <X className="w-5 h-5" />
                        </button>
                     </div>

                     <div className="p-6 space-y-5">
                        <p className="text-slate-600 text-xs font-medium">
                           Veuillez préciser la nature de l'anomalie rencontrée pour procéder à l'annulation.
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
                              <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
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
                           onClick={() => handleAlerte(alertingAssetId)}
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
