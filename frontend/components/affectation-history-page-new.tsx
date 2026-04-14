"use client"

import { FAKE_AFFECTATIONS } from "@/lib/constants"
import { Search, ChevronDown, RotateCw } from "lucide-react"
import { useState } from "react"

export default function AffectationHistoryPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterAttribute, setFilterAttribute] = useState("targetName")
  const [searchCondition, setSearchCondition] = useState("contains")
  const [sortBy, setSortBy] = useState("date")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [showSearchDropdown, setShowSearchDropdown] = useState(false)
  const [showSortDropdown, setShowSortDropdown] = useState(false)

  const filtered = FAKE_AFFECTATIONS.filter((aff) => {
    if (!searchTerm) return true
    const searchValue = searchTerm.toLowerCase()
    const fieldValue = (() => {
      switch (filterAttribute) {
        case "targetName":
          return aff.targetName.toLowerCase()
        case "assetName":
          return aff.assetName.toLowerCase()
        case "action":
          return aff.action.toLowerCase()
        default:
          return ""
      }
    })()

    switch (searchCondition) {
      case "contains":
        return fieldValue.includes(searchValue)
      case "is":
        return fieldValue === searchValue
      case "starts":
        return fieldValue.startsWith(searchValue)
      case "ends":
        return fieldValue.endsWith(searchValue)
      default:
        return true
    }
  })

  const sorted = [...filtered].sort((a, b) => {
    let aVal: any = a[sortBy as keyof typeof a]
    let bVal: any = b[sortBy as keyof typeof b]

    if (sortBy === "date") {
      aVal = new Date(aVal).getTime()
      bVal = new Date(bVal).getTime()
    }

    if (aVal > bVal) return sortOrder === "asc" ? 1 : -1
    if (aVal < bVal) return sortOrder === "asc" ? -1 : 1
    return 0
  })

  return (
    <div className="p-4 space-y-4 bg-background px-4 mx-auto max-w-5xl">
      <div>
        <h1 className="text-xl font-bold text-foreground">Historique des Affectations</h1>
        <p className="text-xs text-muted-foreground mt-1">{sorted.length} enregistrement(s)</p>
      </div>

      <div className="bg-card border border-border rounded-lg p-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          {/* Trier on far left */}
          <div className="relative">
            <button
              onClick={() => {
                setShowSortDropdown(!showSortDropdown)
                setShowSearchDropdown(false)
              }}
              className="px-3 py-1.5 border border-border hover:bg-secondary rounded-lg text-[10px] font-bold uppercase flex items-center gap-2 transition-colors"
            >
              <ChevronDown className="w-3.5 h-3.5" />
              Trier
            </button>

            {showSortDropdown && (
              <div className="absolute top-full left-0 mt-2 bg-card border border-border rounded-lg shadow-xl z-10 p-3 min-w-64 space-y-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Attribut</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-2 py-1.5 border border-border bg-input text-foreground text-xs rounded-md mt-1"
                  >
                    <option value="date">Date</option>
                    <option value="targetName">Utilisateur/Service</option>
                    <option value="action">Action</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Ordre</label>
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
                    className="w-full px-2 py-1.5 border border-border bg-input text-foreground text-xs rounded-md mt-1"
                  >
                    <option value="asc">Ascendant</option>
                    <option value="desc">Descendant</option>
                  </select>
                </div>

                <button
                  onClick={() => setShowSortDropdown(false)}
                  className="w-full px-3 py-1.5 bg-primary text-primary-foreground hover:bg-primary/90 text-[10px] font-bold uppercase rounded-lg transition-colors"
                >
                  Appliquer
                </button>
              </div>
            )}
          </div>

          {/* Rechercher */}
          <div className="relative">
            <button
              onClick={() => {
                setShowSearchDropdown(!showSearchDropdown)
                setShowSortDropdown(false)
              }}
              className="px-3 py-1.5 bg-primary text-primary-foreground hover:bg-primary/90 text-[10px] font-bold uppercase flex items-center gap-2 rounded-lg transition-colors whitespace-nowrap"
            >
              <Search className="w-3.5 h-3.5" />
              Rechercher
            </button>

            {showSearchDropdown && (
              <div className="absolute top-full left-0 mt-2 bg-card border border-border rounded-lg shadow-xl z-10 p-3 min-w-80 space-y-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Attribut</label>
                  <select
                    value={filterAttribute}
                    onChange={(e) => {
                      setFilterAttribute(e.target.value)
                      setSearchTerm("")
                    }}
                    className="w-full px-2 py-1.5 border border-border bg-input text-foreground text-xs rounded-md mt-1"
                  >
                    <option value="targetName">Utilisateur/Service</option>
                    <option value="assetName">Actif</option>
                    <option value="action">Action</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Condition</label>
                  <select
                    value={searchCondition}
                    onChange={(e) => setSearchCondition(e.target.value)}
                    className="w-full px-2 py-1.5 border border-border bg-input text-foreground text-xs rounded-md mt-1"
                  >
                    <option value="contains">Contient</option>
                    <option value="is">Est</option>
                    <option value="starts">Commence par</option>
                    <option value="ends">Finit par</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Valeur</label>
                  <input
                    type="text"
                    placeholder="Entrez la valeur"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-2 py-1.5 border border-border bg-input text-foreground placeholder-muted-foreground text-xs rounded-md mt-1"
                  />
                </div>

                <button
                  onClick={() => setShowSearchDropdown(false)}
                  className="w-full px-3 py-1.5 bg-primary text-primary-foreground hover:bg-primary/90 text-[10px] font-bold uppercase rounded-lg transition-colors"
                >
                  Appliquer
                </button>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={() => {
            setSearchTerm("")
            setFilterAttribute("targetName")
            setSortBy("date")
            setSortOrder("desc")
          }}
          className="p-1.5 hover:bg-secondary rounded-lg transition-colors text-muted-foreground hover:text-foreground"
          title="Rafraîchir"
        >
          <RotateCw className="w-4 h-4" />
        </button>
      </div>

      {/* History Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
        <table className="w-full">
          <thead className="bg-secondary/50 border-b border-border">
            <tr>
              <th className="px-4 py-2 text-left text-[10px] font-bold uppercase text-muted-foreground tracking-wider">
                Date/Heure
              </th>
              <th className="px-4 py-2 text-left text-[10px] font-bold uppercase text-muted-foreground tracking-wider">
                Utilisateur/Service
              </th>
              <th className="px-4 py-2 text-left text-[10px] font-bold uppercase text-muted-foreground tracking-wider">
                Actif
              </th>
              <th className="px-4 py-2 text-left text-[10px] font-bold uppercase text-muted-foreground tracking-wider">
                Type
              </th>
              <th className="px-4 py-2 text-left text-[10px] font-bold uppercase text-muted-foreground tracking-wider">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sorted.map((aff) => (
              <tr key={aff.id} className="hover:bg-secondary/30 transition-colors">
                <td className="px-4 py-2 text-xs text-foreground font-bold">{aff.timestamp}</td>
                <td className="px-4 py-2 text-xs text-muted-foreground">{aff.targetName}</td>
                <td className="px-4 py-2 text-xs text-foreground">{aff.assetName}</td>
                <td className="px-4 py-2 text-xs">
                  <span className="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-[10px] font-semibold">
                    {aff.assetType === "sim" ? "SIM" : aff.assetType === "internet" ? "Internet" : "Mobile"}
                  </span>
                </td>
                <td className="px-4 py-2 text-xs">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${aff.action === "Affecté"
                      ? "bg-blue-100 text-blue-700"
                      : aff.action === "Reçu"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                      }`}
                  >
                    {aff.action}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {sorted.length === 0 && (
          <div className="px-4 py-6 text-center text-muted-foreground text-xs">Aucun élément trouvé</div>
        )}
      </div>
    </div>
  )
}
