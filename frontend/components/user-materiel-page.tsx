"use client"

import { useAuth } from "@/lib/auth-context"
import { FAKE_AFFECTATIONS } from "@/lib/constants"
import { useState } from "react"
import { CheckCircle, Clock, Package } from "lucide-react"

export default function UserMaterielPage() {
  const { user } = useAuth()
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null)
  const [signature, setSignature] = useState("")
  const [confirmedAssets, setConfirmedAssets] = useState<Set<string>>(new Set())

  const userAffectations = FAKE_AFFECTATIONS.filter((a) => a.targetId === user?.id)

  const handleConfirmReception = () => {
    if (selectedAssetId && signature.trim()) {
      setConfirmedAssets((prev) => new Set([...prev, selectedAssetId]))
      setSignature("")
      setSelectedAssetId(null)
    }
  }

  return (
    <div className="p-4 space-y-4 bg-background min-h-screen max-w-7xl mx-auto">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
            <Package className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Matériel Affecté</h1>
            <p className="text-xs text-muted-foreground">Confirmez la réception de vos équipements</p>
          </div>
        </div>
      </div>

      {userAffectations.length > 0 ? (
        <div className="space-y-3">
          {userAffectations.map((aff) => {
            const isConfirmed = confirmedAssets.has(aff.id)
            return (
              <div
                key={aff.id}
                onClick={() => !isConfirmed && setSelectedAssetId(aff.id)}
                className={`bg-card border rounded-lg p-4 transition-all cursor-pointer ${isConfirmed
                    ? "border-emerald-200 bg-emerald-50/30"
                    : "border-border hover:border-primary/50 hover:shadow-md"
                  }`}
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <p className="font-semibold text-foreground text-sm">{aff.assetName}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs">
                      <p className="text-muted-foreground">
                        Affecté le <span className="font-medium">{aff.date}</span>
                      </p>
                      <p className="text-muted-foreground">
                        Type: <span className="font-medium capitalize">{aff.assetType}</span>
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {isConfirmed ? (
                      <div className="flex items-center gap-2 text-emerald-600">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-semibold text-xs">Reçu</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-amber-600">
                        <Clock className="w-5 h-5" />
                        <span className="font-semibold text-xs">En Attente</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg p-12 text-center">
          <Package className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">Aucun matériel affecté</p>
        </div>
      )}

      {selectedAssetId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full space-y-4 shadow-lg">
            <div>
              <h2 className="text-lg font-bold text-foreground">Accuser Réception du Matériel</h2>
              <p className="text-xs text-muted-foreground mt-1">Veuillez confirmer la réception de l'équipement</p>
            </div>

            {userAffectations
              .filter((a) => a.id === selectedAssetId)
              .map((aff) => (
                <div key={aff.id} className="p-3 bg-secondary rounded-lg border border-border space-y-1.5">
                  <p className="font-semibold text-foreground text-sm">{aff.assetName}</p>
                  <p className="text-xs text-muted-foreground">Type: {aff.assetType}</p>
                  <p className="text-[10px] text-muted-foreground">Affecté le {aff.date}</p>
                </div>
              ))}

            <div className="space-y-3">
              <label className="text-xs font-semibold text-foreground block">Entrez votre nom complet</label>
              <input
                type="text"
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                placeholder="Votre nom complet"
                className="w-full px-3 py-2 border border-border rounded-lg bg-input text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-xs"
              />
            </div>
            <p className="text-[10px] text-muted-foreground bg-blue-50 border border-blue-200 p-2 rounded-lg">
              En confirmant, vous certifiez avoir reçu le matériel décrit ci-dessus et en être responsable.
            </p>

            <div className="flex gap-3 pt-3 border-t border-border">
              <button
                onClick={handleConfirmReception}
                disabled={!signature.trim()}
                className="flex-1 px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-semibold text-xs disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirmer la Réception
              </button>
              <button
                onClick={() => {
                  setSelectedAssetId(null)
                  setSignature("")
                }}
                className="flex-1 px-3 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors font-semibold text-xs"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
