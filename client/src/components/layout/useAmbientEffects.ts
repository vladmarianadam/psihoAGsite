import { useEffect } from 'react'

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Apariția la derulare: orice element cu `data-reveal` primește `data-revealed` când intră în
 * ecran (CSS-ul din index.css face tranziția). Un MutationObserver prinde și elementele care apar
 * mai târziu (date încărcate din API, schimbare de rută). Se folosește un atribut separat, nu o
 * clasă, ca React să nu-l șteargă când re-randează `className`.
 */
export function useReveal() {
  useEffect(() => {
    const reveal = (element: Element) => element.setAttribute('data-revealed', '')

    if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
      const revealAll = () => document.querySelectorAll('[data-reveal]:not([data-revealed])').forEach(reveal)
      revealAll()
      const mutations = new MutationObserver(revealAll)
      mutations.observe(document.body, { childList: true, subtree: true })
      return () => mutations.disconnect()
    }

    const intersections = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          reveal(entry.target)
          intersections.unobserve(entry.target)
        })
      },
      { threshold: 0.15 },
    )

    // `observe` pe un element deja urmărit nu are efect, deci rescanarea completă e sigură.
    const scan = () =>
      document.querySelectorAll('[data-reveal]:not([data-revealed])').forEach((element) => intersections.observe(element))
    scan()
    const mutations = new MutationObserver(scan)
    mutations.observe(document.body, { childList: true, subtree: true })

    return () => {
      intersections.disconnect()
      mutations.disconnect()
    }
  }, [])
}

/**
 * Lumina de sub cursor pe carduri: scrie poziția mouse-ului, relativ la fiecare card vizibil, în
 * `--mx`/`--my` (inelul e desenat în theme.ts). Doar pe dispozitive cu mouse; o singură actualizare
 * pe cadru, cu toate citirile de poziție înaintea scrierilor, ca să nu forțeze layout repetat.
 */
export function useSpotlight() {
  useEffect(() => {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return

    let frame = 0
    let x = 0
    let y = 0

    const update = () => {
      frame = 0
      const cards = Array.from(document.querySelectorAll<HTMLElement>('.MuiCard-root, .MuiAccordion-root'))
      const rects = cards.map((card) => card.getBoundingClientRect())
      cards.forEach((card, index) => {
        const rect = rects[index]
        if (rect.bottom < 0 || rect.top > window.innerHeight) return
        card.style.setProperty('--mx', `${x - rect.left}px`)
        card.style.setProperty('--my', `${y - rect.top}px`)
      })
    }

    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return
      x = event.clientX
      y = event.clientY
      if (!frame) frame = requestAnimationFrame(update)
    }

    document.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      document.removeEventListener('pointermove', onMove)
      cancelAnimationFrame(frame)
    }
  }, [])
}
