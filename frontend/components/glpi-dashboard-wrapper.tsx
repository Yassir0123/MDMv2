'use client';

import { useState, useRef, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import GLPISidebar from "@/components/glpi-sidebar"
import GLPIDashboard from "@/components/glpi-dashboard"
import AssetsMaterielsPage from "@/components/assets-materiels-page"
import ManagerAssetsMobilePage from "@/components/assets-mobile-page-manager"
import ManagerAssetsInternetage from "@/components/assets-internet-page-manager"
import ManagerAssetsSIMPage from "@/components/assets-sim-page-manager"
import AssetsSIMPage from "@/components/assets-sim-page"
import AssetsInternetPage from "@/components/assets-internet-page"
import AssetsMobilePage from "@/components/assets-mobile-page"
import AffectationMaterielPage from "@/components/affectation-materiel-page"
import AffectationHistoryPage from "@/components/affectation-history-page-new"
import UsersManagementPage from "@/components/users-management-page"
import UserDashboardPage from "@/components/user-dashboard-page"
import UserMaterielUnifiedPage from "@/components/user-materiel-unified-page"
import UserAssignmentHistoryPage from "@/components/user-assignment-history-page"
import { LogOut, Home, PanelLeft, UserIcon, ChevronDown, Settings, Search, Moon, Sun } from "lucide-react"
import NotificationsButton from "@/components/notifications-button"
import NotificationsPage from "@/components/notifications-page"
import { useNotifications } from "@/lib/notifications"
import UserSubordinatesPageV2 from "@/components/user-subordinates-page-v2"
import UserSubordinatesPageRH from "@/components/user-subordinates-page-RH"
import MaterielAnnulePage from "@/components/materiel-annuler-page"
import AdminDepartmentsPage from "@/components/departments-page"
import AdminAccountsPage from "@/components/users-list-page"
import ChefAgenceEquipementPage from "@/components/chef-agence-equipement-page"
import ChefAgenceMaterielAffectePage from "@/components/chef-agence-materiel-affecte-page"
import ChefAgenceMaterielCollaborateurPage from "@/components/chef-agence-materiel-collaborateur-page"
import ChefAgenceMaterielHistoriquePage from "@/components/chef-agence-materiel-historique-page"
import AdminEquipementPage from "@/components/admin-equipement-page"
import AgencePage from "@/components/agence-page"
import AgenceDepartmentsPage from "@/components/agence-departments-page"
import EmployesPage from "@/components/employes-page"
import HelpdeskTicketsPage from "@/components/helpdesk-tickets-page"

type Page =
  | "dashboard"
  | "sim"
  | "sim-affecter"
  | "sim-non-affecter"
  | "internet"
  | "mobile"
  | "mobile-affecter"
  | "mobile-non-affecter"
  | "affectation"
  | "affectation-history"
  | "users"
  | "user-assignment-history"
  | "user-detail"
  | "user-dashboard"
  | "user-materiel"
  | "user-subordinates"
  | "user-subordinates-hr"
  | "user-notifications"
  | "admin-materiel-annule"
  | "admin-departments"
  | "admin-accounts"
  | "admin-equipement"
  | "admin-employes"
  | "admin-agence"
  | "admin-agence-departments"
  | "users-list"
  | "chef-agence-equipement"
  | "chef-agence-materiel-affecte"
  | "chef-agence-materiel-collaborateur"
  | "chef-agence-materiel-historique"
  | "assets-sim"
  | "assets-internet"
  | "assets-mobile"
  | "assets-materiels"
  | "helpdesk-tickets"

/* ─────────────────────────────────────────────
   Page Title Map
   ───────────────────────────────────────────── */
const PAGE_TITLES: Partial<Record<Page, string>> = {
  dashboard: "Tableau de Bord",
  "user-dashboard": "Mon Espace",
  "assets-sim": "Cartes SIM",
  "assets-internet": "Lignes Internet",
  "assets-mobile": "Appareils Mobile",
  "assets-materiels": "Parc Informatique",
  sim: "Cartes SIM",
  internet: "Lignes Internet",
  mobile: "Appareils Mobile",
  "admin-materiel-annule": "Matériel Annulé",
  "admin-departments": "Départements",
  "admin-accounts": "Comptes",
  "admin-equipement": "Équipements",
  "admin-employes": "Gestion des Employés",
  "admin-agence": "Gestion Agences",
  "users-list": "Liste Utilisateurs",
  users: "Utilisateurs Désactivés",
  "user-subordinates": "Mes Collaborateurs",
  "user-subordinates-hr": "Collaborateurs RH",
  "user-notifications": "Notifications",
  "helpdesk-tickets": "Helpdesk",
  "chef-agence-materiel-affecte": "Matériel Affecté",
  "chef-agence-materiel-collaborateur": "Matériel Collaborateurs",
  "chef-agence-materiel-historique": "Historique",
  affectation: "Affectation",
  "affectation-history": "Historique Affectations",
  "user-assignment-history": "Historique Assignations",
}

/* ─────────────────────────────────────────────
   User Dropdown
   ───────────────────────────────────────────── */
const UserDropdown = () => {
  const { user, logout } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 p-1.5 hover:bg-white/10 rounded-lg transition-all duration-200 outline-none focus:ring-2 focus:ring-white/20"
      >
        <div className="w-8 h-8 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-white flex items-center justify-center text-xs font-semibold">
          {user?.name?.charAt(0)?.toUpperCase() || "U"}
        </div>
        <div className="hidden sm:block text-left">
          <p className="text-[12px] font-semibold text-white leading-none">{user?.name}</p>
          <p className="text-[10px] text-white/60 mt-0.5">{user?.role}</p>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-white/70 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-card border border-border rounded-xl shadow-2xl z-50 py-1 animate-scale-in overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-secondary/30">
            <p className="text-sm font-semibold text-foreground truncate">{user?.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email || user?.role}</p>
          </div>

          <div className="py-1">
            <button
              className="w-full text-left px-4 py-2.5 text-sm text-foreground hover:bg-secondary flex items-center gap-2.5 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <Settings className="w-4 h-4 text-muted-foreground" />
              Paramètres
            </button>
          </div>

          <div className="border-t border-border py-1">
            <button
              onClick={logout}
              className="w-full text-left px-4 py-2.5 text-sm text-destructive hover:bg-destructive/5 flex items-center gap-2.5 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Déconnexion
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────
   MAIN WRAPPER
   ───────────────────────────────────────────── */
export default function GLPIDashboardWrapper() {
  const { user } = useAuth()
  const [currentPage, setCurrentPage] = useState<Page>(
    user?.role === "Agent" || user?.role === "HR" || user?.role === "Administrateur"
      ? (user?.role === "Administrateur" ? "dashboard" : "user-dashboard")
      : "dashboard"
  )
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>()
  const [pageKey, setPageKey] = useState(0) // for page transitions
  const {
    notifications,
    unreadCount,
    isLoading: notificationsLoading,
    isMutating: notificationsMutating,
    refresh: refreshNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications({ pollMs: 4000 })

  // Wrap setCurrentPage to trigger animation
  const navigateTo = (page: Page) => {
    setCurrentPage(page)
    setPageKey(prev => prev + 1)
  }

  /* const mockNotifications = [
    {
      id: "notif-1",
      type: "equipment-assigned",
      title: "Matériel affecté",
      message: "Une carte SIM vous a été affectée",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toLocaleString("fr-FR"),
      icon: "package",
      read: false,
    },
  ]

  const unreadCount = mockNotifications.filter((n) => !n.read).length */
  const isGestionnaire = user?.role === "Administrateur" || user?.role === "Manager";
  const isAdmin = user?.role === "Administrateur";
  const isManager = user?.role === "Manager";
  const isAgent = user?.role === "Agent";
  const isHR = user?.role === "HR";

  const getAffectationFilter = (page: Page): "all" | "affecter" | "non-affecter" => {
    if (page.includes("affecter")) {
      return page.includes("non-") ? "non-affecter" : "affecter"
    }
    return "all"
  }

  const renderPage = () => {
    // ADMINISTRATEUR & MANAGER rendering
    if (isAdmin || isManager) {
      switch (currentPage) {
        case "dashboard":
          return <GLPIDashboard onViewAllNotifications={() => navigateTo("user-notifications")} />
        case "user-notifications":
          return (
            <NotificationsPage
              notifications={notifications}
              isLoading={notificationsLoading}
              isMutating={notificationsMutating}
              onMarkAsRead={markAsRead}
              onMarkAllAsRead={markAllAsRead}
              onDeleteNotification={deleteNotification}
              onRefresh={refreshNotifications}
            />
          )
        case "user-subordinates":
          return <UserSubordinatesPageV2 />
        case "assets-sim":
        case "sim":
        case "sim-affecter":
        case "sim-non-affecter":
          return <AssetsSIMPage />
        case "assets-internet":
        case "internet":
          return <AssetsInternetPage />
        case "assets-mobile":
        case "mobile":
        case "mobile-affecter":
        case "mobile-non-affecter":
          return <AssetsMobilePage />
        case "assets-materiels":
          return <AssetsMaterielsPage />
        case "admin-equipement":
          return <AdminEquipementPage />
        case "admin-employes":
          return <EmployesPage />
        case "admin-materiel-annule":
          return <MaterielAnnulePage />
        case "users-list":
          return <AdminAccountsPage />
        case "admin-accounts":
          return <AdminAccountsPage />
        case "admin-agence":
          return <AgencePage />
        case "admin-departments":
          return <AdminDepartmentsPage />
        case "admin-agence-departments":
          return <AgenceDepartmentsPage />
        case "chef-agence-equipement":
          return <ChefAgenceEquipementPage />
        case "chef-agence-materiel-affecte":
          return <ChefAgenceMaterielAffectePage />
        case "chef-agence-materiel-collaborateur":
          return <ChefAgenceMaterielCollaborateurPage />
        case "chef-agence-materiel-historique":
          return <ChefAgenceMaterielHistoriquePage />
        case "affectation":
          return <AffectationMaterielPage />
        case "affectation-history":
          return <AffectationHistoryPage />
        case "users":
          return <UsersManagementPage />
        case "user-assignment-history":
          return <UserAssignmentHistoryPage />
        case "helpdesk-tickets":
          return <HelpdeskTicketsPage />
        default:
          return <GLPIDashboard onViewAllNotifications={() => navigateTo("user-notifications")} />
      }
    } else {
      // AGENT PAGES
      switch (currentPage) {
        case "user-dashboard":
          return <UserDashboardPage />
        case "chef-agence-materiel-affecte":
          return <ChefAgenceMaterielAffectePage />
        case "user-subordinates":
          return <UserSubordinatesPageV2 />
        case "user-subordinates-hr":
          return isHR ? <UserSubordinatesPageRH /> : <UserDashboardPage />
        case "user-notifications":
          return (
            <NotificationsPage
              notifications={notifications}
              isLoading={notificationsLoading}
              isMutating={notificationsMutating}
              onMarkAsRead={markAsRead}
              onMarkAllAsRead={markAllAsRead}
              onDeleteNotification={deleteNotification}
              onRefresh={refreshNotifications}
            />
          )
        case "admin-departments":
          return <AdminDepartmentsPage />
        case "helpdesk-tickets":
          return <HelpdeskTicketsPage />
        default:
          return <UserDashboardPage />
      }
    }
  }

  const pageTitle = PAGE_TITLES[currentPage] || "Dashboard"

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <GLPISidebar
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        currentPage={currentPage}
        setCurrentPage={navigateTo}
        selectedUserId={selectedUserId}
        setSelectedUserId={setSelectedUserId}
        isGestionnaire={isGestionnaire}
      />

      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        {/* ─── Header ─── */}
        <header className="h-14 flex-shrink-0 gradient-header text-white flex items-center justify-between px-4 lg:px-5 shadow-lg shadow-primary/10 z-20 w-full relative">
          <div className="flex items-center gap-3">
            {/* Sidebar toggle */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-white/10 rounded-lg text-white/80 hover:text-white transition-all duration-200"
              title={sidebarOpen ? "Masquer la barre latérale" : "Afficher la barre latérale"}
            >
              <PanelLeft className={`w-[18px] h-[18px] transition-transform duration-300 ${!sidebarOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Breadcrumb / Page title */}
            <div className="hidden sm:flex items-center gap-2">
              <button
                onClick={() => navigateTo(isGestionnaire ? "dashboard" : "user-dashboard")}
                className="text-white/50 hover:text-white/80 transition-colors"
              >
                <Home className="w-3.5 h-3.5" />
              </button>
              <span className="text-white/30 text-xs">/</span>
              <span className="text-white/90 text-[13px] font-medium">{pageTitle}</span>
            </div>

            {/* Mobile page title */}
            <span className="sm:hidden text-white/90 text-sm font-medium truncate max-w-[140px]">{pageTitle}</span>
          </div>

          <div className="flex items-center gap-2 lg:gap-3">
            {/* Notification bell */}
            <div className="text-white hover:text-white [&_button]:text-current">
              <NotificationsButton
                onClick={() => navigateTo("user-notifications")}
                unreadCount={unreadCount}
                notifications={notifications}
                isLoading={notificationsLoading}
              />
            </div>

            <div className="h-5 w-px bg-white/15 hidden sm:block" />

            {/* User dropdown */}
            <UserDropdown />
          </div>
        </header>

        {/* ─── Main Content ─── */}
        <main className="flex-1 overflow-auto bg-background relative z-0 scrollbar-thin">
          <div key={pageKey} className="animate-fade-in" style={{ animationDuration: "0.25s" }}>
            {renderPage()}
          </div>
        </main>
      </div>
    </div>
  )
}
