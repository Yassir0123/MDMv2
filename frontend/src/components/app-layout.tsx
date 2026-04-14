"use client"
import { useAuth } from "@/lib/auth-context"
import GLPIDashboardWrapper from "@/components/glpi-dashboard-wrapper"

export default function AppLayout() {
  const { user } = useAuth()

  if (!user) {
    return null
  }

  // The wrapper handles all internal page navigation
  return <GLPIDashboardWrapper />
}
