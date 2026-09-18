import { useEffect, useState } from 'react'
import { Fab, useScrollTrigger, Zoom } from '@mui/material'
import WhatsAppIcon from '@mui/icons-material/WhatsApp'

import { whatsappHref } from '../../config/site'

// Aceleași valori folosite de CookieBanner (vezi components/common/CookieBanner.tsx).
const CONSENT_KEY = 'psiho-cookie-consent'
const CONSENT_EVENT = 'psiho-cookie-consent-change'

function isCookieBannerVisible(): boolean {
  try {
    return window.localStorage.getItem(CONSENT_KEY) === null
  } catch {
    // Fără acces la stocarea locală presupunem că bannerul nu e afișat.
    return false
  }
}

/** Buton flotant de WhatsApp — apare după ce vizitatorul a derulat puțin. */
export default function WhatsAppFab() {
  const visible = useScrollTrigger({ disableHysteresis: true, threshold: 220 })
  const [bannerVisible, setBannerVisible] = useState(isCookieBannerVisible)

  // Cât timp bannerul de cookie-uri e afișat, butonul stă deasupra lui.
  useEffect(() => {
    const sync = () => setBannerVisible(isCookieBannerVisible())
    window.addEventListener(CONSENT_EVENT, sync)

    return () => window.removeEventListener(CONSENT_EVENT, sync)
  }, [])

  return (
    <Zoom in={visible}>
      <Fab
        color="primary"
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Scrie-ne pe WhatsApp"
        sx={(theme) => ({
          position: 'fixed',
          right: { xs: 16, sm: 24 },
          bottom: bannerVisible ? { xs: 200, sm: 140, md: 116 } : { xs: 16, sm: 24 },
          zIndex: theme.zIndex.fab,
          transition: 'bottom .3s ease',
        })}
      >
        <WhatsAppIcon />
      </Fab>
    </Zoom>
  )
}
