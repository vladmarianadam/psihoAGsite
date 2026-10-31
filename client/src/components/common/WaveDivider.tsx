import type { CSSProperties } from 'react'
import { Box } from '@mui/material'

interface WaveDividerProps {
  /** Unde stă valul față de secțiunea-părinte (care trebuie să fie `position: relative`). */
  edge: 'top' | 'bottom'
  /** Culoarea secțiunii (variabilă CSS), ca valul să continue fundalul ei fără cusătură. */
  fill: string
}

// Două perioade identice pe lățimea dublă, ca translatarea cu -50% să se reia fără salt.
const CREST = 'M0 30 C 120 52, 240 52, 360 30 S 600 8, 720 30 S 960 52, 1080 30 S 1320 8, 1440 30'
const WAVE = `${CREST} L1440 60 L0 60 Z`

/**
 * Margine în val între secțiuni, în locul bordurilor drepte. Două straturi alunecă orizontal în
 * sensuri opuse (doar transform): valul plin are culoarea secțiunii, iar deasupra lui o linie fină
 * de accent. Linia nu e umplută — o umplere s-ar opri drept la marginea cutiei și s-ar vedea cusătura.
 */
export default function WaveDivider({ edge, fill }: WaveDividerProps) {
  return (
    <Box
      aria-hidden="true"
      sx={{
        position: 'absolute',
        left: 0,
        right: 0,
        height: { xs: 28, md: 48 },
        overflow: 'hidden',
        pointerEvents: 'none',
        ...(edge === 'top' ? { bottom: '100%' } : { top: '100%', transform: 'scaleY(-1)' }),
      }}
    >
      {[
        { className: 'wave-track', path: WAVE, style: { fill } as CSSProperties },
        {
          className: 'wave-track wave-track--slow',
          path: CREST,
          style: { fill: 'none', stroke: 'var(--c1)', strokeWidth: 2, opacity: 0.55, vectorEffect: 'non-scaling-stroke' } as CSSProperties,
        },
      ].map((layer) => (
        <Box
          key={layer.className}
          className={layer.className}
          sx={{ position: 'absolute', left: 0, bottom: 0, width: '200%', height: '100%', display: 'flex' }}
        >
          {[0, 1].map((copy) => (
            <Box
              key={copy}
              component="svg"
              viewBox="0 0 1440 60"
              preserveAspectRatio="none"
              sx={{ width: '50%', height: '100%', display: 'block', overflow: 'visible' }}
            >
              <path d={layer.path} style={layer.style} />
            </Box>
          ))}
        </Box>
      ))}
    </Box>
  )
}
