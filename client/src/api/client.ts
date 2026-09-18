import axios, {
  AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios'

/**
 * Singura instanță axios a aplicației. Toate apelurile trec prin ea — nicio
 * componentă nu construiește URL-uri absolute (plan §9.3).
 *
 * În dev, VITE_API_BASE_URL este gol, deci baza rămâne relativă (`/api`) și
 * cererile merg prin proxy-ul din vite.config.ts.
 */
const baseURL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/+$/, '') ?? ''

export const api: AxiosInstance = axios.create({
  baseURL: baseURL || undefined,
  withCredentials: true, // necesar pentru cookie-ul HttpOnly de refresh
  headers: { 'Content-Type': 'application/json' },
})

// ---------------------------------------------------------------------------
// Access token — ținut EXCLUSIV în memorie, niciodată în localStorage (plan §7).
// ---------------------------------------------------------------------------
let accessToken: string | null = null
let onAuthLost: (() => void) | null = null

export function setAccessToken(token: string | null): void {
  accessToken = token
}

export function getAccessToken(): string | null {
  return accessToken
}

/** Apelat când reîmprospătarea eșuează definitiv — AuthProvider golește starea. */
export function setOnAuthLost(handler: (() => void) | null): void {
  onAuthLost = handler
}

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

// ---------------------------------------------------------------------------
// La 401: o singură încercare de refresh, apoi reluarea cererii originale.
// ---------------------------------------------------------------------------
type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean }

let refreshPromise: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  refreshPromise ??= (async () => {
    try {
      const response = await axios.post<{ accessToken: string }>(
        `${baseURL}/api/auth/refresh`,
        {},
        { withCredentials: true },
      )
      const token = response.data?.accessToken ?? null
      setAccessToken(token)
      return token
    } catch {
      setAccessToken(null)
      return null
    } finally {
      refreshPromise = null
    }
  })()

  return refreshPromise
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetriableConfig | undefined
    const status = error.response?.status
    const url = config?.url ?? ''

    const isAuthEndpoint = url.includes('/api/auth/login') || url.includes('/api/auth/refresh')

    if (status === 401 && config && !config._retried && !isAuthEndpoint) {
      config._retried = true
      const token = await refreshAccessToken()

      if (token) {
        config.headers = config.headers ?? {}
        config.headers.Authorization = `Bearer ${token}`
        return api.request(config)
      }

      onAuthLost?.()
    }

    return Promise.reject(error)
  },
)

// ---------------------------------------------------------------------------
// Erori — mesaj lizibil din ProblemDetails / ValidationProblemDetails.
// ---------------------------------------------------------------------------
export interface ProblemDetails {
  title?: string
  detail?: string
  status?: number
  errors?: Record<string, string[]>
}

export function getErrorMessage(error: unknown, fallback = 'A apărut o eroare. Încearcă din nou.'): string {
  if (axios.isAxiosError(error)) {
    const problem = error.response?.data as ProblemDetails | undefined

    if (problem?.errors) {
      const first = Object.values(problem.errors).flat()[0]
      if (first) return first
    }

    if (error.response?.status === 429) {
      return 'Prea multe încercări. Te rugăm să reîncerci mai târziu.'
    }

    return problem?.detail ?? problem?.title ?? error.message ?? fallback
  }

  return error instanceof Error ? error.message : fallback
}

/** Erorile de validare pe câmpuri, pentru afișare lângă inputuri. */
export function getFieldErrors(error: unknown): Record<string, string> {
  if (!axios.isAxiosError(error)) return {}

  const problem = error.response?.data as ProblemDetails | undefined
  if (!problem?.errors) return {}

  return Object.fromEntries(
    Object.entries(problem.errors)
      .filter(([, messages]) => messages.length > 0)
      .map(([field, messages]) => [field.charAt(0).toLowerCase() + field.slice(1), messages[0]]),
  )
}

export default api
