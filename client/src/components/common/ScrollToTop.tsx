import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * La schimbarea rutei, revenim în capul paginii — altfel navigarea între
 * articole păstrează poziția de scroll anterioară.
 * Ancorele (#cuprins) sunt lăsate în pace.
 */
export default function ScrollToTop() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (hash) return

    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [pathname, hash])

  return null
}
