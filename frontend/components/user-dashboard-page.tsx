"use client"

import { useEffect, useMemo, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import api from "@/lib/api"
import {
  Mail, Calendar, Shield, Hash, BadgeCheck, Building2,
  CircuitBoard, Wifi, Package, Monitor, UserRound, Briefcase, Smartphone
} from "lucide-react"

interface UserEntity {
  id: number
  nom?: string
  prenom?: string
  matricule?: string
  email?: string
  status?: string
  fonctionRef?: { nom?: string; libeller?: string }
  departement?: { id?: number; nom?: string }
  agence?: { id?: number; nom?: string }
}

interface MyAsset {
  id: number
  typeMateriel: string
  sn?: string
  numero?: string
  materielName: string
  statusAffectation: string
  dateEnvoie?: string
  dateRecu?: string
}

const assetVisual = (type: string) => {
  const value = type.toLowerCase()
  if (value.includes("sim")) return { icon: CircuitBoard, bg: "bg-orange-50", color: "text-orange-600", label: "Carte SIM" }
  if (value.includes("internet")) return { icon: Wifi, bg: "bg-sky-50", color: "text-sky-600", label: "Ligne Internet" }
  if (value.includes("mobile") || value.includes("gsm") || value.includes("pda") || value.includes("tsp")) return { icon: Smartphone, bg: "bg-emerald-50", color: "text-emerald-600", label: "Mobile" }
  if (value.includes("ordinateur") || value.includes("écran") || value.includes("ecran")) return { icon: Monitor, bg: "bg-indigo-50", color: "text-indigo-600", label: "Matériel IT" }
  return { icon: Package, bg: "bg-slate-100", color: "text-slate-700", label: "Matériel" }
}

export default function UserDashboardPage() {
  const { user } = useAuth()
  const [currentUser, setCurrentUser] = useState<UserEntity | null>(null)
  const [assets, setAssets] = useState<MyAsset[]>([])

  const fetchDashboardData = async () => {
    const authUserId = Number(user?.userId ?? user?.id)
    if (!authUserId) return

    const [usersRes, assetsRes] = await Promise.all([
      api.get("/users").catch(() => ({ data: [] })),
      api.get("/user-materiel/my-assets").catch(() => ({ data: [] })),
    ])

    const users = Array.isArray(usersRes.data) ? usersRes.data : []
    const myAssets = Array.isArray(assetsRes.data) ? assetsRes.data : []

    setCurrentUser(users.find((item: UserEntity) => item.id === authUserId) || null)
    setAssets(myAssets)
  }

  useEffect(() => {
    void fetchDashboardData()
  }, [user?.id, user?.userId])

  useEffect(() => {
    const refreshVisibleDashboard = () => {
      if (document.visibilityState === "visible") {
        void fetchDashboardData()
      }
    }

    const interval = window.setInterval(refreshVisibleDashboard, 4000)
    window.addEventListener("focus", refreshVisibleDashboard)
    document.addEventListener("visibilitychange", refreshVisibleDashboard)

    return () => {
      window.clearInterval(interval)
      window.removeEventListener("focus", refreshVisibleDashboard)
      document.removeEventListener("visibilitychange", refreshVisibleDashboard)
    }
  }, [user?.id, user?.userId])

  const visibleAssets = useMemo(
    () => assets.filter((item) => ["affecter", "recu", "annuler"].includes((item.statusAffectation || "").toLowerCase())),
    [assets]
  )

  const receivedCount = visibleAssets.filter((item) => (item.statusAffectation || "").toLowerCase() === "recu").length
  const pendingCount = visibleAssets.filter((item) => (item.statusAffectation || "").toLowerCase() === "affecter").length
  const reportedCount = visibleAssets.filter((item) => (item.statusAffectation || "").toLowerCase() === "annuler").length

  const profileFields = [
    { label: "Nom complet", value: `${currentUser?.nom || ""} ${currentUser?.prenom || ""}`.trim() || user?.name || "—", icon: UserRound },
    { label: "Email", value: currentUser?.email || user?.email || "—", icon: Mail },
    { label: "Matricule", value: currentUser?.matricule || "—", icon: Hash },
    { label: "Rôle", value: user?.role || "—", icon: Shield },
    { label: "Fonction", value: currentUser?.fonctionRef?.nom || currentUser?.fonctionRef?.libeller || "—", icon: Briefcase },
    { label: "Agence", value: currentUser?.agence?.nom || "—", icon: Building2 },
  ]

  return (
    <div className="p-4 lg:p-6 space-y-5 bg-background min-h-full">
      <div className="animate-fade-in-up">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Mon Espace</h1>
        <p className="text-sm text-muted-foreground mt-1">Une vue claire de votre profil et des équipements qui vous concernent</p>
      </div>

      <div className="rounded-[28px] overflow-hidden border border-border bg-card shadow-sm">
        <div className="relative px-6 py-8 bg-[radial-gradient(circle_at_top_left,_rgba(14,116,144,0.22),_transparent_38%),linear-gradient(135deg,#0f172a,#1e3a8a_58%,#0f766e)] text-white">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="h-16 w-16 rounded-2xl bg-white/15 border border-white/20 backdrop-blur flex items-center justify-center text-2xl font-bold">
                {(currentUser?.nom || user?.name || "U").charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-2xl font-bold">{`${currentUser?.nom || ""} ${currentUser?.prenom || ""}`.trim() || user?.name}</h2>
                <p className="text-sm text-white/80 mt-1">{currentUser?.departement?.nom || currentUser?.agence?.nom || "Profil collaborateur"}</p>
                <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">
                  <BadgeCheck className="w-3.5 h-3.5 text-emerald-300" />
                  {(currentUser?.status || "").toLowerCase() === "active" || (currentUser?.status || "").toLowerCase() === "activated" ? "Compte actif" : "Compte utilisateur"}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 w-full lg:w-auto">
              <div className="rounded-2xl bg-white/10 border border-white/15 px-4 py-3">
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/60">Équipements</p>
                <p className="text-2xl font-bold mt-1">{visibleAssets.length}</p>
              </div>
              <div className="rounded-2xl bg-white/10 border border-white/15 px-4 py-3">
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/60">Confirmés</p>
                <p className="text-2xl font-bold mt-1">{receivedCount}</p>
              </div>
              <div className="rounded-2xl bg-white/10 border border-white/15 px-4 py-3">
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/60">En attente</p>
                <p className="text-2xl font-bold mt-1">{pendingCount}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {profileFields.map((field) => {
            const Icon = field.icon
            return (
              <div key={field.label} className="rounded-2xl border border-border bg-secondary/30 p-4">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-xl bg-card border border-border flex items-center justify-center">
                    <Icon className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold">{field.label}</p>
                    <p className="text-sm font-semibold text-foreground mt-1 break-words">{field.value}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold">Reçus</p>
          <p className="text-3xl font-bold text-foreground mt-2">{receivedCount}</p>
          <p className="text-xs text-muted-foreground mt-1">Équipements validés</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold">En attente</p>
          <p className="text-3xl font-bold text-foreground mt-2">{pendingCount}</p>
          <p className="text-xs text-muted-foreground mt-1">À confirmer ou traiter</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold">Signalés</p>
          <p className="text-3xl font-bold text-foreground mt-2">{reportedCount}</p>
          <p className="text-xs text-muted-foreground mt-1">Incidents ou annulations</p>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Mes équipements</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Vue synthétique des ressources qui vous sont affectées</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-[11px] text-muted-foreground">
            <Calendar className="w-3.5 h-3.5" />
            {visibleAssets.length} élément{visibleAssets.length > 1 ? "s" : ""}
          </div>
        </div>

        {visibleAssets.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {visibleAssets.map((asset) => {
              const visual = assetVisual(asset.typeMateriel)
              const Icon = visual.icon
              const status = (asset.statusAffectation || "").toLowerCase()
              const badgeClass = status === "recu" ? "bg-emerald-100 text-emerald-700" : status === "annuler" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"

              return (
                <div key={asset.id} className="rounded-2xl border border-border bg-secondary/20 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={`h-11 w-11 rounded-xl ${visual.bg} flex items-center justify-center`}>
                        <Icon className={`w-5 h-5 ${visual.color}`} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{asset.materielName}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{visual.label}</p>
                      </div>
                    </div>
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${badgeClass}`}>
                      {status === "recu" ? "Reçu" : status === "annuler" ? "Signalé" : "En attente"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground font-semibold">Référence</p>
                      <p className="text-xs font-medium text-foreground mt-1">{asset.sn || asset.numero || "—"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground font-semibold">Dernière date</p>
                      <p className="text-xs font-medium text-foreground mt-1">{asset.dateRecu || asset.dateEnvoie || "—"}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-10">
            <Package className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm font-medium text-foreground">Aucun équipement à afficher</p>
            <p className="text-xs text-muted-foreground mt-1">Vos futurs équipements apparaîtront ici.</p>
          </div>
        )}
      </div>
    </div>
  )
}
