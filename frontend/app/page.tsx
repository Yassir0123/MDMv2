"use client"

import { useAuth } from "@/lib/auth-context"
import LoginPage from "@/components/login-page"
import GLPIDashboardWrapper from "@/components/glpi-dashboard-wrapper"

export default function Home() {
  // 1. Get isLoading from the hook
  const { user, isLoading } = useAuth()

  // 2. BLOCK rendering while the app checks localStorage
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  // 3. Only show Login if loading is finished AND no user is found
  if (!user) {
    return <LoginPage />
  }

  // 4. Otherwise, show Dashboard
  return <GLPIDashboardWrapper />
}