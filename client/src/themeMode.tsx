import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { ThemeProvider } from '@mui/material/styles'

import { buildTheme, DEFAULT_THEME_ID, isThemeId, palettes, type ThemeId } from './theme'

/**
 * Cheia din localStorage în care se memorează tema aleasă de vizitator.
 * Aceeași valoare e citită de scriptul inline din index.html, înainte de React, ca să nu clipească.
 */
export const THEME_STORAGE_KEY = 'psiho-theme'

interface ThemeModeContextValue {
  themeId: ThemeId
  setThemeId: (id: ThemeId) => void
  toggleTheme: () => void
}

const ThemeModeContext = createContext<ThemeModeContextValue | null>(null)

function readStoredTheme(): ThemeId {
  if (typeof window === 'undefined') return DEFAULT_THEME_ID
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
    return isThemeId(stored) ? stored : DEFAULT_THEME_ID
  } catch {
    return DEFAULT_THEME_ID
  }
}

/**
 * Furnizează tema MUI activă și o sincronizează cu `<html data-theme>` (pentru variabilele
 * CSS din index.css) și cu `<meta name="theme-color">`. Alegerea persistă în localStorage.
 */
export function ThemeModeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeIdState] = useState<ThemeId>(readStoredTheme)

  const theme = useMemo(() => buildTheme(themeId), [themeId])

  useEffect(() => {
    document.documentElement.dataset.theme = themeId
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', palettes[themeId].primary)
  }, [themeId])

  const setThemeId = useCallback((id: ThemeId) => {
    setThemeIdState(id)
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, id)
    } catch {
      // Stocarea poate fi indisponibilă (mod privat) — tema rămâne activă doar în sesiune.
    }
  }, [])

  const toggleTheme = useCallback(() => {
    setThemeId(themeId === 'calm' ? 'seaside' : 'calm')
  }, [themeId, setThemeId])

  const value = useMemo(() => ({ themeId, setThemeId, toggleTheme }), [themeId, setThemeId, toggleTheme])

  return (
    <ThemeModeContext.Provider value={value}>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </ThemeModeContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useThemeMode(): ThemeModeContextValue {
  const context = useContext(ThemeModeContext)
  if (!context) throw new Error('useThemeMode trebuie folosit în interiorul ThemeModeProvider')
  return context
}
