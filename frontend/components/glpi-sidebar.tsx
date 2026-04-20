"use client"

import { useAuth } from "@/lib/auth-context"
import {
  Package, Users, Home, LogOut, X, Monitor, ChevronDown, Trash2, History,
  UserCheck, ClipboardList, Siren as SimToken, Cpu, Wifi, Smartphone,
  ShieldCheck, Building2, Users2, Settings2, UserMinus, LayoutDashboard, LifeBuoy
} from "lucide-react"
import { useState } from "react"

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

interface SidebarProps {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  currentPage: Page
  setCurrentPage: (page: Page) => void
  selectedUserId?: string
  setSelectedUserId?: (id: string | undefined) => void
  isGestionnaire: boolean
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   NavItem Component
   â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
interface NavItemProps {
  icon: React.ElementType
  label: string
  page: Page
  currentPage: Page
  onClick: (page: Page) => void
  indent?: boolean
}

function NavItem({ icon: Icon, label, page, currentPage, onClick, indent }: NavItemProps) {
  const isActive = currentPage === page
  return (
    <button
      onClick={() => onClick(page)}
      className={`group w-full flex items-center gap-3 rounded-lg transition-all duration-200 font-medium text-[13px]
        ${indent ? "pl-11 pr-3 py-2" : "px-3 py-2.5"}
        ${isActive
          ? "gradient-sidebar-active text-primary font-semibold shadow-sm border border-primary/10"
          : "text-sidebar-foreground hover:bg-sidebar-hover border border-transparent"
        }`}
    >
      <Icon className={`shrink-0 transition-colors duration-200
        ${indent ? "w-[15px] h-[15px]" : "w-4 h-4"}
        ${isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`}
      />
      <span className="truncate">{label}</span>
      {isActive && (
        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary animate-scale-in" />
      )}
    </button>
  )
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   NavGroup Component (expandable)
   â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
interface NavGroupProps {
  icon: React.ElementType
  label: string
  menuKey: string
  expanded: boolean
  onToggle: (key: string) => void
  children: React.ReactNode
}

function NavGroup({ icon: Icon, label, menuKey, expanded, onToggle, children }: NavGroupProps) {
  return (
    <div>
      <button
        onClick={() => onToggle(menuKey)}
        className="group w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sidebar-foreground hover:bg-sidebar-hover transition-all duration-200 font-medium text-[13px]"
      >
        <div className="flex items-center gap-3">
          <Icon className="w-4 h-4 shrink-0 text-muted-foreground group-hover:text-foreground transition-colors" />
          <span>{label}</span>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-300 ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${expanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}
      >
        <div className="py-1 space-y-0.5 pl-1">
          {children}
        </div>
      </div>
    </div>
  )
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   SIDEBAR
   â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
export default function GLPISidebar({
  isOpen,
  setIsOpen,
  currentPage,
  setCurrentPage,
  selectedUserId,
  setSelectedUserId,
  isGestionnaire,
}: SidebarProps) {
  const { user, logout } = useAuth()
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set(isGestionnaire ? ["resources"] : []))

  const toggleMenu = (menu: string) => {
    const newMenus = new Set(expandedMenus)
    if (newMenus.has(menu)) {
      newMenus.delete(menu)
    } else {
      newMenus.add(menu)
    }
    setExpandedMenus(newMenus)
  }

  const handlePageClick = (page: Page) => {
    setCurrentPage(page)
    if (window.innerWidth < 1024) {
      setIsOpen(false)
    }
    setSelectedUserId?.(undefined)
  }

  const isAdmin = user?.role === "Administrateur"
  const isManager = user?.role === "Manager"
  const isHR = user?.role === "HR"

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm lg:hidden z-30 animate-fade-in"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`fixed lg:relative z-40 h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300 ease-in-out
          ${isOpen
            ? "w-[260px] translate-x-0 shadow-xl lg:shadow-none"
            : "w-[260px] -translate-x-full lg:w-0 lg:translate-x-0 lg:overflow-hidden lg:border-none"
          }`}
      >
        {/* â”€â”€â”€ Logo Header â”€â”€â”€ */}
        <div className="h-29 flex-shrink-0 border-b border-sidebar-border flex items-center px-4 relative">
          <div className="cursor-pointer" onClick={() => handlePageClick(isGestionnaire ? "dashboard" : "user-dashboard")}>
            <img src="/assets/voie2.png" alt="Logo" className="max-h-[70%] w-auto object-contain" />
          </div>

          <button
            onClick={() => setIsOpen(false)}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-secondary rounded-lg lg:hidden transition-colors text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* â”€â”€â”€ Navigation â”€â”€â”€ */}
        <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-3 space-y-1">
          {isGestionnaire ? (
            <>
              {/* â”€â”€ SECTION: Overview â”€â”€ */}
              <p className="px-3 pt-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Général</p>
              <NavItem icon={LayoutDashboard} label="Tableau de Bord" page="dashboard" currentPage={currentPage} onClick={handlePageClick} />

              {/* â”€â”€ SECTION: Resources â”€â”€ */}
              <p className="px-3 pt-4 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Ressources</p>
              <NavGroup icon={ClipboardList} label="Ressources" menuKey="resources" expanded={expandedMenus.has("resources")} onToggle={toggleMenu}>
                <NavItem icon={Cpu} label="Cartes SIM" page="assets-sim" currentPage={currentPage} onClick={handlePageClick} indent />
                <NavItem icon={Wifi} label="Lignes Internet" page="assets-internet" currentPage={currentPage} onClick={handlePageClick} indent />
                <NavItem icon={Smartphone} label="Appareils Mobile" page="assets-mobile" currentPage={currentPage} onClick={handlePageClick} indent />
                <NavItem icon={Monitor} label="Parc Informatique" page="assets-materiels" currentPage={currentPage} onClick={handlePageClick} indent />
              </NavGroup>

              {/* â”€â”€ SECTION: Matériel â”€â”€ */}
              <NavGroup icon={Package} label="Matériel" menuKey="materiel-category" expanded={expandedMenus.has("materiel-category")} onToggle={toggleMenu}>
                {isAdmin && (
                  <NavItem icon={Trash2} label="Matériel Annulé" page="admin-materiel-annule" currentPage={currentPage} onClick={handlePageClick} indent />
                )}
                {isManager && (
                  <>
                    <NavItem icon={UserCheck} label="Matériel Affecté" page="chef-agence-materiel-affecte" currentPage={currentPage} onClick={handlePageClick} indent />
                    <NavItem icon={UserCheck} label="Matériel Collaborateurs" page="chef-agence-materiel-collaborateur" currentPage={currentPage} onClick={handlePageClick} indent />
                    <NavItem icon={History} label="Historique" page="chef-agence-materiel-historique" currentPage={currentPage} onClick={handlePageClick} indent />
                  </>
                )}
              </NavGroup>

              {/* â”€â”€ SECTION: Management â”€â”€ */}
              <p className="px-3 pt-4 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Administration</p>
              <NavGroup icon={Settings2} label="Management" menuKey="management" expanded={expandedMenus.has("management")} onToggle={toggleMenu}>
                {isManager ? (
                  <>
                    <NavItem icon={Building2} label="Départements" page="admin-departments" currentPage={currentPage} onClick={handlePageClick} indent />
                    <NavItem icon={Users} label="Mes Collaborateurs" page="user-subordinates" currentPage={currentPage} onClick={handlePageClick} indent />
                  </>
                ) : (
                  <>
                    <NavItem icon={Users2} label="Liste Utilisateurs" page="users-list" currentPage={currentPage} onClick={handlePageClick} indent />
                    <NavItem icon={Users} label="Employés" page="admin-employes" currentPage={currentPage} onClick={handlePageClick} indent />
                    <NavItem icon={Building2} label="Gestion Agences" page="admin-agence" currentPage={currentPage} onClick={handlePageClick} indent />
                    <NavItem icon={Building2} label="Départements" page="admin-departments" currentPage={currentPage} onClick={handlePageClick} indent />
                    <NavItem icon={UserMinus} label="Utilisateurs désactivés" page="users" currentPage={currentPage} onClick={handlePageClick} indent />
                  </>
                )}
              </NavGroup>

              <p className="px-3 pt-4 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Support</p>
              <NavItem icon={LifeBuoy} label="Helpdesk" page="helpdesk-tickets" currentPage={currentPage} onClick={handlePageClick} />
            </>
          ) : (
            <>
              {/* â”€â”€ AGENT / MANAGER USER VIEW â”€â”€ */}
              <p className="px-3 pt-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Général</p>
              <NavItem icon={LayoutDashboard} label="Tableau de Bord" page="user-dashboard" currentPage={currentPage} onClick={handlePageClick} />

              <p className="px-3 pt-4 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Matériel</p>
              {isManager ? (
                <NavGroup icon={Package} label="Matériel" menuKey="materiel" expanded={expandedMenus.has("materiel")} onToggle={toggleMenu}>
                  <NavItem icon={UserCheck} label="Matériel Affecté" page="chef-agence-materiel-affecte" currentPage={currentPage} onClick={handlePageClick} indent />
                  <NavItem icon={UserCheck} label="Matériel Collaborateurs" page="chef-agence-materiel-collaborateur" currentPage={currentPage} onClick={handlePageClick} indent />
                  <NavItem icon={History} label="Historique" page="chef-agence-materiel-historique" currentPage={currentPage} onClick={handlePageClick} indent />
                </NavGroup>
              ) : (
                <NavItem icon={Package} label="Matériels" page="chef-agence-materiel-affecte" currentPage={currentPage} onClick={handlePageClick} />
              )}

              {isHR && (
                <>
                  <p className="px-3 pt-4 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Administration</p>
                  <NavItem icon={Users} label="Collaborateurs RH" page="user-subordinates-hr" currentPage={currentPage} onClick={handlePageClick} />
                </>
              )}

              <p className="px-3 pt-4 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Support</p>
              <NavItem icon={LifeBuoy} label="Helpdesk" page="helpdesk-tickets" currentPage={currentPage} onClick={handlePageClick} />

              {isManager && (
                <>
                  <p className="px-3 pt-4 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Organisation</p>
                  <NavGroup icon={Settings2} label="Management" menuKey="management" expanded={expandedMenus.has("management")} onToggle={toggleMenu}>
                    <NavItem icon={Building2} label="Départements" page="admin-departments" currentPage={currentPage} onClick={handlePageClick} indent />
                    <NavItem icon={Users} label="Mes Collaborateurs" page="user-subordinates" currentPage={currentPage} onClick={handlePageClick} indent />
                  </NavGroup>
                </>
              )}
            </>
          )}
        </nav>

        {/* â”€â”€â”€ Footer â”€â”€â”€ */}
        {/*<div className="border-t border-sidebar-border px-3 py-3">
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-lg transition-all duration-200 font-medium text-[13px] group"
          >
            <LogOut className="w-4 h-4 group-hover:translate-x-[-2px] transition-transform duration-200" />
            <span>Déconnexion</span>
          </button>
        </div>*/}
      </aside>
    </>
  )
}
