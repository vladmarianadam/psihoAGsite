import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'

import { setAccessToken, setOnAuthLost } from '../../../api/client'
import {
  getCurrentUser,
  login as loginRequest,
  logout as logoutRequest,
  refresh as refreshRequest,
} from '../../../api/auth'
import type { AuthResultDto, CurrentUserDto } from '../../../api/types'

export type AuthStatus = 'loading' | 'authenticated' | 'anonymous'

export interface AuthContextValue {
  user: CurrentUserDto | null
  status: AuthStatus
  login(username: string, password: string): Promise<CurrentUserDto>
  logout(): Promise<void>
  refreshUser(): Promise<void>
}

/** Reînnoim access tokenul cu un minut înainte de expirare (plan §7). */
const RENEW_MARGIN_MS = 60_000
/** Chiar dacă tokenul e aproape expirat, nu reînnoim într-o buclă strânsă. */
const MIN_RENEW_DELAY_MS = 5_000

const AuthContext = createContext<AuthContextValue | null>(null)

/**
 * `expiresAtUtc` este un moment UTC; unele configurații de serializare îl trimit
 * fără sufixul „Z", iar `new Date(...)` l-ar interpreta ca oră locală.
 */
function parseUtcTimestamp(value: string): number {
  const normalized = /(?:Z|[+-]\d{2}:?\d{2})$/.test(value) ? value : `${value}Z`
  return new Date(normalized).getTime()
}

interface SessionExpiry {
  expiresAt: number
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUserDto | null>(null)
  const [status, setStatus] = useState<AuthStatus>('loading')
  // Obiect nou la fiecare reînnoire: schimbarea identității reprogramează timerul.
  const [session, setSession] = useState<SessionExpiry | null>(null)

  /** Prima încercare de refresh se face o singură dată, chiar și sub StrictMode. */
  const bootstrapRef = useRef<Promise<AuthResultDto> | null>(null)

  const applyAuthResult = useCallback((result: AuthResultDto) => {
    setAccessToken(result.accessToken)
    setUser(result.user)
    setSession({ expiresAt: parseUtcTimestamp(result.expiresAtUtc) })
    setStatus('authenticated')
  }, [])

  const clearSession = useCallback(() => {
    setAccessToken(null)
    setUser(null)
    setSession(null)
    setStatus('anonymous')
  }, [])

  // La montare: o singură încercare de refresh pe baza cookie-ului HttpOnly.
  // Un 401 este răspunsul normal când nu există sesiune — nu afișăm nicio eroare.
  //
  // Vizitatorii site-ului public NU declanșează acest apel: altfel fiecare pagină publică
  // ar face un POST /api/auth/refresh care se termină cu 401 (latență inutilă și eroare în
  // consola browserului). Panoul se încarcă oricum prin navigare completă, fiind în afara
  // layoutului public și fără linkuri către el (plan §7).
  useEffect(() => {
    let cancelled = false

    if (!window.location.pathname.startsWith('/management')) {
      clearSession()
      return
    }

    bootstrapRef.current ??= refreshRequest()

    bootstrapRef.current
      .then((result) => {
        if (!cancelled) applyAuthResult(result)
      })
      .catch(() => {
        if (!cancelled) clearSession()
      })

    return () => {
      cancelled = true
    }
  }, [applyAuthResult, clearSession])

  // Când interceptorul din client.ts constată că sesiunea s-a pierdut definitiv.
  useEffect(() => {
    setOnAuthLost(clearSession)
    return () => setOnAuthLost(null)
  }, [clearSession])

  // Reînnoire proactivă, ca utilizatorul să nu întâlnească un 401 în timpul lucrului.
  useEffect(() => {
    if (status !== 'authenticated' || session === null) return

    const delay = Math.max(session.expiresAt - Date.now() - RENEW_MARGIN_MS, MIN_RENEW_DELAY_MS)
    if (!Number.isFinite(delay)) return

    let cancelled = false
    const timer = window.setTimeout(() => {
      refreshRequest()
        .then((result) => {
          if (!cancelled) applyAuthResult(result)
        })
        .catch(() => {
          if (!cancelled) clearSession()
        })
    }, delay)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [session, status, applyAuthResult, clearSession])

  const login = useCallback(
    async (username: string, password: string): Promise<CurrentUserDto> => {
      const result = await loginRequest(username, password)
      applyAuthResult(result)
      return result.user
    },
    [applyAuthResult],
  )

  const logout = useCallback(async (): Promise<void> => {
    try {
      await logoutRequest()
    } catch {
      // Chiar dacă apelul eșuează (rețea, cookie deja expirat), golim starea locală.
    } finally {
      clearSession()
    }
  }, [clearSession])

  /** Reîncarcă datele utilizatorului (de exemplu după schimbarea parolei temporare). */
  const refreshUser = useCallback(async (): Promise<void> => {
    try {
      const current = await getCurrentUser()
      setUser(current)
    } catch {
      // Dacă sesiunea a expirat, interceptorul apelează deja onAuthLost.
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({ user, status, login, logout, refreshUser }),
    [user, status, login, logout, refreshUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Providerul și hookul stau intenționat în același modul (API-ul cerut de App.tsx),
// ceea ce dezactivează fast refresh doar pentru acest fișier.
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (context === null) {
    throw new Error('useAuth poate fi folosit numai în interiorul unui <AuthProvider>.')
  }
  return context
}
