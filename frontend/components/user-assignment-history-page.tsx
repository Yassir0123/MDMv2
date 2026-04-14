"use client"

import { useState } from "react"
import { FAKE_USER_HISTORY, FAKE_USERS } from "@/lib/constants"
import { Search, ChevronDown, RotateCw } from "lucide-react"

export default function UserAssignmentHistoryPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterAttribute, setFilterAttribute] = useState("name")
  const [searchCondition, setSearchCondition] = useState("contains")
  const [sortBy, setSortBy] = useState("date")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [showSearchDropdown, setShowSearchDropdown] = useState(false)
  const [showSortDropdown, setShowSortDropdown] = useState(false)

  const filtered = FAKE_USER_HISTORY.filter((entry) => {
    if (!searchTerm) return true
    const searchValue = searchTerm.toLowerCase()
    const fieldValue = (entry[filterAttribute as keyof typeof entry] || "").toString().toLowerCase()

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
    const aVal = (a[sortBy as keyof typeof a] || "").toString()
    const bVal = (b[sortBy as keyof typeof b] || "").toString()
    const comparison = aVal.localeCompare(bVal)
    return sortOrder === "asc" ? comparison : -comparison
  })

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case "Affecté":
        return "bg-blue-100 text-blue-700"
      case "Détaché":
        return "bg-orange-100 text-orange-700"
      case "Désactivé":
        return "bg-red-100 text-red-700"
      case "Annulé":
        return "bg-green-100 text-green-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  return (
    <div className="p-4 space-y-4 bg-background max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-foreground">Historique des Affectations</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Suivi complet des mouvements utilisateurs : affectations, détachements, désactivations et annulations
          </p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
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
                    <option value="name">Nom</option>
                    <option value="firstName">Prénom</option>
                    <option value="action">Action</option>
                    <option value="date">Date</option>
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
                    <option value="name">Nom</option>
                    <option value="firstName">Prénom</option>
                    <option value="cin">CIN</option>
                    <option value="matricule">Matricule</option>
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
            setFilterAttribute("name")
            setSortBy("date")
            setSortOrder("desc")
          }}
          className="p-2 hover:bg-secondary rounded-lg transition-colors text-muted-foreground hover:text-foreground"
          title="Rafraîchir"
        >
          <RotateCw className="w-5 h-5" />
        </button>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
        <table className="w-full">
          <thead className="bg-secondary/50 border-b border-border">
            <tr>
              <th className="px-4 py-2 text-left text-[10px] font-bold uppercase text-muted-foreground tracking-wider">
                ID Utilisateur
              </th>
              <th className="px-4 py-2 text-left text-[10px] font-bold uppercase text-muted-foreground tracking-wider">
                Nom
              </th>
              <th className="px-4 py-2 text-left text-[10px] font-bold uppercase text-muted-foreground tracking-wider">
                Prénom
              </th>
              <th className="px-4 py-2 text-left text-[10px] font-bold uppercase text-muted-foreground tracking-wider">
                CIN
              </th>
              <th className="px-4 py-2 text-left text-[10px] font-bold uppercase text-muted-foreground tracking-wider">
                Matricule
              </th>
              <th className="px-4 py-2 text-left text-[10px] font-bold uppercase text-muted-foreground tracking-wider">
                Chef Actuel
              </th>
              <th className="px-4 py-2 text-left text-[10px] font-bold uppercase text-muted-foreground tracking-wider">
                Ancien Chef
              </th>
              <th className="px-4 py-2 text-left text-[10px] font-bold uppercase text-muted-foreground tracking-wider">
                Dpt Actuel
              </th>
              <th className="px-4 py-2 text-left text-[10px] font-bold uppercase text-muted-foreground tracking-wider">
                Ancien Dpt
              </th>
              <th className="px-4 py-2 text-left text-[10px] font-bold uppercase text-muted-foreground tracking-wider">
                Action
              </th>
              <th className="px-4 py-2 text-left text-[10px] font-bold uppercase text-muted-foreground tracking-wider">
                Date
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sorted.map((entry) => {
              const currentManager = FAKE_USERS.find((u) => u.id === entry.oldChief)
              const previousManager = FAKE_USERS.find((u) => u.id === entry.newChief)

              return (
                <tr key={entry.id} className="hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-2 text-xs font-mono text-muted-foreground">{entry.userId}</td>
                  <td className="px-4 py-2 text-xs font-semibold text-foreground">{entry.userName}</td>
                  <td className="px-4 py-2 text-xs text-foreground">{entry.userPrenom}</td>
                  <td className="px-4 py-2 text-xs text-muted-foreground">{entry.cin || "-"}</td>
                  <td className="px-4 py-2 text-xs font-mono text-muted-foreground">{entry.matricule || "-"}</td>
                  <td className="px-4 py-2 text-xs text-muted-foreground">
                    {currentManager ? `${currentManager.name} ${currentManager.name}` : "-"}
                  </td>
                  <td className="px-4 py-2 text-xs text-muted-foreground">
                    {previousManager ? `${previousManager.name} ${previousManager.name}` : "-"}
                  </td>
                  <td className="px-4 py-2 text-xs text-muted-foreground">{entry.newDepartment || "-"} </td>
                  <td className="px-4 py-2 text-xs text-muted-foreground">{entry.oldDepartment || "-"}</td>
                  <td className="px-4 py-2 text-xs">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${getActionBadgeColor(entry.actionType)}`}
                    >
                      {entry.actionType}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-xs text-muted-foreground">{entry.timestamp}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {sorted.length === 0 && (
          <div className="px-4 py-6 text-center text-muted-foreground text-xs">Aucun historique trouvé</div>
        )}
      </div>
    </div>
  )
}
