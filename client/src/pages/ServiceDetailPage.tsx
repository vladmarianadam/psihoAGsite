import { useEffect, useMemo, useState } from 'react'
import { Link as RouterLink, useParams } from 'react-router-dom'
import {
  Alert,
  Box,
  Breadcrumbs,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  Grid,
  Link,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import PhoneIcon from '@mui/icons-material/Phone'
import PlaceIcon from '@mui/icons-material/Place'
import DOMPurify from 'dompurify'

import CtaBanner from '../components/common/CtaBanner'
import PlaceholderImage from '../components/common/PlaceholderImage'
import Seo from '../components/common/Seo'
import { formatPriceRo } from '../components/common/formatters'
import { getServiceBySlug, getServices } from '../api/services'
import { getErrorMessage } from '../api/client'
import { phoneHref, site } from '../config/site'
import { sessionModeLabels } from '../api/types'
import type { ServiceDetailDto, ServiceListItemDto } from '../api/types'
import axios from 'axios'

export default function ServiceDetailPage() {
  const { slug } = useParams<{ slug: string }>()

  const [service, setService] = useState<ServiceDetailDto | null>(null)
  const [others, setOthers] = useState<ServiceListItemDto[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!slug) return

    let cancelled = false
    setLoading(true)
    setError(null)
    setNotFound(false)

    getServiceBySlug(slug)
      .then((result) => {
        if (!cancelled) setService(result)
      })
      .catch((err) => {
        if (cancelled) return

        if (axios.isAxiosError(err) && err.response?.status === 404) {
          setNotFound(true)
        } else {
          setError(getErrorMessage(err))
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    // Lista laterală e secundară: dacă eșuează, pagina rămâne funcțională.
    getServices()
      .then((result) => {
        if (!cancelled) setOthers(result)
      })
      .catch(() => undefined)

    return () => {
      cancelled = true
    }
  }, [slug])

  const longDescriptionHtml = service?.longDescriptionHtml ?? ''
  const sanitizedHtml = useMemo(
    () => (longDescriptionHtml ? DOMPurify.sanitize(longDescriptionHtml) : ''),
    [longDescriptionHtml],
  )

  if (notFound) {
    return (
      <Container maxWidth="sm" sx={{ py: { xs: 8, md: 12 }, textAlign: 'center' }}>
        <Seo title="Serviciul nu a fost găsit" noIndex />
        <Typography variant="h2" component="h1" gutterBottom>
          Serviciul nu a fost găsit
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 4 }}>
          Este posibil să fi fost redenumit sau retras. Vezi lista completă a serviciilor
          disponibile.
        </Typography>
        <Button component={RouterLink} to="/servicii" variant="contained" size="large">
          Toate serviciile
        </Button>
      </Container>
    )
  }

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 9 } }}>
        <Skeleton width={280} height={24} />
        <Skeleton width="70%" height={64} sx={{ mt: 2 }} />
        <Skeleton width="90%" height={28} />
        <Grid container spacing={4} sx={{ mt: 4 }}>
          <Grid size={{ xs: 12, md: 8 }}>
            <Skeleton variant="rounded" height={420} />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Skeleton variant="rounded" height={320} />
          </Grid>
        </Grid>
      </Container>
    )
  }

  if (error || !service) {
    return (
      <Container maxWidth="sm" sx={{ py: { xs: 8, md: 12 } }}>
        <Alert severity="error">{error ?? 'Serviciul nu a putut fi încărcat.'}</Alert>
        <Button component={RouterLink} to="/servicii" sx={{ mt: 3 }}>
          Înapoi la servicii
        </Button>
      </Container>
    )
  }

  const price = formatPriceRo(service.price)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service.name,
    description: service.shortDescription,
    serviceType: service.name,
    url: `${site.url.replace(/\/+$/, '')}/servicii/${service.slug}`,
    provider: {
      '@type': 'Psychologist',
      name: site.name,
      telephone: site.phone,
      address: {
        '@type': 'PostalAddress',
        addressLocality: site.address.city,
        addressCountry: 'RO',
      },
    },
    ...(service.price
      ? { offers: { '@type': 'Offer', price: service.price, priceCurrency: 'RON' } }
      : {}),
  }

  const otherServices = others.filter((item) => item.slug !== service.slug)

  return (
    <>
      <Seo
        title={service.name}
        description={service.shortDescription}
        path={`/servicii/${service.slug}`}
        jsonLd={jsonLd}
      />

      <Container maxWidth="lg" sx={{ pt: { xs: 4, md: 6 }, pb: { xs: 6, md: 9 } }}>
        <Breadcrumbs aria-label="Navigare" sx={{ mb: 3 }}>
          <Link component={RouterLink} to="/" color="inherit">
            Acasă
          </Link>
          <Link component={RouterLink} to="/servicii" color="inherit">
            Servicii
          </Link>
          <Typography color="text.primary">{service.name}</Typography>
        </Breadcrumbs>

        <Grid container spacing={{ xs: 4, md: 6 }}>
          <Grid size={{ xs: 12, md: 8 }}>
            <Typography variant="h1" sx={{ fontSize: { xs: '2.25rem', md: '3rem' } }} gutterBottom>
              {service.name}
            </Typography>

            <Typography variant="subtitle1" sx={{ maxWidth: '62ch' }}>
              {service.shortDescription}
            </Typography>

            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 3 }}>
              <Chip icon={<PlaceIcon />} label={sessionModeLabels[service.sessionMode]} />
              {service.durationMinutes > 0 && (
                <Chip icon={<AccessTimeIcon />} label={`${service.durationMinutes} de minute`} />
              )}
              {price && (
                <Chip
                  color="secondary"
                  label={`${price}${service.priceUnit ? ` ${service.priceUnit}` : ''}`}
                />
              )}
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 4 }}>
              <Button
                component={RouterLink}
                to="/contact"
                state={{ serviceId: service.id, serviceName: service.name }}
                variant="contained"
                size="large"
              >
                Solicită o programare
              </Button>
              <Button href={phoneHref} variant="outlined" size="large" startIcon={<PhoneIcon />}>
                {site.phone}
              </Button>
            </Stack>

            <Box sx={{ mt: 5 }}>
              {sanitizedHtml ? (
                <div
                  className="article-content"
                  // Conținutul a fost deja sanitizat pe server la salvare; DOMPurify este a doua barieră.
                  dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
                />
              ) : (
                <PlaceholderImage ratio={16 / 9} rounded={2} label={`Ilustrație: ${service.name}`} />
              )}
            </Box>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Box sx={{ position: { md: 'sticky' }, top: { md: 96 } }}>
              <Card>
                <CardContent>
                  <Typography variant="h5" component="h2" gutterBottom>
                    Detalii ședință
                  </Typography>

                  <Stack spacing={1.5} sx={{ mt: 2 }}>
                    {price && (
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Tarif
                        </Typography>
                        <Typography variant="h4" component="p">
                          {price}
                        </Typography>
                        {service.priceUnit && (
                          <Typography variant="body2" color="text.secondary">
                            {service.priceUnit}
                          </Typography>
                        )}
                      </Box>
                    )}

                    {service.durationMinutes > 0 && (
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Durată
                        </Typography>
                        <Typography>{service.durationMinutes} de minute</Typography>
                      </Box>
                    )}

                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Mod de desfășurare
                      </Typography>
                      <Typography>{sessionModeLabels[service.sessionMode]}</Typography>
                    </Box>
                  </Stack>

                  <Divider sx={{ my: 2.5 }} />

                  <Stack spacing={1.5}>
                    <Button component={RouterLink} to="/contact" variant="contained" fullWidth>
                      Solicită o programare
                    </Button>
                    <Button href={phoneHref} variant="text" fullWidth startIcon={<PhoneIcon />}>
                      {site.phone}
                    </Button>
                  </Stack>
                </CardContent>
              </Card>

              {otherServices.length > 0 && (
                <Paper variant="outlined" sx={{ mt: 3, p: 2 }}>
                  <Typography variant="h6" component="h2" sx={{ px: 1, mb: 1 }}>
                    Alte servicii
                  </Typography>
                  <List disablePadding>
                    {otherServices.map((item) => (
                      <ListItemButton
                        key={item.id}
                        component={RouterLink}
                        to={`/servicii/${item.slug}`}
                        sx={{ borderRadius: 2 }}
                      >
                        <ListItemText
                          primary={item.name}
                          secondary={sessionModeLabels[item.sessionMode]}
                        />
                      </ListItemButton>
                    ))}
                  </List>
                </Paper>
              )}
            </Box>
          </Grid>
        </Grid>
      </Container>

      <Container maxWidth="lg" sx={{ pb: { xs: 6, md: 9 } }}>
        <CtaBanner
          title="Primul pas e cel mai greu"
          description="Trimite o cerere de programare, iar eu îți confirm ziua și ora potrivite pentru amândoi."
          showPhone
        />
      </Container>
    </>
  )
}
