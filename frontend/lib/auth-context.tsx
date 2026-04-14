"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import api from "@/lib/api"

export interface User {
  id: number | string;      // Compte ID
  userId?: number | string; // Users table ID (from Compte.user_id)
  name: string;
  email: string;
  role: "Agent" | "HR" | "Administrateur" | "Manager" | "Gestionnaire";
  token?: string;
  subordinates?: string[];
  gestionnaireType?: "administrateur" | "chef-agence";
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
  // FIX: Start true so the app waits
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const initializeAuth = () => {
      try {
        // Safe check for browser environment
        if (typeof window !== "undefined") {
          const storedUser = localStorage.getItem("user");
          const token = localStorage.getItem("token");

          if (storedUser && token) {
            setUser(JSON.parse(storedUser));
          }
        }
      } catch (error) {
        console.error("Failed to restore session:", error);
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      } finally {
        // ALWAYS turn off loading, whether found or not
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await api.post("/auth/login", {
        login: email,
        password: password
      });

      const data = response.data;

      const userData: User = {
        id: data.id,
        userId: data.userId,
        name: data.username,
        email: data.email,
        role: data.role as User["role"],
        token: data.accessToken
      };

      localStorage.setItem("token", data.accessToken);
      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);

      return true;
    } catch (error) {
      console.error("Login failed:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    window.location.href = "/";
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
