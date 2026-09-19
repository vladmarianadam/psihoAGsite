import { useEffect, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { Box, Chip, Container, Divider, Grid, Link, Skeleton, Stack, Typography, useTheme } from '@mui/material'
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

/**
 * Culorile footerului. Pe fundal deschis (tema „calm”) se folosesc culorile temei; peste
 * fotografia întunecată (tema „seaside”) textul trece pe alb translucid.
 */
interface FooterTone {
  title: string
  text: string
  strong: string
  link: string
  linkHover: string
  icon: string
  divider: string
}

const lightTone: FooterTone = {
  title: 'text.primary',
  text: 'text.secondary',
  strong: 'text.primary',
  link: 'text.secondary',
  linkHover: 'primary.main',
  icon: 'primary.main',
  divider: 'divider',
}

const darkTone: FooterTone = {
  title: 'common.white',
  text: 'rgba(255, 255, 255, 0.76)',
  strong: 'common.white',
  link: 'rgba(255, 255, 255, 0.78)',
  linkHover: 'secondary.main',
  icon: 'secondary.main',
  divider: 'rgba(255, 255, 255, 0.16)',
}

export default function Footer() {
  const { palette } = useTheme()
  const imagery = palette.brand.imagery
  const tone = imagery ? darkTone : lightTone

  const columnTitleSx = {
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: tone.title,
    mb: 2,
  } as const

  const footerLinkSx = {
    color: tone.link,
    fontSize: '0.9375rem',
    '&:hover': { color: tone.linkHover },
  } as const

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
        color: tone.text,
        backgroundColor: imagery ? palette.brand.primaryDark : 'background.paper',
        borderTop: '1px solid',
        borderColor: imagery ? 'transparent' : 'divider',
        // Cu fotografie: banda de faleză cu maci, întunecată ca textul să rămână lizibil.
        ...(imagery && {
          backgroundImage: [
            `linear-gradient(180deg, rgba(${imagery.overlayRgb}, 0.94) 0%, rgba(${imagery.overlayRgb}, 0.80) 45%, rgba(${imagery.overlayRgb}, 0.90) 100%)`,
            `url(${imagery.footer})`,
          ].join(', '),
          backgroundSize: 'cover',
          backgroundPosition: 'center 40%',
          backgroundRepeat: 'no-repeat',
        }),
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={{ xs: 4, md: 5 }}>
          {/* 1. Identitatea cabinetului */}
          <Grid size={{ xs: 12, md: 3 }}>
            <Typography
              variant="h4"
              component="p"
              sx={{ fontSize: '1.25rem', mb: 1.5, color: tone.title }}
            >
              {site.name}
            </Typography>
            <Typography variant="body2" sx={{ color: tone.text, mb: 2.5 }}>
              Sprijin psihologic pentru copii, adolescenți și adulți — ședințe în cabinet
              sau online, într-un cadru confidențial și lipsit de grabă.
            </Typography>
            <Chip
              icon={<VerifiedIcon />}
              label={site.copsi}
              variant="outlined"
              size="small"
              sx={{
                height: 'auto',
                py: 0.75,
                '& .MuiChip-label': { whiteSpace: 'normal' },
                ...(imagery && {
                  color: tone.text,
                  borderColor: tone.divider,
                  '& .MuiChip-icon': { color: tone.icon },
                }),
              }}
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
                    <Skeleton
                      variant="text"
                      width="85%"
                      sx={imagery ? { bgcolor: 'rgba(255, 255, 255, 0.14)' } : undefined}
                    />
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
                <LocationOnIcon fontSize="small" sx={{ color: tone.icon, mt: 0.25 }} />
                <Typography variant="body2" sx={{ color: tone.text }}>
                  {site.address.street}
                  <br />
                  {site.address.city}, {site.address.country}
                </Typography>
              </Stack>

              <Stack direction="row" spacing={1.25} alignItems="center">
                <PhoneIcon fontSize="small" sx={{ color: tone.icon }} />
                <Link href={phoneHref} sx={footerLinkSx}>
                  {site.phone}
                </Link>
              </Stack>

              <Stack direction="row" spacing={1.25} alignItems="center">
                <EmailIcon fontSize="small" sx={{ color: tone.icon }} />
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
                  <Typography variant="body2" sx={{ color: tone.text }}>
                    {entry.day}
                  </Typography>
                  <Typography variant="body2" sx={{ color: tone.strong, fontWeight: 500 }}>
                    {entry.hours}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Grid>
        </Grid>

        <Divider sx={{ mt: { xs: 5, md: 6 }, mb: 2.5, borderColor: tone.divider }} />

        {/* Bara de jos */}
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', md: 'center' }}
          spacing={2}
        >
          <Typography variant="body2" sx={{ color: tone.text }}>
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
