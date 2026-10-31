import { Link as RouterLink } from 'react-router-dom'
import { Box, Button, Slide } from '@mui/material'
import { alpha } from '@mui/material/styles'
import EventAvailableRoundedIcon from '@mui/icons-material/EventAvailableRounded'
import PhoneRoundedIcon from '@mui/icons-material/PhoneRounded'
import WhatsAppIcon from '@mui/icons-material/WhatsApp'

import { phoneHref, whatsappHref } from '../../config/site'
import { useCookieBannerVisible } from './cookieConsent'

/**
 * Bară de contact rapid pe mobil — sună, WhatsApp, programare — fixată jos, pe fundal de sticlă.
 * Pe desktop rămâne butonul flotant de WhatsApp. Se retrage cât timp bannerul de cookie-uri
 * ocupă partea de jos a ecranului.
 */
export default function QuickContactDock() {
  const bannerVisible = useCookieBannerVisible()

  return (
    <Slide direction="up" in={!bannerVisible} appear={false}>
      <Box
        component="nav"
        aria-label="Contact rapid"
        sx={(theme) => ({
          position: 'fixed',
          left: 12,
          right: 12,
          bottom: 'max(12px, env(safe-area-inset-bottom))',
          zIndex: theme.zIndex.fab,
          display: { xs: 'flex', md: 'none' },
          gap: 1,
          p: 1,
          borderRadius: 999,
          backgroundColor: alpha(theme.palette.background.paper, 0.78),
          backdropFilter: 'saturate(180%) blur(16px)',
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: `0 16px 40px rgba(${theme.palette.brand.shadowRgb}, 0.18)`,
        })}
      >
        <Button
          component="a"
          href={phoneHref}
          startIcon={<PhoneRoundedIcon />}
          sx={{ flex: 1, color: 'text.primary' }}
        >
          Sună
        </Button>
        <Button
          component="a"
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          startIcon={<WhatsAppIcon />}
          sx={{ flex: 1, color: 'text.primary' }}
        >
          WhatsApp
        </Button>
        <Button
          component={RouterLink}
          to="/programare"
          variant="contained"
          startIcon={<EventAvailableRoundedIcon />}
          sx={{ flex: 1.3 }}
        >
          Programare
        </Button>
      </Box>
    </Slide>
  )
}
