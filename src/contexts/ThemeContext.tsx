'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

const STORAGE_KEY = 'plify-theme'

type ThemeMode = 'light' | 'dark'

type ThemeContextValue = {
  mode: ThemeMode
  setTheme: (mode: ThemeMode) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function applyDom(mode: ThemeMode) {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle('dark', mode === 'dark')
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('light')

  useEffect(() => {
    let initial: ThemeMode = 'light'
    try {
      const s = localStorage.getItem(STORAGE_KEY) as ThemeMode | null
      if (s === 'dark' || s === 'light') initial = s
    } catch {
      // ignore
    }
    setModeState(initial)
    applyDom(initial)
  }, [])

  const setTheme = useCallback((m: ThemeMode) => {
    setModeState(m)
    try {
      localStorage.setItem(STORAGE_KEY, m)
    } catch {
      // ignore
    }
    applyDom(m)
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme(mode === 'dark' ? 'light' : 'dark')
  }, [mode, setTheme])

  const value = useMemo(
    () => ({ mode, setTheme, toggleTheme }),
    [mode, setTheme, toggleTheme]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return ctx
}
