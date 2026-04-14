"use client"

import { useState } from "react"
import { FAKE_AFFECTATIONS, FAKE_SIMS, FAKE_INTERNET_LINES, FAKE_MOBILE_DEVICES, FAKE_USERS } from "@/lib/constants"
import { Plus, X } from "lucide-react"

type AssetType = "sim" | "internet" | "mobile"
type MobileType = "PDA" | "GSM" | "TSP"
type TargetType = "user" | "service"

export default function AffectationMaterielPage() {
  const [viewMode, setViewMode] = useState<"list" | "assign">("list")
  const [selectedTarget, setSelectedTarget] = useState("")
  const [targetType, setTargetType] = useState<TargetType>("user")
  const [selectedAssets, setSelectedAssets] = useState<Array<{ type: AssetType; id: string }>>([])
  const [assetType, setAssetType] = useState<AssetType>("sim")
  const [mobileType, setMobileType] = useState<MobileType>("GSM")

  const SERVICES = [
    { id: "svc001", name: "Service Général" },
    { id: "svc002", name: "Service IT" },
    { id: "svc003", name: "Service Logistique" },
  ]

  const getAvailableAssets = () => {
    if (targetType === "service") {
      if (assetType === "internet") return FAKE_INTERNET_LINES.filter((i) => !i.assignedTo)
      if (assetType === "mobile") {
        return FAKE_MOBILE_DEVICES.filter((d) => d.status === "Available" && d.type === "TSP")
      }
      return []
    }

    // For users, show all asset types
    if (assetType === "sim") return FAKE_SIMS.filter((s) => !s.assignedTo)
    if (assetType === "internet") return FAKE_INTERNET_LINES.filter((i) => !i.assignedTo)
    if (assetType === "mobile") {
      const devices = FAKE_MOBILE_DEVICES.filter((d) => d.status === "Available")
      if (mobileType) return devices.filter((d) => d.type === mobileType)
      return devices
    }
    return []
  }

  const handleAddAsset = (assetId: string) => {
    if (!selectedAssets.find((a) => a.id === assetId && a.type === assetType)) {
      setSelectedAssets([...selectedAssets, { type: assetType, id: assetId }])
    }
  }

  const handleRemoveAsset = (assetId: string, type: AssetType) => {
    setSelectedAssets(selectedAssets.filter((a) => !(a.id === assetId && a.type === type)))
  }

  const handleConfirmAffectation = () => {
    if (!selectedTarget || selectedAssets.length === 0) {
      alert("Veuillez sélectionner une cible et au moins un actif")
      return
    }
    alert(`Affectation de ${selectedAssets.length} actif(s) effectuée avec succès!`)
    setViewMode("list")
    setSelectedTarget("")
    setSelectedAssets([])
  }

  const sorted = FAKE_AFFECTATIONS.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  if (viewMode === "assign") {
    return (
      <div className="p-4 space-y-4 bg-background max-w-5xl mx-auto">
        <div className="flex justify-between items-start pb-4 border-b border-border">
          <div>
            <h1 className="text-xl font-bold text-foreground">Affecter Actif(s)</h1>
            <p className="text-xs text-muted-foreground mt-1">Sélectionnez la cible et les actifs à affecter</p>
          </div>
          <button
            onClick={() => {
              setViewMode("list")
              setSelectedTarget("")
              setSelectedAssets([])
            }}
            className="p-1.5 hover:bg-secondary rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-card border border-border rounded-lg p-4 space-y-4">
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase text-foreground tracking-wide">Sélectionner la Cible</h3>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Type de Cible</label>
                <select
                  value={targetType}
                  onChange={(e) => {
                    setTargetType(e.target.value as TargetType)
                    setSelectedTarget("")
                    setAssetType("sim")
                  }}
                  className="w-full px-3 py-2 border border-border bg-input text-foreground text-xs rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all outline-none"
                >
                  <option value="user">Utilisateur</option>
                  <option value="service">Service</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  {targetType === "user" ? "Utilisateur" : "Service"} Cible
                </label>
                <select
                  value={selectedTarget}
                  onChange={(e) => setSelectedTarget(e.target.value)}
                  className="w-full px-3 py-2 border border-border bg-input text-foreground text-xs rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all outline-none"
                >
                  <option value="">Sélectionner une cible</option>
                  {targetType === "user"
                    ? FAKE_USERS.filter((u) => u.status === "Activated").map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name} - {user.department}
                      </option>
                    ))
                    : SERVICES.map((svc) => (
                      <option key={svc.id} value={svc.id}>
                        {svc.name}
                      </option>
                    ))}
                </select>
              </div>

              {selectedTarget && (
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
                  <div className="space-y-1.5 text-xs">
                    {targetType === "user" && FAKE_USERS.find((u) => u.id === selectedTarget) && (
                      <>
                        <p>
                          <span className="font-bold text-foreground">Utilisateur:</span>{" "}
                          <span className="text-muted-foreground">
                            {FAKE_USERS.find((u) => u.id === selectedTarget)?.name}
                          </span>
                        </p>
                        <p>
                          <span className="font-bold text-foreground">Département:</span>{" "}
                          <span className="text-muted-foreground">
                            {FAKE_USERS.find((u) => u.id === selectedTarget)?.department}
                          </span>
                        </p>
                      </>
                    )}
                    {targetType === "service" && SERVICES.find((s) => s.id === selectedTarget) && (
                      <p>
                        <span className="font-bold text-foreground">Service:</span>{" "}
                        <span className="text-muted-foreground">
                          {SERVICES.find((s) => s.id === selectedTarget)?.name}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-border pt-4 space-y-3">
            <h3 className="text-xs font-bold uppercase text-foreground tracking-wide">Sélectionner les Actifs</h3>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Type d'Actif</label>
                <select
                  value={assetType}
                  onChange={(e) => {
                    setAssetType(e.target.value as AssetType)
                  }}
                  className="w-full px-3 py-2 border border-border bg-input text-foreground text-xs rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all outline-none"
                >
                  {targetType === "user" ? (
                    <>
                      <option value="sim">Carte SIM</option>
                      <option value="internet">Ligne Internet</option>
                      <option value="mobile">Appareil Mobile</option>
                    </>
                  ) : (
                    <>
                      <option value="internet">Ligne Internet</option>
                      <option value="mobile">Appareil Mobile</option>
                    </>
                  )}
                </select>
              </div>

              {assetType === "mobile" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Type d'Appareil</label>
                  <select
                    value={mobileType}
                    onChange={(e) => setMobileType(e.target.value as MobileType)}
                    className="w-full px-3 py-2 border border-border bg-input text-foreground text-xs rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all outline-none"
                  >
                    {targetType === "user" ? (
                      <>
                        <option value="GSM">GSM</option>
                        <option value="PDA">PDA</option>
                        <option value="TSP">TSP</option>
                      </>
                    ) : (
                      <option value="TSP">TSP</option>
                    )}
                  </select>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Actifs Disponibles</label>
                <div className="border border-border rounded-lg max-h-48 overflow-y-auto">
                  {getAvailableAssets().length === 0 ? (
                    <div className="p-3 text-xs text-muted-foreground text-center">Aucun actif disponible</div>
                  ) : (
                    getAvailableAssets().map((asset: any) => (
                      <div
                        key={asset.id}
                        className="flex items-center justify-between p-2.5 border-b border-border hover:bg-secondary/30 transition-colors"
                      >
                        <div className="flex-1">
                          <p className="font-semibold text-xs text-foreground">{asset.number || asset.name}</p>
                          <p className="text-[10px] text-muted-foreground">{asset.provider || asset.brand}</p>
                        </div>
                        <button
                          onClick={() => handleAddAsset(asset.id)}
                          className="px-3 py-1.5 bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-[10px] uppercase rounded transition-all"
                        >
                          Ajouter
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {selectedAssets.length > 0 && (
            <div className="border-t border-border pt-4 space-y-3">
              <h3 className="text-xs font-bold uppercase text-foreground tracking-wide">
                Actifs Sélectionnés ({selectedAssets.length})
              </h3>
              <div className="space-y-2">
                {selectedAssets.map((sel) => {
                  let assetInfo: any = null
                  if (sel.type === "sim") assetInfo = FAKE_SIMS.find((s) => s.id === sel.id)
                  else if (sel.type === "internet") assetInfo = FAKE_INTERNET_LINES.find((i) => i.id === sel.id)
                  else assetInfo = FAKE_MOBILE_DEVICES.find((m) => m.id === sel.id)

                  return (
                    <div
                      key={`${sel.type}-${sel.id}`}
                      className="flex items-center justify-between bg-green-50 dark:bg-green-950/20 p-2.5 border border-green-200 dark:border-green-800 rounded-lg"
                    >
                      <div>
                        <p className="font-semibold text-xs text-foreground">{assetInfo?.number || assetInfo?.name}</p>
                        <p className="text-[10px] text-muted-foreground uppercase mt-0.5">{sel.type}</p>
                      </div>
                      <button
                        onClick={() => handleRemoveAsset(sel.id, sel.type)}
                        className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors text-red-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={handleConfirmAffectation}
            disabled={!selectedTarget || selectedAssets.length === 0}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground hover:from-primary/90 hover:to-primary/80 transition-all font-bold text-xs uppercase rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Affecter ({selectedAssets.length} Actif{selectedAssets.length !== 1 ? "s" : ""})
          </button>
          <button
            onClick={() => {
              setViewMode("list")
              setSelectedTarget("")
              setSelectedAssets([])
            }}
            className="flex-1 px-4 py-2 bg-secondary text-foreground hover:bg-secondary/80 transition-all font-bold text-xs uppercase rounded-lg"
          >
            Annuler
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4 bg-background max-w-5xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-foreground">Affectation Matériel</h1>
          <p className="text-xs text-muted-foreground mt-1">Gérez les affectations de matériel</p>
        </div>
        <button
          onClick={() => setViewMode("assign")}
          className="inline-flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg text-xs font-bold uppercase transition-colors"
        >
          <Plus className="w-4 h-4" />
          Affecter
        </button>
      </div>

      {/* Redesigned table with better styling */}
      <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
        <table className="w-full">
          <thead className="bg-secondary/50 border-b border-border">
            <tr>
              <th className="px-4 py-2 text-left text-[10px] font-bold uppercase text-muted-foreground tracking-wider">
                Date
              </th>
              <th className="px-4 py-2 text-left text-[10px] font-bold uppercase text-muted-foreground tracking-wider">
                Cible
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
                <td className="px-4 py-2 text-xs text-foreground font-semibold">{aff.date}</td>
                <td className="px-4 py-2 text-xs text-muted-foreground">{aff.targetName}</td>
                <td className="px-4 py-2 text-xs text-foreground font-semibold">{aff.assetName}</td>
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
      </div>
    </div>
  )
}
