import type { ReactNode } from 'react'
import { Link as RouterLink, useLocation } from 'react-router-dom'
import { List, ListItem, ListItemButton, ListItemIcon, ListItemText } from '@mui/material'
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined'
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined'
import EventNoteOutlinedIcon from '@mui/icons-material/EventNoteOutlined'
import FormatQuoteOutlinedIcon from '@mui/icons-material/FormatQuoteOutlined'
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined'
import QuizOutlinedIcon from '@mui/icons-material/QuizOutlined'
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined'
import SpaOutlinedIcon from '@mui/icons-material/SpaOutlined'

export interface AdminSidebarProps {
  /** Închide drawerul temporar de pe mobil după navigare. */
  onNavigate?: () => void
}

interface NavItem {
  label: string
  to: string
  icon: ReactNode
}

const navItems: NavItem[] = [
  { label: 'Dashboard', to: '/management', icon: <DashboardOutlinedIcon fontSize="small" /> },
  { label: 'Articole', to: '/management/articole', icon: <ArticleOutlinedIcon fontSize="small" /> },
  { label: 'Categorii', to: '/management/categorii', icon: <LocalOfferOutlinedIcon fontSize="small" /> },
  { label: 'Servicii', to: '/management/servicii', icon: <SpaOutlinedIcon fontSize="small" /> },
  { label: 'Testimoniale', to: '/management/testimoniale', icon: <FormatQuoteOutlinedIcon fontSize="small" /> },
  {
    label: 'Întrebări frecvente',
    to: '/management/intrebari-frecvente',
    icon: <QuizOutlinedIcon fontSize="small" />,
  },
  { label: 'Programări', to: '/management/programari', icon: <EventNoteOutlinedIcon fontSize="small" /> },
  { label: 'Setări', to: '/management/setari', icon: <SettingsOutlinedIcon fontSize="small" /> },
]

/** Dashboardul este ruta index, deci se potrivește exact; restul acceptă și subrute. */
function isItemActive(pathname: string, to: string): boolean {
  if (to === '/management') {
    return pathname === '/management' || pathname === '/management/'
  }
  return pathname === to || pathname.startsWith(`${to}/`)
}

export default function AdminSidebar({ onNavigate }: AdminSidebarProps) {
  const { pathname } = useLocation()

  return (
    <List sx={{ px: 1, py: 1 }}>
      {navItems.map((item) => {
        const active = isItemActive(pathname, item.to)

        return (
          <ListItem key={item.to} disablePadding sx={{ mb: 0.25 }}>
            <ListItemButton
              component={RouterLink}
              to={item.to}
              onClick={onNavigate}
              selected={active}
              aria-current={active ? 'page' : undefined}
              sx={{
                borderRadius: 2,
                py: 1,
                color: 'text.primary',
                '& .MuiListItemIcon-root': { color: 'text.secondary' },
                '&.Mui-selected': {
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  '& .MuiListItemIcon-root': { color: 'primary.contrastText' },
                  '&:hover': { bgcolor: 'primary.dark' },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 38 }}>{item.icon}</ListItemIcon>
              <ListItemText
                primary={item.label}
                slotProps={{
                  primary: { sx: { fontSize: '0.9375rem', fontWeight: active ? 600 : 500 } },
                }}
              />
            </ListItemButton>
          </ListItem>
        )
      })}
    </List>
  )
}
