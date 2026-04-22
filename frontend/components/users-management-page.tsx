"use client"

import { useState, useEffect, useRef } from "react"
import api from "@/lib/api"
import { useVisiblePolling } from "@/lib/use-visible-polling"
import {
   Search, ChevronDown, Trash2, Smartphone, Wifi,
   RotateCw, History, User, Mail, Users,
   UserX, UserMinus, ArrowUpDown, X,
   CircuitBoard, AlertTriangle, UserCheck,
   Filter, ChevronUp, MoreHorizontal, ClipboardCheck,
   ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight
} from "lucide-react"
import UserHistoryPage from "./users-history-page"

type FilterCondition = "contains" | "startsWith" | "endsWith" | "equals"
type UserStatus = "active" | "desactiver" | "detacher" | "archived" | "Activated" | "Deactivated" | "Detached"

interface UserData {
   id: number
   nom: string
   prenom: string
   email: string
   tel: string
   cin: string
   matricule: string
   status: string
   dateEmbauche?: string
   dateDetacher?: string
   dateDesactiver?: string
   fonctionRef?: { nom: string }
   departement?: { id: number, nom: string }
   agence?: { id: number, nom: string }
   entrepot?: { id: number, siteRef?: { libeller: string } }
   managerId?: number
   isManager?: number
}

interface EntrepotOption {
   id: number
   siteNom?: string
   siteRef?: { libeller: string }
}

function Pagination({ current, total, setPage }: { current: number, total: number, setPage: (page: number) => void }) {
   const go = (next: number) => {
      if (next < 1) next = 1
      if (next > total) next = total
      setPage(next)
   }

   return (
      <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-2 border-t border-slate-100 bg-slate-50/50 gap-4">
         <span className="text-xs font-medium text-slate-500">Page {current} sur {total || 1}</span>
         <div className="flex items-center gap-2">
            <button onClick={() => go(1)} disabled={current === 1} className="p-1 rounded hover:bg-slate-200 text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"><ChevronsLeft className="w-4 h-4" /></button>
            <button onClick={() => go(current - 1)} disabled={current === 1} className="p-1 rounded hover:bg-slate-200 text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"><ChevronLeft className="w-4 h-4" /></button>
            <span className="text-xs font-bold text-slate-400 uppercase px-2">Page {current} / {total || 1}</span>
            <button onClick={() => go(current + 1)} disabled={current === total || total === 0} className="p-1 rounded hover:bg-slate-200 text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"><ChevronRight className="w-4 h-4" /></button>
            <button onClick={() => go(total)} disabled={current === total || total === 0} className="p-1 rounded hover:bg-slate-200 text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"><ChevronsRight className="w-4 h-4" /></button>
         </div>
      </div>
   )
}

export default function UsersManagementPage() {
   // --- State ---
   const [selectedChief, setSelectedChief] = useState("")

   // Advanced Filter State
   const [searchTerm, setSearchTerm] = useState("")
   const [filterAttribute, setFilterAttribute] = useState("nom")
   const [filterCondition, setFilterCondition] = useState<FilterCondition>("contains")

   // Sorting State
   const [sortBy, setSortBy] = useState("nom")
   const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")

   const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
   const [users, setUsers] = useState<UserData[]>([])
   const [allUsers, setAllUsers] = useState<UserData[]>([])
   const [departements, setDepartements] = useState<{ id: number, nom: string }[]>([])
   const [agences, setAgences] = useState<{ id: number, nom: string }[]>([])
   const [entrepots, setEntrepots] = useState<EntrepotOption[]>([])

   const [reaffectDepartementId, setReaffectDepartementId] = useState<number | "">(-1)
   const [reaffectAgenceId, setReaffectAgenceId] = useState<number | "">(-1)
   const [reaffectEntrepotId, setReaffectEntrepotId] = useState<number | "">(-1)

   const [reaffectUpdateOrg, setReaffectUpdateOrg] = useState(false)
   const [reaffectUpdateManager, setReaffectUpdateManager] = useState(false)

   const [isLoading, setIsLoading] = useState(true)
   const [showHistory, setShowHistory] = useState(false)
   const [showDeactivateModal, setShowDeactivateModal] = useState<number | null>(null)
   const [showReaffectModal, setShowReaffectModal] = useState<number | null>(null)
   const [page, setPage] = useState(1)
   const PAGE_SIZE = 10
   const hasLoadedUsersRef = useRef(false)

   useEffect(() => {
      void fetchUsers()
      void fetchOptions()
   }, [])

   useVisiblePolling(() => {
      void fetchUsers({ silent: true })
   }, 10000, [])

   const fetchUsers = async ({ silent = false }: { silent?: boolean } = {}) => {
      try {
         if (!silent && !hasLoadedUsersRef.current) {
            setIsLoading(true)
         }
         const res = await api.get("/users/management")
         setUsers(res.data)
         hasLoadedUsersRef.current = true
         setIsLoading(false)
      } catch (error) {
         console.error("Failed to fetch users", error)
         setIsLoading(false)
      }
   }

   const fetchOptions = async () => {
      try {
         const [dRes, aRes, eRes, uRes] = await Promise.all([
            api.get("/departements"),
            api.get("/agences"),
            api.get("/entrepots"),
            api.get("/users")
         ])
         setDepartements(dRes.data)
         setAgences(aRes.data)
         setEntrepots(eRes.data)
         setAllUsers(Array.isArray(uRes.data) ? uRes.data : [])
      } catch (err) { console.error("Failed to fetch options", err) }
   }

   const getEntrepotLabel = (entrepot?: EntrepotOption | UserData["entrepot"]) => {
      if (!entrepot) return "—"
      return entrepot.siteRef?.libeller || ("siteNom" in entrepot ? entrepot.siteNom : undefined) || `Entrepôt #${entrepot.id}`
   }

   // --- Styles (Matching SIM Page) ---
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

   // --- Logic ---
   const normalizeStatus = (status?: string) => (status || "").toLowerCase()
   const targetUsers = users.filter((u) => {
      const status = normalizeStatus(u.status)
      return status === "desactiver" || status === "detacher"
   })
   const kpiTotal = targetUsers.length
   const kpiDetached = users.filter((u) => normalizeStatus(u.status) === "detacher").length
   const kpiDeactivated = users.filter((u) => normalizeStatus(u.status) === "desactiver").length

   const getFieldValue = (user: UserData, attribute: string): string => {
      if (attribute === "nom") return (user.nom || "") + " " + (user.prenom || "");
      if (attribute === "departement") return user.departement?.nom || "";
      if (attribute === "statut") return normalizeStatus(user.status);
      // @ts-ignore
      const val = user[attribute];
      return val ? val.toString().toLowerCase() : "";
   }

   const sorted = [...targetUsers]
      .filter((user) => {
         if (!searchTerm) return true
         const value = getFieldValue(user, filterAttribute)
         const term = searchTerm.toLowerCase()
         switch (filterCondition) {
            case "contains": return value.includes(term)
            case "startsWith": return value.startsWith(term)
            case "endsWith": return value.endsWith(term)
            case "equals": return value === term
            default: return true
         }
      })
      .sort((a, b) => {
         const aVal = getFieldValue(a, sortBy)
         const bVal = getFieldValue(b, sortBy)
         return sortOrder === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      })
   const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
   const paginatedUsers = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

   useEffect(() => {
      setPage(1)
   }, [searchTerm, filterAttribute, filterCondition, sortBy, sortOrder])

   useEffect(() => {
      if (page > totalPages) setPage(totalPages)
   }, [page, totalPages])

   const handleSortClick = (attribute: string) => {
      if (sortBy === attribute) setSortOrder(sortOrder === "asc" ? "desc" : "asc")
      else { setSortBy(attribute); setSortOrder("asc"); }
   }

   const handleResetFilters = () => {
      setSearchTerm("")
      setFilterAttribute("nom")
      setFilterCondition("contains")
      setSortBy("nom")
      setSortOrder("asc")
   }

   const handleDeactivateUser = async (userId: number) => {
      try {
         const res = await api.post(`/users/${userId}/desactiver`)
         setUsers((prev) => prev.map((user) => user.id === userId ? { ...user, ...res.data } : user))
      } catch (err) { console.error(err) }
      setShowDeactivateModal(null)
   }

   const handleActiverUser = async (userId: number) => {
      if (!confirm("Voulez-vous réactiver cet utilisateur ?")) return
      try {
         const res = await api.put(`/users/${userId}/activer`)
         setUsers((prev) => prev.map((user) => user.id === userId ? { ...user, ...res.data } : user))
      } catch (err) { console.error(err) }
   }

   const handleReaffectUser = async (userId: number) => {
      try {
         const res = await api.post(`/users/${userId}/reaffecter`, {
            updateOrg: reaffectUpdateOrg,
            updateManager: reaffectUpdateManager,
            departementId: reaffectDepartementId !== "" ? reaffectDepartementId : null,
            agenceId: reaffectAgenceId !== "" ? reaffectAgenceId : null,
            entrepotId: reaffectEntrepotId !== "" ? reaffectEntrepotId : null,
            managerId: selectedChief !== "" ? Number(selectedChief) : null
         })
         setUsers((prev) => prev.map((user) => user.id === userId ? { ...user, ...res.data } : user))
      } catch (err) { console.error(err) }
      setShowReaffectModal(null)
      setReaffectDepartementId(-1)
      setReaffectAgenceId(-1)
      setReaffectEntrepotId(-1)
      setSelectedChief("-1")
      setReaffectUpdateOrg(false)
      setReaffectUpdateManager(false)
   }

   const openReaffectModal = (user: UserData) => {
      setShowReaffectModal(user.id)
      setReaffectDepartementId(-1)
      setReaffectAgenceId(-1)
      setReaffectEntrepotId(-1)
      setSelectedChief("-1")
   }

   // Styles used in the new components
   const inputStyle = "w-full px-3 py-2 bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
   const buttonPrimary = "bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-all shadow-md shadow-emerald-100"
   const buttonSecondary = "bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-lg transition-all"


   if (showHistory) return <UserHistoryPage onBack={() => setShowHistory(false)} />

   return (
      <div className={styles.pageBg}>
         {/* Header */}
         <div className={styles.header}>
            <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
               <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-sidebar-primary to-accent rounded-lg flex items-center justify-center text-sidebar-primary-foreground shadow-sm">
                     <Users className="w-5 h-5" />
                  </div>
                  <div>
                     <h1 className="text-lg font-black text-slate-900 leading-none">Gestion Staff</h1>
                  </div>
               </div>
               <button onClick={() => setShowHistory(true)} className={`px-3 py-2 flex items-center gap-2 text-xs ${styles.secondaryBtn}`}>
                  <History className="w-3 h-3 text-emerald-600" /> Historique Global
               </button>
            </div>
         </div>

         <div className="max-w-7xl mx-auto p-4 space-y-4">
            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-emerald-200 transition-all">
                  <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                     <Users className="w-16 h-16 text-slate-900" />
                  </div>
                  <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">A Traiter</p>
                  <p className="text-3xl font-black text-slate-900">{kpiTotal}</p>
               </div>

               <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-orange-200 transition-all">
                  <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                     <UserMinus className="w-16 h-16 text-orange-600" />
                  </div>
                  <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Détachés</p>
                  <p className="text-3xl font-black text-orange-600">{kpiDetached}</p>
               </div>

               <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-red-200 transition-all">
                  <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                     <UserX className="w-16 h-16 text-red-600" />
                  </div>
                  <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Désactivés</p>
                  <p className="text-3xl font-black text-red-600">{kpiDeactivated}</p>
               </div>
            </div>

            {/* ----------------------------------------------------------------------- */}
            {/* NEW ADVANCED FILTER TOOLBAR (From Second Code)                          */}
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
                        className="w-full md:w-36 px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                     >
                        <option value="name">Nom</option>
                        <option value="email">Email</option>
                        <option value="department">Département</option>
                        <option value="status">Statut</option>
                     </select>
                  </div>

                  {/* 2. Condition Selector */}
                  <div className="relative w-full md:w-auto">
                     <select
                        value={filterCondition}
                        onChange={(e) => setFilterCondition(e.target.value as FilterCondition)}
                        className="w-full md:w-36 px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                     >
                        <option value="contains">Contient</option>
                        <option value="startsWith">Commence par</option>
                        <option value="endsWith">Finit par</option>
                        <option value="equals">Est égal à</option>
                     </select>
                  </div>

                  {/* 3. Search Input */}
                  <div className="relative flex-1 w-full">
                     <Search className="absolute left-3 top-2.5 w-3 h-3 text-slate-400" />
                     <input
                        type="text"
                        placeholder={`Rechercher dans ${filterAttribute}...`}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                     />
                  </div>
               </div>

               <button
                  onClick={handleResetFilters}
                  className="p-2 hover:bg-slate-50 text-slate-400 hover:text-emerald-600 rounded-lg transition-all border border-transparent hover:border-slate-100"
                  title="Réinitialiser les filtres"
               >
                  <RotateCw className="w-4 h-4" />
               </button>
            </div>

            {/* Table */}
            <div className={styles.card}>
               <div className="overflow-x-auto">
                  <table className="w-full min-w-[980px]">
                     <thead>
                        <tr>
                           {[{ id: 'nom', label: 'Collaborateur' }, { id: 'agence', label: 'Agence' }, { id: 'entrepot', label: 'Entrepôt' }, { id: 'departement', label: 'Département' }, { id: 'manager', label: 'Manager' }, { id: 'statut', label: 'Statut' }].map((col) => (
                              <th key={col.id} className={`${styles.th} cursor-pointer hover:bg-slate-100 hover:text-emerald-600 transition-colors group`} onClick={() => handleSortClick(col.id)}>
                                 <div className="flex items-center gap-2">
                                    {col.label} {sortBy === col.id ? (sortOrder === "asc" ? <ChevronUp className="w-3 h-3 text-emerald-600" /> : <ChevronDown className="w-3 h-3 text-emerald-600" />) : <ArrowUpDown className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100" />}
                                 </div>
                              </th>
                           ))}
                           <th className={`${styles.th} text-right`}>Actions</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100 bg-white">
                        {paginatedUsers.map((user) => {
                           const manager = user.managerId ? allUsers.find(u => u.id === user.managerId) : null;
                           const status = normalizeStatus(user.status);

                           return (
                              <tr key={user.id} className="hover:bg-slate-50/80 transition-colors group">
                                 <td className={styles.td}>
                                    <div className="flex items-center gap-3">
                                       <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors font-bold text-[10px] uppercase">
                                          {(user.nom || "?").charAt(0)}
                                       </div>
                                       <div>
                                          <p className="font-bold text-slate-700 text-xs">{user.nom} {user.prenom}</p>
                                          <p className="text-[9px] uppercase font-bold text-slate-400 tracking-tighter">Matricule: {user.matricule || "—"}</p>
                                       </div>
                                    </div>
                                 </td>
                                 <td className={styles.td}>
                                    <p className="font-medium text-slate-700 text-xs">{user.agence?.nom || "—"}</p>
                                 </td>
                                 <td className={styles.td}>
                                    <p className="font-medium text-slate-700 text-xs">{user.entrepot?.siteRef?.libeller || "—"}</p>
                                 </td>
                                 <td className={styles.td}>
                                    <p className="font-medium text-slate-700 text-xs">{user.departement?.nom || "—"}</p>
                                 </td>
                                 <td className={styles.td}>
                                    {manager ? (
                                       <div>
                                          <p className="font-bold text-slate-700 text-xs">{manager.nom} {manager.prenom}</p>
                                          <p className="text-[9px] uppercase font-bold text-slate-400 tracking-tighter">Matricule: {manager.matricule || "—"}</p>
                                       </div>
                                    ) : (
                                       <span className="text-slate-400 text-xs">—</span>
                                    )}
                                 </td>
                                 <td className={styles.td}>
                                    {status === "detacher" ? (
                                       <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 text-orange-600 border border-orange-100">
                                          <UserMinus className="w-3 h-3" /> Détaché
                                       </span>
                                    ) : status === "desactiver" ? (
                                       <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-600 border border-red-100">
                                          <UserX className="w-3 h-3" /> Désactivé
                                       </span>
                                    ) : status === "archived" ? (
                                       <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-50 text-slate-600 border border-slate-200">
                                          <Trash2 className="w-3 h-3" /> Archivé
                                       </span>
                                    ) : (
                                       <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
                                          <UserCheck className="w-3 h-3" /> Actif
                                       </span>
                                    )}
                                 </td>
                                 <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-1">
                                       <button onClick={() => setSelectedUserId(user.id)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Détails"><MoreHorizontal className="w-4 h-4" /></button>
                                       {status === "detacher" && (
                                          <>
                                             <button onClick={() => setShowReaffectModal(user.id)} className="p-1.5 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all" title="Réaffecter"><RotateCw className="w-4 h-4" /></button>
                                             <button onClick={() => setShowDeactivateModal(user.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Désactiver"><Trash2 className="w-4 h-4" /></button>
                                          </>
                                       )}
                                       {(status === "desactiver" || status === "archived") && (
                                          <>
                                             {status !== "archived" && <button onClick={() => setShowDeactivateModal(user.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Désactiver"><Trash2 className="w-4 h-4" /></button>}
                                             <button onClick={() => handleActiverUser(user.id)} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all" title="Réactiver"><RotateCw className="w-4 h-4" /></button>
                                          </>
                                       )}
                                    </div>
                                 </td>
                              </tr>
                           )
                        })}
                     </tbody>
                  </table>
               </div>
               {isLoading && <div className="p-12 text-center text-slate-400">Chargement...</div>}
               {!isLoading && totalPages > 1 && <Pagination current={page} total={totalPages} setPage={setPage} />}
               {!isLoading && sorted.length === 0 && <div className="p-12 text-center text-slate-400">Aucun utilisateur trouvé</div>}
            </div>
         </div>

         {/* ----------------------------------------------------------------------- */}
         {/* NEW RE-AFFECT MODAL (From Second Code)                                  */}
         {/* ----------------------------------------------------------------------- */}
         {showReaffectModal && (
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
               <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-0 max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                  {/* Modal Header */}
                  <div className="bg-gradient-to-r from-emerald-800 to-emerald-600 p-4 shadow-lg flex items-center justify-between overflow-hidden relative">
                     <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <RotateCw className="w-5 h-5 text-emerald-400" /> Réaffectation
                     </h2>
                     <button
                        onClick={() => {
                           setShowReaffectModal(null);
                           setReaffectDepartementId(-1);
                           setReaffectAgenceId(-1);
                           setReaffectEntrepotId(-1);
                           setSelectedChief("-1");
                           setReaffectUpdateOrg(false);
                           setReaffectUpdateManager(false);
                        }}
                        className="text-emerald-200 hover:text-white transition-colors"
                     >
                        <X className="w-5 h-5" />
                     </button>
                  </div>

                  <div className="p-5 space-y-5">
                     {(() => {
                        const user = users.find(u => u.id === showReaffectModal)
                        if (!user) return null

                        const oldManager = user.managerId ? allUsers.find(u => u.id === user.managerId) : null;
                        const oldMainOrg = user.departement?.nom || user.agence?.nom || user.entrepot?.siteRef?.libeller || "N/A";
                        const oldOrgType = user.departement ? "Département" : (user.agence ? "Agence" : (user.entrepot ? "Entrepôt" : "Aucun"));

                        const potentialManagers = allUsers.filter((u) => {
                           if (u.id === showReaffectModal) return false
                           if ((u.status || "").toLowerCase() === "archived") return false
                           if (u.isManager !== 1) return false

                           const targetDepartementId = (reaffectUpdateOrg && reaffectDepartementId !== "" && reaffectDepartementId !== -1) ? Number(reaffectDepartementId) : null;
                           const targetAgenceId = (reaffectUpdateOrg && reaffectAgenceId !== "" && reaffectAgenceId !== -1) ? Number(reaffectAgenceId) : null;
                           const targetEntrepotId = (reaffectUpdateOrg && reaffectEntrepotId !== "" && reaffectEntrepotId !== -1) ? Number(reaffectEntrepotId) : null;

                           if (targetDepartementId && u.departement?.id === targetDepartementId) return true;
                           if (targetAgenceId && u.agence?.id === targetAgenceId) return true;
                           if (targetEntrepotId && u.entrepot?.id === targetEntrepotId) return true;

                           // If no specific destination is selected, allow any manager
                           if (!targetDepartementId && !targetAgenceId && !targetEntrepotId) return true;

                           return false;
                        })

                        return (
                           <>
                              {/* Read-Only Previous Assignment */}
                              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2 opacity-75">
                                 <h3 className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-2">
                                    <History className="w-3 h-3" /> Affectation Précédente
                                 </h3>
                                 <div className="space-y-3">
                                    <div>
                                       <label className="text-[10px] font-bold text-slate-500 block mb-1">Nom Utilisateur</label>
                                       <input type="text" disabled value={user.nom + " " + user.prenom} className="w-full px-2 py-1.5 bg-slate-100 border border-slate-200 text-slate-600 text-xs rounded-lg font-medium" />
                                    </div>
                                 </div>
                                 <div className="grid grid-cols-2 gap-3">
                                    <div>
                                       <label className="text-[10px] font-bold text-slate-500 block mb-1">{oldOrgType}</label>
                                       <input type="text" disabled value={oldMainOrg} className="w-full px-2 py-1.5 bg-slate-100 border border-slate-200 text-slate-600 text-xs rounded-lg font-medium" />
                                    </div>
                                    <div>
                                       <label className="text-[10px] font-bold text-slate-500 block mb-1">Ancien Manager</label>
                                       <input type="text" disabled value={oldManager ? (oldManager.nom + " " + oldManager.prenom) : "N/A"} className="w-full px-2 py-1.5 bg-slate-100 border border-slate-200 text-slate-600 text-xs rounded-lg font-medium" />
                                    </div>
                                 </div>
                              </div>

                              {/* New Assignment Form */}
                              <div className="space-y-4">
                                 <h3 className="text-[10px] font-bold uppercase text-emerald-600 flex items-center gap-2">
                                    <UserCheck className="w-3 h-3" /> Nouvelle Destination
                                 </h3>

                                 {/* Org Modification */}
                                 <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                                    <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                                       <input
                                          type="checkbox"
                                          checked={reaffectUpdateOrg}
                                          onChange={(e) => setReaffectUpdateOrg(e.target.checked)}
                                          className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                                       />
                                       Modifier l'Organisation
                                    </label>

                                    <div className={`space-y-3 transition-opacity ${!reaffectUpdateOrg ? 'opacity-50 pointer-events-none' : ''}`}>
                                       <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                          <div>
                                             <label className="block text-[10px] uppercase text-emerald-600 font-bold mb-1 ml-1">Département</label>
                                             <select
                                                value={reaffectDepartementId}
                                                onChange={(e) => setReaffectDepartementId(e.target.value === "" ? "" : Number(e.target.value))}
                                                className={inputStyle}
                                             >
                                                <option value="-1">Ne pas modifier</option>
                                                <option value="">Aucun</option>
                                                {departements.map(d => <option key={d.id} value={d.id}>{d.nom}</option>)}
                                             </select>
                                          </div>

                                          <div>
                                             <label className="block text-[10px] uppercase text-emerald-600 font-bold mb-1 ml-1">Agence</label>
                                             <select
                                                value={reaffectAgenceId}
                                                onChange={(e) => setReaffectAgenceId(e.target.value === "" ? "" : Number(e.target.value))}
                                                className={inputStyle}
                                             >
                                                <option value="-1">Ne pas modifier</option>
                                                <option value="">Aucun</option>
                                                {agences.map(a => <option key={a.id} value={a.id}>{a.nom}</option>)}
                                             </select>
                                          </div>

                                          <div>
                                             <label className="block text-[10px] uppercase text-emerald-600 font-bold mb-1 ml-1">Entrepôt</label>
                                             <select
                                                value={reaffectEntrepotId}
                                                onChange={(e) => setReaffectEntrepotId(e.target.value === "" ? "" : Number(e.target.value))}
                                                className={inputStyle}
                                             >
                                                <option value="-1">Ne pas modifier</option>
                                                <option value="">Aucun</option>
                                                {entrepots.map(e => <option key={e.id} value={e.id}>{getEntrepotLabel(e)}</option>)}
                                             </select>
                                          </div>
                                       </div>
                                    </div>
                                 </div>

                                 {/* Manager Modification */}
                                 <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                                    <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                                       <input
                                          type="checkbox"
                                          checked={reaffectUpdateManager}
                                          onChange={(e) => setReaffectUpdateManager(e.target.checked)}
                                          className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                                       />
                                       Modifier le Manager
                                    </label>

                                    <div className={`transition-opacity ${!reaffectUpdateManager ? 'opacity-50 pointer-events-none' : ''}`}>
                                       <select
                                          value={selectedChief}
                                          onChange={(e) => setSelectedChief(e.target.value)}
                                          className={inputStyle}
                                       >
                                          <option value="-1">Ne pas modifier</option>
                                          <option value="">Aucun manager</option>
                                          {potentialManagers.length > 0
                                             ? potentialManagers.map(m => <option key={m.id} value={m.id}>{m.nom} {m.prenom} ({m.matricule})</option>)
                                             : <option value="" disabled>Aucun manager disponible</option>
                                          }
                                       </select>
                                    </div>
                                 </div>
                              </div>

                              {/* Footer Actions */}
                              <div className="flex gap-3 pt-2">
                                 <button
                                    onClick={() => handleReaffectUser(showReaffectModal)}
                                    disabled={(!reaffectUpdateOrg && !reaffectUpdateManager)}
                                    className={`flex-1 py-2 text-xs uppercase ${buttonPrimary} disabled:opacity-50 disabled:cursor-not-allowed`}
                                 >
                                    Valider
                                 </button>
                                 <button
                                    onClick={() => {
                                       setShowReaffectModal(null);
                                       setReaffectDepartementId(-1);
                                       setReaffectAgenceId(-1);
                                       setReaffectEntrepotId(-1);
                                       setSelectedChief("-1");
                                       setReaffectUpdateOrg(false);
                                       setReaffectUpdateManager(false);
                                    }}
                                    className={`flex-1 py-2 text-xs uppercase ${buttonSecondary}`}
                                 >
                                    Annuler
                                 </button>
                              </div>
                           </>
                        )
                     })()}
                  </div>
               </div>
            </div>
         )}

         {/* ----------------------------------------------------------------------- */}
         {/* NEW USER DETAIL MODAL (From Second Code)                                */}
         {/* ----------------------------------------------------------------------- */}
         {
            selectedUserId && (
               <UserDetailModal
                  userId={selectedUserId}
                  users={allUsers.length > 0 ? allUsers : users}
                  onClose={() => setSelectedUserId(null)}
               />
            )
         }

         {/* ----------------------------------------------------------------------- */}
         {/* NEW DEACTIVATE CONFIRMATION MODAL (From Second Code)                    */}
         {/* ----------------------------------------------------------------------- */}
         {
            showDeactivateModal && (
               <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                  <div className="bg-white rounded-2xl shadow-2xl border border-red-100 p-0 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                     <div className="bg-red-50 px-4 py-3 border-b border-red-100 flex items-center gap-3">
                        <div className="bg-white p-1.5 rounded-full text-red-600 shadow-sm">
                           <AlertTriangle className="w-5 h-5" />
                        </div>
                        <h2 className="text-base font-bold text-red-900">Confirmer la désactivation</h2>
                     </div>
                     <div className="p-5 space-y-4">
                        <p className="text-slate-600 text-xs leading-relaxed">
                           L'utilisateur sera <strong>définitivement désactivé</strong> et supprimé de cette liste.
                           Cette action ne peut pas être annulée.
                        </p>
                        <div className="flex gap-3 pt-2">
                           <button
                              onClick={() => handleDeactivateUser(showDeactivateModal)}
                              className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase rounded-lg shadow-md shadow-red-100 transition-all"
                           >
                              Confirmer
                           </button>
                           <button
                              onClick={() => setShowDeactivateModal(null)}
                              className={`flex-1 py-2.5 text-xs uppercase ${buttonSecondary}`}
                           >
                              Annuler
                           </button>
                        </div>
                     </div>
                  </div>
               </div>
            )
         }
      </div >
   )
}

// --- SUB-COMPONENTS (From Second Code) ---

function UserDetailModal({ userId, users, onClose }: { userId: number; users: UserData[]; onClose: () => void }) {
   const user = users.find((u) => u.id === userId)

   const [materiels, setMateriels] = useState<any[]>([])
   const [loading, setLoading] = useState(true)

   useEffect(() => {
      if (!user) return
      api.get(`/subordinates/${userId}/materiel/all`)
         .then(r => { setMateriels(r.data); setLoading(false); })
         .catch(err => { console.error(err); setLoading(false); })
   }, [userId, user])

   const TypeIcon = ({ type }: { type?: string }) => {
      if (type?.toLowerCase().includes("sim")) return <CircuitBoard className="w-4 h-4" />
      if (type?.toLowerCase().includes("internet") || type?.toLowerCase().includes("ligne")) return <Wifi className="w-4 h-4" />
      return <Smartphone className="w-4 h-4" />
   }

   const typeColor = (type?: string) => {
      if (type?.toLowerCase().includes("sim")) return "bg-orange-50 text-orange-600"
      if (type?.toLowerCase().includes("internet") || type?.toLowerCase().includes("ligne")) return "bg-blue-50 text-blue-600"
      return "bg-emerald-50 text-emerald-600"
   }

   const affectationBadge = (status?: string) => {
      if (status === "recu") return "bg-emerald-100 text-emerald-700"
      if (status === "annuler") return "bg-red-100 text-red-700"
      if (status === "affecter") return "bg-amber-100 text-amber-700"
      return "bg-slate-100 text-slate-700"
   }

   if (!user) return null

   const manager = user.managerId ? users.find(u => u.id === user.managerId) : null;
   const status = (user.status || "").toLowerCase();
   const userTypeAccount = user.isManager === 1 ? "Manager" : "Collaborateur";

   return (
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
         <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-0 max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">

            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-800 to-emerald-600 p-4 shadow-lg flex items-center justify-between overflow-hidden relative">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-emerald-400">
                     <User className="w-5 h-5" />
                  </div>
                  <div>
                     <h2 className="text-lg font-bold text-white">{user.nom} {user.prenom}</h2>
                     <p className="text-emerald-200 text-xs font-semibold">{userTypeAccount}</p>
                  </div>
               </div>
               <button onClick={onClose} className="text-emerald-200 hover:text-white transition-colors">
                  <X className="w-6 h-6" />
               </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-5 space-y-5 overflow-y-auto">

               {/* Status Banner */}
               <div className="flex items-center justify-center -mt-2">
                  <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest ${status === "detacher" ? "bg-orange-100 text-orange-700 border border-orange-200" : (status === "desactiver" ? "bg-red-100 text-red-700 border border-red-200" : status === "archived" ? "bg-slate-100 text-slate-700 border border-slate-200" : "bg-emerald-100 text-emerald-700 border border-emerald-200")}`}>
                     Statut: {status === "detacher" ? "Détaché" : (status === "desactiver" ? "Désactivé" : status === "archived" ? "Archivé" : "Actif")}
                  </span>
               </div>

               {/* Info Grid */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                     <h3 className="text-[10px] font-bold uppercase text-emerald-600 border-b border-emerald-100 pb-1.5">Personnel</h3>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="text-[10px] font-bold text-slate-400 uppercase">CIN</label>
                           <p className="text-xs font-bold text-slate-800">{user.cin || "—"}</p>
                        </div>
                        <div>
                           <label className="text-[10px] font-bold text-slate-400 uppercase">Matricule</label>
                           <p className="text-xs font-mono font-bold text-slate-700">{user.matricule || "—"}</p>
                        </div>
                        <div>
                           <label className="text-[10px] font-bold text-slate-400 uppercase">Téléphone</label>
                           <p className="text-xs font-medium text-slate-800">{user.tel || "—"}</p>
                        </div>
                        <div>
                           <label className="text-[10px] font-bold text-slate-400 uppercase">Fonction</label>
                           <p className="text-xs font-medium text-slate-800">{user.fonctionRef?.nom || "—"}</p>
                        </div>
                     </div>
                  </div>

                  <div className="space-y-3">
                     <h3 className="text-[10px] font-bold uppercase text-blue-600 border-b border-blue-100 pb-1.5">Organisation</h3>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="text-[10px] font-bold text-slate-400 uppercase">Département</label>
                           <p className="text-xs font-bold text-slate-800">{user.departement?.nom || "—"}</p>
                        </div>
                        <div>
                           <label className="text-[10px] font-bold text-slate-400 uppercase">Agence</label>
                           <p className="text-xs font-bold text-slate-800">{user.agence?.nom || "—"}</p>
                        </div>
                        <div>
                           <label className="text-[10px] font-bold text-slate-400 uppercase">Entrepôt</label>
                           <p className="text-xs font-bold text-slate-800">{user.entrepot?.siteRef?.libeller || "—"}</p>
                        </div>
                        <div>
                           <label className="text-[10px] font-bold text-slate-400 uppercase">Manager</label>
                           <p className="text-xs font-medium text-slate-800">{manager ? `${manager.nom} ${manager.prenom}` : "—"}</p>
                        </div>
                     </div>
                  </div>
               </div>

               {/* Assets Section */}
               <div className="space-y-3 pt-2">
                  <h3 className="text-[10px] font-bold uppercase text-slate-500 border-b border-slate-200 pb-1.5 flex justify-between items-center">
                     Équipements Assignés
                     {!loading && <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full text-[10px]">{materiels.filter(m => m.statusAffectation && ['affecter', 'recu', 'annuler'].includes(m.statusAffectation)).length}</span>}
                  </h3>

                  {loading ? (
                     <div className="text-center py-6 text-slate-400 text-sm">Chargement...</div>
                  ) : materiels.filter(m => m.statusAffectation && ['affecter', 'recu', 'annuler'].includes(m.statusAffectation)).length === 0 ? (
                     <div className="text-center py-6 bg-slate-50 rounded-xl border border-slate-200 border-dashed">
                        <p className="text-sm text-slate-400">Aucun équipement assigné à cet utilisateur.</p>
                     </div>
                  ) : (
                     <div className="grid grid-cols-1 gap-2">
                        {materiels.filter(m => m.statusAffectation && ['affecter', 'recu', 'annuler'].includes(m.statusAffectation)).map(mat => (
                           <div key={mat.id} className="p-3 bg-white border border-slate-200 rounded-xl shadow-sm flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                 <div className={`p-1.5 rounded-lg ${typeColor(mat.typeMateriel)}`}>
                                    <TypeIcon type={mat.typeMateriel} />
                                 </div>
                                 <div className="flex flex-col">
                                    <p className="text-xs font-bold text-slate-800">{mat.materielName || mat.modele?.nom || mat.typeMateriel || "Equipement"}</p>
                                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">{mat.typeMateriel || "—"}</p>
                                    {(mat.sn || mat.numero) && (
                                       <p className="text-[10px] font-mono text-slate-500 mt-0.5">SN: {mat.sn || mat.numero}</p>
                                    )}
                                 </div>
                              </div>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${affectationBadge(mat.statusAffectation)}`}>
                                 {mat.statusAffectation}
                              </span>
                           </div>
                        ))}
                     </div>
                  )}
               </div>

            </div>

            {/* Footer */}
            <div className="p-3 border-t border-slate-200 bg-slate-50 flex justify-end">
               <button onClick={onClose} className="px-5 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold uppercase rounded-lg transition-all shadow-sm">
                  Fermer
               </button>
            </div>

         </div>
      </div>
   )
}
