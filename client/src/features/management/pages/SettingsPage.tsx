import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  LinearProgress,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'

import CrudPageShell from '../components/CrudPageShell'
import { getErrorMessage } from '../../../api/client'
import { changePassword } from '../../../api/auth'
import { formatDateTimeRo } from '../../../components/common/formatters'
import { useAuth } from '../hooks/useAuth'

/** Câte milisecunde rămâne pe ecran confirmarea, înainte de deconectare. */
const LOGOUT_DELAY_MS = 4000

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Introdu parola actuală.'),
    newPassword: z
      .string()
      .min(12, 'Parola nouă trebuie să aibă cel puțin 12 caractere.')
      .max(72, 'Parola nouă poate avea cel mult 72 de caractere.')
      .regex(/[a-z]/, 'Parola nouă trebuie să conțină cel puțin o literă mică.')
      .regex(/[A-Z]/, 'Parola nouă trebuie să conțină cel puțin o literă mare.')
      .regex(/\d/, 'Parola nouă trebuie să conțină cel puțin o cifră.')
      .regex(/[^A-Za-z0-9]/, 'Parola nouă trebuie să conțină cel puțin un caracter special.'),
    confirmPassword: z.string().min(1, 'Confirmă parola nouă.'),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: 'Cele două parole nu coincid.',
    path: ['confirmPassword'],
  })
  .refine((values) => values.newPassword !== values.currentPassword, {
    message: 'Parola nouă trebuie să fie diferită de cea actuală.',
    path: ['newPassword'],
  })

type PasswordFormValues = z.infer<typeof passwordSchema>

interface PasswordStrength {
  score: number
  label: string
  color: 'error' | 'warning' | 'info' | 'success'
}

/** Indicator informativ; regulile care blochează trimiterea sunt cele din schema zod. */
function evaluateStrength(value: string): PasswordStrength {
  if (value === '') return { score: 0, label: 'Introdu o parolă', color: 'error' }

  let score = 0
  if (value.length >= 12) score += 1
  if (value.length >= 16) score += 1
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score += 1
  if (/\d/.test(value)) score += 1
  if (/[^A-Za-z0-9]/.test(value)) score += 1

  if (score <= 2) return { score, label: 'Slabă', color: 'error' }
  if (score === 3) return { score, label: 'Acceptabilă', color: 'warning' }
  if (score === 4) return { score, label: 'Bună', color: 'info' }
  return { score, label: 'Puternică', color: 'success' }
}

interface AccountRowProps {
  label: string
  value: string
}

function AccountRow({ label, value }: AccountRowProps) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 600 }}>
        {value}
      </Typography>
    </Box>
  )
}

export default function SettingsPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [serverError, setServerError] = useState<string | null>(null)
  const [succeeded, setSucceeded] = useState(false)
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  })

  const newPassword = watch('newPassword')
  const strength = evaluateStrength(newPassword)

  // După schimbarea parolei, sesiunea curentă se închide și ea: reautentificare.
  useEffect(() => {
    if (!succeeded) return

    const timer = window.setTimeout(() => {
      void logout().finally(() => navigate('/management/login', { replace: true }))
    }, LOGOUT_DELAY_MS)

    return () => window.clearTimeout(timer)
  }, [succeeded, logout, navigate])

  const onSubmit = async (values: PasswordFormValues) => {
    setServerError(null)
    try {
      await changePassword(values.currentPassword, values.newPassword)
      reset({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setSucceeded(true)
    } catch (error) {
      setServerError(getErrorMessage(error, 'Nu am putut schimba parola. Verifică parola actuală.'))
    }
  }

  const lastLogin =
    user === null || user.lastLoginAt === null
      ? 'Nu există o autentificare anterioară înregistrată.'
      : formatDateTimeRo(user.lastLoginAt)

  return (
    <CrudPageShell
      title="Setări"
      description="Datele contului de administrare și schimbarea parolei."
      loading={user === null}
    >
      {user !== null && (
        <Stack spacing={3} sx={{ maxWidth: 720 }}>
          {user.mustChangePassword && (
            <Alert severity="warning">
              <AlertTitle>Schimbarea parolei este obligatorie</AlertTitle>
              Contul folosește încă parola temporară stabilită la instalare. Până când o înlocuiești
              cu una proprie, ea rămâne cunoscută în afara contului tău, așa că o schimbare imediată
              este necesară.
            </Alert>
          )}

          <Paper variant="outlined" sx={{ p: { xs: 2.5, sm: 3 } }}>
            <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
              Datele contului
            </Typography>
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <AccountRow label="Nume de utilizator" value={user.username} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <AccountRow label="Nume complet" value={user.fullName} />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <AccountRow label="Ultima autentificare" value={lastLogin} />
              </Grid>
            </Grid>
          </Paper>

          <Paper variant="outlined" sx={{ p: { xs: 2.5, sm: 3 } }}>
            <Typography variant="h6" component="h2">
              Schimbă parola
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Minimum 12 caractere, cu literă mică, literă mare, cifră și caracter special. O frază
              lungă și ușor de reținut este mai sigură decât o parolă scurtă și complicată.
            </Typography>

            <Divider sx={{ my: 2.5 }} />

            {succeeded ? (
              <Alert severity="success">
                <AlertTitle>Parola a fost schimbată</AlertTitle>
                Din motive de siguranță, toate celelalte sesiuni au fost deconectate. Te vom duce la
                pagina de autentificare, ca să intri din nou cu parola nouă.
              </Alert>
            ) : (
              <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
                <Stack spacing={2.5}>
                  {serverError !== null && <Alert severity="error">{serverError}</Alert>}

                  <TextField
                    {...register('currentPassword')}
                    label="Parola actuală"
                    type={showCurrent ? 'text' : 'password'}
                    autoComplete="current-password"
                    error={errors.currentPassword !== undefined}
                    helperText={errors.currentPassword?.message}
                    slotProps={{
                      input: {
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => setShowCurrent((visible) => !visible)}
                              aria-label={showCurrent ? 'Ascunde parola actuală' : 'Arată parola actuală'}
                              edge="end"
                              size="small"
                            >
                              {showCurrent ? (
                                <VisibilityOffOutlinedIcon fontSize="small" />
                              ) : (
                                <VisibilityOutlinedIcon fontSize="small" />
                              )}
                            </IconButton>
                          </InputAdornment>
                        ),
                      },
                    }}
                  />

                  <Box>
                    <TextField
                      {...register('newPassword')}
                      label="Parola nouă"
                      type={showNew ? 'text' : 'password'}
                      autoComplete="new-password"
                      error={errors.newPassword !== undefined}
                      helperText={errors.newPassword?.message}
                      slotProps={{
                        input: {
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                onClick={() => setShowNew((visible) => !visible)}
                                aria-label={showNew ? 'Ascunde parola nouă' : 'Arată parola nouă'}
                                edge="end"
                                size="small"
                              >
                                {showNew ? (
                                  <VisibilityOffOutlinedIcon fontSize="small" />
                                ) : (
                                  <VisibilityOutlinedIcon fontSize="small" />
                                )}
                              </IconButton>
                            </InputAdornment>
                          ),
                        },
                      }}
                    />

                    <Stack spacing={0.75} sx={{ mt: 1.5 }}>
                      <LinearProgress
                        variant="determinate"
                        value={(strength.score / 5) * 100}
                        color={strength.color}
                        aria-hidden
                        sx={{ height: 6, borderRadius: 3 }}
                      />
                      <Typography variant="caption" color="text.secondary" aria-live="polite">
                        Putere estimată: {strength.label}
                      </Typography>
                    </Stack>
                  </Box>

                  <TextField
                    {...register('confirmPassword')}
                    label="Confirmă parola nouă"
                    type={showNew ? 'text' : 'password'}
                    autoComplete="new-password"
                    error={errors.confirmPassword !== undefined}
                    helperText={errors.confirmPassword?.message}
                  />

                  <Box>
                    <Button type="submit" variant="contained" loading={isSubmitting}>
                      Schimbă parola
                    </Button>
                  </Box>

                  <Typography variant="caption" color="text.secondary">
                    După schimbare, sesiunile deschise pe alte dispozitive se închid, iar
                    autentificarea se face din nou cu parola nouă.
                  </Typography>
                </Stack>
              </Box>
            )}
          </Paper>
        </Stack>
      )}
    </CrudPageShell>
  )
}
