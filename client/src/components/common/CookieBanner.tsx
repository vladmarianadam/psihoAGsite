import { useEffect, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { Box, Button, Container, Link, Paper, Slide, Stack, Typography } from '@mui/material'
import CookieIcon from '@mui/icons-material/Cookie'

/** Cheia din localStorage în care se memorează alegerea vizitatorului. */
const CONSENT_KEY = 'psiho-cookie-consent'

/**
 * Eveniment intern: îl ascultă butonul flotant de WhatsApp, ca să urce deasupra
 * bannerului cât timp acesta e afișat.
 */
const CONSENT_EVENT = 'psiho-cookie-consent-change'

/** `true` dacă vizitatorul a ales deja (bannerul nu mai trebuie afișat). */
function hasCookieChoice(): boolean {
  try {
    return window.localStorage.getItem(CONSENT_KEY) !== null
  } catch {
    // Stocarea locală poate fi indisponibilă (mod privat) — tratăm ca „fără alegere".
    return false
  }
}

/**
 * Informare despre cookie-uri. Site-ul folosește doar cookie-uri strict necesare
 * (sesiunea panoului de administrare) și nu încarcă scripturi de urmărire (plan §10),
 * așa că bannerul doar informează și memorează alegerea.
 */
export default function CookieBanner() {
  const [visible, setVisible] = useState(() => !hasCookieChoice())
  // Animația de intrare pornește după primul cadru, ca bannerul să nu apară brusc.
  const [entered, setEntered] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => setEntered(true), 400)
    return () => window.clearTimeout(timer)
  }, [])

  const decide = (consent: 'accepted' | 'rejected') => {
    try {
      window.localStorage.setItem(CONSENT_KEY, consent)
    } catch {
      // Fără stocare locală, alegerea rămâne valabilă doar pentru sesiunea curentă.
    }
    setVisible(false)
    window.dispatchEvent(new Event(CONSENT_EVENT))
  }

  return (
    <Slide direction="up" in={visible && entered} mountOnEnter unmountOnExit>
      <Box
        role="region"
        aria-label="Informare despre cookie-uri"
        sx={(theme) => ({
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: theme.zIndex.snackbar,
          p: { xs: 1.5, sm: 2 },
          pointerEvents: 'none',
        })}
      >
        <Container maxWidth="lg" disableGutters>
          <Paper
            variant="outlined"
            sx={{
              pointerEvents: 'auto',
              p: { xs: 2, sm: 2.5 },
              borderRadius: 3,
              boxShadow: '0 14px 40px rgba(44, 54, 57, 0.14)',
            }}
          >
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={{ xs: 2, md: 3 }}
              alignItems={{ xs: 'stretch', md: 'center' }}
            >
              <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ flex: 1 }}>
                <CookieIcon sx={{ color: 'secondary.dark', mt: 0.25 }} />
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Folosim doar cookie-uri strict necesare pentru funcționarea site-ului. Nu folosim
                  cookie-uri de publicitate și nu urmărim activitatea ta. Detalii în{' '}
                  <Link component={RouterLink} to="/politica-de-cookies" sx={{ fontWeight: 600 }}>
                    politica de cookies
                  </Link>
                  .
                </Typography>
              </Stack>

              <Stack
                direction="row"
                spacing={1.5}
                sx={{ flexShrink: 0, justifyContent: { xs: 'stretch', md: 'flex-end' } }}
              >
                <Button
                  onClick={() => decide('rejected')}
                  variant="outlined"
                  color="inherit"
                  fullWidth
                  sx={{ borderColor: 'divider', color: 'text.secondary' }}
                >
                  Refuz
                </Button>
                <Button onClick={() => decide('accepted')} variant="contained" fullWidth>
                  Accept
                </Button>
              </Stack>
            </Stack>
          </Paper>
        </Container>
      </Box>
    </Slide>
  )
}
