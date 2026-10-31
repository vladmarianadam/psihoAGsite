import { useEffect, useRef, useState } from 'react'
import { Card, Grid, Typography } from '@mui/material'

export interface StatItem {
  value: number
  /** Sufix afișat lipit de număr, ex. „+”. */
  suffix?: string
  label: string
}

interface StatsStripProps {
  items: ReadonlyArray<StatItem>
}

const DURATION_MS = 1400

/** Numără de la 0 la `target` (ease-out) odată ce `active` e true; la reduced-motion sare direct la final. */
function useCountUp(target: number, active: boolean): number {
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!active) return

    // La reduced-motion durata e 0: primul cadru afișează direct valoarea finală.
    const duration = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : DURATION_MS
    const start = performance.now()
    let frame = 0
    const tick = (now: number) => {
      const t = duration === 0 ? 1 : Math.min(1, (now - start) / duration)
      setValue(Math.round(target * (1 - Math.pow(1 - t, 3))))
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)

    return () => cancelAnimationFrame(frame)
  }, [active, target])

  return value
}

interface StatTileProps {
  item: StatItem
  active: boolean
}

function StatTile({ item, active }: StatTileProps) {
  const value = useCountUp(item.value, active)

  return (
    <Card sx={{ height: '100%', p: { xs: 2, md: 2.5 } }}>
      <Typography
        component="p"
        className="shine-text"
        sx={(theme) => ({
          fontFamily: theme.typography.h1.fontFamily,
          fontWeight: 700,
          fontSize: { xs: '2rem', md: '2.5rem' },
          lineHeight: 1.1,
          letterSpacing: '-0.02em',
          fontVariantNumeric: 'tabular-nums',
        })}
      >
        {/* ro-RO folosește punctul ca separator de mii: 1.500 */}
        {value.toLocaleString('ro-RO')}
        {item.suffix}
      </Typography>
      <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary' }}>
        {item.label}
      </Typography>
    </Card>
  )
}

/** Rând de plăcuțe cu cifre care numără crescător când intră în ecran. */
export default function StatsStrip({ items }: StatsStripProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element || !('IntersectionObserver' in window)) {
      setActive(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setActive(true)
          observer.disconnect()
        }
      },
      { threshold: 0.3 },
    )
    observer.observe(element)

    return () => observer.disconnect()
  }, [])

  return (
    <Grid ref={ref} container spacing={{ xs: 1.5, md: 2 }} role="list" aria-label="Cabinetul în cifre">
      {items.map((item, index) => {
        // Pe mobil două pe rând; un număr impar lasă ultima plăcuță pe toată lățimea.
        const lastOdd = index === items.length - 1 && items.length % 2 === 1
        return (
          <Grid
            key={item.label}
            role="listitem"
            size={{ xs: lastOdd ? 12 : 6, sm: 12 / items.length }}
            data-reveal
            sx={{ '--i': index }}
          >
            <StatTile item={item} active={active} />
          </Grid>
        )
      })}
    </Grid>
  )
}
