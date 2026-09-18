import { useEffect, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { Box, Chip, Container, Divider, Grid, Link, Skeleton, Stack, Typography } from '@mui/material'
import EmailIcon from '@mui/icons-material/Email'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import PhoneIcon from '@mui/icons-material/Phone'
import VerifiedIcon from '@mui/icons-material/Verified'

import { getServices } from '../../api/services'
import type { ServiceListItemDto } from '../../api/types'
import { mailHref, phoneHref, site } from '../../config/site'

/** Doar pagini publice — panoul de management nu este listat nicăieri (plan §7). */
const pageLinks: ReadonlyArray<{ label: string; to: string }> = [
  { label: 'Acasă', to: '/' },
  { label: 'Despre mine', to: '/despre' },
  { label: 'Servicii', to: '/servicii' },
  { label: 'Blog', to: '/blog' },
  { label: 'Contact', to: '/contact' },
]

const legalLinks: ReadonlyArray<{ label: string; to: string }> = [
  { label: 'Termeni și condiții', to: '/termeni-si-conditii' },
  { label: 'Politica de confidențialitate', to: '/politica-de-confidentialitate' },
  { label: 'Politica de cookies', to: '/politica-de-cookies' },
]

const externalLegalLinks: ReadonlyArray<{ label: string; href: string }> = [
  { label: 'ANPC', href: site.legal.anpc },
  { label: 'SAL', href: site.legal.sal },
  { label: 'SOL', href: site.legal.sol },
]

const columnTitleSx = {
  fontWeight: 700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'text.primary',
  mb: 2,
} as const

const footerLinkSx = {
  color: 'text.secondary',
  fontSize: '0.9375rem',
  '&:hover': { color: 'primary.main' },
} as const

export default function Footer() {
  const [services, setServices] = useState<ServiceListItemDto[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    getServices()
      .then((result) => {
        if (!cancelled) setServices(result.slice(0, 5))
      })
      .catch(() => {
        // Footerul nu afișează erori: rămâne doar linkul general către /servicii.
        if (!cancelled) setServices([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <Box
      component="footer"
      sx={{
        mt: 'auto',
        pt: { xs: 6, md: 8 },
        pb: 3,
        backgroundColor: 'background.paper',
        borderTop: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={{ xs: 4, md: 5 }}>
          {/* 1. Identitatea cabinetului */}
          <Grid size={{ xs: 12, md: 3 }}>
            <Typography variant="h4" component="p" sx={{ fontSize: '1.25rem', mb: 1.5 }}>
              {site.name}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2.5 }}>
              Sprijin psihologic pentru adulți, cupluri, copii și adolescenți — ședințe în cabinet
              sau online, într-un cadru confidențial și lipsit de grabă.
            </Typography>
            <Chip
              icon={<VerifiedIcon />}
              label={site.copsi}
              variant="outlined"
              size="small"
              sx={{ height: 'auto', py: 0.75, '& .MuiChip-label': { whiteSpace: 'normal' } }}
            />
          </Grid>

          {/* 2. Pagini */}
          <Grid size={{ xs: 12, sm: 4, md: 3 }}>
            <Typography variant="subtitle2" component="h2" sx={columnTitleSx}>
              Pagini
            </Typography>
            <Stack component="ul" spacing={1} sx={{ listStyle: 'none', p: 0, m: 0 }}>
              {pageLinks.map((link) => (
                <Box component="li" key={link.to}>
                  <Link component={RouterLink} to={link.to} sx={footerLinkSx}>
                    {link.label}
                  </Link>
                </Box>
              ))}
            </Stack>
          </Grid>

          {/* 3. Servicii */}
          <Grid size={{ xs: 12, sm: 4, md: 3 }}>
            <Typography variant="subtitle2" component="h2" sx={columnTitleSx}>
              Servicii
            </Typography>
            <Stack component="ul" spacing={1} sx={{ listStyle: 'none', p: 0, m: 0 }}>
              {loading &&
                [0, 1, 2, 3].map((index) => (
                  <Box component="li" key={index}>
                    <Skeleton variant="text" width="85%" />
                  </Box>
                ))}

              {!loading &&
                services.map((service) => (
                  <Box component="li" key={service.id}>
                    <Link component={RouterLink} to={`/servicii/${service.slug}`} sx={footerLinkSx}>
                      {service.name}
                    </Link>
                  </Box>
                ))}

              {!loading && services.length === 0 && (
                <Box component="li">
                  <Link component={RouterLink} to="/servicii" sx={footerLinkSx}>
                    Vezi toate serviciile
                  </Link>
                </Box>
              )}
            </Stack>
          </Grid>

          {/* 4. Contact */}
          <Grid size={{ xs: 12, sm: 4, md: 3 }}>
            <Typography variant="subtitle2" component="h2" sx={columnTitleSx}>
              Contact
            </Typography>
            <Stack spacing={1.25}>
              <Stack direction="row" spacing={1.25}>
                <LocationOnIcon fontSize="small" sx={{ color: 'primary.main', mt: 0.25 }} />
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {site.address.street}
                  <br />
                  {site.address.city}, {site.address.country}
                </Typography>
              </Stack>

              <Stack direction="row" spacing={1.25} alignItems="center">
                <PhoneIcon fontSize="small" sx={{ color: 'primary.main' }} />
                <Link href={phoneHref} sx={footerLinkSx}>
                  {site.phone}
                </Link>
              </Stack>

              <Stack direction="row" spacing={1.25} alignItems="center">
                <EmailIcon fontSize="small" sx={{ color: 'primary.main' }} />
                <Link href={mailHref} sx={{ ...footerLinkSx, wordBreak: 'break-all' }}>
                  {site.email}
                </Link>
              </Stack>
            </Stack>

            <Typography
              variant="subtitle2"
              component="h3"
              sx={{ ...columnTitleSx, mt: 3, mb: 1.25, fontSize: '0.8125rem' }}
            >
              Program
            </Typography>
            <Stack spacing={0.5}>
              {site.schedule.map((entry) => (
                <Stack
                  key={entry.day}
                  direction="row"
                  justifyContent="space-between"
                  spacing={2}
                  sx={{ maxWidth: 260 }}
                >
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {entry.day}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 500 }}>
                    {entry.hours}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Grid>
        </Grid>

        <Divider sx={{ mt: { xs: 5, md: 6 }, mb: 2.5 }} />

        {/* Bara de jos */}
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', md: 'center' }}
          spacing={2}
        >
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            © {new Date().getFullYear()} {site.name}. Toate drepturile rezervate.
          </Typography>

          <Stack
            direction="row"
            useFlexGap
            flexWrap="wrap"
            sx={{ columnGap: 2.5, rowGap: 1 }}
            alignItems="center"
          >
            {legalLinks.map((link) => (
              <Link
                key={link.to}
                component={RouterLink}
                to={link.to}
                sx={{ ...footerLinkSx, fontSize: '0.875rem' }}
              >
                {link.label}
              </Link>
            ))}
            {externalLegalLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                sx={{ ...footerLinkSx, fontSize: '0.875rem' }}
              >
                {link.label}
              </Link>
            ))}
          </Stack>
        </Stack>
      </Container>
    </Box>
  )
}
