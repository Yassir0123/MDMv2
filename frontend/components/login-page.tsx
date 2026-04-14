"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { AlertCircle, Lock, Mail, User } from "lucide-react"
import { useNavigate } from "react-router-dom"

export default function LoginPage() {
  // --- 1. Original Logic & State ---
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const { login, isLoading } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!email || !password) {
      setError("Veuillez remplir tous les champs")
      return
    }

    // Your original connection handling
    const success = await login(email, password)

    if (!success) {
      setError("Email ou mot de passe incorrect")
    } else {
      // Navigate based on logic usually handled inside login or here
      navigate("/dashboard")
    }
  }

  // --- 2. Render (Target Design) ---
  return (
    <div className="min-h-screen flex font-sans text-slate-600">

      {/* LEFT SIDE - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-slate-50 px-8 sm:px-12 lg:px-16 xl:px-20 py-12">
        <div className="w-full max-w-md">

          {/* Top Section - Logo & Title */}
          <div className="mb-10 text-center">
            <div className="flex items-center justify-center gap-3 mb-3 translate-x-[-25px]">
              <img
                src="/assets/voie2.png"
                alt="MDM Logo"
                className="h-24 w-auto object-contain drop-shadow-md"
              />

              {/* Vertical Separator */}
              <div className="w-0.5 h-14 bg-gradient-to-b from-transparent via-gray-400 to-transparent"></div>

              <div>
                {/* APPLIED COLOR HERE */}
                <h1
                  className="text-4xl font-black tracking-tighter"
                  style={{ color: 'oklch(0.36 0.08 259.15)' }}
                >
                  MDM
                </h1>
              </div>
            </div>
          </div>

          {/* Login Content */}
          <div>
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-slate-900 mb-2">
                Bienvenue
              </h2>
              <p className="text-slate-600">
                Connectez-vous pour accéder à votre espace
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Error Alert */}
              {error && (
                <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg shadow-sm animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center">
                    <AlertCircle className="w-5 h-5 text-red-500 mr-3 flex-shrink-0" />
                    <span className="text-sm text-red-700 font-medium">{error}</span>
                  </div>
                </div>
              )}

              <div className="space-y-5">
                {/* Email Input */}
                <div className="space-y-1.5">
                  <label htmlFor="email" className="block text-sm font-semibold text-slate-700">
                    Email ou Identifiant
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Mail className="h-5 w-5" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading}
                      placeholder="marie.bernard@mdm.com"
                      className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-lg leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 sm:text-sm shadow-sm"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-1.5">
                  <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
                    Mot de passe
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock className="h-5 w-5" />
                    </div>
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                      placeholder="••••••••"
                      className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-lg leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 sm:text-sm shadow-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-lg shadow-lg hover:shadow-xl text-sm font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 mt-8"
                style={{
                  backgroundColor: 'oklch(0.36 0.08 259.15)',
                  // Optional: add a slight brightness filter on hover via style if not using Tailwind config
                }}
                onMouseOver={(e) => (e.currentTarget.style.filter = 'brightness(1.2)')}
                onMouseOut={(e) => (e.currentTarget.style.filter = 'brightness(1)')}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Connexion...
                  </span>
                ) : (
                  "Se connecter"
                )}
              </button>

              <div className="text-center pt-4">
                <p className="text-sm text-slate-400">
                  Contactez l'IT si vous avez oublié vos identifiants
                </p>
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="mt-12">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <p>
                © {new Date().getFullYear()} <span className="font-semibold text-slate-500">La Voie Express Group</span>
              </p>
              <p>Tous droits réservés</p>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE - Image Banner */}
      <div className="hidden lg:block lg:w-1/2 relative">
        {/* Decorative Separator Line */}
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-slate-200 to-transparent z-20"></div>

        {/* Shadow Overlay for depth */}
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-black/10 to-transparent z-20"></div>

        <div className="absolute inset-0 overflow-hidden bg-slate-900">
          <img
            src="/assets/banner2.png"
            alt="Login Banner"
            className="w-full h-full object-cover opacity-90"
            style={{
              boxShadow: '-20px 0 40px rgba(0, 0, 0, 0.15)'
            }}
          />

          {/* Elegant Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/20 via-transparent to-blue-900/20 mix-blend-overlay"></div>

          {/* Subtle Pattern */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
              backgroundSize: '32px 32px'
            }}
          ></div>
        </div>
      </div>

    </div>
  )
}