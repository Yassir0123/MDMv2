"use client"

import { useState } from "react"
import { FAKE_DEPARTMENTS, type Department } from "@/lib/constants"
import { Search, Plus, Trash2, Edit2, Eye, History, ArrowLeft, X, Building } from "lucide-react"

type ViewMode = "list" | "add" | "edit" | "history" | "detail"

interface FormData {
  id: string
  name: string
  chief: string
  status: "Active" | "Inactive"
}

export default function AgenceDepartmentsPage({
  agenceId,
  agenceName = "Agence Nord",
  onBack,
}: {
  agenceId?: string
  agenceName?: string
  onBack?: () => void
}) {
  const [departments, setDepartments] = useState<Department[]>(FAKE_DEPARTMENTS || [])
  const [searchTerm, setSearchTerm] = useState("")
  const [viewMode, setViewMode] = useState<ViewMode>("list")
  const [sortBy, setSortBy] = useState("name")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [formData, setFormData] = useState<FormData>({
    id: "",
    name: "",
    chief: "",
    status: "Active",
  })
  const [selectedDept, setSelectedDept] = useState<Department | null>(null)

  // Filtering
  const filtered = departments.filter((dept) => {
    if (!searchTerm) return true
    const searchValue = searchTerm.toLowerCase()
    return dept.name.toLowerCase().includes(searchValue) || dept.chief.toLowerCase().includes(searchValue)
  })

  // Sorting
  const sorted = [...filtered].sort((a, b) => {
    const aVal = (a[sortBy as keyof Department] || "").toString()
    const bVal = (b[sortBy as keyof Department] || "").toString()
    const comparison = aVal.localeCompare(bVal)
    return sortOrder === "asc" ? comparison : -comparison
  })

  const handleAdd = () => {
    setFormData({ id: `DEPT${Date.now()}`, name: "", chief: "", status: "Active" })
    setViewMode("add")
  }

  const handleEdit = (dept: Department) => {
    setFormData({ id: dept.id, name: dept.name, chief: dept.chief, status: dept.status })
    setSelectedDept(dept)
    setViewMode("edit")
  }

  const handleDelete = (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce département ?")) {
      setDepartments(departments.filter((d) => d.id !== id))
    }
  }

  const handleSave = () => {
    if (viewMode === "add") {
      const newDept: Department = {
        ...formData,
        memberCount: 0,
        createdDate: new Date().toLocaleDateString("fr-FR"),
      }
      setDepartments([...departments, newDept])
    } else if (viewMode === "edit") {
      setDepartments(
        departments.map((d) =>
          d.id === formData.id ? { ...d, name: formData.name, chief: formData.chief, status: formData.status } : d
        )
      )
    }
    setViewMode("list")
    setFormData({ id: "", name: "", chief: "", status: "Active" })
  }

  const inputStyle =
    "w-full px-3 py-2 bg-secondary/30 border border-border rounded-lg focus:ring-2 focus:ring-accent/50 focus:border-accent outline-none transition-all text-sm"
  const labelStyle = "block text-[10px] font-bold uppercase text-muted-foreground mb-1 tracking-wide"

  // Form view
  if (viewMode === "add" || viewMode === "edit") {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="flex justify-between items-center pb-4 border-b border-border">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {viewMode === "add" ? "Nouveau Département" : "Modifier Département"}
              </h1>
              <p className="text-xs text-muted-foreground mt-1">Structure organisationnelle</p>
            </div>
            <button onClick={() => setViewMode("list")} className="p-1.5 hover:bg-secondary rounded-lg transition-colors">
              <X className="w-5 h-5 text-foreground" />
            </button>
          </div>

          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="bg-secondary/50 px-4 py-3 flex items-center gap-2">
              <Building className="w-4 h-4 text-accent" />
              <h3 className="text-foreground font-bold text-xs uppercase">Informations Générales</h3>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className={labelStyle}>Nom du Département</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Informatique, Logistique..."
                  className={inputStyle}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelStyle}>Chef de Département</label>
                  <input
                    type="text"
                    value={formData.chief}
                    onChange={(e) => setFormData({ ...formData, chief: e.target.value })}
                    placeholder="Nom du responsable"
                    className={inputStyle}
                  />
                </div>

                <div>
                  <label className={labelStyle}>Statut</label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value as "Active" | "Inactive" })
                    }
                    className={inputStyle}
                  >
                    <option value="Active">Actif</option>
                    <option value="Inactive">Inactif</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              onClick={handleSave}
              className="flex-1 py-3 text-sm font-bold uppercase bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
            >
              {viewMode === "add" ? "Créer" : "Sauvegarder"}
            </button>
            <button
              onClick={() => setViewMode("list")}
              className="flex-1 py-3 text-sm font-bold uppercase bg-secondary text-foreground rounded-lg hover:bg-secondary/80 transition-colors"
            >
              Annuler
            </button>
          </div>
        </div>
      </div>
    )
  }

  // List view
  return (
    <div className="p-4 space-y-4 bg-background min-h-screen">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-1.5 hover:bg-secondary rounded-lg transition-colors"
              title="Retour"
            >
              <ArrowLeft className="w-4 h-4 text-foreground" />
            </button>
          )}
          <div>
            <h1 className="text-2xl font-bold text-foreground">Départements - {agenceName}</h1>
            <p className="text-xs text-muted-foreground mt-1">Gestion des départements de cette agence</p>
          </div>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-3 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors font-medium text-xs"
        >
          <Plus className="w-3 h-3" />
          Ajouter Département
        </button>
      </div>

      {/* Filters */}
      <div className="bg-card border border-border rounded-lg p-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-3 h-3 text-muted-foreground" />
            <input
              type="text"
              placeholder="Rechercher un département..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 pl-8 bg-secondary/30 border border-border rounded-lg focus:ring-2 focus:ring-accent/50 focus:border-accent outline-none transition-all text-xs"
            />
          </div>

          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md text-xs appearance-none bg-input cursor-pointer"
            >
              <option value="name">Trier par nom</option>
              <option value="memberCount">Trier par nombre membres</option>
              <option value="createdDate">Trier par date création</option>
            </select>
          </div>

          <div />
        </div>
      </div>

      {/* Departments Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        {sorted.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary border-b border-border">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-foreground">Département</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-foreground">Chef de Département</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-foreground">Nombre Membres</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-foreground">Statut</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sorted.map((dept) => (
                  <tr key={dept.id} className="hover:bg-secondary/50 transition-colors">
                    <td className="px-4 py-2 text-xs text-foreground font-semibold">{dept.name}</td>
                    <td className="px-4 py-2 text-xs text-foreground">{dept.chief}</td>
                    <td className="px-4 py-2">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
                        {dept.memberCount} membres
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${dept.status === "Active"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                          }`}
                      >
                        {dept.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-xs">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setSelectedDept(dept)
                            setViewMode("detail")
                          }}
                          className="p-1 hover:bg-secondary rounded transition-colors"
                          title="Voir"
                        >
                          <Eye className="w-3 h-3 text-accent" />
                        </button>
                        <button
                          onClick={() => handleEdit(dept)}
                          className="p-1 hover:bg-secondary rounded transition-colors"
                          title="Éditer"
                        >
                          <Edit2 className="w-3 h-3 text-accent" />
                        </button>
                        <button
                          onClick={() => handleDelete(dept.id)}
                          className="p-1 hover:bg-secondary rounded transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-3 h-3 text-destructive" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedDept(dept)
                            setViewMode("history")
                          }}
                          className="p-1 hover:bg-secondary rounded transition-colors"
                          title="Historique"
                        >
                          <History className="w-3 h-3 text-accent" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-center text-muted-foreground">
            <p className="text-xs">Aucun département trouvé</p>
          </div>
        )}
      </div>
    </div>
  )
}
