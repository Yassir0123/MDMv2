"use client"

import { useEffect, useMemo, useState } from "react"
import type { ReactElement } from "react"
import api from "@/lib/api"
import { exportStyledWorkbook } from "@/lib/excel-export"
import {
  Search, RotateCw, ArrowLeft,
  ArrowUpDown, User, FileText, Calendar,
  Filter, ChevronUp, ChevronDown, MoveRight,
  UserMinus, UserCheck, UserX, RefreshCw,
  ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, FileSpreadsheet
} from "lucide-react"

type FilterCondition = "contains" | "startsWith" | "endsWith" | "equals"

// --- PAGINATION ---
const Pagination = ({ current, total, setPage }: { current: number, total: number, setPage: (p: number) => void }) => {
  const [inputVal, setInputVal] = useState(current.toString())
  useEffect(() => { setInputVal(current.toString()) }, [current])
  const go = (val: string) => {
    let n = parseInt(val)
    if (isNaN(n) || n < 1) n = 1
    if (n > total) n = total
    setPage(n)
    setInputVal(n.toString())
  }
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-2 border-t border-slate-100 bg-slate-50/50 gap-4">
      <span className="text-xs font-medium text-slate-500">Page {current} sur {total || 1}</span>
      <div className="flex items-center gap-2">
        <button onClick={() => go("1")} disabled={current === 1} className="p-1 rounded hover:bg-slate-200 text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"><ChevronsLeft className="w-4 h-4" /></button>
        <button onClick={() => go(String(current - 1))} disabled={current === 1} className="p-1 rounded hover:bg-slate-200 text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"><ChevronLeft className="w-4 h-4" /></button>
        <div className="flex items-center gap-2 mx-2">
          <span className="text-xs font-bold text-slate-400 uppercase">Page</span>
          <input
            type="number"
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            onKeyDown={e => e.key === "Enter" && go(inputVal)}
            onBlur={() => go(inputVal)}
            className="w-10 h-7 text-center text-xs font-bold bg-white border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <span className="text-xs font-bold text-slate-400">/ {total || 1}</span>
        </div>
        <button onClick={() => go(String(current + 1))} disabled={current === total || total === 0} className="p-1 rounded hover:bg-slate-200 text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"><ChevronRight className="w-4 h-4" /></button>
        <button onClick={() => go(String(total))} disabled={current === total || total === 0} className="p-1 rounded hover:bg-slate-200 text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"><ChevronsRight className="w-4 h-4" /></button>
      </div>
    </div>
  )
}

interface HistoryUser {
  id?: number
  nom?: string
  prenom?: string
  matricule?: string
}

interface HistoryRow {
  id: number
  userId?: number
  user?: HistoryUser
  userNom?: string
  userPrenom?: string
  userCin?: string
  userMatricule?: string
  statusEvent?: string
  dateEvent?: string
  managerId?: number
  manager?: HistoryUser
  departement?: { id?: number; nom?: string }
  departmentNom?: string
  agence?: { id?: number; nom?: string }
  agenceNom?: string
  entrepot?: { id?: number; siteRef?: { libeller?: string } }
  entrepotNom?: string
}

type Movement = {
  old?: string
  next?: string
  changed: boolean
}

type HistoryView = {
  id: number
  userId?: number
  userNom: string
  userPrenom: string
  cin: string
  matricule: string
  actionType: string
  actionLabel: string
  actionStyle: string
  actionIcon: ReactElement
  timestamp: string
  mouvementDepartement: Movement
  mouvementAgence: Movement
  mouvementEntrepot: Movement
  mouvementChef: Movement
}

export default function UserHistoryPage({ onBack }: { onBack: () => void }) {
  // --- State ---
  const [history, setHistory] = useState<HistoryRow[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Advanced Filter State
  const [searchTerm, setSearchTerm] = useState("")
  const [filterAttribute, setFilterAttribute] = useState("userNom")
  const [filterCondition, setFilterCondition] = useState<FilterCondition>("contains")

  // Sorting State
  const [sortBy, setSortBy] = useState("timestamp")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [page, setPage] = useState(1)
  const [isExporting, setIsExporting] = useState(false)
  const PAGE_SIZE = 10

  useEffect(() => {
    let mounted = true
    api.get("/historique-affectation")
      .then(res => { if (mounted) setHistory(Array.isArray(res.data) ? res.data : []) })
      .catch(err => { console.error("Failed to fetch historique-affectation", err) })
      .finally(() => { if (mounted) setIsLoading(false) })
    return () => { mounted = false }
  }, [])

  const userNameById = useMemo(() => {
    const map = new Map<number, string>()
    for (const row of history) {
      const uid = row.user?.id ?? row.userId
      const name = [row.userNom, row.userPrenom].filter(Boolean).join(" ").trim()
      if (uid && name) map.set(uid, name)
    }
    return map
  }, [history])

  const rowsByUser = useMemo(() => {
    const map = new Map<number, HistoryRow[]>()
    for (const row of history) {
      const uid = row.user?.id ?? row.userId
      if (!uid) continue
      const list = map.get(uid) || []
      list.push(row)
      map.set(uid, list)
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.id - b.id)
    }
    return map
  }, [history])

  const getNextReaffectation = (row: HistoryRow): HistoryRow | null => {
    const uid = row.user?.id ?? row.userId
    if (!uid) return null
    const list = rowsByUser.get(uid) || []
    for (const r of list) {
      if (r.id > row.id && r.statusEvent === "reaffectation") return r
    }
    return null
  }

  const getManagerName = (row: HistoryRow): string | undefined => {
    const direct = [row.manager?.nom, row.manager?.prenom].filter(Boolean).join(" ").trim()
    if (direct) return direct
    if (row.managerId && userNameById.has(row.managerId)) return userNameById.get(row.managerId)
    if (row.managerId) return `ID ${row.managerId}`
    return undefined
  }

  const buildMovement = (oldId?: number, oldName?: string, nextId?: number, nextName?: string): Movement => {
    if (nextId == null && oldId == null) return { changed: false }
    if (oldId === nextId) return { changed: false }
    return { changed: true, old: oldName || "—", next: nextName || "—" }
  }

  const getActionConfig = (statusEvent?: string) => {
    switch (statusEvent) {
      case "dettacher":
      case "detacher":
        return { style: "bg-orange-50 text-orange-700 border-orange-200", icon: <UserMinus className="w-3.5 h-3.5" />, label: "Détachement" }
      case "reaffectation":
        return { style: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: <UserCheck className="w-3.5 h-3.5" />, label: "Réaffectation" }
      case "desactiver":
        return { style: "bg-red-50 text-red-700 border-red-200", icon: <UserX className="w-3.5 h-3.5" />, label: "Désactivation" }
      default:
        return { style: "bg-blue-50 text-blue-700 border-blue-200", icon: <RefreshCw className="w-3.5 h-3.5" />, label: statusEvent || "Action" }
    }
  }

  const viewRows: HistoryView[] = useMemo(() => {
    return history.map((row) => {
      const next = row.statusEvent === "dettacher" ? getNextReaffectation(row) : null

      const oldDeptId = row.departement?.id
      const oldDeptName = row.departmentNom || row.departement?.nom
      const nextDeptId = next?.departement?.id
      const nextDeptName = next?.departmentNom || next?.departement?.nom

      const oldAgenceId = row.agence?.id
      const oldAgenceName = row.agenceNom || row.agence?.nom
      const nextAgenceId = next?.agence?.id
      const nextAgenceName = next?.agenceNom || next?.agence?.nom

      const oldEntrepotId = row.entrepot?.id
      const oldEntrepotName = row.entrepotNom || row.entrepot?.siteRef?.libeller
      const nextEntrepotId = next?.entrepot?.id
      const nextEntrepotName = next?.entrepotNom || next?.entrepot?.siteRef?.libeller

      const oldChefId = row.managerId
      const nextChefId = next?.managerId
      const oldChefName = getManagerName(row)
      const nextChefName = next ? getManagerName(next) : undefined

      const action = getActionConfig(row.statusEvent)

      return {
        id: row.id,
        userId: row.user?.id ?? row.userId,
        userNom: row.userNom || row.user?.nom || "—",
        userPrenom: row.userPrenom || row.user?.prenom || "",
        cin: row.userCin || "—",
        matricule: row.userMatricule || row.user?.matricule || "—",
        actionType: row.statusEvent || "",
        actionLabel: action.label,
        actionStyle: action.style,
        actionIcon: action.icon,
        timestamp: row.dateEvent || "",
        mouvementDepartement: next ? buildMovement(oldDeptId, oldDeptName, nextDeptId, nextDeptName) : { changed: false },
        mouvementAgence: next ? buildMovement(oldAgenceId, oldAgenceName, nextAgenceId, nextAgenceName) : { changed: false },
        mouvementEntrepot: next ? buildMovement(oldEntrepotId, oldEntrepotName, nextEntrepotId, nextEntrepotName) : { changed: false },
        mouvementChef: next ? buildMovement(oldChefId, oldChefName, nextChefId, nextChefName) : { changed: false },
      }
    })
  }, [history, rowsByUser, userNameById])

  const baseRows = useMemo(() => {
    const allowed = new Set(["dettacher", "detacher", "desactiver"])
    return viewRows.filter(r => allowed.has((r.actionType || "").toLowerCase()))
  }, [viewRows])

  // Helper: Get Display Value for Sorting/Filtering
  const getFieldValue = (item: HistoryView, attribute: string): string => {
    switch (attribute) {
      case "userNom": return item.userNom.toLowerCase()
      case "userPrenom": return item.userPrenom.toLowerCase()
      case "cin": return item.cin.toLowerCase()
      case "matricule": return item.matricule.toLowerCase()
      case "actionType": return item.actionLabel.toLowerCase()
      case "departement": return (item.mouvementDepartement.next || "").toLowerCase()
      case "agence": return (item.mouvementAgence.next || "").toLowerCase()
      case "entrepot": return (item.mouvementEntrepot.next || "").toLowerCase()
      case "chef": return (item.mouvementChef.next || "").toLowerCase()
      default:
        return ""
    }
  }

  const formatDate = (value: string) => {
    if (!value) return "—"
    const d = new Date(value)
    return isNaN(d.getTime()) ? value : d.toLocaleDateString("fr-FR")
  }

  // 1. Filtering
  const filtered = baseRows.filter((historyRow) => {
    if (!searchTerm) return true

    const value = getFieldValue(historyRow, filterAttribute)
    const term = searchTerm.toLowerCase()

    switch (filterCondition) {
      case "contains": return value.includes(term)
      case "startsWith": return value.startsWith(term)
      case "endsWith": return value.endsWith(term)
      case "equals": return value === term
      default: return true
    }
  })

  // 2. Sorting
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "timestamp") {
      const dateA = new Date(a.timestamp).getTime()
      const dateB = new Date(b.timestamp).getTime()
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA
    }
    const aVal = getFieldValue(a, sortBy)
    const bVal = getFieldValue(b, sortBy)
    return sortOrder === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
  })

  useEffect(() => {
    setPage(1)
  }, [searchTerm, filterAttribute, filterCondition, sortBy, sortOrder])

  // --- Handlers ---
  const handleSortClick = (attribute: string) => {
    if (sortBy === attribute) setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    else { setSortBy(attribute); setSortOrder("asc") }
  }

  const handleResetFilters = () => {
    setSearchTerm("")
    setFilterAttribute("userNom")
    setFilterCondition("contains")
    setSortBy("timestamp")
    setSortOrder("desc")
  }

  const formatMovement = (movement: Movement) => {
    if (!movement.changed) return "-"
    return `${movement.old || "-"} -> ${movement.next || "-"}`
  }

  const handleExport = async () => {
    if (!sorted.length) return
    setIsExporting(true)
    try {
      await exportStyledWorkbook({
        fileName: "historique_affectations_management",
        subject: "Historique des affectations",
        sheets: [
          {
            name: "Historique",
            title: "Historique des affectations",
            columns: [
              { header: "Nom", key: "nom", width: 18 },
              { header: "Prenom", key: "prenom", width: 18 },
              { header: "CIN", key: "cin", width: 18 },
              { header: "Matricule", key: "matricule", width: 18 },
              { header: "Action", key: "action", width: 18 },
              { header: "Mouvement departement", key: "departement", width: 32 },
              { header: "Mouvement agence", key: "agence", width: 32 },
              { header: "Mouvement entrepot", key: "entrepot", width: 32 },
              { header: "Mouvement chef", key: "chef", width: 32 },
              { header: "Date", key: "date", width: 22 },
            ],
            rows: sorted.map((row) => ({
              nom: row.userNom || "-",
              prenom: row.userPrenom || "-",
              cin: row.cin || "-",
              matricule: row.matricule || "-",
              action: row.actionLabel || "-",
              departement: formatMovement(row.mouvementDepartement),
              agence: formatMovement(row.mouvementAgence),
              entrepot: formatMovement(row.mouvementEntrepot),
              chef: formatMovement(row.mouvementChef),
              date: formatDate(row.timestamp),
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

  const MovementCell = ({ movement }: { movement: Movement }) => {
    if (!movement.changed) return <span className="text-slate-400 text-xs">—</span>
    return (
      <div className="flex flex-col text-xs">
        <span className="text-slate-800 font-bold">{movement.next || "—"}</span>
        <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
          <span className="line-through decoration-slate-300">{movement.old || "—"}</span>
          <MoveRight className="w-2.5 h-2.5 text-slate-300" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Top Navbar */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-600 transition-all shadow-sm hover:shadow-md active:scale-95"
              title="Retour"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2">
              <div>
                <h1 className="text-lg font-black text-slate-900 leading-none">Historique des Affectations</h1>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              disabled={isExporting || sorted.length === 0}
              className="px-3 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-[10px] font-bold uppercase tracking-wide flex items-center gap-2"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              {isExporting ? "Export..." : "Exporter Excel"}
            </button>
            <div className="bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200 text-[10px] font-bold text-slate-600 uppercase tracking-wide">
              {sorted.length} Enregistrement(s)
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 space-y-4">
        {/* ADVANCED FILTER TOOLBAR */}
        <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col md:flex-row items-center gap-3 w-full">
            <div className="flex items-center gap-2 text-slate-400 px-2">
              <Filter className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase">Filtrer</span>
            </div>

            <div className="relative w-full md:w-auto">
              <select
                value={filterAttribute}
                onChange={(e) => setFilterAttribute(e.target.value)}
                className="w-full md:w-36 px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="userNom">Nom</option>
                <option value="userPrenom">Prénom</option>
                <option value="cin">CIN</option>
                <option value="matricule">Matricule</option>
                <option value="actionType">Type d'Action</option>
                <option value="departement">Département</option>
                <option value="agence">Agence</option>
                <option value="entrepot">Entrepôt</option>
                <option value="chef">Chef</option>
              </select>
            </div>

            <div className="relative w-full md:w-auto">
              <select
                value={filterCondition}
                onChange={(e) => setFilterCondition(e.target.value as FilterCondition)}
                className="w-full md:w-36 px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="contains">Contient</option>
                <option value="startsWith">Commence par</option>
                <option value="endsWith">Finit par</option>
                <option value="equals">Est égal à</option>
              </select>
            </div>

            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-2.5 w-3 h-3 text-slate-400" />
              <input
                type="text"
                placeholder={`Rechercher dans ${filterAttribute}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>
          </div>

          <button
            onClick={handleResetFilters}
            className="p-2 hover:bg-slate-50 text-slate-400 hover:text-blue-600 rounded-lg transition-all border border-transparent hover:border-slate-100"
            title="Réinitialiser les filtres"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>

        {/* Main Table */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left cursor-pointer hover:bg-slate-100 transition-colors group select-none" onClick={() => handleSortClick("userNom")}>
                    <div className="flex items-center gap-2 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                      Identité <SortIcon column="userNom" />
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left cursor-pointer hover:bg-slate-100 transition-colors group select-none" onClick={() => handleSortClick("matricule")}>
                    <div className="flex items-center gap-2 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                      Info Utilisateur <SortIcon column="matricule" />
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left cursor-pointer hover:bg-slate-100 transition-colors group select-none" onClick={() => handleSortClick("actionType")}>
                    <div className="flex items-center gap-2 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                      Action <SortIcon column="actionType" />
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left cursor-pointer hover:bg-slate-100 transition-colors group select-none" onClick={() => handleSortClick("departement")}>
                    <div className="flex items-center gap-2 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                      Mouvement Département <SortIcon column="departement" />
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left cursor-pointer hover:bg-slate-100 transition-colors group select-none" onClick={() => handleSortClick("agence")}>
                    <div className="flex items-center gap-2 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                      Mouvement Agence <SortIcon column="agence" />
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left cursor-pointer hover:bg-slate-100 transition-colors group select-none" onClick={() => handleSortClick("entrepot")}>
                    <div className="flex items-center gap-2 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                      Mouvement Entrepôt <SortIcon column="entrepot" />
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left cursor-pointer hover:bg-slate-100 transition-colors group select-none" onClick={() => handleSortClick("chef")}>
                    <div className="flex items-center gap-2 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                      Mouvement Chef <SortIcon column="chef" />
                    </div>
                  </th>
                  <th className="px-4 py-3 text-right cursor-pointer hover:bg-slate-100 transition-colors group select-none" onClick={() => handleSortClick("timestamp")}>
                    <div className="flex items-center justify-end gap-2 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                      Date & Heure <SortIcon column="timestamp" />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center font-bold text-xs group-hover:bg-white group-hover:text-blue-600 transition-colors border border-slate-200">
                          <User className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-xs">{row.userNom} {row.userPrenom}</p>
                          <p className="text-[10px] text-slate-400 font-mono">ID: {row.userId || "—"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-600">
                          <span className="text-slate-400 w-14 uppercase font-bold tracking-wider">CIN</span> {row.cin || "—"}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-600">
                          <span className="text-slate-400 w-14 uppercase font-bold tracking-wider">Matricule</span> {row.matricule || "—"}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${row.actionStyle}`}>
                        {row.actionIcon} {row.actionLabel}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <MovementCell movement={row.mouvementDepartement} />
                    </td>
                    <td className="px-4 py-3">
                      <MovementCell movement={row.mouvementAgence} />
                    </td>
                    <td className="px-4 py-3">
                      <MovementCell movement={row.mouvementEntrepot} />
                    </td>
                    <td className="px-4 py-3">
                      <MovementCell movement={row.mouvementChef} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2 text-slate-600 font-mono text-[10px] bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 w-fit ml-auto">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {formatDate(row.timestamp)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {isLoading && (
            <div className="px-6 py-10 text-center text-slate-400 text-sm">Chargement...</div>
          )}

          {!isLoading && sorted.length === 0 && (
            <div className="px-6 py-12 text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3 border border-slate-100">
                <FileText className="w-6 h-6 text-slate-300" />
              </div>
              <h3 className="text-slate-900 font-bold mb-1 text-sm">Aucun historique trouvé</h3>
              <p className="text-slate-500 text-xs">Essayez de modifier vos critères de recherche.</p>
            </div>
          )}
          {!isLoading && sorted.length > 0 && (
            <Pagination current={page} total={Math.ceil(sorted.length / PAGE_SIZE)} setPage={setPage} />
          )}
        </div>
      </div>
    </div>
  )
}
