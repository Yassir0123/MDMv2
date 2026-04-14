"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { createPortal } from "react-dom"
import api from "@/lib/api"
import {
   Search, Plus, Trash2, Edit2, X,
   ArrowUpDown, Filter, ChevronUp, ChevronDown, ChevronLeft, ChevronRight,
   ChevronsLeft, ChevronsRight, Shield, Users, UserCheck, ShieldAlert,
   Lock, Mail, User, CheckCircle2, ShieldCheck, Power, RotateCw
} from "lucide-react"

// --- TYPES ---
type FilterCondition = "contains" | "startsWith" | "endsWith" | "equals"

interface FilterRule {
   id: string
   attribute: string
   condition: FilterCondition
   term: string
}

interface Compte {
   id: number
   login: string
   password?: string
   status: "active" | "desactiver"
   compteType: "Agent" | "HR" | "Manager" | "Administrateur"
   user?: { id: number; nom?: string; prenom?: string }
   userId?: number
}

interface UserEntity { id: number; nom?: string; prenom?: string; matricule?: string }

// --- SEARCHABLE SELECT ---
interface SearchableSelectProps<T> {
   options: T[]
   value: string | number | undefined
   onChange: (value: string | number) => void
   getLabel: (item: T) => string
   placeholder?: string
   disabled?: boolean
}
const SearchableSelect = <T extends { id: string | number }>({
   options, value, onChange, getLabel, placeholder = "Sélectionner...", disabled = false
}: SearchableSelectProps<T>) => {
   const [isOpen, setIsOpen] = useState(false)
   const [searchTerm, setSearchTerm] = useState("")
   const inputRef = useRef<HTMLInputElement>(null)
   const [dropdownStyles, setDropdownStyles] = useState<React.CSSProperties>({})

   const selectedItem = options.find(o => o.id.toString() === value?.toString())
   const filteredOptions = useMemo(() =>
      options.filter(item => getLabel(item).toLowerCase().includes(searchTerm.toLowerCase())).slice(0, 50),
      [options, searchTerm, getLabel]
   )

   useEffect(() => {
      if (isOpen && inputRef.current) {
         const rect = inputRef.current.getBoundingClientRect()
         const spaceBelow = window.innerHeight - rect.bottom
         const showAbove = spaceBelow < 240 && rect.top > spaceBelow
         setDropdownStyles({
            position: 'fixed',
            top: showAbove ? 'auto' : `${rect.bottom + 4}px`,
            bottom: showAbove ? `${window.innerHeight - rect.top + 4}px` : 'auto',
            left: `${rect.left}px`,
            width: `${rect.width}px`,
            zIndex: 9999
         })
      }
   }, [isOpen, filteredOptions.length])

   return (
      <div className="relative w-full">
         <div className="relative">
            <input
               ref={inputRef}
               type="text"
               disabled={disabled}
               style={{ paddingRight: "2.5rem" }}
               className={`mdm-input text-xs cursor-pointer ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
               placeholder={selectedItem ? getLabel(selectedItem) : placeholder}
               value={isOpen ? searchTerm : (selectedItem ? getLabel(selectedItem) : "")}
               onChange={(e) => { if (!isOpen) setIsOpen(true); setSearchTerm(e.target.value) }}
               onClick={() => { if (!disabled) { setIsOpen(true); setSearchTerm("") } }}
               readOnly={!isOpen && !!selectedItem}
            />
            <ChevronDown className={`absolute right-3 top-3 w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
         </div>
         {isOpen && typeof document !== 'undefined' && createPortal(
            <>
               <div className="fixed inset-0 z-[9998]" onClick={() => { setIsOpen(false); setSearchTerm("") }} />
               <ul style={dropdownStyles} className="fixed bg-white border border-slate-200 rounded-lg shadow-2xl max-h-[240px] overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
                  {filteredOptions.length > 0 ? (
                     filteredOptions.map((item) => (
                        <li key={item.id}
                           onClick={() => { onChange(item.id); setIsOpen(false); setSearchTerm("") }}
                           className={`px-3 py-2 text-xs cursor-pointer hover:bg-blue-50 transition-colors flex items-center justify-between ${item.id === value ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-700'}`}
                        >
                           <span>{getLabel(item)}</span>
                           {item.id === value && <CheckCircle2 className="w-4 h-4" />}
                        </li>
                     ))
                  ) : (
                     <li className="px-3 py-4 text-xs text-center text-slate-400 italic">Aucun résultat</li>
                  )}
               </ul>
            </>,
            document.body
         )}
      </div>
   )
}

// --- FILTER TOOLBAR ---
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
                  className="w-full md:w-36 px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500">
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
            <button onClick={() => go("1")} disabled={current === 1} className="p-1 rounded hover:bg-slate-200 text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"><ChevronsLeft className="w-4 h-4" /></button>
            <button onClick={() => go(String(current - 1))} disabled={current === 1} className="p-1 rounded hover:bg-slate-200 text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"><ChevronLeft className="w-4 h-4" /></button>
            <div className="flex items-center gap-2 mx-2">
               <span className="text-xs font-bold text-slate-400 uppercase">Page</span>
               <input type="number" value={inputVal} onChange={e => setInputVal(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && go(inputVal)} onBlur={() => go(inputVal)}
                  className="w-10 h-7 text-center text-xs font-bold bg-white border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" />
               <span className="text-xs font-bold text-slate-400">/ {total || 1}</span>
            </div>
            <button onClick={() => go(String(current + 1))} disabled={current === total || total === 0} className="p-1 rounded hover:bg-slate-200 text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"><ChevronRight className="w-4 h-4" /></button>
            <button onClick={() => go(String(total))} disabled={current === total || total === 0} className="p-1 rounded hover:bg-slate-200 text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"><ChevronsRight className="w-4 h-4" /></button>
         </div>
      </div>
   )
}

// ===========================
// MAIN COMPONENT
// ===========================
export default function AdminAccountsPage() {
   // --- STATE ---
   const [comptes, setComptes] = useState<Compte[]>([])
   const [loading, setLoading] = useState(true)

   // Modal states
   const [showFormModal, setShowFormModal] = useState(false)
   const [formMode, setFormMode] = useState<"add" | "edit">("add")

   const [users, setUsers] = useState<UserEntity[]>([])

   const [filters, setFilters] = useState<FilterRule[]>([{ id: "1", attribute: "login", condition: "contains", term: "" }])
   const [sortBy, setSortBy] = useState("id")
   const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
   const [page, setPage] = useState(1)
   const PAGE_SIZE = 10

   const [formData, setFormData] = useState<Partial<Compte>>({})

   // --- INITIAL LOAD ---
   useEffect(() => {
      fetchComptes()
      fetchUsers()
   }, [])

   const fetchComptes = async () => {
      try {
         setLoading(true)
         const res = await api.get("/comptes")
         setComptes(Array.isArray(res.data) ? res.data : [])
      } catch (e) {
         console.error(e)
      } finally {
         setLoading(false)
      }
   }

   const fetchUsers = async () => {
      try {
         const res = await api.get("/users")
         setUsers(Array.isArray(res.data) ? res.data : [])
      } catch (e) { console.error(e) }
   }

   // --- KPIs ---
   const kpiTotal = comptes.length
   const kpiActive = comptes.filter(c => c.status === "active").length
   const kpiInactive = comptes.filter(c => c.status !== "active").length

   // --- FILTER/SORT LOGIC ---
   const getFieldValue = (compte: Compte, attribute: string): string => {
      switch (attribute) {
         case 'id': return String(compte.id)
         case 'login': return compte.login || ""
         case 'compteType': return compte.compteType || ""
         case 'status': return compte.status || ""
         case 'userNom': {
            if (!compte.userId) return ""
            const u = users.find(usr => usr.id === compte.userId)
            return u ? `${u.nom || ''} ${u.prenom || ''}`.trim() : ""
         }
         default: return ""
      }
   }

   const applyFilters = (data: Compte[], rules: FilterRule[]) =>
      data.filter(item => rules.every(rule => {
         if (!rule.term) return true
         const val = getFieldValue(item, rule.attribute).toLowerCase()
         const term = rule.term.toLowerCase()
         switch (rule.condition) {
            case "contains": return val.includes(term)
            case "startsWith": return val.startsWith(term)
            case "endsWith": return val.endsWith(term)
            case "equals": return val === term
            default: return true
         }
      }))

   const filtered = applyFilters(comptes, filters)
   const sorted = [...filtered].sort((a, b) => {
      const aVal = getFieldValue(a, sortBy)
      const bVal = getFieldValue(b, sortBy)
      if (sortBy === 'id') {
         return sortOrder === 'asc' ? Number(aVal) - Number(bVal) : Number(bVal) - Number(aVal)
      }
      const cmp = aVal.localeCompare(bVal)
      return sortOrder === "asc" ? cmp : -cmp
   })

   const totalPages = Math.ceil(sorted.length / PAGE_SIZE)
   const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

   // --- HANDLERS ---
   const handleSortClick = (attr: string) => {
      if (sortBy === attr) setSortOrder(sortOrder === "asc" ? "desc" : "asc")
      else { setSortBy(attr); setSortOrder("asc") }
   }

   const handleAddClick = () => {
      setFormData({ status: "active", compteType: "Agent" })
      setFormMode("add")
      setShowFormModal(true)
   }

   const handleEditClick = (compte: Compte) => {
      setFormData({ ...compte, userId: compte.userId, password: "" })
      setFormMode("edit")
      setShowFormModal(true)
   }

   const handleSave = async () => {
      try {
         if (formMode === "add" && (!formData.password || !formData.password.trim())) {
            alert("Veuillez saisir un mot de passe.")
            return
         }
         const payload = {
            login: formData.login,
            password: formData.password,
            status: formData.status,
            compteType: formData.compteType,
            user: formData.userId ? { id: formData.userId } : null
         }
         if (formMode === "add") {
            await api.post("/comptes", payload)
         } else if (formMode === "edit" && formData.id) {
            await api.put(`/comptes/${formData.id}`, payload)
         }
         fetchComptes()
         setShowFormModal(false)
      } catch (e) { alert("Erreur lors de l'enregistrement") }
   }

   const handleDelete = async (id: number) => {
      if (confirm("Supprimer ce compte ?")) {
         try { await api.delete(`/comptes/${id}`); fetchComptes() }
         catch (e) { alert("Erreur suppression") }
      }
   }

   const toggleStatus = async (compte: Compte) => {
      try {
         const newStatus = compte.status === "active" ? "desactiver" : "active"
         await api.put(`/comptes/${compte.id}`, { ...compte, status: newStatus })
         fetchComptes()
      } catch (e) { alert("Erreur lors de la modification du statut") }
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
      th: "px-3 py-2.5 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider bg-secondary/50 border-b border-border select-none",
      td: "px-3 py-2.5 text-[12px] border-b border-border/50 last:border-0",
   }

   const SortIcon = ({ column, by, order }: { column: string, by: string, order: string }) => {
      if (by !== column) return <ArrowUpDown className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
      return order === "asc" ? <ChevronUp className="w-3 h-3 text-blue-600" /> : <ChevronDown className="w-3 h-3 text-blue-600" />
   }

   const SortableTh = ({ label, sortKey, by, order, onClick }: { label: string; sortKey: string; by: string; order: string; onClick: (k: string) => void }) => (
      <th onClick={() => onClick(sortKey)} className={`${styles.th} cursor-pointer hover:bg-slate-100 hover:text-blue-600 transition-colors group`}>
         <div className="flex items-center gap-2">{label} <SortIcon column={sortKey} by={by} order={order} /></div>
      </th>
   )

   // ========================
   // LIST VIEW
   // ========================
   return (
      <div className={styles.pageBg}>
         {/* Header */}
         <div className={styles.header}>
            <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
               <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-sidebar-primary to-accent rounded-lg flex items-center justify-center text-sidebar-primary-foreground shadow-sm">
                     <Shield className="w-5 h-5" />
                  </div>
                  <div>
                     <h1 className="text-lg font-black text-slate-900 leading-none">Comptes Utilisateurs</h1>
                     <p className="text-[11px] text-muted-foreground mt-0.5">{kpiTotal} comptes • {kpiActive} actifs</p>
                  </div>
               </div>
               <button onClick={handleAddClick} className={`px-3 py-2 flex items-center gap-2 text-xs ${styles.primaryBtn}`}>
                  <Plus className="w-3 h-3" /> Nouveau Compte
               </button>
            </div>
         </div>

         <div className="max-w-7xl mx-auto p-4 space-y-4">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <div className="bg-white rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-slate-300 transition-all">
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-slate-900" />
                  <div className="p-4">
                     <div className="absolute top-1 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity"><Users className="w-16 h-16 text-slate-900" /></div>
                     <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Total Comptes</p>
                     <p className="text-3xl font-black text-slate-900">{kpiTotal}</p>
                  </div>
               </div>
               <div className="bg-white rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-emerald-200 transition-all">
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-emerald-500" />
                  <div className="p-4">
                     <div className="absolute top-1 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity"><UserCheck className="w-16 h-16 text-emerald-600" /></div>
                     <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Comptes Actifs</p>
                     <p className="text-3xl font-black text-emerald-600">{kpiActive}</p>
                  </div>
               </div>
               <div className="bg-white rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-red-200 transition-all">
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-red-500" />
                  <div className="p-4">
                     <div className="absolute top-1 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity"><ShieldAlert className="w-16 h-16 text-red-600" /></div>
                     <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Désactivés</p>
                     <p className="text-3xl font-black text-red-600">{kpiInactive}</p>
                  </div>
               </div>
            </div>

            {/* Filter Toolbar */}
            <FilterToolbar
               filters={filters}
               setFilters={(newFilters: FilterRule[]) => { setFilters(newFilters); setPage(1) }}
               attributes={[
                  { value: "login", label: "Email / Login" },
                  { value: "userNom", label: "Utilisateur Lier" },
                  { value: "compteType", label: "Rôle" },
                  { value: "status", label: "Statut" },
               ]}
            />

            {/* Main Table */}
            <div className={styles.card}>
               <table className="w-full min-w-[700px]">
                  <thead>
                     <tr>
                        <th className={styles.th}>ID</th>
                        <SortableTh label="Email / Login" sortKey="login" by={sortBy} order={sortOrder} onClick={handleSortClick} />
                        <SortableTh label="Mot de Passe" sortKey="password" by={sortBy} order={sortOrder} onClick={handleSortClick} />
                        <SortableTh label="Rôle" sortKey="compteType" by={sortBy} order={sortOrder} onClick={handleSortClick} />
                        <SortableTh label="Utilisateur Lier" sortKey="userNom" by={sortBy} order={sortOrder} onClick={handleSortClick} />
                        <SortableTh label="Statut" sortKey="status" by={sortBy} order={sortOrder} onClick={handleSortClick} />
                        <th className={`${styles.th} text-right`}>Actions</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                     {loading ? (
                        <tr><td colSpan={7} className="p-12 text-center text-slate-400">Chargement...</td></tr>
                     ) : paginated.length === 0 ? (
                        <tr><td colSpan={7} className="p-12 text-center text-slate-400">Aucun compte trouvé</td></tr>
                     ) : paginated.map((compte) => {
                        const isDeactivated = compte.status === "desactiver"
                        return (
                           <tr key={compte.id} className={`transition-colors group ${isDeactivated ? 'bg-red-50/20' : 'hover:bg-slate-50/80'}`}>
                              <td className={styles.td}>
                                 <span className="font-mono text-xs text-slate-400">#{compte.id}</span>
                              </td>
                              <td className={styles.td}>
                                 <div className="flex items-center gap-2">
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${isDeactivated ? 'bg-red-100 text-red-500' : 'bg-blue-100 text-blue-600 group-hover:bg-blue-200'}`}>
                                       {compte.login ? compte.login.charAt(0).toUpperCase() : "?"}
                                    </div>
                                    <span className={`font-semibold text-xs ${isDeactivated ? 'text-red-900' : 'text-slate-800'}`}>
                                       {compte.login}
                                    </span>
                                 </div>
                              </td>
                              <td className={`${styles.td} font-mono text-slate-500 text-xs`}>
                                 {compte.password ? compte.password : "••••••••"}
                              </td>
                              <td className={styles.td}>
                                 <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-600 border border-slate-200">
                                    {compte.compteType}
                                 </span>
                              </td>
                              <td className={styles.td}>
                                 {compte.userId ? (() => {
                                    const u = users.find(usr => usr.id === compte.userId)
                                    return (
                                       <div className="flex items-center gap-2">
                                          <div className="bg-slate-100 p-1.5 rounded-full">
                                             <User className="w-4 h-4 text-slate-500" />
                                          </div>
                                          <div className="flex flex-col">
                                             <span className="text-xs font-bold text-slate-700">{u ? `${u.nom || ""} ${u.prenom || ""}`.trim() : `ID: ${compte.userId}`}</span>
                                             <span className="text-[10px] text-slate-400 font-mono">{u?.matricule || "Sans matricule"}</span>
                                          </div>
                                       </div>
                                    )
                                 })() : (
                                    <span className="text-xs text-slate-400 italic">Non lié</span>
                                 )}
                              </td>
                              <td className={styles.td}>
                                 <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${compte.status === "active" ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-red-50 text-red-600 border-red-200"
                                    }`}>
                                    {compte.status}
                                 </span>
                              </td>
                              <td className="px-3 py-2 text-right">
                                 <div className="flex justify-end gap-1">
                                    <button onClick={() => toggleStatus(compte)}
                                       className={`p-1.5 rounded-lg transition-all ${compte.status === 'active' ? 'text-slate-400 hover:text-orange-600 hover:bg-orange-50' : 'text-emerald-500 hover:bg-emerald-50'}`}
                                       title={compte.status === 'active' ? 'Désactiver' : 'Activer'}
                                    >
                                       {compte.status === 'active' ? <Power className="w-4 h-4" /> : <RotateCw className="w-4 h-4" />}
                                    </button>
                                    <button onClick={() => handleEditClick(compte)}
                                       className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="Modifier">
                                       <Edit2 className="w-3 h-3" />
                                    </button>
                                    <button onClick={() => handleDelete(compte.id)}
                                       className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Supprimer">
                                       <Trash2 className="w-3 h-3" />
                                    </button>
                                 </div>
                              </td>
                           </tr>
                        )
                     })}
                  </tbody>
               </table>
               {totalPages > 1 && (
                  <Pagination current={page} total={totalPages} setPage={setPage} />
               )}
            </div>
         </div>

         {/* ADD/EDIT FORM MODAL */}
         {showFormModal && (
            <FormModal
               formMode={formMode}
               formData={formData}
               setFormData={setFormData}
               users={users}
               onSave={handleSave}
               onClose={() => setShowFormModal(false)}
               styles={styles}
            />
         )}
      </div>
   )
}

// ========================
// FORM MODAL COMPONENT
// ========================
function FormModal({ formMode, formData, setFormData, users, onSave, onClose, styles }: {
   formMode: "add" | "edit"
   formData: Partial<Compte>
   setFormData: (d: Partial<Compte>) => void
   users: UserEntity[]
   onSave: () => void
   onClose: () => void
   styles: any
}) {
   return (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
         <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[83vh] translate-x-35 translate-y-5">
            {/* Header */}
            <div className="flex justify-between items-center px-5 py-4 border-b border-slate-100">
               <h2 className="text-lg font-bold text-slate-900">
                  {formMode === "add" ? "Nouveau Compte" : `Modifier Compte: ${formData.login}`}
               </h2>
               <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
                  <X className="w-4 h-4" />
               </button>
            </div>

            {/* Banner */}
            <div className="overflow-y-auto">
               <div className="bg-gradient-to-r from-sidebar-primary to-accent text-sidebar-primary-foreground px-5 py-3 flex items-center gap-3">
                  <div className="bg-white/10 p-1.5 rounded-lg backdrop-blur-sm"><ShieldCheck className="w-4 h-4 text-blue-400" /></div>
                  <div>
                     <h3 className="text-white font-bold text-sm">Informations de Connexion</h3>
                     <p className="text-slate-400 text-[10px]">Identifiants et accès</p>
                  </div>
               </div>

               <div className="p-5 space-y-4">
                  {/* Login / Email */}
                  <div>
                     <label className={styles.label}>Email / Login</label>
                     <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input type="text" value={formData.login || ""} onChange={(e) => setFormData({ ...formData, login: e.target.value })}
                           placeholder="nom.prenom@entreprise.ma" style={{ paddingLeft: "2.25rem" }} className={`${styles.input} font-medium`} />
                     </div>
                  </div>

                  {/* Password + Role */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                        <label className={styles.label}>Mot de passe</label>
                        <div className="relative">
                           <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                           <input type="password" value={formData.password || ""} onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                              placeholder="••••••••" style={{ paddingLeft: "2.25rem" }} className={styles.input} />
                        </div>
                     </div>
                     <div>
                        <label className={styles.label}>Rôle</label>
                        <select value={formData.compteType || "Agent"} onChange={(e) => setFormData({ ...formData, compteType: e.target.value as any })}
                           className={styles.input}>
                           <option value="Agent">Agent</option>
                           <option value="HR">HR</option>
                           <option value="Manager">Manager</option>
                           <option value="Administrateur">Administrateur</option>
                        </select>
                     </div>
                  </div>

                  {/* Statut + User */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                        <label className={styles.label}>Statut</label>
                        <select value={formData.status || "active"} onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                           className={styles.input}>
                           <option value="active">Actif</option>
                           <option value="desactiver">Désactivé</option>
                        </select>
                     </div>
                     <div>
                        <label className={styles.label}>Utilisateur lié (Employé)</label>
                        <SearchableSelect
                           options={users}
                           value={formData.userId}
                           onChange={(v) => setFormData({ ...formData, userId: Number(v) })}
                           getLabel={(u) => `${u.nom || ''} ${u.prenom || ''}`.trim()}
                           placeholder="Sélectionner un employé"
                        />
                     </div>
                  </div>

               </div>
            </div>

            {/* Footer */}
            <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-end gap-2">
               <button onClick={onClose} className={`px-4 py-2 ${styles.secondaryBtn}`}>Annuler</button>
               <button onClick={onSave} className={`px-5 py-2 ${styles.primaryBtn}`}>
                  {formMode === "add" ? "Créer Compte" : "Sauvegarder"}
               </button>
            </div>
         </div>
      </div>
   )
}
