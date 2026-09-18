import type { ReactNode } from 'react'
import { Box } from '@mui/material'
import SpaOutlinedIcon from '@mui/icons-material/SpaOutlined'

import { palette } from '../../theme'

interface PlaceholderImageProps {
  icon?: ReactNode
  label?: string
  /** Raportul lățime/înălțime, ex. `16 / 9`. Implicit `4 / 3`. */
  ratio?: number
  /** Multiplu de spacing pentru colțuri rotunjite. Implicit 0 (colțurile le dă cardul). */
  rounded?: number
}

/**
 * Substitut pentru fotografiile care încă lipsesc (plan §11): gradient discret din
 * paleta temei plus o iconiță centrată. Nu încarcă niciun fișier extern.
 */
export default function PlaceholderImage({
  icon,
  label = 'Ilustrație decorativă',
  ratio = 4 / 3,
  rounded = 0,
}: PlaceholderImageProps) {
  return (
    <Box
      role="img"
      aria-label={label}
      sx={{
        width: '100%',
        aspectRatio: String(ratio),
        borderRadius: rounded,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: palette.background,
        // Gradient decorativ construit doar din culorile paletei (fără imagini).
        backgroundImage: [
          `radial-gradient(115% 115% at 12% 10%, ${palette.secondary}3D 0%, transparent 62%)`,
          `radial-gradient(95% 95% at 92% 96%, ${palette.primaryLight}33 0%, transparent 60%)`,
          `linear-gradient(135deg, ${palette.surface}00 0%, ${palette.primary}1A 100%)`,
        ].join(', '),
        '& svg': {
          fontSize: 'clamp(2rem, 6vw, 3.25rem)',
          color: 'primary.main',
          opacity: 0.55,
        },
      }}
    >
      {icon ?? <SpaOutlinedIcon />}
    </Box>
  )
}
