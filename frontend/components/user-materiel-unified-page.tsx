"use client"

import { useAuth } from "@/lib/auth-context"
import { FAKE_AFFECTATIONS, FAKE_USERS } from "@/lib/constants"
import { useState, useMemo } from "react"
import {
  CheckCircle, Clock, Package, AlertCircle,
  Smartphone, Wifi, CircuitBoard, X, CheckCircle2,
  ShieldAlert, History, Users, Search, RotateCw,
  ArrowUpDown, Calendar, ArrowRightLeft, FileText,
  Filter, ChevronUp, ChevronDown, ClipboardCheck
} from "lucide-react"

type FilterCondition = "contains" | "startsWith" | "endsWith" | "equals"

export default function UserMaterielUnifiedPage() {
  const { user } = useAuth()

  // --- Global State ---
  const [affectations, setAffectations] = useState(FAKE_AFFECTATIONS)
  const [activeTab, setActiveTab] = useState<"mon-materiel" | "collaborateurs" | "historique">("mon-materiel")

  // --- Standardized Filter State ---
  const [searchTerm, setSearchTerm] = useState("")
  const [filterAttribute, setFilterAttribute] = useState("assetName")
  const [filterCondition, setFilterCondition] = useState<FilterCondition>("contains")

  // --- Modal States ---
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null)
  const [alertingAssetId, setAlertingAssetId] = useState<string | null>(null)
  const [signature, setSignature] = useState("")
  const [alertMessage, setAlertMessage] = useState("")

  // --- Data Logic ---
  const subordinates = useMemo(() => FAKE_USERS.filter((u) => user?.subordinates?.includes(u.id)), [user])

  const userAffectations = affectations.filter((a) => a.targetId === user?.id)

  const pendingSubAffectations = affectations.filter(
    (a) => subordinates.some((s) => s.id === a.targetId) && a.action !== "Reçu"
  )

  const historyAffectations = affectations.filter(
    (a) => (a.targetId === user?.id || subordinates.some((s) => s.id === a.targetId)) && (a.action === "Reçu" || a.action === "Supprimé")
  )

  // --- Handlers ---
  const handleConfirmReception = () => {
    if (selectedAssetId && signature.trim()) {
      setAffectations(prev => prev.map((a) => (a.id === selectedAssetId ? { ...a, action: "Reçu" } : a)))
      setSignature(""); setSelectedAssetId(null);
    }
  }

  const handleAlertAction = () => {
    if (alertingAssetId && alertMessage.trim()) {
      // Logic: Turn card red by setting action to "Alerte" (we'll style this below)
      setAffectations(prev => prev.map((a) => (a.id === alertingAssetId ? { ...a, action: "Supprimé" } : a)))
      setAlertMessage(""); setAlertingAssetId(null);
    }
  }

  const handleResetFilters = () => {
    setSearchTerm("");
    setFilterCondition("contains");
    setFilterAttribute(activeTab === "collaborateurs" ? "targetName" : "assetName");
  }

  // --- Filter Implementation ---
  const getFilteredData = (data: typeof FAKE_AFFECTATIONS) => {
    return data.filter(item => {
      if (!searchTerm) return true;
      // @ts-ignore
      const val = item[filterAttribute]?.toString().toLowerCase() || "";
      const term = searchTerm.toLowerCase();
      if (filterCondition === "contains") return val.includes(term);
      if (filterCondition === "startsWith") return val.startsWith(term);
      if (filterCondition === "endsWith") return val.endsWith(term);
      if (filterCondition === "equals") return val === term;
      return true;
    });
  }

  // --- Helpers ---
  const getAssetIcon = (type: string) => {
    switch (type) {
      case 'sim': return <CircuitBoard className="w-5 h-5" />
      case 'mobile': return <Smartphone className="w-5 h-5" />
      case 'internet': return <Wifi className="w-5 h-5" />
      default: return <Package className="w-5 h-5" />
    }
  }

  const getAssetColor = (type: string) => {
    switch (type) {
      case 'sim': return "bg-orange-100 text-orange-600"
      case 'mobile': return "bg-emerald-100 text-emerald-600"
      case 'internet': return "bg-blue-100 text-blue-600"
      default: return "bg-slate-100 text-slate-600"
    }
  }

  const getActionStyle = (action: string) => {
    switch (action) {
      case "Affecté": return "bg-green-100 text-green-800 border-green-200"
      case "Reçu": return "bg-blue-100 text-blue-800 border-blue-200"
      case "Supprimé": return "bg-red-100 text-red-800 border-red-200"
      default: return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getSubordinateName = (userId: string) => FAKE_USERS.find((u) => u.id === userId)?.name || "Inconnu"

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-slate-900">

      {/* Navbar */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-sidebar-primary to-accent rounded-lg flex items-center justify-center text-white shadow-sm">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">Gestion Matériel</h1>
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Unified Asset Hub</p>
            </div>
          </div>

          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button onClick={() => { setActiveTab("mon-materiel"); handleResetFilters(); }} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === "mon-materiel" ? "bg-white shadow-sm text-emerald-600" : "text-slate-500 hover:text-slate-700"}`}>Mon Matériel</button>
            {subordinates.length > 0 && (
              <button onClick={() => { setActiveTab("collaborateurs"); handleResetFilters(); setFilterAttribute("targetName") }} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === "collaborateurs" ? "bg-white shadow-sm text-emerald-600" : "text-slate-500 hover:text-slate-700"}`}>Collaborateurs</button>
            )}
            <button onClick={() => { setActiveTab("historique"); handleResetFilters(); }} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === "historique" ? "bg-white shadow-sm text-emerald-600" : "text-slate-500 hover:text-slate-700"}`}>Historique</button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 space-y-6">

        {/* HERO BANNER */}
        <div className="relative overflow-hidden bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-emerald-50 rounded-full blur-3xl opacity-60"></div>
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className={`flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner bg-blue-100`}>
                {activeTab === "mon-materiel" && <Package className="w-6 h-6 text-blue-600" />}
                {activeTab === "collaborateurs" && <Users className="w-6 h-6 text-blue-600" />}
                {activeTab === "historique" && <History className="w-6 h-6 text-blue-600" />}
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-1">
                  {activeTab === "mon-materiel" && `Bienvenue, ${user?.name}`}
                  {activeTab === "collaborateurs" && "Validation d'Équipe"}
                  {activeTab === "historique" && "Archives Matériel"}
                </h2>
                <p className="text-slate-500 text-xs max-w-xl">
                  {activeTab === "mon-materiel" && "Consultez et confirmez la réception de vos équipements personnels."}
                  {activeTab === "collaborateurs" && "Gérez les confirmations de réception pour les membres de votre agence."}
                  {activeTab === "historique" && "Consultez l'historique de tous les assets confirmés ou rejetés."}
                </p>
              </div>
            </div>
            {activeTab !== "historique" && (
              <div className="bg-orange-500 px-4 py-3 rounded-2xl flex flex-col items-center min-w-[100px] shadow-lg shadow-orange-100">
                <Clock className="w-3.5 h-3.5 text-orange-100 mb-1" />
                <span className="text-[10px] font-bold text-orange-100 uppercase tracking-widest">En attente</span>
                <span className="text-lg font-bold text-white mt-0.5">
                  {activeTab === "mon-materiel" ? userAffectations.filter(a => a.action === 'Affecté').length : pendingSubAffectations.filter(a => a.action === 'Affecté').length}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ADVANCED FILTER TOOLBAR */}
        <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col md:flex-row items-center gap-3 w-full">
            <div className="flex items-center gap-2 text-slate-400 px-2">
              <Filter className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase">Filtrer</span>
            </div>
            <div className="relative w-full md:w-auto">
              <select value={filterAttribute} onChange={(e) => setFilterAttribute(e.target.value)} className="w-full md:w-40 px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer">
                <option value="assetName">Nom Matériel</option>
                <option value="assetType">Type Matériel</option>
                {activeTab !== "mon-materiel" && <option value="targetName">Collaborateur</option>}
                <option value="date">Date</option>
              </select>
            </div>
            <div className="relative w-full md:w-auto">
              <select value={filterCondition} onChange={(e) => setFilterCondition(e.target.value as FilterCondition)} className="w-full md:w-36 px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer">
                <option value="contains">Contient</option>
                <option value="startsWith">Commence par</option>
                <option value="equals">Est égal à</option>
              </select>
            </div>
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-2.5 w-3 h-3 text-slate-400" />
              <input type="text" placeholder={`Rechercher par ${filterAttribute}...`} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none transition-all shadow-sm" />
            </div>
          </div>
          <button onClick={handleResetFilters} className="p-2 hover:bg-slate-50 text-slate-400 hover:text-emerald-600 rounded-lg transition-all border border-transparent hover:border-slate-100">
            <RotateCw className="w-4 h-4" />
          </button>
        </div>

        {/* MON MATÉRIEL CONTENT */}
        {activeTab === "mon-materiel" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {getFilteredData(userAffectations).map((aff) => {
              const isReceived = aff.action === "Reçu"
              const isAlerted = aff.action === "Supprimé"
              return (
                <div key={aff.id} className={`bg-white border rounded-[1.5rem] p-4 shadow-sm transition-all hover:shadow-md relative overflow-hidden ${isReceived ? 'border-emerald-200 bg-emerald-50/5' : isAlerted ? 'border-red-200 bg-red-50/5' : 'border-orange-200'}`}>
                  {!isReceived && !isAlerted && <div className="absolute top-0 right-0 w-16 h-16 bg-orange-400 opacity-10 rounded-bl-full -mr-8 -mt-8"></div>}
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className={`p-2.5 rounded-xl ${getAssetColor(aff.assetType)} shadow-sm`}>{getAssetIcon(aff.assetType)}</div>
                      <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase flex items-center gap-1.5 ${isReceived ? 'bg-emerald-100 text-emerald-700' : isAlerted ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                        {isReceived ? "Validé" : isAlerted ? "Signalé" : "En attente"}
                      </div>
                    </div>
                    <h3 className="font-bold text-slate-800 text-sm leading-tight">{aff.assetName}</h3>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">{aff.assetType} • {aff.id}</p>
                  </div>
                  {aff.action === "Affecté" && (
                    <div className="flex gap-2 mt-4">
                      <button onClick={() => setSelectedAssetId(aff.id)} className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold uppercase tracking-widest rounded-lg shadow-sm">Confirmer</button>
                      <button onClick={() => setAlertingAssetId(aff.id)} className="flex-1 py-2 bg-white border border-red-200 text-red-600 hover:bg-red-50 text-[10px] font-bold uppercase tracking-widest rounded-lg">Signaler</button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* COLLABORATEURS CONTENT */}
        {activeTab === "collaborateurs" && (
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold uppercase text-slate-400 tracking-widest">
                <tr>
                  <th className="px-4 py-3">Collaborateur</th>
                  <th className="px-4 py-3">Matériel</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-xs">
                {getFilteredData(pendingSubAffectations).map(aff => (
                  <tr key={aff.id} className={`hover:bg-slate-50/50 transition-colors ${aff.action === "Supprimé" ? "bg-red-50/30" : ""}`}>
                    <td className="px-4 py-3 font-bold text-slate-800">{getSubordinateName(aff.targetId)}</td>
                    <td className="px-4 py-3 text-slate-600">{aff.assetName}</td>
                    <td className="px-4 py-3 font-mono text-slate-500">{aff.date}</td>
                    <td className="px-4 py-3 text-right">
                      {aff.action === "Affecté" ? (
                        <div className="flex justify-end gap-2">
                          <button onClick={() => setSelectedAssetId(aff.id)} className="px-2 py-1 bg-emerald-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest">Confirmer</button>
                          <button onClick={() => setAlertingAssetId(aff.id)} className="px-2 py-1 bg-white border border-red-100 text-red-600 rounded-lg text-[10px] font-black uppercase tracking-widest">Annuler</button>
                        </div>
                      ) : (
                        <span className="text-[10px] font-bold text-red-600 uppercase border border-red-100 px-2 py-0.5 rounded-full">Annulation Demandée</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* HISTORIQUE CONTENT */}
        {activeTab === "historique" && (
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold uppercase text-slate-400 tracking-widest">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Équipement</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Utilisateur</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-xs">
                {getFilteredData(historyAffectations).map((hist) => (
                  <tr key={hist.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 font-mono text-slate-500">{hist.date}</td>
                    <td className="px-4 py-3 font-bold text-slate-800">{hist.assetName}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase ${getActionStyle(hist.action)}`}>{hist.action}</span></td>
                    <td className="px-4 py-3 font-medium text-slate-700">{hist.targetName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- CENTRALIZED MODALS (ORIGINAL DESIGNS) --- */}

      {/* Accuser Réception Modal */}
      {selectedAssetId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white border border-border rounded-lg p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="text-center sm:text-left">
              <h2 className="text-lg font-bold text-slate-900">Accuser Réception</h2>
              <p className="text-xs text-slate-500 mt-1">Veuillez confirmer la réception de l'équipement</p>
            </div>

            {affectations.filter(a => a.id === selectedAssetId).map((aff) => (
              <div key={aff.id} className="p-3 bg-slate-50 rounded-lg border border-border space-y-1.5">
                <p className="font-bold text-slate-800 text-sm">{aff.assetName}</p>
                <p className="text-xs text-slate-500 capitalize">{aff.assetType}</p>
                <p className="text-[10px] text-slate-400 italic">Affecté le {aff.date}</p>
                {activeTab === "collaborateurs" && <p className="text-[10px] text-emerald-600 font-bold mt-1">Agent: {getSubordinateName(aff.targetId)}</p>}
              </div>
            ))}

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700">Votre nom complet</label>
              <input type="text" value={signature} onChange={(e) => setSignature(e.target.value)} placeholder="Entrez votre nom..." className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-xs" />
            </div>

            <div className="bg-blue-50 border border-blue-100 p-2 rounded-lg text-[10px] text-blue-700">
              En confirmant, vous certifiez avoir reçu le matériel décrit ci-dessus et en être responsable.
            </div>

            <div className="flex gap-3 pt-3 border-t border-slate-100">
              <button onClick={handleConfirmReception} disabled={!signature.trim()} className="flex-1 px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-bold text-xs disabled:opacity-50">Confirmer</button>
              <button onClick={() => { setSelectedAssetId(null); setSignature(""); }} className="flex-1 px-3 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-bold text-xs">Annuler</button>
            </div>
          </div>
        </div>
      )}

      {/* Alerte / Signaler Modal */}
      {alertingAssetId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white border border-border rounded-lg p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-100"><AlertCircle className="w-5 h-5 text-red-600" /></div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Signaler un Problème</h2>
                <p className="text-xs text-slate-500">Non-réception ou matériel non conforme</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-border">
              <p className="font-bold text-slate-800 text-sm">{affectations.find(a => a.id === alertingAssetId)?.assetName}</p>
              <p className="text-[10px] text-slate-400 mt-1">ID Ref: {alertingAssetId}</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700">Décrivez le problème</label>
              <textarea value={alertMessage} onChange={(e) => setAlertMessage(e.target.value)} placeholder="Détaillez la raison du signalement..." className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none min-h-[80px] resize-none text-xs" />
            </div>

            <div className="bg-blue-50 border border-blue-100 p-2 rounded-lg text-[10px] text-blue-700">
              Le gestionnaire de parc sera notifié pour traiter ce litige.
            </div>

            <div className="flex gap-3 pt-3 border-t border-slate-100">
              <button onClick={handleAlertAction} disabled={!alertMessage.trim()} className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-bold text-xs disabled:opacity-50">Signaler</button>
              <button onClick={() => { setAlertingAssetId(null); setAlertMessage(""); }} className="flex-1 px-3 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-bold text-xs">Annuler</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}