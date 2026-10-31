import { useEffect, useState } from 'react'

/** Cheia din localStorage în care se memorează alegerea vizitatorului. */
export const CONSENT_KEY = 'psiho-cookie-consent'

/** Eveniment intern emis la alegere; elementele flotante din josul paginii își refac poziția. */
export const CONSENT_EVENT = 'psiho-cookie-consent-change'

/** `true` dacă vizitatorul a ales deja (bannerul nu mai trebuie afișat). */
export function hasCookieChoice(): boolean {
  try {
    return window.localStorage.getItem(CONSENT_KEY) !== null
  } catch {
    // Stocarea locală poate fi indisponibilă (mod privat) — tratăm ca „fără alegere".
    return false
  }
}

/** Urmărește dacă bannerul de cookie-uri e afișat, ca elementele flotante să nu se suprapună cu el. */
export function useCookieBannerVisible(): boolean {
  const [visible, setVisible] = useState(() => !hasCookieChoice())

  useEffect(() => {
    const sync = () => setVisible(!hasCookieChoice())
    window.addEventListener(CONSENT_EVENT, sync)
    return () => window.removeEventListener(CONSENT_EVENT, sync)
  }, [])

  return visible
}
