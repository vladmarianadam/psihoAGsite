import { useState } from 'react'
import { Link as RouterLink, Outlet } from 'react-router-dom'
import {
  Alert,
  AppBar,
  Box,
  Button,
  Container,
  Divider,
  Drawer,
  IconButton,
  Link,
  Toolbar,
  Typography,
} from '@mui/material'
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined'
import MenuOutlinedIcon from '@mui/icons-material/MenuOutlined'
import OpenInNewOutlinedIcon from '@mui/icons-material/OpenInNewOutlined'

import Seo from '../../../components/common/Seo'
import { site } from '../../../config/site'
import { useAuth } from '../hooks/useAuth'
import AdminSidebar from './AdminSidebar'

const DRAWER_WIDTH = 264

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const closeDrawer = () => setMobileOpen(false)

  // Nu navigăm explicit: la golirea sesiunii, ProtectedRoute duce spre pagina de login.
  const handleLogout = async () => {
    setLoggingOut(true)
    await logout()
  }

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Toolbar sx={{ px: 2.5, alignItems: 'center' }}>
        <Box>
          <Typography sx={{ fontWeight: 600, lineHeight: 1.3 }}>{site.shortName}</Typography>
          <Typography variant="caption" color="text.secondary">
            Administrare conținut
          </Typography>
        </Box>
      </Toolbar>
      <Divider />

      <AdminSidebar onNavigate={closeDrawer} />

      <Box sx={{ mt: 'auto', p: 2 }}>
        <Divider sx={{ mb: 2 }} />
        <Button
          component="a"
          href="/"
          target="_blank"
          rel="noopener"
          size="small"
          color="inherit"
          startIcon={<OpenInNewOutlinedIcon fontSize="small" />}
          sx={{ color: 'text.secondary' }}
        >
          Vezi site-ul public
        </Button>
      </Box>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Seo title="Administrare" noIndex />

      <AppBar
        position="fixed"
        color="inherit"
        sx={{
          bgcolor: 'background.paper',
          borderBottom: 1,
          borderColor: 'divider',
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
        }}
      >
        <Toolbar sx={{ gap: 1.5 }}>
          <IconButton
            onClick={() => setMobileOpen(true)}
            aria-label="Deschide meniul de administrare"
            sx={{ display: { md: 'none' }, ml: -1 }}
          >
            <MenuOutlinedIcon />
          </IconButton>

          <Typography component="p" sx={{ flexGrow: 1, fontWeight: 600 }}>
            Panou de administrare
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ display: { xs: 'none', sm: 'block' } }}
          >
            {user?.fullName ?? user?.username ?? ''}
          </Typography>

          <Button
            onClick={handleLogout}
            loading={loggingOut}
            size="small"
            color="inherit"
            startIcon={<LogoutOutlinedIcon fontSize="small" />}
          >
            Deconectare
          </Button>
        </Toolbar>
      </AppBar>

      {/* Paper-ul unui Drawer permanent este poziționat fix, deci nu ocupă spațiu în flex:
          containerul de navigare trebuie să rezerve explicit lățimea, altfel conținutul
          principal intră sub sidebar. */}
      <Box
        component="nav"
        aria-label="Navigare administrare"
        sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={closeDrawer}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
          }}
        >
          {drawerContent}
        </Drawer>

        <Drawer
          variant="permanent"
          open
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
              borderRight: 1,
              borderColor: 'divider',
              bgcolor: 'background.paper',
            },
          }}
        >
          {drawerContent}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{ flexGrow: 1, width: { md: `calc(100% - ${DRAWER_WIDTH}px)` }, minWidth: 0 }}
      >
        <Toolbar />
        <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
          {user?.mustChangePassword && (
            <Alert severity="warning" sx={{ mb: 3 }}>
              Contul folosește încă parola temporară.{' '}
              <Link component={RouterLink} to="/management/setari" sx={{ fontWeight: 600 }}>
                Schimbă parola temporară
              </Link>
            </Alert>
          )}

          <Outlet />
        </Container>
      </Box>
    </Box>
  )
}
