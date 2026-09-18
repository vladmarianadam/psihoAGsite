import { useEffect, useState } from 'react'
import { Link as RouterLink, NavLink } from 'react-router-dom'
import {
  Box,
  Button,
  Collapse,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material'
import { alpha, type Theme } from '@mui/material/styles'
import CloseIcon from '@mui/icons-material/Close'
import EmailIcon from '@mui/icons-material/Email'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import PhoneIcon from '@mui/icons-material/Phone'

import { getServices } from '../../api/services'
import type { ServiceListItemDto } from '../../api/types'
import { mailHref, phoneHref, site } from '../../config/site'

export interface MobileDrawerProps {
  open: boolean
  onClose: () => void
}

const navLinks: ReadonlyArray<{ label: string; to: string; end: boolean }> = [
  { label: 'Acasă', to: '/', end: true },
  { label: 'Despre', to: '/despre', end: false },
  { label: 'Blog', to: '/blog', end: false },
  { label: 'Contact', to: '/contact', end: false },
]

/** Stilul comun al linkurilor din listă, cu evidențierea rutei active. */
const linkSx = (theme: Theme) => ({
  borderRadius: 2,
  py: 1.25,
  color: theme.palette.text.primary,
  '&.active': {
    color: theme.palette.primary.main,
    backgroundColor: alpha(theme.palette.primary.main, 0.09),
  },
})

export default function MobileDrawer({ open, onClose }: MobileDrawerProps) {
  const [servicesOpen, setServicesOpen] = useState(false)
  const [services, setServices] = useState<ServiceListItemDto[]>([])
  const [servicesLoaded, setServicesLoaded] = useState(false)

  // Serviciile se încarcă doar la prima deschidere a meniului.
  useEffect(() => {
    if (!open || servicesLoaded) return

    let cancelled = false

    getServices()
      .then((result) => {
        if (!cancelled) {
          setServices(result)
          setServicesLoaded(true)
        }
      })
      .catch(() => {
        // Dacă lista nu poate fi încărcată, submeniul păstrează linkul general.
        if (!cancelled) setServicesLoaded(true)
      })

    return () => {
      cancelled = true
    }
  }, [open, servicesLoaded])

  return (
    <Drawer
      anchor="right"
      variant="temporary"
      open={open}
      onClose={onClose}
      slotProps={{ paper: { sx: { width: { xs: '86vw', sm: 360 }, maxWidth: 400 } } }}
    >
      <Box id="meniu-mobil" component="nav" aria-label="Meniu principal" sx={{ p: 2 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <Typography variant="h4" component="span" sx={{ fontSize: '1.2rem', lineHeight: 1.15 }}>
              {site.shortName}
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: 'text.secondary', letterSpacing: '0.06em', textTransform: 'uppercase' }}
            >
              {site.role}
            </Typography>
          </Box>
          <IconButton onClick={onClose} aria-label="Închide meniul">
            <CloseIcon />
          </IconButton>
        </Stack>

        <Divider sx={{ mb: 1 }} />

        <List disablePadding>
          {navLinks.slice(0, 2).map((link) => (
            <ListItemButton
              key={link.to}
              component={NavLink}
              to={link.to}
              end={link.end}
              onClick={onClose}
              sx={linkSx}
            >
              <ListItemText primary={link.label} />
            </ListItemButton>
          ))}

          {/* Servicii — submeniu expandabil */}
          <ListItemButton
            onClick={() => setServicesOpen((previous) => !previous)}
            aria-expanded={servicesOpen}
            sx={{ borderRadius: 2, py: 1.25 }}
          >
            <ListItemText primary="Servicii" />
            {servicesOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </ListItemButton>

          <Collapse in={servicesOpen} timeout="auto" unmountOnExit>
            <List disablePadding sx={{ pl: 1.5 }}>
              <ListItemButton component={NavLink} to="/servicii" end onClick={onClose} sx={linkSx}>
                <ListItemText
                  primary={
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Toate serviciile
                    </Typography>
                  }
                />
              </ListItemButton>

              {!servicesLoaded &&
                [0, 1, 2].map((index) => (
                  <Box key={index} sx={{ px: 2, py: 1 }}>
                    <Skeleton variant="text" width="80%" />
                  </Box>
                ))}

              {servicesLoaded &&
                services.map((service) => (
                  <ListItemButton
                    key={service.id}
                    component={NavLink}
                    to={`/servicii/${service.slug}`}
                    onClick={onClose}
                    sx={linkSx}
                  >
                    <ListItemText primary={<Typography variant="body2">{service.name}</Typography>} />
                  </ListItemButton>
                ))}
            </List>
          </Collapse>

          {navLinks.slice(2).map((link) => (
            <ListItemButton
              key={link.to}
              component={NavLink}
              to={link.to}
              end={link.end}
              onClick={onClose}
              sx={linkSx}
            >
              <ListItemText primary={link.label} />
            </ListItemButton>
          ))}
        </List>

        <Button
          component={RouterLink}
          to="/contact"
          onClick={onClose}
          variant="contained"
          fullWidth
          size="large"
          sx={{ mt: 2.5 }}
        >
          Solicită o programare
        </Button>

        <Divider sx={{ my: 2.5 }} />

        <List disablePadding>
          <ListItemButton component="a" href={phoneHref} sx={{ borderRadius: 2 }}>
            <ListItemIcon sx={{ minWidth: 40, color: 'primary.main' }}>
              <PhoneIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary={<Typography variant="body2">{site.phone}</Typography>} />
          </ListItemButton>
          <ListItemButton component="a" href={mailHref} sx={{ borderRadius: 2 }}>
            <ListItemIcon sx={{ minWidth: 40, color: 'primary.main' }}>
              <EmailIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary={<Typography variant="body2">{site.email}</Typography>} />
          </ListItemButton>
        </List>
      </Box>
    </Drawer>
  )
}
