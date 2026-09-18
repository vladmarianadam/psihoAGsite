import type { ReactNode } from 'react'
import { Link as RouterLink, useLocation } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Divider,
  Grid,
  Link as MuiLink,
  Paper,
  Stack,
  Typography,
} from '@mui/material'
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined'
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined'
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined'
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined'
import VerifiedOutlinedIcon from '@mui/icons-material/VerifiedOutlined'
import WhatsAppIcon from '@mui/icons-material/WhatsApp'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import MarkEmailReadOutlinedIcon from '@mui/icons-material/MarkEmailReadOutlined'
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined'
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined'

import Seo from '../components/common/Seo'
import AppointmentForm from '../features/appointment/AppointmentForm'
import { mailHref, phoneHref, site, whatsappHref } from '../config/site'

/** Starea trimisă de pagina unui serviciu prin `navigate('/contact', { state })`. */
interface ContactLocationState {
  serviceId?: number
  serviceName?: string
}

interface NextStep {
  icon: ReactNode
  title: string
  text: string
}

const baseUrl = site.url.replace(/\/+$/, '')

const mapsSrc = `https://www.google.com/maps?q=${encodeURIComponent(site.address.mapsQuery)}&output=embed`

const nextSteps: NextStep[] = [
  {
    icon: <MarkEmailReadOutlinedIcon />,
    title: '1. Cererea ajunge direct la mine',
    text: 'Nu trece prin niciun secretariat și prin nicio platformă intermediară. O citesc personal, de regulă în aceeași zi lucrătoare.',
  },
  {
    icon: <ForumOutlinedIcon />,
    title: '2. Te contactez pentru confirmare',
    text: 'Te sun sau îți scriu pe email, în funcție de ce ai preferat, ca să stabilim ziua, ora și modul de desfășurare.',
  },
  {
    icon: <EventAvailableOutlinedIcon />,
    title: '3. Prima ședință',
    text: 'Prima întâlnire este una de cunoaștere: vorbim despre ce te aduce aici și despre cum putem lucra mai departe.',
  },
]

export default function ContactPage() {
  const location = useLocation()
  const state = location.state as ContactLocationState | null

  const preselectedServiceId = typeof state?.serviceId === 'number' ? state.serviceId : null
  const preselectedServiceName = typeof state?.serviceName === 'string' ? state.serviceName : null

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: `Contact — ${site.name}`,
    url: `${baseUrl}/contact`,
    mainEntity: {
      '@type': 'Psychologist',
      name: site.name,
      description: site.description,
      url: baseUrl,
      telephone: site.phone,
      email: site.email,
      address: {
        '@type': 'PostalAddress',
        streetAddress: site.address.street,
        addressLocality: site.address.city,
        addressCountry: 'RO',
      },
      openingHours: site.schedule.map((entry) => `${entry.day}: ${entry.hours}`),
      availableLanguage: 'ro',
    },
  }

  return (
    <>
      <Seo
        title="Contact"
        description="Programează o ședință la Cabinetul Psihologic Adina Gghita — telefon, email, adresă și formular de cerere de programare, pentru ședințe în cabinet sau online."
        path="/contact"
        jsonLd={jsonLd}
      />

      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 9 } }}>
        <Box sx={{ maxWidth: '60ch', mb: { xs: 4, md: 6 } }}>
          <Typography variant="h1" component="h1" sx={{ color: 'text.primary' }}>
            Contact
          </Typography>
          <Typography variant="subtitle1" component="p" sx={{ mt: 2 }}>
            Primul pas este adesea cel mai greu, iar un mesaj scurt este suficient. Îmi poți spune
            doar că vrei o programare — restul îl clarificăm împreună, fără grabă.
          </Typography>
        </Box>

        <Grid container spacing={{ xs: 4, md: 5 }} alignItems="flex-start">
          {/* ------------------------------ Formularul ------------------------------ */}
          <Grid size={{ xs: 12, md: 7 }}>
            {preselectedServiceName && (
              <Alert severity="info" icon={false} sx={{ mb: 3 }}>
                Am preselectat serviciul <strong>{preselectedServiceName}</strong>. Îl poți schimba
                oricând din formular.
              </Alert>
            )}

            <AppointmentForm defaultServiceId={preselectedServiceId} />
          </Grid>

          {/* --------------------- Date de contact, program, hartă --------------------- */}
          <Grid size={{ xs: 12, md: 5 }}>
            <Stack spacing={3}>
              <Paper variant="outlined" sx={{ p: { xs: 2.5, md: 3.5 }, borderRadius: 3 }}>
                <Typography variant="h4" component="h2" sx={{ color: 'text.primary' }}>
                  Date de contact
                </Typography>

                <Stack spacing={2.25} sx={{ mt: 2.5 }}>
                  <Stack direction="row" spacing={1.75} alignItems="flex-start">
                    <PhoneOutlinedIcon sx={{ color: 'primary.main', mt: 0.25 }} />
                    <Box>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Telefon
                      </Typography>
                      <MuiLink href={phoneHref} sx={{ fontWeight: 600, fontSize: '1.0625rem' }}>
                        {site.phone}
                      </MuiLink>
                    </Box>
                  </Stack>

                  <Stack direction="row" spacing={1.75} alignItems="flex-start">
                    <EmailOutlinedIcon sx={{ color: 'primary.main', mt: 0.25 }} />
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Email
                      </Typography>
                      <MuiLink
                        href={mailHref}
                        sx={{ fontWeight: 600, wordBreak: 'break-word' }}
                      >
                        {site.email}
                      </MuiLink>
                    </Box>
                  </Stack>

                  <Stack direction="row" spacing={1.75} alignItems="flex-start">
                    <PlaceOutlinedIcon sx={{ color: 'primary.main', mt: 0.25 }} />
                    <Box>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Adresă
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {site.address.street}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        {site.address.city}, {site.address.country}
                      </Typography>
                    </Box>
                  </Stack>

                  <Divider />

                  <Stack direction="row" spacing={1.75} alignItems="flex-start">
                    <AccessTimeOutlinedIcon sx={{ color: 'primary.main', mt: 0.25 }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                        Program
                      </Typography>

                      <Stack spacing={0.75} component="dl" sx={{ m: 0 }}>
                        {site.schedule.map((entry) => (
                          <Stack
                            key={entry.day}
                            direction="row"
                            justifyContent="space-between"
                            spacing={2}
                          >
                            <Typography component="dt" variant="body2">
                              {entry.day}
                            </Typography>
                            <Typography
                              component="dd"
                              variant="body2"
                              sx={{ m: 0, fontWeight: 600, whiteSpace: 'nowrap' }}
                            >
                              {entry.hours}
                            </Typography>
                          </Stack>
                        ))}
                      </Stack>
                    </Box>
                  </Stack>

                  <Chip
                    icon={<VerifiedOutlinedIcon />}
                    label={site.copsi}
                    variant="outlined"
                    sx={{ alignSelf: 'flex-start', height: 'auto', py: 0.75, '& .MuiChip-label': { whiteSpace: 'normal' } }}
                  />

                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                    <Button
                      variant="contained"
                      startIcon={<WhatsAppIcon />}
                      href={whatsappHref}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Scrie pe WhatsApp
                    </Button>
                    <Button variant="outlined" startIcon={<PhoneOutlinedIcon />} href={phoneHref}>
                      Sună acum
                    </Button>
                  </Stack>
                </Stack>
              </Paper>

              {/* Harta încărcată leneș, fără a transmite calea completă către Google. */}
              <Box
                component="iframe"
                src={mapsSrc}
                title={`Harta cu locația cabinetului: ${site.address.street}, ${site.address.city}`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                sx={{
                  display: 'block',
                  width: '100%',
                  aspectRatio: '16 / 10',
                  border: 0,
                  borderRadius: 3,
                }}
              />
            </Stack>
          </Grid>
        </Grid>

        {/* ------------------- Ce se întâmplă după trimiterea cererii ------------------- */}
        <Box sx={{ mt: { xs: 7, md: 10 } }}>
          <Typography variant="h3" component="h2" sx={{ color: 'text.primary' }}>
            Ce se întâmplă după ce trimiți cererea
          </Typography>

          <Grid container spacing={3} sx={{ mt: 3 }}>
            {nextSteps.map((step) => (
              <Grid key={step.title} size={{ xs: 12, md: 4 }}>
                <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, height: '100%' }}>
                  <Box sx={{ color: 'secondary.dark', '& svg': { fontSize: 32 } }}>{step.icon}</Box>
                  <Typography variant="h6" component="h3" sx={{ mt: 1.5, color: 'text.primary' }}>
                    {step.title}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                    {step.text}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>

          <Paper
            variant="outlined"
            sx={{
              mt: 3,
              p: { xs: 2.5, md: 3 },
              borderRadius: 3,
              display: 'flex',
              gap: 2,
              alignItems: 'flex-start',
            }}
          >
            <LockOutlinedIcon sx={{ color: 'primary.main', mt: 0.25 }} />
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Tot ce scrii în formular rămâne confidențial și este acoperit de secretul profesional.
              Datele sunt folosite exclusiv pentru a te contacta în legătură cu programarea, nu ajung
              la terți și nu sunt folosite în scopuri de marketing. Detaliile complete sunt în{' '}
              <MuiLink component={RouterLink} to="/politica-de-confidentialitate">
                politica de confidențialitate
              </MuiLink>
              .
            </Typography>
          </Paper>
        </Box>
      </Container>
    </>
  )
}
