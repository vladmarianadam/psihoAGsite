import { Fab, useScrollTrigger, Zoom } from '@mui/material'
import WhatsAppIcon from '@mui/icons-material/WhatsApp'

import { whatsappHref } from '../../config/site'
import { useCookieBannerVisible } from './cookieConsent'

/**
 * Buton flotant de WhatsApp pe desktop — apare după ce vizitatorul a derulat puțin.
 * Pe mobil locul lui e luat de QuickContactDock.
 */
export default function WhatsAppFab() {
  const visible = useScrollTrigger({ disableHysteresis: true, threshold: 220 })
  // Cât timp bannerul de cookie-uri e afișat, butonul stă deasupra lui.
  const bannerVisible = useCookieBannerVisible()

  return (
    <Zoom in={visible}>
      <Fab
        color="primary"
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Scrie-ne pe WhatsApp"
        className="pulse-ring"
        sx={(theme) => ({
          position: 'fixed',
          right: 24,
          bottom: bannerVisible ? 116 : 24,
          zIndex: theme.zIndex.fab,
          display: { xs: 'none', md: 'inline-flex' },
          transition: 'bottom .3s ease',
        })}
      >
        <WhatsAppIcon />
      </Fab>
    </Zoom>
  )
}
