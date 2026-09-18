import { Outlet } from 'react-router-dom'
import { Box } from '@mui/material'

import Navbar from './Navbar'
import Footer from './Footer'
import WhatsAppFab from '../common/WhatsAppFab'
import CookieBanner from '../common/CookieBanner'

/** Învelișul tuturor paginilor publice: navigație, conținut, footer și elementele flotante. */
export default function Layout() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
      {/* Link de salt pentru navigarea la tastatură — vizibil doar când primește focus. */}
      <Box
        component="a"
        href="#main-content"
        sx={(theme) => ({
          position: 'fixed',
          top: theme.spacing(1.5),
          left: theme.spacing(1.5),
          zIndex: theme.zIndex.tooltip + 1,
          px: 2.5,
          py: 1.25,
          borderRadius: 999,
          fontSize: '0.9375rem',
          fontWeight: 600,
          textDecoration: 'none',
          backgroundColor: theme.palette.primary.main,
          color: theme.palette.primary.contrastText,
          boxShadow: '0 10px 28px rgba(44, 54, 57, 0.22)',
          transform: 'translateY(-250%)',
          transition: 'transform .2s ease',
          '&:focus, &:focus-visible': { transform: 'translateY(0)' },
        })}
      >
        Sari la conținut
      </Box>

      <Navbar />

      {/* tabIndex={-1} face ținta linkului de salt focusabilă programatic. */}
      <Box component="main" id="main-content" tabIndex={-1} sx={{ flex: 1, outline: 'none' }}>
        <Outlet />
      </Box>

      <Footer />

      <WhatsAppFab />
      <CookieBanner />
    </Box>
  )
}
