"use client"

import * as React from "react"

interface ThemeProviderProps {
  children: React.ReactNode
  defaultTheme?: "light" | "dark" | "system"
  storageKey?: string
}

export function ThemeProvider({ children, defaultTheme = "system", storageKey = "theme" }: ThemeProviderProps) {
  const [theme, setTheme] = React.useState<"light" | "dark">(() => {
    const stored = localStorage.getItem(storageKey)
    if (stored === "light" || stored === "dark") {
      return stored
    }
    if (defaultTheme === "system") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
    }
    return defaultTheme as "light" | "dark"
  })

  React.useEffect(() => {
    const root = document.documentElement
    if (theme === "dark") {
      root.classList.add("dark")
    } else {
      root.classList.remove("dark")
    }
    localStorage.setItem(storageKey, theme)
  }, [theme, storageKey])

  return <div suppressHydrationWarning>{children}</div>
}
