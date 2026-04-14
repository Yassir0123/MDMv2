"use client"

import { useAuth } from "@/lib/auth-context"
import { Navigate, Outlet } from "react-router-dom"

export default function ProtectedRoute() {
  const { user, isLoading } = useAuth()

  // Wait for auth state to restore from localStorage on refresh
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
