import { useEffect, useState } from 'react'
import { Alert, Box, Container, Grid, Paper, Skeleton, Stack, Typography } from '@mui/material'

import CtaBanner from '../components/common/CtaBanner'
import SectionHeading from '../components/common/SectionHeading'
import Seo from '../components/common/Seo'
import ServiceCard from '../components/cards/ServiceCard'
import { getServices } from '../api/services'
import { getErrorMessage } from '../api/client'
import { site } from '../config/site'
import type { ServiceListItemDto } from '../api/types'

const STEPS = [
  {
    title: 'Trimiți cererea de programare',
    description:
      'Completezi formularul cu datele tale și intervalul care ți se potrivește. Îți răspund pentru a confirma ziua și ora.',
  },
  {
    title: 'Prima ședință de cunoaștere',
    description:
      'Vorbim despre ce te aduce în cabinet, despre istoricul situației și despre ce ți-ai dori să se schimbe.',
  },
  {
    title: 'Stabilim direcția de lucru',
    description:
      'Formulăm împreună obiective realiste și alegem ritmul ședințelor, în funcție de nevoia și disponibilitatea ta.',
  },
  {
    title: 'Lucrăm constant',
    description:
      'Ședințele au loc de regulă săptămânal. Reevaluăm periodic progresul și ajustăm planul acolo unde e nevoie.',
  },
]

export default function ServicesPage() {
  const [services, setServices] = useState<ServiceListItemDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    getServices()
      .then((result) => {
        if (!cancelled) {
          setServices(result)
          setError(null)
        }
      })
      .catch((err) => {
        if (!cancelled) setError(getErrorMessage(err))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Servicii — ' + site.name,
    itemListElement: services.map((service, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: service.name,
      url: `${site.url.replace(/\/+$/, '')}/servicii/${service.slug}`,
    })),
  }

  return (
    <>
      <Seo
        title="Servicii"
        description="Psihoterapie cognitiv-comportamentală, intervenție pentru copii și adolescenți, consiliere pentru părinți, evaluări și avize psihologice. Vezi durata, prețul și modul de desfășurare pentru fiecare serviciu."
        path="/servicii"
        jsonLd={jsonLd}
      />

      <Container maxWidth="lg" sx={{ pt: { xs: 6, md: 9 }, pb: { xs: 5, md: 7 } }}>
        <SectionHeading
          component="h1"
          eyebrow="Cum putem lucra împreună"
          title="Servicii"
          subtitle="Fiecare formă de sprijin pornește de la aceeași idee: un spațiu în care poți vorbi liber, fără grabă și fără teama de a fi judecat. Alege ce ți se potrivește sau, dacă nu ești sigur, discutăm la prima ședință."
        />
      </Container>

      <Container maxWidth="lg" sx={{ pb: { xs: 6, md: 9 } }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Grid container spacing={3}>
            {Array.from({ length: 6 }).map((_, index) => (
              <Grid key={index} size={{ xs: 12, sm: 6, lg: 4 }}>
                <Skeleton variant="rounded" height={280} />
              </Grid>
            ))}
          </Grid>
        ) : services.length === 0 ? (
          !error && (
            <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h5" component="p" gutterBottom>
                Lista de servicii se completează
              </Typography>
              <Typography color="text.secondary">
                Până atunci, poți trimite o cerere de programare din pagina de contact sau poți suna
                direct la {site.phone}.
              </Typography>
            </Paper>
          )
        ) : (
          <Grid container spacing={3}>
            {services.map((service) => (
              <Grid key={service.id} size={{ xs: 12, sm: 6, lg: 4 }}>
                <ServiceCard service={service} />
              </Grid>
            ))}
          </Grid>
        )}
      </Container>

      <Box sx={{ bgcolor: 'background.paper', borderTop: 1, borderBottom: 1, borderColor: 'divider' }}>
        <Container maxWidth="lg" sx={{ py: { xs: 6, md: 9 } }}>
          <SectionHeading
            eyebrow="Pas cu pas"
            title="Cum se desfășoară colaborarea"
            subtitle="Nu trebuie să știi de la început ce vrei să lucrezi. E suficient să faci primul pas."
          />

          <Grid container spacing={3} sx={{ mt: 4 }}>
            {STEPS.map((step, index) => (
              <Grid key={step.title} size={{ xs: 12, sm: 6, lg: 3 }}>
                <Stack spacing={1.5} sx={{ height: '100%' }}>
                  <Box
                    aria-hidden
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: 'primary.main',
                      color: 'common.white',
                      fontWeight: 600,
                    }}
                  >
                    {index + 1}
                  </Box>
                  <Typography variant="h5" component="h3">
                    {step.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {step.description}
                  </Typography>
                </Stack>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 9 } }}>
        <CtaBanner
          title="Nu ești sigur ce ți se potrivește?"
          description="Trimite o cerere de programare și stabilim împreună, la prima ședință, forma de sprijin potrivită situației tale."
          showPhone
        />
      </Container>
    </>
  )
}
