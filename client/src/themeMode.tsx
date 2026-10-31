import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { flushSync } from 'react-dom'
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
  /** Cu `origin` (punctul apăsat), noua temă se dezvăluie într-un cerc care pornește de acolo. */
  toggleTheme: (origin?: { x: number; y: number }) => void
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

  const toggleTheme = useCallback(
    (origin?: { x: number; y: number }) => {
      const next: ThemeId = themeId === 'calm' ? 'seaside' : 'calm'
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

      // Fără View Transitions (sau cu mișcare redusă), tema se schimbă direct, cu tranziția de culoare din CSS.
      if (!origin || reduceMotion || !document.startViewTransition) {
        setThemeId(next)
        return
      }

      // Captura „după” trebuie să conțină deja noua temă, deci randarea se face sincron.
      const apply = () => {
        flushSync(() => setThemeId(next))
        document.documentElement.dataset.theme = next
      }

      const { x, y } = origin
      const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y))
      document.startViewTransition(apply).ready.then(() => {
        document.documentElement.animate(
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
          { duration: 800, easing: 'cubic-bezier(.6,0,.2,1)', pseudoElement: '::view-transition-new(root)' },
        )
      })
    },
    [themeId, setThemeId],
  )

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
