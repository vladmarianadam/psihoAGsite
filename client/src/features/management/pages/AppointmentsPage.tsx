import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
  Link,
  Pagination,
  Paper,
  Skeleton,
  Stack,
  Switch,
  Tab,
  Tabs,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material'
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined'

import CrudPageShell from '../components/CrudPageShell'
import { getErrorMessage } from '../../../api/client'
import {
  cancelAppointment,
  confirmAppointment,
  deleteAppointmentRequest,
  deleteContactMessage,
  getAppointmentRequests,
  getContactMessages,
  markAppointmentHandled,
  markContactMessageHandled,
  rejectAppointment,
  resyncAppointment,
} from '../../../api/appointments'
import { appointmentStatusLabels, sessionModeLabels } from '../../../api/types'
import type {
  AppointmentRequestDto,
  AppointmentStatus,
  AppointmentTab,
  ContactMessageDto,
} from '../../../api/types'
import { formatDateRo, formatDateTimeRo } from '../../../components/common/formatters'

const PAGE_SIZE = 10

type HandledFilter = 'all' | 'pending' | 'handled'

/** `undefined` înseamnă „fără filtru” — parametrul nu ajunge în query string. */
function handledParam(filter: HandledFilter): boolean | undefined {
  if (filter === 'pending') return false
  if (filter === 'handled') return true
  return undefined
}

type PaginationItemType =
  | 'page'
  | 'first'
  | 'last'
  | 'next'
  | 'previous'
  | 'start-ellipsis'
  | 'end-ellipsis'

function paginationAriaLabel(type: PaginationItemType, page: number | null): string {
  switch (type) {
    case 'first':
      return 'Prima pagină'
    case 'last':
      return 'Ultima pagină'
    case 'next':
      return 'Pagina următoare'
    case 'previous':
      return 'Pagina anterioară'
    case 'page':
      return `Pagina ${page ?? ''}`
    default:
      return 'Mai multe pagini'
  }
}

interface FilterToggleProps {
  value: HandledFilter
  onChange: (value: HandledFilter) => void
  label: string
}

function FilterToggle({ value, onChange, label }: FilterToggleProps) {
  return (
    <ToggleButtonGroup
      size="small"
      exclusive
      value={value}
      onChange={(_event, next: HandledFilter | null) => {
        if (next !== null) onChange(next)
      }}
      aria-label={label}
    >
      <ToggleButton value="all">Toate</ToggleButton>
      <ToggleButton value="pending">Netratate</ToggleButton>
      <ToggleButton value="handled">Tratate</ToggleButton>
    </ToggleButtonGroup>
  )
}

interface DetailFieldProps {
  label: string
  children: ReactNode
}

function DetailField({ label, children }: DetailFieldProps) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
        {label}
      </Typography>
      <Typography variant="body2" component="div">
        {children}
      </Typography>
    </Box>
  )
}

function ListSkeleton() {
  return (
    <Stack spacing={1.5} aria-busy="true">
      {[0, 1, 2].map((row) => (
        <Skeleton key={row} variant="rounded" height={148} />
      ))}
    </Stack>
  )
}

const GDPR_WARNING =
  'Ștergerea este definitivă. Datele personale din formulare se păstrează doar atât cât este necesar pentru programare, apoi se șterg (retenție limitată, GDPR — plan §10).'

// ------------------------------------------------- Cereri de programare ---

const appointmentTabs: { value: AppointmentTab; label: string; empty: string }[] = [
  { value: 'Pending', label: 'În așteptare', empty: 'Nu există cereri care așteaptă confirmare.' },
  { value: 'Confirmed', label: 'Confirmate', empty: 'Nu există programări confirmate în viitor.' },
  { value: 'History', label: 'Istoric', empty: 'Istoricul este gol.' },
]

const statusColors: Record<AppointmentStatus, 'warning' | 'success' | 'error' | 'default'> = {
  Pending: 'warning',
  Confirmed: 'success',
  Rejected: 'error',
  Cancelled: 'default',
  Legacy: 'default',
}

// Ora cabinetului, indiferent de fusul orar al browserului.
const SLOT_TIME_ZONE = 'Europe/Bucharest'

/** Ex.: „luni, 12 octombrie 2026, 10:00–10:50”. */
function formatSlot(startAt: string, endAt: string | null): string {
  const start = formatDateRo(startAt, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: SLOT_TIME_ZONE,
  })
  const end = formatDateRo(endAt, { hour: '2-digit', minute: '2-digit', timeZone: SLOT_TIME_ZONE })
  return end === '' ? start : `${start}–${end}`
}

type ActionKind = 'confirm' | 'reject' | 'cancel'

const actionTexts: Record<ActionKind, { title: string; button: string; success: string }> = {
  confirm: {
    title: 'Confirmi programarea?',
    button: 'Confirmă',
    success: 'Programarea a fost confirmată, iar clientul a primit invitația pe email.',
  },
  reject: {
    title: 'Respingi cererea?',
    button: 'Respinge',
    success: 'Cererea a fost respinsă, iar clientul a fost anunțat pe email.',
  },
  cancel: {
    title: 'Anulezi programarea?',
    button: 'Anulează programarea',
    success: 'Programarea a fost anulată, iar clientul a fost anunțat pe email.',
  },
}

interface PendingAction {
  kind: ActionKind
  request: AppointmentRequestDto
}

function AppointmentsPanel() {
  const [tab, setTab] = useState<AppointmentTab>('Pending')
  const [items, setItems] = useState<AppointmentRequestDto[]>([])
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)

  const [notes, setNotes] = useState<Record<number, string>>({})
  const [savingId, setSavingId] = useState<number | null>(null)
  const [savedId, setSavedId] = useState<number | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AppointmentRequestDto | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [action, setAction] = useState<PendingAction | null>(null)
  const [reason, setReason] = useState('')
  const [acting, setActing] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    getAppointmentRequests({ status: tab, page, pageSize: PAGE_SIZE })
      .then((result) => {
        if (cancelled) return
        setItems(result.items)
        setTotalPages(Math.max(result.totalPages, 1))
        setNotes(Object.fromEntries(result.items.map((item) => [item.id, item.notes ?? ''])))
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
  }, [tab, page, reloadToken])

  const reload = () => setReloadToken((token) => token + 1)

  const changeTab = (next: AppointmentTab) => {
    setTab(next)
    setPage(1)
    setSuccess(null)
    setActionError(null)
  }

  const openAction = (kind: ActionKind, request: AppointmentRequestDto) => {
    setReason('')
    setAction({ kind, request })
  }

  const runAction = async () => {
    if (action === null) return

    setActing(true)
    setActionError(null)
    setSuccess(null)
    try {
      const { kind, request } = action
      const message = reason.trim() || null
      if (kind === 'confirm') await confirmAppointment(request.id)
      else if (kind === 'reject') await rejectAppointment(request.id, message)
      else await cancelAppointment(request.id, message)
      setSuccess(actionTexts[kind].success)
      reload()
    } catch (err) {
      // La 409, serverul trimite mesajul în `detail`, iar getErrorMessage îl întoarce ca atare.
      setActionError(getErrorMessage(err))
    } finally {
      setActing(false)
      setAction(null)
    }
  }

  const resync = async (request: AppointmentRequestDto) => {
    setActionError(null)
    setSuccess(null)
    setSavingId(request.id)
    try {
      await resyncAppointment(request.id)
      setSuccess('Sincronizarea cu Google Calendar a fost reluată.')
      reload()
    } catch (err) {
      setActionError(getErrorMessage(err))
    } finally {
      setSavingId(null)
    }
  }

  const toggleHandled = async (request: AppointmentRequestDto, isHandled: boolean) => {
    setActionError(null)
    setSavedId(null)
    setSavingId(request.id)
    try {
      await markAppointmentHandled(request.id, isHandled, notes[request.id] ?? request.notes)
      reload()
    } catch (err) {
      setActionError(getErrorMessage(err))
    } finally {
      setSavingId(null)
    }
  }

  const saveNotes = async (request: AppointmentRequestDto) => {
    setActionError(null)
    setSavedId(null)
    setSavingId(request.id)
    try {
      await markAppointmentHandled(request.id, request.isHandled, notes[request.id] ?? '')
      setSavedId(request.id)
      reload()
    } catch (err) {
      setActionError(getErrorMessage(err))
    } finally {
      setSavingId(null)
    }
  }

  const confirmDelete = async () => {
    if (deleteTarget === null) return

    setDeleting(true)
    setActionError(null)
    try {
      await deleteAppointmentRequest(deleteTarget.id)
      setDeleteTarget(null)
      reload()
    } catch (err) {
      setActionError(getErrorMessage(err))
    } finally {
      setDeleting(false)
    }
  }

  const actionText = action === null ? null : actionTexts[action.kind]

  return (
    <Stack spacing={2.5}>
      <Tabs
        value={tab}
        onChange={(_event, next: AppointmentTab) => changeTab(next)}
        aria-label="Starea programărilor"
        variant="scrollable"
        allowScrollButtonsMobile
      >
        {appointmentTabs.map((item) => (
          <Tab
            key={item.value}
            value={item.value}
            label={item.label}
            id={`tab-programari-${item.value}`}
            aria-controls="panou-programari"
          />
        ))}
      </Tabs>

      <Stack spacing={2.5} role="tabpanel" id="panou-programari" aria-labelledby={`tab-programari-${tab}`}>
        {error !== null && <Alert severity="error">{error}</Alert>}
        {actionError !== null && (
          <Alert severity="error" onClose={() => setActionError(null)}>
            {actionError}
          </Alert>
        )}
        {success !== null && (
          <Alert severity="success" onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        {loading ? (
          <ListSkeleton />
        ) : items.length === 0 ? (
          <Paper variant="outlined" sx={{ p: { xs: 3, sm: 5 }, textAlign: 'center' }}>
            <Typography color="text.secondary">
              {appointmentTabs.find((item) => item.value === tab)?.empty}
            </Typography>
          </Paper>
        ) : (
          <Stack spacing={2}>
            {items.map((request) => {
              const isLegacy = request.status === 'Legacy'
              const isPending = request.status === 'Pending'
              // Confirmatele trecute ajung în Istoric și nu mai au acțiuni.
              const isUpcoming = request.status === 'Confirmed' && tab === 'Confirmed'

              return (
                <Paper key={request.id} variant="outlined" sx={{ p: { xs: 2, sm: 2.5 } }}>
                  <Stack spacing={2}>
                    <Stack
                      direction={{ xs: 'column', md: 'row' }}
                      spacing={1.5}
                      sx={{ justifyContent: 'space-between', alignItems: { md: 'center' } }}
                    >
                      <Box sx={{ minWidth: 0 }}>
                        <Typography component="h3" sx={{ fontWeight: 600 }}>
                          {request.fullName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Primită la {formatDateTimeRo(request.createdAt)}
                        </Typography>
                      </Box>

                      <Stack
                        direction="row"
                        spacing={1}
                        useFlexGap
                        sx={{ alignItems: 'center', flexWrap: 'wrap', flexShrink: 0 }}
                      >
                        <Chip
                          size="small"
                          color={statusColors[request.status]}
                          label={appointmentStatusLabels[request.status]}
                        />
                        {request.status === 'Confirmed' && request.googleSyncState === 'Synced' && (
                          <Chip size="small" variant="outlined" color="success" label="Calendar ✓" />
                        )}
                        {request.status === 'Confirmed' && request.googleSyncState === 'Failed' && (
                          <>
                            <Chip size="small" variant="outlined" color="error" label="Calendar ✗" />
                            <Button
                              size="small"
                              onClick={() => void resync(request)}
                              loading={savingId === request.id}
                            >
                              Resincronizează
                            </Button>
                          </>
                        )}
                        {/* „Tratat” are sens doar pentru cererile vechi, fără flux de confirmare. */}
                        {isLegacy && (
                          <FormControlLabel
                            control={
                              <Switch
                                checked={request.isHandled}
                                disabled={savingId === request.id}
                                onChange={(event) => void toggleHandled(request, event.target.checked)}
                                slotProps={{
                                  input: { 'aria-label': `Cerere tratată: ${request.fullName}` },
                                }}
                              />
                            }
                            label="Tratat"
                          />
                        )}
                        {/* Ștergerea doar din Istoric, ca să nu rămână evenimente orfane în calendar. */}
                        {tab === 'History' && (
                          <Tooltip title="Șterge cererea">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => setDeleteTarget(request)}
                              aria-label={`Șterge cererea de la ${request.fullName}`}
                            >
                              <DeleteOutlineOutlinedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Stack>
                    </Stack>

                    <Divider />

                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, md: 6 }}>
                        {request.startAt !== null ? (
                          <DetailField label="Data și ora">
                            {formatSlot(request.startAt, request.endAt)}
                          </DetailField>
                        ) : (
                          <DetailField label="Interval preferat">
                            {request.preferredTimeframe ?? 'Neprecizat'}
                          </DetailField>
                        )}
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <DetailField label="Serviciu">{request.serviceName ?? 'Nespecificat'}</DetailField>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <DetailField label={isLegacy ? 'Mod preferat' : 'Mod'}>
                          {sessionModeLabels[request.preferredMode]}
                        </DetailField>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <DetailField label="Telefon">
                          <Link href={`tel:${request.phone}`}>{request.phone}</Link>
                        </DetailField>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <DetailField label="E-mail">
                          <Link href={`mailto:${request.email}`} sx={{ wordBreak: 'break-all' }}>
                            {request.email}
                          </Link>
                        </DetailField>
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <DetailField label="Mesaj">
                          {request.message === null || request.message === '' ? (
                            <Typography variant="body2" color="text.secondary" component="span">
                              Fără mesaj
                            </Typography>
                          ) : (
                            <Box component="span" sx={{ whiteSpace: 'pre-line' }}>
                              {request.message}
                            </Box>
                          )}
                        </DetailField>
                      </Grid>
                      {request.rejectReason !== null && request.rejectReason !== '' && (
                        <Grid size={12}>
                          <DetailField label="Mesaj trimis clientului">
                            <Box component="span" sx={{ whiteSpace: 'pre-line' }}>
                              {request.rejectReason}
                            </Box>
                          </DetailField>
                        </Grid>
                      )}
                    </Grid>

                    {(isPending || isUpcoming) && (
                      <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
                        {isPending && (
                          <>
                            <Button variant="contained" onClick={() => openAction('confirm', request)}>
                              Confirmă
                            </Button>
                            <Button
                              variant="outlined"
                              color="error"
                              onClick={() => openAction('reject', request)}
                            >
                              Respinge
                            </Button>
                          </>
                        )}
                        {isUpcoming && (
                          <Button
                            variant="outlined"
                            color="error"
                            onClick={() => openAction('cancel', request)}
                          >
                            Anulează
                          </Button>
                        )}
                      </Stack>
                    )}

                    <Stack spacing={1}>
                      <TextField
                        label="Notițe interne"
                        multiline
                        minRows={2}
                        value={notes[request.id] ?? ''}
                        onChange={(event) =>
                          setNotes((current) => ({ ...current, [request.id]: event.target.value }))
                        }
                        helperText="Vizibile doar în panou. Nu nota informații clinice sensibile."
                      />
                      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => void saveNotes(request)}
                          loading={savingId === request.id}
                        >
                          Salvează notițele
                        </Button>
                        {savedId === request.id && (
                          <Typography variant="caption" color="success.main">
                            Notițele au fost salvate.
                          </Typography>
                        )}
                      </Stack>
                    </Stack>
                  </Stack>
                </Paper>
              )
            })}
          </Stack>
        )}

        {!loading && totalPages > 1 && (
          <Stack sx={{ alignItems: 'center', pt: 1 }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_event, next) => setPage(next)}
              color="primary"
              getItemAriaLabel={paginationAriaLabel}
            />
          </Stack>
        )}
      </Stack>

      <Dialog
        open={action !== null}
        onClose={() => {
          if (!acting) setAction(null)
        }}
        maxWidth="xs"
        fullWidth
        aria-labelledby="dialog-actiune-programare"
        aria-describedby="dialog-actiune-programare-text"
      >
        <DialogTitle id="dialog-actiune-programare">{actionText?.title}</DialogTitle>
        <DialogContent dividers>
          <Typography id="dialog-actiune-programare-text" variant="body2" sx={{ mb: 2 }}>
            <strong>{action?.request.fullName}</strong>
            {action?.request.startAt ? `, ${formatSlot(action.request.startAt, action.request.endAt)}` : ''}.{' '}
            {action?.kind === 'confirm'
              ? 'Clientul primește pe email confirmarea, cu invitația de calendar.'
              : 'Clientul este anunțat pe email.'}
          </Typography>
          {action !== null && action.kind !== 'confirm' && (
            <TextField
              label="Mesaj pentru client (opțional)"
              multiline
              minRows={3}
              fullWidth
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              helperText="Apare în emailul trimis clientului."
            />
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setAction(null)} color="inherit" disabled={acting}>
            Renunță
          </Button>
          <Button
            onClick={() => void runAction()}
            color={action?.kind === 'confirm' ? 'primary' : 'error'}
            variant="contained"
            loading={acting}
          >
            {actionText?.button}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        maxWidth="xs"
        fullWidth
        aria-labelledby="dialog-stergere-cerere"
      >
        <DialogTitle id="dialog-stergere-cerere">Ștergi cererea de programare?</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Cererea de la <strong>{deleteTarget?.fullName}</strong> va fi eliminată din panou.
          </Typography>
          <Alert severity="warning">{GDPR_WARNING}</Alert>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setDeleteTarget(null)} color="inherit">
            Renunță
          </Button>
          <Button onClick={confirmDelete} color="error" variant="contained" loading={deleting}>
            Șterge
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}

// ---------------------------------------------------- Mesaje de contact ---

function ContactMessagesPanel() {
  const [items, setItems] = useState<ContactMessageDto[]>([])
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState<HandledFilter>('all')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)

  const [savingId, setSavingId] = useState<number | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ContactMessageDto | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    getContactMessages({ page, pageSize: PAGE_SIZE, isHandled: handledParam(filter) })
      .then((result) => {
        if (cancelled) return
        setItems(result.items)
        setTotalPages(Math.max(result.totalPages, 1))
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
  }, [page, filter, reloadToken])

  const reload = () => setReloadToken((token) => token + 1)

  const changeFilter = (next: HandledFilter) => {
    setFilter(next)
    setPage(1)
  }

  const toggleHandled = async (message: ContactMessageDto, isHandled: boolean) => {
    setActionError(null)
    setSavingId(message.id)
    try {
      await markContactMessageHandled(message.id, isHandled)
      reload()
    } catch (err) {
      setActionError(getErrorMessage(err))
    } finally {
      setSavingId(null)
    }
  }

  const confirmDelete = async () => {
    if (deleteTarget === null) return

    setDeleting(true)
    setActionError(null)
    try {
      await deleteContactMessage(deleteTarget.id)
      setDeleteTarget(null)
      reload()
    } catch (err) {
      setActionError(getErrorMessage(err))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Stack spacing={2.5}>
      <FilterToggle value={filter} onChange={changeFilter} label="Filtrează mesajele după stare" />

      {error !== null && <Alert severity="error">{error}</Alert>}
      {actionError !== null && (
        <Alert severity="error" onClose={() => setActionError(null)}>
          {actionError}
        </Alert>
      )}

      {loading ? (
        <ListSkeleton />
      ) : items.length === 0 ? (
        <Paper variant="outlined" sx={{ p: { xs: 3, sm: 5 }, textAlign: 'center' }}>
          <Typography color="text.secondary">
            {filter === 'pending'
              ? 'Nu există mesaje netratate.'
              : filter === 'handled'
                ? 'Nu există încă mesaje marcate ca tratate.'
                : 'Nu a fost primit niciun mesaj prin formularul de contact.'}
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={2}>
          {items.map((message) => (
            <Paper key={message.id} variant="outlined" sx={{ p: { xs: 2, sm: 2.5 } }}>
              <Stack spacing={2}>
                <Stack
                  direction={{ xs: 'column', md: 'row' }}
                  spacing={1.5}
                  sx={{ justifyContent: 'space-between', alignItems: { md: 'center' } }}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Typography component="h3" sx={{ fontWeight: 600 }}>
                      {message.subject}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {message.fullName} · {formatDateTimeRo(message.createdAt)}
                    </Typography>
                  </Box>

                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexShrink: 0 }}>
                    <Chip
                      size="small"
                      variant={message.isHandled ? 'filled' : 'outlined'}
                      color={message.isHandled ? 'success' : 'warning'}
                      label={message.isHandled ? 'Tratat' : 'Netratat'}
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={message.isHandled}
                          disabled={savingId === message.id}
                          onChange={(event) => void toggleHandled(message, event.target.checked)}
                          slotProps={{
                            input: { 'aria-label': `Mesaj tratat: ${message.subject}` },
                          }}
                        />
                      }
                      label="Tratat"
                    />
                    <Tooltip title="Șterge mesajul">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => setDeleteTarget(message)}
                        aria-label={`Șterge mesajul „${message.subject}”`}
                      >
                        <DeleteOutlineOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Stack>

                <Divider />

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <DetailField label="E-mail">
                      <Link href={`mailto:${message.email}`} sx={{ wordBreak: 'break-all' }}>
                        {message.email}
                      </Link>
                    </DetailField>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <DetailField label="Telefon">
                      {message.phone === null || message.phone === '' ? (
                        <Typography variant="body2" color="text.secondary" component="span">
                          Neprecizat
                        </Typography>
                      ) : (
                        <Link href={`tel:${message.phone}`}>{message.phone}</Link>
                      )}
                    </DetailField>
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <DetailField label="Mesaj">
                      <Box component="span" sx={{ whiteSpace: 'pre-line' }}>
                        {message.message}
                      </Box>
                    </DetailField>
                  </Grid>
                </Grid>
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}

      {!loading && totalPages > 1 && (
        <Stack sx={{ alignItems: 'center', pt: 1 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_event, next) => setPage(next)}
            color="primary"
            getItemAriaLabel={paginationAriaLabel}
          />
        </Stack>
      )}

      <Dialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        maxWidth="xs"
        fullWidth
        aria-labelledby="dialog-stergere-mesaj"
      >
        <DialogTitle id="dialog-stergere-mesaj">Ștergi mesajul?</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Mesajul „{deleteTarget?.subject}” de la <strong>{deleteTarget?.fullName}</strong> va fi
            eliminat din panou.
          </Typography>
          <Alert severity="warning">{GDPR_WARNING}</Alert>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setDeleteTarget(null)} color="inherit">
            Renunță
          </Button>
          <Button onClick={confirmDelete} color="error" variant="contained" loading={deleting}>
            Șterge
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}

// --------------------------------------------------------------- Pagina ---

export default function AppointmentsPage() {
  const [tab, setTab] = useState(0)

  return (
    <CrudPageShell
      title="Programări și mesaje"
      description="Cererile de programare și mesajele de contact primite prin site. Fiecare intrare conține date personale: folosește-le doar pentru a răspunde solicitării și șterge-le când nu mai sunt necesare."
      loading={false}
    >
      <Box>
        <Tabs
          value={tab}
          onChange={(_event, next: number) => setTab(next)}
          aria-label="Tipul de solicitări"
          sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
        >
          <Tab label="Cereri de programare" id="tab-cereri" aria-controls="panou-cereri" />
          <Tab label="Mesaje de contact" id="tab-mesaje" aria-controls="panou-mesaje" />
        </Tabs>

        {tab === 0 ? (
          <Box role="tabpanel" id="panou-cereri" aria-labelledby="tab-cereri">
            <AppointmentsPanel />
          </Box>
        ) : (
          <Box role="tabpanel" id="panou-mesaje" aria-labelledby="tab-mesaje">
            <ContactMessagesPanel />
          </Box>
        )}
      </Box>
    </CrudPageShell>
  )
}
