"use client"

import type React from "react"
import { createContext, useContext, useState } from "react"
import { FAKE_USERS } from "./constants"

export interface User {
  id: string
  name: string
  email: string
  password: string
  department: string
  chief?: string
  role: "Gestionnaire" | "Agent"
  gestionnaireType?: "Chef d'Agence" | "Administrateur"
  dateJoining: string
  cin?: string
  matricule?: string
  status: "Attached" | "Detached" | "Deactivated" | "Activated"
  deactivationReason?: string
  deactivationDate?: string
  manager?: string
  subordinates?: string[]
  agency?: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 800))

    const foundUser = FAKE_USERS.find((u) => u.email === email && u.password === password)

    if (foundUser) {
      setUser(foundUser as User)
      setIsLoading(false)
      return true
    }

    setIsLoading(false)
    return false
  }

  const logout = () => {
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, isLoading, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}