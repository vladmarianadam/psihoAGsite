import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import axios from 'axios'
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
  Link as MuiLink,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import SendOutlinedIcon from '@mui/icons-material/SendOutlined'

import { createBooking } from '../../api/booking'
import { getErrorMessage, getFieldErrors } from '../../api/client'
import type { BookingSlotDto } from '../../api/types'
import type { BookingMode } from './ServicePicker'

/** Aceleași reguli și mesaje ca în AppointmentForm (= validatorul de pe server). */
const phonePattern = /^[0-9+()\-\s]+$/

const detailsSchema = z.object({
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
  message: z.string().trim().max(2000, 'Mesajul poate avea maxim 2000 de caractere.'),
  gdprConsent: z
    .boolean()
    .pipe(z.literal(true, 'Este necesar consimțământul pentru prelucrarea datelor personale.')),
  honeypot: z.string(),
})

type DetailsFormValues = z.input<typeof detailsSchema>
type DetailsFormPayload = z.output<typeof detailsSchema>

const serverFieldNames = ['fullName', 'email', 'phone', 'message', 'gdprConsent'] as const

interface DetailsFormProps {
  serviceId: number
  mode: BookingMode
  slot: BookingSlotDto
  onSuccess: () => void
  /** 409: slotul tocmai a fost ocupat (sau limita de cereri a fost atinsă). */
  onConflict: (message: string) => void
}

export default function DetailsForm({ serviceId, mode, slot, onSuccess, onConflict }: DetailsFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<DetailsFormValues, unknown, DetailsFormPayload>({
    resolver: zodResolver(detailsSchema),
    defaultValues: { fullName: '', email: '', phone: '', message: '', gdprConsent: false, honeypot: '' },
  })

  const onSubmit = async (values: DetailsFormPayload) => {
    setSubmitError(null)

    try {
      // Capcana completată primește 200 { id: 0 } — o tratăm la fel, fără să dăm de bănuit.
      await createBooking({
        serviceId,
        startAt: slot.startAt,
        mode,
        fullName: values.fullName,
        email: values.email,
        phone: values.phone,
        message: values.message || null,
        gdprConsent: values.gdprConsent,
        honeypot: values.honeypot,
      })
      onSuccess()
    } catch (error) {
      const status = axios.isAxiosError(error) ? error.response?.status : undefined

      if (status === 409) {
        onConflict(getErrorMessage(error, 'Ora aleasă tocmai a fost ocupată. Te rugăm să alegi alta.'))
        return
      }

      setSubmitError(
        status === 429
          ? 'Ai trimis deja mai multe cereri în ultima oră. Te rugăm să reîncerci mai târziu sau să ne suni.'
          : getErrorMessage(error),
      )

      const fieldErrors = getFieldErrors(error)
      for (const name of serverFieldNames) {
        const message = fieldErrors[name]
        if (message) setError(name, { type: 'server', message })
      }
    }
  }

  return (
    <Box component="form" noValidate onSubmit={handleSubmit(onSubmit)}>
      <Stack spacing={2.5}>
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
          helperText={errors.email?.message ?? 'Aici primești confirmarea programării.'}
          {...register('email')}
        />

        <TextField
          label="Telefon"
          type="tel"
          required
          autoComplete="tel"
          error={Boolean(errors.phone)}
          helperText={errors.phone?.message}
          {...register('phone')}
        />

        <TextField
          label="Mesaj"
          multiline
          minRows={3}
          placeholder="Câteva rânduri despre ce te aduce aici, dacă simți nevoia."
          error={Boolean(errors.message)}
          helperText={errors.message?.message ?? 'Opțional. Tot ce scrii aici rămâne confidențial.'}
          {...register('message')}
        />

        {/* Capcană anti-spam, identică cu cea din AppointmentForm (plan §8). */}
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
            startIcon={isSubmitting ? <CircularProgress size={18} color="inherit" /> : <SendOutlinedIcon />}
          >
            {isSubmitting ? 'Se trimite…' : 'Trimite cererea'}
          </Button>
        </Box>
      </Stack>
    </Box>
  )
}
