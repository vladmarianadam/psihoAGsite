import { useState } from 'react'
import { Link as RouterLink, NavLink, useLocation } from 'react-router-dom'
import {
  AppBar,
  Box,
  Button,
  Container,
  IconButton,
  Stack,
  Toolbar,
  Typography,
  useScrollTrigger,
  useTheme,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import MenuIcon from '@mui/icons-material/Menu'
import PhoneIcon from '@mui/icons-material/Phone'

import { phoneHref, site } from '../../config/site'
import ThemeToggle from '../common/ThemeToggle'
import MobileDrawer from './MobileDrawer'

/** Navigația publică. Panoul de management nu apare deliberat aici (plan §7). */
const navLinks: ReadonlyArray<{ label: string; to: string; end: boolean }> = [
  { label: 'Acasă', to: '/', end: true },
  { label: 'Despre', to: '/despre', end: false },
  { label: 'Servicii', to: '/servicii', end: false },
  { label: 'Blog', to: '/blog', end: false },
  { label: 'Contact', to: '/contact', end: false },
]

export default function Navbar() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  // Fundal transparent cât timp pagina e la început, opac + blur după derulare.
  const scrolled = useScrollTrigger({ disableHysteresis: true, threshold: 0 })
  const { pathname } = useLocation()
  const { palette } = useTheme()
  // Pe pagina principală, tema cu fotografie ridică hero-ul sub bara de navigare: textul
  // trece pe deschis până când vizitatorul derulează și bara primește fundal opac.
  const overPhoto = Boolean(palette.brand.imagery) && pathname === '/' && !scrolled
  const inkColor = overPhoto ? 'common.white' : 'text.primary'
  const inkMuted = overPhoto ? 'rgba(255, 255, 255, 0.78)' : 'text.secondary'

  return (
    <>
      <AppBar
        position="sticky"
        sx={(theme) => ({
          backgroundColor: scrolled ? alpha(theme.palette.background.default, 0.88) : 'transparent',
          backdropFilter: scrolled ? 'saturate(180%) blur(12px)' : 'none',
          boxShadow: scrolled ? `0 6px 24px rgba(${theme.palette.brand.shadowRgb}, 0.08)` : 'none',
          borderBottom: '1px solid',
          borderColor: scrolled ? 'divider' : 'transparent',
          color: inkColor,
          transition: 'background-color .3s ease, box-shadow .3s ease, border-color .3s ease, color .3s ease',
        })}
      >
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ minHeight: { xs: 68, md: 80 }, gap: 2 }}>
            {/* Logo text */}
            <Box
              component={RouterLink}
              to="/"
              aria-label={`${site.name} — pagina principală`}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                textDecoration: 'none',
                mr: 'auto',
                minWidth: 0,
              }}
            >
              <Typography
                variant="h4"
                component="span"
                sx={{ fontSize: { xs: '1.15rem', md: '1.35rem' }, lineHeight: 1.15, color: inkColor }}
              >
                {site.shortName}
              </Typography>
              <Typography
                variant="caption"
                component="span"
                sx={{
                  color: inkMuted,
                  fontSize: { xs: '0.625rem', md: '0.6875rem' },
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {site.role}
              </Typography>
            </Box>

            {/* Desktop: linkuri + telefon + CTA */}
            <Stack
              direction="row"
              alignItems="center"
              spacing={0.5}
              sx={{ display: { xs: 'none', md: 'flex' } }}
            >
              {navLinks.map((link) => (
                <Button
                  key={link.to}
                  component={NavLink}
                  to={link.to}
                  end={link.end}
                  disableRipple
                  sx={(theme) => ({
                    px: 1.75,
                    color: inkColor,
                    fontWeight: 500,
                    '&:hover': {
                      backgroundColor: overPhoto
                        ? 'rgba(255, 255, 255, 0.10)'
                        : alpha(theme.palette.primary.main, 0.06),
                    },
                    '&.active': {
                      color: overPhoto ? 'secondary.main' : 'primary.main',
                      fontWeight: 600,
                      backgroundColor: overPhoto
                        ? 'rgba(255, 255, 255, 0.12)'
                        : alpha(theme.palette.primary.main, 0.09),
                    },
                  })}
                >
                  {link.label}
                </Button>
              ))}
            </Stack>

            <Stack
              direction="row"
              alignItems="center"
              spacing={1.5}
              sx={{ display: { xs: 'none', md: 'flex' }, ml: 1.5 }}
            >
              <ThemeToggle color={inkColor} />
              <Button
                href={phoneHref}
                startIcon={<PhoneIcon fontSize="small" />}
                sx={{ color: inkColor, fontWeight: 500 }}
              >
                {site.phone}
              </Button>
              <Button
                component={RouterLink}
                to="/contact"
                variant="contained"
                color={overPhoto ? 'secondary' : 'primary'}
              >
                Solicită o programare
              </Button>
            </Stack>

            {/* Mobil: telefon + hamburger */}
            <Stack
              direction="row"
              alignItems="center"
              spacing={0.5}
              sx={{ display: { xs: 'flex', md: 'none' } }}
            >
              <ThemeToggle size="medium" color={inkColor} />
              <IconButton
                href={phoneHref}
                aria-label={`Sună la ${site.phone}`}
                sx={{ color: overPhoto ? 'secondary.main' : 'primary.main' }}
              >
                <PhoneIcon />
              </IconButton>
              <IconButton
                onClick={() => setDrawerOpen(true)}
                aria-label="Deschide meniul de navigare"
                aria-expanded={drawerOpen}
                aria-controls="meniu-mobil"
                sx={{ color: inkColor }}
              >
                <MenuIcon />
              </IconButton>
            </Stack>
          </Toolbar>
        </Container>
      </AppBar>

      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  )
}
