import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link as RouterLink } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  Link as MuiLink,
  MenuItem,
  Paper,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import SendOutlinedIcon from '@mui/icons-material/SendOutlined'

import { createAppointmentRequest } from '../../api/appointments'
import { getServices } from '../../api/services'
import { getErrorMessage, getFieldErrors } from '../../api/client'
import { sessionModeLabels, type ServiceListItemDto, type SessionMode } from '../../api/types'

/** Cifre, spații, plus, paranteze și cratime — exact regexul din validatorul de pe server. */
const phonePattern = /^[0-9+()\-\s]+$/

const appointmentSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Numele trebuie să aibă cel puțin 2 caractere.')
    .max(150, 'Numele poate avea maxim 150 de caractere.'),
  email: z
    .string()
    .trim()
    .min(1, 'Adresa de email este obligatorie.')
    .max(200, 'Adresa de email poate avea maxim 200 de caractere.')
    .pipe(z.email('Adresa de email nu este validă.')),
  phone: z
    .string()
    .trim()
    .min(7, 'Numărul de telefon trebuie să aibă cel puțin 7 caractere.')
    .max(40, 'Numărul de telefon poate avea maxim 40 de caractere.')
    .regex(phonePattern, 'Numărul de telefon poate conține doar cifre, spații și caracterele + ( ) -.'),
  serviceId: z.number().int().positive().nullable(),
  preferredMode: z.enum(['Cabinet', 'Online', 'Both']),
  preferredTimeframe: z.string().trim().max(200, 'Intervalul preferat poate avea maxim 200 de caractere.'),
  message: z.string().trim().max(2000, 'Mesajul poate avea maxim 2000 de caractere.'),
  // `literal(true)` respinge caseta nebifată; `boolean()` în față păstrează tipul de formular.
  gdprConsent: z
    .boolean()
    .pipe(z.literal(true, 'Este necesar consimțământul pentru prelucrarea datelor personale.')),
  honeypot: z.string(),
})

type AppointmentFormValues = z.input<typeof appointmentSchema>
type AppointmentFormPayload = z.output<typeof appointmentSchema>

const sessionModeOptions: SessionMode[] = ['Cabinet', 'Online', 'Both']

/** Câmpurile pe care serverul le poate returna cu eroare de validare. */
const serverFieldNames = [
  'fullName',
  'email',
  'phone',
  'serviceId',
  'preferredMode',
  'preferredTimeframe',
  'message',
  'gdprConsent',
] as const

interface AppointmentFormProps {
  /** Serviciile, dacă pagina le-a încărcat deja; altfel formularul le cere singur. */
  services?: ServiceListItemDto[]
  defaultServiceId?: number | null
  /** Variantă fără card și cu spațieri mai strânse, pentru încorporare în alte secțiuni. */
  compact?: boolean
  onSuccess?: (id: number) => void
}

export default function AppointmentForm({
  services,
  defaultServiceId = null,
  compact = false,
  onSuccess,
}: AppointmentFormProps) {
  const [fetchedServices, setFetchedServices] = useState<ServiceListItemDto[]>([])
  // Pornim în „se încarcă” doar când chiar trebuie să cerem lista de la server.
  const [loadingServices, setLoadingServices] = useState(services === undefined)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<AppointmentFormValues, unknown, AppointmentFormPayload>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      serviceId: defaultServiceId ?? null,
      preferredMode: 'Cabinet',
      preferredTimeframe: '',
      message: '',
      gdprConsent: false,
      honeypot: '',
    },
  })

  // Serviciile vin ca prop de pe paginile care le au deja; altfel le cerem noi.
  useEffect(() => {
    if (services) return

    let cancelled = false

    getServices()
      .then((items) => {
        if (!cancelled) setFetchedServices(items)
      })
      .catch(() => {
        // Lista de servicii e opțională: fără ea rămâne varianta „Nu sunt sigur / altul”.
        if (!cancelled) setFetchedServices([])
      })
      .finally(() => {
        if (!cancelled) setLoadingServices(false)
      })

    return () => {
      cancelled = true
    }
  }, [services])

  // Preselecția venită din pagina unui serviciu.
  useEffect(() => {
    if (defaultServiceId != null) {
      setValue('serviceId', defaultServiceId)
    }
  }, [defaultServiceId, setValue])

  const serviceOptions = services ?? fetchedServices

  const onSubmit = async (values: AppointmentFormPayload) => {
    setSubmitError(null)

    try {
      const id = await createAppointmentRequest({
        fullName: values.fullName,
        email: values.email,
        phone: values.phone,
        serviceId: values.serviceId,
        preferredMode: values.preferredMode,
        preferredTimeframe: values.preferredTimeframe || null,
        message: values.message || null,
        gdprConsent: values.gdprConsent,
        honeypot: values.honeypot,
      })

      setSubmitted(true)
      onSuccess?.(id)
    } catch (error) {
      setSubmitError(getErrorMessage(error))

      const fieldErrors = getFieldErrors(error)
      for (const name of serverFieldNames) {
        const message = fieldErrors[name]
        if (message) {
          setError(name, { type: 'server', message })
        }
      }
    }
  }

  const handleRestart = () => {
    reset()
    setSubmitError(null)
    setSubmitted(false)
  }

  const content = submitted ? (
    <Stack spacing={2.5} alignItems="flex-start" role="status" aria-live="polite">
      <CheckCircleOutlineIcon sx={{ fontSize: 52, color: 'primary.main' }} />

      <Typography variant="h4" component="p" sx={{ color: 'text.primary' }}>
        Cererea a fost trimisă
      </Typography>

      <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: '54ch' }}>
        Îți mulțumim pentru încredere. Vei fi contactat pentru confirmarea zilei și a orei, de
        regulă în aceeași zi lucrătoare. Până atunci nu trebuie să faci nimic altceva.
      </Typography>

      <Button variant="outlined" onClick={handleRestart}>
        Trimite o altă cerere
      </Button>
    </Stack>
  ) : (
    <Box component="form" noValidate onSubmit={handleSubmit(onSubmit)}>
      {!compact && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h3" component="h2" sx={{ color: 'text.primary' }}>
            Cere o programare
          </Typography>
          <Typography variant="body2" sx={{ mt: 1.25, color: 'text.secondary', maxWidth: '56ch' }}>
            Completează câmpurile de mai jos și revenim cu o propunere de zi și oră. Nu este nevoie
            să povestești totul acum — un rând despre ce te aduce aici este suficient.
          </Typography>
        </Box>
      )}

      <Stack spacing={compact ? 2 : 2.5}>
        {submitError && (
          <Alert severity="error" onClose={() => setSubmitError(null)}>
            {submitError}
          </Alert>
        )}

        <TextField
          label="Nume și prenume"
          required
          autoComplete="name"
          error={Boolean(errors.fullName)}
          helperText={errors.fullName?.message}
          {...register('fullName')}
        />

        <TextField
          label="Adresă de email"
          type="email"
          required
          autoComplete="email"
          error={Boolean(errors.email)}
          helperText={errors.email?.message}
          {...register('email')}
        />

        <TextField
          label="Telefon"
          type="tel"
          required
          autoComplete="tel"
          error={Boolean(errors.phone)}
          helperText={errors.phone?.message ?? 'Îl folosim doar pentru a confirma programarea.'}
          {...register('phone')}
        />

        <Controller
          name="serviceId"
          control={control}
          render={({ field }) => (
            <TextField
              select
              label="Serviciul dorit"
              disabled={loadingServices}
              value={field.value == null ? '' : String(field.value)}
              onChange={(event) => {
                const raw = event.target.value
                field.onChange(raw === '' ? null : Number(raw))
              }}
              onBlur={field.onBlur}
              inputRef={field.ref}
              error={Boolean(errors.serviceId)}
              helperText={
                errors.serviceId?.message ??
                (loadingServices ? 'Se încarcă serviciile…' : 'Poți alege și mai târziu, împreună.')
              }
            >
              <MenuItem value="">Nu sunt sigur / altul</MenuItem>
              {serviceOptions.map((service) => (
                <MenuItem key={service.id} value={String(service.id)}>
                  {service.name}
                </MenuItem>
              ))}
            </TextField>
          )}
        />

        <Controller
          name="preferredMode"
          control={control}
          render={({ field }) => (
            <FormControl error={Boolean(errors.preferredMode)}>
              <FormLabel sx={{ mb: 1, fontSize: '0.9375rem', fontWeight: 600, color: 'text.primary' }}>
                Cum preferi să aibă loc ședința?
              </FormLabel>

              <ToggleButtonGroup
                exclusive
                color="primary"
                aria-label="Modul preferat de desfășurare a ședinței"
                value={field.value}
                onChange={(_event, value: SessionMode | null) => {
                  if (value) field.onChange(value)
                }}
                sx={{ flexWrap: 'wrap', gap: 1, '& .MuiToggleButton-root': { borderRadius: 999, px: 2.25 } }}
              >
                {sessionModeOptions.map((mode) => (
                  <ToggleButton key={mode} value={mode} sx={{ textTransform: 'none' }}>
                    {sessionModeLabels[mode]}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>

              {errors.preferredMode?.message && (
                <FormHelperText>{errors.preferredMode.message}</FormHelperText>
              )}
            </FormControl>
          )}
        />

        <TextField
          label="Interval preferat"
          placeholder="ex. dimineața, în timpul săptămânii"
          error={Boolean(errors.preferredTimeframe)}
          helperText={errors.preferredTimeframe?.message ?? 'Opțional — ne ajută să găsim mai repede o oră potrivită.'}
          {...register('preferredTimeframe')}
        />

        <TextField
          label="Mesaj"
          multiline
          minRows={4}
          placeholder="Câteva rânduri despre ce te aduce aici, dacă simți nevoia."
          error={Boolean(errors.message)}
          helperText={errors.message?.message ?? 'Opțional. Tot ce scrii aici rămâne confidențial.'}
          {...register('message')}
        />

        {/* Capcană anti-spam: în afara ecranului, scoasă din ordinea de tabulare și din
            arborele de accesibilitate. Utilizatorii reali o lasă mereu goală (plan §8). */}
        <Box
          component="input"
          type="text"
          tabIndex={-1}
          aria-hidden="true"
          autoComplete="off"
          sx={{
            position: 'absolute',
            left: '-9999px',
            width: '1px',
            height: '1px',
            opacity: 0,
            border: 0,
            padding: 0,
          }}
          {...register('honeypot')}
        />

        <Controller
          name="gdprConsent"
          control={control}
          render={({ field }) => (
            <FormControl error={Boolean(errors.gdprConsent)} required>
              <FormControlLabel
                sx={{ alignItems: 'flex-start', m: 0, '& .MuiCheckbox-root': { pt: 0.25 } }}
                control={
                  <Checkbox
                    checked={Boolean(field.value)}
                    onChange={(event) => field.onChange(event.target.checked)}
                    onBlur={field.onBlur}
                    inputRef={field.ref}
                    name={field.name}
                  />
                }
                label={
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Sunt de acord cu prelucrarea datelor mele personale în scopul programării,
                    conform{' '}
                    <MuiLink component={RouterLink} to="/politica-de-confidentialitate">
                      politicii de confidențialitate
                    </MuiLink>
                    .
                  </Typography>
                }
              />

              {errors.gdprConsent?.message && (
                <FormHelperText sx={{ ml: 0 }}>{errors.gdprConsent.message}</FormHelperText>
              )}
            </FormControl>
          )}
        />

        <Box>
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={isSubmitting}
            startIcon={
              isSubmitting ? <CircularProgress size={18} color="inherit" /> : <SendOutlinedIcon />
            }
          >
            {isSubmitting ? 'Se trimite…' : 'Trimite cererea'}
          </Button>
        </Box>
      </Stack>
    </Box>
  )

  return (
    <Paper
      variant={compact ? 'elevation' : 'outlined'}
      elevation={0}
      sx={
        compact
          ? { p: 0, backgroundColor: 'transparent' }
          : { p: { xs: 2.5, md: 4 }, borderRadius: 3, backgroundColor: 'background.paper' }
      }
    >
      {content}
    </Paper>
  )
}
