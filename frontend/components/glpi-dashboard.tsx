
"use client"

import { useEffect, useMemo, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import api from "@/lib/api"
import { useVisiblePolling } from "@/lib/use-visible-polling"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import {
  Activity,
  ArrowUpRight,
  Boxes,
  Building2,
  Network,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Users,
  Wifi,
} from "lucide-react"

interface UserEntity {
  id: number
  nom?: string
  prenom?: string
  status?: string
  agence?: { id: number; nom?: string }
  departement?: { id: number; nom?: string }
  entrepot?: { id: number; nom?: string }
}

interface Mobile {
  id: number
  type?: string
  status?: string
  statusAffectation?: string
  agenceId?: number
  userId?: number
  dateCreation?: string
}

interface CarteSim {
  id: number
  status?: string
  statusAffectation?: string
  agenceId?: number
  dateCreation?: string
}

interface LigneInternet {
  id: number
  status?: string
  statusAffectation?: string
  agenceId?: number
  dateCreation?: string
}

interface Materiel {
  id: number
  typeMateriel?: string
  status?: string
  statusAffectation?: string
  agenceId?: number
  userId?: number
  departementId?: number
  entrepotId?: number
  dateCreation?: string
}

type TrendSeriesKey = "mobiles" | "sims" | "internet" | "materiels"
type DashboardSummaryPayload = {
  users?: UserEntity[]
  mobiles?: Mobile[]
  sims?: CarteSim[]
  internetLines?: LigneInternet[]
  materiels?: Materiel[]
}

const DASHBOARD_CACHE_KEY = "glpi-dashboard-summary-cache-v1"
const DASHBOARD_CACHE_TTL_MS = 60_000

const COLORS = ["#1d4ed8", "#0f766e", "#ea580c", "#7c3aed", "#be123c", "#0891b2", "#4f46e5", "#65a30d"]

const normalizeStatus = (value?: string) => (value || "").toLowerCase()
const normalizeAssignStatus = (value?: string) => (value || "").toLowerCase()

const isAssignedAsset = (item: {
  statusAffectation?: string
  userId?: number
  departementId?: number
  agenceId?: number
  entrepotId?: number
}) => {
  const affectation = normalizeAssignStatus(item.statusAffectation)
  if (["affecter", "recu", "en_attente", "annuler"].includes(affectation)) return true
  return Boolean(item.userId || item.departementId || item.agenceId || item.entrepotId)
}

const formatShortDate = (value: Date) =>
  value.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })

const percentage = (value: number, total: number) => {
  if (!total) return "0%"
  return `${Math.round((value / total) * 100)}%`
}

const DashboardTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null

  const row = payload[0]?.payload
  const materialDetails = row?.materialDetails as { name: string; value: number }[] | undefined

  return (
    <div className="rounded-xl border border-border bg-card px-3 py-2 shadow-lg">
      {label ? <p className="mb-1 text-xs font-semibold text-foreground">{label}</p> : null}
      {payload.map((entry: any) => (
        <div key={entry.dataKey || entry.name} className="flex items-center justify-between gap-4 text-xs">
          <span className="text-muted-foreground">{entry.name || entry.dataKey}</span>
          <span className="font-semibold text-foreground">{entry.value}</span>
        </div>
      ))}
      {materialDetails?.length ? (
        <div className="mt-2 space-y-1 border-t border-border pt-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Detail materiel</p>
          {materialDetails.map((item) => (
            <div key={item.name} className="flex items-center justify-between gap-4 text-[11px]">
              <span className="text-muted-foreground">{item.name}</span>
              <span className="font-medium text-foreground">{item.value}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}
const UserGroupChart = ({ title, data }: { title: string, data: any[] }) => (
  <div className="rounded-2xl border border-border bg-card p-5 flex flex-col">
    <div className="mb-4">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
    </div>
    <div className="flex-1 overflow-y-auto overflow-x-hidden" style={{ maxHeight: "300px" }}>
      <ResponsiveContainer width="100%" height={Math.max(250, data.length * 45)}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" fontSize={11} stroke="var(--muted-foreground)" axisLine={false} tickLine={false} />
          <YAxis dataKey="name" type="category" width={100} fontSize={11} stroke="var(--muted-foreground)" axisLine={false} tickLine={false} />
          <Tooltip content={<DashboardTooltip />} cursor={{ fill: 'var(--secondary)' }} />
          <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
          <Bar dataKey="active" stackId="status" fill="#2563eb" name="Actifs" radius={[4, 0, 0, 4]} />
          <Bar dataKey="inactive" stackId="status" fill="#f59e0b" name="Désactivés" />
          <Bar dataKey="detached" stackId="status" fill="#64748b" name="Détachés" radius={[0, 4, 4, 0]} />
          <Bar dataKey="withEq" stackId="equip" fill="#059669" name="Avec Equip." radius={[4, 0, 0, 4]} />
          <Bar dataKey="withoutEq" stackId="equip" fill="#ef4444" name="Sans Equip." radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>
)

export default function GLPIDashboard({ onViewAllNotifications }: { onViewAllNotifications?: () => void }) {
  void onViewAllNotifications
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [activeTrendSeries, setActiveTrendSeries] = useState<TrendSeriesKey | null>(null)
  const [users, setUsers] = useState<UserEntity[]>([])
  const [mobiles, setMobiles] = useState<Mobile[]>([])
  const [sims, setSims] = useState<CarteSim[]>([])
  const [internetLines, setInternetLines] = useState<LigneInternet[]>([])
  const [materiels, setMateriels] = useState<Materiel[]>([])

  const fetchDashboardData = async () => {
    let hasWarmCache = false

    try {
      const cachedRaw = sessionStorage.getItem(DASHBOARD_CACHE_KEY)
      if (cachedRaw) {
        const cached = JSON.parse(cachedRaw) as { timestamp?: number; data?: DashboardSummaryPayload }
        if (cached?.timestamp && cached?.data && Date.now() - cached.timestamp < DASHBOARD_CACHE_TTL_MS) {
          applySummary(cached.data)
          hasWarmCache = true
          setLoading(false)
        }
      }

      if (!hasWarmCache) {
        setLoading(true)
      }
      const summaryRes = await api.get("/dashboard/summary")
      const summary = summaryRes.data || {}
      applySummary(summary)
      sessionStorage.setItem(DASHBOARD_CACHE_KEY, JSON.stringify({
        timestamp: Date.now(),
        data: summary,
      }))
    } finally {
      if (!hasWarmCache) {
        setLoading(false)
      }
    }
  }

  const applySummary = (summary: DashboardSummaryPayload) => {
    setUsers(Array.isArray(summary.users) ? summary.users : [])
    setMobiles(Array.isArray(summary.mobiles) ? summary.mobiles : [])
    setSims(Array.isArray(summary.sims) ? summary.sims : [])
    setInternetLines(Array.isArray(summary.internetLines) ? summary.internetLines : [])
    setMateriels(Array.isArray(summary.materiels) ? summary.materiels : [])
  }

  useEffect(() => {
    void fetchDashboardData()
  }, [])

  useVisiblePolling(() => fetchDashboardData(), 5000, [user?.id, user?.userId, user?.role])

  const currentUserRecord = useMemo(() => {
    const authUserId = Number(user?.userId ?? user?.id)
    if (!authUserId) return undefined
    return users.find((item) => item.id === authUserId)
  }, [users, user?.id, user?.userId])

  const isManager = user?.role === "Manager"
  const managerAgenceId = currentUserRecord?.agence?.id
  const managerAgenceName = currentUserRecord?.agence?.nom || "Mon agence"

  const scopedUsers = useMemo(() => {
    if (!isManager || !managerAgenceId) return users
    return users.filter((item) => item.agence?.id === managerAgenceId)
  }, [users, isManager, managerAgenceId])

  const scopedMobiles = useMemo(() => {
    if (!isManager || !managerAgenceId) return mobiles
    return mobiles.filter((item) => item.agenceId === managerAgenceId)
  }, [mobiles, isManager, managerAgenceId])

  const scopedSims = useMemo(() => {
    if (!isManager || !managerAgenceId) return sims
    return sims.filter((item) => item.agenceId === managerAgenceId)
  }, [sims, isManager, managerAgenceId])

  const scopedInternetLines = useMemo(() => {
    if (!isManager || !managerAgenceId) return internetLines
    return internetLines.filter((item) => item.agenceId === managerAgenceId)
  }, [internetLines, isManager, managerAgenceId])

  const scopedMateriels = useMemo(() => {
    if (!isManager || !managerAgenceId) return materiels
    return materiels.filter((item) => item.agenceId === managerAgenceId)
  }, [materiels, isManager, managerAgenceId])
  const totalAssets = scopedMobiles.length + scopedSims.length + scopedInternetLines.length + scopedMateriels.length
  const activeUsers = scopedUsers.filter((item) => ["active", "activated", "actif"].includes(normalizeStatus(item.status))).length
  const inactiveUsers = scopedUsers.length - activeUsers
  const assignedMobiles = scopedMobiles.filter((item) => isAssignedAsset(item)).length
  const assignedSims = scopedSims.filter((item) => ["affecter", "recu", "en_attente", "annuler"].includes(normalizeAssignStatus(item.statusAffectation))).length
  const assignedInternet = scopedInternetLines.filter((item) => ["affecter", "recu", "en_attente", "annuler"].includes(normalizeAssignStatus(item.statusAffectation))).length
  const assignedMateriels = scopedMateriels.filter((item) => isAssignedAsset(item)).length
  const assignedAssets = assignedMobiles + assignedSims + assignedInternet + assignedMateriels
  const availableAssets = Math.max(totalAssets - assignedAssets, 0)
  const activeInternet = scopedInternetLines.filter((item) => normalizeStatus(item.status) === "active").length
  const activeSims = scopedSims.filter((item) => normalizeStatus(item.status) === "active").length
  const compliantMateriels = scopedMateriels.filter((item) => ["bon", "moyen"].includes(normalizeStatus(item.status))).length
  const protectedUsers = activeUsers + assignedAssets
  const operationalCoverage = Math.min(assignedAssets, activeUsers)
  const reserveRatio = percentage(availableAssets, totalAssets)
  const assetsPerActiveEmployee = activeUsers ? (assignedAssets / activeUsers).toFixed(1) : "0.0"

  const kpiData = [
    { label: isManager ? "Collaborateurs agence" : "Collaborateurs suivis", value: scopedUsers.length, accent: "text-blue-600", bg: "bg-blue-50", icon: Users, helper: `${activeUsers} actifs, ${inactiveUsers} inactifs` },
    { label: "Parc exploitable", value: assignedAssets, accent: "text-emerald-600", bg: "bg-emerald-50", icon: ShieldCheck, helper: `${percentage(assignedAssets, totalAssets)} du parc est affecte` },
    { label: "Capacite disponible", value: availableAssets, accent: "text-cyan-600", bg: "bg-cyan-50", icon: Boxes, helper: `${percentage(availableAssets, totalAssets)} encore mobilisable` },
    { label: "Employes couverts", value: operationalCoverage, accent: "text-amber-600", bg: "bg-amber-50", icon: Activity, helper: `${percentage(operationalCoverage, activeUsers)} des actifs disposent d'une ressource` },
    { label: "Flotte mobile", value: scopedMobiles.length, accent: "text-violet-600", bg: "bg-violet-50", icon: Smartphone, helper: `${assignedMobiles} terminaux en service` },
    { label: "Connectivite SIM", value: activeSims, accent: "text-fuchsia-600", bg: "bg-fuchsia-50", icon: Network, helper: `${percentage(activeSims, scopedSims.length)} de SIM actives` },
    { label: "Connectivite internet", value: activeInternet, accent: "text-sky-600", bg: "bg-sky-50", icon: Wifi, helper: `${percentage(activeInternet, scopedInternetLines.length)} de lignes actives` },
    { label: isManager ? "Perimetre manager" : "Couverture reseau", value: isManager ? 1 : new Set(scopedUsers.map((item) => item.agence?.id).filter(Boolean)).size, accent: "text-slate-700", bg: "bg-slate-100", icon: Building2, helper: isManager ? managerAgenceName : "Agences couvertes" },
  ]

  const materielBreakdown = useMemo(() => {
    const counts = new Map<string, number>()
    scopedMateriels.forEach((item) => {
      const key = item.typeMateriel || "Autres"
      counts.set(key, (counts.get(key) || 0) + 1)
    })
    return Array.from(counts.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [scopedMateriels])

  const assetCategoryData = useMemo(() => {
    const rows = [
      { name: "Mobile", value: scopedMobiles.length, color: COLORS[0] },
      { name: "SIM", value: scopedSims.length, color: COLORS[1] },
      { name: "Internet", value: scopedInternetLines.length, color: COLORS[2] },
      { name: "Materiel", value: scopedMateriels.length, color: COLORS[3], materialDetails: materielBreakdown },
    ]
    return rows.filter((row) => row.value > 0)
  }, [scopedMobiles.length, scopedSims.length, scopedInternetLines.length, scopedMateriels.length, materielBreakdown])

  const assignmentStatusData = [
    { name: "Affect.", fullName: "Affectes", value: assignedAssets, fill: "#1d4ed8" },
    { name: "Dispo.", fullName: "Disponibles", value: availableAssets, fill: "#059669" },
  ]

  const employeeInsightData = [
    { label: "Employes actifs", value: activeUsers, helper: `${inactiveUsers} inactifs`, accent: "text-blue-600" },
    { label: "Employes couverts", value: operationalCoverage, helper: `${percentage(operationalCoverage, activeUsers)} des actifs equipes`, accent: "text-emerald-600" },
    { label: "Actifs non couverts", value: Math.max(activeUsers - operationalCoverage, 0), helper: "Reste a equiper", accent: "text-amber-600" },
    { label: "Assets / actif", value: assetsPerActiveEmployee, helper: `${reserveRatio} du parc en reserve`, accent: "text-violet-600" },
  ]

  const userStatusData = [
    { name: "Actifs", value: activeUsers, fill: "#2563eb" },
    { name: "Inactifs", value: inactiveUsers, fill: "#f59e0b" },
  ]

  const materielHealthData = useMemo(() => {
    const counts = new Map<string, number>()
    scopedMateriels.forEach((item) => {
      const key = item.status || "Inconnu"
      counts.set(key, (counts.get(key) || 0) + 1)
    })

    return Array.from(counts.entries()).map(([name, value], index) => ({
      name,
      value,
      color: COLORS[(index + 2) % COLORS.length],
    }))
  }, [scopedMateriels])

  const assignmentHistoryData = useMemo(() => {
    const statusOrder = [
      { key: "affecter", name: "Affectes", fill: "#2563eb" },
      { key: "recu", name: "Recus", fill: "#059669" },
      { key: "en_attente", name: "En attente", fill: "#f59e0b" },
      { key: "annuler", name: "Annules", fill: "#dc2626" },
      { key: "disponible", name: "Disponibles", fill: "#64748b" },
    ]

    const entries = [
      ...scopedMobiles.map((item) => item.statusAffectation),
      ...scopedSims.map((item) => item.statusAffectation),
      ...scopedInternetLines.map((item) => item.statusAffectation),
      ...scopedMateriels.map((item) => item.statusAffectation),
    ]

    return statusOrder.map((status) => ({
      name: status.name,
      value: entries.filter((entry) => {
        const normalized = normalizeAssignStatus(entry)
        if (!normalized) return status.key === "disponible"
        return normalized === status.key
      }).length,
      fill: status.fill,
    }))
  }, [scopedMobiles, scopedSims, scopedInternetLines, scopedMateriels])

  const creationTrendData = useMemo(() => {
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const start = new Date(now)
    start.setDate(start.getDate() - 49)

    const points = Array.from({ length: 8 }, (_, index) => {
      const pointDate = new Date(start)
      pointDate.setDate(start.getDate() + (index * 7))
      return {
        stamp: pointDate.getTime(),
        date: formatShortDate(pointDate),
        mobiles: 0,
        sims: 0,
        internet: 0,
        materiels: 0,
      }
    })

    const addBucket = (dateValue: string | undefined, key: "mobiles" | "sims" | "internet" | "materiels") => {
      if (!dateValue) return
      const createdAt = new Date(dateValue)
      if (Number.isNaN(createdAt.getTime())) return

      let closestPoint = points[0]
      let closestGap = Math.abs(createdAt.getTime() - points[0].stamp)
      points.forEach((point) => {
        const gap = Math.abs(createdAt.getTime() - point.stamp)
        if (gap < closestGap) {
          closestGap = gap
          closestPoint = point
        }
      })

      closestPoint[key] += 1
    }

    scopedMobiles.forEach((item) => addBucket(item.dateCreation, "mobiles"))
    scopedSims.forEach((item) => addBucket(item.dateCreation, "sims"))
    scopedInternetLines.forEach((item) => addBucket(item.dateCreation, "internet"))
    scopedMateriels.forEach((item) => addBucket(item.dateCreation, "materiels"))

    const hasData = points.some((point) => point.mobiles || point.sims || point.internet || point.materiels)
    if (hasData) return points

    return points.map((point, index) => ({
      ...point,
      mobiles: index === points.length - 1 ? scopedMobiles.length : 0,
      sims: index === points.length - 1 ? scopedSims.length : 0,
      internet: index === points.length - 1 ? scopedInternetLines.length : 0,
      materiels: index === points.length - 1 ? scopedMateriels.length : 0,
    }))
  }, [scopedMobiles, scopedSims, scopedInternetLines, scopedMateriels])

  const mobileTypeData = useMemo(() => {
    const counts = new Map<string, number>()
    scopedMobiles.forEach((item) => {
      const type = item.type ? item.type.toUpperCase() : "INCONNU"
      counts.set(type, (counts.get(type) || 0) + 1)
    })
    return Array.from(counts.entries()).map(([name, value], index) => ({
      name,
      value,
      fill: COLORS[index % COLORS.length],
    }))
  }, [scopedMobiles])

  const usersWithEquipment = useMemo(() => {
    const userIds = new Set<number>()
    scopedMateriels.forEach(m => { if (m.userId) userIds.add(m.userId) })
    scopedMobiles.forEach(m => { if (m.userId) userIds.add(m.userId) })
    return userIds
  }, [scopedMateriels, scopedMobiles])

  const buildGroupingData = (propertyName: "agence" | "departement" | "entrepot") => {
    const map = new Map<string, { active: number, inactive: number, detached: number, withEq: number, withoutEq: number }>()

    scopedUsers.forEach(u => {
      let key = "Non defini"
      if (propertyName === "agence" && u.agence?.nom) key = u.agence.nom
      else if (propertyName === "departement" && u.departement?.nom) key = u.departement.nom
      else if (propertyName === "entrepot" && u.entrepot?.nom) key = u.entrepot.nom
      
      if (!map.has(key)) {
        map.set(key, { active: 0, inactive: 0, detached: 0, withEq: 0, withoutEq: 0 })
      }
      const stats = map.get(key)!
      
      const status = normalizeStatus(u.status)
      if (["active", "activated", "actif"].includes(status)) stats.active++
      else if (status === "detacher" || status === "detached") stats.detached++
      else stats.inactive++
      
      if (usersWithEquipment.has(u.id)) stats.withEq++
      else stats.withoutEq++
    })

    return Array.from(map.entries()).map(([name, stats]) => ({ name, ...stats }))
  }

  const agencyData = useMemo(() => buildGroupingData("agence"), [scopedUsers, usersWithEquipment])
  const departementData = useMemo(() => buildGroupingData("departement"), [scopedUsers, usersWithEquipment])
  const entrepotData = useMemo(() => buildGroupingData("entrepot"), [scopedUsers, usersWithEquipment])

  const trendSeries = [
    { key: "mobiles" as const, label: "mobiles", stroke: "#7c3aed" },
    { key: "sims" as const, label: "sims", stroke: "#1d4ed8" },
    { key: "internet" as const, label: "internet", stroke: "#0891b2" },
    { key: "materiels" as const, label: "materiels", stroke: "#ea580c" },
  ]
  return (
    <div className="min-h-full space-y-6 bg-background p-4 lg:p-6">
      <div className="animate-fade-in-up flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Tableau de Bord</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isManager ? `Vue agence : ${managerAgenceName}` : "Vue globale des ressources, utilisateurs et equipements"}
          </p>
        </div>
        {loading && (
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground">
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            Synchronisation...
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 lg:gap-4">
        {kpiData.map((kpi) => {
          const Icon = kpi.icon
          return (
            <div key={kpi.label} className="relative overflow-hidden rounded-2xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{kpi.label}</p>
                  <p className="mt-2 text-3xl font-bold text-foreground">{kpi.value}</p>
                  <div className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground">
                    <ArrowUpRight className={`h-3 w-3 ${kpi.accent}`} />
                    <span>{kpi.helper}</span>
                  </div>
                </div>
                <div className={`rounded-2xl p-3 ${kpi.bg}`}>
                  <Icon className={`h-5 w-5 ${kpi.accent}`} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3 lg:gap-5">
        <div className="rounded-2xl border border-border bg-card p-5 xl:col-span-2">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-foreground">Composition du parc</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">Vue macro par famille d'actifs avec detail materiel au survol</p>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={assetCategoryData} margin={{ top: 10, right: 20, left: -10, bottom: 20 }}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis dataKey="name" fontSize={12} stroke="var(--muted-foreground)" tickLine={false} angle={-20} textAnchor="end" height={70} />
              <YAxis fontSize={12} stroke="var(--muted-foreground)" tickLine={false} axisLine={false} />
              <Tooltip content={<DashboardTooltip />} />
              <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                {assetCategoryData.map((entry, index) => (
                  <Cell key={entry.name} fill={entry.color || COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-foreground">Disponibilite operationnelle</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">Part du parc deja mobilisee face a la reserve encore exploitable</p>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={assignmentStatusData}
                cx="50%"
                cy="50%"
                outerRadius={96}
                innerRadius={58}
                dataKey="value"
                labelLine={false}
                label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                fontSize={11}
              >
                {assignmentStatusData.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip content={<DashboardTooltip />} />
              <Legend formatter={(value, entry: any) => entry?.payload?.fullName || value} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 lg:gap-5">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-foreground">Entrees de parc</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">Courbes lissees par jalons de 7 jours avec filtre par famille directement sous le graphe</p>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={creationTrendData} margin={{ top: 10, right: 16, left: -12, bottom: 10 }}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis dataKey="date" fontSize={12} stroke="var(--muted-foreground)" tickLine={false} />
              <YAxis fontSize={12} stroke="var(--muted-foreground)" tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip content={<DashboardTooltip />} cursor={{ stroke: "#94a3b8", strokeDasharray: "4 4" }} />
              {trendSeries.map((series) => {
                if (activeTrendSeries && activeTrendSeries !== series.key) return null
                return (
                  <Line
                    key={series.key}
                    type="basis"
                    dataKey={series.key}
                    name={series.label}
                    stroke={series.stroke}
                    strokeWidth={2.5}
                    dot={{ r: 3, strokeWidth: 2 }}
                    activeDot={{ r: 6 }}
                  />
                )
              })}
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-4 flex flex-wrap gap-2 translate-x-24">
            {trendSeries.map((series) => {
              const isActive = activeTrendSeries === series.key
              const isDimmed = activeTrendSeries !== null && !isActive
              return (
                <button
                  key={series.key}
                  type="button"
                  onClick={() => setActiveTrendSeries((current) => current === series.key ? null : series.key)}
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition ${isActive ? "border-foreground bg-foreground text-background" : "border-border bg-background text-foreground"} ${isDimmed ? "opacity-45" : ""}`}
                >
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: series.stroke }} />
                  <span>{series.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-foreground">Sante des comptes</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">{isManager ? "Lecture des comptes de votre agence" : "Vision globale des comptes actifs et inactifs"}</p>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={userStatusData} margin={{ top: 10, right: 20, left: -10, bottom: 10 }}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis dataKey="name" fontSize={12} stroke="var(--muted-foreground)" tickLine={false} />
              <YAxis fontSize={12} stroke="var(--muted-foreground)" tickLine={false} axisLine={false} />
              <Tooltip content={<DashboardTooltip />} />
              <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                {userStatusData.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 lg:gap-5">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-foreground">Vue employes</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">Lecture rapide de la couverture collaborateurs et du niveau d'equipement</p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {employeeInsightData.map((item) => (
              <div key={item.label} className="rounded-xl bg-secondary/40 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{item.label}</p>
                <p className={`mt-1 text-2xl font-bold ${item.accent}`}>{item.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{item.helper}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-foreground">Historique d'affectation</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">Repartition des statuts d'affectation sur l'ensemble du parc visible</p>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={assignmentHistoryData} margin={{ top: 10, right: 12, left: -16, bottom: 0 }}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis dataKey="name" fontSize={12} stroke="var(--muted-foreground)" tickLine={false} />
              <YAxis fontSize={12} stroke="var(--muted-foreground)" tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip content={<DashboardTooltip />} />
              <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                {assignmentHistoryData.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {!isManager && (
        <div className="space-y-4 lg:space-y-5">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 lg:gap-5 border-t border-border pt-6">
            <div className="rounded-2xl border border-border bg-card p-5 flex flex-col">
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-foreground">Répartition des Terminaux Mobiles</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">Volume par type de terminaux en flotte</p>
              </div>
              <div className="flex-1 min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={mobileTypeData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      innerRadius={60}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                      fontSize={11}
                    >
                      {mobileTypeData.map((entry) => (
                        <Cell key={entry.name} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip content={<DashboardTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            {agencyData.length > 0 && <UserGroupChart title="Utilisateurs par Agence" data={agencyData} />}
          </div>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 lg:gap-5">
            {departementData.length > 0 && <UserGroupChart title="Utilisateurs par Département" data={departementData} />}
            {entrepotData.length > 0 && <UserGroupChart title="Utilisateurs par Entrepôt" data={entrepotData} />}
          </div>
        </div>
      )}
    </div>
  )
}
