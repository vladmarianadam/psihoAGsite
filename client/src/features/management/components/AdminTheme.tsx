import type { ReactNode } from 'react'
import { CssBaseline } from '@mui/material'
import { ThemeProvider } from '@mui/material/styles'

import { buildTheme } from '../../../theme'

// Panoul rămâne mereu pe paleta deschisă, fără efecte ambientale, indiferent de tema aleasă pe site.
const adminTheme = buildTheme('calm', { ambient: false })

/**
 * Tema panoului de management. CssBaseline-ul propriu rescrie variabilele CSS de pe :root cât timp
 * panoul e montat, ca editorul și previzualizările să nu preia tema închisă a site-ului.
 */
export default function AdminTheme({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider theme={adminTheme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  )
}
