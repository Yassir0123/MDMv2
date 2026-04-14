import { Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider } from "@/lib/auth-context"
import AppLayout from "@/src/components/app-layout"
import LoginPage from "@/components/login-page"
import ProtectedRoute from "@/src/components/protected-route"

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        {/* Protected application routes */}
        <Route element={<ProtectedRoute />}>
          {/* Main dashboard route */}
          <Route path="/dashboard" element={<AppLayout />} />
          {/* Default root should also go to dashboard when logged in */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Route>
        {/* Fallback: send any unknown route to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  )
}
