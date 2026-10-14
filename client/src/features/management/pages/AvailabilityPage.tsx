import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
  Paper,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import AddOutlinedIcon from '@mui/icons-material/AddOutlined'
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined'

import CrudPageShell from '../components/CrudPageShell'
import { getErrorMessage } from '../../../api/client'
import {
  createAvailabilityException,
  deleteAvailabilityException,
  getAvailability,
  replaceAvailabilityRules,
  updateBookingSettings,
} from '../../../api/availability'
import type { AvailabilityExceptionDto, BookingSettingsDto } from '../../../api/types'
import { formatDateRo } from '../../../components/common/formatters'

/** Ordinea afișării: luni primul. `dayOfWeek` urmează System.DayOfWeek (0 = duminică). */
const DAYS = [
  { dayOfWeek: 1, label: 'Luni' },
  { dayOfWeek: 2, label: 'Marți' },
  { dayOfWeek: 3, label: 'Miercuri' },
  { dayOfWeek: 4, label: 'Joi' },
  { dayOfWeek: 5, label: 'Vineri' },
  { dayOfWeek: 6, label: 'Sâmbătă' },
  { dayOfWeek: 0, label: 'Duminică' },
]

type NumberKey = 'slotStepMinutes' | 'bufferMinutes' | 'minNoticeHours' | 'horizonDays' | 'maxPendingPerEmail'

/** Limitele sunt aceleași ca în validatorul de pe server. */
const NUMBER_FIELDS: { key: NumberKey; label: string; helper: string; min: number; max: number }[] = [
  { key: 'slotStepMinutes', label: 'Pas între ore (minute)', helper: 'La câte minute începe o oră nouă (ex. 30).', min: 5, max: 120 },
  { key: 'bufferMinutes', label: 'Pauză între ședințe (minute)', helper: 'Timp liber păstrat înainte și după fiecare ședință.', min: 0, max: 120 },
  { key: 'minNoticeHours', label: 'Preaviz minim (ore)', helper: 'Cu cât timp înainte se poate rezerva cel mai devreme.', min: 0, max: 720 },
  { key: 'horizonDays', label: 'Orizont de rezervare (zile)', helper: 'Cât de departe în viitor se poate rezerva.', min: 1, max: 365 },
  { key: 'maxPendingPerEmail', label: 'Cereri în așteptare per email', helper: 'Câte cereri neconfirmate poate avea un client.', min: 1, max: 10 },
]

interface Interval {
  start: string
  end: string
}

type Notice = { severity: 'success' | 'error'; text: string } | null

/** "HH:mm:ss" (TimeOnly) → "HH:mm" pentru `<input type="time">`. */
const toInputTime = (value: string | null) => (value ?? '').slice(0, 5)
/** "HH:mm" → "HH:mm:ss"; „HH:mm” se compară corect și ca text. */
const toApiTime = (value: string) => `${value}:00`

const emptyException = { date: '', isClosed: true, start: '', end: '', reason: '' }

function NoticeAlert({ notice, onClose }: { notice: Notice; onClose: () => void }) {
  if (notice === null) return null
  return (
    <Alert severity={notice.severity} onClose={onClose}>
      {notice.text}
    </Alert>
  )
}

function describeException(exception: AvailabilityExceptionDto): string {
  if (exception.isClosed) return 'Închis'
  return `${toInputTime(exception.startTime)}–${toInputTime(exception.endTime)}`
}

export default function AvailabilityPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [settings, setSettings] = useState<BookingSettingsDto | null>(null)
  const [savingSettings, setSavingSettings] = useState(false)
  const [settingsNotice, setSettingsNotice] = useState<Notice>(null)

  const [schedule, setSchedule] = useState<Record<number, Interval[]>>({})
  const [savingRules, setSavingRules] = useState(false)
  const [rulesNotice, setRulesNotice] = useState<Notice>(null)

  const [exceptions, setExceptions] = useState<AvailabilityExceptionDto[]>([])
  const [exceptionsNotice, setExceptionsNotice] = useState<Notice>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [draft, setDraft] = useState(emptyException)
  const [draftError, setDraftError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    let cancelled = false

    getAvailability()
      .then((data) => {
        if (cancelled) return
        setSettings(data.settings)
        setExceptions(data.exceptions)
        const grouped: Record<number, Interval[]> = {}
        for (const rule of [...data.rules].sort((a, b) => a.startTime.localeCompare(b.startTime))) {
          ;(grouped[rule.dayOfWeek] ??= []).push({
            start: toInputTime(rule.startTime),
            end: toInputTime(rule.endTime),
          })
        }
        setSchedule(grouped)
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

  // ------------------------------------------------------------ Setări ---

  const saveSettings = async () => {
    if (settings === null) return

    setSavingSettings(true)
    setSettingsNotice(null)
    try {
      await updateBookingSettings({
        isEnabled: settings.isEnabled,
        slotStepMinutes: settings.slotStepMinutes,
        bufferMinutes: settings.bufferMinutes,
        minNoticeHours: settings.minNoticeHours,
        horizonDays: settings.horizonDays,
        maxPendingPerEmail: settings.maxPendingPerEmail,
        useGoogleFreeBusy: settings.useGoogleFreeBusy,
      })
      setSettingsNotice({ severity: 'success', text: 'Setările au fost salvate.' })
    } catch (err) {
      setSettingsNotice({ severity: 'error', text: getErrorMessage(err) })
    } finally {
      setSavingSettings(false)
    }
  }

  // ------------------------------------------------- Program săptămânal ---

  const updateInterval = (dayOfWeek: number, index: number, patch: Partial<Interval>) =>
    setSchedule((current) => ({
      ...current,
      [dayOfWeek]: (current[dayOfWeek] ?? []).map((item, i) => (i === index ? { ...item, ...patch } : item)),
    }))

  const addInterval = (dayOfWeek: number) =>
    setSchedule((current) => ({
      ...current,
      [dayOfWeek]: [...(current[dayOfWeek] ?? []), { start: '10:00', end: '14:00' }],
    }))

  const removeInterval = (dayOfWeek: number, index: number) =>
    setSchedule((current) => ({
      ...current,
      [dayOfWeek]: (current[dayOfWeek] ?? []).filter((_item, i) => i !== index),
    }))

  const saveRules = async () => {
    setRulesNotice(null)

    const invalidDay = DAYS.find(({ dayOfWeek }) =>
      (schedule[dayOfWeek] ?? []).some((item) => item.start === '' || item.end === '' || item.start >= item.end),
    )
    if (invalidDay !== undefined) {
      setRulesNotice({
        severity: 'error',
        text: `${invalidDay.label}: fiecare interval are nevoie de o oră de început mai mică decât ora de sfârșit.`,
      })
      return
    }

    setSavingRules(true)
    try {
      await replaceAvailabilityRules(
        DAYS.flatMap(({ dayOfWeek }) =>
          (schedule[dayOfWeek] ?? []).map((item) => ({
            dayOfWeek,
            startTime: toApiTime(item.start),
            endTime: toApiTime(item.end),
          })),
        ),
      )
      setRulesNotice({ severity: 'success', text: 'Programul săptămânal a fost salvat.' })
    } catch (err) {
      setRulesNotice({ severity: 'error', text: getErrorMessage(err) })
    } finally {
      setSavingRules(false)
    }
  }

  // ---------------------------------------------------------- Excepții ---

  // Reîncărcăm doar excepțiile, ca să nu pierdem modificările nesalvate din celelalte carduri.
  const refreshExceptions = async () => setExceptions((await getAvailability()).exceptions)

  const openDialog = () => {
    setDraft(emptyException)
    setDraftError(null)
    setDialogOpen(true)
  }

  const createException = async () => {
    if (draft.date === '') {
      setDraftError('Alege data.')
      return
    }
    if (!draft.isClosed && (draft.start === '' || draft.end === '' || draft.start >= draft.end)) {
      setDraftError('Ora de început trebuie să fie mai mică decât ora de sfârșit.')
      return
    }

    setCreating(true)
    setDraftError(null)
    try {
      await createAvailabilityException({
        date: draft.date,
        isClosed: draft.isClosed,
        startTime: draft.isClosed ? null : toApiTime(draft.start),
        endTime: draft.isClosed ? null : toApiTime(draft.end),
        reason: draft.reason.trim() || null,
      })
      setDialogOpen(false)
      setExceptionsNotice({ severity: 'success', text: 'Excepția a fost adăugată.' })
      await refreshExceptions()
    } catch (err) {
      setDraftError(getErrorMessage(err))
    } finally {
      setCreating(false)
    }
  }

  const removeException = async (exception: AvailabilityExceptionDto) => {
    setDeletingId(exception.id)
    setExceptionsNotice(null)
    try {
      await deleteAvailabilityException(exception.id)
      setExceptionsNotice({ severity: 'success', text: 'Excepția a fost ștearsă.' })
      await refreshExceptions()
    } catch (err) {
      setExceptionsNotice({ severity: 'error', text: getErrorMessage(err) })
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <CrudPageShell
      title="Disponibilitate"
      description="Orele în care clienții pot cere o programare online. Cererile ajung în „Programări”, unde le confirmi sau le respingi."
      loading={loading}
      error={error}
    >
      {settings !== null && (
        <Stack spacing={3}>
          <Paper variant="outlined" sx={{ p: { xs: 2.5, sm: 3 } }}>
            <Stack spacing={2.5}>
              <Typography variant="h6" component="h2">
                Setări programări
              </Typography>

              <FormControlLabel
                control={
                  <Switch
                    checked={settings.isEnabled}
                    onChange={(event) => setSettings({ ...settings, isEnabled: event.target.checked })}
                  />
                }
                label="Programări online active"
              />

              <Grid container spacing={2}>
                {NUMBER_FIELDS.map((field) => (
                  <Grid key={field.key} size={{ xs: 12, sm: 6, md: 4 }}>
                    <TextField
                      label={field.label}
                      type="number"
                      fullWidth
                      value={settings[field.key]}
                      onChange={(event) => setSettings({ ...settings, [field.key]: Number(event.target.value) })}
                      helperText={`${field.helper} Între ${field.min} și ${field.max}.`}
                      slotProps={{ htmlInput: { min: field.min, max: field.max, step: 1 } }}
                    />
                  </Grid>
                ))}
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <TextField
                    label="Fus orar"
                    fullWidth
                    value={settings.timeZone}
                    slotProps={{ htmlInput: { readOnly: true } }}
                    helperText="Se configurează pe server."
                  />
                </Grid>
              </Grid>

              <Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.useGoogleFreeBusy}
                      disabled={!settings.googleCalendarConfigured}
                      onChange={(event) => setSettings({ ...settings, useGoogleFreeBusy: event.target.checked })}
                      slotProps={{ input: { 'aria-describedby': 'google-freebusy-ajutor' } }}
                    />
                  }
                  label="Exclude orele ocupate din Google Calendar"
                />
                <Typography id="google-freebusy-ajutor" variant="caption" color="text.secondary" component="p">
                  {settings.googleCalendarConfigured
                    ? 'Orele marcate ca ocupate în calendar nu mai apar clienților.'
                    : 'Google Calendar nu este configurat pe server, așa că opțiunea nu este disponibilă.'}
                </Typography>
              </Box>

              <NoticeAlert notice={settingsNotice} onClose={() => setSettingsNotice(null)} />

              <Box>
                <Button variant="contained" onClick={() => void saveSettings()} loading={savingSettings}>
                  Salvează setările
                </Button>
              </Box>
            </Stack>
          </Paper>

          <Paper variant="outlined" sx={{ p: { xs: 2.5, sm: 3 } }}>
            <Stack spacing={2.5}>
              <Box>
                <Typography variant="h6" component="h2">
                  Program săptămânal
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Una sau mai multe intervale pe zi. O zi fără intervale este închisă.
                </Typography>
              </Box>

              <Stack spacing={2} divider={<Divider flexItem />}>
                {DAYS.map(({ dayOfWeek, label }) => {
                  const intervals = schedule[dayOfWeek] ?? []

                  return (
                    <Stack
                      key={dayOfWeek}
                      direction={{ xs: 'column', md: 'row' }}
                      spacing={{ xs: 1, md: 2 }}
                      role="group"
                      aria-labelledby={`zi-${dayOfWeek}`}
                    >
                      <Typography id={`zi-${dayOfWeek}`} sx={{ fontWeight: 600, width: { md: 120 }, pt: { md: 1 } }}>
                        {label}
                      </Typography>

                      <Stack spacing={1.5} sx={{ flex: 1, minWidth: 0 }}>
                        {intervals.length === 0 && (
                          <Typography variant="body2" color="text.secondary" sx={{ pt: { md: 1 } }}>
                            Închis
                          </Typography>
                        )}
                        {intervals.map((item, index) => (
                          <Stack key={index} direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                            <TextField
                              label="De la"
                              type="time"
                              size="small"
                              value={item.start}
                              onChange={(event) => updateInterval(dayOfWeek, index, { start: event.target.value })}
                              slotProps={{
                                inputLabel: { shrink: true },
                                htmlInput: { step: 300, 'aria-label': `${label}, interval ${index + 1}, de la` },
                              }}
                              sx={{ flex: 1, maxWidth: 160 }}
                            />
                            <TextField
                              label="Până la"
                              type="time"
                              size="small"
                              value={item.end}
                              onChange={(event) => updateInterval(dayOfWeek, index, { end: event.target.value })}
                              slotProps={{
                                inputLabel: { shrink: true },
                                htmlInput: { step: 300, 'aria-label': `${label}, interval ${index + 1}, până la` },
                              }}
                              sx={{ flex: 1, maxWidth: 160 }}
                            />
                            <Tooltip title="Șterge intervalul">
                              <IconButton
                                color="error"
                                onClick={() => removeInterval(dayOfWeek, index)}
                                aria-label={`Șterge intervalul ${index + 1} de ${label.toLowerCase()}`}
                              >
                                <DeleteOutlineOutlinedIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        ))}
                        <Box>
                          <Button
                            size="small"
                            startIcon={<AddOutlinedIcon />}
                            onClick={() => addInterval(dayOfWeek)}
                            aria-label={`Adaugă interval ${label.toLowerCase()}`}
                          >
                            Adaugă interval
                          </Button>
                        </Box>
                      </Stack>
                    </Stack>
                  )
                })}
              </Stack>

              <NoticeAlert notice={rulesNotice} onClose={() => setRulesNotice(null)} />

              <Box>
                <Button variant="contained" onClick={() => void saveRules()} loading={savingRules}>
                  Salvează programul
                </Button>
              </Box>
            </Stack>
          </Paper>

          <Paper variant="outlined" sx={{ p: { xs: 2.5, sm: 3 } }}>
            <Stack spacing={2.5}>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1.5}
                sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' } }}
              >
                <Box>
                  <Typography variant="h6" component="h2">
                    Excepții
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Zile închise (concediu) sau zile cu alt program. O excepție deschisă înlocuiește programul
                    săptămânal în ziua respectivă.
                  </Typography>
                </Box>
                <Button
                  variant="outlined"
                  startIcon={<AddOutlinedIcon />}
                  onClick={openDialog}
                  sx={{ flexShrink: 0, alignSelf: { xs: 'flex-start', sm: 'center' } }}
                >
                  Adaugă excepție
                </Button>
              </Stack>

              <NoticeAlert notice={exceptionsNotice} onClose={() => setExceptionsNotice(null)} />

              {exceptions.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  Nu există excepții programate.
                </Typography>
              ) : (
                <Stack component="ul" spacing={1} sx={{ listStyle: 'none', p: 0, m: 0 }}>
                  {exceptions.map((exception) => {
                    // Data vine ca "yyyy-MM-dd"; o formatăm în UTC ca să nu alunece cu o zi.
                    const date = formatDateRo(exception.date, {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      timeZone: 'UTC',
                    })

                    return (
                      <Paper
                        key={exception.id}
                        component="li"
                        variant="outlined"
                        sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}
                      >
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography sx={{ fontWeight: 600 }}>{date}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {describeException(exception)}
                            {exception.reason ? ` · ${exception.reason}` : ''}
                          </Typography>
                        </Box>
                        <Tooltip title="Șterge excepția">
                          <IconButton
                            color="error"
                            onClick={() => void removeException(exception)}
                            disabled={deletingId === exception.id}
                            aria-label={`Șterge excepția din ${date}`}
                          >
                            <DeleteOutlineOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Paper>
                    )
                  })}
                </Stack>
              )}
            </Stack>
          </Paper>
        </Stack>
      )}

      <Dialog
        open={dialogOpen}
        onClose={() => {
          if (!creating) setDialogOpen(false)
        }}
        maxWidth="xs"
        fullWidth
        aria-labelledby="dialog-exceptie"
      >
        <DialogTitle id="dialog-exceptie">Adaugă excepție</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <TextField
              label="Data"
              type="date"
              required
              value={draft.date}
              onChange={(event) => setDraft({ ...draft, date: event.target.value })}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={draft.isClosed}
                  onChange={(event) => setDraft({ ...draft, isClosed: event.target.checked })}
                />
              }
              label="Închis toată ziua"
            />
            {!draft.isClosed && (
              <Stack direction="row" spacing={1.5}>
                <TextField
                  label="De la"
                  type="time"
                  required
                  fullWidth
                  value={draft.start}
                  onChange={(event) => setDraft({ ...draft, start: event.target.value })}
                  slotProps={{ inputLabel: { shrink: true }, htmlInput: { step: 300 } }}
                />
                <TextField
                  label="Până la"
                  type="time"
                  required
                  fullWidth
                  value={draft.end}
                  onChange={(event) => setDraft({ ...draft, end: event.target.value })}
                  slotProps={{ inputLabel: { shrink: true }, htmlInput: { step: 300 } }}
                />
              </Stack>
            )}
            <TextField
              label="Motiv (opțional)"
              value={draft.reason}
              onChange={(event) => setDraft({ ...draft, reason: event.target.value })}
              helperText="Vizibil doar în panou."
            />
            {draftError !== null && <Alert severity="error">{draftError}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setDialogOpen(false)} color="inherit" disabled={creating}>
            Renunță
          </Button>
          <Button onClick={() => void createException()} variant="contained" loading={creating}>
            Adaugă
          </Button>
        </DialogActions>
      </Dialog>
    </CrudPageShell>
  )
}
