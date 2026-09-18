import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import {
  Box,
  Button,
  Chip,
  Divider,
  Grid,
  Link,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import AddOutlinedIcon from '@mui/icons-material/AddOutlined'
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import EditNoteOutlinedIcon from '@mui/icons-material/EditNoteOutlined'
import EventNoteOutlinedIcon from '@mui/icons-material/EventNoteOutlined'
import MailOutlineIcon from '@mui/icons-material/MailOutline'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'

import CrudPageShell from '../components/CrudPageShell'
import { getErrorMessage } from '../../../api/client'
import { getDashboardStats } from '../../../api/dashboard'
import { articleStatusLabels, sessionModeLabels } from '../../../api/types'
import type { DashboardStatsDto } from '../../../api/types'
import { formatDateTimeRo } from '../../../components/common/formatters'

const numberFormatter = new Intl.NumberFormat('ro-RO')

interface StatCardProps {
  label: string
  value: number
  hint?: string
  icon: ReactNode
  /** Token de culoare din temă, ex. `primary.main`. */
  color: string
}

function StatCard({ label, value, hint, icon, color }: StatCardProps) {
  return (
    <Paper variant="outlined" sx={{ p: 2.5, height: '100%' }}>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
        <Box
          aria-hidden
          sx={{
            width: 40,
            height: 40,
            flexShrink: 0,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color,
            bgcolor: 'action.hover',
          }}
        >
          {icon}
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h4" component="p" sx={{ lineHeight: 1.1 }}>
            {numberFormatter.format(value)}
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>
            {label}
          </Typography>
          {hint !== undefined && (
            <Typography variant="caption" color="text.secondary">
              {hint}
            </Typography>
          )}
        </Box>
      </Stack>
    </Paper>
  )
}

export default function DashboardPage() {
  const navigate = useNavigate()

  const [stats, setStats] = useState<DashboardStatsDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    getDashboardStats()
      .then((data) => {
        if (!cancelled) setStats(data)
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

  return (
    <CrudPageShell
      title="Dashboard"
      description="Privire de ansamblu asupra conținutului publicat și a cererilor primite prin site."
      actionLabel="Articol nou"
      onAction={() => navigate('/management/articole/nou')}
      loading={loading}
      error={error}
      empty={stats === null}
      emptyMessage="Nu am putut încărca statisticile panoului."
    >
      {stats !== null && (
        <Stack spacing={4}>
          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <StatCard
                label="Articole în total"
                value={stats.totalArticles}
                icon={<ArticleOutlinedIcon fontSize="small" />}
                color="primary.main"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <StatCard
                label="Articole publicate"
                value={stats.publishedArticles}
                icon={<CheckCircleOutlineIcon fontSize="small" />}
                color="success.main"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <StatCard
                label="Ciorne"
                value={stats.draftArticles}
                hint="Nepublicate încă"
                icon={<EditNoteOutlinedIcon fontSize="small" />}
                color="warning.main"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <StatCard
                label="Cereri de programare noi"
                value={stats.newAppointmentRequests}
                hint={`Din ${numberFormatter.format(stats.totalAppointmentRequests)} în total`}
                icon={<EventNoteOutlinedIcon fontSize="small" />}
                color="secondary.dark"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <StatCard
                label="Mesaje de contact noi"
                value={stats.newContactMessages}
                hint="Netratate"
                icon={<MailOutlineIcon fontSize="small" />}
                color="info.main"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <StatCard
                label="Vizualizări de articole"
                value={stats.totalViews}
                hint="Cumulat, de la publicare"
                icon={<VisibilityOutlinedIcon fontSize="small" />}
                color="text.secondary"
              />
            </Grid>
          </Grid>

          <Paper variant="outlined" sx={{ p: { xs: 2, sm: 2.5 } }}>
            <Typography variant="h6" component="h2" sx={{ mb: 1 }}>
              Acțiuni rapide
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <Button
                component={RouterLink}
                to="/management/articole/nou"
                variant="contained"
                startIcon={<AddOutlinedIcon fontSize="small" />}
              >
                Articol nou
              </Button>
              <Button
                component={RouterLink}
                to="/management/programari"
                variant="outlined"
                startIcon={<EventNoteOutlinedIcon fontSize="small" />}
              >
                Vezi programările
              </Button>
            </Stack>
          </Paper>

          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, lg: 5 }}>
              <Paper variant="outlined" sx={{ height: '100%' }}>
                <Box sx={{ px: 2.5, py: 2 }}>
                  <Typography variant="h6" component="h2">
                    Cele mai citite articole
                  </Typography>
                </Box>
                <Divider />

                {stats.mostViewedArticles.length === 0 ? (
                  <Box sx={{ px: 2.5, py: 3 }}>
                    <Typography variant="body2" color="text.secondary">
                      Încă nu există vizualizări înregistrate.
                    </Typography>
                  </Box>
                ) : (
                  <List disablePadding>
                    {stats.mostViewedArticles.map((article) => (
                      <ListItem key={article.id} disablePadding divider>
                        <ListItemButton component={RouterLink} to={`/management/articole/${article.id}`}>
                          <ListItemText
                            primary={article.title}
                            secondary={`${numberFormatter.format(article.viewCount)} vizualizări · ${articleStatusLabels[article.status]}`}
                            slotProps={{
                              primary: { sx: { fontWeight: 600, fontSize: '0.9375rem' } },
                              secondary: { sx: { fontSize: '0.8125rem' } },
                            }}
                          />
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                )}
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, lg: 7 }}>
              <Paper variant="outlined" sx={{ height: '100%' }}>
                <Stack
                  direction="row"
                  sx={{ px: 2.5, py: 2, alignItems: 'center', justifyContent: 'space-between', gap: 1 }}
                >
                  <Typography variant="h6" component="h2">
                    Ultimele cereri de programare
                  </Typography>
                  <Link component={RouterLink} to="/management/programari" variant="body2">
                    Toate cererile
                  </Link>
                </Stack>
                <Divider />

                {stats.latestAppointmentRequests.length === 0 ? (
                  <Box sx={{ px: 2.5, py: 3 }}>
                    <Typography variant="body2" color="text.secondary">
                      Nu există cereri de programare înregistrate.
                    </Typography>
                  </Box>
                ) : (
                  <TableContainer sx={{ overflowX: 'auto' }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Nume</TableCell>
                          <TableCell>Contact</TableCell>
                          <TableCell>Serviciu</TableCell>
                          <TableCell>Mod</TableCell>
                          <TableCell>Stare</TableCell>
                          <TableCell>Data</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {stats.latestAppointmentRequests.map((request) => (
                          <TableRow key={request.id} hover>
                            <TableCell sx={{ fontWeight: 600 }}>{request.fullName}</TableCell>
                            <TableCell>
                              <Stack spacing={0.25}>
                                <Link href={`tel:${request.phone}`} variant="body2">
                                  {request.phone}
                                </Link>
                                <Link href={`mailto:${request.email}`} variant="body2">
                                  {request.email}
                                </Link>
                              </Stack>
                            </TableCell>
                            <TableCell>{request.serviceName ?? 'Nespecificat'}</TableCell>
                            <TableCell>{sessionModeLabels[request.preferredMode]}</TableCell>
                            <TableCell>
                              <Chip
                                size="small"
                                variant={request.isHandled ? 'filled' : 'outlined'}
                                color={request.isHandled ? 'success' : 'warning'}
                                label={request.isHandled ? 'Tratată' : 'Netratată'}
                              />
                            </TableCell>
                            <TableCell sx={{ whiteSpace: 'nowrap' }}>
                              {formatDateTimeRo(request.createdAt)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Paper>
            </Grid>
          </Grid>
        </Stack>
      )}
    </CrudPageShell>
  )
}
